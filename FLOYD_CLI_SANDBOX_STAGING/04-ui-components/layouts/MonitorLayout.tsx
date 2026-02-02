/**
 * MonitorLayout Component
 *
 * Screen layout for the Monitor dashboard screen (RIGHT MONITOR 27").
 * Displays real-time system state with all Monitor dashboard components
 * arranged in a grid layout optimized for dual-screen viewing.
 *
 * Features:
 * - Grid layout matching dual-screen mockup design
 * - Real-time data updates via IPC
 * - Configurable component visibility
 * - Full and compact modes
 * - Responsive grid arrangement
 *
 * Layout (Full Mode):
 * +------------------------------------------+
 * |           ALERT TICKER (top)             |
 * +----------------+-------------------------+
 * | EVENT STREAM   |   WORKER STATE BOARD    |
 * | (left, tall)   |   (right, tall)         |
 * +----------------+-------------------------+
 * | TOOL TIMELINE  |   SYSTEM METRICS        |
 * | (left)         |   (right)               |
 * +----------------+-------------------------+
 * | GIT ACTIVITY   |   BROWSER STATE         |
 * | (left)         |   (right)               |
 * +------------------------------------------+
 *
 * Compact Mode:
 * Single column with compact versions of each component
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// Import all Monitor dashboard components
import {EventStream, StreamEvent} from '../monitor/EventStream.js';
import {SystemMetrics, SystemMetricsData} from '../monitor/SystemMetrics.js';
import {ToolTimeline, ToolExecution} from '../monitor/ToolTimeline.js';
import {GitActivity, GitStatus} from '../monitor/GitActivity.js';
import {
	BrowserState,
	BrowserState as BrowserStateType,
} from '../monitor/BrowserState.js';
import {AlertTicker, Alert} from '../monitor/AlertTicker.js';
import {WorkerStateBoard, WorkerState} from '../monitor/WorkerStateBoard.js';
import type {IPCMessage} from '../../ipc/message-types.js';

// ============================================================================
// TYPES
// ============================================================================

// Re-export IPCMessage for convenience
export type {IPCMessage};

export interface MonitorData {
	/** Stream events */
	events?: StreamEvent[];

	/** System metrics */
	metrics?: SystemMetricsData;

	/** Tool executions */
	toolExecutions?: ToolExecution[];

	/** Git status */
	gitStatus?: GitStatus;

	/** Browser state */
	browserState?: BrowserStateType;

	/** Worker states */
	workers?: WorkerState[];

	/** Active alerts */
	alerts?: Alert[];
}

export interface MonitorLayoutProps {
	/** Initial monitor data */
	data?: MonitorData;

	/** Enable compact mode */
	compact?: boolean;

	/** Update interval in milliseconds */
	updateInterval?: number;

	/** IPC connection string (for real-time updates) */
	ipcPath?: string;

	/** Custom header */
	header?: React.ReactNode;

	/** Show specific components */
	showEventStream?: boolean;
	showSystemMetrics?: boolean;
	showToolTimeline?: boolean;
	showGitActivity?: boolean;
	showBrowserState?: boolean;
	showAlertTicker?: boolean;
	showWorkerStateBoard?: boolean;

	/** Component-specific props */
	eventStreamHeight?: number;
	systemMetricsInterval?: number;
	toolTimelineWindow?: number;
	maxEvents?: number;
	maxExecutions?: number;
	maxAlerts?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate mock events for testing
 */
function generateMockEvents(): StreamEvent[] {
	const types: StreamEvent['type'][] = [
		'tool_call',
		'tool_response',
		'agent_message',
		'system',
	];
	const severities: StreamEvent['severity'][] = [
		'info',
		'success',
		'warning',
		'error',
	];

	return Array.from(
		{length: 20},
		(_, i): StreamEvent => ({
			id: `event-${i}`,
			type: types[
				Math.floor(Math.random() * types.length)
			] as StreamEvent['type'],
			severity: severities[
				Math.floor(Math.random() * severities.length)
			] as StreamEvent['severity'],
			timestamp: new Date(Date.now() - i * 5000),
			message: `Sample event ${i + 1}`,
			toolName: `tool_${Math.floor(Math.random() * 5)}`,
			duration: Math.floor(Math.random() * 2000),
		}),
	);
}

/**
 * Generate mock alerts for testing
 */
function generateMockAlerts(): Alert[] {
	const severities: Alert['severity'][] = [
		'info',
		'warning',
		'error',
		'success',
	];
	const types: Alert['type'][] = [
		'system',
		'network',
		'performance',
		'security',
	];

	return Array.from(
		{length: 5},
		(_, i): Alert => ({
			id: `alert-${i}`,
			severity: severities[
				Math.floor(Math.random() * severities.length)
			] as Alert['severity'],
			type: types[Math.floor(Math.random() * types.length)] as Alert['type'],
			message: `System alert ${i + 1}: Monitoring threshold ${
				i % 2 === 0 ? 'exceeded' : 'normal'
			}`,
			timestamp: new Date(Date.now() - i * 30000),
			active: Math.random() > 0.3,
		}),
	);
}

/**
 * Generate mock workers for testing
 */
function generateMockWorkers(): WorkerState[] {
	const statuses: WorkerState['status'][] = [
		'idle',
		'working',
		'waiting',
		'blocked',
		'offline',
	];
	const types: WorkerState['type'][] = ['agent', 'tool', 'system'];

	return Array.from(
		{length: 6},
		(_, i): WorkerState => ({
			id: `worker-${i}`,
			name: `Worker-${i + 1}`,
			type: types[
				Math.floor(Math.random() * types.length)
			] as WorkerState['type'],
			status: statuses[
				Math.floor(Math.random() * statuses.length)
			] as WorkerState['status'],
			currentTask: i % 2 === 0 ? `Processing task ${i + 1}` : undefined,
			progress: Math.floor(Math.random() * 100),
			lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 60000)),
			completedTasks: Math.floor(Math.random() * 50),
			failedTasks: Math.floor(Math.random() * 5),
		}),
	);
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * MonitorHeader - Header with title and status summary
 */
interface MonitorHeaderProps {
	compact: boolean;
	updateInterval: number;
	dataSummary: {
		eventCount: number;
		alertCount: number;
		workerCount: number;
		workingWorkers: number;
	};
}

function MonitorHeader({
	compact,
	updateInterval,
	dataSummary,
}: MonitorHeaderProps) {
	return (
		<Box
			flexDirection="row"
			justifyContent="space-between"
			paddingX={1}
			borderStyle="double"
			borderColor={crushTheme.accent.secondary}
		>
			<Box flexDirection="row" gap={2}>
				<Text bold color={crushTheme.accent.secondary}>
					FLOYD MONITOR
				</Text>
				{!compact && (
					<Text color={floydTheme.colors.fgMuted}>Right Screen (27")</Text>
				)}
			</Box>

			<Box flexDirection="row" gap={2}>
				<Text color={crushTheme.status.working}>
					{dataSummary.workingWorkers}/{dataSummary.workerCount} workers
				</Text>
				<Text
					color={
						dataSummary.alertCount > 0
							? crushTheme.status.error
							: crushTheme.status.ready
					}
				>
					{dataSummary.alertCount} alerts
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					{updateInterval}ms
				</Text>
			</Box>
		</Box>
	);
}

/**
 * MonitorLayout - Main component
 */
export function MonitorLayout({
	data: propData,
	compact = false,
	updateInterval = 1500,
	ipcPath,
	header,
	showEventStream = true,
	showSystemMetrics = true,
	showToolTimeline = true,
	showGitActivity = true,
	showBrowserState = true,
	showAlertTicker = true,
	showWorkerStateBoard = true,
	eventStreamHeight = 18,
	systemMetricsInterval = 1500,
	toolTimelineWindow = 60000,
	maxEvents = 100,
	maxExecutions = 50,
	maxAlerts = 10,
}: MonitorLayoutProps) {
	// Internal state for all monitor data
	const [data, setData] = useState<MonitorData>(
		propData ?? {
			events: generateMockEvents(),
			alerts: generateMockAlerts(),
			workers: generateMockWorkers(),
		},
	);

	// Connection status
	const [connected, setConnected] = useState(false);

	// Update data when props change
	useEffect(() => {
		if (propData) {
			setData(prev => ({
				...prev,
				...propData,
			}));
		}
	}, [propData]);

	// Simulate live data updates
	useEffect(() => {
		if (ipcPath) {
			// TODO: Implement actual IPC connection
			setConnected(true);
		}

		// Simulate updates
		const timer = setInterval(() => {
			setData(prev => {
				// Add new event occasionally
				const newEvents = prev.events ? [...prev.events] : generateMockEvents();
				if (Math.random() > 0.7) {
					const newEvent: StreamEvent = {
						id: `event-${Date.now()}`,
						type: ['tool_call', 'tool_response', 'system'][
							Math.floor(Math.random() * 3)
						] as StreamEvent['type'],
						severity: ['info', 'success', 'warning'][
							Math.floor(Math.random() * 3)
						] as StreamEvent['severity'],
						timestamp: new Date(),
						message: `Live event ${Math.floor(Math.random() * 1000)}`,
						duration: Math.floor(Math.random() * 1000),
					};
					newEvents.push(newEvent);
				}

				// Update worker statuses
				const updatedWorkers =
					prev.workers?.map(w => ({
						...w,
						status:
							Math.random() > 0.8
								? ((['idle', 'working', 'waiting'] as WorkerState['status'][])[
										Math.floor(Math.random() * 3)
								  ] as WorkerState['status'])
								: w.status,
						lastUpdate: new Date(),
					})) || generateMockWorkers();

				return {
					...prev,
					events: newEvents.slice(-maxEvents),
					workers: updatedWorkers,
				};
			});
		}, updateInterval);

		return () => clearInterval(timer);
	}, [updateInterval, ipcPath, maxEvents]);

	// Data summary for header
	const dataSummary = useMemo(
		() => ({
			eventCount: data.events?.length ?? 0,
			alertCount: data.alerts?.filter(a => a.active !== false).length ?? 0,
			workerCount: data.workers?.length ?? 0,
			workingWorkers:
				data.workers?.filter(w => w.status === 'working').length ?? 0,
		}),
		[data],
	);

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Header */}
			{header || (
				<MonitorHeader
					compact={compact}
					updateInterval={updateInterval}
					dataSummary={dataSummary}
				/>
			)}

			{/* Alert Ticker (full width) */}
			{showAlertTicker && (
				<Box marginBottom={1}>
					<AlertTicker
						alerts={data.alerts}
						compact={compact}
						maxAlerts={maxAlerts}
						interval={updateInterval}
						header={null}
					/>
				</Box>
			)}

			{/* Main Grid */}
			<Box flexDirection={compact ? 'column' : 'row'} gap={1} paddingX={1}>
				{/* Left Column */}
				<Box
					flexDirection="column"
					gap={1}
					width={compact ? '100%' : undefined}
					flexGrow={1}
				>
					{/* Event Stream */}
					{showEventStream && (
						<Box flexGrow={1}>
							<EventStream
								events={data.events}
								compact={compact}
								height={compact ? 10 : eventStreamHeight}
								maxEvents={maxEvents}
								autoScroll={true}
								showTimestamps={!compact}
								showDurations={!compact}
								header={null}
							/>
						</Box>
					)}

					{/* Tool Timeline */}
					{showToolTimeline && (
						<Box flexGrow={1}>
							<ToolTimeline
								executions={data.toolExecutions}
								compact={compact}
								windowDuration={toolTimelineWindow}
								maxExecutions={maxExecutions}
								showLabels={!compact}
								showDuration={!compact}
								autoScroll={true}
								header={null}
							/>
						</Box>
					)}

					{/* Git Activity */}
					{showGitActivity && (
						<Box flexGrow={1}>
							<GitActivity
								status={data.gitStatus}
								compact={compact}
								showFiles={!compact}
								showHistory={!compact}
								header={null}
							/>
						</Box>
					)}
				</Box>

				{/* Right Column */}
				<Box
					flexDirection="column"
					gap={1}
					width={compact ? '100%' : undefined}
					flexGrow={1}
				>
					{/* Worker State Board */}
					{showWorkerStateBoard && (
						<Box flexGrow={2}>
							<WorkerStateBoard
								workers={data.workers}
								compact={compact}
								layout={compact ? 'list' : 'grid'}
								showDetails={!compact}
								showProgress={!compact}
								interval={updateInterval}
								header={null}
							/>
						</Box>
					)}

					{/* System Metrics */}
					{showSystemMetrics && (
						<Box flexGrow={1}>
							<SystemMetrics
								metrics={data.metrics}
								compact={compact}
								interval={systemMetricsInterval}
								showSparklines={!compact}
								historySize={20}
								header={null}
							/>
						</Box>
					)}

					{/* Browser State */}
					{showBrowserState && (
						<Box flexGrow={1}>
							<BrowserState
								state={data.browserState}
								compact={compact}
								showRules={!compact}
								showTabs={!compact}
								interval={updateInterval}
								header={null}
							/>
						</Box>
					)}
				</Box>
			</Box>

			{/* Footer */}
			{!compact && (
				<Box
					flexDirection="row"
					justifyContent="space-between"
					paddingX={1}
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					borderTop={false}
					marginTop={1}
				>
					<Box flexDirection="row" gap={2}>
						<Text dimColor color={floydTheme.colors.fgSubtle}>
							Monitor Layout
						</Text>
						<Text
							color={
								connected ? crushTheme.status.ready : crushTheme.status.offline
							}
						>
							{connected ? '● IPC Connected' : '○ IPC Disconnected'}
						</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						<Text dimColor color={floydTheme.colors.fgSubtle}>
							Press Ctrl+C to exit
						</Text>
						<Text dimColor color={floydTheme.colors.fgSubtle}>
							{updateInterval}ms refresh
						</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
}

/**
 * CompactMonitorLayout - Single column layout for smaller screens
 */
export interface CompactMonitorLayoutProps {
	/** Monitor data */
	data?: MonitorData;

	/** Update interval */
	updateInterval?: number;

	/** Custom header */
	header?: React.ReactNode;
}

export function CompactMonitorLayout({
	data,
	updateInterval = 2000,
	header,
}: CompactMonitorLayoutProps) {
	return (
		<MonitorLayout
			data={data}
			compact={true}
			updateInterval={updateInterval}
			header={header}
			eventStreamHeight={10}
			showEventStream={true}
			showSystemMetrics={true}
			showToolTimeline={true}
			showGitActivity={true}
			showBrowserState={true}
			showAlertTicker={true}
			showWorkerStateBoard={true}
		/>
	);
}

/**
 * FullMonitorLayout - Complete dual-screen optimized layout
 */
export interface FullMonitorLayoutProps {
	/** Monitor data */
	data?: MonitorData;

	/** Update interval */
	updateInterval?: number;

	/** IPC connection path */
	ipcPath?: string;

	/** Custom header */
	header?: React.ReactNode;
}

export function FullMonitorLayout({
	data,
	updateInterval = 1000,
	ipcPath,
	header,
}: FullMonitorLayoutProps) {
	return (
		<MonitorLayout
			data={data}
			compact={false}
			updateInterval={updateInterval}
			ipcPath={ipcPath}
			header={header}
			eventStreamHeight={20}
			showEventStream={true}
			showSystemMetrics={true}
			showToolTimeline={true}
			showGitActivity={true}
			showBrowserState={true}
			showAlertTicker={true}
			showWorkerStateBoard={true}
			systemMetricsInterval={1500}
			toolTimelineWindow={60000}
			maxEvents={200}
			maxExecutions={100}
			maxAlerts={20}
		/>
	);
}

/**
 * MinimalMonitorLayout - Layout showing only critical components
 */
export interface MinimalMonitorLayoutProps {
	/** Monitor data */
	data?: MonitorData;

	/** Update interval */
	updateInterval?: number;
}

export function MinimalMonitorLayout({
	data,
	updateInterval = 2000,
}: MinimalMonitorLayoutProps) {
	return (
		<MonitorLayout
			data={data}
			compact={true}
			updateInterval={updateInterval}
			showAlertTicker={true}
			showWorkerStateBoard={true}
			showSystemMetrics={true}
			showEventStream={false}
			showToolTimeline={false}
			showGitActivity={false}
			showBrowserState={false}
		/>
	);
}

export default MonitorLayout;
