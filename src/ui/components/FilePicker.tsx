/**
 * FilePicker Component
 *
 * Interactive directory/file browser with keyboard navigation.
 * Features directory traversal, file selection, extension filtering,
 * file type icons, and breadcrumb path display.
 */

import {useState, useEffect, useMemo, useCallback, type ReactNode} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import {floydTheme} from '../../theme/crush-theme.js';
import * as fs from 'fs-extra';
import * as path from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

export type FileType = 'file' | 'directory' | 'symlink';

export interface FileEntry {
	/** File/directory name */
	name: string;

	/** Full path */
	fullPath: string;

	/** Node type */
	type: FileType;

	/** File extension (for files only) */
	extension?: string;

	/** File size in bytes */
	size?: number;

	/** Whether it's a hidden file */
	hidden?: boolean;
}

export interface FilePickerProps {
	/** Root directory path to browse */
	rootPath: string;

	/** Initial selected files */
	initialSelected?: string[];

	/** Allow multiple file selection */
	multiSelect?: boolean;

	/** Show hidden files (dotfiles) */
	showHidden?: boolean;

	/** Filter files by extension (e.g., ['ts', 'tsx']) */
	extensionFilter?: string[];

	/** Enable fuzzy search */
	enableSearch?: boolean;

	/** Callback when selection changes */
	onSelectionChange?: (selected: string[]) => void;

	/** Callback when file is confirmed */
	onConfirm?: (selected: string[]) => void;

	/** Callback when cancelled */
	onCancel?: () => void;

	/** Display width for truncation */
	width?: number;

	/** Compact mode */
	compact?: boolean;
}

// Compact file picker props - minimal variant
export interface CompactFilePickerProps {
	/** Initial directory path */
	initialPath?: string;

	/** Callback when file is selected */
	onSelect: (filePath: string) => void;

	/** Callback when cancelled */
	onCancel?: () => void;

	/** Filter files by extension */
	extensionFilter?: string[];

	/** Show hidden files */
	showHidden?: boolean;

	/** Display width */
	width?: number;

	/** Height (number of visible items) */
	height?: number;

	/** Allow directory selection */
	allowDirectories?: boolean;
}

// Export Props interface
export type Props = FilePickerProps;
export type CompactProps = CompactFilePickerProps;

// ============================================================================
// FILE ICONS
// ============================================================================

const FILE_ICONS: Record<string, {icon: string; color: string}> = {
	// Config files
	ts: {icon: '', color: '#00A4FF'},
	tsx: {icon: '', color: '#00A4FF'},
	js: {icon: '', color: '#E8FE96'},
	jsx: {icon: '', color: '#E8FE96'},
	mjs: {icon: '', color: '#E8FE96'},
	cjs: {icon: '', color: '#E8FE96'},

	// Styles
	css: {icon: '', color: '#00A4FF'},
	scss: {icon: '', color: '#FF60FF'},
	less: {icon: '', color: '#00A4FF'},
	sass: {icon: '', color: '#FF60FF'},

	// Markup
	html: {icon: '', color: '#E8FE96'},
	md: {icon: '', color: '#DFDBDD'},
	mdx: {icon: '', color: '#DFDBDD'},

	// Data
	json: {icon: '{}', color: '#E8FE96'},
	yaml: {icon: '{}', color: '#E8FE96'},
	yml: {icon: '{}', color: '#E8FE96'},
	toml: {icon: '{}', color: '#E8FE96'},
	xml: {icon: '<>', color: '#E8FE96'},

	// Assets
	png: {icon: '', color: '#FF60FF'},
	jpg: {icon: '', color: '#FF60FF'},
	jpeg: {icon: '', color: '#FF60FF'},
	gif: {icon: '', color: '#FF60FF'},
	svg: {icon: '', color: '#FF60FF'},
	ico: {icon: '', color: '#FF60FF'},
	webp: {icon: '', color: '#FF60FF'},

	// Other
	git: {icon: '', color: '#EB4268'},
	env: {icon: '', color: '#E8FE96'},
	lock: {icon: '', color: '#858392'},
	ds_store: {icon: '', color: '#858392'},
};

const DIR_ICON = {icon: '', color: '#FF60FF'};
const PARENT_DIR_ICON = {icon: '..', color: '#68FFD6'};
const SYMLINK_ICON = {icon: '', color: '#00A4FF'};
const DEFAULT_FILE_ICON = {icon: '', color: '#858392'};

/**
 * Get icon for file based on extension
 */
function getFileIcon(
	fileName: string,
	fileType: FileType,
	isParent: boolean = false,
): {icon: string; color: string} {
	if (isParent) {
		return PARENT_DIR_ICON;
	}
	if (fileType === 'directory') {
		return DIR_ICON;
	}
	if (fileType === 'symlink') {
		return SYMLINK_ICON;
	}

	const ext = fileName.split('.').pop()?.toLowerCase();
	if (ext && FILE_ICONS[ext]) {
		return FILE_ICONS[ext];
	}

	return DEFAULT_FILE_ICON;
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}

/**
 * Truncate path to fit width
 */
function truncatePath(filePath: string, maxWidth: number): string {
	if (filePath.length <= maxWidth) return filePath;
	return '...' + filePath.slice(-(maxWidth - 3));
}

/**
 * Create breadcrumb from path
 */
function createBreadcrumb(fullPath: string, maxWidth: number): string {
	const parts = fullPath.split(path.sep).filter(Boolean);
	if (parts.length === 0) return '/';

	let result = parts.join('/');
	if (result.length <= maxWidth) return result;

	// Start from the end and add parts until we hit the limit
	const resultParts: string[] = [];
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i];
		if (part === undefined) continue;
		resultParts.unshift(part);
		const test = '.../' + resultParts.join('/');
		if (test.length > maxWidth) {
			resultParts.shift();
			break;
		}
	}

	return resultParts.length > 0
		? '.../' + resultParts.join('/')
		: '.../' + parts[parts.length - 1];
}

/**
 * Read directory entries async
 */
async function readDirectoryEntries(
	dirPath: string,
	showHidden: boolean,
): Promise<FileEntry[]> {
	try {
		const entries = await fs.readdir(dirPath, {withFileTypes: true});
		const result: FileEntry[] = [];

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);
			const isHidden = entry.name.startsWith('.');

			if (!showHidden && isHidden) continue;

			let type: FileType = 'file';
			if (entry.isDirectory()) type = 'directory';
			else if (entry.isSymbolicLink()) type = 'symlink';

			const entryData: FileEntry = {
				name: entry.name,
				fullPath,
				type,
				hidden: isHidden,
			};

			// Get extension for files
			if (type === 'file') {
				const ext = entry.name.split('.').pop()?.toLowerCase();
				if (ext) entryData.extension = ext;

				// Get file size
				try {
					const stats = await fs.stat(fullPath);
					entryData.size = stats.size;
				} catch {
					// Ignore stat errors
				}
			}

			result.push(entryData);
		}

		// Sort: directories first, then alphabetically
		result.sort((a, b) => {
			if (a.type === 'directory' && b.type !== 'directory') return -1;
			if (a.type !== 'directory' && b.type === 'directory') return 1;
			return a.name.localeCompare(b.name);
		});

		return result;
	} catch {
		return [];
	}
}

// ============================================================================
// COMPONENT - FilePicker
// ============================================================================

/**
 * File item row component
 */
interface FileItemProps {
	entry: FileEntry;
	isFocused: boolean;
	isSelected: boolean;
	showSize: boolean;
	width: number;
	isParent: boolean;
}

function FileItem({
	entry,
	isFocused,
	isSelected,
	showSize,
	width,
	isParent,
}: FileItemProps) {
	const icon = getFileIcon(entry.name, entry.type, isParent);
	const displayName = truncatePath(entry.name, width - 6);

	// Selection indicator
	const indicator = isSelected ? 'x' : ' ';

	// Size display
	const sizeText =
		showSize && entry.size !== undefined ? ` ${formatSize(entry.size)}` : '';

	return (
		<Box key={entry.fullPath}>
			<Text
				backgroundColor={isFocused ? floydTheme.colors.bgSubtle : undefined}
				color={
					isFocused ? floydTheme.colors.fgSelected : floydTheme.colors.fgBase
				}
				bold={isFocused}
			>
				[{indicator}] <Text color={icon.color}>{icon.icon}</Text> {displayName}
				{sizeText}
			</Text>
		</Box>
	);
}

export function FilePicker({
	rootPath,
	initialSelected = [],
	multiSelect = true,
	showHidden = false,
	extensionFilter,
	enableSearch = true,
	onSelectionChange,
	onConfirm,
	onCancel,
	width = 60,
	compact = false,
}: FilePickerProps) {
	const {exit} = useApp();

	// State
	const [currentPath, setCurrentPath] = useState(rootPath);
	const [searchQuery, setSearchQuery] = useState('');
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [selectedPaths, setSelectedPaths] = useState<Set<string>>(
		new Set(initialSelected),
	);
	const [entries, setEntries] = useState<FileEntry[]>([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	// Load directory entries
	const loadEntries = useCallback(
		async (dirPath: string) => {
			const dirEntries = await readDirectoryEntries(dirPath, showHidden);
			setEntries(dirEntries);
			setFocusedIndex(0);
		},
		[showHidden],
	);

	// Initial load and when currentPath changes
	useEffect(() => {
		loadEntries(currentPath);
	}, [currentPath, loadEntries]);

	// Filter entries
	const filteredEntries = useMemo(() => {
		let result = entries;

		// Add parent directory entry if not at root
		if (currentPath !== path.parse(currentPath).root) {
			result = [
				{
					name: '..',
					fullPath: path.dirname(currentPath),
					type: 'directory',
				},
				...result,
			];
		}

		// Filter by extension
		if (extensionFilter) {
			result = result.filter(entry => {
				if (entry.type === 'directory') return true;
				if (entry.name === '..') return true;
				return entry.extension
					? extensionFilter.includes(entry.extension)
					: false;
			});
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(entry => entry.name.toLowerCase().includes(query));
		}

		return result;
	}, [entries, currentPath, extensionFilter, searchQuery]);

	// Update focused index when filtered results change
	useEffect(() => {
		if (focusedIndex >= filteredEntries.length) {
			setFocusedIndex(Math.max(0, filteredEntries.length - 1));
		}
	}, [filteredEntries.length, focusedIndex]);

	// Handle keyboard input
	useInput((input, key) => {
		if (isSearchFocused) {
			if (key.escape) {
				setIsSearchFocused(false);
				setSearchQuery('');
			}
			return;
		}

		// Search focus
		if (key.tab && !key.shift) {
			setIsSearchFocused(true);
			return;
		}

		if (key.escape || (key.ctrl && input === 'c')) {
			if (onCancel) {
				onCancel();
			} else {
				exit();
			}
			return;
		}

		if (key.ctrl && input === 'a') {
			// Select all visible files (not directories)
			setSelectedPaths(
				new Set(
					filteredEntries.filter(e => e.type === 'file').map(e => e.fullPath),
				),
			);
			return;
		}

		if (key.ctrl && input === 'd') {
			// Deselect all
			setSelectedPaths(new Set());
			return;
		}

		// Navigation
		if (key.upArrow) {
			setFocusedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setFocusedIndex(prev => Math.min(filteredEntries.length - 1, prev + 1));
		} else if (key.pageDown) {
			setFocusedIndex(prev => Math.min(filteredEntries.length - 1, prev + 10));
		} else if (key.pageUp) {
			setFocusedIndex(prev => Math.max(0, prev - 10));
		}

		// Enter key - handle navigation or selection
		if (key.return && filteredEntries.length > 0) {
			const focusedEntry = filteredEntries[focusedIndex];
			if (!focusedEntry) return;

			if (focusedEntry.type === 'directory') {
				// Navigate into directory
				setCurrentPath(focusedEntry.fullPath);
			} else if (onConfirm) {
				// Confirm file selection
				const finalSelection = multiSelect
					? Array.from(selectedPaths)
					: [focusedEntry.fullPath];
				onConfirm(finalSelection);
			}
			return;
		}

		// Space - toggle selection
		if (input === ' ' && filteredEntries.length > 0) {
			const focusedEntry = filteredEntries[focusedIndex];
			if (!focusedEntry || focusedEntry.type === 'directory') return;

			setSelectedPaths(prev => {
				const next = new Set(prev);
				if (multiSelect) {
					if (next.has(focusedEntry.fullPath)) {
						next.delete(focusedEntry.fullPath);
					} else {
						next.add(focusedEntry.fullPath);
					}
				} else {
					next.clear();
					next.add(focusedEntry.fullPath);
				}
				return next;
			});
		}
	});

	// Notify parent of selection changes
	useEffect(() => {
		onSelectionChange?.(Array.from(selectedPaths));
	}, [selectedPaths, onSelectionChange]);

	// Render file list
	const renderFileList = (): ReactNode => {
		if (filteredEntries.length === 0) {
			return (
				<Box paddingX={1}>
					<Text color={floydTheme.colors.fgMuted} dimColor>
						{searchQuery ? 'No matching files found' : 'Directory is empty'}
					</Text>
				</Box>
			);
		}

		return filteredEntries.map((entry, index) => (
			<FileItem
				key={entry.fullPath}
				entry={entry}
				isFocused={index === focusedIndex && !isSearchFocused}
				isSelected={selectedPaths.has(entry.fullPath)}
				showSize={!compact}
				width={width}
				isParent={entry.name === '..'}
			/>
		));
	};

	return (
		<Box flexDirection="column" width={width}>
			{/* Header with breadcrumb */}
			<Box
				borderStyle="single"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				paddingY={0}
				marginBottom={1}
			>
				<Text bold color={floydTheme.colors.fgSelected}>
					File Picker
				</Text>
				<Text color={floydTheme.colors.fgMuted} dimColor>
					{' '}
				</Text>
				<Text color={floydTheme.colors.tertiary}>
					{createBreadcrumb(currentPath, width - 15)}
				</Text>
			</Box>

			{/* Search bar */}
			{enableSearch && (
				<Box marginBottom={1} paddingX={1}>
					<Text
						color={
							isSearchFocused
								? floydTheme.colors.secondary
								: floydTheme.colors.fgMuted
						}
					>
						{isSearchFocused ? '' : 'Search: '}
					</Text>
					<TextInput
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Type to filter files..."
						onSubmit={() => setIsSearchFocused(false)}
						focus={isSearchFocused}
					/>
				</Box>
			)}

			{/* File list */}
			<Box
				flexDirection="column"
				borderStyle={isSearchFocused ? 'classic' : 'single'}
				borderColor={
					isSearchFocused
						? floydTheme.colors.border
						: floydTheme.colors.borderFocus
				}
				paddingY={0}
			>
				{renderFileList()}
			</Box>

			{/* Footer hints */}
			<Box marginTop={1}>
				<Text color={floydTheme.colors.fgMuted} dimColor>
					arrows: navigate | space: select | enter: open/confirm | tab: search |
					esc: cancel
				</Text>
			</Box>

			{/* Selection count */}
			{multiSelect && selectedPaths.size > 0 && (
				<Box>
					<Text color={floydTheme.colors.tertiary}>
						{selectedPaths.size} file{selectedPaths.size > 1 ? 's' : ''}{' '}
						selected
					</Text>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// COMPONENT - CompactFilePicker
// ============================================================================

/**
 * CompactFilePicker - Minimal file picker variant
 *
 * Simplified file picker with:
 * - Single file selection only
 * - No search
 * - Minimal UI footprint
 * - Directory traversal with arrow keys
 * - Enter to select
 */
export function CompactFilePicker({
	initialPath = process.cwd(),
	onSelect,
	onCancel,
	extensionFilter,
	showHidden = false,
	width = 50,
	height = 10,
	allowDirectories = false,
}: CompactFilePickerProps) {
	const {exit} = useApp();

	// State
	const [currentPath, setCurrentPath] = useState(initialPath);
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [entries, setEntries] = useState<FileEntry[]>([]);

	// Load directory entries
	const loadEntries = useCallback(
		async (dirPath: string) => {
			const dirEntries = await readDirectoryEntries(dirPath, showHidden);
			setEntries(dirEntries);
			setFocusedIndex(0);
		},
		[showHidden],
	);

	// Initial load and when currentPath changes
	useEffect(() => {
		loadEntries(currentPath);
	}, [currentPath, loadEntries]);

	// Filter entries
	const filteredEntries = useMemo(() => {
		let result = entries;

		// Add parent directory entry if not at root
		if (currentPath !== path.parse(currentPath).root) {
			result = [
				{
					name: '..',
					fullPath: path.dirname(currentPath),
					type: 'directory',
				},
				...result,
			];
		}

		// Filter by extension
		if (extensionFilter) {
			result = result.filter(entry => {
				if (entry.type === 'directory') return true;
				if (entry.name === '..') return true;
				return entry.extension
					? extensionFilter.includes(entry.extension)
					: false;
			});
		}

		return result;
	}, [entries, currentPath, extensionFilter]);

	// Update focused index when filtered results change
	useEffect(() => {
		if (focusedIndex >= filteredEntries.length) {
			setFocusedIndex(Math.max(0, filteredEntries.length - 1));
		}
	}, [filteredEntries.length, focusedIndex]);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape || (key.ctrl && input === 'c')) {
			if (onCancel) {
				onCancel();
			} else {
				exit();
			}
			return;
		}

		// Navigation
		if (key.upArrow) {
			setFocusedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setFocusedIndex(prev => Math.min(filteredEntries.length - 1, prev + 1));
		}

		// Enter key - handle navigation or selection
		if (key.return && filteredEntries.length > 0) {
			const focusedEntry = filteredEntries[focusedIndex];
			if (!focusedEntry) return;

			if (focusedEntry.type === 'directory') {
				// Navigate into directory
				setCurrentPath(focusedEntry.fullPath);
			} else if (onSelect) {
				// Select file
				onSelect(focusedEntry.fullPath);
			}
			return;
		}

		// Allow selecting directories if enabled
		if (key.return && allowDirectories && filteredEntries.length > 0) {
			const focusedEntry = filteredEntries[focusedIndex];
			if (focusedEntry?.type === 'directory' && focusedEntry.name !== '..') {
				onSelect(focusedEntry.fullPath);
				return;
			}
		}
	});

	// Render file list
	const renderFileList = (): ReactNode => {
		if (filteredEntries.length === 0) {
			return (
				<Box paddingX={1}>
					<Text color={floydTheme.colors.fgMuted} dimColor>
						Empty
					</Text>
				</Box>
			);
		}

		return filteredEntries.slice(0, height).map((entry, index) => (
			<Box key={entry.fullPath}>
				<Text
					color={
						index === focusedIndex
							? floydTheme.colors.fgSelected
							: floydTheme.colors.fgBase
					}
					bold={index === focusedIndex}
				>
					{index === focusedIndex ? '>' : ' '}
					<Text
						color={
							getFileIcon(entry.name, entry.type, entry.name === '..').color
						}
					>
						{getFileIcon(entry.name, entry.type, entry.name === '..').icon}
					</Text>{' '}
					{truncatePath(entry.name, width - 5)}
				</Text>
			</Box>
		));
	};

	return (
		<Box flexDirection="column" width={width}>
			{/* Compact header */}
			<Box
				borderStyle="single"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
			>
				<Text bold color={floydTheme.colors.tertiary}>
					{createBreadcrumb(currentPath, width - 4)}
				</Text>
			</Box>

			{/* File list */}
			<Box flexDirection="column" paddingY={1}>
				{renderFileList()}
			</Box>

			{/* Compact footer */}
			<Box>
				<Text color={floydTheme.colors.fgMuted} dimColor>
					arrows + enter
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// MODAL VARIANT
// ============================================================================

/**
 * FilePickerModal - Modal version of FilePicker
 */
export interface FilePickerModalProps extends Omit<FilePickerProps, 'width'> {
	/** Is modal open */
	open: boolean;

	/** Modal width */
	modalWidth?: number;

	/** Modal title */
	title?: string;
}

export function FilePickerModal({
	open,
	modalWidth = 70,
	title = 'Select File',
	onCancel,
	...props
}: FilePickerModalProps) {
	if (!open) return null;

	return (
		<Box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			width="100%"
		>
			<FilePicker {...props} width={modalWidth} onCancel={onCancel} />
		</Box>
	);
}

export default FilePicker;
