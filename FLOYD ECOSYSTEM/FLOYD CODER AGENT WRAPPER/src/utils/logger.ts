/**
 * Logger Utility
 *
 * Simple, performant logging with levels and optional context.
 * Designed for CLI applications with color support.
 *
 * @module utils/logger
 */

import chalk from 'chalk';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Log entry metadata
 */
export interface LogMetadata {
	/** Timestamp */
	timestamp?: string;

	/** Module/name */
	module?: string;

	/** Additional context */
	[key: string]: unknown;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
	/** Minimum log level */
	level?: LogLevel;

	/** Module name */
	module?: string;

	/** Enable colors */
	colors?: boolean;

	/** Enable timestamps */
	timestamps?: boolean;
}

/**
 * Logger interface
 */
export interface Logger {
	/** Log debug message */
	debug(message: string, meta?: LogMetadata): void;

	/** Log info message */
	info(message: string, meta?: LogMetadata): void;

	/** Log warning message */
	warn(message: string, meta?: LogMetadata): void;

	/** Log error message */
	error(message: string, meta?: LogMetadata): void;

	/** Create a child logger with additional context */
	child(context: string): Logger;

	/** Set log level */
	setLevel(level: LogLevel): void;
}

// ============================================================================
// LOG LEVEL UTILITIES
// ============================================================================

/**
 * Check if a level should be logged based on minimum level
 */
function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
	const levels: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
		silent: 4,
	};

	return levels[level] >= levels[minLevel];
}

/**
 * Format timestamp
 */
function formatTimestamp(): string {
	return new Date().toISOString();
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class ModuleLogger implements Logger {
	private level: LogLevel;
	private readonly module: string;
	private readonly colors: boolean;
	private readonly timestamps: boolean;

	constructor(config: LoggerConfig = {}) {
		this.level = config.level ?? 'info';
		this.module = config.module ?? 'floyd';
		this.colors = config.colors ?? true;
		this.timestamps = config.timestamps ?? true;
	}

	debug(message: string, meta?: LogMetadata): void {
		this.log('debug', message, meta);
	}

	info(message: string, meta?: LogMetadata): void {
		this.log('info', message, meta);
	}

	warn(message: string, meta?: LogMetadata): void {
		this.log('warn', message, meta);
	}

	error(message: string, meta?: LogMetadata): void {
		this.log('error', message, meta);
	}

	child(context: string): Logger {
		return new ModuleLogger({
			level: this.level,
			module: `${this.module}:${context}`,
			colors: this.colors,
			timestamps: this.timestamps,
		});
	}

	setLevel(level: LogLevel): void {
		this.level = level;
	}

	private log(level: LogLevel, message: string, meta?: LogMetadata): void {
		if (!shouldLog(level, this.level)) {
			return;
		}

		const parts: string[] = [];

		// Timestamp
		if (this.timestamps) {
			const ts = meta?.timestamp ?? formatTimestamp();
			parts.push(chalk.gray(`[${ts}]`));
		}

		// Level
		const levelStr = level.toUpperCase().padEnd(5);
		let coloredLevel: string;
		switch (level) {
			case 'debug':
				coloredLevel = chalk.gray(levelStr);
				break;
			case 'info':
				coloredLevel = chalk.blue(levelStr);
				break;
			case 'warn':
				coloredLevel = chalk.yellow(levelStr);
				break;
			case 'error':
				coloredLevel = chalk.red(levelStr);
				break;
			default:
				coloredLevel = levelStr;
		}
		parts.push(coloredLevel);

		// Module
		if (this.module) {
			parts.push(chalk.cyan(`[${this.module}]`));
		}

		// Message
		parts.push(message);

		// Metadata
		if (meta && Object.keys(meta).length > 0) {
			const {timestamp: _ts, ...rest} = meta;
			if (Object.keys(rest).length > 0) {
				parts.push(chalk.gray(JSON.stringify(rest)));
			}
		}

		// Output
		const line = parts.join(' ');
		console.log(line);
	}
}

// ============================================================================
// LOGGER FACTORY
// ============================================================================

/**
 * Create a new logger
 */
export function createModuleLogger(config?: LoggerConfig): Logger {
	return new ModuleLogger(config);
}

/**
 * Default logger instance
 */
export const defaultLogger = new ModuleLogger({
	module: 'floyd',
	level: 'info',
});

/**
 * Get the default logger
 */
export function getLogger(): Logger {
	return defaultLogger;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default {
	createModuleLogger,
	getLogger,
	defaultLogger,
};
