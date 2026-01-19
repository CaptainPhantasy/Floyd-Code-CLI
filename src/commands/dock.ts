/**
 * Dock Command Handler
 *
 * Standalone dock command for executing a tool in the TMUX monitor pane.
 *
 * Usage:
 * - floyd-cli --dock :dock btop
 * - floyd-cli --dock :dock lazygit --split h
 */

import {
	executeDockCommand,
	listDockCommands,
	parseDockCommand,
} from '../tmux/dock.js';

export interface DockCommandOptions {
	/**
	 * Raw dock input string (e.g., ":dock btop")
	 */
	input: string;

	/**
	 * Session name (default: 'floyd')
	 */
	sessionName?: string;

	/**
	 * TMUX socket path (optional)
	 */
	socketPath?: string;

	/**
	 * Create a new pane for the dock command
	 */
	createNewPane?: boolean;

	/**
	 * Split direction for new pane (v or h)
	 */
	splitDirection?: 'v' | 'h';
}

export interface DockCommandResult {
	success: boolean;
	message: string;
	data?: {paneId?: number};
}

export async function runDockCommand(
	options: DockCommandOptions,
): Promise<DockCommandResult> {
	const {
		input,
		sessionName = 'floyd',
		socketPath,
		createNewPane = false,
		splitDirection = 'v',
	} = options;

	const parsed = parseDockCommand(input);
	if (!parsed) {
		const available = listDockCommands();
		return {
			success: false,
			message: `Invalid dock command.\n\nAvailable commands:\n${Object.entries(
				available,
			)
				.map(([name, desc]) => `  ${name.padEnd(12)} - ${desc}`)
				.join('\n')}`,
		};
	}

	const result = await executeDockCommand({
		command: parsed.command,
		args: parsed.args,
		sessionName,
		socketPath,
		createNewPane,
		splitDirection,
	});

	if (!result.success) {
		return {
			success: false,
			message: result.error || `Failed to execute dock command '${parsed.command}'`,
		};
	}

	return {
		success: true,
		message: `Dock command '${parsed.command}' executed in monitor window`,
		data: {paneId: result.paneId},
	};
}

export function showDockHelp(): string {
	const available = listDockCommands();
	return `
FLOYD Dock Commands

Usage:
  floyd-cli --dock :dock <command> [args...]
  floyd-cli --dock :<command>

Available Commands:
${Object.entries(available)
	.map(([name, desc]) => `  ${name.padEnd(12)} - ${desc}`)
	.join('\n')}
`;
}

export function parseDockArgs(args: string[]): DockCommandOptions | null {
	const input = args.join(' ').trim();
	if (!input) return null;

	let createNewPane = false;
	let splitDirection: 'v' | 'h' = 'v';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--split' && args[i + 1]) {
			const dir = args[++i];
			if (dir === 'h' || dir === 'v') {
				createNewPane = true;
				splitDirection = dir;
			}
		}
	}

	return {
		input,
		createNewPane,
		splitDirection,
	};
}

export default {
	runDockCommand,
	showDockHelp,
	parseDockArgs,
};
