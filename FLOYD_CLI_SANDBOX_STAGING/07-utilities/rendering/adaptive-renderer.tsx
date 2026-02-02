/**
 * Adaptive Renderer for Ink
 *
 * Adapts rendering based on detected terminal capabilities.
 * Automatically adjusts features like colors, Unicode characters, and layout.
 *
 * Features:
 * - Auto-detect terminal capabilities
 * - Fallback to ASCII when needed
 * - Adjust colors based on support level
 * - Responsive layout based on terminal size
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {
	getCapabilities,
	getRenderMode,
	clampToWidth,
	supportsColor as _supportsColor,
	supportsUnicode as _supportsUnicode,
	type RenderMode,
	type TerminalCapabilities,
} from './tty-detector.js';

// ============================================================================
// TYPES
// ============================================================================

export interface AdaptiveRendererProps {
	/** Content to render */
	children: ReactNode;

	/** Force specific render mode (overrides detection) */
	forceMode?: RenderMode;

	/** Custom width constraint */
	width?: number;

	/** Enable/disable features manually */
	features?: {
		color?: boolean;
		unicode?: boolean;
		borders?: boolean;
		animations?: boolean;
	};
}

export interface AdaptiveTextProps {
	/** Text content */
	children: string;

	/** Color to use (respects terminal capabilities) */
	color?: string;

	/** Bold text */
	bold?: boolean;

	/** Dim text */
	dim?: boolean;

	/** Underline text */
	underline?: boolean;

	/** Fallback character for Unicode */
	fallback?: string;
}

export interface AdaptiveBoxProps {
	/** Content */
	children: ReactNode;

	/** Border style */
	borderStyle?: 'single' | 'double' | 'rounded' | 'none';

	/** Border title */
	title?: string;

	/** Padding */
	padding?: number;
}

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

let cachedCapabilities: TerminalCapabilities = getCapabilities();
let cachedRenderMode: RenderMode = getRenderMode();

/**
 * Refresh cached capabilities
 */
export function refreshCapabilities(): void {
	cachedCapabilities = getCapabilities();
	cachedRenderMode = getRenderMode();
}

/**
 * Get current render mode
 */
export function getCurrentRenderMode(): RenderMode {
	return cachedRenderMode;
}

/**
 * Check if a feature is supported
 */
export function isSupported(
	feature: 'color' | 'unicode' | 'borders' | 'animations',
): boolean {
	switch (feature) {
		case 'color':
			return cachedCapabilities.colors > 0;
		case 'unicode':
			return cachedCapabilities.unicode;
		case 'borders':
			return cachedCapabilities.unicode;
		case 'animations':
			return !cachedCapabilities.isCI;
		default:
			return true;
	}
}

/**
 * Get appropriate fallback for Unicode characters
 */
export function getFallback(unicode: string, fallback: string): string {
	return cachedCapabilities.unicode ? unicode : fallback;
}

// ============================================================================
// ADAPTIVE RENDERER COMPONENT
// ============================================================================

/**
 * Adaptive renderer that adjusts content based on terminal capabilities
 */
export function AdaptiveRenderer({
	children,
	forceMode,
	width,
}: AdaptiveRendererProps): ReactNode {
	const renderMode = forceMode ?? cachedRenderMode;
	const effectiveWidth = width ?? clampToWidth(cachedCapabilities.width);

	// In minimal mode, render plain text
	if (renderMode === 'minimal') {
		return (
			<Box width={effectiveWidth}>
				<Text>{children}</Text>
			</Box>
		);
	}

	// In basic mode, use basic colors but no Unicode
	if (renderMode === 'basic') {
		return (
			<Box width={effectiveWidth}>
				<Text>{children}</Text>
			</Box>
		);
	}

	// Full mode - render with all features
	return <Box width={effectiveWidth}>{children}</Box>;
}

// ============================================================================
// ADAPTIVE TEXT COMPONENT
// ============================================================================

/**
 * Text component that adapts to terminal capabilities
 */
export function AdaptiveText({
	children,
	color,
	bold = false,
	dim = false,
	underline = false,
	fallback,
}: AdaptiveTextProps): ReactNode {
	const hasColor = cachedCapabilities.colors > 0;
	const hasUnicode = cachedCapabilities.unicode;

	let textContent = children;

	// Replace Unicode with fallback if needed
	if (fallback && !hasUnicode) {
		// Common Unicode replacements
		const replacements: Record<string, string> = {
			'': '*',
			'—': '-',
			'->': '->',
			'': '<-',
			'': '...',
			'': 'v',
			'': 'x',
			'': '|',
			'': '-',
			'': '+',
			'': '+',
			'': '+',
			'': '+',
		};

		for (const [unicodeChar, asciiChar] of Object.entries(replacements)) {
			textContent = textContent.replaceAll(unicodeChar, asciiChar);
		}
	}

	return (
		<Text
			color={hasColor ? color : undefined}
			bold={bold}
			dimColor={dim}
			underline={underline}
		>
			{textContent}
		</Text>
	);
}

// ============================================================================
// ADAPTIVE BOX COMPONENT
// ============================================================================

/**
 * Box with adaptive borders
 */
export function AdaptiveBox({
	children,
	borderStyle = 'single',
	title,
	padding = 0,
}: AdaptiveBoxProps): ReactNode {
	const hasUnicode = cachedCapabilities.unicode;
	const hasBorders = borderStyle !== 'none' && hasUnicode;

	if (!hasBorders) {
		return <Box paddingX={padding}>{children}</Box>;
	}

	const inkBorderStyle =
		borderStyle === 'rounded'
			? 'round'
			: borderStyle === 'double'
			? 'double'
			: 'single';

	return (
		<Box borderStyle={inkBorderStyle} paddingX={padding}>
			{title && <Text bold>{title}</Text>}
			{children}
		</Box>
	);
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Responsive container that adapts to terminal width
 */
export interface ResponsiveContainerProps {
	children: ReactNode;
	minWidth?: number;
	maxWidth?: number;
	center?: boolean;
}

export function ResponsiveContainer({
	children,
	minWidth = 40,
	maxWidth = 120,
	center = false,
}: ResponsiveContainerProps): ReactNode {
	const terminalWidth = cachedCapabilities.width;
	const effectiveWidth = clampToWidth(terminalWidth, minWidth, maxWidth);

	if (center && terminalWidth > effectiveWidth) {
		const padding = Math.floor((terminalWidth - effectiveWidth) / 2);
		return (
			<Box paddingLeft={padding}>
				<Box width={effectiveWidth}>{children}</Box>
			</Box>
		);
	}

	return <Box width={effectiveWidth}>{children}</Box>;
}

/**
 * Progress bar that adapts to terminal capabilities
 */
export interface AdaptiveProgressBarProps {
	/** Progress value (0-1) */
	progress: number;

	/** Width in characters */
	width?: number;

	/** Label */
	label?: string;

	/** Show percentage */
	showPercentage?: boolean;
}

export function AdaptiveProgressBar({
	progress,
	width: propsWidth,
	label,
	showPercentage = true,
}: AdaptiveProgressBarProps): ReactNode {
	const hasColor = cachedCapabilities.colors > 0;
	const hasUnicode = cachedCapabilities.unicode;
	const width = propsWidth ?? clampToWidth(cachedCapabilities.width - 10);

	const clampedProgress = Math.max(0, Math.min(1, progress));
	const filled = Math.round(clampedProgress * width);
	const empty = width - filled;

	const fillChar = hasUnicode ? '' : '#';
	const emptyChar = hasUnicode ? '' : '-';

	const percentage = Math.round(clampedProgress * 100);

	return (
		<Box flexDirection="row">
			{label && <Text>{label} </Text>}
			<Text backgroundColor={hasColor ? 'green' : undefined}>
				{fillChar.repeat(filled)}
			</Text>
			<Text dimColor>{emptyChar.repeat(empty)}</Text>
			{showPercentage && <Text> {percentage}%</Text>}
		</Box>
	);
}

/**
 * Spinner that adapts to terminal capabilities
 */
export interface AdaptiveSpinnerProps {
	/** Current frame index */
	frame?: number;

	/** Label */
	label?: string;

	/** Spinner type */
	type?: 'dots' | 'line' | 'arrow';
}

export function AdaptiveSpinner({
	frame = 0,
	label,
	type = 'dots',
}: AdaptiveSpinnerProps): ReactNode {
	const hasUnicode = cachedCapabilities.unicode;

	const spinners = {
		dots: hasUnicode
			? ['', '', '', '', '', '', '', '', '', '']
			: ['-', '\\', '|', '/'],
		line: ['-', '\\', '|', '/'],
		arrow: hasUnicode ? ['', '', '', '', '', '', '', ''] : ['<', '^', '>', 'v'],
	};

	const frames = spinners[type] ?? spinners.dots;
	const currentFrame = frames[frame % frames.length];

	return (
		<Text>
			{currentFrame} {label ?? ''}
		</Text>
	);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get current terminal capabilities
 */
export function useCapabilities(): TerminalCapabilities {
	return cachedCapabilities;
}

/**
 * Hook to get current render mode
 */
export function useRenderMode(): RenderMode {
	return cachedRenderMode;
}

/**
 * Hook to check if a feature is supported
 */
export function useFeatureSupport(
	feature: 'color' | 'unicode' | 'borders' | 'animations',
): boolean {
	return isSupported(feature);
}

/**
 * Hook to get clamped width
 */
export function useWidth(maxWidth = 120): number {
	return clampToWidth(cachedCapabilities.width, 40, maxWidth);
}

export default {
	AdaptiveRenderer,
	AdaptiveText,
	AdaptiveBox,
	ResponsiveContainer,
	AdaptiveProgressBar,
	AdaptiveSpinner,
	refreshCapabilities,
	getCurrentRenderMode,
	isSupported,
	getFallback,
	useCapabilities,
	useRenderMode,
	useFeatureSupport,
	useWidth,
};
