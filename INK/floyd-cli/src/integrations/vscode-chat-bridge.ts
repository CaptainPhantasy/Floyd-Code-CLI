/**
 * VSCode Chat Bridge
 *
 * Allows Floyd CLI to communicate with the VSCode floyd-multi-chat extension.
 * Supports opening new chat panels and sending messages to existing sessions.
 *
 * @module integrations/vscode-chat-bridge
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {spawn} from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

export interface BridgeMessage {
	type: 'open' | 'send' | 'status' | 'close';
	sessionId?: string;
	message?: string;
	name?: string;
	projectPath?: string;
}

export interface BridgeResponse {
	success: boolean;
	data?: unknown;
	error?: string;
}

export interface VSCodeSession {
	id: string;
	name: string;
	messages: Array<{role: string; content: string}>;
	createdAt: number;
	updatedAt: number;
}

// ============================================================================
// CONFIG
// ============================================================================

const BRIDGE_PORT = 34567;
const BRIDGE_HOST = 'localhost';
const LOCK_FILE_PATH = path.join(os.homedir(), '.floyd', 'vscode-bridge.lock');

// ============================================================================
// BRIDGE CLIENT
// ============================================================================

export class VSCodeChatBridge {
	private readonly baseUrl: string;
	private readonly projectPath: string;

	constructor(projectPath: string = process.cwd()) {
		this.baseUrl = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`;
		this.projectPath = projectPath;
	}

	/**
	 * Check if VSCode extension bridge is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/status`, {
				method: 'GET',
				signal: AbortSignal.timeout(1000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Open a new chat panel in VSCode
	 */
	async openChat(options: {
		name?: string;
		initialMessage?: string;
		projectPath?: string;
	} = {}): Promise<BridgeResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/open`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					name: options.name || 'Floyd Chat',
					projectPath: options.projectPath || this.projectPath,
					initialMessage: options.initialMessage,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				return {success: false, error: `HTTP ${response.status}: ${error}`};
			}

			const data = await response.json();
			return {success: true, data};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Send a message to an existing VSCode chat session
	 */
	async sendMessage(sessionId: string, message: string): Promise<BridgeResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/send`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					sessionId,
					message,
					projectPath: this.projectPath,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				return {success: false, error: `HTTP ${response.status}: ${error}`};
			}

			const data = await response.json();
			return {success: true, data};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * List all active VSCode chat sessions
	 */
	async listSessions(): Promise<BridgeResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/sessions`);

			if (!response.ok) {
				const error = await response.text();
				return {success: false, error: `HTTP ${response.status}: ${error}`};
			}

			const sessions = await response.json();
			return {success: true, data: sessions};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Close a chat session in VSCode
	 */
	async closeSession(sessionId: string): Promise<BridgeResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/close`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({sessionId}),
			});

			if (!response.ok) {
				const error = await response.text();
				return {success: false, error: `HTTP ${response.status}: ${error}`};
			}

			return {success: true};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Try to launch VSCode with the extension if bridge is not available
	 */
	async launchVSCode(): Promise<boolean> {
		try {
			// Check if code command is available
			const codePath = await this.findVSCodeCommand();
			if (!codePath) {
				return false;
			}

			// Launch VSCode in background
			spawn(codePath, [this.projectPath], {
				detached: true,
				stdio: 'ignore',
			});

			// Give it time to start and extension to initialize
			await this.sleep(2000);

			// Check if bridge is now available
			return await this.isAvailable();
		} catch {
			return false;
		}
	}

	private async findVSCodeCommand(): Promise<string | null> {
		const possiblePaths = [
			'/usr/local/bin/code',
			'/usr/bin/code',
			'/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
		];

		// Try PATH first
		for (const cmd of ['code', 'code-insiders']) {
			try {
				spawn(cmd, ['--version'], {stdio: 'ignore'});
				return cmd;
			} catch {
				// Continue
			}
		}

		// Try known paths
		for (const p of possiblePaths) {
			if (await fs.pathExists(p)) {
				return p;
			}
		}

		return null;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// ============================================================================
// BRIDGE SERVER (for VSCode extension side)
// ============================================================================

export interface BridgeServerOptions {
	port?: number;
	host?: string;
	onOpen?: (sessionId: string, name: string, projectPath?: string) => void;
	onSend?: (sessionId: string, message: string) => void;
	onClose?: (sessionId: string) => void;
}

/**
 * Create a simple HTTP server for the VSCode extension to listen for Floyd CLI commands
 * This is meant to be run by the VSCode extension, not by Floyd CLI directly
 */
export class BridgeServer {
	private server: any | null = null;
	private readonly port: number;
	private readonly host: string;
	private readonly handlers: {
		onOpen?: (sessionId: string, name: string, projectPath?: string) => void;
		onSend?: (sessionId: string, message: string) => void;
		onClose?: (sessionId: string) => void;
	};

	constructor(options: BridgeServerOptions = {}) {
		this.port = options.port || BRIDGE_PORT;
		this.host = options.host || BRIDGE_HOST;
		this.handlers = {
			onOpen: options.onOpen,
			onSend: options.onSend,
			onClose: options.onClose,
		};
	}

	async start(): Promise<void> {
		// This would use Node's http server
		// For now, it's a placeholder for the VSCode extension to implement
		console.log(`Bridge server starting on ${this.host}:${this.port}`);
	}

	async stop(): Promise<void> {
		if (this.server) {
			// Stop the server
			this.server = null;
		}
	}
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick helper to open a chat in VSCode from Floyd CLI
 */
export async function openVSCodeChat(options: {
	name?: string;
	message?: string;
	projectPath?: string;
} = {}): Promise<boolean> {
	const bridge = new VSCodeChatBridge(options.projectPath);

	// Try to connect
	let available = await bridge.isAvailable();

	// If not available, try launching VSCode
	if (!available) {
		available = await bridge.launchVSCode();
	}

	if (!available) {
		console.error('VSCode bridge is not available. Make sure the floyd-multi-chat extension is installed and VSCode is running.');
		return false;
	}

	// Open the chat
	const result = await bridge.openChat(options);

	if (!result.success) {
		console.error(`Failed to open VSCode chat: ${result.error}`);
		return false;
	}

	return true;
}

/**
 * Quick helper to send a message to an existing VSCode chat
 */
export async function sendToVSCodeChat(
	sessionId: string,
	message: string,
	projectPath?: string,
): Promise<boolean> {
	const bridge = new VSCodeChatBridge(projectPath);

	const result = await bridge.sendMessage(sessionId, message);

	if (!result.success) {
		console.error(`Failed to send message: ${result.error}`);
		return false;
	}

	return true;
}
