/**
 * WorkerStateBoard Component
 *
 * Real-time worker status board displaying agent worker states.
 * Shows Idle/Working/Waiting/Blocked status for all workers.
 *
 * Features:
 * - Real-time worker status display
 * - Grid layout for multiple workers
 * - Color-coded status indicators
 * - Worker details panel
 * - Compact mode for headers
 * - Status history tracking
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type WorkerStateStatus =
	| 'idle'
	| 'working'
	| 'waiting'
	| 'blocked'
	| 'error'
	| 'offline';

export type WorkerType = 'agent' | 'tool' | 'system' | 'custom';

export interface WorkerState {
	/** Worker ID */
	id: string;

	/** Worker name */
	name: string;

	/** Worker type */
	type: WorkerType;

	/** Current status */
	status: WorkerStateStatus;

	/** Current task description */
	currentTask?: string;

	/** Progress percentage (0-100) */
	progress?: number;

	/** Timestamp of last status change */
	lastUpdate: Date;

	/** Worker capabilities */
	capabilities?: string[];

	/** Error message (if in error state) */
	error?: string;

	/** Parent worker ID (for nested workers) */
	parentId?: string;

	/** Child workers */
	children?: WorkerState[];

	/** Queue size (for tool workers) */
	queueSize?: number;

	/** Completed tasks count */
	completedTasks?: number;

	/** Failed tasks count */
	failedTasks?: number;
}

export interface WorkerStateBoardProps {
	/** Workers to display */
	workers?: WorkerState[];

	/** Update interval in milliseconds */
	interval?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Layout mode */
	layout?: 'grid' | 'list' | 'compact';

	/** Maximum workers to display */
	maxWorkers?: number;

	/** Group by status */
	groupByStatus?: boolean;

	/** Show worker details */
	showDetails?: boolean;

	/** Show progress bars */
	showProgress?: boolean;

	/** Custom header */
	header?: React.ReactNode;

	/** Filter by status */
	filterStatus?: WorkerStateStatus[];

	/** Filter by type */
	filterType?: WorkerType[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color
 */
function getStatusColor(status: WorkerStateStatus): string {
	switch (status) {
		case 'idle':
			return floydTheme.colors.fgMuted;
		case 'working':
			return crushTheme.status.working;
		case 'waiting':
			return crushTheme.status.warning;
		case 'blocked':
			return crushTheme.status.blocked;
		case 'error':
			return crushTheme.status.error;
		case 'offline':
			return crushTheme.status.offline;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get status icon
 */
function getStatusIcon(status: WorkerStateStatus): string {
	switch (status) {
		case 'idle':
			return '○';
		case 'working':
			return '◉';
		case 'waiting':
			return '…';
		case 'blocked':
			return '⊘';
		case 'error':
			return '✕';
		case 'offline':
			return '⊗';
		default:
			return '?';
	}
}

/**
 * Get type icon
 */
function getTypeIcon(type: WorkerType): string {
	switch (type) {
		case 'agent':
			return '◈';
		case 'tool':
			return '⚙';
		case 'system':
			return '◆';
		case 'custom':
			return '●';
		default:
			return '•';
	}
}

/**
 * Get type color
 */
function getTypeColor(type: WorkerType): string {
	switch (type) {
		case 'agent':
			return crushTheme.accent.secondary;
		case 'tool':
			return crushTheme.accent.tertiary;
		case 'system':
			return crushTheme.accent.info;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);

	if (seconds < 60) {
		return `${seconds}s ago`;
	}
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	return `${Math.floor(minutes / 60)}h ago`;
}

/**
 * Generate progress bar
 */
function generateProgressBar(
	progress: number,
	width: number,
	_color: string,
): string {
	const filledWidth = Math.max(1, Math.round((progress / 100) * width));
	const bar = Array(width).fill('░');

	for (let i = 0; i < filledWidth && i < width; i++) {
		bar[i] = '█';
	}

	return bar.join('');
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * WorkerCard - Single worker display card
 */
interface WorkerCardProps {
	worker: WorkerState;
	showDetails: boolean;
	showProgress: boolean;
	compact: boolean;
}

function WorkerCard({
	worker,
	showDetails,
	showProgress,
	compact,
}: WorkerCardProps) {
	const statusColor = getStatusColor(worker.status);
	const statusIcon = getStatusIcon(worker.status);
	const typeIcon = getTypeIcon(worker.type);
	const typeColor = getTypeColor(worker.type);

	// Grid layout
	return (
		<Box
			flexDirection="column"
			key={worker.id}
			borderStyle={compact ? undefined : 'single'}
			borderColor={statusColor}
			paddingX={compact ? 0 : 1}
			gap={0}
		>
			{/* Header row */}
			<Box
				flexDirection="row"
				justifyContent="space-between"
				marginBottom={compact ? 0 : 0}
			>
				<Box flexDirection="row" gap={1}>
					<Text color={typeColor}>{typeIcon}</Text>
					<Text color={statusColor} bold>
						{worker.name}
					</Text>
					{worker.status === 'working' && <Spinner type="dots" />}
					{worker.status !== 'working' && (
						<Text color={statusColor}>{statusIcon}</Text>
					)}
				</Box>

				{!compact && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{formatRelativeTime(worker.lastUpdate)}
					</Text>
				)}
			</Box>

			{/* Details */}
			{showDetails && !compact && (
				<>
					{/* Current task */}
					{worker.currentTask && (
						<Box flexDirection="row" gap={1}>
							<Text color={floydTheme.colors.fgSubtle} dimColor>
								Task:
							</Text>
							<Text color={floydTheme.colors.fgBase}>
								{worker.currentTask.length > 30
									? worker.currentTask.substring(0, 27) + '...'
									: worker.currentTask}
							</Text>
						</Box>
					)}

					{/* Progress bar */}
					{showProgress && worker.progress !== undefined && (
						<Box flexDirection="row" gap={1}>
							<Text
								color={generateProgressBar(worker.progress, 10, statusColor)}
							></Text>
							<Text color={statusColor}>{worker.progress}%</Text>
						</Box>
					)}

					{/* Stats */}
					{(worker.completedTasks !== undefined ||
						worker.failedTasks !== undefined ||
						worker.queueSize !== undefined) && (
						<Box flexDirection="row" gap={2}>
							{worker.completedTasks !== undefined && (
								<Text color={crushTheme.status.ready}>
									✓ {worker.completedTasks}
								</Text>
							)}
							{worker.failedTasks !== undefined && worker.failedTasks > 0 && (
								<Text color={crushTheme.status.error}>
									✕ {worker.failedTasks}
								</Text>
							)}
							{worker.queueSize !== undefined && worker.queueSize > 0 && (
								<Text color={crushTheme.accent.info}>
									Q: {worker.queueSize}
								</Text>
							)}
						</Box>
					)}

					{/* Error */}
					{worker.error && (
						<Box flexDirection="row" gap={1}>
							<Text color={crushTheme.status.error}>Error:</Text>
							<Text color={crushTheme.status.error}>
								{worker.error.length > 25
									? worker.error.substring(0, 22) + '...'
									: worker.error}
							</Text>
						</Box>
					)}
				</>
			)}

			{/* Child workers */}
			{worker.children &&
				worker.children.map(child => (
					<Box key={child.id} marginLeft={2} marginTop={0}>
						<Text color={floydTheme.colors.fgSubtle}>└</Text>
						<WorkerCard
							worker={child}
							showDetails={false}
							showProgress={false}
							compact={true}
						/>
					</Box>
				))}
		</Box>
	);
}

/**
 * CompactWorkerState - Single line status for headers
 */
interface CompactWorkerStateProps {
	workers: WorkerState[];
}

export function CompactWorkerState({workers}: CompactWorkerStateProps) {
	const stats = useMemo(() => {
		return {
			idle: workers.filter(w => w.status === 'idle').length,
			working: workers.filter(w => w.status === 'working').length,
			waiting: workers.filter(w => w.status === 'waiting').length,
			blocked: workers.filter(w => w.status === 'blocked').length,
			error: workers.filter(w => w.status === 'error').length,
			total: workers.length,
		};
	}, [workers]);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={floydTheme.colors.fgBase}>{stats.total} workers</Text>

			{stats.working > 0 && (
				<Text color={crushTheme.status.working}>◉{stats.working}</Text>
			)}

			{stats.waiting > 0 && (
				<Text color={crushTheme.status.warning}>…{stats.waiting}</Text>
			)}

			{stats.blocked > 0 && (
				<Text color={crushTheme.status.blocked}>⊘{stats.blocked}</Text>
			)}

			{stats.error > 0 && (
				<Text color={crushTheme.status.error}>✕{stats.error}</Text>
			)}

			{stats.idle === stats.total && stats.total > 0 && (
				<Text color={floydTheme.colors.fgMuted}>All idle</Text>
			)}
		</Box>
	);
}

/**
 * WorkerStateBoard - Main component
 */
export function WorkerStateBoard({
	workers: propWorkers,
	interval = 1000,
	compact = false,
	layout = 'grid',
	maxWorkers = 12,
	groupByStatus = false,
	showDetails = true,
	showProgress = true,
	header,
	filterStatus,
	filterType,
}: WorkerStateBoardProps) {
	// Internal state for workers
	const [workers, setWorkers] = useState<WorkerState[]>(propWorkers || []);

	// Update workers when prop changes
	useEffect(() => {
		if (propWorkers) {
			setWorkers(propWorkers);
		}
	}, [propWorkers]);

	// Filter workers
	const filteredWorkers = useMemo(() => {
		return workers.filter(worker => {
			if (
				filterStatus &&
				filterStatus.length > 0 &&
				!filterStatus.includes(worker.status)
			) {
				return false;
			}
			if (
				filterType &&
				filterType.length > 0 &&
				!filterType.includes(worker.type)
			) {
				return false;
			}
			return true;
		});
	}, [workers, filterStatus, filterType]);

	// Group by status if enabled
	const displayGroups = useMemo(() => {
		if (!groupByStatus) {
			return {all: filteredWorkers.slice(0, maxWorkers)};
		}

		const groups: Record<string, WorkerState[]> = {
			working: [],
			waiting: [],
			blocked: [],
			error: [],
			idle: [],
			offline: [],
		};

		for (const worker of filteredWorkers) {
			const status = worker.status as keyof typeof groups;
			if (groups[status]) {
				groups[status].push(worker);
			}
		}

		return groups;
	}, [filteredWorkers, maxWorkers, groupByStatus]);

	// Stats
	const stats = useMemo(() => {
		return {
			total: filteredWorkers.length,
			working: filteredWorkers.filter(w => w.status === 'working').length,
			idle: filteredWorkers.filter(w => w.status === 'idle').length,
			waiting: filteredWorkers.filter(w => w.status === 'waiting').length,
			blocked: filteredWorkers.filter(w => w.status === 'blocked').length,
			error: filteredWorkers.filter(w => w.status === 'error').length,
		};
	}, [filteredWorkers]);

	// Ultra compact mode - single line
	if (compact && layout === 'compact') {
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
							Workers
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<CompactWorkerState workers={filteredWorkers} />
				</Box>
			</Box>
		);
	}

	// Grid layout
	const isGridLayout =
		layout === 'grid' || (layout === 'compact' && !groupByStatus);

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
							Worker Status
						</Text>
						<Text dimColor color={floydTheme.colors.fgMuted}>
							{stats.total} workers
						</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						<Text color={crushTheme.status.working}>◉ {stats.working}</Text>
						<Text color={crushTheme.status.warning}>… {stats.waiting}</Text>
						<Text color={crushTheme.status.blocked}>⊘ {stats.blocked}</Text>
						<Text color={crushTheme.status.error}>✕ {stats.error}</Text>
					</Box>
				</Box>
			)}

			{/* Content */}
			<Box
				flexDirection="column"
				paddingX={1}
				gap={isGridLayout ? 1 : 0}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				{filteredWorkers.length === 0 ? (
					<Box paddingY={1}>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							No workers active
						</Text>
					</Box>
				) : groupByStatus ? (
					// Grouped layout
					Object.entries(displayGroups).map(([status, statusWorkers]) => {
						if (statusWorkers.length === 0) return null;

						return (
							<Box flexDirection="column" key={status} marginBottom={1}>
								<Box flexDirection="row" gap={1} marginBottom={0}>
									<Text
										bold
										color={getStatusColor(status as WorkerStateStatus)}
									>
										{status.toUpperCase()}
									</Text>
									<Text dimColor color={floydTheme.colors.fgSubtle}>
										({statusWorkers.length})
									</Text>
								</Box>

								<Box flexDirection="row" flexWrap="wrap" gap={1}>
									{statusWorkers.map(worker => (
										<WorkerCard
											key={worker.id}
											worker={worker}
											showDetails={false}
											showProgress={false}
											compact={true}
										/>
									))}
								</Box>
							</Box>
						);
					})
				) : // Grid/List layout
				isGridLayout ? (
					<Box flexDirection="row" flexWrap="wrap" gap={1}>
						{filteredWorkers.slice(0, maxWorkers).map(worker => (
							<Box key={worker.id} width="40%">
								<WorkerCard
									worker={worker}
									showDetails={showDetails}
									showProgress={showProgress}
									compact={compact}
								/>
							</Box>
						))}
					</Box>
				) : (
					// List layout
					<Box flexDirection="column" gap={0}>
						{filteredWorkers.slice(0, maxWorkers).map(worker => (
							<WorkerCard
								key={worker.id}
								worker={worker}
								showDetails={showDetails}
								showProgress={showProgress}
								compact={compact}
							/>
						))}
					</Box>
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
					{interval}ms refresh
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					{filteredWorkers.length > maxWorkers &&
						`+${filteredWorkers.length - maxWorkers} more`}
				</Text>
			</Box>
		</Box>
	);
}

/**
 * WorkerStatusBadge - Single worker status badge
 */
export interface WorkerStatusBadgeProps {
	/** Worker state */
	state: WorkerStateStatus;

	/** Worker name */
	name?: string;

	/** Show icon */
	showIcon?: boolean;

	/** Show label */
	showLabel?: boolean;

	/** Compact mode */
	compact?: boolean;
}

export function WorkerStatusBadge({
	state,
	name,
	showIcon = true,
	showLabel = true,
	compact = false,
}: WorkerStatusBadgeProps) {
	const color = getStatusColor(state);
	const icon = getStatusIcon(state);

	if (compact) {
		return (
			<Text color={color}>
				{showIcon && icon}
				{showLabel && ' '}
				{showLabel && name && name}
				{showLabel && !name && state}
			</Text>
		);
	}

	return (
		<Box borderStyle="round" borderColor={color} paddingX={1}>
			<Text color={color}>
				{showIcon && icon}
				{showIcon && showLabel && ' '}
				{showLabel && (name || state)}
			</Text>
		</Box>
	);
}

/**
 * WorkerProgressRow - Worker with progress bar
 */
export interface WorkerProgressRowProps {
	/** Worker state */
	worker: WorkerState;

	/** Progress bar width */
	barWidth?: number;
}

export function WorkerProgressRow({
	worker,
	barWidth = 20,
}: WorkerProgressRowProps) {
	const statusColor = getStatusColor(worker.status);
	const statusIcon = getStatusIcon(worker.status);
	const typeIcon = getTypeIcon(worker.type);

	return (
		<Box flexDirection="row" gap={1} width="100%">
			<Text color={getTypeColor(worker.type)}>{typeIcon}</Text>
			<Text color={statusColor}>{statusIcon}</Text>
			<Text color={floydTheme.colors.fgBase}>{worker.name}</Text>
			{worker.currentTask && (
				<Text color={floydTheme.colors.fgMuted} dimColor>
					•{' '}
					{worker.currentTask.length > 20
						? worker.currentTask.substring(0, 17) + '...'
						: worker.currentTask}
				</Text>
			)}
			{worker.progress !== undefined && (
				<Text color={statusColor}>
					{generateProgressBar(worker.progress, barWidth, statusColor)}
					{worker.progress}%
				</Text>
			)}
		</Box>
	);
}

export default WorkerStateBoard;
