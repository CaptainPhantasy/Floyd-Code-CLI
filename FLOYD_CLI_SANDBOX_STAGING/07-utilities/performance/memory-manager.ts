/**
 * Memory Manager
 *
 * Purpose: Memory usage tracking and management for CLI applications
 * Exports: MemoryManager class
 * Related: performance-monitor.ts
 */

import {performance} from 'perf_hooks';

/**
 * Memory usage statistics
 */
export interface MemoryStats {
	/** Heap used in bytes */
	heapUsed: number;
	/** Heap total in bytes */
	heapTotal: number;
	/** External memory in bytes */
	external: number;
	/** RSS (Resident Set Size) in bytes */
	rss: number;
	/** Memory usage percentage (heapUsed / heapTotal) */
	usagePercent: number;
	/** Timestamp of measurement */
	timestamp: number;
}

/**
 * Configuration for memory manager
 */
export interface MemoryManagerConfig {
	/** Warning threshold in MB (default: 40MB) */
	warningThresholdMB?: number;
	/** Critical threshold in MB (default: 50MB) */
	criticalThresholdMB?: number;
	/** Enable automatic GC suggestions */
	autoGC?: boolean;
	/** Sampling interval in milliseconds */
	samplingInterval?: number;
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MemoryManagerConfig> = {
	warningThresholdMB: 40,
	criticalThresholdMB: 50,
	autoGC: false,
	samplingInterval: 5000, // 5 seconds
	debug: false,
};

/**
 * MemoryManager tracks and manages memory usage
 *
 * Features:
 * - Real-time memory monitoring
 * - Threshold-based warnings
 * - Memory usage statistics
 * - GC trigger suggestions
 * - Historical tracking
 */
export class MemoryManager {
	private config: Required<MemoryManagerConfig>;
	private samplingTimer: ReturnType<typeof setInterval> | null = null;
	private history: MemoryStats[] = [];
	private maxHistorySize = 100;
	private onWarningCallback?: (stats: MemoryStats) => void;
	private onCriticalCallback?: (stats: MemoryStats) => void;

	constructor(config: MemoryManagerConfig = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Get current memory usage statistics
	 */
	getStats(): MemoryStats {
		const usage = process.memoryUsage();
		const heapUsed = usage.heapUsed;
		const heapTotal = usage.heapTotal;
		const usagePercent = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0;

		const stats: MemoryStats = {
			heapUsed,
			heapTotal,
			external: usage.external,
			rss: usage.rss,
			usagePercent,
			timestamp: Date.now(),
		};

		// Check thresholds
		const heapUsedMB = heapUsed / (1024 * 1024);
		if (heapUsedMB >= this.config.criticalThresholdMB) {
			if (this.onCriticalCallback) {
				this.onCriticalCallback(stats);
			}
			if (this.config.debug) {
				console.warn(
					`[MemoryManager] CRITICAL: Memory usage ${heapUsedMB.toFixed(2)}MB exceeds ${this.config.criticalThresholdMB}MB`,
				);
			}
		} else if (heapUsedMB >= this.config.warningThresholdMB) {
			if (this.onWarningCallback) {
				this.onWarningCallback(stats);
			}
			if (this.config.debug) {
				console.warn(
					`[MemoryManager] WARNING: Memory usage ${heapUsedMB.toFixed(2)}MB exceeds ${this.config.warningThresholdMB}MB`,
				);
			}
		}

		return stats;
	}

	/**
	 * Get memory usage in MB (convenience method)
	 */
	getMemoryMB(): {
		heapUsed: number;
		heapTotal: number;
		rss: number;
	} {
		const stats = this.getStats();
		return {
			heapUsed: stats.heapUsed / (1024 * 1024),
			heapTotal: stats.heapTotal / (1024 * 1024),
			rss: stats.rss / (1024 * 1024),
		};
	}

	/**
	 * Check if memory usage is above warning threshold
	 */
	isAboveWarning(): boolean {
		const stats = this.getStats();
		const heapUsedMB = stats.heapUsed / (1024 * 1024);
		return heapUsedMB >= this.config.warningThresholdMB;
	}

	/**
	 * Check if memory usage is above critical threshold
	 */
	isAboveCritical(): boolean {
		const stats = this.getStats();
		const heapUsedMB = stats.heapUsed / (1024 * 1024);
		return heapUsedMB >= this.config.criticalThresholdMB;
	}

	/**
	 * Start automatic memory monitoring
	 */
	startMonitoring(): void {
		if (this.samplingTimer !== null) {
			return; // Already monitoring
		}

		this.samplingTimer = setInterval(() => {
			const stats = this.getStats();
			this.addToHistory(stats);

			if (this.config.autoGC && this.isAboveWarning()) {
				this.suggestGC();
			}
		}, this.config.samplingInterval);

		// Unref to allow Node.js to exit if this is the only timer
		if (typeof this.samplingTimer.unref === 'function') {
			this.samplingTimer.unref();
		}
	}

	/**
	 * Stop automatic memory monitoring
	 */
	stopMonitoring(): void {
		if (this.samplingTimer !== null) {
			clearInterval(this.samplingTimer);
			this.samplingTimer = null;
		}
	}

	/**
	 * Add stats to history
	 */
	private addToHistory(stats: MemoryStats): void {
		this.history.push(stats);
		if (this.history.length > this.maxHistorySize) {
			this.history.shift();
		}
	}

	/**
	 * Get memory usage history
	 */
	getHistory(): MemoryStats[] {
		return [...this.history];
	}

	/**
	 * Get average memory usage over history
	 */
	getAverageMemory(): {
		heapUsed: number;
		heapTotal: number;
		rss: number;
	} {
		if (this.history.length === 0) {
			const stats = this.getStats();
			return {
				heapUsed: stats.heapUsed / (1024 * 1024),
				heapTotal: stats.heapTotal / (1024 * 1024),
				rss: stats.rss / (1024 * 1024),
			};
		}

		const sum = this.history.reduce(
			(acc, stats) => ({
				heapUsed: acc.heapUsed + stats.heapUsed,
				heapTotal: acc.heapTotal + stats.heapTotal,
				rss: acc.rss + stats.rss,
			}),
			{heapUsed: 0, heapTotal: 0, rss: 0},
		);

		const count = this.history.length;
		return {
			heapUsed: sum.heapUsed / count / (1024 * 1024),
			heapTotal: sum.heapTotal / count / (1024 * 1024),
			rss: sum.rss / count / (1024 * 1024),
		};
	}

	/**
	 * Get peak memory usage from history
	 */
	getPeakMemory(): {
		heapUsed: number;
		heapTotal: number;
		rss: number;
		timestamp: number;
	} {
		if (this.history.length === 0) {
			const stats = this.getStats();
			return {
				heapUsed: stats.heapUsed / (1024 * 1024),
				heapTotal: stats.heapTotal / (1024 * 1024),
				rss: stats.rss / (1024 * 1024),
				timestamp: stats.timestamp,
			};
		}

		const peak = this.history.reduce((max, stats) => {
			return stats.heapUsed > max.heapUsed ? stats : max;
		}, this.history[0]!);

		return {
			heapUsed: peak.heapUsed / (1024 * 1024),
			heapTotal: peak.heapTotal / (1024 * 1024),
			rss: peak.rss / (1024 * 1024),
			timestamp: peak.timestamp,
		};
	}

	/**
	 * Suggest garbage collection (if global.gc is available)
	 *
	 * Note: Requires Node.js started with --expose-gc flag
	 */
	suggestGC(): void {
		if (typeof global.gc === 'function') {
			if (this.config.debug) {
				console.debug('[MemoryManager] Triggering GC...');
			}
			global.gc();
		} else if (this.config.debug) {
			console.debug(
				'[MemoryManager] GC not available. Start Node.js with --expose-gc flag.',
			);
		}
	}

	/**
	 * Set callback for warning threshold
	 */
	onWarning(callback: (stats: MemoryStats) => void): void {
		this.onWarningCallback = callback;
	}

	/**
	 * Set callback for critical threshold
	 */
	onCritical(callback: (stats: MemoryStats) => void): void {
		this.onCriticalCallback = callback;
	}

	/**
	 * Reset history
	 */
	resetHistory(): void {
		this.history = [];
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<MemoryManagerConfig>): void {
		this.config = {...this.config, ...config};

		// Restart monitoring if interval changed
		if (config.samplingInterval && this.samplingTimer !== null) {
			this.stopMonitoring();
			this.startMonitoring();
		}
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopMonitoring();
		this.history = [];
		this.onWarningCallback = undefined;
		this.onCriticalCallback = undefined;
	}
}

/**
 * Create a memory manager with default configuration
 */
export function createMemoryManager(
	config?: MemoryManagerConfig,
): MemoryManager {
	return new MemoryManager(config);
}

/**
 * Get current memory usage (convenience function)
 */
export function getCurrentMemoryMB(): {
	heapUsed: number;
	heapTotal: number;
	rss: number;
} {
	const usage = process.memoryUsage();
	return {
		heapUsed: usage.heapUsed / (1024 * 1024),
		heapTotal: usage.heapTotal / (1024 * 1024),
		rss: usage.rss / (1024 * 1024),
	};
}
