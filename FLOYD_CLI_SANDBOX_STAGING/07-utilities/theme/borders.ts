/**
 * CRUSH Theme - Border Styles
 *
 * Border style definitions for Floyd CLI components.
 * Supports various patterns for different visual hierarchies.
 *
 * Border styles:
 * - thin: Standard borders for general use
 * - thick: Emphasized borders for focused elements
 * - focus: Special border styling for active/focused states
 *
 * Related: crush-theme.ts, animations.ts
 */

import type {BoxProps} from 'ink';

// ============================================================================
// BORDER TYPES
// ============================================================================

/**
 * Border style types
 */
export type BorderStyle =
	| 'single'
	| 'double'
	| 'round'
	| 'bold'
	| 'singleDouble'
	| 'doubleSingle'
	| 'classic'
	| 'dashed';

/**
 * Border color variants
 */
export type BorderVariant =
	| 'default'
	| 'subtle'
	| 'focus'
	| 'accent'
	| 'success'
	| 'error';

/**
 * CRUSH border weight types
 * Based on the CRUSH specification for terminal UI
 */
export type BorderWeight = 'thin' | 'thick' | 'focus';

// ============================================================================
// BORDER STYLE MAPPINGS
// ============================================================================

/**
 * Border style mappings to Ink's borderStyle prop
 */
export const borderStyles: Record<BorderStyle, BoxProps['borderStyle']> = {
	single: 'single',
	double: 'double',
	round: 'round',
	bold: 'bold',
	singleDouble: 'singleDouble',
	doubleSingle: 'doubleSingle',
	classic: 'classic',
	dashed: undefined, // Ink doesn't support dashed, we simulate it
};

// ============================================================================
// BORDER COLORS
// ============================================================================

/**
 * Border color variants
 * Colors from the CRUSH theme palette
 */
export const borderColors: Record<BorderVariant, string> = {
	/** Default border - Charcoal */
	default: '#3A3943',

	/** Subtle border - Oyster */
	subtle: '#605F6B',

	/** Focus border - Charple (purple) */
	focus: '#6B50FF',

	/** Accent border - Dolly (pink) */
	accent: '#FF60FF',

	/** Success border - Guac (green) */
	success: '#12C78F',

	/** Error border - Sriracha (red) */
	error: '#EB4268',
};

// ============================================================================
// CRUSH BORDER WEIGHTS
// ============================================================================

/**
 * CRUSH border weight configurations
 * Based on the CRUSH CLI specification
 */
export const borderWeights: Record<
	BorderWeight,
	{
		/** Border character for horizontal lines */
		horizontal: string;

		/** Border character for vertical lines */
		vertical: string;

		/** Focused message border character (left side) */
		focused: string;

		/** Color for this border weight */
		color: string;

		/** Description */
		description: string;
	}
> = {
	/** Thin border - Standard vertical border */
	thin: {
		horizontal: '─',
		vertical: '│',
		focused: '│',
		color: borderColors.default,
		description: 'Standard thin border for general use',
	},

	/** Thick border - Half-block focused border */
	thick: {
		horizontal: '━',
		vertical: '┃',
		focused: '▌',
		color: borderColors.focus,
		description: 'Thick border for emphasized elements',
	},

	/** Focus border - Special styling for active states */
	focus: {
		horizontal: '─',
		vertical: '▏',
		focused: '▌',
		color: borderColors.focus,
		description: 'Border styling for focused/active elements',
	},
};

// ============================================================================
// BORDER CORNERS
// ============================================================================

/**
 * Corner characters for each border style
 */
export const borderCorners = {
	single: {
		tl: '┌',
		tr: '┐',
		bl: '└',
		br: '┘',
	},
	double: {
		tl: '╔',
		tr: '╗',
		bl: '╚',
		br: '╝',
	},
	round: {
		tl: '╭',
		tr: '╮',
		bl: '╰',
		br: '╯',
	},
	bold: {
		tl: '┏',
		tr: '┓',
		bl: '┗',
		br: '┛',
	},
	classic: {
		tl: '+',
		tr: '+',
		bl: '+',
		br: '+',
	},
};

// ============================================================================
// CRUSH COMPONENT BORDERS
// ============================================================================

/**
 * Pre-configured border sets for CRUSH components
 */
export const crushBorders = {
	/** Modal/dialog frame - Rounded with purple focus */
	modal: {
		style: 'round' as BorderStyle,
		variant: 'focus' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 1,
	},

	/** Tool call card - Single line, subtle */
	toolCard: {
		style: 'single' as BorderStyle,
		variant: 'subtle' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 1,
	},

	/** Status badge - Rounded, default */
	badge: {
		style: 'round' as BorderStyle,
		variant: 'default' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 0,
	},

	/** Input field - Single line, default */
	input: {
		style: 'single' as BorderStyle,
		variant: 'default' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 0,
	},

	/** Focus/active state - Bold with accent color */
	focus: {
		style: 'bold' as BorderStyle,
		variant: 'accent' as BorderVariant,
		weight: 'thick' as BorderWeight,
		padding: 0,
	},

	/** Success state - Double with green */
	success: {
		style: 'double' as BorderStyle,
		variant: 'success' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 1,
	},

	/** Error state - Double with red */
	error: {
		style: 'double' as BorderStyle,
		variant: 'error' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 1,
	},

	/** User message - Left border with purple */
	userMessage: {
		style: 'single' as BorderStyle,
		variant: 'focus' as BorderVariant,
		weight: 'thick' as BorderWeight,
		padding: 0,
	},

	/** Assistant message - Indented without border */
	assistantMessage: {
		style: 'single' as BorderStyle,
		variant: 'subtle' as BorderVariant,
		weight: 'thin' as BorderWeight,
		padding: 0,
	},
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================>

/**
 * Get border style by name
 * @param style - Border style name
 * @returns Ink-compatible border style
 */
export function getBorderStyle(style: BorderStyle): BoxProps['borderStyle'] {
	return borderStyles[style] || 'single';
}

/**
 * Get border color by variant
 * @param variant - Border variant name
 * @returns Hex color string
 */
export function getBorderColor(variant: BorderVariant): string {
	return borderColors[variant];
}

/**
 * Get border weight configuration
 * @param weight - Border weight name
 * @returns Border weight configuration
 */
export function getBorderWeight(
	weight: BorderWeight,
): (typeof borderWeights)[BorderWeight] {
	return (
		(borderWeights as Record<string, (typeof borderWeights)[BorderWeight]>)[
			weight
		] || borderWeights.thin
	);
}

/**
 * Get border corners for a style
 * @param style - Border style name
 * @returns Corner characters object
 */
export function getBorderCorners(style: BorderStyle): {
	tl: string;
	tr: string;
	bl: string;
	br: string;
} {
	return (
		(
			borderCorners as Record<
				string,
				{
					tl: string;
					tr: string;
					bl: string;
					br: string;
				}
			>
		)[style] || borderCorners.single
	);
}

/**
 * Get a pre-configured CRUSH border set
 * @param name - Border configuration name
 * @returns Border configuration object
 */
export function getCrushBorder(
	name: keyof typeof crushBorders,
): (typeof crushBorders)[keyof typeof crushBorders] {
	return (
		(
			crushBorders as Record<
				string,
				(typeof crushBorders)[keyof typeof crushBorders]
			>
		)[name] || crushBorders.modal
	);
}

/**
 * Create a dashed border effect (simulated)
 * @param width - Width of the border
 * @returns Dashed border pattern string
 */
export function createDashedBorder(width: number): string {
	return '─'.repeat(Math.max(2, Math.floor(width / 2) - 1));
}

/**
 * Create a floating frame (with shadow effect simulation)
 * Used for modals and dialogs in the CRUSH UI
 * @param width - Frame width
 * @param height - Frame height
 * @param config - Optional configuration
 * @returns Frame drawing strings
 */
export interface FloatingFrameConfig {
	topPadding: number;
	bottomPadding: number;
	leftPadding: number;
	rightPadding: number;
	shadowOffset: number;
}

export function createFloatingFrame(
	width: number,
	_height: number,
	config: Partial<FloatingFrameConfig> = {},
): {
	topLine: string;
	middleLine: string;
	bottomLine: string;
	leftPad: string;
	rightPad: string;
} {
	const {
		topPadding = 1,
		bottomPadding = 1,
		leftPadding = 2,
		rightPadding = 2,
		shadowOffset = 1,
	} = config;

	// Avoid unused variable warnings - these could be used in enhanced implementations
	void topPadding;
	void bottomPadding;
	void shadowOffset;

	const contentWidth = width - leftPadding - rightPadding;
	const topLine = '╭' + '─'.repeat(contentWidth) + '╮';
	const bottomLine = '╰' + '─'.repeat(contentWidth) + '╯';
	const middleLine = '│' + ' '.repeat(contentWidth) + '│';
	const leftPad = '│' + ' '.repeat(leftPadding - 1);
	const rightPad = ' '.repeat(rightPadding - 1) + '│';

	return {
		topLine,
		middleLine,
		bottomLine,
		leftPad,
		rightPad,
	};
}

/**
 * Create a gradient border (with colored corners)
 * @param style - Border style
 * @param config - Optional color configuration
 * @returns Border characters with color info
 */
export interface GradientBorderConfig {
	tlColor?: string;
	trColor?: string;
	blColor?: string;
	brColor?: string;
	horizontalColor?: string;
	verticalColor?: string;
}

export function getGradientBorder(
	style: BorderStyle = 'round',
	config: GradientBorderConfig = {},
): {
	tl: string;
	tr: string;
	bl: string;
	br: string;
	h: string;
	v: string;
	colors: GradientBorderConfig;
} {
	const corners = getBorderCorners(style);
	return {
		tl: corners.tl,
		tr: corners.tr,
		bl: corners.bl,
		br: corners.br,
		h: '─',
		v: '│',
		colors: config,
	};
}

/**
 * Create a focused message border (left border only)
 * Used for highlighting active messages in the chat view
 * @param variant - Color variant for the border
 * @returns Border style object
 */
export function createFocusedMessageBorder(variant: BorderVariant = 'focus'): {
	borderStyle: {left: string};
	borderColor: string;
} {
	const weight = getBorderWeight('focus');
	return {
		borderStyle: {left: weight.focused},
		borderColor: variant === 'focus' ? weight.color : borderColors[variant],
	};
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CrushBorder = (typeof crushBorders)[keyof typeof crushBorders];
export type BorderWeightConfig = (typeof borderWeights)[BorderWeight];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
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
};
