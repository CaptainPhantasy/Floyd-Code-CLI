/**
 * WorkerBadge Component
 *
 * Status pills with animation for agent worker states.
 * Displays compact status indicators for agent workers, tools, and system state.
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

export type WorkerStatus =
	| 'idle'
	| 'active'
	| 'busy'
	| 'thinking'
	| 'waiting'
	| 'success'
	| 'error'
	| 'offline'
	| 'connecting';

export type WorkerVariant =
	| 'default'
	| 'subtle'
	| 'filled'
	| 'outline'
	| 'glow';

export interface WorkerBadgeProps {
	/** Status to display */
	status?: WorkerStatus;

	/** Label text (overrides default status label) */
	label?: string;

	/** Visual variant */
	variant?: WorkerVariant;

	/** Size of the badge */
	size?: 'small' | 'medium' | 'large';

	/** Show icon indicator */
	showIcon?: boolean;

	/** Custom icon */
	icon?: string;

	/** Custom color (overrides status color) */
	color?: string;

	/** Additional content after the badge */
	suffix?: ReactNode;

	/** Display inline with other content */
	inline?: boolean;
}

/**
 * Get status config (color, label, icon)
 */
function getStatusConfig(status: WorkerStatus): {
	color: string;
	label: string;
	icon: string;
} {
	switch (status) {
		case 'idle':
			return {
				color: floydTheme.colors.fgMuted,
				label: 'Idle',
				icon: '○',
			};
		case 'active':
			return {
				color: floydTheme.colors.tertiary,
				label: 'Active',
				icon: '●',
			};
		case 'busy':
			return {
				color: floydRoles.thinking,
				label: 'Busy',
				icon: '◉',
			};
		case 'thinking':
			return {
				color: floydRoles.thinking,
				label: 'Thinking',
				icon: '⟳',
			};
		case 'waiting':
			return {
				color: floydTheme.colors.warning,
				label: 'Waiting',
				icon: '…',
			};
		case 'success':
			return {
				color: floydTheme.colors.success,
				label: 'Success',
				icon: '✓',
			};
		case 'error':
			return {
				color: floydTheme.colors.error,
				label: 'Error',
				icon: '✕',
			};
		case 'offline':
			return {
				color: floydTheme.colors.fgSubtle,
				label: 'Offline',
				icon: '⊘',
			};
		case 'connecting':
			return {
				color: floydTheme.colors.info,
				label: 'Connecting',
				icon: '⇌',
			};
		default:
			return {
				color: floydTheme.colors.fgMuted,
				label: 'Unknown',
				icon: '?',
			};
	}
}

/**
 * Get padding based on size
 */
function getSizePadding(size: 'small' | 'medium' | 'large'): number {
	switch (size) {
		case 'small':
			return 0;
		case 'medium':
			return 1;
		case 'large':
			return 2;
	}
}

/**
 * Worker status badge with animation
 */
export function WorkerBadge({
	status = 'idle',
	label,
	variant = 'default',
	size = 'medium',
	showIcon = true,
	icon,
	color,
	suffix,
	inline = false,
}: WorkerBadgeProps) {
	const config = getStatusConfig(status);
	const finalColor = color ?? config.color;
	const finalLabel = label ?? config.label;
	const finalIcon = icon ?? config.icon;
	const padding = getSizePadding(size);

	// Render based on variant
	const renderBadge = () => {
		switch (variant) {
			case 'filled': {
				return (
					<Box>
						<Text backgroundColor={finalColor} bold>
							{' '}
							{showIcon && finalIcon + ' '}
							{finalLabel}{' '}
						</Text>
						{suffix && ' ' + suffix}
					</Box>
				);
			}

			case 'outline': {
				return (
					<Box borderStyle="round" borderColor={finalColor} paddingX={padding}>
						<Text color={finalColor}>
							{showIcon && finalIcon + ' '}
							{finalLabel}
						</Text>
						{suffix && ' '}
						{suffix}
					</Box>
				);
			}

			case 'subtle': {
				return (
					<Box paddingX={padding}>
						<Text color={finalColor} dimColor>
							{showIcon && finalIcon + ' '}
							{finalLabel}
						</Text>
						{suffix && ' '}
						{suffix}
					</Box>
				);
			}

			case 'glow': {
				// Simulated glow with brightness
				return (
					<Box paddingX={padding}>
						<Text bold color={finalColor}>
							{status === 'thinking' && <Spinner type="dots" />}
							{status !== 'thinking' && showIcon && finalIcon + ' '}
							{finalLabel}
						</Text>
						{suffix && ' '}
						{suffix}
					</Box>
				);
			}

			case 'default':
			default: {
				return (
					<Box paddingX={padding}>
						<Text color={finalColor}>
							{status === 'thinking' && <Spinner type="dots" />}
							{status !== 'thinking' && showIcon && finalIcon + ' '}
							{status !== 'thinking' && finalLabel}
							{status === 'thinking' && ' ' + finalLabel}
						</Text>
						{suffix && ' '}
						{suffix}
					</Box>
				);
			}
		}
	};

	return <Box flexDirection={inline ? 'row' : 'column'}>{renderBadge()}</Box>;
}

/**
 * WorkerBadgeGroup - Group of related badges
 */
export interface WorkerBadgeGroupProps {
	/** Array of badge configs */
	badges: Array<{
		status: WorkerStatus;
		label?: string;
		icon?: string;
		color?: string;
	}>;

	/** Separator between badges */
	separator?: string;

	/** Size for all badges */
	size?: 'small' | 'medium' | 'large';
}

export function WorkerBadgeGroup({
	badges,
	separator = ' • ',
	size = 'small',
}: WorkerBadgeGroupProps) {
	return (
		<Box flexDirection="row" gap={1}>
			{badges.map((badge, index) => (
				<Box key={index} flexDirection="row">
					<WorkerBadge
						status={badge.status}
						label={badge.label}
						icon={badge.icon}
						color={badge.color}
						size={size}
						variant="subtle"
						showIcon={false}
						inline={false}
					/>
					{index < badges.length - 1 && (
						<Text color={floydTheme.colors.fgSubtle}>{separator}</Text>
					)}
				</Box>
			))}
		</Box>
	);
}

/**
 * StatusRow - Horizontal status bar with multiple badges
 */
export interface StatusRowProps {
	/** Left side badges */
	leftBadges?: Array<{status: WorkerStatus; label?: string}>;

	/** Right side badges */
	rightBadges?: Array<{status: WorkerStatus; label?: string}>;

	/** Border style */
	borderStyle?: 'single' | 'double' | 'none';
}

export function StatusRow({
	leftBadges = [],
	rightBadges = [],
	borderStyle = 'none',
}: StatusRowProps) {
	return (
		<Box
			width="100%"
			paddingX={1}
			borderStyle={borderStyle === 'none' ? undefined : borderStyle}
			borderColor={floydTheme.colors.border}
			justifyContent="space-between"
		>
			{/* Left side */}
			<Box flexDirection="row" gap={1}>
				{leftBadges.map((badge, index) => (
					<WorkerBadge
						key={index}
						status={badge.status}
						label={badge.label}
						size="small"
						variant="subtle"
						showIcon={true}
						inline={false}
					/>
				))}
			</Box>

			{/* Right side */}
			<Box flexDirection="row" gap={1}>
				{rightBadges.map((badge, index) => (
					<WorkerBadge
						key={index}
						status={badge.status}
						label={badge.label}
						size="small"
						variant="subtle"
						showIcon={true}
						inline={false}
					/>
				))}
			</Box>
		</Box>
	);
}

/**
 * CompactBadge - Minimal inline status indicator
 */
export interface CompactBadgeProps {
	status: WorkerStatus;
	showLabel?: boolean;
}

export function CompactBadge({status, showLabel = false}: CompactBadgeProps) {
	const config = getStatusConfig(status);

	return (
		<Text color={config.color}>
			{config.icon}
			{showLabel && ' ' + config.label}
		</Text>
	);
}

export default WorkerBadge;
