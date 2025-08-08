export const OPENROUTER_MODELS = [
  // Add OpenRouter models here when ready
];

export interface OpenRouterProviderOptions {
  apiKey: string;
  model: string;
}

export function getOpenRouterModel({ apiKey, model }: OpenRouterProviderOptions) {
  throw new Error('OpenRouter provider not yet implemented.');
}