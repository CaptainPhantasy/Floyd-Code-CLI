/**
 * HelpOverlay Component
 *
 * Modal overlay displaying keyboard shortcuts and help information.
 * Hotkeys are shown in a frame and can be triggered from the overlay.
 *
 * Purpose: Modal overlays - Help and keyboard shortcuts
 * Component of: Modal overlays
 * Related: MainLayout.tsx, hotkeys
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Frame} from '../crush/Frame.js';
import {floydTheme} from '../../theme/crush-theme.js';
import {crushTheme} from '../../theme/crush-theme.js';

export interface Hotkey {
	/** Keyboard shortcut (e.g., "Ctrl+P", "F1", "?") */
	keys: string;

	/** Description of what the shortcut does */
	description: string;

	/** Optional category/group */
	category?: string;

	/** Optional action to execute when selected */
	action?: () => void;
}

export interface HelpOverlayProps {
	/** Callback when overlay is closed */
	onClose: () => void;

	/** Hotkeys to display */
	hotkeys?: Hotkey[];

	/** Title for the overlay */
	title?: string;

	/** Optional callback for command execution */
	onCommand?: (commandId: string) => void;
}

/**
 * Default hotkeys for FLOYD CLI
 * These match the actual shortcuts implemented in app.tsx and MainLayout.tsx
 */
export function getDefaultHotkeys(onClose: () => void, onCommand?: (cmd: string) => void): Hotkey[] {
	return [
		{
			keys: 'Ctrl+/',
			description: 'Show/hide keyboard shortcuts',
			category: 'Navigation',
			action: onClose,
		},
		{
			keys: 'Ctrl+P',
			description: 'Open command palette',
			category: 'Navigation',
			action: () => {
				onCommand?.('open-palette');
				onClose();
			},
		},
		{
			keys: 'Ctrl+M',
			description: 'Toggle monitor dashboard',
			category: 'Navigation',
			action: () => {
				onCommand?.('toggle-monitor');
				onClose();
			},
		},
		{
			keys: 'Ctrl+T',
			description: 'Toggle agent visualization',
			category: 'Navigation',
			action: () => {
				onCommand?.('toggle-agent-viz');
				onClose();
			},
		},
		{
			keys: 'Esc',
			description: 'Close overlay / Exit',
			category: 'Navigation',
			action: onClose,
		},
		{
			keys: 'Enter',
			description: 'Send message',
			category: 'Input',
		},
		{
			keys: 'Ctrl+C',
			description: 'Exit application',
			category: 'System',
			action: () => {
				onCommand?.('exit');
				onClose();
			},
		},
		{
			keys: '?',
			description: 'Show help (when input is empty)',
			category: 'Navigation',
			action: onClose,
		},
	];
}

const defaultHotkeys: Hotkey[] = [
	{
		keys: 'Ctrl+/',
		description: 'Show/hide keyboard shortcuts',
		category: 'Navigation',
	},
	{
		keys: 'Ctrl+P',
		description: 'Open command palette',
		category: 'Navigation',
	},
	{
		keys: 'Esc',
		description: 'Close overlay / Exit',
		category: 'Navigation',
	},
	{
		keys: 'Enter',
		description: 'Send message',
		category: 'Input',
	},
	{
		keys: 'Ctrl+C',
		description: 'Exit application',
		category: 'System',
	},
	{
		keys: '?',
		description: 'Show help (when not typing)',
		category: 'Navigation',
	},
];

/**
 * Group hotkeys by category
 */
function groupHotkeys(hotkeys: Hotkey[]): Map<string, Hotkey[]> {
	const grouped = new Map<string, Hotkey[]>();

	for (const hotkey of hotkeys) {
		const category = hotkey.category || 'Other';
		if (!grouped.has(category)) {
			grouped.set(category, []);
		}
		const categoryList = grouped.get(category);
		if (categoryList) {
			categoryList.push(hotkey);
		}
	}

	return grouped;
}

/**
 * HelpOverlay - Display keyboard shortcuts in a frame
 */
export function HelpOverlay({
	onClose,
	hotkeys,
	title = ' KEYBOARD SHORTCUTS ',
	onCommand,
}: HelpOverlayProps) {
	// Use provided hotkeys or generate defaults with actions
	const displayHotkeys = hotkeys || getDefaultHotkeys(onClose, onCommand);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const groupedHotkeys = groupHotkeys(hotkeys);
	const flatHotkeys = Array.from(groupedHotkeys.values()).flat();

	// Reset selectedIndex when hotkeys change or overlay opens
	useEffect(() => {
		setSelectedIndex(0);
	}, [hotkeys]);

	// Handle keyboard input within the overlay
	useInput((input, key) => {
		if (key.escape) {
			onClose();
			return;
		}

		// Ctrl+/ to close
		if (key.ctrl && input === '/') {
			onClose();
			return;
		}

		// Navigation
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow) {
			setSelectedIndex(prev => Math.min(flatHotkeys.length - 1, prev + 1));
			return;
		}

		// Execute selected hotkey action
		if (key.return && flatHotkeys[selectedIndex]?.action) {
			const selected = flatHotkeys[selectedIndex];
			if (selected.action) {
				selected.action();
				onClose();
			}
			return;
		}
	});

	return (
		<Box
			flexDirection="column"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
		>
			<Frame
				title={title}
				borderStyle="round"
				borderVariant="focus"
				padding={1}
				width={70}
			>
				<Box flexDirection="column" gap={1}>
					{/* Instructions */}
					<Box marginBottom={1}>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							Use ↑↓ to navigate, Enter to execute, Esc or Ctrl+/ to close
						</Text>
					</Box>

					{/* Hotkeys grouped by category */}
					{Array.from(groupedHotkeys.entries()).map(([category, categoryHotkeys]) => (
						<Box key={category} flexDirection="column" marginBottom={1}>
							{/* Category header */}
							<Text bold color={crushTheme.accent.primary}>
								{category}
							</Text>

							{/* Hotkeys in this category */}
							<Box flexDirection="column" marginLeft={2} marginTop={0}>
								{categoryHotkeys.map(hotkey => {
									const globalIndex = flatHotkeys.indexOf(hotkey);
									const isSelected = globalIndex === selectedIndex;
									const hotkeyKey = `${category}-${hotkey.keys}-${hotkey.description}`;

									return (
										<Box
											key={hotkeyKey}
											flexDirection="row"
											paddingY={0}
										>
											{/* Selection indicator */}
											<Text
												color={
													isSelected
														? crushTheme.accent.primary
														: floydTheme.colors.fgMuted
												}
											>
												{isSelected ? '▶ ' : '  '}
											</Text>

											{/* Keys */}
											<Box width={20}>
												<Text
													bold={isSelected}
													color={
														isSelected
															? crushTheme.accent.secondary
															: floydTheme.colors.fgBase
													}
												>
													{hotkey.keys}
												</Text>
											</Box>

											{/* Description */}
											<Text
												color={
													isSelected
														? floydTheme.colors.fgBase
														: floydTheme.colors.fgSubtle
												}
												dimColor={!isSelected}
											>
												{hotkey.description}
											</Text>
										</Box>
									);
								})}
							</Box>
						</Box>
					))}

					{/* Footer */}
					<Box
						marginTop={1}
						paddingTop={1}
						borderStyle="single"
						borderColor={floydTheme.colors.border}
					>
						<Text color={floydTheme.colors.fgMuted} dimColor>
							Press Esc or Ctrl+/ to close this overlay
						</Text>
					</Box>
				</Box>
			</Frame>
		</Box>
	);
}

export default HelpOverlay;
