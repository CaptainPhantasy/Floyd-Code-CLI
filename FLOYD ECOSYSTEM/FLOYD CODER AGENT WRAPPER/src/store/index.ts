/**
 * Store Module
 *
 * Centralized exports for all Zustand stores.
 * Each store handles a specific domain of application state.
 *
 * @module store
 */

// Conversation store - chat messages with persistence
export {
	useConversationStore,
	selectMessages,
	selectLastMessage,
	selectMessageCount,
	selectHasMessages,
	type ConversationMessage,
} from './conversation-store.js';

// Main Floyd store - combines all state slices
export {
	useFloydStore,
	selectMessages as selectFloydMessages,
	selectAgentStatus,
	selectToolStats,
	selectRateLimit,
	selectSession,
	selectIsAgentWorking,
	selectTotalToolCalls,
	type ConversationMessage as FloydConversationMessage,
	type ToolExecution,
	type ToolStats,
	type RateLimitState,
	type ProjectInfo,
	type SessionState,
} from './floyd-store.js';

// Session store - session persistence to ~/.floyd/
export {
	useSessionStore,
	SessionManager,
	selectCurrentSession,
	selectCurrentSessionId,
	selectHasActiveSession,
	selectSessionsCount,
	type SessionData,
	type ProjectInfo as SessionProjectInfo,
} from './session-store.js';

// History store - command history storage
export {
	useHistoryStore,
	selectHistory,
	selectHistoryLength,
	selectIsHistoryEmpty,
	selectHistoryPosition,
	selectSearchQuery,
	selectFilteredHistory,
	type HistoryEntry,
} from './history-store.js';

// Tool usage store - tool execution tracking
export {
	useToolUsageStore,
	selectAllToolStats,
	selectTotalToolCalls as selectTotalToolCallsUsage,
	selectOverallSuccessRate,
	selectRecentExecutions,
	selectUniqueToolCount,
	type ToolExecution as ToolUsageExecution,
	type ToolStats as ToolUsageStats,
} from './tool-usage-store.js';

// Config store - monitoring configuration
export {
	useConfigStore,
	type MonitorConfig,
	type WatchPattern,
	type MCPServerConfig,
	type EventFilter,
} from './config-store.js';

// Agent store - agent profile management
export {
	useAgentStore,
	type AgentProfile,
} from './agent-store.js';

// Prompt store - prompt template library
export {
	usePromptStore,
	type PromptTemplate,
	type PromptCategory,
	type PromptVariable,
	type PromptExample,
} from './prompt-store.js';
