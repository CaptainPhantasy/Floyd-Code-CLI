/**
 * Permission Policies
 *
 * Defines permission policies and rules for tool access control.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.3
 */

/**
 * Permission decision type
 */
export type PermissionDecision = 'allow' | 'deny' | 'prompt';

/**
 * Permission scope
 */
export type PermissionScope = 'once' | 'session' | 'forever';

/**
 * Permission rule
 */
export interface PermissionRule {
  /** Tool name or pattern */
  tool: string | RegExp;
  /** Decision */
  decision: PermissionDecision;
  /** Scope of the rule */
  scope: PermissionScope;
  /** Condition function (optional) */
  condition?: (args: Record<string, unknown>) => boolean;
  /** Reason for the rule */
  reason?: string;
}

/**
 * Permission policy
 */
export interface PermissionPolicy {
  /** Policy name */
  name: string;
  /** Policy description */
  description: string;
  /** Rules in order of priority */
  rules: PermissionRule[];
  /** Default decision if no rules match */
  defaultDecision: PermissionDecision;
  /** Default scope for new permissions */
  defaultScope: PermissionScope;
}

/**
 * Built-in policies
 */
export const BUILTIN_POLICIES: Record<string, PermissionPolicy> = {
  /**
   * Restrictive policy - deny by default, whitelist only
   */
  restrictive: {
    name: 'Restrictive',
    description: 'Deny all by default, only allow explicitly whitelisted tools',
    defaultDecision: 'deny',
    defaultScope: 'once',
    rules: [
      // Allow read-only operations
      { tool: /^(read|list|find|search|get|grep|glob)/, decision: 'allow', scope: 'session' },
    ],
  },

  /**
   * Balanced policy - prompt for modifications
   */
  balanced: {
    name: 'Balanced',
    description: 'Allow read operations, prompt for write operations',
    defaultDecision: 'prompt',
    defaultScope: 'session',
    rules: [
      // Allow read-only operations
      { tool: /^(read|list|find|search|get|grep|glob)/, decision: 'allow', scope: 'session' },
      // Prompt for write operations
      { tool: /^(write|edit|create|copy|move|rename)/, decision: 'prompt', scope: 'session' },
      // Deny dangerous operations by default
      { tool: /^(delete|remove|rm|execute|bash|shell)/, decision: 'prompt', scope: 'once' },
    ],
  },

  /**
   * Permissive policy - allow most operations
   */
  permissive: {
    name: 'Permissive',
    description: 'Allow most operations, only prompt for dangerous ones',
    defaultDecision: 'allow',
    defaultScope: 'session',
    rules: [
      // Allow most operations
      { tool: /.*/, decision: 'allow', scope: 'session' },
      // Prompt for dangerous operations
      { tool: /^(delete|remove|rm)/, decision: 'prompt', scope: 'once' },
      { tool: /^(execute|bash|shell)/, decision: 'prompt', scope: 'session' },
    ],
  },

  /**
   * YOLO policy - allow everything
   */
  yolo: {
    name: 'YOLO',
    description: 'Allow all operations without prompting',
    defaultDecision: 'allow',
    defaultScope: 'forever',
    rules: [],
  },
};

/**
 * Match a tool name against a rule
 */
export function matchRule(toolName: string, rule: PermissionRule, args?: Record<string, unknown>): boolean {
  // Match tool name
  const toolMatches = rule.tool instanceof RegExp
    ? rule.tool.test(toolName)
    : rule.tool === toolName || rule.tool === '*';

  if (!toolMatches) return false;

  // Check condition if present
  if (rule.condition && args) {
    return rule.condition(args);
  }

  return true;
}

/**
 * Evaluate policy for a tool
 */
export function evaluatePolicy(
  policy: PermissionPolicy,
  toolName: string,
  args?: Record<string, unknown>
): { decision: PermissionDecision; scope: PermissionScope; reason?: string } {
  // Check rules in order
  for (const rule of policy.rules) {
    if (matchRule(toolName, rule, args)) {
      return {
        decision: rule.decision,
        scope: rule.scope,
        reason: rule.reason,
      };
    }
  }

  // Return default
  return {
    decision: policy.defaultDecision,
    scope: policy.defaultScope,
  };
}

/**
 * Create a custom policy
 */
export function createPolicy(
  name: string,
  description: string,
  rules: PermissionRule[],
  defaultDecision: PermissionDecision = 'prompt',
  defaultScope: PermissionScope = 'session'
): PermissionPolicy {
  return {
    name,
    description,
    rules,
    defaultDecision,
    defaultScope,
  };
}

/**
 * Merge policies (later rules take precedence)
 */
export function mergePolicies(...policies: PermissionPolicy[]): PermissionPolicy {
  const mergedRules: PermissionRule[] = [];
  
  for (const policy of policies) {
    mergedRules.push(...policy.rules);
  }

  const lastPolicy = policies[policies.length - 1];
  
  return {
    name: 'Merged Policy',
    description: `Merged from: ${policies.map(p => p.name).join(', ')}`,
    rules: mergedRules,
    defaultDecision: lastPolicy?.defaultDecision ?? 'prompt',
    defaultScope: lastPolicy?.defaultScope ?? 'session',
  };
}
