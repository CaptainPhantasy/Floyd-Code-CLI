/**
 * Text Formatter Utilities
 *
 * Comprehensive text formatting utilities for terminal display.
 * Combines ANSI parsing, word wrapping, truncation, and alignment.
 *
 * Features:
 * - Word wrapping with width constraints
 * - Text truncation with ellipsis
 * - Text alignment (left, center, right)
 * - Table formatting
 * - List formatting
 * - Progress bar rendering
 * - Spinner frames
 */

// ============================================================================
// TYPES
// ============================================================================

export type Alignment = 'left' | 'center' | 'right';

export interface TableColumn {
	/** Header text */
	header: string;

	/** Column width (auto if not specified) */
	width?: number;

	/** Column alignment */
	align?: Alignment;
}

export interface ListOptions {
	/** Bullet style */
	bullet?: 'disc' | 'circle' | 'square' | 'dash' | 'number';

	/** Indentation level */
	indent?: number;

	/** Spacing between items */
	spacing?: number;
}

// ============================================================================
// WORD WRAPPING
// ============================================================================

/**
 * Wrap text to specified width
 *
 * @param text - Text to wrap
 * @param width - Maximum line width
 * @returns Array of wrapped lines
 */
export function wrapText(text: string, width: number): string[] {
	const words = text.split(/(\s+)/);
	const lines: string[] = [];
	let currentLine = '';
	let currentLength = 0;

	for (const word of words) {
		const isWhitespace = /^\s+$/.test(word);
		const wordLength = word.length;

		if (isWhitespace) {
			if (currentLine && currentLength + wordLength <= width) {
				currentLine += word;
				currentLength += wordLength;
			}
			continue;
		}

		if (wordLength > width) {
			// Word is longer than line width
			if (currentLine) {
				lines.push(currentLine);
				currentLine = '';
				currentLength = 0;
			}
			lines.push(word);
		} else if (currentLength + wordLength > width) {
			// Start new line
			lines.push(currentLine);
			currentLine = word;
			currentLength = wordLength;
		} else {
			// Add to current line
			currentLine += word;
			currentLength += wordLength;
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	return lines;
}

/**
 * Wrap text without preserving ANSI codes
 */
export function wrapPlainText(text: string, width: number): string[] {
	return wrapText(text, width);
}

// ============================================================================
// TEXT TRUNCATION
// ============================================================================

/**
 * Truncate text to specified length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum visible length
 * @param ellipsis - Ellipsis string (default: '...')
 * @param position - Where to truncate ('start', 'middle', 'end')
 * @returns Truncated text
 */
export function truncateText(
	text: string,
	maxLength: number,
	ellipsis = '...',
	position: 'start' | 'middle' | 'end' = 'end',
): string {
	const textLen = text.length;

	if (textLen <= maxLength) {
		return text;
	}

	const ellipsisLen = ellipsis.length;
	const textLenRemaining = maxLength - ellipsisLen;

	if (textLenRemaining <= 0) {
		return ellipsis.slice(0, maxLength);
	}

	switch (position) {
		case 'start':
			return ellipsis + text.slice(-textLenRemaining);
		case 'middle':
			const half = Math.floor(textLenRemaining / 2);
			return text.slice(0, half) + ellipsis + text.slice(-half);
		case 'end':
		default:
			return text.slice(0, textLenRemaining) + ellipsis;
	}
}

/**
 * Truncate text in the middle
 */
export function truncateMiddle(
	text: string,
	maxLength: number,
	ellipsis = '...',
): string {
	return truncateText(text, maxLength, ellipsis, 'middle');
}

/**
 * Truncate text at the start
 */
export function truncateStart(
	text: string,
	maxLength: number,
	ellipsis = '...',
): string {
	return truncateText(text, maxLength, ellipsis, 'start');
}

// ============================================================================
// TEXT ALIGNMENT
// ============================================================================

/**
 * Align text within a width
 *
 * @param text - Text to align
 * @param width - Total width
 * @param align - Alignment type
 * @returns Aligned text
 */
export function alignText(
	text: string,
	width: number,
	align: Alignment = 'left',
): string {
	const textLen = text.length;
	const padding = Math.max(0, width - textLen);

	if (padding === 0) {
		return text;
	}

	switch (align) {
		case 'center':
			const left = Math.floor(padding / 2);
			const right = padding - left;
			return ' '.repeat(left) + text + ' '.repeat(right);
		case 'right':
			return ' '.repeat(padding) + text;
		case 'left':
		default:
			return text + ' '.repeat(padding);
	}
}

/**
 * Center text within width
 */
export function centerText(text: string, width: number): string {
	return alignText(text, width, 'center');
}

/**
 * Right-align text within width
 */
export function rightAlignText(text: string, width: number): string {
	return alignText(text, width, 'right');
}

// ============================================================================
// TABLE FORMATTING
// ============================================================================

/**
 * Calculate column widths for a table
 */
function calculateColumnWidths(rows: string[][], headers: string[]): number[] {
	const columnCount = headers.length;
	const widths: number[] = headers.map(h => h.length);

	// Check each row
	for (const row of rows) {
		for (let i = 0; i < Math.min(columnCount, row.length); i++) {
			const cellLength = row[i]?.length ?? 0;
			widths[i] = Math.max(widths[i]!, cellLength);
		}
	}

	return widths;
}

/**
 * Render a table
 *
 * @param headers - Column headers
 * @param rows - Data rows
 * @returns Formatted table string
 */
export function renderTable(headers: string[], rows: string[][]): string {
	const colWidths = calculateColumnWidths(rows, headers);
	const lines: string[] = [];

	// Create separator line
	const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';

	// Header
	lines.push(separator);
	lines.push(
		'| ' + headers.map((h, i) => h.padEnd(colWidths[i]!)).join(' | ') + ' |',
	);
	lines.push(separator);

	// Data rows
	for (const row of rows) {
		const cells = row.map((cell, i) => (cell ?? '').padEnd(colWidths[i]!));
		lines.push('| ' + cells.join(' | ') + ' |');
	}

	// Bottom
	lines.push(separator);

	return lines.join('\n');
}

/**
 * Render a simple table without borders
 */
export function renderSimpleTable(headers: string[], rows: string[][]): string {
	return renderTable(headers, rows);
}

// ============================================================================
// LIST FORMATTING
// ============================================================================

/**
 * Render a list
 *
 * @param items - List items
 * @param options - List options
 * @returns Formatted list string
 */
export function renderList(items: string[], options: ListOptions = {}): string {
	const {bullet = 'disc', indent = 0, spacing = 0} = options;

	const bullets: Record<string, string> = {
		disc: '',
		circle: 'o',
		square: '',
		dash: '—',
	};

	const bulletChar = bullet === 'number' ? '' : bullets[bullet] ?? '*';
	const indentStr = ' '.repeat(indent);
	const spacingStr = '\n'.repeat(spacing);

	return items
		.map((item, index) => {
			const prefix = bullet === 'number' ? `${index + 1}.` : bulletChar;
			return `${indentStr}${prefix} ${item}`;
		})
		.join(spacingStr);
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

/**
 * Spinner frame sets for loading indicators
 */
export const spinnerFrames: Record<string, string[]> = {
	dots: ['', '', '', '', '', '', '', '', ''],
	dots2: ['', '', '', '', '', '', '', ''],
	line: ['-', '\\', '|', '/'],
	arrow: ['<', '^', '>', 'v'],
};

/**
 * Get spinner frame
 *
 * @param name - Spinner name
 * @param index - Frame index
 * @returns Spinner character
 */
export function getSpinnerFrame(
	name: keyof typeof spinnerFrames = 'dots',
	index = 0,
): string {
	const frames = spinnerFrames[name] ?? spinnerFrames['dots']!;
	return frames[index % frames.length]!;
}

/**
 * Get all spinner names
 */
export function getSpinnerNames(): string[] {
	return Object.keys(spinnerFrames);
}

// ============================================================================
// DIVIDERS
// ============================================================================

/**
 * Render a horizontal divider
 *
 * @param width - Divider width
 * @param char - Divider character
 * @returns Divider string
 */
export function renderDivider(width: number, char = '-'): string {
	return char.repeat(width);
}

/**
 * Render a section header
 */
export function renderSectionHeader(
	title: string,
	width: number,
	char = '-',
	padding = 1,
): string {
	const titleLen = title.length;
	const remaining = width - titleLen - padding * 2;
	const left = Math.floor(remaining / 2);
	const right = remaining - left;

	return `${char.repeat(left)}${' '.repeat(padding)}${title}${' '.repeat(
		padding,
	)}${char.repeat(right)}`;
}

// ============================================================================
// TEXT TRANSFORMATION
// ============================================================================

/**
 * Convert text to title case
 */
export function toTitleCase(text: string): string {
	return text
		.toLowerCase()
		.split(/\s+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Convert text to kebab-case
 */
export function toKebabCase(text: string): string {
	return text
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
}

/**
 * Convert text to snake_case
 */
export function toSnakeCase(text: string): string {
	return text
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.replace(/[\s-]+/g, '_')
		.toLowerCase();
}

/**
 * Convert text to camelCase
 */
export function toCamelCase(text: string): string {
	return text
		.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
		.replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Indent text lines
 */
export function indentText(
	text: string,
	spaces: number,
	skipFirst = false,
): string {
	const indent = ' '.repeat(spaces);
	const lines = text.split('\n');

	if (skipFirst) {
		return lines.map((line, i) => (i === 0 ? line : indent + line)).join('\n');
	}

	return lines.map(line => indent + line).join('\n');
}

/**
 * Dedent text (remove common leading whitespace)
 */
export function dedentText(text: string): string {
	const lines = text.split('\n');
	const nonEmptyLines = lines.filter(line => line.trim().length > 0);

	if (nonEmptyLines.length === 0) {
		return text;
	}

	const commonIndent = nonEmptyLines.reduce((min, line) => {
		const indent = line.match(/^\s*/)?.[0].length ?? 0;
		return Math.min(min, indent);
	}, Infinity);

	if (commonIndent === 0) {
		return text;
	}

	return lines.map(line => line.slice(commonIndent)).join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	// Wrapping
	wrapText,
	wrapPlainText,

	// Truncation
	truncateText,
	truncateMiddle,
	truncateStart,

	// Alignment
	alignText,
	centerText,
	rightAlignText,

	// Tables
	renderTable,
	renderSimpleTable,

	// Lists
	renderList,

	// Progress
	spinnerFrames,
	getSpinnerFrame,
	getSpinnerNames,

	// Dividers
	renderDivider,
	renderSectionHeader,

	// Transformation
	toTitleCase,
	toKebabCase,
	toSnakeCase,
	toCamelCase,
	indentText,
	dedentText,
};
