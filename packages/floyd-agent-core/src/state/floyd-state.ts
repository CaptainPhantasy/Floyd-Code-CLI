/**
 * Floyd State Management
 *
 * Single source of truth for state across:
 * - Floyd CLI (Ink/React)
 * - Floyd Wrapper (Node.js)
 * - Floyd Desktop (Electron)
 *
 * Features:
 * - FloydState interface with session, execution, cache, UI state
 * - StateManager with pub/sub pattern
 * - Singleton globalState
 * - Platform-agnostic (no React/Zustand dependency)
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item D
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Message in the conversation
 */
export interface StateMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Message content (text or structured) */
  content: string | Array<{ type: string; text?: string; cache_control?: Record<string, unknown> }>;
  /** Timestamp when message was created */
  timestamp: number;
  /** Tool call ID (for tool responses) */
  tool_call_id?: string;
  /** Tool name (for tool responses) */
  name?: string;
  /** Whether this message is currently streaming */
  streaming?: boolean;
  /** Tokens used (if available) */
  tokens?: number;
}

/**
 * Tool execution record
 */
export interface ToolExecution {
  /** Tool name that was called */
  toolName: string;
  /** Timestamp when tool was called */
  timestamp: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether the call was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Input parameters (sanitized) */
  input?: Record<string, unknown>;
  /** Output result (if available) */
  output?: unknown;
}

/**
 * Tool usage statistics
 */
export interface ToolStats {
  /** Total number of calls */
  calls: number;
  /** Successful calls */
  successes: number;
  /** Failed calls */
  failures: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Total duration across all calls */
  totalDuration: number;
  /** Average duration per call */
  avgDuration: number;
  /** Timestamp of last call */
  lastUsed: number | null;
}

/**
 * Agent status
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'tooling'
  | 'running'
  | 'working'
  | 'paused'
  | 'error';

/**
 * Session state
 */
export interface SessionState {
  /** Unique session identifier */
  id: string;
  /** Timestamp when session was created */
  createdAt: number;
  /** Timestamp of last activity */
  lastActivity: number;
  /** Project name */
  projectName: string;
  /** Root directory path */
  rootPath: string;
  /** Current working directory */
  currentDirectory: string;
  /** Git branch name (if in git repo) */
  gitBranch?: string;
  /** Whether git repo is dirty */
  gitDirty?: boolean;
  /** Total messages in session */
  messageCount: number;
  /** Total tokens used in session */
  totalTokens: number;
}

/**
 * Execution state
 */
export interface ExecutionState {
  /** Current agent status */
  status: AgentStatus;
  /** Current tool being executed (if any) */
  currentTool: string | null;
  /** Agent error message (if any) */
  error: string | null;
  /** Agent progress (0-100) */
  progress: number;
  /** Current activity description */
  activity: string;
  /** Whether agent is paused */
  paused: boolean;
  /** Current streaming content */
  streamingContent: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of entries in reasoning cache */
  reasoningEntries: number;
  /** Number of entries in project cache */
  projectEntries: number;
  /** Number of entries in vault cache */
  vaultEntries: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
}

/**
 * UI state
 */
export interface UIState {
  /** Whether help overlay is visible */
  showHelp: boolean;
  /** Whether process monitor is visible */
  showMonitor: boolean;
  /** Whether prompt library is visible */
  showPromptLibrary: boolean;
  /** Whether agent builder is visible */
  showAgentBuilder: boolean;
  /** Whether command palette is visible */
  showCommandPalette: boolean;
  /** Whether settings/config is visible */
  showConfig: boolean;
  /** Current theme */
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Complete Floyd state
 */
export interface FloydState {
  /** Session information */
  session: SessionState;
  /** Conversation messages */
  messages: StateMessage[];
  /** Execution status */
  execution: ExecutionState;
  /** Tool usage stats */
  toolStats: Record<string, ToolStats>;
  /** Recent tool executions */
  recentExecutions: ToolExecution[];
  /** Cache statistics */
  cacheStats: CacheStats;
  /** UI state */
  ui: UIState;
}

/**
 * State change event
 */
export interface StateChangeEvent<K extends keyof FloydState> {
  /** The key that changed */
  key: K;
  /** The new value */
  value: FloydState[K];
  /** The old value */
  oldValue: FloydState[K];
}

/**
 * State manager events
 */
export interface StateManagerEvents {
  /** Emitted when any state changes */
  'state:changed': <K extends keyof FloydState>(change: StateChangeEvent<K>) => void;
  /** Emitted when a message is added */
  'message:added': (message: StateMessage) => void;
  /** Emitted when execution status changes */
  'status:changed': (status: AgentStatus) => void;
  /** Emitted when a tool is executed */
  'tool:executed': (execution: ToolExecution) => void;
  /** Emitted when state is reset */
  'state:reset': () => void;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

/**
 * Create default session state
 */
function createDefaultSessionState(): SessionState {
  return {
    id: `floyd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    projectName: '',
    rootPath: process.cwd(),
    currentDirectory: process.cwd(),
    gitBranch: undefined,
    gitDirty: undefined,
    messageCount: 0,
    totalTokens: 0,
  };
}

/**
 * Create default execution state
 */
function createDefaultExecutionState(): ExecutionState {
  return {
    status: 'idle',
    currentTool: null,
    error: null,
    progress: 0,
    activity: '',
    paused: false,
    streamingContent: '',
  };
}

/**
 * Create default cache stats
 */
function createDefaultCacheStats(): CacheStats {
  return {
    reasoningEntries: 0,
    projectEntries: 0,
    vaultEntries: 0,
    totalSize: 0,
    hitRate: 0,
  };
}

/**
 * Create default UI state
 */
function createDefaultUIState(): UIState {
  return {
    showHelp: false,
    showMonitor: false,
    showPromptLibrary: false,
    showAgentBuilder: false,
    showCommandPalette: false,
    showConfig: false,
    theme: 'auto',
  };
}

/**
 * Create complete default state
 */
function createDefaultState(): FloydState {
  return {
    session: createDefaultSessionState(),
    messages: [],
    execution: createDefaultExecutionState(),
    toolStats: {},
    recentExecutions: [],
    cacheStats: createDefaultCacheStats(),
    ui: createDefaultUIState(),
  };
}

// ============================================================================
// STATE MANAGER
// ============================================================================

declare interface StateManager {
  on<E extends keyof StateManagerEvents>(event: E, listener: StateManagerEvents[E]): this;
  off<E extends keyof StateManagerEvents>(event: E, listener: StateManagerEvents[E]): this;
  emit<E extends keyof StateManagerEvents>(event: E, ...args: Parameters<StateManagerEvents[E]>): boolean;
}

/**
 * StateManager - Pub/Sub state management
 *
 * Thread-safe, event-driven state management.
 * Platform-agnostic (works in Node.js, browser, Electron).
 *
 * @example
 * ```typescript
 * const state = StateManager.getState();
 * StateManager.on('state:changed', (change) => {
 *   console.log(`${change.key} changed from`, change.oldValue, 'to', change.value);
 * });
 *
 * // Update state
 * StateManager.setExecutionStatus('thinking');
 *
 * // Add message
 * StateManager.addMessage({
 *   id: 'msg-1',
 *   role: 'user',
 *   content: 'Hello',
 *   timestamp: Date.now()
 * });
 * ```
 */
class StateManagerClass extends EventEmitter {
  private state: FloydState;

  private constructor() {
    super();
    this.state = createDefaultState();
    this.setupMaxListeners();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): StateManagerClass {
    if (!globalThis.__floydStateManager) {
      globalThis.__floydStateManager = new StateManagerClass();
    }
    return globalThis.__floydStateManager;
  }

  /**
   * Get current state (immutable snapshot)
   */
  getState(): Readonly<FloydState> {
    return { ...this.state };
  }

  /**
   * Get a specific state slice
   */
  get<K extends keyof FloydState>(key: K): Readonly<FloydState[K]> {
    return this.state[key];
  }

  /**
   * Set a specific state slice
   */
  set<K extends keyof FloydState>(key: K, value: FloydState[K]): void {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.emit('state:changed', { key, value, oldValue });
  }

  // ============================================================
  // SESSION STATE
  // ============================================================

  /**
   * Initialize session
   */
  initSession(projectName: string, rootPath: string): void {
    const session: SessionState = {
      id: `floyd-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      projectName,
      rootPath,
      currentDirectory: rootPath,
      messageCount: 0,
      totalTokens: 0,
    };
    this.set('session', session);
  }

  /**
   * Update session activity
   */
  recordActivity(): void {
    const session = { ...this.state.session, lastActivity: Date.now() };
    this.set('session', session);
  }

  /**
   * Set current directory
   */
  setCurrentDirectory(dir: string): void {
    const session = { ...this.state.session, currentDirectory: dir };
    this.set('session', session);
  }

  // ============================================================
  // EXECUTION STATE
  // ============================================================

  /**
   * Set execution status
   */
  setExecutionStatus(status: AgentStatus): void {
    const execution = { ...this.state.execution, status };
    this.set('execution', execution);
    this.emit('status:changed', status);
  }

  /**
   * Set current tool
   */
  setCurrentTool(tool: string | null): void {
    const execution = { ...this.state.execution, currentTool: tool };
    this.set('execution', execution);
  }

  /**
   * Set execution error
   */
  setExecutionError(error: string | null): void {
    const execution = { ...this.state.execution, error };
    this.set('execution', execution);
  }

  /**
   * Set execution progress
   */
  setExecutionProgress(progress: number): void {
    const execution = { ...this.state.execution, progress };
    this.set('execution', execution);
  }

  /**
   * Set activity description
   */
  setActivity(activity: string): void {
    const execution = { ...this.state.execution, activity };
    this.set('execution', execution);
  }

  /**
   * Toggle pause state
   */
  togglePaused(): void {
    const execution = { ...this.state.execution, paused: !this.state.execution.paused };
    this.set('execution', execution);
  }

  /**
   * Append to streaming content
   */
  appendStreamingContent(content: string): void {
    const execution = {
      ...this.state.execution,
      streamingContent: this.state.execution.streamingContent + content,
    };
    this.set('execution', execution);
  }

  /**
   * Clear streaming content
   */
  clearStreamingContent(): void {
    const execution = { ...this.state.execution, streamingContent: '' };
    this.set('execution', execution);
  }

  /**
   * Reset execution state
   */
  resetExecution(): void {
    this.set('execution', createDefaultExecutionState());
    this.emit('status:changed', 'idle');
  }

  // ============================================================
  // MESSAGES
  // ============================================================

  /**
   * Add a message to the conversation
   */
  addMessage(message: StateMessage): void {
    const messages = [...this.state.messages, message];
    this.set('messages', messages);
    this.emit('message:added', message);

    // Update session message count
    const session = { ...this.state.session, messageCount: messages.length };
    this.state.session = session; // Direct update to avoid double emit
  }

  /**
   * Update an existing message
   */
  updateMessage(id: string, updates: Partial<StateMessage>): void {
    const messages = this.state.messages.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    );
    this.set('messages', messages);
  }

  /**
   * Remove a message
   */
  removeMessage(id: string): void {
    const messages = this.state.messages.filter(msg => msg.id !== id);
    this.set('messages', messages);
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.set('messages', []);
  }

  /**
   * Get messages
   */
  getMessages(): ReadonlyArray<StateMessage> {
    return this.state.messages;
  }

  // ============================================================
  // TOOL EXECUTION
  // ============================================================

  /**
   * Record a tool execution
   */
  recordToolExecution(execution: Omit<ToolExecution, 'timestamp'>): void {
    const toolName = execution.toolName;
    const timestamp = Date.now();
    const success = execution.success;

    // Update stats
    const currentStats = this.state.toolStats[toolName] || {
      calls: 0,
      successes: 0,
      failures: 0,
      successRate: 1,
      totalDuration: 0,
      avgDuration: 0,
      lastUsed: null,
    };

    const newCalls = currentStats.calls + 1;
    const newSuccesses = success ? currentStats.successes + 1 : currentStats.successes;
    const newFailures = success ? currentStats.failures : currentStats.failures + 1;
    const newTotalDuration = currentStats.totalDuration + execution.duration;
    const newAvgDuration = newTotalDuration / newCalls;

    const newStats: ToolStats = {
      calls: newCalls,
      successes: newSuccesses,
      failures: newFailures,
      successRate: newSuccesses / newCalls,
      totalDuration: newTotalDuration,
      avgDuration: newAvgDuration,
      lastUsed: timestamp,
    };

    // Update tool stats
    const toolStats = { ...this.state.toolStats, [toolName]: newStats };

    // Add to recent executions
    const newExecution: ToolExecution = { ...execution, timestamp };
    const recentExecutions = [newExecution, ...this.state.recentExecutions].slice(0, 50);

    // Batch update to avoid multiple emits
    this.state.toolStats = toolStats;
    this.state.recentExecutions = recentExecutions;
    this.emit('state:changed', {
      key: 'toolStats',
      value: toolStats,
      oldValue: this.state.toolStats,
    });
    this.emit('tool:executed', newExecution);
  }

  /**
   * Get stats for a specific tool
   */
  getToolStats(toolName: string): ToolStats | null {
    return this.state.toolStats[toolName] || null;
  }

  /**
   * Clear all tool stats
   */
  clearToolStats(): void {
    this.set('toolStats', {});
    this.set('recentExecutions', []);
  }

  // ============================================================
  // CACHE STATS
  // ============================================================

  /**
   * Update cache statistics
   */
  updateCacheStats(updates: Partial<CacheStats>): void {
    const cacheStats = { ...this.state.cacheStats, ...updates };
    this.set('cacheStats', cacheStats);
  }

  // ============================================================
  // UI STATE
  // ============================================================

  /**
   * Set UI overlay visibility
   */
  setOverlayVisibility(overlay: keyof UIState, visible: boolean): void {
    const ui = { ...this.state.ui, [overlay]: visible };
    this.set('ui', ui);
  }

  /**
   * Toggle UI overlay
   */
  toggleOverlay(overlay: keyof UIState): void {
    const currentValue = this.state.ui[overlay as keyof UIState] as boolean;
    const ui = { ...this.state.ui, [overlay]: !currentValue };
    this.set('ui', ui);
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    const ui = { ...this.state.ui, theme };
    this.set('ui', ui);
  }

  // ============================================================
  // GLOBAL OPERATIONS
  // ============================================================

  /**
   * Reset all state to defaults
   */
  reset(): void {
    this.state = createDefaultState();
    this.emit('state:reset');
    this.emit('state:changed', {
      key: 'session',
      value: this.state.session,
      oldValue: this.state.session,
    });
  }

  /**
   * Export state for persistence
   */
  export(): Record<string, unknown> {
    return {
      session: this.state.session,
      messages: this.state.messages,
      toolStats: this.state.toolStats,
      ui: this.state.ui,
      // Don't export transient execution state
    };
  }

  /**
   * Import state from persistence
   */
  import(data: Record<string, unknown>): void {
    if (data.session) {
      this.state.session = data.session as SessionState;
    }
    if (data.messages) {
      this.state.messages = data.messages as StateMessage[];
    }
    if (data.toolStats) {
      this.state.toolStats = data.toolStats as Record<string, ToolStats>;
    }
    if (data.ui) {
      this.state.ui = { ...this.state.ui, ...(data.ui as Partial<UIState>) };
    }
    this.emit('state:changed', {
      key: 'session',
      value: this.state.session,
      oldValue: this.state.session,
    });
  }

  /**
   * Setup max listeners for EventEmitter
   */
  private setupMaxListeners(): void {
    this.setMaxListeners(100);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Global state manager instance
 */
export const StateManager = StateManagerClass.getInstance();

/**
 * Get current state (immutable snapshot)
 */
export function getState(): Readonly<FloydState> {
  return StateManager.getState();
}

/**
 * Get a specific state slice
 */
export function getStateValue<K extends keyof FloydState>(key: K): Readonly<FloydState[K]> {
  return StateManager.get(key);
}

/**
 * Subscribe to state changes
 */
export function onStateChange<K extends keyof FloydState>(
  key: K,
  callback: (value: FloydState[K], oldValue: FloydState[K]) => void
): () => void {
  const listener = (change: StateChangeEvent<K>) => {
    if (change.key === key) {
      callback(change.value, change.oldValue);
    }
  };
  StateManager.on('state:changed', listener);
  return () => StateManager.off('state:changed', listener);
}

/**
 * Subscribe to all state changes
 */
export function onAnyStateChange(
  callback: <K extends keyof FloydState>(change: StateChangeEvent<K>) => void
): () => void {
  StateManager.on('state:changed', callback);
  return () => StateManager.off('state:changed', callback);
}

/**
 * Subscribe to message additions
 */
export function onMessageAdded(
  callback: (message: StateMessage) => void
): () => void {
  StateManager.on('message:added', callback);
  return () => StateManager.off('message:added', callback);
}

/**
 * Subscribe to status changes
 */
export function onStatusChanged(
  callback: (status: AgentStatus) => void
): () => void {
  StateManager.on('status:changed', callback);
  return () => StateManager.off('status:changed', callback);
}

/**
 * Subscribe to tool executions
 */
export function onToolExecuted(
  callback: (execution: ToolExecution) => void
): () => void {
  StateManager.on('tool:executed', callback);
  return () => StateManager.off('tool:executed', callback);
}

/**
 * Reset state to defaults
 */
export function resetState(): void {
  StateManager.reset();
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __floydStateManager: StateManagerClass | undefined;
}
