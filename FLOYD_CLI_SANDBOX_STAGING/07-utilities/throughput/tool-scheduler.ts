/**
 * Tool Call Scheduler
 * Manages parallel tool execution with resource limits
 */

import {EventEmitter} from 'events';
import PQueue from 'p-queue';

// ========== New API from spec ==========

export interface ToolCallOptions {
	toolName: string;
	priority?: number; // 0-10
	timeout?: number;
	dangerous?: boolean; // Requires permission
}

export interface ToolCallRequest<T> {
	id: string;
	fn: () => Promise<T>;
	options: ToolCallOptions;
	resolve: (value: T) => void;
	reject: (error: Error) => void;
	permissionGranted?: boolean;
}

// ========== Legacy API for compatibility ==========

export type ToolRiskLevel = 'safe' | 'risky' | 'dangerous';

export interface ToolRequest {
	toolName: string;
	toolType: string;
	args: Record<string, unknown>;
	riskLevel: ToolRiskLevel;
	priority?: number;
	timeout?: number;
	workspaceId?: string;
}

export interface ToolResponse {
	result: unknown;
	error?: Error;
	executionTime: number;
	toolName: string;
}

export interface ToolSchedulerConfig {
	maxConcurrent: number;
	safeTimeout: number;
	riskyTimeout: number;
	dangerousTimeout: number;
}

export interface ToolMetrics {
	activeExecutions: number;
	queuedRequests: number;
	completedExecutions: number;
	failedExecutions: number;
	averageExecutionTime: number;
	toolUsageCount: Record<string, number>;
	currentRpm: number;
}

const DEFAULT_CONFIG: ToolSchedulerConfig = {
	maxConcurrent: 24,
	safeTimeout: 30_000,
	riskyTimeout: 60_000,
	dangerousTimeout: 120_000,
};

/**
 * Tool Call Scheduler
 * Manages concurrent tool execution with safety checks
 */
export class ToolScheduler extends EventEmitter {
	private queue: PQueue;
	private pending: Map<string, ToolCallRequest<unknown>> = new Map();
	private active: Map<string, ToolCallRequest<unknown>> = new Map();
	private dangerousTools = new Set<string>();
	private stats = {
		completed: 0,
		failed: 0,
		blocked: 0,
		total: 0,
	};

	// Legacy metrics for compatibility
	private metrics: ToolMetrics = {
		activeExecutions: 0,
		queuedRequests: 0,
		completedExecutions: 0,
		failedExecutions: 0,
		averageExecutionTime: 0,
		toolUsageCount: {},
		currentRpm: 0,
	};
	private executionTimes: number[] = [];

	constructor(concurrency = 24) {
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
	 * Schedule a tool call (new API)
	 */
	async schedule<T>(
		fn: () => Promise<T>,
		options: ToolCallOptions,
	): Promise<T> {
		const id = `tool-${options.toolName}-${Date.now()}-${Math.random()
			.toString(36)
			.slice(2)}`;

		return new Promise((resolve, reject) => {
			const request: ToolCallRequest<T> = {
				id,
				fn,
				options,
				resolve: resolve as (value: T) => void,
				reject,
			};

			// Check if permission is needed for dangerous tools
			if (options.dangerous && !this.isPermissionGranted(options.toolName)) {
				this.pending.set(id, request as ToolCallRequest<unknown>);
				this.emit('permission.request', {id, toolName: options.toolName});
				this.stats.blocked++;
				// Store for later approval
				this.blockRequest(request as ToolCallRequest<unknown>);
				return;
			}

			this.pending.set(id, request as ToolCallRequest<unknown>);
			this.executeRequest(request as ToolCallRequest<unknown>);
		});
	}

	private executeRequest(request: ToolCallRequest<unknown>): void {
		this.pending.delete(request.id);
		this.active.set(request.id, request);
		this.emit('tool.started', {
			id: request.id,
			toolName: request.options.toolName,
		});

		this.queue
			.add(() => this.execute(request))
			.then(result => {
				request.resolve(result);
			})
			.catch(error => {
				request.reject(error);
			});
	}

	private async execute(request: ToolCallRequest<unknown>): Promise<unknown> {
		const {id, fn, options} = request;

		this.emit('tool.executing', {id, toolName: options.toolName});

		const startTime = Date.now();

		try {
			let result: unknown;
			if (options.timeout) {
				result = await this.withTimeout(fn(), options.timeout);
			} else {
				result = await fn();
			}

			const executionTime = Date.now() - startTime;
			this.recordExecutionTime(executionTime);
			this.recordSuccess(options.toolName);

			this.stats.completed++;
			this.emit('tool.completed', {id, toolName: options.toolName});
			return result;
		} catch (error) {
			this.stats.failed++;
			this.recordFailure();
			this.emit('tool.failed', {id, toolName: options.toolName, error});
			throw error;
		} finally {
			this.active.delete(id);
		}
	}

	/**
	 * Grant permission for a blocked request
	 */
	grantPermission(id: string): void {
		const request = Array.from(this.pending.values()).find(r => r.id === id);
		if (request && request.options.dangerous) {
			this.permissionGranted(request.options.toolName);
			this.executeRequest(request);
		}
	}

	/**
	 * Deny permission for a blocked request
	 */
	denyPermission(id: string): void {
		const request = Array.from(this.pending.values()).find(r => r.id === id);
		if (request) {
			this.pending.delete(request.id);
			request.reject(new Error('Permission denied'));
		}
	}

	/**
	 * Mark a tool as granted permission for this session
	 */
	private permissionGranted(toolName: string): void {
		this.dangerousTools.add(toolName);
		this.emit('permission.granted', {toolName});
	}

	/**
	 * Check if permission is already granted
	 */
	private isPermissionGranted(toolName: string): boolean {
		return this.dangerousTools.has(toolName);
	}

	private blockRequest(request: ToolCallRequest<unknown>): void {
		// Store for later approval/rejection
		this.pending.set(request.id, request);
	}

	private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(() => reject(new Error(`Tool timeout after ${ms}ms`)), ms),
			),
		]);
	}

	/**
	 * Get current statistics (new API)
	 */
	getStats() {
		return {
			...this.stats,
			pending: this.pending.size - this.stats.blocked,
			blocked: this.stats.blocked,
			active: this.active.size,
			queueSize: this.queue.size,
			grantedTools: Array.from(this.dangerousTools),
		};
	}

	/**
	 * Get current metrics (legacy API for compatibility)
	 */
	getMetrics(): ToolMetrics {
		return {
			...this.metrics,
			toolUsageCount: {...this.metrics.toolUsageCount},
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

	/**
	 * Shutdown the scheduler (legacy API)
	 */
	shutdown(): void {
		this.clear();
		this.queue.pause();
	}

	/**
	 * Record execution time for metrics
	 */
	private recordExecutionTime(executionTime: number): void {
		this.executionTimes.push(executionTime);

		// Keep only last 100 execution times
		if (this.executionTimes.length > 100) {
			this.executionTimes.shift();
		}

		// Calculate average
		const sum = this.executionTimes.reduce((a, b) => a + b, 0);
		this.metrics.averageExecutionTime = Math.round(
			sum / this.executionTimes.length,
		);
	}

	/**
	 * Record a successful tool execution
	 */
	private recordSuccess(toolName: string): void {
		this.metrics.completedExecutions++;
		this.metrics.toolUsageCount[toolName] =
			(this.metrics.toolUsageCount[toolName] ?? 0) + 1;
	}

	/**
	 * Record a failed tool execution
	 */
	private recordFailure(): void {
		this.metrics.failedExecutions++;
	}
}

export default ToolScheduler;

/**
 * Create a singleton tool scheduler (legacy API)
 */
let defaultToolScheduler: ToolScheduler | null = null;

export function getToolScheduler(
	config?: Partial<ToolSchedulerConfig>,
): ToolScheduler {
	if (!defaultToolScheduler) {
		const concurrency = config?.maxConcurrent ?? DEFAULT_CONFIG.maxConcurrent;
		defaultToolScheduler = new ToolScheduler(concurrency);
	}

	return defaultToolScheduler;
}

export function resetToolScheduler(): void {
	if (defaultToolScheduler) {
		defaultToolScheduler.shutdown();
		defaultToolScheduler = null;
	}
}
