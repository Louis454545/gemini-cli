/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@google/gemini-cli-core';

export function validateNonInteractiveAuth(authType?: AuthType): boolean {
  return authType === AuthType.USE_GEMINI;
}
