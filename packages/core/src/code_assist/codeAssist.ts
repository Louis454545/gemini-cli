/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, ContentGenerator } from '../core/contentGenerator.js';
import { CodeAssistServer, HttpOptions } from './server.js';
import { Config } from '../config/config.js';

export async function createCodeAssistContentGenerator(
  _httpOptions: HttpOptions,
  authType: AuthType,
  _config: Config,
  _sessionId?: string,
): Promise<ContentGenerator> {
  // OAuth, Vertex, and Cloud Shell auth have been removed.
  throw new Error(`Unsupported authType in CodeAssist path: ${authType}`);
}
