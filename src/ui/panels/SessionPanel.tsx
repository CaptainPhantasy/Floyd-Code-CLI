/**
 * SessionPanel Component
 *
 * Left sidebar panel displaying session context:
 * - Repo information and tech stack
 * - Git branch and status
 * - Safety mode indicator
 * - Tool toggles (FS, Patch, Runner, Git, Chrome)
 * - Workers list with status badges
 * - Quick actions shortcuts
 *
 * Matches the mockup's SESSION panel design.
 */

import {Box, Text} from 'ink';
import {Frame} from '../crush/Frame.js';
import {WorkerBadge} from '../components/WorkerBadge.js';
import {floydTheme, crushTheme, statusColors} from '../../theme/crush-theme.js';

export interface ToolToggle {
	name: string;
	enabled: boolean;
	icon?: string;
}

export interface WorkerState {
	name: string;
	status: 'idle' | 'working' | 'waiting' | 'blocked';
}

export interface SessionPanelProps {
	/** Repository name */
	repoName: string;

	/** Tech stack (e.g., "TypeScript + Ink + MCP") */
	techStack?: string;

	/** Git branch name */
	gitBranch: string;

	/** Git working tree status */
	gitStatus: 'clean' | 'dirty';

	/** Number of modified files (if dirty) */
	fileCount?: number;

	/** Safety mode setting */
	safetyMode: 'yolo' | 'ask' | 'plan';

	/** Tool toggle states */
	tools: ToolToggle[];

	/** Worker states */
	workers: WorkerState[];

	/** Quick action shortcuts */
	quickActions?: string[];

	/** Compact mode */
	compact?: boolean;
}

/**
 * Get status color for worker status
 */
function getWorkerStatusColor(
	status: WorkerState['status'],
): string {
	switch (status) {
		case 'idle':
			return floydTheme.colors.fgMuted;
		case 'working':
			return statusColors.working; // Charple
		case 'waiting':
			return statusColors.warning; // Zest
		case 'blocked':
			return statusColors.blocked; // Dolly
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get status indicator for worker
 */
function getWorkerStatusIndicator(status: WorkerState['status']): string {
	switch (status) {
		case 'idle':
			return '○';
		case 'working':
			return '●';
		case 'waiting':
			return '…';
		case 'blocked':
			return '⛔';
		default:
			return '?';
	}
}

/**
 * SessionPanel - Left sidebar with session context
 */
export function SessionPanel({
	repoName,
	techStack,
	gitBranch,
	gitStatus,
	fileCount,
	safetyMode,
	tools,
	workers,
	quickActions = [],
	compact = false,
}: SessionPanelProps) {
	const safetyColor =
		safetyMode === 'yolo' ? statusColors.error : statusColors.ready;
	const safetyLabel = safetyMode === 'yolo' ? 'YOLO ON' : 'YOLO OFF';

	return (
		<Frame
			title=" SESSION "
			borderStyle="round"
			borderVariant="focus"
			padding={1}
			width="100%"
			height="100%"
		>
			<Box flexDirection="column" gap={1} width="100%">
				{/* Repo Info */}
				<Box flexDirection="column" marginBottom={1} width="100%">
					<Text bold color={crushTheme.accent.primary} wrap="truncate">
						• {repoName}
					</Text>
					{techStack && (
						<Text color={floydTheme.colors.fgSubtle} dimColor wrap="truncate">
							({techStack})
						</Text>
					)}
				</Box>

				{/* Git Status */}
				<Box flexDirection="column" marginBottom={1}>
					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgBase}>Git:</Text>
						<Text color={crushTheme.accent.info}>branch {gitBranch}</Text>
						{gitStatus === 'dirty' ? (
							<>
								<Text color={statusColors.error}>•</Text>
								<Text color={statusColors.error}>dirty</Text>
								{fileCount !== undefined && (
									<Text color={floydTheme.colors.fgSubtle}>
										({fileCount} {fileCount === 1 ? 'file' : 'files'})
									</Text>
								)}
							</>
						) : (
							<>
								<Text color={statusColors.ready}>•</Text>
								<Text color={statusColors.ready}>clean</Text>
							</>
						)}
					</Box>
				</Box>

				{/* Safety Mode */}
				<Box flexDirection="column" marginBottom={1}>
					<Box flexDirection="row" gap={0}>
						<Text color={floydTheme.colors.fgBase}>Safety: </Text>
						<Box
							borderStyle="single"
							borderColor={
								safetyMode === 'yolo'
									? statusColors.error
									: safetyMode === 'plan'
									? statusColors.warning
									: statusColors.ready
							}
							paddingX={1}
						>
							<Text
								color={
									safetyMode === 'yolo'
										? statusColors.error
										: safetyMode === 'plan'
										? statusColors.warning
										: statusColors.ready
								}
								bold
							>
								{safetyMode === 'yolo' ? 'YOLO' : safetyMode === 'plan' ? 'PLAN' : 'ASK'}
							</Text>
						</Box>
					</Box>
				</Box>

				{/* Tool Toggles */}
				<Box flexDirection="column" marginBottom={1}>
					<Box marginBottom={0}>
						<Text bold color={crushTheme.accent.secondary}>
							TOOLS
						</Text>
					</Box>
					{tools.map((tool, index) => (
						<Box key={index} flexDirection="row" gap={1}>
							<Text color={tool.enabled ? statusColors.ready : statusColors.error}>
								{tool.enabled ? '[✓]' : '[x]'}
							</Text>
							<Text color={floydTheme.colors.fgBase}>
								{tool.icon && `${tool.icon} `}
								{tool.name}
							</Text>
							<Text
								color={
									tool.enabled ? statusColors.ready : floydTheme.colors.fgSubtle
								}
							>
								[{tool.enabled ? 'ON' : 'OFF'}]
							</Text>
						</Box>
					))}
				</Box>

				{/* Workers */}
				<Box flexDirection="column" marginBottom={1}>
					<Box marginBottom={0}>
						<Text bold color={crushTheme.accent.tertiary}>
							WORKERS
						</Text>
					</Box>
					{workers.map((worker, index) => {
						const statusColor = getWorkerStatusColor(worker.status);
						const indicator = getWorkerStatusIndicator(worker.status);
						return (
							<Box key={index} flexDirection="row" gap={1}>
								<Text color={statusColor}>{indicator}</Text>
								<Text color={floydTheme.colors.fgBase}>{worker.name}</Text>
								<Box
									borderStyle="single"
									borderColor={statusColor}
									paddingX={1}
								>
									<Text color={statusColor} dimColor>
										{worker.status.charAt(0).toUpperCase() +
											worker.status.slice(1)}
									</Text>
								</Box>
							</Box>
						);
					})}
				</Box>

				{/* Quick Actions */}
				{quickActions.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.info}>
								QUICK ACTS
							</Text>
						</Box>
						{quickActions.map((action, index) => (
							<Text key={index} color={floydTheme.colors.fgSubtle} dimColor>
								{action}
							</Text>
						))}
					</Box>
				)}
			</Box>
		</Frame>
	);
}

export default SessionPanel;
