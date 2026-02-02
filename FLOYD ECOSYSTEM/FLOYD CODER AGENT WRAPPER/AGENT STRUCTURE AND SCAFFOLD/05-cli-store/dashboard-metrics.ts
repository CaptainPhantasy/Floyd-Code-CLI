/**
 * Dashboard Metrics Store Extension
 *
 * This file contains the store updates needed to track real dashboard data.
 * Add this content to floyd-store.ts to enable real data collection.
 */

import {create} from 'zustand';
import {persist, type StateStorage} from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Token usage metrics
 */
export interface TokenUsageMetrics {
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	requestCount: number;
	avgTokensPerRequest: number;
	estimatedCost: number;
	tokenBudget?: number;
	history: Array<{
		timestamp: number;
		tokens: number;
		requestCount: number;
	}>;
}

/**
 * Tool performance metrics
 */
export interface ToolPerformanceMetrics {
	tools: Record<string, {
		calls: number;
		successes: number;
		failures: number;
		totalDuration: number;
		avgDuration: number;
		successRate: number;
		lastUsed: number | null;
	}>;
}

/**
 * Error tracking metrics
 */
export interface ErrorMetrics {
	errors: Array<{
		id: string;
		message: string;
		type: 'tool' | 'api' | 'permission' | 'system' | 'unknown';
		toolName?: string;
		timestamp: number;
		resolved: boolean;
		resolutionTime?: number;
		count: number;
	}>;
}

/**
 * Productivity metrics
 */
export interface ProductivityMetrics {
	tasksCompleted: number;
	sessionMinutes: number;
	activeMinutes: number;
	idleMinutes: number;
	tasksPerHour: number;
	activityScore: number;
	streak: number;
	bestStreak: number;
	sessionsToday: number;
	tasksToday: number;
	lastActivity: number;
	history: Array<{
		date: string;
		tasks: number;
		sessionMinutes: number;
	}>;
}

/**
 * Response time metrics
 */
export interface ResponseTimeMetrics {
	times: number[];
	averageTime: number;
	p50: number;
	p95: number;
	p99: number;
}

/**
 * Cost analysis metrics
 */
export interface CostMetrics {
	totalCost: number;
	inputCost: number;
	outputCost: number;
	costPerRequest: number;
	hourlyCost?: number;
	dailyCost?: number;
}

/**
 * Complete dashboard metrics state
 */
export interface DashboardMetrics {
	tokenUsage: TokenUsageMetrics;
	toolPerformance: ToolPerformanceMetrics;
	errors: ErrorMetrics;
	productivity: ProductivityMetrics;
	responseTime: ResponseTimeMetrics;
	costs: CostMetrics;
}

// ============================================================================
// STORE ACTIONS
// ============================================================================

/**
 * Actions for recording dashboard metrics
 */
export interface DashboardActions {
	// Token usage tracking
	recordTokenUsage: (inputTokens: number, outputTokens: number) => void;
	setTokenBudget: (budget: number) => void;

	// Tool performance tracking
	recordToolCall: (toolName: string, duration: number, success: boolean) => void;

	// Error tracking
	recordError: (error: {
		message: string;
		type: ErrorMetrics['errors'][0]['type'];
		toolName?: string;
	}) => void;
	resolveError: (errorId: string, resolutionTime?: number) => void;

	// Productivity tracking
	recordTaskCompletion: () => void;
	updateActivityTime: (isActive: boolean) => void;
	updateStreak: () => void;

	// Response time tracking
	recordResponseTime: (duration: number) => void;

	// Cost tracking
	calculateCost: (inputTokens: number, outputTokens: number) => void;
}

// ============================================================================
// COST CONSTANTS
// ============================================================================

/**
 * Update these values based on your actual API pricing
 */
const COST_CONFIG = {
	// Claude API pricing (example)
	INPUT_COST_PER_1K: 0.003, // $0.003 per 1K input tokens
	OUTPUT_COST_PER_1K: 0.015, // $0.015 per 1K output tokens

	// Or GPT-4 pricing (alternative example)
	// INPUT_COST_PER_1K: 0.03,
	// OUTPUT_COST_PER_1K: 0.06,

	// Token budget limits
	MAX_TOKEN_BUDGET: 100000, // 100K tokens default budget
} as const;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialDashboardMetrics: DashboardMetrics = {
	tokenUsage: {
		totalTokens: 0,
		inputTokens: 0,
		outputTokens: 0,
		requestCount: 0,
		avgTokensPerRequest: 0,
		estimatedCost: 0,
		tokenBudget: undefined,
		history: [],
	},
	toolPerformance: {
		tools: {},
	},
	errors: {
		errors: [],
	},
	productivity: {
		tasksCompleted: 0,
		sessionMinutes: 0,
		activeMinutes: 0,
		idleMinutes: 0,
		tasksPerHour: 0,
		activityScore: 0,
		streak: 0,
		bestStreak: 0,
		sessionsToday: 1,
		tasksToday: 0,
		lastActivity: Date.now(),
		history: [],
	},
	responseTime: {
		times: [],
		averageTime: 0,
		p50: 0,
		p95: 0,
		p99: 0,
	},
	costs: {
		totalCost: 0,
		inputCost: 0,
		outputCost: 0,
		costPerRequest: 0,
		hourlyCost: undefined,
		dailyCost: undefined,
	},
};

// ============================================================================
// IMPLEMENTATION HELPERS
// ============================================================================

/**
 * Calculate cost from token usage
 */
function calculateTokenCost(inputTokens: number, outputTokens: number): {
	total: number;
	input: number;
	output: number;
} {
	const inputCost = (inputTokens / 1000) * COST_CONFIG.INPUT_COST_PER_1K;
	const outputCost = (outputTokens / 1000) * COST_CONFIG.OUTPUT_COST_PER_1K;
	return {
		total: inputCost + outputCost,
		input: inputCost,
		output: outputCost,
	};
}

/**
 * Calculate percentiles from array of numbers
 */
function calculatePercentiles(times: number[]) {
	if (times.length === 0) {
		return {p50: 0, p95: 0, p99: 0};
	}

	const sorted = [...times].sort((a, b) => a - b);
	const len = times.length;

	return {
		p50: sorted[Math.floor(len * 0.5)],
		p95: sorted[Math.floor(len * 0.95)],
		p99: sorted[Math.floor(len * 0.99)],
	};
}

/**
 * Calculate response time metrics
 */
function updateResponseTimeMetrics(times: number[]): ResponseTimeMetrics {
	if (times.length === 0) {
		return {
			times: [],
			averageTime: 0,
			p50: 0,
			p95: 0,
			p99: 0,
		};
	}

	const sum = times.reduce((a, b) => a + b, 0);
	const averageTime = sum / times.length;
	const {p50, p95, p99} = calculatePercentiles(times);

	return {
		times,
		averageTime,
		p50,
		p95,
		p99,
	};
}

/**
 * Calculate tool performance metrics
 */
function updateToolMetrics(
	tools: Record<string, unknown>,
	toolName: string,
	duration: number,
	success: boolean,
): ToolPerformanceMetrics['tools'] {
	const currentTools = tools as Record<string, ToolPerformanceMetrics['tools'][string]>;

	if (!currentTools[toolName]) {
		currentTools[toolName] = {
			calls: 0,
			successes: 0,
			failures: 0,
			totalDuration: 0,
			avgDuration: 0,
			successRate: 1,
			lastUsed: null,
		};
	}

	const tool = currentTools[toolName];
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

	return currentTools;
}

/**
 * Calculate productivity metrics
 */
function updateProductivityMetrics(
	productivity: ProductivityMetrics,
	active: boolean,
): ProductivityMetrics {
	productivity.sessionMinutes += 1/60; // Approximate per-minute update

	if (active) {
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

	return productivity;
}

// ============================================================================
// EXPORTS FOR INTEGRATION
// ============================================================================

export {
	initialDashboardMetrics,
	calculateTokenCost,
	updateResponseTimeMetrics,
	updateToolMetrics,
	updateProductivityMetrics,
	COST_CONFIG,
};
