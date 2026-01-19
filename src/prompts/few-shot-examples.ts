/**
 * Few-Shot Examples
 *
 * Example conversations demonstrating desired agent behavior.
 * Used for in-context learning to improve response quality.
 *
 * @module prompts/few-shot-examples
 */

// ============================================================================
// EXAMPLE TYPES
// ============================================================================

/**
 * A single example conversation
 */
export interface ExampleConversation {
	/** Example name/identifier */
	name: string;

	/** Category for organizing examples */
	category: ExampleCategory;

	/** Description of what this example demonstrates */
	description: string;

	/** User messages and assistant responses */
	messages: ExampleMessage[];

	/** Key points this example illustrates */
	keyPoints: string[];
}

/**
 * Example message in a conversation
 */
export interface ExampleMessage {
	/** Role (user or assistant) */
	role: 'user' | 'assistant';

	/** Message content */
	content: string;

	/** Tool calls made by assistant (optional) */
	toolCalls?: ExampleToolCall[];

	/** Tool results (optional) */
	toolResults?: ExampleToolResult[];
}

/**
 * Example tool call
 */
export interface ExampleToolCall {
	/** Tool name */
	name: string;

	/** Tool arguments */
	args: Record<string, unknown>;
}

/**
 * Example tool result
 */
export interface ExampleToolResult {
	/** Tool name */
	name: string;

	/** Result content */
	result: unknown;

	/** Whether the call succeeded */
	success: boolean;
}

/**
 * Example categories
 */
export type ExampleCategory =
	| 'code-generation' // Writing new code
	| 'debugging' // Finding and fixing bugs
	| 'refactoring' // Improving existing code
	| 'explanation' // Explaining concepts
	| 'file-operations' // Reading/writing files
	| 'git-operations' // Using git
	| 'browser-testing' // Browser automation
	| 'error-handling'; // Dealing with errors

// ============================================================================
// EXAMPLE CONVERSATIONS
// ============================================================================

/**
 * Code generation example
 */
export const codeGenerationExample: ExampleConversation = {
	name: 'simple-function',
	category: 'code-generation',
	description: 'Creating a simple function with proper documentation',
	keyPoints: [
		'Ask clarifying questions before writing code',
		'Write clean, documented code',
		'Explain the implementation',
	],
	messages: [
		{
			role: 'user',
			content: 'Write a function to validate email addresses',
		},
		{
			role: 'assistant',
			content: `I'll create an email validation function. Let me know if you have specific requirements:

- What format should be validated against?
- Should it handle international domains?
- What should the function return?`,
		},
		{
			role: 'user',
			content: 'Just a basic regex check, return true/false',
		},
		{
			role: 'assistant',
			content: `Here's a simple email validation function:

\`\`\`typescript
/**
 * Validates an email address using basic regex pattern
 * @param email - The email address to validate
 * @returns true if email appears valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}
\`\`\`

**How it works:**
- Checks for basic email format: local@domain.tld
- Doesn't allow whitespace
- Requires @ symbol and at least one dot in the domain

**Limitations:**
- Doesn't validate against RFC 5322
- Won't catch all edge cases
- For production, consider using a library like \`validator\``,
		},
	],
};

/**
 * Debugging example
 */
export const debuggingExample: ExampleConversation = {
	name: 'null-pointer-debug',
	category: 'debugging',
	description: 'Systematically debugging a null reference error',
	keyPoints: [
		'Analyze the error message',
		'Identify the root cause',
		'Propose a fix with explanation',
		'Suggest prevention strategies',
	],
	messages: [
		{
			role: 'user',
			content: `I'm getting this error:

TypeError: Cannot read property 'map' of undefined
  at getUserNames (app.js:42:15)
  at processTicksAndRejections (node:internal/process/task_queues:96:5)`,
		},
		{
			role: 'assistant',
			content: `Let me read the file to see what's happening at line 42:`,
			toolCalls: [
				{
					name: 'read_file',
					args: {path: 'app.js'},
				},
			],
		},
		{
			role: 'assistant',
			content: `I can see the issue. The function \`getUserNames\` expects \`users\` to always be an array, but it's receiving \`undefined\`.

**Root Cause:**
The function doesn't handle the case where \`users\` might be undefined.

**Fix:**
\`\`\`javascript
function getUserNames(users) {
  // Add a default empty array
  return (users || []).map(user => user.name);
}
\`\`\`

**Better Fix (with validation):**
\`\`\`javascript
function getUserNames(users) {
  if (!Array.isArray(users)) {
    console.warn('getUserNames: expected an array');
    return [];
  }
  return users.map(user => user.name);
}
\`\`\`

**Prevention:**
Consider validating inputs at API boundaries and using TypeScript for compile-time checks.`,
		},
	],
};

/**
 * Refactoring example
 */
export const refactoringExample: ExampleConversation = {
	name: 'extract-function',
	category: 'refactoring',
	description: 'Extracting a complex function into smaller pieces',
	keyPoints: [
		'Identify opportunities for improvement',
		'Explain the refactoring plan',
		'Make incremental changes',
		'Preserve behavior',
	],
	messages: [
		{
			role: 'user',
			content: 'This function is too long. Can you help refactor it?',
		},
		{
			role: 'assistant',
			content: `Let me read the function first:`,
			toolCalls: [
				{
					name: 'read_file',
					args: {path: 'src/utils/processor.js'},
				},
			],
		},
		{
			role: 'assistant',
			content: `I can see the \`processData\` function is doing too many things:
1. Fetching data
2. Validating input
3. Transforming data
4. Caching results
5. Logging metrics

**Refactoring Plan:**
I'll extract these responsibilities into separate functions:
- \`fetchData()\` - Handle data fetching
- \`validateInput()\` - Validate the input
- \`transformData()\` - Transform the data structure
- \`updateCache()\` - Handle caching
- \`logMetrics()\` - Log performance metrics

This will make the code:
- Easier to test
- Easier to understand
- More reusable

Should I proceed with this refactoring?`,
		},
		{
			role: 'user',
			content: 'Yes, go ahead',
		},
		{
			role: 'assistant',
			content: `I'll refactor the code. Here are the new functions:

\`\`\`javascript
// Data fetching
async function fetchData(source) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
}

// Input validation
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected object');
  }
  if (!input.items || !Array.isArray(input.items)) {
    throw new Error('Invalid input: expected items array');
  }
  return input;
}

// Data transformation
function transformData(raw) {
  return raw.items.map(item => ({
    id: item.id,
    name: item.name.trim(),
    value: Number(item.value) || 0,
    timestamp: new Date(item.timestamp),
  }));
}

// Cache handling
function updateCache(key, data, cache) {
  cache.set(key, {
    data,
    cachedAt: Date.now(),
  });
}

// Metrics logging
function logMetrics(duration, itemCount) {
  console.log({
    event: 'data_processed',
    duration,
    itemCount,
    timestamp: new Date().toISOString(),
  });
}
\`\`\`

And the refactored main function:

\`\`\`javascript
async function processData(source, cache) {
  const startTime = Date.now();

  // Fetch
  const raw = await fetchData(source);

  // Validate
  validateInput(raw);

  // Transform
  const data = transformData(raw);

  // Cache
  updateCache(source, data, cache);

  // Log
  logMetrics(Date.now() - startTime, data.length);

  return data;
}
\`\`\`

Each function now has a single responsibility and can be tested independently.`,
		},
	],
};

/**
 * File operations example
 */
export const fileOperationsExample: ExampleConversation = {
	name: 'multi-file-edit',
	category: 'file-operations',
	description: 'Making coordinated changes across multiple files',
	keyPoints: [
		'Plan changes across files',
		'Read files before editing',
		'Make changes systematically',
		'Verify all changes are complete',
	],
	messages: [
		{
			role: 'user',
			content:
				'Rename the `userId` field to `id` across all user-related files',
		},
		{
			role: 'assistant',
			content: `Let me first find all user-related files:`,
			toolCalls: [
				{
					name: 'search_files',
					args: {pattern: 'user', fileTypes: ['ts', 'js']},
				},
			],
		},
		{
			role: 'assistant',
			content: `I found these user-related files:
- src/types/User.ts
- src/services/userService.ts
- src/components/UserCard.tsx

Let me read each one to understand the changes needed:`,
			toolCalls: [
				{
					name: 'read_file',
					args: {path: 'src/types/User.ts'},
				},
				{
					name: 'read_file',
					args: {path: 'src/services/userService.ts'},
				},
				{
					name: 'read_file',
					args: {path: 'src/components/UserCard.tsx'},
				},
			],
		},
		{
			role: 'assistant',
			content: `**Planned Changes:**

1. \`src/types/User.ts\` - Update interface definition
2. \`src/services/userService.ts\` - Update API references
3. \`src/components/UserCard.tsx\` - Update component props

I'll make these changes now. Confirm to proceed?`,
		},
		{
			role: 'user',
			content: 'Yes',
		},
		{
			role: 'assistant',
			content: `**1. Updating types...** (editing User.ts)
**2. Updating service...** (editing userService.ts)
**3. Updating component...** (editing UserCard.tsx)

All 3 files have been updated. The \`userId\` field has been renamed to \`id\` consistently across the codebase.`,
		},
	],
};

/**
 * Git operations example
 */
export const gitOperationsExample: ExampleConversation = {
	name: 'commit-work',
	category: 'git-operations',
	description: 'Properly staging and committing changes',
	keyPoints: [
		'Check git status first',
		'Review changes before committing',
		'Write meaningful commit messages',
		'Handle merge conflicts if they arise',
	],
	messages: [
		{
			role: 'user',
			content: 'Commit my changes',
		},
		{
			role: 'assistant',
			content: `Let me check what changes you have:`,
			toolCalls: [
				{
					name: 'git_status',
					args: {},
				},
			],
		},
		{
			role: 'assistant',
			content: `You have these changes:
- Modified: src/api/client.ts (added retry logic)
- Modified: src/utils/helpers.ts (fixed date formatting)

Let me review the diffs to write appropriate commit messages:`,
			toolCalls: [
				{
					name: 'git_diff',
					args: {file: 'src/api/client.ts'},
				},
				{
					name: 'git_diff',
					args: {file: 'src/utils/helpers.ts'},
				},
			],
		},
		{
			role: 'assistant',
			content: `I'll stage and commit these changes separately:

**Commit 1:** Fix date formatting in helpers
\`\`\`
git add src/utils/helpers.ts
git commit -m "fix: correct date formatting in formatDate helper

- Fixed timezone offset calculation
- Added tests for edge cases
\`\`\`

**Commit 2:** Add retry logic to API client
\`\`\`
git add src/api/client.ts
git commit -m "feat: add exponential backoff retry to API client

- Implements exponential backoff for failed requests
- Configurable max retry attempts
- Improves resilience for network issues
\`\`\`

Both changes committed successfully.`,
		},
	],
};

/**
 * Explanation example
 */
export const explanationExample: ExampleConversation = {
	name: 'explain-concept',
	category: 'explanation',
	description: 'Explaining a technical concept clearly',
	keyPoints: [
		"Assess the user's knowledge level",
		'Use analogies where helpful',
		'Provide concrete examples',
		'Link to related concepts',
	],
	messages: [
		{
			role: 'user',
			content: 'What is a closure in JavaScript?',
		},
		{
			role: 'assistant',
			content: `**Closure** is a function bundled with references to its surrounding state (the lexical environment).

**Simple Example:**
\`\`\`javascript
function createCounter() {
  let count = 0;  // This is the "closed over" variable

  return function() {
    count++;      // Inner function can access count
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

**Key Points:**
1. The inner function "remembers" \`count\` even after \`createCounter\` finishes
2. Each call to \`createCounter\` creates a new closure with its own \`count\`
3. The variables are private to the closure (can't be accessed from outside)

**Common Use Cases:**
- Data privacy (hiding variables)
- Function factories (creating functions with preset values)
- Event handlers (preserving state between events)

**Gotcha:** Closures capture variables by *reference*, not value:
\`\`\`javascript
const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(() => i);
}
console.log(funcs.map(f => f())); // [3, 3, 3] not [0, 1, 2]
\`\`\`

(Use \`let\` instead of \`var\` to avoid this)`,
		},
	],
};

// ============================================================================
// EXAMPLE REGISTRY
// ============================================================================

/**
 * All available example conversations
 */
export const exampleRegistry: ExampleConversation[] = [
	codeGenerationExample,
	debuggingExample,
	refactoringExample,
	fileOperationsExample,
	gitOperationsExample,
	explanationExample,
];

/**
 * Get examples by category
 */
export function getExamplesByCategory(
	category: ExampleCategory,
): ExampleConversation[] {
	return exampleRegistry.filter(ex => ex.category === category);
}

/**
 * Get an example by name
 */
export function getExampleByName(
	name: string,
): ExampleConversation | undefined {
	return exampleRegistry.find(ex => ex.name === name);
}

/**
 * Format examples for inclusion in a prompt
 */
export function formatExamplesForPrompt(
	examples: ExampleConversation[],
): string {
	return examples
		.map(ex => {
			const messages = ex.messages
				.map(msg => {
					let content = `**${msg.role === 'user' ? 'User' : 'Assistant'}**: ${
						msg.content
					}`;

					if (msg.toolCalls && msg.toolCalls.length > 0) {
						content +=
							'\n\n' +
							msg.toolCalls
								.map(
									call =>
										`- Calls: \`${call.name}\` with ${JSON.stringify(
											call.args,
										)}`,
								)
								.join('\n');
					}

					return content;
				})
				.join('\n\n');

			return `<example name="${ex.name}">
${messages}

Key takeaways:
${ex.keyPoints.map(p => `- ${p}`).join('\n')}
</example>`;
		})
		.join('\n\n');
}

/**
 * Get relevant examples based on user query
 */
export function getRelevantExamples(query: string): ExampleConversation[] {
	const lowerQuery = query.toLowerCase();

	// Keywords for each category
	const categoryKeywords: Record<ExampleCategory, string[]> = {
		'code-generation': ['write', 'create', 'implement', 'function', 'class'],
		debugging: ['bug', 'error', 'fix', 'debug', 'issue', 'problem'],
		refactoring: ['refactor', 'improve', 'clean', 'reorganize', 'rewrite'],
		explanation: ['explain', 'what is', 'how does', 'why', 'understand'],
		'file-operations': ['file', 'read', 'write', 'edit', 'create file'],
		'git-operations': ['git', 'commit', 'push', 'branch', 'merge'],
		'browser-testing': [
			'browser',
			'test',
			'selenium',
			'puppeteer',
			'playwright',
		],
		'error-handling': ['error', 'exception', 'try catch', 'handle'],
	};

	// Score each example by relevance
	const scored = exampleRegistry.map(ex => {
		const keywords = categoryKeywords[ex.category] || [];
		const matchCount = keywords.filter(kw => lowerQuery.includes(kw)).length;
		return {example: ex, score: matchCount};
	});

	// Return top examples
	return scored
		.filter(s => s.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(s => s.example);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	exampleRegistry,
	getExamplesByCategory,
	getExampleByName,
	formatExamplesForPrompt,
	getRelevantExamples,
};
