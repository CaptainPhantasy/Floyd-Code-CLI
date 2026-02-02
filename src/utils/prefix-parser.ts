/**
 * Prefix Mode Parser
 *
 * Purpose: Parse Claude Code-style prefix commands (!, /, @, &)
 * Aligns Floyd with Claude Code UX for explicit mode control
 * Related: app.tsx, cli-parser.ts
 */

// ============================================================================
// TYPES
// ============================================================================

export type PrefixMode = 'bash' | 'command' | 'agent' | 'tool' | 'normal';

export interface ParsedInput {
	/** Detected prefix mode */
	mode: PrefixMode;
	/** Original input */
	rawInput: string;
	/** Input with prefix stripped */
	cleanInput: string;
	/** The prefix character (if any) */
	prefix?: string;
	/** Whether this is a prefix command */
	isPrefixed: boolean;
}

// ============================================================================
// PREFIX DETECTION
// ============================================================================

/**
 * Claude Code prefix modes:
 * - `!` = Bash mode - execute shell commands directly
 * - `/` = Command mode - structured commands (/help, /explain)
 * - `@` = Agent mode - delegate to sub-agent
 * - `&` = Tool mode - explicit tool invocation
 */
const PREFIX_PATTERNS = {
	bash: /^!/,
	command: /^\//,
	agent: /^@/,
	tool: /^&/,
} as const;

/**
 * Parse user input for prefix mode detection
 *
 * @param input - Raw user input
 * @returns Parsed input with detected mode
 */
export function parsePrefixMode(input: string): ParsedInput {
	const trimmed = input.trim();

	// Check each prefix pattern
	for (const [mode, pattern] of Object.entries(PREFIX_PATTERNS)) {
		if (pattern.test(trimmed)) {
			return {
				mode: mode as PrefixMode,
				rawInput: input,
				cleanInput: trimmed.slice(1).trim(), // Remove prefix character
				prefix: trimmed[0],
				isPrefixed: true,
			};
		}
	}

	// No prefix detected - normal mode
	return {
		mode: 'normal',
		rawInput: input,
		cleanInput: trimmed,
		isPrefixed: false,
	};
}

// ============================================================================
// MODE VALIDATORS
// ============================================================================

/**
 * Check if input is a bash command
 */
export function isBashCommand(parsed: ParsedInput): boolean {
	return parsed.mode === 'bash';
}

/**
 * Check if input is a slash command
 */
export function isSlashCommand(parsed: ParsedInput): boolean {
	return parsed.mode === 'command';
}

/**
 * Check if input is an agent delegation
 */
export function isAgentDelegation(parsed: ParsedInput): boolean {
	return parsed.mode === 'agent';
}

/**
 * Check if input is a tool invocation
 */
export function isToolInvocation(parsed: ParsedInput): boolean {
	return parsed.mode === 'tool';
}

// ============================================================================
// BASH MODE HELPERS
// ============================================================================

/**
 * Split bash command into command and args
 * Example: "ls -la /tmp" -> {command: "ls", args: ["-la", "/tmp"]}
 */
export function parseBashCommand(cleanInput: string): {
	command: string;
	args: string[];
} {
	const parts = cleanInput.split(/\s+/);
	const command = parts[0] || '';
	const args = parts.slice(1);
	return {command, args};
}

// ============================================================================
// COMMAND MODE HELPERS
// ============================================================================

/**
 * Parse slash command into command name and arguments
 * Example: "/help api" -> {command: "help", args: "api"}
 */
export function parseSlashCommand(cleanInput: string): {
	command: string;
	args: string;
} {
	const spaceIndex = cleanInput.indexOf(' ');
	if (spaceIndex === -1) {
		return {command: cleanInput, args: ''};
	}
	return {
		command: cleanInput.slice(0, spaceIndex),
		args: cleanInput.slice(spaceIndex + 1).trim(),
	};
}

// ============================================================================
// AGENT MODE HELPERS
// ============================================================================

/**
 * Parse agent delegation
 * Example: "@coder write tests" -> {agent: "coder", instruction: "write tests"}
 */
export function parseAgentDelegation(cleanInput: string): {
	agent: string;
	instruction: string;
} {
	const spaceIndex = cleanInput.indexOf(' ');
	if (spaceIndex === -1) {
		return {agent: cleanInput, instruction: ''};
	}
	return {
		agent: cleanInput.slice(0, spaceIndex),
		instruction: cleanInput.slice(spaceIndex + 1).trim(),
	};
}

// ============================================================================
// TOOL MODE HELPERS
// ============================================================================

/**
 * Parse tool invocation
 * Example: "&grep pattern file" -> {tool: "grep", args: "pattern file"}
 */
export function parseToolInvocation(cleanInput: string): {
	tool: string;
	args: string;
} {
	const spaceIndex = cleanInput.indexOf(' ');
	if (spaceIndex === -1) {
		return {tool: cleanInput, args: ''};
	}
	return {
		tool: cleanInput.slice(0, spaceIndex),
		args: cleanInput.slice(spaceIndex + 1).trim(),
	};
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate bash command safety
 * Returns array of warnings (empty if safe)
 */
export function validateBashCommand(command: string): string[] {
	const warnings: string[] = [];
	const dangerousCommands = ['rm -rf', 'dd', 'mkfs', ':(){:|:&};:', 'fork bomb'];

	for (const danger of dangerousCommands) {
		if (command.includes(danger)) {
			warnings.push(`Dangerous command detected: ${danger}`);
		}
	}

	return warnings;
}

// ============================================================================
// EXAMPLES & DOCUMENTATION
// ============================================================================

/**
 * Example usage:
 *
 * ```typescript
 * const parsed = parsePrefixMode("!ls -la");
 * // { mode: "bash", cleanInput: "ls -la", prefix: "!", isPrefixed: true }
 *
 * const {command, args} = parseBashCommand(parsed.cleanInput);
 * // { command: "ls", args: ["-la"] }
 * ```
 */

export default parsePrefixMode;
