/**
 * EventStream Component
 *
 * Live event waterfall display with filtering and tool call timing visualization.
 * Shows real-time events from the agent system with color-coded severity and timing.
 *
 * Features:
 * - Scrollable event history
 * - Filter by event type
 * - Tool call duration display
 * - Compact mode for small terminals
 * - Auto-scroll to latest events
 */

import {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import Anita from 'ink-text-input';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type EventSeverity = 'info' | 'success' | 'warning' | 'error' | 'debug';

export type EventType =
	| 'tool_call'
	| 'tool_response'
	| 'agent_message'
	| 'user_message'
	| 'system'
	| 'error'
	| 'warning'
	| 'thinking'
	| 'custom';

export interface StreamEvent {
	/** Unique event ID */
	id: string;

	/** Event type */
	type: EventType;

	/** Event severity */
	severity: EventSeverity;

	/** Event timestamp */
	timestamp: Date;

	/** Event message/description */
	message: string;

	/** Tool name (for tool events) */
	toolName?: string;

	/** Duration in milliseconds (for tool calls) */
	duration?: number;

	/** Additional metadata */
	metadata?: Record<string, unknown>;

	/** Parent event ID (for nested events) */
	parentId?: string;

	/** Child events */
	children?: StreamEvent[];
}

export interface EventStreamProps {
	/** Current events to display */
	events?: StreamEvent[];

	/** Maximum number of events to keep in history */
	maxEvents?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Auto-scroll to latest events */
	autoScroll?: boolean;

	/** Show timestamps */
	showTimestamps?: boolean;

	/** Show tool call durations */
	showDurations?: boolean;

	/** Filter events by type */
	filterTypes?: EventType[];

	/** Filter events by severity */
	filterSeverity?: EventSeverity[];

	/** Height of the event stream (number of lines) */
	height?: number;

	/** Enable search/filter */
	enableSearch?: boolean;

	/** Custom header */
	header?: React.ReactNode;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get severity color
 */
function getSeverityColor(severity: EventSeverity): string {
	switch (severity) {
		case 'info':
			return crushTheme.accent.info;
		case 'success':
			return crushTheme.status.ready;
		case 'warning':
			return crushTheme.status.warning;
		case 'error':
			return crushTheme.status.error;
		case 'debug':
			return floydTheme.colors.fgMuted;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get event icon
 */
function getEventIcon(type: EventType, severity: EventSeverity): string {
	switch (type) {
		case 'tool_call':
			return '⚙';
		case 'tool_response':
			return severity === 'error' ? '✕' : '✓';
		case 'agent_message':
			return '◉';
		case 'user_message':
			return '●';
		case 'system':
			return '◆';
		case 'error':
			return '✕';
		case 'warning':
			return '⚠';
		case 'thinking':
			return '⟳';
		default:
			return '•';
	}
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
 * Format timestamp for display
 */
function formatTimestamp(date: Date, compact = false): string {
	if (compact) {
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	}
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3,
	});
}

/**
 * Check if event passes filter
 */
function passesFilter(
	event: StreamEvent,
	filterTypes?: EventType[],
	filterSeverity?: EventSeverity[],
	searchQuery?: string,
): boolean {
	if (
		filterTypes &&
		filterTypes.length > 0 &&
		!filterTypes.includes(event.type)
	) {
		return false;
	}
	if (
		filterSeverity &&
		filterSeverity.length > 0 &&
		!filterSeverity.includes(event.severity)
	) {
		return false;
	}
	if (searchQuery && searchQuery.trim() !== '') {
		const query = searchQuery.toLowerCase();
		return !!(
			event.message.toLowerCase().includes(query) ||
			(event.toolName && event.toolName.toLowerCase().includes(query))
		);
	}
	return true;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * FilterBar - Event filter controls
 */
interface FilterBarProps {
	filterTypes: EventType[];
	filterSeverity: EventSeverity[];
	searchQuery: string;
	onSearchChange: (query: string) => void;
	compact: boolean;
}

function FilterBar({
	filterTypes,
	filterSeverity,
	searchQuery,
	onSearchChange,
	compact,
}: FilterBarProps) {
	const {exit} = useApp();

	const handleExit = () => exit();

	if (compact) {
		return (
			<Box flexDirection="row" gap={1} paddingX={1}>
				<Text dimColor>
					{filterTypes.length === 0
						? 'All Types'
						: `${filterTypes.length} Types`}
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					•
				</Text>
				<Text dimColor>
					{filterSeverity.length === 0
						? 'All Severities'
						: `${filterSeverity.length} Levels`}
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					•
				</Text>
				<Text dimColor>/{searchQuery || 'search'}</Text>
			</Box>
		);
	}

	return (
		<Box
			flexDirection="column"
			gap={0}
			borderStyle="single"
			borderColor={floydTheme.colors.border}
			paddingX={1}
		>
			{/* Type filters */}
			<Box flexDirection="row" gap={1} marginBottom={0}>
				<Text color={floydTheme.colors.fgMuted}>Types:</Text>
				{(
					[
						'tool_call',
						'tool_response',
						'agent_message',
						'error',
					] as EventType[]
				).map(type => {
					const isActive = filterTypes.includes(type);
					const icon = getEventIcon(type, 'info');
					return (
						<Text
							key={type}
							color={
								isActive ? crushTheme.accent.primary : floydTheme.colors.fgMuted
							}
							bold={isActive}
						>
							{isActive ? '[' : ' '}
							{icon}
							{isActive ? ']' : ' '}
						</Text>
					);
				})}
			</Box>

			{/* Severity filters */}
			<Box flexDirection="row" gap={1} marginBottom={0}>
				<Text color={floydTheme.colors.fgMuted}>Level:</Text>
				{(
					['error', 'warning', 'info', 'success', 'debug'] as EventSeverity[]
				).map(severity => {
					const isActive = filterSeverity.includes(severity);
					return (
						<Text
							key={severity}
							color={
								isActive
									? getSeverityColor(severity)
									: floydTheme.colors.fgMuted
							}
							bold={isActive}
						>
							{isActive ? '[' : ' '}
							{severity[0]?.toUpperCase() || '?'}
							{isActive ? ']' : ' '}
						</Text>
					);
				})}
			</Box>

			{/* Search input */}
			<Box flexDirection="row" gap={1}>
				<Text color={floydTheme.colors.fgMuted}>Filter:</Text>
				<Text color={floydTheme.colors.fgSubtle}>/</Text>
				<Anita
					value={searchQuery}
					onChange={onSearchChange}
					onSubmit={handleExit}
					placeholder="Search events..."
				/>
			</Box>
		</Box>
	);
}

/**
 * EventRow - Single event display
 */
interface EventRowProps {
	event: StreamEvent;
	depth: number;
	compact: boolean;
	showTimestamps: boolean;
	showDurations: boolean;
	indentSize: number;
}

function EventRow({
	event,
	depth,
	compact,
	showTimestamps,
	showDurations,
	indentSize,
}: EventRowProps) {
	const severityColor = getSeverityColor(event.severity);
	const icon = getEventIcon(event.type, event.severity);
	const indent = '  '.repeat(depth);

	// Get duration color based on speed
	const getDurationColor = (ms?: number): string => {
		if (!ms) return floydTheme.colors.fgMuted;
		if (ms < 100) return crushTheme.status.ready;
		if (ms < 500) return crushTheme.accent.tertiary;
		if (ms < 2000) return crushTheme.status.warning;
		return crushTheme.status.error;
	};

	return (
		<Box flexDirection="column" key={event.id}>
			<Box flexDirection="row" gap={1} width="100%">
				<Text color={floydTheme.colors.fgSubtle}>{indent}</Text>

				{showTimestamps && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{formatTimestamp(event.timestamp, compact)}
					</Text>
				)}

				<Text color={severityColor}>{icon}</Text>

				<Text
					color={severityColor}
					bold={event.severity === 'error' || event.severity === 'warning'}
				>
					{event.toolName || event.message}
				</Text>

				{showDurations && event.duration !== undefined && (
					<Text color={getDurationColor(event.duration)}>
						{' '}
						({formatDuration(event.duration)})
					</Text>
				)}

				{event.metadata &&
					Object.keys(event.metadata).length > 0 &&
					!compact && (
						<Text color={floydTheme.colors.fgSubtle} dimColor>
							{' '}
							+{Object.keys(event.metadata).length}
						</Text>
					)}
			</Box>

			{/* Show message if different from tool name */}
			{!compact && event.toolName && event.toolName !== event.message && (
				<Box flexDirection="row" gap={1}>
					<Text color={floydTheme.colors.fgSubtle}>{indent} </Text>
					<Text color={floydTheme.colors.fgMuted}>{event.message}</Text>
				</Box>
			)}

			{/* Render child events */}
			{event.children &&
				event.children.map(child => (
					<EventRow
						key={child.id}
						event={child}
						depth={depth + 1}
						compact={compact}
						showTimestamps={showTimestamps}
						showDurations={showDurations}
						indentSize={indentSize}
					/>
				))}
		</Box>
	);
}

/**
 * EventStream - Main component
 */
export function EventStream({
	events: propEvents = [],
	maxEvents = 100,
	compact = false,
	autoScroll = true,
	showTimestamps = true,
	showDurations = true,
	filterTypes: propFilterTypes,
	filterSeverity: propFilterSeverity,
	height = 20,
	enableSearch = true,
	header,
}: EventStreamProps) {
	const [filterTypes] = useState<EventType[]>(propFilterTypes || []);
	const [filterSeverity] = useState<EventSeverity[]>(propFilterSeverity || []);
	const [searchQuery, setSearchQuery] = useState('');
	const [isPaused] = useState(false);

	// Simulate live events (in real usage, this would come from props/store)
	const [events, setEvents] = useState<StreamEvent[]>(propEvents);

	// Update events when prop changes
	useEffect(() => {
		setEvents(propEvents);
	}, [propEvents]);

	// Filter events
	const filteredEvents = events.filter(event =>
		passesFilter(event, filterTypes, filterSeverity, searchQuery),
	);

	// Stats
	const stats = {
		total: events.length,
		errors: events.filter(e => e.severity === 'error').length,
		warnings: events.filter(e => e.severity === 'warning').length,
		toolCalls: events.filter(e => e.type === 'tool_call').length,
	};

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
							Event Stream
						</Text>
						<Text dimColor color={floydTheme.colors.fgMuted}>
							{filteredEvents.length}/{stats.total}
						</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						{!compact && (
							<>
								<Text color={crushTheme.status.error}>✕ {stats.errors}</Text>
								<Text color={crushTheme.status.warning}>
									⚠ {stats.warnings}
								</Text>
								<Text color={crushTheme.accent.tertiary}>
									⚙ {stats.toolCalls}
								</Text>
							</>
						)}
						<Text
							color={
								isPaused ? crushTheme.status.warning : crushTheme.status.ready
							}
						>
							{isPaused ? '⏸ Paused' : '▶ Live'}
						</Text>
					</Box>
				</Box>
			)}

			{/* Filter bar */}
			{enableSearch && (
				<FilterBar
					filterTypes={filterTypes}
					filterSeverity={filterSeverity}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					compact={compact}
				/>
			)}

			{/* Event list */}
			<Box
				flexDirection="column"
				paddingX={1}
				height={compact ? undefined : height}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				{filteredEvents.length === 0 ? (
					<Box paddingY={1}>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							{searchQuery ||
							filterTypes.length > 0 ||
							filterSeverity.length > 0
								? 'No events match your filters'
								: 'Waiting for events...'}
						</Text>
					</Box>
				) : (
					filteredEvents
						.slice(-maxEvents)
						.map(event => (
							<EventRow
								key={event.id}
								event={event}
								depth={0}
								compact={compact}
								showTimestamps={showTimestamps}
								showDurations={showDurations}
								indentSize={2}
							/>
						))
				)}
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
				>
					<Text dimColor color={floydTheme.colors.fgSubtle}>
						Press {'<Ctrl+C>'} to exit
					</Text>
					<Text dimColor color={floydTheme.colors.fgSubtle}>
						{autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * CompactEventStream - Minimal version for status bars
 */
export interface CompactEventStreamProps {
	/** Last event to display */
	lastEvent?: StreamEvent;

	/** Number of errors */
	errorCount?: number;

	/** Number of warnings */
	warningCount?: number;
}

export function CompactEventStream({
	lastEvent,
	errorCount = 0,
	warningCount = 0,
}: CompactEventStreamProps) {
	return (
		<Box flexDirection="row" gap={1}>
			{lastEvent && (
				<>
					<Text color={getSeverityColor(lastEvent.severity)}>
						{getEventIcon(lastEvent.type, lastEvent.severity)}
					</Text>
					<Text color={floydTheme.colors.fgBase}>
						{lastEvent.toolName || lastEvent.message.slice(0, 30)}
					</Text>
				</>
			)}

			{(errorCount > 0 || warningCount > 0) && (
				<>
					<Text color={floydTheme.colors.fgSubtle}>•</Text>
					{errorCount > 0 && (
						<Text color={crushTheme.status.error}>✕{errorCount}</Text>
					)}
					{warningCount > 0 && (
						<Text color={crushTheme.status.warning}>⚠{warningCount}</Text>
					)}
				</>
			)}
		</Box>
	);
}

export default EventStream;
