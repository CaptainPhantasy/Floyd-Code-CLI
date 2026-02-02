/**
 * FLOYD Global State Store
 *
 * Zustand-based global state management for the FLOYD CLI.
 * Handles conversation state, agent status, tool usage tracking,
 * rate limiting, and session management.
 *
 * @module store/floyd-store
 */

import {useRef, useMemo, useCallback} from 'react';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {produce} from 'immer';
// Message type matches Anthropic SDK format
export type Message = {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string | any[];
	tool_call_id?: string;
	name?: string;
};
import type {AgentStatus} from '../ui/agent/types.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a debounced function
 * Limits how often a function can be called
 */
function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delayMs: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			timeoutId = null;
			fn(...args);
		}, delayMs);
	};
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single message in the conversation with metadata
 */
export interface ConversationMessage extends Message {
	/** Unique identifier for this message */
	id: string;
	/** Timestamp when message was created */
	timestamp: number;
	/** Tokens used (if available) */
	tokens?: number;
	/** Duration in milliseconds (for assistant messages) */
	duration?: number;
	/** Whether this message is currently being streamed */
	streaming?: boolean;
}

/**
 * Tool execution record for tracking usage
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
 * Tool usage statistics
 */
export interface ToolStats {
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
	/** Timestamp of last call */
	lastUsed: number | null;
}

/**
 * Rate limit state
 */
export interface RateLimitState {
	/** Remaining requests in current window */
	remaining: number;
	/** Total requests allowed in window */
	limit: number;
	/** Timestamp when window resets */
	resetAt: number;
	/** Timestamp of last API call */
	lastCall: number;
	/** Whether currently rate limited */
	isLimited: boolean;
}

/**
 * Project information for current session
 */
export interface ProjectInfo {
	/** Project name */
	name: string;
	/** Root directory path */
	rootPath: string;
	/** Current working directory */
	currentDirectory: string;
	/** Git branch name (if in git repo) */
	gitBranch?: string;
	/** Whether git repo is dirty (uncommitted changes) */
	gitDirty?: boolean;
}

/**
 * Session state
 */
export interface SessionState {
	/** Unique session identifier */
	id: string | null;
	/** Timestamp when session was created */
	createdAt: number | null;
	/** Timestamp of last activity */
	lastActivity: number;
	/** Project information */
	project: ProjectInfo | null;
	/** Total messages in session */
	messageCount: number;
	/** Total tokens used in session */
	totalTokens: number;
}

/**
 * Conversation state slice
 */
interface ConversationSlice {
	/** All messages in current conversation */
	messages: ConversationMessage[];
	/** Current streaming content (partial message) */
	streamingContent: string;
	/** System prompt */
	systemPrompt: string;
	/** Maximum context window size */
	maxMessages: number;
	/** Add a message to conversation */
	addMessage: (message: ConversationMessage) => void;
	/** Update an existing message */
	updateMessage: (id: string, updates: Partial<ConversationMessage>) => void;
	/** Remove a message by ID */
	removeMessage: (id: string) => void;
	/** Clear all messages */
	clearMessages: () => void;
	/** Append to streaming content */
	appendStreamingContent: (content: string) => void;
	/** Set streaming content (replace) */
	setStreamingContent: (content: string) => void;
	/** Clear streaming content */
	clearStreamingContent: () => void;
	/** Set system prompt */
	setSystemPrompt: (prompt: string) => void;
}

/**
 * Agent status slice
 */
interface AgentSlice {
	/** Current agent status */
	status: AgentStatus;
	/** Current tool being executed (if any) */
	currentTool: string | null;
	/** Agent error message (if any) */
	error: string | null;
	/** Agent progress (0-100) */
	progress: number;
	/** Current activity description */
	activity: string;
	/** Whether agent is paused */
	paused: boolean;
	/** Set agent status */
	setStatus: (status: AgentStatus) => void;
	/** Set current tool */
	setCurrentTool: (tool: string | null) => void;
	/** Set error */
	setError: (error: string | null) => void;
	/** Set progress */
	setProgress: (progress: number) => void;
	/** Set activity description */
	setActivity: (activity: string) => void;
	/** Toggle pause state */
	togglePaused: () => void;
	/** Reset agent state */
	resetAgent: () => void;
}

/**
 * Tool usage tracking slice
 */
interface ToolsSlice {
	/** Map of tool name to stats */
	stats: Record<string, ToolStats>;
	/** Recent tool executions */
	recentExecutions: ToolExecution[];
	/** Maximum recent executions to keep */
	maxRecentExecutions: number;
	/** Record a tool execution */
	recordExecution: (execution: Omit<ToolExecution, 'timestamp'>) => void;
	/** Get stats for a specific tool */
	getToolStats: (toolName: string) => ToolStats | null;
	/** Clear all stats */
	clearStats: () => void;
	/** Clear recent executions */
	clearRecentExecutions: () => void;
}

/**
 * Rate limiting slice
 */
interface RateLimitSlice {
	/** Current rate limit state */
	rateLimit: RateLimitState;
	/** Update rate limit state */
	setRateLimit: (state: Partial<RateLimitState>) => void;
	/** Record an API call */
	recordCall: () => void;
	/** Check if rate limited */
	isRateLimited: () => boolean;
	/** Get remaining requests */
	getRemaining: () => number;
	/** Reset rate limit state */
	resetRateLimit: () => void;
}

/**
 * Session management slice
 */
interface SessionSlice {
	/** Current session state */
	session: SessionState;
	/** All known sessions */
	sessions: Array<{id: string; createdAt: number; lastActivity: number}>;
	/** Initialize or resume a session */
	initSession: (
		projectId: string,
		projectName: string,
		rootPath: string,
	) => void;
	/** Update project info */
	setProjectInfo: (info: Partial<ProjectInfo>) => void;
	/** Record activity */
	recordActivity: () => void;
	/** End current session */
	endSession: () => void;
	/** Load existing session */
	loadSession: (sessionId: string) => void;
	/** Get session summary */
	getSessionSummary: () => {
		id: string;
		createdAt: number;
		messageCount: number;
	};
}

/**
 * Configuration slice
 */
interface ConfigSlice {
	/** Safety mode setting */
	safetyMode: 'yolo' | 'ask' | 'plan';
	/** Toggle safety mode */
	toggleSafetyMode: () => void;
	/** Set safety mode */
	setSafetyMode: (mode: 'yolo' | 'ask' | 'plan') => void;
}

/**
 * Overlay/modal state slice
 */
interface OverlaySlice {
	/** Help overlay visibility */
	showHelp: boolean;
	/** Process monitor overlay visibility */
	showMonitor: boolean;
	/** Prompt library overlay visibility */
	showPromptLibrary: boolean;
	/** Agent builder overlay visibility */
	showAgentBuilder: boolean;
	/** Command palette overlay visibility */
	showCommandPalette: boolean;
	/** Config/settings overlay visibility */
	showConfig: boolean;
	/** Set overlay visibility by name */
	setOverlay: (name: keyof OverlayState, value: boolean) => void;
	/** Toggle overlay by name */
	toggleOverlay: (name: keyof OverlayState) => void;
	/** Close all overlays */
	closeAllOverlays: () => void;
	/** Check if any overlay is open */
	hasOpenOverlay: () => boolean;
}

/**
 * Individual overlay state keys
 */
type OverlayState = Pick<
	OverlaySlice,
	| 'showHelp'
	| 'showMonitor'
	| 'showPromptLibrary'
	| 'showAgentBuilder'
	| 'showCommandPalette'
	| 'showConfig'
>;

/**
 * Main Floyd store state combining all slices
 */
type FloydStore = ConversationSlice &
	AgentSlice &
	ToolsSlice &
	RateLimitSlice &
	SessionSlice &
	ConfigSlice &
	OverlaySlice & {
		/** Reset entire store to initial state */
		reset: () => void;
		/** Get store version for migration */
		version: number;
	};

// ============================================================================
// DEFAULT STATES
// ============================================================================

const initialConversationState: Omit<
	ConversationSlice,
	| 'addMessage'
	| 'updateMessage'
	| 'removeMessage'
	| 'clearMessages'
	| 'appendStreamingContent'
	| 'setStreamingContent'
	| 'clearStreamingContent'
	| 'setSystemPrompt'
> = {
	messages: [],
	streamingContent: '',
	systemPrompt: 'You are a helpful AI assistant.',
	maxMessages: 100,
};

const initialAgentState: Omit<
	AgentSlice,
	| 'setStatus'
	| 'setCurrentTool'
	| 'setError'
	| 'setProgress'
	| 'setActivity'
	| 'togglePaused'
	| 'resetAgent'
> = {
	status: 'idle',
	currentTool: null,
	error: null,
	progress: 0,
	activity: '',
	paused: false,
};

const initialToolsState: Omit<
	ToolsSlice,
	'recordExecution' | 'getToolStats' | 'clearStats' | 'clearRecentExecutions'
> = {
	stats: {},
	recentExecutions: [],
	maxRecentExecutions: 50,
};

const initialRateLimitState: RateLimitState = {
	remaining: 100,
	limit: 100,
	resetAt: 0,
	lastCall: 0,
	isLimited: false,
};

const initialSessionState: SessionState = {
	id: null,
	createdAt: null,
	lastActivity: Date.now(),
	project: null,
	messageCount: 0,
	totalTokens: 0,
};

const initialConfigState: Omit<ConfigSlice, 'toggleSafetyMode' | 'setSafetyMode'> = {
	safetyMode: 'ask', // Default to ASK mode for safety
};

const initialOverlayState: Omit<
	OverlaySlice,
	| 'setOverlay'
	| 'toggleOverlay'
	| 'closeAllOverlays'
	| 'hasOpenOverlay'
> = {
	showHelp: false,
	showMonitor: false,
	showPromptLibrary: false,
	showAgentBuilder: false,
	showCommandPalette: false,
	showConfig: false,
};

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate success rate from successes and total calls
 */
function calculateSuccessRate(successes: number, calls: number): number {
	if (calls === 0) return 1;
	return successes / calls;
}

/**
 * Create the main FLOYD Zustand store
 */
export const useFloydStore = create<FloydStore>()(
		persist(
		(set, get) => ({
			// Version for migrations
			version: 1,

			// ============================================================
			// CONVERSATION STATE
			// ============================================================
			...initialConversationState,

			// ============================================================
			// CONFIG STATE
			// ============================================================
			...initialConfigState,

			toggleSafetyMode: () =>
			set(state => ({
				safetyMode: state.safetyMode === 'yolo' ? 'ask' : state.safetyMode === 'ask' ? 'plan' : 'yolo',
			})),

			setSafetyMode: (mode: 'yolo' | 'ask' | 'plan') => set({safetyMode: mode}),

			// ============================================================
			// OVERLAY STATE
			// ============================================================
			...initialOverlayState,

			setOverlay: (name, value) =>
				set(state => {
					const overlayName = name as keyof Extract<OverlaySlice, boolean>;
					return {[overlayName]: value};
				}),

			toggleOverlay: name =>
				set(state => {
					const overlayName = name as keyof Extract<OverlaySlice, boolean>;
					return {[overlayName]: !state[overlayName]};
				}),

			closeAllOverlays: () =>
				set({
					showHelp: false,
					showMonitor: false,
					showPromptLibrary: false,
					showAgentBuilder: false,
					showCommandPalette: false,
					showConfig: false,
		appendStreamingContent: (content: string) =>
			set(state => ({
				streamingContent: state.streamingContent + content,
			})),
		addMessage: message =>
					streamingContent: '',
				}),

			appendStreamingContent: (() => {
				// Debounce streaming content updates to reduce state update frequency
				const debouncedAppend = debounce((content: string) => {
					set(state => ({
						streamingContent: state.streamingContent + content,
					}));
				}, 50); // 50ms debounce for streaming

				return (content: string) => {
					debouncedAppend(content);
				};
			})(),
			setStreamingContent: content => set({streamingContent: content}),

			clearStreamingContent: () => set({streamingContent: ''}),

			setSystemPrompt: prompt => set({systemPrompt: prompt}),

			// ============================================================
			// AGENT STATE
			// ============================================================
			...initialAgentState,

			setStatus: status => set({status}),

			setCurrentTool: tool => set({currentTool: tool}),

			setError: error => set({error}),

			setProgress: progress => set({progress}),

			setActivity: activity => set({activity}),

			togglePaused: () => set(state => ({paused: !state.paused})),

			resetAgent: () =>
				set({
					...initialAgentState,
				}),

			// ============================================================
			// TOOL USAGE TRACKING
			// ============================================================
			...initialToolsState,

			recordExecution: execution =>
				set(state => {
					const toolName = execution.toolName;
					const timestamp = Date.now();
					const success = execution.success;

					// Update stats
					const currentStats = state.stats[toolName] || {
						calls: 0,
						successes: 0,
						failures: 0,
						successRate: 1,
						totalDuration: 0,
						avgDuration: 0,
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

					const newStats: ToolStats = {
						calls: newCalls,
						successes: newSuccesses,
						failures: newFailures,
						successRate: calculateSuccessRate(newSuccesses, newCalls),
						totalDuration: newTotalDuration,
						avgDuration: newAvgDuration,
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
				}),

			getToolStats: toolName => {
				return get().stats[toolName] || null;
			},

			clearStats: () => set({stats: {}, recentExecutions: []}),

			clearRecentExecutions: () => set({recentExecutions: []}),

			// ============================================================
			// RATE LIMITING
			// ============================================================
			rateLimit: initialRateLimitState,

			setRateLimit: updates =>
				set(state => ({
					rateLimit: {...state.rateLimit, ...updates},
				})),

			recordCall: () =>
				set(state => ({
					rateLimit: {
						...state.rateLimit,
						remaining: Math.max(0, state.rateLimit.remaining - 1),
						lastCall: Date.now(),
					},
				})),

			isRateLimited: () => {
				const {rateLimit} = get();
				if (rateLimit.isLimited) {
					// Check if limit has expired
					if (Date.now() > rateLimit.resetAt) {
						get().resetRateLimit();
						return false;
					}
					return true;
				}
				// Auto-detect if remaining is low and reset time is past
				if (rateLimit.remaining <= 0 && Date.now() > rateLimit.resetAt) {
					get().resetRateLimit();
				}
				return rateLimit.remaining <= 0 && Date.now() < rateLimit.resetAt;
			},

			getRemaining: () => {
				const {rateLimit} = get();
				// Check if we need to reset
				if (
					Date.now() > rateLimit.resetAt &&
					rateLimit.remaining < rateLimit.limit
				) {
					get().resetRateLimit();
					return get().rateLimit.remaining;
				}
				return rateLimit.remaining;
			},

			resetRateLimit: () =>
				set({
					rateLimit: {
						...initialRateLimitState,
						resetAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
					},
				}),

			// ============================================================
			// SESSION MANAGEMENT
			// ============================================================
			session: initialSessionState,
			sessions: [],

			initSession: (_projectId, projectName, rootPath) =>
				set(state => {
					const sessionId = generateId();
					const now = Date.now();

					const newSession: SessionState = {
						id: sessionId,
						createdAt: now,
						lastActivity: now,
						project: {
							name: projectName,
							rootPath,
							currentDirectory: rootPath,
						},
						messageCount: 0,
						totalTokens: 0,
					};

					// Add to sessions list
					const sessionEntry = {
						id: sessionId,
						createdAt: now,
						lastActivity: now,
					};

					return {
						session: newSession,
						sessions: [...state.sessions, sessionEntry],
					};
				}),

			setProjectInfo: info =>
				set(state => ({
					session: state.session.project
						? {
								...state.session,
								project: {...state.session.project, ...info},
						  }
						: state.session,
				})),

			recordActivity: () =>
				set(state => ({
					session: {...state.session, lastActivity: Date.now()},
				})),

			endSession: () =>
				set(state => {
					if (!state.session.id) return state;
					return {
						session: {...initialSessionState},
					};
				}),

			loadSession: sessionId =>
				set(state => {
					const sessionEntry = state.sessions.find(s => s.id === sessionId);
					if (!sessionEntry) return state;

					return {
						session: {
							id: sessionId,
							createdAt: sessionEntry.createdAt,
							lastActivity: sessionEntry.lastActivity,
							project: null, // Would need to load from persisted storage
							messageCount: 0,
							totalTokens: 0,
						},
					};
				}),

			getSessionSummary: () => {
				const {session} = get();
				return {
					id: session.id || '',
					createdAt: session.createdAt || 0,
					messageCount: session.messageCount,
				};
			},

			// ============================================================
			// GLOBAL RESET
			// ============================================================
			reset: () =>
				set({
					...initialConversationState,
					...initialAgentState,
					...initialToolsState,
					rateLimit: initialRateLimitState,
					session: initialSessionState,
					...initialConfigState,
					...initialOverlayState,
				}),
		}),
		{
			name: 'floyd-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					// In Node.js CLI context, we'd use file system or in-memory
					// For now, use localStorage-like interface with memory
					const data = globalThis.__floydStoreMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					if (!globalThis.__floydStoreMemory) {
						globalThis.__floydStoreMemory = {};
					}
					try {
						globalThis.__floydStoreMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydStoreMemory[name] = value;
					}
				},
				removeItem: name => {
					if (globalThis.__floydStoreMemory) {
						delete globalThis.__floydStoreMemory[name];
					}
				},
			})),
			partialize: state => ({
				// Persist conversation, tool stats, session info, and config
				// Don't persist transient agent status
				messages: state.messages,
				systemPrompt: state.systemPrompt,
				stats: state.stats,
				sessions: state.sessions,
				session: state.session,
				safetyMode: state.safetyMode,
				version: state.version,
			}),
		},
	),
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/**
 * Get current conversation messages
 */
export const selectMessages = (state: FloydStore) => state.messages;

/**
 * Get current agent status
 */
export const selectAgentStatus = (state: FloydStore) => state.status;

/**
 * Get tool usage stats
 */
export const selectToolStats = (state: FloydStore) => state.stats;

/**
 * Get rate limit info
 */
export const selectRateLimit = (state: FloydStore) => state.rateLimit;

/**
 * Get current session
 */
export const selectSession = (state: FloydStore) => state.session;

/**
 * Check if agent is currently working (any active state)
 */
export const selectIsAgentWorking = (state: FloydStore) =>
	['thinking', 'streaming', 'tooling', 'running', 'working'].includes(
		state.status,
	);

/**
 * Get total tool calls across all tools
 */
export const selectTotalToolCalls = (state: FloydStore) =>
	Object.values(state.stats).reduce((sum, stat) => sum + stat.calls, 0);

/**
 * Get overlay state
 */
export const selectOverlays = (state: FloydStore) => ({
	showHelp: state.showHelp,
	showMonitor: state.showMonitor,
	showPromptLibrary: state.showPromptLibrary,
	showAgentBuilder: state.showAgentBuilder,
	showCommandPalette: state.showCommandPalette,
	showConfig: state.showConfig,
});

/**
 * Check if any overlay is open
 */
export const selectHasOpenOverlay = (state: FloydStore) =>
	state.showHelp ||
	state.showMonitor ||
	state.showPromptLibrary ||
	state.showAgentBuilder ||
	state.showCommandPalette ||
	state.showConfig;

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydStoreMemory: Record<string, unknown> | undefined;
}
