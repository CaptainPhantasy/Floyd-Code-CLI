/**
 * PHASE 5 ITEM 23: Agent Frontmatter Support - Agent Registry
 *
 * Registry for managing frontmatter-based agent definitions.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
	loadAgentFromMarkdown,
	loadAgentsFromDirectory,
	validateAgent,
	agentToPrompt,
	getAgentsDir,
	type AgentDefinition,
} from './frontmatter-loader.js';

/**
 * Agent registry singleton
 */
class AgentRegistry {
	private agents: Map<string, AgentDefinition> = new Map();
	private agentsDir: string;
	private loaded = false;

	constructor(agentsDir?: string) {
		this.agentsDir = agentsDir || getAgentsDir();
	}

	/**
	 * Load all agents from the agents directory
	 */
	async load(): Promise<void> {
		this.agents = await loadAgentsFromDirectory(this.agentsDir);
		this.loaded = true;
	}

	/**
	 * Reload agents from disk
	 */
	async reload(): Promise<void> {
		this.agents.clear();
		await this.load();
	}

	/**
	 * Get an agent by name
	 */
	get(name: string): AgentDefinition | undefined {
		return this.agents.get(name);
	}

	/**
	 * Get all agents
	 */
	getAll(): AgentDefinition[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Get agent names
	 */
	getNames(): string[] {
		return Array.from(this.agents.keys());
	}

	/**
	 * Check if agent exists
	 */
	has(name: string): boolean {
		return this.agents.has(name);
	}

	/**
	 * Register an agent programmatically
	 */
	register(agent: AgentDefinition): void {
		const validation = validateAgent(agent);
		if (!validation.valid) {
			throw new Error(`Invalid agent: ${validation.errors.join(', ')}`);
		}
		this.agents.set(agent.name, agent);
	}

	/**
	 * Unregister an agent
	 */
	unregister(name: string): boolean {
		return this.agents.delete(name);
	}

	/**
	 * Get agent as formatted prompt
	 */
	getPrompt(name: string): string | null {
		const agent = this.get(name);
		return agent ? agentToPrompt(agent) : null;
	}

	/**
	 * Resolve agent reference (@agent-name) to prompt
	 */
	async resolveReference(reference: string): Promise<string | null> {
		const agentName = reference.startsWith('@') ? reference.slice(1) : reference;
		const prompt = this.getPrompt(agentName);

		if (prompt) {
			return prompt;
		}

		// Try loading from disk if not found
		await this.load();
		return this.getPrompt(agentName);
	}

	/**
	 * Save agent to file
	 */
	async save(agent: AgentDefinition): Promise<void> {
		const validation = validateAgent(agent);
		if (!validation.valid) {
			throw new Error(`Invalid agent: ${validation.errors.join(', ')}`);
		}

		const filePath = path.join(this.agentsDir, `${agent.name}.md`);
		const content = agentToMarkdown(agent);

		await fs.mkdir(this.agentsDir, { recursive: true });
		await fs.writeFile(filePath, content, 'utf-8');

		// Update registry
		this.agents.set(agent.name, agent);
	}

	/**
	 * Delete agent file
	 */
	async delete(name: string): Promise<boolean> {
		if (!this.agents.has(name)) {
			return false;
		}

		const filePath = path.join(this.agentsDir, `${name}.md`);

		try {
			await fs.unlink(filePath);
			return this.agents.delete(name);
		} catch {
			return false;
		}
	}

	/**
	 * Check if registry is loaded
	 */
	isLoaded(): boolean {
		return this.loaded;
	}
}

/**
 * Convert agent definition back to markdown format
 */
function agentToMarkdown(agent: AgentDefinition): string {
	let md = '---\n';

	if (agent.description) {
		md += `description: ${agent.description}\n`;
	}
	if (agent.model) {
		md += `model: ${agent.model}\n`;
	}
	if (agent.permissionMode) {
		md += `permissionMode: ${agent.permissionMode}\n`;
	}
	if (agent.allowedTools && agent.allowedTools.length > 0) {
		md += `allowedTools:\n`;
		for (const tool of agent.allowedTools) {
			md += `  - ${tool}\n`;
		}
	}
	if (agent.skills && agent.skills.length > 0) {
		md += `skills:\n`;
		for (const skill of agent.skills) {
			md += `  - ${skill}\n`;
		}
	}
	if (agent.context) {
		md += `context:\n`;
		if (agent.context.fork !== undefined) {
			md += `  fork: ${agent.context.fork}\n`;
		}
		if (agent.context.once !== undefined) {
			md += `  once: ${agent.context.once}\n`;
		}
		if (agent.context.persistent !== undefined) {
			md += `  persistent: ${agent.context.persistent}\n`;
		}
	}

	md += '---\n\n';
	md += agent.instructions;

	return md;
}

/**
 * Global registry instance
 */
let globalRegistry: AgentRegistry | null = null;

export function getAgentRegistry(agentsDir?: string): AgentRegistry {
	if (!globalRegistry) {
		globalRegistry = new AgentRegistry(agentsDir);
		// Auto-load on first access
		globalRegistry.load().catch(() => {
			// Directory may not exist yet
		});
	}
	return globalRegistry;
}

export function resetAgentRegistry(): void {
	globalRegistry = null;
}

export { AgentRegistry };
export type { AgentDefinition };
