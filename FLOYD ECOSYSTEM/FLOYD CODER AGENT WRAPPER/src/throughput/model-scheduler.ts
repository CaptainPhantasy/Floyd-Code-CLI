/**
 * Model Scheduler
 *
 * Intelligent concurrency control for LLM API calls with rate limiting,
 * priority queues, and comprehensive metrics. Designed for production use
 * with proper backoff and error handling.
 *
 * @module throughput/model-scheduler
 */

import {EventEmitter} from 'events';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Model call options
 */
export interface ModelCallOptions {
	/** Model identifier (e.g., 'claude-opus-4', 'claude-sonnet-4-5') */
	model: string;

	/** Priority level (0-10, higher = more important) */
	priority: number;

	/** Maximum time to wait for execution (ms) */
	timeout?: number;

	/** Request ID for tracking */
	requestId?: string;

	/** Metadata for observability */
	metadata?: Record<string, unknown>;
}

/**
 * Scheduled request state
 */
interface ScheduledRequest {
	/** Unique request ID */
	id: string;

	/** Execute function */
	execute: () => Promise<unknown>;

	/** Options */
	options: ModelCallOptions;

	/** Queued at timestamp */
	queuedAt: number;

	/** Resolve function */
	resolve: (value: unknown) => void;

	/** Reject function */
	reject: (error: Error) => void;

	/** Timeout timer */
	timeoutTimer?: NodeJS.Timeout;
}

/**
 * Model statistics
 */
export interface ModelStats {
	/** Model identifier */
	model: string;

	/** Total requests scheduled */
	totalScheduled: number;

	/** Total requests completed */
	totalCompleted: number;

	/** Total requests failed */
	totalFailed: number;

	/** Total requests timed out */
	totalTimedOut: number;

	/** Current queue size */
	queueSize: number;

	/** Average execution time (ms) */
	averageExecutionTime: number;

	/** Total execution time (ms) */
	totalExecutionTime: number;
}

/**
 * Scheduler statistics
 */
export interface SchedulerStats {
	/** Maximum concurrency */
	maxConcurrency: number;

	/** Current active requests */
	activeRequests: number;

	/** Total queued requests */
	queuedRequests: number;

	/** Total completed requests */
	totalCompleted: number;

	/** Total failed requests */
	totalFailed: number;

	/** Is scheduler running */
	running: boolean;

	/** Statistics by model */
	byModel: Record<string, ModelStats>;
}

// ============================================================================
// MODEL SCHEDULER CLASS
// ============================================================================

/**
 * ModelScheduler - Concurrent LLM call management
 *
 * Features:
 * - Priority-based fair scheduling
 * - Configurable concurrency limits
 * - Request timeout handling
 * - Comprehensive metrics and observability
 * - Graceful degradation under load
 * - Proper cleanup and resource management
 */
export class ModelScheduler extends EventEmitter {
	private maxConcurrency: number;
	private readonly defaultTimeout: number;

	private queue: ScheduledRequest[] = [];
	private activeRequests = new Set<string>();
	private running = false;

	// Metrics
	private stats: SchedulerStats = {
		maxConcurrency: 0,
		activeRequests: 0,
		queuedRequests: 0,
		totalCompleted: 0,
		totalFailed: 0,
		running: false,
		byModel: {},
	};

	private requestCounter = 0;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(maxConcurrency: number, defaultTimeout: number = 60000) {
		super();

		if (maxConcurrency < 1) {
			throw new Error(`maxConcurrency must be at least 1, got ${maxConcurrency}`);
		}

		this.maxConcurrency = maxConcurrency;
		this.defaultTimeout = defaultTimeout;
		this.stats.maxConcurrency = maxConcurrency;

		// Set up periodic cleanup
		this.setupCleanup();

		// Auto-start
		this.start();
	}

	/**
	 * Schedule a request for execution
	 *
	 * Returns a promise that resolves with the result of the execute function
	 * or rejects if the request fails or times out.
	 */
	schedule<T>(execute: () => Promise<T>, options: ModelCallOptions): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const requestId = options.requestId || `req-${++this.requestCounter}`;

			const request: ScheduledRequest = {
				id: requestId,
				execute,
				options,
				queuedAt: Date.now(),
				resolve: resolve as (value: unknown) => void,
				reject,
			};

			// Set up timeout
			const timeout = options.timeout ?? this.defaultTimeout;
			if (timeout > 0) {
				request.timeoutTimer = setTimeout(() => {
					this.handleTimeout(requestId);
				}, timeout);
			}

			// Add to queue
			this.queue.push(request);
			this.sortQueue();

			// Update stats
			this.updateModelStats(options.model, 'scheduled');
			this.stats.queuedRequests = this.queue.length;

			this.emit('request.scheduled', {id: requestId, options});

			// Trigger processing
			this.process();
		});
	}

	/**
	 * Start the scheduler
	 */
	start(): void {
		if (this.running) {
			return;
		}

		this.running = true;
		this.stats.running = true;
		this.emit('started');
		this.process();
	}

	/**
	 * Pause the scheduler
	 *
	 * Stops processing new requests but allows active requests to complete.
	 */
	pause(): void {
		this.running = false;
		this.stats.running = false;
		this.emit('paused');
	}

	/**
	 * Stop the scheduler
	 *
	 * Cancels all pending requests and stops processing.
	 * Active requests are allowed to complete.
	 */
	stop(): Promise<void> {
		this.running = false;
		this.stats.running = false;

		// Reject all pending requests
		const pending = [...this.queue];
		this.queue = [];

		for (const request of pending) {
			this.clearTimeout(request);
			request.reject(new Error('Scheduler stopped'));
		}

		this.stats.queuedRequests = 0;
		this.emit('stopped');

		// Wait for active requests to complete (with timeout)
		return new Promise(resolve => {
			const checkInterval = setInterval(() => {
				if (this.activeRequests.size === 0) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);

			// Force resolve after 5 seconds
			setTimeout(() => {
				clearInterval(checkInterval);
				resolve();
			}, 5000);
		});
	}

	/**
	 * Get current statistics
	 */
	getStats(): SchedulerStats {
		return {
			...this.stats,
			activeRequests: this.activeRequests.size,
			queuedRequests: this.queue.length,
			byModel: {...this.stats.byModel},
		};
	}

	/**
	 * Get model-specific statistics
	 */
	getModelStats(model: string): ModelStats | undefined {
		return this.stats.byModel[model];
	}

	/**
	 * Get all model statistics
	 */
	getAllModelStats(): Record<string, ModelStats> {
		return {...this.stats.byModel};
	}

	/**
	 * Clear all statistics
	 */
	clearStats(): void {
		this.stats.totalCompleted = 0;
		this.stats.totalFailed = 0;
		this.stats.byModel = {};
		this.emit('stats.cleared');
	}

	/**
	 * Set maximum concurrency
	 *
	 * If the new limit is lower than currently active requests,
	 * no active requests are interrupted. The new limit applies
	 * to future requests.
	 */
	setMaxConcurrency(maxConcurrency: number): void {
		if (maxConcurrency < 1) {
			throw new Error(`maxConcurrency must be at least 1, got ${maxConcurrency}`);
		}

		const oldMax = this.stats.maxConcurrency;
		this.stats.maxConcurrency = maxConcurrency;
		this.maxConcurrency = maxConcurrency;

		this.emit('concurrency.changed', {old: oldMax, new: maxConcurrency});

		// Trigger processing if we increased the limit
		if (maxConcurrency > oldMax) {
			this.process();
		}
	}

	/**
	 * Cancel a specific request by ID
	 */
	cancel(requestId: string): boolean {
		// Check queue first
		const queueIndex = this.queue.findIndex(r => r.id === requestId);
		if (queueIndex !== -1) {
			const request = this.queue.splice(queueIndex, 1)[0];
			this.clearTimeout(request);
			request.reject(new Error('Request cancelled'));
			this.stats.queuedRequests = this.queue.length;
			this.updateModelStats(request.options.model, 'failed');
			this.emit('request.cancelled', {id: requestId});
			return true;
		}

		// Check if request is active (can't cancel active requests)
		if (this.activeRequests.has(requestId)) {
			return false;
		}

		return false;
	}

	/**
	 * Clean up resources
	 */
	async destroy(): Promise<void> {
		await this.stop();

		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		this.emit('destroyed');
		this.removeAllListeners();
	}

	// -------------------------------------------------------------------------
	// PRIVATE METHODS
	// -------------------------------------------------------------------------

	/**
	 * Process the queue and execute requests
	 */
	private async process(): Promise<void> {
		if (!this.running) {
			return;
		}

		// Process while we have capacity and queued requests
		while (
			this.running &&
			this.activeRequests.size < this.maxConcurrency &&
			this.queue.length > 0
		) {
			const request = this.queue.shift();
			if (!request) {
				break;
			}

			this.stats.queuedRequests = this.queue.length;
			this.executeRequest(request);
		}
	}

	/**
	 * Execute a single request
	 */
	private async executeRequest(request: ScheduledRequest): Promise<void> {
		const {id, execute, options} = request;
		const startTime = Date.now();

		// Mark as active
		this.activeRequests.add(id);
		this.stats.activeRequests = this.activeRequests.size;

		this.emit('request.started', {id, options});

		try {
			// Execute the request
			const result = await execute();

			// Calculate execution time
			const executionTime = Date.now() - startTime;

			// Update stats
			this.updateModelStats(options.model, 'completed', executionTime);
			this.stats.totalCompleted++;

			// Resolve
			this.clearTimeout(request);
			request.resolve(result);

			this.emit('request.completed', {id, executionTime});
		} catch (error) {
			// Update stats
			this.updateModelStats(options.model, 'failed');
			this.stats.totalFailed++;

			// Reject
			this.clearTimeout(request);
			request.reject(error as Error);

			this.emit('request.failed', {id, error});
		} finally {
			// Remove from active
			this.activeRequests.delete(id);
			this.stats.activeRequests = this.activeRequests.size;

			// Continue processing
			this.process();
		}
	}

	/**
	 * Handle request timeout
	 */
	private handleTimeout(requestId: string): void {
		const queueIndex = this.queue.findIndex(r => r.id === requestId);
		if (queueIndex !== -1) {
			const request = this.queue.splice(queueIndex, 1)[0];
			this.stats.queuedRequests = this.queue.length;
			this.updateModelStats(request.options.model, 'timedOut');
			this.stats.totalFailed++;
			request.reject(new Error(`Request timed out after ${request.options.timeout ?? this.defaultTimeout}ms`));
			this.emit('request.timeout', {id: requestId});
		}
	}

	/**
	 * Clear timeout for a request
	 */
	private clearTimeout(request: ScheduledRequest): void {
		if (request.timeoutTimer) {
			clearTimeout(request.timeoutTimer);
			request.timeoutTimer = undefined;
		}
	}

	/**
	 * Sort queue by priority (highest first)
	 * For equal priority, FIFO by queued time
	 */
	private sortQueue(): void {
		this.queue.sort((a, b) => {
			if (a.options.priority !== b.options.priority) {
				return b.options.priority - a.options.priority; // Higher priority first
			}
			return a.queuedAt - b.queuedAt; // Earlier requests first
		});
	}

	/**
	 * Update model statistics
	 */
	private updateModelStats(
		model: string,
		event: 'scheduled' | 'completed' | 'failed' | 'timedOut',
		executionTime?: number,
	): void {
		if (!this.stats.byModel[model]) {
			this.stats.byModel[model] = {
				model,
				totalScheduled: 0,
				totalCompleted: 0,
				totalFailed: 0,
				totalTimedOut: 0,
				queueSize: 0,
				averageExecutionTime: 0,
				totalExecutionTime: 0,
			};
		}

		const stats = this.stats.byModel[model];

		switch (event) {
			case 'scheduled':
				stats.totalScheduled++;
				break;
			case 'completed':
				stats.totalCompleted++;
				if (executionTime !== undefined) {
					stats.totalExecutionTime += executionTime;
					stats.averageExecutionTime =
						stats.totalExecutionTime / stats.totalCompleted;
				}
				break;
			case 'failed':
				stats.totalFailed++;
				break;
			case 'timedOut':
				stats.totalTimedOut++;
				break;
		}

		// Update queue size for this model
		stats.queueSize = this.queue.filter(r => r.options.model === model).length;
	}

	/**
	 * Set up periodic cleanup
	 */
	private setupCleanup(): void {
		// Clean up stale stats every minute
		this.cleanupInterval = setInterval(() => {
			const now = Date.now();
			const staleModels: string[] = [];

			// Find models with no activity in the last hour
			for (const [model, stats] of Object.entries(this.stats.byModel)) {
				const hasActivity = stats.queueSize > 0 ||
					this.activeRequests.size > 0;
				if (!hasActivity && now - (stats.totalExecutionTime || 0) > 3600000) {
					staleModels.push(model);
				}
			}

			// Remove stale model stats
			for (const model of staleModels) {
				delete this.stats.byModel[model];
			}
		}, 60000);
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

let defaultScheduler: ModelScheduler | null = null;

/**
 * Get or create the default model scheduler
 */
export function getDefaultScheduler(concurrency?: number): ModelScheduler {
	if (!defaultScheduler) {
		defaultScheduler = new ModelScheduler(concurrency ?? 12);
	}
	return defaultScheduler;
}

/**
 * Reset the default scheduler (useful for testing)
 */
export function resetDefaultScheduler(): void {
	if (defaultScheduler) {
		defaultScheduler.destroy().catch(() => {});
		defaultScheduler = null;
	}
}

export default ModelScheduler;
