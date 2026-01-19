/**
 * ProgressRing Component
 *
 * Circular progress indicators for the CLI.
 * Simulates circular progress using ASCII characters and animation.
 */

import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';
import {type GradientName} from '../../theme/gradients.js';

export interface ProgressRingProps {
	/** Progress value (0-100) */
	progress: number;

	/** Size of the ring */
	size?: 'small' | 'medium' | 'large';

	/** Show percentage text */
	showPercentage?: boolean;

	/** Custom color */
	color?: string;

	/** Gradient for colored progress */
	gradient?: GradientName;

	/** Enable animation on load */
	animate?: boolean;

	/** Label displayed below the ring */
	label?: string;

	/** Label color */
	labelColor?: string;

	/** Custom width (overrides size) */
	width?: number;
}

/**
 * Progress indicator characters (filling the ring)
 */
const progressChars = ['○', '◔', '◑', '◕', '●'];

/**
 * Get ring size in characters
 */
function getRingSize(size: 'small' | 'medium' | 'large'): number {
	switch (size) {
		case 'small':
			return 1;
		case 'medium':
			return 2;
		case 'large':
			return 3;
	}
}

/**
 * Simple horizontal progress bar (more reliable for terminals)
 */
function drawProgressBar(
	progress: number,
	width: number,
	filledColor: string,
	emptyColor: string,
): Array<{char: string; color: string}> {
	const result: Array<{char: string; color: string}> = [];
	const normalizedProgress = Math.max(0, Math.min(100, progress)) / 100;
	const filledWidth = Math.round(width * normalizedProgress);

	// Draw bar with rounded corners
	result.push({char: '╭', color: filledColor});

	for (let i = 0; i < width - 2; i++) {
		if (i < filledWidth - 1) {
			result.push({char: '─', color: filledColor});
		} else {
			result.push({char: '─', color: emptyColor});
		}
	}

	result.push({char: '╮', color: filledColor});

	return result;
}

/**
 * Draw a compact circular progress indicator
 */
function drawCompactRing(progress: number): {char: string; color: string} {
	const normalizedProgress = Math.max(0, Math.min(100, progress)) / 100;
	const charIndex = Math.min(4, Math.floor(normalizedProgress * 5));
	const color: string =
		normalizedProgress >= 1
			? floydTheme.colors.success
			: String(floydRoles.thinking);

	return {
		char: (progressChars[charIndex] ?? progressChars[0]) as string,
		color,
	};
}

/**
 * ProgressRing component
 */
export function ProgressRing({
	progress,
	size = 'medium',
	showPercentage = false,
	color,
	animate = true,
	label,
	labelColor,
	width,
}: ProgressRingProps) {
	const [displayedProgress, setDisplayedProgress] = useState(
		animate ? 0 : progress,
	);

	// Animate progress on mount/update
	useEffect(() => {
		if (!animate) {
			setDisplayedProgress(progress);
			return;
		}

		const targetProgress = progress;
		const diff = targetProgress - displayedProgress;

		if (Math.abs(diff) < 1) {
			setDisplayedProgress(targetProgress);
			return;
		}

		const step = diff > 0 ? 1 : -1;
		const interval = setInterval(() => {
			setDisplayedProgress(prev => {
				const newProgress = prev + step;
				if (
					(step > 0 && newProgress >= targetProgress) ||
					(step < 0 && newProgress <= targetProgress)
				) {
					clearInterval(interval);
					return targetProgress;
				}
				return newProgress;
			});
		}, 16);

		return () => clearInterval(interval);
	}, [progress, animate]);

	const finalColor: string =
		color ??
		(displayedProgress >= 100
			? floydTheme.colors.success
			: String(floydRoles.thinking));
	const ringWidth = width ?? getRingSize(size) * 4 + 2;

	return (
		<Box flexDirection="column" alignItems="center">
			{/* Progress indicator */}
			{size === 'small' ? (
				// Compact version - single character
				<Box flexDirection="row" gap={1}>
					<Text color={finalColor}>
						{drawCompactRing(displayedProgress).char}
					</Text>
					{showPercentage && (
						<Text color={finalColor}>{Math.round(displayedProgress)}%</Text>
					)}
				</Box>
			) : (
				// Bar version (more reliable in terminal)
				<Box flexDirection="row" gap={1}>
					{drawProgressBar(
						displayedProgress,
						ringWidth,
						finalColor,
						floydTheme.colors.border,
					).map((item, index) => (
						<Text key={index} color={item.color}>
							{item.char}
						</Text>
					))}
					{showPercentage && (
						<Text color={finalColor}>
							{' ' + Math.round(displayedProgress) + '%'}
						</Text>
					)}
				</Box>
			)}

			{/* Label */}
			{label && (
				<Box marginTop={0}>
					<Text color={labelColor ?? floydTheme.colors.fgMuted}>{label}</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * SpinnerRing - Animated loading ring
 */
export interface SpinnerRingProps {
	/** Label shown with the spinner */
	label?: string;

	/** Color of the spinner */
	color?: string;

	/** Size of the spinner */
	size?: 'small' | 'medium' | 'large';
}

export function SpinnerRing({
	label,
	color = floydRoles.thinking,
}: SpinnerRingProps) {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setFrame(prev => (prev + 1) % 4);
		}, 100);

		return () => clearInterval(interval);
	}, []);

	const spinChars = ['|', '/', '-', '\\'];
	const char = spinChars[frame];

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={color}>{char}</Text>
			{label && <Text color={color}>{label}</Text>}
		</Box>
	);
}

/**
 * CircularProgress - Animated circular progress with stages
 */
export interface CircularProgressProps {
	/** Current stage label */
	stage: string;

	/** Array of stages to display */
	stages: Array<{name: string; complete: boolean}>;

	/** Overall progress (0-100) */
	progress: number;
}

export function CircularProgress({
	stage,
	stages,
	progress,
}: CircularProgressProps) {
	return (
		<Box flexDirection="column" width={40}>
			{/* Progress bar */}
			<Box marginBottom={1}>
				<ProgressRing progress={progress} size="medium" showPercentage />
			</Box>

			{/* Current stage */}
			<Box marginBottom={1}>
				<Text color={floydRoles.thinking}>{stage}</Text>
			</Box>

			{/* Stage list */}
			{stages.map((s, index) => (
				<Box key={index} flexDirection="row" gap={1}>
					<Text
						color={
							s.complete ? floydTheme.colors.success : floydTheme.colors.fgMuted
						}
					>
						{s.complete ? '✓' : '○'}
					</Text>
					<Text
						color={
							s.complete ? floydTheme.colors.fgBase : floydTheme.colors.fgMuted
						}
						dimColor={!s.complete}
					>
						{s.name}
					</Text>
				</Box>
			))}
		</Box>
	);
}

/**
 * CompactProgressRing - Minimal circular progress indicator
 *
 * A lightweight variant showing just the progress character with optional percentage.
 * Uses Unicode circle characters for a clean, minimal display.
 */
export interface CompactProgressRingProps {
	/** Progress value (0-100) */
	progress: number;

	/** Show percentage text next to ring */
	showPercentage?: boolean;

	/** Custom color */
	color?: string;

	/** Label displayed below the ring */
	label?: string;

	/** Label color */
	labelColor?: string;
}

export function CompactProgressRing({
	progress,
	showPercentage = false,
	color,
	label,
	labelColor,
}: CompactProgressRingProps) {
	const compactRing = drawCompactRing(progress);
	const ringColor: string = color ?? compactRing.color;

	return (
		<Box flexDirection="column" alignItems="center">
			{/* Compact circular progress indicator */}
			<Box flexDirection="row" gap={1}>
				<Text color={ringColor}>{compactRing.char}</Text>
				{showPercentage && (
					<Text color={ringColor}>{Math.round(progress)}%</Text>
				)}
			</Box>

			{/* Label */}
			{label && (
				<Box marginTop={0}>
					<Text color={labelColor ?? floydTheme.colors.fgMuted}>{label}</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * MultiProgress - Multiple progress bars stacked
 */
export interface MultiProgressProps {
	/** Array of progress items */
	items: Array<{
		label: string;
		progress: number;
		color?: string;
	}>;

	/** Show percentage for each item */
	showPercentage?: boolean;
}

export function MultiProgress({
	items,
	showPercentage = true,
}: MultiProgressProps) {
	return (
		<Box flexDirection="column" gap={0}>
			{items.map((item, index) => (
				<Box key={index} flexDirection="column" marginBottom={1}>
					{/* Label row */}
					<Box justifyContent="space-between" width={40}>
						<Text color={floydTheme.colors.fgBase}>{item.label}</Text>
						{showPercentage && (
							<Text color={item.color ?? floydTheme.colors.fgSelected}>
								{Math.round(item.progress)}%
							</Text>
						)}
					</Box>

					{/* Progress bar */}
					<Box>
						{drawProgressBar(
							item.progress,
							40,
							item.color ?? floydRoles.thinking,
							floydTheme.colors.border,
						).map((barItem, barIndex) => (
							<Text key={barIndex} color={barItem.color}>
								{barItem.char}
							</Text>
						))}
					</Box>
				</Box>
			))}
		</Box>
	);
}

export default ProgressRing;
