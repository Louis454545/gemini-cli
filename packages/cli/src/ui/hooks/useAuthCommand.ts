/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import {
  AuthType,
  Config,
  clearCachedCredentialFile,
  getErrorMessage,
} from '@google/gemini-cli-core';
import { runExitCleanup } from '../../utils/cleanup.js';
import keytar from 'keytar';

const SERVICE_NAME = 'gemini-cli';

export const useAuthCommand = (
  settings: LoadedSettings,
  setAuthError: (error: string | null) => void,
  config: Config,
) => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(
    settings.merged.selectedAuthType === undefined,
  );

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const authFlow = async () => {
      const authType = settings.merged.selectedAuthType;
      if (isAuthDialogOpen || !authType) {
        return;
      }

      try {
        setIsAuthenticating(true);
        await config.refreshAuth(authType);
        console.log(`Authenticated via "${authType}".`);
      } catch (e) {
        setAuthError(`Failed to login. Message: ${getErrorMessage(e)}`);
        openAuthDialog();
      } finally {
        setIsAuthenticating(false);
      }
    };

    void authFlow();
  }, [isAuthDialogOpen, settings, config, setAuthError, openAuthDialog]);

  const handleProviderSubmit = useCallback(
    async (result: { provider: 'google'; model: string; apiKey: string } | null, scope: SettingScope) => {
      if (!result) {
        setIsAuthDialogOpen(false);
        return;
      }

      // Persist API key securely
      try {
        await keytar.setPassword(SERVICE_NAME, result.provider, result.apiKey);
        process.env.GEMINI_API_KEY = result.apiKey;
      } catch (err) {
        setAuthError(
          'Failed to save API key securely. Please ensure keytar is supported on your system.',
        );
        return;
      }

      // Persist model selection
      settings.setValue(scope, 'model', result.model);

      // Select auth type (Gemini API key flow)
      settings.setValue(scope, 'selectedAuthType', AuthType.USE_GEMINI);

      setIsAuthDialogOpen(false);
      setAuthError(null);
    },
    [settings, setAuthError],
  );

  const cancelAuthentication = useCallback(() => {
    setIsAuthenticating(false);
  }, []);

  return {
    isAuthDialogOpen,
    openAuthDialog,
    handleProviderSubmit,
    isAuthenticating,
    cancelAuthentication,
  };
};
