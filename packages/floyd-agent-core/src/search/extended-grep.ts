/**
 * Extended Grep Modes
 *
 * PHASE 3 ITEM 16: Extended Grep Modes
 *
 * Enhances grep with:
 * - Regex mode with flags
 * - Context lines (before/after)
 * - Invert match
 * - Line numbers
 * - Count only
 */

export interface GrepOptions {
	/** Pattern to search for */
	pattern: string;
	/** Use regex matching */
	regex?: boolean;
	/** Case insensitive */
	caseInsensitive?: boolean;
	/** Invert match (show non-matching lines) */
	invert?: boolean;
	/** Number of context lines before match */
	beforeContext?: number;
	/** Number of context lines after match */
	afterContext?: number;
	/** Show line numbers */
	lineNumbers?: boolean;
	/** Count only (suppress output) */
	countOnly?: boolean;
	/** Max results to return */
	maxResults?: number;
}

export interface GrepMatch {
	lineNumber: number;
	line: string;
	match: string;
	before?: string[];
	after?: string[];
}

export interface GrepResult {
	matches: GrepMatch[];
	totalMatches: number;
	linesSearched: number;
	truncated: boolean;
}

/**
 * Extended grep function with context
 */
export function extendedGrep(
	content: string,
	options: GrepOptions
): GrepResult {
	const {
		pattern,
		regex = false,
		caseInsensitive = false,
		invert = false,
		beforeContext = 0,
		afterContext = 0,
		lineNumbers = true,
		countOnly = false,
		maxResults = Infinity,
	} = options;

	const lines = content.split('\n');
	const matches: GrepMatch[] = [];
	let totalMatches = 0;

	// Build regex or simple pattern
	let searchRegex: RegExp;

	try {
		const flags = caseInsensitive ? 'gi' : 'g';
		searchRegex = regex ? new RegExp(pattern, flags) : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
	} catch {
		// If regex fails, use literal match
		searchRegex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const match = searchRegex.exec(line);

		// Check if line matches (or doesn't match if inverted)
		const lineMatches = match !== null;
		const shouldInclude = invert ? !lineMatches : lineMatches;

		if (shouldInclude && (countOnly || matches.length < maxResults)) {
			totalMatches++;

			if (!countOnly) {
				// Extract context
				const beforeStart = Math.max(0, i - beforeContext);
				const beforeEnd = i;
				const afterStart = i + 1;
				const afterEnd = Math.min(lines.length, i + 1 + afterContext);

				matches.push({
					lineNumber: lineNumbers ? i + 1 : -1,
					line: line,
					match: match ? match[0] : '',
					before: beforeContext > 0 ? lines.slice(beforeStart, beforeEnd) : undefined,
					after: afterContext > 0 ? lines.slice(afterStart, afterEnd) : undefined,
				});
			}
		}

		// Reset regex for next line
		if (searchRegex.global) {
			searchRegex.lastIndex = 0;
		}
	}

	return {
		matches,
		totalMatches,
		linesSearched: lines.length,
		truncated: matches.length >= maxResults,
	};
}

/**
 * Grep with context highlighting (for display)
 */
export function grepWithContextHighlight(
	content: string,
	options: GrepOptions
): { formatted: string; matches: GrepMatch[] } {
	const result = extendedGrep(content, options);
	const { matches } = result;

	let formatted = '';

	for (const match of matches) {
		// Add before context
		if (match.before) {
			for (const line of match.before) {
				formatted += `  ${line}\n`;
			}
		}

		// Add matched line with highlight
		const highlightedLine = match.line.replace(
			new RegExp(options.pattern, options.caseInsensitive ? 'gi' : 'g'),
			'>>> $& <<<'
		);
		formatted += `${match.lineNumber}: ${highlightedLine}\n`;

		// Add after context
		if (match.after) {
			for (const line of match.after) {
				formatted += `  ${line}\n`;
			}
		}

		formatted += '---\n';
	}

	return { formatted, matches };
}

/**
 * Quick grep for pattern existence (boolean result)
 */
export function grepExists(content: string, pattern: string): boolean {
	return content.includes(pattern);
}

/**
 * Get line numbers where pattern appears
 */
export function grepLineNumbers(content: string, pattern: string): number[] {
	const lines = content.split('\n');
	const lineNumbers: number[] = [];

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes(pattern)) {
			lineNumbers.push(i + 1);
		}
	}

	return lineNumbers;
}

/**
 * Batch grep across multiple files
 */
export function grepBatch(
	files: Record<string, string>,
	pattern: string,
	options?: Partial<GrepOptions>
): Record<string, GrepResult> {
	const results: Record<string, GrepResult> = {};

	for (const [filePath, content] of Object.entries(files)) {
		results[filePath] = extendedGrep(content, { pattern, ...options });
	}

	return results;
}
