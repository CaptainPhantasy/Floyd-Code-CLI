/**
 * Floyd Agent API - Type Definitions
 *
 * Contract: Floyd Agent API v1.0
 * Base URL: ws://localhost:3000/agent
 *
 * This file defines the request/response format for the Floyd Agent API.
 */

// ============================================================================
// Core Request/Response Types
// ============================================================================

/**
 * Floyd Agent API Request
 */
export interface FloydAgentRequest {
  /** Unique request ID (UUID v4) */
  id: string;
  /** Tool/method name */
  method: FloydAgentMethod;
  /** Method parameters */
  params: Record<string, any>;
  /** Request progress streaming (optional) */
  stream?: boolean;
  /** Optional timeout in ms (default: 60000) */
  timeout?: number;
}

/**
 * Floyd Agent API Response
 */
export interface FloydAgentResponse {
  /** Echoes request ID */
  id: string;
  /** Success flag */
  success: boolean;
  /** Response data (if successful) */
  data?: any;
  /** Error details (if failed) */
  error?: FloydAgentError;
  /** Timing information */
  timing?: FloydAgentTiming;
}

/**
 * Floyd Agent API Error
 */
export interface FloydAgentError {
  /** Error code */
  code: FloydAgentErrorCode;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Suggested recovery action */
  suggestion?: string;
}

/**
 * Timing Information
 */
export interface FloydAgentTiming {
  /** Start timestamp (Unix ms) */
  started: number;
  /** Completion timestamp (Unix ms) */
  completed: number;
  /** Duration in ms */
  duration: number;
}

/**
 * Stream Event (for stream: true requests)
 */
export interface FloydAgentStreamEvent {
  /** Request ID */
  id: string;
  /** Event type */
  type: 'progress' | 'partial' | 'status';
  /** Progress 0-100 */
  progress?: number;
  /** Status message */
  message?: string;
  /** Event data */
  data?: any;
}

// ============================================================================
// Method Names
// ============================================================================

/**
 * All available Floyd Agent API methods
 */
export type FloydAgentMethod =
  // Git Operations
  | 'git_status' | 'git_diff' | 'git_log' | 'git_commit' | 'git_stage' | 'git_unstage'
  | 'git_branch' | 'is_protected_branch' | 'git_merge'
  // Cache Operations
  | 'cache_store' | 'cache_retrieve' | 'cache_delete' | 'cache_clear'
  | 'cache_list' | 'cache_search' | 'cache_stats' | 'cache_prune'
  | 'cache_store_pattern' | 'cache_store_reasoning' | 'cache_load_reasoning' | 'cache_archive_reasoning'
  // File Operations
  | 'read_file' | 'write' | 'edit_file' | 'search_replace'
  | 'list_directory' | 'delete_file' | 'move_file'
  // Browser Automation
  | 'browser_status' | 'browser_navigate' | 'browser_read_page' | 'browser_screenshot'
  | 'browser_click' | 'browser_type' | 'browser_find' | 'browser_get_tabs' | 'browser_create_tab'
  // Search & Discovery
  | 'grep' | 'codebase_search'
  // System Operations
  | 'run' | 'fetch'
  // Verification & Testing
  | 'verify' | 'safe_refactor' | 'impact_simulate' | 'assess_patch_risk'
  // Patch Operations
  | 'apply_unified_diff' | 'edit_range' | 'insert_at' | 'delete_range';

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Floyd Agent API Error Codes
 */
export type FloydAgentErrorCode =
  | 'AUTH_FAILED'
  | 'PERMISSION_DENIED'
  | 'FILE_NOT_FOUND'
  | 'INVALID_PARAMS'
  | 'TIMEOUT'
  | 'GIT_ERROR'
  | 'BROWSER_ERROR'
  | 'CACHE_MISS'
  | 'PATCH_FAILED'
  | 'COMMAND_FAILED'
  | 'UNKNOWN_ERROR'
  | 'METHOD_NOT_FOUND'
  | 'TOOL_EXECUTION_ERROR';

// ============================================================================
// WebSocket Messages
// ============================================================================

/**
 * WebSocket message from client (Union type)
 */
export type FloydAgentWSMessage =
  | FloydAgentRequest
  | FloydAgentResponse
  | FloydAgentStreamEvent
  | { type: 'auth'; token: string; client_version?: string; capabilities?: string[] }
  | { type: 'ping' }
  | { type: 'pong' };

// ============================================================================
// Method Parameter Types (Type-safe where possible)
// ============================================================================

// Git Operations
export interface GitStatusParams {
  repoPath?: string;
}

export interface GitDiffParams {
  repoPath?: string;
  cached?: boolean;
  files?: string[];
}

export interface GitLogParams {
  repoPath?: string;
  maxCount?: number;
  since?: string;
  until?: string;
  author?: string;
  file?: string;
}

export interface GitCommitParams {
  message: string;
  repoPath?: string;
  stageAll?: boolean;
  stageFiles?: string[];
  amend?: boolean;
}

export interface GitStageParams {
  files: string[];
  repoPath?: string;
}

export interface GitUnstageParams {
  files: string[];
  repoPath?: string;
}

export interface GitBranchParams {
  repoPath?: string;
  action: 'list' | 'current' | 'create' | 'switch';
  name?: string;
}

export interface IsProtectedBranchParams {
  repoPath?: string;
  branch?: string;
}

export interface GitMergeParams {
  branch: string;
  repoPath?: string;
  no_ff?: boolean;
  message?: string;
}

// Cache Operations
export interface CacheStoreParams {
  tier: 'reasoning' | 'project' | 'vault';
  key: string;
  value: string;  // JSON stringified
  metadata?: string;
}

export interface CacheRetrieveParams {
  tier: 'reasoning' | 'project' | 'vault';
  key: string;
}

export interface CacheDeleteParams {
  tier: 'reasoning' | 'project' | 'vault';
  key: string;
}

export interface CacheListParams {
  tier: 'reasoning' | 'project' | 'vault';
}

export interface CacheSearchParams {
  tier: 'reasoning' | 'project' | 'vault';
  query: string;
}

// File Operations
export interface ReadFileParams {
  file_path: string;
  offset?: number;
  limit?: number;
}

export interface WriteParams {
  file_path: string;
  content: string;
  create_dirs?: boolean;
}

export interface EditFileParams {
  file_path: string;
  old_string: string;
  new_string: string;
}

export interface SearchReplaceParams {
  file_path: string;
  search_string: string;
  replace_string: string;
  replace_all?: boolean;
}

export interface ListDirectoryParams {
  path: string;
  recursive?: boolean;
  include_hidden?: boolean;
  file_pattern?: string;
}

export interface DeleteFileParams {
  file_path: string;
  backup?: boolean;
}

export interface MoveFileParams {
  source: string;
  destination: string;
  overwrite?: boolean;
}

// Search Operations
export interface GrepParams {
  pattern: string;
  path?: string;
  file_pattern?: string;
  case_insensitive?: boolean;
  output_mode?: 'content' | 'files_with_matches' | 'count';
}

export interface CodebaseSearchParams {
  query: string;
  path?: string;
  max_results?: number;
}

// Browser Operations
export interface BrowserNavigateParams {
  url: string;
  tabId?: number;
}

export interface BrowserReadPageParams {
  tabId?: number;
}

export interface BrowserScreenshotParams {
  full_page?: boolean;
  selector?: string;
  tabId?: number;
}

export interface BrowserClickParams {
  selector?: string;
  x?: number;
  y?: number;
  tabId?: number;
}

export interface BrowserTypeParams {
  text: string;
  tabId?: number;
}

export interface BrowserFindParams {
  query: string;
  tabId?: number;
}

export interface BrowserGetTabsParams {
  tabId?: number;
}

export interface BrowserCreateTabParams {
  url?: string;
}

// System Operations
export interface RunParams {
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number;
  env?: string;
}

// Verification
export interface VerifyParams {
  type: 'file_exists' | 'file_contains' | 'file_not_exists' | 'command_succeeds' | 'command_fails';
  target: string;
  expected?: string;
  regex?: boolean;
  timeout_ms?: number;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract params type for a given method
 */
export type ParamsForMethod<T extends FloydAgentMethod> = T extends 'git_status'
  ? GitStatusParams
  : T extends 'git_diff'
  ? GitDiffParams
  : T extends 'read_file'
  ? ReadFileParams
  : T extends 'run'
  ? RunParams
  : Record<string, any>;
