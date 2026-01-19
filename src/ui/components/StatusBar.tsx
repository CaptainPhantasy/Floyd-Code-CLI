/**
 * StatusBar Component
 *
 * Status bar for displaying system state, keybindings, and metadata.
 * Renders at the bottom or top of the CLI interface.
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

export interface StatusItem {
	/** Item label or icon */
	label?: string;

	/** Item value or content */
	value: ReactNode;

	/** Color for this item */
	color?: string;

	/** Dim the item */
	dim?: boolean;

	/** Item alignment within its section */
	align?: 'left' | 'center' | 'right';
}

export interface StatusBarProps {
	/** Left section items */
	left?: Array<StatusItem | ReactNode>;

	/** Center section items */
	center?: Array<StatusItem | ReactNode>;

	/** Right section items */
	right?: Array<StatusItem | ReactNode>;

	/** Status bar position */
	position?: 'top' | 'bottom';

	/** Border style */
	borderStyle?: 'single' | 'double' | 'round';

	/** Show border */
	showBorder?: boolean;

	/** Background color */
	backgroundColor?: string;

	/** Text color */
	textColor?: string;

	/** Separator between sections */
	separator?: string;

	/** Full width */
	width?: number | '100%';

	/** Padding */
	padding?: number;

	/** Compact mode (smaller padding) */
	compact?: boolean;
}

/**
 * Normalize status items to StatusItem objects
 */
function normalizeItem(item: StatusItem | ReactNode): StatusItem {
	if (typeof item === 'object' && item !== null && 'value' in item) {
		return item as StatusItem;
	}
	return {value: item as ReactNode};
}

/**
 * Render a status item
 */
function renderItem(
	item: StatusItem,
	defaultColor: string,
	defaultDim: boolean,
): ReactNode {
	const normalized = normalizeItem(item);
	const color = normalized.color ?? defaultColor;
	const dim = normalized.dim ?? defaultDim;

	return (
		<Text color={color} dimColor={dim}>
			{normalized.label && <Text bold>{normalized.label}: </Text>}
			{normalized.value}
		</Text>
	);
}

/**
 * StatusBar component
 */
export function StatusBar({
	left = [],
	center = [],
	right = [],
	borderStyle = 'single',
	showBorder = true,
	textColor = floydTheme.colors.fgBase,
	separator = ' │ ',
	width = '100%',
	padding = 1,
	compact = false,
}: StatusBarProps) {
	const actualPadding = compact ? 0 : padding;

	// Render items with separators
	const renderSection = (items: Array<StatusItem | ReactNode>): ReactNode => {
		if (items.length === 0) return null;

		return (
			<Box flexDirection="row" gap={0}>
				{items.map((item, index) => (
					<Box key={index}>
						{renderItem(normalizeItem(item), textColor, false)}
						{index < items.length - 1 && (
							<Text color={floydTheme.colors.fgMuted} dimColor>
								{separator}
							</Text>
						)}
					</Box>
				))}
			</Box>
		);
	};

	return (
		<Box
			width={width}
			flexDirection="column"
			borderStyle={showBorder ? borderStyle : undefined}
			borderColor={showBorder ? floydTheme.colors.border : undefined}
			paddingX={actualPadding}
			paddingY={compact ? 0 : actualPadding}
		>
			<Box justifyContent="space-between" width="100%">
				{/* Left section */}
				<Box flexGrow={1}>{renderSection(left)}</Box>

				{/* Center section */}
				<Box flexGrow={0} flexShrink={0}>
					{renderSection(center)}
				</Box>

				{/* Right section */}
				<Box flexGrow={1} justifyContent="flex-end">
					{renderSection(right)}
				</Box>
			</Box>
		</Box>
	);
}

/**
 * KeybindingStatusBar - Pre-configured status bar for keybindings
 */
export interface KeybindingStatusBarProps {
	/** Keybindings to display */
	bindings: Array<{
		key: string;
		description: string;
	}>;

	/** Additional status items */
	extraItems?: Array<StatusItem | ReactNode>;

	/** Position */
	position?: 'top' | 'bottom';
}

export function KeybindingStatusBar({
	bindings,
	extraItems = [],
	position = 'bottom',
}: KeybindingStatusBarProps) {
	// Convert bindings to status items
	const bindingItems: StatusItem[] = bindings.map(b => ({
		label: b.key,
		value: b.description,
		color: floydTheme.colors.fgMuted,
		dim: true,
	}));

	return (
		<StatusBar
			left={bindingItems}
			right={extraItems}
			position={position}
			compact={true}
		/>
	);
}

/**
 * ProgressStatusBar - Status bar with progress indicator
 */
export interface ProgressStatusBarProps {
	/** Current progress (0-100) */
	progress: number;

	/** Progress label */
	label?: string;

	/** Status message */
	message?: string;

	/** Items to show on the right */
	rightItems?: Array<StatusItem | ReactNode>;
}

export function ProgressStatusBar({
	progress,
	label = 'Progress',
	message,
	rightItems = [],
}: ProgressStatusBarProps) {
	// Calculate bar width
	const barWidth = 20;
	const filledWidth = Math.round((progress / 100) * barWidth);
	const filled = '█'.repeat(filledWidth);
	const empty = '░'.repeat(barWidth - filledWidth);

	// Progress bar with color based on completion
	const progressColor =
		progress >= 100 ? floydTheme.colors.success : floydRoles.thinking;

	return (
		<StatusBar
			left={[
				{
					label,
					value: (
						<Box flexDirection="row" gap={1}>
							<Text color={progressColor}>{filled}</Text>
							<Text dimColor color={floydTheme.colors.fgMuted}>
								{empty}
							</Text>
							<Text bold color={progressColor}>
								{progress}%
							</Text>
						</Box>
					),
				},
				message && {
					value: message,
					dim: true,
					color: floydTheme.colors.fgMuted,
				},
			].filter(Boolean)}
			right={rightItems}
			position="bottom"
			compact={true}
		/>
	);
}

/**
 * SessionStatusBar - Status bar showing session info
 */
export interface SessionStatusBarProps {
	/** Session ID (shortened) */
	sessionId?: string;

	/** Model name */
	model?: string;

	/** Token usage */
	tokensUsed?: number;

	/** Token limit */
	tokenLimit?: number;

	/** Connection status */
	connected?: boolean;

	/** Current working directory */
	cwd?: string;
}

export function SessionStatusBar({
	sessionId,
	model = 'GLM-4.7',
	tokensUsed,
	tokenLimit,
	connected = true,
	cwd,
}: SessionStatusBarProps) {
	// Calculate token percentage
	const tokenPercent =
		tokenLimit && tokensUsed !== undefined
			? Math.round((tokensUsed / tokenLimit) * 100)
			: null;

	const tokenColor =
		tokenPercent !== null && tokenPercent > 80
			? floydTheme.colors.error
			: tokenPercent !== null && tokenPercent > 50
			? floydTheme.colors.warning
			: floydTheme.colors.fgMuted;

	return (
		<StatusBar
			left={[
				{label: 'FLOYD', value: model, color: floydRoles.headerTitle},
				sessionId && {
					value: sessionId.slice(0, 8),
					dim: true,
					color: floydTheme.colors.fgMuted,
				},
			].filter(Boolean)}
			center={[
				cwd && {
					value: cwd.length > 30 ? '...' + cwd.slice(-27) : cwd,
					dim: true,
					color: floydTheme.colors.fgMuted,
				},
			].filter(Boolean)}
			right={[
				{
					label: '●',
					value: connected ? 'Connected' : 'Offline',
					color: connected
						? floydTheme.colors.success
						: floydTheme.colors.error,
				},
				tokensUsed !== undefined &&
					tokenLimit !== undefined && {
						label: 'Tokens',
						value: `${tokensUsed.toLocaleString()} / ${tokenLimit.toLocaleString()}`,
						color: tokenColor,
					},
			].filter(Boolean)}
			position="bottom"
			compact={true}
		/>
	);
}

/**
 * MinimalStatusBar - Simple minimal status bar
 */
export interface MinimalStatusBarProps {
	/** Left content */
	left?: string;

	/** Right content */
	right?: string;

	/** Center content */
	center?: string;
}

export function MinimalStatusBar({left, right, center}: MinimalStatusBarProps) {
	return (
		<Box
			width="100%"
			paddingX={1}
			borderStyle="single"
			borderColor={floydTheme.colors.border}
		>
			<Box justifyContent="space-between" width="100%">
				{left && <Text dimColor>{left}</Text>}
				{center && <Text color={floydRoles.headerTitle}>{center}</Text>}
				{right && <Text dimColor>{right}</Text>}
			</Box>
		</Box>
	);
}

export default StatusBar;
