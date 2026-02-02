/**
 * Browser Click Natural Language
 *
 * PHASE 3 ITEM 17: Browser Click Natural Language
 *
 * Enables describing elements naturally instead of coordinates:
 * - Element description generation
 * - Natural language selector matching
 * - Fallback strategies
 */

export interface ElementDescription {
	tag?: string;
	text?: string;
	id?: string;
	class?: string;
	attributes?: Record<string, string>;
	position?: { x: number; y: number };
	naturalLanguage?: string;
}

export interface ClickTarget {
	selector: string;  // CSS selector
	description: string; // Natural language description
	confidence: number;  // 0-1
}

/**
 * Generate natural language description of an element
 */
export function describeElement(element: ElementDescription): string {
	const parts: string[] = [];

	if (element.tag) {
		parts.push(element.tag);
	}

	if (element.text) {
		const text = element.text.length > 30
			? element.text.substring(0, 30) + '...'
			: element.text;
		parts.push(`"${text}"`);
	}

	if (element.id) {
		parts.push(`#${element.id}`);
	}

	if (element.class) {
		parts.push(`.${element.class}`);
	}

	if (element.attributes) {
		const attrs = Object.entries(element.attributes)
			.map(([k, v]) => `[${k}="${v}"]`)
			.join(' ');
		if (attrs) parts.push(attrs);
	}

	return parts.join(' ');
}

/**
 * Generate CSS selector from element description
 */
export function generateSelector(element: ElementDescription): string {
	const parts: string[] = [];

	if (element.id) {
		return `#${element.id}`;
	}

	if (element.tag) {
		parts.push(element.tag);
	} else {
		parts.push('*');
	}

	if (element.class) {
		parts.push(`.${element.class}`);
	}

	if (element.attributes) {
		for (const [key, value] of Object.entries(element.attributes)) {
			parts.push(`[${key}="${value}"]`);
		}
	}

	return parts.join('');
}

/**
 * Parse natural language into structured query
 */
export function parseNaturalLanguage(query: string): Partial<ElementDescription> {
	const result: Partial<ElementDescription> = {};

	// Extract tag name
	const tagMatch = query.match(/(?:button|link|input|div|span|h1|h2|h3|p|a)/i);
	if (tagMatch) {
		result.tag = tagMatch[0].toLowerCase();
	}

	// Extract text content
	const textMatch = query.match(/with text ['"]([^'"]+)['"]/i);
	if (textMatch) {
		result.text = textMatch[1];
	}

	// Extract ID
	const idMatch = query.match(/(?:id|with id) ['"]?([\\w-]+)['"]?/i);
	if (idMatch) {
		result.id = idMatch[1];
	}

	// Extract class
	const classMatch = query.match(/(?:class|with class) ['"]?([\\w-]+)['"]?/i);
	if (classMatch) {
		result.class = classMatch[1];
	}

	// Store the original query as natural language
	result.naturalLanguage = query;

	return result;
}

/**
 * Find element by natural language description
 */
export function findByDescription(
	availableElements: ElementDescription[],
	query: string
): ClickTarget[] {
	const parsed = parseNaturalLanguage(query);
	const targets: ClickTarget[] = [];

	for (const element of availableElements) {
		let confidence = 0;
		const reasons: string[] = [];

		// Check tag match
		if (parsed.tag && element.tag === parsed.tag) {
			confidence += 0.3;
			reasons.push('Tag matches');
		}

		// Check text match (fuzzy)
		if (parsed.text && element.text) {
			const similarity = element.text.toLowerCase().includes(parsed.text.toLowerCase()) ? 1 : 0;
			confidence += similarity * 0.4;
			if (similarity) reasons.push('Text similar');
		}

		// Check ID match
		if (parsed.id && element.id === parsed.id) {
			confidence += 0.3;
			reasons.push('ID matches');
		}

		// Check class match
		if (parsed.class && element.class === parsed.class) {
			confidence += 0.2;
			reasons.push('Class matches');
		}

		// Check natural language similarity
		if (element.naturalLanguage) {
			const similarity = calculateSimilarity(query, element.naturalLanguage);
			if (similarity > 0.5) {
				confidence += similarity * 0.3;
				reasons.push('Natural language similar');
			}
		}

		if (confidence > 0.3) {
			targets.push({
				selector: generateSelector(element),
				description: describeElement(element),
				confidence,
			});
		}
	}

	// Sort by confidence (descending)
	targets.sort((a, b) => b.confidence - a.confidence);

	return targets;
}

/**
 * Calculate similarity between two strings (simple)
 */
function calculateSimilarity(a: string, b: string): number {
	const aLower = a.toLowerCase();
	const bLower = b.toLowerCase();

	if (aLower === bLower) return 1;

	// Simple word overlap
	const wordsA = new Set(aLower.split(/\s+/));
	const wordsB = new Set(bLower.split(/\s+/));
	const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));

	return intersection.size / Math.max(wordsA.size, wordsB.size);
}

/**
 * Generate click instruction for natural language
 */
export function generateClickInstruction(target: ClickTarget): string {
	return `Click on: ${target.description} (selector: ${target.selector})`;
}
