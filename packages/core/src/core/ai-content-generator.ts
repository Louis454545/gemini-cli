/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateText, streamText, generateObject, embedMany, type LanguageModel } from 'ai';
import { aiConfig } from '../config/ai-config.js';
import { providerRegistry } from '../providers/provider-registry.js';
import type { BaseProvider } from '../providers/base-provider.js';

export interface AIGenerateTextRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface AIGenerateTextResponse {
  text: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIGenerateObjectRequest<T> extends AIGenerateTextRequest {
  schema: any; // Zod schema
}

export interface AIGenerateObjectResponse<T> extends Omit<AIGenerateTextResponse, 'text'> {
  object: T;
}

export interface AIStreamTextRequest extends AIGenerateTextRequest {
  onToken?: (token: string) => void;
  onFinish?: (text: string) => void;
}

export interface AIEmbedRequest {
  values: string[];
}

export interface AIEmbedResponse {
  embeddings: number[][];
  usage?: {
    tokens: number;
  };
}

/**
 * AI Content Generator using Vercel AI SDK and provider system
 */
export class AIContentGenerator {
  private currentModel?: LanguageModel;
  private currentProvider?: BaseProvider;

  constructor() {
    this.initializeFromConfig();
  }

  /**
   * Initialize from saved configuration
   */
  async initializeFromConfig(): Promise<void> {
    const provider = await aiConfig.initializeAI();
    if (provider) {
      this.currentProvider = provider;
      const modelId = aiConfig.getCurrentModel();
      if (modelId) {
        this.currentModel = provider.createModel(modelId);
      }
    }
  }

  /**
   * Switch to a different provider and model
   */
  async switchProvider(providerId: string, modelId?: string): Promise<void> {
    const provider = providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider '${providerId}' is not configured. Please set up API key first.`);
    }

    this.currentProvider = provider;
    aiConfig.setCurrentProvider(providerId);

    if (modelId) {
      const models = await provider.getAvailableModels();
      if (!models.find(m => m.id === modelId)) {
        throw new Error(`Model '${modelId}' not available for provider '${providerId}'`);
      }
      aiConfig.setCurrentModel(modelId);
    } else {
      const defaultModel = provider.getDefaultModel();
      aiConfig.setCurrentModel(defaultModel);
      modelId = defaultModel;
    }

    this.currentModel = provider.createModel(modelId);
  }

  /**
   * Get the current model instance
   */
  private getCurrentModel(): LanguageModel {
    if (!this.currentModel) {
      throw new Error('No AI model configured. Please run setup first.');
    }
    return this.currentModel;
  }

  /**
   * Generate text using the current model
   */
  async generateText(request: AIGenerateTextRequest): Promise<AIGenerateTextResponse> {
    const model = this.getCurrentModel();

    const result = await generateText({
      model,
      prompt: request.prompt,
      system: request.system,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      stopSequences: request.stopSequences,
    });

    return {
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage && {
        promptTokens: result.usage.promptTokens || 0,
        completionTokens: result.usage.completionTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      },
    };
  }

  /**
   * Generate structured object using the current model
   */
  async generateObject<T>(request: AIGenerateObjectRequest<T>): Promise<AIGenerateObjectResponse<T>> {
    const model = this.getCurrentModel();

    const result = await generateObject({
      model,
      prompt: request.prompt,
      system: request.system,
      schema: request.schema,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    return {
      object: result.object,
      finishReason: result.finishReason,
      usage: result.usage && {
        promptTokens: result.usage.promptTokens || 0,
        completionTokens: result.usage.completionTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      },
    };
  }

  /**
   * Stream text generation using the current model
   */
  async *streamText(request: AIStreamTextRequest): AsyncGenerator<string, void, unknown> {
    const model = this.getCurrentModel();

    const result = streamText({
      model,
      prompt: request.prompt,
      system: request.system,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      stopSequences: request.stopSequences,
    });

    let fullText = '';
    for await (const delta of result.textStream) {
      fullText += delta;
      if (request.onToken) {
        request.onToken(delta);
      }
      yield delta;
    }

    if (request.onFinish) {
      request.onFinish(fullText);
    }
  }

  /**
   * Generate embeddings for text values
   */
  async generateEmbeddings(request: AIEmbedRequest): Promise<AIEmbedResponse> {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured. Please run setup first.');
    }

    // For now, return mock embeddings as the embedMany function requires a different model type
    // In the future, we can add dedicated embedding model support to the provider interface
    const mockEmbeddings = request.values.map(() => 
      Array.from({ length: 768 }, () => Math.random() - 0.5)
    );

    return {
      embeddings: mockEmbeddings,
      usage: {
        tokens: request.values.reduce((sum, value) => sum + Math.ceil(value.length / 4), 0),
      },
    };
  }

  /**
   * Get current provider information
   */
  getCurrentProviderInfo(): { provider?: string; model?: string } {
    return {
      provider: aiConfig.getCurrentProvider(),
      model: aiConfig.getCurrentModel(),
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<{ id: string; name: string; configured: boolean }> {
    return providerRegistry.getAvailableProviders().map(provider => ({
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured(),
    }));
  }

  /**
   * Get available models for current provider
   */
  async getAvailableModels(): Promise<Array<{ id: string; name: string; description?: string }>> {
    if (!this.currentProvider) {
      return [];
    }

    const models = await this.currentProvider.getAvailableModels();
    return models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
    }));
  }

  /**
   * Check if the generator is ready to use
   */
  isReady(): boolean {
    return !!this.currentModel && !!this.currentProvider?.isConfigured();
  }
}

// Global singleton instance
export const aiContentGenerator = new AIContentGenerator();