/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LanguageModel } from 'ai';

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  additionalHeaders?: Record<string, string>;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  inputModalities?: string[];
  outputModalities?: string[];
  contextWindow?: number;
  maxOutputTokens?: number;
}

export interface BaseProvider {
  readonly id: string;
  readonly name: string;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;
  
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
  
  /**
   * Get list of available models for this provider
   */
  getAvailableModels(): Promise<ModelInfo[]>;
  
  /**
   * Create a language model instance
   */
  createModel(modelId: string): LanguageModel;
  
  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean;
  
  /**
   * Get default model for this provider
   */
  getDefaultModel(): string;
}