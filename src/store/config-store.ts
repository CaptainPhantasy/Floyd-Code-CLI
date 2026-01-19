/**
 * Config Store
 *
 * Zustand store for monitoring configuration settings.
 * Manages file watchers, MCP servers, event filters, and refresh intervals.
 *
 * @module store/config-store
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import fs from 'fs-extra';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * File watch pattern configuration
 */
export interface WatchPattern {
	/** Unique identifier */
	id: string;
	/** Glob pattern to watch */
	pattern: string;
	/** Whether pattern is enabled */
	enabled: boolean;
	/** Pattern description */
	description?: string;
	/** Created timestamp */
	created: number;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
	/** Server name */
	name: string;
	/** Whether server is enabled */
	enabled: boolean;
	/** Transport type */
	transport: {
		type: 'stdio' | 'sse' | 'http' | 'websocket';
		command?: string;
		args?: string[];
		env?: Record<string, string>;
		url?: string;
	};
	/** Last connection attempt timestamp */
	lastConnected?: number;
	/** Connection status */
	status?: 'connected' | 'disconnected' | 'error';
}

/**
 * Event filter configuration
 */
export interface EventFilter {
	/** Filter identifier */
	id: string;
	/** Filter pattern (regex or glob) */
	pattern: string;
	/** Filter type */
	type: 'include' | 'exclude';
	/** Event severity levels to filter */
	severities: Array<'error' | 'warning' | 'info' | 'success'>;
	/** Whether filter is enabled */
	enabled: boolean;
}

/**
 * Monitoring configuration state
 */
export interface MonitorConfig {
	/** File watch patterns */
	watchPatterns: WatchPattern[];
	/** Enable process monitoring */
	processMonitoring: boolean;
	/** Event stream filters */
	eventFilters: EventFilter[];
	/** MCP server configurations */
	mcpServers: MCPServerConfig[];
	/** Refresh interval in milliseconds */
	refreshInterval: number;
	/** Maximum events to keep in memory */
	maxEvents: number;
	/** Enable git activity monitoring */
	gitMonitoring: boolean;
	/** Enable browser state monitoring */
	browserMonitoring: boolean;
}

/**
 * Config store state and actions
 */
interface ConfigStore {
	/** Current monitoring configuration */
	config: MonitorConfig;
	/** Update watch patterns */
	setWatchPatterns: (patterns: WatchPattern[]) => void;
	/** Add a watch pattern */
	addWatchPattern: (pattern: Omit<WatchPattern, 'id' | 'created'>) => void;
	/** Remove a watch pattern */
	removeWatchPattern: (id: string) => void;
	/** Toggle watch pattern enabled state */
	toggleWatchPattern: (id: string) => void;
	/** Set process monitoring */
	setProcessMonitoring: (enabled: boolean) => void;
	/** Set event filters */
	setEventFilters: (filters: EventFilter[]) => void;
	/** Add event filter */
	addEventFilter: (filter: Omit<EventFilter, 'id'>) => void;
	/** Remove event filter */
	removeEventFilter: (id: string) => void;
	/** Set MCP servers */
	setMCPServers: (servers: MCPServerConfig[]) => void;
	/** Update MCP server */
	updateMCPServer: (name: string, updates: Partial<MCPServerConfig>) => void;
	/** Set refresh interval */
	setRefreshInterval: (interval: number) => void;
	/** Set git monitoring */
	setGitMonitoring: (enabled: boolean) => void;
	/** Set browser monitoring */
	setBrowserMonitoring: (enabled: boolean) => void;
	/** Reset to defaults */
	reset: () => void;
	/** Load from file */
	loadFromFile: (filePath: string) => Promise<void>;
	/** Save to file */
	saveToFile: (filePath: string) => Promise<void>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: MonitorConfig = {
	watchPatterns: [
		{
			id: 'default-ts',
			pattern: '**/*.{ts,tsx}',
			enabled: true,
			description: 'TypeScript files',
			created: Date.now(),
		},
		{
			id: 'default-js',
			pattern: '**/*.{js,jsx}',
			enabled: true,
			description: 'JavaScript files',
			created: Date.now(),
		},
	],
	processMonitoring: true,
	eventFilters: [],
	mcpServers: [],
	refreshInterval: 1000,
	maxEvents: 1000,
	gitMonitoring: true,
	browserMonitoring: false,
};

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get config file path in .floyd directory
 */
function getConfigPath(): string {
	const cwd = process.cwd();
	const floydDir = path.join(cwd, '.floyd');
	return path.join(floydDir, 'monitor-config.json');
}

/**
 * Create the config store
 */
export const useConfigStore = create<ConfigStore>()(
	persist(
		(set, get) => ({
			config: defaultConfig,

			setWatchPatterns: patterns =>
				set(state => ({
					config: {...state.config, watchPatterns: patterns},
				})),

			addWatchPattern: pattern =>
				set(state => ({
					config: {
						...state.config,
						watchPatterns: [
							...state.config.watchPatterns,
							{
								...pattern,
								id: generateId(),
								created: Date.now(),
							},
						],
					},
				})),

			removeWatchPattern: id =>
				set(state => ({
					config: {
						...state.config,
						watchPatterns: state.config.watchPatterns.filter(
							p => p.id !== id,
						),
					},
				})),

			toggleWatchPattern: id =>
				set(state => ({
					config: {
						...state.config,
						watchPatterns: state.config.watchPatterns.map(p =>
							p.id === id ? {...p, enabled: !p.enabled} : p,
						),
					},
				})),

			setProcessMonitoring: enabled =>
				set(state => ({
					config: {...state.config, processMonitoring: enabled},
				})),

			setEventFilters: filters =>
				set(state => ({
					config: {...state.config, eventFilters: filters},
				})),

			addEventFilter: filter =>
				set(state => ({
					config: {
						...state.config,
						eventFilters: [
							...state.config.eventFilters,
							{
								...filter,
								id: generateId(),
							},
						],
					},
				})),

			removeEventFilter: id =>
				set(state => ({
					config: {
						...state.config,
						eventFilters: state.config.eventFilters.filter(f => f.id !== id),
					},
				})),

			setMCPServers: servers =>
				set(state => ({
					config: {...state.config, mcpServers: servers},
				})),

			updateMCPServer: (name, updates) =>
				set(state => ({
					config: {
						...state.config,
						mcpServers: state.config.mcpServers.map(s =>
							s.name === name ? {...s, ...updates} : s,
						),
					},
				})),

			setRefreshInterval: interval =>
				set(state => ({
					config: {...state.config, refreshInterval: interval},
				})),

			setGitMonitoring: enabled =>
				set(state => ({
					config: {...state.config, gitMonitoring: enabled},
				})),

			setBrowserMonitoring: enabled =>
				set(state => ({
					config: {...state.config, browserMonitoring: enabled},
				})),

			reset: () =>
				set({
					config: defaultConfig,
				}),

			loadFromFile: async filePath => {
				try {
					if (await fs.pathExists(filePath)) {
						const data = await fs.readJson(filePath);
						set({config: {...defaultConfig, ...data}});
					}
				} catch (error) {
					console.error('Failed to load config:', error);
				}
			},

			saveToFile: async filePath => {
				try {
					await fs.ensureDir(path.dirname(filePath));
					await fs.writeJson(filePath, get().config, {spaces: 2});
				} catch (error) {
					console.error('Failed to save config:', error);
				}
			},
		}),
		{
			name: 'floyd-config-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					try {
						const filePath = getConfigPath();
						if (fs.existsSync(filePath)) {
							const data = fs.readFileSync(filePath, 'utf-8');
							return data;
						}
					} catch {
						// Fallback to memory
					}
					const data = globalThis.__floydConfigStoreMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					try {
						const filePath = getConfigPath();
						fs.ensureDirSync(path.dirname(filePath));
						fs.writeFileSync(filePath, value, 'utf-8');
					} catch {
						// Fallback to memory
					}
					if (!globalThis.__floydConfigStoreMemory) {
						globalThis.__floydConfigStoreMemory = {};
					}
					try {
						globalThis.__floydConfigStoreMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydConfigStoreMemory[name] = value;
					}
				},
				removeItem: name => {
					try {
						const filePath = getConfigPath();
						if (fs.existsSync(filePath)) {
							fs.removeSync(filePath);
						}
					} catch {
						// Ignore
					}
					if (globalThis.__floydConfigStoreMemory) {
						delete globalThis.__floydConfigStoreMemory[name];
					}
				},
			})),
			partialize: state => ({
				config: state.config,
			}),
		},
	),
);

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydConfigStoreMemory: Record<string, unknown> | undefined;
}
