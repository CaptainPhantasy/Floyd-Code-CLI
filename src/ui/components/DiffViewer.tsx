/**
 * DiffViewer Component
 *
 * Side-by-side and unified diff display with color-coded additions and deletions.
 * Features line numbers, hunk navigation, and syntax-aware highlighting.
 */

import {useState, useEffect, useMemo, type ReactNode} from 'react';
import {Box, Text, useInput} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type DiffLineType = 'context' | 'addition' | 'deletion' | 'header';

export interface DiffLine {
	/** Line number in the new file (or null for deletions) */
	newLineNumber: number | null;

	/** Line number in the old file (or null for additions) */
	oldLineNumber: number | null;

	/** Line type */
	type: DiffLineType;

	/** Line content */
	content: string;

	/** Whether this line is selected/focused */
	selected?: boolean;
}

export interface DiffHunk {
	/** Hunk header (e.g., @@ -10,7 +10,9 @@) */
	header: string;

	/** Old file start line */
	oldStart: number;

	/** Old file line count */
	oldCount: number;

	/** New file start line */
	newStart: number;

	/** New file line count */
	newCount: number;

	/** Lines in this hunk */
	lines: DiffLine[];

	/** Hunk index */
	index: number;
}

export interface DiffFile {
	/** File path (old) */
	oldPath: string;

	/** File path (new) */
	newPath: string;

	/** Change type */
	changeType: 'added' | 'deleted' | 'modified' | 'renamed';

	/** Diff hunks */
	hunks: DiffHunk[];

	/** Total additions */
	additions: number;

	/** Total deletions */
	deletions: number;
}

export interface DiffViewerProps {
	/** Diff data to display */
	diff: DiffFile | DiffFile[];

	/** Show line numbers */
	showLineNumbers?: boolean;

	/** Show hunk headers */
	showHunkHeaders?: boolean;

	/** Max width for wrapping */
	width?: number;

	/** Max height before scrolling */
	maxHeight?: number;

	/** Initial focused hunk index */
	initialHunk?: number;

	/** Callback when navigation changes */
	onNavigate?: (hunkIndex: number) => void;

	/** Compact mode (less padding) */
	compact?: boolean;

	/** Enable keyboard navigation */
	enableNavigation?: boolean;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse unified diff format into structured data
 */
export function parseUnifiedDiff(diffText: string): DiffFile[] {
	const files: DiffFile[] = [];
	const lines = diffText.split('\n');

	let currentFile: Partial<DiffFile> | null = null;
	let currentHunk: Partial<DiffHunk> | null = null;
	let oldLineNumber = 0;
	let newLineNumber = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		// File header
		if (line.startsWith('--- ')) {
			currentFile = {
				oldPath: line.slice(4),
				newPath: '',
				changeType: 'modified',
				hunks: [],
				additions: 0,
				deletions: 0,
			};
			continue;
		}

		if (line.startsWith('+++ ')) {
			if (currentFile) {
				currentFile.newPath = line.slice(4);

				// Determine change type
				if (currentFile.oldPath === '/dev/null') {
					currentFile.changeType = 'added';
				} else if (currentFile.newPath === '/dev/null') {
					currentFile.changeType = 'deleted';
				} else if (currentFile.oldPath !== currentFile.newPath) {
					currentFile.changeType = 'renamed';
				}

				files.push(currentFile as DiffFile);
			}
			continue;
		}

		// Hunk header
		const hunkMatch = line.match(/^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
		if (hunkMatch && currentFile) {
			// Save previous hunk
			if (currentHunk) {
				(currentFile.hunks as DiffHunk[]).push(currentHunk as DiffHunk);
			}

			const oldStart = Number.parseInt(hunkMatch[1] ?? '1', 10);
			const oldCount = hunkMatch[2] ? Number.parseInt(hunkMatch[2], 10) : 1;
			const newStart = Number.parseInt(hunkMatch[3] ?? '1', 10);
			const newCount = hunkMatch[4] ? Number.parseInt(hunkMatch[4], 10) : 1;

			currentHunk = {
				header: line,
				oldStart,
				oldCount,
				newStart,
				newCount,
				lines: [],
				index: (currentFile.hunks as DiffHunk[]).length,
			};

			oldLineNumber = oldStart;
			newLineNumber = newStart;
			continue;
		}

		// Diff lines
		if (currentHunk && currentFile) {
			let type: DiffLineType;
			let oldLine: number | null = null;
			let newLine: number | null = null;

			if (line.startsWith('+')) {
				type = 'addition';
				newLine = newLineNumber++;
				currentFile.additions = (currentFile.additions ?? 0) + 1;
			} else if (line.startsWith('-')) {
				type = 'deletion';
				oldLine = oldLineNumber++;
				currentFile.deletions = (currentFile.deletions ?? 0) + 1;
			} else {
				type = 'context';
				oldLine = oldLineNumber++;
				newLine = newLineNumber++;
			}

			currentHunk.lines = currentHunk.lines ?? [];
			currentHunk.lines.push({
				oldLineNumber: oldLine,
				newLineNumber: newLine,
				type,
				content: line.slice(1),
			});
		}
	}

	// Add last hunk
	if (currentHunk && currentFile) {
		currentFile.hunks = currentFile.hunks ?? [];
		currentFile.hunks.push(currentHunk as DiffHunk);
	}

	return files;
}

/**
 * Get line styling based on type
 */
function getLineStyles(type: DiffLineType): {
	background: string;
	symbol: string;
	symbolColor: string;
	textColor: string;
} {
	switch (type) {
		case 'addition':
			return {
				background: '#323931',
				symbol: '+',
				symbolColor: '#629657',
				textColor: floydTheme.colors.fgBase,
			};
		case 'deletion':
			return {
				background: '#383030',
				symbol: '-',
				symbolColor: '#a45c59',
				textColor: floydTheme.colors.fgBase,
			};
		case 'header':
			return {
				background: floydTheme.colors.bgSubtle,
				symbol: '@',
				symbolColor: floydTheme.colors.info,
				textColor: floydTheme.colors.fgMuted,
			};
		default:
			return {
				background: 'transparent',
				symbol: ' ',
				symbolColor: floydTheme.colors.fgSubtle,
				textColor: floydTheme.colors.fgBase,
			};
	}
}

/**
 * Format line number for display
 */
function formatLineNumber(num: number | null, width: number): string {
	if (num === null) return ''.padStart(width);
	return num.toString().padStart(width);
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface DiffLineComponentProps {
	line: DiffLine;
	showLineNumbers: boolean;
	lineNumberWidth: number;
	width: number;
}

function DiffLineComponent({
	line,
	showLineNumbers,
	lineNumberWidth,
	width,
}: DiffLineComponentProps) {
	const styles = getLineStyles(line.type);

	// Truncate content to fit width
	const availableWidth =
		width - (showLineNumbers ? lineNumberWidth * 2 + 4 : 2);
	const content =
		line.content.length > availableWidth
			? line.content.slice(0, availableWidth - 1) + ''
			: line.content;

	return (
		<Box>
			{/* Old line number */}
			{showLineNumbers && (
				<Text color={styles.symbolColor} dimColor>
					{' '.repeat(
						Math.max(
							0,
							lineNumberWidth -
								formatLineNumber(line.oldLineNumber, lineNumberWidth).length,
						),
					)}
					{formatLineNumber(line.oldLineNumber, lineNumberWidth)}
				</Text>
			)}

			{/* New line number */}
			{showLineNumbers && (
				<Text color={styles.symbolColor} dimColor>
					{' '.repeat(
						Math.max(
							0,
							lineNumberWidth -
								formatLineNumber(line.newLineNumber, lineNumberWidth).length,
						),
					)}
					{formatLineNumber(line.newLineNumber, lineNumberWidth)}
				</Text>
			)}

			{/* Diff symbol */}
			<Text color={styles.symbolColor} bold={line.type !== 'context'}>
				{styles.symbol}
			</Text>

			{/* Line content */}
			<Text color={styles.textColor}>{content}</Text>
		</Box>
	);
}

interface DiffHunkComponentProps {
	hunk: DiffHunk;
	showLineNumbers: boolean;
	showHeader: boolean;
	lineNumberWidth: number;
	width: number;
	focusedLineIndex?: number;
}

function DiffHunkComponent({
	hunk,
	showLineNumbers,
	showHeader,
	lineNumberWidth,
	width,
	focusedLineIndex,
}: DiffHunkComponentProps) {
	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Hunk header */}
			{showHeader && (
				<Box>
					<Text color={floydTheme.colors.info} bold>
						{hunk.header}
					</Text>
				</Box>
			)}

			{/* Hunk lines */}
			{hunk.lines.map((line, index) => (
				<DiffLineComponent
					key={`${hunk.index}-${index}`}
					line={{
						...line,
						selected: focusedLineIndex === index,
					}}
					showLineNumbers={showLineNumbers}
					lineNumberWidth={lineNumberWidth}
					width={width}
				/>
			))}
		</Box>
	);
}

export function DiffViewer({
	diff,
	showLineNumbers = true,
	showHunkHeaders = true,
	width = 80,
	initialHunk = 0,
	onNavigate,
	enableNavigation = true,
}: DiffViewerProps) {
	// Normalize single file to array
	const files = useMemo(() => {
		return Array.isArray(diff) ? diff : [diff];
	}, [diff]);

	// Calculate line number width
	const lineNumberWidth = useMemo(() => {
		let maxLine = 0;
		for (const file of files) {
			for (const hunk of file.hunks) {
				for (const line of hunk.lines) {
					if (line.oldLineNumber && line.oldLineNumber > maxLine) {
						maxLine = line.oldLineNumber;
					}
					if (line.newLineNumber && line.newLineNumber > maxLine) {
						maxLine = line.newLineNumber;
					}
				}
			}
		}
		return maxLine.toString().length;
	}, [files]);

	// State for multi-file navigation
	const [focusedFileIndex, setFocusedFileIndex] = useState(0);
	const [focusedHunkIndex, setFocusedHunkIndex] = useState(initialHunk);

	// Get current focused elements
	const focusedFile = files[focusedFileIndex];

	// Keyboard navigation
	useInput((input, key) => {
		if (!enableNavigation) return;

		switch (true) {
			case key.ctrl && input === 'n':
				// Next file
				setFocusedFileIndex(prev => Math.min(files.length - 1, prev + 1));
				setFocusedHunkIndex(0);
				break;

			case key.ctrl && input === 'p':
				// Previous file
				setFocusedFileIndex(prev => Math.max(0, prev - 1));
				setFocusedHunkIndex(0);
				break;

			case key.ctrl && input === 'j':
			case key.tab && key.shift:
				// Previous hunk
				setFocusedHunkIndex(prev => Math.max(0, prev - 1));
				break;

			case key.ctrl && input === 'k':
			case key.tab:
				// Next hunk
				if (focusedFile) {
					setFocusedHunkIndex(prev =>
						Math.min(focusedFile.hunks.length - 1, prev + 1),
					);
				}
				break;
		}
	});

	// Notify parent of navigation changes
	useEffect(() => {
		onNavigate?.(focusedHunkIndex);
	}, [focusedHunkIndex, onNavigate]);

	// Render file header
	const renderFileHeader = (file: DiffFile, isFocused: boolean): ReactNode => {
		const changeIcon = {
			added: '+',
			deleted: '-',
			modified: '~',
			renamed: '→',
		}[file.changeType];

		const changeColor = {
			added: floydTheme.colors.success,
			deleted: floydTheme.colors.error,
			modified: floydTheme.colors.primary,
			renamed: floydTheme.colors.tertiary,
		}[file.changeType];

		return (
			<Box
				borderStyle="single"
				borderColor={
					isFocused ? floydTheme.colors.borderFocus : floydTheme.colors.border
				}
				paddingX={1}
				marginBottom={1}
			>
				<Text color={changeColor} bold>
					{changeIcon} {file.newPath || file.oldPath}
				</Text>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{' '}
					+{file.additions} -{file.deletions}
				</Text>
			</Box>
		);
	};

	// Render single file diff
	const renderFileDiff = (file: DiffFile, fileIndex: number): ReactNode => {
		const isFocused = fileIndex === focusedFileIndex;

		return (
			<Box
				key={file.oldPath || file.newPath}
				flexDirection="column"
				marginBottom={2}
			>
				{renderFileHeader(file, isFocused)}

				{file.hunks.map((hunk, hunkIdx) => (
					<DiffHunkComponent
						key={hunkIdx}
						hunk={hunk}
						showLineNumbers={showLineNumbers}
						showHeader={showHunkHeaders}
						lineNumberWidth={lineNumberWidth}
						width={width}
					/>
				))}

				{file.hunks.length === 0 && (
					<Text color={floydTheme.colors.fgSubtle} dimColor italic>
						No changes
					</Text>
				)}
			</Box>
		);
	};

	return (
		<Box flexDirection="column" width={width}>
			{/* Toolbar */}
			{enableNavigation && files.length > 1 && (
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					paddingX={1}
					marginBottom={1}
					justifyContent="space-between"
				>
					<Text color={floydTheme.colors.fgMuted}>
						Files: {focusedFileIndex + 1}/{files.length}
					</Text>
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{focusedHunkIndex + 1}/{focusedFile?.hunks.length || 0} hunks
					</Text>
				</Box>
			)}

			{/* Diff content */}
			{files.map((file, index) => renderFileDiff(file, index))}

			{/* Navigation hints */}
			{enableNavigation && (
				<Box marginTop={1}>
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						tab: next hunk | shift+tab: prev hunk | ctrl+n/p: file
					</Text>
				</Box>
			)}
		</Box>
	);
}

/**
 * CompactDiffView - Single-file diff without navigation
 */
export interface CompactDiffViewProps {
	/** Unified diff string */
	diff: string;

	/** Display width */
	width?: number;

	/** Show line numbers */
	showLineNumbers?: boolean;
}

export function CompactDiffView({
	diff,
	width = 80,
	showLineNumbers = true,
}: CompactDiffViewProps) {
	const parsed = useMemo(() => parseUnifiedDiff(diff), [diff]);

	if (parsed.length === 0 || !parsed[0]) {
		return (
			<Box>
				<Text color={floydTheme.colors.fgSubtle}>No changes to display</Text>
			</Box>
		);
	}

	return (
		<DiffViewer
			diff={parsed[0]}
			showLineNumbers={showLineNumbers}
			showHunkHeaders={true}
			width={width}
			enableNavigation={false}
		/>
	);
}

/**
 * DiffSummary - Summary of changes across files
 */
export interface DiffSummaryProps {
	/** Parsed diff files */
	files: DiffFile[];

	/** Show detailed breakdown */
	detailed?: boolean;
}

export function DiffSummary({files, detailed = false}: DiffSummaryProps) {
	const totals = useMemo(() => {
		return files.reduce(
			(acc, file) => ({
				additions: acc.additions + file.additions,
				deletions: acc.deletions + file.deletions,
				files: acc.files + 1,
			}),
			{additions: 0, deletions: 0, files: 0},
		);
	}, [files]);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Box>
				<Text bold color={floydTheme.colors.fgSelected}>
					{totals.files} file{totals.files !== 1 ? 's' : ''} changed
				</Text>
				<Text color={floydTheme.colors.success}> +{totals.additions}</Text>
				<Text color={floydTheme.colors.error}> -{totals.deletions}</Text>
			</Box>

			{detailed && (
				<Box flexDirection="column" marginTop={1}>
					{files.map((file, index) => (
						<Box key={index}>
							<Text color={floydTheme.colors.fgSubtle} dimColor>
								{'  '}
								{file.newPath || file.oldPath}
							</Text>
							<Text color={floydTheme.colors.success}> +{file.additions}</Text>
							<Text color={floydTheme.colors.error}> -{file.deletions}</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

export default DiffViewer;
