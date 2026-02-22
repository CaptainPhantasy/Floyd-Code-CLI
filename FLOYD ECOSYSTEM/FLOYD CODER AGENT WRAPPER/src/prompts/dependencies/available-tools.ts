/**
 * Available Tools Registry
 *
 * Central source of truth for all available tools in Floyd CLI.
 * Expanded to full 50-tool parity with floyd-wrapper.
 *
 * Tool Categories:
 * - Core File Operations (7 tools)
 * - Git Workflow (9 tools)
 * - Search & Exploration (2 tools)
 * - SUPERCACHE 3-Tier Memory (12 tools)
 * - System Operations (3 tools)
 * - Browser Automation (9 tools)
 * - Patch Operations (5 tools)
 * - Special Operations (3 tools)
 *
 * @module config/available-tools
 */

export interface ToolDefinition {
	/** Tool name/identifier */
	name: string;

	/** Display name for UI */
	displayName: string;

	/** Description of what the tool does */
	description: string;

	/** Icon for UI display */
	icon?: string;

	/** Default enabled state */
	defaultEnabled: boolean;

	/** Tool category for organization */
	category: 'file' | 'code' | 'search' | 'build' | 'git' | 'cache' | 'browser' | 'terminal' | 'patch' | 'special';

	/** Permission level: none=auto-approve, moderate=prompt user, dangerous=warn+confirm */
	permission?: 'none' | 'moderate' | 'dangerous';
}

/**
 * Complete list of all available tools (50 tools for floyd-wrapper parity)
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
	// =========================================================================
	// CORE FILE OPERATIONS (7 tools) - #1-7
	// =========================================================================
	{
		name: 'read_file',
		displayName: 'Read File',
		description: 'Read file contents from disk (uses file_path parameter)',
		icon: '[F]',
		defaultEnabled: true,
		category: 'file',
		permission: 'none',
	},
	{
		name: 'write',
		displayName: 'Write File',
		description: 'Write or create files (full content replacement)',
		icon: '[W]',
		defaultEnabled: true,
		category: 'file',
		permission: 'moderate',
	},
	{
		name: 'edit_file',
		displayName: 'Edit File',
		description: 'Edit specific file sections with search/replace',
		icon: '[E]',
		defaultEnabled: true,
		category: 'file',
		permission: 'moderate',
	},
	{
		name: 'search_replace',
		displayName: 'Search & Replace',
		description: 'Search and replace text across files',
		icon: '[R]',
		defaultEnabled: true,
		category: 'file',
		permission: 'moderate',
	},
	{
		name: 'list_directory',
		displayName: 'List Directory',
		description: 'List files and directories in a path',
		icon: '[D]',
		defaultEnabled: true,
		category: 'file',
		permission: 'none',
	},
	{
		name: 'move_file',
		displayName: 'Move File',
		description: 'Move or rename files and directories',
		icon: '[M]',
		defaultEnabled: true,
		category: 'file',
		permission: 'moderate',
	},
	{
		name: 'delete_file',
		displayName: 'Delete File',
		description: 'Delete files (dangerous - use with caution)',
		icon: '[X]',
		defaultEnabled: true,
		category: 'file',
		permission: 'dangerous',
	},

	// =========================================================================
	// GIT WORKFLOW (9 tools) - #8-16
	// =========================================================================
	{
		name: 'git_status',
		displayName: 'Git Status',
		description: 'Show working tree status (USE FIRST before git ops)',
		icon: '[S]',
		defaultEnabled: true,
		category: 'git',
		permission: 'none',
	},
	{
		name: 'git_add',
		displayName: 'Git Add',
		description: 'Stage files for commit',
		icon: '[+]',
		defaultEnabled: true,
		category: 'git',
		permission: 'moderate',
	},
	{
		name: 'git_commit',
		displayName: 'Git Commit',
		description: 'Commit staged changes with message',
		icon: '[C]',
		defaultEnabled: true,
		category: 'git',
		permission: 'moderate',
	},
	{
		name: 'git_diff',
		displayName: 'Git Diff',
		description: 'Show differences between commits/files',
		icon: '[D]',
		defaultEnabled: true,
		category: 'git',
		permission: 'none',
	},
	{
		name: 'git_log',
		displayName: 'Git Log',
		description: 'Show commit history',
		icon: '[L]',
		defaultEnabled: true,
		category: 'git',
		permission: 'none',
	},
	{
		name: 'git_branch',
		displayName: 'Git Branch',
		description: 'List, create, or delete branches',
		icon: '[B]',
		defaultEnabled: true,
		category: 'git',
		permission: 'moderate',
	},
	{
		name: 'git_checkout',
		displayName: 'Git Checkout',
		description: 'Switch branches or restore files',
		icon: '[K]',
		defaultEnabled: true,
		category: 'git',
		permission: 'moderate',
	},
	{
		name: 'git_stash',
		displayName: 'Git Stash',
		description: 'Stash and restore uncommitted changes',
		icon: '[T]',
		defaultEnabled: true,
		category: 'git',
		permission: 'moderate',
	},
	{
		name: 'git_merge',
		displayName: 'Git Merge',
		description: 'Merge branches together',
		icon: '[G]',
		defaultEnabled: true,
		category: 'git',
		permission: 'dangerous',
	},

	// =========================================================================
	// SEARCH & EXPLORATION (2 tools) - #17-18
	// =========================================================================
	{
		name: 'grep',
		displayName: 'Grep',
		description: 'Exact pattern matching with regex support',
		icon: '[S]',
		defaultEnabled: true,
		category: 'search',
		permission: 'none',
	},
	{
		name: 'codebase_search',
		displayName: 'Codebase Search',
		description: 'Semantic search across entire codebase',
		icon: '[Q]',
		defaultEnabled: true,
		category: 'search',
		permission: 'none',
	},

	// =========================================================================
	// SUPERCACHE - 3-TIER INTELLIGENT MEMORY (12 tools) - #19-30
	// =========================================================================
	{
		name: 'cache_store',
		displayName: 'Cache Store',
		description: 'Store data in cache (project/reasoning/vault tier)',
		icon: '[>]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_retrieve',
		displayName: 'Cache Retrieve',
		description: 'Retrieve data from cache by key',
		icon: '[<]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_delete',
		displayName: 'Cache Delete',
		description: 'Delete specific cache entry',
		icon: '[X]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'moderate',
	},
	{
		name: 'cache_clear',
		displayName: 'Cache Clear',
		description: 'Clear all entries in a cache tier',
		icon: '[C]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'dangerous',
	},
	{
		name: 'cache_list',
		displayName: 'Cache List',
		description: 'List all keys in a cache tier',
		icon: '[L]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_search',
		displayName: 'Cache Search',
		description: 'Search cache by pattern or semantic query',
		icon: '[?]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_stats',
		displayName: 'Cache Stats',
		description: 'Get cache statistics (hits, misses, size)',
		icon: '[#]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_prune',
		displayName: 'Cache Prune',
		description: 'Remove expired or old cache entries',
		icon: '[P]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'moderate',
	},
	{
		name: 'cache_store_pattern',
		displayName: 'Store Pattern',
		description: 'Store a reusable code/solution pattern',
		icon: '[*]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_store_reasoning',
		displayName: 'Store Reasoning',
		description: 'Persist reasoning chain for future sessions',
		icon: '[R]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_load_reasoning',
		displayName: 'Load Reasoning',
		description: 'Load previous reasoning chain',
		icon: '[^]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'none',
	},
	{
		name: 'cache_archive_reasoning',
		displayName: 'Archive Reasoning',
		description: 'Archive reasoning to vault tier',
		icon: '[A]',
		defaultEnabled: true,
		category: 'cache',
		permission: 'moderate',
	},

	// =========================================================================
	// SYSTEM OPERATIONS (3 tools) - #31-33
	// =========================================================================
	{
		name: 'run',
		displayName: 'Run Command',
		description: 'Execute shell commands (uses command parameter)',
		icon: '[>]',
		defaultEnabled: true,
		category: 'build',
		permission: 'moderate',
	},
	{
		name: 'ask_user',
		displayName: 'Ask User',
		description: 'Prompt user for input or confirmation',
		icon: '[?]',
		defaultEnabled: true,
		category: 'terminal',
		permission: 'none',
	},
	{
		name: 'fetch',
		displayName: 'Fetch URL',
		description: 'HTTP request to fetch remote content',
		icon: '[U]',
		defaultEnabled: true,
		category: 'terminal',
		permission: 'moderate',
	},

	// =========================================================================
	// BROWSER AUTOMATION (9 tools) - #34-42
	// =========================================================================
	{
		name: 'browser_status',
		displayName: 'Browser Status',
		description: 'Check browser connection (MUST USE FIRST)',
		icon: '[.]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'none',
	},
	{
		name: 'browser_navigate',
		displayName: 'Browser Navigate',
		description: 'Navigate to a URL in the browser',
		icon: '[N]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'moderate',
	},
	{
		name: 'browser_read_page',
		displayName: 'Browser Read Page',
		description: 'Read current page content and DOM',
		icon: '[R]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'none',
	},
	{
		name: 'browser_screenshot',
		displayName: 'Browser Screenshot',
		description: 'Take a screenshot of current page',
		icon: '[S]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'none',
	},
	{
		name: 'browser_click',
		displayName: 'Browser Click',
		description: 'Click an element on the page',
		icon: '[C]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'moderate',
	},
	{
		name: 'browser_type',
		displayName: 'Browser Type',
		description: 'Type text into an input field',
		icon: '[T]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'moderate',
	},
	{
		name: 'browser_find',
		displayName: 'Browser Find',
		description: 'Find elements by CSS selector or XPath',
		icon: '[F]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'none',
	},
	{
		name: 'browser_get_tabs',
		displayName: 'Browser Get Tabs',
		description: 'List all open browser tabs',
		icon: '[G]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'none',
	},
	{
		name: 'browser_create_tab',
		displayName: 'Browser Create Tab',
		description: 'Open a new browser tab',
		icon: '[+]',
		defaultEnabled: false,
		category: 'browser',
		permission: 'moderate',
	},

	// =========================================================================
	// PATCH OPERATIONS (5 tools) - #43-47
	// =========================================================================
	{
		name: 'apply_unified_diff',
		displayName: 'Apply Unified Diff',
		description: 'Apply unified diffs (SAFEST for multi-file changes)',
		icon: '[P]',
		defaultEnabled: true,
		category: 'patch',
		permission: 'moderate',
	},
	{
		name: 'edit_range',
		displayName: 'Edit Range',
		description: 'Edit a specific line range in a file',
		icon: '[E]',
		defaultEnabled: true,
		category: 'patch',
		permission: 'moderate',
	},
	{
		name: 'insert_at',
		displayName: 'Insert At',
		description: 'Insert content at a specific line',
		icon: '[I]',
		defaultEnabled: true,
		category: 'patch',
		permission: 'moderate',
	},
	{
		name: 'delete_range',
		displayName: 'Delete Range',
		description: 'Delete a range of lines from a file',
		icon: '[X]',
		defaultEnabled: true,
		category: 'patch',
		permission: 'dangerous',
	},
	{
		name: 'assess_patch_risk',
		displayName: 'Assess Patch Risk',
		description: 'Analyze risk before applying patch',
		icon: '[!]',
		defaultEnabled: true,
		category: 'patch',
		permission: 'none',
	},

	// =========================================================================
	// SPECIAL OPERATIONS (3 tools) - #48-50
	// =========================================================================
	{
		name: 'verify',
		displayName: 'Verify',
		description: 'Explicit verification tool - confirm changes work',
		icon: '[OK]',
		defaultEnabled: true,
		category: 'special',
		permission: 'none',
	},
	{
		name: 'safe_refactor',
		displayName: 'Safe Refactor',
		description: 'Refactor with automatic rollback on failure',
		icon: '[*]',
		defaultEnabled: true,
		category: 'special',
		permission: 'moderate',
	},
	{
		name: 'impact_simulate',
		displayName: 'Impact Simulate',
		description: 'Simulate impact of changes before applying',
		icon: '[~]',
		defaultEnabled: true,
		category: 'special',
		permission: 'none',
	},
];

/**
 * Get tool definition by name
 */
export function getTool(name: string): ToolDefinition | undefined {
	return AVAILABLE_TOOLS.find(t => t.name === name);
}

/**
 * Get all enabled tools
 */
export function getEnabledTools(): ToolDefinition[] {
	return AVAILABLE_TOOLS.filter(t => t.defaultEnabled);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
	return AVAILABLE_TOOLS.filter(t => t.category === category);
}

/**
 * Get tool categories
 */
export function getToolCategories(): ToolDefinition['category'][] {
	return [...new Set(AVAILABLE_TOOLS.map(t => t.category))];
}

/**
 * Get default tool toggle states
 */
export function getDefaultToolStates(): Array<{name: string; enabled: boolean; icon?: string}> {
	return AVAILABLE_TOOLS.map(t => ({
		name: t.displayName,
		enabled: t.defaultEnabled,
		icon: t.icon,
	}));
}

/**
 * Get tool display name
 */
export function getToolDisplayName(name: string): string {
	const tool = getTool(name);
	return tool?.displayName || name;
}

/**
 * Get tools count by category
 */
export function getToolCountByCategory(): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const tool of AVAILABLE_TOOLS) {
		counts[tool.category] = (counts[tool.category] || 0) + 1;
	}
	return counts;
}

/**
 * Get total tool count
 */
export function getTotalToolCount(): number {
	return AVAILABLE_TOOLS.length;
}

/**
 * Get tool statistics
 */
export function getToolStats(): {
	total: number;
	enabled: number;
	disabled: number;
	byCategory: Record<string, number>;
	byPermission: Record<string, number>;
} {
	const byCategory: Record<string, number> = {};
	const byPermission: Record<string, number> = {};

	for (const tool of AVAILABLE_TOOLS) {
		byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
		const perm = tool.permission || 'moderate';
		byPermission[perm] = (byPermission[perm] || 0) + 1;
	}

	return {
		total: AVAILABLE_TOOLS.length,
		enabled: AVAILABLE_TOOLS.filter(t => t.defaultEnabled).length,
		disabled: AVAILABLE_TOOLS.filter(t => !t.defaultEnabled).length,
		byCategory,
		byPermission,
	};
}
