/**
 * PHASE 5 ITEM 30: /context Command
 *
 * Context breakdown showing token usage and composition.
 * Helps users understand what's consuming their context budget.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Context breakdown information
 */
export interface ContextBreakdown {
	totalTokens: number;
	maxTokens: number;
	usedPercentage: number;
	remainingTokens: number;
	breakdown: {
		systemPrompt: number;
		conversation: number;
		tools: number;
		files: number;
		mcpServers: number;
		other: number;
	};
	suggestions: string[];
}

/**
 * Configuration source for context tracking
 */
interface ContextSource {
	name: string;
	tokens: number;
	details?: string;
}

/**
 * Simple token counter (word-based estimation)
 * Rough estimation: ~1 token per 4 characters for code, ~1.3 tokens per word for text
 */
export function estimateTokens(text: string): number {
	if (!text) return 0;

	// For code, tokens are roughly chars/4
	// For text, tokens are roughly words * 1.3
	// Use a hybrid approach

	const codeLike = text.includes('{') || text.includes('function') || text.includes('import');
	const codeRatio = codeLike ? 0.25 : 0.75; // chars per token

	return Math.ceil(text.length * codeRatio);
}

/**
 * Count JSON tokens more accurately
 */
export function countJSONTokens(obj: unknown): number {
	return estimateTokens(JSON.stringify(obj, null, 2));
}

/**
 * Get maximum tokens for model
 */
export function getMaxTokens(model?: string): number {
	// Default to 200K for Claude models
	const maxTokensByModel: Record<string, number> = {
		'claude-3-5-sonnet': 200000,
		'claude-3-opus': 200000,
		'claude-3-haiku': 200000,
		'glm-4.7': 128000,
		'glm-4': 128000,
	};

	if (model && maxTokensByModel[model]) {
		return maxTokensByModel[model];
	}

	return 200000; // Default
}

/**
 * Generate suggestions based on context usage
 */
export function generateSuggestions(percentage: number, breakdown: ContextBreakdown['breakdown']): string[] {
	const suggestions: string[] = [];

	if (percentage > 90) {
		suggestions.push('🔴 Context nearly full! Consider starting a new session.');
	} else if (percentage > 75) {
		suggestions.push('🟡 Context usage high. Consider summarizing old messages.');
	}

	if (breakdown.conversation > breakdown.totalTokens * 0.5) {
		suggestions.push('💬 Conversation is using >50% of context. Try /clear-history.');
	}

	if (breakdown.files > breakdown.totalTokens * 0.3) {
		suggestions.push('📁 File contents using >30%. Consider removing files from context.');
	}

	if (breakdown.tools > breakdown.totalTokens * 0.2) {
		suggestions.push('🔧 Many tools available. Disable unused tools with /tools disable.');
	}

	if (percentage < 25) {
		suggestions.push('✅ Context is healthy - plenty of room available.');
	}

	if (suggestions.length === 0) {
		suggestions.push('✅ Context usage is within acceptable range.');
	}

	return suggestions;
}

/**
 * Context tracker class
 */
export class ContextTracker {
	private model: string;
	private maxTokens: number;
	private sources: Map<string, ContextSource> = new Map();

	constructor(model?: string) {
		this.model = model || 'claude-3-5-sonnet';
		this.maxTokens = getMaxTokens(this.model);
	}

	/**
	 * Track a context source
	 */
	trackSource(name: string, content: string, details?: string): number {
		const tokens = estimateTokens(content);

		this.sources.set(name, {
			name,
			tokens,
			details,
		});

		return tokens;
	}

	/**
	 * Track conversation messages
	 */
	trackConversation(messages: Array<{ role: string; content: string }>): number {
		let tokens = 0;
		for (const msg of messages) {
			tokens += estimateTokens(msg.content);
		}

		this.trackSource('conversation', JSON.stringify(messages), `${messages.length} messages`);
		return tokens;
	}

	/**
	 * Track enabled tools
	 */
	trackTools(toolDefinitions: Record<string, unknown>): number {
		return this.trackSource('tools', JSON.stringify(toolDefinitions), `${Object.keys(toolDefinitions).length} tools`);
	}

	/**
	 * Track included files
	 */
	trackFiles(files: Map<string, string>): number {
		let tokens = 0;
		for (const [filePath, content] of files.entries()) {
			tokens += estimateTokens(content);
		}

		this.trackSource('files', JSON.stringify(Array.from(files.entries())), `${files.size} files`);
		return tokens;
	}

	/**
	 * Track MCP server contexts
	 */
	trackMCPContexts(servers: Map<string, unknown>): number {
		return this.trackSource('mcp_servers', JSON.stringify(Array.from(servers.entries())), `${servers.size} servers`);
	}

	/**
	 * Get context breakdown
	 */
	getBreakdown(): ContextBreakdown {
		const breakdown: ContextBreakdown['breakdown'] = {
			systemPrompt: 0,
			conversation: 0,
			tools: 0,
			files: 0,
			mcpServers: 0,
			other: 0,
		};

		let totalTokens = 0;

		for (const source of this.sources.values()) {
			totalTokens += source.tokens;

			// Categorize by source name
			if (source.name === 'system_prompt') {
				breakdown.systemPrompt = source.tokens;
			} else if (source.name === 'conversation') {
				breakdown.conversation = source.tokens;
			} else if (source.name === 'tools') {
				breakdown.tools = source.tokens;
			} else if (source.name === 'files') {
				breakdown.files = source.tokens;
			} else if (source.name === 'mcp_servers') {
				breakdown.mcpServers = source.tokens;
			} else {
				breakdown.other += source.tokens;
			}
		}

		// Calculate remaining tokens
		const remainingTokens = Math.max(0, this.maxTokens - totalTokens);
		const usedPercentage = (totalTokens / this.maxTokens) * 100;

		return {
			totalTokens,
			maxTokens: this.maxTokens,
			usedPercentage: Math.round(usedPercentage * 100) / 100,
			remainingTokens,
			breakdown,
			suggestions: generateSuggestions(usedPercentage, breakdown),
		};
	}

	/**
	 * Get all tracked sources
	 */
	getSources(): ContextSource[] {
		return Array.from(this.sources.values());
	}

	/**
	 * Clear all tracking
	 */
	clear(): void {
		this.sources.clear();
	}

	/**
	 * Remove a specific source
	 */
	removeSource(name: string): void {
		this.sources.delete(name);
	}

	/**
	 * Set model (affects max tokens)
	 */
	setModel(model: string): void {
		this.model = model;
		this.maxTokens = getMaxTokens(model);
	}
}

/**
 * Format context breakdown for display
 */
export function formatContextBreakdown(breakdown: ContextBreakdown): string {
	let output = '\n╔════════════════════════════════════════════════════════════════╗\n';
	output += '║                     CONTEXT BREAKDOWN                              ║\n';
	output += '╠════════════════════════════════════════════════════════════════╣\n';

	// Summary
	const percentage = (breakdown.usedPercentage * 100).toFixed(1);
	const statusColor = breakdown.usedPercentage > 75 ? '🔴' : breakdown.usedPercentage > 50 ? '🟡' : '🟢';

	output += `║ Total: ${breakdown.totalTokens.toLocaleString()} / ${breakdown.maxTokens.toLocaleString()} (${percentage}%) ${statusColor.padEnd(3)}  ║\n`;
	output += `║ Remaining: ${breakdown.remainingTokens.toLocaleString()} tokens                     ║\n`;
	output += '╠════════════════════════════════════════════════════════════════╣\n';
	output += '║ Breakdown:                                                            ║\n';

	// Breakdown items
	const b = breakdown.breakdown;
	const items = [
		{ label: 'System Prompt', tokens: b.systemPrompt, bar: 20 },
		{ label: 'Conversation', tokens: b.conversation, bar: 30 },
		{ label: 'Tools', tokens: b.tools, bar: 15 },
		{ label: 'Files', tokens: b.files, bar: 15 },
		{ label: 'MCP Servers', tokens: b.mcpServers, bar: 10 },
	];

	for (const item of items) {
		if (item.tokens > 0) {
			const percentage = (item.tokens / breakdown.totalTokens) * 100;
			const barLength = Math.round((item.tokens / breakdown.totalTokens) * item.bar);
			const bar = '█'.repeat(Math.min(barLength, item.bar)) + '░'.repeat(item.bar - Math.min(barLength, item.bar));

			output += `║   ${item.label.padEnd(15)} ${item.tokens.toLocaleString().padStart(8)} (${percentage.toFixed(1)}%) ${bar} ║\n`;
		}
	}

	if (b.other > 0) {
		output += `║   ${'Other'.padEnd(15)} ${b.other.toLocaleString().padStart(8)} (${((b.other / breakdown.totalTokens) * 100).toFixed(1)}%) ${'░'.repeat(10)} ║\n`;
	}

	output += '╠════════════════════════════════════════════════════════════════╣\n';
	output += '║ Suggestions:                                                           ║\n';

	for (const suggestion of breakdown.suggestions) {
		output += `║ ${suggestion.padEnd(67)}║\n`;
	}

	output += '╚════════════════════════════════════════════════════════════════╝\n';

	return output;
}

/**
 * Format compact context breakdown (single line)
 */
export function formatCompactBreakdown(breakdown: ContextBreakdown): string {
	const percentage = (breakdown.usedPercentage * 100).toFixed(1);
	return `Context: ${breakdown.totalTokens.toLocaleString()} / ${breakdown.maxTokens.toLocaleString()} (${percentage}%)`;
}

/**
 * Get context from current FLOYD session
 * This would be called from the main session state
 */
export async function getCurrentContext(
	projectPath?: string
): Promise<ContextBreakdown> {
	const tracker = new ContextTracker();

	// Try to read from session state file
	const statePath = projectPath
		? path.join(projectPath, '.floyd', 'session-state.json')
		: path.join(process.cwd(), '.floyd', 'session-state.json');

	try {
		const content = await fs.readFile(statePath, 'utf-8');
		const state = JSON.parse(content);

		// Track system prompt
		if (state.systemPrompt) {
			tracker.trackSource('system_prompt', state.systemPrompt, 'System prompt');
		}

		// Track conversation
		if (state.messages && Array.isArray(state.messages)) {
			tracker.trackConversation(state.messages);
		}

		// Track tools
		if (state.enabledTools) {
			tracker.trackTools(state.enabledTools);
		}

		// Track files
		if (state.openFiles) {
			const files = new Map(Object.entries(state.openFiles));
			tracker.trackFiles(files);
		}
	} catch {
		// State file doesn't exist or is invalid
		// Return empty breakdown
	}

	return tracker.getBreakdown();
}

/**
 * CLI command handler
 */
export async function handleContextCommand(
	verbose?: boolean
): Promise<{ success: boolean; breakdown?: ContextBreakdown; output?: string }> {
	try {
		const breakdown = await getCurrentContext();

		if (verbose) {
			// Show sources details
			const tracker = new ContextTracker();
			const sources = tracker.getSources();

			let output = formatContextBreakdown(breakdown);
			output += '\n╔════════════════════════════════════════════════════════════════╗\n';
			output += '║                     SOURCE DETAILS                                ║\n';
			output += '╠════════════════════════════════════════════════════════════════╣\n';

			for (const source of sources) {
				output += `║ ${source.name.padEnd(20)} ${source.tokens.toLocaleString().padStart(8)} tokens${(source.details ? ` (${source.details})` : '').padEnd(20)} ║\n`;
			}

			output += '╚════════════════════════════════════════════════════════════════╝\n';

			return {
				success: true,
				breakdown,
				output,
			};
		}

		return {
			success: true,
			breakdown,
			output: formatContextBreakdown(breakdown),
		};
	} catch (error) {
		return {
			success: false,
			output: `Error getting context: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * CLI command definition
 */
export const contextCommand = {
	description: 'Show context token usage breakdown',
	usage: '/context [verbose]',
	options: {
		'--verbose': 'Show detailed source information',
		'--json': 'Output as JSON',
	},
	examples: [
		'/context',
		'/context --verbose',
	],
	handler: handleContextCommand,
};

export { ContextTracker };
export default contextCommand;
