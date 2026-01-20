/**
 * Slash Commands System
 *
 * Parses and executes user-defined slash commands.
 * Integrates with the command registry and skills system.
 *
 * @module commands/slash-commands
 */

import {readdir, readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import type {CommandDefinition} from './command-handler.js';
import {CommandRegistry} from './command-registry.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Slash command definition (from file)
 */
export interface SlashCommandFile {
	/** Command name (without /) */
	name: string;

	/** Command description */
	description: string;

	/** Usage string */
	usage?: string;

	/** Examples */
	examples?: string[];

	/** Command template (shell command or JavaScript) */
	template: string;

	/** Template engine type */
	templateType: 'shell' | 'javascript';

	/** Variables to substitute */
	variables?: Record<string, string>;

	/** Whether command runs in background */
	background?: boolean;

	/** Whether command requires confirmation */
	confirm?: boolean;

	/** Confirmation message */
	confirmMessage?: string;
}

/**
 * Slash command parser options
 */
export interface SlashCommandParserOptions {
	/** User commands directory (default: .floyd/commands) */
	userCommandsDir?: string;

	/** Global commands directory (default: ~/.floyd/commands) */
	globalCommandsDir?: string;

	/** Enable command variables */
	enableVariables?: boolean;

	/** Enable command chaining */
	enableChaining?: boolean;
}

/**
 * Parsed slash command
 */
export interface ParsedSlashCommand {
	/** Command name */
	name: string;

	/** Command arguments */
	args: string[];

	/** Raw input */
	input: string;

	/** Whether it's a valid slash command */
	valid: boolean;
}

// ============================================================================
// SLASH COMMAND PARSER CLASS
// ============================================================================

/**
 * SlashCommandParser - Parse and manage slash commands
 *
 * Supports:
 * - `/command` syntax detection
 * - Command discovery from user/global directories
 * - Variable substitution ({file}, {cursor}, etc.)
 * - Command chaining (&& and ||)
 */
export class SlashCommandParser {
	private readonly options: Required<SlashCommandParserOptions>;
	private readonly registry: CommandRegistry;

	constructor(
		registry: CommandRegistry,
		options: SlashCommandParserOptions = {},
	) {
		this.registry = registry;
		this.options = {
			userCommandsDir: options.userCommandsDir || '.floyd/commands',
			globalCommandsDir: options.globalCommandsDir || join(homedir(), '.floyd', 'commands'),
			enableVariables: options.enableVariables ?? true,
			enableChaining: options.enableChaining ?? true,
		};
	}

	/**
	 * Check if input is a slash command
	 */
	isSlashCommand(input: string): boolean {
		const trimmed = input.trim();
		return trimmed.startsWith('/') && trimmed.length > 1;
	}

	/**
	 * Parse a slash command
	 */
	parse(input: string): ParsedSlashCommand | null {
		const trimmed = input.trim();

		if (!this.isSlashCommand(trimmed)) {
			return null;
		}

		// Remove leading /
		const withoutSlash = trimmed.slice(1);

		// Split into name and args
		const parts = withoutSlash.split(/\s+/);
		const name = parts[0];
		const args = parts.slice(1);

		return {
			name,
			args,
			input: trimmed,
			valid: true,
		};
	}

	/**
	 * Discover slash commands from directories
	 */
	async discover(): Promise<{
		commands: SlashCommandFile[];
		errors: Array<{path: string; error: string}>;
	}> {
		const commands: SlashCommandFile[] = [];
		const errors: Array<{path: string; error: string}> = [];

		// Discover user commands
		try {
			const userResult = await this.discoverInDirectory(this.options.userCommandsDir);
			commands.push(...userResult.commands);
			errors.push(...userResult.errors);
		} catch {
			// User directory might not exist
		}

		// Discover global commands
		try {
			const globalResult = await this.discoverInDirectory(this.options.globalCommandsDir);
			commands.push(...globalResult.commands);
			errors.push(...globalResult.errors);
		} catch {
			// Global directory might not exist
		}

		return {commands, errors};
	}

	/**
	 * Discover slash commands in a directory
	 */
	async discoverInDirectory(dir: string): Promise<{
		commands: SlashCommandFile[];
		errors: Array<{path: string; error: string}>;
	}> {
		const commands: SlashCommandFile[] = [];
		const errors: Array<{path: string; error: string}> = [];

		try {
			const entries = await readdir(dir, {withFileTypes: true});

			for (const entry of entries) {
				if (!entry.isFile() || !entry.name.endsWith('.json')) {
					continue;
				}

				const commandPath = join(dir, entry.name);

				try {
					const content = await readFile(commandPath, 'utf-8');
					const command = JSON.parse(content) as SlashCommandFile;

					// Validate required fields
					if (!command.name || !command.description || !command.template) {
						errors.push({
							path: commandPath,
							error: 'Missing required fields (name, description, template)',
						});
						continue;
					}

					commands.push(command);
				} catch (error) {
					errors.push({
						path: commandPath,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		} catch (error) {
			// Directory might not exist
			errors.push({
				path: dir,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		return {commands, errors};
	}

	/**
	 * Register discovered slash commands
	 */
	async registerCommands(): Promise<{
		registered: number;
		failed: number;
	}> {
		const discovery = await this.discover();
		let registered = 0;
		let failed = 0;

		for (const cmd of discovery.commands) {
			try {
				// Create command definition
				const definition: CommandDefinition = {
					name: cmd.name,
					description: cmd.description,
					category: 'slash-commands',
					usage: cmd.usage,
					examples: cmd.examples,
					confirm: cmd.confirm,
					confirmMessage: cmd.confirmMessage,
					background: cmd.background,
					handler: async (args, context) => {
						return this.executeSlashCommand(cmd, args as string[], context);
					},
				};

				// Register with command registry
				this.registry.register(definition);
				registered++;
			} catch (error) {
				console.error(`Failed to register slash command: ${cmd.name}`, error);
				failed++;
			}
		}

		return {registered, failed};
	}

	/**
	 * Execute a slash command
	 */
	private async executeSlashCommand(
		command: SlashCommandFile,
		args: string[],
		context: any,
	): Promise<unknown> {
		// Substitute variables
		let template = command.template;

		if (this.options.enableVariables && command.variables) {
			for (const [key, value] of Object.entries(command.variables)) {
				template = template.replace(`{${key}}`, value);
			}
		}

		// Replace positional args
		for (let i = 0; i < args.length; i++) {
			template = template.replace(`{${i}}`, args[i]);
		}

		// Execute based on template type
		if (command.templateType === 'javascript') {
			return this.executeJavaScript(template, context);
		}

		return this.executeShell(template, context);
	}

	/**
	 * Execute shell command
	 */
	private async executeShell(
		command: string,
		context: any,
	): Promise<string> {
		const {exec} = await import('node:child_process');

		return new Promise((resolve, reject) => {
			exec(
				command,
				{
					cwd: context.cwd || process.cwd(),
					env: {...process.env, ...context.env},
				},
				(error, stdout, stderr) => {
					if (error) {
						reject(new Error(stderr || error.message));
					} else {
						resolve(stdout.trim());
					}
				},
			);
		});
	}

	/**
	 * Execute JavaScript template
	 */
	private async executeJavaScript(
		code: string,
		context: any,
	): Promise<unknown> {
		// Create async function with context
		const fn = new Function('context', `
			const { args, cwd, env, input } = context;
			return (async () => {
				${code}
			})();
		`);

		return fn(context);
	}

	/**
	 * Get built-in slash commands
	 */
	getBuiltInCommands(): CommandDefinition[] {
		return [
			{
				name: 'plan',
				description: 'Toggle Plan Mode - read-only codebase exploration',
				category: 'modes',
				usage: '/plan [on|off]',
				examples: ['/plan', '/plan on', '/plan off'],
				handler: async (args, context) => {
					// TODO: Implement Plan Mode toggle
					console.log('Plan Mode toggle:', args[0] || 'toggle');
				},
			},
			{
				name: 'rewind',
				description: 'Rewind to a previous checkpoint',
				category: 'rewind',
				usage: '/rewind [checkpoint-id]',
				examples: ['/rewind', '/rewind abc123', '/rewind latest'],
				handler: async (args, context) => {
					// TODO: Implement Rewind
					console.log('Rewind to:', args[0] || 'latest');
				},
			},
			{
				name: 'explore',
				description: 'Explore codebase with semantic search',
				category: 'exploration',
				usage: '/explore <query>',
				examples: ['/explore auth functions', '/explore all API endpoints'],
				handler: async (args, context) => {
					// TODO: Implement Explore Agent
					console.log('Explore:', (args as string[]).join(' '));
				},
			},
			{
				name: 'checkpoint',
				description: 'Manage checkpoints',
				category: 'rewind',
				usage: '/checkpoint <save|list|restore> [name]',
				examples: [
					'/checkpoint save before-refactor',
					'/checkpoint list',
					'/checkpoint restore before-refactor',
				],
				handler: async (args, context) => {
					// TODO: Implement Checkpoint commands
					console.log('Checkpoint:', (args as string[]).join(' '));
				},
			},
			{
				name: 'status',
				description: 'Show Floyd CLI status',
				category: 'general',
				usage: '/status',
				handler: async (args, context) => {
					// TODO: Implement status display
					console.log('Floyd CLI Status');
				},
			},
		];
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a slash command file in the user directory
 */
export async function createSlashCommand(
	command: SlashCommandFile,
	dir = '.floyd/commands',
): Promise<void> {
	const {writeFile, mkdir} = await import('node:fs/promises');
	const {join} = await import('node:path');

	// Create directory if it doesn't exist
	await mkdir(dir, {recursive: true});

	// Write command file
	const filePath = join(dir, `${command.name}.json`);
	await writeFile(filePath, JSON.stringify(command, null, 2), 'utf-8');
}

export default SlashCommandParser;
