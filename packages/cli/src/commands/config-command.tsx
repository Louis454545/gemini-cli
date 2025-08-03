/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Text, Box, Spacer } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { aiConfig } from '@google/gemini-cli-core/config/ai-config.js';
import { providerRegistry } from '@google/gemini-cli-core/providers/provider-registry.js';
import { aiContentGenerator } from '@google/gemini-cli-core/core/ai-content-generator.js';
import type { BaseProvider, ModelInfo } from '@google/gemini-cli-core/providers/base-provider.js';

interface ConfigCommandProps {
  subcommand?: 'provider' | 'model' | 'status' | 'reset';
  onExit: (code: number) => void;
}

type ConfigStep = 'menu' | 'provider' | 'model' | 'api-key' | 'status' | 'reset-confirm' | 'done';

export function ConfigCommand({ subcommand, onExit }: ConfigCommandProps) {
  const [step, setStep] = useState<ConfigStep>(() => {
    switch (subcommand) {
      case 'provider': return 'provider';
      case 'model': return 'model';
      case 'status': return 'status';
      case 'reset': return 'reset-confirm';
      default: return 'menu';
    }
  });
  
  const [selectedProvider, setSelectedProvider] = useState<BaseProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [providers, setProviders] = useState<BaseProvider[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    setProviders(providerRegistry.getAvailableProviders());
  }, []);

  const handleMenuSelect = (item: any) => {
    switch (item.value) {
      case 'provider':
        setStep('provider');
        break;
      case 'model':
        setStep('model');
        break;
      case 'status':
        setStep('status');
        break;
      case 'reset':
        setStep('reset-confirm');
        break;
      case 'exit':
        onExit(0);
        break;
    }
  };

  const handleProviderSelect = async (item: any) => {
    const providerId = item.value;
    const provider = providerRegistry.getProvider(providerId);
    
    if (!provider) {
      setErrorMessage(`Provider '${providerId}' not found`);
      return;
    }

    setSelectedProvider(provider);

    if (provider.isConfigured()) {
      // Provider is already configured, switch to it
      try {
        await aiContentGenerator.switchProvider(providerId);
        setStep('model');
      } catch (error) {
        setErrorMessage(`Failed to switch provider: ${error}`);
      }
    } else {
      // Need to configure the provider first
      setStep('api-key');
    }
  };

  const handleApiKeySubmit = async () => {
    if (!selectedProvider || !apiKeyInput.trim()) {
      setErrorMessage('API key cannot be empty');
      return;
    }

    try {
      aiConfig.setProviderApiKey(selectedProvider.id, apiKeyInput.trim());
      await aiContentGenerator.switchProvider(selectedProvider.id);
      setApiKeyInput('');
      setStep('model');
    } catch (error) {
      setErrorMessage(`Failed to configure provider: ${error}`);
    }
  };

  const handleModelSelect = async (item: any) => {
    const modelId = item.value;
    
    try {
      aiConfig.setCurrentModel(modelId);
      await aiContentGenerator.initializeFromConfig();
      setStep('done');
      
      setTimeout(() => onExit(0), 2000);
    } catch (error) {
      setErrorMessage(`Failed to select model: ${error}`);
    }
  };

  const handleResetConfirm = (item: any) => {
    if (item.value === 'yes') {
      aiConfig.reset();
      setStep('done');
      setTimeout(() => onExit(0), 2000);
    } else {
      setStep('menu');
    }
  };

  useEffect(() => {
    if (step === 'model' && selectedProvider) {
      selectedProvider.getAvailableModels()
        .then(setModels)
        .catch(error => setErrorMessage(`Failed to fetch models: ${error}`));
    }
  }, [step, selectedProvider]);

  const renderMenu = () => {
    const menuItems = [
      { label: 'Switch Provider', value: 'provider' },
      { label: 'Switch Model', value: 'model' },
      { label: 'Show Status', value: 'status' },
      { label: 'Reset Configuration', value: 'reset' },
      { label: 'Exit', value: 'exit' },
    ];

    return (
      <Box flexDirection="column">
        <Text bold>AI Configuration</Text>
        <Text>Select an option:</Text>
        <Spacer />
        <SelectInput items={menuItems} onSelect={handleMenuSelect} />
      </Box>
    );
  };

  const renderProviderSelection = () => {
    const providerItems = providers.map(provider => ({
      label: `${provider.name} ${provider.isConfigured() ? '(configured)' : '(needs setup)'}`,
      value: provider.id,
    }));

    return (
      <Box flexDirection="column">
        <Text bold>Select AI Provider</Text>
        <Spacer />
        <SelectInput items={providerItems} onSelect={handleProviderSelect} />
      </Box>
    );
  };

  const renderApiKeyInput = () => {
    if (!selectedProvider) return null;

    return (
      <Box flexDirection="column">
        <Text bold>Configure {selectedProvider.name}</Text>
        <Text>
          Please enter your API key for {selectedProvider.name}:
        </Text>
        {selectedProvider.id === 'google' && (
          <Box flexDirection="column" marginY={1}>
            <Text color="gray">To get your Google AI Studio API key:</Text>
            <Text color="gray">1. Visit https://aistudio.google.com/app/apikey</Text>
            <Text color="gray">2. Sign in with your Google account</Text>
            <Text color="gray">3. Click "Create API Key"</Text>
            <Text color="gray">4. Copy the generated key (starts with "AIza")</Text>
          </Box>
        )}
        <Box>
          <Text>API Key: </Text>
          <TextInput
            value={apiKeyInput}
            onChange={setApiKeyInput}
            onSubmit={handleApiKeySubmit}
            placeholder="Enter your API key..."
          />
        </Box>
        {errorMessage && (
          <Text color="red">Error: {errorMessage}</Text>
        )}
      </Box>
    );
  };

  const renderModelSelection = () => {
    if (models.length === 0) {
      return (
        <Box flexDirection="column">
          <Text>Loading available models...</Text>
        </Box>
      );
    }

    const modelItems = models.map(model => ({
      label: `${model.name}${model.description ? ` - ${model.description}` : ''}`,
      value: model.id,
    }));

    return (
      <Box flexDirection="column">
        <Text bold>Select Model</Text>
        <Spacer />
        <SelectInput items={modelItems} onSelect={handleModelSelect} />
      </Box>
    );
  };

  const renderStatus = () => {
    const currentProvider = aiConfig.getCurrentProvider();
    const currentModel = aiConfig.getCurrentModel();
    const configuredProviders = aiConfig.getConfiguredProviders();

    return (
      <Box flexDirection="column">
        <Text bold>AI Configuration Status</Text>
        <Spacer />
        <Text>Current Provider: {currentProvider || 'None'}</Text>
        <Text>Current Model: {currentModel || 'None'}</Text>
        <Text>Configured Providers: {configuredProviders.join(', ') || 'None'}</Text>
        <Spacer />
        <Text color="gray">Press any key to return to menu...</Text>
      </Box>
    );
  };

  const renderResetConfirm = () => {
    const confirmItems = [
      { label: 'Yes, reset all configuration', value: 'yes' },
      { label: 'No, keep current configuration', value: 'no' },
    ];

    return (
      <Box flexDirection="column">
        <Text bold color="red">Reset Configuration</Text>
        <Text>This will remove all provider configurations and API keys.</Text>
        <Text>Are you sure you want to continue?</Text>
        <Spacer />
        <SelectInput items={confirmItems} onSelect={handleResetConfirm} />
      </Box>
    );
  };

  const renderDone = () => {
    return (
      <Box flexDirection="column">
        <Text bold color="green">✓ Configuration updated successfully!</Text>
        <Text>The changes have been saved and will be applied immediately.</Text>
      </Box>
    );
  };

  if (errorMessage && step !== 'api-key') {
    return (
      <Box flexDirection="column">
        <Text bold color="red">Error</Text>
        <Text>{errorMessage}</Text>
        <Text color="gray">Press any key to continue...</Text>
      </Box>
    );
  }

  switch (step) {
    case 'menu':
      return renderMenu();
    case 'provider':
      return renderProviderSelection();
    case 'api-key':
      return renderApiKeyInput();
    case 'model':
      return renderModelSelection();
    case 'status':
      return renderStatus();
    case 'reset-confirm':
      return renderResetConfirm();
    case 'done':
      return renderDone();
    default:
      return <Text>Unknown step</Text>;
  }
}