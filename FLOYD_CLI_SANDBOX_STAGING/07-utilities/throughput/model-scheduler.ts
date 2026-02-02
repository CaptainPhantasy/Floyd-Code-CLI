/**
 * Model Call Scheduler
 * Manages LLM API call concurrency and prioritization
 */

import {EventEmitter} from 'events';
import PQueue from 'p-queue';

export interface ModelCallOptions {
	model: string;
	priority?: number; // 0-10, higher = more important
	timeout?: number;
	retryAttempts?: number;
}

export interface ModelCallRequest<T> {
	id: string;
	fn: () => Promise<T>;
	options: ModelCallOptions;
	resolve: (value: T) => void;
	reject: (error: Error) => void;
}

/**
 * Model Call Scheduler
 * Prioritizes and manages concurrent LLM calls
 */
export class ModelScheduler extends EventEmitter {
	private queue: PQueue;
	private pending: Map<string, ModelCallRequest<unknown>> = new Map();
	private active: Set<string> = new Set();
	private stats = {
		completed: 0,
		failed: 0,
		total: 0,
	};

	constructor(concurrency = 12) {
		super();
		this.queue = new PQueue({
			concurrency,
			autoStart: true,
		});

		this.queue.on('next', () => {
			this.emit('queue.update', this.getStats());
		});
	}

	/**
	 * Schedule a model call
	 */
	async schedule<T>(
		fn: () => Promise<T>,
		options: ModelCallOptions,
	): Promise<T> {
		const id = `model-${Date.now()}-${Math.random().toString(36).slice(2)}`;

		return new Promise<T>((resolve, reject) => {
			const request: ModelCallRequest<unknown> = {
				id,
				fn,
				options,
				resolve: resolve as (value: unknown) => void,
				reject,
			};

			this.pending.set(id, request);
			this.emit('request.scheduled', {id, options});

			void this.queue.add(() => this.execute(id, fn, options, resolve, reject));
		});
	}

	private async execute<T>(
		id: string,
		fn: () => Promise<T>,
		options: ModelCallOptions,
		resolve: (value: T) => void,
		reject: (error: Error) => void,
	): Promise<void> {
		this.pending.delete(id);
		this.active.add(id);
		this.emit('request.started', {id, options});

		try {
			let result: T | undefined;
			let lastError: Error | undefined;

			const attempts = options.retryAttempts ?? 2;

			for (let attempt = 0; attempt <= attempts; attempt++) {
				try {
					// Apply timeout if specified
					if (options.timeout) {
						result = await this.withTimeout(fn(), options.timeout);
					} else {
						result = await fn();
					}
					break; // Success
				} catch (error) {
					lastError = error as Error;
					if (attempt < attempts) {
						this.emit('request.retry', {id, attempt: attempt + 1});
						// Exponential backoff
						await this.delay(Math.pow(2, attempt) * 1000);
					}
				}
			}

			if (result === undefined && lastError) {
				throw lastError;
			}

			this.stats.completed++;
			this.emit('request.completed', {id});
			resolve(result as T);
		} catch (error) {
			this.stats.failed++;
			this.emit('request.failed', {id, error});
			reject(error as Error);
		} finally {
			this.active.delete(id);
		}
	}

	private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
			),
		]);
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Cancel a pending request
	 */
	cancel(id: string): boolean {
		const request = this.pending.get(id);
		if (request) {
			this.pending.delete(id);
			request.reject(new Error('Cancelled'));
			return true;
		}
		return false;
	}

	/**
	 * Get current statistics
	 */
	getStats() {
		return {
			...this.stats,
			pending: this.pending.size,
			active: this.active.size,
			queueSize: this.queue.size,
		};
	}

	/**
	 * Pause the scheduler
	 */
	pause(): void {
		this.queue.pause();
		this.emit('paused');
	}

	/**
	 * Resume the scheduler
	 */
	start(): void {
		this.queue.start();
		this.emit('started');
	}

	/**
	 * Clear all pending requests
	 */
	clear(): void {
		for (const request of this.pending.values()) {
			request.reject(new Error('Scheduler cleared'));
		}
		this.pending.clear();
		this.emit('cleared');
	}
}

export default ModelScheduler;
