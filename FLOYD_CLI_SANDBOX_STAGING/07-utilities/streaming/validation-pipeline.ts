/**
 * Validation Pipeline for Streaming Output
 *
 * Purpose: Output validation, sanitization, and completion detection
 * Exports: validateChunk, sanitizeOutput, detectCompletion, ValidationPipeline
 * Related: stream-engine.ts
 */

import type {StreamChunk} from './stream-engine.js';

/**
 * Validation result for a chunk
 */
export interface ValidationResult {
	/** Whether the chunk passed validation */
	valid: boolean;
	/** Sanitized/cleaned content */
	sanitized: string;
	/** Error message if validation failed */
	error?: string;
	/** Warnings (non-blocking issues) */
	warnings: string[];
}

/**
 * Configuration for the validation pipeline
 */
export interface ValidationConfig {
	/** Maximum chunk size (in characters) */
	maxChunkSize?: number;
	/** Allowed markdown patterns (regex patterns to allow) */
	allowedPatterns?: RegExp[];
	/** Blocked patterns (regex patterns to block) */
	blockedPatterns?: RegExp[];
	/** Enable code fence sanitization */
	sanitizeCodeFences?: boolean;
	/** Strip ANSI escape codes */
	stripAnsiCodes?: boolean;
	/** Completion detection patterns */
	completionPatterns?: RegExp[];
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<ValidationConfig> = {
	maxChunkSize: 100000,
	allowedPatterns: [],
	blockedPatterns: [
		// Block potential command injection patterns
		/\$\([^)]*\)/, // Command substitution
		/`[^`]*`/, // Backtick command substitution
		/<script[^>]*>.*?<\/script>/is, // Script tags
		// Block suspicious file paths
		/\.\.[/\\]/, // Parent directory traversal
	],
	sanitizeCodeFences: true,
	stripAnsiCodes: true,
	completionPatterns: [
		/```$/, // Ends with code fence
		/\n\n$/, // Double newline
		/[.!?]\s*$/, // Ends with sentence-ending punctuation
	],
	debug: false,
};

/**
 * ANSI escape code pattern for terminal codes
 */
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

/**
 * Malicious markdown patterns to sanitize
 */
const MALICIOUS_MARKDOWN_PATTERNS = [
	// Javascript protocol
	/javascript:/gi,
	// Data URLs with script content
	/data:.*?script/gi,
	// HTML comments with content that might execute
	/<!--.*?-->/gs,
];

/**
 * Validate a single stream chunk
 *
 * @param chunk - The chunk to validate
 * @param config - Validation configuration
 * @returns Validation result with sanitized content
 */
export function validateChunk(
	chunk: StreamChunk | string,
	config: ValidationConfig = {},
): ValidationResult {
	const fullConfig = {...DEFAULT_CONFIG, ...config};
	const warnings: string[] = [];

	// Normalize input to string
	const content = typeof chunk === 'string' ? chunk : chunk.text;

	// Check chunk size
	if (content.length > fullConfig.maxChunkSize) {
		return {
			valid: false,
			sanitized: '',
			error: `Chunk size ${content.length} exceeds maximum ${fullConfig.maxChunkSize}`,
			warnings,
		};
	}

	// Check for blocked patterns
	for (const pattern of fullConfig.blockedPatterns) {
		if (pattern.test(content)) {
			return {
				valid: false,
				sanitized: '',
				error: `Content matches blocked pattern: ${pattern.source}`,
				warnings,
			};
		}
	}

	// Sanitize the content
	const sanitized = sanitizeOutput(content, fullConfig);

	if (fullConfig.debug) {
		if (content !== sanitized) {
			warnings.push('Content was modified during sanitization');
		}
	}

	return {
		valid: true,
		sanitized,
		warnings,
	};
}

/**
 * Sanitize output by cleaning potentially harmful content
 *
 * @param content - Content to sanitize
 * @param config - Validation configuration
 * @returns Sanitized content
 */
export function sanitizeOutput(
	content: string,
	config: ValidationConfig = {},
): string {
	const fullConfig = {...DEFAULT_CONFIG, ...config};
	let sanitized = content;

	// Strip ANSI escape codes if enabled
	if (fullConfig.stripAnsiCodes) {
		sanitized = sanitized.replace(ANSI_PATTERN, '');
	}

	// Remove malicious markdown patterns
	for (const pattern of MALICIOUS_MARKDOWN_PATTERNS) {
		sanitized = sanitized.replace(pattern, '');
	}

	// Sanitize code fences if enabled (ensure proper closing)
	if (fullConfig.sanitizeCodeFences) {
		sanitized = sanitizeCodeFences(sanitized);
	}

	// Normalize whitespace
	sanitized = sanitized.replace(/\r\n/g, '\n'); // Normalize line endings

	// Remove excessive empty lines (more than 3 consecutive)
	sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

	return sanitized;
}

/**
 * Ensure code fences are properly closed
 *
 * @param content - Content with potential unclosed code fences
 * @returns Content with properly closed code fences
 */
function sanitizeCodeFences(content: string): string {
	const lines = content.split('\n');
	const fenceStack: string[] = [];
	const result: string[] = [];

	for (const line of lines) {
		const fenceMatch = line.match(/^(`{3,}|~{3,})(.*?)$/);

		if (fenceMatch) {
			const fence = fenceMatch[1] ?? '```';
			const lang = fenceMatch[2];

			if (
				fenceStack.length > 0 &&
				fenceStack[fenceStack.length - 1] === fence
			) {
				// Closing fence
				fenceStack.pop();
			} else if (fenceStack.length === 0 || !lang) {
				// Opening fence (or unmatched)
				fenceStack.push(fence);
			}
		}

		result.push(line);
	}

	// Close any remaining open code fences
	while (fenceStack.length > 0) {
		const fence = fenceStack.pop()!;
		result.push(fence);
	}

	return result.join('\n');
}

/**
 * Detect if the stream content is complete
 *
 * @param content - Accumulated content to check
 * @param config - Validation configuration
 * @returns True if content appears complete
 */
export function detectCompletion(
	content: string,
	config: ValidationConfig = {},
): boolean {
	const fullConfig = {...DEFAULT_CONFIG, ...config};
	const trimmed = content.trim();

	// Empty content is not complete
	if (trimmed.length === 0) {
		return false;
	}

	// Check for completion patterns
	for (const pattern of fullConfig.completionPatterns) {
		if (pattern.test(trimmed)) {
			return true;
		}
	}

	// Check for natural sentence ending
	// Content likely complete if it ends with terminal punctuation
	// and doesn't have obvious incomplete structures
	const lastChar = trimmed[trimmed.length - 1];
	if (lastChar && ['.', '!', '?', '}', ']', ')', '`'].includes(lastChar)) {
		// Check for incomplete code blocks
		const openCodeFences = (trimmed.match(/```/g) || []).length;
		if (openCodeFences % 2 !== 0) {
			return false; // Unclosed code fence
		}

		// Check for incomplete brackets (basic check)
		const openBraces = (trimmed.match(/[{([]/g) || []).length;
		const closeBraces = (trimmed.match(/[})\]]/g) || []).length;
		if (openBraces !== closeBraces) {
			return false; // Unmatched brackets
		}

		return true;
	}

	return false;
}

/**
 * Extract tool calls from accumulated content
 *
 * @param content - Content to search for tool calls
 * @returns Array of detected tool call information
 */
export function extractToolCalls(content: string): Array<{
	id: string;
	name: string;
	input: string;
}> {
	const toolCalls: Array<{id: string; name: string; input: string}> = [];

	// Look for tool use blocks in content
	// Pattern: [Requesting tool: tool_name] followed by structured data
	const toolRequestPattern = /\[Requesting tool:\s*(\w+)\]/g;
	let match;

	while ((match = toolRequestPattern.exec(content)) !== null) {
		const name = match[1] ?? 'unknown';
		// Generate a unique ID for this tool call
		const id = `tool_${toolCalls.length}_${Date.now()}`;
		// In a real implementation, we'd parse the actual input from context
		toolCalls.push({id, name, input: '{}'});
	}

	return toolCalls;
}

/**
 * ValidationPipeline class for managing the entire validation flow
 */
export class ValidationPipeline {
	private config: Required<ValidationConfig>;
	private accumulatedContent = '';
	private validationErrors: string[] = [];
	private validationWarnings: string[] = [];

	constructor(config: ValidationConfig = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Process and validate a chunk
	 *
	 * @param chunk - Chunk to validate
	 * @returns Validation result
	 */
	processChunk(chunk: StreamChunk | string): ValidationResult {
		const result = validateChunk(chunk, this.config);

		if (!result.valid) {
			this.validationErrors.push(result.error || 'Unknown validation error');
		}

		for (const warning of result.warnings) {
			if (!this.validationWarnings.includes(warning)) {
				this.validationWarnings.push(warning);
			}
		}

		// Accumulate sanitized content
		this.accumulatedContent += result.sanitized;

		if (this.config.debug) {
			console.debug('[ValidationPipeline] Processed chunk:', {
				valid: result.valid,
				contentLength: result.sanitized.length,
				accumulatedLength: this.accumulatedContent.length,
			});
		}

		return result;
	}

	/**
	 * Check if the accumulated content is complete
	 */
	isComplete(): boolean {
		return detectCompletion(this.accumulatedContent, this.config);
	}

	/**
	 * Get the accumulated sanitized content
	 */
	getAccumulatedContent(): string {
		return this.accumulatedContent;
	}

	/**
	 * Get all validation errors
	 */
	getErrors(): string[] {
		return [...this.validationErrors];
	}

	/**
	 * Get all validation warnings
	 */
	getWarnings(): string[] {
		return [...this.validationWarnings];
	}

	/**
	 * Check if there are any errors
	 */
	hasErrors(): boolean {
		return this.validationErrors.length > 0;
	}

	/**
	 * Reset the pipeline state
	 */
	reset(): void {
		this.accumulatedContent = '';
		this.validationErrors = [];
		this.validationWarnings = [];
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<ValidationConfig>): void {
		this.config = {...this.config, ...config};
	}
}
