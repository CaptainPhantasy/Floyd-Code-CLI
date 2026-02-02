/**
 * Terminal Tools Implementation
 *
 * Executes terminal/process tools using the TerminalManager.
 */

import terminalManager from './terminal-manager.js';
import { promises as fs } from 'fs';
import path from 'path';

export interface ToolResult {
	success: boolean;
	result?: any;
	error?: string;
}

export class TerminalTools {
	/**
	 * Start a new process/session
	 */
	async startProcess(args: {
		command: string;
		cwd?: string;
		shell?: string;
		timeout?: number;
	}): Promise<ToolResult> {
		try {
			const result = await terminalManager.startProcess(args);
			return { success: true, result };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Send input to a running process
	 */
	async interactWithProcess(args: {
		session_id: string;
		input: string;
	}): Promise<ToolResult> {
		const result = terminalManager.interactWithProcess(args.session_id, args.input);
		return result;
	}

	/**
	 * Read output from a running process
	 */
	async readProcessOutput(args: {
		session_id: string;
		lines?: number;
	}): Promise<ToolResult> {
		const result = terminalManager.readProcessOutput(args.session_id, args.lines);
		return result;
	}

	/**
	 * Force terminate a session
	 */
	async forceTerminate(args: {
		session_id: string;
	}): Promise<ToolResult> {
		const result = terminalManager.forceTerminate(args.session_id);
		return result;
	}

	/**
	 * List all active sessions
	 */
	async listSessions(): Promise<ToolResult> {
		const sessions = terminalManager.listSessions();
		return { success: true, result: { sessions } };
	}

	/**
	 * List system processes
	 */
	async listProcesses(): Promise<ToolResult> {
		const result = await terminalManager.listProcesses();
		if (result.success) {
			return { success: true, result: { processes: result.processes } };
		}
		return result;
	}

	/**
	 * Kill a process by PID
	 */
	async killProcess(args: { pid: number }): Promise<ToolResult> {
		const result = await terminalManager.killProcess(args.pid);
		return result;
	}

	/**
	 * Execute code in memory
	 */
	async executeCode(args: {
		language: 'python' | 'node' | 'bash';
		code: string;
		timeout?: number;
	}): Promise<ToolResult> {
		const result = await terminalManager.executeCode(args);
		return result;
	}

	/**
	 * Create directory
	 */
	async createDirectory(args: { path: string }): Promise<ToolResult> {
		try {
			await fs.mkdir(args.path, { recursive: true });
			return { success: true, result: { path: args.path, created: true } };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Get file info
	 */
	async getFileInfo(args: { path: string }): Promise<ToolResult> {
		try {
			const stats = await fs.stat(args.path);
			return {
				success: true,
				result: {
					path: args.path,
					type: stats.isDirectory() ? 'directory' : 'file',
					size: stats.size,
					created: stats.birthtime.toISOString(),
					modified: stats.mtime.toISOString(),
					permissions: stats.mode.toString(8),
				},
			};
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Execute a tool by name
	 */
	async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
		switch (toolName) {
			case 'start_process':
				return await this.startProcess(args as any);
			case 'interact_with_process':
				return await this.interactWithProcess(args as any);
			case 'read_process_output':
				return await this.readProcessOutput(args as any);
			case 'force_terminate':
				return await this.forceTerminate(args as any);
			case 'list_sessions':
				return await this.listSessions();
			case 'list_processes':
				return await this.listProcesses();
			case 'kill_process':
				return await this.killProcess(args as any);
			case 'execute_code':
				return await this.executeCode(args as any);
			case 'create_directory':
				return await this.createDirectory(args as any);
			case 'get_file_info':
				return await this.getFileInfo(args as any);
			default:
				return { success: false, error: `Unknown tool: ${toolName}` };
		}
	}
}

export default TerminalTools;
