/**
 * SystemMetrics Component
 *
 * Real-time system metrics display with sparkline charts.
 * Shows CPU, Memory, Disk, and Network usage in compact visualizations.
 *
 * Features:
 * - Real-time updates every 1-2 seconds
 * - Sparkline charts for trends
 * - Color-coded thresholds
 * - Compact mode for small terminals
 * - Multiple metric views
 */

import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MetricData {
	/** Current value */
	current: number;

	/** Historical values for sparkline */
	history: number[];

	/** Maximum value */
	max: number;

	/** Unit label */
	unit: string;

	/** Threshold for warning level */
	warningThreshold?: number;

	/** Threshold for critical level */
	criticalThreshold?: number;
}

export interface SystemMetricsData {
	/** CPU usage percentage */
	cpu: MetricData;

	/** Memory usage in MB or percentage */
	memory: MetricData;

	/** Disk usage in percentage */
	disk: MetricData;

	/** Network I/O in KB/s */
	network: {
		/** Download speed */
		download: MetricData;

		/** Upload speed */
		upload: MetricData;
	};

	/** Event loop lag in milliseconds */
	eventLoop?: MetricData;

	/** Active connections count */
	connections?: number;
}

export interface SystemMetricsProps {
	/** Metrics data (if not provided, uses internal state) */
	metrics?: SystemMetricsData;

	/** Update interval in milliseconds */
	interval?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Show sparkline charts */
	showSparklines?: boolean;

	/** Show specific metrics only */
	showMetrics?: Array<
		'cpu' | 'memory' | 'disk' | 'network' | 'eventLoop' | 'connections'
	>;

	/** Custom header */
	header?: React.ReactNode;

	/** History size for sparklines */
	historySize?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color based on threshold
 */
function getThresholdColor(
	value: number,
	warningThreshold?: number,
	criticalThreshold?: number,
): string {
	if (criticalThreshold && value >= criticalThreshold) {
		return crushTheme.status.error;
	}
	if (warningThreshold && value >= warningThreshold) {
		return crushTheme.status.warning;
	}
	return crushTheme.status.ready;
}

/**
 * Generate sparkline characters from values
 */
function generateSparkline(
	values: number[],
	width: number,
	max: number,
): string {
	if (values.length === 0) return ' '.repeat(width);

	const blocks = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
	const result: string[] = [];

	for (let i = 0; i < width; i++) {
		const index = Math.floor((i / width) * values.length);
		const value = values[Math.min(index, values.length - 1)] ?? 0;
		const normalized = Math.min(1, value / max);
		const blockIndex = Math.floor(normalized * (blocks.length - 1));
		result.push(blocks[blockIndex] ?? ' ');
	}

	return result.join('');
}

/**
 * Generate vertical bar chart
 */
function generateBarChart(value: number, max: number, _height: number): string {
	const blocks = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
	const normalized = Math.min(1, value / max);
	const blockIndex = Math.floor(normalized * (blocks.length - 1));

	return blocks[blockIndex] ?? '█';
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * MetricRow - Single metric display with sparkline
 */
interface MetricRowProps {
	label: string;
	data: MetricData;
	showSparkline: boolean;
	compact: boolean;
}

function MetricRow({label, data, showSparkline, compact}: MetricRowProps) {
	const color = getThresholdColor(
		data.current,
		data.warningThreshold,
		data.criticalThreshold,
	);

	const sparklineWidth = compact ? 10 : 20;
	const sparkline = showSparkline
		? generateSparkline(data.history, sparklineWidth, data.max)
		: '';

	return (
		<Box flexDirection="row" gap={1} key={label}>
			{/* Label */}
			<Text color={floydTheme.colors.fgMuted}>{label}</Text>

			{/* Bar/indicator */}
			<Text color={color}>{generateBarChart(data.current, data.max, 1)}</Text>

			{/* Value */}
			<Text color={color} bold>
				{data.current.toFixed(1)}
				<Text dimColor>{data.unit}</Text>
			</Text>

			{/* Sparkline */}
			{showSparkline && (
				<Text color={color} dimColor>
					{sparkline}
				</Text>
			)}

			{/* Max indicator */}
			{!compact && (
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					/max {data.max}
				</Text>
			)}
		</Box>
	);
}

/**
 * NetworkMetrics - Network I/O display
 */
interface NetworkMetricsProps {
	download: MetricData;
	upload: MetricData;
	showSparkline: boolean;
	compact: boolean;
}

function NetworkMetrics({
	download,
	upload,
	showSparkline,
	compact,
}: NetworkMetricsProps) {
	const sparklineWidth = compact ? 8 : 15;

	return (
		<Box flexDirection="column" gap={0} key="network">
			<Box flexDirection="row" gap={1}>
				<Text color={floydTheme.colors.fgMuted}>
					{compact ? 'NET' : 'Network'}
				</Text>

				{/* Download */}
				<Text color={crushTheme.accent.info}>↓</Text>
				<Text color={crushTheme.accent.info}>
					{download.current.toFixed(1)}
					<Text dimColor>{download.unit}</Text>
				</Text>
				{showSparkline && (
					<Text color={crushTheme.accent.info} dimColor>
						{generateSparkline(download.history, sparklineWidth, download.max)}
					</Text>
				)}

				{/* Upload */}
				<Text color={crushTheme.accent.tertiary}>↑</Text>
				<Text color={crushTheme.accent.tertiary}>
					{upload.current.toFixed(1)}
					<Text dimColor>{upload.unit}</Text>
				</Text>
				{showSparkline && (
					<Text color={crushTheme.accent.tertiary} dimColor>
						{generateSparkline(upload.history, sparklineWidth, upload.max)}
					</Text>
				)}
			</Box>
		</Box>
	);
}

/**
 * MiniMetrics - Ultra compact single-line display
 */
interface MiniMetricsProps {
	cpu: number;
	memory: number;
	disk: number;
}

function MiniMetrics({cpu, memory, disk}: MiniMetricsProps) {
	return (
		<Box flexDirection="row" gap={1}>
			<Text color={floydTheme.colors.fgMuted}>CPU:</Text>
			<Text color={getThresholdColor(cpu, 70, 90)}>{cpu.toFixed(0)}%</Text>

			<Text color={floydTheme.colors.fgSubtle}>•</Text>

			<Text color={floydTheme.colors.fgMuted}>MEM:</Text>
			<Text color={getThresholdColor(memory, 70, 90)}>
				{memory.toFixed(0)}%
			</Text>

			<Text color={floydTheme.colors.fgSubtle}>•</Text>

			<Text color={floydTheme.colors.fgMuted}>DSK:</Text>
			<Text color={getThresholdColor(disk, 80, 95)}>{disk.toFixed(0)}%</Text>
		</Box>
	);
}

/**
 * SystemMetrics - Main component
 */
export function SystemMetrics({
	metrics: propMetrics,
	interval = 1500,
	compact = false,
	showSparklines = true,
	showMetrics,
	header,
	historySize = 30,
}: SystemMetricsProps) {
	// Internal state for metrics simulation
	const [metrics, setMetrics] = useState<SystemMetricsData>({
		cpu: {
			current: 0,
			history: [],
			max: 100,
			unit: '%',
			warningThreshold: 70,
			criticalThreshold: 90,
		},
		memory: {
			current: 0,
			history: [],
			max: 100,
			unit: '%',
			warningThreshold: 70,
			criticalThreshold: 90,
		},
		disk: {
			current: 0,
			history: [],
			max: 100,
			unit: '%',
			warningThreshold: 80,
			criticalThreshold: 95,
		},
		network: {
			download: {
				current: 0,
				history: [],
				max: 1000,
				unit: 'KB/s',
			},
			upload: {
				current: 0,
				history: [],
				max: 500,
				unit: 'KB/s',
			},
		},
		eventLoop: {
			current: 0,
			history: [],
			max: 100,
			unit: 'ms',
			warningThreshold: 50,
			criticalThreshold: 100,
		},
		connections: 0,
	});

	// Update metrics periodically (simulation)
	useEffect(() => {
		const timer = setInterval(() => {
			setMetrics(prev => {
				const updateHistory = (current: number, history: number[]) => {
					const newHistory = [...history, current].slice(-historySize);
					return newHistory;
				};

				// Simulate values (in real usage, these would come from actual system monitoring)
				const cpu = Math.random() * 30 + 10;
				const memory = Math.random() * 20 + 50;
				const disk = 65; // Usually stable
				const download = Math.random() * 200;
				const upload = Math.random() * 50;
				const eventLoop = Math.random() * 20;

				return {
					...prev,
					cpu: {
						...prev.cpu,
						current: cpu,
						history: updateHistory(cpu, prev.cpu.history),
					},
					memory: {
						...prev.memory,
						current: memory,
						history: updateHistory(memory, prev.memory.history),
					},
					disk: {
						...prev.disk,
						current: disk,
						history: updateHistory(disk, prev.disk.history),
					},
					network: {
						download: {
							...prev.network.download,
							current: download,
							history: updateHistory(download, prev.network.download.history),
						},
						upload: {
							...prev.network.upload,
							current: upload,
							history: updateHistory(upload, prev.network.upload.history),
						},
					},
					eventLoop: {
						...prev.eventLoop!,
						current: eventLoop,
						history: updateHistory(eventLoop, prev.eventLoop!.history),
					},
					connections: Math.floor(Math.random() * 10) + 5,
				};
			});
		}, interval);

		return () => clearInterval(timer);
	}, [interval, historySize]);

	// Use props if provided, otherwise use internal state
	const displayMetrics = propMetrics ?? metrics;

	// Determine which metrics to show
	const allMetrics = [
		'cpu',
		'memory',
		'disk',
		'network',
		'eventLoop',
		'connections',
	] as const;
	const visibleMetrics = showMetrics ?? allMetrics;

	// Check if showing all default metrics
	const isDefaultView = visibleMetrics.length === allMetrics.length;

	// Ultra compact mode - single line
	if (compact && isDefaultView) {
		return (
			<Box flexDirection="column" width="100%">
				{header || (
					<Box
						flexDirection="row"
						paddingX={1}
						borderStyle="single"
						borderColor={floydTheme.colors.border}
						borderBottom={false}
					>
						<Text bold color={crushTheme.accent.secondary}>
							System Metrics
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<MiniMetrics
						cpu={displayMetrics.cpu.current}
						memory={displayMetrics.memory.current}
						disk={displayMetrics.disk.current}
					/>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%">
			{/* Header */}
			{header || (
				<Box
					flexDirection="row"
					justifyContent="space-between"
					paddingX={1}
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					borderBottom={false}
				>
					<Text bold color={crushTheme.accent.secondary}>
						System Metrics
					</Text>
					<Text dimColor color={floydTheme.colors.fgSubtle}>
						{interval}ms update
					</Text>
				</Box>
			)}

			{/* Metrics */}
			<Box
				flexDirection="column"
				gap={0}
				paddingX={1}
				paddingY={0}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				{visibleMetrics.includes('cpu') && (
					<MetricRow
						label={compact ? 'CPU' : 'CPU'}
						data={displayMetrics.cpu}
						showSparkline={showSparklines}
						compact={compact}
					/>
				)}

				{visibleMetrics.includes('memory') && (
					<MetricRow
						label={compact ? 'MEM' : 'Memory'}
						data={displayMetrics.memory}
						showSparkline={showSparklines}
						compact={compact}
					/>
				)}

				{visibleMetrics.includes('disk') && (
					<MetricRow
						label={compact ? 'DSK' : 'Disk'}
						data={displayMetrics.disk}
						showSparkline={showSparklines}
						compact={compact}
					/>
				)}

				{visibleMetrics.includes('network') && (
					<NetworkMetrics
						download={displayMetrics.network.download}
						upload={displayMetrics.network.upload}
						showSparkline={showSparklines}
						compact={compact}
					/>
				)}

				{visibleMetrics.includes('eventLoop') && displayMetrics.eventLoop && (
					<MetricRow
						label={compact ? 'EVT' : 'Event Loop'}
						data={displayMetrics.eventLoop}
						showSparkline={showSparklines}
						compact={compact}
					/>
				)}

				{visibleMetrics.includes('connections') &&
					displayMetrics.connections !== undefined && (
						<Box flexDirection="row" gap={1}>
							<Text color={floydTheme.colors.fgMuted}>
								{compact ? 'CONN' : 'Connections'}
							</Text>
							<Text color={crushTheme.accent.primary}>
								{displayMetrics.connections}
							</Text>
							<Text dimColor color={floydTheme.colors.fgSubtle}>
								active
							</Text>
						</Box>
					)}
			</Box>
		</Box>
	);
}

/**
 * MetricGauge - Circular gauge for a single metric
 */
export interface MetricGaugeProps {
	/** Metric value (0-100) */
	value: number;

	/** Metric label */
	label: string;

	/** Size of the gauge */
	size?: 'small' | 'medium' | 'large';

	/** Custom color */
	color?: string;

	/** Show percentage */
	showPercentage?: boolean;
}

export function MetricGauge({
	value,
	label,
	size = 'medium',
	color,
	showPercentage = true,
}: MetricGaugeProps) {
	const gaugeColor = color ?? getThresholdColor(value, 70, 90);

	// Determine size
	const width = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
	const filledWidth = Math.round((value / 100) * width);

	// Draw gauge bar
	const barChars = ['░', '▒', '▓', '█'];
	const bar = Array.from({length: width}, (_, i) => {
		if (i >= filledWidth) return barChars[0];
		return barChars[3];
	}).join('');

	return (
		<Box flexDirection="column" alignItems="center">
			<Text color={gaugeColor}>{bar}</Text>
			{showPercentage && (
				<Text color={gaugeColor} bold>
					{value.toFixed(0)}%
				</Text>
			)}
			<Text color={floydTheme.colors.fgMuted}>{label}</Text>
		</Box>
	);
}

/**
 * MetricsPanel - Grid of gauges
 */
export interface MetricsPanelProps {
	/** Metrics to display */
	metrics: Array<{
		label: string;
		value: number;
		color?: string;
	}>;

	/** Columns in the grid */
	columns?: number;

	/** Gauge size */
	size?: 'small' | 'medium' | 'large';
}

export function MetricsPanel({
	metrics,
	columns = 4,
	size = 'small',
}: MetricsPanelProps) {
	const rows: Array<typeof metrics> = [];

	for (let i = 0; i < metrics.length; i += columns) {
		rows.push(metrics.slice(i, i + columns));
	}

	return (
		<Box flexDirection="column" gap={1}>
			{rows.map((row, rowIndex) => (
				<Box key={rowIndex} flexDirection="row" gap={2}>
					{row.map((metric, metricIndex) => (
						<MetricGauge
							key={`${rowIndex}-${metricIndex}`}
							value={metric.value}
							label={metric.label}
							size={size}
							color={metric.color}
						/>
					))}
				</Box>
			))}
		</Box>
	);
}

export default SystemMetrics;
