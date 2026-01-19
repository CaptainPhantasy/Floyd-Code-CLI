/**
 * TerminalEmbed Component
 *
 * Embedded terminal output display with ANSI color support and scrollable output.
 * Features syntax highlighting for common terminal commands and copy-to-clipboard.
 */

import {useState, useEffect, useMemo, type ReactNode} from 'react';
import {Box, Text, useInput} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export interface TerminalLine {
	/** Line content */
	content: string;

	/** Line number */
	lineNumber: number;

	/** Whether this line has ANSI formatting */
	hasAnsi: boolean;

	/** Parsed segments with styling */
	segments?: TerminalSegment[];
}

export interface TerminalSegment {
	/** Segment text */
	text: string;

	/** Text color (hex or ANSI name) */
	color?: string;

	/** Background color */
	backgroundColor?: string;

	/** Bold text */
	bold?: boolean;

	/** Dim text */
	dim?: boolean;

	/** Italic text */
	italic?: boolean;

	/** Underline text */
	underline?: boolean;
}

export interface TerminalOutput {
	/** Raw output string */
	raw: string;

	/** Parsed lines */
	lines: TerminalLine[];

	/** Total lines */
	lineCount: number;

	/** Whether output contains ANSI codes */
	hasAnsi: boolean;
}

export interface TerminalEmbedProps {
	/** Terminal output to display (string or pre-parsed) */
	output: string | TerminalOutput;

	/** Display title */
	title?: string;

	/** Display width */
	width?: number;

	/** Display height (0 for auto) */
	height?: number;

	/** Show line numbers */
	showLineNumbers?: boolean;

	/** Enable scrolling */
	scrollable?: boolean;

	/** Show scroll indicator */
	showScrollIndicator?: boolean;

	/** Highlight patterns to match */
	highlightPatterns?: RegExp[];

	/** Custom ANSI color map */
	colorMap?: Record<number, string>;

	/** Compact mode (less padding) */
	compact?: boolean;

	/** Copy to clipboard callback */
	onCopy?: (content: string) => void;

	/** Status indicator for the terminal */
	status?: 'idle' | 'running' | 'success' | 'error';
}

// ============================================================================
// ANSI PARSING
// ============================================================================

/**
 * ANSI color codes mapping
 */
const ANSI_COLORS: Record<number, string> = {
	// Normal colors
	30: '#3B3B3B', // Black
	31: '#EB4268', // Red
	32: '#12C78F', // Green
	33: '#E8FE96', // Yellow
	34: '#00A4FF', // Blue
	35: '#FF60FF', // Magenta
	36: '#68FFD6', // Cyan
	37: '#DFDBDD', // White

	// Bright colors
	90: '#605F6B', // Bright Black (Gray)
	91: '#FF577D', // Bright Red
	92: '#00FFB2', // Bright Green
	93: '#FFE060', // Bright Yellow
	94: '#4FBEFE', // Bright Blue
	95: '#FF84FF', // Bright Magenta
	96: '#00E6B8', // Bright Cyan
	97: '#FFFAF1', // Bright White

	// Background colors
	40: '#201F26', // Black background
	41: '#383030', // Red background
	42: '#323931', // Green background
	43: '#383830', // Yellow background
	44: '#303038', // Blue background
	45: '#383038', // Magenta background
	46: '#303838', // Cyan background
	47: '#DFDBDD', // White background
};

/**
 * Parse ANSI escape sequences into styled segments
 */
export function parseAnsi(input: string): TerminalSegment[] {
	const segments: TerminalSegment[] = [];
	const defaultSegment: TerminalSegment = {text: ''};
	let currentSegment: TerminalSegment = {...defaultSegment};
	let buffer = '';

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		// Check for ESC sequence
		if (char === '\x1b' && input[i + 1] === '[') {
			// Flush current text
			if (buffer) {
				segments.push({...currentSegment, text: buffer});
				buffer = '';
			}

			// Parse CSI sequence
			let j = i + 2;
			let params = '';

			// Safe character accessor helper
			const charAt = (idx: number): string | null => {
				if (idx >= input.length) return null;
				return input[idx] ?? null;
			};

			let currentChar = charAt(j);
			while (currentChar !== null && currentChar >= '0' && currentChar <= '9') {
				params += currentChar;
				j++;
				currentChar = charAt(j);
			}

			// Handle parameters
			const paramChar = charAt(j);
			if (paramChar === ';') {
				// Multiple parameters - skip second param for now
				j++;
				let nextChar = charAt(j);
				while (nextChar !== null && nextChar >= '0' && nextChar <= '9') {
					j++;
					nextChar = charAt(j);
				}
			}

			const code = Number.parseInt(params || '0', 10);

			// Apply SGR (Select Graphic Rendition) codes
			switch (code) {
				case 0: // Reset
					currentSegment = {...defaultSegment};
					break;
				case 1: // Bold
					currentSegment.bold = true;
					break;
				case 2: // Dim
					currentSegment.dim = true;
					break;
				case 3: // Italic
					currentSegment.italic = true;
					break;
				case 4: // Underline
					currentSegment.underline = true;
					break;
				case 22: // Normal intensity
					delete currentSegment.bold;
					delete currentSegment.dim;
					break;
				case 23: // Not italic
					delete currentSegment.italic;
					break;
				case 24: // Not underlined
					delete currentSegment.underline;
					break;
				default:
					// Color codes
					if (code >= 30 && code <= 37) {
						currentSegment.color = ANSI_COLORS[code];
					} else if (code >= 40 && code <= 47) {
						currentSegment.backgroundColor = ANSI_COLORS[code];
					} else if (code >= 90 && code <= 97) {
						currentSegment.color = ANSI_COLORS[code];
					}
			}

			i = j; // Skip past sequence
		} else {
			buffer += char;
		}
	}

	// Flush remaining buffer
	if (buffer) {
		segments.push({...currentSegment, text: buffer});
	}

	return segments;
}

/**
 * Parse terminal output into lines
 */
export function parseTerminalOutput(output: string): TerminalOutput {
	const lines = output.split('\n');
	const parsedLines: TerminalLine[] = [];

	for (let i = 0; i < lines.length; i++) {
		const content = lines[i] ?? '';
		const hasAnsi = content.includes('\x1b[');
		const segments = hasAnsi ? parseAnsi(content) : undefined;

		parsedLines.push({
			content,
			lineNumber: i + 1,
			hasAnsi,
			segments,
		});
	}

	return {
		raw: output,
		lines: parsedLines,
		lineCount: lines.length,
		hasAnsi: output.includes('\x1b['),
	};
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Strip ANSI codes from string
 */
export function stripAnsi(input: string): string {
	return input.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get terminal status styling
 */
function getStatusStyle(status: 'idle' | 'running' | 'success' | 'error'): {
	color: string;
	icon: string;
} {
	switch (status) {
		case 'running':
			return {color: floydTheme.colors.primary, icon: ''};
		case 'success':
			return {color: floydTheme.colors.success, icon: ''};
		case 'error':
			return {color: floydTheme.colors.error, icon: ''};
		default:
			return {color: floydTheme.colors.fgSubtle, icon: ''};
	}
}

/**
 * Get line number width
 */
function getLineNumberWidth(lineCount: number): number {
	return lineCount.toString().length;
}

// ============================================================================
// RENDER COMPONENTS
// ============================================================================

interface TerminalSegmentRenderProps {
	segment: TerminalSegment;
}

function TerminalSegmentRender({segment}: TerminalSegmentRenderProps) {
	return (
		<Text
			color={segment.color}
			backgroundColor={segment.backgroundColor}
			bold={segment.bold}
			dimColor={segment.dim}
			italic={segment.italic}
			underline={segment.underline}
		>
			{segment.text}
		</Text>
	);
}

interface TerminalLineRenderProps {
	line: TerminalLine;
	lineNumberWidth: number;
	showLineNumber: boolean;
	isHighlighted?: boolean;
}

function TerminalLineRender({
	line,
	lineNumberWidth,
	showLineNumber,
	isHighlighted,
}: TerminalLineRenderProps) {
	return (
		<Box>
			{showLineNumber && (
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{line.lineNumber.toString().padStart(lineNumberWidth)}
				</Text>
			)}
			{showLineNumber && <Text color={floydTheme.colors.border}> </Text>}

			{line.hasAnsi && line.segments ? (
				line.segments.map((seg, idx) => (
					<TerminalSegmentRender key={idx} segment={seg} />
				))
			) : (
				<Text
					backgroundColor={
						isHighlighted ? floydTheme.colors.bgSubtle : undefined
					}
				>
					{line.content}
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TerminalEmbed({
	output,
	title,
	width = 80,
	height = 15,
	showLineNumbers = false,
	scrollable = true,
	showScrollIndicator = true,
	compact = false,
	onCopy,
	status = 'idle',
}: TerminalEmbedProps) {
	// Parse output if string
	const terminalOutput = useMemo(() => {
		if (typeof output === 'string') {
			return parseTerminalOutput(output);
		}
		return output;
	}, [output]);

	const lineNumberWidth = getLineNumberWidth(terminalOutput.lineCount);

	// Scroll state
	const [scrollOffset, setScrollOffset] = useState(0);
	const [selectedLine, setSelectedLine] = useState<number | null>(null);
	const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);

	// Calculate visible range
	const visibleHeight = height - (compact ? 2 : 4);
	const maxScroll = Math.max(0, terminalOutput.lineCount - visibleHeight);
	const clampedScroll = Math.min(scrollOffset, maxScroll);

	// Auto-scroll to bottom on new output
	useEffect(() => {
		if (status === 'running') {
			setScrollOffset(maxScroll);
		}
	}, [terminalOutput.lineCount, maxScroll, status]);

	// Keyboard input
	useInput((input, key) => {
		if (!scrollable) return;

		switch (true) {
			case key.ctrl && input === 'c':
				if (onCopy && selectedLine !== null) {
					onCopy(terminalOutput.lines[selectedLine - 1]?.content || '');
					setShowCopyConfirmation(true);
					setTimeout(() => setShowCopyConfirmation(false), 2000);
				}
				break;

			case key.escape:
				setSelectedLine(null);
				break;

			case key.downArrow:
				setScrollOffset(prev => Math.min(maxScroll, prev + 1));
				break;

			case key.upArrow:
				setScrollOffset(prev => Math.max(0, prev - 1));
				break;

			case key.pageDown:
				setScrollOffset(prev => Math.min(maxScroll, prev + visibleHeight));
				break;

			case key.pageUp:
				setScrollOffset(prev => Math.max(0, prev - visibleHeight));
				break;
		}
	});

	// Get visible lines
	const visibleLines = terminalOutput.lines.slice(
		clampedScroll,
		clampedScroll + visibleHeight,
	);

	// Status style
	const statusStyle = getStatusStyle(status);

	// Render header
	const renderHeader = (): ReactNode => {
		return (
			<Box
				borderStyle="single"
				borderColor={statusStyle.color}
				paddingX={1}
				marginBottom={0}
				justifyContent="space-between"
			>
				<Text bold color={statusStyle.color}>
					{statusStyle.icon} {title || 'Terminal Output'}
				</Text>
				{showCopyConfirmation && (
					<Text color={floydTheme.colors.success}>Copied!</Text>
				)}
				{!showCopyConfirmation && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{terminalOutput.lineCount} lines
					</Text>
				)}
			</Box>
		);
	};

	// Render scroll indicator
	const renderScrollIndicator = (): ReactNode => {
		if (
			!showScrollIndicator ||
			!scrollable ||
			terminalOutput.lineCount <= visibleHeight
		) {
			return null;
		}

		const indicatorWidth = 8;
		const progress = clampedScroll / maxScroll;
		const position = Math.floor(progress * (indicatorWidth - 1));

		return (
			<Box marginLeft={1}>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{'['}
					{Array.from({length: indicatorWidth}).map((_, i) => (
						<Text
							key={i}
							color={
								i === position
									? floydTheme.colors.primary
									: floydTheme.colors.bgSubtle
							}
						>
							{i === position ? '■' : ' '}
						</Text>
					))}
					{']'}
				</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			{renderHeader()}

			{/* Terminal output */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={showLineNumbers ? 0 : 1}
				paddingY={0}
			>
				{visibleLines.length === 0 ? (
					<Box paddingX={1}>
						<Text color={floydTheme.colors.fgSubtle} dimColor italic>
							No output yet...
						</Text>
					</Box>
				) : (
					visibleLines.map(line => (
						<TerminalLineRender
							key={line.lineNumber}
							line={line}
							lineNumberWidth={lineNumberWidth}
							showLineNumber={showLineNumbers}
						/>
					))
				)}

				{/* Padding for empty lines */}
				{visibleLines.length < visibleHeight &&
					Array.from({length: visibleHeight - visibleLines.length}).map(
						(_, i) => (
							<Box key={`pad-${i}`}>
								<Text color={floydTheme.colors.fgSubtle} dimColor>
									{'~'}
								</Text>
							</Box>
						),
					)}
			</Box>

			{/* Footer with scroll indicator */}
			<Box marginTop={0} justifyContent="space-between">
				{renderScrollIndicator()}
				{scrollable && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						arrows: scroll | pgup/pgdn: page
					</Text>
				)}
			</Box>
		</Box>
	);
}

/**
 * CompactTerminal - Minimal terminal output display
 */
export interface CompactTerminalProps {
	/** Output lines to display */
	lines: string[];

	/** Max lines to show */
	maxLines?: number;

	/** Color for output */
	color?: string;
}

export function CompactTerminal({
	lines,
	maxLines = 5,
	color,
}: CompactTerminalProps) {
	const displayLines = lines.slice(-maxLines);

	return (
		<Box flexDirection="column">
			{displayLines.map((line, index) => (
				<Box key={index}>
					<Text color={color || floydTheme.colors.fgBase}>{line}</Text>
				</Box>
			))}

			{lines.length > maxLines && (
				<Box>
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						... (+{lines.length - maxLines} more lines)
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * CommandOutput - Display command execution result
 */
export interface CommandOutputProps {
	/** Command that was run */
	command: string;

	/** Exit code */
	exitCode: number;

	/** Output lines */
	output: string[];

	/** Error output */
	errors?: string[];

	/** Execution time */
	duration?: number;
}

export function CommandOutput({
	command,
	exitCode,
	output,
	errors = [],
	duration,
}: CommandOutputProps) {
	const statusColor =
		exitCode === 0 ? floydTheme.colors.success : floydTheme.colors.error;
	const statusText = exitCode === 0 ? 'Success' : `Exit ${exitCode}`;

	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Command header */}
			<Box>
				<Text color={floydTheme.colors.tertiary}>$</Text>
				<Text color={floydTheme.colors.fgBase}> {command}</Text>
				{duration !== undefined && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{' '}
						({duration}ms)
					</Text>
				)}
			</Box>

			{/* Output */}
			{output.length > 0 && (
				<Box flexDirection="column" marginLeft={2}>
					{output.map((line, i) => (
						<Text key={i} color={floydTheme.colors.fgMuted}>
							{line}
						</Text>
					))}
				</Box>
			)}

			{/* Errors */}
			{errors.length > 0 && (
				<Box flexDirection="column" marginLeft={2}>
					{errors.map((line, i) => (
						<Text key={i} color={floydTheme.colors.error}>
							{line}
						</Text>
					))}
				</Box>
			)}

			{/* Status */}
			<Box>
				<Text color={statusColor}>{statusText}</Text>
			</Box>
		</Box>
	);
}

export default TerminalEmbed;
