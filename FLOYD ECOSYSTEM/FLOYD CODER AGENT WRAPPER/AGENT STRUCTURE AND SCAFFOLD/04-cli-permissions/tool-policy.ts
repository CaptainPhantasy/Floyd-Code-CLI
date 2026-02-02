/**
 * Tool Policy
 *
 * Tool-level permission policies with allow/ask/deny control.
 *
 * @module permissions/tool-policy
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Permission level
 */
export type PermissionLevel = 'allow' | 'ask' | 'deny';

/**
 * Tool policy definition
 */
export interface ToolPolicy {
	/** Tool name or pattern (supports wildcards) */
	tool: string;

	/** Permission level */
	level: PermissionLevel;

	/** Policy description */
	description?: string;

	/** Risk level override */
	risk?: 'low' | 'medium' | 'high';

	/** Conditions for applying policy */
	conditions?: PolicyCondition[];

	/** Policy priority (higher = more important) */
	priority?: number;
}

/**
 * Policy condition
 */
export interface PolicyCondition {
	/** Condition type */
	type: 'file_path' | 'file_pattern' | 'time_range' | 'custom';

	/** Condition value */
	value: string | RegExp | ((context: any) => boolean);

	/** Whether to match or exclude */
	match: boolean;
}

/**
 * Permission decision
 */
export interface PermissionDecision {
	/** Decision */
	allowed: boolean;

	/** Permission level */
	level: PermissionLevel;

	/** Policy that made the decision */
	policy?: ToolPolicy;

	/** Reason for decision */
	reason?: string;

	/** Whether user confirmation is required */
	requiresConfirmation: boolean;
}

/**
 * Permission request context
 */
export interface PermissionContext {
	/** Tool being called */
	tool: string;

	/** Tool arguments */
	args: Record<string, unknown>;

	/** Working directory */
	cwd: string;

	/** User ID */
	userId?: string;

	/** Session ID */
	sessionId: string;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

// ============================================================================
// TOOL POLICY MANAGER CLASS
// ============================================================================

/**
 * ToolPolicyManager - Manages tool-level permissions
 *
 * Provides hierarchical permission control with allow/ask/deny levels.
 * Policies can be global, project-specific, or tool-specific.
 */
export class ToolPolicyManager {
	private readonly policies: ToolPolicy[] = [];
	private readonly defaultLevel: PermissionLevel;

	constructor(defaultLevel: PermissionLevel = 'allow') {
		this.defaultLevel = defaultLevel;
	}

	/**
	 * Add a policy
	 */
	addPolicy(policy: ToolPolicy): void {
		this.policies.push({
			...policy,
			priority: policy.priority ?? 0,
		});

		// Sort by priority (highest first)
		this.policies.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
	}

	/**
	 * Remove a policy
	 */
	removePolicy(tool: string): boolean {
		const index = this.policies.findIndex(p => p.tool === tool);

		if (index !== -1) {
			this.policies.splice(index, 1);
			return true;
		}

		return false;
	}

	/**
	 * Get all policies
	 */
	getPolicies(): ToolPolicy[] {
		return [...this.policies];
	}

	/**
	 * Get policies for a specific tool
	 */
 getPoliciesForTool(tool: string): ToolPolicy[] {
		return this.policies.filter(p => this.matchesTool(p.tool, tool));
	}

	/**
	 * Check permission for a tool
	 * UNRESTRICTED YOLO MODE - ALWAYS ALLOW
	 */
	checkPermission(_context: PermissionContext): PermissionDecision {
		// UNRESTRICTED: Always allow, never ask, never deny
		return {
			allowed: true,
			level: 'allow',
			requiresConfirmation: false,
			reason: 'YOLO mode - all operations auto-approved',
		};
	}

	/**
	 * Clear all policies
	 */
	clear(): void {
		this.policies.length = 0;
	}

	/**
	 * Get policy statistics
	 */
	getStats(): {
		totalPolicies: number;
		allowPolicies: number;
		askPolicies: number;
		denyPolicies: number;
	} {
		return {
			totalPolicies: this.policies.length,
			allowPolicies: this.policies.filter(p => p.level === 'allow').length,
			askPolicies: this.policies.filter(p => p.level === 'ask').length,
			denyPolicies: this.policies.filter(p => p.level === 'deny').length,
		};
	}

	/**
	 * Check if tool name matches pattern
	 */
	private matchesTool(pattern: string, tool: string): boolean {
		// Exact match
		if (pattern === tool) {
			return true;
		}

		// Wildcard match
		if (pattern.includes('*')) {
			const regex = new RegExp(
				'^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
			);
			return regex.test(tool);
		}

		return false;
	}

	/**
	 * Check if context matches policy conditions
	 */
	private matchesConditions(
		policy: ToolPolicy,
		context: PermissionContext,
	): boolean {
		if (!policy.conditions || policy.conditions.length === 0) {
			return true;
		}

		// All conditions must match
		for (const condition of policy.conditions) {
			const matches = this.matchesCondition(condition, context);

			if (condition.match && !matches) {
				return false;
			}

			if (!condition.match && matches) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Check if a single condition matches
	 */
	private matchesCondition(
		condition: PolicyCondition,
		context: PermissionContext,
	): boolean {
		switch (condition.type) {
			case 'file_path':
				return typeof condition.value === 'string' &&
					context.cwd.includes(condition.value);

			case 'file_pattern':
				return condition.value instanceof RegExp &&
					condition.value.test(context.cwd);

			case 'custom':
				return typeof condition.value === 'function' &&
					condition.value(context);

			default:
				return false;
		}
	}
}

// ============================================================================
// PREDEFINED POLICIES
// ============================================================================

/**
 * Get default dangerous tool policies
 * UNRESTRICTED YOLO MODE - NO DANGEROUS POLICIES
 */
export function getDefaultDangerousPolicies(): ToolPolicy[] {
	// UNRESTRICTED: No dangerous tool restrictions
	return [];
}

/**
 * Get Plan Mode policies (deny all writes)
 * UNRESTRICTED YOLO MODE - NO PLAN MODE RESTRICTIONS
 */
export function getPlanModePolicies(): ToolPolicy[] {
	// UNRESTRICTED: No plan mode restrictions
	return [];
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default global tool policy manager instance
 */
let defaultPolicyManager: ToolPolicyManager | null = null;

/**
 * Get or create the default policy manager
 */
export function getDefaultPolicyManager(
	defaultLevel?: PermissionLevel,
): ToolPolicyManager {
	if (!defaultPolicyManager) {
		defaultPolicyManager = new ToolPolicyManager(defaultLevel);
	}
	return defaultPolicyManager;
}

/**
 * Reset the default policy manager (useful for testing)
 */
export function resetDefaultPolicyManager(): void {
	defaultPolicyManager = null;
}

export default ToolPolicyManager;
