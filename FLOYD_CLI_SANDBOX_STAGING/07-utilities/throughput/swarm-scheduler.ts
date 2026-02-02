/**
 * Swarm Fairness Scheduler
 * Round-robin across 6 swarms with weighted allocation
 * Manager: 2x weight, Workers: 1x weight
 */

import {EventEmitter} from 'events';

export type SwarmType =
	| 'manager'
	| 'codesearch'
	| 'patchmaker'
	| 'tester'
	| 'browser'
	| 'gitops';

// Legacy type alias for compatibility with UI components
export type SwarmRole = SwarmType;

export interface SwarmTask {
	id: string;
	swarm: SwarmType;
	priority: number;
	execute: () => Promise<unknown>;
}

export interface SwarmState {
	swarm: SwarmType;
	weight: number;
	active: number;
	pending: number;
	completed: number;
}

// Legacy type for compatibility with UI components
// Maps SwarmState to the old SwarmDefinition interface
export interface SwarmDefinition {
	id: string;
	role: SwarmRole;
	workerType?: string;
	status: 'active' | 'idle' | 'busy' | 'error';
	currentRequests: number;
	completedRequests: number;
	failedRequests: number;
	averageLatency: number;
}

export const SWARM_WEIGHTS: Record<SwarmType, number> = {
	manager: 2, // Double priority
	codesearch: 1,
	patchmaker: 1,
	tester: 1,
	browser: 1,
	gitops: 1,
};

/**
 * Round-robin token bucket for each swarm
 */
class SwarmTokenBucket {
	private tokens: number;
	private maxTokens: number;
	private lastRefill: number;
	private refillInterval: number;

	constructor(weight: number, refillMs = 1000) {
		this.maxTokens = weight;
		this.tokens = weight;
		this.lastRefill = Date.now();
		this.refillInterval = refillMs;
	}

	refill(): void {
		const now = Date.now();
		if (now - this.lastRefill >= this.refillInterval) {
			this.tokens = this.maxTokens;
			this.lastRefill = now;
		}
	}

	tryAcquire(): boolean {
		this.refill();
		if (this.tokens > 0) {
			this.tokens--;
			return true;
		}
		return false;
	}

	returnToken(): void {
		if (this.tokens < this.maxTokens) {
			this.tokens++;
		}
	}

	get available(): number {
		this.refill();
		return this.tokens;
	}
}

/**
 * Swarm Fairness Scheduler
 * Ensures fair resource allocation across agent swarms
 */
export class SwarmScheduler extends EventEmitter {
	private buckets: Map<SwarmType, SwarmTokenBucket>;
	private queue: SwarmTask[] = [];
	private processing = false;
	private states: Map<SwarmType, SwarmState> = new Map();

	constructor() {
		super();
		this.buckets = new Map();
		this.initializeStates();
		this.initializeBuckets();

		// Refill tokens every second
		setInterval(() => this.refillAll(), 1000);
	}

	private initializeStates(): void {
		for (const swarm of Object.keys(SWARM_WEIGHTS) as SwarmType[]) {
			this.states.set(swarm, {
				swarm,
				weight: SWARM_WEIGHTS[swarm],
				active: 0,
				pending: 0,
				completed: 0,
			});
		}
	}

	private initializeBuckets(): void {
		for (const [swarm, weight] of Object.entries(SWARM_WEIGHTS)) {
			this.buckets.set(swarm as SwarmType, new SwarmTokenBucket(weight));
		}
	}

	/**
	 * Add a task to the scheduler
	 */
	enqueue(task: SwarmTask): void {
		this.queue.push(task);
		const state = this.states.get(task.swarm)!;
		state.pending++;
		this.emit('task.enqueued', task);
		this.process();
	}

	/**
	 * Process the queue with round-robin fairness
	 */
	private async process(): Promise<void> {
		if (this.processing) {
			return;
		}

		this.processing = true;

		while (this.queue.length > 0) {
			// Find next task with available tokens
			const taskIndex = this.findNextTask();
			if (taskIndex === -1) {
				// No tokens available, wait
				await this.waitForTokens();
				continue;
			}

			const task = this.queue.splice(taskIndex, 1)[0]!;
			const state = this.states.get(task.swarm)!;
			state.pending--;
			state.active++;

			this.emit('task.started', task);

			// Execute task
			task
				.execute()
				.then(() => {
					state.active--;
					state.completed++;
					this.emit('task.completed', task);
				})
				.catch(error => {
					state.active--;
					this.emit('task.failed', {task, error});
				});
		}

		this.processing = false;
	}

	private findNextTask(): number {
		// Round-robin through swarms by priority and token availability
		for (let priority = 10; priority >= 0; priority--) {
			for (const [swarm, bucket] of this.buckets) {
				if (bucket.tryAcquire()) {
					// Find first task of this swarm with matching priority
					const index = this.queue.findIndex(
						t => t.swarm === swarm && t.priority === priority,
					);
					if (index !== -1) {
						return index;
					}
					// Return token if no task found
					bucket.returnToken();
				}
			}
		}
		return -1;
	}

	private async waitForTokens(): Promise<void> {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	private refillAll(): void {
		for (const bucket of this.buckets.values()) {
			bucket.refill();
		}
		this.emit('tokens.refilled');
	}

	/**
	 * Get current state of all swarms
	 */
	getStates(): SwarmState[] {
		return Array.from(this.states.values());
	}

	/**
	 * Get queue statistics
	 */
	getStats() {
		return {
			queueSize: this.queue.length,
			activeTasks: Array.from(this.states.values()).reduce(
				(sum, s) => sum + s.active,
				0,
			),
			pendingTasks: Array.from(this.states.values()).reduce(
				(sum, s) => sum + s.pending,
				0,
			),
			completedTasks: Array.from(this.states.values()).reduce(
				(sum, s) => sum + s.completed,
				0,
			),
		};
	}
}

export default SwarmScheduler;
