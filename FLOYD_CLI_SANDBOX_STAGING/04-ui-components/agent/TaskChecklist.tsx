/**
 * TaskChecklist Component
 *
 * Animated task progression with checkboxes.
 * Visualizes agent tasks with status indicators and progress tracking.
 *
 * Features:
 * - Animated checkbox transitions
 * - Status-based color coding
 * - Nested subtask support
 * - Progress percentage calculation
 * - Task duration tracking
 * - Expandable/collapsible task groups
 */

import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type TaskStatus =
	| 'pending'
	| 'in_progress'
	| 'complete'
	| 'error'
	| 'blocked'
	| 'skipped';

export interface Task {
	/** Unique identifier */
	id: string;

	/** Task name/label */
	name: string;

	/** Current status */
	status: TaskStatus;

	/** Optional description */
	description?: string;

	/** Subtasks */
	subtasks?: Task[];

	/** Error message if status is error */
	error?: string;

	/** Duration in milliseconds (calculated automatically) */
	duration?: number;

	/** Timestamp when task started */
	startTime?: Date;

	/** Timestamp when task completed */
	endTime?: Date;

	/** Progress value (0-100) for in-progress tasks */
	progress?: number;

	/** Optional metadata */
	metadata?: Record<string, unknown>;
}

export interface TaskGroup {
	/** Group identifier */
	id: string;

	/** Group label */
	label: string;

	/** Tasks in this group */
	tasks: Task[];

	/** Is group collapsed */
	collapsed?: boolean;
}

export interface TaskChecklistProps {
	/** Tasks to display */
	tasks: Task[];

	/** Show progress bar at top */
	showProgress?: boolean;

	/** Show timestamps */
	showTimestamps?: boolean;

	/** Show task descriptions */
	showDescriptions?: boolean;

	/** Enable animations */
	animate?: boolean;

	/** Max depth for subtasks */
	maxDepth?: number;

	/** Width constraint */
	width?: number;

	/** Callback when task is toggled */
	onToggleTask?: (id: string) => void;

	/** Custom status icons */
	customIcons?: Partial<Record<TaskStatus, string>>;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Default status icons
 */
const defaultIcons: Record<TaskStatus, string> = {
	pending: '○',
	in_progress: '◐',
	complete: '✓',
	error: '✕',
	blocked: '⊘',
	skipped: '⊝',
};

/**
 * Get status color
 */
function getStatusColor(status: TaskStatus): string {
	switch (status) {
		case 'pending':
			return crushTheme.text.secondary;
		case 'in_progress':
			return crushTheme.status.working;
		case 'complete':
			return crushTheme.status.ready;
		case 'error':
			return crushTheme.status.error;
		case 'blocked':
			return crushTheme.status.blocked;
		case 'skipped':
			return crushTheme.text.subtle;
		default:
			return crushTheme.text.secondary;
	}
}

/**
 * Calculate task completion percentage
 */
function calculateProgress(tasks: Task[]): number {
	if (tasks.length === 0) return 0;

	const totalTasks = countAllTasks(tasks);
	const completedTasks = countCompleteTasks(tasks);

	return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Count all tasks including subtasks
 */
function countAllTasks(tasks: Task[]): number {
	let count = 0;
	for (const task of tasks) {
		count++;
		if (task.subtasks) {
			count += countAllTasks(task.subtasks);
		}
	}
	return count;
}

/**
 * Count complete tasks including subtasks
 */
function countCompleteTasks(tasks: Task[]): number {
	let count = 0;
	for (const task of tasks) {
		if (task.status === 'complete') {
			count++;
		}
		if (task.subtasks) {
			count += countCompleteTasks(task.subtasks);
		}
	}
	return count;
}

/**
 * Count tasks by status
 */
function countByStatus(tasks: Task[], status: TaskStatus): number {
	let count = 0;
	for (const task of tasks) {
		if (task.status === status) count++;
		if (task.subtasks) {
			count += countByStatus(task.subtasks, status);
		}
	}
	return count;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	const mins = Math.floor(ms / 60_000);
	const secs = Math.floor((ms % 60_000) / 1000);
	return `${mins}m ${secs}s`;
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
	progress: number;
	width: number;
	showPercentage?: boolean;
}

function ProgressBar({
	progress,
	width,
	showPercentage = true,
}: ProgressBarProps) {
	const filledWidth = Math.round((width - 2) * (progress / 100));
	const emptyWidth = width - 2 - filledWidth;

	return (
		<Box flexDirection="row" width={width}>
			<Box flexDirection="row" flexGrow={1}>
				<Text color={crushTheme.accent.secondary}>[</Text>
				<Text
					color={
						progress >= 100
							? crushTheme.status.ready
							: crushTheme.accent.primary
					}
				>
					{'━'.repeat(filledWidth)}
				</Text>
				<Text color={crushTheme.bg.elevated}>{'━'.repeat(emptyWidth)}</Text>
				<Text color={crushTheme.accent.secondary}>]</Text>
			</Box>
			{showPercentage && (
				<Text
					color={
						progress >= 100 ? crushTheme.status.ready : crushTheme.text.primary
					}
				>
					{' '}
					{progress}%
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// TASK ITEM COMPONENT
// ============================================================================

interface TaskItemProps {
	task: Task;
	depth: number;
	icon: string;
	showTimestamp: boolean;
	showDescription: boolean;
	isActive: boolean;
	onToggle?: (id: string) => void;
}

function TaskItem({
	task,
	depth,
	icon,
	showTimestamp,
	showDescription,
	isActive,
	onToggle,
}: TaskItemProps) {
	const [displayedIcon, setDisplayedIcon] = useState(icon);

	// Animate icon on status change
	useEffect(() => {
		if (task.status === 'complete') {
			// Play success animation
			let frame = 0;
			const interval = setInterval(() => {
				if (frame < 5) {
					frame++;
				} else {
					clearInterval(interval);
					setDisplayedIcon(defaultIcons.complete);
				}
			}, 50);

			return () => clearInterval(interval);
		} else {
			setDisplayedIcon(icon);
		}
		return undefined;
	}, [task.status, icon]);

	// Auto-compute duration
	const duration =
		task.duration ||
		(task.startTime && task.endTime
			? task.endTime.getTime() - task.startTime.getTime()
			: undefined);

	const indent = '  '.repeat(depth);
	const statusColor = getStatusColor(task.status);

	return (
		<Box flexDirection="column" marginBottom={depth === 0 ? 1 : 0}>
			{/* Task row */}
			<Box flexDirection="row" width="100%">
				<Text>{indent}</Text>

				{/* Icon/checkbox */}
				<Text color={statusColor} bold={task.status === 'complete'}>
					{displayedIcon}{' '}
				</Text>

				{/* Task name */}
				<Text
					color={
						task.status === 'complete'
							? crushTheme.text.primary
							: crushTheme.text.tertiary
					}
					dimColor={task.status === 'pending' || task.status === 'skipped'}
				>
					{task.name}
				</Text>

				{/* Status-specific indicators */}
				{task.status === 'in_progress' && (
					<Text color={crushTheme.status.working}>
						{' '}
						<Spinner type="dots" />
					</Text>
				)}

				{/* Duration */}
				{duration !== undefined && task.status === 'complete' && (
					<Text color={crushTheme.text.secondary} dimColor>
						{' '}
						{formatDuration(duration)}
					</Text>
				)}

				{/* Progress for in-progress tasks */}
				{task.status === 'in_progress' && task.progress !== undefined && (
					<Text color={crushTheme.text.secondary}> {task.progress}%</Text>
				)}
			</Box>

			{/* Description */}
			{showDescription && task.description && task.status !== 'complete' && (
				<Box marginLeft={depth * 2 + 2}>
					<Text color={crushTheme.text.secondary} dimColor>
						{task.description}
					</Text>
				</Box>
			)}

			{/* Error message */}
			{task.status === 'error' && task.error && (
				<Box marginLeft={depth * 2 + 2}>
					<Text color={crushTheme.status.error}>Error: {task.error}</Text>
				</Box>
			)}

			{/* In-progress progress bar */}
			{task.status === 'in_progress' && task.progress !== undefined && (
				<Box marginLeft={depth * 2 + 2} width={30}>
					<ProgressBar
						progress={task.progress}
						width={30}
						showPercentage={false}
					/>
				</Box>
			)}

			{/* Subtasks */}
			{task.subtasks && task.subtasks.length > 0 && (
				<Box flexDirection="column">
					{task.subtasks.map(subtask => (
						<TaskItem
							key={subtask.id}
							task={subtask}
							depth={depth + 1}
							icon={defaultIcons[subtask.status]}
							showTimestamp={showTimestamp}
							showDescription={showDescription}
							isActive={isActive}
							onToggle={onToggle}
						/>
					))}
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// STATUS SUMMARY
// ============================================================================

interface StatusSummaryProps {
	tasks: Task[];
}

function StatusSummary({tasks}: StatusSummaryProps) {
	const complete = countByStatus(tasks, 'complete');
	const inProgress = countByStatus(tasks, 'in_progress');
	const error = countByStatus(tasks, 'error');
	const total = countAllTasks(tasks);

	return (
		<Box flexDirection="row" gap={2}>
			{inProgress > 0 && (
				<Text color={crushTheme.status.working}>{inProgress} in progress</Text>
			)}
			{complete > 0 && (
				<Text color={crushTheme.status.ready}>{complete} complete</Text>
			)}
			{error > 0 && <Text color={crushTheme.status.error}>{error} failed</Text>}
			<Text color={crushTheme.text.secondary} dimColor>
				/ {total} total
			</Text>
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TaskChecklist - Animated task progression display
 */
export function TaskChecklist({
	tasks,
	showProgress = true,
	showTimestamps = false,
	showDescriptions = true,
	width = 50,
	onToggleTask,
	customIcons,
}: TaskChecklistProps) {
	const icons = {...defaultIcons, ...customIcons};
	const progress = calculateProgress(tasks);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor={crushTheme.accent.primary}
				paddingX={1}
			>
				<Text bold color={crushTheme.accent.secondary}>
					Tasks
				</Text>
				<Text color={crushTheme.text.secondary}> ({tasks.length})</Text>
			</Box>

			{/* Progress bar */}
			{showProgress && (
				<Box marginTop={1} marginBottom={1}>
					<ProgressBar progress={progress} width={width - 2} />
					<Box marginTop={0}>
						<StatusSummary tasks={tasks} />
					</Box>
				</Box>
			)}

			{/* Task list */}
			<Box flexDirection="column" marginTop={1} marginBottom={1}>
				{tasks.length === 0 ? (
					<Box marginLeft={1}>
						<Text color={crushTheme.text.secondary} dimColor>
							No tasks yet...
						</Text>
					</Box>
				) : (
					tasks.map(task => (
						<TaskItem
							key={task.id}
							task={task}
							depth={0}
							icon={icons[task.status] || defaultIcons[task.status]}
							showTimestamp={showTimestamps}
							showDescription={showDescriptions}
							isActive={task.status === 'in_progress'}
							onToggle={onToggleTask}
						/>
					))
				)}
			</Box>
		</Box>
	);
}

// ============================================================================
// TASK GROUP VARIANT
// ============================================================================

export interface TaskGroupListProps {
	/** Groups of tasks */
	groups: TaskGroup[];

	/** Show progress per group */
	showGroupProgress?: boolean;

	/** Overall progress bar */
	showOverallProgress?: boolean;

	/** Width constraint */
	width?: number;

	/** Callback when group is toggled */
	onToggleGroup?: (id: string) => void;
}

/**
 * TaskGroupList - Organized checklist with collapsible groups
 */
export function TaskGroupList({
	groups,
	showGroupProgress = true,
	showOverallProgress = true,
	width = 60,
}: TaskGroupListProps) {
	const [expandedGroups] = useState<Set<string>>(
		new Set(groups.map(g => g.id)),
	);

	const allTasks = groups.flatMap(g => g.tasks);
	const overallProgress = calculateProgress(allTasks);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor={crushTheme.accent.primary}
				paddingX={1}
			>
				<Text bold color={crushTheme.accent.secondary}>
					Task Groups
				</Text>
				<Text color={crushTheme.text.secondary}> ({groups.length})</Text>
			</Box>

			{/* Overall progress */}
			{showOverallProgress && (
				<Box marginTop={1} marginBottom={1}>
					<ProgressBar progress={overallProgress} width={width - 2} />
					<Box marginTop={0}>
						<StatusSummary tasks={allTasks} />
					</Box>
				</Box>
			)}

			{/* Groups */}
			<Box flexDirection="column" marginTop={1}>
				{groups.map(group => {
					const isExpanded = expandedGroups.has(group.id);
					const groupProgress = calculateProgress(group.tasks);

					return (
						<Box key={group.id} flexDirection="column" marginBottom={1}>
							{/* Group header */}
							<Box
								flexDirection="row"
								width="100%"
								paddingX={1}
								borderStyle={isExpanded ? 'double' : undefined}
								borderColor={crushTheme.accent.tertiary}
							>
								<Text color={crushTheme.accent.tertiary}>
									{isExpanded ? '▼' : '▶'}
								</Text>
								<Text bold color={crushTheme.text.tertiary}>
									{' '}
									{group.label}
								</Text>
								{showGroupProgress && (
									<Text color={crushTheme.text.secondary}>
										{' '}
										{groupProgress}%
									</Text>
								)}
							</Box>

							{/* Group tasks */}
							{isExpanded && (
								<Box flexDirection="column" marginLeft={1} marginTop={0}>
									{group.tasks.map(task => (
										<TaskItem
											key={task.id}
											task={task}
											depth={0}
											icon={defaultIcons[task.status]}
											showTimestamp={false}
											showDescription={false}
											isActive={task.status === 'in_progress'}
											onToggle={() => {}}
										/>
									))}
								</Box>
							)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactTaskListProps {
	/** Tasks to display */
	tasks: Task[];

	/** Max items to show */
	maxItems?: number;

	/** Show status icons */
	showIcons?: boolean;
}

/**
 * CompactTaskList - Minimal single-line task display
 */
export function CompactTaskList({
	tasks,
	maxItems = 5,
	showIcons = true,
}: CompactTaskListProps) {
	const displayTasks = tasks.slice(0, maxItems);
	const remaining = Math.max(0, tasks.length - maxItems);

	return (
		<Box flexDirection="row" gap={1}>
			{displayTasks.map(task => (
				<Box key={task.id} flexDirection="row">
					{showIcons && (
						<Text color={getStatusColor(task.status)}>
							{defaultIcons[task.status]}
						</Text>
					)}
					<Text color={crushTheme.text.tertiary}>{task.name}</Text>
				</Box>
			))}
			{remaining > 0 && (
				<Text color={crushTheme.text.secondary} dimColor>
					+{remaining} more
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// HOOKS FOR INTEGRATION
// ============================================================================

/**
 * Hook for managing task checklist state
 */
export interface UseTaskChecklistResult {
	tasks: Task[];
	addTask: (name: string, parentId?: string) => string;
	updateTask: (id: string, updates: Partial<Task>) => void;
	startTask: (id: string) => void;
	completeTask: (id: string) => void;
	errorTask: (id: string, error: string) => void;
	removeTask: (id: string) => void;
	getProgress: () => number;
}

export function useTaskChecklist(
	initialTasks: Task[] = [],
): UseTaskChecklistResult {
	const [tasks, setTasks] = useState<Task[]>(initialTasks);

	const addTask = (name: string, parentId?: string): string => {
		const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const newTask: Task = {
			id,
			name,
			status: 'pending',
			startTime: new Date(),
		};

		setTasks(prev => {
			if (parentId) {
				return prev.map(task => {
					if (task.id === parentId) {
						return {
							...task,
							subtasks: [...(task.subtasks || []), newTask],
						};
					}
					return task;
				});
			}
			return [...prev, newTask];
		});

		return id;
	};

	const updateTask = (id: string, updates: Partial<Task>): void => {
		setTasks(prev =>
			prev.map(task => {
				if (task.id === id) {
					return {...task, ...updates};
				}
				if (task.subtasks) {
					return {
						...task,
						subtasks: task.subtasks.map(st =>
							st.id === id ? {...st, ...updates} : st,
						),
					};
				}
				return task;
			}),
		);
	};

	const startTask = (id: string): void => {
		updateTask(id, {
			status: 'in_progress',
			startTime: new Date(),
		});
	};

	const completeTask = (id: string): void => {
		updateTask(id, {
			status: 'complete',
			endTime: new Date(),
		});
	};

	const errorTask = (id: string, error: string): void => {
		updateTask(id, {
			status: 'error',
			error,
			endTime: new Date(),
		});
	};

	const removeTask = (id: string): void => {
		setTasks(prev => prev.filter(t => t.id !== id));
	};

	const getProgress = (): number => {
		return calculateProgress(tasks);
	};

	return {
		tasks,
		addTask,
		updateTask,
		startTask,
		completeTask,
		errorTask,
		removeTask,
		getProgress,
	};
}

export default TaskChecklist;
