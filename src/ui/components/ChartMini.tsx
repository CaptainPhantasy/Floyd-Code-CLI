/**
 * ChartMini Component
 *
 * Mini sparkline charts for metrics visualization.
 * Features line charts, bar charts, and single-line display for terminal UIs.
 *
 * ASCII Characters used:
 * - █ Full block
 * - ▓ Dark shade (3/4)
 * - ▒ Medium shade (1/2)
 * - ░ Light shade (1/4)
 * - o Dot for line charts
 * - ▁▂▃▄▅▆▇█ Sparkline characters
 */

import {useMemo, type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, accentColors, statusColors} from '../../theme/crush-theme';

// ============================================================================
// TYPES
// ============================================================================

export type ChartType = 'line' | 'bar' | 'area' | 'dots';

export interface DataPoint {
	/** Value at this point */
	value: number;

	/** Optional label for this point */
	label?: string;

	/** Optional color override */
	color?: string;
}

export interface ChartMiniProps {
	/** Data points to display */
	data: number[] | DataPoint[];

	/** Chart type */
	type?: ChartType;

	/** Chart width in characters */
	width?: number;

	/** Chart height in rows (for line/area charts) */
	height?: number;

	/** Primary color for the chart */
	color?: string;

	/** Secondary color (for gradients/fills) */
	secondaryColor?: string;

	/** Show axis labels */
	showLabels?: boolean;

	/** Show min/max values */
	showRange?: boolean;

	/** Chart title */
	title?: string;

	/** Custom min value (defaults to data min) */
	min?: number;

	/** Custom max value (defaults to data max) */
	max?: number;

	/** Compact mode (single line) */
	compact?: boolean;
}

// ============================================================================
// COLOR THRESHOLDS
// ============================================================================

export interface ColorThreshold {
	/** Value threshold */
	value: number;

	/** Color to apply at/above this threshold */
	color: string;
}

// ============================================================================
// MINI COMPONENT PROPS
// ============================================================================

export interface MiniBarChartProps {
	/** Label for the bar */
	label: string;
	/** Current value (0-100) */
	value: number;
	/** Maximum value for scaling (defaults to 100) */
	max?: number;
	/** Width of the bar in characters */
	width?: number;
	/** Show percentage text */
	showPercent?: boolean;
	/** Color thresholds for value-based coloring */
	thresholds?: ColorThreshold[];
	/** Custom color (overrides thresholds) */
	color?: string;
}

export interface MiniLineChartProps {
	/** Data values to plot */
	data: number[];
	/** Width of the chart */
	width?: number;
	/** Height of the chart */
	height?: number;
	/** Chart color */
	color?: string;
	/** Show connecting lines between points */
	showLines?: boolean;
	/** Color thresholds for coloring points */
	thresholds?: ColorThreshold[];
}

export interface MiniSparklineProps {
	/** Data values */
	values: number[];
	/** Chart color */
	color?: string;
	/** Show trend indicator */
	showTrend?: boolean;
	/** Use ASCII blocks instead of dots */
	useBlocks?: boolean;
	/** Color thresholds for last value */
	thresholds?: ColorThreshold[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize data to DataPoint array
 */
function normalizeData(data: number[] | DataPoint[]): DataPoint[] {
	if (typeof data[0] === 'number') {
		return (data as number[]).map(value => ({value}));
	}
	return data as DataPoint[];
}

/**
 * Get min/max from data
 */
function getDataRange(data: DataPoint[]): {
	min: number;
	max: number;
	range: number;
} {
	const values = data.map(d => d.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;

	return {min, max, range};
}

/**
 * Scale a value to chart height
 */
function scaleValue(
	value: number,
	min: number,
	range: number,
	height: number,
): number {
	const normalized = (value - min) / range;
	return Math.max(
		0,
		Math.min(height - 1, Math.round(normalized * (height - 1))),
	);
}

/**
 * Format value for display
 */
function formatValue(value: number, precision = 1): string {
	if (value >= 1000000) return `${(value / 1000000).toFixed(precision)}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(precision)}K`;
	return value.toFixed(precision);
}

/**
 * Get color based on thresholds
 */
function getColorByThreshold(
	value: number,
	thresholds: ColorThreshold[],
	defaultColor: string,
): string {
	if (!thresholds || thresholds.length === 0) {
		return defaultColor;
	}
	// Sort thresholds by value descending
	const sorted = [...thresholds].sort((a, b) => b.value - a.value);

	for (const threshold of sorted) {
		if (value >= threshold.value) {
			return threshold.color;
		}
	}

	return defaultColor;
}

/**
 * Get ASCII block character based on fill percentage (0-1)
 * Uses █ ▓ ▒ ░ for progressive fill levels
 */
function getBlockChar(fillPercent: number): string {
	if (fillPercent >= 1) return '█';
	if (fillPercent >= 0.75) return '▓';
	if (fillPercent >= 0.5) return '▒';
	if (fillPercent >= 0.25) return '░';
	return ' ';
}

// ============================================================================
// MINI COMPONENTS - Public exports
// ============================================================================

/**
 * MiniBarChart - Simple horizontal bar chart using ASCII blocks
 *
 * Renders a horizontal progress bar with full and partial block characters
 * (█ ▓ ▒ ░) for precise display of percentages in terminal environments.
 *
 * @example
 * ```tsx
 * <MiniBarChart label="CPU" value={75} width={20} />
 * <MiniBarChart
 *   label="Memory"
 *   value={90}
 *   thresholds={[
 *     { value: 80, color: statusColors.error },
 *     { value: 50, color: statusColors.warning }
 *   ]}
 * />
 * ```
 */
export function MiniBarChart({
	label,
	value,
	max = 100,
	width = 20,
	showPercent = true,
	thresholds,
	color: customColor,
}: MiniBarChartProps) {
	const scaledValue = Math.min(100, Math.max(0, value));
	const fillPercent = scaledValue / max;

	// Determine color based on thresholds or custom color
	const defaultColor = accentColors.tertiary;
	const barColor =
		customColor ||
		getColorByThreshold(scaledValue, thresholds || [], defaultColor);

	// Calculate full blocks and partial block
	const totalBlocks = width;
	const filledBlocks = Math.floor(fillPercent * totalBlocks);
	const partialFill = (fillPercent * totalBlocks) % 1;

	// Build the bar string
	let barString = '';

	// Filled blocks
	barString += '█'.repeat(filledBlocks);

	// Partial block
	if (filledBlocks < totalBlocks) {
		barString += getBlockChar(partialFill);
	}

	// Empty blocks
	const emptyBlocks = Math.max(
		0,
		totalBlocks - filledBlocks - (partialFill > 0 ? 1 : 0),
	);
	barString += '░'.repeat(emptyBlocks);

	return (
		<Box width={width + (showPercent ? 8 : 0) + (label ? label.length + 1 : 0)}>
			{label && <Text dimColor>{label} </Text>}
			<Text color={barColor}>{barString}</Text>
			{showPercent && <Text dimColor> {Math.round(scaledValue)}%</Text>}
		</Box>
	);
}

/**
 * MiniLineChart - Simple line chart using characters
 *
 * Renders a multi-row line chart using box-drawing characters and dots
 * for smooth visual representation of data trends.
 *
 * @example
 * ```tsx
 * <MiniLineChart data={[1, 3, 2, 5, 4, 7]} width={30} height={6} />
 * ```
 */
export function MiniLineChart({
	data,
	width = 30,
	height = 6,
	color: customColor,
	showLines = true,
	thresholds,
}: MiniLineChartProps) {
	const lineColor = customColor || accentColors.primary;

	const {min, range} = getDataRange(data.map(v => ({value: v})));

	// Create grid for rendering
	const grid: string[][] = Array.from({length: height}, () =>
		Array(width).fill(' '),
	);

	// Calculate point positions
	const positions = data
		.slice(0, width)
		.map(value => scaleValue(value, min, range, height));

	// Plot points and connecting lines
	positions.forEach((y, col) => {
		const row = height - 1 - y;

		if (showLines && col > 0) {
			const prevY = positions[col - 1];
			if (prevY !== undefined) {
				const prevRow = height - 1 - prevY;

				// Draw line from previous point
				if (prevRow === row) {
					// Horizontal line
					const currentRow = grid[row];
					if (currentRow && currentRow[col - 1] === ' ') {
						currentRow[col - 1] = '-';
					}
				} else if (prevRow < row) {
					// Going down
					const targetRow = grid[Math.min(row, prevRow)];
					if (targetRow && targetRow[col - 1] === ' ') {
						targetRow[col - 1] = '\\';
					}
				} else {
					// Going up
					const targetRow = grid[Math.max(row, prevRow)];
					if (targetRow && targetRow[col - 1] === ' ') {
						targetRow[col - 1] = '/';
					}
				}
			}
		}

		// Place the point
		const currentRow = grid[row];
		if (currentRow && currentRow[col] === ' ') {
			currentRow[col] = 'o';
		}
	});

	return (
		<Box flexDirection="column">
			{grid.map((row, rowIndex) => (
				<Box key={rowIndex}>
					{row.map((char, col) => {
						const value = data[col];
						const pointColor =
							thresholds && char === 'o' && value !== undefined
								? getColorByThreshold(value!, thresholds, lineColor)
								: lineColor;

						return (
							<Text key={col} color={char === ' ' ? undefined : pointColor}>
								{char}
							</Text>
						);
					})}
				</Box>
			))}
		</Box>
	);
}

/**
 * MiniSparkline - Minimal single-line sparkline
 *
 * Renders a compact single-line chart using dots or block characters
 * for inline display of trends. Supports both braille-pattern dots
 * and block-style (▁▂▃▄▅▆▇█) visualization.
 *
 * @example
 * ```tsx
 * <MiniSparkline values={[1, 2, 3, 2, 4, 5]} showTrend />
 * <MiniSparkline
 *   values={[10, 20, 15, 30, 25]}
 *   thresholds={[{ value: 25, color: statusColors.error }]}
 * />
 * ```
 */
export function MiniSparkline({
	values,
	color: customColor,
	showTrend = true,
	useBlocks = false,
	thresholds,
}: MiniSparklineProps) {
	const lastValue = values[values.length - 1] ?? 0;
	const firstValue = values[0] ?? 0;
	const trend = values.length >= 2 ? lastValue - firstValue : 0;

	// Determine color based on thresholds or default
	const defaultColor = accentColors.tertiary;
	const sparkColor =
		customColor ||
		getColorByThreshold(lastValue, thresholds || [], defaultColor);

	const trendColor = trend >= 0 ? statusColors.ready : statusColors.error;
	const trendSymbol = trend >= 0 ? '↑' : '↓';

	// Generate sparkline characters
	const {min, range} = getDataRange(values.map(v => ({value: v})));
	const sparkHeight = useBlocks ? 4 : 3;

	const sparkChars = values.slice(0, 30).map(value => {
		const y = scaleValue(value, min, range, sparkHeight);
		if (useBlocks) {
			// Use block characters for denser display
			const blockChars = [' ', '░', '▒', '▓', '█'];
			return blockChars[Math.min(blockChars.length - 1, y + 1)];
		}
		// Use simple vertical positioning characters
		const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
		return chars[
			Math.min(
				chars.length - 1,
				Math.floor((y / (sparkHeight - 1)) * chars.length),
			)
		];
	});

	return (
		<Box>
			<Text color={sparkColor}>{sparkChars.join('')}</Text>
			{showTrend && (
				<Text color={trendColor} dimColor>
					{' '}
					{trendSymbol}
					{Math.abs(trend).toFixed(1)}
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// INTERNAL CHART RENDERERS (for ChartMini)
// ============================================================================

/**
 * Render sparkline (single line chart)
 */
function renderSparkline(data: DataPoint[], color: string): ReactNode {
	return (
		<>
			{data.map((point, index) => {
				const char = index === 0 ? '' : '';
				return (
					<Text key={index} color={point.color || color}>
						{char}
					</Text>
				);
			})}
		</>
	);
}

/**
 * Render multi-line chart
 */
function renderLineChart(
	data: DataPoint[],
	width: number,
	height: number,
	color: string,
): ReactNode[] {
	const {min, range} = getDataRange(data);

	// Create grid for rendering
	const grid: string[][] = Array.from({length: height}, () =>
		Array(width).fill(' '),
	);

	// Plot points
	data.forEach((point, i) => {
		if (i >= width) return;
		const y = scaleValue(point.value, min, range, height);
		const rowIndex = height - 1 - y;
		const row = grid[rowIndex];
		if (row) {
			row[i] = 'o';
		}
	});

	// Render rows
	const rows: ReactNode[] = [];
	for (let row = 0; row < height; row++) {
		const gridRow = grid[row];
		if (!gridRow) continue;
		rows.push(
			<Box key={row}>
				{gridRow.map((char, i) => (
					<Text key={i} color={color}>
						{char}
					</Text>
				))}
			</Box>,
		);
	}

	return rows;
}

/**
 * Render bar chart
 */
function renderBarChart(
	data: DataPoint[],
	width: number,
	height: number,
	color: string,
	showLabels: boolean,
): ReactNode {
	const {min, range} = getDataRange(data);
	const barWidth = Math.max(1, Math.floor(width / data.length));

	return (
		<Box flexDirection="column">
			{/* Chart rows (bottom to top) */}
			{Array.from({length: height}).map((_, rowIndex) => {
				const isTop = rowIndex === 0;
				const isBottom = rowIndex === height - 1;

				return (
					<Box key={rowIndex}>
						{/* Y-axis labels */}
						{showLabels && isTop && (
							<Text dimColor>{formatValue(min + range)}</Text>
						)}
						{showLabels && !isTop && !isBottom && (
							<Text dimColor>{'        '}</Text>
						)}
						{showLabels && isBottom && <Text dimColor>{formatValue(min)}</Text>}

						{/* Bars */}
						{data.map((point, i) => {
							const barHeight = scaleValue(point.value, min, range, height);
							const barTop = height - 1 - barHeight;
							const isActive = rowIndex >= barTop && rowIndex < height;

							return (
								<Text key={i} color={point.color || color} dimColor={!isActive}>
									{isActive ? '█' : ' '}
									{barWidth > 1 && ' '.repeat(barWidth - 1)}
								</Text>
							);
						})}
					</Box>
				);
			})}
		</Box>
	);
}

/**
 * Render area chart (filled line)
 */
function renderAreaChart(
	data: DataPoint[],
	width: number,
	height: number,
	color: string,
	secondaryColor: string,
): ReactNode {
	const {min, range} = getDataRange(data);
	const grid: string[][] = Array.from({length: height}, () =>
		Array(width).fill(' '),
	);

	// Fill area under the line
	data.forEach((point, i) => {
		if (i >= width) return;
		const y = scaleValue(point.value, min, range, height);

		// Fill from bottom up to the value
		for (let row = height - 1; row >= height - 1 - y; row--) {
			if (row >= 0) {
				const gridRow = grid[row];
				if (gridRow) {
					gridRow[i] = row === height - 1 - y ? 'o' : '░';
				}
			}
		}
	});

	return (
		<Box flexDirection="column">
			{grid.map((row, rowIndex) => {
				return (
					<Box key={rowIndex}>
						{row.map((char, i) => (
							<Text
								key={i}
								color={
									char === 'o'
										? color
										: char === '░'
										? secondaryColor
										: undefined
								}
								dimColor={char === ' '}
							>
								{char}
							</Text>
						))}
					</Box>
				);
			})}
		</Box>
	);
}

/**
 * Render dots chart
 */
function renderDotsChart(
	data: DataPoint[],
	width: number,
	height: number,
	color: string,
	showLabels: boolean,
): ReactNode {
	const {min, range} = getDataRange(data);

	return (
		<Box flexDirection="column">
			{Array.from({length: height}).map((_, rowIndex) => {
				const isTop = rowIndex === 0;
				const isBottom = rowIndex === height - 1;

				return (
					<Box key={rowIndex}>
						{showLabels && isTop && (
							<Text dimColor>{formatValue(min + range)}</Text>
						)}
						{showLabels && !isTop && !isBottom && (
							<Text dimColor>{'        '}</Text>
						)}
						{showLabels && isBottom && <Text dimColor>{formatValue(min)}</Text>}

						{data.map((point, i) => {
							if (i >= width) return null;
							const y = scaleValue(point.value, min, range, height);
							const isActive = rowIndex === height - 1 - y;

							return (
								<Text key={i} color={point.color || color} dimColor={!isActive}>
									{isActive ? 'o' : ' '}
								</Text>
							);
						})}
					</Box>
				);
			})}
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChartMini({
	data: rawData,
	type = 'line',
	width = 40,
	height = 8,
	color,
	secondaryColor,
	showLabels = false,
	showRange = true,
	title,
	min: customMin,
	max: customMax,
	compact = false,
}: ChartMiniProps) {
	// Normalize data
	const data = useMemo(() => normalizeData(rawData), [rawData]);

	// Get range with custom min/max
	const defaultRange = getDataRange(data);
	const min = customMin ?? defaultRange.min;
	const max = customMax ?? defaultRange.max;

	// Trim or pad data to fit width
	const chartData = useMemo(() => {
		if (data.length > width) {
			// Sample data to fit width
			const step = data.length / width;
			return Array.from({length: width}, (_, i) => {
				const idx = Math.floor(i * step);
				return data[idx] || {value: min};
			});
		}
		return data;
	}, [data, width, min]);

	// Colors
	const chartColor = color || floydTheme.colors.tertiary;
	const chartSecondaryColor = secondaryColor || floydTheme.colors.fgSubtle;

	// Calculate stats
	const avg = chartData.reduce((sum, p) => sum + p.value, 0) / chartData.length;
	const lastValue = chartData[chartData.length - 1]?.value ?? min;
	const firstValue = chartData[0]?.value ?? min;
	const change = lastValue - firstValue;
	const changePercent =
		firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : 0;

	// Render chart based on type
	const renderChart = (): ReactNode => {
		if (compact) {
			return renderSparkline(chartData, chartColor);
		}

		switch (type) {
			case 'bar':
				return renderBarChart(chartData, width, height, chartColor, showLabels);
			case 'area':
				return renderAreaChart(
					chartData,
					width,
					height,
					chartColor,
					chartSecondaryColor,
				);
			case 'dots':
				return renderDotsChart(
					chartData,
					width,
					height,
					chartColor,
					showLabels,
				);
			default:
				// line
				return (
					<Box flexDirection="column">
						{renderLineChart(chartData, width, height, chartColor)}
					</Box>
				);
		}
	};

	return (
		<Box flexDirection="column" width={width + (showLabels ? 10 : 0)}>
			{/* Header */}
			{(title || showRange) && (
				<Box justifyContent="space-between" marginBottom={0}>
					{title && (
						<Text bold color={floydTheme.colors.fgSelected}>
							{title}
						</Text>
					)}
					{showRange && (
						<Text dimColor>
							{formatValue(min)} - {formatValue(max)}
						</Text>
					)}
				</Box>
			)}

			{/* Chart */}
			{renderChart()}

			{/* Stats footer */}
			{!compact && (
				<Box justifyContent="space-between" marginTop={0}>
					<Text dimColor>avg: {formatValue(avg)}</Text>
					<Text
						color={
							change >= 0 ? floydTheme.colors.success : floydTheme.colors.error
						}
					>
						{change >= 0 ? '↑' : '↓'}
						{formatValue(Math.abs(changePercent))}%
					</Text>
					<Text bold color={chartColor}>
						{formatValue(lastValue)}
					</Text>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// ADDITIONAL EXPORTED COMPONENTS
// ============================================================================

/**
 * Sparkline - Single line sparkline (alias for MiniSparkline for backward compatibility)
 */
export interface SparklineProps {
	/** Data values */
	values: number[];

	/** Chart color */
	color?: string;

	/** Show trend indicator */
	showTrend?: boolean;
}

export function Sparkline({values, color, showTrend = true}: SparklineProps) {
	return (
		<MiniSparkline
			values={values}
			color={color}
			showTrend={showTrend}
			useBlocks={false}
		/>
	);
}

/**
 * MetricCard - Display a single metric with optional sparkline
 */
export interface MetricCardProps {
	/** Metric label */
	label: string;

	/** Current value */
	value: number;

	/** Historical data for sparkline */
	history?: number[];

	/** Unit suffix */
	unit?: string;

	/** Color for the metric */
	color?: string;

	/** Show change indicator */
	showChange?: boolean;

	/** Color thresholds for value-based coloring */
	thresholds?: ColorThreshold[];
}

export function MetricCard({
	label,
	value,
	history,
	unit = '',
	color,
	showChange = true,
	thresholds,
}: MetricCardProps) {
	const metricColor = color || floydTheme.colors.tertiary;
	const historyFirst = history?.[0] ?? 0;
	const change = history && history.length >= 2 ? value - historyFirst : 0;

	// Apply color based on thresholds if provided
	const displayColor = thresholds
		? getColorByThreshold(value, thresholds, metricColor)
		: metricColor;

	return (
		<Box flexDirection="column" width={30}>
			<Box justifyContent="space-between">
				<Text dimColor>{label}</Text>
				{showChange && change !== 0 && (
					<Text
						color={
							change >= 0 ? floydTheme.colors.success : floydTheme.colors.error
						}
						dimColor
					>
						{change >= 0 ? '↑' : '↓'}
						{formatValue(Math.abs(change))}
					</Text>
				)}
			</Box>

			<Box>
				<Text bold color={displayColor}>
					{formatValue(value)}
					{unit}
				</Text>
			</Box>

			{history && history.length > 1 && (
				<MiniSparkline
					values={history}
					color={displayColor}
					showTrend={false}
				/>
			)}
		</Box>
	);
}

/**
 * MultiChart - Display multiple small charts in a grid
 */
export interface MultiChartProps {
	/** Array of chart data */
	charts: Array<{
		label: string;
		data: number[];
		color?: string;
	}>;

	/** Charts per row */
	columns?: number;

	/** Width of each chart */
	chartWidth?: number;

	/** Height of each chart */
	chartHeight?: number;
}

export function MultiChart({
	charts,
	columns = 2,
	chartWidth = 30,
	chartHeight = 6,
}: MultiChartProps) {
	const rowArrays: Array<
		Array<{label: string; data: number[]; color?: string}>
	> = [];

	// Arrange charts in grid
	for (let i = 0; i < charts.length; i += columns) {
		const rowCharts = charts.slice(i, i + columns);
		rowArrays.push(rowCharts);
	}

	return (
		<Box flexDirection="column">
			{rowArrays.map((row, rowIndex) => (
				<Box key={rowIndex} marginBottom={1}>
					{row.map((chart, colIndex) => (
						<Box key={colIndex} marginRight={colIndex < row.length - 1 ? 2 : 0}>
							<Text dimColor>{chart.label}</Text>
							<Box>
								<ChartMini
									data={chart.data}
									type="dots"
									width={chartWidth}
									height={chartHeight}
									color={chart.color}
									compact={false}
									showLabels={false}
									showRange={false}
								/>
							</Box>
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
}

export default ChartMini;
