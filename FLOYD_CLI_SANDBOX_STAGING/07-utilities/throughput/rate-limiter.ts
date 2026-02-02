/**
 * Token Bucket Rate Limiter
 *
 * Purpose: Token bucket algorithm for rate limiting
 * Target: 2000 RPM (requests per minute)
 * Burst: Allows temporary bursts up to burst capacity
 *
 * Features:
 * - Token bucket with refill rate
 * - Burst handling for traffic spikes
 * - wait() method that blocks until tokens available
 * - Configurable rate and burst capacity
 * - Accurate timing with drift correction
 */

export interface RateLimiterConfig {
	/**
	 * Target requests per minute
	 * @default 2000
	 */
	ratePerMinute: number;

	/**
	 * Burst capacity (max tokens that can accumulate)
	 * @default 100 (allows 3 seconds of burst at 2000 RPM)
	 */
	burstCapacity: number;

	/**
	 * Interval in milliseconds for token refill
	 * @default 100 (refill every 100ms)
	 */
	refillIntervalMs: number;
}

export interface RateLimiterMetrics {
	availableTokens: number;
	currentRpm: number;
	waitingRequests: number;
	totalRequests: number;
	totalDropped: number;
}

interface PendingRequest {
	resolve: () => void;
	reject: (error: Error) => void;
	timestamp: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
	ratePerMinute: 2000,
	burstCapacity: 100,
	refillIntervalMs: 100,
};

/**
 * Token bucket rate limiter for controlling request throughput
 *
 * Uses the token bucket algorithm:
 * - Tokens are added at a constant rate
 * - Each request consumes one token
 * - Tokens accumulate up to burst capacity
 * - Requests block when no tokens available
 */
export class RateLimiter {
	private config: RateLimiterConfig;
	private tokens: number;
	private maxTokens: number;
	private tokensPerRefill: number;
	private refillTimer: ReturnType<typeof setInterval> | null = null;
	private pendingQueue: PendingRequest[] = [];
	private metrics: RateLimiterMetrics = {
		availableTokens: 0,
		currentRpm: 0,
		waitingRequests: 0,
		totalRequests: 0,
		totalDropped: 0,
	};
	private requestHistory: number[] = []; // Timestamps of recent requests
	private isShuttingDown = false;
	private lastRefillTime = Date.now();

	constructor(config: Partial<RateLimiterConfig> = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
		this.maxTokens = this.config.burstCapacity;
		this.tokens = this.maxTokens; // Start with full bucket

		// Calculate tokens to add per refill interval
		// ratePerMinute / (60000ms / refillIntervalMs)
		this.tokensPerRefill =
			this.config.ratePerMinute / (60_000 / this.config.refillIntervalMs);

		this.metrics.availableTokens = this.tokens;

		this.startRefill();
	}

	/**
	 * Acquire a token, blocking if necessary until one is available
	 * Returns a promise that resolves when a token is acquired
	 */
	async wait(): Promise<void> {
		if (this.isShuttingDown) {
			throw new Error('RateLimiter is shutting down');
		}

		// Check if we have an available token
		if (this.tokens >= 1) {
			this.consumeToken();
			return;
		}

		// No token available, add to pending queue
		return new Promise((resolve, reject) => {
			if (this.isShuttingDown) {
				reject(new Error('RateLimiter is shutting down'));
				return;
			}

			this.pendingQueue.push({
				resolve: resolve as () => void,
				reject,
				timestamp: Date.now(),
			});

			this.metrics.waitingRequests = this.pendingQueue.length;
		});
	}

	/**
	 * Try to acquire a token without blocking
	 * Returns true if token was acquired, false otherwise
	 */
	tryAcquire(): boolean {
		if (this.isShuttingDown) {
			return false;
		}

		if (this.tokens >= 1) {
			this.consumeToken();
			return true;
		}

		return false;
	}

	/**
	 * Get current metrics
	 */
	getMetrics(): RateLimiterMetrics {
		return {...this.metrics};
	}

	/**
	 * Get current available tokens
	 */
	getAvailableTokens(): number {
		return this.tokens;
	}

	/**
	 * Get current RPM (requests per minute) based on recent history
	 */
	getCurrentRpm(): number {
		const now = Date.now();
		const oneMinuteAgo = now - 60_000;

		// Filter requests within the last minute
		this.requestHistory = this.requestHistory.filter(
			timestamp => timestamp > oneMinuteAgo,
		);

		return this.requestHistory.length;
	}

	/**
	 * Check if a request can be executed immediately (no waiting)
	 */
	canExecuteImmediately(): boolean {
		return this.tokens >= 1;
	}

	/**
	 * Estimate wait time until next token is available
	 * Returns 0 if tokens are available
	 */
	estimateWaitTime(): number {
		if (this.tokens >= 1) {
			return 0;
		}

		// Estimate based on refill rate
		const tokensNeeded = 1 - this.tokens;
		const refillsNeeded = tokensNeeded / this.tokensPerRefill;
		return Math.ceil(refillsNeeded * this.config.refillIntervalMs);
	}

	/**
	 * Reset the rate limiter state
	 */
	reset(): void {
		this.tokens = this.maxTokens;
		this.metrics.availableTokens = this.tokens;
		this.requestHistory = [];
		this.metrics.totalRequests = 0;
		this.metrics.totalDropped = 0;
		this.metrics.currentRpm = 0;
	}

	/**
	 * Shutdown the rate limiter and reject all pending requests
	 */
	shutdown(): void {
		this.isShuttingDown = true;

		if (this.refillTimer) {
			clearInterval(this.refillTimer);
			this.refillTimer = null;
		}

		// Reject all pending requests
		for (const pending of this.pendingQueue) {
			pending.reject(new Error('RateLimiter shutdown'));
		}

		this.pendingQueue = [];
		this.metrics.waitingRequests = 0;
	}

	/**
	 * Start the refill timer
	 */
	private startRefill(): void {
		this.refillTimer = setInterval(() => {
			this.refill();
		}, this.config.refillIntervalMs);

		// Unref to allow Node.js to exit if this is the only active timer
		if (typeof this.refillTimer.unref === 'function') {
			this.refillTimer.unref();
		}
	}

	/**
	 * Refill tokens based on elapsed time
	 */
	private refill(): void {
		const now = Date.now();
		const elapsed = now - this.lastRefillTime;

		// Correct for drift: use actual elapsed time instead of assuming fixed interval
		const actualRefills = elapsed / this.config.refillIntervalMs;
		const tokensToAdd = actualRefills * this.tokensPerRefill;

		// Add tokens, respecting max capacity
		this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
		this.metrics.availableTokens = this.tokens;
		this.metrics.currentRpm = this.getCurrentRpm();

		this.lastRefillTime = now;

		// Process pending requests
		this.processPending();
	}

	/**
	 * Consume a single token
	 */
	private consumeToken(): void {
		this.tokens = Math.max(0, this.tokens - 1);
		this.metrics.availableTokens = this.tokens;
		this.metrics.totalRequests++;
		this.requestHistory.push(Date.now());
	}

	/**
	 * Process pending requests that can now be fulfilled
	 */
	private processPending(): void {
		let processed = 0;

		while (
			this.pendingQueue.length > 0 &&
			this.tokens >= 1 &&
			!this.isShuttingDown
		) {
			const pending = this.pendingQueue.shift();
			if (!pending) {
				continue;
			}

			this.consumeToken();
			pending.resolve();
			processed++;
		}

		this.metrics.waitingRequests = this.pendingQueue.length;
	}
}

/**
 * Create a rate limiter with default configuration
 */
export function createRateLimiter(
	config?: Partial<RateLimiterConfig>,
): RateLimiter {
	return new RateLimiter(config);
}

/**
 * Create a rate limiter for 2000 RPM with reasonable burst capacity
 */
export function createStandardRateLimiter(): RateLimiter {
	return new RateLimiter({
		ratePerMinute: 2000,
		burstCapacity: 100,
	});
}
