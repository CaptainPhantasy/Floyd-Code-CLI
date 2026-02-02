/**
 * Command History
 *
 * Persistent command history management with search, filtering,
 * and deduplication capabilities.
 *
 * @module commands/command-history
 */

import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Command history entry
 */
export interface HistoryEntry {
	/** The command that was executed */
	command: string;

	/** Timestamp when command was executed */
	timestamp: number;

	/** Command arguments */
	args?: string[];

	/** Working directory at time of execution */
	cwd?: string;

	/** Exit code (0 = success) */
	exitCode?: number;

	/** Duration in ms */
	duration?: number;

	/** Session ID */
	sessionId?: string;

	/** Unique entry ID */
	id?: string;
}

/**
 * History storage options
 */
export interface HistoryOptions {
	/** Maximum number of entries to keep */
	maxSize?: number;

	/** Path to history file */
	filePath?: string;

	/** Whether to persist to disk */
	persistent?: boolean;

	/** Deduplicate consecutive entries */
	deduplicate?: boolean;

	/** Session ID for this history session */
	sessionId?: string;
}

/**
 * History search options
 */
export interface HistorySearchOptions {
	/** Filter by command pattern */
	pattern?: string | RegExp;

	/** Filter by minimum timestamp */
	since?: number;

	/** Filter by maximum timestamp */
	until?: number;

	/** Filter by session ID */
	sessionId?: string;

	/** Maximum results to return */
	limit?: number;

	/** Whether to reverse results */
	reverse?: boolean;
}

// ============================================================================
// COMMAND HISTORY CLASS
// ============================================================================

/**
 * CommandHistory - Manages command execution history
 */
export class CommandHistory {
	private entries: HistoryEntry[] = [];
	private readonly options: Required<HistoryOptions>;
	private readonly defaultHistoryPath: string;

	constructor(options: HistoryOptions = {}) {
		this.defaultHistoryPath = path.join(os.homedir(), '.floyd', 'history');

		this.options = {
			maxSize: options.maxSize ?? 1000,
			filePath: options.filePath ?? this.defaultHistoryPath,
			persistent: options.persistent ?? true,
			deduplicate: options.deduplicate ?? true,
			sessionId: options.sessionId ?? this.generateSessionId(),
		};
	}

	/**
	 * Add a command to history
	 */
	async add(
		entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'sessionId'>,
	): Promise<void> {
		const newEntry: HistoryEntry = {
			...entry,
			timestamp: Date.now(),
			sessionId: this.options.sessionId,
			id: this.generateId(),
		};

		// Deduplicate if enabled
		if (this.options.deduplicate && this.entries.length > 0) {
			const lastEntry = this.entries[this.entries.length - 1];
			if (lastEntry && lastEntry.command === entry.command) {
				// Update the last entry instead of adding a new one
				this.entries[this.entries.length - 1] = newEntry;
				await this.save();
				return;
			}
		}

		this.entries.push(newEntry);

		// Trim to max size
		if (this.entries.length > this.options.maxSize) {
			this.entries = this.entries.slice(-this.options.maxSize);
		}

		await this.save();
	}

	/**
	 * Get all history entries
	 */
	all(): HistoryEntry[] {
		return [...this.entries];
	}

	/**
	 * Get the last N entries
	 */
	last(count: number): HistoryEntry[] {
		return this.entries.slice(-count);
	}

	/**
	 * Get the first N entries
	 */
	first(count: number): HistoryEntry[] {
		return this.entries.slice(0, count);
	}

	/**
	 * Search history
	 */
	search(options: HistorySearchOptions = {}): HistoryEntry[] {
		let results = [...this.entries];

		// Pattern filter
		if (options.pattern) {
			const pattern =
				typeof options.pattern === 'string'
					? new RegExp(options.pattern, 'i')
					: options.pattern;

			results = results.filter(entry => pattern.test(entry.command));
		}

		// Time range filter
		if (options.since !== undefined) {
			results = results.filter(entry => entry.timestamp >= options.since!);
		}

		if (options.until !== undefined) {
			results = results.filter(entry => entry.timestamp <= options.until!);
		}

		// Session filter
		if (options.sessionId !== undefined) {
			results = results.filter(entry => entry.sessionId === options.sessionId);
		}

		// Limit
		if (options.limit !== undefined) {
			results = results.slice(0, options.limit);
		}

		// Reverse
		if (options.reverse) {
			results.reverse();
		}

		return results;
	}

	/**
	 * Find commands matching a prefix (for shell-like history search)
	 */
	findMatchingPrefix(prefix: string, limit: number = 10): HistoryEntry[] {
		return this.entries
			.filter(entry => entry.command.startsWith(prefix))
			.slice(-limit);
	}

	/**
	 * Get the most recent command
	 */
	latest(): HistoryEntry | null {
		return this.entries.length > 0
			? this.entries[this.entries.length - 1] ?? null
			: null;
	}

	/**
	 * Get a specific entry by index
	 */
	get(index: number): HistoryEntry | null {
		return this.entries[index] ?? null;
	}

	/**
	 * Get a specific entry by ID
	 */
	getById(id: string): HistoryEntry | null {
		return this.entries.find(entry => entry.id === id) ?? null;
	}

	/**
	 * Clear all history
	 */
	async clear(): Promise<void> {
		this.entries = [];
		await this.save();
	}

	/**
	 * Clear history entries matching a pattern
	 */
	async clearMatching(pattern: string | RegExp): Promise<number> {
		const regex =
			typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

		const beforeCount = this.entries.length;
		this.entries = this.entries.filter(entry => !regex.test(entry.command));
		const removedCount = beforeCount - this.entries.length;

		if (removedCount > 0) {
			await this.save();
		}

		return removedCount;
	}

	/**
	 * Get history statistics
	 */
	getStats(): {
		totalEntries: number;
		uniqueCommands: number;
		sessionId: string;
		timeRange: {start: number; end: number} | null;
	} {
		const uniqueCommands = new Set(this.entries.map(e => e.command)).size;

		let timeRange: {start: number; end: number} | null = null;
		if (this.entries.length > 0) {
			const firstEntry = this.entries[0];
			const lastEntry = this.entries[this.entries.length - 1];
			if (firstEntry && lastEntry) {
				timeRange = {
					start: firstEntry.timestamp,
					end: lastEntry.timestamp,
				};
			}
		}

		return {
			totalEntries: this.entries.length,
			uniqueCommands,
			sessionId: this.options.sessionId,
			timeRange,
		};
	}

	/**
	 * Export history as JSON
	 */
	export(): string {
		return JSON.stringify(this.entries, null, 2);
	}

	/**
	 * Import history from JSON
	 */
	async import(json: string): Promise<void> {
		try {
			const parsed = JSON.parse(json) as HistoryEntry[];
			if (Array.isArray(parsed)) {
				for (const entry of parsed) {
					await this.add(entry);
				}
			}
		} catch {
			// Invalid JSON, ignore
		}
	}

	/**
	 * Save history to file
	 */
	private async save(): Promise<void> {
		if (!this.options.persistent) {
			return;
		}

		try {
			const dir = path.dirname(this.options.filePath);
			await fs.mkdir(dir, {recursive: true});
			await fs.writeFile(this.options.filePath, this.export(), 'utf-8');
		} catch {
			// Fail silently - history is non-critical
		}
	}

	/**
	 * Load history from file
	 */
	async load(): Promise<void> {
		if (!this.options.persistent) {
			return;
		}

		try {
			const content = await fs.readFile(this.options.filePath, 'utf-8');
			const parsed = JSON.parse(content) as HistoryEntry[];
			if (Array.isArray(parsed)) {
				this.entries = parsed.slice(-this.options.maxSize);
			}
		} catch {
			// File doesn't exist or is invalid - start fresh
			this.entries = [];
		}
	}

	/**
	 * Generate a unique entry ID
	 */
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	/**
	 * Generate a session ID
	 */
	private generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	/**
	 * Get the history file path
	 */
	getFilePath(): string {
		return this.options.filePath;
	}
}

// ============================================================================
// HISTORY MANAGER
// ============================================================================

/**
 * Global history manager singleton
 */
class HistoryManager {
	private readonly histories = new Map<string, CommandHistory>();

	/**
	 * Get or create a history instance
	 */
	get(key: string, options?: HistoryOptions): CommandHistory {
		let history = this.histories.get(key);
		if (!history) {
			history = new CommandHistory(options);
			this.histories.set(key, history);
		}
		return history;
	}

	/**
	 * Remove a history instance
	 */
	delete(key: string): boolean {
		return this.histories.delete(key);
	}

	/**
	 * Clear all history instances
	 */
	clearAll(): void {
		this.histories.clear();
	}
}

const historyManager = new HistoryManager();

/**
 * Get the global history instance
 */
export function getHistory(
	key: string = 'default',
	options?: HistoryOptions,
): CommandHistory {
	return historyManager.get(key, options);
}

/**
 * Initialize the default history with loading
 */
export async function initHistory(
	options?: HistoryOptions,
): Promise<CommandHistory> {
	const history = getHistory('default', options);
	await history.load();
	return history;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a history entry for display
 */
export function formatHistoryEntry(
	entry: HistoryEntry,
	includeIndex = true,
): string {
	const date = new Date(entry.timestamp);
	const timeStr = date.toLocaleTimeString();
	const duration = entry.duration ? ` (${entry.duration}ms)` : '';
	const index = includeIndex ? '  ' : '';

	return `${index}${timeStr}  ${entry.command}${duration}`;
}

/**
 * Format multiple entries for display
 */
export function formatHistoryEntries(entries: HistoryEntry[]): string[] {
	return entries.map((entry, i) => {
		const index = `${(i + 1).toString().padStart(4)}  `;
		const entryWithoutIndex = {...entry};
		return formatHistoryEntry(entryWithoutIndex, false).replace(/^  /, index);
	});
}

/**
 * Parse a history reference (e.g., "!-2" for 2nd from last, "!10" for entry 10)
 */
export function parseHistoryReference(
	ref: string,
	history: CommandHistory,
): HistoryEntry | null {
	// Negative reference (from end)
	if (ref.startsWith('!-')) {
		const offset = parseInt(ref.slice(2), 10);
		if (!isNaN(offset)) {
			const entries = history.all();
			return entries[entries.length - offset] ?? null;
		}
	}

	// Positive reference (from start)
	if (ref.startsWith('!')) {
		const index = parseInt(ref.slice(1), 10);
		if (!isNaN(index)) {
			return history.get(index - 1);
		}
	}

	// String search
	if (ref.startsWith('!?')) {
		const pattern = ref.slice(2);
		const results = history.search({pattern, reverse: true, limit: 1});
		return results[0] ?? null;
	}

	return null;
}

export default CommandHistory;
