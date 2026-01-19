/**
 * Command Handler
 *
 * Command execution logic with error handling, timeouts, and middleware support.
 * Handles the actual execution of registered CLI commands.
 *
 * @module commands/command-handler
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Command execution context
 */
export interface CommandContext {
	/** Working directory */
	cwd?: string;

	/** Environment variables */
	env?: Record<string, string>;

	/** User input arguments */
	args: string[];

	/** Raw input string */
	input?: string;

	/** Session ID */
	sessionId?: string;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Command handler function type
 */
export type CommandHandlerFn<T = unknown, R = unknown> = (
	args: T,
	context: CommandContext,
) => Promise<R> | R;

/**
 * Command definition
 */
export interface CommandDefinition<T = unknown, R = unknown> {
	/** Unique command name */
	name: string;

	/** Command description */
	description?: string;

	/** Command category/group */
	category?: string;

	/** Alternative names for the command */
	aliases?: string[];

	/** Usage string */
	usage?: string;

	/** Examples */
	examples?: string[];

	/** Handler function */
	handler: CommandHandlerFn<T, R>;

	/** Whether command is hidden from help */
	hidden?: boolean;

	/** Whether command requires confirmation */
	confirm?: boolean;

	/** Confirmation message */
	confirmMessage?: string;

	/** Maximum execution time in ms (0 = no timeout) */
	timeout?: number;

	/** Whether command runs in background */
	background?: boolean;
}

/**
 * Result of a command execution
 */
export interface CommandResult<T = unknown> {
	/** Whether execution was successful */
	success: boolean;

	/** Result data (if successful) */
	data?: T;

	/** Error message (if failed) */
	error?: string;

	/** Error code (if failed) */
	code?: string;

	/** Execution time in ms */
	duration: number;

	/** Command name */
	command: string;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Command error types
 */
export type CommandErrorCode =
	| 'COMMAND_NOT_FOUND'
	| 'INVALID_ARGUMENTS'
	| 'EXECUTION_TIMEOUT'
	| 'EXECUTION_FAILED'
	| 'PERMISSION_DENIED'
	| 'CONFIRMATION_REQUIRED'
	| 'CANCELLED';

/**
 * Command error class
 */
export class CommandError extends Error {
	constructor(
		public code: CommandErrorCode,
		message: string,
		public commandName?: string,
	) {
		super(message);
		this.name = 'CommandError';
	}
}

// ============================================================================
// COMMAND MIDDLEWARE
// ============================================================================

/**
 * Command middleware function
 * Can modify args, block execution, or add side effects
 */
export type CommandMiddleware = (
	args: unknown,
	context: CommandContext,
	next: () => Promise<CommandResult>,
) => Promise<CommandResult>;

/**
 * Middleware pipeline for command execution
 */
export class MiddlewarePipeline<T = unknown> {
	private middlewares: CommandMiddleware[] = [];

	/**
	 * Add a middleware to the pipeline
	 */
	use(middleware: CommandMiddleware): void {
		this.middlewares.push(middleware);
	}

	/**
	 * Execute all middlewares in sequence
	 */
	async execute(
		args: T,
		context: CommandContext,
		handler: () => Promise<CommandResult>,
	): Promise<CommandResult> {
		let index = 0;

		const next = async (): Promise<CommandResult> => {
			if (index >= this.middlewares.length) {
				return handler();
			}
			const middleware = this.middlewares[index++];
			// Middleware is guaranteed to exist due to length check
			return middleware?.(args, context, next) ?? next();
		};

		return next();
	}

	/**
	 * Clear all middlewares
	 */
	clear(): void {
		this.middlewares = [];
	}
}

// ============================================================================
// COMMAND EXECUTOR
// ============================================================================

/**
 * CommandExecutor - Executes commands with error handling
 */
export class CommandExecutor {
	private readonly middleware = new MiddlewarePipeline<unknown>();

	/**
	 * Execute a command definition
	 */
	async execute<T = unknown, R = unknown>(
		definition: CommandDefinition<T, R>,
		args: T,
		context: CommandContext,
	): Promise<CommandResult<R>> {
		const startTime = Date.now();
		const commandName = definition.name;

		try {
			// Run through middleware pipeline
			const result = await this.middleware.execute(args, context, async () => {
				// Check for confirmation requirement
				if (definition.confirm) {
					const message =
						definition.confirmMessage ?? `Execute command "${commandName}"?`;
					// Confirmation is handled by the caller/UI layer
					// We set a flag in context for confirmation handler
					context.metadata = {
						...context.metadata,
						confirmationRequired: true,
						confirmationMessage: message,
					};
				}

				// Execute with timeout if specified
				const timeout = definition.timeout ?? 0;
				if (timeout > 0) {
					return await this.executeWithTimeout(
						definition.handler,
						args,
						context,
						timeout,
					);
				}

				// Execute directly
				const data = await definition.handler(args, context);
				return {
					success: true,
					data: data as R,
					duration: Date.now() - startTime,
					command: commandName,
				};
			});

			return result as CommandResult<R>;
		} catch (error) {
			return this.handleError(
				error,
				commandName,
				startTime,
			) as CommandResult<R>;
		}
	}

	/**
	 * Execute a handler with timeout
	 */
	private async executeWithTimeout<T, R>(
		handler: CommandHandlerFn<T, R>,
		args: T,
		context: CommandContext,
		timeoutMs: number,
	): Promise<CommandResult<R>> {
		const startTime = Date.now();

		return Promise.race([
			// Actual handler execution
			(async () => {
				const data = await handler(args, context);
				return {
					success: true,
					data: data as R,
					duration: Date.now() - startTime,
					command: '',
				};
			})(),
			// Timeout
			new Promise<CommandResult<R>>((_, reject) =>
				setTimeout(
					() =>
						reject(
							new CommandError(
								'EXECUTION_TIMEOUT',
								`Command execution timed out after ${timeoutMs}ms`,
							),
						),
					timeoutMs,
				),
			),
		]);
	}

	/**
	 * Handle execution errors
	 */
	private handleError(
		error: unknown,
		commandName: string,
		startTime: number,
	): CommandResult {
		const duration = Date.now() - startTime;

		if (error instanceof CommandError) {
			return {
				success: false,
				error: error.message,
				code: error.code,
				duration,
				command: commandName,
			};
		}

		if (error instanceof Error) {
			return {
				success: false,
				error: error.message,
				code: 'EXECUTION_FAILED',
				duration,
				command: commandName,
			};
		}

		return {
			success: false,
			error: String(error),
			code: 'EXECUTION_FAILED',
			duration,
			command: commandName,
		};
	}

	/**
	 * Add middleware to the execution pipeline
	 */
	use(middleware: CommandMiddleware): void {
		this.middleware.use(middleware);
	}
}

// ============================================================================
// BUILT-IN MIDDLEWARE
// ============================================================================

/**
 * Logging middleware - logs command execution
 */
export function loggingMiddleware(
	logger: (message: string) => void,
): CommandMiddleware {
	return async (_args, context, next) => {
		const command = context.metadata?.['command'] as string | undefined;
		logger(`[Command] Executing: ${command ?? 'unknown'}`);
		const result = await next();
		logger(
			`[Command] Result: ${result.success ? 'success' : 'failed'} (${
				result.duration
			}ms)`,
		);
		return result;
	};
}

/**
 * Validation middleware - validates arguments
 */
export function validationMiddleware<T>(
	validator: (args: T) => string | null,
): CommandMiddleware {
	return async (args, _context, next) => {
		const error = validator(args as T);
		if (error) {
			return {
				success: false,
				error,
				code: 'INVALID_ARGUMENTS',
				duration: 0,
				command: (_context.metadata?.['command'] as string) ?? 'unknown',
			};
		}
		return next();
	};
}

/**
 * Timing middleware - measures execution time
 */
export function timingMiddleware(): CommandMiddleware {
	return async (_args, _context, next) => {
		const startTime = Date.now();
		const result = await next();
		return {
			...result,
			duration: Date.now() - startTime,
		};
	};
}

/**
 * Retry middleware - retries failed commands
 */
export function retryMiddleware(
	maxRetries: number,
	delay: number = 1000,
): CommandMiddleware {
	let attemptCount = 0;

	return async (_args, context, next) => {
		while (attemptCount <= maxRetries) {
			const result = await next();
			if (result.success || attemptCount === maxRetries) {
				attemptCount = 0; // Reset for next command
				return result;
			}
			attemptCount++;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
		attemptCount = 0;
		return {
			success: false,
			error: `Command failed after ${maxRetries + 1} attempts`,
			code: 'EXECUTION_FAILED',
			duration: 0,
			command: (context.metadata?.['command'] as string) ?? 'unknown',
		};
	};
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a successful command result
 */
export function successResult<T>(
	data: T,
	command: string,
	duration: number = 0,
): CommandResult<T> {
	return {
		success: true,
		data,
		duration,
		command,
	};
}

/**
 * Create a failed command result
 */
export function errorResult(
	error: string,
	command: string,
	code: CommandErrorCode = 'EXECUTION_FAILED',
	duration: number = 0,
): CommandResult {
	return {
		success: false,
		error,
		code,
		duration,
		command,
	};
}

/**
 * Create a command executor with default middleware
 */
export function createExecutor(options?: {
	enableLogging?: boolean;
	logger?: (message: string) => void;
}): CommandExecutor {
	const executor = new CommandExecutor();

	if (options?.enableLogging ?? true) {
		const logger = options?.logger ?? console.log;
		executor.use(loggingMiddleware(logger));
	}

	executor.use(timingMiddleware());

	return executor;
}

export default CommandExecutor;
