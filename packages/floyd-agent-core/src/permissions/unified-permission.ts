/**
 * Unified Permission System
 *
 * Single source of truth for permission behavior across:
 * - Floyd CLI (Ink/React)
 * - Floyd Wrapper (Node.js)
 * - Floyd Desktop (Electron)
 *
 * Implements PermissionStrategy pattern for YOLO/ASK/PLAN modes.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item A
 */

import { classifyRisk, RiskLevel, type RiskAssessment } from './risk-classifier.js';
import type { PermissionScope, PermissionDecision } from './policies.js';
import { PermissionStore } from './store.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Permission mode - determines how permission requests are handled
 *
 * - ask: Prompt for all operations (Learning mode)
 * - plan: Deny all write/destructive operations (Markdown plan + todo list)
 * - auto: Auto-approve safe tools, prompt for destructive
 * - discuss: Active dialogue mode - emphasis on rapport and turn-taking
 * - fuckit: NO RESTRICTIONS - Agent follows orders without asking
 */
export type PermissionMode = 'ask' | 'plan' | 'auto' | 'discuss' | 'fuckit';

/**
 * Permission request context
 */
export interface PermissionRequest {
  /** Tool being called */
  toolName: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Working directory */
  cwd: string;
  /** Session ID */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Permission response
 */
export interface PermissionResponse {
  /** Whether permission was granted */
  granted: boolean;
  /** Permission mode used */
  mode: PermissionMode;
  /** Risk assessment */
  risk: RiskAssessment;
  /** Human-readable reason */
  reason: string;
  /** Whether user confirmation was required */
  requiredConfirmation: boolean;
}

/**
 * Prompt function for interactive permission requests
 * Platforms inject their own UI (readline, React, Electron)
 */
export type PermissionPromptFunction = (
  request: PermissionRequest,
  risk: RiskAssessment
) => Promise<boolean>;

/**
 * Permission strategy configuration
 */
export interface PermissionStrategyConfig {
  /** Permission mode */
  mode: PermissionMode;
  /** Custom prompt function (required for ask/dialogue modes) */
  promptFn?: PermissionPromptFunction;
  /** Permission policy store (optional, uses in-memory if not provided) */
  store?: PermissionStore;
  /** Working directory for persisting permissions */
  cwd?: string;
  /** Whether to throw errors instead of silent denial */
  throwOnError?: boolean;
}

// ============================================================================
// STRATEGY INTERFACE
// ============================================================================

/**
 * Permission strategy - defines how permission decisions are made
 */
export interface IPermissionStrategy {
  /** Get the permission mode for this strategy */
  getMode(): PermissionMode;

  /**
   * Check if permission should be granted
   * @param request - Permission request details
   * @returns Permission response with decision and context
   */
  checkPermission(request: PermissionRequest): Promise<PermissionResponse>;

  /**
   * Record a permission decision for future use
   * @param toolName - Tool that was granted/denied
   * @param decision - The decision made
   * @param scope - How long to remember this decision
   */
  recordDecision(toolName: string, decision: PermissionDecision, scope: PermissionScope): Promise<void>;

  /**
   * Clear all cached permission decisions
   */
  clearCache(): Promise<void>;

  /**
   * Get audit history of permission decisions
   */
  getAuditHistory(): PermissionAuditEntry[];

  /**
   * Reset audit history
   */
  clearAuditHistory(): void;
}

/**
 * Permission audit entry - tracks individual permission decisions
 */
export interface PermissionAuditEntry {
  /** Tool name that was requested */
  toolName: string;
  /** Permission level of the tool */
  permissionLevel: 'none' | 'moderate' | 'dangerous';
  /** Target (file path, URL, etc.) being acted on */
  target: string;
  /** Decision made */
  decision: 'GRANTED' | 'DENIED';
  /** Timestamp of request */
  timestamp: string;
}

// ============================================================================
// BASE STRATEGY (abstract)
// ============================================================================

/**
 * Base permission strategy with common functionality
 */
abstract class BasePermissionStrategy implements IPermissionStrategy {
  protected store: PermissionStore;
  protected auditHistory: PermissionAuditEntry[] = [];
  protected cwd: string;

  constructor(
    protected mode: PermissionMode,
    config: Pick<PermissionStrategyConfig, 'cwd' | 'store'>
  ) {
    this.cwd = config.cwd ?? process.cwd();
    this.store = config.store ?? new PermissionStore(this.cwd);
  }

  getMode(): PermissionMode {
    return this.mode;
  }

  abstract checkPermission(request: PermissionRequest): Promise<PermissionResponse>;

  async recordDecision(toolName: string, decision: PermissionDecision, scope: PermissionScope): Promise<void> {
    await this.store.recordDecision(toolName, decision, scope);
  }

  async clearCache(): Promise<void> {
    await this.store.clearAll();
  }

  getAuditHistory(): PermissionAuditEntry[] {
    return [...this.auditHistory];
  }

  clearAuditHistory(): void {
    this.auditHistory = [];
  }

  /**
   * Add entry to audit history
   */
  protected addAuditEntry(
    toolName: string,
    risk: RiskAssessment,
    target: string,
    decision: 'GRANTED' | 'DENIED'
  ): void {
    const level = this.riskToPermissionLevel(risk.level);
    this.auditHistory.push({
      toolName,
      permissionLevel: level,
      target,
      decision,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  /**
   * Convert risk level to permission level string
   */
  protected riskToPermissionLevel(risk: RiskLevel): 'none' | 'moderate' | 'dangerous' {
    switch (risk) {
      case RiskLevel.LOW:
        return 'none';
      case RiskLevel.MEDIUM:
        return 'moderate';
      case RiskLevel.HIGH:
        return 'dangerous';
      default:
        return 'moderate';
    }
  }

  /**
   * Extract target from arguments for audit logging
   */
  protected extractTarget(arguments_: Record<string, unknown>): string {
    const targetFields = ['file_path', 'path', 'filePath', 'url', 'command', 'query', 'pattern'];
    for (const field of targetFields) {
      if (arguments_[field] && typeof arguments_[field] === 'string') {
        const value = arguments_[field] as string;
        return value.length > 50 ? value.substring(0, 47) + '...' : value;
      }
    }
    return '(no target)';
  }
}

// ============================================================================
// DISCUSS STRATEGY (active dialogue mode)
// ============================================================================

/**
 * Discuss strategy - interactive mode with emphasis on dialogue
 */
class DiscussPermissionStrategy extends BasePermissionStrategy {
  private promptFn: PermissionPromptFunction;
  private throwOnError: boolean;

  constructor(config: PermissionStrategyConfig) {
    super('discuss', config);
    this.promptFn = config.promptFn ?? this.defaultPrompt;
    this.throwOnError = config.throwOnError ?? true;
  }

  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    const risk = classifyRisk(request.toolName, request.arguments);
    const target = this.extractTarget(request.arguments);

    // Always prompt in discuss mode to encourage interaction
    try {
      const granted = await this.promptFn(request, risk);

      if (granted) {
        this.addAuditEntry(request.toolName, risk, target, 'GRANTED');
      } else {
        this.addAuditEntry(request.toolName, risk, target, 'DENIED');
      }

      return {
        granted,
        mode: 'discuss',
        risk,
        reason: this.formatDiscussReason(request, risk, granted),
        requiredConfirmation: true,
      };
    } catch (error) {
      if (this.throwOnError) {
        throw new Error(
          `Permission system error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      this.addAuditEntry(request.toolName, risk, target, 'DENIED');

      return {
        granted: false,
        mode: 'discuss',
        risk,
        reason: 'Permission system error - denied',
        requiredConfirmation: false,
      };
    }
  }

  private formatDiscussReason(request: PermissionRequest, risk: RiskAssessment, granted: boolean): string {
    const reasons = risk.reasons.join(', ');
    return granted
      ? `Discussed and approved: ${request.toolName} (${risk.level} risk: ${reasons})`
      : `Discussed and denied: ${request.toolName} (${risk.level} risk: ${reasons})`;
  }

  private async defaultPrompt(_request: PermissionRequest, _risk: RiskAssessment): Promise<boolean> {
    throw new Error(
      'No prompt function provided. Set promptFn in config or use a different permission mode.'
    );
  }
}

// ============================================================================
// FUCKIT STRATEGY (extreme YOLO - suppress all warnings)
// ============================================================================

/**
 * Plan strategy - deny all write/destructive operations
 * Used for planning and exploration phases
 */
class PlanPermissionStrategy extends BasePermissionStrategy {
  constructor(config: PermissionStrategyConfig) {
    super('plan', config);
  }

  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    const risk = classifyRisk(request.toolName, request.arguments);
    const target = this.extractTarget(request.arguments);

    // Deny medium and high risk operations
    if (risk.level === RiskLevel.MEDIUM || risk.level === RiskLevel.HIGH) {
      this.addAuditEntry(request.toolName, risk, target, 'DENIED');

      return {
        granted: false,
        mode: 'plan',
        risk,
        reason: 'Plan mode - write operations disabled',
        requiredConfirmation: false,
      };
    }

    // Allow low-risk operations
    this.addAuditEntry(request.toolName, risk, target, 'GRANTED');

    return {
      granted: true,
      mode: 'plan',
      risk,
      reason: 'Plan mode - read-only operation allowed',
      requiredConfirmation: false,
    };
  }
}

// ============================================================================
// ASK STRATEGY (prompt for medium/high risk)
// ============================================================================

/**
 * Ask strategy - prompt user for medium/high risk operations
 * Default interactive mode
 */
class AskPermissionStrategy extends BasePermissionStrategy {
  private promptFn: PermissionPromptFunction;
  private throwOnError: boolean;

  constructor(config: PermissionStrategyConfig) {
    super('ask', config);
    this.promptFn = config.promptFn ?? this.defaultPrompt;
    this.throwOnError = config.throwOnError ?? true;
  }

  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    const risk = classifyRisk(request.toolName, request.arguments);
    const target = this.extractTarget(request.arguments);

    // Auto-approve low-risk operations
    if (risk.level === RiskLevel.LOW) {
      this.addAuditEntry(request.toolName, risk, target, 'GRANTED');

      return {
        granted: true,
        mode: 'ask',
        risk,
        reason: 'Low-risk operation auto-approved',
        requiredConfirmation: false,
      };
    }

    // Check cached decision
    const cached = await this.store.checkPermission(request.toolName);
    if (cached === 'allow') {
      this.addAuditEntry(request.toolName, risk, target, 'GRANTED');

      return {
        granted: true,
        mode: 'ask',
        risk,
        reason: 'Cached permission grant',
        requiredConfirmation: false,
      };
    } else if (cached === 'deny') {
      this.addAuditEntry(request.toolName, risk, target, 'DENIED');

      return {
        granted: false,
        mode: 'ask',
        risk,
        reason: 'Cached permission deny',
        requiredConfirmation: false,
      };
    }

    // Prompt user for medium/high-risk operations
    try {
      const granted = await this.promptFn(request, risk);

      if (granted) {
        this.addAuditEntry(request.toolName, risk, target, 'GRANTED');
        // Cache the decision for this session
        await this.recordDecision(request.toolName, 'allow', 'session');
      } else {
        this.addAuditEntry(request.toolName, risk, target, 'DENIED');
        await this.recordDecision(request.toolName, 'deny', 'session');
      }

      return {
        granted,
        mode: 'ask',
        risk,
        reason: granted ? 'User approved' : 'User denied',
        requiredConfirmation: true,
      };
    } catch (error) {
      if (this.throwOnError) {
        throw new Error(
          `Permission system error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      // Default deny on error
      this.addAuditEntry(request.toolName, risk, target, 'DENIED');

      return {
        granted: false,
        mode: 'ask',
        risk,
        reason: 'Permission system error - denied',
        requiredConfirmation: false,
      };
    }
  }

  /**
   * Default prompt function - throws error (requires platform-specific implementation)
   */
  private async defaultPrompt(_request: PermissionRequest, _risk: RiskAssessment): Promise<boolean> {
    throw new Error(
      'No prompt function provided. Set promptFn in config or use a different permission mode.'
    );
  }
}

// ============================================================================
// AUTO STRATEGY (auto-approve low, prompt medium/high)
// ============================================================================

/**
 * Auto strategy - smarter auto-approval based on risk
 */
class AutoPermissionStrategy extends BasePermissionStrategy {
  private promptFn: PermissionPromptFunction;
  private throwOnError: boolean;

  constructor(config: PermissionStrategyConfig) {
    super('auto', config);
    this.promptFn = config.promptFn ?? this.defaultPrompt;
    this.throwOnError = config.throwOnError ?? true;
  }

  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    const risk = classifyRisk(request.toolName, request.arguments);
    const target = this.extractTarget(request.arguments);

    // Auto-approve low and some medium risk based on confidence
    if (risk.level === RiskLevel.LOW || (risk.level === RiskLevel.MEDIUM && risk.confidence > 0.8)) {
      this.addAuditEntry(request.toolName, risk, target, 'GRANTED');

      return {
        granted: true,
        mode: 'auto',
        risk,
        reason: `Auto-approved (${risk.level} risk, ${(risk.confidence * 100).toFixed(0)}% confidence)`,
        requiredConfirmation: false,
      };
    }

    // Prompt for uncertain or high-risk operations
    try {
      const granted = await this.promptFn(request, risk);

      if (granted) {
        this.addAuditEntry(request.toolName, risk, target, 'GRANTED');
      } else {
        this.addAuditEntry(request.toolName, risk, target, 'DENIED');
      }

      return {
        granted,
        mode: 'auto',
        risk,
        reason: granted ? 'User approved' : 'User denied',
        requiredConfirmation: true,
      };
    } catch (error) {
      if (this.throwOnError) {
        throw new Error(
          `Permission system error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      this.addAuditEntry(request.toolName, risk, target, 'DENIED');

      return {
        granted: false,
        mode: 'auto',
        risk,
        reason: 'Permission system error - denied',
        requiredConfirmation: false,
      };
    }
  }

  private async defaultPrompt(_request: PermissionRequest, _risk: RiskAssessment): Promise<boolean> {
    throw new Error(
      'No prompt function provided. Set promptFn in config or use a different permission mode.'
    );
  }
}

// ============================================================================
// FUCKIT STRATEGY (extreme YOLO - suppress all warnings)
// ============================================================================

/**
 * Fuckit strategy - extreme YOLO mode
 * Suppresses all warnings, errors, and safety checks
 */
class FuckitPermissionStrategy extends BasePermissionStrategy {
  constructor(config: PermissionStrategyConfig) {
    super('fuckit', config);
  }

  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    const risk = classifyRisk(request.toolName, request.arguments);
    const target = this.extractTarget(request.arguments);

    // Always grant, no logging, no warnings
    this.addAuditEntry(request.toolName, risk, target, 'GRANTED');

    return {
      granted: true,
      mode: 'fuckit',
      risk,
      reason: 'FUCKIT mode - all operations approved, warnings suppressed',
      requiredConfirmation: false,
    };
  }
}

// ============================================================================
// UNIFIED PERMISSION MANAGER
// ============================================================================

/**
 * UnifiedPermissionManager - facade for all permission strategies
 *
 * This is the single entry point for permission handling across all platforms.
 * The strategy is selected based on the permission mode.
 *
 * @example
 * ```typescript
 * const manager = new UnifiedPermissionManager({
 *   mode: 'ask',
 *   promptFn: async (req, risk) => {
 *     console.log(`Allow ${req.toolName}? (risk: ${risk.level})`);
 *     return await readlinePrompt();
 *   }
 * });
 *
 * const response = await manager.checkPermission({
 *   toolName: 'write_file',
 *   arguments: { file_path: '/path/to/file', content: 'hello' },
 *   cwd: process.cwd()
 * });
 *
 * if (response.granted) {
 *   // Execute tool
 * }
 * ```
 */
export class UnifiedPermissionManager {
  private strategy: IPermissionStrategy;

  constructor(config: PermissionStrategyConfig) {
    this.strategy = this.createStrategy(config);
  }

  /**
   * Check if a permission should be granted
   */
  async checkPermission(request: PermissionRequest): Promise<PermissionResponse> {
    return this.strategy.checkPermission(request);
  }

  /**
   * Record a permission decision
   */
  async recordDecision(toolName: string, decision: PermissionDecision, scope: PermissionScope): Promise<void> {
    return this.strategy.recordDecision(toolName, decision, scope);
  }

  /**
   * Clear all cached permissions
   */
  async clearCache(): Promise<void> {
    return this.strategy.clearCache();
  }

  /**
   * Get the current permission mode
   */
  getMode(): PermissionMode {
    return this.strategy.getMode();
  }

  /**
   * Change the permission mode
   */
  setMode(mode: PermissionMode): void {
    const cwd = (this.strategy as BasePermissionStrategy)['cwd'];
    const store = (this.strategy as BasePermissionStrategy)['store'];
    const promptFn = (this.strategy as AskPermissionStrategy)['promptFn'];
    const throwOnError = (this.strategy as AskPermissionStrategy)['throwOnError'];

    this.strategy = this.createStrategy({ mode, cwd, store, promptFn, throwOnError });
  }

  /**
   * Get audit history
   */
  getAuditHistory(): PermissionAuditEntry[] {
    return this.strategy.getAuditHistory();
  }

  /**
   * Clear audit history
   */
  clearAuditHistory(): void {
    this.strategy.clearAuditHistory();
  }

  /**
   * Get the underlying strategy (for testing)
   */
  getStrategy(): IPermissionStrategy {
    return this.strategy;
  }

  /**
   * Create a strategy based on mode
   */
  private createStrategy(config: PermissionStrategyConfig): IPermissionStrategy {
    switch (config.mode) {
      case 'plan':
        return new PlanPermissionStrategy(config);
      case 'ask':
        return new AskPermissionStrategy(config);
      case 'auto':
        return new AutoPermissionStrategy(config);
      case 'discuss':
        return new DiscussPermissionStrategy(config);
      case 'fuckit':
        return new FuckitPermissionStrategy(config);
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new AskPermissionStrategy({ ...config, mode: 'ask' } as any);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a permission manager with the specified mode
 */
export function createPermissionManager(config: PermissionStrategyConfig): UnifiedPermissionManager {
  return new UnifiedPermissionManager(config);
}

/**
 * Create an ASK mode permission manager with custom prompt
 */
export function createAskManager(promptFn: PermissionPromptFunction): UnifiedPermissionManager {
  return new UnifiedPermissionManager({ mode: 'ask', promptFn });
}

/**
 * Create a PLAN mode permission manager (read-only)
 */
export function createPlanManager(): UnifiedPermissionManager {
  return new UnifiedPermissionManager({ mode: 'plan' });
}
