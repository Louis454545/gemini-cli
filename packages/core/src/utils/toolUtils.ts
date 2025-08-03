/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { PartListUnion, Part } from '../types/legacy-genai-types.js';

/**
 * Converts a string or Part array to PartListUnion format
 */
export function toPartListUnion(content: string | Part[]): PartListUnion {
  if (typeof content === 'string') {
    return [{ text: content }];
  }
  return content;
}

/**
 * Helper function to create a simple text part list
 */
export function createTextParts(text: string): Part[] {
  return [{ text }];
}