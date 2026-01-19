/**
 * ToolTimeline Component
 *
 * Timeline visualization of tool executions with timing and status.
 * Shows a Gantt-style timeline of tool calls with parallel execution visualization.
 *
 * Features:
 * - Gantt chart style timeline
 * - Parallel execution visualization
 * - Tool call duration display
 * - Color-coded status
 * - Compact mode for small terminals
 * - Tool groupings
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type ToolExecutionStatus =
	| 'pending'
	| 'running'
	| 'success'
	| 'error'
	| 'cancelled';

export interface ToolExecution {
	/** Unique execution ID */
	id: string;

	/** Tool name */
	toolName: string;

	/** Display label */
	label?: string;

	/** Start timestamp */
	startTime: Date;

	/** End timestamp (undefined if still running) */
	endTime?: Date;

	/** Execution status */
	status: ToolExecutionStatus;

	/** Duration in milliseconds (calculated if not provided) */
	duration?: number;

	/** Worker/agent ID that executed this tool */
	workerId?: string;

	/** Parent execution ID (for nested calls) */
	parentId?: string;

	/** Child executions */
	children?: ToolExecution[];

	/** Error message (if failed) */
	error?: string;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

export interface ToolTimelineProps {
	/** Tool executions to display */
	executions?: ToolExecution[];

	/** Timeline window duration in milliseconds (default: 60 seconds) */
	windowDuration?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Show tool labels */
	showLabels?: boolean;

	/** Show duration */
	showDuration?: boolean;

	/** Color code by worker */
	colorByWorker?: boolean;

	/** Auto-scroll to latest */
	autoScroll?: boolean;

	/** Maximum number of executions to display */
	maxExecutions?: number;

	/** Custom header */
	header?: React.ReactNode;

	/** Group executions by tool */
	groupByTool?: boolean;

	/** Timeline scale */
	scale?: 'linear' | 'logarithmic';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color
 */
function getStatusColor(status: ToolExecutionStatus): string {
	switch (status) {
		case 'pending':
			return floydTheme.colors.fgMuted;
		case 'running':
			return crushTheme.status.working;
		case 'success':
			return crushTheme.status.ready;
		case 'error':
			return crushTheme.status.error;
		case 'cancelled':
			return crushTheme.status.blocked;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get status icon
 */
function getStatusIcon(status: ToolExecutionStatus): string {
	switch (status) {
		case 'pending':
			return '○';
		case 'running':
			return '◉';
		case 'success':
			return '✓';
		case 'error':
			return '✕';
		case 'cancelled':
			return '⊘';
		default:
			return '?';
	}
}

/**
 * Calculate duration from start/end times
 */
function calculateDuration(startTime: Date, endTime?: Date): number {
	if (endTime) {
		return endTime.getTime() - startTime.getTime();
	}
	// If still running, use current time
	return Date.now() - startTime.getTime();
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	if (ms < 60000) {
		return `${(ms / 1000).toFixed(1)}s`;
	}
	return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Generate color based on worker ID
 */
function getWorkerColor(workerId?: string): string {
	if (!workerId) return crushTheme.accent.primary;

	// Simple hash to color mapping
	const colors = [
		crushTheme.accent.primary,
		crushTheme.accent.secondary,
		crushTheme.accent.tertiary,
		crushTheme.accent.info,
		crushTheme.extended.sardine,
		crushTheme.extended.grape,
		crushTheme.extended.julep,
	];

	let hash = 0;
	for (let i = 0; i < workerId.length; i++) {
		hash = workerId.charCodeAt(i) + ((hash << 5) - hash);
	}

	return colors[Math.abs(hash) % colors.length] ?? crushTheme.accent.primary;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * TimelineRow - Single tool execution row
 */
interface TimelineRowProps {
	execution: ToolExecution;
	windowStart: Date;
	windowDuration: number;
	timelineWidth: number;
	showLabels: boolean;
	showDuration: boolean;
	colorByWorker: boolean;
	indent: number;
}

function TimelineRow({
	execution,
	windowStart,
	windowDuration,
	timelineWidth,
	showLabels,
	showDuration,
	colorByWorker,
	indent,
}: TimelineRowProps) {
	const duration =
		execution.duration ??
		calculateDuration(execution.startTime, execution.endTime);
	const status = execution.status;
	const color = colorByWorker
		? getWorkerColor(execution.workerId)
		: getStatusColor(status);

	// Calculate position and width within the timeline window
	const executionStart = execution.startTime.getTime();
	const windowStartMs = windowStart.getTime();

	// Offset from window start (can be negative for items before window)
	const offsetMs = executionStart - windowStartMs;

	// Calculate position (0-1) within window
	const position = Math.max(0, offsetMs / windowDuration);

	// Calculate width (0-1) based on duration
	const width = Math.min(1 - position, duration / windowDuration);

	// Generate the timeline bar
	const barWidth = Math.max(1, Math.round(timelineWidth * width));
	const barPosition = Math.min(
		timelineWidth - barWidth,
		Math.max(0, Math.round(timelineWidth * position)),
	);

	// Build the timeline string
	const timeline = Array(timelineWidth).fill('░');

	for (
		let i = barPosition;
		i < barPosition + barWidth && i < timelineWidth;
		i++
	) {
		if (status === 'running') {
			timeline[i] = '▰';
		} else if (status === 'error') {
			timeline[i] = '▓';
		} else if (status === 'success') {
			timeline[i] = '█';
		} else if (status === 'pending') {
			timeline[i] = '▒';
		} else {
			timeline[i] = '░';
		}
	}

	const indentStr = '  '.repeat(indent);

	return (
		<Box flexDirection="column" key={execution.id}>
			<Box flexDirection="row" gap={1} width="100%">
				<Text color={floydTheme.colors.fgSubtle}>{indentStr}</Text>

				{/* Status icon */}
				<Text color={color}>{getStatusIcon(status)}</Text>

				{/* Tool name */}
				{showLabels && (
					<Text color={color}>{execution.label || execution.toolName}</Text>
				)}

				{/* Timeline bar */}
				<Text color={color}>{timeline.join('')}</Text>

				{/* Duration */}
				{showDuration && (
					<Text color={floydTheme.colors.fgMuted}>
						{formatDuration(duration)}
					</Text>
				)}
			</Box>

			{/* Child executions */}
			{execution.children &&
				execution.children.map(child => (
					<TimelineRow
						key={child.id}
						execution={child}
						windowStart={windowStart}
						windowDuration={windowDuration}
						timelineWidth={timelineWidth}
						showLabels={showLabels}
						showDuration={showDuration}
						colorByWorker={colorByWorker}
						indent={indent + 1}
					/>
				))}
		</Box>
	);
}

/**
 * TimeScale - Timeline time markers
 */
interface TimeScaleProps {
	windowStart: Date;
	windowDuration: number;
	width: number;
}

function TimeScale({windowStart, windowDuration, width}: TimeScaleProps) {
	const markers = 5;
	const interval = windowDuration / markers;

	const markers_jsx = Array.from({length: markers + 1}, (_, i) => {
		const time = new Date(windowStart.getTime() + interval * i);
		const position = (i / markers) * width;
		const label = time.toLocaleTimeString('en-US', {
			hour12: false,
			minute: '2-digit',
			second: '2-digit',
		});

		return (
			<Text key={i} color={floydTheme.colors.fgSubtle}>
				{' '.repeat(
					Math.round(position - (i > 0 ? ((i - 1) / markers) * width : 0)),
				)}
				{label}
			</Text>
		);
	});

	return <Box flexDirection="row">{markers_jsx}</Box>;
}

/**
 * CompactTimeline - Single line timeline for status bars
 */
interface CompactTimelineProps {
	executions: ToolExecution[];
	windowDuration: number;
	width?: number;
}

export function CompactTimeline({
	executions,
	windowDuration,
	width = 40,
}: CompactTimelineProps) {
	const now = Date.now();
	const windowStart = now - windowDuration;

	// Create a simple ASCII timeline
	const timeline = Array(width).fill(' ');

	executions.slice(-20).forEach(exec => {
		const start = exec.startTime.getTime();
		const duration =
			exec.duration ?? calculateDuration(exec.startTime, exec.endTime);
		const end = start + duration;

		// Map to timeline position
		const startPos = Math.max(
			0,
			Math.min(
				width - 1,
				Math.round(((start - windowStart) / windowDuration) * width),
			),
		);
		const endPos = Math.max(
			0,
			Math.min(
				width,
				Math.round(((end - windowStart) / windowDuration) * width),
			),
		);

		// Fill in the timeline
		for (let i = startPos; i < endPos && i < width; i++) {
			if (exec.status === 'error') {
				timeline[i] = '✕';
			} else if (exec.status === 'success') {
				timeline[i] = '█';
			} else if (exec.status === 'running') {
				timeline[i] = '▰';
			}
		}
	});

	const runningCount = executions.filter(e => e.status === 'running').length;
	const errorCount = executions.filter(e => e.status === 'error').length;

	return (
		<Box flexDirection="row" gap={1}>
			{runningCount > 0 && (
				<Text color={crushTheme.status.working}>◉ {runningCount}</Text>
			)}
			{errorCount > 0 && (
				<Text color={crushTheme.status.error}>✕ {errorCount}</Text>
			)}
			<Text color={crushTheme.accent.primary}>{timeline.join('')}</Text>
		</Box>
	);
}

/**
 * ToolTimeline - Main component
 */
export function ToolTimeline({
	executions: propExecutions,
	windowDuration = 60000,
	compact = false,
	showLabels = true,
	showDuration = true,
	colorByWorker = false,
	autoScroll = true,
	maxExecutions = 50,
	header,
	groupByTool = false,
}: ToolTimelineProps) {
	// Internal state for executions (with simulation)
	const [executions, setExecutions] = useState<ToolExecution[]>(
		propExecutions || [],
	);
	const [windowStart, setWindowStart] = useState(
		() => new Date(Date.now() - windowDuration),
	);

	// Update window start for auto-scroll
	useEffect(() => {
		if (!autoScroll) return;

		const timer = setInterval(() => {
			setWindowStart(new Date(Date.now() - windowDuration));
		}, 1000);

		return () => clearInterval(timer);
	}, [autoScroll, windowDuration]);

	// Update executions when prop changes
	useEffect(() => {
		if (propExecutions) {
			setExecutions(propExecutions);
		}
	}, [propExecutions]);

	// Timeline width (number of characters)
	const timelineWidth = compact ? 20 : 40;

	// Stats
	const stats = useMemo(() => {
		const now = Date.now();
		const recent = executions.filter(
			e => e.startTime.getTime() > now - windowDuration,
		);

		return {
			total: executions.length,
			running: recent.filter(e => e.status === 'running').length,
			success: recent.filter(e => e.status === 'success').length,
			error: recent.filter(e => e.status === 'error').length,
		};
	}, [executions, windowDuration]);

	// Compact mode - single line
	if (compact) {
		return (
			<Box flexDirection="column" width="100%">
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
							Tool Timeline
						</Text>
						<Text dimColor color={floydTheme.colors.fgMuted}>
							{stats.running} running
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<CompactTimeline
						executions={executions}
						windowDuration={windowDuration}
						width={timelineWidth}
					/>
				</Box>
			</Box>
		);
	}

	// Group executions by tool if enabled
	const displayExecutions = useMemo(() => {
		if (!groupByTool) return executions.slice(-maxExecutions);

		const groups = new Map<string, ToolExecution[]>();
		for (const exec of executions) {
			const key = exec.toolName;
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)!.push(exec);
		}

		// Create grouped executions (simplified)
		const grouped: ToolExecution[] = [];
		for (const [toolName, toolExecutions] of groups) {
			const latest = toolExecutions[toolExecutions.length - 1];
			if (latest) {
				grouped.push({
					...latest,
					label: `${toolName} (${toolExecutions.length})`,
					children: toolExecutions.slice(0, -1),
				});
			}
		}

		return grouped.slice(-maxExecutions);
	}, [executions, maxExecutions, groupByTool]);

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
					<Box flexDirection="row" gap={2}>
						<Text bold color={crushTheme.accent.secondary}>
							Tool Timeline
						</Text>
						<Text dimColor color={floydTheme.colors.fgMuted}>
							{displayExecutions.length} shown
						</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						<Text color={crushTheme.status.working}>◉ {stats.running}</Text>
						<Text color={crushTheme.status.ready}>✓ {stats.success}</Text>
						<Text color={crushTheme.status.error}>✕ {stats.error}</Text>
					</Box>
				</Box>
			)}

			{/* Time scale */}
			<Box paddingX={1} paddingBottom={0}>
				<TimeScale
					windowStart={windowStart}
					windowDuration={windowDuration}
					width={timelineWidth}
				/>
			</Box>

			{/* Timeline rows */}
			<Box
				flexDirection="column"
				paddingX={1}
				height={20}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				{displayExecutions.length === 0 ? (
					<Box paddingY={1}>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							No tool executions yet...
						</Text>
					</Box>
				) : (
					displayExecutions.map(execution => (
						<TimelineRow
							key={execution.id}
							execution={execution}
							windowStart={windowStart}
							windowDuration={windowDuration}
							timelineWidth={timelineWidth}
							showLabels={showLabels}
							showDuration={showDuration}
							colorByWorker={colorByWorker}
							indent={0}
						/>
					))
				)}
			</Box>

			{/* Footer */}
			<Box
				flexDirection="row"
				justifyContent="space-between"
				paddingX={1}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					{windowDuration / 1000}s window
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					{autoScroll ? 'Live' : 'Paused'}
				</Text>
			</Box>
		</Box>
	);
}

/**
 * ToolExecutionCard - Detailed view of a single execution
 */
export interface ToolExecutionCardProps {
	execution: ToolExecution;
	showDetails?: boolean;
}

export function ToolExecutionCard({
	execution,
	showDetails = true,
}: ToolExecutionCardProps) {
	const duration =
		execution.duration ??
		calculateDuration(execution.startTime, execution.endTime);
	const color = getStatusColor(execution.status);

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={color}
			paddingX={1}
			gap={0}
		>
			{/* Header */}
			<Box flexDirection="row" justifyContent="space-between" marginBottom={0}>
				<Text bold color={color}>
					{getStatusIcon(execution.status)}{' '}
					{execution.label || execution.toolName}
				</Text>
				<Text color={floydTheme.colors.fgMuted}>
					{formatDuration(duration)}
				</Text>
			</Box>

			{/* Details */}
			{showDetails && (
				<>
					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgSubtle}>Started:</Text>
						<Text color={floydTheme.colors.fgMuted}>
							{execution.startTime.toLocaleTimeString()}
						</Text>
					</Box>

					{execution.workerId && (
						<Box flexDirection="row" gap={1}>
							<Text color={floydTheme.colors.fgSubtle}>Worker:</Text>
							<Text color={floydTheme.colors.fgMuted}>
								{execution.workerId}
							</Text>
						</Box>
					)}

					{execution.error && (
						<Box flexDirection="row" gap={1}>
							<Text color={crushTheme.status.error}>Error:</Text>
							<Text color={crushTheme.status.error}>{execution.error}</Text>
						</Box>
					)}

					{execution.endTime && (
						<Box flexDirection="row" gap={1}>
							<Text color={floydTheme.colors.fgSubtle}>Ended:</Text>
							<Text color={floydTheme.colors.fgMuted}>
								{execution.endTime.toLocaleTimeString()}
							</Text>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}

export default ToolTimeline;
