/**
 * PermissionHistory Component
 *
 * Displays a list of past permission decisions.
 *
 * Features:
 * - Chronological list of permission decisions
 * - Tool name, decision, scope, and timestamp
 * - Filtering by decision type (allow/deny)
 * - Clear individual or all history entries
 * - CRUSH theme styling
 */

import {useMemo} from 'react';
import {Box, Text} from 'ink';
import {
	PermissionDecision,
	PermissionScope,
	PermissionRule,
	getScopeText,
} from './policies.js';
import {crushTheme, roleColors} from '../theme/crush-theme.js';

// Re-export types for convenience
export type {PermissionDecision, PermissionScope, PermissionRule};

export interface HistoryEntry {
	id: string;
	toolName: string;
	decision: PermissionDecision;
	scope: PermissionScope;
	grantedAt: number;
	expiresAt?: number;
}

export interface PermissionHistoryProps {
	entries: HistoryEntry[];
	visible: boolean;
	filter?: 'all' | 'allow' | 'deny';
	maxEntries?: number;
	onClear?: (entryId?: string) => void;
}

// Decision styling
const DECISION_STYLES = {
	allow: {
		color: crushTheme.status.ready,
		symbol: '[+]',
		label: 'ALLOWED',
	},
	deny: {
		color: crushTheme.status.error,
		symbol: '[x]',
		label: 'DENIED',
	},
} as const;

// Scope styling
const SCOPE_STYLES = {
	once: {
		color: crushTheme.text.secondary,
		symbol: '1x',
	},
	session: {
		color: crushTheme.accent.primary,
		symbol: 'ss',
	},
	always: {
		color: crushTheme.accent.secondary,
		symbol: '∞',
	},
} as const;

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

/**
 * Check if a rule is expired
 */
function isExpired(entry: HistoryEntry): boolean {
	return entry.expiresAt !== undefined && entry.expiresAt < Date.now();
}

/**
 * Permission History List Component
 */
export function PermissionHistory({
	entries,
	visible,
	filter = 'all',
	maxEntries = 10,
	onClear,
}: PermissionHistoryProps) {
	if (!visible || entries.length === 0) {
		return null;
	}

	// Filter and sort entries
	const filteredEntries = useMemo(() => {
		let result = [...entries];

		// Apply decision filter
		if (filter !== 'all') {
			result = result.filter(entry => entry.decision === filter);
		}

		// Sort by timestamp (newest first)
		result.sort((a, b) => b.grantedAt - a.grantedAt);

		// Limit entries
		return result.slice(0, maxEntries);
	}, [entries, filter, maxEntries]);

	// Calculate stats
	const stats = useMemo(() => {
		const total = entries.length;
		const allowed = entries.filter(e => e.decision === 'allow').length;
		const denied = entries.filter(e => e.decision === 'deny').length;
		const expired = entries.filter(isExpired).length;

		return {total, allowed, denied, expired};
	}, [entries]);

	return (
		<Box flexDirection="column">
			{/* Header with stats */}
			<Box
				flexDirection="row"
				borderStyle="single"
				borderColor={crushTheme.bg.elevated}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.systemLabel}>
					Permission History
				</Text>
				<Box marginLeft={1}>
					<Text color={crushTheme.text.secondary}>{stats.total} total</Text>
				</Box>
				<Box marginLeft={1}>
					<Text color={crushTheme.status.ready}>{stats.allowed} allowed</Text>
				</Box>
				<Box marginLeft={1}>
					<Text color={crushTheme.status.error}>{stats.denied} denied</Text>
				</Box>
			</Box>

			{/* History entries */}
			{filteredEntries.length === 0 ? (
				<Box paddingX={1}>
					<Text color={crushTheme.text.secondary}>
						No permission history to display
					</Text>
				</Box>
			) : (
				<Box flexDirection="column">
					{filteredEntries.map(entry => {
						const decisionStyle = DECISION_STYLES[entry.decision];
						const scopeStyle = SCOPE_STYLES[entry.scope];
						const expired = isExpired(entry);

						return (
							<Box key={entry.id} flexDirection="row" paddingX={1}>
								{/* Decision Symbol */}
								<Text bold color={decisionStyle.color}>
									{decisionStyle.symbol}
								</Text>

								<Box marginLeft={1} />

								{/* Tool Name */}
								<Text
									color={
										expired ? crushTheme.text.subtle : crushTheme.text.primary
									}
									dimColor={expired}
								>
									{entry.toolName}
								</Text>

								{/* Scope Indicator */}
								<Box marginLeft={1}>
									<Text color={scopeStyle.color}>{scopeStyle.symbol}</Text>
								</Box>

								{/* Timestamp */}
								<Box marginLeft={1}>
									<Text color={crushTheme.text.secondary}>
										{formatTimestamp(entry.grantedAt)}
									</Text>
								</Box>

								{/* Clear button (if callback provided) */}
								{onClear && (
									<>
										<Box marginLeft={1} />
										<Text bold color={crushTheme.accent.info}>
											[x]
										</Text>
									</>
								)}
							</Box>
						);
					})}
				</Box>
			)}

			{/* Footer with filter indicator */}
			{stats.expired > 0 && (
				<Box marginTop={1} paddingX={1}>
					<Text color={crushTheme.text.secondary} dimColor>
						{stats.expired} expired rule{stats.expired !== 1 ? 's' : ''} (will
						be cleaned up)
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * Compact single-line history summary
 */
export interface PermissionHistorySummaryProps {
	entries: HistoryEntry[];
	visible: boolean;
}

export function PermissionHistorySummary({
	entries,
	visible,
}: PermissionHistorySummaryProps) {
	if (!visible || entries.length === 0) {
		return null;
	}

	const stats = {
		total: entries.length,
		allowed: entries.filter(e => e.decision === 'allow').length,
		denied: entries.filter(e => e.decision === 'deny').length,
	};

	return (
		<Box flexDirection="row">
			<Text color={crushTheme.text.secondary} dimColor>
				[
			</Text>
			<Text color={crushTheme.status.ready}>{stats.allowed}</Text>
			<Text color={crushTheme.text.secondary} dimColor>
				/
			</Text>
			<Text color={crushTheme.status.error}>{stats.denied}</Text>
			<Text color={crushTheme.text.secondary} dimColor>
				] {stats.total} decisions
			</Text>
		</Box>
	);
}

/**
 * Detailed history table view
 */
export interface PermissionHistoryTableProps {
	entries: HistoryEntry[];
	visible: boolean;
	showHeaders?: boolean;
}

export function PermissionHistoryTable({
	entries,
	visible,
	showHeaders = true,
}: PermissionHistoryTableProps) {
	if (!visible || entries.length === 0) {
		return null;
	}

	// Sort by timestamp (newest first)
	const sortedEntries = [...entries].sort((a, b) => b.grantedAt - a.grantedAt);

	return (
		<Box flexDirection="column">
			{showHeaders && (
				<Box
					flexDirection="row"
					borderStyle="single"
					borderColor={crushTheme.bg.elevated}
					paddingX={1}
					marginBottom={1}
				>
					<Text bold color={roleColors.systemLabel}>
						Decision
					</Text>
					<Box marginLeft={2} />
					<Text bold color={roleColors.systemLabel}>
						Tool
					</Text>
					<Box marginLeft={2} />
					<Text bold color={roleColors.systemLabel}>
						Scope
					</Text>
					<Box marginLeft={2} />
					<Text bold color={roleColors.systemLabel}>
						Time
					</Text>
				</Box>
			)}

			{sortedEntries.map(entry => {
				const decisionStyle = DECISION_STYLES[entry.decision];
				const scopeStyle = SCOPE_STYLES[entry.scope];

				return (
					<Box key={entry.id} flexDirection="row" paddingX={1}>
						<Text bold color={decisionStyle.color}>
							{decisionStyle.label}
						</Text>
						<Box marginLeft={2} />
						<Text color={crushTheme.text.primary}>{entry.toolName}</Text>
						<Box marginLeft={2} />
						<Text color={scopeStyle.color}>{getScopeText(entry.scope)}</Text>
						<Box marginLeft={2} />
						<Text color={crushTheme.text.secondary}>
							{formatTimestamp(entry.grantedAt)}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}

export default PermissionHistory;
