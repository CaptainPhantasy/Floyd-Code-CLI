/**
 * Chunk Processor
 *
 * Purpose: Process and transform streaming chunks from LLM API
 * Exports: ChunkProcessor class
 * Related: streaming-engine.ts, validation-pipeline.ts
 */

import type {StreamChunk} from './stream-engine.js';
import {validateChunk, type ValidationResult} from './validation-pipeline.js';

/**
 * Configuration for chunk processing
 */
export interface ChunkProcessorConfig {
	/** Enable validation of chunks */
	validate?: boolean;
	/** Enable sanitization */
	sanitize?: boolean;
	/** Maximum chunk size before splitting */
	maxChunkSize?: number;
	/** Enable debug logging */
	debug?: boolean;
	/** Custom chunk transformation function */
	transform?: (chunk: StreamChunk) => StreamChunk;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ChunkProcessorConfig> = {
	validate: true,
	sanitize: true,
	maxChunkSize: 10000,
	debug: false,
	transform: chunk => chunk,
};

/**
 * ChunkProcessor processes raw LLM stream chunks
 *
 * Features:
 * - Validates chunks for security
 * - Sanitizes content
 * - Transforms chunks for UI consumption
 * - Handles chunk splitting for large content
 * - Tracks processing statistics
 */
export class ChunkProcessor {
	private config: Required<ChunkProcessorConfig>;
	private processedCount = 0;
	private errorCount = 0;
	private totalBytes = 0;

	constructor(config: ChunkProcessorConfig = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Process a raw chunk from the LLM stream
	 *
	 * @param rawChunk - Raw chunk data (can be Anthropic API chunk or StreamChunk)
	 * @returns Processed StreamChunk
	 */
	process(rawChunk: unknown): StreamChunk | null {
		try {
			// Convert raw API chunk to StreamChunk format
			const chunk = this.normalizeChunk(rawChunk);

			if (!chunk) {
				return null;
			}

			// Validate if enabled
			if (this.config.validate) {
				const validation = validateChunk(chunk);
				if (!validation.valid) {
					this.errorCount++;
					if (this.config.debug) {
						console.warn('[ChunkProcessor] Validation failed:', validation.error);
					}
					// Return error chunk instead of null
					return {
						...chunk,
						type: 'error',
						text: validation.error || 'Validation failed',
					};
				}

				// Use sanitized content
				if (this.config.sanitize && validation.sanitized !== chunk.text) {
					chunk.text = validation.sanitized;
				}
			}

			// Apply custom transformation
			const transformed = this.config.transform(chunk);

			// Split large chunks if needed
			if (transformed.text.length > this.config.maxChunkSize) {
				return this.splitChunk(transformed);
			}

			// Update statistics
			this.processedCount++;
			this.totalBytes += transformed.text.length;

			if (this.config.debug) {
				console.debug('[ChunkProcessor] Processed chunk:', {
					sequence: transformed.sequence,
					type: transformed.type,
					textLength: transformed.text.length,
					totalProcessed: this.processedCount,
				});
			}

			return transformed;
		} catch (error) {
			this.errorCount++;
			if (this.config.debug) {
				console.error('[ChunkProcessor] Error processing chunk:', error);
			}

			// Return error chunk
			return {
				text: error instanceof Error ? error.message : String(error),
				timestamp: Date.now(),
				type: 'error',
				sequence: this.processedCount,
			};
		}
	}

	/**
	 * Normalize various chunk formats to StreamChunk
	 *
	 * Handles Anthropic API chunks, raw strings, and StreamChunk objects
	 */
	private normalizeChunk(rawChunk: unknown): StreamChunk | null {
		// Already a StreamChunk
		if (
			typeof rawChunk === 'object' &&
			rawChunk !== null &&
			'timestamp' in rawChunk &&
			'type' in rawChunk
		) {
			return rawChunk as StreamChunk;
		}

		// Anthropic API chunk format
		if (
			typeof rawChunk === 'object' &&
			rawChunk !== null &&
			'type' in rawChunk
		) {
			const apiChunk = rawChunk as {
				type: string;
				delta?: {type?: string; text?: string; partial_json?: string};
				content_block?: {
					type?: string;
					id?: string;
					name?: string;
				};
			};

			// Handle text delta chunks
			if (
				apiChunk.type === 'content_block_delta' &&
				apiChunk.delta?.type === 'text_delta' &&
				apiChunk.delta.text
			) {
				return {
					text: apiChunk.delta.text,
					timestamp: Date.now(),
					type: 'text',
					sequence: this.processedCount,
				};
			}

			// Handle tool use start
			if (
				apiChunk.type === 'content_block_start' &&
				apiChunk.content_block?.type === 'tool_use'
			) {
				return {
					text: '',
					timestamp: Date.now(),
					type: 'tool_start',
					toolId: apiChunk.content_block.id,
					toolName: apiChunk.content_block.name,
					sequence: this.processedCount,
				};
			}

			// Handle tool input delta
			if (
				apiChunk.type === 'content_block_delta' &&
				apiChunk.delta?.type === 'input_json_delta' &&
				apiChunk.delta.partial_json
			) {
				return {
					text: '',
					timestamp: Date.now(),
					type: 'tool_delta',
					partialJson: apiChunk.delta.partial_json,
					sequence: this.processedCount,
				};
			}

			// Handle tool end
			if (apiChunk.type === 'content_block_stop') {
				return {
					text: '',
					timestamp: Date.now(),
					type: 'tool_end',
					sequence: this.processedCount,
				};
			}
		}

		// Raw string
		if (typeof rawChunk === 'string') {
			return {
				text: rawChunk,
				timestamp: Date.now(),
				type: 'text',
				sequence: this.processedCount,
			};
		}

		// Unknown format
		return null;
	}

	/**
	 * Split a large chunk into smaller pieces
	 *
	 * @param chunk - Chunk to split
	 * @returns First part of the split chunk (subsequent parts should be handled separately)
	 */
	private splitChunk(chunk: StreamChunk): StreamChunk {
		const maxSize = this.config.maxChunkSize;
		const firstPart = chunk.text.substring(0, maxSize);
		const remaining = chunk.text.substring(maxSize);

		// Return first part, note that remaining should be processed separately
		// In a real implementation, you might want to emit multiple chunks
		if (this.config.debug && remaining.length > 0) {
			console.warn(
				`[ChunkProcessor] Chunk split: ${chunk.text.length} -> ${firstPart.length} + ${remaining.length}`,
			);
		}

		return {
			...chunk,
			text: firstPart,
		};
	}

	/**
	 * Get processing statistics
	 */
	getStats(): {
		processedCount: number;
		errorCount: number;
		totalBytes: number;
		averageChunkSize: number;
	} {
		return {
			processedCount: this.processedCount,
			errorCount: this.errorCount,
			totalBytes: this.totalBytes,
			averageChunkSize:
				this.processedCount > 0 ? this.totalBytes / this.processedCount : 0,
		};
	}

	/**
	 * Reset processor state
	 */
	reset(): void {
		this.processedCount = 0;
		this.errorCount = 0;
		this.totalBytes = 0;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<ChunkProcessorConfig>): void {
		this.config = {...this.config, ...config};
	}
}

/**
 * Create a chunk processor with default configuration
 */
export function createChunkProcessor(
	config?: ChunkProcessorConfig,
): ChunkProcessor {
	return new ChunkProcessor(config);
}
