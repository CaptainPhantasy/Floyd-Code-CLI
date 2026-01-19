/**
 * AlertTicker Component
 *
 * Animated scrolling alert ribbon for warnings and errors.
 * Displays alerts in a ticker-style animation.
 *
 * Features:
 * - Animated scrolling ticker
 * - Color-coded by severity
 * - Auto-dismiss for temporary alerts
 * - Compact mode for headers
 * - Multiple alert types support
 */

import {useState, useEffect, useMemo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity =
	| 'info'
	| 'warning'
	| 'error'
	| 'critical'
	| 'success';

export type AlertType =
	| 'system'
	| 'network'
	| 'performance'
	| 'security'
	| 'user'
	| 'custom';

export interface Alert {
	/** Unique alert ID */
	id: string;

	/** Alert severity */
	severity: AlertSeverity;

	/** Alert type/category */
	type: AlertType;

	/** Alert message */
	message: string;

	/** Timestamp */
	timestamp: Date;

	/** Auto-dismiss after milliseconds (0 = no auto-dismiss) */
	autoDismiss?: number;

	/** Action callback (if actionable) */
	action?: () => void;

	/** Action label */
	actionLabel?: string;

	/** Additional metadata */
	metadata?: Record<string, unknown>;

	/** Whether alert is active */
	active?: boolean;
}

export interface AlertTickerProps {
	/** Alerts to display */
	alerts?: Alert[];

	/** Update interval in milliseconds */
	interval?: number;

	/** Scroll speed (lower = faster) */
	scrollSpeed?: number;

	/** Enable compact mode */
	compact?: boolean;

	/** Maximum alerts to display */
	maxAlerts?: number;

	/** Filter by severity */
	filterSeverity?: AlertSeverity[];

	/** Filter by type */
	filterType?: AlertType[];

	/** Custom header */
	header?: React.ReactNode;

	/** Show timestamp */
	showTimestamp?: boolean;

	/** Show type indicator */
	showType?: boolean;

	/** Auto-dismiss handled internally */
	handleDismiss?: (alertId: string) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get severity color
 */
function getSeverityColor(severity: AlertSeverity): string {
	switch (severity) {
		case 'info':
			return crushTheme.accent.info;
		case 'warning':
			return crushTheme.status.warning;
		case 'error':
			return crushTheme.status.error;
		case 'critical':
			return crushTheme.extended.sriracha;
		case 'success':
			return crushTheme.status.ready;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: AlertSeverity): string {
	switch (severity) {
		case 'info':
			return 'ⓘ';
		case 'warning':
			return '⚠';
		case 'error':
			return '✕';
		case 'critical':
			return '⚡';
		case 'success':
			return '✓';
		default:
			return '•';
	}
}

/**
 * Get type icon
 */
function getTypeIcon(type: AlertType): string {
	switch (type) {
		case 'system':
			return '◆';
		case 'network':
			return '☍';
		case 'performance':
			return '⚡';
		case 'security':
			return '🔒';
		case 'user':
		case 'custom':
			return '●';
		default:
			return '•';
	}
}

/**
 * Format alert timestamp
 */
function formatAlertTime(date: Date): string {
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * AlertRow - Single alert display row
 */
interface AlertRowProps {
	alert: Alert;
	showTimestamp: boolean;
	showType: boolean;
}

function AlertRow({alert, showTimestamp, showType}: AlertRowProps) {
	const severityColor = getSeverityColor(alert.severity);
	const severityIcon = getSeverityIcon(alert.severity);
	const typeIcon = showType ? getTypeIcon(alert.type) : null;

	return (
		<Box flexDirection="row" gap={1} key={alert.id}>
			{showTimestamp && (
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{formatAlertTime(alert.timestamp)}
				</Text>
			)}

			{typeIcon && <Text color={floydTheme.colors.fgSubtle}>{typeIcon}</Text>}

			<Text color={severityColor}>{severityIcon}</Text>

			<Text color={severityColor}>{alert.message}</Text>

			{alert.actionLabel && (
				<Text color={crushTheme.accent.tertiary} dimColor>
					[{alert.actionLabel}]
				</Text>
			)}
		</Box>
	);
}

/**
 * CompactAlertTicker - Single line ticker for headers
 */
interface CompactAlertTickerProps {
	alerts: Alert[];
	width?: number;
}

export function CompactAlertTicker({
	alerts,
	width = 40,
}: CompactAlertTickerProps) {
	if (alerts.length === 0) {
		return (
			<Box flexDirection="row">
				<Text color={crushTheme.status.ready} dimColor>
					✓ All systems operational
				</Text>
			</Box>
		);
	}

	// Get the most critical alert
	const criticalAlert = alerts.reduce<Alert | undefined>((prev, current) => {
		const severityOrder = ['critical', 'error', 'warning', 'info', 'success'];
		if (!prev) return current;
		return severityOrder.indexOf(current.severity) <
			severityOrder.indexOf(prev.severity)
			? current
			: prev;
	}, undefined);

	if (!criticalAlert) {
		return null;
	}

	const color = getSeverityColor(criticalAlert.severity);
	const icon = getSeverityIcon(criticalAlert.severity);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={color}>{icon}</Text>
			<Text color={color}>
				{criticalAlert.message.length > width - 4
					? criticalAlert.message.substring(0, width - 7) + '...'
					: criticalAlert.message}
			</Text>
			{alerts.length > 1 && (
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					(+{alerts.length - 1})
				</Text>
			)}
		</Box>
	);
}

/**
 * AlertTicker - Main component
 */
export function AlertTicker({
	alerts: propAlerts,
	interval = 1500,
	compact = false,
	maxAlerts = 10,
	filterSeverity,
	filterType,
	header,
	showTimestamp = true,
	showType = false,
	handleDismiss,
}: AlertTickerProps) {
	// Internal state for alerts
	const [alerts, setAlerts] = useState<Alert[]>(propAlerts || []);

	// Update alerts when prop changes
	useEffect(() => {
		if (propAlerts) {
			setAlerts(propAlerts);
		}
	}, [propAlerts]);

	// Filter alerts
	const filteredAlerts = useMemo(() => {
		return alerts.filter(alert => {
			if (
				filterSeverity &&
				filterSeverity.length > 0 &&
				!filterSeverity.includes(alert.severity)
			) {
				return false;
			}
			if (
				filterType &&
				filterType.length > 0 &&
				!filterType.includes(alert.type)
			) {
				return false;
			}
			return alert.active !== false;
		});
	}, [alerts, filterSeverity, filterType]);

	// Auto-dismiss handler
	useEffect(() => {
		const now = Date.now();
		const toDismiss: string[] = [];

		for (const alert of alerts) {
			if (alert.autoDismiss && alert.autoDismiss > 0) {
				const elapsed = now - alert.timestamp.getTime();
				if (elapsed >= alert.autoDismiss) {
					toDismiss.push(alert.id);
				}
			}
		}

		if (toDismiss.length > 0) {
			if (handleDismiss) {
				toDismiss.forEach(id => handleDismiss(id));
			} else {
				setAlerts(prev => prev.filter(a => !toDismiss.includes(a.id)));
			}
		}
	}, [alerts, handleDismiss]);

	// Stats
	const stats = useMemo(() => {
		return {
			critical: filteredAlerts.filter(a => a.severity === 'critical').length,
			error: filteredAlerts.filter(a => a.severity === 'error').length,
			warning: filteredAlerts.filter(a => a.severity === 'warning').length,
			total: filteredAlerts.length,
		};
	}, [filteredAlerts]);

	// Compact mode
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
							Alerts
						</Text>
					</Box>
				)}
				<Box paddingX={1} paddingY={0}>
					<CompactAlertTicker alerts={filteredAlerts} width={60} />
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
							Alert Ticker
						</Text>
						<Text dimColor color={floydTheme.colors.fgMuted}>
							{stats.total} alerts
						</Text>
					</Box>

					<Box flexDirection="row" gap={2}>
						{stats.critical > 0 && (
							<Text color={crushTheme.extended.sriracha}>
								⚡ {stats.critical}
							</Text>
						)}
						{stats.error > 0 && (
							<Text color={crushTheme.status.error}>✕ {stats.error}</Text>
						)}
						{stats.warning > 0 && (
							<Text color={crushTheme.status.warning}>⚠ {stats.warning}</Text>
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
				{filteredAlerts.length === 0 ? (
					<Box paddingY={1}>
						<Text color={crushTheme.status.ready} dimColor>
							✓ No active alerts
						</Text>
					</Box>
				) : (
					filteredAlerts
						.slice(0, maxAlerts)
						.map(alert => (
							<AlertRow
								key={alert.id}
								alert={alert}
								showTimestamp={showTimestamp}
								showType={showType}
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
					{interval}ms refresh
				</Text>
				<Text dimColor color={floydTheme.colors.fgSubtle}>
					{filteredAlerts.length > maxAlerts &&
						`+${filteredAlerts.length - maxAlerts} more`}
				</Text>
			</Box>
		</Box>
	);
}

/**
 * AlertBanner - Full-width alert banner for critical messages
 */
export interface AlertBannerProps {
	/** Alert to display */
	alert: Alert;

	/** On dismiss callback */
	onDismiss?: () => void;

	/** Show dismiss button */
	showDismiss?: boolean;
}

export function AlertBanner({
	alert,
	onDismiss,
	showDismiss = true,
}: AlertBannerProps) {
	const color = getSeverityColor(alert.severity);
	const icon = getSeverityIcon(alert.severity);

	return (
		<Box
			flexDirection="row"
			justifyContent="space-between"
			paddingX={1}
			borderStyle="double"
			borderColor={color}
		>
			<Box flexDirection="row" gap={1}>
				<Text bold color={color}>
					{icon}
				</Text>
				<Text bold color={color}>
					{alert.severity.toUpperCase()}
				</Text>
				<Text color={color}>{alert.message}</Text>
			</Box>

			{showDismiss && onDismiss && (
				<Text color={color} bold>
					[Press to dismiss]
				</Text>
			)}
		</Box>
	);
}

/**
 * AlertSummary - Compact summary of all alerts
 */
export interface AlertSummaryProps {
	alerts: Alert[];

	/** Group by severity */
	groupBySeverity?: boolean;

	/** Show count only */
	showCountOnly?: boolean;
}

export function AlertSummary({
	alerts,
	groupBySeverity = true,
}: AlertSummaryProps) {
	const summary = useMemo(() => {
		if (groupBySeverity) {
			return {
				critical: alerts.filter(a => a.severity === 'critical').length,
				error: alerts.filter(a => a.severity === 'error').length,
				warning: alerts.filter(a => a.severity === 'warning').length,
				info: alerts.filter(a => a.severity === 'info').length,
				success: alerts.filter(a => a.severity === 'success').length,
			};
		}
		return {total: alerts.length};
	}, [alerts, groupBySeverity]);

	if (!groupBySeverity) {
		return (
			<Text
				color={
					(summary.total ?? 0) > 0
						? crushTheme.status.warning
						: crushTheme.status.ready
				}
			>
				{summary.total ?? 0} alerts
			</Text>
		);
	}

	return (
		<Box flexDirection="row" gap={1}>
			{(summary.critical ?? 0) > 0 && (
				<Text color={crushTheme.extended.sriracha}>⚡{summary.critical}</Text>
			)}
			{(summary.error ?? 0) > 0 && (
				<Text color={crushTheme.status.error}>✕{summary.error}</Text>
			)}
			{(summary.warning ?? 0) > 0 && (
				<Text color={crushTheme.status.warning}>⚠{summary.warning}</Text>
			)}
			{(summary.info ?? 0) > 0 && (
				<Text color={crushTheme.accent.info}>ⓘ{summary.info}</Text>
			)}
			{(summary.success ?? 0) > 0 && (
				<Text color={crushTheme.status.ready}>✓{summary.success}</Text>
			)}
		</Box>
	);
}

export default AlertTicker;
