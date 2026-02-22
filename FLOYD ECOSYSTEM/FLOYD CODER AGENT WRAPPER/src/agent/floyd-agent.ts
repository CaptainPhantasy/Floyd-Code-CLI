/**
 * FloydAgent - Main Agent Orchestrator
 *
 * Coordinates prompt assembly, LLM communication, tool execution,
 * and response generation. The core of the FLOYD system.
 *
 * @module agent/floyd-agent
 */

import Anthropic from '@anthropic-ai/sdk';
import {EventEmitter} from 'events';
import {PromptEngine} from '../prompts/engine/engine.js';
import {ConfigManager, type Config} from '../config/config-manager.js';
import {SessionManager, type Message} from '../store/session-store.js';
import {PermissionManager} from '../permissions/ask-ui-stub.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Execution modes
 */
export type ExecutionMode =
	| 'ask'       // Explain before dangerous operations
	| 'yolo'      // Execute without asking for standard operations
	| 'plan'      // Read-only, no writes
	| 'auto'      // Adaptive, ask for risky operations
	| 'dialogue'  // One-line responses, no tools
	| 'fuckit';   // Execute anything without asking

/**
 * Agent execution result
 */
export interface AgentResult {
	/** Success status */
	success: boolean;

	/** Agent response text */
	output: string;

	/** Tokens used */
	tokens: {
		prompt: number;
		completion: number;
		total: number;
	};

	/** Tools called during execution */
	toolsCalled: string[];

	/** Execution duration (ms) */
	duration: number;

	/** Error if failed */
	error?: string;
}

/**
 * FloydAgent options
 */
export interface FloydAgentOptions {
	/** Execution mode */
	mode?: ExecutionMode;

	/** Model to use */
	model?: string;

	/** Working directory */
	cwd?: string;

	/** Session ID to resume */
	sessionId?: string;

	/** Configuration */
	config?: Partial<Config>;
}

// Re-export Message type from session-store
export type {Message} from '../store/session-store.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MODEL = 'claude-opus-4';
const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TIMEOUT = 60000;

// ============================================================================
// FLOYD AGENT CLASS
// ============================================================================

/**
 * FloydAgent - Main AI agent orchestrator
 *
 * Features:
 * - Dynamic prompt assembly with PromptEngine
 * - Multi-turn conversation support
 * - Tool execution with permission checks
 * - Session persistence
 * - Streaming and non-streaming modes
 * - Comprehensive error handling
 */
export class FloydAgent extends EventEmitter {
	private readonly config: Config;
	private readonly configManager: ConfigManager;
	private readonly sessionManager: SessionManager;
	private readonly permissionManager: PermissionManager;
	private readonly promptEngine: PromptEngine;
	private anthropic: Anthropic | null = null;
	private currentSessionId: string | null = null;

	constructor(options: FloydAgentOptions = {}) {
		super();

		// Initialize config manager
		this.configManager = new ConfigManager({
			cwd: options.cwd,
		});

		// Load config
		const defaults = this.configManager.getDefaults();
		this.config = {
			...defaults,
			...options.config,
			mode: options.mode || defaults.mode,
			model: options.model || defaults.model,
			cwd: options.cwd || defaults.cwd,
		};

		// Initialize managers
		this.sessionManager = new SessionManager(this.config.cwd);
		this.permissionManager = new PermissionManager([], this.config.cwd);

		// Initialize prompt engine
		this.promptEngine = new PromptEngine({
			system: {
				agentName: 'Floyd',
				mode: this.config.mode!,
			},
			includeExamples: true,
			includeTools: true,
			includeGuidelines: true,
		});

		// Load or resume session
		if (options.sessionId) {
			this.currentSessionId = options.sessionId;
		}
	}

	/**
	 * Run the agent with a prompt
	 */
	async run(prompt: string): Promise<AgentResult> {
		const startTime = Date.now();

		try {
			// Ensure API key is available
			const apiKey = this.getApiKey();
			if (!apiKey) {
				throw new Error('API key not found. Set ANTHROPIC_API_KEY environment variable.');
			}

			// Initialize Anthropic client if needed
			if (!this.anthropic) {
				this.anthropic = new Anthropic({
					apiKey,
					baseURL: this.config.apiBase,
					maxRetries: 3,
					timeout: this.config.timeout,
				});
			}

			// Get or create session
			const session = await this.getOrCreateSession();
			this.currentSessionId = session.id;

			// Build system prompt
			const systemPrompt = this.buildSystemPrompt();

			// Build messages array
			const messages = this.buildMessages(prompt, session.messages);

			this.emit('start', {prompt, sessionId: session.id});

			// Execute the agent
			const response = await this.execute(systemPrompt, messages);

			// Update session
			session.messages.push({
				role: 'user',
				content: prompt,
				timestamp: Date.now(),
			});

			session.messages.push({
				role: 'assistant',
				content: response.output,
				timestamp: Date.now(),
				toolCalls: response.toolsCalled.map(name => ({
					name,
					input: {},
				})),
			});

			await this.sessionManager.saveSession(session);

			const duration = Date.now() - startTime;

			this.emit('complete', {
				output: response.output,
				duration,
				sessionId: session.id,
			});

			return {
				success: true,
				output: response.output,
				tokens: response.tokens,
				toolsCalled: response.toolsCalled,
				duration,
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : String(error);

			this.emit('error', {error: errorMessage, duration});

			return {
				success: false,
				output: '',
				tokens: {prompt: 0, completion: 0, total: 0},
				toolsCalled: [],
				duration,
				error: errorMessage,
			};
		}
	}

	/**
	 * Run the agent in streaming mode
	 */
	async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
		const startTime = Date.now();

		try {
			const apiKey = this.getApiKey();
			if (!apiKey) {
				throw new Error('API key not found');
			}

			if (!this.anthropic) {
				this.anthropic = new Anthropic({
					apiKey,
					baseURL: this.config.apiBase,
				});
			}

			const session = await this.getOrCreateSession();
			this.currentSessionId = session.id;

			const systemPrompt = this.buildSystemPrompt();
			const messages = this.buildMessages(prompt, session.messages);

			this.emit('streamStart', {prompt, sessionId: session.id});

			let fullOutput = '';

			const stream = await this.anthropic.messages.stream({
				model: this.config.model!,
				max_tokens: this.config.maxTokens!,
				system: systemPrompt,
				messages: messages.map(m => ({
					role: m.role,
					content: m.content,
				})),
			});

			for await (const event of stream) {
				if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
					const text = event.delta.text;
					fullOutput += text;
					this.emit('streamChunk', {text, sessionId: session.id});
					yield text;
				}
			}

			// Update session
			session.messages.push({
				role: 'user',
				content: prompt,
				timestamp: Date.now(),
			});

			session.messages.push({
				role: 'assistant',
				content: fullOutput,
				timestamp: Date.now(),
			});

			await this.sessionManager.saveSession(session);

			const duration = Date.now() - startTime;

			this.emit('streamComplete', {
				output: fullOutput,
				duration,
				sessionId: session.id,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : String(error);

			this.emit('streamError', {error: errorMessage, duration});

			throw error;
		}
	}

	/**
	 * Get current session ID
	 */
	getSessionId(): string | null {
		return this.currentSessionId;
	}

	/**
	 * Get conversation history
	 */
	getHistory(): Message[] {
		const session = this.sessionManager.getSession(this.currentSessionId || '');
		return session?.messages || [];
	}

	/**
	 * Clear conversation history
	 */
	async clearHistory(): Promise<void> {
		if (this.currentSessionId) {
			const session = this.sessionManager.getSession(this.currentSessionId);
			if (session) {
				session.messages = [];
				await this.sessionManager.saveSession(session);
			}
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): Config {
		return {...this.config};
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<Config>): void {
		Object.assign(this.config, updates);
	}

	// -------------------------------------------------------------------------
	// PRIVATE METHODS
	// -------------------------------------------------------------------------

	/**
	 * Get API key from config or environment
	 */
	private getApiKey(): string | undefined {
		return this.config.apiKey || this.configManager.getApiKey();
	}

	/**
	 * Get or create a session
	 */
	private async getOrCreateSession() {
		if (this.currentSessionId) {
			const existing = this.sessionManager.getSession(this.currentSessionId);
			if (existing) {
				return existing;
			}
		}

		const session = await this.sessionManager.createSession(this.config.cwd!);
		this.currentSessionId = session.id;
		return session;
	}

	/**
	 * Build system prompt
	 */
	private buildSystemPrompt(): string {
		return this.promptEngine.buildMinimal('');
	}

	/**
	 * Build messages array from prompt and history
	 */
	private buildMessages(prompt: string, history: Message[]): Array<{role: 'user' | 'assistant'; content: string}> {
		const messages: Array<{role: 'user' | 'assistant'; content: string}> = [];

		// Add recent history (last 10 messages)
		const recentHistory = history.slice(-10);

		for (const msg of recentHistory) {
			if (msg.role !== 'system') {
				messages.push({
					role: msg.role,
					content: msg.content,
				});
			}
		}

		// Add current prompt
		messages.push({
			role: 'user',
			content: prompt,
		});

		return messages;
	}

	/**
	 * Execute the agent (non-streaming)
	 */
	private async execute(
		systemPrompt: string,
		messages: Array<{role: 'user' | 'assistant'; content: string}>,
	): Promise<{
		output: string;
		tokens: {prompt: number; completion: number; total: number};
		toolsCalled: string[];
	}> {
		if (!this.anthropic) {
			throw new Error('Anthropic client not initialized');
		}

		const response = await this.anthropic.messages.create({
			model: this.config.model!,
			max_tokens: this.config.maxTokens!,
			system: systemPrompt,
			messages,
		});

		// Extract text content
		const textBlocks = response.content.filter(block => block.type === 'text');
		const output = textBlocks.map(block => (block.type === 'text' ? block.text : '')).join('\n');

		// Track tool calls
		const toolsCalled: string[] = [];
		const toolBlocks = response.content.filter(block => block.type === 'tool_use');
		for (const block of toolBlocks) {
			if (block.type === 'tool_use') {
				toolsCalled.push(block.name);
			}
		}

		return {
			output,
			tokens: {
				prompt: response.usage.input_tokens,
				completion: response.usage.output_tokens,
				total: response.usage.input_tokens + response.usage.output_tokens,
			},
			toolsCalled,
		};
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FloydAgent;
