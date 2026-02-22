/**
 * Swarm Scheduler
 *
 * Fair scheduling for worker swarms with priority queues and starvation prevention.
 * Designed for production use with comprehensive metrics and graceful degradation.
 *
 * @module throughput/swarm-scheduler
 */

import {EventEmitter} from 'events';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Swarm types for task routing
 * Each swarm represents a specialized worker pool
 */
export type SwarmType =
	| 'manager'    // Top-level orchestration
	| 'codesearch' // Symbol search, code discovery
	| 'patchmaker' // File edits, code generation
	| 'tester'     // Test execution, validation
	| 'browser'    // Web interaction, scraping
	| 'gitops';    // Git operations, version control

/**
 * Swarm task for scheduling
 */
export interface SwarmTask {
	/** Unique task identifier */
	id: string;

	/** Target swarm */
	swarm: SwarmType;

	/** Priority level (0-10, higher = more important) */
	priority: number;

	/** Estimated execution time (ms) for scheduling decisions */
	estimatedDuration?: number;

	/** Maximum time to wait in queue (ms) */
	maxWaitTime?: number;

	/** Execute function */
	execute: () => Promise<unknown>;

	/** Metadata for observability */
	metadata?: Record<string, unknown>;
}

/**
 * Swarm state snapshot
 */
export interface SwarmState {
	/** Swarm type */
	swarm: SwarmType;

	/** Number of currently active tasks */
	active: number;

	/** Number of pending tasks in queue */
	pending: number;

	/** Total completed tasks */
	completed: number;

	/** Total failed tasks */
	failed: number;

	/** Total tasks timed out */
	timedOut: number;

	/** Average execution time (ms) */
	averageExecutionTime: number;

	/** Current starvation score (higher = more starved) */
	starvationScore: number;
}

/**
 * Scheduler configuration
 */
export interface SwarmSchedulerConfig {
	/** Maximum concurrent tasks per swarm (0 = unlimited) */
	maxConcurrentPerSwarm: number;

	/** Maximum total concurrent tasks across all swarms */
	maxTotalConcurrent: number;

	/** Starvation prevention threshold (0-1, higher = more aggressive) */
	starvationThreshold: number;

	/** Enable fair scheduling across swarms */
	fairScheduling: boolean;

	/** Default max wait time for tasks (ms) */
	defaultMaxWaitTime: number;
}

/**
 * Scheduler statistics
 */
export interface SchedulerStats {
	/** Total tasks enqueued */
	totalEnqueued: number;

	/** Total tasks completed */
	totalCompleted: number;

	/** Total tasks failed */
	totalFailed: number;

	/** Total tasks timed out */
	totalTimedOut: number;

	/** Currently active tasks */
	totalActive: number;

	/** Currently queued tasks */
	totalQueued: number;

	/** Is scheduler running */
	running: boolean;

	/** Statistics by swarm */
	bySwarm: Record<string, SwarmState>;

	/** Average task execution time across all swarms */
	averageExecutionTime: number;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface QueuedTask extends SwarmTask {
	enqueuedAt: number;
	startedAt?: number;
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
	timeoutTimer?: NodeJS.Timeout;
}

interface SwarmQueue {
	queue: QueuedTask[];
	active: Map<string, QueuedTask>;
	stats: SwarmState;
	lastExecutionTime: number;
}

// ============================================================================
// SWARM SCHEDULER CLASS
// ============================================================================

/**
 * SwarmScheduler - Fair task scheduling across worker swarms
 *
 * Features:
 * - Priority-based scheduling within each swarm
 * - Fair scheduling across swarms to prevent starvation
 * - Configurable concurrency limits
 * - Starvation prevention with aging
 * - Comprehensive metrics and observability
 * - Graceful degradation under load
 * - Request timeout handling
 */
export class SwarmScheduler extends EventEmitter {
	private readonly config: Required<SwarmSchedulerConfig>;

	private readonly swarms: Map<SwarmType, SwarmQueue> = new Map();
	private running = false;
	private taskIdCounter = 0;
	private cleanupInterval: NodeJS.Timeout | null = null;

	// Aggregate statistics
	private stats: SchedulerStats = {
		totalEnqueued: 0,
		totalCompleted: 0,
		totalFailed: 0,
		totalTimedOut: 0,
		totalActive: 0,
		totalQueued: 0,
		running: false,
		bySwarm: {},
		averageExecutionTime: 0,
	};

	constructor(config: Partial<SwarmSchedulerConfig> = {}) {
		super();

		// Default configuration
		this.config = {
			maxConcurrentPerSwarm: config.maxConcurrentPerSwarm ?? 5,
			maxTotalConcurrent: config.maxTotalConcurrent ?? 20,
			starvationThreshold: config.starvationThreshold ?? 0.3,
			fairScheduling: config.fairScheduling ?? true,
			defaultMaxWaitTime: config.defaultMaxWaitTime ?? 300000, // 5 minutes
		};

		// Initialize swarm queues
		this.initializeSwarms();

		// Set up periodic cleanup
		this.setupCleanup();

		// Auto-start
		this.start();
	}

	/**
	 * Enqueue a task for execution
	 *
	 * Returns a promise that resolves when the task completes
	 * or rejects if the task fails or times out.
	 */
	enqueue<T>(task: SwarmTask): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			// Validate swarm type
			const swarmQueue = this.swarms.get(task.swarm);
			if (!swarmQueue) {
				reject(new Error(`Unknown swarm type: ${task.swarm}`));
				return;
			}

			// Generate task ID if not provided
			const taskId = task.id || `task-${task.swarm}-${++this.taskIdCounter}`;

			// Create queued task
			const queuedTask: QueuedTask = {
				...task,
				id: taskId,
				enqueuedAt: Date.now(),
				resolve: resolve as (value: unknown) => void,
				reject,
			};

			// Set up timeout
			const maxWaitTime = task.maxWaitTime ?? this.config.defaultMaxWaitTime;
			if (maxWaitTime > 0) {
				queuedTask.timeoutTimer = setTimeout(() => {
					this.handleTimeout(taskId, task.swarm);
				}, maxWaitTime);
			}

			// Add to queue
			swarmQueue.queue.push(queuedTask);
			this.sortQueue(swarmQueue);

			// Update stats
			this.stats.totalEnqueued++;
			this.stats.totalQueued = this.getTotalQueued();
			swarmQueue.stats.pending = swarmQueue.queue.length;

			this.emit('task.enqueued', {
				id: taskId,
				swarm: task.swarm,
				priority: task.priority,
			});

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
	 * Stops processing new tasks but allows active tasks to complete.
	 */
	pause(): void {
		this.running = false;
		this.stats.running = false;
		this.emit('paused');
	}

	/**
	 * Stop the scheduler
	 *
	 * Cancels all pending tasks. Active tasks are allowed to complete.
	 */
	async stop(): Promise<void> {
		this.running = false;
		this.stats.running = false;

		// Reject all pending tasks
		const pendingPromises: Promise<void>[] = [];

		for (const [swarm, swarmQueue] of this.swarms) {
			const pending = swarmQueue.queue.splice(0);
			swarmQueue.stats.pending = 0;

			for (const task of pending) {
				this.clearTaskTimeout(task);
				task.reject(new Error('Scheduler stopped'));
				this.stats.totalFailed++;
				pendingPromises.push(Promise.resolve());
			}
		}

		this.stats.totalQueued = 0;
		this.emit('stopped');

		await Promise.all(pendingPromises);
	}

	/**
	 * Get current swarm states
	 */
	getStates(): SwarmState[] {
		return Array.from(this.swarms.values()).map(sq => ({
			...sq.stats,
		}));
	}

	/**
	 * Get scheduler statistics
	 */
	getStats(): SchedulerStats {
		return {
			...this.stats,
			totalActive: this.getTotalActive(),
			totalQueued: this.getTotalQueued(),
			bySwarm: this.getAllSwarmStatsPrivate(),
		};
	}

	/**
	 * Get statistics for a specific swarm
	 */
	getSwarmStats(swarm: SwarmType): SwarmState | undefined {
		return this.swarms.get(swarm)?.stats;
	}

	/**
	 * Get all swarm statistics
	 */
	getAllSwarmStats(): Record<string, SwarmState> {
		const stats: Record<string, SwarmState> = {};

		for (const [swarm, swarmQueue] of this.swarms) {
			stats[swarm] = {...swarmQueue.stats};
		}

		return stats;
	}

	/**
	 * Cancel a specific task by ID
	 */
	cancel(taskId: string): boolean {
		for (const [swarm, swarmQueue] of this.swarms) {
			// Check queue first
			const queueIndex = swarmQueue.queue.findIndex(t => t.id === taskId);
			if (queueIndex !== -1) {
				const task = swarmQueue.queue.splice(queueIndex, 1)[0];
				swarmQueue.stats.pending = swarmQueue.queue.length;
				this.clearTaskTimeout(task);
				task.reject(new Error('Task cancelled'));
				this.stats.totalFailed++;
				this.emit('task.cancelled', {id: taskId, swarm});
				return true;
			}
		}

		// Check if task is active (can't cancel active tasks)
		for (const swarmQueue of this.swarms.values()) {
			if (swarmQueue.active.has(taskId)) {
				return false;
			}
		}

		return false;
	}

	/**
	 * Clear all statistics
	 */
	clearStats(): void {
		this.stats.totalEnqueued = 0;
		this.stats.totalCompleted = 0;
		this.stats.totalFailed = 0;
		this.stats.totalTimedOut = 0;

		for (const swarmQueue of this.swarms.values()) {
			swarmQueue.stats.completed = 0;
			swarmQueue.stats.failed = 0;
			swarmQueue.stats.timedOut = 0;
			swarmQueue.stats.averageExecutionTime = 0;
		}

		this.emit('stats.cleared');
	}

	/**
	 * Update scheduler configuration
	 */
	updateConfig(updates: Partial<SwarmSchedulerConfig>): void {
		const oldConfig = {...this.config};

		Object.assign(this.config, updates);

		this.emit('config.updated', {old: oldConfig, new: this.config});

		// Trigger processing if we increased limits
		if (
			(updates.maxConcurrentPerSwarm &&
				updates.maxConcurrentPerSwarm > oldConfig.maxConcurrentPerSwarm) ||
			(updates.maxTotalConcurrent &&
				updates.maxTotalConcurrent > oldConfig.maxTotalConcurrent)
		) {
			this.process();
		}
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

		this.swarms.clear();
		this.emit('destroyed');
		this.removeAllListeners();
	}

	// -------------------------------------------------------------------------
	// PRIVATE METHODS
	// -------------------------------------------------------------------------

	/**
	 * Initialize swarm queues
	 */
	private initializeSwarms(): void {
		const swarmTypes: SwarmType[] = [
			'codesearch',
			'patchmaker',
			'tester',
			'browser',
			'gitops',
		];

		for (const swarm of swarmTypes) {
			this.swarms.set(swarm, {
				queue: [],
				active: new Map(),
				stats: {
					swarm,
					active: 0,
					pending: 0,
					completed: 0,
					failed: 0,
					timedOut: 0,
					averageExecutionTime: 0,
					starvationScore: 0,
				},
				lastExecutionTime: Date.now(),
			});

			this.stats.bySwarm[swarm] = {...this.swarms.get(swarm)!.stats};
		}
	}

	/**
	 * Process the queue and execute tasks
	 */
	private async process(): Promise<void> {
		if (!this.running) {
			return;
		}

		// Calculate capacity
		const totalActive = this.getTotalActive();
		const totalCapacity = this.config.maxTotalConcurrent - totalActive;

		if (totalCapacity <= 0) {
			return; // No capacity available
		}

		// Select next task(s) to execute
		const toExecute: {swarm: SwarmType; task: QueuedTask}[] = [];

		for (let i = 0; i < totalCapacity; i++) {
			const selected = this.selectNextTask();
			if (!selected) {
				break;
			}

			// Remove from queue
			const swarmQueue = this.swarms.get(selected.swarm)!;
			const index = swarmQueue.queue.findIndex(t => t.id === selected.task.id);
			if (index !== -1) {
				swarmQueue.queue.splice(index, 1);
				swarmQueue.stats.pending = swarmQueue.queue.length;
				toExecute.push(selected);
			}
		}

		// Execute selected tasks
		for (const {swarm, task} of toExecute) {
			this.executeTask(swarm, task);
		}
	}

	/**
	 * Select the next task to execute
	 * Uses fair scheduling with starvation prevention
	 */
	private selectNextTask(): {swarm: SwarmType; task: QueuedTask} | null {
		let selected: {swarm: SwarmType; task: QueuedTask} | null = null;
		let highestScore = -Infinity;

		// Update starvation scores
		this.updateStarvationScores();

		for (const [swarm, swarmQueue] of this.swarms) {
			// Check swarm-specific concurrency limit
			const swarmLimit = this.config.maxConcurrentPerSwarm;
			if (swarmLimit > 0 && swarmQueue.active.size >= swarmLimit) {
				continue; // Swarm at capacity
			}

			// Check if queue has tasks
			if (swarmQueue.queue.length === 0) {
				continue;
			}

			// Get highest priority task from this swarm
			const task = swarmQueue.queue[0];

			// Calculate selection score
			// Higher priority = higher score
			// Higher starvation score = higher score
			// Older tasks (longer wait) = higher score
			const waitTime = Date.now() - task.enqueuedAt;
			const starvationBonus = this.config.fairScheduling
				? swarmQueue.stats.starvationScore * 100
				: 0;
			const ageBonus = waitTime / 1000; // 1 point per second waited

			const score = task.priority * 10 + starvationBonus + ageBonus;

			if (score > highestScore) {
				highestScore = score;
				selected = {swarm, task};
			}
		}

		return selected;
	}

	/**
	 * Execute a single task
	 */
	private async executeTask(swarm: SwarmType, task: QueuedTask): Promise<void> {
		const swarmQueue = this.swarms.get(swarm)!;
		const startTime = Date.now();

		// Mark as active
		task.startedAt = startTime;
		swarmQueue.active.set(task.id, task);
		swarmQueue.stats.active = swarmQueue.active.size;
		swarmQueue.lastExecutionTime = startTime;

		this.stats.totalActive = this.getTotalActive();

		this.emit('task.started', {
			id: task.id,
			swarm,
			priority: task.priority,
		});

		try {
			// Execute the task
			const result = await task.execute();

			// Calculate execution time
			const executionTime = Date.now() - startTime;

			// Update stats
			this.updateSwarmStats(swarm, 'completed', executionTime);
			this.stats.totalCompleted++;

			// Resolve
			this.clearTaskTimeout(task);
			task.resolve(result);

			this.emit('task.completed', {
				id: task.id,
				swarm,
				executionTime,
			});
		} catch (error) {
			// Update stats
			this.updateSwarmStats(swarm, 'failed');
			this.stats.totalFailed++;

			// Reject
			this.clearTaskTimeout(task);
			task.reject(error as Error);

			this.emit('task.failed', {
				id: task.id,
				swarm,
				error: error instanceof Error ? error.message : String(error),
			});
		} finally {
			// Remove from active
			swarmQueue.active.delete(task.id);
			swarmQueue.stats.active = swarmQueue.active.size;
			swarmQueue.stats.starvationScore = 0; // Reset starvation on execution

			this.stats.totalActive = this.getTotalActive();

			// Continue processing
			this.process();
		}
	}

	/**
	 * Handle task timeout
	 */
	private handleTimeout(taskId: string, swarm: SwarmType): void {
		const swarmQueue = this.swarms.get(swarm);
		if (!swarmQueue) {
			return;
		}

		const queueIndex = swarmQueue.queue.findIndex(t => t.id === taskId);
		if (queueIndex !== -1) {
			const task = swarmQueue.queue.splice(queueIndex, 1)[0];
			swarmQueue.stats.pending = swarmQueue.queue.length;

			this.updateSwarmStats(swarm, 'timedOut');
			this.stats.totalTimedOut++;
			this.stats.totalFailed++;

			task.reject(
				new Error(
					`Task timed out after ${task.maxWaitTime ?? this.config.defaultMaxWaitTime}ms`,
				),
			);

			this.emit('task.timeout', {id: taskId, swarm});
		}
	}

	/**
	 * Clear task timeout
	 */
	private clearTaskTimeout(task: QueuedTask): void {
		if (task.timeoutTimer) {
			clearTimeout(task.timeoutTimer);
			task.timeoutTimer = undefined;
		}
	}

	/**
	 * Sort queue by priority (highest first) and age
	 */
	private sortQueue(swarmQueue: SwarmQueue): void {
		swarmQueue.queue.sort((a, b) => {
			// First by priority (higher first)
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}
			// Then by enqueue time (older first - FIFO)
			return a.enqueuedAt - b.enqueuedAt;
		});
	}

	/**
	 * Update swarm statistics
	 */
	private updateSwarmStats(
		swarm: SwarmType,
		event: 'completed' | 'failed' | 'timedOut',
		executionTime?: number,
	): void {
		const swarmQueue = this.swarms.get(swarm);
		if (!swarmQueue) {
			return;
		}

		const stats = swarmQueue.stats;

		switch (event) {
			case 'completed':
				stats.completed++;
				if (executionTime !== undefined) {
					const totalExecTime =
						stats.averageExecutionTime * (stats.completed - 1) + executionTime;
					stats.averageExecutionTime = totalExecTime / stats.completed;
				}
				break;
			case 'failed':
				stats.failed++;
				break;
			case 'timedOut':
				stats.timedOut++;
				break;
		}

		// Update aggregate stats
		this.stats.bySwarm[swarm] = {...stats};

		// Update overall average
		this.updateOverallAverage();
	}

	/**
	 * Update starvation scores for fair scheduling
	 */
	private updateStarvationScores(): void {
		if (!this.config.fairScheduling) {
			return;
		}

		const now = Date.now();
		const totalPending = this.getTotalQueued();

		for (const [swarm, swarmQueue] of this.swarms) {
			if (swarmQueue.queue.length === 0) {
				swarmQueue.stats.starvationScore = 0;
				continue;
			}

			// Calculate time since last execution
			const timeSinceLastExecution = now - swarmQueue.lastExecutionTime;

			// Calculate queue ratio (pending / total pending)
			const queueRatio = totalPending > 0
				? swarmQueue.queue.length / totalPending
				: 0;

			// Starvation score combines wait time and queue size
			// Higher score = more deserving of execution
			swarmQueue.stats.starvationScore =
				(timeSinceLastExecution / 1000) * this.config.starvationThreshold +
				queueRatio * 10;
		}
	}

	/**
	 * Update overall average execution time
	 */
	private updateOverallAverage(): void {
		let totalTime = 0;
		let totalCount = 0;

		for (const swarmQueue of this.swarms.values()) {
			totalTime +=
				swarmQueue.stats.averageExecutionTime * swarmQueue.stats.completed;
			totalCount += swarmQueue.stats.completed;
		}

		this.stats.averageExecutionTime =
			totalCount > 0 ? totalTime / totalCount : 0;
	}

	/**
	 * Get total active tasks across all swarms
	 */
	private getTotalActive(): number {
		let total = 0;
		for (const swarmQueue of this.swarms.values()) {
			total += swarmQueue.active.size;
		}
		return total;
	}

	/**
	 * Get total queued tasks across all swarms
	 */
	private getTotalQueued(): number {
		let total = 0;
		for (const swarmQueue of this.swarms.values()) {
			total += swarmQueue.queue.length;
		}
		return total;
	}

	/**
	 * Get all swarm statistics (private helper)
	 */
	private getAllSwarmStatsPrivate(): Record<string, SwarmState> {
		const stats: Record<string, SwarmState> = {};

		for (const [swarm, swarmQueue] of this.swarms) {
			stats[swarm] = {...swarmQueue.stats};
		}

		return stats;
	}

	/**
	 * Set up periodic cleanup
	 */
	private setupCleanup(): void {
		// Clean up every minute
		this.cleanupInterval = setInterval(() => {
			// Update starvation scores
			this.updateStarvationScores();

			// Emit stats event
			this.emit('stats.updated', this.getStats());
		}, 60000);
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

let defaultScheduler: SwarmScheduler | null = null;

/**
 * Get or create the default swarm scheduler
 */
export function getDefaultScheduler(
	config?: Partial<SwarmSchedulerConfig>,
): SwarmScheduler {
	if (!defaultScheduler) {
		defaultScheduler = new SwarmScheduler(config);
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

export default SwarmScheduler;
