/**
 * Custom Agent
 *
 * User-configurable agent system with custom prompts and tool access.
 *
 * @module agent/custom-agent
 */

import {readFile, readdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Custom agent configuration
 */
export interface CustomAgentConfig {
	/** Unique agent ID */
	id: string;

	/** Agent name */
	name: string;

	/** Agent description */
	description: string;

	/** Agent role/persona */
	role: string;

	/** System prompt */
	systemPrompt: string;

	/** Allowed tools (empty = all tools) */
	allowedTools: string[];

	/** Denied tools (overrides allowed) */
	deniedTools: string[];

	/** Agent parameters */
	parameters: AgentParameters;

	/** Agent version */
	version: string;

	/** Created at */
	createdAt: Date;

	/** Updated at */
	updatedAt: Date;
}

/**
 * Agent execution parameters
 */
export interface AgentParameters {
	/** Temperature (0-1) */
	temperature?: number;

	/** Maximum tokens */
	maxTokens?: number;

	/** Top P sampling */
	topP?: number;

	/** Frequency penalty */
	frequencyPenalty?: number;

	/** Presence penalty */
	presencePenalty?: number;

	/** Streaming response */
	streaming?: boolean;
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
	/** Agent configuration */
	agent: CustomAgentConfig;

	/** User input */
	input: string;

	/** Conversation history */
	messages: Array<{
		role: 'system' | 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}>;

	/** Working directory */
	cwd: string;

	/** Session ID */
	sessionId: string;

	/** Execution metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
	/** Agent response */
	response: string;

	/** Execution duration */
	duration: number;

	/** Tokens used */
	tokens: {
		prompt: number;
		completion: number;
		total: number;
	};

	/** Tools called */
	toolsCalled: string[];

	/** Whether execution was successful */
	success: boolean;

	/** Error message (if failed) */
	error?: string;
}

/**
 * Agent manifest (from .floyd/agents/<name>.json)
 */
export interface AgentManifest {
	/** Agent ID */
	id: string;

	/** Agent name */
	name: string;

	/** Agent description */
	description: string;

	/** Agent role */
	role: string;

	/** System prompt (can reference file) */
	systemPrompt: string;

	/** System prompt file (relative path) */
	systemPromptFile?: string;

	/** Allowed tools */
	allowedTools?: string[];

	/** Denied tools */
	deniedTools?: string[];

	/** Agent parameters */
	parameters?: AgentParameters;

	/** Agent version */
	version?: string;
}

// ============================================================================
// CUSTOM AGENT MANAGER CLASS
// ============================================================================

/**
 * CustomAgentManager - Manage user-configurable agents
 *
 * Allows users to create and manage custom agents with specific
 * roles, system prompts, and tool access controls.
 */
export class CustomAgentManager {
	private readonly agentsDir: string;
	private readonly agents: Map<string, CustomAgentConfig> = new Map();

	constructor(agentsDir?: string) {
		this.agentsDir = agentsDir || join(process.cwd(), '.floyd', 'agents');
	}

	/**
	 * Initialize agent manager
	 */
	async initialize(): Promise<void> {
		// Load agents from directory
		await this.loadAgents();
	}

	/**
	 * Create a new agent
	 */
	async createAgent(manifest: AgentManifest): Promise<CustomAgentConfig> {
		// Validate ID
		if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) {
			throw new Error('Agent ID must contain only lowercase letters, numbers, and hyphens');
		}

		// Check if agent already exists
		if (this.agents.has(manifest.id)) {
			throw new Error(`Agent already exists: ${manifest.id}`);
		}

		// Load system prompt from file if specified
		let systemPrompt = manifest.systemPrompt;
		if (manifest.systemPromptFile) {
			const promptPath = join(this.agentsDir, manifest.systemPromptFile);
			systemPrompt = await readFile(promptPath, 'utf-8');
		}

		// Create agent config
		const config: CustomAgentConfig = {
			id: manifest.id,
			name: manifest.name,
			description: manifest.description,
			role: manifest.role,
			systemPrompt,
			allowedTools: manifest.allowedTools || [],
			deniedTools: manifest.deniedTools || [],
			parameters: manifest.parameters || {},
			version: manifest.version || '1.0.0',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Add to memory
		this.agents.set(config.id, config);

		// Save to disk
		await this.saveAgent(config);

		return config;
	}

	/**
	 * Get an agent by ID
	 */
	getAgent(agentId: string): CustomAgentConfig | undefined {
		return this.agents.get(agentId);
	}

	/**
	 * Get all agents
	 */
	getAllAgents(): CustomAgentConfig[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Get agents by role
	 */
	getAgentsByRole(role: string): CustomAgentConfig[] {
		return this.getAllAgents().filter(agent =>
			agent.role.toLowerCase().includes(role.toLowerCase()),
		);
	}

	/**
	 * Update an agent
	 */
	async updateAgent(
		agentId: string,
		updates: Partial<Omit<CustomAgentConfig, 'id' | 'createdAt'>>,
	): Promise<CustomAgentConfig> {
		const agent = this.agents.get(agentId);

		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`);
		}

		// Apply updates
		const updated: CustomAgentConfig = {
			...agent,
			...updates,
			id: agent.id,
			createdAt: agent.createdAt,
			updatedAt: new Date(),
		};

		// Update in memory
		this.agents.set(agentId, updated);

		// Save to disk
		await this.saveAgent(updated);

		return updated;
	}

	/**
	 * Delete an agent
	 */
	async deleteAgent(agentId: string): Promise<boolean> {
		const agent = this.agents.get(agentId);

		if (!agent) {
			return false;
		}

		// Remove from memory
		this.agents.delete(agentId);

		// Delete from disk
		// TODO: Implement file deletion

		return true;
	}

	/**
	 * Check if an agent can use a tool
	 */
	canUseTool(agentId: string, toolName: string): boolean {
		const agent = this.agents.get(agentId);

		if (!agent) {
			return false;
		}

		// Check denied tools first
		if (agent.deniedTools.includes(toolName)) {
			return false;
		}

		// If no allowed tools specified, all tools are allowed
		if (agent.allowedTools.length === 0) {
			return true;
		}

		// Check if tool is in allowed list
		return agent.allowedTools.includes(toolName);
	}

	/**
	 * Get agent statistics
	 */
	getStats(): {
		totalAgents: number;
		roles: Record<string, number>;
		averageTemperature: number;
		streamingAgents: number;
	} {
		const agents = this.getAllAgents();
		const roles: Record<string, number> = {};
		let totalTemp = 0;
		let streamingCount = 0;

		for (const agent of agents) {
			roles[agent.role] = (roles[agent.role] || 0) + 1;
			totalTemp += agent.parameters.temperature ?? 0.7;
			if (agent.parameters.streaming) {
				streamingCount++;
			}
		}

		return {
			totalAgents: agents.length,
			roles,
			averageTemperature: agents.length > 0 ? totalTemp / agents.length : 0,
			streamingAgents: streamingCount,
		};
	}

	/**
	 * Load agents from directory
	 */
	private async loadAgents(): Promise<void> {
		try {
			const files = await readdir(this.agentsDir);

			for (const file of files) {
				if (!file.endsWith('.json')) {
					continue;
				}

				try {
					const manifestPath = join(this.agentsDir, file);
					const content = await readFile(manifestPath, 'utf-8');
					const manifest = JSON.parse(content) as AgentManifest;

					// Create agent config
					const config: CustomAgentConfig = {
						id: manifest.id,
						name: manifest.name,
						description: manifest.description,
						role: manifest.role,
						systemPrompt: manifest.systemPrompt,
						allowedTools: manifest.allowedTools || [],
						deniedTools: manifest.deniedTools || [],
						parameters: manifest.parameters || {},
						version: manifest.version || '1.0.0',
						createdAt: new Date(), // Unknown from manifest
						updatedAt: new Date(),
					};

					this.agents.set(config.id, config);
				} catch (error) {
					console.error(`Failed to load agent from ${file}:`, error);
				}
			}
		} catch {
			// Directory doesn't exist yet
		}
	}

	/**
	 * Save agent to disk
	 */
	private async saveAgent(agent: CustomAgentConfig): Promise<void> {
		const manifest: AgentManifest = {
			id: agent.id,
			name: agent.name,
			description: agent.description,
			role: agent.role,
			systemPrompt: agent.systemPrompt,
			allowedTools: agent.allowedTools,
			deniedTools: agent.deniedTools,
			parameters: agent.parameters,
			version: agent.version,
		};

		const manifestPath = join(this.agentsDir, `${agent.id}.json`);
		await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
	}
}

// ============================================================================
// AGENT EXECUTOR CLASS
// ============================================================================

/**
 * CustomAgentExecutor - Execute custom agents
 *
 * Handles execution of custom agents with tool access control.
 */
export class CustomAgentExecutor {
	private readonly manager: CustomAgentManager;

	constructor(manager: CustomAgentManager) {
		this.manager = manager;
	}

	/**
	 * Execute a custom agent
	 */
	async execute(agentId: string, input: string, context: Partial<AgentExecutionContext> = {}): Promise<AgentExecutionResult> {
		const agent = this.manager.getAgent(agentId);

		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`);
		}

		const startTime = Date.now();

		try {
			// Build execution context
			const execContext: AgentExecutionContext = {
				agent,
				input,
				messages: context.messages || [],
				cwd: context.cwd || process.cwd(),
				sessionId: context.sessionId || 'default',
				metadata: context.metadata,
			};

			// Add system prompt if not present
			if (execContext.messages.length === 0 || execContext.messages[0].role !== 'system') {
				execContext.messages.unshift({
					role: 'system',
					content: agent.systemPrompt,
					timestamp: new Date(),
				});
			}

			// Add user message
			execContext.messages.push({
				role: 'user',
				content: input,
				timestamp: new Date(),
			});

			// TODO: Execute agent with LLM
			// This is a placeholder for the actual execution logic
			const response = `Agent ${agent.name} response to: ${input}`;

			return {
				response,
				duration: Date.now() - startTime,
				tokens: {
					prompt: 0,
					completion: 0,
					total: 0,
				},
				toolsCalled: [],
				success: true,
			};
		} catch (error) {
			return {
				response: '',
				duration: Date.now() - startTime,
				tokens: {
					prompt: 0,
					completion: 0,
					total: 0,
				},
				toolsCalled: [],
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Filter available tools for an agent
	 */
	filterTools(agentId: string, availableTools: string[]): string[] {
		const agent = this.manager.getAgent(agentId);

		if (!agent) {
			return [];
		}

		return availableTools.filter(tool => this.manager.canUseTool(agentId, tool));
	}
}

// ============================================================================
// PREDEFINED AGENTS
// ============================================================================

/**
 * Get default agent templates
 */
export function getDefaultAgentTemplates(): AgentManifest[] {
	return [
		{
			id: 'code-reviewer',
			name: 'Code Reviewer',
			description: 'Reviews code for bugs, security issues, and best practices',
			role: 'code-reviewer',
			systemPrompt: `You are a Code Reviewer agent. Your role is to:

1. Review code for bugs and potential issues
2. Identify security vulnerabilities
3. Check adherence to best practices
4. Suggest improvements and optimizations
5. Ensure code readability and maintainability

Provide clear, actionable feedback with specific examples.`,
			allowedTools: ['file_read', 'git_diff', 'search_code'],
			deniedTools: ['file_write', 'shell_execute'],
			parameters: {
				temperature: 0.3,
				maxTokens: 2000,
			},
			version: '1.0.0',
		},
		{
			id: 'test-generator',
			name: 'Test Generator',
			description: 'Generates unit tests for code',
			role: 'test-engineer',
			systemPrompt: `You are a Test Generator agent. Your role is to:

1. Analyze code to understand its functionality
2. Generate comprehensive unit tests
3. Cover edge cases and error conditions
4. Use appropriate testing frameworks
5. Ensure tests are maintainable and clear

Generate tests that follow Arrange-Act-Assert pattern.`,
			allowedTools: ['file_read', 'file_write'],
			deniedTools: ['shell_execute', 'git_push'],
			parameters: {
				temperature: 0.5,
				maxTokens: 4000,
			},
			version: '1.0.0',
		},
		{
			id: 'documentation-writer',
			name: 'Documentation Writer',
			description: 'Writes and updates documentation',
			role: 'technical-writer',
			systemPrompt: `You are a Documentation Writer agent. Your role is to:

1. Write clear, concise documentation
2. Explain complex concepts simply
3. Provide code examples
4. Update README files and API docs
5. Ensure consistency and accuracy

Focus on user needs and practical examples.`,
			allowedTools: ['file_read', 'file_write'],
			deniedTools: [],
			parameters: {
				temperature: 0.4,
				maxTokens: 3000,
			},
			version: '1.0.0',
		},
	];
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default global custom agent manager instance
 */
let defaultManager: CustomAgentManager | null = null;

/**
 * Get or create the default agent manager
 */
export function getDefaultAgentManager(agentsDir?: string): CustomAgentManager {
	if (!defaultManager) {
		defaultManager = new CustomAgentManager(agentsDir);
	}
	return defaultManager;
}

/**
 * Reset the default agent manager (useful for testing)
 */
export function resetDefaultAgentManager(): void {
	defaultManager = null;
}

export default CustomAgentManager;
