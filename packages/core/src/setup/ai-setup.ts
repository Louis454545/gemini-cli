/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { providerRegistry } from '../providers/provider-registry.js';
import { aiConfig } from '../config/ai-config.js';
import type { BaseProvider, ModelInfo } from '../providers/base-provider.js';

export interface SetupPrompt {
  type: 'select' | 'input' | 'confirm';
  message: string;
  choices?: string[];
  default?: string;
  validate?: (input: string) => boolean | string;
}

export interface SetupCallbacks {
  prompt: (prompt: SetupPrompt) => Promise<string>;
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

export class AISetup {
  constructor(private callbacks: SetupCallbacks) {}

  /**
   * Run the initial setup flow
   */
  async runInitialSetup(): Promise<void> {
    this.callbacks.info('Welcome to the AI-powered CLI setup!');
    this.callbacks.info('This will guide you through configuring your AI provider and model preferences.');

    // Check if already configured
    const configuredProviders = aiConfig.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      const shouldReconfigure = await this.callbacks.prompt({
        type: 'confirm',
        message: 'AI providers are already configured. Do you want to reconfigure?',
        default: 'no',
      });

      if (shouldReconfigure.toLowerCase() !== 'yes' && shouldReconfigure.toLowerCase() !== 'y') {
        this.callbacks.info('Setup cancelled. Using existing configuration.');
        return;
      }
    }

    await this.selectProvider();
  }

  /**
   * Select and configure a provider
   */
  async selectProvider(): Promise<void> {
    const providers = providerRegistry.getAvailableProviders();
    
    if (providers.length === 0) {
      this.callbacks.error('No AI providers available. Please check your installation.');
      return;
    }

    const providerChoices = providers.map(p => `${p.id} - ${p.name}`);
    
    const selectedProvider = await this.callbacks.prompt({
      type: 'select',
      message: 'Select an AI provider:',
      choices: providerChoices,
      default: providerChoices[0],
    });

    const providerId = selectedProvider.split(' - ')[0];
    const provider = providerRegistry.getProvider(providerId);
    
    if (!provider) {
      this.callbacks.error('Invalid provider selection.');
      return;
    }

    await this.configureProvider(provider);
    await this.selectModel(provider);
  }

  /**
   * Configure provider (set API key)
   */
  private async configureProvider(provider: BaseProvider): Promise<void> {
    this.callbacks.info(`\nConfiguring ${provider.name}...`);
    
    // Get API key instructions based on provider
    const instructions = this.getApiKeyInstructions(provider.id);
    if (instructions) {
      this.callbacks.info(instructions);
    }

    const apiKey = await this.callbacks.prompt({
      type: 'input',
      message: `Enter your ${provider.name} API key:`,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API key cannot be empty';
        }
        if (!provider.validateApiKey(input.trim())) {
          return `Invalid API key format for ${provider.name}`;
        }
        return true;
      },
    });

    try {
      aiConfig.setProviderApiKey(provider.id, apiKey.trim());
      aiConfig.setCurrentProvider(provider.id);
      this.callbacks.success(`✓ ${provider.name} configured successfully!`);
    } catch (error) {
      this.callbacks.error(`Failed to configure ${provider.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Select a model for the provider
   */
  private async selectModel(provider: BaseProvider): Promise<void> {
    this.callbacks.info('\nFetching available models...');
    
    try {
      const models = await provider.getAvailableModels();
      
      if (models.length === 0) {
        this.callbacks.error('No models available for this provider.');
        return;
      }

      const modelChoices = models.map(m => `${m.id} - ${m.name}${m.description ? ` (${m.description})` : ''}`);
      
      const selectedModel = await this.callbacks.prompt({
        type: 'select',
        message: 'Select a model:',
        choices: modelChoices,
        default: modelChoices.find(choice => choice.startsWith(provider.getDefaultModel())) || modelChoices[0],
      });

      const modelId = selectedModel.split(' - ')[0];
      aiConfig.setCurrentModel(modelId);
      
      this.callbacks.success(`✓ Model '${modelId}' selected!`);
      this.displaySetupSummary(provider, models.find(m => m.id === modelId)!);
      
    } catch (error) {
      this.callbacks.error(`Failed to fetch models: ${error}`);
      // Use default model as fallback
      const defaultModel = provider.getDefaultModel();
      aiConfig.setCurrentModel(defaultModel);
      this.callbacks.info(`Using default model: ${defaultModel}`);
    }
  }

  /**
   * Display setup summary
   */
  private displaySetupSummary(provider: BaseProvider, model: ModelInfo): void {
    this.callbacks.info('\n' + '='.repeat(50));
    this.callbacks.success('Setup completed successfully!');
    this.callbacks.info('');
    this.callbacks.info(`Provider: ${provider.name}`);
    this.callbacks.info(`Model: ${model.name}`);
    if (model.description) {
      this.callbacks.info(`Description: ${model.description}`);
    }
    if (model.contextWindow) {
      this.callbacks.info(`Context Window: ${model.contextWindow.toLocaleString()} tokens`);
    }
    this.callbacks.info('');
    this.callbacks.info('You can change these settings anytime using:');
    this.callbacks.info('  gemini config provider');
    this.callbacks.info('  gemini config model');
    this.callbacks.info('='.repeat(50));
  }

  /**
   * Get API key instructions for specific providers
   */
  private getApiKeyInstructions(providerId: string): string | undefined {
    switch (providerId) {
      case 'google':
        return `
To get your Google AI Studio API key:
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with "AIza")
`;
      default:
        return undefined;
    }
  }

  /**
   * Check if setup is required
   */
  static isSetupRequired(): boolean {
    return aiConfig.getConfiguredProviders().length === 0;
  }

  /**
   * Quick setup for automated scenarios
   */
  async quickSetup(providerId: string, apiKey: string, modelId?: string): Promise<void> {
    const provider = providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    if (!provider.validateApiKey(apiKey)) {
      throw new Error(`Invalid API key format for provider '${providerId}'`);
    }

    aiConfig.setProviderApiKey(providerId, apiKey);
    aiConfig.setCurrentProvider(providerId);

    if (modelId) {
      const models = await provider.getAvailableModels();
      if (!models.find(m => m.id === modelId)) {
        throw new Error(`Model '${modelId}' not available for provider '${providerId}'`);
      }
      aiConfig.setCurrentModel(modelId);
    } else {
      aiConfig.setCurrentModel(provider.getDefaultModel());
    }

    this.callbacks.success(`✓ Quick setup completed for ${provider.name}!`);
  }
}