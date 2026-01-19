/**
 * ThroughputEngine - Main Orchestrator
 *
 * Purpose: Unified entry point for all throughput management
 * Combines: RateLimiter, Scheduler, SwarmScheduler, ModelScheduler, ToolScheduler
 *
 * Features:
 * - Single point of configuration for all scheduling/rate limiting
 * - Coordinated metrics across all components
 * - Graceful shutdown handling
 * - Unified error handling
 * - Health status monitoring
 */

import {
	RateLimiter,
	type RateLimiterConfig,
	type RateLimiterMetrics,
} from './rate-limiter.js';
import {
	AdaptiveRateLimiter,
	type SchedulerConfig,
	type SchedulerMetrics,
} from './scheduler.js';
import {SwarmScheduler, type SwarmState} from './swarm-scheduler.js';
import {ModelScheduler} from './model-scheduler.js';
import {ToolScheduler, type ToolMetrics} from './tool-scheduler.js';

export interface ThroughputEngineConfig {
	/**
	 * Rate limiter configuration
	 */
	rateLimiter?: Partial<RateLimiterConfig>;

	/**
	 * Main scheduler configuration
	 */
	scheduler?: Partial<SchedulerConfig>;

	/**
	 * Model scheduler concurrency
	 */
	modelConcurrency?: number;

	/**
	 * Tool scheduler concurrency
	 */
	toolConcurrency?: number;
}

interface ModelStats {
	completed: number;
	failed: number;
	total: number;
	pending: number;
	active: number;
	queueSize: number;
}

export interface ThroughputMetrics {
	rateLimiter: RateLimiterMetrics;
	scheduler: SchedulerMetrics;
	swarm: {
		states: SwarmState[];
		stats: {
			queueSize: number;
			activeTasks: number;
			pendingTasks: number;
			completedTasks: number;
		};
	};
	model: ModelStats;
	tool: ToolMetrics;
	overallHealth: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: number;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Main orchestrator for all throughput management components
 *
 * Provides a unified interface for:
 * - Rate limiting (token bucket)
 * - Request scheduling (2000 RPM target)
 * - Swarm management (6 agent swarms)
 * - Model request coordination (12 concurrent)
 * - Tool execution coordination (24 concurrent)
 */
export class ThroughputEngine {
	private rateLimiter: RateLimiter;
	private scheduler: AdaptiveRateLimiter;
	private swarmScheduler: SwarmScheduler;
	private modelScheduler: ModelScheduler;
	private toolScheduler: ToolScheduler;
	private isRunning = true;
	private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

	constructor(config: ThroughputEngineConfig = {}) {
		// Initialize components in order of dependency
		this.rateLimiter = new RateLimiter(config.rateLimiter);
		this.scheduler = new AdaptiveRateLimiter(config.scheduler);
		this.swarmScheduler = new SwarmScheduler();
		this.modelScheduler = new ModelScheduler(config.modelConcurrency ?? 12);
		this.toolScheduler = new ToolScheduler(config.toolConcurrency ?? 24);

		// Start health monitoring
		this.startHealthCheck();
	}

	/**
	 * Wait for rate limiter availability (blocks until token available)
	 */
	async waitForAvailability(): Promise<void> {
		if (!this.isRunning) {
			throw new Error('ThroughputEngine is shutdown');
		}
		return this.rateLimiter.wait();
	}

	/**
	 * Check if request can be executed immediately without waiting
	 */
	canExecuteImmediately(): boolean {
		if (!this.isRunning) {
			return false;
		}

		const rateLimitState = this.scheduler.getState();
		return (
			this.rateLimiter.canExecuteImmediately() &&
			rateLimitState.currentRpm < 5000 // Below hard cap
		);
	}

	/**
	 * Get comprehensive metrics from all components
	 */
	getMetrics(): ThroughputMetrics {
		const modelStats = this.modelScheduler.getStats();
		return {
			rateLimiter: this.rateLimiter.getMetrics(),
			scheduler: this.scheduler.getState(),
			swarm: {
				states: this.swarmScheduler.getStates(),
				stats: this.swarmScheduler.getStats(),
			},
			model: modelStats,
			tool: this.toolScheduler.getMetrics(),
			overallHealth: this.getHealthStatus(),
			timestamp: Date.now(),
		};
	}

	/**
	 * Get current health status
	 */
	getHealthStatus(): HealthStatus {
		if (!this.isRunning) {
			return 'unhealthy';
		}

		const metrics = this.getMetrics();

		// Check for unhealthy conditions
		if (
			metrics.scheduler.backpressure ||
			metrics.rateLimiter.waitingRequests > 50 ||
			metrics.model.failed > 10 ||
			metrics.tool.failedExecutions > 10
		) {
			return 'unhealthy';
		}

		// Check for degraded conditions
		if (
			metrics.scheduler.queueLength > 20 ||
			metrics.rateLimiter.waitingRequests > 10 ||
			metrics.swarm.stats.activeTasks < 4
		) {
			return 'degraded';
		}

		return 'healthy';
	}

	/**
	 * Get a formatted health report
	 */
	getHealthReport(): string {
		const metrics = this.getMetrics();
		const health = metrics.overallHealth;

		const lines = [
			`ThroughputEngine Health: ${health.toUpperCase()}`,
			'',
			'Rate Limiter:',
			`  Available Tokens: ${metrics.rateLimiter.availableTokens.toFixed(1)}`,
			`  Current RPM: ${metrics.rateLimiter.currentRpm}`,
			`  Waiting: ${metrics.rateLimiter.waitingRequests}`,
			'',
			'Scheduler:',
			`  Current RPM: ${metrics.scheduler.currentRpm}`,
			`  Queue Length: ${metrics.scheduler.queueLength}`,
			`  Backpressure: ${metrics.scheduler.backpressure ? 'YES' : 'NO'}`,
			`  Wait Time: ${metrics.scheduler.waitTime}ms`,
			'',
			'Swarm:',
			`  Queue Size: ${metrics.swarm.stats.queueSize}`,
			`  Active Tasks: ${metrics.swarm.stats.activeTasks}`,
			`  Pending Tasks: ${metrics.swarm.stats.pendingTasks}`,
			`  Completed Tasks: ${metrics.swarm.stats.completedTasks}`,
			'',
			'Model Scheduler:',
			`  Completed: ${metrics.model.completed}`,
			`  Failed: ${metrics.model.failed}`,
			`  Pending: ${metrics.model.pending}`,
			`  Active: ${metrics.model.active}`,
			`  Queue Size: ${metrics.model.queueSize}`,
			'',
			'Tool Scheduler:',
			`  Active Executions: ${metrics.tool.activeExecutions}`,
			`  Queued: ${metrics.tool.queuedRequests}`,
			`  Completed: ${metrics.tool.completedExecutions}`,
			`  Avg Time: ${metrics.tool.averageExecutionTime}ms`,
		];

		return lines.join('\n');
	}

	/**
	 * Estimate wait time for next available execution slot
	 */
	estimateWaitTime(): number {
		return this.rateLimiter.estimateWaitTime();
	}

	/**
	 * Get access to individual components (for advanced usage)
	 */
	getRateLimiter(): RateLimiter {
		return this.rateLimiter;
	}

	getScheduler(): AdaptiveRateLimiter {
		return this.scheduler;
	}

	getSwarmScheduler(): SwarmScheduler {
		return this.swarmScheduler;
	}

	getModelScheduler(): ModelScheduler {
		return this.modelScheduler;
	}

	getToolScheduler(): ToolScheduler {
		return this.toolScheduler;
	}

	/**
	 * Gracefully shutdown all components
	 */
	shutdown(): void {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;

		// Stop health check
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}

		// Shutdown components in reverse order of dependency
		this.toolScheduler.shutdown();
		this.modelScheduler.clear();
		this.rateLimiter.shutdown();
	}

	/**
	 * Reset all components to initial state
	 */
	reset(): void {
		this.rateLimiter.reset();
	}

	/**
	 * Start periodic health checks
	 */
	private startHealthCheck(): void {
		this.healthCheckInterval = setInterval(() => {
			// Health check logic runs periodically
			// Could emit events or log warnings here
			const health = this.getHealthStatus();

			if (health === 'unhealthy') {
				// Log unhealthy state - could integrate with proper logger
				console.warn('[ThroughputEngine] Unhealthy state detected');
			}
		}, 30_000); // Every 30 seconds

		if (typeof this.healthCheckInterval.unref === 'function') {
			this.healthCheckInterval.unref();
		}
	}
}

/**
 * Default singleton instance
 */
let defaultEngine: ThroughputEngine | null = null;

/**
 * Get or create the default ThroughputEngine instance
 */
export function getThroughputEngine(
	config?: ThroughputEngineConfig,
): ThroughputEngine {
	if (!defaultEngine) {
		defaultEngine = new ThroughputEngine(config);
	}
	return defaultEngine;
}

/**
 * Reset the default ThroughputEngine instance
 */
export function resetThroughputEngine(): void {
	if (defaultEngine) {
		defaultEngine.shutdown();
		defaultEngine = null;
	}
}

// Export all component types and classes for direct use
export {
	RateLimiter,
	type RateLimiterConfig,
	type RateLimiterMetrics,
} from './rate-limiter.js';
export {
	AdaptiveRateLimiter,
	getScheduler,
	resetScheduler,
	type SchedulerConfig,
	type SchedulerMetrics,
	type QueuedRequest,
} from './scheduler.js';
export {
	SwarmScheduler,
	type SwarmType,
	type SwarmTask,
	type SwarmState,
	type SwarmDefinition,
	type SwarmRole,
	SWARM_WEIGHTS,
} from './swarm-scheduler.js';
export {ModelScheduler} from './model-scheduler.js';
export {
	ToolScheduler,
	getToolScheduler,
	resetToolScheduler,
	type ToolMetrics,
	type ToolRequest,
	type ToolResponse,
	type ToolRiskLevel,
} from './tool-scheduler.js';
