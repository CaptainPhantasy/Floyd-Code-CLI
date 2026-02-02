/**
 * TMUX Command Handler
 *
 * Handles TMUX dual-screen session management:
 * - Launch dual-screen mode (Main CLI + Monitor dashboard)
 * - Attach to existing sessions
 * - List active sessions
 * - Kill sessions
 * - Execute dock commands in monitor window
 *
 * Usage:
 * - floyd-cli --tmux           : Launch dual-screen mode
 * - floyd-cli --tmux attach    : Attach to existing session
 * - floyd-cli --tmux list      : List all Floyd sessions
 * - floyd-cli --tmux kill      : Kill the Floyd session
 * - floyd-cli --tmux :dock btop: Launch btop in monitor window
 *
 * @module commands/tmux
 */

import {
	launchDualScreen,
	attachSession,
	killSession,
	listSessions,
} from '../tmux/launcher.js';
import {
	executeDockCommand,
	parseDockCommand,
	listDockCommands,
} from '../tmux/dock.js';

export interface TmuxCommandOptions {
	/**
	 * Session name (default: 'floyd')
	 */
	sessionName?: string;

	/**
	 * Action to perform
	 */
	action?: 'launch' | 'attach' | 'list' | 'kill' | 'dock';

	/**
	 * Dock command to execute
	 */
	dockCommand?: string;

	/**
	 * Main window command (default: 'floyd-cli')
	 */
	mainCommand?: string;

	/**
	 * Monitor window command (default: 'floyd-cli --monitor')
	 */
	monitorCommand?: string;

	/**
	 * Whether to attach after launching (default: true)
	 */
	attach?: boolean;

	/**
	 * Socket path for TMUX
	 */
	socketPath?: string;
}

export interface TmuxCommandResult {
	success: boolean;
	message: string;
	data?: any;
}

/**
 * Resolve the binary name based on how the CLI was invoked
 */
function getBinaryName(): string {
	// Check if we're running as floyd-cli or floyd
	const argv0 = process.argv[1];
	if (argv0?.includes('floyd-cli')) {
		return 'floyd-cli';
	}
	return 'floyd';
}

/**
 * Execute a TMUX command based on the provided options
 */
export async function executeTmuxCommand(
	options: TmuxCommandOptions = {},
): Promise<TmuxCommandResult> {
	const {
		sessionName = 'floyd',
		action = 'launch',
		attach = true,
		socketPath,
	} = options;

	const binaryName = getBinaryName();
	const mainCommand = options.mainCommand || `${binaryName}`;
	const monitorCommand = options.monitorCommand || `${binaryName} --monitor`;

	// Handle dock commands
	if (action === 'dock' && options.dockCommand) {
		return await handleDockCommand(
			options.dockCommand,
			sessionName,
			socketPath,
		);
	}

	// Handle list action
	if (action === 'list') {
		return await handleListCommand(socketPath);
	}

	// Handle kill action
	if (action === 'kill') {
		return await handleKillCommand(sessionName, socketPath);
	}

	// Handle attach action
	if (action === 'attach') {
		return await handleAttachCommand(sessionName, socketPath);
	}

	// Handle launch action (default)
	return await handleLaunchCommand(
		sessionName,
		mainCommand,
		monitorCommand,
		attach,
		socketPath,
	);
}

/**
 * Handle dock command execution
 */
async function handleDockCommand(
	dockCommandStr: string,
	sessionName: string,
	socketPath?: string,
): Promise<TmuxCommandResult> {
	// Parse the dock command
	const parsed = parseDockCommand(dockCommandStr);

	if (!parsed) {
		// Show available dock commands
		const available = listDockCommands();
		return {
			success: false,
			message: `Invalid dock command format. Use ':dock <command>' or ':<command>'\n\nAvailable commands:\n${Object.entries(
				available,
			)
				.map(([name, desc]) => `  ${name.padEnd(12)} - ${desc}`)
				.join('\n')}`,
		};
	}

	const {command, args} = parsed;

	// Execute the dock command
	const result = await executeDockCommand({
		command,
		args,
		sessionName,
		windowName: 'Monitor',
		socketPath,
	});

	if (result.success) {
		return {
			success: true,
			message: `Dock command '${command}' executed in monitor window`,
			data: {paneId: result.paneId},
		};
	}

	return {
		success: false,
		message: result.error || `Failed to execute dock command '${command}'`,
	};
}

/**
 * Handle list sessions command
 */
async function handleListCommand(
	socketPath?: string,
): Promise<TmuxCommandResult> {
	const sessions = await listSessions(socketPath);

	if (sessions.length === 0) {
		return {
			success: true,
			message: 'No active Floyd sessions found',
		};
	}

	return {
		success: true,
		message: `Active Floyd sessions:\n${sessions
			.map(s => `  - ${s}`)
			.join('\n')}`,
		data: {sessions},
	};
}

/**
 * Handle kill session command
 */
async function handleKillCommand(
	sessionName: string,
	socketPath?: string,
): Promise<TmuxCommandResult> {
	const killed = await killSession(sessionName, socketPath);

	if (killed) {
		return {
			success: true,
			message: `Session '${sessionName}' has been terminated`,
		};
	}

	return {
		success: false,
		message: `Failed to kill session '${sessionName}'. It may not exist.`,
	};
}

/**
 * Handle attach to session command
 */
async function handleAttachCommand(
	sessionName: string,
	socketPath?: string,
): Promise<TmuxCommandResult> {
	try {
		await attachSession(sessionName, socketPath);
		// This function doesn't return if attachment succeeds
		return {
			success: true,
			message: `Attached to session '${sessionName}'`,
		};
	} catch (error) {
		return {
			success: false,
			message: `Failed to attach to session '${sessionName}': ${
				error instanceof Error ? error.message : String(error)
			}`,
		};
	}
}

/**
 * Handle launch dual-screen command
 */
async function handleLaunchCommand(
	sessionName: string,
	mainCommand: string,
	monitorCommand: string,
	attach: boolean,
	socketPath?: string,
): Promise<TmuxCommandResult> {
	const result = await launchDualScreen({
		sessionName,
		mainWindowName: 'Main',
		monitorWindowName: 'Monitor',
		mainCommand,
		monitorCommand,
		attach,
		socketPath,
	});

	if (result.success) {
		return {
			success: true,
			message: attach
				? `Launched dual-screen session '${sessionName}' and attached`
				: `Launched dual-screen session '${sessionName}'\nAttach with: tmux attach -t ${sessionName}`,
			data: {
				sessionName: result.sessionName,
				mainWindowId: result.mainWindowId,
				monitorWindowId: result.monitorWindowId,
			},
		};
	}

	return {
		success: false,
		message: result.error || `Failed to launch dual-screen session`,
	};
}

/**
 * Parse command line arguments into TmuxCommandOptions
 */
export function parseTmuxArgs(args: string[]): TmuxCommandOptions {
	const options: TmuxCommandOptions = {
		action: 'launch',
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case 'attach':
				options.action = 'attach';
				break;

			case 'list':
			case 'ls':
				options.action = 'list';
				break;

			case 'kill':
			case 'stop':
				options.action = 'kill';
				break;

			case 'no-attach':
			case '--no-attach':
				options.attach = false;
				break;

			case '-s':
			case '--session':
				if (args[i + 1]) {
					options.sessionName = args[++i];
				}
				break;

			default:
				// Check if it's a dock command
				if (arg && (arg.startsWith(':') || arg.startsWith('dock '))) {
					options.action = 'dock';
					options.dockCommand = arg;
				}
				break;
		}
	}

	return options;
}

/**
 * Display usage information for TMUX commands
 */
export function showTmuxHelp(): string {
	const binaryName = getBinaryName();

	return `
FLOYD TMUX Dual-Screen Mode

Usage:
  ${binaryName} --tmux [action] [options]

Actions:
  (none)      Launch dual-screen mode (default)
  attach      Attach to existing Floyd session
  list, ls    List all active Floyd sessions
  kill        Kill the Floyd session
  :dock <cmd> Execute dock command in monitor window

Dock Commands:
  :dock btop       Launch system monitor
  :dock htop       Launch process viewer
  :dock lazydocker Launch Docker TUI
  :dock lazygit    Launch Git TUI

Options:
  -s, --session <name>  Session name (default: floyd)
  --no-attach          Create session without attaching

Examples:
  ${binaryName} --tmux                    Launch dual-screen mode
  ${binaryName} --tmux attach             Attach to existing session
  ${binaryName} --tmux list               List all sessions
  ${binaryName} --tmux kill               Kill Floyd session
  ${binaryName} --tmux :dock btop         Launch btop in monitor window
  ${binaryName} --tmux -s myproject       Create named session

Keyboard Shortcuts (in TMUX):
  Ctrl+B, 1     Switch to Main window
  Ctrl+B, 2     Switch to Monitor window
  Ctrl+B, n     Next window
  Ctrl+B, p     Previous window
  Ctrl+B, d     Detach from session
`;
}

export default {
	executeTmuxCommand,
	parseTmuxArgs,
	showTmuxHelp,
};
