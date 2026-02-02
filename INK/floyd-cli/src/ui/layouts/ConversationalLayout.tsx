/**
 * ConversationalLayout Component - Chat Diagram Compliant
 *
me if  * Layout Structure (from Chat diagram):
 * ┌─────────────────────────────────────────┐
 * │ Douglas. (1st message - OLDEST at top)  │
 * │ Floyd.   (2nd message)                  │
 * │ Douglas. (3rd message)                  │
 * │ Floyd.   (4th message)                  │
 * │ Douglas. (5th message)                  │
 * │ Floyd.   (6th message)                  │
 * │ Douglas. (7th message - NEWEST)         │
 * │ [All spent text flows UP from here]     │
 * │                                         │
 * │ ─────────── BLANK SPACER ─────────────  │
 * │                                         │
 * │ Floyd's response text typed...          │
 * │                                         │
 * │ ⠙ [thinking] | [tool calls transcript]  │
 * │                                         │
 * │ ────────────────────────────────────    │
 * │ > [User text typed here]                │
 * │ ────────────────────────────────────    │
 * │           PADDING                       │
 * │           PADDING                       │
 * └─────────────────────────────────────────┘
 *
 * @module ui/layouts/ConversationalLayout
 */

import {useState, useCallback, useRef, useEffect, useMemo, memo, type ReactNode} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

import {useFloydStore} from '../../store/floyd-store.js';
import {floydTheme, roleColors} from '../../theme/crush-theme.js';
import {MarkdownRenderer} from '../components/MarkdownRenderer.js';
import {CommandPaletteTrigger, type CommandItem, commonCommands} from '../components/CommandPalette.js';
import {HelpOverlay, type Hotkey} from '../overlays/HelpOverlay.js';
import type {ThinkingStatus} from '../agent/ThinkingStream.js';
import type {ToolExecution} from '../monitor/ToolTimeline.js';
import {AskOverlay, type PermissionRequest, type PermissionResponse} from '../../permissions/ask-overlay.js';

// ============================================================================
// TYPES
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export type UIMode = 'normal' | 'zen' | 'vibe';

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string | ReactNode;
	timestamp: Date;
	streaming?: boolean;
	toolCalls?: Array<{
		name: string;
		status: 'pending' | 'running' | 'success' | 'error';
		result?: string;
		error?: string;
	}>;
}

export interface ConversationalLayoutProps {
	userName?: string;
	messages?: ChatMessage[];
	streamingContent?: string;
	isThinking?: boolean;
	agentStatus?: ThinkingStatus;
	whimsicalPhrase?: string | null;
	toolExecutions?: ToolExecution[];
	onSubmit?: (message: string) => void;
	onCommand?: (commandId: string) => void;
	onExit?: () => void;
	commands?: CommandItem[];
	safetyMode?: 'yolo' | 'ask' | 'plan';
	onSafetyModeChange?: (mode: 'yolo' | 'ask' | 'plan') => void;
	permissionRequest?: PermissionRequest | null;
	onPermissionResponse?: (response: PermissionResponse) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_INPUT_LENGTH = 5000;
const SUBMIT_DEBOUNCE_MS = 200;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMessageIndicator(role: MessageRole): string {
	return role === 'user' ? '>' : '*';
}

function getLabel(role: MessageRole, userName: string): string {
	switch (role) {
		case 'user': return userName;
		case 'assistant': return 'Floyd';
		case 'system': return 'System';
		case 'tool': return 'Tool';
		default: return '?';
	}
}

function getMessageColor(role: MessageRole): string {
	switch (role) {
		case 'user': return roleColors.userLabel;
		case 'assistant': return roleColors.assistantLabel;
		case 'system': return roleColors.systemLabel;
		case 'tool': return roleColors.toolLabel;
		default: return floydTheme.colors.fgBase;
	}
}

// ============================================================================
// MESSAGE HISTORY - Messages flow UP (oldest at top, newest at bottom)
// ============================================================================

interface MessageHistoryProps {
	messages: ChatMessage[];
	userName: string;
	maxHeight: number;
	scrollOffset: number;
}

const MessageHistory = memo(function MessageHistory({messages, userName, maxHeight, scrollOffset}: MessageHistoryProps) {
	// Deduplicate messages
	const uniqueMessages = useMemo(() => {
		return Array.from(new Map(messages.map(m => [m.id, m])).values());
	}, [messages]);

	// Calculate visible window
	const displayCount = Math.max(5, Math.floor(maxHeight / 3));
	const totalMessages = uniqueMessages.length;
	const endIndex = Math.max(displayCount, totalMessages - scrollOffset);
	const startIndex = Math.max(0, endIndex - displayCount);
	const displayMessages = uniqueMessages.slice(startIndex, endIndex);

	const hasMoreAbove = startIndex > 0;
	const hasMoreBelow = endIndex < totalMessages;

	if (uniqueMessages.length === 0) {
		return (
			<Box paddingY={1} paddingX={2}>
				<Text color={floydTheme.colors.fgMuted} italic>
					Start a conversation...
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} gap={1}>
			{/* Scroll up indicator */}
			{hasMoreAbove && (
				<Text color={floydTheme.colors.fgMuted} dimColor>
					↑ {startIndex} more (PgUp to scroll)
				</Text>
			)}

			{/* Messages - oldest at top, newest at bottom */}
			{displayMessages.map(msg => (
				<Box key={msg.id} flexDirection="column">
					<Box flexDirection="row" gap={1}>
						<Text color={getMessageColor(msg.role)} bold>
							{getMessageIndicator(msg.role)} {getLabel(msg.role, userName)}.
						</Text>
					</Box>
					<Box marginLeft={2}>
						{typeof msg.content === 'string' ? (
							<MarkdownRenderer>{msg.content}</MarkdownRenderer>
						) : (
							msg.content
						)}
					</Box>
				</Box>
			))}

			{/* Scroll down indicator */}
			{hasMoreBelow && (
				<Text color={floydTheme.colors.fgMuted} dimColor>
					↓ {totalMessages - endIndex} more (PgDn to scroll)
				</Text>
			)}
		</Box>
	);
});

// ============================================================================
// FLOYD'S ACTIVE RESPONSE - What Floyd is currently typing
// ============================================================================

interface ActiveResponseProps {
	streamingContent: string;
	isThinking: boolean;
}

const ActiveResponse = memo(function ActiveResponse({streamingContent, isThinking}: ActiveResponseProps) {
	// Only show if there's streaming content
	if (!streamingContent && !isThinking) return null;

	return (
		<Box flexDirection="column" paddingX={2}>
			{streamingContent && (
				<Box flexDirection="column">
					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.assistantLabel} bold>* Floyd.</Text>
					</Box>
					<Box marginLeft={2}>
						<MarkdownRenderer>{streamingContent}</MarkdownRenderer>
						<Text color={roleColors.thinking}>▋</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
});

// ============================================================================
// STATUS LINE - Simple one-line: MODE | spinner [thinking] | [tool calls]
// ============================================================================

interface StatusLineProps {
	isThinking: boolean;
	whimsicalPhrase: string | null;
	toolExecutions: ToolExecution[];
	safetyMode: 'yolo' | 'ask' | 'plan';
}

function getModeColor(mode: 'yolo' | 'ask' | 'plan'): string {
	switch (mode) {
		case 'yolo': return '#ff6b6b'; // Red for YOLO
		case 'ask': return '#4ecdc4'; // Cyan for ASK
		case 'plan': return '#ffe66d'; // Yellow for PLAN
	}
}

const StatusLine = memo(function StatusLine({isThinking, whimsicalPhrase, toolExecutions, safetyMode}: StatusLineProps) {
	// Get the most recent active tool
	const activeTool = toolExecutions.find(t => t.status === 'running');
	const recentTool = toolExecutions.length > 0 ? toolExecutions[toolExecutions.length - 1] : null;

	return (
		<Box paddingX={2} marginY={1}>
			<Text>
				{/* ALWAYS SHOW MODE */}
				<Text bold color={getModeColor(safetyMode)}>[{safetyMode.toUpperCase()}]</Text>
				<Text> </Text>

				{isThinking && (
					<>
						<Text color={roleColors.thinking}>
							<Spinner type="moon" />
						</Text>
						<Text color={roleColors.thinking}> [thinking]</Text>
					</>
				)}

				{(activeTool || recentTool) && (
					<Text color={floydTheme.colors.fgMuted}>
						{' | '}{activeTool?.toolName || recentTool?.toolName}
						{activeTool ? '...' : recentTool?.status === 'success' ? ' [OK]' : ''}
					</Text>
				)}
				{whimsicalPhrase && (
					<Text color={floydTheme.colors.fgSubtle} dimColor>
						{' - '}{whimsicalPhrase}
					</Text>
				)}
			</Text>
		</Box>
	);
});

// ============================================================================
// INPUT FRAME - Bordered input with > prompt
// ============================================================================

interface InputFrameProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	isThinking: boolean;
}

function InputFrame({value, onChange, onSubmit, isThinking}: InputFrameProps) {
	return (
		<Box flexDirection="column" paddingX={1}>
			<Box
				borderStyle="single"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				paddingY={0}
			>
				<Text color={roleColors.inputPrompt}>{'>'} </Text>
				<TextInput
					value={value}
					onChange={onChange}
					onSubmit={onSubmit}
					placeholder={isThinking ? '...' : 'Type a message...'}
				/>
			</Box>
		</Box>
	);
}

// ============================================================================
// MAIN CONVERSATIONAL LAYOUT - Chat Diagram Structure
// ============================================================================

export function ConversationalLayout({
	userName = 'User',
	messages = [],
	streamingContent = '',
	isThinking = false,
	whimsicalPhrase = null,
	toolExecutions = [],
	onSubmit,
	onCommand,
	onExit,
	commands = commonCommands,
	safetyMode = 'ask',
	onSafetyModeChange,
	permissionRequest = null,
	onPermissionResponse,
}: ConversationalLayoutProps) {
	// Core state
	const [input, setInput] = useState('');
	const [scrollOffset, setScrollOffset] = useState(0);
	const [currentSafetyMode, setCurrentSafetyMode] = useState(safetyMode);

	const {exit: inkExit} = useApp();
	const lastSubmitRef = useRef<number>(0);
	const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 24);

	// Overlay state from store
	const showHelp = useFloydStore(state => state.showHelp);
	const setShowHelp = useCallback((v: boolean) => useFloydStore.getState().setOverlay('showHelp', v), []);
	const toggleHelp = useCallback(() => useFloydStore.getState().toggleOverlay('showHelp'), []);

	// Terminal resize handler
	useEffect(() => {
		const handleResize = () => setTerminalHeight(process.stdout.rows || 24);
		process.stdout.on('resize', handleResize);
		return () => {
			process.stdout.off('resize', handleResize);
		};
	}, []);

	// Calculate message area height
	// Total: terminalHeight
	// Reserve: 1 (spacer) + 3 (response estimate) + 1 (status) + 3 (input) + 3 (padding) = 11
	const messageHeight = Math.max(5, terminalHeight - 11);

	// Handle submission
	const handleSubmit = useCallback((value: string) => {
		const now = Date.now();
		if (now - lastSubmitRef.current < SUBMIT_DEBOUNCE_MS) return;
		if (!value.trim() || value.length > MAX_INPUT_LENGTH || isThinking) return;
		lastSubmitRef.current = now;
		setInput('');
		setScrollOffset(0); // Reset scroll on new message
		onSubmit?.(value);
	}, [isThinking, onSubmit]);

	// Define hotkeys
	const hotkeys: Hotkey[] = [
		{keys: 'Ctrl+P', description: 'Command palette', category: 'Navigation'},
		{keys: 'Ctrl+/', description: 'Help', category: 'Navigation'},
		{keys: 'PgUp/PgDn', description: 'Scroll messages', category: 'Navigation'},
		{keys: 'Shift+Tab', description: 'Cycle safety mode', category: 'System'},
		{keys: 'Ctrl+Q', description: 'Quit', category: 'System'},
		{keys: 'Esc', description: 'Exit', category: 'System'},
	];

	// Keyboard input handler
	useInput((_key, key) => {
		// Quit handlers
		if (key.ctrl && (_key === 'q' || _key === 'Q' || _key === 'c' || _key === 'C')) {
			onExit?.();
			inkExit();
			setTimeout(() => process.exit(0), 50);
			return;
		}
		if (key.escape) {
			if (showHelp) {
				setShowHelp(false);
				return;
			}
			onExit?.();
			inkExit();
			return;
		}

		// Help
		if (key.ctrl && _key === '/') {
			toggleHelp();
			return;
		}
		if (input.length === 0 && _key === '?') {
			toggleHelp();
			return;
		}

		// Scroll controls
		const maxScroll = Math.max(0, messages.length - 5);
		if (key.pageUp || (key.shift && key.upArrow)) {
			setScrollOffset(prev => Math.min(prev + 3, maxScroll));
			return;
		}
		if (key.pageDown || (key.shift && key.downArrow)) {
			setScrollOffset(prev => Math.max(prev - 3, 0));
			return;
		}

		// Safety mode cycle
		if (key.tab && key.shift) {
			const modes: Array<'yolo' | 'ask' | 'plan'> = ['yolo', 'ask', 'plan'];
			const idx = modes.indexOf(currentSafetyMode);
			const newMode = modes[(idx + 1) % modes.length];
			setCurrentSafetyMode(newMode);
			onSafetyModeChange?.(newMode);
			return;
		}
	});

	// Handle command
	const handleCommand = useCallback((cmdId: string) => {
		onCommand?.(cmdId);
		if (cmdId === 'exit') {
			onExit?.();
			inkExit();
		}
		if (cmdId === 'help') setShowHelp(true);
	}, [onCommand, onExit, inkExit, setShowHelp]);

	// Handle permission response
	const handlePermissionResponse = useCallback((response: PermissionResponse) => {
		onPermissionResponse?.(response);
	}, [onPermissionResponse]);

	// Render permission overlay (highest priority)
	if (permissionRequest) {
		return (
			<AskOverlay
				request={permissionRequest}
				visible={true}
				onResponse={handlePermissionResponse}
			/>
		);
	}

	// Render help overlay
	if (showHelp) {
		return (
			<HelpOverlay
				hotkeys={hotkeys}
				onClose={() => setShowHelp(false)}
				onCommand={handleCommand}
				title=" KEYBOARD SHORTCUTS "
			/>
		);
	}

	// =========================================================================
	// LAYOUT: Chat Diagram Structure
	// =========================================================================
	// 1. Message History (flows up - oldest at top, newest at bottom)
	// 2. BLANK LINE spacer
	// 3. Floyd's active response (what Floyd is typing)
	// 4. Status line (spinner [thinking] | tool calls)
	// 5. Input frame (bordered, with > prompt)
	// 6. Bottom padding
	// =========================================================================

	return (
		<CommandPaletteTrigger commands={commands} initialOpen={false} openKeys={['/']}>
			<Box flexDirection="column" width="100%" height={terminalHeight}>
				{/* 1. MESSAGE HISTORY - flows up (oldest at top) */}
				<Box flexDirection="column" flexGrow={1} overflowY="hidden">
					<MessageHistory
						messages={messages}
						userName={userName}
						maxHeight={messageHeight}
						scrollOffset={scrollOffset}
					/>
				</Box>

				{/* 2. BLANK LINE SPACER */}
				<Box height={1} />

				{/* 3. FLOYD'S ACTIVE RESPONSE */}
				<ActiveResponse streamingContent={streamingContent} isThinking={isThinking} />

				{/* 4. STATUS LINE - MODE | spinner [thinking] | tool calls */}
				<StatusLine
					isThinking={isThinking}
					whimsicalPhrase={whimsicalPhrase}
					toolExecutions={toolExecutions}
					safetyMode={currentSafetyMode}
				/>

				{/* 5. INPUT FRAME */}
				<InputFrame
					value={input}
					onChange={setInput}
					onSubmit={handleSubmit}
					isThinking={isThinking}
				/>

				{/* 6. BOTTOM PADDING */}
				<Box height={3} />
			</Box>
		</CommandPaletteTrigger>
	);
}

export default ConversationalLayout;
