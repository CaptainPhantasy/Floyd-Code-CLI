/**
 * CRUSH Theme - Animation Presets
 *
 * Animation timing and easing functions for Floyd CLI.
 * Ink doesn't support CSS-style animations, so we use
 * frame-based animation with timing controls.
 *
 * Related: crush-theme.ts, gradients.ts
 */

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Core animation preset types for CRUSH UI
 */
export type AnimationPreset =
	| 'fade'
	| 'slide'
	| 'pulse'
	| 'spin'
	| 'bounce'
	| 'glitch'
	| 'typewriter'
	| 'shimmer'
	/** Thinking animation - cycling gradient between purple and pink */
	| 'thinking'
	/** Loading animation - spinner with pulsing color */
	| 'loading'
	/** Success animation - green cascade/fire effect */
	| 'success'
	/** Error animation - red glitch/shake effect */
	| 'error';

/**
 * Animation timing speeds
 */
export type AnimationTiming = 'fast' | 'normal' | 'slow';

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

/**
 * Animation duration in milliseconds
 */
export const animationDurations: Record<AnimationTiming, number> = {
	fast: 150,
	normal: 300,
	slow: 600,
};

/**
 * Animation frame intervals (for 60fps approximation)
 */
export const frameIntervals: Record<AnimationPreset, number> = {
	fade: 16, // ~60fps
	slide: 16,
	pulse: 50, // Slower for breathing effect
	spin: 50,
	bounce: 100,
	glitch: 80, // Random-ish timing
	typewriter: 30, // Character typing speed
	shimmer: 40,
	// CRUSH-specific presets
	thinking: 67, // ~15fps for the classic thinking animation
	loading: 50, // 20fps for loading spinner
	success: 30, // Fast for success cascade
	error: 40, // Medium for glitch effect
};

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Easing functions (0-1 input, 0-1 output)
 * Calculate progress through an animation with different velocity curves
 */
export const easing = {
	/** Linear - constant speed */
	linear: (t: number): number => t,

	/** Ease In - starts slow, accelerates */
	easeIn: (t: number): number => t * t,

	/** Ease Out - starts fast, decelerates */
	easeOut: (t: number): number => t * (2 - t),

	/** Ease In Out - slow start and end, fast middle */
	easeInOut: (t: number): number =>
		t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

	/** Bounce - bounces at the end */
	bounce: (t: number): number => {
		if (t < 1 / 2.75) {
			return 7.5625 * t * t;
		}
		if (t < 2 / 2.75) {
			return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
		}
		if (t < 2.5 / 2.75) {
			return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
		}
		return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
	},

	/** Elastic - stretches beyond bounds */
	elastic: (t: number): number => {
		if (t === 0 || t === 1) return t;
		return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
	},
};

// ============================================================================
// CRUSH ANIMATION PRESETS
// ============================================================================

/**
 * Thinking animation preset
 * Creates a cycling gradient between Charple (purple) and Dolly (pink)
 * Used for: AI thinking states, processing indicators
 *
 * Based on the CRUSH anim.go specification:
 * - Size: 15 frames
 * - GradColorA: Primary (#6B50FF)
 * - GradColorB: Secondary (#FF60FF)
 * - CycleColors: true
 */
export const thinkingAnimation = {
	/** Number of frames in the thinking cycle */
	frames: 15,

	/** Frame interval in milliseconds */
	interval: frameIntervals.thinking,

	/** Starting gradient color (Charple) */
	colorA: '#6B50FF',

	/** Ending gradient color (Dolly) */
	colorB: '#FF60FF',

	/** Labels to cycle through */
	labels: [
		'Thinking',
		'Summarizing',
		'Working',
		'Processing',
		'Analyzing',
		'Computing',
		'Generating',
	],
};

/**
 * Loading animation preset
 * Spinner with pulsing color effect
 * Used for: Initial load, resource loading
 */
export const loadingAnimation = {
	/** Frame interval in milliseconds */
	interval: frameIntervals.loading,

	/** Spinner characters in rotation */
	spinner: ['|', '/', '-', '\\'],

	/** Pulsing gradient colors */
	colors: ['#6B50FF', '#7B60FF', '#8B75FF', '#7B60FF'],
};

/**
 * Success animation preset
 * Green cascade/matrix rain effect
 * Used for: Successful completion, task success
 */
export const successAnimation = {
	/** Frame interval in milliseconds */
	interval: frameIntervals.success,

	/** Duration in milliseconds */
	duration: 800,

	/** Success color (Guac) */
	color: '#12C78F',

	/** Secondary success color (Julep) */
	colorSecondary: '#00FFB2',

	/** Characters for the cascade effect */
	chars: ['✓', '*', '+', '·', '.'],
};

/**
 * Error animation preset
 * Red glitch/shake effect
 * Used for: Errors, failures, critical states
 */
export const errorAnimation = {
	/** Frame interval in milliseconds */
	interval: frameIntervals.error,

	/** Duration in milliseconds */
	duration: 500,

	/** Error color (Sriracha) */
	color: '#EB4268',

	/** Secondary error color */
	colorSecondary: '#FF3B30',

	/** Glitch characters */
	chars: ['@', '#', '$', '%', '&', '*', '+', '='],

	/** Shake offset range */
	shakeRange: 2,
};

// ============================================================================
// ANIMATION FRAME GENERATORS
// ============================================================================

/**
 * Animation frame generator for fade effects
 * @param direction - Fade direction
 * @param timing - Animation speed
 */
export function* fadeFrames(
	direction: 'in' | 'out',
	timing: AnimationTiming = 'normal',
): Generator<number, void, unknown> {
	const duration = animationDurations[timing];
	const frames = duration / frameIntervals.fade;
	const easingFn = easing.easeOut;

	for (let i = 0; i <= frames; i++) {
		const progress = easingFn(i / frames);
		yield direction === 'in' ? progress : 1 - progress;
	}
}

/**
 * Animation frame generator for pulse/breathing effect
 * Continuously cycles opacity
 */
export function* pulseFrames(): Generator<number, void, unknown> {
	while (true) {
		// Fade out
		for (let i = 0; i <= 10; i++) {
			yield 1 - i * 0.1;
		}
		// Fade in
		for (let i = 0; i <= 10; i++) {
			yield i * 0.1;
		}
	}
}

/**
 * Animation frame generator for spin effect
 * Cycles through spinner characters
 */
export function* spinFrames(): Generator<string, void, unknown> {
	const chars = ['|', '/', '-', '\\'] as const;
	let index = 0;
	while (true) {
		yield chars[index % chars.length] as string;
		index++;
	}
}

/**
 * Animation frame generator for thinking animation (CRUSH preset)
 * Cycles colors between Charple and Dolly
 * @returns Generator yielding color at each frame
 */
export function* thinkingColorFrames(): Generator<string, void, unknown> {
	const colors = [
		'#6B50FF', // Charple
		'#7B60FF',
		'#8B75FF', // Hazy
		'#7B60FF',
		'#6B50FF',
		'#7858FF',
		'#FF60FF', // Dolly
		'#FF78FF',
		'#FF90FF',
		'#FF78FF',
		'#FF60FF',
		'#B85CFF',
	] as const;
	let index = 0;
	while (true) {
		yield colors[index % colors.length] as string;
		index++;
	}
}

/**
 * Animation frame generator for loading animation (CRUSH preset)
 * Combines spinner with pulsing color
 * @returns Generator yielding {char, color}
 */
export function* loadingFrames(): Generator<
	{
		char: string;
		color: string;
	},
	void,
	unknown
> {
	const spinner = ['|', '/', '-', '\\'] as const;
	const colors = ['#6B50FF', '#7B60FF', '#8B75FF', '#7B60FF'] as const;
	let spinnerIndex = 0;
	let colorIndex = 0;

	while (true) {
		yield {
			char: spinner[spinnerIndex % spinner.length] as string,
			color: colors[colorIndex % colors.length] as string,
		};
		spinnerIndex++;
		if (spinnerIndex % spinner.length === 0) {
			colorIndex++;
		}
	}
}

/**
 * Animation frame generator for success animation (CRUSH preset)
 * Creates a cascade/fire effect with green colors
 * @param duration - Duration in milliseconds
 * @returns Generator yielding {char, color, opacity}
 */
export function* successFrames(duration = successAnimation.duration): Generator<
	{
		char: string;
		color: string;
		opacity: number;
	},
	void,
	unknown
> {
	const chars = successAnimation.chars;
	const colors = [
		successAnimation.color,
		successAnimation.colorSecondary,
	] as const;
	const frames = duration / successAnimation.interval;

	for (let i = 0; i < frames; i++) {
		const progress = i / frames;
		const opacity = 1 - progress * 0.5; // Fade out slightly
		const charIndex = Math.floor(progress * chars.length) % chars.length;
		const colorIndex = Math.floor(progress * 2) % 2;

		yield {
			char: chars[charIndex] as string,
			color: colors[colorIndex] as string,
			opacity,
		};
	}
}

/**
 * Animation frame generator for error animation (CRUSH preset)
 * Creates a glitch/shake effect with red colors
 * @param duration - Duration in milliseconds
 * @returns Generator yielding {char, shift, color}
 */
export function* errorFrames(duration = errorAnimation.duration): Generator<
	{
		char: string;
		shift: number;
		color: string;
	},
	void,
	unknown
> {
	const chars = errorAnimation.chars;
	const colors = [errorAnimation.color, errorAnimation.colorSecondary] as const;
	const frames = duration / errorAnimation.interval;

	for (let i = 0; i < frames; i++) {
		// Random glitch
		if (Math.random() < 0.4) {
			yield {
				char: chars[Math.floor(Math.random() * chars.length)] as string,
				shift: Math.floor(Math.random() * 5) - 2,
				color: colors[Math.floor(Math.random() * colors.length)] as string,
			};
		} else {
			yield {
				char: '×',
				shift: 0,
				color: errorAnimation.color,
			};
		}
	}
}

/**
 * Animation frame generator for bounce effect
 * @param bounces - Number of bounces
 */
export function* bounceFrames(
	bounces = 3,
): Generator<{offset: number; opacity: number}, void, unknown> {
	const bounceEasing = easing.bounce;
	for (let b = 0; b < bounces; b++) {
		for (let i = 0; i <= 20; i++) {
			const progress = i / 20;
			const offset = Math.sin(progress * Math.PI) * (1 - b * 0.2);
			const opacity = bounceEasing(progress);
			yield {offset, opacity};
		}
	}
}

/**
 * Animation frame generator for glitch effect
 * @param intensity - Glitch intensity level
 */
export function* glitchFrames(
	intensity: 'low' | 'medium' | 'high' = 'medium',
): Generator<{shift: number; char: string}, void, unknown> {
	const glitchChars = ['@', '#', '$', '%', '&', '*', '+', '='] as const;
	const intensityMap = {low: 0.1, medium: 0.3, high: 0.5} as const;
	const threshold = intensityMap[intensity];

	let frame = 0;
	while (frame < 30) {
		// Random glitch
		if (Math.random() < threshold) {
			yield {
				shift: Math.floor(Math.random() * 4) - 2,
				char: glitchChars[
					Math.floor(Math.random() * glitchChars.length)
				] as string,
			};
		} else {
			yield {shift: 0, char: ''};
		}
		frame++;
	}
}

/**
 * Animation frame generator for typewriter effect
 * @param text - Text to type out
 */
export function* typewriterFrames(
	text: string,
): Generator<string, void, unknown> {
	for (let i = 0; i <= text.length; i++) {
		yield text.substring(0, i);
		// Add cursor blink
		if (i < text.length) {
			yield text.substring(0, i) + '_';
			yield text.substring(0, i);
		}
	}
}

/**
 * Animation frame generator for shimmer effect
 * @param length - Length of the shimmer area
 */
export function* shimmerFrames(
	length: number,
): Generator<{position: number; char: string}, void, unknown> {
	const chars = [' ', '\\', '|', '/', ' '] as const;
	while (true) {
		for (let i = 0; i < length + 4; i++) {
			for (let j = 0; j < chars.length; j++) {
				const pos = i - j;
				if (pos >= 0 && pos < length) {
					yield {position: pos, char: chars[j] as string};
				}
			}
		}
	}
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get animation config by preset
 * @param preset - Animation preset name
 * @returns Configuration object with frame interval and easing function
 */
export function getAnimationConfig(preset: AnimationPreset): {
	frameInterval: number;
	easing: (t: number) => number;
} {
	return {
		frameInterval: frameIntervals[preset],
		easing: preset === 'bounce' ? easing.bounce : easing.easeInOut,
	};
}

/**
 * Get a CRUSH animation preset by name
 * @param preset - One of 'thinking', 'loading', 'success', 'error'
 * @returns Animation preset configuration
 */
export function getCrushAnimation(preset: 'thinking'): typeof thinkingAnimation;
export function getCrushAnimation(preset: 'loading'): typeof loadingAnimation;
export function getCrushAnimation(preset: 'success'): typeof successAnimation;
export function getCrushAnimation(preset: 'error'): typeof errorAnimation;
export function getCrushAnimation(preset: string): unknown {
	switch (preset) {
		case 'thinking':
			return thinkingAnimation;
		case 'loading':
			return loadingAnimation;
		case 'success':
			return successAnimation;
		case 'error':
			return errorAnimation;
		default:
			return undefined;
	}
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ThinkingAnimation = typeof thinkingAnimation;
export type LoadingAnimation = typeof loadingAnimation;
export type SuccessAnimation = typeof successAnimation;
export type ErrorAnimation = typeof errorAnimation;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
	animationDurations,
	frameIntervals,
	easing,
	thinkingAnimation,
	loadingAnimation,
	successAnimation,
	errorAnimation,
	fadeFrames,
	pulseFrames,
	spinFrames,
	thinkingColorFrames,
	loadingFrames,
	successFrames,
	errorFrames,
	bounceFrames,
	glitchFrames,
	typewriterFrames,
	shimmerFrames,
	getAnimationConfig,
	getCrushAnimation,
};
