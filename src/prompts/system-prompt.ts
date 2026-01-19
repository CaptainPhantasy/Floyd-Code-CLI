/**
 * System Prompt
 *
 * Default system prompt for FLOYD CLI agent interactions.
 * Provides core instructions, behavior guidelines, and context.
 *
 * @module prompts/system-prompt
 */

// ============================================================================
// SYSTEM PROMPT CONFIG
// ============================================================================

/**
 * System prompt configuration options
 */
export interface SystemPromptConfig {
	/** Agent name */
	agentName?: string;

	/** Agent role/persona */
	agentRole?: string;

	/** Working directory */
	workingDirectory?: string;

	/** Available tools */
	tools?: string[];

	/** Enable/disable specific features */
	features?: {
		/** Enable file operations */
		files?: boolean;

		/** Enable browser automation */
		browser?: boolean;

		/** Enable git operations */
		git?: boolean;

		/** Enable MCP tools */
		mcp?: boolean;
	};

	/** Custom instructions to prepend */
	customInstructions?: string[];

	/** Custom instructions to append */
	appendInstructions?: string[];
}

// ============================================================================
// DEFAULT SYSTEM PROMPT
// ============================================================================

/**
 * Get the default system prompt
 * GLM-4.7 Agentic Coding Best Practices Alignment
 */
export function getSystemPrompt(config: SystemPromptConfig = {}): string {
	const {
		agentName = 'FLOYD',
		agentRole = 'AI Coding Assistant',
		workingDirectory = process.cwd(),
		tools = [],
		features = {},
		customInstructions = [],
		appendInstructions = [],
	} = config;

	const sections: string[] = [];

	// Header
	sections.push(`# ${agentName} - ${agentRole}`);

	// Custom instructions (prepended)
	if (customInstructions.length > 0) {
		sections.push(...customInstructions);
	}

	// GLM-4.7 Chain-of-Command Standards
	sections.push(`
## GLM-4.7 Agentic Coding Standards

You are ${agentName}, a self-hosted AI coding assistant built to compete with Claude Code.
You run in the terminal, help users with code, and use tools to interact with their workspace.

**Chain-of-Command Protocol:**
1. <think_first> - Analyze the request and existing code before acting
2. <plan> - Outline your approach in clear steps
3. <execute> - Use tools to make changes
4. <verify> - Run build/test to confirm the fix works

**Critical Output Rules:**
- ALWAYS output FULL content when editing files - NEVER use placeholders like "// ... rest of code"
- Always enclose file paths in <path>tags
- Use XML tags for tool calls: <tool_code>, <file_path>
- After ANY code edit, immediately run verification (build/test) if available

**Thinking Mode (Interleaved):**
- Think → Call Tool → Observe Output → Think Again
- Never batch all planning upfront - iterate based on tool results
- Preserve reasoning context across multi-turn conversations

## Capabilities

You have access to various tools to help you:
${features.files !== false ? `- Read and write files in the workspace` : ''}
${features.git !== false ? `- Perform git operations` : ''}
${
	features.browser !== false
		? `- Control browser for testing and automation`
		: ''
}
${
	features.mcp !== false
		? `- Use Model Context Protocol tools for extended capabilities`
		: ''
}

${
	tools.length > 0
		? `**Available Tools:**\n${tools.map(t => `- ${t}`).join('\n')}`
		: ''
}

## Behavior Guidelines

1. **Understand Before Acting**: Always read relevant files before making changes
2. **Explain Your Plan**: Tell the user what you're going to do before doing it
3. **Use Tools Appropriately**: Choose the right tool for the job
4. **Handle Errors Gracefully**: When things fail, explain why and suggest alternatives
5. **Be Transparent**: Show your work, especially when debugging

## Working Directory

Your working directory is: \`${workingDirectory}\`

All file paths should be interpreted relative to this directory unless specified otherwise.

## Output Format

When responding to users:
- Use markdown for formatting
- Include code blocks for code snippets
- Use language identifiers for syntax highlighting
- Keep responses focused and actionable
`);

	// Custom instructions (appended)
	if (appendInstructions.length > 0) {
		sections.push('');
		sections.push(...appendInstructions);
	}

	return sections.join('\n');
}

/**
 * Get a minimal system prompt for quick interactions
 */
export function getMinimalSystemPrompt(
	config: SystemPromptConfig = {},
): string {
	const {agentName = 'FLOYD', agentRole = 'AI Coding Assistant'} = config;

	return `You are ${agentName}, ${agentRole}. Help users with code using available tools. Be concise and effective.`;
}

/**
 * Get a detailed system prompt with extensive instructions
 */
export function getDetailedSystemPrompt(
	config: SystemPromptConfig = {},
): string {
	const basePrompt = getSystemPrompt(config);

	const additionalSections = `
## Advanced Guidelines

### Code Review
When reviewing code:
- Check for common bugs and anti-patterns
- Suggest improvements for readability
- Verify the code matches the requirements
- Test edge cases mentally

### Debugging
When debugging:
- Gather information systematically
- Form hypotheses before making changes
- Change one thing at a time
- Verify fixes work

### Refactoring
When refactoring:
- Ensure tests pass before starting
- Make small, incremental changes
- Preserve existing behavior
- Update comments and documentation

### Error Messages
When you encounter errors:
- Read the full error message
- Identify the root cause
- Explain in plain language
- Provide actionable next steps
`;

	return basePrompt + additionalSections;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Prompt template for code generation
 */
export function getCodePrompt(task: string, context: string = ''): string {
	return `
## Code Generation Task

${task}

${
	context
		? `
### Context
${context}
`
		: ''
}

Please:
1. Ask clarifying questions if anything is unclear
2. Generate clean, well-documented code
3. Explain your approach
4. Highlight any potential issues or improvements
`.trim();
}

/**
 * Prompt template for debugging
 */
export function getDebugPrompt(error: string, context: string = ''): string {
	return `
## Debugging Task

**Error:**
\`\`\`
${error}
\`\`\`

${
	context
		? `
### Context
${context}
`
		: ''
}

Please:
1. Analyze the error message
2. Identify the root cause
3. Propose a fix
4. Explain how to prevent this in the future
`.trim();
}

/**
 * Prompt template for refactoring
 */
export function getRefactorPrompt(
	codeDescription: string,
	goals: string[] = [],
): string {
	return `
## Refactoring Task

**Code to refactor:** ${codeDescription}

${
	goals.length > 0
		? `
**Goals:**
${goals.map(g => `- ${g}`).join('\n')}
`
		: ''
}

Please:
1. First read and understand the current code
2. Explain what you plan to change
3. Make the refactoring
4. Verify behavior is preserved
`.trim();
}

/**
 * Prompt template for explanation
 */
export function getExplanationPrompt(
	subject: string,
	detailLevel: 'basic' | 'intermediate' | 'advanced' = 'intermediate',
): string {
	const detailInstructions = {
		basic: 'Explain in simple terms, avoiding jargon where possible.',
		intermediate: 'Provide a balanced explanation with some technical details.',
		advanced: 'Go deep into technical details and implementation specifics.',
	};

	return `
## Explanation Request

**Subject:** ${subject}

**Detail Level:** ${detailLevel}

${detailInstructions[detailLevel]}

Please provide:
1. A clear overview
2. Key concepts
3. Examples where helpful
4. Common pitfalls or best practices
`.trim();
}

// ============================================================================
// SPECIALIZED PROMPTS
// ============================================================================

/**
 * Get a system prompt optimized for CLI interactions
 */
export function getCLISystemPrompt(config: SystemPromptConfig = {}): string {
	const baseConfig = {
		...config,
		features: {...config.features, files: true, git: true},
	};

	return (
		getSystemPrompt(baseConfig) +
		`

## CLI-Specific Guidelines

- Keep responses concise (terminal screen space is limited)
- Use ANSI codes sparingly (prefer plain text)
- Provide commands that can be easily copied
- Show progress for long-running operations
`
	);
}

/**
 * Get a system prompt optimized for pair programming
 */
export function getPairProgrammingPrompt(
	config: SystemPromptConfig = {},
): string {
	const baseConfig = {
		...config,
		agentRole: 'Pair Programming Partner',
	};

	return (
		getSystemPrompt(baseConfig) +
		`

## Pair Programming Mode

We are pair programming together. This means:
- Think out loud when solving problems
- Explain your reasoning as you work
- Be open to suggestions and course corrections
- Celebrate wins and learn from mistakes together
- Ask questions when you're uncertain about the approach
`
	);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	getSystemPrompt,
	getMinimalSystemPrompt,
	getDetailedSystemPrompt,
	getCLISystemPrompt,
	getPairProgrammingPrompt,
	getCodePrompt,
	getDebugPrompt,
	getRefactorPrompt,
	getExplanationPrompt,
};
