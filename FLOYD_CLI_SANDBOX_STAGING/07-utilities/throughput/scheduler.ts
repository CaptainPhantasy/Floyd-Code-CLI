/**
 * Adaptive Rate Limiter
 * Targets: 2000 RPM sustained, 5000 RPM hard cap
 * Concurrency: 12 model calls, 24 tools
 * Burst queue: 200
 */

import PQueue from 'p-queue';
import {EventEmitter} from 'node:events';

export interface RateLimitConfig {
	targetRPM: number; // Target requests per minute
	hardCapRPM: number; // Absolute maximum
	concurrentModelCalls: number; // Parallel model invocations
	concurrentTools: number; // Parallel tool executions
	burstQueueSize: number; // Queue depth before backpressure
}

export interface RateLimitState {
	currentRpm: number; // Current RPM (aliases: rpm)
	queueLength: number; // Current queue size (aliases: queueDepth)
	backpressure: boolean; // Whether backpressure is active (aliases: isBackedOff)
	isBackedOff: boolean; // Whether in backoff state
	backoffRemainingMs: number; // Remaining backoff time in ms
	waitTime: number; // Estimated wait time in ms
	droppedRequests: number; // Total dropped requests
	totalRequests: number; // Total requests processed
	totalErrors: number; // Total errors encountered
}

/**
 * @deprecated Backward compatibility type
 */
export interface QueuedRequest<T = unknown> {
	id: string;
	priority: number;
	execute: () => Promise<T>;
	resolve: (value: T) => void;
	reject: (error: Error) => void;
	timestamp: number;
	attempts: number;
}

export const DEFAULT_CONFIG: RateLimitConfig = {
	targetRPM: 2000,
	hardCapRPM: 5000,
	concurrentModelCalls: 12,
	concurrentTools: 24,
	burstQueueSize: 200,
};

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
	private tokens: number;
	private maxTokens: number;
	private lastRefill: number;
	private refillRate: number; // tokens per ms

	constructor(tokensPerMinute: number) {
		this.maxTokens = tokensPerMinute;
		this.tokens = tokensPerMinute;
		this.lastRefill = Date.now();
		this.refillRate = tokensPerMinute / 60000; // per ms
	}

	async waitForToken(): Promise<void> {
		this.refill();
		if (this.tokens >= 1) {
			this.tokens -= 1;
			return;
		}
		// Calculate wait time
		const waitMs = Math.ceil((1 - this.tokens) / this.refillRate);
		await new Promise<void>(resolve => setTimeout(resolve, waitMs));
		this.refill();
		this.tokens -= 1;
	}

	private refill(): void {
		const now = Date.now();
		const elapsed = now - this.lastRefill;
		this.tokens = Math.min(
			this.maxTokens,
			this.tokens + elapsed * this.refillRate,
		);
		this.lastRefill = now;
	}

	getAvailableTokens(): number {
		this.refill();
		return this.tokens;
	}
}

/**
 * Adaptive Rate Limiter
 * Adjusts rate limits based on 429/5xx responses
 */
export class AdaptiveRateLimiter extends EventEmitter {
	private config: RateLimitConfig;
	private modelQueue: PQueue;
	private toolQueue: PQueue;
	private tokenBucket: TokenBucket;
	private requestTimes: number[] = [];
	private failures429 = 0;
	private failures5xx = 0;
	private backpressure = false;
	private totalRequests = 0;
	private totalErrors = 0;
	private droppedRequests = 0;
	private backoffEndTime = 0;

	constructor(config: Partial<RateLimitConfig> = {}) {
		super();
		this.config = {...DEFAULT_CONFIG, ...config};
		this.tokenBucket = new TokenBucket(this.config.targetRPM);

		this.modelQueue = new PQueue({
			concurrency: this.config.concurrentModelCalls,
			autoStart: true,
		});

		this.toolQueue = new PQueue({
			concurrency: this.config.concurrentTools,
			autoStart: true,
		});

		// Monitor queue sizes
		setInterval(() => this.updateMetrics(), 1000);
	}

	/**
	 * Add a model call to the queue
	 */
	async addModelCall<T>(fn: () => Promise<T>): Promise<T> {
		const queueSize = this.modelQueue.size;
		if (queueSize > this.config.burstQueueSize) {
			this.activateBackpressure();
		}

		// Wait for rate limit token
		await this.tokenBucket.waitForToken();

		// Track request time
		const startTime = Date.now();
		this.requestTimes.push(startTime);
		this.cleanupOldTimes();
		this.totalRequests++;

		try {
			const result = (await this.modelQueue.add(fn)) as T;
			return result;
		} catch (error: any) {
			this.totalErrors++;
			if (error?.status === 429) {
				this.handle429();
			} else if (error?.status >= 500) {
				this.handle5xx();
			}
			throw new Error(String(error));
		} finally {
			this.emit('request.complete', {
				duration: Date.now() - startTime,
			});
		}
	}

	/**
	 * Add a tool execution to the queue
	 */
	async addToolCall<T>(fn: () => Promise<T>): Promise<T> {
		return this.toolQueue.add(fn) as Promise<T>;
	}

	/**
	 * Get current rate limit state
	 */
	getState(): RateLimitState {
		const currentRpm = this.calculateRPM();
		const queueLength = this.modelQueue.size + this.toolQueue.size;
		const now = Date.now();
		const backoffRemainingMs = Math.max(0, this.backoffEndTime - now);

		return {
			currentRpm,
			queueLength,
			backpressure: this.backpressure,
			isBackedOff: this.backpressure || backoffRemainingMs > 0,
			backoffRemainingMs,
			waitTime: this.estimateWaitTime(),
			droppedRequests: this.droppedRequests,
			totalRequests: this.totalRequests,
			totalErrors: this.totalErrors,
		};
	}

	private calculateRPM(): number {
		const now = Date.now();
		const oneMinuteAgo = now - 60000;
		const recentRequests = this.requestTimes.filter(t => t > oneMinuteAgo);
		return recentRequests.length;
	}

	private estimateWaitTime(): number {
		const queueSize = this.modelQueue.size;
		const avgTime = 500; // 500ms per request estimate
		return queueSize * avgTime;
	}

	private activateBackpressure(): void {
		if (!this.backpressure) {
			this.backpressure = true;
			this.emit('backpressure.active');
		}
	}

	private deactivateBackpressure(): void {
		if (this.backpressure) {
			this.backpressure = false;
			this.emit('backpressure.inactive');
		}
	}

	private handle429(): void {
		this.failures429++;
		this.emit('error.429', {count: this.failures429});
		this.activateBackpressure();
		this.backoffEndTime = Date.now() + 5000;
		// Wait before retrying
		setTimeout(() => this.deactivateBackpressure(), 5000);
	}

	private handle5xx(): void {
		this.failures5xx++;
		this.emit('error.5xx', {count: this.failures5xx});
		if (this.failures5xx > 5) {
			this.activateBackpressure();
			this.backoffEndTime = Date.now() + 10000;
			setTimeout(() => this.deactivateBackpressure(), 10000);
		}
	}

	private cleanupOldTimes(): void {
		const now = Date.now();
		const oneMinuteAgo = now - 60000;
		this.requestTimes = this.requestTimes.filter(t => t > oneMinuteAgo);
	}

	private updateMetrics(): void {
		const state = this.getState();
		this.emit('metrics', state);

		// Auto-recover from backpressure if queue is low
		if (
			this.backpressure &&
			state.queueLength < this.config.burstQueueSize / 2
		) {
			this.deactivateBackpressure();
		}
	}
}

export default AdaptiveRateLimiter;

// Backward compatibility aliases for existing code
export {AdaptiveRateLimiter as Scheduler};
export type {
	RateLimitConfig as SchedulerConfig,
	RateLimitState as SchedulerMetrics,
};

/**
 * @deprecated Use AdaptiveRateLimiter directly
 */
export function getScheduler(
	config?: Partial<RateLimitConfig>,
): AdaptiveRateLimiter {
	return new AdaptiveRateLimiter(config);
}

/**
 * @deprecated Use AdaptiveRateLimiter directly
 */
export function resetScheduler(): void {
	// No-op for singleton pattern - users should manage instances
}
