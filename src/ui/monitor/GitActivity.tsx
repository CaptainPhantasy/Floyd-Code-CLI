/**
 * GitActivity Component
 *
 * Real-time git status and activity display.
 * Shows branch, changes, commits, and sync status.
 *
 * Features:
 * - Real-time git status monitoring
 * - Branch display with sync status
 * - Staged/unstaged changes count
 * - Recent commit history
 * - Compact mode for status bars
 * - Color-coded status indicators
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type GitSyncStatus =
	| 'synced'
	| 'ahead'
	| 'behind'
	| 'diverged'
	| 'unknown';

export interface GitFileChange {
	/** File path */
	path: string;

	/** Change status */
	status: 'modified' | 'added' | 'deleted' | 'renamed' | 'copied' | 'unmerged';

	/** Staged status */
	staged: boolean;

	/** Original path (for renames) */
	originalPath?: string;
}

export interface GitCommit {
	/** Commit hash (short) */
	hash: string;

	/** Commit message */
	message: string;

	/** Author name */
	author: string;

	/** Commit timestamp */
	timestamp: Date;

	/** Branch this commit is on */
	branch?: string;
}

export interface GitStatus {
	/** Current branch name */
	branch: string;

	/** Sync status with remote */
	syncStatus: GitSyncStatus;

	/** Number of commits ahead of remote */
	aheadCount?: number;

	/** Number of commits behind remote */
	behindCount?: number;

	/** Untracked files */
	untrackedCount: number;

	/** File changes */
	changes: GitFileChange[];

	/** Stashed changes count */
	stashCount?: number;

	/** Recent commits */
	recentCommits?: GitCommit[];

	/** Current HEAD commit */
	headCommit?: GitCommit;
}

export interface GitActivityProps {
	/** Git status data (if not provided, shows placeholder) */
	status?: GitStatus;

	/** Update interval in milliseconds */
	interval?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Show file changes list */
	showFiles?: boolean;

	/** Show commit history */
	showHistory?: boolean;

	/** Maximum files to display */
	maxFiles?: number;

	/** Maximum commits to display */
	maxCommits?: number;

	/** Custom header */
	header?: React.ReactNode;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get sync status color
 */
function getSyncStatusColor(status: GitSyncStatus): string {
	switch (status) {
		case 'synced':
			return crushTheme.status.ready;
		case 'ahead':
			return crushTheme.accent.info;
		case 'behind':
			return crushTheme.status.warning;
		case 'diverged':
			return crushTheme.status.error;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get sync status icon
 */
function getSyncStatusIcon(status: GitSyncStatus): string {
	switch (status) {
		case 'synced':
			return '≡';
		case 'ahead':
			return '↑';
		case 'behind':
			return '↓';
		case 'diverged':
			return '⇅';
		default:
			return '?';
	}
}

/**
 * Get file status color
 */
function getFileStatusColor(
	status: GitFileChange['status'],
	staged: boolean,
): string {
	const stagedColor = crushTheme.accent.tertiary;
	const unstagedColor = floydTheme.colors.fgBase;

	switch (status) {
		case 'modified':
			return staged ? stagedColor : crushTheme.extended.tang;
		case 'added':
			return staged ? stagedColor : crushTheme.status.ready;
		case 'deleted':
			return staged ? stagedColor : crushTheme.status.error;
		case 'renamed':
			return crushTheme.accent.info;
		case 'unmerged':
			return crushTheme.status.error;
		default:
			return staged ? stagedColor : unstagedColor;
	}
}

/**
 * Get file status icon
 */
function getFileStatusIcon(status: GitFileChange['status']): string {
	switch (status) {
		case 'modified':
			return 'M';
		case 'added':
			return 'A';
		case 'deleted':
			return 'D';
		case 'renamed':
			return 'R';
		case 'copied':
			return 'C';
		case 'unmerged':
			return 'U';
		default:
			return '?';
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
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) {
		return `${seconds}s ago`;
	}
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	if (hours < 24) {
		return `${hours}h ago`;
	}
	return `${days}d ago`;
}

/**
 * Truncate file path for display
 */
function truncatePath(path: string, maxLength = 30): string {
	if (path.length <= maxLength) return path;

	// Keep the filename and truncate directory
	const parts = path.split('/');
	const filename = parts[parts.length - 1] ?? path;
	const availableLength = maxLength - filename.length - 4; // -4 for '.../'

	if (availableLength < 0) {
		return filename.substring(0, maxLength - 3) + '...';
	}

	return `.../${filename}`;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * FileChangeRow - Single file change display
 */
interface FileChangeRowProps {
	change: GitFileChange;
	showPath: boolean;
}

function FileChangeRow({change, showPath}: FileChangeRowProps) {
	const color = getFileStatusColor(change.status, change.staged);
	const icon = getFileStatusIcon(change.status);

	return (
		<Box flexDirection="row" gap={1} key={change.path}>
			<Text color={color}>{icon}</Text>
			{showPath && <Text color={color}>{truncatePath(change.path, 40)}</Text>}
		</Box>
	);
}

/**
 * CommitRow - Single commit display
 */
interface CommitRowProps {
	commit: GitCommit;
	showHash: boolean;
}

function CommitRow({commit, showHash}: CommitRowProps) {
	return (
		<Box flexDirection="row" gap={1} key={commit.hash}>
			{showHash && <Text color={crushTheme.accent.primary}>{commit.hash}</Text>}
			<Text color={floydTheme.colors.fgBase}>
				{commit.message.length > 40
					? commit.message.substring(0, 40) + '...'
					: commit.message}
			</Text>
			<Text color={floydTheme.colors.fgSubtle} dimColor>
				{formatRelativeTime(commit.timestamp)}
			</Text>
		</Box>
	);
}

/**
 * CompactGitStatus - Single line status for header bars
 */
interface CompactGitStatusProps {
	status: GitStatus;
}

export function CompactGitStatus({status}: CompactGitStatusProps) {
	const syncColor = getSyncStatusColor(status.syncStatus);
	const stagedCount = status.changes.filter(c => c.staged).length;
	const unstagedCount = status.changes.filter(c => !c.staged).length;

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={crushTheme.accent.secondary}>{status.branch}</Text>

			<Text color={syncColor}>{getSyncStatusIcon(status.syncStatus)}</Text>

			{stagedCount > 0 && (
				<Text color={crushTheme.accent.tertiary}>S{stagedCount}</Text>
			)}

			{unstagedCount > 0 && (
				<Text color={crushTheme.extended.tang}>U{unstagedCount}</Text>
			)}

			{status.untrackedCount > 0 && (
				<Text color={floydTheme.colors.fgMuted}>?{status.untrackedCount}</Text>
			)}

			{(status.aheadCount ?? 0) > 0 && (
				<Text color={crushTheme.accent.info}>+{status.aheadCount}</Text>
			)}

			{(status.behindCount ?? 0) > 0 && (
				<Text color={crushTheme.status.warning}>-{status.behindCount}</Text>
			)}
		</Box>
	);
}

/**
 * GitActivity - Main component
 */
export function GitActivity({
	status: propStatus,
	compact = false,
	showFiles = true,
	showHistory = true,
	maxFiles = 10,
	maxCommits = 5,
	header,
}: GitActivityProps) {
	// Internal state for status simulation
	const [status, setStatus] = useState<GitStatus>(
		propStatus ?? {
			branch: 'main',
			syncStatus: 'synced',
			untrackedCount: 0,
			changes: [],
			stashCount: 0,
			recentCommits: [],
		},
	);

	// Update status when prop changes
	useEffect(() => {
		if (propStatus) {
			setStatus(propStatus);
		}
	}, [propStatus]);

	// Stats
	const stats = useMemo(() => {
		const staged = status.changes.filter(c => c.staged).length;
		const unstaged = status.changes.filter(c => !c.staged).length;
		return {
			staged,
			unstaged,
			total: status.changes.length,
			hasChanges: status.changes.length > 0 || status.untrackedCount > 0,
		};
	}, [status]);

	// Compact mode - single line
	if (compact) {
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
							Git
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<CompactGitStatus status={status} />
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
					<Box flexDirection="row" gap={2}>
						<Text bold color={crushTheme.accent.secondary}>
							Git Activity
						</Text>
						<CompactGitStatus status={status} />
					</Box>

					<Box flexDirection="row" gap={2}>
						{status.stashCount && status.stashCount > 0 && (
							<Text color={crushTheme.accent.tertiary}>
								{status.stashCount} stashed
							</Text>
						)}
					</Box>
				</Box>
			)}

			{/* Content */}
			<Box
				flexDirection="column"
				paddingX={1}
				gap={0}
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				borderTop={false}
			>
				{/* File changes */}
				{showFiles && (stats.total > 0 || status.untrackedCount > 0) && (
					<Box flexDirection="column" marginBottom={1}>
						<Box flexDirection="row" gap={1} marginBottom={0}>
							<Text bold color={floydTheme.colors.fgSubtle}>
								Changes
							</Text>
							<Text dimColor color={floydTheme.colors.fgSubtle}>
								({stats.staged} staged, {stats.unstaged} unstaged
								{status.untrackedCount > 0 &&
									`, ${status.untrackedCount} untracked`}
								)
							</Text>
						</Box>

						{/* Staged changes */}
						{status.changes
							.filter(c => c.staged)
							.slice(0, maxFiles)
							.map(change => (
								<FileChangeRow key={change.path} change={change} showPath />
							))}

						{/* Unstaged changes */}
						{status.changes
							.filter(c => !c.staged)
							.slice(0, maxFiles)
							.map(change => (
								<FileChangeRow key={change.path} change={change} showPath />
							))}

						{status.untrackedCount > 0 && (
							<Box flexDirection="row" gap={1}>
								<Text color={floydTheme.colors.fgMuted}>?</Text>
								<Text color={floydTheme.colors.fgMuted}>
									{status.untrackedCount} untracked files
								</Text>
							</Box>
						)}
					</Box>
				)}

				{/* Commit history */}
				{showHistory &&
					status.recentCommits &&
					status.recentCommits.length > 0 && (
						<Box flexDirection="column">
							<Box flexDirection="row" gap={1} marginBottom={0}>
								<Text bold color={floydTheme.colors.fgMuted}>
									Recent Commits
								</Text>
							</Box>

							{status.recentCommits.slice(0, maxCommits).map(commit => (
								<CommitRow key={commit.hash} commit={commit} showHash />
							))}
						</Box>
					)}

				{/* No changes */}
				{!stats.hasChanges &&
					(!status.recentCommits || status.recentCommits.length === 0) && (
						<Box paddingY={1}>
							<Text color={floydTheme.colors.fgMuted} dimColor>
								Working directory clean
							</Text>
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
					{status.branch}
				</Text>
				{status.headCommit && (
					<Text dimColor color={floydTheme.colors.fgSubtle}>
						HEAD: {status.headCommit.hash}
					</Text>
				)}
			</Box>
		</Box>
	);
}

/**
 * GitBranchSelector - Branch switching UI
 */
export interface GitBranchSelectorProps {
	/** Current branch */
	currentBranch: string;

	/** Available branches */
	branches: string[];

	/** On branch change callback */
	onChange?: (branch: string) => void;
}

export function GitBranchSelector({
	currentBranch,
	branches,
}: GitBranchSelectorProps) {
	return (
		<Box flexDirection="column" gap={0}>
			<Box flexDirection="row" gap={1} marginBottom={0}>
				<Text color={floydTheme.colors.fgMuted}>Branch:</Text>
				<Text color={crushTheme.accent.secondary} bold>
					{currentBranch}
				</Text>
			</Box>

			<Box flexDirection="column" gap={0}>
				{branches.slice(0, 5).map(branch => {
					const isCurrent = branch === currentBranch;
					const color = isCurrent
						? crushTheme.status.ready
						: floydTheme.colors.fgMuted;

					return (
						<Box key={branch} flexDirection="row" gap={1}>
							<Text color={color}>{isCurrent ? '●' : '○'}</Text>
							<Text color={color}>{branch}</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

/**
 * GitSyncIndicator - Visual sync status indicator
 */
export interface GitSyncIndicatorProps {
	/** Sync status */
	status: GitSyncStatus;

	/** Ahead count */
	ahead?: number;

	/** Behind count */
	behind?: number;

	/** Show labels */
	showLabels?: boolean;
}

export function GitSyncIndicator({
	status,
	ahead,
	behind,
	showLabels = true,
}: GitSyncIndicatorProps) {
	const color = getSyncStatusColor(status);
	const icon = getSyncStatusIcon(status);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={color}>{icon}</Text>
			{showLabels && (
				<>
					{status === 'synced' && <Text color={color}>Synced</Text>}
					{status === 'ahead' && <Text color={color}>Ahead {ahead ?? 0}</Text>}
					{status === 'behind' && (
						<Text color={color}>Behind {behind ?? 0}</Text>
					)}
					{status === 'diverged' && (
						<Text color={color}>
							Diverged (+{ahead ?? 0}, -{behind ?? 0})
						</Text>
					)}
				</>
			)}
		</Box>
	);
}

export default GitActivity;
