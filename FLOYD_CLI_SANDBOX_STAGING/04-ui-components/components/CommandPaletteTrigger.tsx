/**
 * CommandPaletteTrigger Component
 *
 * Alternative trigger component for the command palette.
 * This file extends the base CommandPalette with additional trigger options.
 *
 * Note: CommandPalette already exports a CommandPaletteTrigger.
 * This file provides additional trigger variants and utilities.
 */

import {useState, useCallback, type ReactNode} from 'react';
import {Box, Text, useInput} from 'ink';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';
import {CommandPalette, type CommandItem} from './CommandPalette.js';

export interface Command {
	/** Unique identifier */
	id: string;

	/** Display label */
	label: string;

	/** Keyboard shortcut */
	shortcut?: string;

	/** Description */
	description?: string;

	/** Icon or indicator */
	icon?: string;

	/** Action when selected */
	action: () => void;

	/** Command category */
	category?: string;

	/** Disabled state */
	disabled?: boolean;
}

/**
 * Convert Command to CommandItem
 */
function toCommandItem(command: Command): CommandItem {
	return {
		id: command.id,
		label: command.label,
		description: command.description,
		shortcut: command.shortcut,
		icon: command.icon,
		action: command.action,
		category: command.category,
		disabled: command.disabled,
	};
}

export interface CommandPaletteTriggerV2Props {
	/** Available commands */
	commands: Command[];

	/** Trigger key hint */
	triggerKey?: string;

	/** Label for the trigger */
	label?: string;

	/** Description or placeholder */
	placeholder?: string;

	/** Show keyboard hint */
	showHint?: boolean;

	/** Custom trigger content */
	children?: ReactNode;

	/** Callback when palette opens */
	onOpen?: () => void;

	/** Callback when palette closes */
	onClose?: () => void;

	/** Callback when command is executed (reserved for future use) */
	_onExecute?: (command: Command) => void;

	/** Width of the palette (reserved for future use) */
	_width?: number;

	/** Max visible items */
	maxVisible?: number;

	/** Initial open state */
	initialOpen?: boolean;
}

/**
 * CommandPaletteTriggerV2 - Alternative trigger for command palette
 */
export function CommandPaletteTriggerV2({
	commands,
	triggerKey = 'Ctrl+P',
	label = 'Commands',
	placeholder = 'Type a command or search...',
	showHint = true,
	children,
	onOpen,
	onClose,
	maxVisible = 8,
	initialOpen = false,
}: CommandPaletteTriggerV2Props) {
	const [isOpen, setIsOpen] = useState(initialOpen);

	// Handle keyboard input
	useInput((input, key) => {
		// Check for trigger key combination
		if (key.ctrl && input === 'p') {
			setIsOpen(prev => {
				const next = !prev;
				if (next && onOpen) onOpen();
				if (!next && onClose) onClose();
				return next;
			});
		}

		// Close on Escape
		if (key.escape && isOpen) {
			setIsOpen(false);
			if (onClose) onClose();
		}
	});

	// Convert commands to CommandItem format
	const commandItems: CommandItem[] = commands.map(toCommandItem);

	// Handle command execution
	const handleClose = useCallback(() => {
		setIsOpen(false);
		if (onClose) onClose();
	}, [onClose]);

	// Default trigger UI
	const defaultTrigger = (
		<Box
			borderStyle="single"
			borderColor={floydTheme.colors.border}
			paddingX={1}
			paddingY={0}
		>
			<Box flexDirection="row" gap={1}>
				<Text color={floydRoles.thinking}>⌘</Text>
				<Text color={floydTheme.colors.fgBase}>{label}</Text>
				{showHint && (
					<Text dimColor color={floydTheme.colors.fgMuted}>
						[{triggerKey}]
					</Text>
				)}
			</Box>
		</Box>
	);

	return (
		<>
			{/* Trigger UI */}
			{children ?? defaultTrigger}

			{/* Command Palette Overlay */}
			<CommandPalette
				commands={commandItems}
				isOpen={isOpen}
				onClose={handleClose}
				onOpen={onOpen}
				placeholder={placeholder}
				maxVisible={maxVisible}
			/>
		</>
	);
}

/**
 * CommandButton - Button-style trigger for command palette
 */
export interface CommandButtonProps {
	/** Button label */
	label?: string;

	/** Available commands */
	commands: Command[];

	/** Button color */
	color?: string;

	/** Button width */
	width?: number;

	/** Callbacks */
	onOpen?: () => void;
	onClose?: () => void;
	onExecute?: (command: Command) => void;
}

export function CommandButton({
	label = 'Open Commands',
	commands,
	color = floydRoles.thinking,
	width = 30,
	onOpen,
	onClose,
	onExecute,
}: CommandButtonProps) {
	const [isOpen, setIsOpen] = useState(false);

	useInput((input, key) => {
		if (key.ctrl && input === 'p') {
			setIsOpen(prev => {
				const next = !prev;
				if (next && onOpen) onOpen();
				if (!next && onClose) onClose();
				return next;
			});
		}

		if (key.escape && isOpen) {
			setIsOpen(false);
			if (onClose) onClose();
		}
	});

	// Convert commands
	const commandItems: CommandItem[] = commands.map(toCommandItem);

	// Handle command execution - wrap to add onExecute callback
	const commandsWithCallback: CommandItem[] = commandItems.map(cmd => ({
		...cmd,
		action: () => {
			const originalCommand = commands.find(c => c.id === cmd.id);
			if (originalCommand) {
				originalCommand.action();
				if (onExecute) onExecute(originalCommand);
			}
		},
	}));

	const handleClose = () => {
		setIsOpen(false);
		if (onClose) onClose();
	};

	return (
		<>
			<Box
				width={width}
				justifyContent="center"
				borderStyle="single"
				borderColor={isOpen ? color : floydTheme.colors.border}
				paddingX={1}
				paddingY={0}
			>
				<Text bold color={color}>
					{label}
				</Text>
				<Text dimColor color={floydTheme.colors.fgMuted}>
					{' '}
					[Ctrl+P]
				</Text>
			</Box>

			<CommandPalette
				commands={commandsWithCallback}
				isOpen={isOpen}
				onClose={handleClose}
				onOpen={onOpen}
				placeholder="Type a command..."
				maxVisible={8}
			/>
		</>
	);
}

/**
 * QuickActions - Quick action buttons that display commands
 */
export interface QuickActionsProps {
	/** Actions to display */
	actions: Array<{
		id: string;
		label: string;
		shortcut?: string;
		action: () => void;
		color?: string;
	}>;

	/** Label for the section */
	label?: string;

	/** Show shortcuts */
	showShortcuts?: boolean;

	/** Layout direction */
	direction?: 'row' | 'column';
}

export function QuickActions({
	actions,
	label = 'Quick Actions',
	showShortcuts = true,
	direction = 'row',
}: QuickActionsProps) {
	return (
		<Box flexDirection="column" marginBottom={1}>
			<Text dimColor color={floydTheme.colors.fgMuted}>
				{label}
			</Text>
			<Box flexDirection={direction} gap={1} marginTop={0}>
				{actions.map(action => (
					<Box
						key={action.id}
						borderStyle="single"
						borderColor={action.color ?? floydTheme.colors.border}
						paddingX={1}
					>
						<Text color={action.color ?? floydTheme.colors.fgBase}>
							{action.label}
						</Text>
						{showShortcuts && action.shortcut && (
							<Text dimColor color={floydTheme.colors.fgMuted}>
								{' '}
								[{action.shortcut}]
							</Text>
						)}
					</Box>
				))}
			</Box>
		</Box>
	);
}

/**
 * CommandHint - Small hint about command palette availability
 */
export interface CommandHintProps {
	/** Custom hint text */
	text?: string;

	/** Position */
	position?: 'left' | 'center' | 'right';

	/** Color */
	color?: string;
}

export function CommandHint({
	text = 'Press Ctrl+P to open command palette',
	position = 'right',
	color = floydTheme.colors.fgMuted,
}: CommandHintProps) {
	const alignment = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end',
	}[position] as 'flex-start' | 'center' | 'flex-end';

	return (
		<Box width="100%" justifyContent={alignment}>
			<Text dimColor color={color}>
				{text}
			</Text>
		</Box>
	);
}

export default CommandPaletteTriggerV2;
