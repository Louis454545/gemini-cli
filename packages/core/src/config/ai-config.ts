/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { providerRegistry } from '../providers/provider-registry.js';
import type { BaseProvider } from '../providers/base-provider.js';

interface AIConfigData {
  currentProvider?: string;
  currentModel?: string;
  providers: Record<string, {
    apiKey?: string;
    baseURL?: string;
    additionalHeaders?: Record<string, string>;
  }>;
  lastUpdated: string;
}

export class AIConfig {
  private configPath: string;
  private configData: AIConfigData;

  constructor(configDir?: string) {
    const baseDir = configDir || path.join(os.homedir(), '.gemini');
    this.configPath = path.join(baseDir, 'ai-config.json');
    this.configData = this.loadConfig();
  }

  private loadConfig(): AIConfigData {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load AI config, using defaults:', error);
    }

    return {
      providers: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.configData.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.configData, null, 2));
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw error;
    }
  }

  /**
   * Set the current provider
   */
  setCurrentProvider(providerId: string): void {
    const provider = providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    
    this.configData.currentProvider = providerId;
    providerRegistry.setCurrentProvider(providerId);
    this.saveConfig();
  }

  /**
   * Get the current provider ID
   */
  getCurrentProvider(): string | undefined {
    return this.configData.currentProvider;
  }

  /**
   * Set the current model for the active provider
   */
  setCurrentModel(modelId: string): void {
    if (!this.configData.currentProvider) {
      throw new Error('No provider selected. Please set a provider first.');
    }
    
    this.configData.currentModel = modelId;
    this.saveConfig();
  }

  /**
   * Get the current model ID
   */
  getCurrentModel(): string | undefined {
    return this.configData.currentModel;
  }

  /**
   * Set API key for a provider
   */
  setProviderApiKey(providerId: string, apiKey: string): void {
    const provider = providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    if (!provider.validateApiKey(apiKey)) {
      throw new Error(`Invalid API key format for provider '${providerId}'`);
    }

    if (!this.configData.providers[providerId]) {
      this.configData.providers[providerId] = {};
    }
    
    this.configData.providers[providerId].apiKey = apiKey;
    this.saveConfig();

    // Initialize the provider if it's the current one
    if (this.configData.currentProvider === providerId) {
      provider.initialize({
        apiKey,
        baseURL: this.configData.providers[providerId].baseURL,
        additionalHeaders: this.configData.providers[providerId].additionalHeaders,
      });
    }
  }

  /**
   * Get API key for a provider
   */
  getProviderApiKey(providerId: string): string | undefined {
    return this.configData.providers[providerId]?.apiKey;
  }

  /**
   * Remove API key for a provider
   */
  removeProviderApiKey(providerId: string): void {
    if (this.configData.providers[providerId]) {
      delete this.configData.providers[providerId].apiKey;
      this.saveConfig();
    }
  }

  /**
   * Set additional configuration for a provider
   */
  setProviderConfig(providerId: string, config: { baseURL?: string; additionalHeaders?: Record<string, string> }): void {
    if (!this.configData.providers[providerId]) {
      this.configData.providers[providerId] = {};
    }
    
    if (config.baseURL !== undefined) {
      this.configData.providers[providerId].baseURL = config.baseURL;
    }
    
    if (config.additionalHeaders !== undefined) {
      this.configData.providers[providerId].additionalHeaders = config.additionalHeaders;
    }
    
    this.saveConfig();
  }

  /**
   * Check if a provider is configured (has API key)
   */
  isProviderConfigured(providerId: string): boolean {
    return !!this.configData.providers[providerId]?.apiKey;
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): string[] {
    return Object.keys(this.configData.providers).filter(id => 
      this.configData.providers[id]?.apiKey
    );
  }

  /**
   * Initialize the AI system based on saved configuration
   */
  async initializeAI(): Promise<BaseProvider | undefined> {
    // Auto-select the first configured provider if none is set
    if (!this.configData.currentProvider) {
      const configuredProviders = this.getConfiguredProviders();
      if (configuredProviders.length > 0) {
        this.setCurrentProvider(configuredProviders[0]);
      }
    }

    // Initialize the current provider
    if (this.configData.currentProvider) {
      const provider = providerRegistry.getProvider(this.configData.currentProvider);
      const providerConfig = this.configData.providers[this.configData.currentProvider];
      
      if (provider && providerConfig?.apiKey) {
        await provider.initialize({
          apiKey: providerConfig.apiKey,
          baseURL: providerConfig.baseURL,
          additionalHeaders: providerConfig.additionalHeaders,
        });
        
        // Set default model if none is set
        if (!this.configData.currentModel) {
          this.setCurrentModel(provider.getDefaultModel());
        }
        
        return provider;
      }
    }

    return undefined;
  }

  /**
   * Get the effective current provider instance
   */
  getEffectiveProvider(): BaseProvider | undefined {
    const currentProvider = this.getCurrentProvider();
    if (!currentProvider) return undefined;
    
    const provider = providerRegistry.getProvider(currentProvider);
    return provider?.isConfigured() ? provider : undefined;
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.configData = {
      providers: {},
      lastUpdated: new Date().toISOString(),
    };
    this.saveConfig();
  }

  /**
   * Export configuration (without sensitive data like API keys)
   */
  exportConfig(): Omit<AIConfigData, 'providers'> & { providers: Record<string, Omit<AIConfigData['providers'][string], 'apiKey'>> } {
    return {
      currentProvider: this.configData.currentProvider,
      currentModel: this.configData.currentModel,
      lastUpdated: this.configData.lastUpdated,
      providers: Object.fromEntries(
        Object.entries(this.configData.providers).map(([id, config]) => [
          id, 
          {
            baseURL: config.baseURL,
            additionalHeaders: config.additionalHeaders,
          }
        ])
      ),
    };
  }
}

// Global singleton instance
export const aiConfig = new AIConfig();