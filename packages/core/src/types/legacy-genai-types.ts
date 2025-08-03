/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Legacy type definitions that replace @google/genai types
// These maintain API compatibility while using the new provider system

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  // Compatibility properties
  fileData?: any;
}

export interface FunctionCall {
  name: string;
  args?: Record<string, any>;
  // Compatibility properties
  id?: string;
}

export interface FunctionResponse {
  name: string;
  response: Record<string, any>;
  // Compatibility properties
  id?: string;
}

export interface Content {
  parts: Part[];
  role: 'user' | 'model' | 'function';
}

export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  // Compatibility properties
  thinkingConfig?: any;
  tools?: Tool[];
}

export interface GenerateContentParameters {
  contents: Content[];
  generationConfig?: GenerateContentConfig;
  systemInstruction?: Content | string;
  tools?: Tool[];
  safetySettings?: SafetySetting[];
}

export interface CountTokensParameters {
  contents: Content[];
}

export interface EmbedContentParameters {
  content: Content;
  taskType?: string;
  title?: string;
}

export interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: GenerateContentResponseUsageMetadata;
}

export interface Candidate {
  content?: Content;
  finishReason?: FinishReason;
  index?: number;
  safetyRatings?: SafetyRating[];
  // Compatibility properties
  urlContextMetadata?: any;
  groundingMetadata?: any;
}

export interface GenerateContentResponseUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface CountTokensResponse {
  totalTokens: number;
}

export interface EmbedContentResponse {
  embedding: {
    values: number[];
  };
}

export interface PromptFeedback {
  blockReason?: string;
  safetyRatings?: SafetyRating[];
}

export interface SafetyRating {
  category: string;
  probability: string;
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

export interface Tool {
  functionDeclarations?: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: Schema;
  // Compatibility properties
  parametersJsonSchema?: any;
}

export interface Schema {
  type?: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  // Additional properties for compatibility
  minLength?: string | number;
  default?: any;
  anyOf?: Schema[];
  format?: string;
}

export type FinishReason = 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';

export type PartUnion = Part | string;
export type PartListUnion = Part[] | string;
export type SchemaUnion = Schema;

// Type used for model inputs
export interface SendMessageParameters {
  message: Content | string;
  generationConfig?: GenerateContentConfig;
  safetySettings?: SafetySetting[];
  tools?: Tool[];
}

// Enums for compatibility
export const Type = {
  STRING: 'string' as const,
  NUMBER: 'number' as const,
  INTEGER: 'integer' as const,
  BOOLEAN: 'boolean' as const,
  ARRAY: 'array' as const,
  OBJECT: 'object' as const,
};

export type TypeValue = typeof Type[keyof typeof Type];

// CallableTool interface for MCP integration
export interface CallableTool {
  function_declarations: FunctionDeclaration[];
  // MCP tool methods for compatibility
  tool?: () => Promise<any>;
  callTool?: (calls: any[]) => Promise<Part[]>;
}

// MCP tool conversion function stub
export function mcpToTool(mcpTool: any): CallableTool {
  return {
    function_declarations: [{
      name: mcpTool.name || 'unknown',
      description: mcpTool.description || '',
      parameters: mcpTool.inputSchema || {},
    }],
  };
}

// Utility functions for compatibility
export function toPartListUnion(content: string | Part[]): PartListUnion {
  if (typeof content === 'string') {
    return [{ text: content }];
  }
  return content;
}

export function createUserContent(message: string | Content): Content {
  if (typeof message === 'string') {
    return {
      parts: [{ text: message }],
      role: 'user',
    };
  }
  return message;
}

// Re-export types with consistent naming
export type { Part as PartType };
export type { Content as ContentType };
export type { FunctionCall as FunctionCallType };
export type { FunctionResponse as FunctionResponseType };
export type { GenerateContentResponse as GenerateContentResponseType };
export type { Schema as SchemaType };
export type { FunctionDeclaration as FunctionDeclarationType };