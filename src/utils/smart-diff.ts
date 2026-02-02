/**
 * Smart Diff Analyzer
 *
 * Purpose: Intelligently analyze git diffs and categorize changes by severity and type
 * Exports: SmartDiffAnalyzer, DiffChangeCategory, DiffSeverity, DiffSummary
 * Related: diff-parser.ts, prefix-parser.ts
 *
 * Features:
 * - Parse git diff output into structured format
 * - Identify file types using extension patterns
 * - Categorize changes by severity (breaking, feature, fix, refactor, chore)
 * - Detect potentially dangerous patterns
 * - Generate structured summaries
 */

import {parseDiff, DiffFile, DiffLine, DiffHunk} from './diff-parser.js';
import {parsePrefixMode} from './prefix-parser.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Severity levels for diff changes
 */
export enum DiffSeverity {
	/** Breaking changes - API modifications, deleted functions, etc. */
	BREAKING = 'breaking',
	/** New features - added functions, new capabilities */
	FEATURE = 'feature',
	/** Bug fixes - error handling, corrections */
	FIX = 'fix',
	/** Refactoring - code reorganization without functional changes */
	REFACTOR = 'refactor',
	/** Chores - comments, formatting, minor tweaks */
	CHORE = 'chore',
	/** Unknown - unable to categorize */
	UNKNOWN = 'unknown',
}

/**
 * File type categories for pattern matching
 */
export enum FileType {
	/** TypeScript/JavaScript files */
	SCRIPT = 'script',
	/** Style files (CSS, SCSS, LESS) */
	STYLE = 'style',
	/** Markup files (HTML, JSX, TSX) */
	MARKUP = 'markup',
	/** Data files (JSON, YAML, XML) */
	DATA = 'data',
	/** Documentation (MD, TXT) */
	DOC = 'doc',
	/** Configuration files */
	CONFIG = 'config',
	/** Test files */
	TEST = 'test',
	/** Binary files */
	BINARY = 'binary',
	/** Unknown file type */
	UNKNOWN = 'unknown',
}

/**
 * Individual change detection result
 */
export interface DiffChange {
	/** File containing the change */
	filePath: string;
	/** Line number of the change */
	lineNumber: number;
	/** Type of change (added/deleted) */
	changeType: 'added' | 'deleted';
	/** The line content */
	content: string;
	/** Detected severity */
	severity: DiffSeverity;
	/** Reason for categorization */
	reason: string;
	/** Patterns that matched */
	patterns: string[];
}

/**
 * Analysis result for a single file
 */
export interface FileAnalysis {
	/** File path */
	filePath: string;
	/** File type */
	fileType: FileType;
	/** Whether this is a new file */
	newFile: boolean;
	/** Whether this is a deleted file */
	deletedFile: boolean;
	/** Number of lines added */
	additions: number;
	/** Number of lines deleted */
	deletions: number;
	/** Overall severity for this file */
	severity: DiffSeverity;
	/** Detected changes in this file */
	changes: DiffChange[];
	/** Risk score (0-100) */
	riskScore: number;
}

/**
 * Complete diff analysis summary
 */
export interface DiffSummary {
	/** Total number of files changed */
	totalFiles: number;
	/** Total lines added */
	totalAdditions: number;
	/** Total lines deleted */
	totalDeletions: number;
	/** Files by severity */
	filesBySeverity: Record<DiffSeverity, number>;
	/** Riskiest files (top 5) */
	riskiestFiles: FileAnalysis[];
	/** All file analyses */
	files: FileAnalysis[];
	/** Overall risk score (0-100) */
	overallRiskScore: number;
	/** Warnings and recommendations */
	warnings: string[];
	/** Recommendations for review */
	recommendations: string[];
}

/**
 * Configuration options for smart diff analysis
 */
export interface SmartDiffOptions {
	/** Custom file type patterns */
	fileTypePatterns?: Record<FileType, RegExp[]>;
	/** Custom severity patterns */
	severityPatterns?: SeverityPatternConfig;
	/** Include unchanged files */
	includeUnchanged?: boolean;
	/** Maximum context lines to analyze */
	maxContextLines?: number;
	/** Enable experimental pattern detection */
	experimentalPatterns?: boolean;
}

/**
 * Pattern configuration for severity detection
 */
export interface SeverityPatternConfig {
	breaking?: RegExp[];
	feature?: RegExp[];
	fix?: RegExp[];
	refactor?: RegExp[];
	chore?: RegExp[];
}

// ============================================================================
// DEFAULT PATTERNS
// ============================================================================

/**
 * Default file extension patterns for each file type
 */
const DEFAULT_FILE_PATTERNS: Record<FileType, RegExp[]> = {
	[FileType.SCRIPT]: [
		/\.(ts|tsx|js|jsx|mjs|cjs)$/,
		/\.mts$/,
		/\.cts$/,
	],
	[FileType.STYLE]: [/\.(css|scss|sass|less|stylus|pcss|postcss)$/],
	[FileType.MARKUP]: [/\.(html|htm|xml|xhtml|jsx|tsx)$/],
	[FileType.DATA]: [/\.(json|yaml|yml|xml|toml|ini|env|config)$/],
	[FileType.DOC]: [/\.(md|markdown|txt|rst|adoc)$/],
	[FileType.CONFIG]: [
		/\.(conf|cfg|config|ini|toml)$/,
		/^\.(eslint|prettier|babel|tslint)$/i,
		/^(package\.json|tsconfig\.json)$/i,
		/\.gitignore$/i,
	],
	[FileType.TEST]: [
		/\.test\.(ts|tsx|js|jsx)$/,
		/\.spec\.(ts|tsx|js|jsx)$/,
		/__tests__\//,
		/\/test(s)?\//,
	],
	[FileType.BINARY]: [
		/\.(png|jpg|jpeg|gif|bmp|ico|svg|webp)$/,
		/\.(woff|woff2|ttf|eot|otf)$/,
		/\.(zip|tar|gz|rar|7z)$/,
		/\.(pdf|doc|docx|xls|xlsx)$/,
	],
	[FileType.UNKNOWN]: [/./],
};

/**
 * Default severity patterns for change detection
 */
const DEFAULT_SEVERITY_PATTERNS: SeverityPatternConfig = {
	// BREAKING: API changes, deletions, major modifications
	breaking: [
		// Function/method deletions
		/^-.*function\s+\w+/,
		/^-.*const\s+\w+\s*=\s*\(.*\)\s*=>/,
		/^-.*export\s+(const|function|class|type|interface)/,
		// Type/interface deletions or major changes
		/^-.*interface\s+\w+/,
		/^-.*type\s+\w+/,
		/^-.*class\s+\w+/,
		// Public API changes
		/^-.*public\s+\w+/,
		/^-.*async\s+def\s+\w+/, // Python async methods
		// Breaking keyword indicators
		/.*(BREAKING|breaking|deprecated|remove|delete)\b.*/,
		/^[\+\-].*TODO.*break/,
	],

	// FEATURE: New additions, capabilities
	feature: [
		// New functions/methods
		/^\+.*function\s+\w+/,
		/^\+.*const\s+\w+\s*=\s*\(.*\)\s*=>/,
		/^\+.*export\s+(const|function|class|type|interface)/,
		// New types/interfaces
		/^\+.*interface\s+\w+/,
		/^\+.*type\s+\w+/,
		/^\+.*class\s+\w+/,
		// New public methods
		/^\+.*public\s+\w+/,
		/^\+.*async\s+def\s+\w+/, // Python async methods
		// Feature keywords
		/.*(feat|feature|add|implement)\b.*/,
		/^[\+\-].*TODO.*feat/,
	],

	// FIX: Bug fixes, error handling
	fix: [
		// Error handling additions
		/^\+.*try\s*{/,
		/^\+.*catch\s*\(/,
		/^\+.*throw\s+new\s+Error/,
		/^\+.*if\s*\([^)]*error\)/,
		/^\+.*\.catch\(/,
		// Fix keywords
		/.*(fix|bug|error|issue|correct)\b.*/,
		/^[\+\-].*TODO.*fix/,
		// Null checks
		/^\+.*!\s*\w+\s*\?/,
		/^\+.*\?\?\s*/,
	],

	// REFACTOR: Code reorganization, name changes
	refactor: [
		// Rename patterns
		/^[-+].*\/\/.*rename/i,
		/^[-+].*\/\/.*move/i,
		// Import reorganization (check this before chore comments)
		/^[-+]import\s+.*from/,
		// Whitespace and formatting
		/^[-+]\s*$/,
		// Extract/inline patterns
		/^[-+].*extract/i,
		/^[-+].*inline/i,
		// Refactor keywords
		/.*(refactor|clean|optimize|simplify)\b.*/,
	],

	// CHORE: Comments, docs, minor tweaks
	chore: [
		// Comments only (but not imports which may start with comment chars)
		/^[-+]\s*\/\/[^a-z]/i,
		/^[-+]\s*#/,
		/^[-+]\s*\*(?!\/)/,
		// Docstring/comment blocks
		/^[-+].*\*\//,
		// Chore keywords
		/.*(chore|docs|update|tweak|adjust)\b.*/,
		// Minor version/config changes
		/^[-+].*version.*[0-9]+\.[0-9]+\.[0-9]+/,
	],
};

/**
 * Risk assessment patterns
 */
const RISK_PATTERNS = {
	high: [
		// Deleting exports
		/^-.*export/,
		// Deleting public APIs
		/^-.*public\s+(static\s+)?(\w+)/,
		// Type deletions
		/^-.*(interface|type|class)\s+\w+/,
		// Breaking changes
		/.*(breaking|deprecated|remove)/i,
		// Test deletions
		/^-.*\.(test|spec)\./,
	],
	medium: [
		// Adding exports (could break if signature differs)
		/^\+.*export/,
		// Modifying functions
		/^(?:\+|-).*(function|const\s+\w+\s*=)/,
		// Type changes
		/^(?:\+|-).*(interface|type)\s+\w+/,
	],
	low: [
		// Comments
		/^(?:\+|-)\s*\/\//,
		/^(?:\+|-)\s*\/\*\*/,
		// Whitespace
		/^(?:\+|-)\s*$/,
		// Import changes
		/^(?:\+|-).*import\s+.*from/,
	],
};

// ============================================================================
// SMART DIFF ANALYZER
// ============================================================================

/**
 * Main analyzer class for smart diff analysis
 */
export class SmartDiffAnalyzer {
	private options: SmartDiffOptions;
	private fileTypePatterns: Record<FileType, RegExp[]>;
	private severityPatterns: SeverityPatternConfig;

	/**
	 * Create a new SmartDiffAnalyzer
	 *
	 * @param options - Configuration options
	 */
	constructor(options: SmartDiffOptions = {}) {
		this.options = {
			includeUnchanged: false,
			maxContextLines: 3,
			experimentalPatterns: false,
			...options,
		};

		this.fileTypePatterns =
			options.fileTypePatterns ?? DEFAULT_FILE_PATTERNS;
		this.severityPatterns = this.mergeSeverityPatterns(
			options.severityPatterns,
		);
	}

	/**
	 * Analyze a git diff string
	 *
	 * @param diffInput - Raw git diff output
	 * @returns Complete diff summary
	 */
	public analyze(diffInput: string): DiffSummary {
		// Handle empty diff
		if (!diffInput || diffInput.trim() === '') {
			return {
				totalFiles: 0,
				totalAdditions: 0,
				totalDeletions: 0,
				filesBySeverity: {
					[DiffSeverity.BREAKING]: 0,
					[DiffSeverity.FEATURE]: 0,
					[DiffSeverity.FIX]: 0,
					[DiffSeverity.REFACTOR]: 0,
					[DiffSeverity.CHORE]: 0,
					[DiffSeverity.UNKNOWN]: 0,
				},
				riskiestFiles: [],
				files: [],
				overallRiskScore: 0,
				warnings: [],
				recommendations: [],
			};
		}

		// Parse the diff
		const diffFiles = parseDiff(diffInput, {
			includeUnchanged: this.options.includeUnchanged ?? false,
			trackLineNumbers: true,
		});

		// Analyze each file
		const fileAnalyses: FileAnalysis[] = diffFiles
			.filter((file) => !file.binary)
			.filter((file) => file.hunks.length > 0 || file.newFile || file.deletedFile)
			.map((file) => this.analyzeFile(file));

		// Calculate overall summary
		const summary = this.calculateSummary(fileAnalyses);

		return summary;
	}

	/**
	 * Analyze a single file diff
	 *
	 * @param file - Parsed diff file
	 * @returns File analysis result
	 */
	private analyzeFile(file: DiffFile): FileAnalysis {
		const fileType = this.detectFileType(file.path);
		const changes: DiffChange[] = [];
		let additions = 0;
		let deletions = 0;

		// Analyze each hunk in the file
		for (const hunk of file.hunks) {
			for (const line of hunk.lines) {
				if (line.type === 'added') {
					additions++;
				} else if (line.type === 'deleted') {
					deletions++;
				}

				// Skip unchanged lines for change detection
				if (line.type === 'unchanged') {
					continue;
				}

				// Categorize the change
				const change = this.categorizeChange(
					file.path,
					line,
					fileType,
				);
				changes.push(change);
			}
		}

		// Determine overall severity for the file
		const severity = this.determineFileSeverity(changes, fileType);

		// Calculate risk score
		const riskScore = this.calculateRiskScore(
			changes,
			fileType,
			file.newFile,
			file.deletedFile,
		);

		return {
			filePath: file.path,
			fileType,
			newFile: file.newFile,
			deletedFile: file.deletedFile,
			additions,
			deletions,
			severity,
			changes,
			riskScore,
		};
	}

	/**
	 * Detect the type of a file based on its path
	 *
	 * @param filePath - Path to the file
	 * @returns Detected file type
	 */
	private detectFileType(filePath: string): FileType {
		// Check test files first
		if (DEFAULT_FILE_PATTERNS[FileType.TEST].some((p) => p.test(filePath))) {
			return FileType.TEST;
		}

		// Check other types in order
		for (const [type, patterns] of Object.entries(DEFAULT_FILE_PATTERNS)) {
			if (type === FileType.TEST || type === FileType.UNKNOWN) {
				continue;
			}
			if (patterns.some((p) => p.test(filePath))) {
				return type as FileType;
			}
		}

		return FileType.UNKNOWN;
	}

	/**
	 * Categorize a single change line
	 *
	 * @param filePath - File path
	 * @param line - Diff line
	 * @param fileType - File type
	 * @returns Categorized change
	 */
	private categorizeChange(
		filePath: string,
		line: DiffLine,
		fileType: FileType,
	): DiffChange {
		const content = line.content;
		const changeType: 'added' | 'deleted' = line.type as 'added' | 'deleted';
		const prefix = changeType === 'added' ? '+' : '-';

		// Try to match against severity patterns
		for (const [severity, patterns] of Object.entries(this.severityPatterns)) {
			if (!patterns) continue;

			for (const pattern of patterns) {
				if (pattern.test(content)) {
					return {
						filePath,
						lineNumber: changeType === 'added'
							? line.newLineNumber ?? 0
							: line.oldLineNumber ?? 0,
						changeType,
						content,
						severity: severity as DiffSeverity,
						reason: `Matched pattern: ${pattern.source}`,
						patterns: [pattern.source],
					};
				}
			}
		}

		// Default categorization based on change type and file type
		const defaultSeverity = this.getDefaultSeverity(
			changeType,
			fileType,
			content,
		);

		return {
			filePath,
			lineNumber: changeType === 'added'
				? line.newLineNumber ?? 0
				: line.oldLineNumber ?? 0,
			changeType,
			content,
			severity: defaultSeverity,
			reason: `Default categorization for ${changeType} in ${fileType} file`,
			patterns: [],
		};
	}

	/**
	 * Get default severity when no patterns match
	 *
	 * @param changeType - Type of change
	 * @param fileType - Type of file
	 * @param content - Line content
	 * @returns Default severity
	 */
	private getDefaultSeverity(
		changeType: 'added' | 'deleted',
		fileType: FileType,
		content: string,
	): DiffSeverity {
		// Deletions are generally more severe
		if (changeType === 'deleted') {
			if (fileType === FileType.SCRIPT) {
				return content.trim().startsWith('export')
					? DiffSeverity.BREAKING
					: DiffSeverity.REFACTOR;
			}
			return DiffSeverity.REFACTOR;
		}

		// Additions depend on content
		if (fileType === FileType.SCRIPT || fileType === FileType.MARKUP) {
			return DiffSeverity.FEATURE;
		}
		if (fileType === FileType.DOC) {
			return DiffSeverity.CHORE;
		}
		if (fileType === FileType.CONFIG) {
			return DiffSeverity.CHORE;
		}
		if (fileType === FileType.TEST) {
			return DiffSeverity.FIX;
		}

		return DiffSeverity.UNKNOWN;
	}

	/**
	 * Determine overall file severity based on all changes
	 *
	 * @param changes - All changes in the file
	 * @param fileType - File type
	 * @returns Overall severity
	 */
	private determineFileSeverity(
		changes: DiffChange[],
		fileType: FileType,
	): DiffSeverity {
		if (changes.length === 0) {
			return DiffSeverity.CHORE;
		}

		// Check for breaking changes first
		const hasBreaking = changes.some((c) => c.severity === DiffSeverity.BREAKING);
		if (hasBreaking) {
			return DiffSeverity.BREAKING;
		}

		// Count severities
		const severityCounts: Record<DiffSeverity, number> = {
			[DiffSeverity.BREAKING]: 0,
			[DiffSeverity.FEATURE]: 0,
			[DiffSeverity.FIX]: 0,
			[DiffSeverity.REFACTOR]: 0,
			[DiffSeverity.CHORE]: 0,
			[DiffSeverity.UNKNOWN]: 0,
		};

		for (const change of changes) {
			severityCounts[change.severity]++;
		}

		// Determine dominant severity
		const maxCount = Math.max(...Object.values(severityCounts));
		const dominantSeverities = Object.entries(severityCounts)
			.filter(([, count]) => count === maxCount)
			.map(([severity]) => severity as DiffSeverity);

		// Return highest priority among dominant severities
		const priorityOrder = [
			DiffSeverity.BREAKING,
			DiffSeverity.FEATURE,
			DiffSeverity.FIX,
			DiffSeverity.REFACTOR,
			DiffSeverity.CHORE,
			DiffSeverity.UNKNOWN,
		];

		for (const priority of priorityOrder) {
			if (dominantSeverities.includes(priority)) {
				return priority;
			}
		}

		return DiffSeverity.UNKNOWN;
	}

	/**
	 * Calculate risk score for a file (0-100)
	 *
	 * @param changes - All changes in the file
	 * @param fileType - File type
	 * @param isNewFile - Whether this is a new file
	 * @param isDeletedFile - Whether this is a deleted file
	 * @returns Risk score (0-100)
	 */
	private calculateRiskScore(
		changes: DiffChange[],
		fileType: FileType,
		isNewFile: boolean,
		isDeletedFile: boolean,
	): number {
		let score = 0;

		// Base score for file status
		if (isDeletedFile) {
			score += 50; // Deleting files is risky
		} else if (isNewFile) {
			score += 10; // New files are low risk
		}

		// Score based on severity counts
		for (const change of changes) {
			switch (change.severity) {
				case DiffSeverity.BREAKING:
					score += 25;
					break;
				case DiffSeverity.FEATURE:
					score += 10;
					break;
				case DiffSeverity.FIX:
					score += 5;
					break;
				case DiffSeverity.REFACTOR:
					score += 3;
					break;
				case DiffSeverity.CHORE:
					score += 1;
					break;
				default:
					score += 2;
			}
		}

		// Adjust based on file type
		if (fileType === FileType.CONFIG) {
			score *= 1.2; // Config changes are riskier
		} else if (fileType === FileType.TEST) {
			score *= 0.5; // Test changes are less risky
		} else if (fileType === FileType.DOC) {
			score *= 0.3; // Doc changes are very low risk
		}

		// Normalize to 0-100
		return Math.min(100, Math.max(0, Math.round(score)));
	}

	/**
	 * Calculate overall summary from all file analyses
	 *
	 * @param files - All file analyses
	 * @returns Complete diff summary
	 */
	private calculateSummary(files: FileAnalysis[]): DiffSummary {
		const totalFiles = files.length;
		let totalAdditions = 0;
		let totalDeletions = 0;
		const filesBySeverity: Record<DiffSeverity, number> = {
			[DiffSeverity.BREAKING]: 0,
			[DiffSeverity.FEATURE]: 0,
			[DiffSeverity.FIX]: 0,
			[DiffSeverity.REFACTOR]: 0,
			[DiffSeverity.CHORE]: 0,
			[DiffSeverity.UNKNOWN]: 0,
		};

		for (const file of files) {
			totalAdditions += file.additions;
			totalDeletions += file.deletions;
			filesBySeverity[file.severity]++;
		}

		// Sort by risk score
		const riskiestFiles = [...files]
			.sort((a, b) => b.riskScore - a.riskScore)
			.slice(0, 5);

		// Calculate overall risk score
		const overallRiskScore =
			files.length > 0
				? Math.round(
						files.reduce((sum, f) => sum + f.riskScore, 0) / files.length,
					)
				: 0;

		// Generate warnings and recommendations
		const {warnings, recommendations} = this.generateInsights(files);

		return {
			totalFiles,
			totalAdditions,
			totalDeletions,
			filesBySeverity,
			riskiestFiles,
			files,
			overallRiskScore,
			warnings,
			recommendations,
		};
	}

	/**
	 * Generate warnings and recommendations from analysis
	 *
	 * @param files - All file analyses
	 * @returns Warnings and recommendations
	 */
	private generateInsights(files: FileAnalysis[]): {
		warnings: string[];
		recommendations: string[];
	} {
		const warnings: string[] = [];
		const recommendations: string[] = [];

		// Check for breaking changes
		const breakingFiles = files.filter(
			(f) => f.severity === DiffSeverity.BREAKING,
		);
		if (breakingFiles.length > 0) {
			warnings.push(
				`⚠️  ${breakingFiles.length} file(s) with breaking changes detected`,
			);
			recommendations.push(
				'Review breaking changes carefully and update version accordingly',
			);
		}

		// Check for high-risk files
		const highRiskFiles = files.filter((f) => f.riskScore >= 70);
		if (highRiskFiles.length > 0) {
			warnings.push(
				`⚠️  ${highRiskFiles.length} high-risk file(s) (risk score ≥ 70)`,
			);
			for (const file of highRiskFiles) {
				warnings.push(`   - ${file.filePath} (${file.riskScore}/100)`);
			}
		}

		// Check for test changes
		const testChanges = files.filter((f) => f.fileType === FileType.TEST);
		if (testChanges.length > 0) {
			const testAdditions = testChanges.reduce(
				(sum, f) => sum + f.additions,
				0,
			);
			recommendations.push(
				`${testAdditions} test line(s) added - ensure tests pass`,
			);
		}

		// Check for config changes
		const configChanges = files.filter(
			(f) => f.fileType === FileType.CONFIG,
		);
		if (configChanges.length > 0) {
			warnings.push(
				`⚠️  Configuration files changed: ${configChanges.map((f) => f.filePath).join(', ')}`,
			);
			recommendations.push(
				'Verify configuration changes are compatible with deployment',
			);
		}

		// Check for deleted files
		const deletedFiles = files.filter((f) => f.deletedFile);
		if (deletedFiles.length > 0) {
			warnings.push(
				`🗑️  ${deletedFiles.length} file(s) deleted: ${deletedFiles.map((f) => f.filePath).join(', ')}`,
			);
		}

		// Check for new files
		const newFiles = files.filter((f) => f.newFile);
		if (newFiles.length > 0) {
			recommendations.push(
				`${newFiles.length} new file(s) added - ensure they are properly documented`,
			);
		}

		// Overall risk assessment
		const avgRisk =
			files.length > 0
				? files.reduce((sum, f) => sum + f.riskScore, 0) / files.length
				: 0;
		if (avgRisk >= 50) {
			warnings.push(
				`⚠️  High overall risk score (${Math.round(avgRisk)}/100) - consider thorough code review`,
			);
		} else if (avgRisk >= 30) {
			recommendations.push(
				`Medium risk score (${Math.round(avgRisk)}/100) - standard review recommended`,
			);
		}

		return {warnings, recommendations};
	}

	/**
	 * Merge custom severity patterns with defaults
	 *
	 * @param custom - Custom patterns
	 * @returns Merged patterns
	 */
	private mergeSeverityPatterns(
		custom?: SeverityPatternConfig,
	): SeverityPatternConfig {
		if (!custom) {
			return DEFAULT_SEVERITY_PATTERNS;
		}

		return {
			breaking: [...(DEFAULT_SEVERITY_PATTERNS.breaking ?? []), ...(custom.breaking ?? [])],
			feature: [...(DEFAULT_SEVERITY_PATTERNS.feature ?? []), ...(custom.feature ?? [])],
			fix: [...(DEFAULT_SEVERITY_PATTERNS.fix ?? []), ...(custom.fix ?? [])],
			refactor: [...(DEFAULT_SEVERITY_PATTERNS.refactor ?? []), ...(custom.refactor ?? [])],
			chore: [...(DEFAULT_SEVERITY_PATTERNS.chore ?? []), ...(custom.chore ?? [])],
		};
	}
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick analysis function - creates analyzer and runs analysis
 *
 * @param diffInput - Raw git diff output
 * @param options - Optional configuration
 * @returns Diff summary
 */
export function analyzeDiff(
	diffInput: string,
	options?: SmartDiffOptions,
): DiffSummary {
	const analyzer = new SmartDiffAnalyzer(options);
	return analyzer.analyze(diffInput);
}

/**
 * Get a formatted text summary of the diff analysis
 *
 * @param summary - Diff summary
 * @returns Formatted text
 */
export function formatSummary(summary: DiffSummary): string {
	const lines: string[] = [];

	lines.push('='.repeat(60));
	lines.push('SMART DIFF ANALYSIS SUMMARY');
	lines.push('='.repeat(60));
	lines.push('');

	// Overview
	lines.push('📊 OVERVIEW');
	lines.push(`  Files changed: ${summary.totalFiles}`);
	lines.push(`  Lines added:  ${summary.totalAdditions}`);
	lines.push(`  Lines deleted: ${summary.totalDeletions}`);
	lines.push(`  Risk score:    ${summary.overallRiskScore}/100`);
	lines.push('');

	// Files by severity
	lines.push('📁 FILES BY SEVERITY');
	for (const [severity, count] of Object.entries(summary.filesBySeverity)) {
		if (count > 0) {
			lines.push(`  ${severity.toUpperCase().padEnd(10)}: ${count}`);
		}
	}
	lines.push('');

	// Riskiest files
	if (summary.riskiestFiles.length > 0) {
		lines.push('⚠️  RISKIEST FILES');
		for (const file of summary.riskiestFiles) {
			lines.push(
				`  ${file.riskScore.toString().padStart(3)}/100 ${file.filePath} (${file.severity})`,
			);
		}
		lines.push('');
	}

	// Warnings
	if (summary.warnings.length > 0) {
		lines.push('⚠️  WARNINGS');
		for (const warning of summary.warnings) {
			lines.push(`  ${warning}`);
		}
		lines.push('');
	}

	// Recommendations
	if (summary.recommendations.length > 0) {
		lines.push('💡 RECOMMENDATIONS');
		for (const rec of summary.recommendations) {
			lines.push(`  • ${rec}`);
		}
		lines.push('');
	}

	lines.push('='.repeat(60));

	return lines.join('\n');
}

/**
 * Get a JSON summary of the diff analysis
 *
 * @param summary - Diff summary
 * @returns JSON string
 */
export function formatJsonSummary(summary: DiffSummary): string {
	return JSON.stringify(summary, null, 2);
}

/**
 * Generate a markdown report from the analysis
 *
 * @param summary - Diff summary
 * @returns Markdown string
 */
export function formatMarkdownSummary(summary: DiffSummary): string {
	const lines: string[] = [];

	lines.push('# Smart Diff Analysis');
	lines.push('');
	lines.push('## Overview');
	lines.push('');
	lines.push(`- **Files changed:** ${summary.totalFiles}`);
	lines.push(`- **Lines added:** ${summary.totalAdditions}`);
	lines.push(`- **Lines deleted:** ${summary.totalDeletions}`);
	lines.push(`- **Overall risk score:** ${summary.overallRiskScore}/100`);
	lines.push('');

	lines.push('## Files by Severity');
	lines.push('');
	for (const [severity, count] of Object.entries(summary.filesBySeverity)) {
		if (count > 0) {
			lines.push(`- **${severity.charAt(0).toUpperCase() + severity.slice(1)}:** ${count}`);
		}
	}
	lines.push('');

	if (summary.riskiestFiles.length > 0) {
		lines.push('## Riskiest Files');
		lines.push('');
		for (const file of summary.riskiestFiles) {
			lines.push(
				`### ${file.filePath} (${file.riskScore}/100 - ${file.severity})`,
			);
			lines.push('');
			lines.push(`- **Type:** ${file.fileType}`);
			lines.push(`- **Additions:** ${file.additions}`);
			lines.push(`- **Deletions:** ${file.deletions}`);
			lines.push(
				`- **Status:** ${file.newFile ? 'New' : file.deletedFile ? 'Deleted' : 'Modified'}`,
			);
			lines.push('');
		}
	}

	if (summary.warnings.length > 0) {
		lines.push('## ⚠️ Warnings');
		lines.push('');
		for (const warning of summary.warnings) {
			lines.push(`- ${warning}`);
		}
		lines.push('');
	}

	if (summary.recommendations.length > 0) {
		lines.push('## 💡 Recommendations');
		lines.push('');
		for (const rec of summary.recommendations) {
			lines.push(`- ${rec}`);
		}
		lines.push('');
	}

	return lines.join('\n');
}

/**
 * Generate a concise one-line summary
 *
 * @param summary - Diff summary
 * @returns One-line summary
 */
export function formatOneLineSummary(summary: DiffSummary): string {
	const parts: string[] = [];

	parts.push(`${summary.totalFiles} files`);
	parts.push(`+${summary.totalAdditions}`);
	parts.push(`-${summary.totalDeletions}`);
	parts.push(`${summary.overallRiskScore}/100 risk`);

	// Add severity counts
	const severityCounts = Object.entries(summary.filesBySeverity)
		.filter(([, count]) => count > 0)
		.map(([severity, count]) => `${count} ${severity}`)
		.join(', ');

	if (severityCounts) {
		parts.push(`(${severityCounts})`);
	}

	return parts.join(' | ');
}

// ============================================================================
// INTEGRATION WITH PREFIX PARSER
// ============================================================================

/**
 * Parse a git diff command from prefix input
 *
 * @param input - User input (e.g., "!git diff" or "/diff HEAD~1")
 * @returns Diff command or null
 */
export function parseDiffCommand(input: string): {command: string; args: string} | null {
	const parsed = parsePrefixMode(input);

	// Handle bash command: !git diff ...
	if (parsed.mode === 'bash' && parsed.cleanInput.startsWith('git diff')) {
		const parts = parsed.cleanInput.split(/\s+/);
		return {
			command: 'git',
			args: parts.slice(1).join(' '),
		};
	}

	// Handle slash command: /diff ...
	if (parsed.mode === 'command' && parsed.cleanInput.startsWith('diff ')) {
		const parts = parsed.cleanInput.split(/\s+/);
		return {
			command: 'git',
			args: `diff ${parts.slice(1).join(' ')}`,
		};
	}

	return null;
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default SmartDiffAnalyzer;
