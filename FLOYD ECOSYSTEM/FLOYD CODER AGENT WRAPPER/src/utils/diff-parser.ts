/**
 * Diff Parser
 *
 * Unified diff generation and parsing utilities.
 * Handles diff creation, parsing, and validation.
 *
 * @module utils/diff-parser
 */

import * as diffLib from 'diff';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Unified diff options
 */
export interface DiffOptions {
	/** Original file path */
	originalPath?: string;

	/** Modified file path */
	modifiedPath?: string;

	/** Original file content label */
	originalLabel?: string;

	/** Modified file content label */
	modifiedLabel?: string;

	/** Context lines to include */
	context?: number;
}

/**
 * Parsed diff hunk
 */
export interface DiffHunk {
	/** Starting line in original (1-indexed) */
	originalStart: number;

	/** Number of lines in original */
	originalLength: number;

	/** Starting line in modified (1-indexed) */
	modifiedStart: number;

	/** Number of lines in modified */
	modifiedLength: number;

	/** Hunk content */
	lines: string[];
}

/**
 * Parsed unified diff
 */
export interface ParsedDiff {
	/** Original file path */
	originalPath: string;

	/** Modified file path */
	modifiedPath: string;

	/** Diff hunks */
	hunks: DiffHunk[];
}

// ============================================================================
// DIFF GENERATION
// ============================================================================

/**
 * Create a unified diff between two strings
 */
export function createUnifiedDiff(
	original: string,
	modified: string,
	options: DiffOptions = {},
): string {
	const {
		originalPath = 'original',
		modifiedPath = 'modified',
		originalLabel = 'a/' + originalPath,
		modifiedLabel = 'b/' + modifiedPath,
		context = 3,
	} = options;

	// Split into lines
	const originalLines = original.split('\n');
	const modifiedLines = modified.split('\n');

	// Create diff
	const diff = diffLib.diffLines(original, modified);

	// Build unified diff format
	const lines: string[] = [];

	// Header
	lines.push(`--- ${originalLabel}`);
	lines.push(`+++ ${modifiedLabel}`);

	// Process diff into hunks
	let currentHunk: {originalStart: number; modifiedStart: number; lines: string[]} | null = null;
	let originalLine = 1;
	let modifiedLine = 1;

	for (const change of diff) {
		const changeLines = change.value.split('\n');
		// Remove trailing empty string from split
		if (changeLines[changeLines.length - 1] === '') {
			changeLines.pop();
		}

		if (change.added) {
			// Added lines
			if (!currentHunk) {
				currentHunk = {
					originalStart: originalLine,
					modifiedStart: modifiedLine,
					lines: [],
				};
			}

			for (const line of changeLines) {
				currentHunk.lines.push('+' + line);
			}
			modifiedLine += changeLines.length;
		} else if (change.removed) {
			// Removed lines
			if (!currentHunk) {
				currentHunk = {
					originalStart: originalLine,
					modifiedStart: modifiedLine,
					lines: [],
				};
			}

			for (const line of changeLines) {
				currentHunk.lines.push('-' + line);
			}
			originalLine += changeLines.length;
		} else {
			// Context lines
			if (currentHunk) {
				// Add context lines to hunk
				for (const line of changeLines) {
					currentHunk.lines.push(' ' + line);
				}
				originalLine += changeLines.length;
				modifiedLine += changeLines.length;

				// Flush hunk
				lines.push(formatHunk(currentHunk));
				currentHunk = null;
			} else {
				originalLine += changeLines.length;
				modifiedLine += changeLines.length;
			}
		}
	}

	// Flush final hunk
	if (currentHunk) {
		lines.push(formatHunk(currentHunk));
	}

	return lines.join('\n');
}

/**
 * Format a diff hunk
 */
function formatHunk(hunk: {
	originalStart: number;
	modifiedStart: number;
	lines: string[];
}): string {
	// Calculate hunk sizes
	let originalCount = 0;
	let modifiedCount = 0;

	for (const line of hunk.lines) {
		if (line.startsWith('-')) {
			originalCount++;
		} else if (line.startsWith('+')) {
			modifiedCount++;
		} else if (!line.startsWith('\\')) {
			// Context line
			originalCount++;
			modifiedCount++;
		}
	}

	// Hunk header
	const header = `@@ -${hunk.originalStart},${originalCount} +${hunk.modifiedStart},${modifiedCount} @@`;

	return [header, ...hunk.lines].join('\n');
}

/**
 * Parse a unified diff
 */
export function parseUnifiedDiff(diff: string): ParsedDiff | null {
	const lines = diff.split('\n');
	let index = 0;

	// Parse header
	let originalPath = 'original';
	let modifiedPath = 'modified';

	while (index < lines.length) {
		const line = lines[index];

		if (line.startsWith('--- ')) {
			originalPath = line.slice(4).trim();
			if (originalPath.startsWith('a/')) {
				originalPath = originalPath.slice(2);
			}
		} else if (line.startsWith('+++ ')) {
			modifiedPath = line.slice(4).trim();
			if (modifiedPath.startsWith('b/')) {
				modifiedPath = line.slice(2);
			}
			index++;
			break;
		}

		index++;
	}

	const hunks: DiffHunk[] = [];

	// Parse hunks
	while (index < lines.length) {
		const line = lines[index];

		// Look for hunk header
		const hunkMatch = line.match(/^@@\s+(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s+@@/);
		if (hunkMatch) {
			const originalStart = parseInt(hunkMatch[1], 10);
			const originalLength = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
			const modifiedStart = parseInt(hunkMatch[3], 10);
			const modifiedLength = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

			const hunk: DiffHunk = {
				originalStart,
				originalLength,
				modifiedStart,
				modifiedLength,
				lines: [],
			};

			// Collect hunk lines
			index++;
			while (index < lines.length) {
				const hunkLine = lines[index];

				// End of hunk
				if (hunkLine.startsWith('@@') || hunkLine.startsWith('---') || hunkLine.startsWith('+++')) {
					break;
				}

				// Only collect actual diff lines (not metadata)
				if (hunkLine.startsWith('+') || hunkLine.startsWith('-') || hunkLine.startsWith(' ') || hunkLine.startsWith('\\')) {
					hunk.lines.push(hunkLine);
				}

				index++;
			}

			hunks.push(hunk);
		} else {
			index++;
		}
	}

	if (hunks.length === 0) {
		return null;
	}

	return {
		originalPath,
		modifiedPath,
		hunks,
	};
}

/**
 * Apply a unified diff to original content
 */
export function applyUnifiedDiff(original: string, diff: string): string {
	const parsed = parseUnifiedDiff(diff);
	if (!parsed) {
		return original;
	}

	const originalLines = original.split('\n');
	let resultLines: string[] = [];
	let originalIndex = 0;

	for (const hunk of parsed.hunks) {
		// Skip to hunk start
		while (originalIndex < hunk.originalStart - 1) {
			resultLines.push(originalLines[originalIndex]);
			originalIndex++;
		}

		// Apply hunk
		let skipOriginal = 0;

		for (const line of hunk.lines) {
			if (line.startsWith('\\')) {
				// Metadata line, skip
				continue;
			}

			if (line.startsWith('-')) {
				// Removed line - skip in original
				skipOriginal++;
				originalIndex++;
			} else if (line.startsWith('+')) {
				// Added line - add to result
				resultLines.push(line.slice(1));
			} else {
				// Context line - add from original
				if (skipOriginal > 0) {
					skipOriginal--;
				} else {
					resultLines.push(line.slice(1));
					originalIndex++;
				}
			}
		}
	}

	// Add remaining lines
	while (originalIndex < originalLines.length) {
		resultLines.push(originalLines[originalIndex]);
		originalIndex++;
	}

	return resultLines.join('\n');
}

/**
 * Check if a diff applies cleanly to content
 */
export function checkApplies(original: string, diff: string): boolean {
	try {
		const result = applyUnifiedDiff(original, diff);
		return result !== original;
	} catch {
		return false;
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	createUnifiedDiff,
	parseUnifiedDiff,
	applyUnifiedDiff,
	checkApplies,
};
