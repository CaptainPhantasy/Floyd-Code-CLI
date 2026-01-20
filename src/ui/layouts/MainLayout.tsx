/**
 * MainLayout Component
 *
 * Primary interactive screen layout for the FLOYD CLI.
 * Implements the "LEFT MONITOR (27\")" design with:
 * - FLOYD ASCII banner
 * - Status bar with worker badges
 * - Message history area
 * - Agent visualization (ThinkingStream, TaskChecklist)
 * - Tool execution timeline
 * - Command palette (Ctrl+P)
 * - Chat input interface
 *
 * Layout Structure:
 * -------------------
 * [ ASCII BANNER ]
 * -------------------
 * [ STATUS BAR    ] - Worker badges, connection status, mode indicators
 * -------------------
 * [ LEFT   | RIGHT ] - Split view with message history and agent viz
 * [ MSGS   | TOOLS ] - Scrollable message history and tool timeline
 * [        | TASKS ] - Task checklist and thinking stream
 * -------------------
 * [ INPUT AREA    ] - Chat input with hints
 * -------------------
 *
 * @module ui/layouts/MainLayout
 */

import {useState, useCallback, useRef, useEffect, type ReactNode} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

// UI Components
import {ToolCard} from '../components/ToolCard.js';
import {
	CommandPaletteTrigger,
	type CommandItem,
	commonCommands,
} from '../components/CommandPalette.js';
import {SessionPanel, ContextPanel, TranscriptPanel} from '../panels/index.js';
import type {
	ToolToggle,
	WorkerState,
	PlanItem,
	DiffSummary,
	BrowserState,
	QuickAction,
} from '../panels/index.js';
import {HelpOverlay, type Hotkey} from '../overlays/HelpOverlay.js';
import {PromptLibraryOverlay} from '../overlays/PromptLibraryOverlay.js';

// Agent Visualization
import {type ThinkingStatus} from '../agent/ThinkingStream.js';
import {
	CompactTaskList,
	type Task,
	type TaskStatus,
} from '../agent/TaskChecklist.js';
import {type ToolExecution} from '../monitor/ToolTimeline.js';
import {type StreamEvent} from '../monitor/EventStream.js';

// Theme
import {floydTheme, crushTheme, roleColors} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string | ReactNode;
	timestamp: Date;
	toolCalls?: Array<{
		name: string;
		status: 'pending' | 'running' | 'success' | 'error';
		result?: string;
		error?: string;
		workerName?: string;
		duration?: number;
		timestamp?: Date;
	}>;
}

export interface MainLayoutProps {
	/** User name for display */
	userName?: string;

	/** Current working directory */
	cwd?: string;

	/** Current connection status */
	connectionStatus?: 'connected' | 'disconnected' | 'connecting';

	/** Active mode indicator */
	mode?: 'chat' | 'code' | 'browse' | 'swarm';

	/** Messages to display */
	messages?: ChatMessage[];

	/** Current agent status */
	agentStatus?: ThinkingStatus;

	/** Current task list */
	tasks?: Task[];

	/** Tool executions */
	toolExecutions?: ToolExecution[];

	/** Event stream */
	events?: StreamEvent[];

	/** Command palette commands */
	commands?: CommandItem[];

	/** Show/hide help */
	showHelp?: boolean;

	/** Show/hide prompt library */
	showPromptLibrary?: boolean;

	/** Obsidian vault path for prompt library */
	promptLibraryVaultPath?: string;

	/** Is agent currently thinking */
	isThinking?: boolean;

	/** Current whimsical thinking phrase */
	whimsicalPhrase?: string | null;

	/** Current streaming content (for display during generation) */
	streamingContent?: string;

	/** Callback when user submits a message */
	onSubmit?: (message: string) => void;

	/** Callback when command palette action is triggered */
	onCommand?: (commandId: string) => void;

	/** Callback when exit is requested */
	onExit?: () => void;

	/** Enable compact mode for smaller terminals */
	compact?: boolean;

	/** Show agent visualization panel */
	showAgentViz?: boolean;

	/** Show tool timeline */
	showToolTimeline?: boolean;

	/** Show event stream */
	showEventStream?: boolean;

	/** Custom header content */
	customHeader?: ReactNode;

	/** Custom footer content */
	customFooter?: ReactNode;

	// SESSION panel props
	/** Repository name */
	repoName?: string;

	/** Tech stack (e.g., "TypeScript + Ink + MCP") */
	techStack?: string;

	/** Git branch name */
	gitBranch?: string;

	/** Git working tree status */
	gitStatus?: 'clean' | 'dirty';

	/** Number of modified files (if dirty) */
	fileCount?: number;

	/** Safety mode setting */
	safetyMode?: 'yolo' | 'safe';

	/** Tool toggle states */
	toolStates?: ToolToggle[];

	/** Worker states */
	workerStates?: WorkerState[];

	// CONTEXT panel props
	/** Current plan checklist items */
	currentPlan?: PlanItem[];

	/** List of files that have been touched */
	filesTouched?: string[];

	/** Open diffs summary */
	openDiffs?: DiffSummary;

	/** Browser state information */
	browserState?: BrowserState;

	/** Quick action shortcuts */
	quickActions?: QuickAction[];
}

// ============================================================================
// ASCII ART BANNER
// ============================================================================

/**
 * FLOYD ASCII Banner - Branded visual header
 * Source: /Volumes/Storage/FLOYD_CLI/ASCII/FLOYD_CLI_ascii (1).txt
 */
const FLOYD_ASCII_LINES = [
	"'########:'##::::::::'#######::'##:::'##:'########::::::'######::'##:::::::'####:",
	" ##.....:: ##:::::::'##.... ##:. ##:'##:: ##.... ##::::'##... ##: ##:::::::. ##::",
	' ##::::::: ##::::::: ##:::: ##::. ####::: ##:::: ##:::: ##:::..:: ##:::::::: ##::',
	' ######::: ##::::::: ##:::: ##:::. ##:::: ##:::: ##:::: ##::::::: ##:::::::: ##::',
	' ##...:::: ##::::::: ##:::: ##:::: ##:::: ##:::: ##:::: ##::::::: ##:::::::: ##::',
	' ##::::::: ##::::::: ##:::: ##:::: ##:::: ##:::: ##:::: ##::: ##: ##:::::::: ##::',
	" ##::::::: ########:. #######::::: ##:::: ########:::::. ######:: ########:'####:",
	'..::::::::........:::.......::::::..:::::........:::::::......:::........::....::',
];

const FLOYD_GRADIENT_COLORS = [
	'#FF60FF', // pink for #
	'#6060FF', // blue for :
	'#B85CFF', // lavender (other chars fallback)
	'#9054FF', // indigo
	'#6B50FF', // violet
];

/**
 * Render the FLOYD ASCII banner with gradient colors
 */
function FloydAsciiBanner() {
	return (
		<Box flexDirection="column" marginBottom={1}>
			{FLOYD_ASCII_LINES.map((line, rowIndex) => (
				<Box key={rowIndex}>
					{Array.from(line).map((ch, chIndex) => {
						let color = FLOYD_GRADIENT_COLORS[2]; // default lavender
						if (ch === '#') color = FLOYD_GRADIENT_COLORS[0]; // pink
						if (ch === ':') color = FLOYD_GRADIENT_COLORS[1]; // blue
						if (ch === '.') color = '#666666'; // gray for dots
						if (ch === "'") color = '#888888'; // light gray
						return (
							<Text key={chIndex} color={color}>
								{ch}
							</Text>
						);
					})}
				</Box>
			))}
		</Box>
	);
}

// ============================================================================
// STATUS BAR COMPONENT
// ============================================================================

interface StatusBarProps {
	userName: string;
	cwd: string;
	connectionStatus: 'connected' | 'disconnected' | 'connecting';
	mode: 'chat' | 'code' | 'browse' | 'swarm';
	agentStatus?: ThinkingStatus;
	isThinking?: boolean;
	compact?: boolean;
}

function StatusBar({
	userName,
	cwd,
	connectionStatus,
	mode,
	agentStatus,
	isThinking,
	compact,
	whimsicalPhrase,
}: StatusBarProps & {whimsicalPhrase?: string | null}) {
	// Connection status
	const connectionColor =
		connectionStatus === 'connected'
			? crushTheme.status.online
			: connectionStatus === 'connecting'
			? crushTheme.status.working
			: crushTheme.status.offline;

	const connectionLabel =
		connectionStatus === 'connected'
			? 'Online'
			: connectionStatus === 'connecting'
			? 'Connecting'
			: 'Offline';

	// Mode indicator
	const modeLabels = {
		chat: 'Chat',
		code: 'Code',
		browse: 'Browse',
		swarm: 'Swarm',
	};

	// Agent status
	const getAgentStatusColor = (): string => {
		if (isThinking) return roleColors.thinking;
		if (agentStatus === 'error') return crushTheme.status.error;
		if (agentStatus === 'complete') return crushTheme.status.ready;
		return crushTheme.status.offline;
	};

	const getAgentStatusLabel = (): string => {
		if (isThinking) return whimsicalPhrase || 'Thinking';
		if (agentStatus === 'error') return 'Error';
		if (agentStatus === 'complete') return 'Ready';
		return 'Idle';
	};

	if (compact) {
		return (
			<Box
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				marginBottom={1}
				width="100%"
			>
				<Box width="100%" justifyContent="space-between">
					<Box flexDirection="row" gap={1}>
						<Text bold color={FLOYD_GRADIENT_COLORS[0]}>
							F
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[1]}>
							L
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[2]}>
							O
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[3]}>
							Y
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[4]}>
							D
						</Text>
						<Text color={roleColors.headerStatus}> CLI</Text>
					</Box>
					<Box flexDirection="row" gap={2}>
						<Text color={connectionColor}>{connectionLabel}</Text>
						<Text color={getAgentStatusColor()}>{getAgentStatusLabel()}</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			borderStyle="round"
			borderColor={floydTheme.colors.borderFocus}
			paddingX={1}
			marginBottom={1}
			width="100%"
		>
			<Box width="100%" justifyContent="space-between">
				<Box flexDirection="row" gap={2}>
					{/* FLOYD branding */}
					<Box flexDirection="row">
						<Text bold color={FLOYD_GRADIENT_COLORS[0]}>
							F
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[1]}>
							L
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[2]}>
							O
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[3]}>
							Y
						</Text>
						<Text bold color={FLOYD_GRADIENT_COLORS[4]}>
							D
						</Text>
						<Text color={roleColors.headerStatus}> CLI</Text>
					</Box>

					{/* User info */}
					<Text color={roleColors.userLabel}>{userName}</Text>

					{/* Mode */}
					<Box
						borderStyle="single"
						borderColor={floydTheme.colors.border}
						paddingX={1}
					>
						<Text color={crushTheme.accent.secondary}>{modeLabels[mode]}</Text>
					</Box>
				</Box>

				<Box flexDirection="row" gap={2}>
					{/* CWD (truncated) */}
					<Text color={roleColors.hint} dimColor wrap="truncate">
						{cwd.length > 30 ? '...' + cwd.slice(-27) : cwd}
					</Text>

					{/* Connection status */}
					<Text color={connectionColor}>
						{connectionStatus === 'connected' && '●'}
						{connectionStatus === 'connecting' && <Spinner type="dots" />}
						{connectionStatus === 'disconnected' && '○'}
					</Text>
					<Text color={connectionColor}>{connectionLabel}</Text>

					{/* Agent status */}
					{isThinking && (
						<Text color={getAgentStatusColor()} wrap="truncate">
							<Spinner type="dots" /> {whimsicalPhrase || 'Thinking...'}
						</Text>
					)}
					{!isThinking && (
						<Text color={getAgentStatusColor()} wrap="truncate">{getAgentStatusLabel()}</Text>
					)}
				</Box>
			</Box>
		</Box>
	);
}

// ============================================================================
// TRANSCRIPT PANEL - Now imported from panels/TranscriptPanel.tsx
// ============================================================================

// ============================================================================
// AGENT VISUALIZATION PANEL
// ============================================================================

interface AgentVizPanelProps {
	tasks: Task[];
	toolExecutions: ToolExecution[];
	events: StreamEvent[];
}

function AgentVizPanel({tasks, toolExecutions, events}: AgentVizPanelProps) {
	// Convert tasks to Task type format
	const vizTasks: Task[] = tasks.map(t => ({
		...t,
		status: t.status as TaskStatus,
	}));

	return (
		<Box flexDirection="column" flexGrow={1} gap={1}>
			{/* Task Progress */}
			{tasks.length > 0 && (
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					paddingX={1}
					paddingY={0}
				>
					<Text bold color={crushTheme.accent.tertiary}>
						Tasks
					</Text>
					<Box marginTop={0} flexDirection="column">
						<CompactTaskList tasks={vizTasks} maxItems={3} showIcons />
					</Box>
				</Box>
			)}

			{/* Tool Timeline (compact) */}
			{toolExecutions.length > 0 && (
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					paddingX={1}
					paddingY={0}
				>
					<Text bold color={crushTheme.accent.secondary}>
						Tools
					</Text>
					<Box marginTop={0} height={5}>
						{/* Show recent tool executions as cards */}
						{toolExecutions.slice(-3).map(exec => (
							<Box key={exec.id} flexDirection="row" gap={1} marginBottom={0}>
								<Text
									color={
										exec.status === 'running'
											? crushTheme.status.working
											: exec.status === 'error'
											? crushTheme.status.error
											: exec.status === 'success'
											? crushTheme.status.ready
											: floydTheme.colors.fgMuted
									}
								>
									{exec.status === 'running' && '◉'}
									{exec.status === 'success' && '✓'}
									{exec.status === 'error' && '✕'}
									{exec.status === 'pending' && '○'}
								</Text>
								<Text color={floydTheme.colors.fgBase}>
									{exec.label || exec.toolName}
								</Text>
							</Box>
						))}
					</Box>
				</Box>
			)}

			{/* Event Stream (compact) */}
			{events.length > 0 && (
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					paddingX={1}
					paddingY={0}
					flexGrow={1}
				>
					<Text bold color={crushTheme.accent.info}>
						Events
					</Text>
					<Box marginTop={0} flexDirection="column" height={5}>
						{events.slice(-5).map(event => (
							<Box key={event.id} flexDirection="row" gap={1}>
								<Text
									color={
										event.severity === 'error'
											? crushTheme.status.error
											: event.severity === 'warning'
											? crushTheme.status.warning
											: event.severity === 'success'
											? crushTheme.status.ready
											: floydTheme.colors.fgMuted
									}
								>
									•
								</Text>
								<Text
									color={floydTheme.colors.fgBase}
									dimColor={event.severity !== 'error'}
								>
									{event.message.length > 30
										? event.message.substring(0, 27) + '...'
										: event.message}
								</Text>
							</Box>
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// INPUT AREA COMPONENT
// ============================================================================

interface InputAreaProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	isThinking?: boolean;
	hint?: string;
}

function InputArea({
	value,
	onChange,
	onSubmit,
	isThinking,
	hint,
}: InputAreaProps) {
	return (
		<Box flexDirection="column" width="100%" minWidth={60} marginTop={1}>
			{/* Prompt text above input */}
			<Box marginBottom={1}>
				<Text bold color={crushTheme.accent.secondary}>
					Your turn. Type a message or command.
				</Text>
			</Box>

			{/* Input box - thicker border, more padding */}
			<Box
				borderStyle="double"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				paddingY={1}
				width="100%"
				flexGrow={1}
			>
				<Text color={roleColors.inputPrompt}>❯ </Text>
				<TextInput
					value={value}
					onChange={onChange}
					onSubmit={onSubmit}
					placeholder={isThinking ? 'Please wait...' : '│'}
				/>
			</Box>

			{/* Hint footer */}
			<Box marginTop={1} flexDirection="row" justifyContent="space-between">
				<Text color={roleColors.hint} dimColor>
					{hint || 'Ctrl+P: Commands • Ctrl+/: Help • ?: Toggle Help • Esc: Exit'}
				</Text>
				{isThinking && (
					<Text color={roleColors.thinking}>
						<Spinner type="dots" /> Generating response...
					</Text>
				)}
			</Box>
		</Box>
	);
}

// ============================================================================
// HELP OVERLAY - Now imported from overlays/HelpOverlay.tsx
// ============================================================================

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

/**
 * MainLayout - Primary screen layout for FLOYD CLI
 *
 * Integrates all UI components into a cohesive dashboard layout
 * matching the "LEFT MONITOR (27\")" design specification.
 */
export function MainLayout({
	userName = 'User',
	cwd = process.cwd() || '~',
	connectionStatus = 'connected',
	mode = 'chat',
	messages: propMessages = [],
	agentStatus = 'idle',
	tasks: propTasks = [],
	toolExecutions: propToolExecutions = [],
	events: propEvents = [],
	commands = commonCommands,
	showHelp: showHelpProp = false,
	showPromptLibrary: showPromptLibraryProp = false,
	promptLibraryVaultPath,
	isThinking = false,
	whimsicalPhrase,
	streamingContent = '',
	onSubmit,
	onCommand,
	onExit,
	compact = false,
	showAgentViz = true,
	customHeader,
	customFooter,
	// SESSION panel props
	repoName = 'floyd-cli',
	techStack = 'TypeScript + Ink + MCP',
	gitBranch = 'main',
	gitStatus = 'clean',
	fileCount,
	safetyMode = 'safe',
	toolStates = [],
	workerStates = [],
	// CONTEXT panel props
	currentPlan = [],
	filesTouched = [],
	openDiffs,
	browserState,
	quickActions = [],
}: MainLayoutProps) {
	const [input, setInput] = useState('');
	const [showHelp, setShowHelp] = useState(showHelpProp);
	const [showPromptLibrary, setShowPromptLibrary] = useState(showPromptLibraryProp);
	const {exit: inkExit} = useApp();

	// Use ref to track input state for hotkey checks (prevents race conditions)
	const inputRef = useRef(input);
	const isTypingRef = useRef(false);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const textInputFocusedRef = useRef(false);

	// Sync ref with state
	useEffect(() => {
		inputRef.current = input;
		isTypingRef.current = input.length > 0;
		// TextInput is considered focused if it has any content or was recently used
		textInputFocusedRef.current = input.length > 0;

		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Set typing flag to false after 1000ms of no input (increased from 500ms for safety)
		if (input.length > 0) {
			typingTimeoutRef.current = setTimeout(() => {
				isTypingRef.current = false;
				textInputFocusedRef.current = false;
			}, 1000);
		} else {
			isTypingRef.current = false;
			textInputFocusedRef.current = false;
		}

		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [input]);

	// Sync messages with props (fixes prop reactivity issue)
	const [messages, setMessages] = useState<ChatMessage[]>(propMessages);
	useEffect(() => {
		setMessages(propMessages);
	}, [propMessages]);

	// Handle input submission
	const handleSubmit = useCallback(
		(value: string) => {
			if (!value.trim() || isThinking) return;
			setInput('');
			onSubmit?.(value);
		},
		[isThinking, onSubmit],
	);

	// Define hotkeys for the help overlay
	const hotkeys: Hotkey[] = [
		{
			keys: 'Ctrl+/',
			description: 'Show/hide keyboard shortcuts',
			category: 'Navigation',
			action: () => setShowHelp(false),
		},
		{
			keys: 'Ctrl+P',
			description: 'Open command palette',
			category: 'Navigation',
			action: () => {
				// Command palette is handled by CommandPaletteTrigger
				setShowHelp(false);
			},
		},
		{
			keys: 'Ctrl+M',
			description: 'Toggle monitor dashboard',
			category: 'Navigation',
			action: () => {
				onCommand?.('toggle-monitor');
				setShowHelp(false);
			},
		},
		{
			keys: 'Ctrl+T',
			description: 'Toggle agent visualization',
			category: 'Navigation',
			action: () => {
				onCommand?.('toggle-agent-viz');
				setShowHelp(false);
			},
		},
		{
			keys: 'Esc',
			description: 'Close overlay / Exit',
			category: 'Navigation',
			action: () => {
				setShowHelp(false);
				onExit?.();
			},
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
				onExit?.();
				inkExit();
			},
		},
		{
			keys: '?',
			description: 'Show help (when input is empty)',
			category: 'Navigation',
			action: () => setShowHelp(false),
		},
		{
			keys: 'Ctrl+Shift+P',
			description: 'Open prompt library (Obsidian vault)',
			category: 'Navigation',
			action: () => {
				setShowPromptLibrary(true);
				setShowHelp(false);
			},
		},
		{
			keys: 'Ctrl+Y',
			description: 'Toggle YOLO mode (safety on/off)',
			category: 'System',
			action: () => {
				onCommand?.('toggle-yolo');
				setShowHelp(false);
			},
		},
	];

	// Handle keyboard input
	// Hotkeys only trigger when:
	// 1. Input is empty AND user not actively typing, OR
	// 2. Modifier keys are pressed (Ctrl+/), OR
	// 3. Help overlay is already open
	useInput((_inputKey, key) => {
		// Always allow Esc to work (highest priority)
		if (key.escape) {
			if (showHelp) {
				setShowHelp(false);
			} else {
				onExit?.();
				inkExit();
			}
			return;
		}

		// Ctrl+/ always triggers help overlay (modifier key, safe to trigger anytime)
		if (key.ctrl && _inputKey === '/') {
			setShowHelp(v => !v);
			return;
		}

		// Only process ? hotkey when:
		// - TextInput is NOT focused (no content and not recently typed)
		// - This prevents ? from triggering while typing questions like "What?"
		if (!textInputFocusedRef.current && _inputKey === '?') {
			setShowHelp(v => !v);
			return;
		}

		// Ctrl+Y to toggle YOLO mode
		if (key.ctrl && _inputKey === 'y') {
			onCommand?.('toggle-yolo');
			return;
		}
		// If TextInput has focus (content or recent typing), ignore ? hotkey (let user type normally)
	});

	// Handle command execution
	const handleCommand = useCallback(
		(commandId: string) => {
			onCommand?.(commandId);

			// Built-in command handling
			switch (commandId) {
				case 'exit':
					onExit?.();
					inkExit();
					break;
				case 'help':
					setShowHelp(true);
					break;
			}
		},
		[onCommand, onExit, inkExit],
	);

	// Augment commands with handlers
	const augmentedCommands: CommandItem[] = commands.map(cmd => ({
		...cmd,
		action: () => handleCommand(cmd.id),
	}));

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

	// Render prompt library overlay
	if (showPromptLibrary) {
		return (
			<PromptLibraryOverlay
				vaultPath={promptLibraryVaultPath}
				onClose={() => setShowPromptLibrary(false)}
				onSelect={prompt => {
					// Copy prompt content to input field
					setInput(prompt.content);
					setShowPromptLibrary(false);
				}}
			/>
		);
	}

	return (
		<CommandPaletteTrigger commands={augmentedCommands} initialOpen={false}>
			<Box flexDirection="column" padding={1} width="100%" height="100%">
				{/* ASCII Banner */}
				{!compact && <FloydAsciiBanner />}

				{/* Custom header or Status Bar */}
				{customHeader || (
					<StatusBar
						userName={userName}
						cwd={cwd}
						connectionStatus={connectionStatus}
						mode={mode}
						agentStatus={agentStatus}
						isThinking={isThinking}
						compact={compact}
						whimsicalPhrase={whimsicalPhrase}
					/>
				)}

				{/* Main 3-Column Content Area */}
				<Box flexDirection="row" flexGrow={1} gap={1} overflowY="hidden">
					{/* Left: SESSION Panel */}
					{!compact && (
						<Box width={18} flexShrink={0}>
							<SessionPanel
								repoName={repoName}
								techStack={techStack}
								gitBranch={gitBranch}
								gitStatus={gitStatus}
								fileCount={fileCount}
								safetyMode={safetyMode}
								tools={toolStates}
								workers={workerStates}
								quickActions={quickActions.map(qa => qa.shortcut + ' ' + qa.label)}
								compact={compact}
							/>
						</Box>
					)}

					{/* Center: TRANSCRIPT Panel */}
					<Box flexGrow={1} flexDirection="column">
						<TranscriptPanel
							messages={messages}
							userName={userName}
							toolExecutions={propToolExecutions}
							streamingContent={streamingContent}
							isThinking={isThinking}
						/>
					</Box>

					{/* Right: CONTEXT Panel */}
					{!compact && (
						<Box width={18} flexShrink={0}>
							<ContextPanel
								currentPlan={currentPlan}
								filesTouched={filesTouched}
								openDiffs={openDiffs}
								browserState={browserState}
								quickActions={quickActions}
								compact={compact}
							/>
						</Box>
					)}
				</Box>

				{/* Input Area */}
				{customFooter || (
					<InputArea
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						isThinking={isThinking}
					/>
				)}
			</Box>
		</CommandPaletteTrigger>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactMainLayoutProps {
	/** Minimal display for small terminals */
	messages?: ChatMessage[];
	agentStatus?: ThinkingStatus;
	isThinking?: boolean;
	onSubmit?: (message: string) => void;
	onExit?: () => void;
}

/**
 * CompactMainLayout - Minimal variant for resource-constrained terminals
 */
export function CompactMainLayout({
	messages = [],
	agentStatus: __agentStatus,
	isThinking,
	onSubmit,
	onExit,
}: CompactMainLayoutProps) {
	const [input, setInput] = useState('');
	const {exit: inkExit} = useApp();

	useInput((_inputKey, key) => {
		if (key.escape) {
			onExit?.();
			inkExit();
		}
	});

	return (
		<Box flexDirection="column" padding={1} width="100%">
			{/* Simple header */}
			<Box marginBottom={1} flexDirection="row" gap={2}>
				<Text bold color={FLOYD_GRADIENT_COLORS[0]}>
					FLOYD
				</Text>
				{isThinking && (
					<Text color={roleColors.thinking}>
						<Spinner type="dots" />
					</Text>
				)}
			</Box>

			{/* Messages */}
			<Box flexDirection="column" flexGrow={1} marginBottom={1}>
				{messages.slice(-5).map(msg => (
					<Box key={msg.id} flexDirection="column" marginBottom={0}>
						<Text bold color={getMessageColor(msg.role)}>
							{msg.role === 'user' ? 'You' : 'Floyd'}:
						</Text>
						<Text color={floydTheme.colors.fgBase} dimColor>
							{typeof msg.content === 'string' ? msg.content : '(content)'}
						</Text>
					</Box>
				))}
			</Box>

			{/* Input */}
			<Box
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
			>
				<Text>❯ </Text>
				<TextInput
					value={input}
					onChange={setInput}
					onSubmit={v => {
						setInput('');
						onSubmit?.(v);
					}}
					placeholder="..."
				/>
			</Box>
		</Box>
	);
}

function getMessageColor(role: MessageRole): string {
	switch (role) {
		case 'user':
			return roleColors.userLabel;
		case 'assistant':
			return roleColors.assistantLabel;
		case 'system':
			return roleColors.systemLabel;
		case 'tool':
			return roleColors.toolLabel;
		default:
			return floydTheme.colors.fgBase;
	}
}

export default MainLayout;
