/**
 * AnimatedBox Component
 *
 * Box with animation support for the Ink CLI.
 * Provides various animation effects like pulse, shake, and blink.
 */

import {useState, useEffect, type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydRoles, floydTheme} from '../../theme/crush-theme.js';
import {type AnimationPreset} from '../../theme/animations.js';

export interface AnimatedBoxProps {
	/** Content inside the box */
	children?: ReactNode;

	/** Animation type */
	animation?:
		| AnimationPreset
		| 'pulse'
		| 'thinking'
		| 'loading'
		| 'glitch'
		| 'none';

	/** Animation speed */
	speed?: 'fast' | 'normal' | 'slow';

	/** Primary color for animations */
	color?: string;

	/** Secondary color for gradient animations */
	secondaryColor?: string;

	/** Border style */
	borderStyle?: 'single' | 'double' | 'round' | 'bold';

	/** Show border */
	showBorder?: boolean;

	/** Box width */
	width?: number | '100%';

	/** Box padding */
	padding?: number;

	/** Auto-start animation on mount */
	animate?: boolean;

	/** Custom animation interval in ms */
	interval?: number;
}

/**
 * Pulse animation state
 */
function usePulseAnimation(enabled: boolean, interval = 500) {
	const [opacity, setOpacity] = useState(1);

	useEffect(() => {
		if (!enabled) return;

		const timer = setInterval(() => {
			setOpacity(prev => (prev === 1 ? 0.5 : 1));
		}, interval);

		return () => clearInterval(timer);
	}, [enabled, interval]);

	return opacity;
}

/**
 * Color cycling animation for gradient effects
 */
function useColorAnimation(enabled: boolean, colors: string[], interval = 100) {
	const [colorIndex, setColorIndex] = useState(0);

	useEffect(() => {
		if (!enabled) return;

		const timer = setInterval(() => {
			setColorIndex(prev => (prev + 1) % colors.length);
		}, interval);

		return () => clearInterval(timer);
	}, [enabled, interval, colors.length]);

	return colors[colorIndex];
}

/**
 * Loading spinner animation
 */
function useLoadingAnimation(enabled: boolean) {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		if (!enabled) return;

		const timer = setInterval(() => {
			setFrame(prev => (prev + 1) % 4);
		}, 100);

		return () => clearInterval(timer);
	}, [enabled]);

	const spinChars = ['|', '/', '-', '\\'] as const;
	return spinChars[frame];
}

/**
 * AnimatedBox component
 */
export function AnimatedBox({
	children,
	animation = 'none',
	speed = 'normal',
	color,
	secondaryColor,
	borderStyle = 'single',
	showBorder = true,
	width = '100%',
	padding = 1,
	animate = true,
	interval: customInterval,
}: AnimatedBoxProps) {
	// Get animation speed interval
	const speedIntervals = {fast: 100, normal: 300, slow: 600};
	const animInterval = customInterval ?? speedIntervals[speed];

	// Animation states
	const pulseOpacity = usePulseAnimation(
		animate && animation === 'pulse',
		animInterval,
	);
	const thinkingColor = useColorAnimation(
		animate && animation === 'thinking',
		[color ?? floydRoles.thinking, secondaryColor ?? '#FF60FF'],
		67,
	);
	const loadingChar = useLoadingAnimation(
		animate && (animation === 'loading' || animation === 'spin'),
	);

	// Determine current border color based on animation
	const getBorderColor = (): string => {
		if (!animate || animation === 'none') {
			return color ?? floydTheme.colors.border;
		}
		switch (animation) {
			case 'pulse':
				return color ?? floydRoles.thinking;
			case 'thinking':
				return thinkingColor ?? color ?? floydRoles.thinking;
			case 'loading':
			case 'spin':
				return color ?? floydRoles.thinking;
			default:
				return color ?? floydTheme.colors.border;
		}
	};

	// Determine if content should be dimmed
	const shouldDim = animate && animation === 'pulse' && pulseOpacity < 0.7;

	// Render loading indicator
	const renderLoadingIndicator = () => {
		if (!animate || (animation !== 'loading' && animation !== 'spin')) {
			return null;
		}
		return <Text color={color ?? floydRoles.thinking}>{loadingChar}</Text>;
	};

	return (
		<Box
			borderStyle={showBorder ? borderStyle : undefined}
			borderColor={showBorder ? getBorderColor() : undefined}
			paddingX={padding}
			paddingY={padding}
			width={width}
			flexDirection="column"
		>
			<Box flexDirection="row" gap={1}>
				{renderLoadingIndicator()}
				<Text dimColor={shouldDim}>{children}</Text>
			</Box>
		</Box>
	);
}

/**
 * PulsingBox - Box with pulse animation
 */
export interface PulsingBoxProps {
	/** Content */
	children?: ReactNode;

	/** Pulse color */
	color?: string;

	/** Pulse speed */
	speed?: 'fast' | 'normal' | 'slow';

	/** Show border */
	showBorder?: boolean;
}

export function PulsingBox({
	children,
	color = floydRoles.thinking,
	speed = 'normal',
	showBorder = true,
}: PulsingBoxProps) {
	return (
		<AnimatedBox
			animation="pulse"
			color={color}
			speed={speed}
			showBorder={showBorder}
		>
			{children}
		</AnimatedBox>
	);
}

/**
 * ThinkingBox - Box with thinking animation (color cycling)
 */
export interface ThinkingBoxProps {
	/** Content */
	children?: ReactNode;

	/** Label to show */
	label?: string;

	/** Show spinner */
	showSpinner?: boolean;
}

export function ThinkingBox({
	children,
	label = 'Thinking',
	showSpinner = true,
}: ThinkingBoxProps) {
	const [frame, setFrame] = useState(0);
	const [dots, setDots] = useState(0);

	useEffect(() => {
		const frameTimer = setInterval(() => {
			setFrame(prev => (prev + 1) % 15);
		}, 67);

		const dotsTimer = setInterval(() => {
			setDots(prev => (prev + 1) % 4);
		}, 200);

		return () => {
			clearInterval(frameTimer);
			clearInterval(dotsTimer);
		};
	}, []);

	const gradientColors = [
		'#6B50FF',
		'#7B60FF',
		'#8B75FF',
		'#FF60FF',
		'#FF78FF',
		'#FF90FF',
	];
	const currentColor = gradientColors[frame % gradientColors.length];
	const spinChars = ['|', '/', '-', '\\'];

	return (
		<Box flexDirection="row" gap={1}>
			{showSpinner && (
				<Text color={currentColor}>{spinChars[Math.floor(frame / 4) % 4]}</Text>
			)}
			<Text color={currentColor}>
				{label}
				{'.'.repeat(dots)}
			</Text>
			{children}
		</Box>
	);
}

/**
 * GlitchBox - Box with glitch effect
 */
export interface GlitchBoxProps {
	/** Content */
	children?: ReactNode;

	/** Glitch intensity */
	intensity?: 'low' | 'medium' | 'high';

	/** Trigger glitch on mount */
	trigger?: boolean;
}

export function GlitchBox({
	children,
	intensity = 'medium',
	trigger = true,
}: GlitchBoxProps) {
	const [glitchChar, setGlitchChar] = useState('');
	const [isGlitching, setIsGlitching] = useState(false);

	useEffect(() => {
		if (!trigger) return;

		const glitchChars = ['@', '#', '$', '%', '&', '*'];
		const intensityMap = {low: 0.05, medium: 0.15, high: 0.3};

		const interval = setInterval(() => {
			if (Math.random() < intensityMap[intensity]) {
				const randomChar =
					glitchChars[Math.floor(Math.random() * glitchChars.length)] ?? '?';
				setGlitchChar(randomChar);
				setIsGlitching(true);
				setTimeout(() => setIsGlitching(false), 50);
			}
		}, 100);

		return () => clearInterval(interval);
	}, [trigger, intensity]);

	return (
		<Box
			borderStyle="single"
			borderColor={floydTheme.colors.error}
			paddingX={1}
		>
			{isGlitching ? (
				<Text color={floydTheme.colors.error}>{glitchChar}</Text>
			) : (
				children
			)}
		</Box>
	);
}

/**
 * ShakeBox - Box with shake animation
 */
export interface ShakeBoxProps {
	/** Content */
	children?: ReactNode;

	/** Number of shakes */
	count?: number;

	/** Shake duration in ms */
	duration?: number;
}

export function ShakeBox({children, count = 3, duration = 500}: ShakeBoxProps) {
	const [offset, setOffset] = useState(0);

	useEffect(() => {
		let shakeCount = 0;
		const interval = setInterval(() => {
			if (shakeCount < count * 2) {
				setOffset(prev => (prev === 0 ? 1 : 0));
				shakeCount++;
			} else {
				setOffset(0);
				clearInterval(interval);
			}
		}, duration / (count * 2));

		return () => clearInterval(interval);
	}, [count, duration]);

	return (
		<Box>
			{offset > 0 && <Text> </Text>}
			{children}
			{offset > 0 && <Text> </Text>}
		</Box>
	);
}

/**
 * FadeInBox - Box with fade-in animation
 */
export interface FadeInBoxProps {
	/** Content */
	children?: ReactNode;

	/** Fade duration in ms */
	duration?: number;

	/** Delay before starting fade */
	delay?: number;
}

export function FadeInBox({
	children,
	duration = 500,
	delay = 0,
}: FadeInBoxProps) {
	const [opacity, setOpacity] = useState(0);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const startTimer = setTimeout(() => {
			setVisible(true);
			const step = 16 / duration; // Update every ~16ms
			const fadeInterval = setInterval(() => {
				setOpacity(prev => {
					const next = prev + step * 0.1;
					if (next >= 1) {
						clearInterval(fadeInterval);
						return 1;
					}
					return next;
				});
			}, 16);
		}, delay);

		return () => {
			clearTimeout(startTimer);
		};
	}, [duration, delay]);

	if (!visible) {
		return <Box>{children}</Box>;
	}

	return (
		<Box>
			<Text dimColor={opacity < 0.5}>{children}</Text>
		</Box>
	);
}

export default AnimatedBox;
