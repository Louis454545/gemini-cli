import { useState, useCallback, useEffect } from 'react';
import { ProviderId } from '../../providers';
import { LoadedSettings, SettingScope } from '../../config/settings';
import keytar from 'keytar';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SERVICE_NAME = 'gemini-cli';
const FILE_FALLBACK_PATH = path.join(os.homedir(), '.gemini', 'credentials.json');

async function saveApiKey(provider: ProviderId, apiKey: string) {
  try {
    await keytar.setPassword(SERVICE_NAME, provider, apiKey);
  } catch (e) {
    // Fallback to file
    const creds = fs.existsSync(FILE_FALLBACK_PATH)
      ? JSON.parse(fs.readFileSync(FILE_FALLBACK_PATH, 'utf-8'))
      : {};
    creds[provider] = apiKey;
    fs.mkdirSync(path.dirname(FILE_FALLBACK_PATH), { recursive: true });
    fs.writeFileSync(FILE_FALLBACK_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
  }
}

async function loadApiKey(provider: ProviderId): Promise<string | undefined> {
  try {
    const key = await keytar.getPassword(SERVICE_NAME, provider);
    if (key) return key;
  } catch (e) {}
  // Fallback to file
  if (fs.existsSync(FILE_FALLBACK_PATH)) {
    const creds = JSON.parse(fs.readFileSync(FILE_FALLBACK_PATH, 'utf-8'));
    return creds[provider];
  }
  return undefined;
}

export function useProviderCommand(
  settings: LoadedSettings,
  setError: (error: string | null) => void,
) {
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(
    !settings.merged.provider || !settings.merged.model,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  const openProviderDialog = useCallback(() => {
    setIsProviderDialogOpen(true);
  }, []);

  useEffect(() => {
    if (settings.merged.provider) {
      loadApiKey(settings.merged.provider).then(setApiKey);
    }
  }, [settings.merged.provider]);

  const handleProviderSelect = useCallback(
    async (provider: ProviderId, model: string, apiKey: string) => {
      setIsSaving(true);
      try {
        await saveApiKey(provider, apiKey);
        settings.setValue(SettingScope.User, 'provider', provider);
        settings.setValue(SettingScope.User, 'model', model);
        setApiKey(apiKey);
        setIsProviderDialogOpen(false);
        setError(null);
      } catch (e) {
        setError('Failed to save provider or API key.');
      } finally {
        setIsSaving(false);
      }
    },
    [settings, setError],
  );

  return {
    isProviderDialogOpen,
    openProviderDialog,
    handleProviderSelect,
    isSaving,
    apiKey,
  };
}