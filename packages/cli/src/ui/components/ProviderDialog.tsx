import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { PROVIDERS, ProviderId } from '../../providers';
import { RadioButtonSelect } from './shared/RadioButtonSelect';
import { Colors } from '../colors';

interface ProviderDialogProps {
  onSelect: (provider: ProviderId, model: string, apiKey: string) => void;
  initialProvider?: ProviderId;
  initialModel?: string;
  initialApiKey?: string;
  errorMessage?: string | null;
}

export function ProviderDialog({
  onSelect,
  initialProvider,
  initialModel,
  initialApiKey,
  errorMessage,
}: ProviderDialogProps): React.JSX.Element {
  const [provider, setProvider] = useState<ProviderId>(initialProvider || 'google');
  const providerInfo = PROVIDERS.find((p) => p.id === provider)!;
  const [model, setModel] = useState<string>(initialModel || providerInfo.models[0]);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || '');
  const [step, setStep] = useState<'provider' | 'model' | 'apiKey'>('provider');
  const [inputBuffer, setInputBuffer] = useState('');
  const [localError, setLocalError] = useState<string | null>(errorMessage || null);

  useInput((input, key) => {
    if (step === 'apiKey') {
      if (key.return) {
        if (!apiKey.trim()) {
          setLocalError('API key is required.');
          return;
        }
        setLocalError(null);
        onSelect(provider, model, apiKey.trim());
        return;
      }
      if (key.backspace || key.delete) {
        setApiKey((prev) => prev.slice(0, -1));
        return;
      }
      if (input.length === 1) {
        setApiKey((prev) => prev + input);
      }
    }
  });

  return (
    <Box borderStyle="round" borderColor={Colors.Gray} flexDirection="column" padding={1} width="100%">
      <Text bold>Provider Setup</Text>
      {step === 'provider' && (
        <>
          <Box marginTop={1}><Text>Select a provider:</Text></Box>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={PROVIDERS.map((p) => ({ label: p.label, value: p.id }))}
              initialIndex={PROVIDERS.findIndex((p) => p.id === provider)}
              onSelect={(id) => {
                setProvider(id);
                setStep('model');
              }}
              isFocused={true}
            />
          </Box>
        </>
      )}
      {step === 'model' && (
        <>
          <Box marginTop={1}><Text>Select a model:</Text></Box>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={providerInfo.models.map((m) => ({ label: m, value: m }))}
              initialIndex={providerInfo.models.findIndex((m) => m === model)}
              onSelect={(m) => {
                setModel(m);
                setStep('apiKey');
              }}
              isFocused={true}
            />
          </Box>
        </>
      )}
      {step === 'apiKey' && (
        <>
          <Box marginTop={1}><Text>Enter your API key:</Text></Box>
          <Box marginTop={1}>
            <Text color={Colors.AccentBlue}>{apiKey || '<type your API key>'}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={Colors.Gray}>(Press Enter to confirm)</Text>
          </Box>
        </>
      )}
      {(localError || errorMessage) && (
        <Box marginTop={1}><Text color={Colors.AccentRed}>{localError || errorMessage}</Text></Box>
      )}
    </Box>
  );
}