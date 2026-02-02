/**
 * MCP Agent Server
 *
 * Exposes Floyd's chat agent capabilities to external processes like
 * the VSCode floyd-multi-chat extension.
 *
 * Tools:
 * - chat_send: Send a message and get a response from Floyd's agent
 * - chat_stream: Send a message with streaming response support
 * - chat_history: Get or set conversation history for a session
 * - chat_status: Check agent status and capabilities
 *
 * @module mcp/agent-server
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp?: number;
}

export interface ChatSession {
	id: string;
	messages: ChatMessage[];
	createdAt: number;
	updatedAt: number;
	projectPath?: string;
}

export interface ChatOptions {
	model?: string;
	maxTokens?: number;
	temperature?: number;
	safetyMode?: 'yolo' | 'ask' | 'plan';
	stream?: boolean;
}

export interface ChatResponse {
	content: string;
	role: 'assistant';
	timestamp: number;
	tokensUsed?: number;
	finishReason?: string;
}

export interface StreamChunk {
	delta: string;
	done: boolean;
	timestamp: number;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

class SessionManager {
	private readonly sessions: Map<string, ChatSession> = new Map();
	private readonly historyPath: string;

	constructor() {
		const floydDir = path.join(os.homedir(), '.floyd');
		this.historyPath = path.join(floydDir, 'chat-sessions.json');
		this.ensureDirectory();
		this.loadHistory();
	}

	private ensureDirectory(): void {
		const dir = path.dirname(this.historyPath);
		fs.mkdirSync(dir, {recursive: true});
	}

	private async loadHistory(): Promise<void> {
		try {
			if (await fs.pathExists(this.historyPath)) {
				const data = await fs.readJson(this.historyPath);
				const sessions: ChatSession[] = data.sessions || [];
				sessions.forEach(s => this.sessions.set(s.id, s));
			}
		} catch (error) {
			console.error('Failed to load chat history:', error);
		}
	}

	private async saveHistory(): Promise<void> {
		try {
			const sessions = Array.from(this.sessions.values());
			await fs.writeJson(this.historyPath, {sessions}, {spaces: 2});
		} catch (error) {
			console.error('Failed to save chat history:', error);
		}
	}

	getOrCreateSession(sessionId: string, projectPath?: string): ChatSession {
		let session = this.sessions.get(sessionId);
		if (!session) {
			session = {
				id: sessionId,
				messages: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
				projectPath,
			};
			this.sessions.set(sessionId, session);
			this.saveHistory().catch(console.error);
		}
		return session;
	}

	getSession(sessionId: string): ChatSession | undefined {
		return this.sessions.get(sessionId);
	}

	updateSession(sessionId: string, updates: Partial<ChatSession>): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			Object.assign(session, updates, {updatedAt: Date.now()});
			this.saveHistory().catch(console.error);
		}
	}

	deleteSession(sessionId: string): void {
		this.sessions.delete(sessionId);
		this.saveHistory().catch(console.error);
	}

	listSessions(): ChatSession[] {
		return Array.from(this.sessions.values())
			.sort((a, b) => b.updatedAt - a.updatedAt);
	}
}

// ============================================================================
// AGENT CLIENT
// ============================================================================

class AgentClient {
	private readonly apiKey: string;
	private readonly apiEndpoint: string;
	private readonly defaultModel: string;

	constructor() {
		this.apiKey = process.env.FLOYD_GLM_API_KEY ||
		              process.env.GLM_API_KEY ||
		              process.env.ANTHROPIC_API_KEY ||
		              '';

		this.apiEndpoint = process.env.FLOYD_GLM_ENDPOINT ||
		                   process.env.GLM_ENDPOINT ||
		                   'https://api.z.ai/api/coding/paas/v4';

		this.defaultModel = process.env.FLOYD_GLM_MODEL ||
		                   process.env.GLM_MODEL ||
		                   'glm-4.7';

		if (!this.apiKey) {
			console.error('Warning: No API key found. Set FLOYD_GLM_API_KEY or GLM_API_KEY environment variable.');
		}
	}

	async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
		if (!this.apiKey) {
			throw new Error('API key not configured. Please set FLOYD_GLM_API_KEY or GLM_API_KEY environment variable.');
		}

		const model = options.model || this.defaultModel;
		const maxTokens = options.maxTokens || 4096;
		const temperature = options.temperature || 0.7;

		// Build message history for GLM format
		const apiMessages = messages.map(m => ({
			role: m.role,
			content: m.content,
		}));

		// Add system prompt if not present
		if (!apiMessages.some(m => m.role === 'system')) {
			apiMessages.unshift({
				role: 'system',
				content: 'You are Floyd, an AI coding assistant. You help with software development tasks, code analysis, debugging, and technical questions.',
			});
		}

		const startTime = Date.now();

		try {
			const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model,
					max_tokens: maxTokens,
					temperature,
					messages: apiMessages,
					stream: false,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`API request failed: ${response.status} - ${error}`);
			}

			const data = await response.json();
			const message = data.choices?.[0]?.message;
			const content = message?.content || message?.reasoning_content || 'No response received';

			return {
				content,
				role: 'assistant',
				timestamp: Date.now(),
				tokensUsed: data.usage?.total_tokens,
				finishReason: data.choices?.[0]?.finish_reason,
			};
		} catch (error) {
			throw new Error(`Agent error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async *streamChat(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
		if (!this.apiKey) {
			throw new Error('API key not configured. Please set FLOYD_GLM_API_KEY or GLM_API_KEY environment variable.');
		}

		const model = options.model || this.defaultModel;
		const maxTokens = options.maxTokens || 4096;
		const temperature = options.temperature || 0.7;

		const apiMessages = messages.map(m => ({
			role: m.role,
			content: m.content,
		}));

		if (!apiMessages.some(m => m.role === 'system')) {
			apiMessages.unshift({
				role: 'system',
				content: 'You are Floyd, an AI coding assistant. You help with software development tasks, code analysis, debugging, and technical questions.',
			});
		}

		try {
			const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model,
					max_tokens: maxTokens,
					temperature,
					messages: apiMessages,
					stream: true,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`API request failed: ${response.status} - ${error}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('No response body');
			}

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const {done, value} = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, {stream: true});
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim().startsWith('data: ')) {
						const data = line.trim().slice(6);
						if (data === '[DONE]') {
							yield {delta: '', done: true, timestamp: Date.now()};
							return;
						}

						try {
							const parsed = JSON.parse(data);
							const delta = parsed.choices?.[0]?.delta?.content;
							if (delta) {
								yield {delta, done: false, timestamp: Date.now()};
							}
						} catch {
							// Skip invalid JSON
						}
					}
				}
			}

			yield {delta: '', done: true, timestamp: Date.now()};
		} catch (error) {
			throw new Error(`Streaming error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	getStatus(): {connected: boolean; model: string; endpoint: string} {
		return {
			connected: !!this.apiKey,
			model: this.defaultModel,
			endpoint: this.apiEndpoint,
		};
	}
}

// ============================================================================
// MCP SERVER
// ============================================================================

const sessionManager = new SessionManager();
const agentClient = new AgentClient();

export async function createAgentServer(): Promise<Server> {
	const server = new Server(
		{
			name: 'floyd-agent-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: 'chat_send',
					description: 'Send a message to Floyd\'s agent and get a response. Creates or updates a chat session.',
					inputSchema: {
						type: 'object',
						properties: {
							sessionId: {
								type: 'string',
								description: 'Unique session identifier. Creates new if not exists.',
							},
							message: {
								type: 'string',
								description: 'User message to send to the agent.',
							},
							projectPath: {
								type: 'string',
								description: 'Project path for context-aware responses (optional).',
							},
							model: {
								type: 'string',
								description: 'Model to use (optional, uses default if not specified).',
							},
							maxTokens: {
								type: 'number',
								description: 'Maximum tokens in response (default: 4096).',
							},
							temperature: {
								type: 'number',
								description: 'Temperature for response generation (0-1, default: 0.7).',
							},
							includeHistory: {
								type: 'boolean',
								description: 'Include conversation history in response (default: true).',
							},
						},
						required: ['sessionId', 'message'],
					},
				},
				{
					name: 'chat_stream',
					description: 'Send a message with streaming response support. Returns chunks as they arrive.',
					inputSchema: {
						type: 'object',
						properties: {
							sessionId: {
								type: 'string',
								description: 'Unique session identifier.',
							},
							message: {
								type: 'string',
								description: 'User message to send.',
							},
							projectPath: {
								type: 'string',
								description: 'Project path for context.',
							},
							model: {
								type: 'string',
								description: 'Model to use.',
							},
							maxTokens: {
								type: 'number',
								description: 'Maximum tokens.',
							},
						},
						required: ['sessionId', 'message'],
					},
				},
				{
					name: 'chat_history',
					description: 'Get or set conversation history for a session.',
					inputSchema: {
						type: 'object',
						properties: {
							sessionId: {
								type: 'string',
								description: 'Session identifier.',
							},
							action: {
								type: 'string',
								enum: ['get', 'set', 'clear', 'list'],
								description: 'Action to perform: get, set, clear, or list all sessions.',
							},
							messages: {
								type: 'array',
								description: 'Messages to set (for action=set).',
								items: {
									type: 'object',
									properties: {
										role: {type: 'string', enum: ['user', 'assistant', 'system']},
										content: {type: 'string'},
										timestamp: {type: 'number'},
									},
									required: ['role', 'content'],
								},
							},
						},
						required: ['sessionId', 'action'],
					},
				},
				{
					name: 'chat_status',
					description: 'Check agent status and capabilities.',
					inputSchema: {
						type: 'object',
						properties: {
							detailed: {
								type: 'boolean',
								description: 'Include detailed status information.',
							},
						},
					},
				},
				{
					name: 'chat_delete',
					description: 'Delete a chat session.',
					inputSchema: {
						type: 'object',
						properties: {
							sessionId: {
								type: 'string',
								description: 'Session identifier to delete.',
							},
						},
						required: ['sessionId'],
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async request => {
		const {name, arguments: args} = request.params;

		try {
			switch (name) {
				case 'chat_send': {
					const {
						sessionId,
						message,
						projectPath,
						model,
						maxTokens,
						temperature,
						includeHistory = true,
					} = args as {
						sessionId: string;
						message: string;
						projectPath?: string;
						model?: string;
						maxTokens?: number;
						temperature?: number;
						includeHistory?: boolean;
					};

					// Get or create session
					const session = sessionManager.getOrCreateSession(sessionId, projectPath);

					// Add user message
					session.messages.push({
						role: 'user',
						content: message,
						timestamp: Date.now(),
					});

					// Get response from agent
					const response = await agentClient.chat(session.messages, {
						model,
						maxTokens,
						temperature,
					});

					// Add assistant response to session
					session.messages.push({
						role: 'assistant',
						content: response.content,
						timestamp: response.timestamp,
					});

					sessionManager.updateSession(sessionId, {messages: session.messages});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									...response,
									sessionId,
									history: includeHistory ? session.messages : undefined,
								}, null, 2),
							},
						],
					};
				}

				case 'chat_stream': {
					const {
						sessionId,
						message,
						projectPath,
						model,
						maxTokens,
					} = args as {
						sessionId: string;
						message: string;
						projectPath?: string;
						model?: string;
						maxTokens?: number;
					};

					const session = sessionManager.getOrCreateSession(sessionId, projectPath);
					session.messages.push({
						role: 'user',
						content: message,
						timestamp: Date.now(),
					});

					// Collect streaming response
					let fullContent = '';
					const chunks: StreamChunk[] = [];

					for await (const chunk of agentClient.streamChat(session.messages, {model, maxTokens})) {
						chunks.push(chunk);
						fullContent += chunk.delta;
						if (chunk.done) break;
					}

					const response: ChatResponse = {
						content: fullContent,
						role: 'assistant',
						timestamp: Date.now(),
					};

					session.messages.push({
						role: 'assistant',
						content: fullContent,
						timestamp: response.timestamp,
					});

					sessionManager.updateSession(sessionId, {messages: session.messages});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									...response,
									sessionId,
									chunks: chunks.map(c => ({delta: c.delta, done: c.done})),
								}, null, 2),
							},
						],
					};
				}

				case 'chat_history': {
					const {sessionId, action, messages} = args as {
						sessionId: string;
						action: 'get' | 'set' | 'clear' | 'list';
						messages?: ChatMessage[];
					};

					switch (action) {
						case 'get': {
							const session = sessionManager.getSession(sessionId);
							if (!session) {
								return {
									content: [{type: 'text', text: JSON.stringify({error: 'Session not found'}, null, 2)}],
									isError: true,
								};
							}
							return {
								content: [{type: 'text', text: JSON.stringify(session, null, 2)}],
							};
						}

						case 'set': {
							if (!messages) {
								return {
									content: [{type: 'text', text: JSON.stringify({error: 'Messages required for set action'}, null, 2)}],
									isError: true,
								};
							}
							const session = sessionManager.getOrCreateSession(sessionId);
							sessionManager.updateSession(sessionId, {messages});
							return {
								content: [{type: 'text', text: JSON.stringify({success: true, sessionId, messageCount: messages.length}, null, 2)}],
							};
						}

						case 'clear': {
							const session = sessionManager.getSession(sessionId);
							if (session) {
								sessionManager.updateSession(sessionId, {messages: []});
							}
							return {
								content: [{type: 'text', text: JSON.stringify({success: true, sessionId}, null, 2)}],
							};
						}

						case 'list': {
							const sessions = sessionManager.listSessions();
							return {
								content: [{type: 'text', text: JSON.stringify({sessions, count: sessions.length}, null, 2)}],
							};
						}

						default:
							throw new Error(`Unknown action: ${action}`);
					}
				}

				case 'chat_status': {
					const {detailed = false} = args as {detailed?: boolean};
					const status = agentClient.getStatus();
					const sessions = sessionManager.listSessions();

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									agent: status,
									sessions: {
										total: sessions.length,
										active: sessions.filter(s => s.updatedAt > Date.now() - 3600000).length,
									},
									...(detailed && {
										capabilities: ['chat', 'stream', 'history', 'tools'],
										supportedModels: ['glm-4.7', 'claude-opus-4', 'gpt-4'],
									}),
								}, null, 2),
							},
						],
					};
				}

				case 'chat_delete': {
					const {sessionId} = args as {sessionId: string};
					sessionManager.deleteSession(sessionId);
					return {
						content: [{type: 'text', text: JSON.stringify({success: true, sessionId}, null, 2)}],
					};
				}

				default:
					throw new Error(`Unknown tool: ${name}`);
			}
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							error: error instanceof Error ? error.message : String(error),
							tool: name,
						}, null, 2),
					},
				],
				isError: true,
			};
		}
	});

	return server;
}

/**
 * Start the agent server (for standalone execution)
 */
export async function startAgentServer(): Promise<void> {
	const server = await createAgentServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error('Floyd MCP Agent Server started');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	startAgentServer().catch(console.error);
}
