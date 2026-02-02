/**
 * TMUX Dock Integration
 *
 * Handles dock commands for launching tools in the monitor window:
 * - :dock btop - Launch system monitor
 * - :dock htop - Launch process monitor
 * - :dock lazydocker - Launch Docker TUI
 * - :dock <command> - Launch any command in the monitor pane
 *
 * @module tmux/dock
 */

// Use dynamic import for execa command to match package shape at runtime
import { SessionManager } from './session-manager.js';

export interface DockCommand {
	/**
	 * The dock command to execute (e.g., 'btop', 'htop', 'lazydocker')
	 */
	command: string;

	/**
	 * Arguments to pass to the command
	 */
	args?: string[];

	/**
	 * Target session name (default: 'floyd')
	 */
	sessionName?: string;

	/**
	 * Target window name (default: 'Monitor')
	 */
	windowName?: string;

	/**
	 * Socket path for TMUX (optional)
	 */
	socketPath?: string;

	/**
	 * Whether to create a new pane or reuse existing
	 */
	createNewPane?: boolean;

	/**
	 * Split direction when creating new pane ('v' or 'h')
	 */
	splitDirection?: 'v' | 'h';
}

export interface DockResult {
	success: boolean;
	command: string;
	paneId?: number;
	error?: string;
}

/**
 * Predefined dock commands with their configurations
 */
export const DOCK_COMMANDS: Record<
	string,
	{ command: string; args?: string[]; description?: string }
> = {
	btop: {
		command: 'btop',
		description: 'System resource monitor',
	},
	htop: {
		command: 'htop',
		description: 'Interactive process viewer',
	},
	lazydocker: {
		command: 'lazydocker',
		description: 'Docker TUI',
	},
	lazygit: {
		command: 'lazygit',
		description: 'Git TUI',
	},
	glances: {
		command: 'glances',
		description: 'System monitoring tool',
	},
	ncdu: {
		command: 'ncdu',
		args: ['--color', 'dark'],
		description: 'Disk usage analyzer',
	},
	gotop: {
		command: 'gotop',
		description: 'Terminal activity monitor',
	},
	bashtop: {
		command: 'bashtop',
		description: 'Resource monitor',
	},
	neofetch: {
		command: 'neofetch',
		description: 'System info display',
	},
	fetch: {
		command: 'fastfetch',
		description: 'System info display (faster)',
	},
};

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
 * Check if a command is available on the system
 */
async function commandExists(command: string): Promise<boolean> {
	try {
		const execa = (await import('execa')).default;
		await execa.command(`command -v ${command}`);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the target pane for dock commands
 * Priority: Monitor window active pane, or first pane in Monitor window
 */
async function getDockTarget(
	sessionName: string,
	windowName: string,
	socketPath?: string,
): Promise<string | null> {
	try {
		// Try to get the active pane in the target window
		const output = await execTmux(
			[
				'display-message',
				'-t',
				`${sessionName}:${windowName}`,
				'-p',
				'#{pane_id}',
			],
			socketPath,
		);
		return output || null;
	} catch {
		return null;
	}
}

/**
 * Execute a dock command in the TMUX monitor window
 *
 * @example
 * ```ts
 * // Launch btop in the monitor window
 * const result = await executeDockCommand({command: 'btop'});
 *
 * // Launch custom command
 * const result = await executeDockCommand({command: 'npm', args: ['test']});
 * ```
 */
export async function executeDockCommand(
	options: DockCommand,
): Promise<DockResult> {
	const {
		command: dockCommandName,
		args = [],
		sessionName = 'floyd',
		windowName = 'Monitor',
		socketPath,
		createNewPane = false,
		splitDirection = 'v',
	} = options;

	// Check if session exists
	const sessionExists = await SessionManager.sessionExists(
		sessionName,
		socketPath,
	);
	if (!sessionExists) {
		return {
			success: false,
			command: dockCommandName,
			error: `Session '${sessionName}' does not exist. Launch Floyd dual-screen first.`,
		};
	}

	// Resolve the actual command if it's a predefined dock command
	const predefinedCommand = DOCK_COMMANDS[dockCommandName];
	const actualCommand = predefinedCommand?.command || dockCommandName;
	const actualArgs = predefinedCommand?.args || args;

	// Check if command is available
	const cmdExists = await commandExists(actualCommand);
	if (!cmdExists) {
		return {
			success: false,
			command: dockCommandName,
			error: `Command '${actualCommand}' is not available on this system.`,
		};
	}

	try {
		let target = await getDockTarget(sessionName, windowName, socketPath);

		if (!target) {
			return {
				success: false,
				command: dockCommandName,
				error: `Could not find target pane in ${sessionName}:${windowName}`,
			};
		}

		// Create new pane if requested
		if (createNewPane) {
			const splitFlag = splitDirection === 'v' ? '-v' : '-h';
			await execTmux(
				['split-window', '-t', target, splitFlag, '-c', '#{pane_current_path}'],
				socketPath,
			);

			// Get the new pane (last pane in the window)
			const panes = await SessionManager.getSessionPanes(
				sessionName,
				socketPath,
			);
			const newPane = panes[panes.length - 1];
			if (newPane) {
				target = `%${newPane.id}`;
			}
		}

		// Clear the pane and send command
		await execTmux(['send-keys', '-t', target, 'C-c'], socketPath); // Send Ctrl+C to stop any running process
		await execTmux(['send-keys', '-t', target, 'Clear'], socketPath);
		await execTmux(['send-keys', '-t', target, 'Enter'], socketPath);

		// Build the full command string
		const fullCommand =
			actualArgs.length > 0
				? `${actualCommand} ${actualArgs.join(' ')}`
				: actualCommand;

		// Send the command
		await execTmux(['send-keys', '-t', target, fullCommand], socketPath);
		await execTmux(['send-keys', '-t', target, 'Enter'], socketPath);

		// Get the pane ID
		const paneMatch = target.match(/%(\d+)/);
		const paneId =
			paneMatch && paneMatch[1] ? parseInt(paneMatch[1], 10) : undefined;

		return {
			success: true,
			command: dockCommandName,
			paneId,
		};
	} catch (error) {
		return {
			success: false,
			command: dockCommandName,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * List available dock commands
 */
export function listDockCommands(): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [name, config] of Object.entries(DOCK_COMMANDS)) {
		result[name] = config.description || config.command;
	}
	return result;
}

/**
 * Check if a dock command is available
 */
export async function checkDockCommand(commandName: string): Promise<boolean> {
	const predefinedCommand = DOCK_COMMANDS[commandName];
	const actualCommand = predefinedCommand?.command || commandName;
	return commandExists(actualCommand);
}

/**
 * Dock class for managing dock operations
 */
export class Dock {
	private sessionName: string;
	private windowName: string;
	private socketPath?: string;

	constructor(options?: {
		sessionName?: string;
		windowName?: string;
		socketPath?: string;
	}) {
		this.sessionName = options?.sessionName || 'floyd';
		this.windowName = options?.windowName || 'Monitor';
		this.socketPath = options?.socketPath;
	}

	/**
	 * Execute a dock command
	 */
	async execute(
		command: string,
		args?: string[],
		createNewPane?: boolean,
	): Promise<DockResult> {
		return executeDockCommand({
			command,
			args,
			sessionName: this.sessionName,
			windowName: this.windowName,
			socketPath: this.socketPath,
			createNewPane,
		});
	}

	/**
	 * Launch btop
	 */
	async btop(): Promise<DockResult> {
		return this.execute('btop');
	}

	/**
	 * Launch htop
	 */
	async htop(): Promise<DockResult> {
		return this.execute('htop');
	}

	/**
	 * Launch lazydocker
	 */
	async lazydocker(): Promise<DockResult> {
		return this.execute('lazydocker');
	}

	/**
	 * Launch lazygit
	 */
	async lazygit(): Promise<DockResult> {
		return this.execute('lazygit');
	}

	/**
	 * Clear the monitor pane
	 */
	async clear(): Promise<DockResult> {
		const target = await getDockTarget(
			this.sessionName,
			this.windowName,
			this.socketPath,
		);
		if (!target) {
			return {
				success: false,
				command: 'clear',
				error: `Could not find target pane in ${this.sessionName}:${this.windowName}`,
			};
		}

		try {
			await execTmux(['send-keys', '-t', target, 'C-c'], this.socketPath);
			await execTmux(['send-keys', '-t', target, 'Clear'], this.socketPath);
			await execTmux(['send-keys', '-t', target, 'Enter'], this.socketPath);

			const paneMatch = target.match(/%(\d+)/);
			const paneId =
				paneMatch && paneMatch[1] ? parseInt(paneMatch[1], 10) : undefined;

			return {
				success: true,
				command: 'clear',
				paneId,
			};
		} catch (error) {
			return {
				success: false,
				command: 'clear',
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Send arbitrary keys to the monitor pane
	 */
	async sendKeys(keys: string): Promise<DockResult> {
		const target = await getDockTarget(
			this.sessionName,
			this.windowName,
			this.socketPath,
		);
		if (!target) {
			return {
				success: false,
				command: 'send-keys',
				error: `Could not find target pane in ${this.sessionName}:${this.windowName}`,
			};
		}

		try {
			await execTmux(['send-keys', '-t', target, keys], this.socketPath);

			const paneMatch = target.match(/%(\d+)/);
			const paneId =
				paneMatch && paneMatch[1] ? parseInt(paneMatch[1], 10) : undefined;

			return {
				success: true,
				command: 'send-keys',
				paneId,
			};
		} catch (error) {
			return {
				success: false,
				command: 'send-keys',
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}
}

/**
 * Parse dock command from input string
 * Supports formats:
 * - ":dock btop"
 * - ":dock btop --utf-force"
 * - "dock lazydocker"
 * - ":btop" (shorthand)
 */
export function parseDockCommand(
	input: string,
): { command: string; args?: string[] } | null {
	const trimmed = input.trim();

	// Match :dock <command> [args...]
	const dockMatch = trimmed.match(/^:?\s*dock\s+(\S+)(?:\s+(.*))?$/);
	if (dockMatch && dockMatch[1]) {
		const command = dockMatch[1];
		const argsStr = dockMatch[2];
		const args = argsStr?.split(/\s+/).filter(Boolean);
		return { command, args };
	}

	// Match shorthand :<command> for predefined commands
	const shorthandMatch = trimmed.match(/^:(\w+)(?:\s+(.*))?$/);
	if (shorthandMatch && shorthandMatch[1]) {
		const command = shorthandMatch[1];
		if (command in DOCK_COMMANDS) {
			const argsStr = shorthandMatch[2];
			const args = argsStr?.split(/\s+/).filter(Boolean);
			return { command, args };
		}
	}

	return null;
}

/**
 * Export all functions and the Dock class
 */
export default {
	executeDockCommand,
	listDockCommands,
	checkDockCommand,
	Dock,
	parseDockCommand,
	DOCK_COMMANDS,
};
