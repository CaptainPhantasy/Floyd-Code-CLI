/**
 * Permission Policies
 *
 * Defines permission rules and policies for tool access.
 * These policies determine what tools require permission requests
 * and how decisions are stored and applied.
 */

import {RiskLevel} from './risk-classifier.js';

export type PermissionScope = 'once' | 'session' | 'always';

export type PermissionDecision = 'allow' | 'deny';

export interface PermissionRule {
	toolName: string;
	toolPattern?: string; // For wildcard matches
	decision: PermissionDecision;
	scope: PermissionScope;
	grantedAt: number;
	expiresAt?: number;
}

export interface PermissionPolicy {
	rules: PermissionRule[];
	defaultBehavior: 'allow' | 'deny' | 'ask';
	rememberUntil: 'session' | 'forever';
}

/**
 * Default permission policies
 */
export const DEFAULT_POLICIES: PermissionPolicy = {
	rules: [],
	defaultBehavior: 'ask',
	rememberUntil: 'session',
};

/**
 * Tools that are always allowed (safe, read-only)
 */
export const ALWAYS_ALLOW_TOOLS = [
	'read_file',
	'read',
	'list_directory',
	'find_files',
	'grep',
	'search',
	'get_symbols',
	'get_file_info',
];

/**
 * Tools that should always prompt (destructive or sensitive)
 */
export const ALWAYS_PROMPT_TOOLS = [
	'write_file',
	'delete_file',
	'execute_command',
	'run_bash',
	'move_file',
	'copy_file',
	'create_directory',
];

/**
 * Check if a tool matches a rule pattern
 */
export function matchesPattern(toolName: string, pattern: string): boolean {
	// Exact match
	if (pattern === toolName) return true;

	// Wildcard suffix (e.g., "git-*")
	if (pattern.endsWith('*')) {
		const prefix = pattern.slice(0, -1);
		return toolName.startsWith(prefix);
	}

	// Wildcard prefix (e.g., "*.read")
	if (pattern.startsWith('*')) {
		const suffix = pattern.slice(1);
		return toolName.endsWith(suffix);
	}

	// Regex pattern
	if (pattern.startsWith('/') && pattern.endsWith('/')) {
		const regex = new RegExp(pattern.slice(1, -1));
		return regex.test(toolName);
	}

	return false;
}

/**
 * Get applicable rule for a tool
 */
export function getApplicableRule(
	toolName: string,
	policies: PermissionPolicy,
): PermissionRule | null {
	// Find exact match first
	for (const rule of policies.rules) {
		if (rule.toolName === toolName) {
			return rule;
		}
	}

	// Find pattern match
	for (const rule of policies.rules) {
		if (rule.toolPattern && matchesPattern(toolName, rule.toolPattern)) {
			return rule;
		}
	}

	return null;
}

/**
 * Check if a permission rule is still valid
 */
export function isRuleValid(rule: PermissionRule): boolean {
	if (!rule.expiresAt) return true;
	return rule.expiresAt > Date.now();
}

/**
 * Create a new permission rule
 */
export function createPermissionRule(
	toolName: string,
	decision: PermissionDecision,
	scope: PermissionScope,
	rememberUntil: 'session' | 'forever' = 'session',
): PermissionRule {
	const now = Date.now();
	let expiresAt: number | undefined;

	if (scope === 'once') {
		expiresAt = now; // Expires immediately after use
	} else if (scope === 'session' && rememberUntil === 'session') {
		expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
	}
	// 'always' means no expiration

	return {
		toolName,
		decision,
		scope,
		grantedAt: now,
		expiresAt,
	};
}

/**
 * Get risk-based recommendation for scope
 */
export function getRecommendedScope(riskLevel: RiskLevel): PermissionScope {
	switch (riskLevel) {
		case RiskLevel.LOW:
			return 'session'; // Can remember for session
		case RiskLevel.MEDIUM:
			return 'once'; // Ask each time
		case RiskLevel.HIGH:
			return 'once'; // Always ask for high-risk
		default:
			return 'once';
	}
}

/**
 * Clean expired rules from policies
 */
export function cleanExpiredRules(
	policies: PermissionPolicy,
): PermissionPolicy {
	return {
		...policies,
		rules: policies.rules.filter(isRuleValid),
	};
}

/**
 * Merge a new rule into policies
 */
export function mergeRule(
	policies: PermissionPolicy,
	rule: PermissionRule,
): PermissionPolicy {
	const cleaned = cleanExpiredRules(policies);

	// Remove any existing rule for the same tool
	const filtered = cleaned.rules.filter(
		r => r.toolName !== rule.toolName && r.toolPattern !== rule.toolName,
	);

	return {
		...cleaned,
		rules: [...filtered, rule],
	};
}

/**
 * Get display text for a permission scope
 */
export function getScopeText(scope: PermissionScope): string {
	switch (scope) {
		case 'once':
			return 'Just once';
		case 'session':
			return 'This session';
		case 'always':
			return 'Always';
		default:
			return 'Unknown';
	}
}

/**
 * Get display text for a permission decision
 */
export function getDecisionText(decision: PermissionDecision): string {
	switch (decision) {
		case 'allow':
			return 'Approve';
		case 'deny':
			return 'Deny';
		default:
			return 'Unknown';
	}
}
