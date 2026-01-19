/**
 * Markdown Editor Utilities
 *
 * Utilities for creating, updating, and parsing markdown notes
 * with proper YAML frontmatter handling.
 *
 * @module obsidian/md-editor
 */

import fs from 'fs-extra';
import path from 'path';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface NoteMetadata {
	title?: string;
	tags?: string[];
	created?: Date;
	modified?: Date;
	[key: string]: any;
}

export interface Note {
	path: string;
	content: string;
	frontmatter: NoteMetadata;
}

export interface NoteOptions {
	ensureDir?: boolean;
	overwrite?: boolean;
	normalizeTags?: boolean;
}

export interface ParsedNote {
	content: string; // Content without frontmatter
	frontmatter: NoteMetadata;
	rawFrontmatter: string;
	hasFrontmatter: boolean;
}

// ----------------------------------------------------------------------------
// Frontmatter Constants
// ----------------------------------------------------------------------------

const FRONTMATTER_DELIMITER = '---';

// ----------------------------------------------------------------------------
// Note Creation
// ----------------------------------------------------------------------------

/**
 * Create a new note with frontmatter
 */
export async function createNote(
	filePath: string,
	content: string,
	metadata?: NoteMetadata,
	options: NoteOptions = {},
): Promise<string> {
	const {ensureDir = true, overwrite = false, normalizeTags = true} = options;

	// Check if file exists
	const exists = await fs.pathExists(filePath);
	if (exists && !overwrite) {
		throw new Error(`File already exists: ${filePath}`);
	}

	// Ensure directory exists
	if (ensureDir) {
		await fs.ensureDir(path.dirname(filePath));
	}

	// Normalize tags
	if (metadata?.tags && normalizeTags) {
		metadata.tags = normalizeTagArray(metadata.tags);
	}

	// Generate frontmatter
	const frontmatter = generateFrontmatter(metadata);

	// Combine frontmatter and content
	let fullContent = content;
	if (frontmatter) {
		fullContent = `${FRONTMATTER_DELIMITER}\n${frontmatter}${FRONTMATTER_DELIMITER}\n\n${content}`;
	}

	// Write file
	await fs.writeFile(filePath, fullContent, 'utf-8');

	return filePath;
}

/**
 * Create a quick daily note
 */
export async function createDailyNote(
	vaultPath: string,
	date: Date = new Date(),
	content?: string,
	options?: NoteOptions,
): Promise<string> {
	const dailyNotesPath = path.join(vaultPath, 'Daily Notes');
	const fileName = formatDateNote(date);
	const filePath = path.join(dailyNotesPath, `${fileName}.md`);

	const metadata: NoteMetadata = {
		title: fileName,
		tags: ['daily-note'],
		created: date,
		date: date.toISOString().split('T')[0],
	};

	return createNote(filePath, content ?? '', metadata, {
		...options,
		ensureDir: true,
	});
}

/**
 * Create a quick note in a specific folder
 */
export async function createQuickNote(
	vaultPath: string,
	title: string,
	content?: string,
	folder?: string,
	options?: NoteOptions,
): Promise<string> {
	const notesPath = folder ? path.join(vaultPath, folder) : vaultPath;
	const fileName = sanitizeFileName(title);
	const filePath = path.join(notesPath, `${fileName}.md`);

	const metadata: NoteMetadata = {
		title,
		created: new Date(),
	};

	return createNote(filePath, content ?? '', metadata, {
		...options,
		ensureDir: true,
	});
}

// ----------------------------------------------------------------------------
// Note Updates
// ----------------------------------------------------------------------------

/**
 * Update an existing note's content while preserving frontmatter
 */
export async function updateNote(
	filePath: string,
	newContent: string,
	options: UpdateNoteOptions = {},
): Promise<void> {
	const {
		preserveFrontmatter = true,
		appendTags = [],
		removeTags = [],
		updateMetadata,
	} = options;

	if (!(await fs.pathExists(filePath))) {
		throw new Error(`File not found: ${filePath}`);
	}

	const existingContent = await fs.readFile(filePath, 'utf-8');
	const parsed = parseNote(existingContent);

	// Update metadata if provided
	if (updateMetadata) {
		Object.assign(parsed.frontmatter, updateMetadata);
	}

	// Handle tag modifications
	if (appendTags.length > 0 || removeTags.length > 0) {
		parsed.frontmatter.tags = parsed.frontmatter.tags || [];

		// Remove tags
		for (const tag of removeTags) {
			const normalizedTag = normalizeTag(tag);
			parsed.frontmatter.tags = (parsed.frontmatter.tags as string[]).filter(
				t => normalizeTag(t) !== normalizedTag,
			);
		}

		// Append tags
		for (const tag of appendTags) {
			const normalizedTag = normalizeTag(tag);
			if (!(parsed.frontmatter.tags as string[]).includes(normalizedTag)) {
				(parsed.frontmatter.tags as string[]).push(normalizedTag);
			}
		}
	}

	// Update modified date
	parsed.frontmatter.modified = new Date();

	// Generate frontmatter
	const frontmatter = generateFrontmatter(parsed.frontmatter);

	// Combine and write
	let fullContent = newContent;
	if (preserveFrontmatter && frontmatter) {
		fullContent = `${FRONTMATTER_DELIMITER}\n${frontmatter}${FRONTMATTER_DELIMITER}\n\n${newContent}`;
	}

	await fs.writeFile(filePath, fullContent, 'utf-8');
}

/**
 * Append content to an existing note
 */
export async function appendToNote(
	filePath: string,
	contentToAppend: string,
	options: AppendNoteOptions = {},
): Promise<void> {
	const {separator = '\n\n', addTimestamp = false} = options;

	if (!(await fs.pathExists(filePath))) {
		throw new Error(`File not found: ${filePath}`);
	}

	const existingContent = await fs.readFile(filePath, 'utf-8');
	const parsed = parseNote(existingContent);

	let appendContent = contentToAppend;
	if (addTimestamp) {
		const timestamp = new Date().toISOString();
		appendContent = `<!-- ${timestamp} -->\n${contentToAppend}`;
	}

	const newContent = parsed.content + separator + appendContent;

	await updateNote(filePath, newContent, {
		preserveFrontmatter: true,
	});
}

/**
 * Prepend content to an existing note
 */
export async function prependToNote(
	filePath: string,
	contentToPrepend: string,
	options: PrependNoteOptions = {},
): Promise<void> {
	const {separator = '\n\n', addTimestamp = false} = options;

	if (!(await fs.pathExists(filePath))) {
		throw new Error(`File not found: ${filePath}`);
	}

	const existingContent = await fs.readFile(filePath, 'utf-8');
	const parsed = parseNote(existingContent);

	let prependContent = contentToPrepend;
	if (addTimestamp) {
		const timestamp = new Date().toISOString();
		prependContent = `${contentToPrepend}\n<!-- ${timestamp} -->`;
	}

	const newContent = prependContent + separator + parsed.content;

	await updateNote(filePath, newContent, {
		preserveFrontmatter: true,
	});
}

/**
 * Add or update a specific frontmatter property
 */
export async function updateFrontmatter(
	filePath: string,
	key: string,
	value: any,
): Promise<void> {
	if (!(await fs.pathExists(filePath))) {
		throw new Error(`File not found: ${filePath}`);
	}

	const existingContent = await fs.readFile(filePath, 'utf-8');
	const parsed = parseNote(existingContent);

	parsed.frontmatter[key] = value;

	const frontmatter = generateFrontmatter(parsed.frontmatter);
	const fullContent = frontmatter
		? `${FRONTMATTER_DELIMITER}\n${frontmatter}${FRONTMATTER_DELIMITER}\n\n${parsed.content}`
		: parsed.content;

	await fs.writeFile(filePath, fullContent, 'utf-8');
}

// ----------------------------------------------------------------------------
// Note Parsing
// ----------------------------------------------------------------------------

/**
 * Parse a note's content and frontmatter
 */
export function parseNote(content: string): ParsedNote {
	const trimmed = content.trim();
	const hasFrontmatter = trimmed.startsWith(FRONTMATTER_DELIMITER);

	if (!hasFrontmatter) {
		return {
			content: trimmed,
			frontmatter: {},
			rawFrontmatter: '',
			hasFrontmatter: false,
		};
	}

	// Find the end of the frontmatter
	const firstLineEnd = trimmed.indexOf('\n');
	const secondDelimiterStart = trimmed.indexOf(
		FRONTMATTER_DELIMITER,
		firstLineEnd + 1,
	);

	if (secondDelimiterStart === -1) {
		// Malformed frontmatter, treat as content
		return {
			content: trimmed,
			frontmatter: {},
			rawFrontmatter: '',
			hasFrontmatter: false,
		};
	}

	const rawFrontmatter = trimmed.slice(firstLineEnd + 1, secondDelimiterStart);
	const noteContent = trimmed
		.slice(secondDelimiterStart + FRONTMATTER_DELIMITER.length)
		.trim();

	return {
		content: noteContent,
		frontmatter: parseFrontmatter(rawFrontmatter),
		rawFrontmatter,
		hasFrontmatter: true,
	};
}

/**
 * Parse YAML frontmatter string into an object
 */
export function parseFrontmatter(frontmatterText: string): NoteMetadata {
	const metadata: NoteMetadata = {};

	for (const line of frontmatterText.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const colonIndex = trimmed.indexOf(':');
		if (colonIndex === -1) continue;

		const key = trimmed.slice(0, colonIndex).trim();
		const valueStr = trimmed.slice(colonIndex + 1).trim();

		metadata[key] = parseYamlValue(valueStr);
	}

	return metadata;
}

/**
 * Read and parse a note file
 */
export async function readNote(filePath: string): Promise<Note> {
	const content = await fs.readFile(filePath, 'utf-8');
	const parsed = parseNote(content);

	return {
		path: filePath,
		content: parsed.content,
		frontmatter: parsed.frontmatter,
	};
}

/**
 * Extract all tags from a note (frontmatter and inline)
 */
export function extractTags(content: string): string[] {
	const tags = new Set<string>();
	const parsed = parseNote(content);

	// Frontmatter tags
	if (parsed.frontmatter.tags) {
		const tagArray = Array.isArray(parsed.frontmatter.tags)
			? parsed.frontmatter.tags
			: [parsed.frontmatter.tags];

		for (const tag of tagArray) {
			tags.add(normalizeTag(String(tag)));
		}
	}

	// Inline tags (#tag)
	const inlineTagPattern = /(?<!\w)#[a-zA-Z0-9_/-]+/g;
	const inlineMatches = content.match(inlineTagPattern);
	if (inlineMatches) {
		for (const match of inlineMatches) {
			tags.add(normalizeTag(match));
		}
	}

	return Array.from(tags);
}

/**
 * Extract all wiki links from a note
 */
export function extractLinks(content: string): string[] {
	const links: string[] = [];
	const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

	let match: RegExpExecArray | null;
	while ((match = wikiLinkPattern.exec(content)) !== null) {
		if (match[1] !== undefined) {
			const target = match[1].split('|')[0];
			if (target !== undefined) {
				links.push(target.trim());
			}
		}
	}

	return links;
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

interface UpdateNoteOptions {
	preserveFrontmatter?: boolean;
	appendTags?: string[];
	removeTags?: string[];
	updateMetadata?: NoteMetadata;
}

interface AppendNoteOptions {
	separator?: string;
	addTimestamp?: boolean;
}

interface PrependNoteOptions {
	separator?: string;
	addTimestamp?: boolean;
}

/**
 * Generate YAML frontmatter from metadata object
 */
function generateFrontmatter(metadata?: NoteMetadata): string {
	if (!metadata || Object.keys(metadata).length === 0) {
		return '';
	}

	const lines: string[] = [];

	for (const [key, value] of Object.entries(metadata)) {
		if (value === undefined || value === null) continue;

		if (Array.isArray(value)) {
			if (value.length === 0) continue;
			lines.push(`${key}:`);
			for (const item of value) {
				lines.push(`  - ${formatYamlValue(item)}`);
			}
		} else if (value instanceof Date) {
			lines.push(`${key}: ${value.toISOString()}`);
		} else if (typeof value === 'object') {
			lines.push(`${key}: ${JSON.stringify(value)}`);
		} else {
			lines.push(`${key}: ${formatYamlValue(value)}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format a value for YAML output
 */
function formatYamlValue(value: any): string {
	if (typeof value === 'string') {
		// Don't quote if it's a simple string
		if (/^[a-zA-Z0-9_/-]+$/.test(value)) {
			return value;
		}
		// Quote strings with spaces or special characters
		return `"${value.replace(/"/g, '\\"')}"`;
	}
	return String(value);
}

/**
 * Parse a YAML value string into appropriate type
 */
function parseYamlValue(valueStr: string): any {
	valueStr = valueStr.trim();

	// Array
	if (valueStr.startsWith('[')) {
		try {
			return JSON.parse(valueStr);
		} catch {
			return valueStr;
		}
	}

	// Boolean
	if (valueStr === 'true') return true;
	if (valueStr === 'false') return false;

	// Null
	if (valueStr === 'null' || valueStr === '~') return null;

	// Number
	if (/^-?\d+$/.test(valueStr)) return parseInt(valueStr, 10);
	if (/^-?\d+\.\d+$/.test(valueStr)) return parseFloat(valueStr);

	// Quoted string
	if (
		(valueStr.startsWith('"') && valueStr.endsWith('"')) ||
		(valueStr.startsWith("'") && valueStr.endsWith("'"))
	) {
		return valueStr.slice(1, -1);
	}

	return valueStr;
}

/**
 * Normalize a tag (remove # prefix, lowercase)
 */
function normalizeTag(tag: string): string {
	return tag.replace(/^#+/, '').toLowerCase();
}

/**
 * Normalize an array of tags
 */
function normalizeTagArray(tags: string[]): string[] {
	return tags.map(normalizeTag);
}

/**
 * Sanitize a filename (remove invalid characters)
 */
function sanitizeFileName(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, '')
		.replace(/\s+/g, '-')
		.trim();
}

/**
 * Format a date for use in a daily note filename
 */
function formatDateNote(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Format a date for use in a daily note title
 */
export function formatDateTitle(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	};
	return date.toLocaleDateString('en-US', options);
}

/**
 * Convert a note to plain text (remove frontmatter)
 */
export function noteToPlainText(content: string): string {
	const parsed = parseNote(content);
	return parsed.content;
}

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(filePath: string): boolean {
	const ext = path.extname(filePath).toLowerCase();
	return ['.md', '.markdown', '.mdown', '.mkd', '.mkdn'].includes(ext);
}
