/**
 * Retry Guard - Loop Detection Mechanism
 *
 * PHASE 3 ITEM 8: Loop detection mechanism
 *
 * Prevents infinite loops and repeated failed attempts by:
 * - Tracking tool execution history
 * - Detecting repetitive patterns
 * - Enforcing maximum retry limits
 * - Providing loop-breaking recommendations
 */

/**
 * Tool execution record for tracking (guards module)
 */
export interface GuardToolExecution {
	toolName: string;
	parameters: Record<string, unknown>;
	timestamp: number;
	result?: 'success' | 'error';
	error?: string;
}

/**
 * Loop detection result
 */
export interface LoopDetection {
	isLoop: boolean;
	loopType: 'exact' | 'similar' | 'none';
	count: number;
	uniqueTools: string[];
	recommendation?: string;
}

/**
 * Retry guard configuration
 */
export interface RetryGuardConfig {
	maxExactRepeats: number;
	maxSimilarAttempts: number;
	maxTotalAttempts: number;
	loopWindowMs: number; // Time window to consider for loop detection
}

const DEFAULT_CONFIG: RetryGuardConfig = {
	maxExactRepeats: 3,
	maxSimilarAttempts: 5,
	maxTotalAttempts: 20,
	loopWindowMs: 60000, // 1 minute
};

/**
 * Retry Guard class for loop detection
 */
export class RetryGuard {
	private history: GuardToolExecution[] = [];
	private config: RetryGuardConfig;

	constructor(config: Partial<RetryGuardConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Record a tool execution
	 */
	recordExecution(execution: GuardToolExecution): void {
		this.history.push({
			...execution,
			timestamp: execution.timestamp || Date.now(),
		});

		// Trim old history outside the window
		const cutoff = Date.now() - this.config.loopWindowMs;
		this.history = this.history.filter(e => e.timestamp > cutoff);
	}

	/**
	 * Check if the next execution would create a loop
	 */
	checkLoop(nextTool: string, nextParams: Record<string, unknown>): LoopDetection {
		if (this.history.length === 0) {
			return {
				isLoop: false,
				loopType: 'none',
				count: 0,
				uniqueTools: [],
			};
		}

		// Check for exact repeats
		const exactRepeats = this.history.filter(
			e => e.toolName === nextTool && JSON.stringify(e.parameters) === JSON.stringify(nextParams)
		).length;

		if (exactRepeats >= this.config.maxExactRepeats) {
			const uniqueTools = Array.from(new Set(this.history.map(e => e.toolName)));
			return {
				isLoop: true,
				loopType: 'exact',
				count: exactRepeats,
				uniqueTools,
				recommendation: `Tool "${nextTool}" executed ${exactRepeats} times with identical parameters. Try a different approach or verify the target state.`,
			};
		}

		// Check for similar attempts (same tool, different params)
		const similarAttempts = this.history.filter(e => e.toolName === nextTool).length;

		if (similarAttempts >= this.config.maxSimilarAttempts) {
			const uniqueTools = Array.from(new Set(this.history.map(e => e.toolName)));
			return {
				isLoop: true,
				loopType: 'similar',
				count: similarAttempts,
				uniqueTools,
				recommendation: `Tool "${nextTool}" attempted ${similarAttempts} times. Consider using a different tool or verifying intermediate results.`,
			};
		}

		// Check for tool oscillation (A-B-A-B pattern)
		if (this.history.length >= 4) {
			const last4 = this.history.slice(-4);
			const tools = last4.map(e => e.toolName);

			if (tools[0] === tools[2] && tools[1] === tools[3] && tools[0] !== tools[1]) {
				return {
					isLoop: true,
					loopType: 'similar',
					count: 2,
					uniqueTools: Array.from(new Set(tools)),
					recommendation: `Detected oscillation between "${tools[0]}" and "${tools[1]}". Try a different approach or break the cycle with a verification step.`,
				};
			}
		}

		// Check total attempts
		if (this.history.length >= this.config.maxTotalAttempts) {
			const uniqueTools = Array.from(new Set(this.history.map(e => e.toolName)));
			return {
				isLoop: true,
				loopType: 'similar',
				count: this.history.length,
				uniqueTools,
				recommendation: `Maximum total attempts (${this.config.maxTotalAttempts}) reached. Please reassess the task approach.`,
			};
		}

		return {
			isLoop: false,
			loopType: 'none',
			count: 0,
			uniqueTools: Array.from(new Set(this.history.map(e => e.toolName))),
		};
	}

	/**
	 * Get execution history
	 */
	getHistory(): GuardToolExecution[] {
		return [...this.history];
	}

	/**
	 * Clear history
	 */
	clear(): void {
		this.history = [];
	}

	/**
	 * Get summary statistics
	 */
	getSummary() {
		const toolCounts = new Map<string, number>();
		const errorCounts = new Map<string, number>();

		for (const exec of this.history) {
			toolCounts.set(exec.toolName, (toolCounts.get(exec.toolName) || 0) + 1);
			if (exec.result === 'error') {
				errorCounts.set(exec.toolName, (errorCounts.get(exec.toolName) || 0) + 1);
			}
		}

		return {
			totalExecutions: this.history.length,
			uniqueTools: toolCounts.size,
			toolCounts: Object.fromEntries(toolCounts),
			errorCounts: Object.fromEntries(errorCounts),
		};
	}
}

/**
 * Create a retry guard with default configuration
 */
export function createRetryGuard(config?: Partial<RetryGuardConfig>): RetryGuard {
	return new RetryGuard(config);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error | string): boolean {
	const message = typeof error === 'string' ? error : error.message;

	// Non-retryable errors
	const nonRetryablePatterns = [
		/permission denied/i,
		/unauthorized/i,
		/not found/i,
		/ENOENT/i,
		/404/i,
		/403/i,
		/401/i,
		/syntax error/i,
		/type error/i,
	];

	for (const pattern of nonRetryablePatterns) {
		if (pattern.test(message)) {
			return false;
		}
	}

	return true;
}

/**
 * Get recommended delay before retry (exponential backoff)
 */
export function getRetryDelay(attemptNumber: number): number {
	const baseDelay = 1000; // 1 second
	const maxDelay = 30000; // 30 seconds
	const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
	return delay;
}
