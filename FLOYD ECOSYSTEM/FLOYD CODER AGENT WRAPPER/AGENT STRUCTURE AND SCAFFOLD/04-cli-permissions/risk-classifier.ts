/**
 * Risk Classifier for Permission Requests
 *
 * Classifies tool calls by risk level based on:
 * - Tool name patterns (read vs write, dangerous operations)
 * - Argument content analysis (file paths, URLs, commands)
 * - Context (whether it modifies data, accesses network, etc.)
 */

export enum RiskLevel {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

export interface RiskAssessment {
	level: RiskLevel;
	reasons: string[];
	confidence: number; // 0-1
}

// High-risk tool patterns
const HIGH_RISK_PATTERNS = [
	/^write/i,
	/^delete/i,
	/^remove/i,
	/^exec/i,
	/^run/i,
	/^bash/i,
	/^shell/i,
	/^cmd/i,
	/^system/i,
	/^network/i,
	/^http/i,
	/^fetch/i,
	/^curl/i,
	/^wget/i,
	/mcp__plugin_figma/,
];

// Medium-risk tool patterns
const MEDIUM_RISK_PATTERNS = [
	/^edit/i,
	/^modify/i,
	/^update/i,
	/^create/i,
	/^mkdir/i,
	/^copy/i,
	/^move/i,
	/^rename/i,
	/mcp__plugin_playwright/,
	/mcp__plugin_Notion/,
];

// Low-risk tool patterns (read-only operations)
const LOW_RISK_PATTERNS = [
	/^read/i,
	/^get/i,
	/^list/i,
	/^find/i,
	/^search/i,
	/^grep/i,
	/^cat/i,
	/^show/i,
	/^view/i,
	/^fetch/i, // HTTP GET is low risk
	/^query/i,
	/^inspect/i,
];

// Dangerous argument patterns
const DANGEROUS_ARG_PATTERNS: RegExp[] = [
	/rm\s+-rf/i, // Recursive delete
	/:\s*delete/i, // Database delete
	/drop\s+table/i, // SQL drop
	/format/i, // Disk format
	/shred/i, // Secure delete
	/>\/dev\/null/i, // Output redirection (could hide malicious activity)
	/\|.*rm.*,/i, // Piped delete
	/eval/i, // Code evaluation
	/exec/i, // Command execution in args
	/http.*POST/i, // Non-GET HTTP requests
	/http.*DELETE/i,
	/http.*PUT/i,
];

// Sensitive file patterns
const SENSITIVE_FILE_PATTERNS = [
	/\.env$/i,
	/\.pem$/i,
	/\.key$/i,
	/\.ssh\//i,
	/\/etc\//i,
	/\.config\/.*\.json$/i,
	/credentials/i,
	/secret/i,
	/password/i,
	/token/i,
	/\.floyd\/settings\.json$/,
	/\.floyd\/permissions\.json$/,
];

/**
 * Classify a tool call by risk level
 * UNRESTRICTED YOLO MODE - ALL TOOLS ARE LOW RISK
 */
export function classifyRisk(
	_toolName: string,
	_arguments_: Record<string, unknown> = {},
): RiskAssessment {
	// UNRESTRICTED: All operations treated as LOW risk
	return {
		level: RiskLevel.LOW,
		reasons: ['YOLO mode - all operations auto-approved'],
		confidence: 1.0,
	};
}

/**
 * Get a human-readable description of the risk level
 */
export function getRiskDescription(level: RiskLevel): string {
	switch (level) {
		case RiskLevel.LOW:
			return 'Read-only operation, minimal side effects';
		case RiskLevel.MEDIUM:
			return 'May modify data or access external resources';
		case RiskLevel.HIGH:
			return 'Destructive operation or significant system change';
		default:
			return 'Unknown risk level';
	}
}

/**
 * Get recommended action for a risk level
 * UNRESTRICTED YOLO MODE - ALWAYS ALLOW
 */
export function getRecommendedAction(
	_level: RiskLevel,
): 'allow' | 'ask' | 'deny' {
	// UNRESTRICTED: Always allow, never ask, never deny
	return 'allow';
}
