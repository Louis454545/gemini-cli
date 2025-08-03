/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Text, Box, Spacer } from 'ink';
import { AISetup, type SetupCallbacks } from '@google/gemini-cli-core/setup/ai-setup.js';

interface SetupCommandProps {
  onExit: (code: number) => void;
}

export function SetupCommand({ onExit }: SetupCommandProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'info' | 'success' | 'error'; text: string }>>([]);

  useEffect(() => {
    if (!isRunning && !isComplete) {
      runSetup();
    }
  }, [isRunning, isComplete]);

  const addMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setMessages(prev => [...prev, { type, text }]);
  };

  const runSetup = async () => {
    setIsRunning(true);
    
    const callbacks: SetupCallbacks = {
      prompt: async (prompt) => {
        // For now, this is a simplified version
        // In a real implementation, we'd need to handle different prompt types
        addMessage('info', prompt.message);
        return prompt.default || '';
      },
      info: (message) => addMessage('info', message),
      success: (message) => addMessage('success', message),
      error: (message) => addMessage('error', message),
    };

    try {
      const setup = new AISetup(callbacks);
      
      // Check if setup is needed
      if (!AISetup.isSetupRequired()) {
        addMessage('info', 'AI providers are already configured!');
        addMessage('info', 'Use "gemini config" to change settings.');
        setIsComplete(true);
        setTimeout(() => onExit(0), 2000);
        return;
      }

      // For initial implementation, we'll guide users to use environment variables
      addMessage('info', 'Welcome to the AI-powered CLI setup!');
      addMessage('info', '');
      addMessage('info', 'To get started quickly, set your Google AI Studio API key as an environment variable:');
      addMessage('info', '');
      addMessage('info', '1. Get your API key from https://aistudio.google.com/app/apikey');
      addMessage('info', '2. Export it as an environment variable:');
      addMessage('info', '   export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"');
      addMessage('info', '');
      addMessage('info', 'Or use the interactive configuration:');
      addMessage('info', '   gemini config provider');
      addMessage('info', '');
      addMessage('success', 'Setup guidance complete!');
      
      setIsComplete(true);
      setTimeout(() => onExit(0), 5000);
      
    } catch (error) {
      addMessage('error', `Setup failed: ${error}`);
      setTimeout(() => onExit(1), 2000);
    } finally {
      setIsRunning(false);
    }
  };

  const getMessageColor = (type: 'info' | 'success' | 'error') => {
    switch (type) {
      case 'success': return 'green';
      case 'error': return 'red';
      default: return undefined;
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>AI CLI Setup</Text>
      <Spacer />
      
      {messages.map((message, index) => (
        <Text key={index} color={getMessageColor(message.type)}>
          {message.text}
        </Text>
      ))}
      
      {isRunning && (
        <Box marginTop={1}>
          <Text color="yellow">Setting up...</Text>
        </Box>
      )}
      
      {isComplete && (
        <Box marginTop={1}>
          <Text color="gray">Press Ctrl+C to exit</Text>
        </Box>
      )}
    </Box>
  );
}