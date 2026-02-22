#!/usr/bin/env node

/**
 * FLOYD CLI - Entry Point
 *
 * File-Logged Orchestrator Yielding Deliverables
 * AI Development Companion
 *
 * @module cli
 */

import meow from 'meow';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {FloydAgent} from './agent/floyd-agent.js';
import {ConfigManager, type Config} from './config/config-manager.js';

// ============================================================================
// CLI CONFIGURATION
// ============================================================================

const HELP_TEXT = `
  FLOYD - AI Development Companion

  Usage
    $ floyd [options] [prompt]
    $ floyd <prompt>
    $ echo "prompt" | floyd

  Options
    --mode, -m      Execution mode (ask, yolo, plan, auto, dialogue, fuckit) [default: ask]
    --model         Model to use (claude-opus-4, claude-sonnet-4-5) [default: claude-opus-4]
    --session, -s   Session ID to resume
    --cwd           Working directory [default: current directory]
    --config, -c    Custom config file path
    --no-color      Disable colored output
    --quiet, -q     Minimal output
    --verbose, -v   Verbose output
    --debug         Debug mode with extra logging
    --version       Show version number
    --help          Show help

  Modes
    ask       Explain before executing dangerous operations
    yolo      Execute without asking for standard operations
    plan      Read-only planning mode, no writes
    auto      Adaptive mode, asks for risky operations
    dialogue  One-line responses only, no tool calls
    fuckit    Execute any tool without asking

  Environment Variables
    FLOYD_MODE           Default execution mode
    FLOYD_API_KEY        Anthropic API key
    FLOYD_MODEL          Default model
    FLOYD_CONFIG         Config file path
    ANTHROPIC_API_KEY    Alternative API key

  Examples
    $ floyd "Fix the login bug"
    $ floyd --mode yolo "Update dependencies"
    $ floyd --session abc123 "Continue from where we left off"
    $ cat prompt.txt | floyd
`;

const PACKAGE_JSON = {
	name: '@cursem/floyd-wrapper',
	version: '0.1.0',
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
	// Parse CLI flags
	const cli = meow(HELP_TEXT, {
		importMeta: import.meta,
		flags: {
			mode: {
				type: 'string',
				shortFlag: 'm',
				default: process.env.FLOYD_MODE || 'ask',
			},
			model: {
				type: 'string',
				default: process.env.FLOYD_MODEL || 'claude-opus-4',
			},
			session: {
				type: 'string',
				shortFlag: 's',
			},
			cwd: {
				type: 'string',
				default: process.cwd(),
			},
			config: {
				type: 'string',
				shortFlag: 'c',
			},
			color: {
				type: 'boolean',
				default: true,
			},
			quiet: {
				type: 'boolean',
				shortFlag: 'q',
				default: false,
			},
			verbose: {
				type: 'boolean',
				shortFlag: 'v',
				default: false,
			},
			debug: {
				type: 'boolean',
				default: false,
			},
		},
		pkg: PACKAGE_JSON,
	});

	// Meow handles --version and --help automatically
	// Exit if they were used
	if (cli.flags.version || cli.flags.help) {
		return;
	}

	// Validate mode
	const validModes = ['ask', 'yolo', 'plan', 'auto', 'dialogue', 'fuckit'];
	const mode = cli.flags.mode.toLowerCase();
	if (!validModes.includes(mode)) {
		console.error(`Error: Invalid mode '${mode}'. Valid modes: ${validModes.join(', ')}`);
		process.exit(1);
	}

	// Validate working directory
	const cwd = cli.flags.cwd;
	if (!existsSync(cwd)) {
		console.error(`Error: Working directory does not exist: ${cwd}`);
		process.exit(1);
	}

	// Load configuration
	const configPath = cli.flags.config || process.env.FLOYD_CONFIG;
	const configManager = new ConfigManager({
		configPath: configPath ? resolve(configPath) : undefined,
		cwd: resolve(cwd),
	});

	let config;
	try {
		config = await configManager.load();
	} catch (error) {
		console.error(`Error loading config: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}

	// Override config with CLI flags
	if (cli.flags.debug) {
		config.debug = true;
	}
	if (cli.flags.verbose) {
		config.verbose = true;
	}
	if (cli.flags.quiet) {
		config.quiet = true;
	}
	if (!cli.flags.color) {
		config.color = false;
	}

	// Get prompt from input or stdin
	let prompt = cli.input.join(' ');

	if (!prompt) {
		// Read from stdin if no prompt provided
		if (process.stdin.isTTY) {
			// No stdin and no prompt - show help
			cli.showHelp();
			return;
		}

		try {
		prompt = await readStdin();
		} catch (error) {
			console.error('Error reading from stdin:', error);
			process.exit(1);
		}
	}

	if (!prompt.trim()) {
		console.error('Error: No prompt provided');
		cli.showHelp();
		process.exit(1);
	}

	// Create and run agent
	const agent = new FloydAgent({
		mode: mode as FloydAgentOptions['mode'],
		model: cli.flags.model as FloydAgentOptions['model'],
		cwd: resolve(cwd),
		sessionId: cli.flags.session,
		config,
	});

	try {
		const result = await agent.run(prompt);
		console.log(result.output);

		if (!result.success) {
			process.exit(1);
		}
	} catch (error) {
		console.error('Error:', error instanceof Error ? error.message : String(error));

		if (config.debug) {
			console.error(error);
		}

		process.exit(1);
	}
}

/**
 * Read stdin to string
 */
function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';

		process.stdin.setEncoding('utf-8');
		process.stdin.on('data', chunk => {
			data += chunk;
		});
		process.stdin.on('end', () => {
			resolve(data);
		});
		process.stdin.on('error', reject);
	});
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * FloydAgent options
 */
interface FloydAgentOptions {
	/** Execution mode */
	mode: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit';

	/** Model to use */
	model: string;

	/** Working directory */
	cwd: string;

	/** Session ID to resume */
	sessionId?: string;

	/** Configuration */
	config: Partial<Config>;
}

// ============================================================================
// BOOTSTRAP
// ============================================================================

main().catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});
