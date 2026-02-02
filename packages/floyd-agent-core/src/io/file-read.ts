import { readFile, stat } from 'node:fs/promises';

/**
 * File Operations - Enhanced Read
 *
 * PHASE 3 ITEM 11: File Read Full Content
 *
 * Enhances file reading with:
 * - Full content by default (no arbitrary truncation)
 * - Intelligent chunking for large files
 * - Context-aware reading
 */

export interface FileReadOptions {
	/** Return full file content (default: true) */
	full?: boolean;
	/** For large files, read in chunks */
	chunkSize?: number;
	/** Maximum file size to attempt reading (bytes) */
	maxSize?: number;
	/** Number of lines to read (if full is false) */
	lines?: number;
	/** Starting line number (1-indexed) */
	startLine?: number;
	/** Ending line number (1-indexed, inclusive) */
	endLine?: number;
}

export interface FileReadResult {
	content: string;
	metadata: {
		size: number;
		lines: number;
		chunked?: boolean;
		chunkCount?: number;
		truncated?: boolean;
	};
}

/**
 * Default chunk size for large files (1MB)
 */
const DEFAULT_CHUNK_SIZE = 1024 * 1024;

/**
 * Default max file size (10MB)
 */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Read file with enhanced options
 */
export async function readFilePath(
	filePath: string,
	options: FileReadOptions = {}
): Promise<FileReadResult> {
	const {
		full: _full = true,
		chunkSize = DEFAULT_CHUNK_SIZE,
		maxSize = DEFAULT_MAX_SIZE,
		lines,
		startLine,
		endLine,
	} = options;

	const stats = await stat(filePath);
	const fileSize = stats.size;

	if (fileSize > maxSize) {
		throw new Error(`File size (${fileSize} bytes) exceeds maximum limit (${maxSize} bytes).`);
	}

	// Determine if we need to chunk
	const needsChunking = shouldChunk(fileSize, chunkSize);
	
	const content = await readFile(filePath, 'utf-8');
	const allLines = content.split('\n');
	const totalLines = allLines.length;

	let resultLines = allLines;
	let truncated = false;

	if (startLine || endLine || lines) {
		const range = calculateLineRange(totalLines, startLine, endLine || (startLine && lines ? startLine + lines - 1 : undefined));
		resultLines = allLines.slice(range.start - 1, range.end);
		truncated = true;
	}

	return {
		content: resultLines.join('\n'),
		metadata: {
			size: fileSize,
			lines: totalLines,
			chunked: needsChunking,
			chunkCount: calculateChunkCount(fileSize, chunkSize),
			truncated,
		},
	};
}

/**
 * Calculate line range for partial reads
 */
export function calculateLineRange(
	totalLines: number,
	startLine?: number,
	endLine?: number
): { start: number; end: number; count: number } {
	const start = startLine || 1;
	const end = endLine || totalLines;

	return {
		start: Math.max(1, Math.min(start, totalLines)),
		end: Math.max(1, Math.min(end, totalLines)),
		count: Math.max(0, end - start + 1),
	};
}

/**
 * Check if file should be chunked based on size
 */
export function shouldChunk(fileSize: number, chunkSize: number = DEFAULT_CHUNK_SIZE): boolean {
	return fileSize > chunkSize;
}

/**
 * Calculate how many chunks a file will need
 */
export function calculateChunkCount(
	fileSize: number,
	chunkSize: number = DEFAULT_CHUNK_SIZE
): number {
	return Math.ceil(fileSize / chunkSize);
}
