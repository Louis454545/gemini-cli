/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Export config
export * from './config/config.js';

// Export Core Logic
export * from './core/client.js';
export * from './core/contentGenerator.js';
export * from './core/geminiChat.js';
export * from './core/logger.js';
export * from './core/prompts.js';
export * from './core/tokenLimits.js';
export * from './core/turn.js';
export * from './core/geminiRequest.js';
export * from './core/coreToolScheduler.js';
export * from './core/nonInteractiveToolExecutor.js';

// Legacy code_assist exports removed - use new provider system instead
export { UserTierId } from './types/user-tier.js';
export * from './providers/base-provider.js';
export * from './providers/google-provider.js';
export * from './providers/provider-registry.js';
export * from './config/ai-config.js';
export * from './core/ai-content-generator.js';
export * from './setup/ai-setup.js';
// Legacy GenAI types - export everything except Tool to avoid conflicts
export {
  Part,
  FunctionCall,
  FunctionResponse,
  Content,
  GenerateContentConfig,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentParameters,
  GenerateContentResponse,
  Candidate,
  GenerateContentResponseUsageMetadata,
  CountTokensResponse,
  EmbedContentResponse,
  PromptFeedback,
  SafetyRating,
  SafetySetting,
  FunctionDeclaration,
  Schema,
  FinishReason,
  PartUnion,
  PartListUnion,
  SchemaUnion,
  SendMessageParameters,
  Type,
  CallableTool,
  mcpToTool,
  toPartListUnion,
  createUserContent,
  Tool as GenAITool,
} from './types/legacy-genai-types.js';
export * from './compat/legacy-exports.js';

// Export utilities
export * from './utils/paths.js';
export * from './utils/schemaValidator.js';
export * from './utils/errors.js';
export * from './utils/getFolderStructure.js';
export * from './utils/memoryDiscovery.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/editor.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/fileUtils.js';
export * from './utils/retry.js';
export * from './utils/shell-utils.js';
export * from './utils/systemEncoding.js';
export * from './utils/textUtils.js';
export * from './utils/formatters.js';

// Export services
export * from './services/fileDiscoveryService.js';
export * from './services/gitService.js';

// Export IDE specific logic
export * from './ide/ide-client.js';
export * from './ide/ideContext.js';
export * from './ide/ide-installer.js';
export { getIdeDisplayName, DetectedIde } from './ide/detect-ide.js';

// Export Shell Execution Service
export * from './services/shellExecutionService.js';

// Export base tool definitions
export * from './tools/tools.js';
export * from './tools/tool-error.js';
export * from './tools/tool-registry.js';

// Export prompt logic
export * from './prompts/mcp-prompts.js';

// Export specific tool logic
export * from './tools/read-file.js';
export * from './tools/ls.js';
export * from './tools/grep.js';
export * from './tools/glob.js';
export * from './tools/edit.js';
export * from './tools/write-file.js';
export * from './tools/web-fetch.js';
export * from './tools/memoryTool.js';
export * from './tools/shell.js';
// web-search tool removed
export * from './tools/read-many-files.js';
export * from './tools/mcp-client.js';
export * from './tools/mcp-tool.js';

// MCP OAuth
export { MCPOAuthProvider } from './mcp/oauth-provider.js';
export {
  MCPOAuthToken,
  MCPOAuthCredentials,
  MCPOAuthTokenStorage,
} from './mcp/oauth-token-storage.js';
export type { MCPOAuthConfig } from './mcp/oauth-provider.js';
export type {
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from './mcp/oauth-utils.js';
export { OAuthUtils } from './mcp/oauth-utils.js';

// Export telemetry functions
export * from './telemetry/index.js';
export { sessionId } from './utils/session.js';
export * from './utils/browser.js';
