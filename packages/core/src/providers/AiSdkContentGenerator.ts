import { generateText, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type {
  Content,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
  FunctionCall,
  FunctionDeclaration,
  Part,
  Tool,
} from '@google/genai';
import { ContentGenerator } from '../core/contentGenerator.js';

// Minimal token estimator to avoid hard dependency on provider-specific tokenizers
function estimateTokenCountFromContents(contents: Content[]): number {
  const text = JSON.stringify(contents);
  // heuristic: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function mapHistoryToAiSdkMessages(contents: Content[]): Array<{
  role: 'user' | 'assistant' | 'tool';
  content: Array<{ type: 'text'; text: string }>;
}> {
  const messages: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: Array<{ type: 'text'; text: string }>;
  }> = [];

  for (const entry of contents) {
    if (!entry || !entry.role || !entry.parts) continue;

    // Convert role
    const role = entry.role === 'model' ? 'assistant' : entry.role;

    // Only map textual parts for now
    const textParts: Array<{ type: 'text'; text: string }> = [];
    for (const part of entry.parts as Part[]) {
      if (typeof (part as any).text === 'string') {
        textParts.push({ type: 'text', text: (part as any).text as string });
      } else if ((part as any).functionResponse) {
        // Represent function responses as tool messages with JSON string
        const fr = (part as any).functionResponse;
        const toolText = JSON.stringify({
          toolName: fr.name,
          toolResult: fr.response,
        });
        messages.push({ role: 'tool', content: [{ type: 'text', text: toolText }] });
      }
    }

    if (textParts.length > 0) {
      messages.push({ role: role as 'user' | 'assistant', content: textParts });
    }
  }

  return messages;
}

function mapFunctionDeclarationsToAiTools(tools: Tool[] | undefined): Record<string, any> | undefined {
  if (!tools || tools.length === 0) return undefined;

  // Google GenAI Tool[] is an array of objects with { functionDeclarations: FunctionDeclaration[] }
  const toolMap: Record<string, any> = {};
  for (const t of tools) {
    const fns = (t as any).functionDeclarations as FunctionDeclaration[] | undefined;
    if (!fns) continue;
    for (const fn of fns) {
      if (!fn?.name) continue;
      // Map to AI SDK tool definition without execute to avoid auto-execution
      // We forward the JSON schema directly if available
      const inputSchema = (fn.parameters ?? {}) as Record<string, unknown>;
      toolMap[fn.name] = {
        description: fn.description,
        inputSchema,
      } as any;
    }
  }
  return Object.keys(toolMap).length > 0 ? toolMap : undefined;
}

function buildResponseChunkFromTextDelta(text: string): GenerateContentResponse {
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [{ text } as Part],
        } as Content,
      },
    ],
  } as GenerateContentResponse;
}

function buildResponseChunkFromToolCall(name: string, args: unknown): GenerateContentResponse {
  const fnCall: FunctionCall = {
    name,
    args: (typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : { input: args }) as Record<string, unknown>,
  } as FunctionCall;
  return {
    candidates: [],
    functionCalls: [fnCall],
  } as unknown as GenerateContentResponse;
}

export class AiSdkContentGenerator implements ContentGenerator {
  constructor(private readonly provider: 'google', private readonly apiKey?: string) {}

  private getModel(modelId: string): any {
    if (this.provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey: this.apiKey });
      return google(modelId);
    }
    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const model = this.getModel(request.model);

    // Prefer a single prompt string if latest content is a single user string; otherwise map to messages
    const messages = mapHistoryToAiSdkMessages((request.contents as Content[]) || []);

    const systemInstruction = (request.config as any)?.systemInstruction?.text as string | undefined;
    const aiTools = mapFunctionDeclarationsToAiTools((request.config as any)?.tools as Tool[] | undefined);

    const { text, reasoning, toolCalls, usage } = await generateText({
      model,
      system: systemInstruction,
      tools: aiTools,
      messages: messages.length > 0 ? (messages as any) : undefined,
      prompt: messages.length === 0 ? (typeof request.contents === 'string' ? (request.contents as string) : undefined) : undefined,
    } as any);

    const thoughtParts: Part[] = [];
    try {
      const reasoningText = (reasoning && (reasoning as any).text) || undefined;
      if (reasoningText) {
        thoughtParts.push({ thought: true, text: reasoningText } as any);
      }
    } catch {}

    // Build a single final response-shaped object
    const response: GenerateContentResponse = {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              ...thoughtParts,
              { text } as Part,
            ],
          } as Content,
        },
      ],
      ...(toolCalls && toolCalls.length
        ? {
            functionCalls: toolCalls.map((tc: any) => ({ name: tc.toolName, args: tc.args }) as unknown as FunctionCall),
          }
        : {}),
      usageMetadata: usage
        ? ({
            promptTokenCount: (usage as any).inputTokens ?? (usage as any).promptTokens,
            candidatesTokenCount: (usage as any).outputTokens ?? (usage as any).completionTokens,
            totalTokenCount:
              (usage as any).totalTokens ??
              (((usage as any).inputTokens || 0) + ((usage as any).outputTokens || 0)),
          } as any)
        : undefined,
    } as unknown as GenerateContentResponse;

    return response;
  }

  async generateContentStream(
    request: GenerateContentParameters,
    _userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const self = this;
    async function* run() {
      const model = self.getModel(request.model);
      const messages = mapHistoryToAiSdkMessages((request.contents as Content[]) || []);
      const systemInstruction = (request.config as any)?.systemInstruction?.text as string | undefined;
      const aiTools = mapFunctionDeclarationsToAiTools((request.config as any)?.tools as Tool[] | undefined);

      const result = streamText({
        model,
        system: systemInstruction,
        tools: aiTools,
        messages: messages.length > 0 ? (messages as any) : undefined,
        prompt: messages.length === 0 ? (typeof request.contents === 'string' ? (request.contents as string) : undefined) : undefined,
      } as any);

      // Emit text deltas and tool calls as GenerateContentResponse-shaped chunks
      for await (const part of result.fullStream as any) {
        switch (part.type) {
          case 'text-delta': {
            if (part.textDelta) {
              yield buildResponseChunkFromTextDelta(part.textDelta);
            }
            break;
          }
          case 'tool-call': {
            yield buildResponseChunkFromToolCall(part.toolName, part.args);
            break;
          }
          default:
            // ignore other event types for now
            break;
        }
      }

      // Emit a final empty STOP chunk to signal finish
      yield {
        candidates: [
          {
            content: { role: 'model', parts: [] } as Content,
            finishReason: 1 as any, // FinishReason.STOP
          },
        ],
      } as unknown as GenerateContentResponse;
    }

    return run();
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    const contents = (request.contents as Content[]) || [];
    const totalTokens = estimateTokenCountFromContents(contents);
    return { totalTokens } as CountTokensResponse;
  }

  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // Not implemented for now; return a dummy embedding to keep interface intact
    return {
      embeddings: [
        {
          values: [0.0],
        },
      ],
    } as unknown as EmbedContentResponse;
  }
}