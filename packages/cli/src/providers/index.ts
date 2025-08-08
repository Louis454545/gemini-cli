import { getGoogleModel, GOOGLE_MODELS } from './google';

export type ProviderId = 'google'; // Add 'openrouter' when ready

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  models: string[];
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'google',
    label: 'Google',
    models: GOOGLE_MODELS,
  },
  // Add OpenRouter here in the future
];

export function getModelInstance(provider: ProviderId, apiKey: string, model: string) {
  switch (provider) {
    case 'google':
      return getGoogleModel({ apiKey, model });
    // case 'openrouter':
    //   return getOpenRouterModel({ apiKey, model });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}