/**
 * TMUX Dual-Screen Launcher
 *
 * Creates a TMUX session with two windows for dual-screen productivity:
 * - Window 1 (Main): Interactive CLI
 * - Window 2 (Monitor): Dashboard/status display
 *
 * @module tmux/launcher
 */

// Use dynamic import for execa command to match package shape at runtime
import { SessionManager } from './session-manager.js';

export interface LaunchOptions {
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
	 * Window size for 27" display (columns x rows)
	 * Default: 256x80 for 27" at typical font size
	 */
	windowSize?: {
		cols: number;
		rows: number;
	};

	/**
	 * Command to run in main window
	 */
	mainCommand?: string;

	/**
	 * Command to run in monitor window
	 */
	monitorCommand?: string;

	/**
	 * Whether to attach to the session after creation
	 */
	attach?: boolean;

	/**
	 * Socket path for TMUX (optional)
	 */
	socketPath?: string;
}

export interface LaunchResult {
	success: boolean;
	sessionName: string;
	mainWindowId?: number;
	monitorWindowId?: number;
	error?: string;
}

/**
 * Default window size for 27" displays at typical terminal font size
 */
export const DEFAULT_WINDOW_SIZE = {
	cols: 256,
	rows: 80,
};

/**
 * Create TMUX option flags from configuration
 */
function buildTmuxFlags(options: LaunchOptions): string[] {
	const flags: string[] = [];

	if (options.socketPath) {
		flags.push('-L', options.socketPath);
	}

	return flags;
}

/**
 * Build new-session command with all required options
 */
function buildNewSessionCommand(
	sessionName: string,
	mainCommand: string,
	options: LaunchOptions,
): string {
	const parts = [
		'new-session',
		'-s',
		sessionName,
		'-n',
		options.mainWindowName || 'Main',
		'-d', // Detach after creation
	];

	if (options.windowSize) {
		parts.push('-x', String(options.windowSize.cols));
		parts.push('-y', String(options.windowSize.rows));
	}

	// Set base options for the session
	parts.push(
		// Enable mouse support
		';',
		'set-option',
		'-g',
		'mouse',
		'on',
		// Turn off status bar for cleaner look
		';',
		'set-option',
		'-g',
		'status',
		'off',
		// Use 256-color mode
		';',
		'set-option',
		'-g',
		'default-terminal',
		'screen-256color',
		// Set base index to 1
		';',
		'set-option',
		'-g',
		'base-index',
		'1',
		';',
		'set-option',
		'-g',
		'pane-base-index',
		'1',
	);

	// Run the main command
	parts.push(mainCommand);

	return parts.join(' ');
}

/**
 * Build new-window command for monitor
 */
function buildNewWindowCommand(
	sessionName: string,
	windowName: string,
	command: string,
	options: LaunchOptions,
): string {
	const parts = ['new-window', '-t', sessionName, '-n', windowName];

	if (options.windowSize) {
		parts.push('-x', String(options.windowSize.cols));
		parts.push('-y', String(options.windowSize.rows));
	}

	parts.push(command);

	return parts.join(' ');
}

/**
 * Build select-window command to focus main window
 */
function buildSelectWindowCommand(
	sessionName: string,
	windowName: string,
): string {
	return `select-window -t ${sessionName}:${windowName}`;
}

/**
 * Check if TMUX is available on the system
 */
async function checkTmuxAvailable(): Promise<boolean> {
	try {
		const execa = (await import('execa')).default;
		await execa.command('tmux -V');
		return true;
	} catch {
		return false;
	}
}

/**
 * Launch a dual-screen TMUX session
 *
 * Creates a new TMUX session with two windows:
 * 1. Main window for interactive CLI
 * 2. Monitor window for dashboard/status display
 *
 * @example
 * ```ts
 * const result = await launchDualScreen({
 *   mainCommand: 'floyd',
 *   monitorCommand: 'floyd monitor',
 *   attach: true
 * });
 * ```
 */
export async function launchDualScreen(
	options: LaunchOptions = {},
): Promise<LaunchResult> {
	const sessionName = options.sessionName || 'floyd';
	const mainWindowName = options.mainWindowName || 'Main';
	const monitorWindowName = options.monitorWindowName || 'Monitor';
	const mainCommand = options.mainCommand || 'floyd';
	const monitorCommand = options.monitorCommand || 'floyd monitor';

	// Check if TMUX is available
	const tmuxAvailable = await checkTmuxAvailable();
	if (!tmuxAvailable) {
		return {
			success: false,
			sessionName,
			error: 'TMUX is not installed or not available in PATH',
		};
	}

	// Check if session already exists
	const sessionExists = await SessionManager.sessionExists(sessionName);
	if (sessionExists) {
		return {
			success: false,
			sessionName,
			error: `Session '${sessionName}' already exists. Use tmux attach -t ${sessionName} to connect.`,
		};
	}

	try {
		// Build the base command
		const tmuxFlags = buildTmuxFlags(options);

		// Create the main window
		const newSessionCmd = buildNewSessionCommand(
			sessionName,
			mainCommand,
			options,
		);
		const execa = (await import('execa')).default;
		await execa.command(`tmux ${tmuxFlags.join(' ')} ${newSessionCmd}`);

		// Create the monitor window
		const newWindowCmd = buildNewWindowCommand(
			sessionName,
			monitorWindowName,
			monitorCommand,
			options,
		);
		await execa.command(`tmux ${tmuxFlags.join(' ')} ${newWindowCmd}`);

		// Select main window as active
		const selectCmd = buildSelectWindowCommand(sessionName, mainWindowName);
		await execa.command(`tmux ${tmuxFlags.join(' ')} ${selectCmd}`);

		// Get window IDs
		const { mainWindowId, monitorWindowId } =
			await SessionManager.getSessionWindowIds(sessionName);

		// Attach if requested
		if (options.attach) {
			await attachSession(sessionName, options.socketPath);
		}

		return {
			success: true,
			sessionName,
			mainWindowId,
			monitorWindowId,
		};
	} catch (error) {
		return {
			success: false,
			sessionName,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Attach to an existing TMUX session
 */
export async function attachSession(
	sessionName: string,
	socketPath?: string,
): Promise<void> {
	const flags = socketPath ? ['-L', socketPath] : [];
	const attachCmd = ['attach', '-t', sessionName];

	// Use execa with stdio: inherit to connect terminal directly
	const execa = (await import('execa')).default;
	await execa.command(`tmux ${flags.join(' ')} ${attachCmd.join(' ')}`, {
		stdio: 'inherit',
	});
}

/**
 * Kill the dual-screen session
 */
export async function killSession(
	sessionName: string,
	socketPath?: string,
): Promise<boolean> {
	return SessionManager.killSession(sessionName, socketPath);
}

/**
 * List active Floyd sessions
 */
export async function listSessions(socketPath?: string): Promise<string[]> {
	return SessionManager.listSessions(socketPath);
}
