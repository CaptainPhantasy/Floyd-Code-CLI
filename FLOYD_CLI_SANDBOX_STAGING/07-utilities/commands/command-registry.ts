/**
 * Command Registry
 *
 * Central registry for CLI commands. Provides registration, lookup,
 * and execution functionality for all CLI commands (not IPC commands).
 *
 * @module commands/command-registry
 */

import type {CommandDefinition} from './command-handler.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Command name type - all registered CLI commands
 */
export type CLICommandName = string;

/**
 * Command registry type
 */
export type CommandRegistryType = Map<CLICommandName, CommandDefinition>;

/**
 * Registry options
 */
export interface CommandRegistryOptions {
	/** Case-insensitive command matching */
	caseInsensitive?: boolean;

	/** Allow command aliases */
	allowAliases?: boolean;

	/** Maximum command execution time in ms */
	defaultTimeout?: number;
}

// ============================================================================
// COMMAND REGISTRY CLASS
// ============================================================================

/**
 * CommandRegistry - Central registry for CLI commands
 *
 * Manages command registration, aliases, and provides lookup functionality.
 * Commands are registered with a unique name and optional aliases.
 */
export class CommandRegistry {
	private readonly commands: CommandRegistryType = new Map();
	private readonly aliases: Map<string, CLICommandName> = new Map();
	private readonly options: Required<CommandRegistryOptions>;

	constructor(options: CommandRegistryOptions = {}) {
		this.options = {
			caseInsensitive: options.caseInsensitive ?? true,
			allowAliases: options.allowAliases ?? true,
			defaultTimeout: options.defaultTimeout ?? 30000,
		};
	}

	/**
	 * Register a command
	 */
	register(definition: CommandDefinition): void {
		const normalizedName = this.normalizeName(definition.name);

		// Check for conflicts
		if (this.commands.has(normalizedName)) {
			throw new Error(`Command already registered: ${definition.name}`);
		}

		// Register the command
		this.commands.set(normalizedName, {
			...definition,
			name: normalizedName,
		});

		// Register aliases
		if (this.options.allowAliases && definition.aliases) {
			for (const alias of definition.aliases) {
				const normalizedAlias = this.normalizeName(alias);
				if (this.aliases.has(normalizedAlias)) {
					throw new Error(`Alias already registered: ${alias}`);
				}
				this.aliases.set(normalizedAlias, normalizedName);
			}
		}
	}

	/**
	 * Unregister a command
	 */
	unregister(name: CLICommandName): boolean {
		const normalizedName = this.normalizeName(name);

		// Remove command
		const removed = this.commands.delete(normalizedName);

		// Remove associated aliases
		for (const [alias, commandName] of this.aliases.entries()) {
			if (commandName === normalizedName) {
				this.aliases.delete(alias);
			}
		}

		return removed;
	}

	/**
	 * Get a command definition by name or alias
	 */
	get(name: CLICommandName): CommandDefinition | undefined {
		const normalizedName = this.normalizeName(name);

		// Check direct command
		let command = this.commands.get(normalizedName);

		// Check aliases
		if (!command) {
			const aliasedName = this.aliases.get(normalizedName);
			if (aliasedName) {
				command = this.commands.get(aliasedName);
			}
		}

		return command;
	}

	/**
	 * Check if a command is registered
	 */
	has(name: CLICommandName): boolean {
		return this.get(name) !== undefined;
	}

	/**
	 * Get all registered command names
	 */
	names(): CLICommandName[] {
		return Array.from(this.commands.keys());
	}

	/**
	 * Get all command definitions
	 */
	all(): CommandDefinition[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Get commands by category
	 */
	byCategory(category: string): CommandDefinition[] {
		return this.all().filter(cmd => cmd.category === category);
	}

	/**
	 * Find commands matching a pattern
	 */
	find(pattern: string | RegExp): CommandDefinition[] {
		const allCommands = this.all();

		if (typeof pattern === 'string') {
			const searchPattern = this.options.caseInsensitive
				? pattern.toLowerCase()
				: pattern;

			return allCommands.filter(cmd => {
				const name = this.options.caseInsensitive
					? cmd.name.toLowerCase()
					: cmd.name;
				return name.includes(searchPattern);
			});
		}

		// RegExp pattern
		return allCommands.filter(cmd => pattern.test(cmd.name));
	}

	/**
	 * Clear all registered commands
	 */
	clear(): void {
		this.commands.clear();
		this.aliases.clear();
	}

	/**
	 * Get registry statistics
	 */
	getStats(): {
		totalCommands: number;
		totalAliases: number;
		categories: string[];
	} {
		const categories = new Set<string>();
		for (const cmd of this.all()) {
			if (cmd.category) {
				categories.add(cmd.category);
			}
		}

		return {
			totalCommands: this.commands.size,
			totalAliases: this.aliases.size,
			categories: Array.from(categories).sort(),
		};
	}

	/**
	 * Normalize a command name based on registry options
	 */
	private normalizeName(name: string): string {
		return this.options.caseInsensitive ? name.toLowerCase() : name;
	}
}

// ============================================================================
// DEFAULT REGISTRY INSTANCE
// ============================================================================

/**
 * Default global command registry instance
 */
let defaultRegistry: CommandRegistry | null = null;

/**
 * Get or create the default registry
 */
export function getDefaultRegistry(): CommandRegistry {
	if (!defaultRegistry) {
		defaultRegistry = new CommandRegistry();
	}
	return defaultRegistry;
}

/**
 * Reset the default registry (useful for testing)
 */
export function resetDefaultRegistry(): void {
	defaultRegistry = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Register multiple commands at once
 */
export function registerCommands(
	registry: CommandRegistry,
	commands: CommandDefinition[],
): void {
	for (const command of commands) {
		registry.register(command);
	}
}

/**
 * Create a command registry with predefined options
 */
export function createRegistry(
	options?: CommandRegistryOptions,
): CommandRegistry {
	return new CommandRegistry(options);
}

export default CommandRegistry;
