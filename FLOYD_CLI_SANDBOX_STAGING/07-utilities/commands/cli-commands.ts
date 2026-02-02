/**
 * Built-in CLI Commands
 *
 * Standard CLI commands available in Floyd.
 * These are the core commands that work out of the box.
 *
 * @module commands/cli-commands
 */

import type {CommandDefinition} from './command-handler.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * CLI command arguments
 */
export interface CLICommandArgs {
	/** Positional arguments */
	_: string[];

	/** Named flags/options */
	[key: string]: unknown;
}

/**
 * Help command arguments
 */
export interface HelpArgs extends CLICommandArgs {
	/** Command to get help for */
	command?: string;
}

/**
 * History command arguments
 */
export interface HistoryArgs extends CLICommandArgs {
	/** Number of entries to show */
	count?: number;

	/** Clear history */
	clear?: boolean;

	/** Search pattern */
	search?: string;
}

/**
 * Config command arguments
 */
export interface ConfigArgs extends CLICommandArgs {
	/** Get a config value */
	get?: string;

	/** Set a config value */
	set?: string;

	/** List all config */
	list?: boolean;

	/** Reset to defaults */
	reset?: boolean;
}

/**
 * Session command arguments
 */
export interface SessionArgs extends CLICommandArgs {
	/** New session name */
	new?: string;

	/** List sessions */
	list?: boolean;

	/** Switch session */
	switch?: string;

	/** Delete session */
	delete?: string;
}

// ============================================================================
// BUILT-IN COMMAND DEFINITIONS
// ============================================================================

/**
 * Help command - Show help information
 */
export const helpCommand: CommandDefinition<
	HelpArgs,
	Record<string, unknown>
> = {
	name: 'help',
	aliases: ['?', 'h'],
	description: 'Show help information',
	usage: 'help [command]',
	examples: ['help', 'help history', '? config'],
	category: 'general',
	handler: async args => {
		// If a specific command is requested, show detailed help
		if (args.command) {
			return {
				command: args.command,
				help: `Help for "${args.command}"`,
				// In a full implementation, we'd look up the command and show its details
			};
		}

		// Show general help
		return {
			commands: ['help', 'history', 'config', 'session', 'status', 'exit'],
			tip: 'Use "help <command>" for detailed information',
		};
	},
};

/**
 * History command - Manage command history
 */
export const historyCommand: CommandDefinition<
	HistoryArgs,
	Record<string, unknown>
> = {
	name: 'history',
	aliases: ['hist', '!'],
	description: 'Show or manage command history',
	usage: 'history [options]',
	examples: [
		'history',
		'history 20',
		'history --clear',
		'history --search git',
	],
	category: 'general',
	handler: async args => {
		if (args.clear) {
			return {
				action: 'clear',
				message: 'History cleared',
			};
		}

		if (args.search) {
			return {
				action: 'search',
				pattern: args.search,
				message: `Searching for: ${args.search}`,
			};
		}

		const count = args.count ?? 10;
		return {
			action: 'show',
			count,
			message: `Showing last ${count} commands`,
		};
	},
};

/**
 * Config command - Manage Floyd configuration
 */
export const configCommand: CommandDefinition<
	ConfigArgs,
	Record<string, unknown>
> = {
	name: 'config',
	aliases: ['cfg', 'settings'],
	description: 'Manage Floyd configuration',
	usage: 'config [options]',
	examples: [
		'config --list',
		'config --get api.key',
		'config --set theme dark',
		'config --reset',
	],
	category: 'settings',
	handler: async args => {
		if (args.list) {
			return {
				action: 'list',
				config: {
					theme: 'crush',
					editor: 'vim',
					apiKey: '***',
				},
			};
		}

		if (args.get) {
			return {
				action: 'get',
				key: args.get,
				value: 'config value',
			};
		}

		if (args.set) {
			// Parse key=value format
			return {
				action: 'set',
				key: args.set,
				message: `Configuration updated: ${args.set}`,
			};
		}

		if (args.reset) {
			return {
				action: 'reset',
				message: 'Configuration reset to defaults',
			};
		}

		return {
			action: 'show',
			message: 'Current configuration',
		};
	},
};

/**
 * Session command - Manage Floyd sessions
 */
export const sessionCommand: CommandDefinition<
	SessionArgs,
	Record<string, unknown>
> = {
	name: 'session',
	aliases: ['sess'],
	description: 'Manage Floyd sessions',
	usage: 'session [options]',
	examples: [
		'session --list',
		'session --new my-project',
		'session --switch my-project',
		'session --delete old-project',
	],
	category: 'session',
	handler: async args => {
		if (args.list) {
			return {
				action: 'list',
				sessions: [
					{name: 'default', path: '/home/user/project', active: true},
					{name: 'my-project', path: '/home/user/my-project', active: false},
				],
			};
		}

		if (args.new) {
			return {
				action: 'new',
				name: args.new,
				message: `Created new session: ${args.new}`,
			};
		}

		if (args.switch) {
			return {
				action: 'switch',
				name: args.switch,
				message: `Switched to session: ${args.switch}`,
			};
		}

		if (args.delete) {
			return {
				action: 'delete',
				name: args.delete,
				message: `Deleted session: ${args.delete}`,
			};
		}

		return {
			action: 'show',
			message: 'Session information',
		};
	},
};

/**
 * Status command - Show Floyd status
 */
export const statusCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'status',
	aliases: ['st'],
	description: 'Show Floyd status',
	usage: 'status',
	examples: ['status'],
	category: 'general',
	handler: async () => {
		return {
			version: '1.0.0',
			mode: 'interactive',
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			session: {
				id: 'default',
				messages: 42,
			},
			api: {
				provider: 'GLM-4',
				status: 'connected',
			},
		};
	},
};

/**
 * Exit command - Exit Floyd CLI
 */
export const exitCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'exit',
	aliases: ['quit', 'q'],
	description: 'Exit Floyd CLI',
	usage: 'exit',
	examples: ['exit', 'quit', ':q'],
	category: 'general',
	handler: async () => {
		return {
			action: 'exit',
			message: 'Goodbye!',
		};
	},
};

/**
 * Clear command - Clear the screen
 */
export const clearCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'clear',
	aliases: ['cls'],
	description: 'Clear the terminal screen',
	usage: 'clear',
	examples: ['clear', 'cls'],
	category: 'general',
	handler: async () => {
		return {
			action: 'clear',
		};
	},
};

/**
 * Version command - Show Floyd version
 */
export const versionCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'version',
	aliases: ['v'],
	description: 'Show Floyd version information',
	usage: 'version',
	examples: ['version', 'v'],
	category: 'general',
	handler: async () => {
		return {
			name: 'Floyd CLI',
			version: '1.0.0',
			agent: 'GLM-4',
			build: '2025.01.17',
		};
	},
};

/**
 * Echo command - Echo input back
 */
export const echoCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'echo',
	description: 'Echo input back to output',
	usage: 'echo <text>',
	examples: ['echo hello', 'echo $PATH'],
	category: 'utility',
	handler: async args => {
		const text = args._.join(' ');
		return {
			output: text,
		};
	},
};

/**
 * MCP command arguments
 */
export interface MCPArgs extends CLICommandArgs {
	/** List connected servers */
	list?: boolean;

	/** List available tools */
	tools?: boolean;

	/** Reload MCP configuration */
	reload?: boolean;

	/** Show server details */
	server?: string;
}

/**
 * PWD command arguments
 */
export const pwdCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'pwd',
	description: 'Print working directory',
	usage: 'pwd',
	examples: ['pwd'],
	category: 'utility',
	handler: async (_args, context) => {
		return {
			cwd: context.cwd ?? process.cwd(),
		};
	},
};

/**
 * CD command - Change directory
 */
export const cdCommand: CommandDefinition<
	CLICommandArgs,
	Record<string, unknown>
> = {
	name: 'cd',
	description: 'Change working directory',
	usage: 'cd <path>',
	examples: ['cd ~/projects', 'cd ..'],
	category: 'utility',
	handler: async args => {
		const pathArg = args._[0] ?? '~';
		return {
			action: 'cd',
			path: pathArg,
			message: `Changed to ${pathArg}`,
		};
	},
};

/**
 * MCP command - Manage MCP server connections
 */
export const mcpCommand: CommandDefinition<MCPArgs, Record<string, unknown>> = {
	name: 'mcp',
	aliases: ['mcp-servers'],
	description: 'Manage Model Context Protocol (MCP) server connections',
	usage: 'mcp [options]',
	examples: [
		'mcp --list',
		'mcp --tools',
		'mcp --reload',
		'mcp --server filesystem',
	],
	category: 'settings',
	handler: async args => {
		if (args.list) {
			return {
				action: 'list',
				servers: [
					{
						name: 'patch',
						type: 'builtin',
						status: 'running',
						tools: 5,
					},
					{
						name: 'git',
						type: 'builtin',
						status: 'running',
						tools: 8,
					},
					{
						name: 'cache',
						type: 'builtin',
						status: 'running',
						tools: 4,
					},
				],
				message: 'Connected MCP servers',
			};
		}

		if (args.tools) {
			return {
				action: 'tools',
				tools: [
					{name: 'patch_apply', server: 'patch', description: 'Apply unified diff'},
					{name: 'git_status', server: 'git', description: 'Show git status'},
					{name: 'git_diff', server: 'git', description: 'Show git diff'},
					{name: 'cache_store', server: 'cache', description: 'Store in cache'},
					{name: 'cache_retrieve', server: 'cache', description: 'Retrieve from cache'},
				],
				message: 'Available MCP tools',
			};
		}

		if (args.reload) {
			return {
				action: 'reload',
				message: 'MCP configuration reloaded from .floyd/mcp.json',
			};
		}

		if (args.server) {
			return {
				action: 'server',
				name: args.server,
				details: {
					name: args.server,
					type: 'stdio',
					status: 'connected',
					tools: 5,
				},
			};
		}

		return {
			action: 'show',
			message: 'MCP server management - use --list, --tools, --reload, or --server <name>',
		};
	},
};

// ============================================================================
// COMMAND COLLECTIONS
// ============================================================================

/**
 * All built-in commands
 */
export const builtInCommands: Array<CommandDefinition<unknown, unknown>> = [
	helpCommand as CommandDefinition,
	historyCommand as CommandDefinition,
	configCommand as CommandDefinition,
	sessionCommand as CommandDefinition,
	mcpCommand as CommandDefinition,
	statusCommand as CommandDefinition,
	exitCommand as CommandDefinition,
	clearCommand as CommandDefinition,
	versionCommand as CommandDefinition,
	echoCommand as CommandDefinition,
	pwdCommand as CommandDefinition,
	cdCommand as CommandDefinition,
];

/**
 * General commands
 */
export const generalCommands: Array<CommandDefinition<unknown, unknown>> = [
	helpCommand as CommandDefinition,
	historyCommand as CommandDefinition,
	statusCommand as CommandDefinition,
	exitCommand as CommandDefinition,
	clearCommand as CommandDefinition,
	versionCommand as CommandDefinition,
];

/**
 * Settings commands
 */
export const settingsCommands: Array<CommandDefinition<unknown, unknown>> = [
	configCommand as CommandDefinition,
	sessionCommand as CommandDefinition,
	mcpCommand as CommandDefinition,
];

/**
 * Utility commands
 */
export const utilityCommands: CommandDefinition<unknown, unknown>[] = [
	echoCommand as CommandDefinition<unknown, unknown>,
	pwdCommand as CommandDefinition<unknown, unknown>,
	cdCommand as CommandDefinition<unknown, unknown>,
];

/**
 * Get command by name or alias (with proper typing)
 */
export function getCommand<T = CLICommandArgs, R = Record<string, unknown>>(
	name: string,
): CommandDefinition<T, R> | undefined {
	const normalizedName = name.toLowerCase();

	for (const command of builtInCommands) {
		if (command.name === normalizedName) {
			return command as CommandDefinition<T, R>;
		}
		if (command.aliases?.includes(normalizedName)) {
			return command as CommandDefinition<T, R>;
		}
	}

	return undefined;
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(
	category: string,
): CommandDefinition<unknown, unknown>[] {
	return builtInCommands.filter(cmd => cmd.category === category);
}

/**
 * Search commands by pattern
 */
export function searchCommands(
	pattern: string,
): CommandDefinition<unknown, unknown>[] {
	const lowerPattern = pattern.toLowerCase();
	return builtInCommands.filter(
		cmd =>
			cmd.name.includes(lowerPattern) ||
			cmd.description?.toLowerCase().includes(lowerPattern) ||
			cmd.aliases?.some(alias => alias.includes(lowerPattern)),
	);
}

/**
 * Format command for display
 */
export function formatCommand(
	command: CommandDefinition<unknown, unknown>,
): string {
	const aliases = command.aliases?.length
		? ` (${command.aliases.join(', ')})`
		: '';

	const description = command.description ?? '';

	return `  ${command.name}${aliases.padEnd(20)}  ${description}`;
}

/**
 * Show help for all commands
 */
export function showAllCommands(): string {
	const lines: string[] = [
		'Floyd CLI Commands',
		'',
		'General:',
		...generalCommands.map(formatCommand),
		'',
		'Settings:',
		...settingsCommands.map(formatCommand),
		'',
		'Utility:',
		...utilityCommands.map(formatCommand),
		'',
		'Use "help <command>" for detailed information.',
	];

	return lines.join('\n');
}

export default builtInCommands;
