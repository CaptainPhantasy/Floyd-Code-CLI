/**
 * Agent Command - Create and manage custom AI agents
 *
 * Usage:
 *   /agent              - Launch Agent Builder to create new agent
 *   /agent list         - List all custom agents
 *   /agent edit <name>  - Edit existing agent
 *   /agent delete <name> - Delete agent
 *   @<agent-name>       - Use specific agent for conversation
 */

import {AgentConfig} from '../ui/components/AgentBuilder.js';

export interface AgentCommandOptions {
	/** Agent name (for edit/delete) */
	agentName?: string;

	/** Action to perform */
	action?: 'create' | 'list' | 'edit' | 'delete';

	/** Raw input arguments */
	args: string[];
}

/**
 * Parse agent command arguments
 */
export function parseAgentArgs(args: string[]): AgentCommandOptions | null {
	const input = args.join(' ').trim();

	if (!input) {
		// Just "/agent" - launch builder
		return {action: 'create', args};
	}

	const firstArg = args[0].toLowerCase();

	// Check for subcommands
	if (firstArg === 'list') {
		return {action: 'list', args};
	}

	if (firstArg === 'edit') {
		const agentName = args.slice(1).join(' ');
		if (!agentName) {
			return null; // Missing agent name
		}
		return {action: 'edit', agentName, args};
	}

	if (firstArg === 'delete') {
		const agentName = args.slice(1).join(' ');
		if (!agentName) {
			return null; // Missing agent name
		}
		return {action: 'delete', agentName, args};
	}

	// If first arg doesn't match a subcommand, treat it as agent name for editing
	return {
		action: 'edit',
		agentName: input,
		args,
	};
}

/**
 * Get list of available agent subcommands
 */
export function getAgentSubcommands(): Array<{
	id: string;
	label: string;
	description: string;
}> {
	return [
		{
			id: 'agent-create',
			label: '/agent',
			description: 'Launch Agent Builder to create a new custom agent',
		},
		{
			id: 'agent-list',
			label: '/agent list',
			description: 'List all custom agents',
		},
		{
			id: 'agent-edit',
			label: '/agent edit <name>',
			description: 'Edit an existing agent',
		},
		{
			id: 'agent-delete',
			label: '/agent delete <name>',
			description: 'Delete an agent',
		},
	];
}

/**
 * Format agent info for display
 */
export function formatAgentInfo(agent: AgentConfig): string {
	const lines = [
		`Agent: ${agent.name}`,
		`Capabilities: ${agent.capabilities.join(', ')}`,
	];

	if (agent.systemPrompt) {
		lines.push(`System Prompt: ${agent.systemPrompt}`);
	}

	return lines.join('\n');
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: Partial<AgentConfig>): string[] {
	const errors: string[] = [];

	if (!config.name || config.name.trim().length === 0) {
		errors.push('Agent name is required');
	}

	if (config.name && !/^[a-zA-Z0-9-_]+$/.test(config.name)) {
		errors.push('Agent name can only contain letters, numbers, hyphens, and underscores');
	}

	if (!config.capabilities || config.capabilities.length === 0) {
		errors.push('At least one capability must be selected');
	}

	return errors;
}

/**
 * Agent storage (in-memory for now, should be persisted to file)
 */
class AgentStore {
	private agents: Map<string, AgentConfig> = new Map();

	save(agent: AgentConfig): void {
		this.agents.set(agent.name.toLowerCase(), agent);
	}

	get(name: string): AgentConfig | undefined {
		return this.agents.get(name.toLowerCase());
	}

	list(): AgentConfig[] {
		return Array.from(this.agents.values());
	}

	delete(name: string): boolean {
		return this.agents.delete(name.toLowerCase());
	}

	has(name: string): boolean {
		return this.agents.has(name.toLowerCase());
	}

	clear(): void {
		this.agents.clear();
	}
}

// Global agent store instance
export const agentStore = new AgentStore();

/**
 * Initialize with some default agents for demo
 */
export function initializeDefaultAgents(): void {
	const demoAgents: AgentConfig[] = [
		{
			name: 'security-analyzer',
			capabilities: ['security-review', 'code-analysis'],
			systemPrompt: 'Focus on security vulnerabilities and best practices',
		},
		{
			name: 'performance-optimizer',
			capabilities: ['performance-opt', 'code-analysis'],
			systemPrompt: 'Optimize for performance and resource usage',
		},
	];

	for (const agent of demoAgents) {
		agentStore.save(agent);
	}
}

// Initialize on import
initializeDefaultAgents();

export default {
	parseAgentArgs,
	getAgentSubcommands,
	formatAgentInfo,
	validateAgentConfig,
	agentStore,
	initializeDefaultAgents,
};
