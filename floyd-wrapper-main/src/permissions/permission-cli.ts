/**
 * PHASE 5 ITEM 27: Enhanced /permissions Command
 *
 * Rich permission management UI with wildcards and testing.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Permission rule types
 */
export type PermissionMode = 'yolo' | 'ask' | 'plan';

/**
 * Permission rule with wildcard support
 */
export interface PermissionRule {
	id: string;
	name: string;
	pattern: string; // Tool pattern, e.g., "Bash(npm *)", "Read(*.ts)"
	mode: PermissionMode;
	description?: string;
	scope?: string[]; // File paths this applies to
	enabled: boolean;
}

/**
 * Permission test result
 */
export interface PermissionTest {
	tool: string;
	args: Record<string, unknown>;
	rule?: PermissionRule;
	approved: boolean;
	mode: PermissionMode;
	reason?: string;
}

/**
 * Permission configuration
 */
export interface PermissionConfig {
	version: number;
	defaultMode: PermissionMode;
	rules: PermissionRule[];
}

/**
 * Permission CLI manager
 */
export class PermissionCLI {
	private configPath: string;
	private config: PermissionConfig;

	constructor(configPath?: string) {
		this.configPath = configPath || path.join(process.cwd(), '.floyd', 'permissions.yaml');
		this.config = {
			version: 1,
			defaultMode: 'ask',
			rules: [],
		};
	}

	/**
	 * Load configuration from file
	 */
	async load(): Promise<void> {
		try {
			const content = await fs.readFile(this.configPath, 'utf-8');
			this.config = yaml.load(content) as PermissionConfig;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.warn(`Failed to load permissions config: ${error}`);
			}
			// Use defaults
		}
	}

	/**
	 * Save configuration to file
	 */
	async save(): Promise<void> {
		const dir = path.dirname(this.configPath);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(this.configPath, yaml.dump(this.config), 'utf-8');
	}

	/**
	 * List all permission rules
	 */
	listRules(): PermissionRule[] {
		return this.config.rules;
	}

	/**
	 * Add a new permission rule
	 */
	async addRule(rule: Omit<PermissionRule, 'id'>): Promise<PermissionRule> {
		const newRule: PermissionRule = {
			...rule,
			id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
		};

		this.config.rules.push(newRule);
		await this.save();

		return newRule;
	}

	/**
	 * Remove a permission rule
	 */
	async removeRule(id: string): Promise<boolean> {
		const index = this.config.rules.findIndex(r => r.id === id);
		if (index === -1) {
			return false;
		}

		this.config.rules.splice(index, 1);
		await this.save();

		return true;
	}

	/**
	 * Update a permission rule
	 */
	async updateRule(id: string, updates: Partial<PermissionRule>): Promise<boolean> {
		const rule = this.config.rules.find(r => r.id === id);
		if (!rule) {
			return false;
		}

		Object.assign(rule, updates);
		await this.save();

		return true;
	}

	/**
	 * Test what permission would apply to a tool call
	 */
	testPermission(tool: string, args: Record<string, unknown>): PermissionTest {
		// Find matching rule
		const matchingRule = this.findMatchingRule(tool, args);

		const mode = matchingRule?.mode || this.config.defaultMode;

		let approved = false;
		let reason: string | undefined;

		switch (mode) {
			case 'yolo':
				approved = true;
				reason = 'Auto-approved (YOLO mode)';
				break;
			case 'plan':
				approved = true;
				reason = 'Approved for planning';
				break;
			case 'ask':
			default:
				approved = false;
				reason = 'Requires user approval';
				break;
		}

		return {
			tool,
			args,
			rule: matchingRule,
			approved,
			mode,
			reason,
		};
	}

	/**
	 * Find the most specific matching rule for a tool call
	 */
	private findMatchingRule(tool: string, args: Record<string, unknown>): PermissionRule | undefined {
		// Filter to enabled rules
		const enabledRules = this.config.rules.filter(r => r.enabled);

		// Find exact match first
		const exactMatch = enabledRules.find(r => r.pattern === tool);
		if (exactMatch) {
			return exactMatch;
		}

		// Find wildcard match
		for (const rule of enabledRules) {
			if (this.matchesPattern(rule.pattern, tool, args)) {
				return rule;
			}
		}

		return undefined;
	}

	/**
	 * Check if a tool call matches a rule pattern
	 */
	private matchesPattern(pattern: string, tool: string, args: Record<string, unknown>): boolean {
		// Pattern formats:
		// "ToolName" - exact match
		// "ToolName(arg1, arg2)" - match with specific args
		// "ToolName(*pattern*)" - wildcard in args
		// "*.ts" - tools acting on .ts files
		// "Read(src/**/*.ts)" - specific tool with path pattern

		// Check for function-style pattern
		const funcMatch = pattern.match(/^(\w+)\((.*)\)$/);
		if (funcMatch) {
			const patternTool = funcMatch[1];
			const patternArgs = funcMatch[2];

			if (patternTool !== tool) {
				return false;
			}

			// Check args pattern
			if (patternArgs === '*') {
				return true;
			}

			// Parse args like "npm *" or "git * main"
			return this.matchesArgsPattern(patternArgs, args);
		}

		// Check for file pattern like "*.ts"
		const fileMatch = pattern.match(/^\*(\.\w+)$/);
		if (fileMatch) {
			const ext = fileMatch[1];
			const filePath = (args as { path?: string }).path;
			return filePath?.endsWith(ext) || false;
		}

		// Check for path pattern like "Read(src/**/*.ts)"
		const pathMatch = pattern.match(/^(\w+)\((.+)\)$/);
		if (pathMatch) {
			const patternTool = pathMatch[1];
			const patternPath = pathMatch[2];

			if (patternTool !== tool) {
				return false;
			}

			const filePath = (args as { path?: string }).path;
			if (!filePath) {
				return false;
			}

			// Simple glob-style matching
			if (patternPath.includes('**')) {
				const prefix = patternPath.split('**')[0];
				return filePath.startsWith(prefix);
			}

			return filePath.includes(patternPath);
		}

		// Default: exact match
		return pattern === tool;
	}

	/**
	 * Match argument patterns
	 */
	private matchesArgsPattern(pattern: string, args: Record<string, unknown>): boolean {
		const toolArgs = args as { command?: string; path?: string };

		if (pattern.includes('*')) {
			const [prefix, suffix] = pattern.split('*');
			if (toolArgs.command) {
				return toolArgs.command.startsWith(prefix) && toolArgs.command.endsWith(suffix);
			}
			return false;
		}

		if (toolArgs.command) {
			return toolArgs.command.includes(pattern);
		}

		return false;
	}

	/**
	 * Set default permission mode
	 */
	async setDefaultMode(mode: PermissionMode): Promise<void> {
		this.config.defaultMode = mode;
		await this.save();
	}

	/**
	 * Get default permission mode
	 */
	getDefaultMode(): PermissionMode {
		return this.config.defaultMode;
	}

	/**
	 * Get permission statistics
	 */
	getStats(): {
		total: number;
		enabled: number;
		byMode: Record<PermissionMode, number>;
	} {
		const byMode: Record<PermissionMode, number> = {
			yolo: 0,
			ask: 0,
			plan: 0,
		};

		for (const rule of this.config.rules) {
			if (rule.enabled) {
				byMode[rule.mode]++;
			}
		}

		return {
			total: this.config.rules.length,
			enabled: this.config.rules.filter(r => r.enabled).length,
			byMode,
		};
	}
}

/**
 * Format permission rules for display
 */
export function formatRules(rules: PermissionRule[]): string {
	let output = '\n╔════════════════════════════════════════════════════════════════╗\n';
	output += '║                    PERMISSION RULES                           ║\n';
	output += '╠════════════════════════════════════════════════════════════════╣\n';

	if (rules.length === 0) {
		output += '║  No permission rules configured.                              ║\n';
	} else {
		for (const rule of rules) {
			const status = rule.enabled ? '✓' : '✗';
			const mode = rule.mode.toUpperCase().padEnd(6);
			const pattern = rule.pattern.padEnd(30);

			output += `║ ${status} ${mode} ${pattern} ║\n`;
			if (rule.description) {
				output += `║      ${rule.description.substring(0, 58)}...         ║\n`;
			}
		}
	}

	output += '╚════════════════════════════════════════════════════════════════╝\n';

	return output;
}

/**
 * Format permission test result
 */
export function formatPermissionTest(test: PermissionTest): string {
	let output = `\nPermission Test: ${test.tool}\n`;
	output += `─────────────────\n`;
	output += `Mode: ${test.mode.toUpperCase()}\n`;
	output += `Approved: ${test.approved ? 'YES' : 'NO'}\n`;
	output += `Reason: ${test.reason}\n`;

	if (test.rule) {
		output += `\nMatching Rule: ${test.rule.name}\n`;
		output += `Pattern: ${test.rule.pattern}\n`;
	}

	return output;
}

/**
 * Main /permissions command handler
 */
export async function handlePermissionsCommand(
	action: string,
	args?: string[]
): Promise<{ success: boolean; output?: string; error?: string }> {
	const cli = new PermissionCLI();
	await cli.load();

	switch (action) {
		case '':
		case 'list':
			const rules = cli.listRules();
			return {
				success: true,
				output: formatRules(rules) + `\nDefault Mode: ${cli.getDefaultMode().toUpperCase()}\n`,
			};

		case 'add':
			if (!args || args.length === 0) {
				return {
					success: false,
					error: 'Usage: /permissions add <pattern> <mode> [description]',
				};
			}
			// Parse args: <pattern> <mode> [description]
			const [pattern, mode, ...descParts] = args;
			const description = descParts.join(' ');

			if (!pattern || !mode) {
				return {
					success: false,
					error: 'Pattern and mode are required',
				};
			}

			if (!['yolo', 'ask', 'plan'].includes(mode)) {
				return {
					success: false,
					error: 'Mode must be yolo, ask, or plan',
				};
			}

			const newRule = await cli.addRule({
				name: `${pattern} (${mode})`,
				pattern,
				mode: mode as PermissionMode,
				description,
				enabled: true,
			});

			return {
				success: true,
				output: `Rule added: ${newRule.name}\n`,
			};

		case 'remove':
			if (!args || args.length === 0) {
				return {
					success: false,
					error: 'Usage: /permissions remove <rule-id>',
				};
			}

			const removed = await cli.removeRule(args[0]);
			if (!removed) {
				return {
					success: false,
					error: `Rule not found: ${args[0]}`,
				};
			}

			return {
				success: true,
				output: `Rule removed: ${args[0]}\n`,
			};

		case 'test':
			if (!args || args.length === 0) {
				return {
					success: false,
					error: 'Usage: /permissions test <tool> [args...]',
				};
			}

			const tool = args[0];
			const testArgs: Record<string, unknown> = {};
			if (args.length > 1) {
				testArgs.command = args.slice(1).join(' ');
			}

			const result = cli.testPermission(tool, testArgs);
			return {
				success: true,
				output: formatPermissionTest(result),
			};

		case 'mode':
			if (!args || args.length === 0) {
				return {
					success: true,
					output: `Default mode: ${cli.getDefaultMode().toUpperCase()}\n`,
				};
			}

			const newMode = args[0];
			if (!['yolo', 'ask', 'plan'].includes(newMode)) {
				return {
					success: false,
					error: 'Mode must be yolo, ask, or plan',
				};
			}

			await cli.setDefaultMode(newMode as PermissionMode);
			return {
				success: true,
				output: `Default mode set to ${newMode.toUpperCase()}\n`,
			};

		default:
			return {
				success: false,
				error: `Unknown action: ${action}`,
			};
	}
}

/**
 * CLI command definition
 */
export const permissionsCommand = {
	description: 'Manage permission rules',
	usage: '/permissions [action] [args]',
	actions: {
		'': 'List all permission rules',
		'add <pattern> <mode> [desc]': 'Add new permission rule',
		'remove <rule-id>': 'Remove permission rule',
		'test <tool> [args]': 'Test what permission would apply',
		'mode <mode>': 'Set default permission mode',
		'list': 'List all permission rules',
	},
	examples: [
		'/permissions',
		'/permissions add "Read(*.ts)" yolo',
		'/permissions add "Bash(npm *)\" ask "Auto-approve safe npm commands"',
		'/permissions add "Bash(git * main)" ask "Protect main branch"',
		'/permissions test write_file',
		'/permissions mode yolo',
	],
	handler: handlePermissionsCommand,
};

export { PermissionCLI };
export default permissionsCommand;
