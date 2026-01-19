/**
 * RateLimitGauge Component
 *
 * Throughput monitoring with RPM (requests per minute) display.
 * Visualizes rate limiting status and request throughput metrics.
 *
 * Features:
 * - Real-time RPM display with gauge visualization
 * - Rate limit status indicators (OK, warning, critical)
 * - Queue length visualization
 * - Backoff status display
 * - Historical RPM sparkline
 * - Throughput statistics
 */

import {useState} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {crushTheme} from '../../theme/crush-theme.js';
import type {SchedulerMetrics} from '../../throughput/scheduler.js';

// Re-export scheduler types for convenience
export type {SchedulerMetrics};

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
	/** Target RPM (requests per minute) */
	targetRpm: number;

	/** Hard cap RPM */
	hardCapRpm: number;

	/** Warning threshold (0-1 ratio of target) */
	warningThreshold: number;

	/** Critical threshold (0-1 ratio of hard cap) */
	criticalThreshold: number;

	/** Queue size limit */
	maxQueueSize: number;
}

export interface RateLimitGaugeProps {
	/** Current scheduler metrics */
	metrics: SchedulerMetrics;

	/** Rate limit configuration */
	config: RateLimitConfig;

	/** Show detailed statistics */
	showDetails?: boolean;

	/** Show queue visualization */
	showQueue?: boolean;

	/** Show historical RPM sparkline */
	showHistory?: boolean;

	/** Compact mode */
	compact?: boolean;

	/** Width constraint */
	width?: number;

	/** Historical RPM values for sparkline */
	historicalRpm?: number[];
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get RPM status based on current rate vs limits
 */
function getRpmStatus(
	currentRpm: number,
	config: RateLimitConfig,
): {
	status: 'ok' | 'warning' | 'critical' | 'backoff';
	color: string;
	label: string;
} {
	if (currentRpm >= config.hardCapRpm) {
		return {
			status: 'critical',
			color: crushTheme.status.error,
			label: 'AT LIMIT',
		};
	}

	const hardCapRatio = currentRpm / config.hardCapRpm;
	if (hardCapRatio >= config.criticalThreshold) {
		return {
			status: 'critical',
			color: crushTheme.status.error,
			label: 'CRITICAL',
		};
	}

	const targetRatio = currentRpm / config.targetRpm;
	if (targetRatio >= config.warningThreshold) {
		return {
			status: 'warning',
			color: crushTheme.status.warning,
			label: 'HIGH',
		};
	}

	if (currentRpm < 10) {
		return {
			status: 'ok',
			color: crushTheme.status.offline,
			label: 'IDLE',
		};
	}

	return {
		status: 'ok',
		color: crushTheme.status.ready,
		label: 'OK',
	};
}

/**
 * Format RPM for display
 */
function formatRpm(rpm: number): string {
	if (rpm < 1000) return rpm.toString();
	return `${(rpm / 1000).toFixed(1)}k`;
}

/**
 * Calculate gauge segments (0-10 scale)
 */
function getGaugeSegments(rpm: number, maxRpm: number): number {
	return Math.min(10, Math.round((rpm / maxRpm) * 10));
}

// ============================================================================
// RPM GAUGE COMPONENT
// ============================================================================

interface RpmGaugeProps {
	currentRpm: number;
	targetRpm: number;
	hardCapRpm: number;
	status: {status: string; color: string; label: string};
	width: number;
	showLabel?: boolean;
}

function RpmGauge({
	currentRpm,
	targetRpm,
	hardCapRpm,
	status,
	width,
	showLabel = true,
}: RpmGaugeProps) {
	const segments = getGaugeSegments(currentRpm, hardCapRpm);
	const targetSegments = getGaugeSegments(targetRpm, hardCapRpm);

	// Build the gauge bar
	const gaugeWidth = width - 4;
	let gaugeBar = '';

	for (let i = 0; i < gaugeWidth; i++) {
		const segmentIndex = Math.floor((i / gaugeWidth) * 10);

		if (segmentIndex < segments) {
			// Filled portion - use status color
			gaugeBar += '█';
		} else if (segmentIndex < targetSegments) {
			// Target zone - use working color
			gaugeBar += '▓';
		} else {
			// Empty portion
			gaugeBar += '░';
		}
	}

	return (
		<Box flexDirection="column" width={width}>
			{/* Gauge bar */}
			<Box flexDirection="row" width={width}>
				<Text color={status.color}>[</Text>
				<Text color={status.color}>{gaugeBar}</Text>
				<Text color={status.color}>]</Text>
				{showLabel && (
					<Text color={status.color}> {formatRpm(currentRpm)} RPM</Text>
				)}
			</Box>

			{/* Scale markers */}
			<Box flexDirection="row" width={width} marginLeft={1}>
				<Text color={crushTheme.text.secondary} dimColor>
					0{' '.repeat(Math.max(0, gaugeWidth / 2 - 2))}
					{formatRpm(targetRpm)}
					{' '.repeat(Math.max(0, gaugeWidth / 2 - 2))}
					{formatRpm(hardCapRpm)}
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// QUEUE VISUALIZATION
// ============================================================================

interface QueueVisualizationProps {
	queueLength: number;
	maxQueueSize: number;
	isBackedOff: boolean;
	width: number;
}

function QueueVisualization({
	queueLength,
	maxQueueSize,
	isBackedOff,
	width,
}: QueueVisualizationProps) {
	const fillRatio = Math.min(1, queueLength / maxQueueSize);
	const filledWidth = Math.round((width - 2) * fillRatio);
	const queueColor = isBackedOff
		? crushTheme.status.error
		: fillRatio > 0.8
		? crushTheme.status.warning
		: crushTheme.status.ready;

	return (
		<Box flexDirection="column" width={width}>
			<Box
				flexDirection="row"
				justifyContent="space-between"
				width={width}
				marginBottom={0}
			>
				<Text color={crushTheme.text.tertiary}>Queue:</Text>
				<Text color={queueColor}>
					{queueLength} / {maxQueueSize}
				</Text>
			</Box>
			<Box>
				<Text color={queueColor}>[</Text>
				<Text color={queueColor}>{'█'.repeat(filledWidth)}</Text>
				<Text color={crushTheme.bg.elevated}>
					{'█'.repeat(width - 2 - filledWidth)}
				</Text>
				<Text color={queueColor}>]</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// BACKOFF INDICATOR
// ============================================================================

interface BackoffIndicatorProps {
	isBackedOff: boolean;
	backoffRemainingMs: number;
}

function BackoffIndicator({
	isBackedOff,
	backoffRemainingMs,
}: BackoffIndicatorProps) {
	if (!isBackedOff && backoffRemainingMs <= 0) {
		return null;
	}

	const remaining = Math.ceil(backoffRemainingMs / 1000);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={crushTheme.status.error}>
				<Spinner type="dots" />
			</Text>
			<Text color={crushTheme.status.error}>Backoff {remaining}s</Text>
		</Box>
	);
}

// ============================================================================
// HISTORY SPARKLINE
// ============================================================================

interface HistorySparklineProps {
	historicalRpm: number[];
	targetRpm: number;
	hardCapRpm: number;
	width: number;
}

function HistorySparkline({
	historicalRpm,
	targetRpm,
	hardCapRpm,
}: HistorySparklineProps) {
	if (historicalRpm.length < 2) {
		return null;
	}

	// Take last N data points
	const recent = historicalRpm.slice(-20);
	const max = Math.max(...recent, hardCapRpm);
	const min = 0;

	// Generate sparkline characters
	const sparkline: Array<{char: string; color: string}> = [];

	for (let i = 0; i < recent.length; i++) {
		const rpm = recent[i];
		if (rpm === undefined) continue;

		const normalizedHeight = (rpm - min) / (max - min);
		const charIndex = Math.min(7, Math.floor(normalizedHeight * 8));
		const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
		const char = chars[Math.max(0, charIndex)] || '▁';

		// Color based on RPM level
		let color: string = crushTheme.status.ready;
		if (rpm >= hardCapRpm) {
			color = crushTheme.status.error;
		} else if (rpm >= targetRpm) {
			color = crushTheme.status.working;
		}

		sparkline.push({char, color});
	}

	return (
		<Box flexDirection="row" gap={0}>
			<Text color={crushTheme.text.secondary}>History:</Text>{' '}
			{sparkline.map((item, i) => (
				<Text key={i} color={item.color}>
					{item.char}
				</Text>
			))}
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RateLimitGauge - Throughput monitoring display
 */
export function RateLimitGauge({
	metrics,
	config,
	showDetails = true,
	showQueue = true,
	showHistory = false,
	compact = false,
	width = 50,
	historicalRpm = [],
}: RateLimitGaugeProps) {
	const rpmStatus = getRpmStatus(metrics.currentRpm, config);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box borderStyle="single" borderColor={rpmStatus.color} paddingX={1}>
				<Text bold color={rpmStatus.color}>
					{rpmStatus.label}
				</Text>
				<Text color={crushTheme.text.secondary}> Rate Limit</Text>
			</Box>

			{/* RPM Gauge */}
			<Box marginTop={1} marginBottom={1}>
				<RpmGauge
					currentRpm={metrics.currentRpm}
					targetRpm={config.targetRpm}
					hardCapRpm={config.hardCapRpm}
					status={rpmStatus}
					width={width}
				/>
			</Box>

			{/* Backoff indicator */}
			{metrics.isBackedOff && metrics.backoffRemainingMs > 0 && (
				<Box marginBottom={1}>
					<BackoffIndicator
						isBackedOff={metrics.isBackedOff}
						backoffRemainingMs={metrics.backoffRemainingMs}
					/>
				</Box>
			)}

			{/* Queue visualization */}
			{!compact && showQueue && (
				<Box marginBottom={1}>
					<QueueVisualization
						queueLength={metrics.queueLength}
						maxQueueSize={config.maxQueueSize}
						isBackedOff={metrics.isBackedOff}
						width={width}
					/>
				</Box>
			)}

			{/* Details section */}
			{!compact && showDetails && (
				<Box flexDirection="column" gap={0}>
					<Box flexDirection="row" justifyContent="space-between" width={width}>
						<Text color={crushTheme.text.tertiary}>Target:</Text>
						<Text color={crushTheme.status.working}>
							{formatRpm(config.targetRpm)} RPM
						</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" width={width}>
						<Text color={crushTheme.text.tertiary}>Current:</Text>
						<Text color={rpmStatus.color}>
							{formatRpm(metrics.currentRpm)} RPM
						</Text>
					</Box>
					<Box flexDirection="row" justifyContent="space-between" width={width}>
						<Text color={crushTheme.text.tertiary}>Hard Cap:</Text>
						<Text color={crushTheme.text.secondary}>
							{formatRpm(config.hardCapRpm)} RPM
						</Text>
					</Box>

					{/* Statistics */}
					{metrics.totalRequests > 0 && (
						<Box
							flexDirection="row"
							justifyContent="space-between"
							width={width}
							marginTop={0}
						>
							<Text color={crushTheme.text.tertiary}>Total Requests:</Text>
							<Text color={crushTheme.text.primary}>
								{metrics.totalRequests}
							</Text>
						</Box>
					)}

					{metrics.totalErrors > 0 && (
						<Box
							flexDirection="row"
							justifyContent="space-between"
							width={width}
						>
							<Text color={crushTheme.text.tertiary}>Errors:</Text>
							<Text color={crushTheme.status.error}>{metrics.totalErrors}</Text>
						</Box>
					)}

					{metrics.droppedRequests > 0 && (
						<Box
							flexDirection="row"
							justifyContent="space-between"
							width={width}
						>
							<Text color={crushTheme.text.tertiary}>Dropped:</Text>
							<Text color={crushTheme.status.warning}>
								{metrics.droppedRequests}
							</Text>
						</Box>
					)}
				</Box>
			)}

			{/* Historical sparkline */}
			{!compact && showHistory && historicalRpm.length > 1 && (
				<Box marginTop={1}>
					<HistorySparkline
						historicalRpm={historicalRpm}
						targetRpm={config.targetRpm}
						hardCapRpm={config.hardCapRpm}
						width={width}
					/>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactRateLimitGaugeProps {
	metrics: SchedulerMetrics;
	config: RateLimitConfig;
}

/**
 * CompactRateLimitGauge - Single-line RPM display
 */
export function CompactRateLimitGauge({
	metrics,
	config,
}: CompactRateLimitGaugeProps) {
	const rpmStatus = getRpmStatus(metrics.currentRpm, config);

	return (
		<Box flexDirection="row" gap={2}>
			{metrics.isBackedOff ? (
				<Text color={crushTheme.status.error}>
					<Spinner type="dots" /> Backoff
				</Text>
			) : (
				<Text color={rpmStatus.color}>{formatRpm(metrics.currentRpm)} RPM</Text>
			)}
			{metrics.queueLength > 0 && (
				<Text color={crushTheme.text.secondary}>
					({metrics.queueLength} queued)
				</Text>
			)}
			{metrics.totalErrors > 0 && (
				<Text color={crushTheme.status.error}>
					{metrics.totalErrors} errors
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// MINI GAUGE VARIANT
// ============================================================================

export interface MiniRateLimitGaugeProps {
	currentRpm: number;
	targetRpm: number;
	hardCapRpm: number;
}

/**
 * MiniRateLimitGauge - Minimal 10-character gauge
 */
export function MiniRateLimitGauge({
	currentRpm,
	targetRpm,
	hardCapRpm,
}: MiniRateLimitGaugeProps) {
	const rpmStatus = getRpmStatus(currentRpm, {
		targetRpm,
		hardCapRpm,
		warningThreshold: 0.8,
		criticalThreshold: 0.95,
		maxQueueSize: 100,
	});

	const segments = getGaugeSegments(currentRpm, hardCapRpm);

	let gauge = '';
	for (let i = 0; i < 10; i++) {
		if (i < segments) {
			gauge += i >= Math.round((targetRpm / hardCapRpm) * 10) ? '█' : '▓';
		} else {
			gauge += '░';
		}
	}

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={rpmStatus.color}>[{gauge}]</Text>
			<Text color={rpmStatus.color}>{formatRpm(currentRpm)}</Text>
		</Box>
	);
}

// ============================================================================
// MULTI-GAUGE VARIANT
// ============================================================================

export interface RateLimitItem {
	/** Item name */
	name: string;

	/** Current metrics */
	metrics: SchedulerMetrics;

	/** Individual config overrides */
	config?: Partial<RateLimitConfig>;
}

export interface MultiRateLimitGaugeProps {
	/** Multiple rate limit items */
	items: RateLimitItem[];

	/** Shared base configuration */
	baseConfig: RateLimitConfig;

	/** Width constraint */
	width?: number;
}

/**
 * MultiRateLimitGauge - Display multiple rate limit sources
 */
export function MultiRateLimitGauge({
	items,
	baseConfig,
	width = 60,
}: MultiRateLimitGaugeProps) {
	// Calculate aggregate metrics
	const aggregateMetrics: SchedulerMetrics = {
		currentRpm: items.reduce((sum, item) => sum + item.metrics.currentRpm, 0),
		queueLength: items.reduce((sum, item) => sum + item.metrics.queueLength, 0),
		droppedRequests: items.reduce(
			(sum, item) => sum + item.metrics.droppedRequests,
			0,
		),
		totalRequests: items.reduce(
			(sum, item) => sum + item.metrics.totalRequests,
			0,
		),
		totalErrors: items.reduce((sum, item) => sum + item.metrics.totalErrors, 0),
		isBackedOff: items.some(item => item.metrics.isBackedOff),
		backoffRemainingMs: Math.max(
			...items.map(item => item.metrics.backoffRemainingMs),
		),
		backpressure: items.some(item => item.metrics.backpressure),
		waitTime: Math.max(...items.map(item => item.metrics.waitTime)),
	};

	const aggregateConfig: RateLimitConfig = {
		...baseConfig,
		targetRpm: baseConfig.targetRpm * items.length,
		hardCapRpm: baseConfig.hardCapRpm * items.length,
		maxQueueSize: baseConfig.maxQueueSize * items.length,
	};

	const rpmStatus = getRpmStatus(aggregateMetrics.currentRpm, aggregateConfig);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box borderStyle="single" borderColor={rpmStatus.color} paddingX={1}>
				<Text bold color={rpmStatus.color}>
					Throughput
				</Text>
				<Text color={crushTheme.text.secondary}> ({items.length} sources)</Text>
			</Box>

			{/* Aggregate gauge */}
			<Box marginTop={1} marginBottom={1}>
				<RpmGauge
					currentRpm={aggregateMetrics.currentRpm}
					targetRpm={aggregateConfig.targetRpm}
					hardCapRpm={aggregateConfig.hardCapRpm}
					status={rpmStatus}
					width={width}
				/>
			</Box>

			{/* Individual items */}
			<Box flexDirection="column" gap={0}>
				{items.map((item, index) => {
					const itemConfig = {...baseConfig, ...item.config};
					const itemStatus = getRpmStatus(item.metrics.currentRpm, itemConfig);

					return (
						<Box
							key={index}
							flexDirection="row"
							justifyContent="space-between"
							width={width - 2}
							marginBottom={0}
						>
							<Text color={crushTheme.text.tertiary}>{item.name}</Text>
							<Box flexDirection="row" gap={2}>
								<Text color={itemStatus.color}>
									{formatRpm(item.metrics.currentRpm)} RPM
								</Text>
								{item.metrics.queueLength > 0 && (
									<Text color={crushTheme.text.secondary} dimColor>
										({item.metrics.queueLength})
									</Text>
								)}
								{item.metrics.isBackedOff && (
									<Text color={crushTheme.status.error}>
										<Spinner type="dots" />
									</Text>
								)}
							</Box>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

// ============================================================================
// HOOKS FOR INTEGRATION
// ============================================================================

/**
 * Hook for managing rate limit gauge state
 */
export interface UseRateLimitGaugeResult {
	metrics: SchedulerMetrics;
	updateMetrics: (updates: Partial<SchedulerMetrics>) => void;
	getStatus: () => {status: string; color: string; label: string};
	reset: () => void;
}

export function useRateLimitGauge(
	config: RateLimitConfig,
): UseRateLimitGaugeResult {
	const [metrics, setMetrics] = useState<SchedulerMetrics>({
		currentRpm: 0,
		queueLength: 0,
		droppedRequests: 0,
		totalRequests: 0,
		totalErrors: 0,
		isBackedOff: false,
		backoffRemainingMs: 0,
		backpressure: false,
		waitTime: 0,
	});

	const updateMetrics = (updates: Partial<SchedulerMetrics>) => {
		setMetrics(prev => ({...prev, ...updates}));
	};

	const getStatus = () => {
		return getRpmStatus(metrics.currentRpm, config);
	};

	const reset = () => {
		setMetrics({
			currentRpm: 0,
			queueLength: 0,
			droppedRequests: 0,
			totalRequests: 0,
			totalErrors: 0,
			isBackedOff: false,
			backoffRemainingMs: 0,
			backpressure: false,
			waitTime: 0,
		});
	};

	return {
		metrics,
		updateMetrics,
		getStatus,
		reset,
	};
}

export default RateLimitGauge;
