/**
 * TMUX Session Manager
 *
 * Manages TMUX session lifecycle including:
 * - Session creation and destruction
 * - Window management
 * - Session state queries
 * - Pane control
 *
 * @module tmux/session-manager
 */

// Use dynamic import for execa command to match package shape at runtime

export interface SessionInfo {
	name: string;
	id: number;
	windows: WindowInfo[];
	attached: boolean;
	created?: Date;
}

export interface WindowInfo {
	id: number;
	name: string;
	panes: number;
	active: boolean;
}

export interface PaneInfo {
	id: number;
	windowId: number;
	windowName: string;
	currentPath: string;
	pid: number;
	active: boolean;
}

/**
 * Build TMUX command with optional socket path
 */
function buildTmuxCommand(socketPath?: string): string {
	return socketPath ? `tmux -L ${socketPath}` : 'tmux';
}

/**
 * Execute a TMUX command and return stdout
 */
async function execTmux(args: string[], socketPath?: string): Promise<string> {
	const tmuxCmd = buildTmuxCommand(socketPath);
	const command = `${tmuxCmd} ${args.join(' ')}`;
	const execa = (await import('execa')).default;
	const { stdout } = await execa.command(command);
	return stdout.trim();
}

/**
 * List all TMUX sessions
 */
export async function listSessions(socketPath?: string): Promise<string[]> {
	try {
		const output = await execTmux(
			['list-sessions', '-F', '#{session_name}'],
			socketPath,
		);
		return output.split('\n').filter(Boolean);
	} catch {
		// No sessions or TMUX not available
		return [];
	}
}

/**
 * Check if a session exists
 */
export async function sessionExists(
	sessionName: string,
	socketPath?: string,
): Promise<boolean> {
	const sessions = await listSessions(socketPath);
	return sessions.includes(sessionName);
}

/**
 * Get detailed information about a session
 */
export async function getSessionInfo(
	sessionName: string,
	socketPath?: string,
): Promise<SessionInfo | null> {
	try {
		// Get session format output
		const sessionOutput = await execTmux(
			[
				'display-message',
				'-t',
				sessionName,
				'-p',
				'#{session_id} #{session_name} #{?session_attached,attached,detached}',
			],
			socketPath,
		);

		const parts = sessionOutput.split(' ');
		const idStr = parts[0];
		const name = parts[1];
		const attachedStatus = parts[2];

		if (!idStr || !name) {
			return null;
		}

		const id = parseInt(idStr.replace('$', ''), 10);
		const attached = attachedStatus === 'attached';

		// Get windows
		const windows = await getSessionWindows(sessionName, socketPath);

		return {
			name,
			id,
			windows,
			attached,
		};
	} catch {
		return null;
	}
}

/**
 * Get all windows in a session
 */
export async function getSessionWindows(
	sessionName: string,
	socketPath?: string,
): Promise<WindowInfo[]> {
	try {
		const output = await execTmux(
			[
				'list-windows',
				'-t',
				sessionName,
				'-F',
				'#{window_id} #{window_name} #{window_panes} #{window_active}',
			],
			socketPath,
		);

		return output
			.split('\n')
			.filter(Boolean)
			.map(line => {
				const parts = line.split(' ');
				const idStr = parts[0];
				const name = parts[1] || '';
				const panesStr = parts[2];
				const activeStr = parts[3];

				return {
					id: idStr ? parseInt(idStr.replace('@', ''), 10) : 0,
					name,
					panes: panesStr ? parseInt(panesStr, 10) : 0,
					active: activeStr === '1',
				};
			});
	} catch {
		return [];
	}
}

/**
 * Get window IDs for main and monitor windows by name
 */
export async function getSessionWindowIds(
	sessionName: string,
	socketPath?: string,
): Promise<{ mainWindowId?: number; monitorWindowId?: number }> {
	const windows = await getSessionWindows(sessionName, socketPath);

	const mainWindow = windows.find(w => w.name.toLowerCase() === 'main');
	const monitorWindow = windows.find(w => w.name.toLowerCase() === 'monitor');

	return {
		mainWindowId: mainWindow?.id,
		monitorWindowId: monitorWindow?.id,
	};
}

/**
 * Kill a specific session
 */
export async function killSession(
	sessionName: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(['kill-session', '-t', sessionName], socketPath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Kill all Floyd sessions (sessions starting with 'floyd')
 */
export async function killAllFloydSessions(
	socketPath?: string,
): Promise<number> {
	const sessions = await listSessions(socketPath);
	const floydSessions = sessions.filter(s => s.startsWith('floyd'));

	for (const session of floydSessions) {
		await killSession(session, socketPath);
	}

	return floydSessions.length;
}

/**
 * Create a new window in a session
 */
export async function createWindow(
	sessionName: string,
	windowName: string,
	command?: string,
	socketPath?: string,
): Promise<number | null> {
	try {
		const args = ['new-window', '-t', sessionName, '-n', windowName];
		if (command) {
			args.push(command);
		}

		const output = await execTmux(args, socketPath);
		// Extract window ID from output
		const match = output.match(/@(\d+)/);
		return match && match[1] ? parseInt(match[1], 10) : null;
	} catch {
		return null;
	}
}

/**
 * Switch to a specific window
 */
export async function selectWindow(
	sessionName: string,
	windowName: string | number,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(
			['select-window', '-t', `${sessionName}:${windowName}`],
			socketPath,
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Send keys to a specific window or pane
 */
export async function sendKeys(
	target: string,
	keys: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		// Escape special characters
		const escapedKeys = keys.replace(/'/g, "'\\''");
		await execTmux(['send-keys', '-t', target, escapedKeys], socketPath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get pane information for a session
 */
export async function getSessionPanes(
	sessionName: string,
	socketPath?: string,
): Promise<PaneInfo[]> {
	try {
		const output = await execTmux(
			[
				'list-panes',
				'-t',
				sessionName,
				'-s',
				'-F',
				'#{pane_id} #{window_id} #{window_name} #{pane_current_path} #{pane_pid} #{pane_active}',
			],
			socketPath,
		);

		return output
			.split('\n')
			.filter(Boolean)
			.map(line => {
				const parts = line.split(' ');
				const paneIdStr = parts[0];
				const windowIdStr = parts[1];
				const windowName = parts[2] || '';
				const currentPath = parts[3] || '';
				const pidStr = parts[4];
				const activeStr = parts[5];

				return {
					id: paneIdStr ? parseInt(paneIdStr.replace('%', ''), 10) : 0,
					windowId: windowIdStr
						? parseInt(windowIdStr.replace('@', ''), 10)
						: 0,
					windowName,
					currentPath,
					pid: pidStr ? parseInt(pidStr, 10) : 0,
					active: activeStr === '1',
				};
			});
	} catch {
		return [];
	}
}

/**
 * Split a window/pane vertically
 */
export async function splitVertical(
	target: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(
			['split-window', '-t', target, '-v', '-c', '#{pane_current_path}'],
			socketPath,
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Split a window/pane horizontally
 */
export async function splitHorizontal(
	target: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(
			['split-window', '-t', target, '-h', '-c', '#{pane_current_path}'],
			socketPath,
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Resize a pane
 */
export async function resizePane(
	target: string,
	direction: 'left' | 'right' | 'up' | 'down',
	amount: number,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(
			['resize-pane', '-t', target, `-${direction}`, String(amount)],
			socketPath,
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get session activity state
 */
export async function isSessionAttached(
	sessionName: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		const output = await execTmux(
			['display-message', '-t', sessionName, '-p', '#{session_attached}'],
			socketPath,
		);
		return output === '1';
	} catch {
		return false;
	}
}

/**
 * Rename a window
 */
export async function renameWindow(
	sessionName: string,
	oldName: string | number,
	newName: string,
	socketPath?: string,
): Promise<boolean> {
	try {
		await execTmux(
			['rename-window', '-t', `${sessionName}:${oldName}`, newName],
			socketPath,
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * SessionManager class for high-level session operations
 */
export class SessionManager {
	private socketPath?: string;

	constructor(socketPath?: string) {
		this.socketPath = socketPath;
	}

	/**
	 * List all sessions
	 */
	async list(): Promise<SessionInfo[]> {
		const names = await listSessions(this.socketPath);
		const infos: SessionInfo[] = [];

		for (const name of names) {
			const info = await getSessionInfo(name, this.socketPath);
			if (info) {
				infos.push(info);
			}
		}

		return infos;
	}

	/**
	 * Get a specific session
	 */
	async get(sessionName: string): Promise<SessionInfo | null> {
		return getSessionInfo(sessionName, this.socketPath);
	}

	/**
	 * Check if a session exists
	 */
	async exists(sessionName: string): Promise<boolean> {
		return sessionExists(sessionName, this.socketPath);
	}

	/**
	 * Kill a session
	 */
	async kill(sessionName: string): Promise<boolean> {
		return killSession(sessionName, this.socketPath);
	}

	/**
	 * Create a new window
	 */
	async createWindow(
		sessionName: string,
		windowName: string,
		command?: string,
	): Promise<number | null> {
		return createWindow(sessionName, windowName, command, this.socketPath);
	}

	/**
	 * Switch to a window
	 */
	async selectWindow(
		sessionName: string,
		windowName: string | number,
	): Promise<boolean> {
		return selectWindow(sessionName, windowName, this.socketPath);
	}

	/**
	 * Send keys to a target
	 */
	async sendKeys(target: string, keys: string): Promise<boolean> {
		return sendKeys(target, keys, this.socketPath);
	}

	/**
	 * Check if session is attached
	 */
	async isAttached(sessionName: string): Promise<boolean> {
		return isSessionAttached(sessionName, this.socketPath);
	}

	/**
	 * Get all panes in a session
	 */
	async getPanes(sessionName: string): Promise<PaneInfo[]> {
		return getSessionPanes(sessionName, this.socketPath);
	}

	/**
	 * Split a pane vertically
	 */
	async splitVertical(target: string): Promise<boolean> {
		return splitVertical(target, this.socketPath);
	}

	/**
	 * Split a pane horizontally
	 */
	async splitHorizontal(target: string): Promise<boolean> {
		return splitHorizontal(target, this.socketPath);
	}

	/**
	 * Static method wrapper functions
	 */
	static sessionExists = sessionExists;
	static killSession = killSession;
	static killAllFloydSessions = killAllFloydSessions;
	static getSessionWindowIds = getSessionWindowIds;
	static getSessionPanes = getSessionPanes;
	static listSessions = listSessions;
}
