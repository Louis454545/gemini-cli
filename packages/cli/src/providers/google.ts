import { google as googleProvider, createGoogleGenerativeAI } from '@ai-sdk/google';

export const GOOGLE_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

export interface GoogleProviderOptions {
  apiKey: string;
  model: string;
}

export function getGoogleModel({ apiKey, model }: GoogleProviderOptions) {
  // Use a custom provider instance with the user API key
  const google = createGoogleGenerativeAI({ apiKey });
  return google(model);
}