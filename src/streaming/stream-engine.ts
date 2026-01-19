/**
 * LLM Streaming Engine
 *
 * Purpose: Main streaming orchestrator for LLM responses
 * Exports: StreamChunk, StreamProcessor
 * Related: differential-renderer.ts, chunk-processor.ts
 */

import EventEmitter from 'events';

/**
 * Represents a single chunk of streamed data from the LLM
 */
export interface StreamChunk {
	/** Raw text content of this chunk */
	text: string;
	/** Timestamp when chunk was received */
	timestamp: number;
	/** Chunk type for classification */
	type: 'text' | 'tool_start' | 'tool_delta' | 'tool_end' | 'error';
	/** Associated tool call ID if applicable */
	toolId?: string;
	/** Tool name if this is a tool-related chunk */
	toolName?: string;
	/** Partial JSON for tool input deltas */
	partialJson?: string;
	/** Sequence number for ordering */
	sequence: number;
}

/**
 * Configuration for the StreamProcessor
 */
export interface StreamProcessorConfig {
	/** Maximum buffer size before forcing flush (in characters) */
	maxBufferSize?: number;
	/** Minimum time between flushes in milliseconds */
	flushInterval?: number;
	/** Enable rate limiting on token output */
	rateLimitEnabled?: boolean;
	/** Maximum tokens per second when rate limiting */
	maxTokensPerSecond?: number;
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<StreamProcessorConfig> = {
	maxBufferSize: 4096,
	flushInterval: 50,
	rateLimitEnabled: true,
	maxTokensPerSecond: 25, // Slowed down for readable output (was 100)
	debug: false,
};

/**
 * StreamProcessor handles incoming LLM stream chunks with buffering and rate limiting
 *
 * This class:
 * - Buffers incoming chunks to smooth out token delivery
 * - Applies rate limiting to prevent UI flooding
 * - Emits events for each processed chunk
 * - Tracks completion state of the stream
 */
export class StreamProcessor extends EventEmitter {
	private buffer: string[] = [];
	private bufferSize = 0;
	private lastFlushTime = 0;
	private tokenBucket = 0;
	private lastTokenTime = 0;
	private sequence = 0;
	private isComplete = false;
	private config: Required<StreamProcessorConfig>;
	private flushTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(config: StreamProcessorConfig = {}) {
		super();
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Process a raw stream chunk from the LLM
	 *
	 * @param chunk - The raw chunk data to process
	 * @returns Processed StreamChunk with metadata
	 */
	processChunk(chunk: Partial<StreamChunk>): StreamChunk {
		const processedChunk: StreamChunk = {
			text: chunk.text || '',
			timestamp: Date.now(),
			type: chunk.type || 'text',
			toolId: chunk.toolId,
			toolName: chunk.toolName,
			partialJson: chunk.partialJson,
			sequence: this.sequence++,
		};

		if (this.config.debug) {
			this.emit('debug', {
				type: 'chunk_received',
				chunk: processedChunk,
				bufferSize: this.bufferSize,
			});
		}

		// Add to buffer if this is text content
		if (processedChunk.type === 'text' && processedChunk.text) {
			this.buffer.push(processedChunk.text);
			this.bufferSize += processedChunk.text.length;
		}

		// Emit the chunk immediately for tool-related events
		if (processedChunk.type !== 'text') {
			this.emit('chunk', processedChunk);
		}

		// Check if we should flush based on buffer size
		if (this.bufferSize >= this.config.maxBufferSize) {
			this.flush();
		} else {
			this.scheduleFlush();
		}

		return processedChunk;
	}

	/**
	 * Schedule a flush if not already scheduled
	 */
	private scheduleFlush(): void {
		if (this.flushTimer !== null) {
			return;
		}

		const timeSinceLastFlush = Date.now() - this.lastFlushTime;
		const delay = Math.max(0, this.config.flushInterval - timeSinceLastFlush);

		this.flushTimer = setTimeout(() => {
			this.flush();
			this.flushTimer = null;
		}, delay);
	}

	/**
	 * Flush buffered content to consumers
	 *
	 * Applies rate limiting if enabled
	 */
	async flush(): Promise<void> {
		if (this.buffer.length === 0) {
			return;
		}

		const content = this.buffer.join('');
		this.buffer = [];
		this.bufferSize = 0;
		this.lastFlushTime = Date.now();

		if (this.config.rateLimitEnabled) {
			await this.applyRateLimit(content.length);
		}

		this.emit('data', content);
	}

	/**
	 * Apply rate limiting using token bucket algorithm
	 *
	 * @param tokenCount - Number of tokens to emit
	 */
	private async applyRateLimit(tokenCount: number): Promise<void> {
		const now = Date.now();
		const timePassed = (now - this.lastTokenTime) / 1000;
		this.lastTokenTime = now;

		// Refill token bucket based on time passed
		this.tokenBucket = Math.min(
			this.config.maxTokensPerSecond,
			this.tokenBucket + timePassed * this.config.maxTokensPerSecond,
		);

		// Calculate how many tokens we can emit now
		const tokensToEmit = Math.min(tokenCount, this.tokenBucket);
		this.tokenBucket -= tokensToEmit;

		// If we need to wait for more tokens, delay appropriately
		if (tokensToEmit < tokenCount) {
			const remainingTokens = tokenCount - tokensToEmit;
			const delay = (remainingTokens / this.config.maxTokensPerSecond) * 1000;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	/**
	 * Mark the stream as complete and flush any remaining buffer
	 */
	complete(): void {
		if (this.flushTimer !== null) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		this.isComplete = true;
		this.flush();
		this.emit('end');
	}

	/**
	 * Handle an error in the stream
	 *
	 * @param error - The error that occurred
	 */
	error(error: Error): void {
		this.emit('error', error);
		this.complete();
	}

	/**
	 * Reset the processor state for a new stream
	 */
	reset(): void {
		if (this.flushTimer !== null) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		this.buffer = [];
		this.bufferSize = 0;
		this.sequence = 0;
		this.isComplete = false;
		this.tokenBucket = 0;
		this.lastTokenTime = 0;
		this.lastFlushTime = 0;
	}

	/**
	 * Get current buffer size in characters
	 */
	getBufferSize(): number {
		return this.bufferSize;
	}

	/**
	 * Check if the stream is complete
	 */
	isStreamComplete(): boolean {
		return this.isComplete;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		if (this.flushTimer !== null) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}
		this.removeAllListeners();
	}
}

/**
 * StreamingEngine orchestrates the entire streaming flow
 *
 * Integrates with AgentEngine to provide a clean streaming interface
 */
export class StreamingEngine extends EventEmitter {
	private processor: StreamProcessor;
	private fullContent = '';

	constructor(config: StreamProcessorConfig = {}) {
		super();
		this.processor = new StreamProcessor(config);
		this.setupProcessorEvents();
	}

	private setupProcessorEvents(): void {
		this.processor.on('data', (data: string) => {
			this.fullContent += data;
			this.emit('data', data);
		});

		this.processor.on('chunk', (chunk: StreamChunk) => {
			this.emit('chunk', chunk);
		});

		this.processor.on('end', () => {
			this.emit('end', this.fullContent);
		});

		this.processor.on('error', (error: Error) => {
			this.emit('error', error);
		});

		this.processor.on('debug', (data: unknown) => {
			this.emit('debug', data);
		});
	}

	/**
	 * Process a stream chunk
	 */
	process(chunk: Partial<StreamChunk>): StreamChunk {
		return this.processor.processChunk(chunk);
	}

	/**
	 * Mark the stream as complete
	 */
	complete(): void {
		this.processor.complete();
	}

	/**
	 * Handle an error
	 */
	error(error: Error): void {
		this.processor.error(error);
	}

	/**
	 * Reset for a new stream
	 */
	reset(): void {
		this.fullContent = '';
		this.processor.reset();
	}

	/**
	 * Get the full accumulated content
	 */
	getFullContent(): string {
		return this.fullContent;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.processor.destroy();
		this.removeAllListeners();
	}
}
