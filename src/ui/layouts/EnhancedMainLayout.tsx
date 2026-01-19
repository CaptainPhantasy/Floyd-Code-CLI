/**
 * EnhancedMainLayout Component
 *
 * Three-pane layout matching the mockup with proper Frame components and layering.
 * Structure: SESSION | TRANSCRIPT | CONTEXT
 */

import {useState, useCallback, type ReactNode} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';

// Layout primitives
import {OverlayStack, useOverlayStack} from '../crush/OverlayStack.js';
import {ThreePaneSplit} from '../crush/SplitPane.js';
import {Frame} from '../crush/Frame.js';

// Panels
import {SessionPanel} from '../panels/SessionPanel.js';
import {TranscriptPanel} from '../panels/TranscriptPanel.js';
import {ContextPanel} from '../panels/ContextPanel.js';

// Components
import {CommandPaletteTrigger, type CommandItem, commonCommands} from '../components/CommandPalette.js';
import {StatusBar} from '../components/StatusBar.js';
import {AskOverlay, type PermissionRequest, type PermissionResponse} from '../../permissions/ask-overlay.js';

// Types
import type {ChatMessage} from './MainLayout.js';
import type {ThinkingStatus} from '../agent/ThinkingStream.js';
import type {Task} from '../agent/TaskChecklist.js';
import type {ToolExecution} from '../monitor/ToolTimeline.js';
import type {StreamEvent} from '../monitor/EventStream.js';
import type {WorkerStatus} from '../components/WorkerBadge.js';

// Theme
import {floydTheme} from '../../theme/crush-theme.js';

export interface EnhancedMainLayoutProps {
	/** User name */
	userName?: string;
	/** Current working directory */
	cwd?: string;
	/** Connection status */
	connectionStatus?: 'connected' | 'disconnected' | 'connecting';
	/** Active mode */
	mode?: 'chat' | 'code' | 'browse' | 'swarm';
	/** Messages */
	messages?: ChatMessage[];
	/** Agent status */
	agentStatus?: ThinkingStatus;
	/** Tasks */
	tasks?: Task[];
	/** Tool executions */
	toolExecutions?: ToolExecution[];
	/** Events */
	events?: StreamEvent[];
	/** Commands */
	commands?: CommandItem[];
	/** Is thinking */
	isThinking?: boolean;
	/** Streaming content */
	streamingContent?: string;
	/** On submit */
	onSubmit?: (message: string) => void;
	/** On command */
	onCommand?: (commandId: string) => void;
	/** On exit */
	onExit?: () => void;
	/** Compact mode */
	compact?: boolean;
	/** Custom header */
	customHeader?: ReactNode;
	/** Custom footer */
	customFooter?: ReactNode;
	/** Repo info */
	repoName?: string;
	repoType?: string;
	gitBranch?: string;
	gitStatus?: 'clean' | 'dirty';
	changedFiles?: number;
	safetyMode?: 'YOLO' | 'SAFE';
	/** Tools */
	tools?: Array<{name: string; enabled: boolean}>;
	/** Workers */
	workers?: Array<{name: string; status: WorkerStatus; color?: string}>;
	/** Files touched */
	filesTouched?: string[];
	/** Open diffs */
	openDiffs?: number;
	diffLines?: number;
	diffFiles?: number;
	/** Browser domains */
	browserDomains?: Array<{domain: string; allowed: boolean}>;
	/** Permission request */
	permissionRequest?: PermissionRequest | null;
	/** On permission response */
	onPermissionResponse?: (response: PermissionResponse) => void;
}

/**
 * EnhancedMainLayout - Three-pane layout with proper frames
 */
export function EnhancedMainLayout({
	userName = 'User',
	cwd = process.cwd(),
	connectionStatus = 'connected',
	mode = 'chat',
	messages = [],
	agentStatus = 'idle',
	tasks = [],
	toolExecutions = [],
	events = [],
	commands = [],
	isThinking = false,
	streamingContent,
	onSubmit,
	onCommand,
	onExit,
	compact = false,
	customHeader,
	customFooter,
	repoName = 'floyd-cli',
	repoType = 'TypeScript + Ink + MCP',
	gitBranch = 'main',
	gitStatus = 'clean',
	changedFiles = 0,
	safetyMode = 'SAFE',
	tools = [],
	workers = [],
	filesTouched = [],
	openDiffs = 0,
	diffLines = 0,
	diffFiles = 0,
	browserDomains = [],
	permissionRequest,
	onPermissionResponse,
}: EnhancedMainLayoutProps) {
	const [input, setInput] = useState('');
	const {exit: inkExit} = useApp();
	const {overlays, showOverlay, hideOverlay} = useOverlayStack();

	// Handle permission overlay
	if (permissionRequest && !overlays.find(o => o.id === permissionRequest.id)) {
		showOverlay({
			id: permissionRequest.id,
			content: (
				<AskOverlay
					request={permissionRequest}
					visible={true}
					onResponse={response => {
						hideOverlay(permissionRequest.id);
						onPermissionResponse?.(response);
					}}
				/>
			),
			priority: 1000,
			dimBackground: true,
		});
	}

	// Handle command palette
	const handleCommand = useCallback(
		(commandId: string) => {
			onCommand?.(commandId);
			switch (commandId) {
				case 'exit':
					onExit?.();
					inkExit();
					break;
			}
		},
		[onCommand, onExit, inkExit],
	);

	const augmentedCommands: CommandItem[] = [
		...commonCommands,
		...commands,
	].map(cmd => ({
		...cmd,
		action: () => handleCommand(cmd.id),
	}));

	// Handle input submission
	const handleSubmit = useCallback(
		(value: string) => {
			if (!value.trim()) return;
			setInput('');
			onSubmit?.(value);
		},
		[onSubmit],
	);

	// Keyboard shortcuts
	useInput((_input, key) => {
		if (key.escape) {
			onExit?.();
			inkExit();
		}
	});

	return (
		<OverlayStack overlays={overlays}>
			<CommandPaletteTrigger commands={augmentedCommands} initialOpen={false}>
				<Box flexDirection="column" width="100%" height="100%">
					{/* Header */}
					{customHeader || (
						<StatusBar
							left={[
								{value: cwd, color: floydTheme.colors.fgMuted},
								{value: `GLM-4.7`, color: floydTheme.colors.fgBase},
								{value: `Session s-24f9`, color: floydTheme.colors.fgMuted},
							]}
							center={[
								{
									value: agentStatus === 'idle' ? '[Ready]' : '[Thinking]',
									color:
										agentStatus === 'idle'
											? floydTheme.colors.success
											: floydTheme.colors.warning,
								},
								{value: 'Tools/min 18', color: floydTheme.colors.fgMuted},
								{value: `Workers ${workers.length}`, color: floydTheme.colors.fgMuted},
							]}
							right={[
								{value: '// FLOYD™', color: floydTheme.colors.secondary},
								{value: 'v0.32.0', color: floydTheme.colors.fgMuted},
							]}
							compact={compact}
						/>
					)}

					{/* Main three-pane layout */}
					<Box flexGrow={1} flexDirection="row" width="100%">
						<ThreePaneSplit
							leftSize="25%"
							middleSize="50%"
							rightSize="25%"
							showDividers={true}
							left={
								<SessionPanel
									repoName={repoName}
									techStack={repoType}
									gitBranch={gitBranch}
									gitStatus={gitStatus}
									fileCount={changedFiles}
									safetyMode={safetyMode.toLowerCase() as 'yolo' | 'safe'}
									tools={tools.map(t => ({name: t.name, enabled: t.enabled}))}
									workers={workers.map(w => ({
										name: w.name,
										status: (w.status === 'active' || w.status === 'busy' || w.status === 'thinking'
											? 'working'
											: w.status === 'error'
												? 'blocked'
												: w.status === 'offline'
													? 'idle'
													: w.status) as 'idle' | 'working' | 'waiting' | 'blocked',
									}))}
								/>
							}
							middle={
								<TranscriptPanel
									messages={messages}
									toolExecutions={toolExecutions}
									streamingContent={streamingContent}
									isThinking={isThinking}
									height={compact ? 15 : 30}
								/>
							}
							right={
								<ContextPanel
									currentPlan={tasks.map(t => ({label: t.name, done: t.status === 'complete'}))}
									filesTouched={filesTouched}
									openDiffs={{count: openDiffs, lines: diffLines, files: diffFiles}}
								/>
							}
						/>
					</Box>

					{/* Input area */}
					{customFooter || (
						<Frame title="MESSAGE" borderStyle="round" padding={1}>
							<Box flexDirection="row" alignItems="center" gap={1}>
								<Text color={floydTheme.colors.fgMuted}>❯</Text>
								<TextInput
									value={input}
									onChange={setInput}
									onSubmit={handleSubmit}
									placeholder="Type a message... (Ctrl+P for palette, Tab to switch frames)"
								/>
								{isThinking && (
									<Text color={floydTheme.colors.fgMuted}>
										<Spinner type="dots" />
									</Text>
								)}
							</Box>
							<Box marginTop={1}>
								<Text color={floydTheme.colors.fgSubtle} dimColor>
									Enter send • Shift+Enter newline • Esc exit • Ctrl+P palette
								</Text>
							</Box>
						</Frame>
					)}
				</Box>
			</CommandPaletteTrigger>
		</OverlayStack>
	);
}

export default EnhancedMainLayout;
