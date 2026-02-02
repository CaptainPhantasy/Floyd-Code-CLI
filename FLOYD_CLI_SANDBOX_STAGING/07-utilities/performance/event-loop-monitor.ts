/**
 * Event Loop Monitor
 *
 * Purpose: Detect and report event loop lag and blocking operations
 * Helps diagnose freezes and performance issues in CLI applications
 *
 * Exports: EventLoopMonitor class
 * Related: performance-monitor.ts
 */

export interface EventLoopMetrics {
	/** Time between event loop ticks in milliseconds */
	lag: number;
	/** Whether this tick had significant lag */
	isSlow: boolean;
	/** Slow threshold in milliseconds */
	slowThreshold: number;
	/** Timestamp when measured */
	timestamp: number;
}

export interface EventLoopMonitorConfig {
	/** Threshold for considering an event loop tick "slow" (default: 50ms) */
	slowThresholdMs?: number;
	/** Sampling interval in milliseconds (default: 1000ms) */
	samplingInterval?: number;
	/** Enable debug logging */
	debug?: boolean;
	/** Callback when slow tick detected */
	onSlowTick?: (metrics: EventLoopMetrics) => void;
}

const DEFAULT_CONFIG: Required<EventLoopMonitorConfig> = {
	slowThresholdMs: 50,
	samplingInterval: 1000,
	debug: false,
	onSlowTick: undefined as any,
};

/**
 * EventLoopMonitor measures event loop lag by timing operations
 *
 * Features:
 * - Detects blocking operations (>50ms lag)
 * - Tracks average lag over time
 * - Reports slow ticks with callbacks
 * - Non-blocking measurement
 */
export class EventLoopMonitor {
	private config: Required<EventLoopMonitorConfig>;
	private samplingTimer: ReturnType<typeof setInterval> | null = null;
	private metrics: EventLoopMetrics[] = [];
	private maxHistorySize = 100;
	private isMonitoring = false;

	constructor(config: EventLoopMonitorConfig = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Measure current event loop lag
	 *
	 * Uses setImmediate to measure after microtask queue
	 */
	measureLag(): void {
		const start = Date.now();

		new Promise<void>(resolve => {
			// Schedule after microtask queue (after all sync operations)
			setImmediate(() => {
				const end = Date.now();
				const lag = end - start;
				const isSlow = lag > this.config.slowThresholdMs;

				const metrics: EventLoopMetrics = {
					lag,
					isSlow,
					slowThreshold: this.config.slowThresholdMs,
					timestamp: Date.now(),
				};

				if (isSlow && this.config.onSlowTick) {
					this.config.onSlowTick(metrics);
				}

				if (this.config.debug) {
					if (isSlow) {
						console.warn(
							`[EventLoop] SLOW TICK: ${lag}ms > ${this.config.slowThresholdMs}ms threshold`,
						);
					} else if (lag > 10) {
						console.debug(`[EventLoop] Lag: ${lag}ms`);
					}
				}

				this.addToHistory(metrics);
				resolve();
			});
		});
	}

	/**
	 * Start automatic monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring) {
			return; // Already monitoring
		}

		this.isMonitoring = true;

		this.samplingTimer = setInterval(() => {
			this.measureLag();
		}, this.config.samplingInterval);

		// Unref to allow Node.js to exit if this is the only timer
		if (typeof this.samplingTimer.unref === 'function') {
			this.samplingTimer.unref();
		}
	}

	/**
	 * Stop automatic monitoring
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) {
			return;
		}

		this.isMonitoring = false;

		if (this.samplingTimer !== null) {
			clearInterval(this.samplingTimer);
			this.samplingTimer = null;
		}
	}

	/**
	 * Add metrics to history
	 */
	private addToHistory(metrics: EventLoopMetrics): void {
		this.metrics.push(metrics);
		if (this.metrics.length > this.maxHistorySize) {
			this.metrics.shift();
		}
	}

	/**
	 * Get metrics history
	 */
	getHistory(): EventLoopMetrics[] {
		return [...this.metrics];
	}

	/**
	 * Get average lag over history
	 */
	getAverageLag(): number {
		if (this.metrics.length === 0) {
			return 0;
		}

		const sum = this.metrics.reduce((acc, m) => acc + m.lag, 0);
		return sum / this.metrics.length;
	}

	/**
	 * Get peak lag from history
	 */
	getPeakLag(): number {
		if (this.metrics.length === 0) {
			return 0;
		}

		return Math.max(...this.metrics.map(m => m.lag));
	}

	/**
	 * Get slow tick percentage
	 */
	getSlowTickPercentage(): number {
		if (this.metrics.length === 0) {
			return 0;
		}

		const slowTicks = this.metrics.filter(m => m.isSlow).length;
		return (slowTicks / this.metrics.length) * 100;
	}

	/**
	 * Reset history
	 */
	resetHistory(): void {
		this.metrics = [];
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<EventLoopMonitorConfig>): void {
		this.config = {...this.config, ...config};

		// Restart monitoring if interval changed
		if (config.samplingInterval && this.samplingTimer !== null) {
			this.stopMonitoring();
			this.startMonitoring();
		}
	}

	/**
	 * Check if currently monitoring
	 */
	isMonitoringActive(): boolean {
		return this.isMonitoring;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopMonitoring();
		this.metrics = [];
		this.isMonitoring = false;
	}
}

/**
 * Create an event loop monitor with default configuration
 */
export function createEventLoopMonitor(
	config?: EventLoopMonitorConfig,
): EventLoopMonitor {
	return new EventLoopMonitor(config);
}

/**
 * Get current event loop lag (convenience function)
 */
export function measureEventLoopLag(): void {
	const monitor = new EventLoopMonitor();
	monitor.measureLag();
}

export default EventLoopMonitor;
