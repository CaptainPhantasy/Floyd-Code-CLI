/**
 * Floyd Agent Core
 *
 * Central package providing unified implementations for:
 * - Permission System (Item A)
 * - Configuration Management (Item B)
 * - LLM Provider Abstraction (Item C)
 * - State Management (Item D)
 * - Dependency Injection Container
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION
 */

// ============================================================================
// TYPES - Centralized type definitions
// ============================================================================
export * from './types/index.js';

// ============================================================================
// CONTAINER - Dependency Injection
// ============================================================================
export {
  FloydContainer,
  getContainer,
  resetContainer,
  getService,
  getConfigService,
  getStateService,
  getPermissionsService,
  getLLMService,
  type ServiceKey,
  type ServiceFactory,
  type ContainerOptions,
} from './container/index.js';

// ============================================================================
// CONFIG - Configuration Management (Item B)
// ============================================================================
export {
  ConfigManager,
  initializeConfig,
  getConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  saveConfig,
  reloadConfig,
  onConfigChange,
  onConfigReload,
  DEFAULT_CONFIG,
  type FloydConfig,
  type LLMConfig,
  type MCPServerConfig,
  type PermissionConfig,
  type CacheConfig,
  type UIConfig,
  type LoggingConfig,
  type SafetyMode,
  type LLMProvider,
  type ConfigChangeEvent,
} from './config/floyd-config.js';

// ============================================================================
// PERMISSIONS - Unified Permission System (Item A)
// ============================================================================
export {
  UnifiedPermissionManager,
  createPermissionManager,
  createYoloManager,
  createAskManager,
  createPlanManager,
  type PermissionMode,
  type PermissionRequest,
  type PermissionResponse,
  type PermissionPromptFunction,
  type PermissionStrategyConfig,
  type IPermissionStrategy,
  type PermissionAuditEntry,
} from './permissions/unified-permission.js';

export {
  classifyRisk,
  isAlwaysLowRisk,
  isAlwaysHighRisk,
  getDefaultRiskLevel,
  RiskLevel,
  type RiskAssessment,
} from './permissions/risk-classifier.js';

export {
  BUILTIN_POLICIES,
  matchRule,
  evaluatePolicy,
  createPolicy,
  mergePolicies,
  type PermissionDecision,
  type PermissionScope,
  type PermissionRule,
  type PermissionPolicy,
} from './permissions/policies.js';

export {
  PermissionStore,
  createPermissionStore,
  type StoredPermission,
} from './permissions/store.js';

// ============================================================================
// LLM - Provider Abstraction Layer (Item C)
// ============================================================================
export {
  createLLMClient,
  createAnthropicClient,
  createGLMClient,
  createOpenAIClient,
  GLMClient,
  AnthropicClient,
  OpenAICompatibleClient,
  type GLMClientOptions,
  type AnthropicClientOptions,
  type OpenAIClientOptions,
} from './llm/index.js';

// Re-export LLM types
export type {
  LLMClient,
  LLMClientOptions,
  LLMMessage,
  LLMTool,
  LLMToolCall,
  LLMChatCallbacks,
  StreamChunk,
  StreamEvent,
  StreamEventType,
  TokenUsage,
  LLMRole,
} from './llm/types.js';

// ============================================================================
// STATE - State Management (Item D)
// ============================================================================
export {
  StateManager,
  getState,
  getStateValue,
  onStateChange,
  onAnyStateChange,
  onMessageAdded,
  onStatusChanged,
  onToolExecuted,
  resetState,
  type FloydState,
  type StateMessage,
  type ToolExecution,
  type ToolStats,
  type AgentStatus,
  type SessionState,
  type ExecutionState,
  type CacheStats,
  type UIState,
  type StateChangeEvent,
} from './state/floyd-state.js';

// ============================================================================
// UTILITIES
// ============================================================================
export {
  humanizeError,
  formatHumanizedError,
  isRetryableError,
  getErrorCategory,
  type HumanizedError,
} from './utils/error-humanizer.js';

// ============================================================================
// PROMPTS - Tool Capabilities & System Prompts (PHASE 1)
// ============================================================================
export {
  generateToolCapabilities,
  getToolsByCategory,
  getToolStats,
  getToolCapabilityDescription,
  AVAILABLE_TOOLS,
  type ToolDefinition,
  type ToolCapabilitiesOptions,
} from './prompts/index.js';
