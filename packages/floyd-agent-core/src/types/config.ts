/**
 * Configuration Types
 *
 * Type definitions for the configuration system.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.1
 */

/**
 * Safety/permission mode
 */
export type SafetyMode = 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit';

/**
 * LLM provider type
 */
export type LLMProvider = 'anthropic' | 'openai' | 'deepseek' | 'zai' | 'glm' | 'custom';

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** API provider */
  provider: LLMProvider;
  /** API key */
  apiKey?: string;
  /** API endpoint URL */
  baseURL?: string;
  /** Model name */
  model?: string;
  /** Max tokens for responses */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
  /** Enable thinking/reasoning mode */
  enableThinkingMode?: boolean;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server command/executable */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Permission configuration
 */
export interface PermissionConfig {
  /** Safety/permission mode */
  mode: SafetyMode;
  /** Whether to show warnings */
  showWarnings: boolean;
  /** Tools that are always allowed */
  alwaysAllowTools: string[];
  /** Tools that always prompt */
  alwaysPromptTools: string[];
  /** Remember permission decisions */
  rememberDecisions: boolean;
  /** How long to remember */
  rememberUntil: 'session' | 'forever';
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Cache directory path */
  cacheDir: string;
  /** TTL for reasoning cache (ms) */
  reasoningTTL: number;
  /** TTL for project cache (ms) */
  projectTTL: number;
  /** TTL for vault cache (ms) */
  vaultTTL: number;
}

/**
 * UI configuration
 */
export interface UIConfig {
  /** Theme */
  theme: 'light' | 'dark' | 'auto';
  /** Show timestamps */
  showTimestamps: boolean;
  /** Show token counts */
  showTokenCounts: boolean;
  /** Font size */
  fontSize: number;
  /** Line height */
  lineHeight: number;
  /** Max width for content */
  maxWidth?: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  /** Log to file */
  logToFile: boolean;
  /** Log file path */
  logFilePath?: string;
  /** Include timestamps */
  includeTimestamps: boolean;
}

/**
 * Complete Floyd configuration
 */
export interface FloydConfig {
  /** LLM provider configuration */
  llm: LLMConfig;
  /** MCP server configurations */
  mcpServers: Record<string, MCPServerConfig>;
  /** Permission/safety configuration */
  permissions: PermissionConfig;
  /** Cache configuration */
  cache: CacheConfig;
  /** UI configuration */
  ui: UIConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** System prompt (additional) */
  systemPrompt?: string;
  /** Allowed tools (empty = all) */
  allowedTools: string[];
  /** Working directory */
  workingDirectory: string;
  /** Session ID */
  sessionId: string;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent<T extends keyof FloydConfig = keyof FloydConfig> {
  /** The key that changed */
  key: T;
  /** The new value */
  value: FloydConfig[T];
  /** The old value */
  oldValue: FloydConfig[T];
}
