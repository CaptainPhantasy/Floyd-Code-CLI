/**
 * Tool Templates
 *
 * Templates for constructing tool calls and formatting tool results.
 * Provides consistent patterns for tool usage in prompts.
 *
 * @module prompts/tool-templates
 */

// ============================================================================
// TOOL CALL TEMPLATES
// ============================================================================

/**
 * Tool call template
 */
export interface ToolCallTemplate {
	/** Tool name */
	name: string;

	/** Description of what the tool does */
	description: string;

	/** Parameter schema */
	parameters: ToolParameter[];

	/** Example usage */
	examples: ToolCallExample[];

	/** Return value description */
	returns: string;
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
	/** Parameter name */
	name: string;

	/** Parameter type */
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';

	/** Whether parameter is required */
	required: boolean;

	/** Parameter description */
	description: string;

	/** Default value (optional) */
	default?: unknown;
}

/**
 * Tool call example
 */
export interface ToolCallExample {
	/** Example description */
	description: string;

	/** Example arguments */
	args: Record<string, unknown>;

	/** Expected result */
	result?: unknown;
}

// ============================================================================
// BUILT-IN TOOL TEMPLATES
// ============================================================================

/**
 * File read tool template
 */
export const readFileTool: ToolCallTemplate = {
	name: 'read_file',
	description: 'Read the contents of a file from the filesystem',
	parameters: [
		{
			name: 'path',
			type: 'string',
			required: true,
			description: 'Absolute or relative path to the file',
		},
		{
			name: 'encoding',
			type: 'string',
			required: false,
			description: 'File encoding (default: utf-8)',
			default: 'utf-8',
		},
	],
	examples: [
		{
			description: 'Read a TypeScript file',
			args: {path: 'src/index.ts'},
			result: 'import { express } from "express";\n\nconst app = express();',
		},
		{
			description: 'Read a configuration file',
			args: {path: './config.json'},
			result: '{"port": 3000, "host": "localhost"}',
		},
	],
	returns: 'The file contents as a string',
};

/**
 * File write tool template
 */
export const writeFileTool: ToolCallTemplate = {
	name: 'write_file',
	description: 'Write contents to a file, creating it if it does not exist',
	parameters: [
		{
			name: 'path',
			type: 'string',
			required: true,
			description: 'Absolute or relative path to the file',
		},
		{
			name: 'content',
			type: 'string',
			required: true,
			description: 'Content to write to the file',
		},
	],
	examples: [
		{
			description: 'Create a new utility file',
			args: {
				path: 'src/utils/helpers.ts',
				content:
					'export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}',
			},
		},
	],
	returns: 'Confirmation that the file was written',
};

/**
 * File search tool template
 */
export const searchFilesTool: ToolCallTemplate = {
	name: 'search_files',
	description: 'Search for files matching a pattern in the filesystem',
	parameters: [
		{
			name: 'pattern',
			type: 'string',
			required: true,
			description: 'Glob pattern for file matching (e.g., "**/*.ts")',
		},
		{
			name: 'path',
			type: 'string',
			required: false,
			description: 'Directory to search in (default: current directory)',
		},
	],
	examples: [
		{
			description: 'Find all TypeScript files',
			args: {pattern: '**/*.ts'},
			result: ['src/index.ts', 'src/utils/helpers.ts', 'src/app.ts'],
		},
		{
			description: 'Find test files',
			args: {pattern: '**/*.test.ts'},
			result: ['src/index.test.ts', 'src/app.test.ts'],
		},
	],
	returns: 'Array of matching file paths',
};

/**
 * File edit tool template
 */
export const editFileTool: ToolCallTemplate = {
	name: 'edit_file',
	description: 'Replace a portion of a file with new content',
	parameters: [
		{
			name: 'path',
			type: 'string',
			required: true,
			description: 'Path to the file to edit',
		},
		{
			name: 'oldText',
			type: 'string',
			required: true,
			description: 'Text to replace (must match exactly)',
		},
		{
			name: 'newText',
			type: 'string',
			required: true,
			description: 'Replacement text',
		},
	],
	examples: [
		{
			description: 'Update a function signature',
			args: {
				path: 'src/utils/helpers.ts',
				oldText: 'function greet(name: string): string {',
				newText: 'function greet(name: string, enthusiastic = false): string {',
			},
		},
	],
	returns: 'Confirmation that the file was edited',
};

/**
 * Command execution tool template
 */
export const executeCommandTool: ToolCallTemplate = {
	name: 'execute_command',
	description: 'Execute a shell command and return the output',
	parameters: [
		{
			name: 'command',
			type: 'string',
			required: true,
			description: 'Shell command to execute',
		},
		{
			name: 'cwd',
			type: 'string',
			required: false,
			description: 'Working directory for the command',
		},
	],
	examples: [
		{
			description: 'List files in current directory',
			args: {command: 'ls -la'},
			result: 'total 24\ndrwxr-xr-x  4 user  staff   128 Jan 1 12:00 .',
		},
		{
			description: 'Run tests',
			args: {command: 'npm test'},
			result: 'PASS src/utils.test.ts\nPASS src/app.test.ts',
		},
	],
	returns: 'Command stdout and stderr output',
};

/**
 * Git status tool template
 */
export const gitStatusTool: ToolCallTemplate = {
	name: 'git_status',
	description: 'Get the current git repository status',
	parameters: [],
	examples: [
		{
			description: 'Check git status',
			args: {},
			result: {
				branch: 'main',
				modified: ['src/index.ts'],
				untracked: ['new-file.ts'],
			},
		},
	],
	returns:
		'Git status information including branch, modified files, and untracked files',
};

/**
 * Git diff tool template
 */
export const gitDiffTool: ToolCallTemplate = {
	name: 'git_diff',
	description: 'Show git diff for changes',
	parameters: [
		{
			name: 'file',
			type: 'string',
			required: false,
			description: 'Specific file to diff (optional)',
		},
		{
			name: 'staged',
			type: 'boolean',
			required: false,
			description: 'Show staged changes instead of working directory',
		},
	],
	examples: [
		{
			description: 'Show all changes',
			args: {},
			result: 'diff --git a/src/index.ts b/src/index.ts\n@@ -1,3 +1,4 @@',
		},
	],
	returns: 'Git diff output',
};

/**
 * Browser navigation tool template
 */
export const browserNavigateTool: ToolCallTemplate = {
	name: 'browser_navigate',
	description: 'Navigate to a URL in the browser',
	parameters: [
		{
			name: 'url',
			type: 'string',
			required: true,
			description: 'URL to navigate to',
		},
	],
	examples: [
		{
			description: 'Open a webpage',
			args: {url: 'https://example.com'},
			result: {success: true, title: 'Example Domain'},
		},
	],
	returns: 'Navigation result with page title and URL',
};

/**
 * Browser screenshot tool template
 */
export const browserScreenshotTool: ToolCallTemplate = {
	name: 'browser_screenshot',
	description: 'Take a screenshot of the current browser page',
	parameters: [
		{
			name: 'path',
			type: 'string',
			required: false,
			description: 'Path to save the screenshot',
		},
	],
	examples: [
		{
			description: 'Capture page screenshot',
			args: {path: 'screenshots/page.png'},
			result: {success: true, path: 'screenshots/page.png'},
		},
	],
	returns: 'Screenshot file path and metadata',
};

// ============================================================================
// TOOL REGISTRY
// ============================================================================

/**
 * All available tool templates
 */
export const toolRegistry: ToolCallTemplate[] = [
	readFileTool,
	writeFileTool,
	searchFilesTool,
	editFileTool,
	executeCommandTool,
	gitStatusTool,
	gitDiffTool,
	browserNavigateTool,
	browserScreenshotTool,
];

/**
 * Get tool template by name
 */
export function getToolTemplate(name: string): ToolCallTemplate | undefined {
	return toolRegistry.find(tool => tool.name === name);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolCallTemplate[] {
	const categories: Record<ToolCategory, string[]> = {
		file: ['read_file', 'write_file', 'search_files', 'edit_file'],
		command: ['execute_command'],
		git: ['git_status', 'git_diff'],
		browser: ['browser_navigate', 'browser_screenshot'],
	};

	const names = categories[category] || [];
	return toolRegistry.filter(tool => names.includes(tool.name));
}

/**
 * Tool categories
 */
export type ToolCategory = 'file' | 'command' | 'git' | 'browser';

// ============================================================================
// PROMPT FORMATTING
// ============================================================================

/**
 * Format tool templates for inclusion in a system prompt
 */
export function formatToolsForPrompt(tools: ToolCallTemplate[]): string {
	const sections: string[] = [];

	for (const tool of tools) {
		const params = tool.parameters
			.map(p => {
				const optional = p.required ? '' : ' (optional)';
				const defaultVal =
					p.default !== undefined
						? `, default: ${JSON.stringify(p.default)}`
						: '';
				return `- \`${p.name}\`${optional}: ${p.description}${defaultVal}`;
			})
			.join('\n    ');

		sections.push(`
**${tool.name}**
${tool.description}

Parameters:
    ${params}

Returns: ${tool.returns}
`);
	}

	return sections.join('\n');
}

/**
 * Format a tool call for display
 */
export function formatToolCall(
	toolName: string,
	args: Record<string, unknown>,
): string {
	const argsStr = Object.entries(args)
		.map(([k, v]) => `${k}=${JSON.stringify(v)}`)
		.join(', ');
	return `${toolName}(${argsStr})`;
}

/**
 * Format tool results for display
 */
export function formatToolResult(result: unknown): string {
	if (typeof result === 'string') {
		return result;
	}
	if (result === null || result === undefined) {
		return 'No result';
	}
	return JSON.stringify(result, null, 2);
}

// ============================================================================
// FEW-SHOT TOOL EXAMPLES
// ============================================================================

/**
 * Generate few-shot examples for tool usage
 */
export function generateToolExamples(): string {
	return `
## Tool Usage Examples

**Example 1: Reading and editing a file**
User: "Update the version in package.json"
Assistant: "I'll read the package.json file first to see the current version."
\`\`\`typescript
tool: read_file
args: {path: "package.json"}
\`\`\`
[reads file]
Assistant: "I can see the version is 1.0.0. I'll update it to 1.0.1."
\`\`\`typescript
tool: edit_file
args: {
  path: "package.json",
  oldText: '"version": "1.0.0"',
  newText: '"version": "1.0.1"'
}
\`\`\`

**Example 2: Finding and fixing a bug**
User: "There's a bug in the user service"
Assistant: "Let me search for the user service file and examine it."
\`\`\`typescript
tool: search_files
args: {pattern: "**/user*.ts"}
\`\`\`
[finds files]
\`\`\`typescript
tool: read_file
args: {path: "src/services/userService.ts"}
\`\`\`
[reads and identifies bug]
Assistant: "Found the issue on line 42. The function doesn't handle null responses. I'll fix it."
\`\`\`typescript
tool: edit_file
args: {
  path: "src/services/userService.ts",
  oldText: "return response.data;",
  newText: "return response.data ?? null;"
}
\`\`\`

**Example 3: Running tests**
User: "Run the test suite"
Assistant: "I'll run the tests using npm."
\`\`\`typescript
tool: execute_command
args: {command: "npm test"}
\`\`\`
[checks results]
Assistant: "All tests passed! 15/15 tests successful."
`.trim();
}

// ============================================================================
// TOOL USE GUIDELINES
// ============================================================================

/**
 * Get tool use guidelines for the system prompt
 */
export function getToolUseGuidelines(): string {
	return `
## Tool Usage Guidelines

1. **Read before writing**: Always read a file before editing it
2. **Use search**: Don't guess file locations, use search_files to find them
3. **Combine tools**: Use multiple tools together to accomplish tasks
4. **Handle errors**: Check tool results and handle failures gracefully
5. **Be specific**: Provide exact paths and values for tool parameters
6. **Confirm destructive actions**: Before deleting or overwriting, confirm with user
7. **Use git**: Before making batch changes, check git status to understand current state

### Tool Selection Strategy

- **File discovery**: search_files → read_file
- **Code changes**: read_file → edit_file (or write_file for new files)
- **Running commands**: execute_command (check git status first if needed)
- **Debugging**: search_files → read_file → execute_command (for tests)
- **Browser tasks**: browser_navigate → browser_screenshot
`.trim();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	toolRegistry,
	getToolTemplate,
	getToolsByCategory,
	formatToolsForPrompt,
	formatToolCall,
	formatToolResult,
	generateToolExamples,
	getToolUseGuidelines,
};
