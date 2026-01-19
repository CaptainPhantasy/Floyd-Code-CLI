/**
 * CRUSH Theme - Gradient Definitions
 *
 * Gradient color stops for the signature CRUSH visual effects.
 * Used for text gradients, backgrounds, and animations.
 *
 * Named gradients for Floyd CLI theming:
 * - Charple: Pink/purple (primary brand gradient)
 * - Dolly: Hot pink (secondary gradient)
 * - Zest: Yellow/lime (accent gradient)
 * - Guac: Green/teal (success gradient)
 * - Sriracha: Red (error/warning gradient)
 *
 * Related: crush-theme.ts, animations.ts
 */

// ============================================================================
// GRADIENT PALETTES
// ============================================================================

/**
 * Charple gradient - Primary purple gradient
 * Used for: Primary accents, branding, focus states
 */
export const gradientCharple = {
	/** Start color - Lighter purple (Hazy) */
	from: '#8B75FF' as const,

	/** End color - Charple purple */
	to: '#6B50FF' as const,

	/** Full gradient array for animations */
	stops: ['#6B50FF', '#7B60FF', '#8B75FF'] as const,
};

/**
 * Dolly gradient - Secondary pink gradient
 * Used for: Secondary accents, "Charm" branding, highlights
 */
export const gradientDolly = {
	/** Start color - Lighter pink */
	from: '#FF90FF' as const,

	/** End color - Dolly pink */
	to: '#FF60FF' as const,

	/** Full gradient array for animations */
	stops: ['#FF60FF', '#FF78FF', '#FF90FF'] as const,
};

/**
 * Zest gradient - Yellow highlight gradient
 * Used for: Warnings, highlights, emphasis
 */
export const gradientZest = {
	/** Start color - Lighter yellow */
	from: '#FFE060' as const,

	/** End color - Zest yellow */
	to: '#E8FE96' as const,

	/** Full gradient array for animations */
	stops: ['#E8FE96', '#F4EF7B', '#FFE060'] as const,
};

/**
 * Guac gradient - Green success gradient
 * Used for: Success states, completion, ready indicators
 */
export const gradientGuac = {
	/** Start color - Lighter teal (Julep) */
	from: '#00E6B8' as const,

	/** End color - Guac green */
	to: '#00C896' as const,

	/** Full gradient array for animations */
	stops: ['#00C896', '#00D7A7', '#00E6B8'] as const,
};

/**
 * Sriracha gradient - Red error gradient
 * Used for: Errors, critical states, warnings
 */
export const gradientSriracha = {
	/** Start color - Lighter red */
	from: '#FF6B60' as const,

	/** End color - Sriracha red */
	to: '#FF3B30' as const,

	/** Full gradient array for animations */
	stops: ['#FF3B30', '#FF5548', '#FF6B60'] as const,
};

// ============================================================================
// COMPOSITE GRADIENTS
// ============================================================================

/**
 * Primary branding gradient - Dolly to Charple
 * The signature CRUSH gradient combining pink to purple
 */
export const gradientPrimary = {
	/** Start color - Dolly pink */
	from: '#FF60FF' as const,

	/** End color - Charple purple */
	to: '#6B50FF' as const,

	/** Full gradient array for multi-step animations */
	stops: ['#FF60FF', '#B058FF', '#6B50FF'] as const,
};

/**
 * Success gradient - Green to teal
 */
export const gradientSuccess = {
	/** Start color - Julep teal */
	from: '#00FFB2' as const,

	/** End color - Guac green */
	to: '#12C78F' as const,

	/** Full gradient array for animations */
	stops: ['#12C78F', '#09E3A0', '#00FFB2'] as const,
};

/**
 * Error gradient - Pink to red
 */
export const gradientError = {
	/** Start color - Dolly pink */
	from: '#FF60FF' as const,

	/** End color - Sriracha red */
	to: '#EB4268' as const,

	/** Full gradient array for animations */
	stops: ['#EB4268', '#F25164', '#FF60FF'] as const,
};

/**
 * Rainbow gradient - Full spectrum pride
 * Used for: Special effects, celebrations, "raunchy whimsy"
 */
export const gradientRainbow = {
	/** All colors of the CRUSH spectrum */
	stops: [
		'#6B50FF', // Charple
		'#FF60FF', // Dolly
		'#E8FE96', // Zest
		'#12C78F', // Guac
		'#00A4FF', // Malibu
	] as const,
};

// ============================================================================
// LEGACY GRADIENT ARRAYS (for backward compatibility)
// ============================================================================

/**
 * Legacy gradient arrays - preserved for existing code
 * @deprecated Use gradient objects (gradientCharple, etc.) instead
 */
export const gradients = {
	/** Charple: Pink to purple gradient (primary brand) */
	charple: ['#FF60FF', '#B85CFF', '#9054FF', '#6B50FF', '#6060FF'] as const,

	/** Dolly: Hot pink gradient (secondary) */
	dolly: ['#FF90FF', '#FF78FF', '#FF60FF', '#E860FF', '#D060FF'] as const,

	/** Zest: Yellow to lime gradient (accent) */
	zest: ['#FFE060', '#FFF050', '#E8FE96', '#D4EF60', '#C0DF30'] as const,

	/** Guac: Green/teal gradient (success) */
	guac: ['#00E6B8', '#00FFB2', '#12C78F', '#00C896', '#00A475'] as const,

	/** Sriracha: Red to orange gradient (error/warning) */
	sriracha: ['#FF6B60', '#FF5550', '#EB4268', '#FF3B30', '#E23030'] as const,
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GradientName = 'charple' | 'dolly' | 'zest' | 'guac' | 'sriracha';

export type Gradient = {
	from: string;
	to: string;
	stops: readonly string[];
};

export type Gradients = typeof gradients;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a gradient by name (legacy array format)
 * @param name - Name of the gradient
 * @returns Array of color stops
 */
export function getGradient(name: GradientName): readonly string[] {
	return gradients[name] || gradients.charple;
}

/**
 * Get interpolated color from gradient at position (0-1)
 * @param name - Gradient name
 * @param position - Position along gradient (0-1)
 * @returns Hex color at position
 */
export function getGradientColor(name: GradientName, position: number): string {
	const grad = gradients[name] as readonly string[];
	const index = Math.floor(position * (grad.length - 1));
	const clampedIndex = Math.max(0, Math.min(grad.length - 1, index));
	return grad[clampedIndex] as string;
}

/**
 * Interpolate between two gradient colors
 * @param from - Start color (hex)
 * @param to - End color (hex)
 * @param progress - Progress between 0-1
 * @returns Interpolated hex color
 */
export function interpolateColor(
	from: string,
	to: string,
	progress: number,
): string {
	// Clamp progress to 0-1
	const t = Math.max(0, Math.min(1, progress));

	// Parse hex colors
	const parseHex = (hex: string) => {
		const clean = hex.replace('#', '');
		return {
			r: Number.parseInt(clean.substring(0, 2), 16),
			g: Number.parseInt(clean.substring(2, 4), 16),
			b: Number.parseInt(clean.substring(4, 6), 16),
		};
	};

	const fromRgb = parseHex(from);
	const toRgb = parseHex(to);

	// Interpolate
	const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
	const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
	const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

	return `#${r.toString(16).padStart(2, '0')}${g
		.toString(16)
		.padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Create a cycling gradient animation frame
 * @param gradient - Gradient to animate
 * @param frame - Current frame number
 * @param totalFrames - Total frames in cycle
 * @returns Color at current frame
 */
export function getGradientFrame(
	gradient: GradientName,
	frame: number,
	totalFrames = 15,
): string {
	// Calculate position with sine wave for smooth cycling
	const rawProgress = (frame % totalFrames) / totalFrames;
	// Use sine for smooth back-and-forth animation
	const progress = (Math.sin(rawProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

	return getGradientColor(gradient, progress);
}

/**
 * Convert hex to ANSI color code (256-color mode approximation)
 * @param hex - Hex color string
 * @returns ANSI color code (0-255)
 */
export function hexToAnsi(hex: string): number {
	// Remove hash
	const h = hex.replace('#', '');

	// Parse RGB
	const r = Number.parseInt(h.substring(0, 2), 16);
	const g = Number.parseInt(h.substring(2, 4), 16);
	const b = Number.parseInt(h.substring(4, 6), 16);

	// Convert to 256-color approximation
	if (r === g && g === b) {
		// Grayscale
		if (r < 8) return 16;
		if (r > 248) return 231;
		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	// Color cube
	const ri = r === 0 ? 0 : Math.round((r / 255) * 5);
	const gi = g === 0 ? 0 : Math.round((g / 255) * 5);
	const bi = b === 0 ? 0 : Math.round((b / 255) * 5);

	return 16 + ri * 36 + gi * 6 + bi;
}

/**
 * Get gradient as ANSI color codes
 * @param name - Gradient name
 * @returns Array of ANSI color codes
 */
export function getGradientAnsi(name: GradientName): number[] {
	const colors = getGradient(name);
	return colors.map(hexToAnsi);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
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
};
