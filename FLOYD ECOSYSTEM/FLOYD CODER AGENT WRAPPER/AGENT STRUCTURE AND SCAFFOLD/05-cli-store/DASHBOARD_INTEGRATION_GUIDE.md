/**
 * Floyd Store Dashboard Integration Guide
 *
 * Follow these steps to add dashboard metrics tracking to floyd-store.ts
 *
 * FILE: /Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/store/floyd-store.ts
 */

// ============================================================================
// STEP 1: Import Dashboard Metrics
// ============================================================================

// Add this import at the top of floyd-store.ts
import {
	type DashboardMetrics,
	type DashboardActions,
	initialDashboardMetrics,
	COST_CONFIG,
	calculateTokenCost,
	updateResponseTimeMetrics,
	updateToolMetrics,
	updateProductivityMetrics,
} from './dashboard-metrics.js';

// ============================================================================
// STEP 2: Extend FloydStore Type
// ============================================================================

// Find the FloydStore type definition and add dashboardMetrics and dashboard actions:

type FloydStore = ConversationSlice &
	AgentSlice &
	ToolsSlice &
	RateLimitSlice &
	SessionSlice &
	ConfigSlice &
	OverlaySlice &
	DashboardSlice & {  // ← Add this
		/** Reset entire store to initial state */
		reset: () => void;

		// ... existing ...
	};

// ============================================================================
// STEP 3: Add DashboardSlice to Initial State
// ============================================================================

// Inside create<FloydStore>()(() => ({
//   Add this to the initial state:

export const useFloydStore = create<FloydStore>()(
	persist(
		(set, get) => ({
			// Version for migrations
			version: 1,

			// ... existing slices ...

			// ============================================================
			// DASHBOARD METRICS SLICE  ← Add this entire section
			// ============================================================
			dashboardMetrics: initialDashboardMetrics,

			// Token usage tracking
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

			// Tool performance tracking
			recordToolCall: (toolName, duration, success) =>
				set(produce(state => {
					state.dashboardMetrics.toolPerformance.tools = updateToolMetrics(
						state.dashboardMetrics.toolPerformance.tools,
						toolName,
						duration,
						success,
					);
				})),

			// Error tracking
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

			// Productivity tracking
			recordTaskCompletion: () =>
				set(produce(state => {
					const productivity = state.dashboardMetrics.productivity;
					productivity.tasksCompleted++;
					productivity.tasksToday++;
					productivity.lastActivity = Date.now();
				})),

			updateActivityTime: (isActive) =>
				set(produce(state => {
					state.dashboardMetrics.productivity = updateProductivityMetrics(
						state.dashboardMetrics.productivity,
						isActive,
					);
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
							productivity.streak = 0;
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

			// Response time tracking
			recordResponseTime: (duration) =>
				set(produce(state => {
					const metrics = state.dashboardMetrics.responseTime;
					metrics.times.push(duration);

					// Keep last 1000 measurements
					if (metrics.times.length > 1000) {
						metrics.times = metrics.times.slice(-1000);
					}

					// Update percentiles
					Object.assign(
						metrics,
						updateResponseTimeMetrics(metrics.times),
					);
				})),

			// Cost tracking
			calculateCost: (inputTokens, outputTokens) =>
				set(produce(state => {
					const costs = calculateTokenCost(inputTokens, outputTokens);

					state.dashboardMetrics.costs.totalCost += costs.total;
					state.dashboardMetrics.costs.inputCost += costs.input;
					state.dashboardMetrics.costs.outputCost += costs.output;
					state.dashboardMetrics.costs.costPerRequest =
						state.messages.length > 0
							? state.dashboardMetrics.costs.totalCost / state.messages.length
							: 0;

					// Update estimated cost in token usage
					state.dashboardMetrics.tokenUsage.estimatedCost +=
						costs.total;
				})),

			// Reset dashboard metrics
			resetDashboardMetrics: () =>
				set({
					dashboardMetrics: initialDashboardMetrics,
				}),
		// ... rest of store
		}),
		{
			name: 'floyd-store',
			partialize: state => ({
				messages: state.messages,
				// ... other persisted state
				dashboardMetrics: state.dashboardMetrics,  // ← Persist dashboard metrics
			}),
		},
	),
);

// ============================================================================
// STEP 4: Add Dashboard Selectors
// ============================================================================

// Add these selectors to floyd-store.ts (at the bottom, near existing selectors)

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
// STEP 5: Add Type Definitions
// ============================================================================

// Add DashboardSlice to the type definitions section of floyd-store.ts:

interface DashboardSlice {
	dashboardMetrics: DashboardMetrics;
	recordTokenUsage: (inputTokens: number, outputTokens: number) => void;
	setTokenBudget: (budget: number) => void;
	recordToolCall: (toolName: string, duration: number, success: boolean) => void;
	recordError: (error: {
		message: string;
		type: ErrorMetrics['errors'][0]['type'];
		toolName?: string;
	}) => void;
	resolveError: (errorId: string, resolutionTime?: number) => void;
	recordTaskCompletion: () => void;
	updateActivityTime: (isActive: boolean) => void;
	updateStreak: () => void;
	recordResponseTime: (duration: number) => void;
	calculateCost: (inputTokens: number, outputTokens: number) => void;
	resetDashboardMetrics: () => void;
}

// ============================================================================
// INTEGRATION COMPLETE!
// ============================================================================

// Now you can use the store actions anywhere in Floyd CLI:

// Example: Recording token usage
// useFloydStore.getState().recordTokenUsage(1234, 5678);

// Example: Recording tool call
// useFloydStore.getState().recordToolCall('file-editor', 1234, true);

// Example: Recording error
// useFloydStore.getState().recordError({
//   message: 'Permission denied',
//   type: 'permission',
// });

// Example: Getting dashboard data
// const tokenData = useFloydStore(selectTokenUsage);
// const toolData = useFloydStore(selectToolPerformance);
