/**
 * Obsidian Search
 *
 * Search functionality for Obsidian vaults including content search,
 * tag search, and link search.
 *
 * @module obsidian/obsidian-search
 */

import fs from 'fs-extra';
import path from 'path';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface SearchResult {
	file: string;
	title: string;
	matches: Match[];
	frontmatter: Frontmatter | null;
}

export interface Match {
	line: number;
	column: number;
	text: string;
	context: string;
}

export interface Frontmatter {
	tags?: string[];
	[key: string]: string | number | boolean | string[] | undefined;
}

export interface TagSearchResult {
	file: string;
	tags: string[];
	title: string;
}

export interface LinkSearchResult {
	file: string;
	title: string;
	links: Link[];
}

export interface Link {
	target: string;
	type: 'internal' | 'external' | 'wiki';
	line: number;
	text: string;
}

// ----------------------------------------------------------------------------
// Regex Patterns
// ----------------------------------------------------------------------------

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const TAG_PATTERN = /#[a-zA-Z0-9_/-]+/g;
const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---/;

// ----------------------------------------------------------------------------
// Search Functions
// ----------------------------------------------------------------------------

/**
 * Search for content within a vault
 */
export async function searchVault(
	vaultPath: string,
	query: string,
	options: SearchOptions = {},
): Promise<SearchResult[]> {
	const {
		caseSensitive = false,
		wholeWord = false,
		regex = false,
		maxResults = 100,
	} = options;

	const results: SearchResult[] = [];
	const files = await getAllMarkdownFiles(vaultPath);

	let searchPattern: RegExp;

	if (regex) {
		searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
	} else {
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
		searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
	}

	for (const file of files) {
		if (results.length >= maxResults) break;

		try {
			const content = await fs.readFile(file, 'utf-8');
			const matches = findMatches(content, searchPattern);

			if (matches.length > 0) {
				const frontmatter = parseFrontmatter(content);
				const title = extractTitle(content, file);

				results.push({
					file,
					title,
					matches,
					frontmatter,
				});
			}
		} catch (error) {
			console.warn(`Failed to search file ${file}:`, error);
		}
	}

	return results;
}

/**
 * Search for files containing specific tags
 */
export async function searchByTag(
	vaultPath: string,
	tagQuery: string,
	options: TagSearchOptions = {},
): Promise<TagSearchResult[]> {
	const {includeFrontmatter = true, maxResults = 100} = options;
	const results: TagSearchResult[] = [];
	const files = await getAllMarkdownFiles(vaultPath);

	// Normalize tag query (remove leading # if present)
	const normalizedQuery = tagQuery.startsWith('#')
		? tagQuery.slice(1)
		: tagQuery;

	for (const file of files) {
		if (results.length >= maxResults) break;

		try {
			const content = await fs.readFile(file, 'utf-8');
			const foundTags: string[] = [];

			// Search in frontmatter tags
			if (includeFrontmatter) {
				const frontmatter = parseFrontmatter(content);
				if (frontmatter?.tags) {
					const tags = Array.isArray(frontmatter.tags)
						? frontmatter.tags
						: [frontmatter.tags];

					for (const tag of tags) {
						const tagStr = String(tag).replace(/^#/, '');
						if (tagMatchesQuery(tagStr, normalizedQuery)) {
							foundTags.push(tagStr);
						}
					}
				}
			}

			// Search inline tags
			const inlineMatches = content.match(TAG_PATTERN);
			if (inlineMatches) {
				for (const match of inlineMatches) {
					const tagStr = match.replace(/^#/, '');
					if (
						tagMatchesQuery(tagStr, normalizedQuery) &&
						!foundTags.includes(tagStr)
					) {
						foundTags.push(tagStr);
					}
				}
			}

			if (foundTags.length > 0) {
				const title = extractTitle(content, file);
				results.push({
					file,
					tags: foundTags,
					title,
				});
			}
		} catch (error) {
			console.warn(`Failed to search tags in ${file}:`, error);
		}
	}

	return results;
}

/**
 * Search for files that link to a specific note
 */
export async function searchByLink(
	vaultPath: string,
	targetNote: string,
	options: LinkSearchOptions = {},
): Promise<LinkSearchResult[]> {
	const {includeExternal = true, maxResults = 100} = options;
	const results: LinkSearchResult[] = [];
	const files = await getAllMarkdownFiles(vaultPath);

	// Normalize target note name
	const normalizedTarget = targetNote.replace(/\.md$/, '').toLowerCase();

	for (const file of files) {
		if (results.length >= maxResults) break;

		try {
			const content = await fs.readFile(file, 'utf-8');
			const links: Link[] = [];

			// Find wiki links [[Note]]
			let match: RegExpExecArray | null;
			WIKI_LINK_PATTERN.lastIndex = 0;

			while ((match = WIKI_LINK_PATTERN.exec(content)) !== null) {
				if (match[1] !== undefined) {
					const parts = match[1].split('|');
					if (parts[0] !== undefined) {
						const linkTarget = parts[0].replace(/\.md$/, '').toLowerCase();

						if (
							linkTarget === normalizedTarget ||
							linkTarget.includes(normalizedTarget)
						) {
							const lineNumber = content
								.substring(0, match.index ?? 0)
								.split('\n').length;
							links.push({
								target: match[1],
								type: 'wiki',
								line: lineNumber,
								text: match[0] ?? '',
							});
						}
					}
				}
			}

			// Find markdown links [text](note.md)
			if (includeExternal) {
				MARKDOWN_LINK_PATTERN.lastIndex = 0;

				while ((match = MARKDOWN_LINK_PATTERN.exec(content)) !== null) {
					if (match[2] !== undefined) {
						const linkTarget = match[2].replace(/\.md$/, '').toLowerCase();

						if (
							linkTarget === normalizedTarget ||
							linkTarget.includes(normalizedTarget)
						) {
							const lineNumber = content
								.substring(0, match.index ?? 0)
								.split('\n').length;
							links.push({
								target: match[2],
								type: 'external',
								line: lineNumber,
								text: match[0] ?? '',
							});
						}
					}
				}
			}

			if (links.length > 0) {
				const title = extractTitle(content, file);
				results.push({
					file,
					title,
					links,
				});
			}
		} catch (error) {
			console.warn(`Failed to search links in ${file}:`, error);
		}
	}

	return results;
}

/**
 * Get all files that link to the given file (backlinks)
 */
export async function getBacklinks(
	vaultPath: string,
	targetFile: string,
): Promise<LinkSearchResult[]> {
	const fileName = path.basename(targetFile, '.md');
	return searchByLink(vaultPath, fileName);
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

interface SearchOptions {
	caseSensitive?: boolean;
	wholeWord?: boolean;
	regex?: boolean;
	maxResults?: number;
}

interface TagSearchOptions {
	includeFrontmatter?: boolean;
	maxResults?: number;
}

interface LinkSearchOptions {
	includeExternal?: boolean;
	maxResults?: number;
}

/**
 * Get all markdown files in a directory recursively
 */
async function getAllMarkdownFiles(dirPath: string): Promise<string[]> {
	const files: string[] = [];

	async function walk(currentPath: string): Promise<void> {
		try {
			const entries = await fs.readdir(currentPath, {withFileTypes: true});

			for (const entry of entries) {
				const fullPath = path.join(currentPath, entry.name);

				if (entry.isDirectory()) {
					if (!entry.name.startsWith('.')) {
						await walk(fullPath);
					}
				} else if (entry.isFile() && isMarkdownFile(entry.name)) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			console.warn(`Failed to read directory ${currentPath}:`, error);
		}
	}

	await walk(dirPath);
	return files;
}

/**
 * Check if a file is a markdown file
 */
function isMarkdownFile(filename: string): boolean {
	const ext = path.extname(filename).toLowerCase();
	return ['.md', '.markdown', '.mdown', '.mkd', '.mkdn'].includes(ext);
}

/**
 * Find all matches of a pattern in text
 */
function findMatches(content: string, pattern: RegExp): Match[] {
	const matches: Match[] = [];
	const lines = content.split('\n');

	pattern.lastIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		let match: RegExpExecArray | null;

		// Reset pattern for each line
		pattern.lastIndex = 0;

		while ((match = pattern.exec(line ?? '')) !== null) {
			if (match.index !== undefined && match[0] !== undefined) {
				matches.push({
					line: i + 1,
					column: match.index + 1,
					text: match[0],
					context: getContext(lines, i, match.index),
				});
			}
		}
	}

	return matches;
}

/**
 * Get context around a match
 */
function getContext(
	lines: string[],
	lineIndex: number,
	columnIndex: number,
): string {
	const contextLines = 2;
	const start = Math.max(0, lineIndex - contextLines);
	const end = Math.min(lines.length, lineIndex + contextLines + 1);

	return lines
		.slice(start, end)
		.map((l, i) => {
			const actualLine = start + i;
			if (actualLine === lineIndex) {
				// Add indicator for match position
				const prefix = l.substring(0, columnIndex);
				const match = l.substring(columnIndex, columnIndex + 10);
				const suffix = l.substring(columnIndex + 10);
				return `${prefix}>>>${match}<<<${suffix}`;
			}
			return l;
		})
		.join('\n');
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): Frontmatter | null {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match || match[1] === undefined) {
		return null;
	}

	const frontmatter: Frontmatter = {};
	const lines = match[1].split('\n');

	for (const line of lines) {
		const colonIndex = line.indexOf(':');
		if (colonIndex > 0) {
			const key = line.slice(0, colonIndex).trim();
			const valueStr = line.slice(colonIndex + 1).trim();

			// Handle different value types
			if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
				// Array
				frontmatter[key] = valueStr
					.slice(1, -1)
					.split(',')
					.map(v => v.trim().replace(/^['"]|['"]$/g, ''));
			} else if (valueStr === 'true') {
				frontmatter[key] = true;
			} else if (valueStr === 'false') {
				frontmatter[key] = false;
			} else if (!isNaN(Number(valueStr))) {
				frontmatter[key] = Number(valueStr);
			} else {
				// Remove quotes if present
				frontmatter[key] = valueStr.replace(/^['"]|['"]$/g, '');
			}
		}
	}

	return frontmatter;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string, filePath: string): string {
	// Try to get from frontmatter first
	const frontmatter = parseFrontmatter(content);
	if (frontmatter?.['title'] && typeof frontmatter['title'] === 'string') {
		return frontmatter['title'];
	}

	// Try first heading
	const headingMatch = content.match(/^#\s+(.+)$/m);
	if (headingMatch && headingMatch[1] !== undefined) {
		return headingMatch[1].trim();
	}

	// Fall back to filename
	return path.basename(filePath, '.md');
}

/**
 * Check if a tag matches the query (supports subtag matching)
 */
function tagMatchesQuery(tag: string, query: string): boolean {
	const tagLower = tag.toLowerCase();
	const queryLower = query.toLowerCase();

	// Exact match
	if (tagLower === queryLower) {
		return true;
	}

	// Subtag match (e.g., "work/project" matches "work")
	if (tagLower.startsWith(queryLower + '/')) {
		return true;
	}

	// Parent tag match (e.g., "work" matches "work/project")
	if (queryLower.startsWith(tagLower + '/')) {
		return true;
	}

	return false;
}
