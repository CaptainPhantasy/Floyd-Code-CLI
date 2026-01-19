/**
 * Diff Parser
 *
 * Purpose: Parse git diff output into structured format
 * Exports: parseDiff(), DiffHunk, DiffLine types
 * Related: DiffViewer.tsx
 */

// Use the diff library from package.json (diff package)
import * as diffLib from 'diff';

// ============================================================================
// TYPES
// ============================================================================

export interface DiffLine {
	/**
	 * Line content
	 */
	content: string;

	/**
	 * Line type: added, deleted, or unchanged
	 */
	type: 'added' | 'deleted' | 'unchanged';

	/**
	 * Old line number (if deleted or unchanged)
	 */
	oldLineNumber?: number;

	/**
	 * New line number (if added or unchanged)
	 */
	newLineNumber?: number;

	/**
	 * Whether this is a hunk header
	 */
	isHunkHeader?: boolean;
}

export interface DiffHunk {
	/**
	 * Old file path
	 */
	oldPath: string;

	/**
	 * New file path
	 */
	newPath: string;

	/**
	 * Old line range start
	 */
	oldStart: number;

	/**
	 * Old line count
	 */
	oldLines: number;

	/**
	 * New line range start
	 */
	newStart: number;

	/**
	 * New line count
	 */
	newLines: number;

	/**
	 * All lines in the hunk
	 */
	lines: DiffLine[];

	/**
	 * Hunk header (e.g., "@@ -1,4 +1,5 @@")
	 */
	header: string;

	/**
	 * Whether this is a new file
	 */
	newFile?: boolean;

	/**
	 * Whether this is a deleted file
	 */
	deletedFile?: boolean;

	/**
	 * Whether this is a rename
	 */
	rename?: boolean;

	/**
	 * File mode changes (permissions)
	 */
	modeChange?: {
		old: string;
		new: string;
	};
}

export interface DiffFile {
	/**
	 * File path
	 */
	path: string;

	/**
	 * Old path (if renamed)
	 */
	oldPath?: string;

	/**
	 * All hunks in the file
	 */
	hunks: DiffHunk[];

	/**
	 * Whether this is a new file
	 */
	newFile: boolean;

	/**
	 * Whether this is a deleted file
	 */
	deletedFile: boolean;

	/**
	 * Whether this is a renamed file
	 */
	renamed: boolean;

	/**
	 * Added lines count
	 */
	additions: number;

	/**
	 * Deleted lines count
	 */
	deletions: number;

	/**
	 * Binary file indicator
	 */
	binary: boolean;
}

export interface ParseOptions {
	/**
	 * Include unchanged lines
	 */
	includeUnchanged?: boolean;

	/**
	 * Track line numbers
	 */
	trackLineNumbers?: boolean;
}

// ============================================================================
// PARSER
// ============================================================================

/**
 * Regular expression to match a diff hunk header
 * Format: @@ -oldStart,oldLines +newStart,newLines @@
 */
const HUNK_HEADER_RE = /^@@\s+-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s+@@/;

/**
 * Regular expression to match a file header
 * Formats:
 *   --- a/file
 *   +++ b/file
 *   --- /dev/null (for new files)
 *   +++ /dev/null (for deleted files)
 */
const FILE_HEADER_RE = /^(---|\+\+\+)\s+(.+)$/;

/**
 * Parse git diff output
 *
 * @param diff - Raw diff string
 * @param options - Parse options
 * @returns Parsed diff files
 */
export function parseDiff(
	diffInput: string,
	options: ParseOptions = {},
): DiffFile[] {
	const {includeUnchanged = true, trackLineNumbers = true} = options;

	const files: DiffFile[] = [];
	const lines = diffInput.split('\n');

	let currentFile: Partial<DiffFile> | null = null;
	let currentHunk: Partial<DiffHunk> | null = null;
	let oldLineNumber = 0;
	let newLineNumber = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		// Check for file header
		const fileMatch = line.match(FILE_HEADER_RE);
		if (fileMatch) {
			const [, type, pathMatch] = fileMatch;
			const path = pathMatch ?? '';

			if (type === '---') {
				// Starting a new file
				if (currentFile && currentFile.hunks) {
					files.push(finalizeFile(currentFile));
				}

				currentFile = {
					path: '',
					oldPath:
						path === '/dev/null' ? undefined : path.replace(/^[ab]\//, ''),
					hunks: [],
					newFile: path === '/dev/null',
					deletedFile: false,
					renamed: false,
					additions: 0,
					deletions: 0,
					binary: false,
				};
			} else if (type === '+++' && currentFile) {
				// New file path
				currentFile.path = path.replace(/^[ab]\//, '');
				currentFile.deletedFile = path === '/dev/null';
			}
			continue;
		}

		// Check for hunk header
		const hunkMatch = line.match(HUNK_HEADER_RE);
		if (hunkMatch && currentFile) {
			// Save previous hunk
			if (currentHunk) {
				currentFile.hunks?.push(finalizeHunk(currentHunk));
			}

			// Start new hunk
			const [, oldStart, oldLines, newStart, newLines] = hunkMatch;
			currentHunk = {
				oldPath: currentFile.path ?? '',
				newPath: currentFile.path ?? '',
				oldStart: Number.parseInt(oldStart ?? '1', 10),
				oldLines: oldLines ? Number.parseInt(oldLines, 10) : 1,
				newStart: Number.parseInt(newStart ?? '1', 10),
				newLines: newLines ? Number.parseInt(newLines, 10) : 1,
				lines: [],
				header: line,
			};

			oldLineNumber = Number.parseInt(oldStart ?? '1', 10);
			newLineNumber = Number.parseInt(newStart ?? '1', 10);
			continue;
		}

		// Process hunk content
		if (currentHunk && line.startsWith('')) {
			let type: 'added' | 'deleted' | 'unchanged';
			let content = line;
			let oldLn: number | undefined;
			let newLn: number | undefined;

			if (line.startsWith('+')) {
				type = 'added';
				content = line.slice(1);
				newLn = newLineNumber++;
			} else if (line.startsWith('-')) {
				type = 'deleted';
				content = line.slice(1);
				oldLn = oldLineNumber++;
			} else if (line.startsWith(' ')) {
				type = 'unchanged';
				content = line.slice(1);
				if (trackLineNumbers) {
					oldLn = oldLineNumber++;
					newLn = newLineNumber++;
				}
			} else {
				// Non-diff line (like function context in hunk header)
				continue;
			}

			if (includeUnchanged || type !== 'unchanged') {
				currentHunk.lines?.push({
					content,
					type,
					oldLineNumber: trackLineNumbers ? oldLn : undefined,
					newLineNumber: trackLineNumbers ? newLn : undefined,
					isHunkHeader: false,
				});

				// Count additions/deletions
				if (currentFile) {
					if (type === 'added') {
						currentFile.additions = (currentFile.additions ?? 0) + 1;
					} else if (type === 'deleted') {
						currentFile.deletions = (currentFile.deletions ?? 0) + 1;
					}
				}
			}
		}
	}

	// Don't forget the last hunk and file
	if (currentHunk && currentFile) {
		currentFile.hunks?.push(finalizeHunk(currentHunk));
	}
	if (currentFile) {
		files.push(finalizeFile(currentFile));
	}

	return files;
}

/**
 * Finalize a hunk by filling in required fields
 */
function finalizeHunk(hunk: Partial<DiffHunk>): DiffHunk {
	return {
		oldPath: hunk.oldPath ?? '',
		newPath: hunk.newPath ?? '',
		oldStart: hunk.oldStart ?? 0,
		oldLines: hunk.oldLines ?? 0,
		newStart: hunk.newStart ?? 0,
		newLines: hunk.newLines ?? 0,
		lines: hunk.lines ?? [],
		header: hunk.header ?? '',
		newFile: hunk.newFile,
		deletedFile: hunk.deletedFile,
		rename: hunk.rename,
	};
}

/**
 * Finalize a file by filling in required fields
 */
function finalizeFile(file: Partial<DiffFile>): DiffFile {
	return {
		path: file.path ?? '',
		oldPath: file.oldPath,
		hunks: file.hunks ?? [],
		newFile: file.newFile ?? false,
		deletedFile: file.deletedFile ?? false,
		renamed: file.renamed ?? false,
		additions: file.additions ?? 0,
		deletions: file.deletions ?? 0,
		binary: file.binary ?? false,
	};
}

/**
 * Parse a single file diff
 */
export function parseFileDiff(
	diff: string,
	options: ParseOptions = {},
): DiffFile | null {
	const files = parseDiff(diff, options);
	if (files.length === 0) {
		return null;
	}
	return files[0] ?? null;
}

/**
 * Get a summary of the diff
 */
export function getDiffSummary(files: DiffFile[]): {
	files: number;
	additions: number;
	deletions: number;
	newFiles: number;
	deletedFiles: number;
	renamedFiles: number;
} {
	let filesCount = 0;
	let additions = 0;
	let deletions = 0;
	let newFiles = 0;
	let deletedFiles = 0;
	let renamedFiles = 0;

	for (const file of files) {
		filesCount++;
		additions += file.additions;
		deletions += file.deletions;

		if (file.newFile) {
			newFiles++;
		}
		if (file.deletedFile) {
			deletedFiles++;
		}
		if (file.renamed) {
			renamedFiles++;
		}
	}

	return {
		files: filesCount,
		additions,
		deletions,
		newFiles,
		deletedFiles,
		renamedFiles,
	};
}

/**
 * Format a diff hunk as a unified diff string
 */
export function formatHunk(hunk: DiffHunk): string {
	const lines: string[] = [];

	// File header
	if (hunk.oldPath !== hunk.newPath) {
		lines.push(`--- ${hunk.oldPath}`);
		lines.push(`+++ ${hunk.newPath}`);
	} else {
		lines.push(`--- a/${hunk.oldPath}`);
		lines.push(`+++ b/${hunk.newPath}`);
	}

	// Hunk header
	lines.push(hunk.header);

	// Content lines
	for (const line of hunk.lines) {
		if (line.type === 'added') {
			lines.push(`+${line.content}`);
		} else if (line.type === 'deleted') {
			lines.push(`-${line.content}`);
		} else {
			lines.push(` ${line.content}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format diff files as a unified diff string
 */
export function formatDiff(files: DiffFile[]): string {
	const parts: string[] = [];

	for (const file of files) {
		for (const hunk of file.hunks) {
			parts.push(formatHunk(hunk));
		}
	}

	return parts.join('\n');
}

/**
 * Check if a file has changes in the diff
 */
export function fileHasChanges(file: DiffFile): boolean {
	return file.hunks.length > 0;
}

/**
 * Get the changed lines from a diff
 */
export function getChangedLines(hunk: DiffHunk): {
	added: DiffLine[];
	deleted: DiffLine[];
} {
	const added: DiffLine[] = [];
	const deleted: DiffLine[] = [];

	for (const line of hunk.lines) {
		if (line.type === 'added') {
			added.push(line);
		} else if (line.type === 'deleted') {
			deleted.push(line);
		}
	}

	return {added, deleted};
}

/**
 * Compute a simple line-based diff between two strings
 */
export function diffLines(oldText: string, newText: string): diffLib.Change[] {
	return diffLib.diffLines(oldText, newText);
}

/**
 * Create a unified diff string between two strings
 */
export function createUnifiedDiff(
	oldText: string,
	newText: string,
	oldPath = 'a/file',
	newPath = 'b/file',
): string {
	return diffLib.createTwoFilesPatch(oldPath, newPath, oldText, newText);
}

export default parseDiff;
