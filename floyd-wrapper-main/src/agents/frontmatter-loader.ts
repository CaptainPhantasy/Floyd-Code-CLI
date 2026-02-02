/**
 * PHASE 5 ITEM 23: Agent Frontmatter Support
 *
 * Load agent definitions from markdown files with YAML frontmatter.
 * Enables .floyd/agents/*.md based agent configuration.
 */

import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Agent definition from frontmatter
 */
export interface AgentDefinition {
	name: string;
	description?: string;
	model?: string;
	permissionMode?: 'yolo' | 'ask' | 'plan';
	allowedTools?: string[];
	skills?: string[];
	context?: AgentContext;
	instructions: string;
}

/**
 * Agent context configuration
 */
export interface AgentContext {
	fork?: boolean;    // Fork session for this agent
	once?: boolean;    // Use once then revert
	persistent?: boolean; // Keep agent across sessions
}

/**
 * Parsed frontmatter data
 */
interface FrontmatterData {
	description?: string;
	model?: string;
	permissionMode?: 'yolo' | 'ask' | 'plan';
	allowedTools?: string[];
	skills?: string[];
	context?: AgentContext;
}

/**
 * Load agent from markdown file with YAML frontmatter
 */
export async function loadAgentFromMarkdown(
	filePath: string
): Promise<AgentDefinition> {
	const content = await fs.readFile(filePath, 'utf-8');

	// Extract YAML frontmatter between --- delimiters
	const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

	if (!frontmatterMatch) {
		throw new Error(`No frontmatter found in ${filePath}`);
	}

	const frontmatterText = frontmatterMatch[1];
	const instructions = content.slice(frontmatterMatch[0].length).trim();

	// Parse YAML frontmatter
	const frontmatter = yaml.load(frontmatterText) as FrontmatterData;

	// Extract name from filename
	const name = path.basename(filePath, '.md');

	return {
		name,
		...frontmatter,
		instructions,
	};
}

/**
 * Load all agents from a directory
 */
export async function loadAgentsFromDirectory(
	dirPath: string
): Promise<Map<string, AgentDefinition>> {
	const agents = new Map<string, AgentDefinition>();

	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith('.md')) {
				const filePath = path.join(dirPath, entry.name);
				try {
					const agent = await loadAgentFromMarkdown(filePath);
					agents.set(agent.name, agent);
				} catch (error) {
					console.warn(`Failed to load agent from ${filePath}:`, error);
				}
			}
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.warn(`Error reading agents directory ${dirPath}:`, error);
		}
	}

	return agents;
}

/**
 * Validate agent definition
 */
export function validateAgent(agent: AgentDefinition): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!agent.name || agent.name.trim().length === 0) {
		errors.push('Agent name is required');
	}

	if (!agent.instructions || agent.instructions.trim().length === 0) {
		errors.push('Agent instructions are required');
	}

	if (agent.permissionMode && !['yolo', 'ask', 'plan'].includes(agent.permissionMode)) {
		errors.push('Invalid permission mode. Must be yolo, ask, or plan');
	}

	if (agent.model && typeof agent.model !== 'string') {
		errors.push('Model must be a string');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Convert agent definition to prompt
 */
export function agentToPrompt(agent: AgentDefinition): string {
	let prompt = `# Agent: ${agent.name}\n`;

	if (agent.description) {
		prompt += `> ${agent.description}\n\n`;
	}

	prompt += `**Configuration:**\n`;
	if (agent.model) {
		prompt += `- Model: ${agent.model}\n`;
	}
	if (agent.permissionMode) {
		prompt += `- Permission Mode: ${agent.permissionMode}\n`;
	}
	if (agent.allowedTools && agent.allowedTools.length > 0) {
		prompt += `- Allowed Tools: ${agent.allowedTools.join(', ')}\n`;
	}
	if (agent.skills && agent.skills.length > 0) {
		prompt += `- Skills: ${agent.skills.join(', ')}\n`;
	}

	prompt += `\n${agent.instructions}`;

	return prompt;
}

/**
 * Get default agents directory path
 */
export function getAgentsDir(): string {
	return path.join(process.cwd(), '.floyd', 'agents');
}

/**
 * Resolve agent reference (@agent-name) to definition
 */
export async function resolveAgentReference(
	reference: string,
	agentsDir?: string
): Promise<AgentDefinition | null> {
	// Remove @ prefix if present
	const agentName = reference.startsWith('@') ? reference.slice(1) : reference;
	const dir = agentsDir || getAgentsDir();

	const agents = await loadAgentsFromDirectory(dir);
	return agents.get(agentName) || null;
}
