/**
 * Tool Capabilities Generator
 *
 * Generates dynamic tool capabilities from AVAILABLE_TOOLS
 * Replaces hardcoded tool descriptions in system prompts
 *
 * PHASE 1 ITEM 1: Dynamic Prompt Generation
 */

import { AVAILABLE_TOOLS, type ToolDefinition } from './available-tools.js';

export interface ToolCapabilitiesOptions {
	/** Include permission badges in output */
	includePermissions?: boolean;
	/** Group by category */
	groupByCategory?: boolean;
	/** Include tool count summary */
	includeSummary?: boolean;
	/** Permission badge style */
	permissionStyle?: 'emoji' | 'text' | 'both';
	/** Permission mode context */
	mode?: 'yolo' | 'ask' | 'plan' | 'auto' | 'dialogue' | 'fuckit';
}

/**
 * Generate permission badge for a tool
 */
function getPermissionBadge(tool: ToolDefinition, style: 'emoji' | 'text' | 'both' = 'both'): string {
	const perm = tool.permission || 'moderate';

	if (style === 'emoji') {
		switch (perm) {
			case 'none': return '';
			case 'moderate': return ' 🟡';
			case 'dangerous': return ' 🔴';
		}
	}
	if (style === 'text') {
		switch (perm) {
			case 'none': return '';
			case 'moderate': return ' [MODERATE]';
			case 'dangerous': return '[DANGEROUS]';
		}
	}
	// both
	switch (perm) {
		case 'none': return '';
		case 'moderate': return ' 🟡 [MODERATE]';
		case 'dangerous': return ' 🔴 [DANGEROUS]';
	}
	return '';
}

/**
 * Generate tool capabilities section for system prompt
 */
export function generateToolCapabilities(options: ToolCapabilitiesOptions = {}): string {
	const {
		includePermissions = true,
		groupByCategory = true,
		includeSummary = true,
		permissionStyle = 'both',
		mode = 'ask',
	} = options;

	const categories = getToolsByCategory();
	let output = '';

	// Summary section
	if (includeSummary) {
		const stats = getToolStats();
		output += `## Tool Capabilities (${stats.total} Tools)\n\n`;
		output += `**Permission Mode: ${mode.toUpperCase()}**\n\n`;

		if (mode === 'yolo') {
			output += `> ⚠️ **YOLO MODE ACTIVE**: Tools with 'none' and 'moderate' permissions are auto-approved. Only 'dangerous' tools require confirmation.\n\n`;
		} else if (mode === 'plan') {
			output += `> 🛡️ **PLAN MODE ACTIVE**: Read-only mode. All write/destructive operations are DISABLED.\n\n`;
		} else if (mode === 'ask') {
			output += `> 🔒 **ASK MODE ACTIVE**: Standard safety. Write/destructive operations require explicit confirmation.\n\n`;
		} else if (mode === 'fuckit') {
			output += `> ☢️ **FUCKIT MODE ACTIVE**: MAXIMUM AUTONOMY. ALL TOOLS AUTO-APPROVED. PROCEED WITH EXTREME CAUTION.\n\n`;
		}

		output += `**Total Tools:** ${stats.total}\n`;
		output += `**Enabled:** ${stats.enabled}\n`;
		output += `**Disabled:** ${stats.disabled}\n\n`;
	} else {
		output += `## Tool Capabilities (Mode: ${mode.toUpperCase()})\n\n`;
	}

	// Grouped by category
	if (groupByCategory) {
		for (const [category, tools] of Object.entries(categories)) {
			const categoryName = category.toUpperCase();
			const perm = includePermissions ? getPermissionBadge(tools[0], permissionStyle) : '';
			output += `### ${categoryName} (${tools.length} tools)${perm}\n\n`;

			for (const tool of tools) {
				const badge = includePermissions ? getPermissionBadge(tool, permissionStyle) : '';
				const enabled = tool.defaultEnabled ? '' : ' *(disabled)*';
				output += `- **${tool.name}**${badge}: ${tool.description}${enabled}\n`;
			}
			output += '\n';
		}
	} else {
		// Flat list
		for (const tool of AVAILABLE_TOOLS) {
			const badge = includePermissions ? getPermissionBadge(tool, permissionStyle) : '';
			const enabled = tool.defaultEnabled ? '' : ' *(disabled)*';
			output += `- **${tool.name}**${badge}: ${tool.description}${enabled}\n`;
		}
		output += '\n';
	}

	return output;
}

/**
 * Get tools by category
 */
export function getToolsByCategory(): Record<string, ToolDefinition[]> {
	const categories: Record<string, ToolDefinition[]> = {};

	for (const tool of AVAILABLE_TOOLS) {
		if (!categories[tool.category]) {
			categories[tool.category] = [];
		}
		categories[tool.category].push(tool);
	}

	return categories;
}

/**
 * Get tool statistics
 */
export function getToolStats() {
	const total = AVAILABLE_TOOLS.length;
	const enabled = AVAILABLE_TOOLS.filter(t => t.defaultEnabled).length;
	const disabled = total - enabled;

	const byCategory: Record<string, number> = {};
	const byPermission: Record<string, number> = {};

	for (const tool of AVAILABLE_TOOLS) {
		byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
		const perm = tool.permission || 'moderate';
		byPermission[perm] = (byPermission[perm] || 0) + 1;
	}

	return {
		total,
		enabled,
		disabled,
		byCategory,
		byPermission,
	};
}

/**
 * Get tool description in YOLO mode context
 */
export function getToolCapabilityDescription(toolName: string, mode: 'yolo' | 'ask' | 'plan' | 'auto' | 'dialogue' | 'fuckit' = 'ask'): string {
	const tool = AVAILABLE_TOOLS.find(t => t.name === toolName);
	if (!tool) return `${toolName} (unknown tool)`;

	const perm = tool.permission || 'moderate';
	const modeBehavior = getModePermissionBehavior(mode, perm);

	return `${tool.name}: ${tool.description} (${perm.toUpperCase()}) - ${modeBehavior}`;
}

/**
 * Get permission behavior for a mode
 */
function getModePermissionBehavior(mode: string, permission: string): string {
	const modeUpper = mode.toUpperCase();
	const permUpper = permission.toUpperCase();

	switch (modeUpper) {
		case 'YOLO':
			if (permUpper === 'NONE') return 'Auto-approved';
			if (permUpper === 'MODERATE') return 'Auto-approved';
			if (permUpper === 'DANGEROUS') return 'Requires confirmation';
			return 'Auto-approved';
		case 'FUCKIT':
			return 'ALWAYS APPROVED - No restrictions';
		case 'PLAN':
			if (permUpper === 'NONE') return 'Allowed (read-only)';
			if (permUpper === 'MODERATE') return 'DENIED (write disabled)';
			if (permUpper === 'DANGEROUS') return 'DENIED (write disabled)';
			return 'Allowed for read operations';
		case 'ASK':
		default:
			if (permUpper === 'NONE') return 'Auto-approved';
			return 'Requires confirmation';
	}
}

/**
 * Re-export for convenience
 */
export { AVAILABLE_TOOLS } from './available-tools.js';
