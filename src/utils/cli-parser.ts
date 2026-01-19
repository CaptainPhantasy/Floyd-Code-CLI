/**
 * CLI Parser Utility
 *
 * Purpose: Parse and validate CLI arguments using meow
 * Exports: parseCliArgs, CliArgs type, defineCliFlag
 * Related: cli.tsx
 */

import meow from 'meow';

// ============================================================================
// TYPES
// ============================================================================

export interface CliFlag<T = string | number | boolean> {
	name: string;
	alias?: string;
	type: 'string' | 'number' | 'boolean';
	default?: T;
	description: string;
	required?: boolean;
	choices?: T[];
}

export interface ParsedCliArgs {
	flags: Record<string, unknown>;
	input: string[];
	unknown: string[];
	showHelp: () => void;
	showVersion: () => void;
}

export interface CliParserOptions {
	name: string;
	description: string;
	version?: string;
	examples?: string[];
	flags?: Record<string, CliFlag>;
	autoHelp?: boolean;
	autoVersion?: boolean;
}

// ============================================================================
// PARSER
// ============================================================================

/**
 * Parse CLI arguments using meow
 *
 * @param options - Parser options
 * @param argv - Process arguments (defaults to process.argv.slice(2))
 * @returns Parsed arguments
 */
export function parseCliArgs(
	options: CliParserOptions,
	argv?: string[],
): ParsedCliArgs {
	// Build usage text
	const usage = buildUsageText(options);

	// Build meow flags config
	const meowFlags = buildMeowFlags(options.flags ?? {});

	// Parse with meow
	const result = meow(usage, {
		importMeta: import.meta,
		flags: meowFlags as any,
		autoHelp: options.autoHelp ?? true,
		autoVersion: options.autoVersion ?? false,
		argv: argv ?? process.argv.slice(2).filter(Boolean),
	});

	return {
		flags: result.flags as Record<string, unknown>,
		input: result.input,
		unknown: (result as any).unhandled ?? [],
		showHelp: () => result.showHelp(),
		showVersion: () => result.showVersion(),
	};
}

/**
 * Define a CLI flag with type safety
 */
export function defineCliFlag<T = string | number | boolean>(
	config: CliFlag<T>,
): CliFlag<T> {
	return config;
}

/**
 * Get a flag value with type coercion
 */
export function getFlag<T = string | number | boolean>(
	flags: Record<string, unknown>,
	name: string,
	defaultValue?: T,
): T | undefined {
	const value = flags[name];
	if (value === undefined) {
		return defaultValue;
	}
	return value as T;
}

/**
 * Get a required flag value
 */
export function getRequiredFlag<T = string | number | boolean>(
	flags: Record<string, unknown>,
	name: string,
): T {
	const value = flags[name];
	if (value === undefined || value === null) {
		throw new Error(`Required flag --${name} is missing`);
	}
	return value as T;
}

/**
 * Check if a flag is set
 */
export function hasFlag(flags: Record<string, unknown>, name: string): boolean {
	return flags[name] !== undefined && flags[name] !== null;
}

// ============================================================================
// HELP TEXT GENERATION
// ============================================================================

/**
 * Build the usage/help text for the CLI
 */
function buildUsageText(options: CliParserOptions): string {
	const lines: string[] = [];

	lines.push(options.description);
	lines.push('');

	lines.push('Usage');
	lines.push(`  $ ${options.name} [options]`);
	lines.push('');

	if (options.flags && Object.keys(options.flags).length > 0) {
		lines.push('Options');

		for (const [key, flag] of Object.entries(options.flags)) {
			const flagParts: string[] = [];

			// Flag name
			flagParts.push(`  --${key}`);

			// Alias
			if (flag.alias) {
				flagParts.push(`-${flag.alias}`);
			}

			// Type hint
			if (flag.type === 'string') {
				flagParts.push(`"<${key}>"`);
			} else if (flag.type === 'number') {
				flagParts.push(`<number>`);
			}

			lines.push(flagParts.join(' '));

			// Description
			if (flag.description) {
				lines.push(`    ${flag.description}`);

				// Default value
				if (flag.default !== undefined) {
					lines.push(`    Default: ${formatDefaultValue(flag.default)}`);
				}

				// Choices
				if (flag.choices && flag.choices.length > 0) {
					lines.push(`    Choices: ${flag.choices.join(', ')}`);
				}
			}

			lines.push('');
		}
	}

	if (options.examples && options.examples.length > 0) {
		lines.push('Examples');
		for (const example of options.examples) {
			lines.push(`  ${example}`);
		}
	}

	return lines.join('\n');
}

/**
 * Format a default value for display
 */
function formatDefaultValue(value: unknown): string {
	if (typeof value === 'string') {
		return `"${value}"`;
	}
	if (Array.isArray(value)) {
		return value.join(', ');
	}
	return String(value);
}

/**
 * Build meow flags configuration
 */
function buildMeowFlags(flags: Record<string, CliFlag>): Record<string, any> {
	const result: Record<string, any> = {};

	for (const [key, flag] of Object.entries(flags)) {
		result[key] = {
			type:
				flag.type === 'boolean'
					? 'boolean'
					: flag.type === 'number'
					? 'number'
					: 'string',
			default: flag.default,
			alias: flag.alias,
			isRequired: flag.required ?? false,
		};
	}

	return result;
}

// ============================================================================
// COMMON FLAG DEFINITIONS
// ============================================================================

/**
 * Common CLI flags used across FLOYD
 */
export const commonFlags = {
	verbose: defineCliFlag<boolean>({
		name: 'verbose',
		alias: 'v',
		type: 'boolean',
		default: false,
		description: 'Enable verbose output',
	}),

	quiet: defineCliFlag<boolean>({
		name: 'quiet',
		alias: 'q',
		type: 'boolean',
		default: false,
		description: 'Suppress non-error output',
	}),

	debug: defineCliFlag<boolean>({
		name: 'debug',
		alias: 'd',
		type: 'boolean',
		default: false,
		description: 'Enable debug mode',
	}),

	config: defineCliFlag<string>({
		name: 'config',
		alias: 'c',
		type: 'string',
		description: 'Path to config file',
	}),

	output: defineCliFlag<string>({
		name: 'output',
		alias: 'o',
		type: 'string',
		description: 'Output file path',
	}),

	force: defineCliFlag<boolean>({
		name: 'force',
		alias: 'f',
		type: 'boolean',
		default: false,
		description: 'Force operation without confirmation',
	}),
} as const;

export type CommonFlags = typeof commonFlags;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that required flags are present
 */
export function validateRequiredFlags(
	flags: Record<string, unknown>,
	required: string[],
): {valid: boolean; missing?: string[]} {
	const missing: string[] = [];

	for (const name of required) {
		if (!hasFlag(flags, name)) {
			missing.push(name);
		}
	}

	return {
		valid: missing.length === 0,
		missing: missing.length > 0 ? missing : undefined,
	};
}

/**
 * Validate that flag values are within allowed choices
 */
export function validateFlagChoices(
	flags: Record<string, unknown>,
	choices: Record<string, unknown[]>,
): {valid: boolean; invalid?: Record<string, unknown>} {
	const invalid: Record<string, unknown> = {};

	for (const [name, allowedValues] of Object.entries(choices)) {
		const value = flags[name];
		if (value !== undefined && !allowedValues.includes(value)) {
			invalid[name] = value;
		}
	}

	return {
		valid: Object.keys(invalid).length === 0,
		invalid: Object.keys(invalid).length > 0 ? invalid : undefined,
	};
}

export default parseCliArgs;
