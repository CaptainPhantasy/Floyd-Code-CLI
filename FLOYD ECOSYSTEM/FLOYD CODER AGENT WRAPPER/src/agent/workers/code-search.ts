/**
 * CodeSearch Worker
 *
 * Fast code discovery and symbol search specialist.
 * Provides read-only operations for navigating and searching codebases.
 *
 * Features:
 * - File pattern matching (glob)
 * - Content search (grep)
 * - Symbol discovery (classes, functions, types)
 * - Reference finding
 *
 * @module agent/workers/code-search
 */

import {readFile} from 'node:fs/promises';
import {join, relative, isAbsolute} from 'node:path';
import * as fg from 'fast-glob';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Single search match result
 */
export interface SearchMatch {
	file: string;
	line: number;
	context: string;
	symbol?: string;
	kind?: SymbolKind;
}

/**
 * Symbol kind enumeration
 */
export enum SymbolKind {
	Unknown = 0,
	File = 1,
	Module = 2,
	Namespace = 3,
	Package = 4,
	Class = 5,
	Method = 6,
	Property = 7,
	Field = 8,
	Constructor = 9,
	Enum = 10,
	Interface = 11,
	Function = 12,
	Variable = 13,
	Constant = 14,
	String = 15,
	Number = 16,
	Boolean = 17,
	Array = 18,
	Object = 19,
	Key = 20,
	Null = 21,
	EnumMember = 22,
	Struct = 23,
	Event = 24,
	Operator = 25,
	TypeParameter = 26,
}

/**
 * Symbol information
 */
export interface SymbolInfo {
	name: string;
	kind: SymbolKind;
	file: string;
	line: number;
	endLine?: number;
	container?: string;
	docstring?: string;
	signature?: string;
}

/**
 * Reference information
 */
export interface Reference {
	file: string;
	line: number;
	column: number;
	context: string;
	isDefinition: boolean;
}

/**
 * Code search result summary
 */
export interface CodeSearchResult {
	matches: SearchMatch[];
	summary: string;
	totalMatches: number;
	filesSearched: number;
	queryDuration: number;
}

/**
 * Options for file finding
 */
export interface FindFileOptions {
	caseSensitive?: boolean;
	ignorePatterns?: string[];
	maxResults?: number;
}

/**
 * Options for code searching
 */
export interface SearchCodeOptions {
	filePattern?: string;
	caseSensitive?: boolean;
	contextLines?: number;
	maxResults?: number;
}

/**
 * Options for symbol finding
 */
export interface FindSymbolOptions {
	includeBody?: boolean;
	includeInfo?: boolean;
	depth?: number;
}

// ============================================================================
// CODE SEARCH WORKER
// ============================================================================

/**
 * CodeSearch Worker - Fast code discovery and symbol search specialist.
 *
 * Token budget: 40 tokens (lightweight, fast operations)
 * Tools: read_file, glob, grep, find_symbol (code navigation only)
 *
 * This worker is read-only and specializes in:
 * - Finding files by pattern (glob)
 * - Searching code content (grep)
 * - Symbol discovery (classes, functions, types)
 * - Quick code navigation
 */
export class CodeSearchWorker {
	private readonly projectRoot: string;
	private readonly defaultIgnorePatterns: string[];

	/**
	 * Create a new CodeSearch worker
	 *
	 * @param projectRoot - Root directory for search operations
	 * @param ignorePatterns - Default glob patterns to ignore
	 */
	constructor(
		projectRoot: string = process.cwd(),
		ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS,
	) {
		this.projectRoot = projectRoot;
		this.defaultIgnorePatterns = ignorePatterns;
	}

	// ========================================================================
	// PUBLIC API
	// ========================================================================

	/**
	 * Find files by glob pattern
	 *
	 * @param pattern - Glob pattern to match files
	 * @param path - Base path for search (defaults to project root)
	 * @param options - Additional options
	 * @returns Array of matching file paths
	 */
	async findFile(
		pattern: string,
		path?: string,
		options?: FindFileOptions,
	): Promise<string[]> {
		const searchPath = this.resolveSearchPath(path);
		const ignore = options?.ignorePatterns ?? this.defaultIgnorePatterns;

		try {
			const matches = await fg.glob(pattern, {
				cwd: searchPath,
				ignore,
				caseSensitiveMatch: options?.caseSensitive ?? false,
				absolute: true,
				onlyFiles: true,
			});

			// Limit results if maxResults is specified
			if (options?.maxResults && options.maxResults < matches.length) {
				return matches.slice(0, options.maxResults);
			}

			return matches;
		} catch (error) {
			throw new CodeSearchError(
				`Failed to find files matching pattern "${pattern}": ${error}`,
			);
		}
	}

	/**
	 * Search code content for a query string or regex
	 *
	 * @param query - Search query (string or regex pattern)
	 * @param path - Path to search (defaults to project root)
	 * @param options - Search options
	 * @returns Structured search results
	 */
	async searchCode(
		query: string,
		path?: string,
		options?: SearchCodeOptions,
	): Promise<CodeSearchResult> {
		const startTime = Date.now();

		// Determine files to search
		const filesToSearch = options?.filePattern
			? await this.findFile(options.filePattern, path)
			: await this.findFile('**/*.{ts,tsx,js,jsx}', path);

		const matches: SearchMatch[] = [];
		let filesSearched = 0;
		const contextLines = options?.contextLines ?? 2;

		// Prepare regex pattern
		const searchRegex = this.createSearchRegex(query, options?.caseSensitive);

		for (const file of filesToSearch) {
			try {
				const content = await readFile(file, 'utf-8');
				const lines = content.split('\n');
				let fileMatched = false;

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					if (line !== undefined && searchRegex.test(line)) {
						if (!fileMatched) {
							filesSearched++;
							fileMatched = true;
						}

						// Extract context
						const contextStart = Math.max(0, i - contextLines);
						const contextEnd = Math.min(lines.length, i + contextLines + 1);
						const contextLinesArray = lines.slice(contextStart, contextEnd);
						const context = contextLinesArray.join('\n');

						matches.push({
							file: relative(this.projectRoot, file),
							line: i + 1,
							context,
						});

						// Respect max results
						if (options?.maxResults && matches.length >= options.maxResults) {
							break;
						}
					}
				}

				// Check max results after each file
				if (options?.maxResults && matches.length >= options.maxResults) {
					break;
				}
			} catch (error) {
				// Skip files that can't be read
				continue;
			}
		}

		const duration = Date.now() - startTime;

		return {
			matches,
			summary: this.generateSummary(matches, filesSearched, query, duration),
			totalMatches: matches.length,
			filesSearched,
			queryDuration: duration,
		};
	}

	/**
	 * Locate a symbol definition by its name path
	 *
	 * @param symbolPath - Path to symbol (e.g., "MyClass/myMethod")
	 * @param file - File to search in
	 * @param options - Find options
	 * @returns Symbol information or null if not found
	 */
	async findSymbol(
		symbolPath: string,
		file: string,
		options?: FindSymbolOptions,
	): Promise<SymbolInfo | null> {
		const filePath = this.resolveFilePath(file);

		try {
			const content = await readFile(filePath, 'utf-8');
			const symbolName = symbolPath.split('/').pop() ?? symbolPath;

			// Try to find the symbol using regex patterns
			const symbolInfo = this.extractSymbolInfo(
				content,
				symbolName,
				filePath,
				options,
			);

			return symbolInfo;
		} catch (error) {
			throw new CodeSearchError(
				`Failed to find symbol "${symbolPath}" in ${file}: ${error}`,
			);
		}
	}

	/**
	 * Find all references to a symbol across the codebase
	 *
	 * @param symbolPath - Path to symbol
	 * @param file - Original file containing the symbol
	 * @param options - Search options
	 * @returns Array of references
	 */
	async findReferences(
		symbolPath: string,
		file: string,
		options?: SearchCodeOptions,
	): Promise<Reference[]> {
		const symbolName = symbolPath.split('/').pop() ?? symbolPath;
		const searchResults = await this.searchCode(
			`\\b${this.escapeRegex(symbolName)}\\b`,
			this.projectRoot,
			{
				...options,
				contextLines: 1,
			},
		);

		const references: Reference[] = [];
		const definitionFile = relative(
			this.projectRoot,
			this.resolveFilePath(file),
		);

		for (const match of searchResults.matches) {
			references.push({
				file: match.file,
				line: match.line,
				column: 0, // Column info not available from simple grep
				context: match.context.trim(),
				isDefinition: match.file === definitionFile,
			});
		}

		return references;
	}

	/**
	 * Find all symbols in a file (classes, functions, types, etc.)
	 *
	 * @param file - File to analyze
	 * @returns Array of symbol information
	 */
	async findAllSymbols(file: string): Promise<SymbolInfo[]> {
		const filePath = this.resolveFilePath(file);

		try {
			const content = await readFile(filePath, 'utf-8');
			const symbols: SymbolInfo[] = [];

			// Extract various symbol types
			symbols.push(...this.extractClasses(content, filePath));
			symbols.push(...this.extractFunctions(content, filePath));
			symbols.push(...this.extractInterfaces(content, filePath));
			symbols.push(...this.extractTypes(content, filePath));

			// Sort by line number
			symbols.sort((a, b) => a.line - b.line);

			return symbols;
		} catch (error) {
			throw new CodeSearchError(
				`Failed to extract symbols from ${file}: ${error}`,
			);
		}
	}

	// ========================================================================
	// PRIVATE HELPERS
	// ========================================================================

	/**
	 * Resolve search path to absolute path
	 */
	private resolveSearchPath(path?: string): string {
		if (!path) {
			return this.projectRoot;
		}

		return isAbsolute(path) ? path : join(this.projectRoot, path);
	}

	/**
	 * Resolve file path to absolute path
	 */
	private resolveFilePath(file: string): string {
		return isAbsolute(file) ? file : join(this.projectRoot, file);
	}

	/**
	 * Create search regex from query
	 */
	private createSearchRegex(query: string, caseSensitive?: boolean): RegExp {
		try {
			const flags = caseSensitive ? 'g' : 'gi';
			return new RegExp(query, flags);
		} catch {
			// If query is not a valid regex, escape it and use as literal string
			const escaped = this.escapeRegex(query);
			return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
		}
	}

	/**
	 * Escape regex special characters
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * Generate search summary
	 */
	private generateSummary(
		matches: SearchMatch[],
		filesSearched: number,
		query: string,
		duration: number,
	): string {
		if (matches.length === 0) {
			return `No matches found for "${query}" in ${filesSearched} files`;
		}

		const uniqueFiles = new Set(matches.map(m => m.file)).size;
		return `Found ${matches.length} ${
			matches.length === 1 ? 'match' : 'matches'
		} in ${uniqueFiles} ${
			uniqueFiles === 1 ? 'file' : 'files'
		} (${duration}ms)`;
	}

	/**
	 * Extract symbol info from content
	 */
	private extractSymbolInfo(
		content: string,
		symbolName: string,
		filePath: string,
		_options?: FindSymbolOptions,
	): SymbolInfo | null {
		const lines = content.split('\n');

		// Try various symbol patterns
		const patterns: Array<{regex: RegExp; kind: SymbolKind}> = [
			// Classes
			{regex: /^class\s+(\w+)/, kind: SymbolKind.Class},
			// Methods
			{regex: /^\s*(async\s+)?(\w+)\s*\(/, kind: SymbolKind.Method},
			// Functions
			{
				regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
				kind: SymbolKind.Function,
			},
			// Arrow functions/const functions
			{
				regex: /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(?\w/,
				kind: SymbolKind.Function,
			},
			// Interfaces
			{regex: /^interface\s+(\w+)/, kind: SymbolKind.Interface},
			// Types
			{regex: /^type\s+(\w+)/, kind: SymbolKind.TypeParameter},
		];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) continue;

			for (const pattern of patterns) {
				const match = line.match(pattern.regex);
				if (match && match[1] === symbolName) {
					return {
						name: symbolName,
						kind: pattern.kind,
						file: relative(this.projectRoot, filePath),
						line: i + 1,
					};
				}
			}
		}

		return null;
	}

	/**
	 * Extract class declarations
	 */
	private extractClasses(content: string, filePath: string): SymbolInfo[] {
		const symbols: SymbolInfo[] = [];
		const lines = content.split('\n');
		const classRegex = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) continue;
			const match = line.match(classRegex);
			if (match && match[1]) {
				symbols.push({
					name: match[1],
					kind: SymbolKind.Class,
					file: relative(this.projectRoot, filePath),
					line: i + 1,
				});
			}
		}

		return symbols;
	}

	/**
	 * Extract function declarations
	 */
	private extractFunctions(content: string, filePath: string): SymbolInfo[] {
		const symbols: SymbolInfo[] = [];
		const lines = content.split('\n');
		const functionRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) continue;
			const match = line.match(functionRegex);
			if (match && match[1]) {
				symbols.push({
					name: match[1],
					kind: SymbolKind.Function,
					file: relative(this.projectRoot, filePath),
					line: i + 1,
				});
			}
		}

		return symbols;
	}

	/**
	 * Extract interface declarations
	 */
	private extractInterfaces(content: string, filePath: string): SymbolInfo[] {
		const symbols: SymbolInfo[] = [];
		const lines = content.split('\n');
		const interfaceRegex = /^interface\s+(\w+)/;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) continue;
			const match = line.match(interfaceRegex);
			if (match && match[1]) {
				symbols.push({
					name: match[1],
					kind: SymbolKind.Interface,
					file: relative(this.projectRoot, filePath),
					line: i + 1,
				});
			}
		}

		return symbols;
	}

	/**
	 * Extract type declarations
	 */
	private extractTypes(content: string, filePath: string): SymbolInfo[] {
		const symbols: SymbolInfo[] = [];
		const lines = content.split('\n');
		const typeRegex = /^type\s+(\w+)/;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) continue;
			const match = line.match(typeRegex);
			if (match && match[1]) {
				symbols.push({
					name: match[1],
					kind: SymbolKind.TypeParameter,
					file: relative(this.projectRoot, filePath),
					line: i + 1,
				});
			}
		}

		return symbols;
	}
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Custom error for CodeSearch operations
 */
export class CodeSearchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CodeSearchError';
	}
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default glob patterns to ignore during search
 */
const DEFAULT_IGNORE_PATTERNS: string[] = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/.git/**',
	'**/coverage/**',
	'**/.next/**',
	'**/.cache/**',
	'**/*.min.js',
	'**/*.min.css',
	'**/package-lock.json',
	'**/yarn.lock',
	'**/pnpm-lock.yaml',
	'**/.DS_Store',
];

// ============================================================================
// EXPORTS
// ============================================================================

export default CodeSearchWorker;
