/**
 * PHASE 5 ITEM 25: LSP Tool
 *
 * Language Server Protocol integration for code intelligence.
 * Provides: go-to-definition, find references, hover, symbols, rename
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * LSP position in a document
 */
export interface LSPPosition {
	line: number;
	character: number;
}

/**
 * LSP location (file and position)
 */
export interface LSPLocation {
	uri: string;
	range: {
		start: LSPPosition;
		end: LSPPosition;
	};
}

/**
 * LSP hover result
 */
export interface LSPHover {
	contents: string;
	range?: {
		start: LSPPosition;
		end: LSPPosition;
	};
}

/**
 * LSP symbol information
 */
export interface LSPSymbol {
	name: string;
	kind: number;
	containerName?: string;
	location: LSPLocation;
}

/**
 * LSP text document identifier
 */
export interface TextDocumentIdentifier {
	uri: string;
}

/**
 * Language to LSP server mapping
 */
interface LanguageServer {
	language: string;
	command: string;
	args: string[];
	roots?: string[];
}

/**
 * Default LSP servers for common languages
 */
const DEFAULT_LSP_SERVERS: Record<string, LanguageServer> = {
	typescript: {
		language: 'typescript',
		command: 'typescript-language-server',
		args: ['--stdio'],
	},
	javascript: {
		language: 'javascript',
		command: 'typescript-language-server',
		args: ['--stdio'],
	},
	python: {
		language: 'python',
		command: 'pylsp',
		args: [],
	},
	rust: {
		language: 'rust',
		command: 'rust-analyzer',
		args: [],
	},
	go: {
		language: 'go',
		command: 'gopls',
		args: [],
	},
};

/**
 * LSP Client - Manages connections to language servers
 */
export class LSPClient {
	private connections: Map<string, LSPConnection> = new Map();
	private serverArgs: Record<string, LanguageServer> = {};

	constructor() {
		this.serverArgs = { ...DEFAULT_LSP_SERVERS };
	}

	/**
	 * Get language from file extension
	 */
	private getLanguage(filePath: string): string {
		const ext = path.extname(filePath).toLowerCase();
		const langMap: Record<string, string> = {
			'.ts': 'typescript',
			'.tsx': 'typescript',
			'.js': 'javascript',
			'.jsx': 'javascript',
			'.py': 'python',
			'.rs': 'rust',
			'.go': 'go',
		};
		return langMap[ext] || '';
	}

	/**
	 * Get or create connection for a language
	 */
	private async getConnection(language: string): Promise<LSPConnection | null> {
		if (this.connections.has(language)) {
			return this.connections.get(language)!;
		}

		const serverConfig = this.serverArgs[language];
		if (!serverConfig) {
			return null;
		}

		// Check if server is available
		const available = await this.checkServerAvailable(serverConfig.command);
		if (!available) {
			return null;
		}

		const connection = new LSPConnection(serverConfig);
		this.connections.set(language, connection);
		await connection.start();

		return connection;
	}

	/**
	 * Check if LSP server command is available
	 */
	private async checkServerAvailable(command: string): Promise<boolean> {
		try {
			// Try to find the command
			const result = spawn('which', [command], { shell: true });
			await new Promise((resolve, reject) => {
				result.on('close', (code) => resolve(code === 0));
				result.on('error', () => resolve(false));
				setTimeout(() => resolve(false), 1000).then(resolve);
			});
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Go to definition
	 */
	async gotoDefinition(
		filePath: string,
		line: number,
		character: number
	): Promise<LSPLocation[]> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return [];
		}

		return conn.sendRequest('textDocument/definition', {
			textDocument: { uri: filePath },
			position: { line, character },
		});
	}

	/**
	 * Find references
	 */
	async findReferences(
		filePath: string,
		line: number,
		character: number
	): Promise<LSPLocation[]> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return [];
		}

		return conn.sendRequest('textDocument/references', {
			textDocument: { uri: filePath },
			position: { line, character },
			context: { includeDeclaration: true },
		});
	}

	/**
	 * Hover (type information, documentation)
	 */
	async hover(
		filePath: string,
		line: number,
		character: number
	): Promise<LSPHover | null> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return null;
		}

		return conn.sendRequest('textDocument/hover', {
			textDocument: { uri: filePath },
			position: { line, character },
		});
	}

	/**
	 * Document symbols (outline)
	 */
	async documentSymbols(filePath: string): Promise<LSPSymbol[]> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return [];
		}

		return conn.sendRequest('textDocument/documentSymbol', {
			textDocument: { uri: filePath },
		});
	}

	/**
	 * Rename symbol
	 */
	async rename(
		filePath: string,
		line: number,
		character: number,
		newName: string
	): Promise<{ changes: Array<{ uri: string; edits: any[] }> } | null> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return null;
		}

		return conn.sendRequest('textDocument/rename', {
			textDocument: { uri: filePath },
			position: { line, character },
			newName,
		});
	}

	/**
	 * Open file in LSP
	 */
	async openFile(filePath: string): Promise<void> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return;
		}

		const content = await fs.readFile(filePath, 'utf-8');
		conn.sendNotification('textDocument/didOpen', {
			textDocument: {
				uri: filePath,
				languageId: lang,
				version: 1,
				text: content,
			},
		});
	}

	/**
	 * Close file in LSP
	 */
	async closeFile(filePath: string): Promise<void> {
		const lang = this.getLanguage(filePath);
		const conn = await this.getConnection(lang);
		if (!conn) {
			return;
		}

		conn.sendNotification('textDocument/didClose', {
			textDocument: { uri: filePath },
		});
	}

	/**
	 * Close all connections
	 */
	async closeAll(): Promise<void> {
		for (const conn of this.connections.values()) {
			await conn.stop();
		}
		this.connections.clear();
	}

	/**
	 * Register custom LSP server
	 */
	registerServer(language: string, server: LanguageServer): void {
		this.serverArgs[language] = server;
	}
}

/**
 * LSP Connection - Manages communication with a single language server
 */
class LSPConnection {
	private server: LanguageServer;
	private process?: ReturnType<typeof spawn>;
	private requestId = 0;
	private pendingRequests: Map<number, {
		resolve: (value: any) => void;
		reject: (error: any) => void;
	}> = new Map();

	constructor(server: LanguageServer) {
		this.server = server;
	}

	async start(): Promise<void> {
		this.process = spawn(this.server.command, this.server.args, {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		// Handle JSON-RPC messages
		this.process.stdout?.on('data', (data) => {
			this.handleMessage(data.toString());
		});

		// Initialize LSP
		this.sendNotification('initialize', {
			processId: process.pid,
			rootUri: null,
			capabilities: {},
		});

		// Send initialized notification
		this.sendNotification('initialized', {});
	}

	async stop(): Promise<void> {
		if (this.process) {
			this.sendNotification('shutdown', null);
			this.sendNotification('exit', null);
			this.process.kill('SIGTERM');
		}
	}

	sendRequest(method: string, params: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = ++this.requestId;
			this.pendingRequests.set(id, { resolve, reject });

			const message = JSON.stringify({
				jsonrpc: '2.0',
				id,
				method,
				params,
			});

			this.process?.stdin?.write(message + '\n');
		});
	}

	sendNotification(method: string, params: any): void {
		const message = JSON.stringify({
			jsonrpc: '2.0',
			method,
			params,
		});

		this.process?.stdin?.write(message + '\n');
	}

	private handleMessage(data: string): void {
		const messages = data.split('\n').filter(Boolean);

		for (const msg of messages) {
			try {
				const response = JSON.parse(msg);

				if (response.id && this.pendingRequests.has(response.id)) {
					const { resolve, reject } = this.pendingRequests.get(response.id)!;

					if (response.error) {
						reject(response.error);
					} else {
						resolve(response.result);
					}

					this.pendingRequests.delete(response.id);
				}
			} catch {
				// Ignore parse errors
			}
		}
	}
}

/**
 * Global LSP client instance
 */
let globalLSPClient: LSPClient | null = null;

export function getLSPClient(): LSPClient {
	if (!globalLSPClient) {
		globalLSPClient = new LSPClient();
	}
	return globalLSPClient;
}

export function resetLSPClient(): void {
	globalLSPClient?.closeAll().then(() => {
		globalLSPClient = null;
	});
}
