/**
 * Floyd Desktop Web - Prompt Registry
 *
 * Central registry for all available prompt styles.
 * Provides unified interface for style selection and prompt building.
 *
 * PHASE 1 ITEM 3: Desktop promptStyle UI Selector Infrastructure
 */
import { buildSuggestedSystemPrompt, SUGGESTED_SETTINGS } from './suggested-prompt.js';
import { buildFloyd47SystemPrompt, GLM47_SETTINGS } from './floyd47-prompt.js';
import { buildClaudeSystemPrompt, CLAUDE_SETTINGS } from './claude-prompt.js';
/**
 * Available prompt styles and their metadata
 */
export const PROMPT_STYLES = {
    suggested: {
        displayName: 'Suggested',
        description: 'Lean Core architecture - minimal tokens, fast execution',
        settings: SUGGESTED_SETTINGS,
        available: true,
    },
    floyd: {
        displayName: 'Floyd 4.7',
        description: 'GLM-4.7 optimized - god tier autonomy, THE ONENESS principle',
        settings: GLM47_SETTINGS,
        available: true,
    },
    claude: {
        displayName: 'Claude',
        description: 'Anthropic Claude aligned - structured thinking, verification-first',
        settings: CLAUDE_SETTINGS,
        available: true,
    },
    custom: {
        displayName: 'Custom',
        description: 'User-defined prompt template',
        settings: {},
        available: false, // Requires user configuration
    },
};
/**
 * Get available prompt styles list
 */
export function getAvailablePromptStyles() {
    return Object.entries(PROMPT_STYLES)
        .filter(([_, meta]) => meta.available)
        .map(([style]) => style);
}
/**
 * Get prompt style metadata
 */
export function getPromptStyleMetadata(style) {
    return PROMPT_STYLES[style];
}
/**
 * Build system prompt for specified style
 */
export function buildSystemPrompt(style, config = {}) {
    switch (style) {
        case 'suggested':
            return buildSuggestedSystemPrompt(config);
        case 'floyd':
            return buildFloyd47SystemPrompt(config);
        case 'claude':
            return buildClaudeSystemPrompt(config);
        case 'custom':
            // Custom prompts are user-defined - return placeholder
            return `# CUSTOM PROMPT\n\nCustom prompt style selected. Configure your template in settings.`;
        default:
            // Fallback to suggested
            return buildSuggestedSystemPrompt(config);
    }
}
/**
 * Get LLM settings for specified style
 */
export function getPromptSettings(style) {
    const meta = PROMPT_STYLES[style];
    return meta?.settings || {};
}
/**
 * Prompt registry exports
 */
export const PROMPT_REGISTRY = {
    styles: PROMPT_STYLES,
    build: buildSystemPrompt,
    getSettings: getPromptSettings,
    getAvailable: getAvailablePromptStyles,
    getMetadata: getPromptStyleMetadata,
};
