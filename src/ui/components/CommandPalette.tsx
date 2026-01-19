/**
 * CommandPalette Component
 *
 * Fuzzy-find command overlay activated by Ctrl+P.
 * Provides keyboard-driven command navigation and execution.
 */

import React, {useState, useEffect, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

export interface CommandItem {
	/** Unique identifier for the command */
	id: string;

	/** Display label */
	label: string;

	/** Optional description */
	description?: string;

	/** Optional keyboard shortcut hint */
	shortcut?: string;

	/** Optional category/group */
	category?: string;

	/** Callback when command is selected */
	action: () => void | Promise<void>;

	/** Icon/emoji for the command */
	icon?: string;

	/** Disable the command */
	disabled?: boolean;
}

export interface CommandPaletteProps {
	/** Available commands */
	commands: CommandItem[];

	/** Is the palette currently open */
	isOpen: boolean;

	/** Callback when palette is closed */
	onClose: () => void;

	/** Callback when palette is opened */
	onOpen?: () => void;

	/** Placeholder text */
	placeholder?: string;

	/** Max visible items */
	maxVisible?: number;

	/** Enable fuzzy search */
	fuzzy?: boolean;
}

/**
 * Calculate fuzzy match score
 * Higher score = better match
 */
function fuzzyScore(query: string, text: string): number {
	if (!query) return 1;
	const lowerQuery = query.toLowerCase();
	const lowerText = text.toLowerCase();

	let queryIndex = 0;
	let score = 0;
	let consecutiveMatches = 0;

	for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
		if (lowerText[i] === lowerQuery[queryIndex]) {
			score += 1 + consecutiveMatches * 0.1;
			consecutiveMatches++;
			queryIndex++;
		} else {
			consecutiveMatches = 0;
		}
	}

	// Bonus for completing the query
	if (queryIndex === lowerQuery.length) {
		score += 10;
	}

	// Penalty for not matching all query characters
	score -= (lowerQuery.length - queryIndex) * 2;

	return score > 0 ? score : 0;
}

/**
 * Highlight matching characters in text
 */
function highlightMatch(text: string, query: string): React.ReactNode {
	if (!query) return text;

	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const result: React.ReactNode[] = [];
	let lastIndex = 0;
	let queryIndex = 0;

	for (let i = 0; i < text.length && queryIndex < lowerQuery.length; i++) {
		if (lowerText[i] === lowerQuery[queryIndex]) {
			// Add preceding text
			if (i > lastIndex) {
				result.push(text.substring(lastIndex, i));
			}
			// Add highlighted character
			result.push(
				<Text bold color={floydRoles.headerTitle}>
					{text[i]}
				</Text>,
			);
			lastIndex = i + 1;
			queryIndex++;
		}
	}

	// Add remaining text
	if (lastIndex < text.length) {
		result.push(text.substring(lastIndex));
	}

	return result;
}

/**
 * CommandPalette component
 */
export function CommandPalette({
	commands,
	isOpen,
	onClose,
	onOpen,
	placeholder = 'Type a command or search...',
	maxVisible = 8,
	fuzzy = true,
}: CommandPaletteProps) {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Reset state when palette opens/closes
	useEffect(() => {
		if (isOpen) {
			setQuery('');
			setSelectedIndex(0);
			onOpen?.();
		}
	}, [isOpen, onOpen]);

	// Filter and sort commands based on query
	const filteredCommands = useMemo(() => {
		if (!query) {
			return commands;
		}

		const scored = commands
			.filter(cmd => !cmd.disabled)
			.map(cmd => ({
				cmd,
				score: fuzzy
					? fuzzyScore(query, cmd.label)
					: cmd.label.toLowerCase().includes(query.toLowerCase())
					? 1
					: 0,
			}))
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.map(item => item.cmd);

		return scored;
	}, [query, commands, fuzzy]);

	// Clamp selected index
	useEffect(() => {
		if (
			filteredCommands.length > 0 &&
			selectedIndex >= filteredCommands.length
		) {
			setSelectedIndex(filteredCommands.length - 1);
		}
	}, [filteredCommands.length, selectedIndex]);

	// Handle keyboard input
	useInput((input, key) => {
		if (!isOpen) return;

		if (key.escape) {
			onClose();
			return;
		}

		if (key.return && filteredCommands.length > 0) {
			const selected = filteredCommands[selectedIndex];
			if (selected && !selected.disabled) {
				try {
					selected.action();
					onClose();
				} catch (error) {
					// Error handling: keep palette open and log error
					console.error('[CommandPalette] Command execution failed:', error);
					// Could show error message to user here
				}
			}
			return;
		}

		if (key.ctrl && input === 'p') {
			onClose(); // Toggle off
			return;
		}

		// Navigation
		if (key.upArrow || (key.ctrl && input === 'p')) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow || (key.ctrl && input === 'n')) {
			setSelectedIndex(prev => Math.min(filteredCommands.length - 1, prev + 1));
			return;
		}

		// Page up/down
		if (key.pageUp) {
			setSelectedIndex(prev => Math.max(0, prev - maxVisible));
			return;
		}

		if (key.pageDown) {
			setSelectedIndex(prev =>
				Math.min(filteredCommands.length - 1, prev + maxVisible),
			);
			return;
		}
	});

	if (!isOpen) return null;

	const visibleCommands = filteredCommands.slice(0, maxVisible);
	const hasSelection = filteredCommands.length > 0;
	const selectedCommand = hasSelection ? filteredCommands[selectedIndex] : null;

	return (
		<Box
			flexDirection="column"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
		>
			{/* Palette container */}
			<Box
				flexDirection="column"
				width={60}
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
				padding={1}
			>
				{/* Header */}
				<Box marginBottom={1} flexDirection="row" gap={1}>
					<Text color={floydRoles.headerTitle} bold>
						{'>'}
					</Text>
					<TextInput
						value={query}
						onChange={setQuery}
						placeholder={placeholder}
						focus={!isOpen}
					/>
				</Box>

				{/* Command list */}
				{visibleCommands.length > 0 ? (
					<Box flexDirection="column" flexGrow={1}>
						{visibleCommands.map((cmd, index) => {
							const isSelected = index === selectedIndex;
							const isDisabled = cmd.disabled;

							return (
								<Box
									key={cmd.id}
									flexDirection="row"
									paddingX={1}
									paddingY={0}
									width="100%"
								>
									{/* Selection indicator */}
									<Text
										color={
											isSelected
												? floydRoles.headerTitle
												: floydTheme.colors.fgMuted
										}
									>
										{isSelected ? '▶' : ' '}
									</Text>

									{/* Icon */}
									{cmd.icon && (
										<Text
											color={
												isDisabled ? floydTheme.colors.fgSubtle : undefined
											}
										>
											{cmd.icon + ' '}
										</Text>
									)}

									{/* Label with highlight */}
									<Text
										color={
											isDisabled
												? floydTheme.colors.fgSubtle
												: floydTheme.colors.fgBase
										}
										dimColor={isDisabled || !isSelected}
										bold={isSelected}
									>
										{highlightMatch(cmd.label, query)}
									</Text>

									{/* Spacer */}
									<Box flexGrow={1} />

									{/* Shortcut */}
									{cmd.shortcut && (
										<Text color={floydTheme.colors.fgMuted} dimColor>
											{cmd.shortcut}
										</Text>
									)}
								</Box>
							);
						})}

						{/* More items indicator */}
						{filteredCommands.length > maxVisible && (
							<Box paddingX={1} marginTop={0}>
								<Text color={floydTheme.colors.fgMuted} dimColor>
									{filteredCommands.length - maxVisible} more commands...
								</Text>
							</Box>
						)}
					</Box>
				) : (
					/* No results */
					<Box paddingX={1} paddingY={1}>
						<Text color={floydTheme.colors.fgMuted} dimColor italic>
							No commands found matching "{query}"
						</Text>
					</Box>
				)}

				{/* Footer */}
				{selectedCommand && selectedCommand.description && (
					<Box
						marginTop={1}
						paddingX={1}
						borderStyle="single"
						borderColor={floydTheme.colors.border}
					>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							{selectedCommand.description}
						</Text>
					</Box>
				)}

				{/* Keyboard hints */}
				<Box marginTop={1} justifyContent="space-between" width="100%">
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{'↑↓ Nav • Enter Select • Esc Close'}
					</Text>
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{filteredCommands.length > 0 &&
							`${selectedIndex + 1}/${filteredCommands.length}`}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

/**
 * CommandPaletteTrigger - Wrapper that handles Ctrl+P to open palette
 */
export interface CommandPaletteTriggerProps {
	/** Available commands */
	commands: CommandItem[];

	/** Children to render when palette is closed */
	children: React.ReactNode;

	/** Initial open state */
	initialOpen?: boolean;

	/** Additional keybindings to open palette */
	openKeys?: string[];
}

export function CommandPaletteTrigger({
	commands,
	children,
	initialOpen = false,
	openKeys = [],
}: CommandPaletteTriggerProps) {
	const [isOpen, setIsOpen] = useState(initialOpen);

	useInput((input, key) => {
		// Ctrl+P to open
		if (key.ctrl && input === 'p') {
			setIsOpen(prev => !prev);
			return;
		}

		// Check additional keybindings
		if (openKeys.includes(input) || (key.ctrl && openKeys.includes(input))) {
			setIsOpen(true);
		}

		// Escape to close
		if (key.escape && isOpen) {
			setIsOpen(false);
		}
	});

	return (
		<>
			{!isOpen && children}
			<CommandPalette
				commands={commands}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onOpen={() => setIsOpen(true)}
			/>
		</>
	);
}

/**
 * Quick command definitions for common Floyd actions
 */
export const commonCommands: CommandItem[] = [
	{
		id: 'new-task',
		label: 'New Task',
		description: 'Create a new task/conversation',
		icon: '📝',
		shortcut: '^N',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'open-file',
		label: 'Open File',
		description: 'Open a file in the editor',
		icon: '📄',
		shortcut: '^O',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'search-files',
		label: 'Search Files',
		description: 'Search across all files in the project',
		icon: '🔍',
		shortcut: '^F',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'run-command',
		label: 'Run Command',
		description: 'Execute a shell command',
		icon: '⚡',
		shortcut: '^R',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'view-history',
		label: 'View History',
		description: 'View conversation history',
		icon: '📜',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'settings',
		label: 'Settings',
		description: 'Open Floyd settings',
		icon: '⚙️',
		shortcut: '^,',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'help',
		label: 'Help',
		description: 'Show help and documentation',
		icon: '❓',
		shortcut: 'F1',
		action: () => {
			// Implementation would be provided by the app
		},
	},
	{
		id: 'exit',
		label: 'Exit',
		description: 'Exit Floyd CLI',
		icon: '👋',
		shortcut: '^Q',
		action: () => {
			// Implementation would be provided by the app
		},
	},
];

export default CommandPalette;
