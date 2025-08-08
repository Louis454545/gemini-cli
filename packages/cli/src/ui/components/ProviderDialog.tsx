/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';

export type ProviderId = 'google' | 'openrouter';

export interface ProviderDialogResult {
  provider: ProviderId;
  model: string;
  apiKey: string;
}

interface ProviderDialogProps {
  onSubmit: (result: ProviderDialogResult | null) => void;
  initialProvider?: ProviderId;
  initialModel?: string;
  initialApiKey?: string;
}

const GOOGLE_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];

export function ProviderDialog({
  onSubmit,
  initialProvider = 'google',
  initialModel,
  initialApiKey,
}: ProviderDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'provider' | 'model' | 'key'>('provider');
  const [provider, setProvider] = useState<ProviderId>(initialProvider);
  const [model, setModel] = useState<string>(initialModel || GOOGLE_MODELS[0]);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || '');

  const providerItems = [
    { label: 'Google (Gemini)', value: 'google' as const },
    // Future: { label: 'OpenRouter', value: 'openrouter' as const },
  ];

  useInput((input, key) => {
    if (key.escape) {
      onSubmit(null);
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      {step === 'provider' && (
        <>
          <Text bold>Select Provider</Text>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={providerItems}
              initialIndex={providerItems.findIndex((i) => i.value === provider)}
              onSelect={(p: ProviderId) => {
                setProvider(p);
                setStep('model');
              }}
              isFocused={true}
            />
          </Box>
        </>
      )}

      {step === 'model' && provider === 'google' && (
        <>
          <Text bold>Select Google Model</Text>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={GOOGLE_MODELS.map((m) => ({ label: m, value: m }))}
              initialIndex={GOOGLE_MODELS.findIndex((m) => m === model)}
              onSelect={(m: string) => {
                setModel(m);
                setStep('key');
              }}
              isFocused={true}
            />
          </Box>
        </>
      )}

      {step === 'key' && (
        <>
          <Text bold>Enter API Key</Text>
          <Box marginTop={1}>
            <Text>{'Type or paste your API key, then press Enter.'}</Text>
          </Box>
          <Box marginTop={1}>
            <Text>
              {apiKey.length > 0 ? '••••••••••' : '(no key entered)'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              {'Press Enter to confirm, or start typing to replace.'}
            </Text>
          </Box>
        </>
      )}

      {step === 'key' && (
        <InputCatcher
          value={apiKey}
          onChange={setApiKey}
          onSubmit={() => onSubmit({ provider, model, apiKey })}
        />
      )}
    </Box>
  );
}

function InputCatcher({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  useInput((input, key) => {
    if (key.return) {
      onSubmit();
      return;
    }
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }
    if (input && input.length === 1) {
      onChange(value + input);
    }
  });
  return null;
}