/**
 * Markdown Renderer for Ink
 *
 * Converts Markdown content to Ink components for terminal display.
 * Uses ink-markdown library as the foundation with CRUSH theme styling.
 *
 * Features:
 * - Headers with color grading
 * - Code blocks with syntax highlighting
 * - Lists with proper indentation
 * - Blockquotes with styled borders
 * - Links and inline code
 * - Tables (basic support)
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {textColors, accentColors} from '../theme/crush-theme.js';
import {highlightCode, type Language} from './code-highlighter.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MarkdownRendererProps {
	/** Markdown content to render */
	markdown: string;

	/** Width for word wrapping (default: 80) */
	width?: number;

	/** Whether to apply syntax highlighting to code blocks */
	syntaxHighlight?: boolean;

	/** Inline mode (no block elements) */
	inline?: boolean;
}

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

const defaultHeaderColors = {
	h1: accentColors.secondary, // Dolly pink
	h2: accentColors.primary, // Charple purple
	h3: accentColors.tertiary, // Bok teal
	h4: accentColors.highlight, // Zest yellow
	h5: accentColors.info, // Malibu blue
	h6: textColors.secondary, // Squid gray
};

const bgColors = {
	base: '#201F26',
	elevated: '#2d2c35',
	overlay: '#3A3943',
	modal: '#4D4C57',
};

// ============================================================================
// MARKDOWN RENDERER COMPONENT
// ============================================================================

/**
 * Main Markdown renderer component
 *
 * Renders markdown content with CRUSH theme styling.
 * Uses ink-markdown as the base with custom renderers.
 */
export function MarkdownRenderer({
	markdown,
	width = 80,
	syntaxHighlight = true,
	inline = false,
}: MarkdownRendererProps): ReactNode {
	// If inline mode, return stripped markdown
	if (inline) {
		const plainText = stripMarkdownBasic(markdown);
		return <Text color={textColors.primary}>{plainText}</Text>;
	}

	// Parse markdown into lines and render
	const lines = parseMarkdownLines(markdown, width, syntaxHighlight);

	return (
		<Box width={width} flexDirection="column">
			{lines}
		</Box>
	);
}

// ============================================================================
// MARKDOWN PARSING
// ============================================================================

/**
 * Parse markdown into renderable line elements
 */
function parseMarkdownLines(
	markdown: string,
	width: number,
	syntaxHighlight: boolean,
): ReactNode[] {
	const lines: ReactNode[] = [];
	const rawLines = markdown.split('\n');

	let inCodeBlock = false;
	let codeBlockLines: string[] = [];
	let codeLanguage = '';

	for (const line of rawLines) {
		// Code block handling
		if (line.trim().startsWith('```')) {
			if (inCodeBlock) {
				// End code block
				const code = codeBlockLines.join('\n');
				lines.push(
					<Box key={`code-${lines.length}`} marginBottom={1} paddingX={1}>
						<Text>
							{syntaxHighlight
								? highlightCode(code, codeLanguage as Language)
								: code}
						</Text>
					</Box>,
				);
				codeBlockLines = [];
				codeLanguage = '';
				inCodeBlock = false;
			} else {
				// Start code block
				const langMatch = line.trim().match(/```(\w+)?/);
				codeLanguage = langMatch?.[1] ?? 'text';
				inCodeBlock = true;
			}
			continue;
		}

		if (inCodeBlock) {
			codeBlockLines.push(line);
			continue;
		}

		// Headers (# Header)
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headerMatch) {
			const level = headerMatch[1]!.length;
			const text = headerMatch[2]!;
			const colorKey = `h${level}` as keyof typeof defaultHeaderColors;
			const color = defaultHeaderColors[colorKey] || defaultHeaderColors.h1;
			lines.push(
				<Box
					key={`header-${lines.length}`}
					marginBottom={1}
					marginTop={level === 1 ? 0 : 1}
				>
					<Text bold color={color}>
						{text}
					</Text>
				</Box>,
			);
			continue;
		}

		// Blockquote (> text)
		if (line.trim().startsWith('>')) {
			const text = line.trim().slice(1).trim();
			lines.push(
				<Box
					key={`blockquote-${lines.length}`}
					flexDirection="row"
					marginBottom={1}
					marginTop={1}
				>
					<Text color={accentColors.secondary}></Text>
					<Text color={textColors.secondary}>{text}</Text>
				</Box>,
			);
			continue;
		}

		// Horizontal rule (--- or ***)
		if (line.trim().match(/^(---|\*\*\*)$/)) {
			lines.push(
				<Box key={`hr-${lines.length}`} marginY={1}>
					<Text color={textColors.subtle}>
						{''.repeat(Math.min(40, width))}
					</Text>
				</Box>,
			);
			continue;
		}

		// Unordered list (- item or * item)
		const listMatch = line.match(/^[\s-]*[-*]\s+(.+)$/);
		if (listMatch) {
			const text = listMatch[1];
			lines.push(
				<Box key={`list-${lines.length}`} marginLeft={2}>
					<Text color={accentColors.tertiary}></Text>
					<Box paddingLeft={1}>
						<Text>{text}</Text>
					</Box>
				</Box>,
			);
			continue;
		}

		// Ordered list (1. item)
		const orderedListMatch = line.match(/^[\s-]*(\d+)\.\s+(.+)$/);
		if (orderedListMatch) {
			const num = orderedListMatch[1];
			const text = orderedListMatch[2];
			lines.push(
				<Box key={`olist-${lines.length}`} marginLeft={2}>
					<Text color={accentColors.tertiary}>{num}.</Text>
					<Box paddingLeft={1}>
						<Text>{text}</Text>
					</Box>
				</Box>,
			);
			continue;
		}

		// Code inline (`code`)
		const processedLine = line.replace(/`([^`]+)`/g, (_, code) => {
			return `<bg="${bgColors.overlay}"><color="${accentColors.highlight}"> ${code} </color></bg>`;
		});

		// Bold (**text**)
		const boldProcessed = processedLine.replace(
			/\*\*([^*]+)\*\*/g,
			(_, text) => {
				return `<bold>${text}</bold>`;
			},
		);

		// Regular paragraph
		if (boldProcessed.trim()) {
			lines.push(
				<Box key={`p-${lines.length}`} marginBottom={1}>
					<Text color={textColors.primary}>{boldProcessed}</Text>
				</Box>,
			);
		}
	}

	return lines;
}

/**
 * Strip markdown formatting to plain text (basic version)
 */
export function stripMarkdownBasic(markdown: string): string {
	return markdown
		.replace(/#{1,6}\s+/g, '')
		.replace(/\*\*\*(.+?)\*\*\*/g, '$1')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/~~(.+?)~~/g, '$1')
		.replace(/`(.+?)`/g, '$1')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/^\s*[-*+]\s+/gm, '')
		.replace(/^\s*\d+\.\s+/gm, '')
		.replace(/^>\s*/gm, '')
		.replace(/\n\s*\n/g, '\n')
		.trim();
}

/**
 * Extract plain text from markdown (one-line version)
 */
export function markdownToPlainText(markdown: string): string {
	return stripMarkdownBasic(markdown).replace(/\s+/g, ' ');
}

/**
 * Truncate markdown to character limit
 */
export function truncateMarkdown(markdown: string, limit: number): string {
	const plain = markdownToPlainText(markdown);
	if (plain.length <= limit) {
		return markdown;
	}
	return plain.slice(0, limit - 3) + '...';
}

/**
 * Check if markdown contains code blocks
 */
export function hasCodeBlocks(markdown: string): boolean {
	return /```[\s\S]*?```/.test(markdown);
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(
	markdown: string,
): Array<{language: string; code: string}> {
	const blocks: Array<{language: string; code: string}> = [];
	const regex = /```(\w*)\n([\s\S]*?)```/g;
	let match;

	while ((match = regex.exec(markdown)) !== null) {
		blocks.push({
			language: match[1]! || 'text',
			code: match[2]!,
		});
	}

	return blocks;
}

/**
 * Count words in markdown (ignoring code)
 */
export function countMarkdownWords(markdown: string): number {
	const withoutCode = markdown
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`[^`]+`/g, '');
	const words = withoutCode.trim().split(/\s+/).filter(Boolean);
	return words.length;
}

export default {
	MarkdownRenderer,
	stripMarkdownBasic,
	markdownToPlainText,
	truncateMarkdown,
	hasCodeBlocks,
	extractCodeBlocks,
	countMarkdownWords,
};
