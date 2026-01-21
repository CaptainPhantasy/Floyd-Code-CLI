/*
 * 🔒 LOCKED FILE - CORE STABILITY
 * This file has been audited and stabilized by Gemini 4.
 * Please do not modify without explicit instruction and regression testing.
 * Ref: geminireport.md
 */
import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {AgentEngine, MCPClientManager, PermissionManager} from 'floyd-agent-core';
import {SessionManager} from './store/session-store.js';
import {ConfigLoader} from './utils/config.js';
import {BUILTIN_SERVERS} from './config/builtin-servers.js';
import {StreamProcessor} from './streaming/stream-engine.js';
import {StreamTagParser} from './streaming/tag-parser.js';
import {getRandomWhimsicalPhrase} from './utils/whimsical-phrases.js';
import {floydTheme, floydRoles} from './theme/crush-theme.js';
import {
	MainLayout,
	MonitorLayout,
	type ChatMessage,
	type MonitorData,
} from './ui/layouts/index.js';
import {useFloydStore, type ConversationMessage} from './store/floyd-store.js';
import {ErrorBoundary} from './ui/components/ErrorBoundary.js';
import {
	commonCommands,
	type CommandItem,
} from './ui/components/CommandPalette.js';
import {runDockCommand, parseDockArgs} from './commands/dock.js';
import type {ThinkingStatus} from './ui/agent/ThinkingStream.js';
import type {Task} from './ui/agent/TaskChecklist.js';
import type {ToolExecution} from './ui/monitor/ToolTimeline.js';
import type {StreamEvent} from './ui/monitor/EventStream.js';
import dotenv from 'dotenv';
import {resolve} from 'node:path';

// Load environment variables from multiple possible locations
const envPaths = [
  '.env.local', // Project-specific local env (git-ignored)
  '.env', // Project env
  `${process.env.HOME}/.floyd/.env.local`, // Global user env
];

for (const envPath of envPaths) {
  try {
    const result = dotenv.config({path: envPath});
    if (result.error) {
      // Silently ignore ENOENT (file not found) errors
      // Log other errors
    } else if (Object.keys(result.parsed ?? {}).length > 0) {
      // Environment loaded successfully
    }
  } catch {
    // Ignore errors, try next path
  }
}

type Message = {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string | any[];
};

type AppProps = {
	name?: string;
	chrome?: boolean;
};

// ============================================================================
// MESSAGE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert internal Message to ChatMessage for MainLayout
 */
function toChatMessage(msg: Message | ConversationMessage): ChatMessage {
	return {
		id: 'timestamp' in msg ? msg.id : `${Date.now()}-${Math.random()}`,
		role: msg.role as ChatMessage['role'],
		content:
			typeof msg.content === 'string'
				? msg.content
				: JSON.stringify(msg.content),
		timestamp: 'timestamp' in msg ? new Date(msg.timestamp) : new Date(),
		streaming: 'streaming' in msg ? (msg as ConversationMessage).streaming : false,
	};
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOYD ASCII ART BANNER
// ═══════════════════════════════════════════════════════════════════════════════
// Note: The ASCII banner is now rendered by MainLayout component.
// The original banner constants are preserved here for reference.
// Source: /Volumes/Storage/FLOYD_CLI/ASCII/FLOYD_CLI_ascii (1).txt
// Color scheme: #=pink, :=blue, .=gray, '=light gray
// ═══════════════════════════════════════════════════════════════════════════════

// ============================================================================
// APP COMPONENT WITH MAIN LAYOUT INTEGRATION
// ============================================================================

/**
 * Floyd CLI App Component
 *
 * Integrates the MainLayout with AgentEngine, SessionManager, and Zustand store.
 * Provides streaming responses, command palette support, and full UI functionality.
 */
export default function App({name = 'User', chrome = false}: AppProps) {
	// Local state
	const [isThinking, setIsThinking] = useState(false);
	const [agentStatus, setAgentStatus] = useState<ThinkingStatus>('idle');
	const [currentWhimsicalPhrase, setCurrentWhimsicalPhrase] = useState<string | null>(null);
	// Removed showHelp local state - using Zustand store
	// Removed localMessages - using Zustand store as single source of truth

	// Agent visualization state
	const [tasks, setTasks] = useState<Task[]>([]);
	const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
	const [events, setEvents] = useState<StreamEvent[]>([]);
	// Removed showMonitor local state - using Zustand store
	const [showAgentViz, setShowAgentViz] = useState(false);

	// Refs for engine instances
	const engineRef = useRef<AgentEngine | null>(null);

	// Zustand store selectors
	const storeMessages = useFloydStore(state => state.messages);
	const streamingContent = useFloydStore(state => state.streamingContent);
	const addMessage = useFloydStore(state => state.addMessage);
	const updateMessage = useFloydStore(state => state.updateMessage);
	const appendStreamingContent = useFloydStore(
		state => state.appendStreamingContent,
	);
	const clearStreamingContent = useFloydStore(
		state => state.clearStreamingContent,
	);
	const setAgentStoreStatus = useFloydStore(state => state.setStatus);
	const safetyMode = useFloydStore(state => state.safetyMode);
	const toggleSafetyMode = useFloydStore(state => state.toggleSafetyMode);

	// Overlay state from store (consolidated)
	// NOTE: Use stable selectors for values, useCallback for actions to prevent infinite re-render loops
	const showHelp = useFloydStore(state => state.showHelp);
	const showMonitor = useFloydStore(state => state.showMonitor);
	const setShowHelp = useCallback((value: boolean) => {
		useFloydStore.getState().setOverlay('showHelp', value);
	}, []);
	const setShowMonitor = useCallback((value: boolean) => {
		useFloydStore.getState().setOverlay('showMonitor', value);
	}, []);
	const toggleHelp = useCallback(() => {
		useFloydStore.getState().toggleOverlay('showHelp');
	}, []);
	const toggleMonitor = useCallback(() => {
		useFloydStore.getState().toggleOverlay('showMonitor');
	}, []);
	
	const {exit} = useApp();

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	useEffect(() => {
		const init = async () => {
			try {
				// Initialize shared MCPClientManager with built-in servers
				const mcpManager = new MCPClientManager(BUILTIN_SERVERS);
				
				if (chrome) {
					await mcpManager.startServer(3000); // Default port for Chrome bridge
				}

				const sessionManager = new SessionManager();
				const config = await ConfigLoader.loadProjectConfig();
				const permissionManager = new PermissionManager(config.allowedTools);

				// Start built-in MCP servers (patch, runner, git, cache)
				await mcpManager.startBuiltinServers();

				// Connect to MCP servers defined in .floyd/mcp.json
				await mcpManager.connectExternalServers(process.cwd());

				const apiKey = process.env['GLM_API_KEY'] || 'dummy-key';
				const apiEndpoint = process.env['GLM_ENDPOINT'] || 'https://api.z.ai/api/anthropic';
				const apiModel = process.env['GLM_MODEL'] || 'claude-sonnet-4-20250514';

				if (process.env['GLM_API_KEY'] === undefined) {
					// We warn but continue with dummy for UI testing if requested
					// or we could block.
				}

			engineRef.current = new AgentEngine(
				{
					apiKey,
					baseURL: apiEndpoint,
					model: apiModel,
					enableThinkingMode: true,
					temperature: 0.2,
				},
				mcpManager,
				sessionManager,
				permissionManager,
				config,
			);
				await engineRef.current.initSession(process.cwd());

				setAgentStatus('idle');

				// Initialize Zustand store session
				useFloydStore
					.getState()
					.initSession('floyd-cli', 'Floyd CLI', process.cwd());

				// Initial greeting - add to both local state and store
				const greeting: ConversationMessage = {
					id: `init-${Date.now()}`,
					role: 'assistant',
					content:
						'Hello! I am Floyd (GLM-4 Powered). How can I help you today?',
					timestamp: Date.now(),
				};
				addMessage(greeting);
				// Removed setLocalMessages - UI reads from Zustand store
			} catch {
				setAgentStatus('error');
			}
		};
		init();
	}, [chrome, addMessage]);

	// ============================================================================
	// MESSAGE SUBMISSION
	// ============================================================================

	const handleSubmit = useCallback(
		async (value: string) => {
			if (!value.trim() || isThinking) return;

			// Check for dock commands (e.g., ":dock btop" or ":btop")
			const dockArgs = parseDockArgs(value.trim().split(/\s+/));
			if (dockArgs) {
				try {
					const result = await runDockCommand(dockArgs);
					if (result.success) {
						// Add feedback message
						const dockMsg: ConversationMessage = {
							id: `dock-${Date.now()}`,
							role: 'system',
							content: `⚓ ${result.message}`,
							timestamp: Date.now(),
						};
						addMessage(dockMsg);
					} else {
						// Add error message
						const errorMsg: ConversationMessage = {
							id: `dock-error-${Date.now()}`,
							role: 'system',
							content: `⚠️  ${result.message}`,
							timestamp: Date.now(),
						};
						addMessage(errorMsg);
					}
				} catch (error) {
					const errorMsg: ConversationMessage = {
						id: `dock-error-${Date.now()}`,
						role: 'system',
						content: `⚠️  Dock error: ${error instanceof Error ? error.message : String(error)}`,
						timestamp: Date.now(),
					};
					addMessage(errorMsg);
				}
				return;
			}

			if (!engineRef.current) return;

			// Add user message
			const userMsg: Message = {role: 'user', content: value};
			const userMsgStore: ConversationMessage = {
				id: `user-${Date.now()}`,
				role: 'user',
				content: value,
				timestamp: Date.now(),
			};

			// Single source of truth - only update store, not localMessages
			addMessage(userMsgStore);

			setIsThinking(true);
			setAgentStatus('thinking');
			setAgentStoreStatus('thinking');

			// Show whimsical phrase while thinking (stored for status bar, NOT added to conversation)
			const whimsicalPhrase = getRandomWhimsicalPhrase();
			setCurrentWhimsicalPhrase(whimsicalPhrase.text);
			setAgentStoreStatus('thinking');

			try {
				const generator = engineRef.current.sendMessage(value);
				let currentAssistantMessage = '';

				// Add placeholder for assistant message
				const assistantMsgId = `assistant-${Date.now()}`;
				const assistantPlaceholder: ConversationMessage = {
					id: assistantMsgId,
					role: 'assistant',
					content: '',
					timestamp: Date.now(),
					streaming: true,
				};
				addMessage(assistantPlaceholder);
				// Removed setLocalMessages - UI reads from Zustand store via messages prop

				clearStreamingContent();

				// Create stream processor with throttling
				const streamProcessor = new StreamProcessor({
					rateLimitEnabled: true,
					maxTokensPerSecond: 75, // Increased from 25 for faster, more responsive display
					flushInterval: 50,
					maxBufferSize: 4096,
				});

				// Create tag parser for thinking blocks
				const tagParser = new StreamTagParser(['thinking']);

				// DEFINE THESE VARIABLES HERE (Fixes Error 1 & 2)
				let inThinkingBlock = false;

				// Set up stream processor event handlers
				streamProcessor.on('data', (data: string) => {
					currentAssistantMessage += data;
					appendStreamingContent(data);

					// Update the existing assistant message in store (don't add new ones)
					// Single source of truth - UI reads from Zustand store
					updateMessage(assistantMsgId, {
						content: currentAssistantMessage,
						streaming: true,
					});
				});

				streamProcessor.on('end', () => {
					// Stream complete
				});

				streamProcessor.on('error', (error: Error) => {
					throw error;
				});

				// Process generator through stream processor
				for await (const chunk of generator) {
					// Process chunk through tag parser to handle split tokens
					for (const event of tagParser.process(chunk)) {
						if (event.type === 'tag_open' && event.tagName === 'thinking') {
							inThinkingBlock = true;
							setAgentStatus('thinking');
							setAgentStoreStatus('thinking');
							// Show new whimsical phrase for this thinking block
							const newPhrase = getRandomWhimsicalPhrase();
							setCurrentWhimsicalPhrase(newPhrase.text);
							continue;
						}

						if (event.type === 'tag_close' && event.tagName === 'thinking') {
							inThinkingBlock = false;
							// Add pause after thinking completes (800ms)
							await new Promise(resolve => setTimeout(resolve, 800));
							setAgentStatus('streaming');
							setAgentStoreStatus('streaming');
							setCurrentWhimsicalPhrase(null); // Clear phrase when streaming starts
							continue;
						}

						if (event.type === 'text' && event.content) {
							// Handle thinking content separately
							if (inThinkingBlock) {
								// Thinking content is already dimmed by orchestrator
								// Just update thinking state, don't add to main message
								continue;
							}

							// Regular content - process through stream processor for throttling
							streamProcessor.processChunk({
								text: event.content,
								type: 'text',
							});
						}
					}
				}

				// Complete the stream processor
				streamProcessor.complete();

				// Finalize the message
				clearStreamingContent();
				addMessage({
					id: assistantMsgId,
					role: 'assistant',
					content: currentAssistantMessage,
					timestamp: Date.now(),
					streaming: false,
				});
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorMsg: ConversationMessage = {
					id: `error-${Date.now()}`,
					role: 'assistant',
					content: `Error: ${errorMessage}`,
					timestamp: Date.now(),
				};
				addMessage(errorMsg);
				// Removed setLocalMessages - UI reads from Zustand store
				setAgentStatus('error');
			} finally {
				setIsThinking(false);
				setAgentStatus('idle');
				setAgentStoreStatus('idle');
				setCurrentWhimsicalPhrase(null);
			}
		},
		[
			isThinking,
			addMessage,
			updateMessage,
			appendStreamingContent,
			clearStreamingContent,
			setAgentStoreStatus,
		],
	);

	// ============================================================================
	// KEYBOARD INPUT HANDLING
	// ============================================================================

	useInput((inputKey, key) => {
		// Note: Most keyboard shortcuts are now handled by MainLayout
		// MainLayout has access to input state and overlay states for proper context

		// Ctrl+M to toggle monitor dashboard
		if (inputKey === 'm' && key.ctrl) {
			toggleMonitor();
			return;
		}

		// Ctrl+T to toggle agent visualization
		if (inputKey === 't' && key.ctrl) {
			setShowAgentViz(value => !value);
			return;
		}

		// Ctrl+Y to toggle YOLO mode
		if (inputKey === 'y' && key.ctrl) {
			toggleSafetyMode();
			return;
		}
	});

	// ============================================================================
	// COMMAND PALETTE HANDLERS
	// ============================================================================

	const handleCommand = useCallback(
		(commandId: string) => {
			switch (commandId) {
				case 'exit':
					exit();
					break;
				case 'new-task':
					setTasks([]);
					setToolExecutions([]);
					setEvents([]);
					useFloydStore.getState().clearMessages();
					break;
				case 'toggle-monitor':
					toggleMonitor();
					break;
				case 'toggle-agent-viz':
					setShowAgentViz(v => !v);
					break;
				case 'help':
					// Toggle help overlay using store state
					toggleHelp();
					break;
				case 'agent':
					// Launch Agent Builder overlay
					useFloydStore.getState().setOverlay('showAgentBuilder', true);
					break;
				case 'safety-mode-changed':
					// Safety mode changed via Shift+Tab in MainLayout
					break;
				case 'dock':
					// Dock command - handled separately via input parsing
					break;
			}
		},
		[exit, toggleHelp],
	);

	// Handle safety mode changes from MainLayout
	const handleSafetyModeChange = useCallback((mode: 'yolo' | 'ask' | 'plan') => {
		useFloydStore.getState().setSafetyMode(mode);
	}, []);

	// Augment common commands with additional Floyd-specific commands
	// Memoized to prevent infinite re-render loop in MainLayout
	const augmentedCommands: CommandItem[] = useMemo(
		() => [
			...commonCommands,
			{
				id: 'toggle-monitor',
				label: 'Toggle Monitor',
				icon: '◐',
				action: () => toggleMonitor(),
			},
			{
				id: 'toggle-agent-viz',
				label: 'Toggle Agent Viz',
				icon: '◉',
				action: () => setShowAgentViz(v => !v),
			},
			{
				id: 'dock',
				label: 'Dock Command',
				description: 'Execute command in TMUX monitor pane (e.g., :dock btop)',
				icon: '⚓',
				action: async () => {
					// Dock commands are handled via text input parsing
					// User types ":dock <command>" in the input field
					// This command entry is for documentation/help purposes
				},
			},
		].map(cmd => ({...cmd, action: () => handleCommand(cmd.id)})),
		[commonCommands, handleCommand, toggleMonitor]
	);

	// ============================================================================
	// COMBINE MESSAGES FOR DISPLAY
	// ============================================================================

	// Use store messages as single source of truth (convert to ChatMessage format)
	// Memoized to prevent infinite re-render loop in MainLayout
	const allMessages: ChatMessage[] = useMemo(
		() => storeMessages.map(toChatMessage),
		[storeMessages]
	);

	// ============================================================================
	// HELP OVERLAY
	// ============================================================================

	if (showHelp) {
		return (
			<Box
				flexDirection="column"
				padding={1}
				width="100%"
				height="100%"
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
			>
				<Text bold color={floydRoles.headerTitle}>
					FLOYD CLI Help
				</Text>
				<Box marginTop={1} flexDirection="column">
					<Text color={floydTheme.colors.fgBase}>Keyboard Shortcuts:</Text>
					<Box flexDirection="column" marginLeft={1}>
						<Text>Ctrl+P - Command Palette</Text>
						<Text>Ctrl+M - Toggle Monitor Dashboard</Text>
						<Text>Ctrl+T - Toggle Agent Visualization</Text>
						<Text>Ctrl+/ - Toggle Help</Text>
						<Text>? - Toggle Help (when not typing)</Text>
						<Text>Enter - Send Message</Text>
						<Text>Esc - Close dialog / Exit</Text>
					</Box>
				</Box>
				<Box marginTop={1} flexDirection="column">
					<Text color={floydTheme.colors.fgBase}>Modes:</Text>
					<Box flexDirection="column" marginLeft={1}>
						<Text>Chat - Interactive conversation</Text>
						<Text>Code - Code-focused assistance</Text>
						<Text>Monitor - Real-time system monitoring</Text>
					</Box>
				</Box>
				<Box marginTop={1}>
					<Text color={floydRoles.hint} dimColor>
						Press Esc or Ctrl+/ to close help
					</Text>
				</Box>
			</Box>
		);
	}

	// ============================================================================
	// MONITOR DASHBOARD
	// ============================================================================

	if (showMonitor) {
		const monitorData: MonitorData = {events, toolExecutions};
		return (
			<MonitorLayout
				data={monitorData}
				compact={false}
				updateInterval={1000}
				showEventStream={true}
				showToolTimeline={toolExecutions.length > 0}
				showSystemMetrics={true}
				showGitActivity={false}
				showBrowserState={false}
				showAlertTicker={events.some(
					e => e.severity === 'error' || e.severity === 'warning',
				)}
				showWorkerStateBoard={false}
				header={
					<Box
						flexDirection="row"
						justifyContent="space-between"
						paddingX={1}
						borderStyle="double"
						borderColor={floydTheme.colors.borderFocus}
					>
						<Text bold color={floydRoles.headerTitle}>
							FLOYD MONITOR
						</Text>
						<Text dimColor>Press Esc to return</Text>
					</Box>
				}
			/>
		);
	}

	// ============================================================================
	// MAIN LAYOUT
	// ============================================================================

	// Determine if we should show visualization panels
	const hasActivity =
		tasks.length > 0 || toolExecutions.length > 0 || events.length > 0;

	return (
		<ErrorBoundary
			onError={(error, errorInfo) => {
				// Log error to file in production
			}}
		>
			<MainLayout
				userName={name}
				cwd={process.cwd()}
				connectionStatus="connected"
				mode="chat"
				messages={allMessages}
				agentStatus={agentStatus}
				tasks={tasks}
				toolExecutions={toolExecutions}
				events={events}
				isThinking={isThinking}
				whimsicalPhrase={currentWhimsicalPhrase}
				streamingContent={streamingContent}
				commands={augmentedCommands}
				onSubmit={handleSubmit}
				onCommand={handleCommand}
				onExit={exit}
				safetyMode={safetyMode}
				onSafetyModeChange={handleSafetyModeChange}
				showHelp={showHelp}
				showMonitor={showMonitor}
				onCloseMonitor={() => setShowMonitor(false)}
				showAgentViz={showAgentViz || (hasActivity && tasks.length > 0)}
				showToolTimeline={
					showAgentViz || (hasActivity && toolExecutions.length > 0)
				}
				showEventStream={showAgentViz || (hasActivity && events.length > 0)}
			/>
		</ErrorBoundary>
	);
}
