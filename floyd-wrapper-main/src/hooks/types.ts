/**
 * PHASE 5 ITEM 22: Hooks System
 *
 * Lifecycle event hooks for custom behavior injection.
 * Supports: SessionStart, SessionEnd, PreToolUse, PostToolUse, PermissionRequest, Stop
 *
 * Events can execute shell commands or built-in handlers.
 */

/**
 * Hook event types that can be intercepted
 */
export type HookEvent =
	| 'SessionStart'     // When session begins
	| 'SessionEnd'       // When session ends
	| 'PreToolUse'       // Before tool execution
	| 'PostToolUse'      // After tool execution
	| 'PermissionRequest'// When permission needed
	| 'Stop';            // On interrupt (Ctrl+C)

/**
 * Hook definition from .floyd/hooks.json
 */
export interface Hook {
	event: HookEvent;
	command?: string;    // Shell command to execute
	handler?: string;    // Built-in handler name
	timeout?: number;    // Max execution time in ms (default 5000)
	enabled: boolean;
	filter?: HookFilter; // Optional filter for when to run
}

/**
 * Filter to conditionally execute hooks
 */
export interface HookFilter {
	tools?: string[];    // Only run for specific tools
	toolsExclude?: string[]; // Skip for specific tools
	modes?: string[];    // Only run in specific modes
	minPriority?: number; // Only for tasks above priority
}

/**
 * Context passed to hook handlers
 */
export interface HookContext {
	event: HookEvent;
	sessionId?: string;
	timestamp: number;
	toolName?: string;
	toolArgs?: Record<string, unknown>;
	permission?: {
		tool: string;
		approved: boolean;
		reason?: string;
	};
	signal?: 'SIGINT' | 'SIGTERM';
	env: Record<string, string>;
}

/**
 * Hook execution result
 */
export interface HookResult {
	success: boolean;
	output?: string;
	error?: string;
	duration: number;
}

/**
 * Built-in handler names
 */
export type BuiltinHandler =
	| 'auto_approve_safe_commands'
	| 'log_tool_use'
	| 'backup_before_write'
	| 'confirm_destructive'
	| 'track_token_usage'
	| 'notify_completion';

/**
 * Hooks configuration file schema (.floyd/hooks.json)
 */
export interface HooksConfig {
	version: number;
	hooks: Hook[];
}

/**
 * Hook manager for registering and executing hooks
 */
export interface IHookManager {
	register(event: HookEvent, hook: Hook): void;
	unregister(event: HookEvent, id: string): void;
	execute(event: HookEvent, context: HookContext): Promise<HookResult[]>;
	loadFromFile(path: string): Promise<void>;
	saveToFile(path: string): Promise<void>;
}

/**
 * Default hook configuration
 */
export const DEFAULT_HOOKS_CONFIG: HooksConfig = {
	version: 1,
	hooks: [
		{
			event: 'SessionStart',
			handler: 'log_tool_use',
			enabled: true,
		},
		{
			event: 'PreToolUse',
			handler: 'confirm_destructive',
			filter: {
				tools: ['write_file', 'delete_file', 'edit_block'],
			},
			enabled: true,
		},
	],
};
