/**
 * Prefix Parser Tests
 *
 * Test suite for Claude Code-style prefix mode detection
 */

import {describe, it, expect} from 'vitest';
import {
	parsePrefixMode,
	isBashCommand,
	isSlashCommand,
	isAgentDelegation,
	isToolInvocation,
	parseBashCommand,
	parseSlashCommand,
	parseAgentDelegation,
	parseToolInvocation,
	validateBashCommand,
} from '../utils/prefix-parser.js';

describe('parsePrefixMode', () => {
	it('should detect bash mode', () => {
		const result = parsePrefixMode('!ls -la');
		expect(result.mode).toBe('bash');
		expect(result.cleanInput).toBe('ls -la');
		expect(result.prefix).toBe('!');
		expect(result.isPrefixed).toBe(true);
	});

	it('should detect command mode', () => {
		const result = parsePrefixMode('/help');
		expect(result.mode).toBe('command');
		expect(result.cleanInput).toBe('help');
		expect(result.prefix).toBe('/');
		expect(result.isPrefixed).toBe(true);
	});

	it('should detect agent mode', () => {
		const result = parsePrefixMode('@coder write tests');
		expect(result.mode).toBe('agent');
		expect(result.cleanInput).toBe('coder write tests');
		expect(result.prefix).toBe('@');
		expect(result.isPrefixed).toBe(true);
	});

	it('should detect tool mode', () => {
		const result = parsePrefixMode('&grep pattern file');
		expect(result.mode).toBe('tool');
		expect(result.cleanInput).toBe('grep pattern file');
		expect(result.prefix).toBe('&');
		expect(result.isPrefixed).toBe(true);
	});

	it('should detect normal mode', () => {
		const result = parsePrefixMode('normal message');
		expect(result.mode).toBe('normal');
		expect(result.cleanInput).toBe('normal message');
		expect(result.isPrefixed).toBe(false);
		expect(result.prefix).toBeUndefined();
	});

	it('should handle whitespace', () => {
		const result = parsePrefixMode('  !ls -la  ');
		expect(result.mode).toBe('bash');
		expect(result.cleanInput).toBe('ls -la');
	});

	it('should handle empty input', () => {
		const result = parsePrefixMode('');
		expect(result.mode).toBe('normal');
		expect(result.cleanInput).toBe('');
	});
});

describe('Mode Validators', () => {
	it('isBashCommand should return true for bash mode', () => {
		const parsed = parsePrefixMode('!ls');
		expect(isBashCommand(parsed)).toBe(true);
	});

	it('isSlashCommand should return true for command mode', () => {
		const parsed = parsePrefixMode('/help');
		expect(isSlashCommand(parsed)).toBe(true);
	});

	it('isAgentDelegation should return true for agent mode', () => {
		const parsed = parsePrefixMode('@coder test');
		expect(isAgentDelegation(parsed)).toBe(true);
	});

	it('isToolInvocation should return true for tool mode', () => {
		const parsed = parsePrefixMode('&grep foo');
		expect(isToolInvocation(parsed)).toBe(true);
	});
});

describe('parseBashCommand', () => {
	it('should parse command with args', () => {
		const {command, args} = parseBashCommand('ls -la /tmp');
		expect(command).toBe('ls');
		expect(args).toEqual(['-la', '/tmp']);
	});

	it('should parse command without args', () => {
		const {command, args} = parseBashCommand('pwd');
		expect(command).toBe('pwd');
		expect(args).toEqual([]);
	});

	it('should handle multiple spaces', () => {
		const {command, args} = parseBashCommand('git  log  --oneline');
		expect(command).toBe('git');
		expect(args).toEqual(['log', '--oneline']);
	});
});

describe('parseSlashCommand', () => {
	it('should parse command with args', () => {
		const {command, args} = parseSlashCommand('explain OAuth 2.0');
		expect(command).toBe('explain');
		expect(args).toBe('OAuth 2.0');
	});

	it('should parse command without args', () => {
		const {command, args} = parseSlashCommand('help');
		expect(command).toBe('help');
		expect(args).toBe('');
	});
});

describe('parseAgentDelegation', () => {
	it('should parse agent with instruction', () => {
		const {agent, instruction} = parseAgentDelegation('coder write unit tests');
		expect(agent).toBe('coder');
		expect(instruction).toBe('write unit tests');
	});

	it('should parse agent without instruction', () => {
		const {agent, instruction} = parseAgentDelegation('security');
		expect(agent).toBe('security');
		expect(instruction).toBe('');
	});
});

describe('parseToolInvocation', () => {
	it('should parse tool with args', () => {
		const {tool, args} = parseToolInvocation('grep pattern src/');
		expect(tool).toBe('grep');
		expect(args).toBe('pattern src/');
	});

	it('should parse tool without args', () => {
		const {tool, args} = parseToolInvocation('help');
		expect(tool).toBe('help');
		expect(args).toBe('');
	});
});

describe('validateBashCommand', () => {
	it('should detect dangerous rm -rf', () => {
		const warnings = validateBashCommand('rm -rf /');
		expect(warnings.length).toBeGreaterThan(0);
		expect(warnings[0]).toContain('rm -rf');
	});

	it('should detect dangerous dd', () => {
		const warnings = validateBashCommand('dd if=/dev/zero of=/dev/sda');
		expect(warnings.length).toBeGreaterThan(0);
		expect(warnings[0]).toContain('dd');
	});

	it('should detect fork bomb', () => {
		const warnings = validateBashCommand(':(){:|:&};:');
		expect(warnings.length).toBeGreaterThan(0);
	});

	it('should allow safe commands', () => {
		const warnings = validateBashCommand('ls -la');
		expect(warnings).toEqual([]);
	});

	it('should allow safe git commands', () => {
		const warnings = validateBashCommand('git status');
		expect(warnings).toEqual([]);
	});

	it('should allow npm commands', () => {
		const warnings = validateBashCommand('npm install');
		expect(warnings).toEqual([]);
	});
});

describe('Edge Cases', () => {
	it('should handle prefix in middle of string', () => {
		const result = parsePrefixMode('this is !not a bash command');
		expect(result.mode).toBe('normal');
	});

	it('should handle multiple prefixes', () => {
		const result = parsePrefixMode('!echo /help');
		expect(result.mode).toBe('bash');
		expect(result.cleanInput).toBe('echo /help');
	});

	it('should handle unicode characters', () => {
		const result = parsePrefixMode('!echo 你好');
		expect(result.mode).toBe('bash');
		expect(result.cleanInput).toBe('echo 你好');
	});

	it('should handle special characters in args', () => {
		const result = parsePrefixMode('!grep "pattern with spaces" file.txt');
		expect(result.mode).toBe('bash');
		expect(result.cleanInput).toBe('grep "pattern with spaces" file.txt');
	});
});
