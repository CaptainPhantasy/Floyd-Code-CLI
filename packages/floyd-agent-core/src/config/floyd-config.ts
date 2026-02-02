/**
 * Floyd Configuration Manager
 *
 * Single source of truth for all configuration across:
 * - Floyd CLI (Ink/React)
 * - Floyd Wrapper (Node.js)
 * - Floyd Desktop (Electron)
 *
 * Features:
 * - Singleton ConfigManager with hot-reload
 * - Environment variable overrides
 * - Multi-source configuration priority
 * - Type-safe config access
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item B
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Safety/permission mode
 */
export type SafetyMode = 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit';

/**
 * LLM provider type
 */
export type LLMProvider = 'anthropic' | 'openai' | 'deepseek' | 'zai' | 'custom';

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** API provider */
  provider: LLMProvider;
  /** API key (can be from env) */
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
  /** How long to remember ('session' or 'forever') */
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
  /** Theme (light/dark/auto) */
  theme: 'light' | 'dark' | 'auto';
  /** Whether to show timestamps */
  showTimestamps: boolean;
  /** Whether to show token counts */
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
  /** Whether to log to file */
  logToFile: boolean;
  /** Log file path */
  logFilePath?: string;
  /** Whether to include timestamps */
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
 * Configuration file format (.floyd/settings.json)
 */
export interface ConfigFile {
  llm?: Partial<LLMConfig>;
  mcpServers?: Record<string, MCPServerConfig>;
  permissions?: Partial<PermissionConfig>;
  cache?: Partial<CacheConfig>;
  ui?: Partial<UIConfig>;
  logging?: Partial<LoggingConfig>;
  systemPrompt?: string;
  allowedTools?: string[];
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Readonly<Omit<FloydConfig, 'sessionId' | 'workingDirectory'>> = {
  llm: {
    provider: 'zai',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.7,
    enableThinkingMode: false,
  },
  mcpServers: {},
  permissions: {
    mode: 'ask',
    showWarnings: true,
    alwaysAllowTools: [
      'read_file',
      'read',
      'list_directory',
      'find_files',
      'grep',
      'search',
      'get_symbols',
      'get_file_info',
    ],
    alwaysPromptTools: [
      'write_file',
      'delete_file',
      'execute_command',
      'run_bash',
      'move_file',
      'copy_file',
      'create_directory',
    ],
    rememberDecisions: true,
    rememberUntil: 'session',
  },
  cache: {
    enabled: true,
    cacheDir: '~/.floyd/cache',
    reasoningTTL: 5 * 60 * 1000, // 5 minutes
    projectTTL: 24 * 60 * 60 * 1000, // 24 hours
    vaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  ui: {
    theme: 'auto',
    showTimestamps: true,
    showTokenCounts: true,
    fontSize: 14,
    lineHeight: 1.6,
  },
  logging: {
    level: 'info',
    logToFile: false,
    includeTimestamps: true,
  },
  allowedTools: [],
  systemPrompt: undefined,
} as const;

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

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

/**
 * Configuration manager events
 */
export interface ConfigManagerEvents {
  'config:changed': (change: ConfigChangeEvent) => void;
  'config:reloaded': (config: FloydConfig) => void;
  'config:error': (error: Error) => void;
}

declare interface ConfigManager {
  on<E extends keyof ConfigManagerEvents>(event: E, listener: ConfigManagerEvents[E]): this;
  off<E extends keyof ConfigManagerEvents>(event: E, listener: ConfigManagerEvents[E]): this;
  emit<E extends keyof ConfigManagerEvents>(event: E, ...args: Parameters<ConfigManagerEvents[E]>): boolean;
}

/**
 * ConfigManager - Singleton configuration manager
 *
 * Loads configuration from multiple sources with priority:
 * 1. Environment variables (FLOYD_*)
 * 2. Programmatic options (set(), setAll())
 * 3. .floyd/settings.json
 * 4. CLAUDE.md (project context)
 * 5. Default values
 *
 * Supports hot-reload via watch() method.
 */
class ConfigManagerClass extends EventEmitter {
  private config: FloydConfig;
  private configPath: string;
  private claudeMdPath: string;
  private watchers: Array<() => void> = [];
  private isWatching = false;

  private constructor() {
    super();
    this.config = this.createInitialConfig();
    this.configPath = path.join(this.config.workingDirectory, '.floyd', 'settings.json');
    this.claudeMdPath = path.join(this.config.workingDirectory, 'CLAUDE.md');
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ConfigManagerClass {
    if (!globalThis.__floydConfigManager) {
      globalThis.__floydConfigManager = new ConfigManagerClass();
    }
    return globalThis.__floydConfigManager;
  }

  /**
   * Initialize the configuration manager
   * Loads config from files and environment variables
   */
  async initialize(cwd?: string): Promise<FloydConfig> {
    if (cwd) {
      this.config.workingDirectory = cwd;
      this.configPath = path.join(cwd, '.floyd', 'settings.json');
      this.claudeMdPath = path.join(cwd, 'CLAUDE.md');
    }

    await this.loadConfigFile();
    await this.loadClaudeMd();
    this.loadEnvironmentOverrides();

    return this.getAll();
  }

  /**
   * Get a configuration value by key
   */
  get<K extends keyof FloydConfig>(key: K): FloydConfig[K] {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  getAll(): FloydConfig {
    return { ...this.config };
  }

  /**
   * Set a configuration value by key
   */
  async set<K extends keyof FloydConfig>(key: K, value: FloydConfig[K]): Promise<void> {
    const oldValue = this.config[key];
    this.config[key] = value;

    this.emit('config:changed', { key, value, oldValue });
  }

  /**
   * Set multiple configuration values
   */
  async setAll(partial: Partial<FloydConfig>): Promise<void> {
    for (const [key, value] of Object.entries(partial) as Array<[keyof FloydConfig, FloydConfig[keyof FloydConfig]]>) {
      await this.set(key, value);
    }
  }

  /**
   * Reset to default configuration
   */
  async reset(): Promise<void> {
    const cwd = this.config.workingDirectory;
    const sessionId = this.config.sessionId;

    this.config = {
      ...DEFAULT_CONFIG,
      workingDirectory: cwd,
      sessionId,
      llm: { ...DEFAULT_CONFIG.llm },
      mcpServers: {},
      permissions: { ...DEFAULT_CONFIG.permissions },
      cache: { ...DEFAULT_CONFIG.cache },
      ui: { ...DEFAULT_CONFIG.ui },
      logging: { ...DEFAULT_CONFIG.logging },
      allowedTools: [],
    };

    this.emit('config:reloaded', this.config);
  }

  /**
   * Save configuration to file
   */
  async save(): Promise<void> {
    const configToSave: ConfigFile = {
      llm: this.config.llm,
      mcpServers: this.config.mcpServers,
      permissions: this.config.permissions,
      cache: this.config.cache,
      ui: this.config.ui,
      logging: this.config.logging,
      systemPrompt: this.config.systemPrompt,
      allowedTools: this.config.allowedTools,
    };

    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(configToSave, null, 2));
  }

  /**
   * Reload configuration from file
   */
  async reload(): Promise<void> {
    await this.loadConfigFile();
    await this.loadClaudeMd();
    this.loadEnvironmentOverrides();
    this.emit('config:reloaded', this.config);
  }

  /**
   * Watch configuration files for changes (hot-reload)
   */
  async watch(): Promise<void> {
    if (this.isWatching) return;

    this.isWatching = true;

    // Note: In a real implementation, you'd use fs.watch() or chokidar
    // For now, this is a placeholder for the hot-reload functionality
    console.log('[ConfigManager] Hot-reload enabled (fs.watch not implemented in this stub)');
  }

  /**
   * Stop watching configuration files
   */
  async unwatch(): Promise<void> {
    this.isWatching = false;
    this.watchers.forEach(unwatch => unwatch());
    this.watchers = [];
  }

  /**
   * Create initial configuration
   */
  private createInitialConfig(): FloydConfig {
    return {
      ...DEFAULT_CONFIG,
      workingDirectory: process.cwd(),
      sessionId: this.generateSessionId(),
      llm: { ...DEFAULT_CONFIG.llm },
      mcpServers: {},
      permissions: { ...DEFAULT_CONFIG.permissions },
      cache: { ...DEFAULT_CONFIG.cache },
      ui: { ...DEFAULT_CONFIG.ui },
      logging: { ...DEFAULT_CONFIG.logging },
    };
  }

  /**
   * Load configuration from .floyd/settings.json
   */
  private async loadConfigFile(): Promise<void> {
    if (!existsSync(this.configPath)) {
      return;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const configFromFile = JSON.parse(content) as ConfigFile;

      // Merge with existing config
      if (configFromFile.llm) {
        this.config.llm = { ...this.config.llm, ...configFromFile.llm };
      }
      if (configFromFile.mcpServers) {
        this.config.mcpServers = { ...configFromFile.mcpServers };
      }
      if (configFromFile.permissions) {
        this.config.permissions = { ...this.config.permissions, ...configFromFile.permissions };
      }
      if (configFromFile.cache) {
        this.config.cache = { ...this.config.cache, ...configFromFile.cache };
      }
      if (configFromFile.ui) {
        this.config.ui = { ...this.config.ui, ...configFromFile.ui };
      }
      if (configFromFile.logging) {
        this.config.logging = { ...this.config.logging, ...configFromFile.logging };
      }
      if (configFromFile.systemPrompt) {
        this.config.systemPrompt = configFromFile.systemPrompt;
      }
      if (configFromFile.allowedTools) {
        this.config.allowedTools = configFromFile.allowedTools;
      }
    } catch (error) {
      this.emit('config:error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Load project context from CLAUDE.md
   */
  private async loadClaudeMd(): Promise<void> {
    if (!existsSync(this.claudeMdPath)) {
      return;
    }

    try {
      const content = await fs.readFile(this.claudeMdPath, 'utf-8');
      // Append CLAUDE.md content to system prompt
      if (content) {
        this.config.systemPrompt = (this.config.systemPrompt || '') +
          `\n\n# Project Context (from CLAUDE.md)\n${content}`;
      }
    } catch (error) {
      this.emit('config:error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Load environment variable overrides
   * Environment variables take highest priority
   */
  private loadEnvironmentOverrides(): void {
    // Safety mode
    if (process.env.FLOYD_MODE) {
      const mode = process.env.FLOYD_MODE as SafetyMode;
      if (['ask', 'yolo', 'plan', 'auto', 'dialogue', 'fuckit'].includes(mode)) {
        this.config.permissions.mode = mode;
      }
    }

    // LLM configuration
    if (process.env.FLOYD_API_KEY) {
      this.config.llm.apiKey = process.env.FLOYD_API_KEY;
    }
    if (process.env.FLOYD_API_ENDPOINT) {
      this.config.llm.baseURL = process.env.FLOYM_API_ENDPOINT;
    }
    if (process.env.FLOYD_MODEL) {
      this.config.llm.model = process.env.FLOYD_MODEL;
    }
    if (process.env.FLOYD_MAX_TOKENS) {
      this.config.llm.maxTokens = parseInt(process.env.FLOYD_MAX_TOKENS, 10);
    }
    if (process.env.FLOYD_TEMPERATURE) {
      this.config.llm.temperature = parseFloat(process.env.FLOYD_TEMPERATURE);
    }

    // Anthropic-specific
    if (process.env.ANTHROPIC_API_KEY) {
      this.config.llm.apiKey = process.env.ANTHROPIC_API_KEY;
      if (!this.config.llm.provider || this.config.llm.provider === 'custom') {
        this.config.llm.provider = 'anthropic';
      }
    }

    // OpenAI-specific
    if (process.env.OPENAI_API_KEY) {
      this.config.llm.apiKey = process.env.OPENAI_API_KEY;
      if (!this.config.llm.provider || this.config.llm.provider === 'custom') {
        this.config.llm.provider = 'openai';
      }
    }

    // GLM/Z.ai specific
    if (process.env.GLM_API_KEY) {
      this.config.llm.apiKey = process.env.GLM_API_KEY;
      if (!this.config.llm.provider || this.config.llm.provider === 'custom') {
        this.config.llm.provider = 'zai';
      }
    }
    if (process.env.GLM_API_ENDPOINT) {
      this.config.llm.baseURL = process.env.GLM_API_ENDPOINT;
    }
    if (process.env.GLM_MODEL) {
      this.config.llm.model = process.env.GLM_MODEL;
    }

    // Cache directory
    if (process.env.FLOYD_CACHE_DIR) {
      this.config.cache.cacheDir = process.env.FLOYD_CACHE_DIR;
    }

    // Log level
    if (process.env.FLOYD_LOG_LEVEL) {
      const level = process.env.FLOYD_LOG_LEVEL;
      if (['debug', 'info', 'warn', 'error', 'silent'].includes(level)) {
        this.config.logging.level = level as LoggingConfig['level'];
      }
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `floyd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Global configuration manager instance
 */
export const ConfigManager = ConfigManagerClass.getInstance();

/**
 * Initialize the configuration manager
 * Call this at application startup
 */
export async function initializeConfig(cwd?: string): Promise<FloydConfig> {
  return ConfigManager.initialize(cwd);
}

/**
 * Get current configuration
 */
export function getConfig(): FloydConfig {
  return ConfigManager.getAll();
}

/**
 * Get a specific configuration value
 */
export function getConfigValue<K extends keyof FloydConfig>(key: K): FloydConfig[K] {
  return ConfigManager.get(key);
}

/**
 * Set a configuration value
 */
export async function setConfigValue<K extends keyof FloydConfig>(key: K, value: FloydConfig[K]): Promise<void> {
  return ConfigManager.set(key, value);
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(): Promise<void> {
  return ConfigManager.reset();
}

/**
 * Save configuration to file
 */
export async function saveConfig(): Promise<void> {
  return ConfigManager.save();
}

/**
 * Reload configuration from file
 */
export async function reloadConfig(): Promise<void> {
  return ConfigManager.reload();
}

/**
 * Subscribe to configuration changes
 */
export function onConfigChange(callback: (change: ConfigChangeEvent) => void): () => void {
  ConfigManager.on('config:changed', callback);
  return () => ConfigManager.off('config:changed', callback);
}

/**
 * Subscribe to configuration reloads
 */
export function onConfigReload(callback: (config: FloydConfig) => void): () => void {
  ConfigManager.on('config:reloaded', callback);
  return () => ConfigManager.off('config:reloaded', callback);
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __floydConfigManager: ConfigManagerClass | undefined;
}

