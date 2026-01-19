/**
 * GradientHeader Component
 *
 * Header with CRUSH gradient styling (Charple to Dolly).
 * Creates visually striking headers with gradient text effects.
 */

import {useState, useEffect, type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydRoles, floydTheme} from '../../theme/crush-theme.js';
import {getGradient, type GradientName} from '../../theme/gradients.js';

export interface GradientHeaderProps {
	/** Text to display with gradient */
	children: string;

	/** Gradient to use */
	gradient?: GradientName | 'charple-to-dolly' | 'dolly-to-charple';

	/** Size variant */
	size?: 'small' | 'medium' | 'large' | 'xlarge';

	/** Bold text */
	bold?: boolean;

	/** Underline style */
	underline?: 'none' | 'single' | 'double' | 'gradient';

	/** Enable shimmer animation */
	animate?: boolean;

	/** Subtitle text below the header */
	subtitle?: string;

	/** Subtitle color */
	subtitleColor?: string;

	/** Alignment */
	align?: 'left' | 'center' | 'right';

	/** Max width for wrapping */
	maxWidth?: number;

	/** Padding around header */
	padding?: number | {x?: number; y?: number};
}

/**
 * Get font size based on size prop (simulated with visual weight)
 */
function getSizeConfig(size: 'small' | 'medium' | 'large' | 'xlarge'): {
	padding: number;
	underlineChar: string;
} {
	switch (size) {
		case 'small':
			return {padding: 0, underlineChar: '─'};
		case 'medium':
			return {padding: 0, underlineChar: '─'};
		case 'large':
			return {padding: 1, underlineChar: '═'};
		case 'xlarge':
			return {padding: 1, underlineChar: '═'};
	}
}

/**
 * Gradient text renderer
 */
function GradientText({
	text,
	gradient,
	frame = 0,
}: {
	text: string;
	gradient: readonly string[];
	frame?: number;
}): ReactNode {
	return (
		<>
			{Array.from(text).map((char, index) => {
				// Calculate color index based on position and animation frame
				const adjustedIndex = (index + frame) % gradient.length;
				const color = gradient[adjustedIndex % gradient.length];

				// Space for padding between characters
				return (
					<Text key={index} color={color}>
						{char}
					</Text>
				);
			})}
		</>
	);
}

/**
 * Animated gradient header component
 */
export function GradientHeader({
	children,
	gradient = 'charple-to-dolly',
	size = 'large',
	bold = true,
	underline = 'none',
	animate = false,
	subtitle,
	subtitleColor,
	align = 'left',
	padding,
}: GradientHeaderProps) {
	const sizeConfig = getSizeConfig(size);
	const [frame, setFrame] = useState(0);

	// Shimmer animation
	useEffect(() => {
		if (!animate) return;

		const interval = setInterval(() => {
			setFrame(prev => (prev + 1) % 15);
		}, 50);

		return () => clearInterval(interval);
	}, [animate]);

	// Get gradient colors
	const getGradientColors = (): readonly string[] => {
		if (gradient === 'charple-to-dolly') {
			// Charple to Dolly (purple to pink)
			return ['#6B50FF', '#7858FF', '#8B75FF', '#B85CFF', '#FF60FF'];
		}
		if (gradient === 'dolly-to-charple') {
			// Dolly to Charple (pink to purple)
			return ['#FF60FF', '#B85CFF', '#8B75FF', '#7858FF', '#6B50FF'];
		}
		return getGradient(gradient);
	};

	const gradientColors = getGradientColors();
	const finalPadding =
		typeof padding === 'number'
			? {x: padding, y: padding}
			: {x: padding?.x ?? 0, y: padding?.y ?? 0};

	// Calculate underline length
	const underlineLength = children.length + finalPadding.x * 2;

	// Alignment helper
	const alignment = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end',
	}[align] as 'flex-start' | 'center' | 'flex-end';

	return (
		<Box
			flexDirection="column"
			alignItems={alignment}
			paddingX={finalPadding.x}
			paddingY={finalPadding.y}
			width="100%"
		>
			{/* Main header text with gradient */}
			<Box>
				<Text bold={bold}>
					<GradientText
						text={children}
						gradient={gradientColors}
						frame={animate ? frame : 0}
					/>
				</Text>
			</Box>

			{/* Underline */}
			{underline !== 'none' && (
				<Box>
					{underline === 'gradient' ? (
						<>
							{Array.from({length: underlineLength}).map((_, index) => {
								const color = gradientColors[index % gradientColors.length];
								return (
									<Text key={index} color={color}>
										{sizeConfig.underlineChar}
									</Text>
								);
							})}
						</>
					) : (
						<Text color={floydRoles.hint} dimColor>
							{sizeConfig.underlineChar.repeat(underlineLength)}
						</Text>
					)}
				</Box>
			)}

			{/* Subtitle */}
			{subtitle && (
				<Box marginTop={0}>
					<Text color={subtitleColor ?? floydRoles.hint}>{subtitle}</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * BrandHeader - Pre-configured FLOYD brand header
 */
export interface BrandHeaderProps {
	/** Subtitle text */
	subtitle?: string;

	/** Show version info */
	version?: string;

	/** Enable animation */
	animate?: boolean;
}

export function BrandHeader({
	subtitle,
	version = 'v1.0.0',
	animate = false,
}: BrandHeaderProps) {
	return (
		<Box flexDirection="column" alignItems="center" marginBottom={1}>
			<GradientHeader
				gradient="charple-to-dolly"
				size="xlarge"
				bold
				underline="gradient"
				animate={animate}
			>
				FLOYD
			</GradientHeader>
			{subtitle && (
				<Text color={floydRoles.hint} dimColor>
					{subtitle}
				</Text>
			)}
			{version && (
				<Text color={floydRoles.hint} dimColor>
					{' ' + version}
				</Text>
			)}
		</Box>
	);
}

/**
 * SectionHeader - Header for content sections
 */
export interface SectionHeaderProps {
	/** Section title */
	title: string;

	/** Optional badge/icon */
	badge?: string;

	/** Badge color */
	badgeColor?: string;

	/** Show dividing line after header */
	divider?: boolean;
}

export function SectionHeader({
	title,
	badge,
	badgeColor = floydTheme.colors.tertiary,
	divider = true,
}: SectionHeaderProps) {
	return (
		<Box flexDirection="column" width="100%" marginBottom={1}>
			<Box justifyContent="space-between" width="100%">
				<Text bold color={floydRoles.headerTitle}>
					{title}
				</Text>
				{badge && <Text color={badgeColor}>[{badge}]</Text>}
			</Box>
			{divider && (
				<Text color={floydTheme.colors.border} dimColor>
					{'─'.repeat(40)}
				</Text>
			)}
		</Box>
	);
}

/**
 * TypewriterHeader - Header with typewriter animation effect
 */
export interface TypewriterHeaderProps {
	/** Text to type out */
	text: string;

	/** Typing speed in ms per character */
	speed?: number;

	/** Color for the text */
	color?: string;

	/** Show cursor */
	showCursor?: boolean;

	/** Callback when typing completes */
	onComplete?: () => void;
}

export function TypewriterHeader({
	text,
	speed = 50,
	color = floydRoles.headerTitle,
	showCursor = true,
	onComplete,
}: TypewriterHeaderProps) {
	const [displayedText, setDisplayedText] = useState('');
	const [isComplete, setIsComplete] = useState(false);
	const [cursorVisible, setCursorVisible] = useState(true);

	useEffect(() => {
		let index = 0;
		setDisplayedText('');

		const interval = setInterval(() => {
			if (index <= text.length) {
				setDisplayedText(text.substring(0, index));
				index++;
			} else {
				clearInterval(interval);
				setIsComplete(true);
				onComplete?.();
			}
		}, speed);

		return () => clearInterval(interval);
	}, [text, speed]);

	// Cursor blink state
	useEffect(() => {
		const blinkInterval = setInterval(() => {
			setCursorVisible(prev => !prev);
		}, 250);

		return () => clearInterval(blinkInterval);
	}, []);

	return (
		<Box>
			<Text bold color={color}>
				{displayedText}
				{!isComplete && showCursor && cursorVisible && '_'}
			</Text>
		</Box>
	);
}

export default GradientHeader;
