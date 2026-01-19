/**
 * DualScreenLayout Component
 *
 * Dual-screen coordinator for FLOYD CLI TMUX dual-monitor setup.
 *
 * Manages split-screen layout with:
 * - LEFT MONITOR: MainLayout (interactive CLI)
 * - RIGHT MONITOR: MonitorLayout (dashboard)
 * - TMUX session management for launching/managing dual-screen sessions
 * - Visual representation of split-screen layout
 *
 * Layout Structure:
 * +--------------------------+--------------------------+
 * |   LEFT MONITOR (Main)    |   RIGHT MONITOR (Monitor) |
 * |  - FLOYD ASCII Banner    |  - Alert Ticker           |
 * |  - Status Bar            |  - Event Stream           |
 * |  - Message History       |  - Worker State Board     |
 * |  - Agent Visualization   |  - Tool Timeline          |
 * |  - Chat Input            |  - System Metrics         |
 * |                          |  - Git Activity           |
 * |                          |  - Browser State          |
 * +--------------------------+--------------------------+
 *
 * @module ui/layouts/DualScreenLayout
 */

import {useState, useEffect, useCallback, type ReactNode} from 'react';
import {Box, Text} from 'ink';

// Layouts
import type {MainLayoutProps} from './MainLayout.js';
import type {MonitorLayoutProps} from './MonitorLayout.js';

// TMUX session management
import {
	launchDualScreen,
	attachSession,
	killSession,
	listSessions,
	sessionExists,
	getSessionInfo,
	type LaunchOptions,
	type LaunchResult,
	DEFAULT_WINDOW_SIZE,
} from '../../tmux/index.js';

import type {SessionInfo as TmuxSessionInfo} from '../../tmux/session-manager.js';

// Theme
import {floydTheme, crushTheme, roleColors} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DualScreenLayoutProps {
	/** Main layout props (left screen) */
	mainProps?: Partial<MainLayoutProps>;

	/** Monitor layout props (right screen) */
	monitorProps?: Partial<MonitorLayoutProps>;

	/** Current working directory for session */
	cwd?: string;

	/** Session name for TMUX */
	sessionName?: string;

	/** Window size for display */
	windowSize?: {
		cols: number;
		rows: number;
	};

	/** Auto-launch TMUX session on mount */
	autoLaunch?: boolean;

	/** Show visual representation of dual-screen layout */
	showPreview?: boolean;

	/** Custom header content */
	customHeader?: ReactNode;

	/** Custom footer content */
	customFooter?: ReactNode;

	/** Session state change callback */
	onSessionChange?: (state: SessionState) => void;

	/** Error callback */
	onError?: (error: Error) => void;
}

export interface SessionState {
	/** Whether session is active */
	isActive: boolean;

	/** Whether session is attached */
	isAttached: boolean;

	/** Session info if active */
	sessionInfo?: TmuxSessionInfo;

	/** Launch result if recently launched */
	launchResult?: LaunchResult;

	/** Current error if any */
	error?: Error;
}

export interface DualScreenConfig extends LaunchOptions {
	/** Main window name */
	mainWindowName?: string;

	/** Monitor window name */
	monitorWindowName?: string;

	/** Command to run in main window */
	mainCommand?: string;

	/** Command to run in monitor window */
	monitorCommand?: string;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_SESSION_NAME = 'floyd';
const DEFAULT_MAIN_WINDOW = 'main';
const DEFAULT_MONITOR_WINDOW = 'monitor';
const DEFAULT_MAIN_COMMAND = 'floyd-cli';
const DEFAULT_MONITOR_COMMAND = 'floyd-cli --monitor';

// ============================================================================
// PREVIEW COMPONENTS
// ============================================================================

interface DualScreenPreviewProps {
	cols: number;
	rows: number;
	mainLabel: string;
	monitorLabel: string;
}

/**
 * Visual representation of dual-screen layout
 */
function DualScreenPreview({
	cols,
	rows,
	mainLabel,
	monitorLabel,
}: DualScreenPreviewProps) {
	const leftWidth = Math.floor(cols / 2);
	const rightWidth = cols - leftWidth - 1; // -1 for divider

	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Header */}
			<Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
				<Text bold color={crushTheme.accent.secondary}>
					Dual Screen Layout Preview
				</Text>
				<Text color={roleColors.hint} dimColor>
					{cols}x{rows}
				</Text>
			</Box>

			{/* Screen representation */}
			<Box flexDirection="row">
				{/* Left Screen */}
				<Box
					flexDirection="column"
					width={leftWidth}
					borderStyle="double"
					borderColor={crushTheme.accent.primary}
					paddingX={1}
				>
					<Box flexDirection="column" height={8} justifyContent="space-between">
						<Box>
							<Text bold color={crushTheme.accent.primary}>
								{mainLabel}
							</Text>
						</Box>
						<Box flexDirection="column">
							<Text color={floydTheme.colors.fgMuted}>ASCII Banner</Text>
							<Text color={floydTheme.colors.fgMuted}>Status Bar</Text>
							<Text color={floydTheme.colors.fgMuted}>Messages</Text>
							<Text color={floydTheme.colors.fgMuted}>Input</Text>
						</Box>
						<Box>
							<Text color={crushTheme.status.ready}>● Main CLI</Text>
						</Box>
					</Box>
				</Box>

				{/* Divider */}
				<Box width={1} justifyContent="center">
					<Text color={floydTheme.colors.fgSubtle}>│</Text>
				</Box>

				{/* Right Screen */}
				<Box
					flexDirection="column"
					width={rightWidth}
					borderStyle="double"
					borderColor={crushTheme.accent.secondary}
					paddingX={1}
				>
					<Box flexDirection="column" height={8} justifyContent="space-between">
						<Box>
							<Text bold color={crushTheme.accent.secondary}>
								{monitorLabel}
							</Text>
						</Box>
						<Box flexDirection="column">
							<Text color={floydTheme.colors.fgMuted}>Alert Ticker</Text>
							<Text color={floydTheme.colors.fgMuted}>Event Stream</Text>
							<Text color={floydTheme.colors.fgMuted}>Workers</Text>
							<Text color={floydTheme.colors.fgMuted}>Metrics</Text>
						</Box>
						<Box>
							<Text color={crushTheme.status.working}>● Monitor</Text>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

// ============================================================================
// SESSION STATUS BAR
// ============================================================================

interface SessionStatusBarProps {
	sessionName: string;
	sessionState: SessionState;
	onLaunch: () => void;
	onAttach: () => void;
	onKill: () => void;
	onList: () => void;
}

function SessionStatusBar({sessionName, sessionState}: SessionStatusBarProps) {
	const {isActive, isAttached, sessionInfo} = sessionState;

	const windowCount = sessionInfo?.windows.length ?? 0;

	const getStatusColor = () => {
		if (isActive && isAttached) return crushTheme.status.online;
		if (isActive) return crushTheme.status.working;
		return crushTheme.status.offline;
	};

	const getStatusLabel = () => {
		if (isActive && isAttached) return '● Attached';
		if (isActive) return '○ Active';
		return '○ Inactive';
	};

	return (
		<Box
			flexDirection="row"
			justifyContent="space-between"
			borderStyle="single"
			borderColor={floydTheme.colors.border}
			paddingX={1}
			marginBottom={1}
		>
			<Box flexDirection="row" gap={2}>
				<Text bold color={crushTheme.accent.secondary}>
					Session: {sessionName}
				</Text>
				<Text color={getStatusColor()}>{getStatusLabel()}</Text>
				{sessionInfo && (
					<Text color={roleColors.hint} dimColor>
						({windowCount} windows)
					</Text>
				)}
			</Box>

			<Box flexDirection="row" gap={2}>
				{!isActive && <Text color={crushTheme.status.ready}>[L]aunch</Text>}
				{isActive && !isAttached && (
					<Text color={crushTheme.status.working}>[A]ttach</Text>
				)}
				{isActive && <Text color={crushTheme.status.error}>[K]ill</Text>}
				<Text color={roleColors.hint} dimColor>
					[?] List
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// DUAL SCREEN LAYOUT COMPONENT
// ============================================================================

/**
 * DualScreenLayout - Main dual-screen coordinator component
 *
 * Renders split-screen layout with MainLayout and MonitorLayout,
 * handles TMUX session management for dual-monitor setups.
 */
export function DualScreenLayout({
	mainProps,
	sessionName = DEFAULT_SESSION_NAME,
	windowSize = DEFAULT_WINDOW_SIZE,
	autoLaunch = false,
	showPreview = false,
	customHeader,
	customFooter,
	onSessionChange,
	onError,
}: DualScreenLayoutProps) {
	// Session state
	const [sessionState, setSessionState] = useState<SessionState>({
		isActive: false,
		isAttached: false,
	});

	// Available sessions list
	const [availableSessions, setAvailableSessions] = useState<string[]>([]);
	const [showSessionList, setShowSessionList] = useState(false);

	// Check session status on mount
	useEffect(() => {
		checkSessionStatus();
	}, [sessionName]);

	// Auto-launch if requested
	useEffect(() => {
		if (autoLaunch && !sessionState.isActive) {
			handleLaunch();
		}
	}, [autoLaunch]);

	// Notify parent of session state changes
	useEffect(() => {
		onSessionChange?.(sessionState);
	}, [sessionState, onSessionChange]);

	/**
	 * Check current session status
	 */
	const checkSessionStatus = useCallback(async () => {
		try {
			const exists = await sessionExists(sessionName);
			if (exists) {
				const sessionInfo = await getSessionInfo(sessionName);
				setSessionState({
					isActive: true,
					isAttached: sessionInfo?.attached ?? false,
					sessionInfo: sessionInfo ?? undefined,
				});
			} else {
				setSessionState({
					isActive: false,
					isAttached: false,
				});
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			setSessionState(prev => ({...prev, error: err}));
			onError?.(err);
		}
	}, [sessionName, onError]);

	/**
	 * Launch new dual-screen TMUX session
	 */
	const handleLaunch = useCallback(async () => {
		try {
			const config: DualScreenConfig = {
				sessionName,
				mainWindowName: DEFAULT_MAIN_WINDOW,
				monitorWindowName: DEFAULT_MONITOR_WINDOW,
				mainCommand: mainProps?.cwd
					? `cd ${mainProps.cwd} && ${DEFAULT_MAIN_COMMAND}`
					: DEFAULT_MAIN_COMMAND,
				monitorCommand: DEFAULT_MONITOR_COMMAND,
				windowSize,
				attach: false, // Don't attach from within the CLI
			};

			const result = await launchDualScreen(config);

			setSessionState({
				isActive: result.success,
				isAttached: false,
				launchResult: result,
			});

			if (!result.success) {
				throw new Error(result.error || 'Failed to launch session');
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			setSessionState(prev => ({...prev, error: err}));
			onError?.(err);
		}
	}, [sessionName, windowSize, mainProps, onError]);

	/**
	 * Attach to existing session
	 */
	const handleAttach = useCallback(async () => {
		try {
			await attachSession(sessionName);
			setSessionState(prev => ({...prev, isAttached: true}));
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			setSessionState(prev => ({...prev, error: err}));
			onError?.(err);
		}
	}, [sessionName, onError]);

	/**
	 * Kill the current session
	 */
	const handleKill = useCallback(async () => {
		try {
			const killed = await killSession(sessionName);
			if (killed) {
				setSessionState({
					isActive: false,
					isAttached: false,
				});
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			setSessionState(prev => ({...prev, error: err}));
			onError?.(err);
		}
	}, [sessionName, onError]);

	/**
	 * List all available sessions
	 */
	const handleList = useCallback(async () => {
		try {
			const sessions = await listSessions();
			setAvailableSessions(sessions);
			setShowSessionList(v => !v);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			onError?.(err);
		}
	}, [onError]);

	/**
	 * Render session list overlay
	 */
	const renderSessionList = () => {
		if (!showSessionList) return null;

		return (
			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor={crushTheme.accent.primary}
				padding={1}
			>
				<Box marginBottom={1}>
					<Text bold color={crushTheme.accent.secondary}>
						Available TMUX Sessions
					</Text>
				</Box>

				{availableSessions.length === 0 ? (
					<Text color={floydTheme.colors.fgMuted}>No active sessions</Text>
				) : (
					<Box flexDirection="column" gap={0}>
						{availableSessions.map(session => (
							<Box key={session} flexDirection="row" gap={2}>
								<Text
									color={
										session === sessionName
											? crushTheme.status.ready
											: floydTheme.colors.fgBase
									}
								>
									{session === sessionName ? '●' : '○'} {session}
								</Text>
							</Box>
						))}
					</Box>
				)}

				<Box marginTop={1}>
					<Text color={roleColors.hint} dimColor>
						Press ? to close
					</Text>
				</Box>
			</Box>
		);
	};

	// Show session list overlay instead of main content
	if (showSessionList) {
		return (
			<Box flexDirection="column" padding={1}>
				{customHeader}
				{renderSessionList()}
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1} width="100%" height="100%">
			{/* Custom header */}
			{customHeader}

			{/* Session status bar */}
			<SessionStatusBar
				sessionName={sessionName}
				sessionState={sessionState}
				onLaunch={handleLaunch}
				onAttach={handleAttach}
				onKill={handleKill}
				onList={handleList}
			/>

			{/* Error display */}
			{sessionState.error && (
				<Box
					borderStyle="single"
					borderColor={crushTheme.status.error}
					paddingX={1}
					marginBottom={1}
				>
					<Text color={crushTheme.status.error}>
						Error: {sessionState.error.message}
					</Text>
				</Box>
			)}

			{/* Layout preview */}
			{showPreview && (
				<DualScreenPreview
					cols={windowSize.cols}
					rows={windowSize.rows}
					mainLabel="LEFT MONITOR"
					monitorLabel="RIGHT MONITOR"
				/>
			)}

			{/* Instructions */}
			<Box flexDirection="column" marginBottom={1}>
				<Text bold color={crushTheme.accent.tertiary}>
					Dual Screen Mode
				</Text>
				<Text color={floydTheme.colors.fgMuted}>
					This layout coordinates a TMUX dual-screen session.
				</Text>
				<Text color={roleColors.hint} dimColor>
					Launch a session to start the Main CLI and Monitor dashboard in split
					panes.
				</Text>
			</Box>

			{/* Session info */}
			{sessionState.isActive && sessionState.launchResult && (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={crushTheme.status.ready}
					paddingX={1}
					marginBottom={1}
				>
					<Text color={crushTheme.status.ready}>Session Active</Text>
					{sessionState.launchResult.mainWindowId && (
						<Text color={roleColors.hint} dimColor>
							Main Window ID: {sessionState.launchResult.mainWindowId}
						</Text>
					)}
					{sessionState.launchResult.monitorWindowId && (
						<Text color={roleColors.hint} dimColor>
							Monitor Window ID: {sessionState.launchResult.monitorWindowId}
						</Text>
					)}
				</Box>
			)}

			{/* Custom footer */}
			{customFooter}
		</Box>
	);
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create a default dual-screen configuration
 */
export function createDualScreenConfig(
	overrides: Partial<DualScreenConfig> = {},
): DualScreenConfig {
	return {
		sessionName: DEFAULT_SESSION_NAME,
		mainWindowName: DEFAULT_MAIN_WINDOW,
		monitorWindowName: DEFAULT_MONITOR_WINDOW,
		mainCommand: DEFAULT_MAIN_COMMAND,
		monitorCommand: DEFAULT_MONITOR_COMMAND,
		windowSize: DEFAULT_WINDOW_SIZE,
		attach: false,
		...overrides,
	};
}

/**
 * Launch dual-screen session with default config
 */
export async function launchDefaultSession(
	overrides: Partial<DualScreenConfig> = {},
): Promise<LaunchResult> {
	const config = createDualScreenConfig(overrides);
	return launchDualScreen(config);
}

export default DualScreenLayout;
