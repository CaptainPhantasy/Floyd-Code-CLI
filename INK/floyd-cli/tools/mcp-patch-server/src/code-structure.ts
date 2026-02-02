/**
 * Code Structure Analyzer
 *
 * Provides structural awareness for code editing operations:
 * - Function/method boundaries
 * - Matching delimiters ({ } [ ] ( ))
 * - Block scope detection
 */

export interface CodeBlock {
	type: 'function' | 'struct' | 'enum' | 'impl' | 'trait' | 'module' | 'class' | 'other';
	name: string;
	startLine: number;
	endLine: number;
	isComplete: boolean;
}

export interface DelimiterMatch {
	delimiter: '{' | '}' | '[' | ']' | '(' | ')';
	line: number;
	position: number;
	matchingIndex?: number;
}

export interface StructureAnalysis {
	language: string;
	blocks: CodeBlock[];
	delimiterPairs: Array<{open: DelimiterMatch; close: DelimiterMatch}>;
	hasUnmatchedDelimiters: boolean;
	safeEditRanges: Array<{start: number; end: number; description: string}>;
}

/**
 * Detect language from file extension
 */
function detectLanguage(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase();
	const langMap: Record<string, string> = {
		'rs': 'rust',
		'ts': 'typescript',
		'tsx': 'typescript',
		'js': 'javascript',
		'jsx': 'javascript',
		'py': 'python',
		'go': 'go',
		'java': 'java',
		'c': 'c',
		'cpp': 'cpp',
		'cc': 'cpp',
		'h': 'c',
		'hpp': 'cpp',
		'cs': 'csharp',
		'php': 'php',
		'rb': 'ruby',
		'scala': 'scala',
		'kt': 'kotlin',
		'swift': 'swift',
	};
	return langMap[ext || ''] || 'text';
}

/**
 * Type guard for delimiter characters
 */
function isOpenDelimiter(char: string): boolean {
	return char === '{' || char === '[' || char === '(';
}

function isCloseDelimiter(char: string): boolean {
	return char === '}' || char === ']' || char === ')';
}

/**
 * Find matching delimiters in content
 */
function findMatchingDelimiters(lines: string[]): {
	pairs: Array<{open: DelimiterMatch; close: DelimiterMatch}>;
	unmatched: DelimiterMatch[];
} {
	const delimiters: DelimiterMatch[] = [];
	const stack: Array<{delimiter: DelimiterMatch; index: number}> = [];

	// Track all delimiters with their positions
	const openMap: Record<string, string> = {
		'}': '{',
		']': '[',
		')': '(',
	};

	lines.forEach((line, lineIndex) => {
		for (let col = 0; col < line.length; col++) {
			const char = line[col] as string;

			if (isOpenDelimiter(char)) {
				const delim: DelimiterMatch = {
					delimiter: char as any,
					line: lineIndex,
					position: col,
				};
				delimiters.push(delim);
				stack.push({delimiter: delim, index: delimiters.length - 1});
			} else if (isCloseDelimiter(char)) {
				const delim: DelimiterMatch = {
					delimiter: char as any,
					line: lineIndex,
					position: col,
				};
				delimiters.push(delim);

				const expectedOpen = openMap[char];
				const top = stack[stack.length - 1];

				if (top && top.delimiter.delimiter === expectedOpen) {
					// Found a matching pair
					delim.matchingIndex = top.index;
					top.delimiter.matchingIndex = delimiters.length - 1;
					stack.pop();
				}
				// else: unmatched closing delimiter
			}
		}
	});

	// Extract matched pairs
	const pairs: Array<{open: DelimiterMatch; close: DelimiterMatch}> = [];
	const processed = new Set<number>();

	delimiters.forEach((d, i) => {
		if (d.matchingIndex !== undefined && !processed.has(i)) {
			const matchIndex = d.matchingIndex;
			if (matchIndex !== undefined) {
				const match = delimiters[matchIndex];
				if (match && isOpenDelimiter(d.delimiter)) {
					pairs.push({open: d, close: match});
					processed.add(i);
					processed.add(matchIndex);
				}
			}
		}
	});

	// Find unmatched delimiters
	const unmatched = delimiters.filter((d, i) => {
		if (processed.has(i)) return false;
		return d.matchingIndex === undefined;
	});

	return {pairs, unmatched};
}

/**
 * Find complete code blocks (functions, structs, etc.)
 */
function findCodeBlocks(
	lines: string[],
	language: string,
): CodeBlock[] {
	const blocks: CodeBlock[] = [];
	const blockStartPatterns: Record<string, RegExp[]> = {
		rust: [
			/\bfn\s+(\w+)\s*\(/,
			/\bstruct\s+(\w+)/,
			/\benum\s+(\w+)/,
			/\bimpl\b/,
			/\btrait\s+(\w+)/,
			/\bmod\s+(\w+)\s*{/,
		],
		typescript: [
			/\bfunction\s+(\w+)/,
			/\bconst\s+(\w+)\s*=\s*\(|\basync\s+(\w+)\s*\(/,
			/\bclass\s+(\w+)/,
			/\binterface\s+(\w+)/,
			/\btype\s+(\w+)\s*=/,
			/\bexport\s+(const|function|class|interface)\s+(\w+)/,
		],
		javascript: [
			/\bfunction\s+(\w+)/,
			/\bconst\s+(\w+)\s*=\s*\(/,
			/\bclass\s+(\w+)/,
		],
		python: [
			/\bdef\s+(\w+)\s*\(/,
			/\bclass\s+(\w+)/,
		],
		go: [
			/\bfunc\s+(?:\(\w+\)\s+)?(\w+)\s*\(/,
			/\btype\s+(\w+)\s+(struct|interface)/,
		],
		java: [
			/\bpublic\s+(?:static\s+)?(?:void|\w+)\s+(\w+)\s*\(/,
			/\bprivate\s+(?:static\s+)?(?:void|\w+)\s+(\w+)\s*\(/,
			/\bprotected\s+(?:static\s+)?(?:void|\w+)\s+(\w+)\s*\(/,
			/\bclass\s+(\w+)/,
			/\binterface\s+(\w+)/,
		],
	};

	const patterns = blockStartPatterns[language] || blockStartPatterns['rust'];
	const openBraces: number[] = [];

	let currentBlock: Partial<CodeBlock> | null = null;

	lines.forEach((line, lineIndex) => {
		// Count braces to track nesting
		for (const char of line) {
			if (char === '{') {
				openBraces.push(lineIndex);
			} else if (char === '}') {
				if (openBraces.length > 0) {
					openBraces.pop()!;

					// If we were tracking a block, close it
					if (currentBlock && openBraces.length === 0) {
						blocks.push({
							...currentBlock,
							endLine: lineIndex,
							isComplete: true,
						} as CodeBlock);
						currentBlock = null;
					}
				}
			}
		}

		// Look for block starts
		if (!currentBlock && patterns) {
			for (const pattern of patterns) {
				const match = line.match(pattern);
				if (match) {
					const name = match[1] || match[match.length - 1];
					let blockType: CodeBlock['type'] = 'other';

					if (pattern.source.includes('fn') || pattern.source.includes('function') || pattern.source.includes('def')) {
						blockType = 'function';
					} else if (pattern.source.includes('struct') || pattern.source.includes('class')) {
						blockType = language === 'rust' ? 'struct' : 'class';
					} else if (pattern.source.includes('enum')) {
						blockType = 'enum';
					} else if (pattern.source.includes('impl')) {
						blockType = 'impl';
					} else if (pattern.source.includes('trait') || pattern.source.includes('interface')) {
						blockType = language === 'rust' ? 'trait' : 'other';
					} else if (pattern.source.includes('mod')) {
						blockType = 'module';
					}

					currentBlock = {
						type: blockType,
						name,
						startLine: lineIndex,
						isComplete: false,
					};
					break;
				}
			}
		}
	});

	return blocks;
}

/**
 * Analyze code structure for safe editing
 */
export function analyzeCodeStructure(
	filePath: string,
	content: string,
): StructureAnalysis {
	const language = detectLanguage(filePath);
	const lines = content.split('\n');

	// Find matching delimiters
	const {pairs, unmatched} = findMatchingDelimiters(lines);

	// Find code blocks
	const blocks = findCodeBlocks(lines, language);

	// Determine safe edit ranges
	const safeEditRanges: Array<{start: number; end: number; description: string}> = [];

	// Add ranges between blocks
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (!block) continue;

		if (block.isComplete) {
			// Range before this block
			if (i === 0 && block.startLine > 0) {
				safeEditRanges.push({
					start: 0,
					end: block.startLine - 1,
					description: `Before ${block.type} '${block.name}'`,
				});
			} else if (i > 0) {
				const prevBlock = blocks[i - 1];
				if (prevBlock && prevBlock.isComplete && prevBlock.endLine < block.startLine - 1) {
					safeEditRanges.push({
						start: prevBlock.endLine + 1,
						end: block.startLine - 1,
						description: `Between ${prevBlock.type} '${prevBlock.name}' and ${block.type} '${block.name}'`,
					});
				}
			}

			// Range after this block
			if (i === blocks.length - 1 && block.endLine < lines.length - 1) {
				safeEditRanges.push({
					start: block.endLine + 1,
					end: lines.length - 1,
					description: `After ${block.type} '${block.name}'`,
				});
			}
		}
	}

	// Add safe ranges inside complete blocks for full-block replacement
	blocks.forEach(block => {
		if (block && block.isComplete) {
			safeEditRanges.push({
				start: block.startLine,
				end: block.endLine,
				description: `Complete ${block.type} '${block.name}' (safe for full replacement)`,
			});
		}
	});

	return {
		language,
		blocks,
		delimiterPairs: pairs,
		hasUnmatchedDelimiters: unmatched.length > 0,
		safeEditRanges,
	};
}

/**
 * Check if a line range is safe for editing
 */
export function validateEditRange(
	analysis: StructureAnalysis,
	startLine: number,
	endLine: number,
): {
	isSafe: boolean;
	warnings: string[];
	suggestions: string[];
} {
	const warnings: string[] = [];
	const suggestions: string[] = [];

	// Check for split delimiter pairs (open in range, close outside)
	const splitPairs = analysis.delimiterPairs.filter(pair =>
		(pair.open.line >= startLine && pair.open.line <= endLine) &&
		(pair.close.line < startLine || pair.close.line > endLine)
	);

	if (splitPairs.length > 0) {
		warnings.push(`Edit range splits ${splitPairs.length} delimiter pair(s) - this will create orphaned delimiters`);
		splitPairs.forEach(pair => {
			if (pair.close.line > endLine) {
				suggestions.push(`Extend endLine to ${pair.close.line} to include closing '${pair.close.delimiter}'`);
			}
			if (pair.open.line < startLine) {
				suggestions.push(`Extend startLine to ${pair.open.line} to include opening '${pair.open.delimiter}'`);
			}
		});
	}

	// Check if range overlaps partially with code blocks
	const partialBlockOverlaps = analysis.blocks.filter(block =>
		(block.startLine < startLine && block.endLine >= startLine && block.endLine <= endLine) ||
		(block.startLine >= startLine && block.startLine <= endLine && block.endLine > endLine)
	);

	if (partialBlockOverlaps.length > 0) {
		warnings.push(`Edit range partially overlaps ${partialBlockOverlaps.length} code block(s)`);
		partialBlockOverlaps.forEach(block => {
			suggestions.push(`Either edit complete block (${block.startLine}-${block.endLine}) or edit outside it`);
		});
	}

	// Check if range contains incomplete blocks
	const incompleteBlocks = analysis.blocks.filter(block =>
		block.startLine >= startLine && block.endLine <= endLine && !block.isComplete
	);

	if (incompleteBlocks.length > 0) {
		warnings.push(`Edit range contains ${incompleteBlocks.length} incomplete code block(s)`);
	}

	const isSafe = warnings.length === 0;

	return {isSafe, warnings, suggestions};
}

/**
 * Auto-expand a range to include complete blocks
 */
export function expandRangeToCompleteBlocks(
	analysis: StructureAnalysis,
	startLine: number,
	endLine: number,
): {startLine: number; endLine: number; expansions: string[]} {
	let newStart = startLine;
	let newEnd = endLine;
	const expansions: string[] = [];

	// Find blocks that overlap with the range
	for (const block of analysis.blocks) {
		if (!block.isComplete) continue;

		// Block starts before range, ends inside or after range
		if (block.startLine <= startLine && block.endLine >= startLine && block.endLine > newEnd) {
			newStart = block.startLine;
			newEnd = Math.max(newEnd, block.endLine);
			expansions.push(`Expanded to include complete ${block.type} '${block.name}' (${block.startLine}-${block.endLine})`);
		}
		// Block starts inside range, ends after range
		else if (block.startLine >= startLine && block.startLine <= endLine && block.endLine > newEnd) {
			newEnd = block.endLine;
			expansions.push(`Expanded to include complete ${block.type} '${block.name}' (${block.startLine}-${block.endLine})`);
		}
		// Block is completely inside range - already covered
		else if (block.startLine >= startLine && block.endLine <= endLine) {
			// Already covered
		}
	}

	return {startLine: newStart, endLine: newEnd, expansions};
}

export default {
	analyzeCodeStructure,
	validateEditRange,
	expandRangeToCompleteBlocks,
};
