/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Legacy compatibility exports for removed Google Auth functionality

/**
 * @deprecated Google OAuth has been removed. Use the new provider system instead.
 */
export function clearCachedCredentialFile(): void {
  console.warn('clearCachedCredentialFile is deprecated. Google OAuth has been removed.');
}

/**
 * @deprecated Google OAuth has been removed. Use the new provider system instead.
 */
export function getOauthClient(): null {
  console.warn('getOauthClient is deprecated. Google OAuth has been removed.');
  return null;
}

/**
 * @deprecated Code Assist Server has been removed. Use the new provider system instead.
 */
export class CodeAssistServer {
  constructor() {
    console.warn('CodeAssistServer is deprecated. Use the new provider system instead.');
  }
  
  get projectId(): string | undefined {
    return undefined;
  }
}