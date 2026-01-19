/**
 * TMUX Module Exports
 *
 * Provides dual-screen launcher functionality for FLOYD CLI:
 * - Launch TMUX sessions with Main CLI and Monitor dashboard windows
 * - Manage existing sessions (attach, kill, list)
 * - Execute dock commands in the monitor window
 *
 * @module tmux
 */

import type {LaunchResult} from './launcher.js';

// Launcher exports - dual-screen session management
export {
	launchDualScreen,
	attachSession,
	killSession,
	listSessions,
	type LaunchOptions,
	type LaunchResult,
	DEFAULT_WINDOW_SIZE,
} from './launcher.js';

// Session manager exports - low-level session operations
export {
	SessionManager,
	listSessions as listAllSessions,
	sessionExists,
	getSessionInfo,
	getSessionWindows,
	getSessionWindowIds,
	getSessionPanes,
	killSession as terminateSession,
	killAllFloydSessions,
	createWindow,
	selectWindow,
	sendKeys,
	splitVertical,
	splitHorizontal,
	resizePane,
	isSessionAttached,
	renameWindow,
	type SessionInfo,
	type WindowInfo,
	type PaneInfo,
} from './session-manager.js';

// Dock exports - monitor window command execution
export {
	executeDockCommand,
	listDockCommands,
	checkDockCommand,
	Dock,
	parseDockCommand,
	DOCK_COMMANDS,
	type DockCommand,
	type DockResult,
} from './dock.js';

/**
 * DualScreenConfig - Configuration for dual-screen TMUX sessions
 *
 * Alias for LaunchOptions for semantic clarity
 */
export type DualScreenConfig = {
	/**
	 * Session name (default: 'floyd')
	 */
	sessionName?: string;

	/**
	 * Main window name
	 */
	mainWindowName?: string;

	/**
	 * Monitor window name
	 */
	monitorWindowName?: string;

	/**
	 * Window size for display (columns x rows)
	 * Default: 256x80 for 27" at typical font size
	 */
	windowSize?: {
		cols: number;
		rows: number;
	};

	/**
	 * Command to run in main window (left pane)
	 */
	mainCommand?: string;

	/**
	 * Command to run in monitor window (right pane)
	 */
	monitorCommand?: string;

	/**
	 * Socket location for TMUX (optional)
	 */
	socketPath?: string;
};

/**
 * createSession - Create a new TMUX session programmatically
 *
 * Convenience wrapper around launchDualScreen that creates
 * a session without attaching by default.
 *
 * @example
 * ```ts
 * const result = await createSession({
 *   sessionName: 'my-project',
 *   mainCommand: 'floyd-cli',
 *   monitorCommand: 'floyd-cli --monitor',
 * });
 * ```
 */
export async function createSession(
	config: DualScreenConfig = {},
): Promise<LaunchResult> {
	const {launchDualScreen} = await import('./launcher.js');
	return launchDualScreen({
		...config,
		attach: false, // Don't attach by default for programmatic use
	});
}

/**
 * attachToSession - Attach to an existing TMUX session
 *
 * Convenience alias for attachSession
 */
export async function attachToSession(
	sessionName: string,
	socketPath?: string,
): Promise<void> {
	const {attachSession: attach} = await import('./launcher.js');
	return attach(sessionName, socketPath);
}

/**
 * killSessionByName - Kill a session by name
 *
 * Convenience alias for killSession
 */
export async function killSessionByName(
	sessionName: string,
	socketPath?: string,
): Promise<boolean> {
	const {killSession: kill} = await import('./launcher.js');
	return kill(sessionName, socketPath);
}

// Re-export LaunchResult as SessionResult for clarity
export type SessionResult = LaunchResult;
