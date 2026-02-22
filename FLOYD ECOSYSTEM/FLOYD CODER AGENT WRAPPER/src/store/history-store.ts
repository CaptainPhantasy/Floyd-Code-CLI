/**
 * History Store
 *
 * Zustand-based store for command history with persistence to ~/.floyd/
 * Handles command input history, navigation, and search.
 *
 * @module store/history-store
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Command history entry
 */
export interface HistoryEntry {
	/** The command string */
	command: string;
	/** Timestamp when command was executed */
	timestamp: number;
	/** Working directory where command was run */
	workingDirectory: string;
	/** Exit code (if available) */
	exitCode?: number;
	/** Duration in milliseconds */
	duration?: number;
}

/**
 * History state interface
 */
interface HistoryState {
	/** Command history entries */
	history: HistoryEntry[];
	/** Current position in history (for navigation) */
	position: number;
	/** Maximum history entries to keep */
	maxHistory: number;
	/** Filtered history (when searching) */
	filteredHistory: HistoryEntry[];
	/** Current search query */
	searchQuery: string;
	/** Add a command to history */
	addCommand: (
		command: string,
		workingDirectory: string,
		exitCode?: number,
		duration?: number,
	) => Promise<void>;
	/** Get command at current position */
	getCommandAt: (index: number) => string | null;
	/** Get next command (forward in history) */
	getNextCommand: () => string | null;
	/** Get previous command (back in history) */
	getPreviousCommand: () => string | null;
	/** Reset position to end */
	resetPosition: () => void;
	/** Search history by query */
	search: (query: string) => HistoryEntry[];
	/** Clear search */
	clearSearch: () => void;
	/** Clear all history */
	clearHistory: () => Promise<void>;
	/** Clear history entries before a timestamp */
	clearHistoryBefore: (timestamp: number) => Promise<void>;
	/** Export history to file */
	exportHistory: (filePath: string) => Promise<void>;
	/** Import history from file */
	importHistory: (filePath: string) => Promise<void>;
	/** Get history file path */
	getHistoryPath: () => string;
	/** Load history from file */
	loadHistory: () => Promise<void>;
	/** Save history to file */
	saveHistory: () => Promise<void>;
	/** Reset state */
	reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_HISTORY = 1000;
const HISTORY_FILENAME = 'command-history.json';

// ============================================================================
// DEFAULT STATE
// ============================================================================

const initialState = {
	history: [],
	position: -1,
	maxHistory: DEFAULT_MAX_HISTORY,
	filteredHistory: [],
	searchQuery: '',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the history file path
 */
function getHistoryPath(): string {
	const homeDir = os.homedir();
	return path.join(homeDir, '.floyd', HISTORY_FILENAME);
}

/**
 * Ensure history directory exists
 */
async function ensureHistoryDir(): Promise<void> {
	const historyPath = getHistoryPath();
	const historyDir = path.dirname(historyPath);
	await fs.ensureDir(historyDir);
}

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * History store with file system persistence to ~/.floyd/command-history.json
 */
export const useHistoryStore = create<HistoryState>()(
	persist(
		(set, get) => ({
			...initialState,

			getHistoryPath,

			addCommand: async (command, workingDirectory, exitCode, duration) => {
				// Don't add empty commands or duplicates of the last command
				if (!command.trim()) return;

				const {history} = get();
				const lastEntry = history[history.length - 1];
				if (lastEntry?.command === command) {
					// Update timestamp of last entry instead of adding duplicate
					const updated = [...history];
					updated[updated.length - 1] = {
						...lastEntry,
						timestamp: Date.now(),
						exitCode,
						duration,
					};
					set({history: updated, position: updated.length});
					await get().saveHistory();
					return;
				}

				const entry: HistoryEntry = {
					command,
					timestamp: Date.now(),
					workingDirectory,
					exitCode,
					duration,
				};

				const newHistory = [...history, entry];
				// Trim to max history if needed
				const trimmed =
					newHistory.length > get().maxHistory
						? newHistory.slice(-get().maxHistory)
						: newHistory;

				set({history: trimmed, position: trimmed.length});
				await get().saveHistory();
			},

			getCommandAt: index => {
				const {history} = get();
				if (index < 0 || index >= history.length) return null;
				const entry = history[index];
				return entry?.command ?? null;
			},

			getNextCommand: () => {
				const {position, history, filteredHistory, searchQuery} = get();
				const source = searchQuery ? filteredHistory : history;

				if (source.length === 0) return null;

				const newPosition = Math.min(position + 1, source.length);
				set({position: newPosition});

				// position === length means "current input" (no history selection)
				if (newPosition >= source.length) return null;
				const entry = source[newPosition];
				return entry?.command ?? null;
			},

			getPreviousCommand: () => {
				const {position, history, filteredHistory, searchQuery} = get();
				const source = searchQuery ? filteredHistory : history;

				if (source.length === 0) return null;

				const newPosition = Math.max(position - 1, 0);
				set({position: newPosition});

				const entry = source[newPosition];
				return entry?.command ?? null;
			},

			resetPosition: () => set({position: -1}),

			search: query => {
				const {history} = get();
				const lowerQuery = query.toLowerCase();

				const filtered = history.filter(entry =>
					entry.command.toLowerCase().includes(lowerQuery),
				);

				set({
					filteredHistory: filtered,
					searchQuery: query,
					position: filtered.length > 0 ? filtered.length - 1 : -1,
				});

				return filtered;
			},

			clearSearch: () =>
				set({
					filteredHistory: [],
					searchQuery: '',
					position: -1,
				}),

			clearHistory: async () => {
				const historyPath = getHistoryPath();
				if (await fs.pathExists(historyPath)) {
					await fs.remove(historyPath);
				}
				set({
					history: [],
					position: -1,
					filteredHistory: [],
					searchQuery: '',
				});
			},

			clearHistoryBefore: async timestamp => {
				const {history} = get();
				const filtered = history.filter(entry => entry.timestamp >= timestamp);
				set({history: filtered, position: filtered.length});
				await get().saveHistory();
			},

			exportHistory: async filePath => {
				const {history} = get();
				const formatted = history.map(entry => ({
					command: entry.command,
					timestamp: new Date(entry.timestamp).toISOString(),
					workingDirectory: entry.workingDirectory,
					exitCode: entry.exitCode,
					duration: entry.duration,
				}));
				await fs.writeJson(filePath, formatted, {spaces: 2});
			},

			importHistory: async filePath => {
				if (!(await fs.pathExists(filePath))) return;

				const imported = await fs.readJson(filePath);
				const entries: HistoryEntry[] = imported.map((entry: any) => ({
					command: entry.command,
					timestamp: entry.timestamp
						? new Date(entry.timestamp).getTime()
						: Date.now(),
					workingDirectory: entry.workingDirectory || process.cwd(),
					exitCode: entry.exitCode,
					duration: entry.duration,
				}));

				const {history} = get();
				const merged = [...history, ...entries];
				// Remove duplicates and sort by timestamp
				const unique = Array.from(
					new Map(merged.map(e => [e.command, e])).values(),
				).sort((a, b) => a.timestamp - b.timestamp);

				// Trim to max
				const trimmed =
					unique.length > get().maxHistory
						? unique.slice(-get().maxHistory)
						: unique;

				set({history: trimmed, position: trimmed.length});
				await get().saveHistory();
			},

			loadHistory: async () => {
				await ensureHistoryDir();
				const historyPath = getHistoryPath();

				if (!(await fs.pathExists(historyPath))) {
					set({history: [], position: -1});
					return;
				}

				try {
					const data = await fs.readJson(historyPath);
					const entries: HistoryEntry[] = Array.isArray(data) ? data : [];
					set({history: entries, position: entries.length});
				} catch {
					// Corrupted history file, start fresh
					set({history: [], position: -1});
				}
			},

			saveHistory: async () => {
				await ensureHistoryDir();
				const {history} = get();
				const historyPath = getHistoryPath();
				await fs.writeJson(historyPath, history, {spaces: 2});
			},

			reset: () => set({...initialState}),
		}),
		{
			name: 'floyd-history-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					const data = globalThis.__floydHistoryMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					if (!globalThis.__floydHistoryMemory) {
						globalThis.__floydHistoryMemory = {};
					}
					try {
						globalThis.__floydHistoryMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydHistoryMemory[name] = value;
					}
				},
				removeItem: name => {
					if (globalThis.__floydHistoryMemory) {
						delete globalThis.__floydHistoryMemory[name];
					}
				},
			})),
			partialize: state => ({
				maxHistory: state.maxHistory,
			}),
		},
	),
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/**
 * Get full command history
 */
export const selectHistory = (state: HistoryState) => state.history;

/**
 * Get history length
 */
export const selectHistoryLength = (state: HistoryState) =>
	state.history.length;

/**
 * Check if history is empty
 */
export const selectIsHistoryEmpty = (state: HistoryState) =>
	state.history.length === 0;

/**
 * Get current history position
 */
export const selectHistoryPosition = (state: HistoryState) => state.position;

/**
 * Get current search query
 */
export const selectSearchQuery = (state: HistoryState) => state.searchQuery;

/**
 * Get filtered history
 */
export const selectFilteredHistory = (state: HistoryState) =>
	state.filteredHistory;

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydHistoryMemory: Record<string, unknown> | undefined;
}
