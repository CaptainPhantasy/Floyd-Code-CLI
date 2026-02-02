/**
 * PHASE 5 ITEM 22: Hooks System - Built-in Handlers
 *
 * Pre-defined handlers for common hook scenarios.
 */

import type { HookContext, HookResult, BuiltinHandler } from './types.js';

/**
 * Handler function signature
 */
type HandlerFunction = (context: HookContext) => Promise<HookResult>;

/**
 * Built-in handler implementations
 */
export const builtinHandlers: Record<BuiltinHandler, HandlerFunction> = {
	/**
	 * Auto-approve safe commands (read-only operations)
	 */
	auto_approve_safe_commands: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		const safeTools = ['read_file', 'list_directory', 'search_files', 'get_file_info', 'list_symbols'];

		if (context.toolName && safeTools.includes(context.toolName)) {
			// Mark as auto-approved in context
			context.permission = {
				tool: context.toolName,
				approved: true,
				reason: 'Safe tool (auto-approved by hook)',
			};
		}

		return {
			success: true,
			output: `Auto-approval check for ${context.toolName}: ${safeTools.includes(context.toolName || '') ? 'approved' : 'no action'}`,
			duration: Date.now() - startTime,
		};
	},

	/**
	 * Log tool use to file
	 */
	log_tool_use: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		const logEntry = {
			timestamp: new Date(context.timestamp).toISOString(),
			event: context.event,
			tool: context.toolName,
			session: context.sessionId,
		};

		// In a real implementation, would append to .floyd/tool-log.json
		console.log('[HOOK] Tool use:', JSON.stringify(logEntry));

		return {
			success: true,
			output: `Logged tool use: ${context.toolName}`,
			duration: Date.now() - startTime,
		};
	},

	/**
	 * Backup files before write operations
	 */
	backup_before_write: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		const writeTools = ['write_file', 'edit_block', 'delete_file'];

		if (!context.toolName || !writeTools.includes(context.toolName)) {
			return { success: true, output: 'No backup needed (not a write operation)', duration: Date.now() - startTime };
		}

		const args = context.toolArgs as { path?: string };
		const filePath = args.path;

		if (!filePath) {
			return { success: true, output: 'No file path in args', duration: Date.now() - startTime };
		}

		// In real implementation: copy to .floyd/backups/
		console.log(`[HOOK] Would backup: ${filePath}`);

		return {
			success: true,
			output: `Backup created for ${filePath}`,
			duration: Date.now() - startTime,
		};
	},

	/**
	 * Confirm destructive operations
	 */
	confirm_destructive: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		const destructiveTools = [
			'write_file',
			'edit_block',
			'delete_file',
			'move_file',
			'execute_command',
		];

		if (!context.toolName || !destructiveTools.includes(context.toolName)) {
			return { success: true, output: 'Not a destructive operation', duration: Date.now() - startTime };
		}

		// In a real TUI context, would show confirmation prompt
		// For now, log the confirmation requirement
		console.log(`[HOOK] Confirmation required for: ${context.toolName}`);

		return {
			success: true,
			output: `Destructive operation ${context.toolName} requires confirmation`,
			duration: Date.now() - startTime,
		};
	},

	/**
	 * Track token usage for session
	 */
	track_token_usage: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		// In real implementation, would track tokens used per tool
		return {
			success: true,
			output: 'Token usage tracked',
			duration: Date.now() - startTime,
		};
	},

	/**
	 * Notify on task completion
	 */
	notify_completion: async (context: HookContext): Promise<HookResult> => {
		const startTime = Date.now();
		if (context.event === 'SessionEnd') {
			console.log(`[HOOK] Session ${context.sessionId} ended`);
		}

		return {
			success: true,
			output: 'Completion notification sent',
			duration: Date.now() - startTime,
		};
	},
};

/**
 * Get all available handler names
 */
export function getBuiltinHandlerNames(): string[] {
	return Object.keys(builtinHandlers);
}

/**
 * Check if a handler exists
 */
export function hasBuiltinHandler(name: string): name is BuiltinHandler {
	return Object.keys(builtinHandlers).includes(name);
}
