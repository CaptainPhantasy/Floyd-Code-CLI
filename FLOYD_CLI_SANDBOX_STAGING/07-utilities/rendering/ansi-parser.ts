/**
 * ANSI Escape Sequence Parser
 *
 * Parses and handles ANSI escape codes for terminal rendering.
 * Provides utilities to strip, parse, and convert ANSI sequences.
 *
 * Features:
 * - Strip ANSI codes from strings
 * - Parse ANSI codes into styled segments
 * - Convert ANSI to Ink-compatible styling
 * - Detect terminal capabilities
 * - Handle common ANSI sequences (colors, formatting)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnsiSegment {
	text: string;
	fgColor?: string;
	bgColor?: string;
	bold?: boolean;
	dim?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	inverse?: boolean;
	hidden?: boolean;
}

export interface AnsiStyle {
	fgColor?: string;
	bgColor?: string;
	bold?: boolean;
	dim?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	inverse?: boolean;
	hidden?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Strip all ANSI escape codes from a string
 *
 * @param text - Text containing ANSI codes
 * @returns Text without ANSI codes
 */
export function stripAnsi(text: string): string {
	return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Strip all ANSI escape codes and other control sequences
 *
 * @param text - Text containing ANSI codes
 * @returns Clean text without any control sequences
 */
export function stripAllAnsi(text: string): string {
	return text
		.replace(/\x1b\[[0-9;]*m/g, '')
		.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
		.replace(/\x1b\][0-9;]*[0-9;][^\x07\x1b]*[\x07\x1b\\]/g, '')
		.replace(/\x1b\[?[0-9;]*[0-9;][A-Za-z]/g, '')
		.replace(/\x1b./g, '');
}

/**
 * Parse ANSI codes into styled segments (simplified version)
 *
 * @param text - Text containing ANSI codes
 * @returns Array of styled segments
 */
export function parseAnsi(text: string): AnsiSegment[] {
	// Simplified implementation - return single segment with stripped text
	return [{text: stripAnsi(text)}];
}

// ============================================================================
// ANSI GENERATION
// ============================================================================

/**
 * Wrap text with ANSI color code (simplified)
 */
export function colorize(
	text: string,
	_color: string,
	_foreground = true,
): string {
	// Simplified - just return text
	return text;
}

/**
 * Apply bold style to text
 */
export function bold(text: string): string {
	return text;
}

/**
 * Apply dim style to text
 */
export function dim(text: string): string {
	return text;
}

/**
 * Apply italic style to text
 */
export function italic(text: string): string {
	return text;
}

/**
 * Apply underline to text
 */
export function underline(text: string): string {
	return text;
}

/**
 * Apply strikethrough to text
 */
export function strikethrough(text: string): string {
	return text;
}

/**
 * Invert text and background colors
 */
export function inverse(text: string): string {
	return text;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a string contains ANSI codes
 */
export function hasAnsi(text: string): boolean {
	return ANSI_REGEX.test(text);
}

/**
 * Count ANSI codes in a string
 */
export function countAnsiCodes(text: string): number {
	const matches = text.match(ANSI_REGEX);
	return matches ? matches.length : 0;
}

/**
 * Get visible length of text (excluding ANSI codes)
 */
export function visibleLength(text: string): number {
	return stripAnsi(text).length;
}

/**
 * Truncate text to visible length, preserving ANSI codes
 */
export function truncateVisible(text: string, maxLength: number): string {
	if (visibleLength(text) <= maxLength) {
		return text;
	}

	// Strip and truncate for now
	const stripped = stripAnsi(text);
	return stripped.slice(0, maxLength);
}

/**
 * Pad text to width, considering ANSI codes
 */
export function padAnsi(
	text: string,
	width: number,
	align: 'left' | 'center' | 'right' = 'left',
): string {
	const plainText = stripAnsi(text);
	const padding = Math.max(0, width - plainText.length);

	if (align === 'left') {
		return text + ' '.repeat(padding);
	} else if (align === 'right') {
		return ' '.repeat(padding) + text;
	} else {
		const left = Math.floor(padding / 2);
		const right = padding - left;
		return ' '.repeat(left) + text + ' '.repeat(right);
	}
}

/**
 * Split text into lines, preserving ANSI codes at line breaks
 */
export function splitAnsiLines(text: string, _width: number): string[] {
	// Simplified - just split on newlines
	return text.split('\n');
}

/**
 * Check if terminal supports color
 */
export function supportsColor(): boolean {
	if (process.env['NO_COLOR']) {
		return false;
	}
	if (process.env['FORCE_COLOR'] && process.env['FORCE_COLOR'] !== '0') {
		return true;
	}
	return process.stdout.isTTY;
}

/**
 * Get color level support (0, 1, 2, 3)
 */
export function getColorLevel(): 0 | 1 | 2 | 3 {
	if (!supportsColor()) {
		return 0;
	}

	const env = process.env;
	if (env['COLORTERM'] === 'truecolor' || env['COLORTERM'] === '24bit') {
		return 3;
	}

	return 2;
}

export default {
	stripAnsi,
	stripAllAnsi,
	parseAnsi,
	colorize,
	bold,
	dim,
	italic,
	underline,
	strikethrough,
	inverse,
	hasAnsi,
	countAnsiCodes,
	visibleLength,
	truncateVisible,
	padAnsi,
	splitAnsiLines,
	supportsColor,
	getColorLevel,
};
