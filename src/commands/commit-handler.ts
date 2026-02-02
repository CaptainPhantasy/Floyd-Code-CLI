/**
 * /commit Slash Command Handler
 *
 * Implements Claude Code-style commit workflow:
 * 1. Analyze staged/unstaged changes
 * 2. Generate commit message using AI (optional)
 * 3. Execute commit with FLOYD attribution
 *
 * @module commands/commit-handler
 */

import {
	createCommit,
	getGitStatus,
	stageFiles,
	type GitStatus,
} from '../mcp/git-server.js';
import type {CommandContext} from './command-handler.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CommitOptions {
	/** Explicit commit message */
	message?: string;
	/** Amend previous commit */
	amend?: boolean;
	/** Stage all modified files before committing */
	stageAll?: boolean;
	/** Request AI-generated message */
	generateMessage?: boolean;
	/** Preview without committing */
	dryRun?: boolean;
	/** Specific files to stage */
	files?: string[];
}

export interface CommitResult {
	success: boolean;
	commitHash?: string;
	message: string;
	filesChanged: number;
	insertions: number;
	deletions: number;
	error?: string;
	warnings?: string[];
}

// ============================================================================
// COMMIT HANDLER
// ============================================================================

/**
 * Handle /commit command
 *
 * Usage:
 *   /commit                    - Commit with prompt for message
 *   /commit "message"          - Commit with explicit message
 *   /commit --amend            - Amend last commit
 *   /commit --dry-run          - Preview without committing
 *   /commit -m "message"       - Explicit message flag
 *
 * @param args - Command arguments
 * @param context - Command execution context
 * @returns Commit result
 */
export async function handleCommit(
	args: string[],
	context: CommandContext,
): Promise<CommitResult> {
	const options = parseCommitArgs(args);
	const cwd = context.cwd || process.cwd();

	// 1. Get git status
	const status = await getGitStatus(cwd);

	if (!status || !status.isRepo) {
		return {
			success: false,
			message: status?.error || 'Not a git repository',
			filesChanged: 0,
			insertions: 0,
			deletions: 0,
			error: status?.error || 'Git status unavailable',
		};
	}

	// Check if there are changes
	const hasChanges = status.files.length > 0;
	const hasStagedChanges = status.files.some((f) => f.staged);

	if (!hasChanges && !options.amend) {
		return {
			success: false,
			message: 'No changes to commit',
			filesChanged: 0,
			insertions: 0,
			deletions: 0,
		};
	}

	// 2. Stage files if requested
	if (options.stageAll || (!hasStagedChanges && hasChanges)) {
		await stageFiles(options.files || [], cwd);
	}

	// 3. Get commit message
	let commitMessage = options.message;

	if (!commitMessage) {
		// Default message if none provided
		commitMessage = generateDefaultMessage(status);
	}

	// 4. Format message with FLOYD attribution
	const formattedMessage = formatCommitMessage(commitMessage);

	// 5. Dry run check
	if (options.dryRun) {
		return {
			success: true,
			message: `[DRY RUN] Would commit with message:\n\n${formattedMessage}`,
			filesChanged: status.files.length,
			insertions: 0,
			deletions: 0,
		};
	}

	// 6. Execute commit
	const result = await createCommit(formattedMessage, {
		repoPath: cwd,
		allowEmpty: false,
		amend: options.amend,
	});

	if (!result.success) {
		return {
			success: false,
			message: result.error || 'Commit failed',
			filesChanged: 0,
			insertions: 0,
			deletions: 0,
			error: result.error,
			warnings: result.warnings,
		};
	}

	return {
		success: true,
		commitHash: result.hash,
		message: formattedMessage,
		filesChanged: status.files.length,
		insertions: 0, // Could parse from git diff --stat
		deletions: 0,
		warnings: result.warnings,
	};
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse commit arguments
 */
function parseCommitArgs(args: string[]): CommitOptions {
	const options: CommitOptions = {
		stageAll: true, // Default: stage all changes
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '--amend' || arg === '-a') {
			options.amend = true;
		} else if (arg === '--dry-run' || arg === '-n') {
			options.dryRun = true;
		} else if (arg === '--no-stage') {
			options.stageAll = false;
		} else if (arg === '--generate' || arg === '-g') {
			options.generateMessage = true;
		} else if (arg === '-m' || arg === '--message') {
			// Next arg is the message
			const nextArg = args[++i];
			if (nextArg) {
				options.message = nextArg;
			}
		} else if (!arg.startsWith('-')) {
			// Assume it's the message (quoted or unquoted)
			// Join remaining non-flag args as the message
			const messageArgs = [];
			for (let j = i; j < args.length; j++) {
				if (!args[j].startsWith('-')) {
					messageArgs.push(args[j]);
				} else {
					break;
				}
			}
			if (messageArgs.length > 0) {
				options.message = messageArgs.join(' ');
				i += messageArgs.length - 1;
			}
		}
	}

	return options;
}

/**
 * Generate a default commit message based on status
 */
function generateDefaultMessage(status: GitStatus): string {
	// Status string format from simple-git: M (modified), A (added), D (deleted), ? (untracked), etc.
	const added = status.files.filter(
		(f) => f.status === 'A' || f.status === '?',
	).length;
	const modified = status.files.filter((f) => f.status === 'M').length;
	const deleted = status.files.filter((f) => f.status === 'D').length;

	const parts: string[] = [];
	if (added > 0) parts.push(`add ${added} file${added > 1 ? 's' : ''}`);
	if (modified > 0)
		parts.push(`modify ${modified} file${modified > 1 ? 's' : ''}`);
	if (deleted > 0) parts.push(`delete ${deleted} file${deleted > 1 ? 's' : ''}`);

	if (parts.length === 0) {
		return 'Update codebase';
	}

	// Capitalize first letter
	const message = parts.join(', ');
	return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Format commit message with FLOYD attribution
 *
 * Uses HEREDOC pattern from Claude Code conventions
 */
function formatCommitMessage(message: string): string {
	// Don't add attribution if message already has it
	if (message.includes('Generated with') || message.includes('Assisted-by:')) {
		return message;
	}

	return `${message}


🤖 Generated with FLOYD CLI


Assisted-by: Claude via FLOYD <floyd@charmpunk.dev>`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {parseCommitArgs, formatCommitMessage, generateDefaultMessage};
