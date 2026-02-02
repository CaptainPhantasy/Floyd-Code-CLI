/**
 * BrowserState Component
 *
 * Chrome extension status and domain permissions display.
 * Shows allow/block status per domain with connection state.
 *
 * Features:
 * - Domain allow/block status
 * - Connection status indicator
 * - Active tabs count
 * - Permission requests queue
 * - Compact mode for status bars
 * - Color-coded domain status
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type BrowserConnectionStatus =
	| 'connected'
	| 'disconnected'
	| 'connecting'
	| 'error';

export type DomainPermission = 'allow' | 'block' | 'pending' | 'unknown';

export interface DomainRule {
	/** Domain name */
	domain: string;

	/** Permission status */
	permission: DomainPermission;

	/** Timestamp of last access */
	lastAccess?: Date;

	/** Access count */
	accessCount?: number;
}

export interface ActiveTab {
	/** Tab ID */
	id: number;

	/** Page title */
	title: string;

	/** Page URL */
	url: string;

	/** Domain */
	domain: string;

	/** Current permission status */
	permission: DomainPermission;

	/** Favicon URL */
	favicon?: string;
}

export interface PermissionRequest {
	/** Request ID */
	id: string;

	/** Domain */
	domain: string;

	/** Tab ID */
	tabId: number;

	/** Timestamp */
	timestamp: Date;

	/** Action being requested */
	action: 'read' | 'write' | 'script' | 'screenshot';
}

export interface BrowserState {
	/** Connection status */
	connectionStatus: BrowserConnectionStatus;

	/** Extension version */
	extensionVersion?: string;

	/** Chrome version */
	chromeVersion?: string;

	/** Domain rules */
	domainRules: DomainRule[];

	/** Active tabs */
	activeTabs: ActiveTab[];

	/** Pending permission requests */
	pendingRequests: PermissionRequest[];

	/** Total tabs open */
	totalTabs?: number;

	/** Last sync timestamp */
	lastSync?: Date;
}

export interface BrowserStateProps {
	/** Browser state data (if not provided, shows placeholder) */
	state?: BrowserState;

	/** Update interval in milliseconds */
	interval?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Show domain rules list */
	showRules?: boolean;

	/** Show active tabs */
	showTabs?: boolean;

	/** Maximum domains to display */
	maxDomains?: number;

	/** Maximum tabs to display */
	maxTabs?: number;

	/** Custom header */
	header?: React.ReactNode;

	/** Show pending requests */
	showRequests?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get connection status color
 */
function getConnectionColor(status: BrowserConnectionStatus): string {
	switch (status) {
		case 'connected':
			return crushTheme.status.ready;
		case 'disconnected':
			return crushTheme.status.offline;
		case 'connecting':
			return crushTheme.status.busy;
		case 'error':
			return crushTheme.status.error;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get connection status icon
 */
function getConnectionIcon(status: BrowserConnectionStatus): string {
	switch (status) {
		case 'connected':
			return '●';
		case 'disconnected':
			return '○';
		case 'connecting':
			return '◐';
		case 'error':
			return '●';
		default:
			return '?';
	}
}

/**
 * Get permission color
 */
function getPermissionColor(permission: DomainPermission): string {
	switch (permission) {
		case 'allow':
			return crushTheme.status.ready;
		case 'block':
			return crushTheme.status.error;
		case 'pending':
			return crushTheme.status.warning;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get permission icon
 */
function getPermissionIcon(permission: DomainPermission): string {
	switch (permission) {
		case 'allow':
			return '✓';
		case 'block':
			return '✕';
		case 'pending':
			return '…';
		default:
			return '?';
	}
}

/**
 * Get action icon
 */
function getActionIcon(action: PermissionRequest['action']): string {
	switch (action) {
		case 'read':
			return '👁';
		case 'write':
			return '✎';
		case 'script':
			return '⚙';
		case 'screenshot':
			return '📷';
		default:
			return '?';
	}
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return url;
	}
}

/**
 * Truncate title for display
 */
function truncateTitle(title: string, maxLength = 30): string {
	if (title.length <= maxLength) return title;
	return title.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * DomainRuleRow - Single domain rule display
 */
interface DomainRuleRowProps {
	rule: DomainRule;
	showAccessCount: boolean;
}

function DomainRuleRow({rule, showAccessCount}: DomainRuleRowProps) {
	const color = getPermissionColor(rule.permission);
	const icon = getPermissionIcon(rule.permission);

	return (
		<Box flexDirection="row" gap={1} key={rule.domain}>
			<Text color={color}>{icon}</Text>
			<Text color={floydTheme.colors.fgBase}>
				{rule.domain.length > 23
					? rule.domain.substring(0, 20) + '...'
					: rule.domain}
			</Text>
			{showAccessCount && rule.accessCount !== undefined && (
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					({rule.accessCount})
				</Text>
			)}
		</Box>
	);
}

/**
 * ActiveTabRow - Single active tab display
 */
interface ActiveTabRowProps {
	tab: ActiveTab;
}

function ActiveTabRow({tab}: ActiveTabRowProps) {
	const color = getPermissionColor(tab.permission);
	const icon = getPermissionIcon(tab.permission);

	return (
		<Box flexDirection="row" gap={1} key={tab.id}>
			<Text color={color}>{icon}</Text>
			<Text color={floydTheme.colors.fgBase}>{truncateTitle(tab.title)}</Text>
			<Text color={floydTheme.colors.fgSubtle} dimColor>
				• {extractDomain(tab.domain)}
			</Text>
		</Box>
	);
}

/**
 * PermissionRequestRow - Pending permission request
 */
interface PermissionRequestRowProps {
	request: PermissionRequest;
}

function PermissionRequestRow({request}: PermissionRequestRowProps) {
	return (
		<Box flexDirection="row" gap={1} key={request.id}>
			<Text color={crushTheme.status.warning}>
				{getActionIcon(request.action)}
			</Text>
			<Text color={crushTheme.text.primary}>{request.domain}</Text>
			<Text color={crushTheme.text.subtle} dimColor>
				{new Date(request.timestamp).toLocaleTimeString()}
			</Text>
		</Box>
	);
}

/**
 * CompactBrowserState - Single line status for header bars
 */
interface CompactBrowserStateProps {
	state: BrowserState;
}

export function CompactBrowserState({state}: CompactBrowserStateProps) {
	const connectionColor = getConnectionColor(state.connectionStatus);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={connectionColor}>
				{getConnectionIcon(state.connectionStatus)}
			</Text>
			<Text color={floydTheme.colors.fgBase}>
				{state.activeTabs.length} tabs
			</Text>
			{state.pendingRequests.length > 0 && (
				<Text color={crushTheme.status.warning}>
					!{state.pendingRequests.length}
				</Text>
			)}
		</Box>
	);
}

/**
 * BrowserState - Main component
 */
export function BrowserState({
	state: propState,
	compact = false,
	showRules = true,
	showTabs = true,
	maxDomains = 8,
	maxTabs = 5,
	header,
	showRequests = true,
}: BrowserStateProps) {
	// Internal state for simulation
	const [state, setState] = useState<BrowserState>(
		propState ?? {
			connectionStatus: 'disconnected',
			domainRules: [],
			activeTabs: [],
			pendingRequests: [],
		},
	);

	// Update state when prop changes
	useEffect(() => {
		if (propState) {
			setState(propState);
		}
	}, [propState]);

	// Stats
	const stats = useMemo(() => {
		const allowed = state.domainRules.filter(
			r => r.permission === 'allow',
		).length;
		const blocked = state.domainRules.filter(
			r => r.permission === 'block',
		).length;
		return {
			allowed,
			blocked,
			total: state.domainRules.length,
		};
	}, [state]);

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
							Browser
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<CompactBrowserState state={state} />
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
							Browser State
						</Text>
						<Box flexDirection="row" gap={1}>
							<Text color={getConnectionColor(state.connectionStatus)}>
								{getConnectionIcon(state.connectionStatus)}
							</Text>
							<Text color={floydTheme.colors.fgMuted}>
								{state.connectionStatus}
							</Text>
						</Box>
					</Box>

					<Box flexDirection="row" gap={2}>
						{state.extensionVersion && (
							<Text dimColor color={floydTheme.colors.fgSubtle}>
								v{state.extensionVersion}
							</Text>
						)}
						<Text color={floydTheme.colors.fgMuted}>
							{state.activeTabs.length} tabs
						</Text>
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
				{/* Domain rules */}
				{showRules && state.domainRules.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Box flexDirection="row" gap={1} marginBottom={0}>
							<Text bold color={floydTheme.colors.fgMuted}>
								Domain Rules
							</Text>
							<Text dimColor color={floydTheme.colors.fgSubtle}>
								({stats.allowed} allowed, {stats.blocked} blocked)
							</Text>
						</Box>

						{state.domainRules.slice(0, maxDomains).map(rule => (
							<DomainRuleRow key={rule.domain} rule={rule} showAccessCount />
						))}
					</Box>
				)}

				{/* Active tabs */}
				{showTabs && state.activeTabs.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Box flexDirection="row" gap={1} marginBottom={0}>
							<Text bold color={floydTheme.colors.fgMuted}>
								Active Tabs
							</Text>
							<Text dimColor color={floydTheme.colors.fgSubtle}>
								({state.activeTabs.length}
								{state.totalTabs && state.totalTabs > state.activeTabs.length
									? ` / ${state.totalTabs} total`
									: ''}
								)
							</Text>
						</Box>

						{state.activeTabs.slice(0, maxTabs).map(tab => (
							<ActiveTabRow key={tab.id} tab={tab} />
						))}
					</Box>
				)}

				{/* Pending requests */}
				{showRequests && state.pendingRequests.length > 0 && (
					<Box flexDirection="column">
						<Box flexDirection="row" gap={1} marginBottom={0}>
							<Text bold color={crushTheme.status.warning}>
								Pending Requests
							</Text>
							<Text dimColor color={crushTheme.text.subtle}>
								({state.pendingRequests.length})
							</Text>
						</Box>

						{state.pendingRequests.map(request => (
							<PermissionRequestRow key={request.id} request={request} />
						))}
					</Box>
				)}

				{/* Empty state */}
				{state.domainRules.length === 0 &&
					state.activeTabs.length === 0 &&
					state.pendingRequests.length === 0 && (
						<Box paddingY={1}>
							<Text color={floydTheme.colors.fgMuted} dimColor>
								{state.connectionStatus === 'connected'
									? 'No browser activity'
									: 'Browser disconnected'}
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
					{state.domainRules.length} domains
				</Text>
				{state.lastSync && (
					<Text dimColor color={floydTheme.colors.fgSubtle}>
						Synced {new Date(state.lastSync).toLocaleTimeString()}
					</Text>
				)}
			</Box>
		</Box>
	);
}

/**
 * DomainPermissionToggle - Toggle for domain permissions
 */
export interface DomainPermissionToggleProps {
	/** Domain name */
	domain: string;

	/** Current permission */
	permission: DomainPermission;

	/** On toggle callback */
	onToggle?: (permission: DomainPermission) => void;

	/** Show label */
	showLabel?: boolean;
}

export function DomainPermissionToggle({
	domain,
	permission,
	showLabel = true,
}: DomainPermissionToggleProps) {
	const color = getPermissionColor(permission);
	const icon = getPermissionIcon(permission);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={color}>{icon}</Text>
			{showLabel && (
				<Text color={color}>
					{domain.length > 20 ? domain.substring(0, 17) + '...' : domain}
				</Text>
			)}
		</Box>
	);
}

/**
 * BrowserConnectionIndicator - Animated connection status
 */
export interface BrowserConnectionIndicatorProps {
	/** Connection status */
	status: BrowserConnectionStatus;

	/** Show text label */
	showLabel?: boolean;
}

export function BrowserConnectionIndicator({
	status,
	showLabel = true,
}: BrowserConnectionIndicatorProps) {
	const color = getConnectionColor(status);
	const icon = getConnectionIcon(status);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={color}>{icon}</Text>
			{showLabel && (
				<Text color={color}>
					{status === 'connected' && 'Connected'}
					{status === 'disconnected' && 'Disconnected'}
					{status === 'connecting' && 'Connecting...'}
					{status === 'error' && 'Connection Error'}
				</Text>
			)}
		</Box>
	);
}

export default BrowserState;
