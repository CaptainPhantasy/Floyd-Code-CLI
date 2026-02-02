/**
 * State Management Types
 *
 * Type definitions for the state management system.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.1
 */

/**
 * Message in the conversation
 */
export interface StateMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Message content */
  content: string | Array<{ type: string; text?: string; cache_control?: Record<string, unknown> }>;
  /** Timestamp when message was created */
  timestamp: number;
  /** Tool call ID (for tool responses) */
  tool_call_id?: string;
  /** Tool name (for tool responses) */
  name?: string;
  /** Whether this message is currently streaming */
  streaming?: boolean;
  /** Tokens used */
  tokens?: number;
}

/**
 * Tool execution record
 */
export interface ToolExecution {
  /** Tool name */
  toolName: string;
  /** Timestamp */
  timestamp: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Input parameters */
  input?: Record<string, unknown>;
  /** Output result */
  output?: unknown;
}

/**
 * Tool usage statistics
 */
export interface ToolStats {
  /** Total calls */
  calls: number;
  /** Successful calls */
  successes: number;
  /** Failed calls */
  failures: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Total duration */
  totalDuration: number;
  /** Average duration */
  avgDuration: number;
  /** Last used timestamp */
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
  /** Session ID */
  id: string;
  /** Created timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Project name */
  projectName: string;
  /** Root directory path */
  rootPath: string;
  /** Current working directory */
  currentDirectory: string;
  /** Git branch name */
  gitBranch?: string;
  /** Git repo dirty */
  gitDirty?: boolean;
  /** Total messages */
  messageCount: number;
  /** Total tokens used */
  totalTokens: number;
}

/**
 * Execution state
 */
export interface ExecutionState {
  /** Current status */
  status: AgentStatus;
  /** Current tool being executed */
  currentTool: string | null;
  /** Error message */
  error: string | null;
  /** Progress (0-100) */
  progress: number;
  /** Current activity */
  activity: string;
  /** Paused */
  paused: boolean;
  /** Streaming content */
  streamingContent: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Reasoning entries */
  reasoningEntries: number;
  /** Project entries */
  projectEntries: number;
  /** Vault entries */
  vaultEntries: number;
  /** Total size in bytes */
  totalSize: number;
  /** Cache hit rate */
  hitRate: number;
}

/**
 * UI state
 */
export interface UIState {
  /** Help visible */
  showHelp: boolean;
  /** Process monitor visible */
  showMonitor: boolean;
  /** Prompt library visible */
  showPromptLibrary: boolean;
  /** Agent builder visible */
  showAgentBuilder: boolean;
  /** Command palette visible */
  showCommandPalette: boolean;
  /** Config visible */
  showConfig: boolean;
  /** Theme */
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
  /** Key that changed */
  key: K;
  /** New value */
  value: FloydState[K];
  /** Old value */
  oldValue: FloydState[K];
}
