/**
 * 🔒 LOCKED FILE - CORE STABILITY
 * This file has been audited and stabilized by Gemini 4.
 * Please do not modify without explicit instruction and regression testing.
 * Ref: geminireport.md
 */

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

import {useState, useCallback, useRef, useEffect, useMemo, memo, type ReactNode} from 'react';

import {useFloydStore} from '../../store/floyd-store.js';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

// Layout constants
import { LAYOUT } from '../../theme/layout.js';

// Input validation constants
const MAX_INPUT_LENGTH = 5000; // Maximum characters allowed in input
const SUBMIT_DEBOUNCE_MS = 200; // Minimum time between submissions in milliseconds

// UI Components
import {ToolCard} from '../components/ToolCard.js';
import {
	CommandPaletteTrigger,
	type CommandItem,
	commonCommands,
} from '../components/CommandPalette.js';
import {AgentBuilderOverlay, type AgentConfig} from '../components/AgentBuilder.js';
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
import {VoiceInputButton} from '../components/VoiceInputButton.js';
import {useSTT, type UseSTTReturn} from '../../stt/useSTT.js';

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
	streaming?: boolean;
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

	/** Callback when safety mode is toggled */
	onSafetyModeChange?: (mode: 'yolo' | 'ask' | 'plan') => void;

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

	/** Show/hide monitor dashboard */
	showMonitor?: boolean;

	/** Show/hide agent builder */
	showAgentBuilder?: boolean;

	/** Callback to close monitor dashboard */
	onCloseMonitor?: () => void;

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
	safetyMode?: 'yolo' | 'ask' | 'plan';

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
 * Render FLOYD ASCII banner with gradient colors
 */
const FloydAsciiBanner = memo(function FloydAsciiBanner() {
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
});

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

// Memoize StatusBar to prevent unnecessary re-renders
const StatusBar = memo(function StatusBar({
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
			paddingY={0}
			marginBottom={0}
			width="100%"
		>
			<Box width="100%" justifyContent="space-between" alignItems="center">
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
				<Box flexDirection="row" gap={1}>
					<Text bold color={modeLabels[mode]}>{modeLabels[mode]}</Text>
					<Text color={connectionColor}>{connectionLabel}</Text>
					<Text color={getAgentStatusColor()}>{getAgentStatusLabel()}</Text>
				</Box>
			</Box>
		</Box>
	);
});

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
	onVoiceInput?: () => void;
	isRecording?: boolean;
	isTranscribing?: boolean; 
	isWideScreen?: boolean;
	isNarrowScreen?: boolean;
}

function InputArea({
	value,
	onChange,
	onSubmit,
	isThinking,
	hint,
	onVoiceInput,
	isRecording,
	isTranscribing = false, 
	isWideScreen = false,
	isNarrowScreen = false,
}: InputAreaProps) {
	return (
		<Box flexDirection="column" width="100%" minWidth={isNarrowScreen ? 60 : 80} marginTop={0} paddingX={0}>
			{/* Input box - full width, 5 lines tall */}
			<Box
				borderStyle="double"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				paddingY={1}
				width="100%"
				height={5}
			>
				<Text color={roleColors.inputPrompt}>❯ </Text>
				<TextInput
					value={value}
					onChange={onChange}
					onSubmit={onSubmit}
					placeholder={isThinking ? 'Please wait...' : 'Type a message...'}
				/>
			</Box>

			{/* Compact hint footer - single line */}
			<Box marginTop={0} flexDirection="row" justifyContent="space-between" paddingX={1}>
				<Text color={roleColors.hint} dimColor>
					{isNarrowScreen ? 'Ctrl+P: Cmds • Ctrl+/: Help • Esc: Exit' : 'Ctrl+P: Commands • Ctrl+/: Help • Esc: Exit'}
				</Text>
				{isThinking && (
					<Text color={roleColors.thinking}>
						<Spinner type="dots" />
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
	safetyMode = 'ask', // Default to ASK mode for safety
	onSafetyModeChange,
	messages: propMessages = [],
	agentStatus = 'idle',
	tasks: propTasks = [],
	toolExecutions: propToolExecutions = [],
	events: propEvents = [],
	commands = commonCommands,
	showHelp: showHelpProp = false,
	showPromptLibrary: showPromptLibraryProp = false,
	showMonitor: showMonitorProp = false,
	showAgentBuilder: showAgentBuilderProp = false,
	onCloseMonitor,
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
	// showHelp state from centralized store
	const showHelp = useFloydStore(state => state.showHelp);
	const setShowHelp = useCallback((value: boolean) => {
		useFloydStore.getState().setOverlay('showHelp', value);
	}, []);
	const toggleHelp = useCallback(() => {
		useFloydStore.getState().toggleOverlay('showHelp');
	}, []);

	// Overlay state from centralized store (consolidated)
	// NOTE: Use stable selectors for values, useCallback for actions to prevent infinite re-render loops
	const showPromptLibrary = useFloydStore(state => state.showPromptLibrary);
	const showAgentBuilder = useFloydStore(state => state.showAgentBuilder);
	const setShowPromptLibrary = useCallback((value: boolean) => {
		useFloydStore.getState().setOverlay('showPromptLibrary', value);
	}, []);
	const setShowAgentBuilder = useCallback((value: boolean) => {
		useFloydStore.getState().setOverlay('showAgentBuilder', value);
	}, []);
	const togglePromptLibrary = useCallback(() => {
		useFloydStore.getState().toggleOverlay('showPromptLibrary');
	}, []);
	const toggleAgentBuilder = useCallback(() => {
		useFloydStore.getState().toggleOverlay('showAgentBuilder');
	}, []);

	const [currentSafetyMode, setCurrentSafetyMode] = useState<'yolo' | 'ask' | 'plan'>(safetyMode || 'ask');
	const [zenMode, setZenMode] = useState(false);
	const {exit: inkExit} = useApp();

	// Screen size state for responsive layout (handles terminal resize)
	const [terminalWidth, setTerminalWidth] = useState(process.stdout.columns || 80);
	const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 24);

	// Listen for terminal resize events (debounced to prevent jitter)
	useEffect(() => {
		let resizeTimeout: NodeJS.Timeout | null = null;
		const DEBOUNCE_MS = 100;

		const handleResize = () => {
			// Clear any pending resize handler
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}

			// Debounce: only update after no resize events for DEBOUNCE_MS
			resizeTimeout = setTimeout(() => {
				setTerminalWidth(process.stdout.columns || 80);
				setTerminalHeight(process.stdout.rows || 24);
			}, DEBOUNCE_MS);
		};

		// Listen to the resize event
		process.stdout.on('resize', handleResize);

		// Clean up the listener and any pending timeout on unmount
		return () => {
			process.stdout.off('resize', handleResize);
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
		};
	}, []);

	// Responsive layout calculations based on terminal size
	// Memoized to prevent recalculation on every render
	const layoutConfig = useMemo(() => {
		const isWideScreen = terminalWidth >= 120;
		const isUltraWideScreen = terminalWidth >= 160;
		const isNarrowScreen = terminalWidth < 100;
		const isVeryNarrowScreen = terminalWidth < 80;

		// Calculate available height for content panels
		// CRITICAL: Ensure layout NEVER exceeds terminal height
		// Use centralized layout constants for consistent height calculations
		const hasBanner = !isVeryNarrowScreen && !isNarrowScreen;
		const transcriptHeight = LAYOUT.calculateAvailableHeight(
			terminalHeight,
			hasBanner,
			isNarrowScreen || isVeryNarrowScreen
		);

		// Panel widths - responsive to terminal size
		const sessionPanelWidth = isVeryNarrowScreen ? 0 : isNarrowScreen ? 16 : isUltraWideScreen ? 24 : 20;
		const contextPanelWidth = isVeryNarrowScreen ? 0 : isNarrowScreen ? 0 : isUltraWideScreen ? 24 : 20;

		// Show panels based on available width
		const showSessionPanel = !isVeryNarrowScreen && !compact && !zenMode;
		const showContextPanel = !isNarrowScreen && !isVeryNarrowScreen && !compact && !zenMode;

		return {
			isWideScreen,
			isUltraWideScreen,
			isNarrowScreen,
			isVeryNarrowScreen,
			hasBanner,
			transcriptHeight,
			sessionPanelWidth,
			contextPanelWidth,
			showSessionPanel,
			showContextPanel,
		};
	}, [terminalWidth, terminalHeight, compact, zenMode]);

	// Destructure for cleaner code
	const {
		isWideScreen,
		isUltraWideScreen,
		isNarrowScreen,
		isVeryNarrowScreen,
		hasBanner,
		transcriptHeight,
		sessionPanelWidth,
		contextPanelWidth,
		showSessionPanel,
		showContextPanel,
	} = layoutConfig;

	// STT Integration
	const {
		isRecording,
		isProcessing: isTranscribing,
		startRecording,
		stopRecording,
		error: sttError,
	}: UseSTTReturn = useSTT({
		onTranscription: (text) => {
			setInput(prev => prev + (prev ? ' ' : '') + text);
		},
		onError: (err) => {
			// You might want to show this error in the UI
			// For now, it's available in sttError
		},
	});

	const handleVoiceInput = useCallback(async () => {
		if (isThinking) return;
		
		if (isRecording) {
			await stopRecording();
		} else {
			await startRecording();
		}
	}, [isThinking, isRecording, startRecording, stopRecording]);

	// Use ref to track input state for hotkey checks (prevents race conditions)
	const inputRef = useRef(input);
	const isTypingRef = useRef(false);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const textInputFocusedRef = useRef(false);
	const lastSubmitTimeRef = useRef<number>(0);

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

		// Set typing flag to false after 200ms of no input (reduced from 1000ms)
		// This allows the ? hotkey to work more quickly after typing stops
		if (input.length > 0) {
			typingTimeoutRef.current = setTimeout(() => {
				isTypingRef.current = false;
				textInputFocusedRef.current = false;
			}, 200);
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

	// Use propMessages directly - no local state sync needed
	// This prevents infinite re-render loop when store updates during streaming
	const messages = propMessages;

	// Handle input submission
	const handleSubmit = useCallback(
		(value: string) => {
			const now = Date.now();

			// Debounce: Prevent rapid submissions within SUBMIT_DEBOUNCE_MS
			if (now - lastSubmitTimeRef.current < SUBMIT_DEBOUNCE_MS) {
				return;
			}

			// Rate limit check: Prevent submission if currently rate limited
			if (useFloydStore.getState().isRateLimited()) {
				return;
			}

			// Validation: Check for empty input
			if (!value.trim()) {
				return;
			}

  // Scroll handling - FIXED: Auto-scroll to show NEWEST at TOP, scroll content UP away from input
  // Content grows UP from input line, never DOWN into it
  const handleScroll = useCallback((newScrollTop: number) => {
    const minScroll = 0;
    const maxScroll = Math.max(0, estimatedTotalHeight - viewportHeight);
    const clamped = Math.max(minScroll, Math.min(maxScroll, newScrollTop));
    setScrollTop(clamped);
  }, [estimatedTotalHeight, viewportHeight]);
        setScrollOffset((prev) => Math.min(minScroll, prev + scrollSpeed));
      }
    },
    [containerDimensions, scrollSpeed]
  );
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
			keys: 'Shift+Tab',
			description: 'Cycle safety mode (YOLO → ASK → PLAN)',
			category: 'System',
			action: () => {
				// Handled by useInput handler
				setShowHelp(false);
			},
		},
		{
			keys: 'Ctrl+Z',
			description: 'Toggle Zen Mode (Hide/Show sidebars)',
			category: 'View',
			action: () => {
				setZenMode(v => !v);
				setShowHelp(false);
			},
		},
	];

	// Handle keyboard input
	// Hotkeys only trigger when:
	// 1. Input is empty AND user not actively typing, OR
	// 2. Modifier keys are pressed (Ctrl+/), OR
	// 3. Help overlay is already open

	// Track all overlay states in a single ref to avoid closure staleness in useInput
	const overlayStateRef = useRef({
		showHelp,
		showPromptLibrary,
		showAgentBuilder,
		showMonitorProp,
	});
	useEffect(() => {
		overlayStateRef.current = {
			showHelp,
			showPromptLibrary,
			showAgentBuilder,
			showMonitorProp,
		};
	}, [showHelp, showPromptLibrary, showAgentBuilder, showMonitorProp]);

	useInput((_inputKey, key) => {
		// Ctrl+Q DEFINITIVE QUIT - Always first check, this is THE way to exit floyd-cli
		if (key.ctrl && (_inputKey === 'q' || _inputKey === 'Q')) {
			onExit?.();
			inkExit();
			// Hard fallback - ensure process terminates even if inkExit doesn't work
			setTimeout(() => process.exit(0), 50);
			return;
		}

		// Ctrl+C HARD EXIT - Failsafe that also works
		if (key.ctrl && (_inputKey === 'c' || _inputKey === 'C')) {
			onExit?.();
			inkExit();
			// Hard fallback - ensure process terminates even if inkExit doesn't work
			setTimeout(() => process.exit(0), 50);
			return;
		}


		// Esc key exits the CLI when no overlays are open
		// (Overlays handle their own Esc key in their own useInput handlers)
		if (key.escape) {
			onExit?.();
			inkExit();
			return;
		}

		// Ctrl+/ toggles help overlay
		if (key.ctrl && _inputKey === '/') {
			toggleHelp();
			return;
		}

		// Ctrl+P opens command palette (handled by CommandPaletteTrigger)
		if (key.ctrl && _inputKey === 'p') {
			return; // Let CommandPaletteTrigger handle it
		}

		// ? hotkey ONLY triggers when input bar is COMPLETELY EMPTY
		// This prevents triggering when typing sentences ending with "?" like "What is this?"
		// Check: input must be empty (actual state value, not a timeout-based ref)
		if (input.length === 0 && _inputKey === '?') {
			toggleHelp();
			return;
		}

		// CRITICAL FIX: When ANY overlay is open, return early to let the overlay handle its own input.
		// MainLayout's useInput runs even when conditional rendering shows only an overlay,
		// so we must get out of the way and not interfere with the overlay's own useInput handler.
		// This fixes the bug where help menu was stuck open with no working exit keys.
		// Use ref to get current values, avoiding closure staleness.
		const {
			showHelp: helpOpen,
			showPromptLibrary: promptLibOpen,
			showAgentBuilder: agentBuilderOpen,
			showMonitorProp: monitorOpen,
		} = overlayStateRef.current;

		if (helpOpen || promptLibOpen || agentBuilderOpen || monitorOpen) {
			return; // Let the active overlay handle keyboard input
		}


		// Shift+Tab to cycle through safety modes: YOLO → ASK → PLAN → YOLO
		if (key.tab && key.shift) {
			const modes: Array<'yolo' | 'ask' | 'plan'> = ['yolo', 'ask', 'plan'];
			const currentIndex = modes.indexOf(currentSafetyMode);
			const nextIndex = (currentIndex + 1) % modes.length;
			const newMode = modes[nextIndex];

			setCurrentSafetyMode(newMode);
			onSafetyModeChange?.(newMode);
			onCommand?.('safety-mode-changed');
			return;
		}

		// Ctrl+M to toggle monitor dashboard
		if (key.ctrl && _inputKey === 'm') {
			onCommand?.('toggle-monitor');
			return;
		}

		// Ctrl+T to toggle agent visualization
		if (key.ctrl && _inputKey === 't') {
			onCommand?.('toggle-agent-viz');
			return;
		}

		// Ctrl+R to start voice input
		if (key.ctrl && _inputKey === 'r') {
			handleVoiceInput();
			return;
		}

		// Ctrl+Z to toggle Zen Mode
		if (key.ctrl && _inputKey === 'z') {
			setZenMode(v => !v);
			return;
		}

		// Ctrl+Shift+P to open prompt library
		if (key.ctrl && key.shift && _inputKey === 'p') {
			togglePromptLibrary();
			return;
		}
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
				case 'agent':
					// Launch Agent Builder
					setShowAgentBuilder(true);
					break;
			}
		},
		[onCommand, onExit, inkExit],
	);

	// Commands are already augmented in app.tsx - use them directly to avoid duplicate augmentation
	// which would cause unnecessary re-renders. The augmentation happens once in app.tsx
	// with the proper handleCommand callback chain.
	const augmentedCommands = commands;

	// Memoized quickActions labels for SessionPanel
	const quickActionLabels = useMemo(
		() => quickActions.map(qa => qa.shortcut + ' ' + qa.label),
		[quickActions],
	);

	// Memoized recent messages for TranscriptPanel
	const recentMessages = useMemo(
		() => messages.slice(-20),
		[messages],
	);

	// Memoized command selection callback
	const handleCommandSelected = useCallback(
		(commandText: string) => {
			setInput(commandText);
		},
		[],
	);

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

	// Render Agent Builder overlay
	if (showAgentBuilder) {
		return (
			<AgentBuilderOverlay
				isOpen={showAgentBuilder}
				onCreate={(config) => {
					// Handle agent creation
					setShowAgentBuilder(false);
				}}
				onClose={() => setShowAgentBuilder(false)}
			/>
		);
	}

	return (
		<CommandPaletteTrigger
			commands={augmentedCommands}
			initialOpen={false}
			openKeys={['/']}  // Add / as a trigger key
		>
			<Box flexDirection="column" padding={0} width="100%">
				{/* ASCII Banner - hide on narrow screens */}
				{!compact && !isNarrowScreen && <FloydAsciiBanner />}

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

				{/* Main 3-Column Content Area - responsive layout */}
				<Box flexDirection="row" flexGrow={1} gap={isWideScreen ? 2 : 1} paddingX={isNarrowScreen ? 0 : 1} overflowY="hidden">
					{/* Left: SESSION Panel - hidden on very narrow screens */}
					{showSessionPanel && (
						<Box width={sessionPanelWidth} flexShrink={0} marginRight={showSessionPanel && showContextPanel ? 1 : 0}>
							<SessionPanel
								repoName={repoName}
								techStack={techStack}
								gitBranch={gitBranch}
								gitStatus={gitStatus}
								fileCount={fileCount}
								safetyMode={safetyMode}
								tools={toolStates}
								workers={workerStates}
								quickActions={quickActionLabels}
								compact={compact || !isWideScreen}
							/>
						</Box>
					)}

					{/* Center: TRANSCRIPT Panel - always shown, fills available space */}
					<Box flexGrow={1} flexDirection="column" paddingX={isVeryNarrowScreen ? 1 : isNarrowScreen ? 1 : 2}>
						<TranscriptPanel
							messages={recentMessages}
							userName={userName}
							toolExecutions={propToolExecutions}
							streamingContent={streamingContent}
							isThinking={isThinking}
							height={transcriptHeight}
						/>
					</Box>

					{/* Right: CONTEXT Panel - hidden on narrow screens */}
					{showContextPanel && (
						<Box width={contextPanelWidth} flexShrink={0} marginLeft={showSessionPanel && showContextPanel ? 1 : 0}>
							<ContextPanel
								currentPlan={currentPlan}
								filesTouched={filesTouched}
								openDiffs={openDiffs}
								browserState={browserState}
								quickActions={quickActions}
								compact={compact || !isUltraWideScreen}
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
						onVoiceInput={handleVoiceInput}
						isRecording={isRecording}
						isTranscribing={isTranscribing}
						isWideScreen={isWideScreen}
						isNarrowScreen={isNarrowScreen}
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
	const lastSubmitTimeRef = useRef<number>(0);

	// Handle input submission with validation
	const handleSubmit = useCallback(
		(value: string) => {
			const now = Date.now();

			// Debounce: Prevent rapid submissions within SUBMIT_DEBOUNCE_MS
			if (now - lastSubmitTimeRef.current < SUBMIT_DEBOUNCE_MS) {
				return;
			}

			// Rate limit check: Prevent submission if currently rate limited
			if (useFloydStore.getState().isRateLimited()) {
				return;
			}

			// Validation: Check for empty input
			if (!value.trim()) {
				return;
			}

			// Validation: Check for maximum length
			if (value.length > MAX_INPUT_LENGTH) {
				return;
			}

			// Prevent submission if agent is thinking
			if (isThinking) {
				return;
			}

			// Update last submission time
			lastSubmitTimeRef.current = now;

			// Record the API call (will be decremented from remaining)
			useFloydStore.getState().recordCall();

			// Clear input and submit
			setInput('');
			onSubmit?.(value);
		},
		[isThinking, onSubmit],
	);

	useInput((_inputKey, key) => {
		// Ctrl+Q DEFINITIVE QUIT - Always first check, this is THE way to exit floyd-cli
		if (key.ctrl && (_inputKey === 'q' || _inputKey === 'Q')) {
			onExit?.();
			inkExit();
			// Hard fallback - ensure process terminates even if inkExit doesn't work
			setTimeout(() => process.exit(0), 50);
			return;
		}

		// Ctrl+C HARD EXIT - Failsafe that also works
		if (key.ctrl && (_inputKey === 'c' || _inputKey === 'C')) {
			onExit?.();
			inkExit();
			// Hard fallback - ensure process terminates even if inkExit doesn't work
			setTimeout(() => process.exit(0), 50);
			return;
		}

		// Esc also exits
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
					onChange={(newValue) => {
						// Enforce maxLength by truncating if necessary
						if (newValue.length > MAX_INPUT_LENGTH) {
							setInput(newValue.slice(0, MAX_INPUT_LENGTH));
						} else {
							setInput(newValue);
						}
					}}
					onSubmit={handleSubmit}
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
