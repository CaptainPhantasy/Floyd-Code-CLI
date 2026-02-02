/**
 * Prompt Engine
 *
 * Dynamic prompt construction and rendering system.
 * Combines system prompts, examples, and tool templates.
 *
 * @module prompts/engine
 */

import {getSystemPrompt, SystemPromptConfig} from './system-prompt.js';
import {
	formatExamplesForPrompt,
	getRelevantExamples,
} from './few-shot-examples.js';
import {formatToolsForPrompt, getToolUseGuidelines} from './tool-templates.js';

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

/**
 * Prompt engine configuration
 */
export interface PromptEngineConfig {
	/** System prompt configuration */
	system?: SystemPromptConfig;

	/** Available tools */
	tools?: string[];

	/** Include few-shot examples */
	includeExamples?: boolean;

	/** Include tool templates */
	includeTools?: boolean;

	/** Include tool use guidelines */
	includeGuidelines?: boolean;

	/** Custom context to prepend */
	customContext?: string;

	/** Custom instructions to append */
	customInstructions?: string;
}

// ============================================================================
// PROMPT ENGINE
// ============================================================================

/**
 * PromptEngine - Dynamic prompt construction
 *
 * Builds complete prompts by combining system prompt,
 * tool templates, examples, and custom context.
 */
export class PromptEngine {
	private readonly config: PromptEngineConfig;

	constructor(config: PromptEngineConfig = {}) {
		this.config = {
			includeExamples: true,
			includeTools: true,
			includeGuidelines: true,
			...config,
		};
	}

	/**
	 * Build a complete prompt
	 */
	build(query: string, context: string = ''): string {
		const sections: string[] = [];

		// System prompt
		sections.push(getSystemPrompt(this.config.system));

		// Custom context
		if (this.config.customContext) {
			sections.push(this.config.customContext);
		}

		// Tool templates
		if (
			this.config.includeTools &&
			this.config.tools &&
			this.config.tools.length > 0
		) {
			// Import dynamically to avoid circular dependency
			const {getToolTemplate} = require('./tool-templates.js');
			const tools = this.config.tools
				.map(name => getToolTemplate(name))
				.filter(Boolean);

			if (tools.length > 0) {
				sections.push('## Available Tools\n');
				sections.push(formatToolsForPrompt(tools));
			}
		}

		// Tool guidelines
		if (this.config.includeGuidelines) {
			sections.push(getToolUseGuidelines());
		}

		// Few-shot examples
		if (this.config.includeExamples) {
			const relevantExamples = getRelevantExamples(query);
			if (relevantExamples.length > 0) {
				sections.push('## Examples\n');
				sections.push(formatExamplesForPrompt(relevantExamples));
			}
		}

		// User context
		if (context) {
			sections.push('## Context\n');
			sections.push(context);
		}

		// User query
		sections.push('## Task\n');
		sections.push(query);

		// Custom instructions
		if (this.config.customInstructions) {
			sections.push('\n## Additional Instructions\n');
			sections.push(this.config.customInstructions);
		}

		return sections.join('\n\n');
	}

	/**
	 * Build a minimal prompt (system + query only)
	 */
	buildMinimal(query: string): string {
		return `${getSystemPrompt({...this.config.system, agentName: undefined})}

${query}`;
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<PromptEngineConfig>): void {
		Object.assign(this.config, updates);
	}

	/**
	 * Get current configuration
	 */
	getConfig(): Readonly<PromptEngineConfig> {
		return {...this.config};
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new prompt engine
 */
export function createEngine(config: PromptEngineConfig = {}): PromptEngine {
	return new PromptEngine(config);
}

/**
 * Build a prompt quickly with default settings
 */
export function buildPrompt(
	query: string,
	context: string = '',
	config: PromptEngineConfig = {},
): string {
	const engine = new PromptEngine(config);
	return engine.build(query, context);
}

/**
 * Create a prompt for code generation
 */
export function createCodePrompt(
	task: string,
	codeContext: string = '',
	language?: string,
): string {
	const customContext = language
		? `Language: ${language}\n\n${codeContext}`
		: codeContext;

	return buildPrompt(task, customContext, {
		system: {
			customInstructions: [
				'When writing code:',
				'- Include proper error handling',
				'- Add helpful comments',
				"- Follow the language's best practices",
				'- Write tests when appropriate',
			],
		},
		includeExamples: true,
	});
}

/**
 * Create a prompt for debugging
 */
export function createDebugPrompt(error: string, context: string = ''): string {
	return buildPrompt(`Debug this error:\n\`\`\`\n${error}\n\`\`\``, context, {
		system: {
			agentRole: 'Debugging Assistant',
			customInstructions: [
				'When debugging:',
				'1. Analyze the error message thoroughly',
				'2. Identify the most likely root cause',
				'3. Propose a specific fix',
				'4. Explain how to verify the fix',
				'5. Suggest how to prevent similar errors',
			],
		},
	});
}

/**
 * Create a prompt for refactoring
 */
export function createRefactorPrompt(
	target: string,
	goals: string[],
	context: string = '',
): string {
	return buildPrompt(
		`Refactor: ${target}\n\nGoals:\n${goals.map(g => `- ${g}`).join('\n')}`,
		context,
		{
			system: {
				agentRole: 'Code Refactoring Specialist',
				customInstructions: [
					'When refactoring:',
					'1. Understand the current implementation',
					'2. Plan the refactoring to avoid breaking changes',
					'3. Make small, incremental changes',
					'4. Verify behavior is preserved',
					'5. Update related code and documentation',
				],
			},
		},
	);
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Pre-built prompt templates for common tasks
 */
export const promptTemplates = {
	/**
	 * General coding task prompt
	 */
	coding: (task: string) => buildPrompt(task),

	/**
	 * Explanation prompt
	 */
	explain: (subject: string) =>
		buildPrompt(`Explain: ${subject}`, '', {
			system: {
				agentRole: 'Technical Explainer',
				customInstructions: [
					'When explaining:',
					'- Start with a high-level overview',
					'- Provide concrete examples',
					'- Use analogies where helpful',
					'- Link to related concepts',
				],
			},
		}),

	/**
	 * Review prompt
	 */
	review: (code: string, filePath: string) =>
		buildPrompt(`Review the code in: ${filePath}`, code, {
			system: {
				agentRole: 'Code Reviewer',
				customInstructions: [
					'When reviewing code:',
					'- Check for bugs and anti-patterns',
					'- Assess readability and maintainability',
					'- Verify naming conventions',
					'- Suggest improvements',
					"- Highlight what's done well",
				],
			},
		}),
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	PromptEngine,
	createEngine,
	buildPrompt,
	createCodePrompt,
	createDebugPrompt,
	createRefactorPrompt,
	promptTemplates,
};
