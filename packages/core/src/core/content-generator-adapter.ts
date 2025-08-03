/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
} from '@google/genai';
import { aiContentGenerator } from './ai-content-generator.js';
import { UserTierId } from '../types/user-tier.js';

/**
 * Legacy ContentGenerator interface - kept for backward compatibility
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;

  userTier?: UserTierId;
}

/**
 * Adapter that wraps the new AIContentGenerator to work with the legacy ContentGenerator interface
 */
export class ContentGeneratorAdapter implements ContentGenerator {
  public userTier?: UserTierId;

  constructor(userTier?: UserTierId) {
    this.userTier = userTier;
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    // Convert from old format to new format
    const prompt = this.extractPrompt(request);
    const system = this.extractSystemPrompt(request);
    
    const response = await aiContentGenerator.generateText({
      prompt,
      system,
      temperature: request.generationConfig?.temperature,
      maxTokens: request.generationConfig?.maxOutputTokens,
      stopSequences: request.generationConfig?.stopSequences,
    });

    // Convert back to old format
    return {
      candidates: [{
        content: {
          parts: [{ text: response.text }],
          role: 'model',
        },
        finishReason: response.finishReason as any,
      }],
      usageMetadata: response.usage && {
        promptTokenCount: response.usage.promptTokens,
        candidatesTokenCount: response.usage.completionTokens,
        totalTokenCount: response.usage.totalTokens,
      },
    } as GenerateContentResponse;
  }

  async *generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const prompt = this.extractPrompt(request);
    const system = this.extractSystemPrompt(request);
    
    const stream = aiContentGenerator.streamText({
      prompt,
      system,
      temperature: request.generationConfig?.temperature,
      maxTokens: request.generationConfig?.maxOutputTokens,
      stopSequences: request.generationConfig?.stopSequences,
    });

    for await (const chunk of stream) {
      yield {
        candidates: [{
          content: {
            parts: [{ text: chunk }],
            role: 'model',
          },
          finishReason: 'STOP',
        }],
      } as GenerateContentResponse;
    }
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // For now, return a simple estimate
    const prompt = this.extractPrompt(request);
    const tokenCount = Math.ceil(prompt.length / 4); // Rough estimate: 1 token per 4 characters
    
    return {
      totalTokens: tokenCount,
    };
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    const values = request.content.parts
      .filter(part => part.text)
      .map(part => part.text!);
    
    const response = await aiContentGenerator.generateEmbeddings({ values });
    
    return {
      embedding: {
        values: response.embeddings[0] || [],
      },
    };
  }

  private extractPrompt(request: GenerateContentParameters | CountTokensParameters): string {
    if (!request.contents || request.contents.length === 0) {
      return '';
    }

    // Get the last user message
    const userContent = request.contents
      .filter(content => content.role === 'user')
      .pop();

    if (!userContent || !userContent.parts) {
      return '';
    }

    return userContent.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join(' ');
  }

  private extractSystemPrompt(request: GenerateContentParameters): string | undefined {
    if (!request.systemInstruction) {
      return undefined;
    }

    if (typeof request.systemInstruction === 'string') {
      return request.systemInstruction;
    }

    if (request.systemInstruction.parts) {
      return request.systemInstruction.parts
        .filter(part => part.text)
        .map(part => part.text)
        .join(' ');
    }

    return undefined;
  }
}