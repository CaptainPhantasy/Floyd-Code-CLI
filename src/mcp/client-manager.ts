import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {ListToolsResult} from '@modelcontextprotocol/sdk/types.js';
import {WebSocketServer} from 'ws';
import {WebSocketConnectionTransport} from '../ipc/transport.js';
import {v4 as uuidv4} from 'uuid';
import {fileURLToPath} from 'url';
import path from 'path';
import {execa} from 'execa';
import {readFileSync, existsSync} from 'fs';
import {join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// MCP CONFIGURATION TYPES (for .floyd/mcp.json)
// ============================================================================

export type MCPTransportType = 'stdio' | 'websocket' | 'sse';

export interface MCPStdioConfig {
	type: 'stdio';
	command: string;
	args?: string[];
	env?: Record<string, string>;
	cwd?: string;
}

export interface MCPWebSocketConfig {
	type: 'websocket';
	url: string;
	headers?: Record<string, string>;
}

export interface MCPSSEConfig {
	type: 'sse';
	url: string;
	headers?: Record<string, string>;
}

export type MCPTransportConfig = MCPStdioConfig | MCPWebSocketConfig | MCPSSEConfig;

export interface MCPServerConfig {
	name: string;
	modulePath?: string;  // For built-in CLI servers
	command?: string;     // For stdio external servers
	args?: string[];
	description?: string;
	enabled: boolean;
	transport?: MCPTransportConfig;  // For external MCP servers
}

export interface MCPConfigFile {
	version: string;
	servers: Array<{
		name: string;
		enabled?: boolean;
		transport: MCPTransportConfig;
	}>;
}

// Always use source TypeScript files with tsx (works in both dev and production)
// tsx handles ESM better than ts-node/esm and can run .ts files directly
// Resolve path relative to project root, not dist
const getServerDir = () => {
	if (__dirname.includes('dist')) {
		// Running from compiled dist - point to source
		return path.join(__dirname, '..', 'src', 'mcp');
	}
	// Running from source
	return __dirname;
};
const serverDir = getServerDir();

export const BUILTIN_SERVERS: Record<string, MCPServerConfig> = {
	patch: {
		name: 'patch',
		modulePath: path.join(serverDir, 'patch-server.ts'),
		description:
			'Apply unified diffs, edit ranges, insert content, delete ranges',
		enabled: true,
	},
	runner: {
		name: 'runner',
		modulePath: path.join(serverDir, 'runner-server.ts'),
		description: 'Detect projects, run tests, format, lint, build',
		enabled: true,
	},
	git: {
		name: 'git',
		modulePath: path.join(serverDir, 'git-server.ts'),
		description: 'Git operations: status, diff, log, commit, branch management',
		enabled: true,
	},
	cache: {
		name: 'cache',
		modulePath: path.join(serverDir, 'cache-server.ts'),
		description: 'SUPERCACHE - 3-tier caching system (reasoning, project, vault)',
		enabled: true,
	},
};

export class MCPClientManager {
	private clients: Map<string, Client>;
	private clientToolMap: Map<string, string>; // tool name -> client name (reserved for future use)
	private wss: WebSocketServer | null = null;
	private serverProcesses: Map<string, ReturnType<typeof execa>>;
	private serverConfigs: Map<string, MCPServerConfig>;

	constructor() {
		this.clients = new Map();
		this.clientToolMap = new Map();
		this.serverProcesses = new Map();
		this.serverConfigs = new Map();

		// Register built-in servers
		for (const [key, config] of Object.entries(BUILTIN_SERVERS)) {
			this.serverConfigs.set(key, config);
		}
	}

	/**
	 * Register a custom MCP server configuration
	 */
	registerServer(config: MCPServerConfig): void {
		this.serverConfigs.set(config.name, config);
	}

	/**
	 * Unregister a server configuration
	 */
	unregisterServer(name: string): void {
		this.serverConfigs.delete(name);
	}

	/**
	 * Start a built-in MCP server as a subprocess
	 */
	async startBuiltinServer(serverName: string): Promise<boolean> {
		const config = this.serverConfigs.get(serverName);
		if (!config || !config.enabled) {
			console.warn(`Server ${serverName} not found or disabled`);
			return false;
		}

		if (this.serverProcesses.has(serverName)) {
			console.log(`Server ${serverName} already running`);
			return true;
		}

		try {
			// Use tsx to run TypeScript files directly (better ESM support than ts-node/esm)
			const args = config.modulePath ? [config.modulePath] : config.args || [];

			// Connect to the server via stdio using tsx
			await this.connectStdio(`builtin-${serverName}`, 'npx', [
				'tsx',
				...args,
			]);

			console.log(`Started built-in MCP server: ${serverName}`);
			return true;
		} catch (error) {
			console.error(`Failed to start server ${serverName}:`, error);
			return false;
		}
	}

	/**
	 * Stop a running server
	 */
	async stopServer(serverName: string): Promise<boolean> {
		const process = this.serverProcesses.get(serverName);
		if (!process) {
			return false;
		}

		try {
			process.kill();
			this.serverProcesses.delete(serverName);
			this.clients.delete(`builtin-${serverName}`);
			console.log(`Stopped server: ${serverName}`);
			return true;
		} catch (error) {
			console.error(`Failed to stop server ${serverName}:`, error);
			return false;
		}
	}

	/**
	 * Start all enabled built-in servers
	 */
	async startBuiltinServers(): Promise<void> {
		for (const [name, config] of this.serverConfigs) {
			if (config.enabled && config.modulePath) {
				await this.startBuiltinServer(name);
			}
		}
	}

	/**
	 * Stop all running servers
	 */
	async stopAllServers(): Promise<void> {
		const serverNames = Array.from(this.serverProcesses.keys());
		for (const name of serverNames) {
			await this.stopServer(name);
		}
	}

	/**
	 * Get list of registered servers
	 */
	getServers(): Array<{
		name: string;
		description?: string;
		enabled: boolean;
		running: boolean;
	}> {
		return Array.from(this.serverConfigs.values()).map(config => ({
			name: config.name,
			description: config.description,
			enabled: config.enabled,
			running: this.serverProcesses.has(config.name),
		}));
	}

	async startServer(port: number = 3000) {
		this.wss = new WebSocketServer({port});
		console.log(`MCP Server listening on port ${port}`);

		this.wss.on('connection', async ws => {
			console.log('New MCP connection from Chrome');
			const transport = new WebSocketConnectionTransport(ws);
			const clientId = `chrome-${uuidv4()}`;

			const client = new Client(
				{
					name: 'floyd-cli',
					version: '0.1.0',
				},
				{
					capabilities: {
						sampling: {},
					},
				},
			);

			try {
				await client.connect(transport);
				this.clients.set(clientId, client);

				ws.on('close', () => {
					console.log(`MCP connection ${clientId} closed`);
					this.clients.delete(clientId);
				});
			} catch (e) {
				console.error('Failed to connect to MCP client', e);
				ws.close();
			}
		});
	}

	async connectStdio(
		name: string,
		command: string,
		args: string[] = [],
		env?: Record<string, string>,
		cwd?: string
	) {
		const transport = new StdioClientTransport({
			command,
			args,
			env,
			cwd,
		});

		const client = new Client(
			{
				name: 'floyd-cli',
				version: '0.1.0',
			},
			{
				capabilities: {
					sampling: {},
				},
			},
		);

		await client.connect(transport);
		this.clients.set(name, client);

		// Build tool map for this client
		this.buildToolMap(client, name);

		return client;
	}

	/**
	 * Build a mapping from tool names to client names
	 */
	private async buildToolMap(
		client: Client,
		clientName: string,
	): Promise<void> {
		try {
			const result = (await client.listTools()) as ListToolsResult;
			for (const tool of result.tools) {
				this.clientToolMap.set(tool.name, clientName);
			}
		} catch (e) {
			console.error(`Failed to list tools for client ${clientName}:`, e);
		}
	}

	async listTools(): Promise<any[]> {
		let allTools: any[] = [];
		for (const [clientName, client] of this.clients) {
			try {
				const result = (await client.listTools()) as ListToolsResult;
				// Add server name to each tool for reference
				const toolsWithServer = result.tools.map(tool => ({
					...tool,
					server: clientName,
				}));
				allTools = [...allTools, ...toolsWithServer];
			} catch (e) {
				console.error(`Failed to list tools for ${clientName}:`, e);
			}
		}
		return allTools;
	}

	async callTool(name: string, args: any): Promise<any> {
		// Use the tool map to find the correct client
		const clientName = this.clientToolMap.get(name);

		if (!clientName) {
			// Fallback to searching all clients
			for (const client of this.clients.values()) {
				try {
					const tools = (await client.listTools()) as ListToolsResult;
					if (tools.tools.find(t => t.name === name)) {
						return await client.callTool({
							name,
							arguments: args,
						});
					}
				} catch (e) {
					// continue
				}
			}
			throw new Error(`Tool ${name} not found`);
		}

		const client = this.clients.get(clientName);
		if (!client) {
			throw new Error(`Client ${clientName} not found for tool ${name}`);
		}

		return await client.callTool({
			name,
			arguments: args,
		});
	}

	/**
	 * Check if a specific tool is available
	 */
	hasTool(toolName: string): boolean {
		return this.clientToolMap.has(toolName);
	}

	/**
	 * Get tools grouped by server
	 */
	getToolsByServer(): Map<string, string[]> {
		const result = new Map<string, string[]>();
		for (const [toolName, clientName] of this.clientToolMap) {
			if (!result.has(clientName)) {
				result.set(clientName, []);
			}
			result.get(clientName)!.push(toolName);
		}
		return result;
	}

	/**
	 * Cleanup when shutting down
	 */
	async shutdown(): Promise<void> {
		await this.stopAllServers();

		if (this.wss) {
			this.wss.close();
			this.wss = null;
		}

		this.clients.clear();
		this.clientToolMap.clear();
	}

	// ========================================================================
	// EXTERNAL MCP SERVER CONFIGURATION LOADING
	// ========================================================================

	/**
	 * Load MCP configuration from .floyd/mcp.json or similar locations
	 *
	 * Searches for config files in standard locations and loads the first one found.
	 *
	 * @param projectRoot - Project root directory (default: process.cwd())
	 * @returns MCP config or empty config if no file exists
	 */
	loadMCPConfig(projectRoot: string = process.cwd()): MCPConfigFile {
		const configPaths = [
			'.floyd/mcp.json',
			'.floyd/mcp.config.json',
			'mcp.config.json',
		];

		for (const relativePath of configPaths) {
			const fullPath = join(projectRoot, relativePath);
			if (existsSync(fullPath)) {
				try {
					const content = readFileSync(fullPath, 'utf-8');
					const config = JSON.parse(content) as MCPConfigFile;
					console.log(`[MCP] Loaded config from ${relativePath}`);
					return config;
				} catch (error) {
					console.error(`[MCP] Failed to load config from ${relativePath}:`, error);
				}
			}
		}

		// Return default empty config
		return {version: '1.0', servers: []};
	}

	/**
	 * Connect to external MCP servers from configuration file
	 *
	 * Loads .floyd/mcp.json and connects to all enabled external servers.
	 * Servers configured with 'enabled: false' are skipped.
	 *
	 * @param projectRoot - Project root directory (default: process.cwd())
	 * @returns Object with connected count, failed count, and errors
	 */
	async connectExternalServers(projectRoot: string = process.cwd()): Promise<{
		connected: number;
		failed: number;
		errors: Array<{server: string; error: string}>;
	}> {
		const config = this.loadMCPConfig(projectRoot);
		const result = {
			connected: 0,
			failed: 0,
			errors: [] as Array<{server: string; error: string}>,
		};

		for (const server of config.servers) {
			// Skip disabled servers
			if (server.enabled === false) {
				continue;
			}

			try {
				await this.connectExternalServer(server);
				result.connected++;
			} catch (error) {
				result.failed++;
				result.errors.push({
					server: server.name,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		if (result.connected > 0) {
			console.log(`[MCP] Connected to ${result.connected} external server(s)`);
		}
		if (result.failed > 0) {
			console.warn(`[MCP] Failed to connect to ${result.failed} server(s)`);
		}

		return result;
	}

	/**
	 * Connect to a single external MCP server from its configuration
	 */
	private async connectExternalServer(server: {
		name: string;
		transport: MCPTransportConfig;
	}): Promise<void> {
		const {name, transport} = server;

		switch (transport.type) {
			case 'stdio': {
				await this.connectStdio(
					name,
					transport.command,
					transport.args || [],
					transport.env,
					transport.cwd
				);
				console.log(`[MCP] Connected to stdio server: ${name}`);
				break;
			}

			case 'websocket': {
				await this.connectWebSocket(name, transport.url, transport.headers);
				console.log(`[MCP] Connected to WebSocket server: ${name}`);
				break;
			}

			case 'sse': {
				throw new Error(`SSE transport not yet implemented: ${name}`);
			}

			default:
				throw new Error(`Unknown transport type: ${(transport as any).type}`);
		}
	}

	/**
	 * Connect to an external WebSocket MCP server (as a client)
	 *
	 * @param name - Unique identifier for this client
	 * @param url - WebSocket URL to connect to
	 * @param headers - Optional headers to include
	 */
	async connectWebSocket(
		name: string,
		url: string,
		headers?: Record<string, string>
	): Promise<void> {
		const WebSocket = await import('ws');
		const ws = new WebSocket.default(url, {headers});

		const transport = new WebSocketConnectionTransport(ws as any);

		const client = new Client(
			{
				name: 'floyd-cli',
				version: '0.1.0',
			},
			{
				capabilities: {
					sampling: {},
				},
			},
		);

		await client.connect(transport);
		this.clients.set(name, client);

		// Build tool map for this client
		await this.buildToolMap(client, name);
	}
}
