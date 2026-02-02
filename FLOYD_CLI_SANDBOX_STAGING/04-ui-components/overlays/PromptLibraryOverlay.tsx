/**
 * Prompt Library Overlay
 *
 * Popup overlay for browsing and copying prompts from Obsidian vault.
 * Features:
 * - Browse prompts from Obsidian vault
 * - Search/filter prompts
 * - Markdown rendering with syntax highlighting
 * - Copy to clipboard functionality
 * - LLM-managed Obsidian integration
 *
 * Trigger: Ctrl+Shift+P (or configurable)
 */

import {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import TextInput from 'ink-text-input';
import {Frame} from '../crush/Frame.js';
import {MarkdownRenderer} from '../../rendering/markdown-renderer.js';
import {VaultManager} from '../../obsidian/vault-manager.js';
import {floydTheme, crushTheme, roleColors} from '../../theme/crush-theme.js';
import fuzzysort from 'fuzzysort';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// ============================================================================
// TYPES
// ============================================================================

export interface PromptNote {
	/** File path relative to vault root */
	path: string;

	/** Full file path */
	fullPath: string;

	/** Note title (from filename or frontmatter) */
	title: string;

	/** Markdown content */
	content: string;

	/** Frontmatter metadata */
	frontmatter?: Record<string, unknown>;

	/** Tags extracted from content */
	tags: string[];

	/** Last modified date */
	modified: Date;
}

export interface PromptLibraryOverlayProps {
	/** Obsidian vault path (optional, will auto-detect if not provided) */
	vaultPath?: string;

	/** Callback when prompt is selected/copied */
	onSelect?: (prompt: PromptNote) => void;

	/** Callback when overlay is closed */
	onClose: () => void;

	/** Custom title */
	title?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): {
	frontmatter?: Record<string, unknown>;
	body: string;
} {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = content.match(frontmatterRegex);

	if (match) {
		try {
			const frontmatter = match[1]
				.split('\n')
				.reduce((acc, line) => {
					const colonIndex = line.indexOf(':');
					if (colonIndex > 0) {
						const key = line.slice(0, colonIndex).trim();
						const value = line.slice(colonIndex + 1).trim();
						acc[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
					}
					return acc;
				}, {} as Record<string, unknown>);

			return {
				frontmatter,
				body: content.slice(match[0].length),
			};
		} catch {
			// Invalid frontmatter, return as-is
		}
	}

	return {body: content};
}

/**
 * Extract tags from markdown content
 */
function extractTags(content: string): string[] {
	const tagRegex = /#([\w-]+)/g;
	const matches = content.match(tagRegex) || [];
	return matches.map(tag => tag.slice(1));
}

/**
 * Extract title from filename or frontmatter
 */
function extractTitle(
	filePath: string,
	frontmatter?: Record<string, unknown>,
): string {
	// Try frontmatter first
	if (frontmatter?.title && typeof frontmatter.title === 'string') {
		return frontmatter.title;
	}

	// Use filename without extension
	const basename = path.basename(filePath, path.extname(filePath));
	return basename;
}

/**
 * Load prompt notes from Obsidian vault
 */
async function loadPromptNotes(vaultPath: string): Promise<PromptNote[]> {
	const notes: PromptNote[] = [];

		try {
			// Try to get files via vault manager first
			let files: string[] = [];
			try {
				const vaultManager = new VaultManager();
				await vaultManager.initialize();
				const vaultName = path.basename(vaultPath);
				const markdownFiles = await vaultManager.getVaultNotes(vaultName);
				files = markdownFiles.length > 0 ? markdownFiles : [];
			} catch {
				// Vault not registered, continue with direct path
			}

			// If no files from vault manager, scan directly
			if (files.length === 0) {
				files = await getAllMarkdownFiles(vaultPath);
			}

		// Load each file
		for (const filePath of files) {
			try {
				const fullPath = path.isAbsolute(filePath)
					? filePath
					: path.join(vaultPath, filePath);
				const content = await fs.readFile(fullPath, 'utf-8');
				const {frontmatter, body} = extractFrontmatter(content);
				const tags = extractTags(body);
				const stats = await fs.stat(fullPath);

				notes.push({
					path: path.relative(vaultPath, fullPath),
					fullPath,
					title: extractTitle(filePath, frontmatter),
					content: body,
					frontmatter,
					tags,
					modified: stats.mtime,
				});
			} catch (error) {
				console.warn(`Failed to load note ${filePath}:`, error);
			}
		}
	} catch (error) {
		console.error('Failed to load prompt notes:', error);
	}

	// Sort by modified date (newest first)
	return notes.sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

/**
 * Get all markdown files recursively
 */
async function getAllMarkdownFiles(dirPath: string): Promise<string[]> {
	const files: string[] = [];

	async function walk(currentPath: string) {
		try {
			const entries = await fs.readdir(currentPath, {withFileTypes: true});

			for (const entry of entries) {
				const fullPath = path.join(currentPath, entry.name);

				// Skip .obsidian directory
				if (entry.name === '.obsidian') continue;

				if (entry.isDirectory()) {
					await walk(fullPath);
				} else if (
					entry.isFile() &&
					['.md', '.markdown'].includes(path.extname(entry.name))
				) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			console.warn(`Failed to walk directory ${currentPath}:`, error);
		}
	}

	await walk(dirPath);
	return files;
}

/**
 * Copy text to clipboard (cross-platform)
 */
async function copyToClipboard(text: string): Promise<boolean> {
	try {
		const {spawn} = await import('child_process');
		const platform = process.platform;

		if (platform === 'darwin') {
			const proc = spawn('pbcopy', []);
			proc.stdin.write(text);
			proc.stdin.end();
			return new Promise(resolve => {
				proc.on('close', () => resolve(true));
				proc.on('error', () => resolve(false));
			});
		} else if (platform === 'linux') {
			const proc = spawn('xclip', ['-selection', 'clipboard']);
			proc.stdin.write(text);
			proc.stdin.end();
			return new Promise(resolve => {
				proc.on('close', () => resolve(true));
				proc.on('error', () => resolve(false));
			});
		} else if (platform === 'win32') {
			const proc = spawn('clip', []);
			proc.stdin.write(text);
			proc.stdin.end();
			return new Promise(resolve => {
				proc.on('close', () => resolve(true));
				proc.on('error', () => resolve(false));
			});
		}

		return false;
	} catch {
		// Fallback: write to stdout (user can manually copy)
		return false;
	}
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Prompt Library Overlay - Browse and copy prompts from Obsidian
 */
export function PromptLibraryOverlay({
	vaultPath,
	onSelect,
	onClose,
	title = ' PROMPT LIBRARY ',
}: PromptLibraryOverlayProps) {
	const [prompts, setPrompts] = useState<PromptNote[]>([]);
	const [filteredPrompts, setFilteredPrompts] = useState<PromptNote[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedPrompt, setSelectedPrompt] = useState<PromptNote | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const {stdout} = useStdout();

	// Load prompts from vault
	const loadPrompts = useCallback(async (vault: string) => {
		setLoading(true);
		setError(null);
		try {
			const loadedPrompts = await loadPromptNotes(vault);
			setPrompts(loadedPrompts);
			setFilteredPrompts(loadedPrompts);
			if (loadedPrompts.length > 0) {
				setSelectedPrompt(loadedPrompts[0]);
			}
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: 'Failed to load prompts from vault',
			);
		} finally {
			setLoading(false);
		}
	}, []);

	// Detect vault path if not provided
	useEffect(() => {
		async function detectVault() {
			if (vaultPath) {
				await loadPrompts(vaultPath);
				return;
			}

			// Try to find Obsidian vault
			try {
				const vaultManager = new VaultManager();
				await vaultManager.initialize();
				const vaults = await vaultManager.listVaults();

				if (vaults.length > 0) {
					// Use the most recently modified vault
					await loadPrompts(vaults[0].path);
					return;
				}
			} catch {
				// VaultManager failed, continue to manual detection
			}

			// Try common Obsidian locations
			const homeDir = process.env.HOME || os.homedir();
			const commonPaths = [
				path.join(homeDir, 'Documents', 'Obsidian'),
				path.join(homeDir, 'Obsidian'),
				path.join(
					homeDir,
					'Library',
					'CloudStorage',
					'OneDrive-Personal',
					'Obsidian',
				),
			];

			for (const commonPath of commonPaths) {
				try {
					if (await fs.pathExists(commonPath)) {
						// Find first vault directory
						const entries = await fs.readdir(commonPath, {
							withFileTypes: true,
						});
						for (const entry of entries) {
							if (entry.isDirectory()) {
								const vaultDir = path.join(commonPath, entry.name);
								const obsidianConfig = path.join(vaultDir, '.obsidian');
								if (await fs.pathExists(obsidianConfig)) {
									await loadPrompts(vaultDir);
									return;
								}
							}
						}
					}
				} catch {
					// Continue to next path
					continue;
				}
			}

			setError('No Obsidian vault found. Please specify vaultPath prop.');
			setLoading(false);
		}

		void detectVault();
	}, [vaultPath, loadPrompts]);

	// Filter prompts based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredPrompts(prompts);
			setSelectedIndex(0);
			if (prompts.length > 0) {
				setSelectedPrompt(prompts[0]);
			}
			return;
		}

		// Fuzzy search
		try {
			const results = fuzzysort.go(searchQuery, prompts, {
				keys: ['title', 'content', 'tags'],
				threshold: -10000,
			});

			const filtered = results.map(r => r.obj);
			setFilteredPrompts(filtered);
			setSelectedIndex(0);
			if (filtered.length > 0) {
				setSelectedPrompt(filtered[0]);
			} else {
				setSelectedPrompt(null);
			}
		} catch {
			// Fallback to simple filter
			const filtered = prompts.filter(
				p =>
					p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())),
			);
			setFilteredPrompts(filtered);
			setSelectedIndex(0);
			if (filtered.length > 0) {
				setSelectedPrompt(filtered[0]);
			} else {
				setSelectedPrompt(null);
			}
		}
	}, [searchQuery, prompts]);

	// Handle keyboard input
	useInput(
		(input, key) => {
			// Ctrl+Q - Quit the entire CLI immediately
			if (key.ctrl && (input === 'q' || input === 'Q')) {
				process.exit(0);
			}

			if (key.escape) {
				onClose();
				return;
			}

			// Navigation
			if (key.upArrow) {
				setSelectedIndex(prev => {
					const newIndex = Math.max(0, prev - 1);
					if (filteredPrompts[newIndex]) {
						setSelectedPrompt(filteredPrompts[newIndex]);
					}
					return newIndex;
				});
				return;
			}

			if (key.downArrow) {
				setSelectedIndex(prev => {
					const newIndex = Math.min(prev + 1, filteredPrompts.length - 1);
					if (filteredPrompts[newIndex]) {
						setSelectedPrompt(filteredPrompts[newIndex]);
					}
					return newIndex;
				});
				return;
			}

			// Copy selected prompt
			if (key.return && selectedPrompt) {
				void handleCopy();
				return;
			}

			// Select prompt
			if (key.return && !selectedPrompt && filteredPrompts.length > 0) {
				setSelectedPrompt(filteredPrompts[selectedIndex]);
				return;
			}

			// Backspace in search
			if (key.backspace || key.delete) {
				setSearchQuery(prev => prev.slice(0, -1));
				return;
			}

			// Typing adds to search (only if not a special key)
			if (
				input.length > 0 &&
				!key.ctrl &&
				!key.meta &&
				!key.return &&
				!key.tab
			) {
				setSearchQuery(prev => prev + input);
			}
		},
		{isActive: true},
	);

	// Handle copy to clipboard
	const handleCopy = useCallback(async () => {
		if (!selectedPrompt) return;

		const success = await copyToClipboard(selectedPrompt.content);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			onSelect?.(selectedPrompt);
		} else {
			// Fallback: show in terminal
			console.log('\n--- Prompt Content ---\n');
			console.log(selectedPrompt.content);
			console.log('\n--- End Prompt ---\n');
		}
	}, [selectedPrompt, onSelect]);

	const maxHeight = stdout.rows - 10;
	const maxWidth = Math.min(stdout.columns - 4, 100);

	return (
		<Frame
			title={title}
			borderStyle="round"
			borderVariant="focus"
			padding={1}
			width={maxWidth}
			height={maxHeight}
		>
			<Box flexDirection="column" height="100%" gap={1}>
				{/* Search Bar */}
				<Box flexDirection="row" gap={1}>
					<Text color={roleColors.inputPrompt}>Search:</Text>
					<Box flexGrow={1}>
						<TextInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder="Type to search prompts..."
						/>
					</Box>
					{copied && (
						<Text color={crushTheme.status.ready}>✓ Copied!</Text>
					)}
				</Box>

				{/* Loading State */}
				{loading && (
					<Box>
						<Text color={roleColors.thinking}>Loading prompts from vault...</Text>
					</Box>
				)}

				{/* Error State */}
				{error && (
					<Box>
						<Text color={crushTheme.status.error}>{error}</Text>
					</Box>
				)}

				{/* Main Content */}
				{!loading && !error && (
					<Box flexDirection="row" flexGrow={1} gap={1}>
						{/* Prompt List */}
						<Box
							flexDirection="column"
							width="40%"
							borderStyle="single"
							borderColor={floydTheme.colors.border}
							paddingX={1}
							flexGrow={1}
						>
							<Text bold color={crushTheme.accent.primary}>
								Prompts ({filteredPrompts.length})
							</Text>
							<Box flexDirection="column" marginTop={1} flexGrow={1}>
								{filteredPrompts.length === 0 ? (
									<Text color={floydTheme.colors.fgMuted} dimColor>
										No prompts found
									</Text>
								) : (
									filteredPrompts.slice(0, maxHeight - 10).map((prompt, idx) => (
										<Box
											key={prompt.fullPath}
											flexDirection="column"
											paddingX={1}
											paddingY={0}
											borderStyle={
												idx === selectedIndex ? 'round' : undefined
											}
											borderColor={
												idx === selectedIndex
													? crushTheme.accent.primary
													: undefined
											}
										>
											<Text
												color={
													idx === selectedIndex
														? crushTheme.accent.primary
														: floydTheme.colors.fgBase
												}
												bold={idx === selectedIndex}
											>
												{prompt.title}
											</Text>
											{prompt.tags.length > 0 && (
												<Text color={floydTheme.colors.fgSubtle} dimColor>
													{prompt.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
												</Text>
											)}
										</Box>
									))
								)}
							</Box>
						</Box>

						{/* Prompt Preview */}
						<Box
							flexDirection="column"
							width="60%"
							borderStyle="single"
							borderColor={floydTheme.colors.border}
							paddingX={1}
							flexGrow={1}
						>
							{selectedPrompt ? (
								<>
									<Box flexDirection="row" justifyContent="space-between">
										<Text bold color={crushTheme.accent.secondary}>
											{selectedPrompt.title}
										</Text>
										<Text color={floydTheme.colors.fgSubtle} dimColor>
											{selectedPrompt.path}
										</Text>
									</Box>
									<Box
										marginTop={1}
										flexGrow={1}
										overflowY="hidden"
										height={maxHeight - 8}
									>
										<MarkdownRenderer
											markdown={selectedPrompt.content}
											width={Math.floor(maxWidth * 0.55)}
											syntaxHighlight={true}
										/>
									</Box>
								</>
							) : (
								<Text color={floydTheme.colors.fgMuted} dimColor>
									Select a prompt to preview
								</Text>
							)}
						</Box>
					</Box>
				)}

				{/* Footer */}
				<Box flexDirection="row" justifyContent="space-between">
					<Text color={roleColors.hint} dimColor>
						[↑↓] Navigate • [Enter] Copy • [Esc] Close
					</Text>
					{selectedPrompt && (
						<Text color={roleColors.hint} dimColor>
							{selectedPrompt.content.length} chars
						</Text>
					)}
				</Box>
			</Box>
		</Frame>
	);
}

export default PromptLibraryOverlay;
