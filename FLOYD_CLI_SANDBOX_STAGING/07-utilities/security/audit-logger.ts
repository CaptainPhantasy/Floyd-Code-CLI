/**
 * Audit Logger
 *
 * Purpose: Security audit logging for tool calls, file operations, and API requests
 * Exports: AuditLogger class, logToolCall, logFileAccess, logApiCall, getAuditLog
 * Related: secret-manager.ts, validation/schema-validator.ts
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {v4 as uuidv4} from 'uuid';

/**
 * Audit log entry types
 */
export enum AuditEventType {
	ToolCall = 'tool_call',
	FileAccess = 'file_access',
	FileRead = 'file_read',
	FileWrite = 'file_write',
	FileDelete = 'file_delete',
	ApiCall = 'api_call',
	ApiResponse = 'api_response',
	AuthAttempt = 'auth_attempt',
	PermissionRequest = 'permission_request',
	SecurityViolation = 'security_violation',
	ConfigChange = 'config_change',
	Error = 'error',
}

/**
 * Security severity levels
 */
export enum SecurityLevel {
	Info = 'info',
	Low = 'low',
	Medium = 'medium',
	High = 'high',
	Critical = 'critical',
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
	id: string;
	timestamp: number;
	eventType: AuditEventType;
	severity: SecurityLevel;
	sessionId?: string;
	userId?: string;
	details: Record<string, unknown>;
	metadata?: {
		hostname?: string;
		pid?: number;
		cwd?: string;
	};
}

/**
 * Filter options for retrieving audit logs
 */
export interface AuditLogFilter {
	eventType?: AuditEventType | AuditEventType[];
	severity?: SecurityLevel | SecurityLevel[];
	startDate?: Date;
	endDate?: Date;
	sessionId?: string;
	userId?: string;
	limit?: number;
}

/**
 * Audit statistics
 */
export interface AuditStatistics {
	totalEntries: number;
	entriesByType: Record<string, number>;
	entriesBySeverity: Record<string, number>;
	uniqueSessions: number;
	timeRange: {earliest: number; latest: number} | null;
}

/**
 * AuditLogger provides security audit logging capabilities
 *
 * Features:
 * - Tool call logging with parameters and results
 * - File operation tracking
 * - API request/response logging
 * - Configurable retention and rotation
 * - Statistics and filtering
 */
export class AuditLogger {
	private static readonly AUDIT_DIR = path.join(
		os.homedir(),
		'.floyd',
		'audit',
	);
	private static readonly MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB per file
	private static readonly MAX_LOG_FILES = 10; // Keep 10 log files max
	private static readonly CURRENT_LOG_FILE = 'current.log';
	private static enabledValue = true;
	private static currentSessionId: string = uuidv4();

	/**
	 * Enable or disable audit logging
	 *
	 * @param enabled - Whether to enable logging
	 */
	static setEnabled(enabled: boolean): void {
		this.enabledValue = enabled;
	}

	/**
	 * Check if audit logging is enabled
	 *
	 * @returns true if enabled
	 */
	static isEnabled(): boolean {
		return this.enabledValue;
	}

	/**
	 * Get the current session ID
	 *
	 * @returns Session UUID
	 */
	static getSessionId(): string {
		return this.currentSessionId;
	}

	/**
	 * Set a new session ID
	 *
	 * @param sessionId - New session ID
	 */
	static setSessionId(sessionId: string): void {
		this.currentSessionId = sessionId;
	}

	/**
	 * Generate a new session ID
	 *
	 * @returns New session UUID
	 */
	static regenerateSessionId(): string {
		this.currentSessionId = uuidv4();
		return this.currentSessionId;
	}

	/**
	 * Write an audit log entry
	 *
	 * @param entry - Audit log entry to write
	 */
	private static async writeEntry(entry: AuditLogEntry): Promise<void> {
		if (!this.enabledValue) {
			return;
		}

		try {
			// Ensure audit directory exists
			await fs.ensureDir(this.AUDIT_DIR);

			const logPath = path.join(this.AUDIT_DIR, this.CURRENT_LOG_FILE);

			// Check if we need to rotate the log
			if (await fs.pathExists(logPath)) {
				const stats = await fs.stat(logPath);
				if (stats.size >= this.MAX_LOG_SIZE) {
					await this.rotateLog();
				}
			}

			// Append to log file (one entry per line for easy parsing)
			const logLine = JSON.stringify(entry) + '\n';
			await fs.appendFile(logPath, logLine, {mode: 0o600});

			// Clean up old log files
			await this.cleanOldLogs();
		} catch {
			// Silently fail to avoid disrupting operations
		}
	}

	/**
	 * Rotate the current log file
	 */
	private static async rotateLog(): Promise<void> {
		const logPath = path.join(this.AUDIT_DIR, this.CURRENT_LOG_FILE);

		// Find the next available rotation number
		let rotationNum = 1;
		while (
			await fs.pathExists(
				path.join(this.AUDIT_DIR, `audit-${rotationNum}.log.gz`),
			)
		) {
			rotationNum++;
		}

		// Move current log to rotated name
		// In production, you might want to compress here
		const rotatedPath = path.join(this.AUDIT_DIR, `audit-${rotationNum}.log`);
		await fs.move(logPath, rotatedPath, {overwrite: true});
	}

	/**
	 * Clean up old log files exceeding MAX_LOG_FILES
	 */
	private static async cleanOldLogs(): Promise<void> {
		try {
			const files = await fs.readdir(this.AUDIT_DIR);
			const logFiles = files
				.filter(f => f.startsWith('audit-') && f.endsWith('.log'))
				.map(f => ({
					name: f,
					path: path.join(this.AUDIT_DIR, f),
				}));

			// Sort by modification time (oldest first)
			for (const file of logFiles) {
				file.path; // Access to avoid unused lint
				const stats = await fs.stat(path.join(this.AUDIT_DIR, file.name));
				(file as any).mtime = stats.mtimeMs;
			}
			logFiles.sort((a: any, b: any) => a.mtime - b.mtime);

			// Remove excess files
			if (logFiles.length > this.MAX_LOG_FILES) {
				const toDelete = logFiles.slice(
					0,
					logFiles.length - this.MAX_LOG_FILES,
				);
				for (const file of toDelete) {
					await fs.remove(path.join(this.AUDIT_DIR, file.name));
				}
			}
		} catch {
			// Silently fail
		}
	}

	/**
	 * Create a base audit entry
	 *
	 * @param eventType - Type of event
	 * @param severity - Security level
	 * @param details - Event details
	 * @returns AuditLogEntry
	 */
	private static createEntry(
		eventType: AuditEventType,
		severity: SecurityLevel,
		details: Record<string, unknown>,
	): AuditLogEntry {
		return {
			id: uuidv4(),
			timestamp: Date.now(),
			eventType,
			severity,
			sessionId: this.currentSessionId,
			details,
			metadata: {
				hostname: os.hostname(),
				pid: process.pid,
				cwd: process.cwd(),
			},
		};
	}

	/**
	 * Log a tool call event
	 *
	 * @param toolName - Name of the tool being called
	 * @param parameters - Tool parameters (sanitized)
	 * @param result - Tool result (optional)
	 * @param duration - Execution duration in ms (optional)
	 */
	static async logToolCall(
		toolName: string,
		parameters: Record<string, unknown>,
		result?: {
			success: boolean;
			error?: string;
			data?: unknown;
		},
		duration?: number,
	): Promise<void> {
		const entry = this.createEntry(
			AuditEventType.ToolCall,
			result?.success === false ? SecurityLevel.High : SecurityLevel.Info,
			{
				toolName,
				parameters: this.sanitizeParameters(parameters),
				result: result
					? {
							success: result.success,
							error: result.error,
							hasData: result.data !== undefined,
					  }
					: undefined,
				duration,
			},
		);

		await this.writeEntry(entry);
	}

	/**
	 * Log a file access event
	 *
	 * @param operation - Type of file operation
	 * @param filePath - Path to file
	 * @param result - Operation result
	 */
	static async logFileAccess(
		operation: 'read' | 'write' | 'delete' | 'access',
		filePath: string,
		result?: {
			success: boolean;
			error?: string;
			size?: number;
		},
	): Promise<void> {
		const eventTypeMap = {
			read: AuditEventType.FileRead,
			write: AuditEventType.FileWrite,
			delete: AuditEventType.FileDelete,
			access: AuditEventType.FileAccess,
		};

		const entry = this.createEntry(
			eventTypeMap[operation],
			result?.success === false ? SecurityLevel.Medium : SecurityLevel.Low,
			{
				operation,
				filePath: this.sanitizePath(filePath),
				result: result
					? {
							success: result.success,
							error: result.error,
							size: result.size,
					  }
					: undefined,
			},
		);

		await this.writeEntry(entry);
	}

	/**
	 * Log an API call event
	 *
	 * @param endpoint - API endpoint being called
	 * @param method - HTTP method
	 * @param requestDetails - Request details (sanitized)
	 * @param responseDetails - Response details (optional)
	 */
	static async logApiCall(
		endpoint: string,
		method: string,
		requestDetails?: {
			model?: string;
			maxTokens?: number;
			hasTools?: boolean;
			hasMessages?: boolean;
		},
		responseDetails?: {
			statusCode?: number;
			success: boolean;
			error?: string;
			inputTokens?: number;
			outputTokens?: number;
		},
	): Promise<void> {
		const entry = this.createEntry(
			AuditEventType.ApiCall,
			responseDetails?.success === false
				? SecurityLevel.High
				: SecurityLevel.Info,
			{
				endpoint: this.sanitizeUrl(endpoint),
				method,
				request: requestDetails,
				response: responseDetails,
			},
		);

		await this.writeEntry(entry);
	}

	/**
	 * Log a security violation
	 *
	 * @param violation - Type of violation
	 * @param details - Violation details
	 */
	static async logSecurityViolation(
		violation: string,
		details: Record<string, unknown>,
	): Promise<void> {
		const entry = this.createEntry(
			AuditEventType.SecurityViolation,
			SecurityLevel.High,
			{
				violation,
				details,
			},
		);

		await this.writeEntry(entry);
	}

	/**
	 * Log a permission request
	 *
	 * @param resource - Resource being accessed
	 * @param action - Action being requested
	 * @param granted - Whether permission was granted
	 */
	static async logPermissionRequest(
		resource: string,
		action: string,
		granted: boolean,
	): Promise<void> {
		const entry = this.createEntry(
			AuditEventType.PermissionRequest,
			granted ? SecurityLevel.Info : SecurityLevel.Medium,
			{
				resource: this.sanitizePath(resource),
				action,
				granted,
			},
		);

		await this.writeEntry(entry);
	}

	/**
	 * Log an error event
	 *
	 * @param error - Error message or object
	 * @param context - Additional context
	 */
	static async logError(
		error: Error | string,
		context?: Record<string, unknown>,
	): Promise<void> {
		const entry = this.createEntry(AuditEventType.Error, SecurityLevel.Low, {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
			context,
		});

		await this.writeEntry(entry);
	}

	/**
	 * Retrieve audit log entries
	 *
	 * @param filter - Filter options
	 * @returns Array of audit log entries
	 */
	static async getAuditLog(filter?: AuditLogFilter): Promise<AuditLogEntry[]> {
		try {
			const logPath = path.join(this.AUDIT_DIR, this.CURRENT_LOG_FILE);
			if (!(await fs.pathExists(logPath))) {
				return [];
			}

			const content = await fs.readFile(logPath, 'utf8');
			const lines = content.trim().split('\n').filter(Boolean);

			const entries: AuditLogEntry[] = [];
			for (const line of lines) {
				try {
					entries.push(JSON.parse(line));
				} catch {
					// Skip invalid lines
				}
			}

			// Apply filters
			return this.filterEntries(entries, filter);
		} catch {
			return [];
		}
	}

	/**
	 * Get audit statistics
	 *
	 * @param filter - Optional filter for statistics
	 * @returns Audit statistics
	 */
	static async getStatistics(
		filter?: AuditLogFilter,
	): Promise<AuditStatistics> {
		const entries = await this.getAuditLog(filter);

		const entriesByType: Record<string, number> = {};
		const entriesBySeverity: Record<string, number> = {};
		const sessions = new Set<string>();
		let earliest = Infinity;
		let latest = -Infinity;

		for (const entry of entries) {
			entriesByType[entry.eventType] =
				(entriesByType[entry.eventType] || 0) + 1;
			entriesBySeverity[entry.severity] =
				(entriesBySeverity[entry.severity] || 0) + 1;

			if (entry.sessionId) {
				sessions.add(entry.sessionId);
			}

			if (entry.timestamp < earliest) {
				earliest = entry.timestamp;
			}
			if (entry.timestamp > latest) {
				latest = entry.timestamp;
			}
		}

		return {
			totalEntries: entries.length,
			entriesByType,
			entriesBySeverity,
			uniqueSessions: sessions.size,
			timeRange: earliest < Infinity ? {earliest, latest} : null,
		};
	}

	/**
	 * Clear the audit log
	 *
	 * @param beforeDate - Optional date to clear entries before
	 */
	static async clearLog(beforeDate?: Date): Promise<void> {
		try {
			if (beforeDate) {
				const entries = await this.getAuditLog();
				const filtered = entries.filter(
					e => e.timestamp >= beforeDate.getTime(),
				);

				const logPath = path.join(this.AUDIT_DIR, this.CURRENT_LOG_FILE);
				const content = filtered.map(e => JSON.stringify(e)).join('\n') + '\n';
				await fs.writeFile(logPath, content, {mode: 0o600});
			} else {
				const logPath = path.join(this.AUDIT_DIR, this.CURRENT_LOG_FILE);
				await fs.remove(logPath);
			}
		} catch {
			// Silently fail
		}
	}

	/**
	 * Apply filters to audit entries
	 */
	private static filterEntries(
		entries: AuditLogEntry[],
		filter?: AuditLogFilter,
	): AuditLogEntry[] {
		if (!filter) {
			return entries;
		}

		let filtered = entries;

		if (filter.eventType) {
			const types = Array.isArray(filter.eventType)
				? filter.eventType
				: [filter.eventType];
			filtered = filtered.filter(e => types.includes(e.eventType));
		}

		if (filter.severity) {
			const severities = Array.isArray(filter.severity)
				? filter.severity
				: [filter.severity];
			filtered = filtered.filter(e => severities.includes(e.severity));
		}

		if (filter.startDate) {
			filtered = filtered.filter(
				e => e.timestamp >= filter.startDate!.getTime(),
			);
		}

		if (filter.endDate) {
			filtered = filtered.filter(e => e.timestamp <= filter.endDate!.getTime());
		}

		if (filter.sessionId) {
			filtered = filtered.filter(e => e.sessionId === filter.sessionId);
		}

		if (filter.userId) {
			filtered = filtered.filter(e => e.userId === filter.userId);
		}

		if (filter.limit) {
			filtered = filtered.slice(-filter.limit);
		}

		return filtered;
	}

	/**
	 * Sanitize parameters for logging (remove sensitive data)
	 */
	private static sanitizeParameters(
		params: Record<string, unknown>,
	): Record<string, unknown> {
		const sanitized: Record<string, unknown> = {};
		const sensitiveKeys = [
			'apiKey',
			'token',
			'password',
			'secret',
			'key',
			'auth',
		];

		for (const [key, value] of Object.entries(params)) {
			const lowerKey = key.toLowerCase();
			if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'object' && value !== null) {
				sanitized[key] = this.sanitizeParameters(
					value as Record<string, unknown>,
				);
			} else {
				sanitized[key] = value;
			}
		}

		return sanitized;
	}

	/**
	 * Sanitize a file path for logging
	 */
	private static sanitizePath(filePath: string): string {
		// Replace home directory with ~
		const homeDir = os.homedir();
		if (filePath.startsWith(homeDir)) {
			return '~' + filePath.slice(homeDir.length);
		}
		return filePath;
	}

	/**
	 * Sanitize a URL for logging
	 */
	private static sanitizeUrl(url: string): string {
		try {
			const parsed = new URL(url);
			// Remove query parameters that might contain sensitive data
			parsed.search = '';
			// Remove password from URL
			parsed.password = '';
			return parsed.toString();
		} catch {
			return url;
		}
	}
}

/**
 * Convenience function to log a tool call
 *
 * @param toolName - Name of the tool
 * @param parameters - Tool parameters
 * @param result - Tool result
 * @param duration - Execution duration
 */
export async function logToolCall(
	toolName: string,
	parameters: Record<string, unknown>,
	result?: {
		success: boolean;
		error?: string;
		data?: unknown;
	},
	duration?: number,
): Promise<void> {
	return AuditLogger.logToolCall(toolName, parameters, result, duration);
}

/**
 * Convenience function to log file access
 *
 * @param operation - File operation type
 * @param filePath - Path to file
 * @param result - Operation result
 */
export async function logFileAccess(
	operation: 'read' | 'write' | 'delete' | 'access',
	filePath: string,
	result?: {
		success: boolean;
		error?: string;
		size?: number;
	},
): Promise<void> {
	return AuditLogger.logFileAccess(operation, filePath, result);
}

/**
 * Convenience function to log an API call
 *
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param requestDetails - Request details
 * @param responseDetails - Response details
 */
export async function logApiCall(
	endpoint: string,
	method: string,
	requestDetails?: {
		model?: string;
		maxTokens?: number;
		hasTools?: boolean;
		hasMessages?: boolean;
	},
	responseDetails?: {
		statusCode?: number;
		success: boolean;
		error?: string;
		inputTokens?: number;
		outputTokens?: number;
	},
): Promise<void> {
	return AuditLogger.logApiCall(
		endpoint,
		method,
		requestDetails,
		responseDetails,
	);
}

/**
 * Convenience function to get audit log
 *
 * @param filter - Filter options
 * @returns Array of audit log entries
 */
export async function getAuditLog(
	filter?: AuditLogFilter,
): Promise<AuditLogEntry[]> {
	return AuditLogger.getAuditLog(filter);
}
