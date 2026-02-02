/**
 * Fuzzy Matcher for Edit File Operations
 *
 * PHASE 3 ITEM 9: Edit File Fuzzy Matching
 *
 * Enables intelligent string matching for edit operations:
 * - Similarity-based matching (edit distance)
 * - Case-insensitive fallback
 * - Whitespace-tolerant matching
 * - Context-aware suggestions
 */

/**
 * Match result with similarity score
 */
export interface FuzzyMatch {
	matched: boolean;
	confidence: number; // 0-1
	suggestion?: string;
	reason: string;
}

/**
 * Fuzzy match configuration
 */
export interface FuzzyMatchConfig {
	threshold: number; // Minimum confidence to accept match (0-1)
	ignoreCase: boolean;
	ignoreWhitespace: boolean;
	maxSuggestions: number;
}

const DEFAULT_CONFIG: FuzzyMatchConfig = {
	threshold: 0.7,
	ignoreCase: true,
	ignoreWhitespace: true,
	maxSuggestions: 3,
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1,     // insertion
					matrix[i - 1][j] + 1      // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) based on edit distance
 */
function calculateSimilarity(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - (levenshteinDistance(a, b) / maxLen);
}

/**
 * Normalize string for comparison
 */
function normalize(str: string, config: FuzzyMatchConfig): string {
	let result = str;

	if (config.ignoreWhitespace) {
		result = result.replace(/\s+/g, ' ').trim();
	}

	if (config.ignoreCase) {
		result = result.toLowerCase();
	}

	return result;
}

/**
 * Find fuzzy match of target in content
 */
export function fuzzyMatch(
	target: string,
	content: string,
	config: Partial<FuzzyMatchConfig> = {}
): FuzzyMatch {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	// Try exact match first with normalization
	const normalizedTarget = normalize(target, mergedConfig);
	const normalizedContent = normalize(content, mergedConfig);

	if (normalizedContent.includes(normalizedTarget)) {
		return {
			matched: true,
			confidence: 1,
			reason: 'Exact match after normalization',
		};
	}

	// Calculate similarity
	const similarity = calculateSimilarity(normalizedTarget, normalizedContent);

	if (similarity >= mergedConfig.threshold) {
		return {
			matched: true,
			confidence: similarity,
			reason: `Fuzzy match (${(similarity * 100).toFixed(0)}% confidence)`,
		};
	}

	// Try to find suggestions by searching for substrings
	const suggestions = findSuggestions(normalizedTarget, normalizedContent, mergedConfig);

	return {
		matched: false,
		confidence: similarity,
		suggestion: suggestions[0],
		reason: `Below threshold (${(similarity * 100).toFixed(0)}% < ${(mergedConfig.threshold * 100)}%)`,
	};
}

/**
 * Find partial matches as suggestions
 */
function findSuggestions(
	target: string,
	content: string,
	_config: FuzzyMatchConfig
): string[] {
	const suggestions: string[] = [];
	const words = content.split(/\s+/);

	// Look for similar words
	for (const word of words) {
		if (word.length < 3) continue;

		const similarity = calculateSimilarity(target, word);
		if (similarity >= 0.5) {
			suggestions.push(word);
		}
	}

	// Sort by similarity and return top results
	suggestions.sort((a, b) => calculateSimilarity(target, b) - calculateSimilarity(target, a));
	return suggestions.slice(0, DEFAULT_CONFIG.maxSuggestions);
}

/**
 * Batch fuzzy match against multiple candidates
 */
export function fuzzyMatchBatch(
	target: string,
	candidates: string[],
	config: Partial<FuzzyMatchConfig> = {}
): Array<{ candidate: string; result: FuzzyMatch }> {
	const results = candidates.map(candidate => ({
		candidate,
		result: fuzzyMatch(target, candidate, config),
	}));

	// Sort by confidence (descending)
	results.sort((a, b) => b.result.confidence - a.result.confidence);

	return results;
}

/**
 * Find best matching line in multi-line content
 */
export function findBestLineMatch(
	target: string,
	content: string,
	config: Partial<FuzzyMatchConfig> = {}
): { lineNumber: number; line: string; match: FuzzyMatch } | null {
	const lines = content.split('\n');
	void { ...DEFAULT_CONFIG, ...config }; // Config available for future use

	let bestMatch: { lineNumber: number; line: string; match: FuzzyMatch } | null = null;
	let bestConfidence = 0;

	for (let i = 0; i < lines.length; i++) {
		const result = fuzzyMatch(target, lines[i], config);
		if (result.matched && result.confidence > bestConfidence) {
			bestMatch = {
				lineNumber: i + 1,
				line: lines[i],
				match: result,
			};
			bestConfidence = result.confidence;
		}
	}

	return bestMatch;
}

/**
 * Generate diff-based patch suggestion
 */
export function generatePatchSuggestion(
	original: string,
	target: string,
	replacement: string
): string {
	// Simple diff-based patch generation
	const lines = original.split('\n');
	// Find the line to replace

	// Find the line to replace
	for (let i = 0; i < lines.length; i++) {
		const result = fuzzyMatch(target, lines[i]);
		if (result.matched && result.confidence > 0.8) {
			lines[i] = replacement;
			break;
		}
	}

	return lines.join('\n');
}
