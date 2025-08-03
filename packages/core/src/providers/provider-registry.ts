/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseProvider, ModelInfo } from './base-provider.js';
import { GoogleProvider } from './google-provider.js';

export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();
  private currentProvider?: BaseProvider;

  constructor() {
    this.registerProvider(new GoogleProvider());
  }

  /**
   * Register a new provider
   */
  registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get list of all available providers
   */
  getAvailableProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): BaseProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Set the current active provider
   */
  setCurrentProvider(providerId: string): BaseProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    this.currentProvider = provider;
    return provider;
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): BaseProvider | undefined {
    return this.currentProvider;
  }

  /**
   * Get models for a specific provider
   */
  async getModelsForProvider(providerId: string): Promise<ModelInfo[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    return provider.getAvailableModels();
  }

  /**
   * Get models for the current provider
   */
  async getCurrentProviderModels(): Promise<ModelInfo[]> {
    if (!this.currentProvider) {
      throw new Error('No current provider set');
    }
    return this.currentProvider.getAvailableModels();
  }

  /**
   * Check if any provider is configured
   */
  hasConfiguredProvider(): boolean {
    return Array.from(this.providers.values()).some(provider => provider.isConfigured());
  }

  /**
   * Get the first configured provider
   */
  getFirstConfiguredProvider(): BaseProvider | undefined {
    return Array.from(this.providers.values()).find(provider => provider.isConfigured());
  }
}

// Global singleton instance
export const providerRegistry = new ProviderRegistry();