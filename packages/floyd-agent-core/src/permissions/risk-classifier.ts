/**
 * Risk Classifier
 *
 * Classifies tool operations by risk level.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.3
 */

/**
 * Risk level enumeration
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  /** Risk level */
  level: RiskLevel;
  /** Confidence (0-1) */
  confidence: number;
  /** Reasons for classification */
  reasons: string[];
  /** Tool name */
  toolName: string;
  /** Suggested action */
  suggestedAction?: string;
}

/**
 * Tool risk classifications
 */
const TOOL_RISK_MAP: Record<string, RiskLevel> = {
  // Low risk - read-only operations
  read_file: RiskLevel.LOW,
  read: RiskLevel.LOW,
  list_directory: RiskLevel.LOW,
  list_files: RiskLevel.LOW,
  find_files: RiskLevel.LOW,
  grep: RiskLevel.LOW,
  search: RiskLevel.LOW,
  search_files: RiskLevel.LOW,
  get_symbols: RiskLevel.LOW,
  get_file_info: RiskLevel.LOW,
  glob: RiskLevel.LOW,
  dispatch_agent: RiskLevel.LOW,

  // Medium risk - modifications with undo potential
  write_file: RiskLevel.MEDIUM,
  write: RiskLevel.MEDIUM,
  edit_file: RiskLevel.MEDIUM,
  edit: RiskLevel.MEDIUM,
  replace_in_file: RiskLevel.MEDIUM,
  create_directory: RiskLevel.MEDIUM,
  mkdir: RiskLevel.MEDIUM,
  copy_file: RiskLevel.MEDIUM,
  move_file: RiskLevel.MEDIUM,
  rename: RiskLevel.MEDIUM,

  // High risk - destructive or system-level operations
  delete_file: RiskLevel.HIGH,
  delete: RiskLevel.HIGH,
  remove: RiskLevel.HIGH,
  rm: RiskLevel.HIGH,
  execute_command: RiskLevel.HIGH,
  run_bash: RiskLevel.HIGH,
  bash: RiskLevel.HIGH,
  shell: RiskLevel.HIGH,
  terminal: RiskLevel.HIGH,
  browser_action: RiskLevel.MEDIUM,
  web_fetch: RiskLevel.LOW,
  git_push: RiskLevel.HIGH,
  git_commit: RiskLevel.MEDIUM,
  npm_install: RiskLevel.MEDIUM,
  npm_publish: RiskLevel.HIGH,
};

/**
 * Dangerous argument patterns
 */
const DANGEROUS_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  riskIncrease: number;
}> = [
  { pattern: /rm\s+-rf/i, reason: 'Recursive force delete', riskIncrease: 2 },
  { pattern: /sudo/i, reason: 'Root/admin execution', riskIncrease: 2 },
  { pattern: /chmod\s+777/i, reason: 'Insecure permissions', riskIncrease: 1 },
  { pattern: /\|\s*sh/i, reason: 'Piping to shell', riskIncrease: 1 },
  { pattern: /curl.*\|\s*(bash|sh)/i, reason: 'Remote script execution', riskIncrease: 2 },
  { pattern: /dd\s+if=/i, reason: 'Disk write operation', riskIncrease: 2 },
  { pattern: /mkfs/i, reason: 'Filesystem formatting', riskIncrease: 2 },
  { pattern: />\s*\/dev\//i, reason: 'Device write', riskIncrease: 2 },
  { pattern: /\/etc\/passwd|\/etc\/shadow/i, reason: 'System file access', riskIncrease: 2 },
  { pattern: /~\/\.|\/home\/.*\/\./i, reason: 'Dotfile modification', riskIncrease: 1 },
  { pattern: /\.env|\.git\/config/i, reason: 'Config/secrets file', riskIncrease: 1 },
  { pattern: /--force|--hard/i, reason: 'Force flag usage', riskIncrease: 1 },
];

/**
 * Safe path patterns (reduce risk)
 */
const SAFE_PATH_PATTERNS: RegExp[] = [
  /^\/tmp\//i,
  /^\.\/node_modules\//i,
  /^\.\/dist\//i,
  /^\.\/build\//i,
  /^\.\/\.cache\//i,
  /\.test\.(ts|js|tsx|jsx)$/i,
  /\.spec\.(ts|js|tsx|jsx)$/i,
  /__tests__\//i,
];

/**
 * Classify the risk level of a tool operation
 *
 * @param toolName - Name of the tool being called
 * @param arguments_ - Tool arguments
 * @returns Risk assessment
 */
export function classifyRisk(
  toolName: string,
  arguments_: Record<string, unknown>
): RiskAssessment {
  const reasons: string[] = [];
  let baseRisk = TOOL_RISK_MAP[toolName] ?? RiskLevel.MEDIUM;
  let confidence = 0.8;

  // Start with base risk reason
  if (baseRisk === RiskLevel.HIGH) {
    reasons.push(`Tool "${toolName}" is classified as high-risk`);
  } else if (baseRisk === RiskLevel.MEDIUM) {
    reasons.push(`Tool "${toolName}" modifies files or system`);
  } else {
    reasons.push(`Tool "${toolName}" is read-only`);
  }

  // Check arguments for dangerous patterns
  const argsString = JSON.stringify(arguments_);
  let riskScore = baseRisk === RiskLevel.HIGH ? 3 : baseRisk === RiskLevel.MEDIUM ? 2 : 1;

  for (const { pattern, reason, riskIncrease } of DANGEROUS_PATTERNS) {
    if (pattern.test(argsString)) {
      riskScore += riskIncrease;
      reasons.push(reason);
      confidence = Math.min(confidence + 0.05, 1);
    }
  }

  // Check for safe paths (reduce risk)
  const targetPath = extractPath(arguments_);
  if (targetPath) {
    for (const safePattern of SAFE_PATH_PATTERNS) {
      if (safePattern.test(targetPath)) {
        riskScore = Math.max(1, riskScore - 1);
        reasons.push(`Target is in a safe location: ${targetPath}`);
        break;
      }
    }
  }

  // Determine final risk level
  let finalLevel: RiskLevel;
  if (riskScore >= 4) {
    finalLevel = RiskLevel.HIGH;
  } else if (riskScore >= 2) {
    finalLevel = RiskLevel.MEDIUM;
  } else {
    finalLevel = RiskLevel.LOW;
  }

  // Generate suggested action
  let suggestedAction: string | undefined;
  if (finalLevel === RiskLevel.HIGH) {
    suggestedAction = 'Review carefully before approving';
  } else if (finalLevel === RiskLevel.MEDIUM) {
    suggestedAction = 'Consider the implications before proceeding';
  }

  return {
    level: finalLevel,
    confidence,
    reasons,
    toolName,
    suggestedAction,
  };
}

/**
 * Extract path from tool arguments
 */
function extractPath(arguments_: Record<string, unknown>): string | null {
  const pathKeys = ['file_path', 'path', 'filePath', 'target', 'destination', 'src', 'dest'];
  for (const key of pathKeys) {
    if (typeof arguments_[key] === 'string') {
      return arguments_[key] as string;
    }
  }
  return null;
}

/**
 * Check if a tool is always low risk
 */
export function isAlwaysLowRisk(toolName: string): boolean {
  return TOOL_RISK_MAP[toolName] === RiskLevel.LOW;
}

/**
 * Check if a tool is always high risk
 */
export function isAlwaysHighRisk(toolName: string): boolean {
  return TOOL_RISK_MAP[toolName] === RiskLevel.HIGH;
}

/**
 * Get default risk level for a tool
 */
export function getDefaultRiskLevel(toolName: string): RiskLevel {
  return TOOL_RISK_MAP[toolName] ?? RiskLevel.MEDIUM;
}
