/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { aiConfig } from './ai-config.js';
import { providerRegistry } from '../providers/provider-registry.js';

/**
 * Environment variable mappings for different providers
 */
const ENV_MAPPINGS = {
  google: [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY',
  ],
} as const;

/**
 * Migrate existing environment variables to the new provider system
 */
export async function migrateEnvironmentVariables(): Promise<boolean> {
  let migrated = false;

  // Check if any providers are already configured
  const configuredProviders = aiConfig.getConfiguredProviders();
  if (configuredProviders.length > 0) {
    return false; // Already configured, skip migration
  }

  // Check for Google API keys in environment variables
  for (const envVar of ENV_MAPPINGS.google) {
    const apiKey = process.env[envVar];
    if (apiKey) {
      try {
        const provider = providerRegistry.getProvider('google');
        if (provider && provider.validateApiKey(apiKey)) {
          aiConfig.setProviderApiKey('google', apiKey);
          aiConfig.setCurrentProvider('google');
          
          // Set default model
          aiConfig.setCurrentModel(provider.getDefaultModel());
          
          migrated = true;
          console.log(`✓ Migrated ${envVar} to new AI provider system`);
          break; // Use the first valid key found
        }
      } catch (error) {
        console.warn(`Failed to migrate ${envVar}:`, error);
      }
    }
  }

  return migrated;
}

/**
 * Check if migration is needed (no providers configured but env vars exist)
 */
export function isMigrationNeeded(): boolean {
  const configuredProviders = aiConfig.getConfiguredProviders();
  if (configuredProviders.length > 0) {
    return false;
  }

  // Check if any relevant environment variables exist
  for (const envVars of Object.values(ENV_MAPPINGS)) {
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get environment variable guidance for users
 */
export function getEnvironmentVariableGuidance(): string {
  return `
Environment Variable Setup (Alternative to Interactive Configuration):

Google Gemini:
  Set one of these environment variables with your API key:
  - GOOGLE_GENERATIVE_AI_API_KEY
  - GOOGLE_API_KEY  
  - GEMINI_API_KEY

Example:
  export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"

The CLI will automatically detect and use these environment variables.
`;
}