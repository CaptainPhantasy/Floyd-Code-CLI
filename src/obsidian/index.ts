/**
 * Obsidian Integration Module
 *
 * Complete Obsidian vault integration for FLOYD CLI.
 * Provides utilities for vault management, search, and note editing.
 *
 * @module obsidian
 *
 * @example
 * ```ts
 * import {createVaultManager, searchVault, createNote} from './obsidian';
 *
 * // Manage vaults
 * const manager = await createVaultManager();
 * await manager.addVault('MyVault', '/path/to/vault');
 *
 * // Search content
 * const results = await searchVault('/path/to/vault', 'search term');
 *
 * // Create notes
 * await createNote('/path/to/vault/note.md', 'Content', {tags: ['test']});
 * ```
 */

// ----------------------------------------------------------------------------
// Vault Manager
// ----------------------------------------------------------------------------

export {
	VaultManager,
	createVaultManager,
	listVaults,
	selectVault,
	createVault,
	getVaultPath,
} from './vault-manager';

export type {VaultInfo, VaultConfig} from './vault-manager';

// ----------------------------------------------------------------------------
// Search
// ----------------------------------------------------------------------------

export {
	searchVault,
	searchByTag,
	searchByLink,
	getBacklinks,
	parseFrontmatter as parseFrontmatterFromSearch,
} from './obsidian-search';

export type {
	SearchResult,
	Match,
	TagSearchResult,
	LinkSearchResult,
	Link,
} from './obsidian-search';

// ----------------------------------------------------------------------------
// Markdown Editor
// ----------------------------------------------------------------------------

export {
	createNote,
	createDailyNote,
	createQuickNote,
	updateNote,
	appendToNote,
	prependToNote,
	updateFrontmatter,
	parseNote,
	parseFrontmatter,
	readNote,
	extractTags,
	extractLinks,
	noteToPlainText,
	isMarkdownFile,
	formatDateTitle,
} from './md-editor';

export type {Note, NoteMetadata, NoteOptions, ParsedNote} from './md-editor';

// ----------------------------------------------------------------------------
// Re-exports for convenience
// ----------------------------------------------------------------------------

// Frontmatter type (used across modules)
export type {Frontmatter} from './obsidian-search';
