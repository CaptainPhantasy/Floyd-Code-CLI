/**
 * Explore Agent
 *
 * Fast codebase exploration with semantic search and navigation.
 *
 * @module agent/explore-agent
 */

import {readdir, readFile, stat} from 'node:fs/promises';
import {join, relative, extname} from 'node:path';
import {readdirSync} from 'node:fs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * File entry in codebase index
 */
export interface FileEntry {
	/** File path */
	path: string;

	/** Relative path from project root */
	relativePath: string;

	/** File extension */
	extension: string;

	/** File size */
	size: number;

	/** Last modified time */
	mtime: Date;

	/** Language (based on extension) */
	language: string;
}

/**
 * Symbol entry (function, class, etc.)
 */
export interface SymbolEntry {
	/** Symbol name */
	name: string;

	/** Symbol type */
	type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant';

	/** File path */
	file: string;

	/** Line number */
	line: number;

	/** Symbol signature */
	signature?: string;

	/** Symbol description */
	description?: string;
}

/**
 * Codebase index
 */
export interface CodebaseIndex {
	/** All files */
	files: Map<string, FileEntry>;

	/** Files by extension */
	byExtension: Map<string, FileEntry[]>;

	/** Files by language */
	byLanguage: Map<string, FileEntry[]>;

	/** All symbols */
	symbols: Map<string, SymbolEntry[]>;

	/** Index created at */
	createdAt: Date;

	/** Total files indexed */
	totalFiles: number;

	/** Total symbols indexed */
	totalSymbols: number;
}

/**
 * Explore query
 */
export interface ExploreQuery {
	/** Query text */
	text: string;

	/** Query type */
	type?: 'file' | 'symbol' | 'content' | 'all';

	/** File pattern filter */
	pattern?: string;

	/** Maximum results */
	limit?: number;
}

/**
 * Explore result
 */
export interface ExploreResult {
	/** Matching files */
	files: FileEntry[];

	/** Matching symbols */
	symbols: SymbolEntry[];

	/** Preview content */
	previews: Array<{
		path: string;
		content: string;
		line: number;
	}>;

	/** Query execution time */
	duration: number;
}

/**
 * Explore agent options
 */
export interface ExploreAgentOptions {
	/** Maximum files to index */
	maxFiles?: number;

	/** File extensions to index */
	extensions?: string[];

	/** Directories to exclude */
	excludeDirs?: string[];

	/** Enable symbol extraction */
	enableSymbols?: boolean;

	/** Index update debounce time (ms) */
	debounceTime?: number;
}

// ============================================================================
// EXPLORE AGENT CLASS
// ============================================================================

/**
 * ExploreAgent - Fast codebase exploration
 *
 * Provides semantic search and navigation for codebases.
 * Indexes files and symbols for fast lookups.
 */
export class ExploreAgent {
	private readonly options: Required<ExploreAgentOptions>;
	private index: CodebaseIndex | null = null;
	private indexTimeout: NodeJS.Timeout | null = null;

	constructor(options: ExploreAgentOptions = {}) {
		this.options = {
			maxFiles: options.maxFiles ?? 10000,
			extensions: options.extensions ?? [
				'.ts', '.tsx', '.js', '.jsx',
				'.json', '.md',
				'.py', '.rs', '.go',
				'.java', '.kt',
			],
			excludeDirs: options.excludeDirs ?? [
				'node_modules',
				'dist',
				'build',
				'.git',
				'coverage',
				'.next',
				'.cache',
			],
			enableSymbols: options.enableSymbols ?? true,
			debounceTime: options.debounceTime ?? 5000,
		};
	}

	/**
	 * Initialize the explore agent
	 */
	async initialize(rootPath: string = process.cwd()): Promise<void> {
		await this.buildIndex(rootPath);
	}

	/**
	 * Explore the codebase
	 */
	async explore(query: ExploreQuery): Promise<ExploreResult> {
		const startTime = Date.now();

		// Ensure index exists
		if (!this.index) {
			throw new Error('Explore agent not initialized. Call initialize() first.');
		}

		const type = query.type ?? 'all';
		const limit = query.limit ?? 20;

		const results: ExploreResult = {
			files: [],
			symbols: [],
			previews: [],
			duration: 0,
		};

		// Search files
		if (type === 'file' || type === 'all') {
			results.files = this.searchFiles(query.text, query.pattern, limit);
		}

		// Search symbols
		if (type === 'symbol' || type === 'all') {
			results.symbols = this.searchSymbols(query.text, limit);
		}

		// Search content
		if (type === 'content' || type === 'all') {
			results.previews = await this.searchContent(query.text, limit);
		}

		results.duration = Date.now() - startTime;

		return results;
	}

	/**
	 * Get file overview
	 */
	async getFileOverview(path: string): Promise<{
		file: FileEntry | undefined;
		symbols: SymbolEntry[];
		stats: {
			lines: number;
			size: number;
			language: string;
		};
	}> {
		if (!this.index) {
			throw new Error('Explore agent not initialized');
		}

		const file = this.index.files.get(path);

		if (!file) {
			return {
				file: undefined,
				symbols: [],
				stats: {lines: 0, size: 0, language: 'unknown'},
			};
		}

		const symbols = this.index.symbols.get(path) || [];

		// Get file stats
		const content = await readFile(path, 'utf-8');
		const lines = content.split('\n').length;

		return {
			file,
			symbols,
			stats: {
				lines,
				size: file.size,
				language: file.language,
			},
		};
	}

	/**
	 * Get index statistics
	 */
	getIndexStats(): {
		totalFiles: number;
		totalSymbols: number;
		languages: Record<string, number>;
		extensions: Record<string, number>;
		indexAge?: number;
	} | null {
		if (!this.index) {
			return null;
		}

		const languages: Record<string, number> = {};
		const extensions: Record<string, number> = {};

		for (const file of this.index.files.values()) {
			languages[file.language] = (languages[file.language] || 0) + 1;
			extensions[file.extension] = (extensions[file.extension] || 0) + 1;
		}

		return {
			totalFiles: this.index.totalFiles,
			totalSymbols: this.index.totalSymbols,
			languages,
			extensions,
			indexAge: this.index.createdAt ? Date.now() - this.index.createdAt.getTime() : undefined,
		};
	}

	/**
	 * Schedule index update
	 */
	scheduleIndexUpdate(rootPath: string): void {
		if (this.indexTimeout) {
			clearTimeout(this.indexTimeout);
		}

		this.indexTimeout = setTimeout(async () => {
			await this.buildIndex(rootPath);
		}, this.options.debounceTime);
	}

	/**
	 * Build codebase index
	 */
	private async buildIndex(rootPath: string): Promise<void> {
		const files = new Map<string, FileEntry>();
		const byExtension = new Map<string, FileEntry[]>();
		const byLanguage = new Map<string, FileEntry[]>();
		const symbols = new Map<string, SymbolEntry[]>();

		let fileCount = 0;
		let symbolCount = 0;

		// Walk directory tree
		const walkDir = async (dir: string): Promise<void> => {
			if (fileCount >= this.options.maxFiles) {
				return;
			}

			try {
				const entries = await readdir(dir, {withFileTypes: true});

				for (const entry of entries) {
					if (fileCount >= this.options.maxFiles) {
						return;
					}

					// Skip excluded directories
					if (entry.isDirectory()) {
						if (this.options.excludeDirs.includes(entry.name)) {
							continue;
						}
						await walkDir(join(dir, entry.name));
						continue;
					}

					// Skip files without matching extension
					const ext = extname(entry.name);
					if (!this.options.extensions.includes(ext)) {
						continue;
					}

					// Index file
					const fullPath = join(dir, entry.name);
					const stats = await stat(fullPath);
					const relativePath = relative(rootPath, fullPath);

					const fileEntry: FileEntry = {
						path: fullPath,
						relativePath,
						extension: ext,
						size: stats.size,
						mtime: stats.mtime,
						language: this.getLanguage(ext),
					};

					files.set(fullPath, fileEntry);

					// Group by extension
					if (!byExtension.has(ext)) {
						byExtension.set(ext, []);
					}
					byExtension.get(ext)!.push(fileEntry);

					// Group by language
					if (!byLanguage.has(fileEntry.language)) {
						byLanguage.set(fileEntry.language, []);
					}
					byLanguage.get(fileEntry.language)!.push(fileEntry);

					// Extract symbols if enabled
					if (this.options.enableSymbols) {
						const fileSymbols = await this.extractSymbols(fullPath);
						if (fileSymbols.length > 0) {
							symbols.set(fullPath, fileSymbols);
							symbolCount += fileSymbols.length;
						}
					}

					fileCount++;
				}
			} catch {
				// Ignore permission errors
			}
		};

		await walkDir(rootPath);

		this.index = {
			files,
			byExtension,
			byLanguage,
			symbols,
			createdAt: new Date(),
			totalFiles: fileCount,
			totalSymbols: symbolCount,
		};
	}

	/**
	 * Search files by name/path
	 */
	private searchFiles(query: string, pattern: string | undefined, limit: number): FileEntry[] {
		const results: FileEntry[] = [];
		const searchLower = query.toLowerCase();

		for (const file of this.index!.files.values()) {
			if (results.length >= limit) {
				break;
			}

			// Apply pattern filter
			if (pattern && !file.relativePath.match(pattern)) {
				continue;
			}

			// Search in path
			if (
				file.relativePath.toLowerCase().includes(searchLower) ||
				file.path.toLowerCase().includes(searchLower)
			) {
				results.push(file);
			}
		}

		return results;
	}

	/**
	 * Search symbols by name
	 */
	private searchSymbols(query: string, limit: number): SymbolEntry[] {
		const results: SymbolEntry[] = [];
		const searchLower = query.toLowerCase();

		for (const [, fileSymbols] of this.index!.symbols) {
			if (results.length >= limit) {
				break;
			}

			for (const symbol of fileSymbols) {
				if (results.length >= limit) {
					break;
				}

				if (symbol.name.toLowerCase().includes(searchLower)) {
					results.push(symbol);
				}
			}
		}

		return results;
	}

	/**
	 * Search file contents
	 */
	private async searchContent(query: string, limit: number): Promise<Array<{
		path: string;
		content: string;
		line: number;
	}>> {
		const results: Array<{
			path: string;
			content: string;
			line: number;
		}> = [];
		const searchLower = query.toLowerCase();

		for (const [path, file] of this.index!.files) {
			if (results.length >= limit) {
				break;
			}

			try {
				const content = await readFile(path, 'utf-8');
				const lines = content.split('\n');

				for (let i = 0; i < lines.length; i++) {
					if (results.length >= limit) {
						break;
					}

					if (lines[i].toLowerCase().includes(searchLower)) {
						// Get context (3 lines before and after)
						const start = Math.max(0, i - 3);
						const end = Math.min(lines.length, i + 4);
						const preview = lines.slice(start, end).join('\n');

						results.push({
							path,
							content: preview,
							line: i + 1,
						});

						break; // Only one match per file
					}
				}
			} catch {
				// Skip files that can't be read
			}
		}

		return results;
	}

	/**
	 * Extract symbols from a file (basic implementation)
	 */
	private async extractSymbols(path: string): Promise<SymbolEntry[]> {
		const symbols: SymbolEntry[] = [];

		try {
			const content = await readFile(path, 'utf-8');
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim();

				// TypeScript/JavaScript
				if (line.startsWith('function ') || line.startsWith('async function ')) {
					const match = line.match(/function\s+(\w+)/);
					if (match) {
						symbols.push({
							name: match[1],
							type: 'function',
							file: path,
							line: i + 1,
							signature: line,
						});
					}
				}

				if (line.startsWith('class ')) {
					const match = line.match(/class\s+(\w+)/);
					if (match) {
						symbols.push({
							name: match[1],
							type: 'class',
							file: path,
							line: i + 1,
							signature: line,
						});
					}
				}

				if (line.startsWith('interface ')) {
					const match = line.match(/interface\s+(\w+)/);
					if (match) {
						symbols.push({
							name: match[1],
							type: 'interface',
							file: path,
							line: i + 1,
							signature: line,
						});
					}
				}

				if (line.startsWith('const ') || line.startsWith('let ')) {
					const match = line.match(/(?:const|let)\s+(\w+)/);
					if (match) {
						symbols.push({
							name: match[1],
							type: line.includes('const') ? 'constant' : 'variable',
							file: path,
							line: i + 1,
							signature: line,
						});
					}
				}
			}
		} catch {
			// Skip files that can't be parsed
		}

		return symbols;
	}

	/**
	 * Get language from file extension
	 */
	private getLanguage(extension: string): string {
		const languageMap: Record<string, string> = {
			'.ts': 'TypeScript',
			'.tsx': 'TypeScript JSX',
			'.js': 'JavaScript',
			'.jsx': 'JavaScript JSX',
			'.json': 'JSON',
			'.md': 'Markdown',
			'.py': 'Python',
			'.rs': 'Rust',
			'.go': 'Go',
			'.java': 'Java',
			'.kt': 'Kotlin',
		};

		return languageMap[extension] || 'Unknown';
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a natural language query from text
 */
export function parseNaturalLanguageQuery(text: string): ExploreQuery {
	const lower = text.toLowerCase();

	// Detect query type
	let type: ExploreQuery['type'] = 'all';
	if (lower.includes('file') || lower.includes('files')) {
		type = 'file';
	} else if (lower.includes('function') || lower.includes('class') || lower.includes('symbol')) {
		type = 'symbol';
	} else if (lower.includes('content') || lower.includes('contains')) {
		type = 'content';
	}

	// Extract actual search term (remove query type words)
	const searchTerm = text
		.replace(/\b(files?|functions?|classes?|symbols?|content|contains?)\b/gi, '')
		.trim();

	return {
		text: searchTerm || text,
		type,
		limit: 20,
	};
}

export default ExploreAgent;
