/**
 * CRUSH Theme System - Main Export
 *
 * Complete theming system for Floyd CLI based on Charmbracelet's CRUSH design.
 *
 * Theme Philosophy (CRUSH):
 * - C: CharmUI - High-contrast neon/pink aesthetics with personality
 * - R: Rustic - Dark backgrounds for reduced eye strain
 * - U: User-focused - Clear visual hierarchy with purposeful color usage
 * - S: Speedy - Fast visual feedback with status colors
 * - H: Hybrid - Works across different terminal capabilities
 *
 * @module theme
 */

// ----------------------------------------------------------------------------
// Imports for Complete Theme Export
// ----------------------------------------------------------------------------

import {crushTheme} from './crush-theme';
import {
	gradientCharple,
	gradientDolly,
	gradientZest,
	gradientGuac,
	gradientSriracha,
} from './gradients';
import {
	thinkingAnimation,
	loadingAnimation,
	successAnimation,
	errorAnimation,
} from './animations';
import {borderWeights, crushBorders} from './borders';
import {LAYOUT} from './layout';

// ----------------------------------------------------------------------------
// Color Palette
// ----------------------------------------------------------------------------

export {
	crushTheme,
	bgColors,
	textColors,
	accentColors,
	statusColors,
	extendedColors,
	roleColors,
	getColor,
	hasColor,
} from './crush-theme';

export type {
	CrushTheme,
	BgColors,
	TextColors,
	AccentColors,
	StatusColors,
	RoleColors,
} from './crush-theme';

// ----------------------------------------------------------------------------
// Gradients
// ----------------------------------------------------------------------------

export {
	gradients,
	gradientCharple,
	gradientDolly,
	gradientZest,
	gradientGuac,
	gradientSriracha,
	gradientPrimary,
	gradientSuccess,
	gradientError,
	gradientRainbow,
	getGradient,
	getGradientColor,
	interpolateColor,
	getGradientFrame,
	hexToAnsi,
	getGradientAnsi,
} from './gradients';

export type {Gradient, GradientName, Gradients} from './gradients';

// ----------------------------------------------------------------------------
// Animations
// ----------------------------------------------------------------------------

export {
	animationDurations,
	frameIntervals,
	easing,
	// CRUSH animation presets
	thinkingAnimation,
	loadingAnimation,
	successAnimation,
	errorAnimation,
	// Animation frame generators
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
	// Utility functions
	getAnimationConfig,
	getCrushAnimation,
} from './animations';

export type {
	AnimationPreset,
	AnimationTiming,
	ThinkingAnimation,
	LoadingAnimation,
	SuccessAnimation,
	ErrorAnimation,
} from './animations';

// ----------------------------------------------------------------------------
// Borders
// ----------------------------------------------------------------------------

export {
	borderStyles,
	borderColors,
	borderWeights,
	borderCorners,
	crushBorders,
	getBorderStyle,
	getBorderColor,
	getBorderWeight,
	getBorderCorners,
	getCrushBorder,
	createDashedBorder,
	createFloatingFrame,
	getGradientBorder,
	createFocusedMessageBorder,
} from './borders';

// ----------------------------------------------------------------------------
// Layout Constants
// ----------------------------------------------------------------------------

export {LAYOUT};

export type {
	BorderStyle,
	BorderVariant,
	BorderWeight,
	CrushBorder,
	BorderWeightConfig,
	FloatingFrameConfig,
	GradientBorderConfig,
} from './borders';

// ----------------------------------------------------------------------------
// Default Export (Complete Theme)
// ----------------------------------------------------------------------------

/**
 * Complete CRUSH theme export
 * Contains all theme values for easy import
 */
export const crushThemeComplete = {
	...crushTheme,

	// Gradient references
	gradients: {
		charple: gradientCharple,
		dolly: gradientDolly,
		zest: gradientZest,
		guac: gradientGuac,
		sriracha: gradientSriracha,
	},

	// Animation presets
	animations: {
		thinking: thinkingAnimation,
		loading: loadingAnimation,
		success: successAnimation,
		error: errorAnimation,
	},

	// Border weights
	borders: {
		weights: borderWeights,
		components: crushBorders,
	},
} as const;

export default crushThemeComplete;
