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
import type {
	DashboardMetrics,
	ErrorMetrics,
} from './dashboard-metrics.js';
import {initialDashboardMetrics, COST_CONFIG} from './dashboard-metrics.js';

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
	safetyMode: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit';
	/** GAP #7 FIX: Pending FUCKIT mode confirmation (shows warning before entering) */
	pendingFuckitMode: boolean;
	/** Toggle safety mode (with confirmation for FUCKIT mode) */
	toggleSafetyMode: () => void;
	/** Confirm entering FUCKIT mode (call after showing warning) */
	confirmFuckitMode: () => void;
	/** Cancel entering FUCKIT mode */
	cancelFuckitMode: () => void;
	/** Set safety mode directly (bypasses confirmation) */
	setSafetyMode: (mode: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit') => void;
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
	/** Session switcher overlay visibility */
	showSessionSwitcher: boolean;
	/** File picker overlay visibility */
	showFilePicker: boolean;
	/** Diff preview overlay visibility */
	showDiffPreview: boolean;
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
	| 'showSessionSwitcher'
	| 'showFilePicker'
	| 'showDiffPreview'
>;

/**
 * Dashboard metrics slice
 */
interface DashboardSlice {
	/** Dashboard metrics data */
	dashboardMetrics: DashboardMetrics;
	/** Record token usage from Claude API */
	recordTokenUsage: (inputTokens: number, outputTokens: number) => void;
	/** Calculate and track API costs */
	calculateCost: (inputTokens: number, outputTokens: number) => void;
	/** Record tool execution metrics */
	recordToolCall: (toolName: string, duration: number, success: boolean) => void;
	/** Record error */
	recordError: (error: {
		message: string;
		type: ErrorMetrics['errors'][0]['type'];
		toolName?: string;
	}) => void;
	/** Resolve error */
	resolveError: (errorId: string, resolutionTime?: number) => void;
	/** Record task completion */
	recordTaskCompletion: () => void;
	/** Update activity time */
	updateActivityTime: (isActive: boolean) => void;
	/** Update streak */
	updateStreak: () => void;
	/** Record response time */
	recordResponseTime: (duration: number) => void;
	/** Set token budget */
	setTokenBudget: (budget: number) => void;
	/** Reset all dashboard metrics */
	resetDashboardMetrics: () => void;
}

/**
 * Main Floyd store state combining all slices
 */
export type FloydStore = ConversationSlice &
	AgentSlice &
	ToolsSlice &
	RateLimitSlice &
	SessionSlice &
	ConfigSlice &
	OverlaySlice &
	DashboardSlice & {
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

const initialConfigState: Omit<ConfigSlice, 'toggleSafetyMode' | 'setSafetyMode' | 'confirmFuckitMode' | 'cancelFuckitMode'> = {
	safetyMode: 'yolo', // UNRESTRICTED YOLO MODE - ALL PERMISSIONS GRANTED
	pendingFuckitMode: false, // No pending FUCKIT mode confirmation
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
	showSessionSwitcher: false,
	showFilePicker: false,
	showDiffPreview: false,
};

const initialDashboardState: Omit<
	DashboardSlice,
	| 'recordTokenUsage'
	| 'calculateCost'
	| 'recordToolCall'
	| 'recordError'
	| 'resolveError'
	| 'recordTaskCompletion'
	| 'updateActivityTime'
	| 'updateStreak'
	| 'recordResponseTime'
	| 'setTokenBudget'
	| 'resetDashboardMetrics'
> = {
	dashboardMetrics: initialDashboardMetrics,
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
			set(state => {
				const modes: Array<'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit'> = ['ask', 'yolo', 'plan', 'auto', 'dialogue', 'fuckit'];
				const currentIndex = modes.indexOf(state.safetyMode);
				const nextIndex = (currentIndex + 1) % modes.length;
				const newMode = modes[nextIndex];

				// GAP #7 FIX: Require confirmation before entering FUCKIT mode
				if (newMode === 'fuckit' && state.safetyMode !== 'fuckit') {
					// Don't actually change mode yet - set pending state
					// UI should show warning and call confirmFuckitMode() or cancelFuckitMode()
					return { pendingFuckitMode: true };
				}

				// GAP #4 FIX: Sync with process.env.FLOYD_MODE so execution engine sees the change
				process.env.FLOYD_MODE = newMode;

				return { safetyMode: newMode };
			}),

			confirmFuckitMode: () =>
			set(() => {
				// GAP #7 FIX: User confirmed - actually enter FUCKIT mode
				process.env.FLOYD_MODE = 'fuckit';
				return { safetyMode: 'fuckit', pendingFuckitMode: false };
			}),

			cancelFuckitMode: () =>
			set(() => {
				// GAP #7 FIX: User cancelled - stay in current mode
				return { pendingFuckitMode: false };
			}),

			setSafetyMode: (mode: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit') =>
			set(() => {
				// GAP #4 FIX: Sync with process.env.FLOYD_MODE so execution engine sees the change
				// GAP #7 FIX: Bypass confirmation for direct set (used by CLI args)
				process.env.FLOYD_MODE = mode;

				return { safetyMode: mode, pendingFuckitMode: false };
			}),

			// ============================================================
			// OVERLAY STATE
			// ============================================================
			...initialOverlayState,

			// ============================================================
			// DASHBOARD METRICS STATE
			// ============================================================
			...initialDashboardState,

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
					showSessionSwitcher: false,
					showFilePicker: false,
					showDiffPreview: false,
				}),

			hasOpenOverlay: () => {
				const state = get();
				return (
					state.showHelp ||
					state.showMonitor ||
					state.showPromptLibrary ||
					state.showAgentBuilder ||
					state.showCommandPalette ||
					state.showConfig ||
					state.showSessionSwitcher ||
					state.showFilePicker ||
					state.showDiffPreview
				);
			},

			addMessage: message =>
				set(produce(state => {
					// Add new message efficiently using immer
					state.messages.push(message);

					// Trim to max messages if needed
					if (state.messages.length > state.maxMessages) {
						state.messages = state.messages.slice(-state.maxMessages);
					}

					// Update session metadata
					state.session.messageCount = state.messages.length;
					state.session.lastActivity = Date.now();
				})),

			updateMessage: (id, updates) =>
				set(produce(state => {
					// Find and update message efficiently using immer
					const messageIndex = state.messages.findIndex(msg => msg.id === id);
					if (messageIndex !== -1) {
						Object.assign(state.messages[messageIndex], updates);
					}
				})),

			removeMessage: id =>
				set(state => ({
					messages: state.messages.filter(msg => msg.id !== id),
				})),

			clearMessages: () =>
				set({
					messages: [],
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
			// DASHBOARD METRICS ACTIONS
			// ============================================================
			recordTokenUsage: (inputTokens, outputTokens) =>
				set(produce(state => {
					const metrics = state.dashboardMetrics.tokenUsage;
					metrics.totalTokens += inputTokens + outputTokens;
					metrics.inputTokens += inputTokens;
					metrics.outputTokens += outputTokens;
					metrics.requestCount = state.messages.length;

					// Update average
					metrics.avgTokensPerRequest =
						metrics.requestCount > 0
							? metrics.totalTokens / metrics.requestCount
							: 0;

					// Add to history
					metrics.history.push({
						timestamp: Date.now(),
						tokens: inputTokens + outputTokens,
						requestCount: 1,
					});

					// Keep last 100 history entries
					if (metrics.history.length > 100) {
						metrics.history = metrics.history.slice(-100);
					}
				})),

			setTokenBudget: (budget) =>
				set(produce(state => {
					state.dashboardMetrics.tokenUsage.tokenBudget = budget;
				})),

			recordToolCall: (toolName, duration, success) =>
				set(produce(state => {
					const tools = state.dashboardMetrics.toolPerformance.tools;
					if (!tools[toolName]) {
						tools[toolName] = {
							calls: 0,
							successes: 0,
							failures: 0,
							totalDuration: 0,
							avgDuration: 0,
							successRate: 1,
							lastUsed: null,
						};
					}

					const tool = tools[toolName];
					tool.calls += 1;
					tool.totalDuration += duration;
					tool.avgDuration = tool.totalDuration / tool.calls;
					tool.lastUsed = Date.now();

					if (success) {
						tool.successes += 1;
					} else {
						tool.failures += 1;
					}

					tool.successRate = tool.successes / tool.calls;
				})),

			recordError: ({message, type, toolName}) =>
				set(produce(state => {
					const errors = state.dashboardMetrics.errors.errors;

					// Check if similar error already exists
					const existingError = errors.find(
						e =>
							e.message === message &&
							e.type === type &&
							(!toolName || e.toolName === toolName),
					);

					if (existingError) {
						existingError.count++;
					} else {
						errors.push({
							id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
							timestamp: Date.now(),
							resolved: false,
							count: 1,
							message,
							type,
							toolName,
						});
					}

					// Keep last 100 errors
					if (errors.length > 100) {
						state.dashboardMetrics.errors.errors = errors.slice(-100);
					}
				})),

			resolveError: (errorId, resolutionTime) =>
				set(produce(state => {
					const error = state.dashboardMetrics.errors.errors.find(
						e => e.id === errorId,
					);
					if (error) {
						error.resolved = true;
						error.resolutionTime = resolutionTime || Date.now() - error.timestamp;
					}
				})),

			recordTaskCompletion: () =>
				set(produce(state => {
					const productivity = state.dashboardMetrics.productivity;
					productivity.tasksCompleted++;
					productivity.tasksToday++;
					productivity.lastActivity = Date.now();
				})),

			updateActivityTime: (isActive) =>
				set(produce(state => {
					const productivity = state.dashboardMetrics.productivity;
					productivity.sessionMinutes += 1/60; // Approximate per-minute update
					if (isActive) {
						productivity.activeMinutes += 1/60;
					} else {
						productivity.idleMinutes += 1/60;
					}

					// Calculate derived metrics
					productivity.tasksPerHour =
						productivity.sessionMinutes > 0
							? (productivity.tasksCompleted / productivity.sessionMinutes) * 60
							: 0;

					productivity.activityScore =
						productivity.activeMinutes > 0
							? Math.min(100, Math.round((productivity.tasksCompleted / productivity.activeMinutes) * 60))
							: 0;
				})),

			updateStreak: () =>
				set(produce(state => {
					const productivity = state.dashboardMetrics.productivity;
					const now = Date.now();
					const lastActivity = productivity.lastActivity;
					const oneDay = 24 * 60 * 60 * 1000;

					// Check if last activity was today
					const lastActivityDate = new Date(lastActivity).toDateString();
					const todayDate = new Date(now).toDateString();

					if (lastActivityDate !== todayDate) {
						// New day
						if (lastActivityDate === new Date(now - oneDay).toDateString()) {
							// Yesterday - increment streak
							productivity.streak++;
							productivity.bestStreak = Math.max(
								productivity.streak,
								productivity.bestStreak,
							);
						} else {
							// Streak broken
							productivity.streak = 1;
						}

						// Reset daily counters
						productivity.tasksToday = 0;
						productivity.sessionsToday = 0;

						// Add to history
						const yesterday = new Date(now - oneDay).toISOString().split('T')[0];
						productivity.history.push({
							date: yesterday,
							tasks: productivity.tasksToday,
							sessionMinutes: productivity.sessionMinutes,
						});

						// Keep last 30 days
						if (productivity.history.length > 30) {
							productivity.history = productivity.history.slice(-30);
						}
					}
				})),

			recordResponseTime: (duration) =>
				set(produce(state => {
					const metrics = state.dashboardMetrics.responseTime;
					metrics.times.push(duration);

					// Keep last 1000 measurements
					if (metrics.times.length > 1000) {
						metrics.times = metrics.times.slice(-1000);
					}

					// Update average and percentiles
					if (metrics.times.length > 0) {
						const sum = metrics.times.reduce((a, b) => a + b, 0);
						metrics.averageTime = sum / metrics.times.length;

						const sorted = [...metrics.times].sort((a, b) => a - b);
						const len = metrics.times.length;

						metrics.p50 = sorted[Math.floor(len * 0.5)];
						metrics.p95 = sorted[Math.floor(len * 0.95)];
						metrics.p99 = sorted[Math.floor(len * 0.99)];
					}
				})),

			calculateCost: (inputTokens, outputTokens) =>
				set(produce(state => {
					const inputCost = (inputTokens / 1000) * COST_CONFIG.INPUT_COST_PER_1K;
					const outputCost = (outputTokens / 1000) * COST_CONFIG.OUTPUT_COST_PER_1K;
					const totalCost = inputCost + outputCost;

					state.dashboardMetrics.costs.totalCost += totalCost;
					state.dashboardMetrics.costs.inputCost += inputCost;
					state.dashboardMetrics.costs.outputCost += outputCost;
					state.dashboardMetrics.costs.costPerRequest =
						state.messages.length > 0
							? state.dashboardMetrics.costs.totalCost / state.messages.length
							: 0;

					// Update estimated cost in token usage
					state.dashboardMetrics.tokenUsage.estimatedCost += totalCost;
				})),

			resetDashboardMetrics: () =>
				set({
					dashboardMetrics: initialDashboardMetrics,
				}),

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
					...initialDashboardState,
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
				dashboardMetrics: state.dashboardMetrics,
			}),
		},
	),
);

// ============================================================================
// GAP #4 FIX: Initialize process.env.FLOYD_MODE from persisted state
// ============================================================================

/**
 * Initialize FLOYD_MODE environment variable from the store's safety mode.
 * This ensures the execution engine reads the correct mode on startup.
 * Call this when the application starts.
 */
export function initializeFloydMode(): void {
	const currentMode = useFloydStore.getState().safetyMode;
	process.env.FLOYD_MODE = currentMode;
}

// Auto-initialize on module load
initializeFloydMode();

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
	showSessionSwitcher: state.showSessionSwitcher,
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
	state.showConfig ||
	state.showSessionSwitcher ||
	state.showFilePicker ||
	state.showDiffPreview;

/**
 * Get dashboard metrics
 */
export const selectDashboardMetrics = (state: FloydStore) => state.dashboardMetrics;

/**
 * Get token usage metrics
 */
export const selectTokenUsage = (state: FloydStore) => ({
	totalTokens: state.dashboardMetrics.tokenUsage.totalTokens,
	inputTokens: state.dashboardMetrics.tokenUsage.inputTokens,
	outputTokens: state.dashboardMetrics.tokenUsage.outputTokens,
	requestCount: state.dashboardMetrics.tokenUsage.requestCount,
	avgTokensPerRequest: state.dashboardMetrics.tokenUsage.avgTokensPerRequest,
	estimatedCost: state.dashboardMetrics.tokenUsage.estimatedCost,
	tokenBudget: state.dashboardMetrics.tokenUsage.tokenBudget,
	history: state.dashboardMetrics.tokenUsage.history,
});

/**
 * Get tool performance metrics
 */
export const selectToolPerformance = (state: FloydStore) =>
	state.dashboardMetrics.toolPerformance.tools;

/**
 * Get error metrics
 */
export const selectErrors = (state: FloydStore) =>
	state.dashboardMetrics.errors.errors;

/**
 * Get productivity metrics
 */
export const selectProductivity = (state: FloydStore) => ({
	tasksCompleted: state.dashboardMetrics.productivity.tasksCompleted,
	sessionMinutes: state.dashboardMetrics.productivity.sessionMinutes,
	activeMinutes: state.dashboardMetrics.productivity.activeMinutes,
	idleMinutes: state.dashboardMetrics.productivity.idleMinutes,
	tasksPerHour: state.dashboardMetrics.productivity.tasksPerHour,
	activityScore: state.dashboardMetrics.productivity.activityScore,
	streak: state.dashboardMetrics.productivity.streak,
	bestStreak: state.dashboardMetrics.productivity.bestStreak,
	sessionsToday: state.dashboardMetrics.productivity.sessionsToday,
	tasksToday: state.dashboardMetrics.productivity.tasksToday,
	lastActivity: state.dashboardMetrics.productivity.lastActivity,
	history: state.dashboardMetrics.productivity.history,
});

/**
 * Get response time metrics
 */
export const selectResponseTimes = (state: FloydStore) => ({
	averageTime: state.dashboardMetrics.responseTime.averageTime,
	p50: state.dashboardMetrics.responseTime.p50,
	p95: state.dashboardMetrics.responseTime.p95,
	p99: state.dashboardMetrics.responseTime.p99,
});

/**
 * Get cost metrics
 */
export const selectCosts = (state: FloydStore) => ({
	totalCost: state.dashboardMetrics.costs.totalCost,
	inputCost: state.dashboardMetrics.costs.inputCost,
	outputCost: state.dashboardMetrics.costs.outputCost,
	costPerRequest: state.dashboardMetrics.costs.costPerRequest,
});

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydStoreMemory: Record<string, unknown> | undefined;
}
