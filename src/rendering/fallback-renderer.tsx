/**
 * Fallback Renderer for Ink
 *
 * Text-only fallback rendering for environments without rich terminal support.
 * Used when running in CI, dumb terminals, or non-TTY contexts.
 *
 * Features:
 * - Plain text output
 * - ASCII-only characters
 * - No color codes
 * - No ANSI escape sequences
 * - Log-style formatting
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {stripAnsi, stripAllAnsi} from './ansi-parser.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FallbackRendererProps {
	/** Content to render */
	children: ReactNode;

	/** Label for the output */
	label?: string;

	/** Show timestamp */
	timestamp?: boolean;

	/** Output format */
	format?: 'plain' | 'log' | 'compact';
}

export interface FallbackTextProps {
	/** Text content */
	children: string;

	/** Style hint (for potential minimal formatting) */
	style?: 'header' | 'error' | 'warning' | 'info' | 'success';

	/** Prefix character */
	prefix?: string;
}

// ============================================================================
// FALLBACK RENDERER COMPONENT
// ============================================================================

/**
 * Plain text fallback renderer
 */
export function FallbackRenderer({
	children,
	label,
	timestamp = false,
	format = 'plain',
}: FallbackRendererProps): ReactNode {
	const timestampStr = timestamp ? `[${new Date().toISOString()}] ` : '';
	const labelStr = label ? `${label}: ` : '';

	// Extract text content from ReactNode
	const content = extractText(children);

	// Clean any ANSI codes
	const cleanContent = stripAllAnsi(content);

	return (
		<Box flexDirection="column">
			{format === 'log' && (
				<Text>
					{timestampStr}
					{labelStr}
					{cleanContent}
				</Text>
			)}
			{format === 'compact' && (
				<Text>
					{labelStr}
					{cleanContent}
				</Text>
			)}
			{format === 'plain' && <Text>{cleanContent}</Text>}
		</Box>
	);
}

// ============================================================================
// FALLBACK TEXT COMPONENT
// ============================================================================

/**
 * Text component with minimal formatting hints
 */
export function FallbackText({
	children,
	style = 'info',
	prefix,
}: FallbackTextProps): ReactNode {
	const cleanText = stripAllAnsi(String(children));

	// Add style-based prefix
	const prefixes: Record<string, string> = {
		header: '===',
		error: '[ERROR]',
		warning: '[WARN]',
		info: '[INFO]',
		success: '[OK]',
	};

	const effectivePrefix = prefix ?? prefixes[style] ?? '';

	return (
		<Text>
			{effectivePrefix ? `${effectivePrefix} ` : ''}
			{cleanText}
		</Text>
	);
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Fallback header component
 */
export interface FallbackHeaderProps {
	children: ReactNode;
	level?: 1 | 2 | 3;
}

export function FallbackHeader({
	children,
	level = 1,
}: FallbackHeaderProps): ReactNode {
	const text = extractText(children);
	const cleanText = stripAllAnsi(text);

	const prefix = level === 1 ? '===' : level === 2 ? '---' : '---';

	return (
		<Text>
			{prefix} {cleanText} {prefix}
		</Text>
	);
}

/**
 * Fallback list component
 */
export interface FallbackListProps {
	items: string[];
	ordered?: boolean;
}

export function FallbackList({
	items,
	ordered = false,
}: FallbackListProps): ReactNode {
	return (
		<Box flexDirection="column">
			{items.map((item, index) => (
				<Text key={index}>
					{ordered ? `${index + 1}. ` : '- '}
					{item}
				</Text>
			))}
		</Box>
	);
}

/**
 * Fallback divider
 */
export interface FallbackDividerProps {
	width?: number;
	char?: string;
}

export function FallbackDivider({
	width = 40,
	char = '-',
}: FallbackDividerProps): ReactNode {
	return <Text>{char.repeat(width)}</Text>;
}

/**
 * Fallback code block
 */
export interface FallbackCodeProps {
	code: string;
	language?: string;
}

export function FallbackCode({code, language}: FallbackCodeProps): ReactNode {
	const lines = code.split('\n');
	const langPrefix = language ? `[${language}] ` : '';

	return (
		<Box flexDirection="column">
			<Text dimColor>{langPrefix}---</Text>
			{lines.map((line, index) => (
				<Text key={index}>
					{'  '}
					{line}
				</Text>
			))}
			<Text dimColor>
				---{' '.repeat(Math.max(0, 10 - (language?.length ?? 0)))}
			</Text>
		</Box>
	);
}

/**
 * Fallback table
 */
export interface FallbackTableProps {
	headers: string[];
	rows: string[][];
}

export function FallbackTable({headers, rows}: FallbackTableProps): ReactNode {
	// Calculate column widths
	const colWidths = headers.map((_h, i) => {
		const maxInRows = rows.reduce((max, row) => {
			const cellLen = stripAllAnsi(row[i] ?? '').length;
			return Math.max(max, cellLen);
		}, 0);
		return Math.max(headers[i]!.length, maxInRows);
	});

	// Create separator line
	const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Text>{separator}</Text>
			<Text>
				{'| '}
				{headers.map((h, i) => h.padEnd(colWidths[i]!)).join(' | ')}
				{' |'}
			</Text>
			<Text>{separator}</Text>

			{/* Rows */}
			{rows.map((row, rowIndex) => (
				<Text key={rowIndex}>
					{'| '}
					{row
						.map((cell, i) => stripAllAnsi(cell).padEnd(colWidths[i]!))
						.join(' | ')}
					{' |'}
				</Text>
			))}

			{/* Bottom */}
			<Text>{separator}</Text>
		</Box>
	);
}

/**
 * Fallback progress indicator
 */
export interface FallbackProgressProps {
	current: number;
	total: number;
	label?: string;
}

export function FallbackProgress({
	current,
	total,
	label,
}: FallbackProgressProps): ReactNode {
	const percentage = Math.round((current / total) * 100);
	const barWidth = 20;
	const filled = Math.round((current / total) * barWidth);

	return (
		<Text>
			{label ? `${label}: ` : ''}
			{'['}
			{'#'.repeat(filled)}
			{'-'.repeat(barWidth - filled)}
			{'] '}
			{percentage}%{' ('}
			{current}/{total}
			{')'}
		</Text>
	);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract plain text from ReactNode
 */
function extractText(node: ReactNode): string {
	if (typeof node === 'string') {
		return node;
	}
	if (typeof node === 'number') {
		return String(node);
	}
	if (node === null || node === undefined) {
		return '';
	}
	if (Array.isArray(node)) {
		return node.map(extractText).join('');
	}
	// For React elements, try to get children
	if (typeof node === 'object' && 'props' in node) {
		return extractText(node.props?.children ?? '');
	}
	return '';
}

/**
 * Check if fallback rendering is needed
 */
export function needsFallback(): boolean {
	return (
		!process.stdout.isTTY ||
		process.env['NODE_ENV'] === 'test' ||
		process.env['CI'] === 'true'
	);
}

/**
 * Get fallback character set
 */
export function getFallbackChars() {
	return {
		bullet: '*',
		check: 'v',
		cross: 'x',
		arrow: '->',
		dots: '...',
		horizontal: '-',
		vertical: '|',
		topLeft: '+',
		topRight: '+',
		bottomLeft: '+',
		bottomRight: '+',
	};
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	FallbackRenderer,
	FallbackText,
	FallbackHeader,
	FallbackList,
	FallbackDivider,
	FallbackCode,
	FallbackTable,
	FallbackProgress,
	needsFallback,
	getFallbackChars,
	stripAnsi,
	stripAllAnsi,
};
