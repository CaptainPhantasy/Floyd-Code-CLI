/**
 * Terminal Manager - Interactive process control for FLOYD CLI
 *
 * Provides persistent terminal sessions with interactive I/O.
 * Similar to Floyd Desktop's process-manager but for CLI context.
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface ProcessSession {
	id: string;
	pid: number;
	process: ChildProcess;
	command: string;
	cwd: string;
	startTime: number;
	output: string[];
	isRunning: boolean;
	exitCode: number | null;
}

export interface ProcessInfo {
	pid: number;
	name: string;
	cpu: string;
	memory: string;
	command: string;
}

export class TerminalManager extends EventEmitter {
	private sessions: Map<string, ProcessSession> = new Map();
	private sessionCounter = 0;
	private maxOutputLines = 1000;
	private defaultShell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

	constructor() {
		super();
	}

	/**
	 * Start a new process/session
	 */
	async startProcess(options: {
		command: string;
		cwd?: string;
		shell?: string;
		timeout?: number;
	}): Promise<{ sessionId: string; pid: number; initialOutput: string }> {
		const sessionId = `session_${++this.sessionCounter}`;
		const cwd = options.cwd || process.cwd();
		const shell = options.shell || this.defaultShell;

		return new Promise((resolve, reject) => {
			try {
				const proc = spawn(shell, ['-c', options.command], {
					cwd,
					stdio: ['pipe', 'pipe', 'pipe'],
					detached: false,
				});

				const session: ProcessSession = {
					id: sessionId,
					pid: proc.pid!,
					process: proc,
					command: options.command,
					cwd,
					startTime: Date.now(),
					output: [],
					isRunning: true,
					exitCode: null,
				};

				this.sessions.set(sessionId, session);

				// Capture stdout
				proc.stdout?.on('data', (data) => {
					const lines = data.toString().split('\n');
					session.output.push(...lines);
					if (session.output.length > this.maxOutputLines) {
						session.output = session.output.slice(-this.maxOutputLines);
					}
					this.emit('output', { sessionId, data: data.toString() });
				});

				// Capture stderr
				proc.stderr?.on('data', (data) => {
					const lines = data.toString().split('\n');
					session.output.push(...lines.map((l: string) => `[stderr] ${l}`));
					if (session.output.length > this.maxOutputLines) {
						session.output = session.output.slice(-this.maxOutputLines);
					}
					this.emit('output', { sessionId, data: data.toString(), isError: true });
				});

				proc.on('close', (code) => {
					session.isRunning = false;
					session.exitCode = code;
					this.emit('close', { sessionId, exitCode: code });
				});

				proc.on('error', (err) => {
					session.isRunning = false;
					this.emit('error', { sessionId, error: err.message });
				});

				// Wait a bit for initial output
				const timeout = options.timeout || 2000;
				setTimeout(() => {
					resolve({
						sessionId,
						pid: proc.pid!,
						initialOutput: session.output.join('\n'),
					});
				}, Math.min(timeout, 2000));

			} catch (err: any) {
				reject(err);
			}
		});
	}

	/**
	 * Send input to a running process/session
	 */
	interactWithProcess(sessionId: string, input: string): {
		success: boolean;
		output?: string;
		error?: string;
	} {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return { success: false, error: 'Session not found' };
		}
		if (!session.isRunning) {
			return { success: false, error: 'Session is not running' };
		}

		try {
			session.process.stdin?.write(input + '\n');
			// Give a small delay for output
			const startLength = session.output.length;
			setTimeout(() => {
				const newOutput = session.output.slice(startLength).join('\n');
				this.emit('interact', { sessionId, input, output: newOutput });
			}, 100);
			return { success: true };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Read output from a running process without sending input
	 */
	readProcessOutput(sessionId: string, lines?: number): {
		success: boolean;
		output?: string[];
		error?: string;
	} {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return { success: false, error: 'Session not found' };
		}

		const output = lines
			? session.output.slice(-lines)
			: session.output;

		return {
			success: true,
			output,
		};
	}

	/**
	 * Force terminate a running process/session
	 */
	forceTerminate(sessionId: string): {
		success: boolean;
		message?: string;
		error?: string;
	} {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return { success: false, error: 'Session not found' };
		}

		try {
			if (session.isRunning && session.process.pid) {
				// Try SIGTERM first
				session.process.kill('SIGTERM');
				// If still running after 100ms, force kill
				setTimeout(() => {
					if (session.isRunning) {
						session.process.kill('SIGKILL');
					}
				}, 100);
				session.isRunning = false;
			}
			return { success: true, message: `Session ${sessionId} terminated` };
		} catch (err: any) {
			// Process may have already exited
			session.isRunning = false;
			return { success: true, message: `Session ${sessionId} terminated (already exited)` };
		}
	}

	/**
	 * List all active terminal sessions
	 */
	listSessions(): ProcessSession[] {
		return Array.from(this.sessions.values()).map(s => ({
			...s,
			process: undefined as any, // Don't expose the process object
		}));
	}

	/**
	 * List all running system processes
	 */
	async listProcesses(): Promise<{ success: boolean; processes?: ProcessInfo[]; error?: string }> {
		try {
			const platform = process.platform;
			let command = '';

			if (platform === 'darwin') {
				command = 'ps -eo pid,comm,pcpu,pmem,args | head -50';
			} else if (platform === 'linux') {
				command = 'ps -eo pid,comm,pcpu,pmem,args --sort=-pcpu | head -50';
			} else {
				command = 'tasklist /fo csv | head -50';
			}

			const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 });
			const lines = stdout.trim().split('\n').slice(1);

			const processes: ProcessInfo[] = lines
				.map(line => {
					const parts = line.trim().split(/\s+/);
					if (parts.length < 4) return null;
					return {
						pid: parseInt(parts[0], 10),
						name: parts[1],
						cpu: parts[2],
						memory: parts[3],
						command: parts.slice(4).join(' '),
					};
				})
				.filter((p): p is ProcessInfo => p !== null);

			return { success: true, processes };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Terminate a running process by PID
	 */
	async killProcess(pid: number): Promise<{ success: boolean; error?: string }> {
		try {
			process.kill(pid, 'SIGTERM');
			return { success: true };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	/**
	 * Execute code in memory without saving to a file
	 */
	async executeCode(options: {
		language: 'python' | 'node' | 'bash';
		code: string;
		timeout?: number;
	}): Promise<{ success: boolean; output?: string; error?: string }> {
		const { language, code, timeout = 30000 } = options;

		try {
			if (language === 'bash') {
				const { stdout, stderr } = await execAsync(`bash -c ${JSON.stringify(code)}`, { timeout });
				return { success: true, output: stdout || stderr };
			} else if (language === 'node') {
				// Use node -p for print/evaluate
				const { stdout, stderr } = await execAsync(`node -p "JSON.stringify(${code})"`, { timeout });
				return { success: true, output: stdout?.trim() || stderr };
			} else if (language === 'python') {
				const { stdout, stderr } = await execAsync(`python3 -c "print(repr(${code}))"`, { timeout });
				return { success: true, output: stdout?.trim() || stderr };
			} else {
				return { success: false, error: `Unsupported language: ${language}` };
			}
		} catch (err: any) {
			return {
				success: false,
				error: err.stderr || err.message,
			};
		}
	}

	/**
	 * Clean up finished sessions
	 */
	cleanup(): void {
		for (const [id, session] of this.sessions) {
			if (!session.isRunning) {
				this.sessions.delete(id);
			}
		}
	}

	/**
	 * Get session count
	 */
	getSessionCount(): number {
		return this.sessions.size;
	}

	/**
	 * Get active session count
	 */
	getActiveSessionCount(): number {
		return Array.from(this.sessions.values()).filter(s => s.isRunning).length;
	}
}

// Singleton instance
const terminalManager = new TerminalManager();

// Auto-cleanup every 5 minutes
setInterval(() => {
	terminalManager.cleanup();
}, 5 * 60 * 1000);

export default terminalManager;
