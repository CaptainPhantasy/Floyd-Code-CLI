/**
 * Command Executor
 *
 * Executes detected project commands with permission gating.
 */

import {execa} from 'execa';
import path from 'path';
import {detectProject, type ProjectType} from './detector.js';

export async function executeCommand(
	command: string,
	args: string[],
	options: {
		cwd?: string;
		timeout?: number;
		env?: Record<string, string>;
	} = {},
): Promise<{
	success: boolean;
	exitCode: number | null;
	stdout: string;
	stderr: string;
	duration: number;
}> {
	const startTime = Date.now();
	const {cwd = process.cwd(), timeout = 30000} = options;

	try {
		const result = await execa(command, args, {
			cwd,
			timeout,
			reject: false,
			env: {...process.env, ...options.env},
		});

		return {
			success: result.exitCode === 0,
			exitCode: result.exitCode ?? null,
			stdout: result.stdout || '',
			stderr: result.stderr || '',
			duration: Date.now() - startTime,
		};
	} catch (error) {
		return {
			success: false,
			exitCode: null,
			stdout: '',
			stderr: (error as Error).message,
			duration: Date.now() - startTime,
		};
	}
}

function parseCommandString(cmdString: string): {
	command: string;
	args: string[];
} {
	const parts = cmdString.trim().split(/\s+/);
	return {
		command: parts[0] || '',
		args: parts.slice(1) || [],
	};
}

export async function runTests(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.test;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No test command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const {command: cmd, args} = parseCommandString(command);
	const result = await executeCommand(cmd, args, {cwd: projectPath});

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

export async function formatCode(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.format;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No format command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const {command: cmd, args} = parseCommandString(command);
	const result = await executeCommand(cmd, args, {cwd: projectPath});

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

export async function lintCode(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.lint;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No lint command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const {command: cmd, args} = parseCommandString(command);
	const result = await executeCommand(cmd, args, {cwd: projectPath});

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

export async function buildProject(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.build;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No build command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const {command: cmd, args} = parseCommandString(command);
	const result = await executeCommand(cmd, args, {cwd: projectPath});

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

interface PermissionStore {
	permissions: Map<string, {granted: boolean; expiresAt: number}>;
}

const permissionStore: PermissionStore = {
	permissions: new Map(),
};

export function checkPermission(toolName: string, projectPath: string): boolean {
	const key = `${toolName}:${projectPath}`;
	const perm = permissionStore.permissions.get(key);

	if (!perm) return false;

	if (Date.now() > perm.expiresAt) {
		permissionStore.permissions.delete(key);
		return false;
	}

	return perm.granted;
}

export function grantPermission(
	toolName: string,
	projectPath: string,
	duration = 3600000,
): void {
	const key = `${toolName}:${projectPath}`;
	permissionStore.permissions.set(key, {
		granted: true,
		expiresAt: Date.now() + duration,
	});
}

export function revokePermission(toolName: string, projectPath: string): void {
	const key = `${toolName}:${projectPath}`;
	permissionStore.permissions.delete(key);
}

export function formatTestResults(result: {
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
}): string {
	const lines: string[] = [];

	lines.push(`Duration: ${result.duration}ms`);
	lines.push(`Exit Code: ${result.exitCode}`);

	if (result.output) {
		lines.push('\n--- Output ---');
		lines.push(result.output);
	}

	if (result.errorOutput) {
		lines.push('\n--- Errors ---');
		lines.push(result.errorOutput);
	}

	return lines.join('\n');
}

export default {
	executeCommand,
	runTests,
	formatCode,
	lintCode,
	buildProject,
	checkPermission,
	grantPermission,
	revokePermission,
	formatTestResults,
};
