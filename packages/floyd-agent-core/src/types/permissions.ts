/**
 * Permission System Types
 *
 * Type definitions for the unified permission system.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.1
 */

/**
 * Execution mode - determines how permission requests are handled
 */
export type ExecutionMode = 'ASK' | 'PLAN' | 'AUTO' | 'DISCUSS' | 'FUCKIT';

/**
 * Permission level for tools
 */
export type PermissionLevel = 'none' | 'moderate' | 'dangerous';

/**
 * Permission decision result
 */
export interface PermissionDecision {
  /** Whether permission was granted */
  allowed: boolean;
  /** Whether it was auto-approved (no user prompt) */
  autoApproved: boolean;
  /** Human-readable reason for the decision */
  reason?: string;
  /** Whether user confirmation is required */
  requiresConfirmation?: boolean;
}

/**
 * Tool definition for permission checking
 */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  /** Permission level required */
  permission: PermissionLevel;
  /** Tool category */
  category: string;
  /** Tool description */
  description?: string;
}

/**
 * Execution context for permission checks
 */
export interface ExecutionContext {
  /** Current working directory */
  workingDirectory: string;
  /** Session identifier */
  sessionId: string;
  /** User identifier (optional) */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Permission strategy interface
 */
export interface PermissionStrategy {
  /** Strategy name (mode) */
  name: ExecutionMode;
  /** Check permission for a tool */
  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;
}

/**
 * Permission scope for caching decisions
 */
export type PermissionScope = 'once' | 'session' | 'forever';

/**
 * Permission audit entry
 */
export interface PermissionAuditEntry {
  /** Tool name */
  toolName: string;
  /** Permission level */
  permissionLevel: PermissionLevel;
  /** Target being acted on */
  target: string;
  /** Decision made */
  decision: 'GRANTED' | 'DENIED';
  /** Timestamp */
  timestamp: string;
}
