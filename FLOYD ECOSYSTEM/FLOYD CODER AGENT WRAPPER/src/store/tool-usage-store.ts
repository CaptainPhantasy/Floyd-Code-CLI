/**
 * Tool Usage Store
 *
 * Zustand-based store for tracking tool execution statistics with persistence.
 * Handles tool call counts, success rates, durations, and recent executions.
 *
 * @module store/tool-usage-store
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
 * Tool execution record for tracking individual calls
 */
export interface ToolExecution {
	/** Tool name that was called */
	toolName: string;
	/** Timestamp when tool was called */
	timestamp: number;
	/** Duration in milliseconds */
	duration: number;
	/** Whether the call was successful */
	success: boolean;
	/** Error message if failed */
	error?: string;
	/** Input parameters (sanitized) */
	input?: Record<string, unknown>;
}

/**
 * Tool usage statistics aggregated from executions
 */
export interface ToolStats {
	/** Tool name */
	name: string;
	/** Total number of times this tool was called */
	calls: number;
	/** Number of successful calls */
	successes: number;
	/** Number of failed calls */
	failures: number;
	/** Success rate (0-1) */
	successRate: number;
	/** Total duration across all calls in milliseconds */
	totalDuration: number;
	/** Average duration per call in milliseconds */
	avgDuration: number;
	/** Min duration recorded */
	minDuration: number;
	/** Max duration recorded */
	maxDuration: number;
	/** Timestamp of last call */
	lastUsed: number | null;
}

/**
 * Tool usage state interface
 */
interface ToolUsageState {
	/** Map of tool name to stats */
	stats: Record<string, Omit<ToolStats, 'name'>>;
	/** Recent tool executions */
	recentExecutions: ToolExecution[];
	/** Maximum recent executions to keep */
	maxRecentExecutions: number;
	/** Record a tool execution */
	recordExecution: (execution: Omit<ToolExecution, 'timestamp'>) => void;
	/** Get stats for a specific tool */
	getToolStats: (toolName: string) => ToolStats | null;
	/** Get all stats as array */
	getAllStats: () => ToolStats[];
	/** Get top tools by usage */
	getTopTools: (limit?: number) => ToolStats[];
	/** Get tools sorted by failures */
	getFailingTools: () => ToolStats[];
	/** Get tools sorted by duration */
	getSlowestTools: () => ToolStats[];
	/** Clear all stats */
	clearStats: () => void;
	/** Clear recent executions */
	clearRecentExecutions: () => void;
	/** Get stats file path */
	getStatsPath: () => string;
	/** Load stats from file */
	loadStats: () => Promise<void>;
	/** Save stats to file */
	saveStats: () => Promise<void>;
	/** Reset state */
	reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_RECENT = 50;
const STATS_FILENAME = 'tool-stats.json';

// ============================================================================
// DEFAULT STATE
// ============================================================================

const initialState = {
	stats: {},
	recentExecutions: [],
	maxRecentExecutions: DEFAULT_MAX_RECENT,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the stats file path
 */
function getStatsPath(): string {
	const homeDir = os.homedir();
	return path.join(homeDir, '.floyd', STATS_FILENAME);
}

/**
 * Ensure stats directory exists
 */
async function ensureStatsDir(): Promise<void> {
	const statsPath = getStatsPath();
	const statsDir = path.dirname(statsPath);
	await fs.ensureDir(statsDir);
}

/**
 * Calculate success rate from successes and total calls
 */
function calculateSuccessRate(successes: number, calls: number): number {
	if (calls === 0) return 1;
	return successes / calls;
}

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Tool usage store with file system persistence to ~/.floyd/tool-stats.json
 */
export const useToolUsageStore = create<ToolUsageState>()(
	persist(
		(set, get) => ({
			...initialState,

			getStatsPath,

			recordExecution: execution => {
				const toolName = execution.toolName;
				const timestamp = Date.now();
				const success = execution.success;

				set(state => {
					// Get or create stats for this tool
					const currentStats = state.stats[toolName] || {
						calls: 0,
						successes: 0,
						failures: 0,
						successRate: 1,
						totalDuration: 0,
						avgDuration: 0,
						minDuration: execution.duration,
						maxDuration: execution.duration,
						lastUsed: null,
					};

					const newCalls = currentStats.calls + 1;
					const newSuccesses = success
						? currentStats.successes + 1
						: currentStats.successes;
					const newFailures = success
						? currentStats.failures
						: currentStats.failures + 1;
					const newTotalDuration =
						currentStats.totalDuration + execution.duration;
					const newAvgDuration = newTotalDuration / newCalls;
					const newMinDuration = Math.min(
						currentStats.minDuration,
						execution.duration,
					);
					const newMaxDuration = Math.max(
						currentStats.maxDuration,
						execution.duration,
					);

					const newStats = {
						calls: newCalls,
						successes: newSuccesses,
						failures: newFailures,
						successRate: calculateSuccessRate(newSuccesses, newCalls),
						totalDuration: newTotalDuration,
						avgDuration: newAvgDuration,
						minDuration: newMinDuration,
						maxDuration: newMaxDuration,
						lastUsed: timestamp,
					};

					// Add to recent executions
					const newExecution: ToolExecution = {
						...execution,
						timestamp,
					};

					const recentExecutions = [
						newExecution,
						...state.recentExecutions,
					].slice(0, state.maxRecentExecutions);

					return {
						stats: {
							...state.stats,
							[toolName]: newStats,
						},
						recentExecutions,
					};
				});

				// Persist to file
				get().saveStats();
			},

			getToolStats: toolName => {
				const {stats} = get();
				const stat = stats[toolName];
				if (!stat) return null;

				return {
					name: toolName,
					...stat,
				};
			},

			getAllStats: () => {
				const {stats} = get();
				return Object.entries(stats).map(([name, stat]) => ({
					name,
					...stat,
				}));
			},

			getTopTools: (limit = 10) => {
				const allStats = get().getAllStats();
				return allStats.sort((a, b) => b.calls - a.calls).slice(0, limit);
			},

			getFailingTools: () => {
				const allStats = get().getAllStats();
				return allStats
					.filter(s => s.failures > 0)
					.sort((a, b) => b.failures - a.failures);
			},

			getSlowestTools: () => {
				const allStats = get().getAllStats();
				return allStats.sort((a, b) => b.avgDuration - a.avgDuration);
			},

			clearStats: () => set({stats: {}, recentExecutions: []}),

			clearRecentExecutions: () => set({recentExecutions: []}),

			loadStats: async () => {
				await ensureStatsDir();
				const statsPath = getStatsPath();

				if (!(await fs.pathExists(statsPath))) {
					set({stats: {}, recentExecutions: []});
					return;
				}

				try {
					const data = await fs.readJson(statsPath);
					const stats = data.stats || {};
					const recentExecutions = data.recentExecutions || [];
					set({stats, recentExecutions});
				} catch {
					// Corrupted stats file, start fresh
					set({stats: {}, recentExecutions: []});
				}
			},

			saveStats: async () => {
				await ensureStatsDir();
				const {stats, recentExecutions} = get();
				const statsPath = getStatsPath();
				await fs.writeJson(statsPath, {stats, recentExecutions}, {spaces: 2});
			},

			reset: () => set({...initialState}),
		}),
		{
			name: 'floyd-tool-usage-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					const data = globalThis.__floydToolUsageMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					if (!globalThis.__floydToolUsageMemory) {
						globalThis.__floydToolUsageMemory = {};
					}
					try {
						globalThis.__floydToolUsageMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydToolUsageMemory[name] = value;
					}
				},
				removeItem: name => {
					if (globalThis.__floydToolUsageMemory) {
						delete globalThis.__floydToolUsageMemory[name];
					}
				},
			})),
			partialize: state => ({
				maxRecentExecutions: state.maxRecentExecutions,
			}),
		},
	),
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/**
 * Get all tool stats
 */
export const selectAllToolStats = (state: ToolUsageState) =>
	state.getAllStats();

/**
 * Get total tool calls across all tools
 */
export const selectTotalToolCalls = (state: ToolUsageState) =>
	Object.values(state.stats).reduce((sum, stat) => sum + stat.calls, 0);

/**
 * Get overall success rate
 */
export const selectOverallSuccessRate = (state: ToolUsageState) => {
	const stats = Object.values(state.stats);
	const totalCalls = stats.reduce((sum, stat) => sum + stat.calls, 0);
	const totalSuccesses = stats.reduce((sum, stat) => sum + stat.successes, 0);
	return totalCalls > 0 ? totalSuccesses / totalCalls : 1;
};

/**
 * Get recent executions
 */
export const selectRecentExecutions = (state: ToolUsageState) =>
	state.recentExecutions;

/**
 * Get unique tools used
 */
export const selectUniqueToolCount = (state: ToolUsageState) =>
	Object.keys(state.stats).length;

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydToolUsageMemory: Record<string, unknown> | undefined;
}
