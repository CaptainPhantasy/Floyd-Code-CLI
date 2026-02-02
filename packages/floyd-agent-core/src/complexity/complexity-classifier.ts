/**
 * Complexity Classification System
 *
 * PHASE 3 ITEM 7: Task triage (LOW/MEDIUM/HIGH)
 *
 * Provides complexity assessment for agent tasks to enable:
 * - Resource allocation decisions
 * - Risk-based routing
 * - Timeout adjustment
 * - User expectation management
 */

/**
 * Complexity levels for task triage
 */
export enum ComplexityLevel {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
}

/**
 * Task type categories for classification
 */
export enum TaskType {
	FILE_OPERATION = 'file_operation',
	SEARCH = 'search',
	GIT_OPERATION = 'git_operation',
	CACHE_OPERATION = 'cache_operation',
	SYSTEM_OPERATION = 'system_operation',
	BROWSER_OPERATION = 'browser_operation',
	MULTI_FILE = 'multi_file',
	UNKNOWN = 'unknown',
}

/**
 * Complexity assessment result
 */
export interface ComplexityAssessment {
	level: ComplexityLevel;
	confidence: number; // 0-1
	reasons: string[];
	estimatedDuration?: number; // seconds
	riskFactors: string[];
}

/**
 * Task context for complexity assessment
 */
export interface TaskContext {
	type: TaskType;
	fileCount?: number;
	toolsToUse?: string[];
	hasDestructiveOps?: boolean;
	requiresVerification?: boolean;
	userProvidedPlan?: boolean;
	targetFiles?: string[];
}

/**
 * Assess task complexity based on context
 */
export function assessComplexity(context: TaskContext): ComplexityAssessment {
	const reasons: string[] = [];
	const riskFactors: string[] = [];
	let complexityScore = 0; // 0-100

	// Factor 1: File count (0-30 points)
	const fileCount = context.fileCount || (context.targetFiles?.length) || 1;
	if (fileCount === 1) {
		complexityScore += 5;
		reasons.push('Single file operation');
	} else if (fileCount <= 3) {
		complexityScore += 15;
		reasons.push('Small multi-file operation (2-3 files)');
	} else if (fileCount <= 10) {
		complexityScore += 30;
		reasons.push('Medium multi-file operation (4-10 files)');
		riskFactors.push('Coordination across multiple files');
	} else {
		complexityScore += 45;
		reasons.push('Large multi-file operation (10+ files)');
		riskFactors.push('High coordination complexity');
	}

	// Factor 2: Destructive operations (0-25 points)
	if (context.hasDestructiveOps) {
		complexityScore += 25;
		riskFactors.push('Destructive operations involved');
		reasons.push('Includes destructive operations (delete, move, etc.)');
	}

	// Factor 3: Task type (0-20 points)
	switch (context.type) {
		case TaskType.FILE_OPERATION:
			complexityScore += 5;
			reasons.push('Standard file operation');
			break;
		case TaskType.SEARCH:
			complexityScore += 10;
			reasons.push('Search and discovery');
			break;
		case TaskType.GIT_OPERATION:
			complexityScore += 15;
			riskFactors.push('Version control changes');
			reasons.push('Git operation');
			break;
		case TaskType.CACHE_OPERATION:
			complexityScore += 5;
			reasons.push('Cache operation');
			break;
		case TaskType.SYSTEM_OPERATION:
			complexityScore += 15;
			riskFactors.push('System-level changes');
			reasons.push('System operation');
			break;
		case TaskType.BROWSER_OPERATION:
			complexityScore += 10;
			reasons.push('Browser automation');
			break;
		case TaskType.MULTI_FILE:
			complexityScore += 20;
			riskFactors.push('Multi-file coordination');
			reasons.push('Explicit multi-file task');
			break;
		default:
			complexityScore += 10;
			reasons.push('Unknown task type');
	}

	// Factor 4: Verification required (0-10 points)
	if (context.requiresVerification) {
		complexityScore += 10;
		reasons.push('Verification required');
	}

	// Factor 5: User provided plan (reduces complexity)
	if (context.userProvidedPlan) {
		complexityScore = Math.max(0, complexityScore - 15);
		reasons.push('User provided implementation plan (reduces uncertainty)');
	}

	// Factor 6: Tool count (0-15 points)
	const toolCount = context.toolsToUse?.length || 0;
	if (toolCount > 5) {
		complexityScore += 15;
		reasons.push('Many tools required (' + toolCount + ' tools)');
	} else if (toolCount > 2) {
		complexityScore += 5;
		reasons.push('Multiple tools required (' + toolCount + ' tools)');
	}

	// Determine level and confidence
	let level: ComplexityLevel;
	let confidence: number;

	if (complexityScore < 30) {
		level = ComplexityLevel.LOW;
		confidence = 0.9;
	} else if (complexityScore < 60) {
		level = ComplexityLevel.MEDIUM;
		confidence = 0.75;
	} else {
		level = ComplexityLevel.HIGH;
		confidence = 0.8;
	}

	// Estimate duration (very rough heuristic)
	const estimatedDuration = Math.ceil(
		(level === ComplexityLevel.LOW ? 30 :
		 level === ComplexityLevel.MEDIUM ? 120 : 300) *
		(1 + (fileCount - 1) * 0.2)
	);

	return {
		level,
		confidence,
		reasons,
		estimatedDuration,
		riskFactors,
	};
}

/**
 * Quick complexity assessment from simple parameters
 */
export function quickAssess(
	fileCount: number,
	hasDestructive: boolean,
	toolCount: number
): ComplexityLevel {
	const assessment = assessComplexity({
		type: fileCount > 1 ? TaskType.MULTI_FILE : TaskType.FILE_OPERATION,
		fileCount,
		hasDestructiveOps: hasDestructive,
		toolsToUse: Array(toolCount).fill('tool'),
	});
	return assessment.level;
}

/**
 * Get timeout recommendation based on complexity
 */
export function getTimeoutForComplexity(level: ComplexityLevel): number {
	switch (level) {
		case ComplexityLevel.LOW:
			return 60000; // 1 minute
		case ComplexityLevel.MEDIUM:
			return 180000; // 3 minutes
		case ComplexityLevel.HIGH:
			return 600000; // 10 minutes
	}
}

/**
 * Get max turns recommendation based on complexity
 */
export function getMaxTurnsForComplexity(level: ComplexityLevel): number {
	switch (level) {
		case ComplexityLevel.LOW:
			return 10;
		case ComplexityLevel.MEDIUM:
			return 20;
		case ComplexityLevel.HIGH:
			return 40;
	}
}
