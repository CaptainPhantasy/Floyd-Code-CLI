/**
 * Agent Store
 *
 * Zustand store for agent profile management.
 * Handles agent creation, configuration, and statistics tracking.
 *
 * @module store/agent-store
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import fs from 'fs-extra';
import path from 'path';
import type {SwarmRole} from '../agent/manager.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Agent profile configuration
 */
export interface AgentProfile {
	/** Unique identifier */
	id: string;
	/** Display name */
	name: string;
	/** Agent role/persona */
	role: string;
	/** Target swarm type */
	swarmType: SwarmRole;
	/** Allowed tools */
	allowedTools: string[];
	/** Custom system prompt */
	systemPrompt: string;
	/** Token budget per request */
	tokenBudget: number;
	/** Maximum concurrent tasks */
	maxConcurrentTasks: number;
	/** Created timestamp */
	created: number;
	/** Last modified timestamp */
	modified: number;
	/** Whether profile is active */
	active: boolean;
	/** Usage statistics */
	stats: {
		totalCalls: number;
		totalTokens: number;
		successRate: number;
		avgDuration: number;
		lastUsed: number | null;
	};
}

/**
 * Agent store state and actions
 */
interface AgentStore {
	/** All agent profiles */
	profiles: AgentProfile[];
	/** Currently active profile ID */
	activeProfileId: string | null;
	/** Get active profile */
	getActiveProfile: () => AgentProfile | null;
	/** Add a new profile */
	addProfile: (profile: Omit<AgentProfile, 'id' | 'created' | 'modified' | 'stats'>) => void;
	/** Update a profile */
	updateProfile: (id: string, updates: Partial<AgentProfile>) => void;
	/** Remove a profile */
	removeProfile: (id: string) => void;
	/** Set active profile */
	setActiveProfile: (id: string | null) => void;
	/** Get profile by ID */
	getProfile: (id: string) => AgentProfile | null;
	/** Get profiles by swarm type */
	getProfilesBySwarm: (swarmType: SwarmRole) => AgentProfile[];
	/** Record agent usage */
	recordUsage: (id: string, tokens: number, duration: number, success: boolean) => void;
	/** Reset profile stats */
	resetStats: (id: string) => void;
	/** Load from file */
	loadFromFile: (filePath: string) => Promise<void>;
	/** Save to file */
	saveToFile: (filePath: string) => Promise<void>;
}

// ============================================================================
// DEFAULT PROFILES
// ============================================================================

const defaultProfiles: AgentProfile[] = [
	{
		id: 'default-codesearch',
		name: 'Code Search Agent',
		role: 'Code Discovery Specialist',
		swarmType: 'codesearch',
		allowedTools: ['grep', 'read_file', 'codebase_search'],
		systemPrompt: 'You are a code search specialist. Find symbols, references, and patterns efficiently.',
		tokenBudget: 2000,
		maxConcurrentTasks: 3,
		created: Date.now(),
		modified: Date.now(),
		active: true,
		stats: {
			totalCalls: 0,
			totalTokens: 0,
			successRate: 1,
			avgDuration: 0,
			lastUsed: null,
		},
	},
	{
		id: 'default-patchmaker',
		name: 'Patch Maker Agent',
		role: 'Code Generation Specialist',
		swarmType: 'patchmaker',
		allowedTools: ['write', 'read_file', 'search_replace', 'edit_file'],
		systemPrompt: 'You are a code generation specialist. Create clean, well-documented code.',
		tokenBudget: 4000,
		maxConcurrentTasks: 2,
		created: Date.now(),
		modified: Date.now(),
		active: false,
		stats: {
			totalCalls: 0,
			totalTokens: 0,
			successRate: 1,
			avgDuration: 0,
			lastUsed: null,
		},
	},
];

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
 * Get agent profiles file path in .floyd directory
 */
function getProfilesPath(): string {
	const cwd = process.cwd();
	const floydDir = path.join(cwd, '.floyd');
	return path.join(floydDir, 'agent-profiles.json');
}

/**
 * Create the agent store
 */
export const useAgentStore = create<AgentStore>()(
	persist(
		(set, get) => ({
			profiles: defaultProfiles,
			activeProfileId: defaultProfiles[0]?.id || null,

			getActiveProfile: () => {
				const {profiles, activeProfileId} = get();
				return profiles.find(p => p.id === activeProfileId) || null;
			},

			addProfile: profile =>
				set(state => {
					const newProfile: AgentProfile = {
						...profile,
						id: generateId(),
						created: Date.now(),
						modified: Date.now(),
						stats: {
							totalCalls: 0,
							totalTokens: 0,
							successRate: 1,
							avgDuration: 0,
							lastUsed: null,
						},
					};
					return {
						profiles: [...state.profiles, newProfile],
					};
				}),

			updateProfile: (id, updates) =>
				set(state => ({
					profiles: state.profiles.map(p =>
						p.id === id
							? {...p, ...updates, modified: Date.now()}
							: p,
					),
				})),

			removeProfile: id =>
				set(state => {
					const newProfiles = state.profiles.filter(p => p.id !== id);
					const newActiveId =
						state.activeProfileId === id
							? newProfiles[0]?.id || null
							: state.activeProfileId;
					return {
						profiles: newProfiles,
						activeProfileId: newActiveId,
					};
				}),

			setActiveProfile: id =>
				set({activeProfileId: id}),

			getProfile: id => {
				return get().profiles.find(p => p.id === id) || null;
			},

			getProfilesBySwarm: swarmType => {
				return get().profiles.filter(p => p.swarmType === swarmType);
			},

			recordUsage: (id, tokens, duration, success) =>
				set(state => ({
					profiles: state.profiles.map(p => {
						if (p.id !== id) return p;
						const stats = p.stats;
						const newCalls = stats.totalCalls + 1;
						const newTokens = stats.totalTokens + tokens;
						const newSuccesses = success
							? (stats.successRate * stats.totalCalls) + 1
							: stats.successRate * stats.totalCalls;
						const newSuccessRate = newCalls > 0 ? newSuccesses / newCalls : 1;
						const newAvgDuration =
							(stats.avgDuration * stats.totalCalls + duration) / newCalls;
						return {
							...p,
							stats: {
								totalCalls: newCalls,
								totalTokens: newTokens,
								successRate: newSuccessRate,
								avgDuration: newAvgDuration,
								lastUsed: Date.now(),
							},
						};
					}),
				})),

			resetStats: id =>
				set(state => ({
					profiles: state.profiles.map(p =>
						p.id === id
							? {
									...p,
									stats: {
										totalCalls: 0,
										totalTokens: 0,
										successRate: 1,
										avgDuration: 0,
										lastUsed: null,
									},
							  }
							: p,
					),
				})),

			loadFromFile: async filePath => {
				try {
					if (await fs.pathExists(filePath)) {
						const data = await fs.readJson(filePath);
						set({
							profiles: data.profiles || defaultProfiles,
							activeProfileId: data.activeProfileId || null,
						});
					}
				} catch (error) {
					console.error('Failed to load agent profiles:', error);
				}
			},

			saveToFile: async filePath => {
				try {
					await fs.ensureDir(path.dirname(filePath));
					const state = get();
					await fs.writeJson(
						filePath,
						{
							profiles: state.profiles,
							activeProfileId: state.activeProfileId,
						},
						{spaces: 2},
					);
				} catch (error) {
					console.error('Failed to save agent profiles:', error);
				}
			},
		}),
		{
			name: 'floyd-agent-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					try {
						const filePath = getProfilesPath();
						if (fs.existsSync(filePath)) {
							const data = fs.readFileSync(filePath, 'utf-8');
							return data;
						}
					} catch {
						// Fallback to memory
					}
					const data = globalThis.__floydAgentStoreMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					try {
						const filePath = getProfilesPath();
						fs.ensureDirSync(path.dirname(filePath));
						fs.writeFileSync(filePath, value, 'utf-8');
					} catch {
						// Fallback to memory
					}
					if (!globalThis.__floydAgentStoreMemory) {
						globalThis.__floydAgentStoreMemory = {};
					}
					try {
						globalThis.__floydAgentStoreMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydAgentStoreMemory[name] = value;
					}
				},
				removeItem: name => {
					try {
						const filePath = getProfilesPath();
						if (fs.existsSync(filePath)) {
							fs.removeSync(filePath);
						}
					} catch {
						// Ignore
					}
					if (globalThis.__floydAgentStoreMemory) {
						delete globalThis.__floydAgentStoreMemory[name];
					}
				},
			})),
			partialize: state => ({
				profiles: state.profiles,
				activeProfileId: state.activeProfileId,
			}),
		},
	),
);

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydAgentStoreMemory: Record<string, unknown> | undefined;
}
