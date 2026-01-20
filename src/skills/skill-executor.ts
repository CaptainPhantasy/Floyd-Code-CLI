/**
 * Skill Executor
 *
 * Handles execution of skill tools and commands with proper context management,
 * error handling, and lifecycle hook execution.
 *
 * @module skills/skill-executor
 */

import type {
	SkillDefinition,
	SkillExecutionContext,
	SkillExecutionResult,
	SkillInstance,
	SkillTool,
	SkillToolHandler,
	SkillCommandHandler,
} from './skill-definition.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Skill executor options
 */
export interface SkillExecutorOptions {
	/** Maximum execution time in ms */
	timeout?: number;

	/** Enable execution logging */
	enableLogging?: boolean;

	/** Default working directory */
	defaultCwd?: string;

	/** Default session ID */
	defaultSessionId?: string;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext extends SkillExecutionContext {
	/** Tool being executed */
	tool: SkillTool;

	/** Skill that owns the tool */
	skill: SkillInstance;

	/** Execution timeout */
	timeout: number;
}

/**
 * Command execution context
 */
export interface CommandExecutionContext extends SkillExecutionContext {
	/** Command arguments */
	args: string[];

	/** Raw input */
	input: string;

	/** Skill that owns the command */
	skill: SkillInstance;
}

// ============================================================================
// SKILL EXECUTOR CLASS
// ============================================================================

/**
 * SkillExecutor - Handles skill tool and command execution
 *
 * Manages the execution lifecycle for skill tools and commands:
 * 1. Pre-execution hooks
 * 2. Input validation
 * 3. Handler execution (with timeout)
 * 4. Post-execution hooks
 * 5. Result formatting
 */
export class SkillExecutor {
	private readonly options: Required<SkillExecutorOptions>;
	private readonly executionHistory: SkillExecutionResult[] = [];

	constructor(options: SkillExecutorOptions = {}) {
		this.options = {
			timeout: options.timeout ?? 30000,
			enableLogging: options.enableLogging ?? true,
			defaultCwd: options.defaultCwd ?? process.cwd(),
			defaultSessionId: options.defaultSessionId ?? 'default',
		};
	}

	/**
	 * Execute a skill tool
	 */
	async executeTool(
		skill: SkillInstance,
		toolName: string,
		input: Record<string, unknown> = {},
		context?: Partial<SkillExecutionContext>,
	): Promise<SkillExecutionResult> {
		const startTime = Date.now();

		// Find the tool
		const tool = skill.definition.tools?.find(t => t.name === toolName);
		if (!tool) {
			return {
				success: false,
				error: `Tool not found: ${toolName}`,
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};
		}

		// Build execution context
		const executionContext: ToolExecutionContext = {
			cwd: context?.cwd ?? this.options.defaultCwd,
			env: context?.env ?? process.env as Record<string, string>,
			sessionId: context?.sessionId ?? this.options.defaultSessionId,
			invoker: context?.invoker ?? 'agent',
			input,
			metadata: context?.metadata,
			tool,
			skill,
			timeout: tool.dangerous ? 0 : this.options.timeout,
		};

		try {
			// Validate input
			await this.validateInput(tool, input);

			// Call beforeExecution hook
			if (skill.definition.hooks?.beforeExecution) {
				await skill.definition.hooks.beforeExecution(executionContext);
			}

			// Execute tool handler
			const result = await this.executeWithTimeout(
				tool.handler,
				[input, executionContext],
				executionContext.timeout,
			);

			// Call afterExecution hook
			if (skill.definition.hooks?.afterExecution) {
				await skill.definition.hooks.afterExecution(executionContext, result);
			}

			const executionResult: SkillExecutionResult = {
				success: true,
				data: result,
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};

			// Log execution
			if (this.options.enableLogging) {
				this.logExecution(executionResult);
			}

			// Store in history
			this.executionHistory.push(executionResult);

			return executionResult;
		} catch (error) {
			const executionResult: SkillExecutionResult = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};

			// Log failure
			if (this.options.enableLogging) {
				this.logExecution(executionResult);
			}

			// Store in history
			this.executionHistory.push(executionResult);

			return executionResult;
		}
	}

	/**
	 * Execute a skill command
	 */
	async executeCommand(
		skill: SkillInstance,
		commandName: string,
		args: string[],
		input: string,
		context?: Partial<SkillExecutionContext>,
	): Promise<SkillExecutionResult> {
		const startTime = Date.now();

		// Find the command
		const command = skill.definition.commands?.find(c => c.name === commandName);
		if (!command) {
			return {
				success: false,
				error: `Command not found: ${commandName}`,
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};
		}

		// Build execution context
		const executionContext: CommandExecutionContext = {
			cwd: context?.cwd ?? this.options.defaultCwd,
			env: context?.env ?? process.env as Record<string, string>,
			sessionId: context?.sessionId ?? this.options.defaultSessionId,
			invoker: 'user',
			input,
			metadata: context?.metadata,
			args,
			skill,
		};

		try {
			// Call beforeExecution hook
			if (skill.definition.hooks?.beforeExecution) {
				await skill.definition.hooks.beforeExecution(executionContext);
			}

			// Execute command handler
			await command.handler(args, executionContext);

			// Call afterExecution hook
			if (skill.definition.hooks?.afterExecution) {
				await skill.definition.hooks.afterExecution(executionContext, undefined);
			}

			const executionResult: SkillExecutionResult = {
				success: true,
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};

			// Log execution
			if (this.options.enableLogging) {
				this.logExecution(executionResult);
			}

			// Store in history
			this.executionHistory.push(executionResult);

			return executionResult;
		} catch (error) {
			const executionResult: SkillExecutionResult = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
				skillId: skill.metadata.id,
			};

			// Log failure
			if (this.options.enableLogging) {
				this.logExecution(executionResult);
			}

			// Store in history
			this.executionHistory.push(executionResult);

			return executionResult;
		}
	}

	/**
	 * Execute a handler with timeout
	 */
	private async executeWithTimeout<T>(
		handler: SkillToolHandler,
		args: Parameters<SkillToolHandler>,
		timeout: number,
	): Promise<T> {
		if (timeout === 0) {
			// No timeout
			return handler(...args) as T;
		}

		return Promise.race([
			handler(...args) as Promise<T>,
			new Promise<T>((_, reject) =>
				setTimeout(
					() => reject(new Error(`Execution timeout after ${timeout}ms`)),
					timeout,
				),
			),
		]);
	}

	/**
	 * Validate input against tool parameters
	 */
	private async validateInput(
		tool: SkillTool,
		input: Record<string, unknown>,
	): Promise<void> {
		if (!tool.parameters) {
			return;
		}

		const errors: string[] = [];

		for (const param of tool.parameters) {
			const value = input[param.name];

			// Check required parameters
			if (param.required && (value === undefined || value === null)) {
				errors.push(`Missing required parameter: ${param.name}`);
				continue;
			}

			// Skip validation if value is missing and not required
			if (value === undefined || value === null) {
				continue;
			}

			// Type validation
			switch (param.type) {
				case 'string':
					if (typeof value !== 'string') {
						errors.push(`Parameter ${param.name} must be a string`);
					} else if (param.pattern && !param.pattern.test(value)) {
						errors.push(`Parameter ${param.name} does not match required pattern`);
					}
					break;

				case 'number':
					if (typeof value !== 'number') {
						errors.push(`Parameter ${param.name} must be a number`);
					}
					break;

				case 'boolean':
					if (typeof value !== 'boolean') {
						errors.push(`Parameter ${param.name} must be a boolean`);
					}
					break;

				case 'array':
					if (!Array.isArray(value)) {
						errors.push(`Parameter ${param.name} must be an array`);
					}
					break;

				case 'object':
					if (typeof value !== 'object' || Array.isArray(value)) {
						errors.push(`Parameter ${param.name} must be an object`);
					}
					break;
			}

			// Enum validation
			if (param.enum && !param.enum.includes(value)) {
				errors.push(
					`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`,
				);
			}
		}

		if (errors.length > 0) {
			throw new Error(`Input validation failed:\n${errors.join('\n')}`);
		}
	}

	/**
	 * Log execution result
	 */
	private logExecution(result: SkillExecutionResult): void {
		if (result.success) {
			console.log(
				`✓ Skill executed: ${result.skillId} (${result.duration}ms)`,
			);
		} else {
			console.error(
				`✗ Skill execution failed: ${result.skillId} - ${result.error} (${result.duration}ms)`,
			);
		}
	}

	/**
	 * Get execution history
	 */
	getHistory(): SkillExecutionResult[] {
		return [...this.executionHistory];
	}

	/**
	 * Clear execution history
	 */
	clearHistory(): void {
		this.executionHistory.length = 0;
	}

	/**
	 * Get execution statistics
	 */
	getStats(): {
		totalExecutions: number;
		successfulExecutions: number;
		failedExecutions: number;
		averageDuration: number;
	} {
		const total = this.executionHistory.length;
		const successful = this.executionHistory.filter(r => r.success).length;
		const failed = total - successful;
		const totalDuration = this.executionHistory.reduce(
			(sum, r) => sum + r.duration,
			0,
		);

		return {
			totalExecutions: total,
			successfulExecutions: successful,
			failedExecutions: failed,
			averageDuration: total > 0 ? totalDuration / total : 0,
		};
	}
}

// ============================================================================
// DEFAULT EXECUTOR INSTANCE
// ============================================================================

/**
 * Default global skill executor instance
 */
let defaultExecutor: SkillExecutor | null = null;

/**
 * Get or create the default executor
 */
export function getDefaultExecutor(
	options?: SkillExecutorOptions,
): SkillExecutor {
	if (!defaultExecutor) {
		defaultExecutor = new SkillExecutor(options);
	}
	return defaultExecutor;
}

/**
 * Reset the default executor (useful for testing)
 */
export function resetDefaultExecutor(): void {
	defaultExecutor = null;
}

export default SkillExecutor;
