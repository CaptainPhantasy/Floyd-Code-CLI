/**
 * ToolCard Component
 *
 * Animated card for displaying tool execution status and results.
 * Features entrance animations, status indicators, and expandable content.
 */

import {useState, useEffect, type ReactNode} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

export type ToolStatus =
	| 'pending'
	| 'running'
	| 'success'
	| 'error'
	| 'cancelled';

export interface ToolCardProps {
	/** Tool name being executed */
	toolName: string;

	/** Current status */
	status?: ToolStatus;

	/** Optional description of what the tool is doing */
	description?: string;

	/** Result data to display (shown when success/error) */
	result?: string | ReactNode;

	/** Error message (shown when error) */
	error?: string;

	/** Execution duration in ms */
	duration?: number;

	/** Timestamp when tool started */
	timestamp?: Date;

	/** Worker name that requested this tool (e.g., "Searcher", "Patch-Drafter") */
	workerName?: string;

	/** Show tool.requested prefix */
	showRequestedPrefix?: boolean;

	/** Enable entrance animation */
	animate?: boolean;

	/** Compact mode (hide details by default) */
	compact?: boolean;

	/** Expand to show full result */
	expanded?: boolean;

	/** Custom border color */
	borderColor?: string;
}

/**
 * Get status indicator and color
 */
function getStatusIndicator(status: ToolStatus): {
	char: string;
	color: string;
	label: string;
} {
	switch (status) {
		case 'pending':
			return {char: '○', color: floydTheme.colors.fgMuted, label: 'Pending'};
		case 'running':
			return {char: '●', color: floydRoles.thinking, label: 'Running'};
		case 'success':
			return {char: '✓', color: floydTheme.colors.success, label: 'Success'};
		case 'error':
			return {char: '✕', color: floydTheme.colors.error, label: 'Error'};
		case 'cancelled':
			return {char: '⊘', color: floydTheme.colors.fgMuted, label: 'Cancelled'};
		default:
			return {char: '?', color: floydTheme.colors.fgMuted, label: 'Unknown'};
	}
}

/**
 * Format duration for display (compact format for tool cards)
 */
function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	const mins = Math.floor(ms / 60000);
	const secs = Math.floor((ms % 60000) / 1000);
	return `${mins}m ${secs}s`;
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTimestamp(date: Date): string {
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

/**
 * Animated tool call card
 */
export function ToolCard({
	toolName,
	status = 'pending',
	description,
	result,
	error,
	duration,
	timestamp,
	workerName,
	showRequestedPrefix = true,
	animate = true,
	compact = false,
	expanded: expandedProp = false,
	borderColor,
}: ToolCardProps) {
	const [expanded] = useState(expandedProp);

	// Entrance animation placeholder
	// Full animation implementation would go here
	useEffect(() => {
		// Animation setup
	}, [animate]);

	const statusInfo = getStatusIndicator(status);
	const showResult = expanded || !compact;
	const finalBorderColor = borderColor ?? statusInfo.color;

	// Get status icon for tool.requested prefix
	const getStatusIcon = (): string => {
		switch (status) {
			case 'pending':
				return '⧉';
			case 'running':
				return '⧉';
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'cancelled':
				return '⊘';
			default:
				return '○';
		}
	};

	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Main card */}
			<Box
				borderStyle="round"
				borderColor={finalBorderColor}
				paddingX={1}
				paddingY={0}
				flexDirection="column"
			>
				{/* Header row */}
				<Box justifyContent="space-between" width="100%">
					<Box flexDirection="row" gap={1}>
						{/* tool.requested prefix */}
						{showRequestedPrefix && (
							<Text color={statusInfo.color}>
								{getStatusIcon()}{' '}
							</Text>
						)}
						<Text color={floydTheme.colors.fgMuted} dimColor>
							tool.requested{' '}
						</Text>

						{/* Tool name */}
						<Text bold color={floydTheme.colors.fgSelected}>
							{toolName}
						</Text>

						{/* Duration in parentheses */}
						{duration !== undefined && (
							<Text color={floydTheme.colors.fgMuted} dimColor>
								{' '}({formatDuration(duration)})
							</Text>
						)}

						{/* Status indicator */}
						{status === 'running' ? (
							<Text color={statusInfo.color}>
								{' '}
								<Spinner type="dots" />
							</Text>
						) : (
							<Text color={statusInfo.color}>
								{' '}
								{statusInfo.char}
							</Text>
						)}
					</Box>

					{/* Timestamp */}
					{timestamp && (
						<Text color={floydTheme.colors.fgMuted} dimColor>
							{formatTimestamp(timestamp)}
						</Text>
					)}
				</Box>

				{/* Worker annotation */}
				{workerName && (
					<Box marginTop={0}>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							[{workerName}]{' '}
							{status === 'success' && 'found files + line numbers...'}
							{status === 'pending' && 'proposes diff...'}
							{status === 'running' && 'working...'}
						</Text>
					</Box>
				)}

				{/* Description */}
				{description && (
					<Box marginTop={0}>
						<Text color={floydTheme.colors.fgMuted}>{description}</Text>
					</Box>
				)}

				{/* Result preview (compact mode) */}
				{compact && (result || error) && !expanded && (
					<Box
						marginTop={0}
						paddingX={1}
						borderStyle="single"
						borderColor={floydTheme.colors.border}
					>
						<Text
							color={error ? floydTheme.colors.error : floydTheme.colors.fgBase}
							dimColor
						>
							{error
								? error.substring(0, 50) + (error.length > 50 ? '...' : '')
								: typeof result === 'string'
								? result.substring(0, 50) + (result.length > 50 ? '...' : '')
								: 'Result available'}
						</Text>
					</Box>
				)}
			</Box>

			{/* Expanded result section */}
			{showResult && (result || error) && (
				<Box
					marginTop={0}
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					paddingX={1}
					paddingY={0}
					flexDirection="column"
				>
					{error && (
						<Text color={floydTheme.colors.error}>{'Error: ' + error}</Text>
					)}
					{result &&
						!error &&
						(typeof result === 'string' ? (
							<Text color={floydTheme.colors.fgBase}>{result}</Text>
						) : (
							result
						))}
				</Box>
			)}

			{/* Expand hint (compact mode) */}
			{compact && (result || error) && !expanded && (
				<Box marginTop={0}>
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						Press Enter to expand
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * ToolCardList - Grouped tool cards with shared state
 */
export interface ToolCardListProps {
	/** Array of tool calls */
	tools: Array<{
		id: string;
		name: string;
		status: ToolStatus;
		description?: string;
		result?: string | ReactNode;
		error?: string;
		duration?: number;
		timestamp?: Date;
	}>;

	/** Show in compact mode */
	compact?: boolean;

	/** Max cards to show before scrolling */
	maxCards?: number;
}

export function ToolCardList({
	tools,
	compact = false,
	maxCards = 5,
}: ToolCardListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	// Auto-expand the most recent active tool
	useEffect(() => {
		const activeTool = tools.find(t => t.status === 'running');
		if (activeTool) {
			setExpandedId(activeTool.id);
		}
	}, [tools]);

	const displayTools = maxCards ? tools.slice(-maxCards) : tools;

	return (
		<Box flexDirection="column" width="100%">
			{displayTools.map(tool => (
				<Box key={tool.id} marginBottom={1} flexDirection="column" width="100%">
					<ToolCard
						toolName={tool.name}
						status={tool.status}
						description={tool.description}
						result={tool.result}
						error={tool.error}
						duration={tool.duration}
						timestamp={tool.timestamp}
						compact={compact}
						expanded={expandedId === tool.id}
					/>
				</Box>
			))}

			{/* Show count if tools are hidden */}
			{maxCards && tools.length > maxCards && (
				<Box>
					<Text color={floydTheme.colors.fgMuted} dimColor>
						+{tools.length - maxCards} more tool call
						{tools.length - maxCards > 1 ? 's' : ''}
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * AnimatedToolCard - ToolCard with continuous pulse animation when running
 */
export function AnimatedToolCard(props: ToolCardProps) {
	// Note: Box doesn't support dimColor, so animation is handled via ToolCard's internal status
	return <ToolCard {...props} />;
}

export default ToolCard;
