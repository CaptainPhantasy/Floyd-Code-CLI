/**
 * Git Branch Protection
 *
 * PHASE 3 ITEM 14: Git Branch Protection
 *
 * Protects main/master branches from direct pushes:
 * - Protected branch list
 * - Force push protection
 * - Pre-merge requirements
 */

export const PROTECTED_BRANCHES = ['main', 'master', 'develop', 'dev'];

export interface BranchProtectionRule {
	pattern: string;
	requirePullRequest: boolean;
	requireApproval: boolean;
	allowForcePush: boolean;
	allowDelete: boolean;
	minApprovals: number;
}

export const DEFAULT_PROTECTION: BranchProtectionRule = {
	pattern: '^(main|master)$',
	requirePullRequest: true,
	requireApproval: true,
	allowForcePush: false,
	allowDelete: false,
	minApprovals: 1,
};

/**
 * Check if a branch is protected
 */
export function isProtectedBranch(branchName: string, rules: BranchProtectionRule[] = [DEFAULT_PROTECTION]): boolean {
	return PROTECTED_BRANCHES.includes(branchName) || rules.some(rule => new RegExp(rule.pattern).test(branchName));
}

/**
 * Check if operation is allowed on branch
 */
export function checkBranchOperation(
	branchName: string,
	operation: 'push' | 'force-push' | 'delete',
	rules: BranchProtectionRule[] = [DEFAULT_PROTECTION]
): { allowed: boolean; reason?: string } {
	// Check if branch is protected
	const matchingRule = rules.find(rule => new RegExp(rule.pattern).test(branchName));

	if (!matchingRule) {
		// No rule applies, operation allowed
		return { allowed: true };
	}

	// Check operation-specific restrictions
	switch (operation) {
		case 'push':
			if (matchingRule.requirePullRequest) {
				return { allowed: false, reason: 'Pull request required' };
			}
			break;
		case 'force-push':
			if (!matchingRule.allowForcePush) {
				return { allowed: false, reason: 'Force push not allowed' };
			}
			break;
		case 'delete':
			if (!matchingRule.allowDelete) {
				return { allowed: false, reason: 'Branch deletion not allowed' };
			}
			break;
	}

	return { allowed: true };
}

/**
 * Validate branch name against conventions
 */
export function validateBranchName(branchName: string): { valid: boolean; error?: string } {
	// Check for invalid characters
	const invalidChars = /[~^:?*\\[\\]]/;
	if (invalidChars.test(branchName)) {
		return {
			valid: false,
			error: `Branch name contains invalid characters: ${invalidChars.exec(branchName)?.[0]}`,
		};
	}

	// Check length
	if (branchName.length > 240) {
		return { valid: false, error: 'Branch name too long (max 240 chars)' };
	}

	// Check for reserved prefixes
	if (branchName.startsWith('-')) {
		return { valid: false, error: 'Branch name cannot start with hyphen' };
	}

	return { valid: true };
}
