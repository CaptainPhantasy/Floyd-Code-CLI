/**
 * PHASE 5 ITEM 22: Hooks System - Hook Manager
 *
 * Manages hook registration, execution, and lifecycle.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import {
	type Hook,
	type HookEvent,
	type HookContext,
	type HookResult,
	type IHookManager,
	type HooksConfig,
	type BuiltinHandler,
	DEFAULT_HOOKS_CONFIG,
} from './types.js';
import { builtinHandlers } from './builtin-handlers.js';

/**
 * Hook Manager - Main implementation
 */
export class HookManager implements IHookManager {
	private hooks: Map<HookEvent, Hook[]> = new Map();
	private hooksPath: string;

	constructor(hooksPath?: string) {
		this.hooksPath = hooksPath || path.join(process.cwd(), '.floyd', 'hooks.json');
		this.initializeDefaultHooks();
	}

	/**
	 * Initialize with default hooks
	 */
	private initializeDefaultHooks(): void {
		for (const hook of DEFAULT_HOOKS_CONFIG.hooks) {
			if (hook.enabled) {
				this.register(hook.event, hook);
			}
		}
	}

	/**
	 * Register a hook for an event
	 */
	register(event: HookEvent, hook: Hook): void {
		if (!this.hooks.has(event)) {
			this.hooks.set(event, []);
		}
		this.hooks.get(event)!.push(hook);
	}

	/**
	 * Unregister a hook by event and unique ID
	 */
	unregister(event: HookEvent, id: string): void {
		const eventHooks = this.hooks.get(event);
		if (eventHooks) {
			this.hooks.set(
				event,
				eventHooks.filter(h => this.generateId(h) !== id)
			);
		}
	}

	/**
	 * Execute all hooks for an event
	 */
	async execute(event: HookEvent, context: HookContext): Promise<HookResult[]> {
		const eventHooks = this.hooks.get(event) || [];
		const results: HookResult[] = [];

		for (const hook of eventHooks) {
			if (!hook.enabled) continue;

			// Check filter conditions
			if (!this.matchesFilter(hook, context)) continue;

			const result = await this.executeHook(hook, context);
			results.push(result);

			// If hook failed and event is PreToolUse, stop execution
			if (!result.success && event === 'PreToolUse') {
				break;
			}
		}

		return results;
	}

	/**
	 * Check if hook matches the filter conditions
	 */
	private matchesFilter(hook: Hook, context: HookContext): boolean {
		if (!hook.filter) return true;

		const { filter } = hook;

		// Tool filter
		if (filter.tools && filter.tools.length > 0) {
			if (!context.toolName || !filter.tools.includes(context.toolName)) {
				return false;
			}
		}

		// Tool exclude filter
		if (filter.toolsExclude && filter.toolsExclude.length > 0) {
			if (context.toolName && filter.toolsExclude.includes(context.toolName)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Execute a single hook
	 */
	private async executeHook(hook: Hook, context: HookContext): Promise<HookResult> {
		const startTime = Date.now();

		try {
			if (hook.handler) {
				return await this.executeBuiltin(hook.handler, context);
			} else if (hook.command) {
				return await this.executeCommand(hook.command, context, hook.timeout);
			}

			return {
				success: false,
				error: 'Hook has no command or handler',
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Execute shell command hook
	 */
	private async executeCommand(
		command: string,
		context: HookContext,
		timeout = 5000
	): Promise<HookResult> {
		// Expand context variables in command
		const expandedCommand = this.expandCommand(command, context);

		return new Promise((resolve) => {
			const child = spawn(expandedCommand, {
				shell: true,
				env: { ...process.env, ...context.env },
				timeout,
			});

			let stdout = '';
			let stderr = '';

			child.stdout?.on('data', (data) => {
				stdout += data.toString();
			});

			child.stderr?.on('data', (data) => {
				stderr += data.toString();
			});

			child.on('close', (code) => {
				resolve({
					success: code === 0,
					output: stdout || stderr,
					error: code !== 0 ? `Exit code ${code}` : undefined,
					duration: 0, // Will be set by caller
				});
			});

			child.on('error', (error) => {
				resolve({
					success: false,
					error: error.message,
					duration: 0,
				});
			});
		});
	}

	/**
	 * Execute built-in handler hook
	 */
	private async executeBuiltin(handler: string, context: HookContext): Promise<HookResult> {
		const builtin = builtinHandlers[handler as BuiltinHandler];
		if (!builtin) {
			return {
				success: false,
				error: `Unknown built-in handler: ${handler}`,
				duration: 0,
			};
		}

		const startTime = Date.now();
		const result = await builtin(context);
		return {
			...result,
			duration: Date.now() - startTime,
		};
	}

	/**
	 * Expand variables in command string
	 */
	private expandCommand(command: string, context: HookContext): string {
		return command
			.replace(/\$EVENT/g, context.event)
			.replace(/\$TOOL/g, context.toolName || '')
			.replace(/\$SESSION/g, context.sessionId || '')
			.replace(/\$TIMESTAMP/g, context.timestamp.toString());
	}

	/**
	 * Generate unique ID for hook
	 */
	private generateId(hook: Hook): string {
		const parts: string[] = [hook.event];
		if (hook.command) parts.push(hook.command);
		if (hook.handler) parts.push(hook.handler);
		return parts.join(':');
	}

	/**
	 * Load hooks from configuration file
	 */
	async loadFromFile(filePath?: string): Promise<void> {
		const targetPath = filePath || this.hooksPath;

		try {
			const content = await fs.readFile(targetPath, 'utf-8');
			const config: HooksConfig = JSON.parse(content);

			// Clear existing hooks
			this.hooks.clear();

			// Register hooks from config
			for (const hook of config.hooks) {
				if (hook.enabled) {
					this.register(hook.event, hook);
				}
			}
		} catch (error) {
			// File doesn't exist or is invalid - use defaults
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.warn(`Invalid hooks config at ${targetPath}:`, error);
			}
		}
	}

	/**
	 * Save hooks to configuration file
	 */
	async saveToFile(filePath?: string): Promise<void> {
		const targetPath = filePath || this.hooksPath;

		const hooks: Hook[] = [];
		for (const [event, eventHooks] of this.hooks.entries()) {
			hooks.push(...eventHooks);
		}

		const config: HooksConfig = {
			version: 1,
			hooks,
		};

		// Ensure directory exists
		await fs.mkdir(path.dirname(targetPath), { recursive: true });

		await fs.writeFile(targetPath, JSON.stringify(config, null, 2), 'utf-8');
	}

	/**
	 * Get all registered hooks
	 */
	getAllHooks(): Map<HookEvent, Hook[]> {
		return new Map(this.hooks);
	}
}

/**
 * Singleton instance for global access
 */
let globalHookManager: HookManager | null = null;

export function getHookManager(): HookManager {
	if (!globalHookManager) {
		globalHookManager = new HookManager();
		globalHookManager.loadFromFile().catch(() => {
			// Ignore load errors, will use defaults
		});
	}
	return globalHookManager;
}

export function resetHookManager(): void {
	globalHookManager = null;
}
