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
  fuzzyMatch,
  fuzzyMatchBatch,
  findBestLineMatch,
  generatePatchSuggestion,
  type HumanizedError,
  type FuzzyMatch,
  type FuzzyMatchConfig,
} from './utils/index.js';

// ============================================================================
// IO - File Operations (PHASE 3 ITEMS 11, 12)
// ============================================================================
export {
  readFilePath,
  calculateLineRange,
  shouldChunk,
  calculateChunkCount,
  dryRunWrite,
  dryRunEdit,
  dryRunDelete,
  dryRunBatch,
  calculateBatchRisk,
  type FileReadOptions,
  type FileReadResult,
  type DryRunResult,
  type DryRunOptions,
} from './io/index.js';

// ============================================================================
// CACHE - Tier Operations (PHASE 3 ITEMS 10, 13)
// ============================================================================
export {
  getCacheTierDescription,
  migrateCacheEntry,
  validateCacheKey,
  recommendTier,
  type CacheTier,
  type CacheTierInfo,
  type CacheMigrationResult,
} from './cache/cache-tiers.js';

// ============================================================================
// GIT - Branch Protection (PHASE 3 ITEM 14)
// ============================================================================
export {
  isProtectedBranch,
  checkBranchOperation,
  validateBranchName,
  PROTECTED_BRANCHES,
  DEFAULT_PROTECTION,
  type BranchProtectionRule,
} from './git/index.js';

// ============================================================================
// BROWSER - Graceful Degradation & NL Click (PHASE 3 ITEMS 15, 17)
// ============================================================================
export {
  checkBrowserConnection,
  executeWithFallback,
  getDegradationMessage,
  BrowserOperations,
  describeElement,
  generateSelector,
  parseNaturalLanguage,
  findByDescription,
  generateClickInstruction,
  type BrowserStatus,
} from './browser/index.js';

// ============================================================================
// SEARCH - Extended Grep (PHASE 3 ITEM 16)
// ============================================================================
export {
  extendedGrep,
  grepWithContextHighlight,
  grepExists,
  grepLineNumbers,
  grepBatch,
  type GrepOptions,
  type GrepMatch,
  type GrepResult,
} from './search/index.js';

// ============================================================================
// TRANSACTIONS - Multi-file Rollback (PHASE 3 ITEM 18)
// ============================================================================
export {
  createTransaction,
  addOperation,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  storeRollbackData,
  getTransactionStatus,
  listActiveTransactions,
  isTransactionStale,
  cleanupStaleTransactions,
  type Transaction,
  type TransactionOperation,
  type TransactionOptions,
} from './transactions/index.js';

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

// ============================================================================
// COMPLEXITY - Task Classification (PHASE 3 ITEM 7)
// ============================================================================
export {
  assessComplexity,
  quickAssess,
  getTimeoutForComplexity,
  getMaxTurnsForComplexity,
  ComplexityLevel,
  TaskType,
  type ComplexityAssessment,
  type TaskContext,
} from './complexity/complexity-classifier.js';

// ============================================================================
// GUARDS - Loop Detection & Retry (PHASE 3 ITEM 8)
// ============================================================================
export {
  RetryGuard,
  createRetryGuard,
  getRetryDelay,
  type GuardToolExecution,
  type LoopDetection,
  type RetryGuardConfig,
} from './guards/index.js';

// ============================================================================
// VALIDATION - Parameter Validation (PHASE 2 ITEM 4)
// ============================================================================
export {
  validateToolInput,
  validatePreExecution,
  schemaRegistry,
  SchemaRegistry,
  ToolValidationError,
  type ValidationError,
  type ValidationSchema,
  type PropertySchema,
} from './validation/index.js';
