/**
 * Logger Utility
 *
 * Purpose: Structured logging with levels and formatting for CLI output
 * Exports: Logger class, createLogger(), log levels
 * Related: audit-logger.ts
 */

import chalk from 'chalk';

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
	Silent = 4,
}

export interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamp?: boolean;
	color?: boolean;
	output?: 'stdout' | 'stderr';
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
	timestamp?: Date;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

/**
 * Logger provides structured logging with configurable levels
 *
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Optional timestamps
 * - Color-coded output
 * - Contextual metadata
 * - Configurable output stream
 */
export class Logger {
	private level: LogLevel;
	private prefix: string;
	private timestamp: boolean;
	private color: boolean;
	private output: NodeJS.WriteStream;

	constructor(options: LoggerOptions = {}) {
		this.level = options.level ?? LogLevel.Info;
		this.prefix = options.prefix ?? '';
		this.timestamp = options.timestamp ?? false;
		this.color = options.color ?? true;
		this.output = options.output === 'stderr' ? process.stderr : process.stdout;
	}

	/**
	 * Set the log level
	 */
	setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Get the current log level
	 */
	getLevel(): LogLevel {
		return this.level;
	}

	/**
	 * Enable or disable color output
	 */
	setColor(enabled: boolean): void {
		this.color = enabled;
	}

	/**
	 * Log a debug message
	 */
	debug(message: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.Debug, message, context);
	}

	/**
	 * Log an info message
	 */
	info(message: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.Info, message, context);
	}

	/**
	 * Log a warning message
	 */
	warn(message: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.Warn, message, context);
	}

	/**
	 * Log an error message
	 */
	error(message: string, context?: Record<string, unknown> | Error): void {
		if (context instanceof Error) {
			this.log(LogLevel.Error, message, {
				error: context.message,
				stack: context.stack,
			});
		} else {
			this.log(LogLevel.Error, message, context);
		}
	}

	/**
	 * Log a success message (info level with green color)
	 */
	success(message: string, context?: Record<string, unknown>): void {
		this.log(LogLevel.Info, message, context, 'success');
	}

	/**
	 * Create a child logger with additional prefix
	 */
	withPrefix(additionalPrefix: string): Logger {
		return new Logger({
			level: this.level,
			prefix: this.prefix
				? `${this.prefix}:${additionalPrefix}`
				: additionalPrefix,
			timestamp: this.timestamp,
			color: this.color,
			output: this.output === process.stderr ? 'stderr' : 'stdout',
		});
	}

	/**
	 * Internal log method
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		specialType?: 'success',
	): void {
		if (level < this.level) {
			return;
		}

		const parts: string[] = [];

		// Add timestamp if enabled
		if (this.timestamp) {
			const now = new Date();
			parts.push(chalk.gray(now.toISOString()));
		}

		// Add level label
		const levelLabel = this.getLevelLabel(level, specialType);
		parts.push(levelLabel);

		// Add prefix if set
		if (this.prefix) {
			parts.push(chalk.gray(`[${this.prefix}]`));
		}

		// Add message
		parts.push(message);

		// Format the main log line
		let logLine = parts.join(' ');

		// Write the main log line
		this.output.write(logLine + '\n');

		// Write context if provided
		if (context && Object.keys(context).length > 0) {
			const contextStr = this.formatContext(context);
			this.output.write(chalk.gray(contextStr) + '\n');
		}
	}

	/**
	 * Get the colored label for a log level
	 */
	private getLevelLabel(level: LogLevel, specialType?: 'success'): string {
		if (!this.color) {
			return `[${LogLevel[level]}]`;
		}

		switch (level) {
			case LogLevel.Debug:
				return chalk.gray('[DEBUG]');
			case LogLevel.Info:
				return specialType === 'success'
					? chalk.green('[SUCCESS]')
					: chalk.blue('[INFO]');
			case LogLevel.Warn:
				return chalk.yellow('[WARN]');
			case LogLevel.Error:
				return chalk.red('[ERROR]');
			default:
				return `[${LogLevel[level]}]`;
		}
	}

	/**
	 * Format context object for display
	 */
	private formatContext(context: Record<string, unknown>): string {
		const parts: string[] = [];
		for (const [key, value] of Object.entries(context)) {
			if (value === undefined) {
				continue;
			}
			const valueStr =
				typeof value === 'string' ? value : JSON.stringify(value, null, 2);
			parts.push(`  ${key}: ${valueStr}`);
		}
		return parts.join('\n');
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
	return new Logger(options);
}

/**
 * Create a logger for a specific module
 */
export function createModuleLogger(
	moduleName: string,
	level?: LogLevel,
): Logger {
	return new Logger({
		level,
		prefix: moduleName,
		timestamp: true,
		color: true,
	});
}

/**
 * Create a silent logger (no output)
 */
export function createSilentLogger(): Logger {
	return new Logger({level: LogLevel.Silent});
}

/**
 * Create a verbose logger (all levels)
 */
export function createVerboseLogger(): Logger {
	return new Logger({level: LogLevel.Debug, timestamp: true});
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

let globalLogger: Logger = createLogger();

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
	return globalLogger;
}

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
	globalLogger = logger;
}

/**
 * Set the global log level
 */
export function setLogLevel(level: LogLevel): void {
	globalLogger.setLevel(level);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const log = {
	debug: (message: string, context?: Record<string, unknown>) =>
		globalLogger.debug(message, context),
	info: (message: string, context?: Record<string, unknown>) =>
		globalLogger.info(message, context),
	warn: (message: string, context?: Record<string, unknown>) =>
		globalLogger.warn(message, context),
	error: (message: string, context?: Record<string, unknown> | Error) =>
		globalLogger.error(message, context),
	success: (message: string, context?: Record<string, unknown>) =>
		globalLogger.success(message, context),
};

export default Logger;
