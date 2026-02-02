/**
 * Prompts Module
 *
 * System prompts and tool capabilities generation
 *
 * PHASE 1 ITEM 1: Dynamic Prompt Generation
 */

// Re-export tool capabilities (includes AVAILABLE_TOOLS and helpers from available-tools)
export * from './tool-capabilities.js';

// Re-export unique items from available-tools (not already exported by tool-capabilities)
export type { ToolDefinition } from './available-tools.js';
export {
	getTool,
	getEnabledTools,
	getToolDisplayName,
	getToolCategories,
	getToolCountByCategory,
	getTotalToolCount,
} from './available-tools.js';
