/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { BaseProvider, ProviderConfig, ModelInfo } from './base-provider.js';

export class GoogleProvider implements BaseProvider {
  readonly id = 'google';
  readonly name = 'Google Gemini';
  
  private config?: ProviderConfig;
  private initialized = false;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  isConfigured(): boolean {
    return this.initialized && !!this.config?.apiKey;
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental model with enhanced capabilities',
        inputModalities: ['text', 'image', 'audio', 'video'],
        outputModalities: ['text', 'audio'],
        contextWindow: 1000000,
        maxOutputTokens: 8192,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and versatile performance across a diverse variety of tasks',
        inputModalities: ['text', 'image', 'audio', 'video'],
        outputModalities: ['text'],
        contextWindow: 1000000,
        maxOutputTokens: 8192,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Complex reasoning tasks requiring more intelligence',
        inputModalities: ['text', 'image', 'audio', 'video'],
        outputModalities: ['text'],
        contextWindow: 2000000,
        maxOutputTokens: 8192,
      },
      {
        id: 'gemini-1.0-pro',
        name: 'Gemini 1.0 Pro',
        description: 'Natural language tasks, multi-turn text and code chat, and code generation',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 30720,
        maxOutputTokens: 2048,
      },
    ];
  }

  createModel(modelId: string): LanguageModel {
    if (!this.isConfigured()) {
      throw new Error('Google provider not configured. Please set API key first.');
    }

    return google(modelId, {
      apiKey: this.config!.apiKey,
      baseURL: this.config!.baseURL,
      headers: this.config!.additionalHeaders,
    });
  }

  validateApiKey(apiKey: string): boolean {
    // Google API keys typically start with 'AIza' and are 39 characters long
    return /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey);
  }

  getDefaultModel(): string {
    return 'gemini-1.5-flash';
  }
}