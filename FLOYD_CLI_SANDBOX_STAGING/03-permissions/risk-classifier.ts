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
 */
export function classifyRisk(
	toolName: string,
	arguments_: Record<string, unknown> = {},
): RiskAssessment {
	const reasons: string[] = [];
	let level = RiskLevel.LOW;
	let confidence = 0.8;

	// Check tool name patterns
	// const toolNameLower = toolName.toLowerCase(); // Not used, keeping for reference

	// High-risk tools
	for (const pattern of HIGH_RISK_PATTERNS) {
		if (pattern.test(toolName)) {
			level = RiskLevel.HIGH;
			reasons.push(`Tool matches high-risk pattern: ${pattern.source}`);
			confidence = 0.9;
			break;
		}
	}

	// Medium-risk tools
	if (level === RiskLevel.LOW) {
		for (const pattern of MEDIUM_RISK_PATTERNS) {
			if (pattern.test(toolName)) {
				level = RiskLevel.MEDIUM;
				reasons.push(`Tool matches medium-risk pattern: ${pattern.source}`);
				confidence = 0.85;
				break;
			}
		}
	}

	// Low-risk confirmation
	if (level === RiskLevel.LOW) {
		for (const pattern of LOW_RISK_PATTERNS) {
			if (pattern.test(toolName)) {
				reasons.push(
					`Tool matches low-risk (read-only) pattern: ${pattern.source}`,
				);
				confidence = 0.9;
				break;
			}
		}
	}

	// Check arguments for danger signals
	const argsString = JSON.stringify(arguments_);
	for (const pattern of DANGEROUS_ARG_PATTERNS) {
		if (pattern.test(argsString)) {
			// Escalate to at least medium, potentially high
			if (level === RiskLevel.LOW) {
				level = RiskLevel.MEDIUM;
			}
			reasons.push(
				`Arguments contain potentially dangerous pattern: ${pattern.source}`,
			);
			confidence = Math.max(confidence, 0.7);
		}
	}

	// Check for sensitive file access
	for (const pattern of SENSITIVE_FILE_PATTERNS) {
		if (pattern.test(argsString)) {
			// Escalate to at least medium
			if (level === RiskLevel.LOW) {
				level = RiskLevel.MEDIUM;
			}
			reasons.push(`Accessing sensitive file/path: ${pattern.source}`);
			confidence = Math.max(confidence, 0.75);
		}
	}

	// Check for network operations
	if (argsString.includes('http://') || argsString.includes('https://')) {
		if (level === RiskLevel.LOW) {
			level = RiskLevel.MEDIUM;
		}
		reasons.push('Network operation detected');
	}

	// Check for large write operations (could be destructive)
	if (
		arguments_['content'] &&
		typeof arguments_['content'] === 'string' &&
		arguments_['content'].length > 10000
	) {
		if (level === RiskLevel.LOW) {
			level = RiskLevel.MEDIUM;
		}
		reasons.push('Large content write (>10KB characters)');
	}

	// Fallback reason if no specific reasons found
	if (reasons.length === 0) {
		reasons.push(
			'Tool behavior not explicitly categorized - using default assessment',
		);
		confidence = 0.5;
	}

	return {
		level,
		reasons,
		confidence,
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
 */
export function getRecommendedAction(
	level: RiskLevel,
): 'allow' | 'ask' | 'deny' {
	switch (level) {
		case RiskLevel.LOW:
			return 'allow'; // Can be auto-approved
		case RiskLevel.MEDIUM:
			return 'ask'; // Should prompt user
		case RiskLevel.HIGH:
			return 'ask'; // Must prompt user
		default:
			return 'ask';
	}
}
