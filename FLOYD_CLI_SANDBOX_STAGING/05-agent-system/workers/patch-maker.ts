/**
 * PatchMaker Worker Agent
 *
 * Purpose: Code editing and patch generation specialist
 * Exports: PatchMakerWorker class, PatchResult, EditResult, ApplyResult types
 * Related: base-worker.ts, mcp/patch-server.ts, utils/diff-parser.ts
 *
 * Features:
 * - 60 token budget for moderate complexity edits
 * - Symbol-level code operations via MCP tools
 * - Unified diff generation and application
 * - Safe file modifications with backup
 * - Multi-file coordinated changes
 * - Syntax validation after edits
 * - Dry-run mode for preview
 */

import * as diffLib from 'diff';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import {createUnifiedDiff as createDiff} from '../../utils/diff-parser.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a single edit operation
 */
export interface EditResult {
	/**
	 * Whether the edit was successful
	 */
	success: boolean;

	/**
	 * File that was edited
	 */
	file: string;

	/**
	 * Number of lines changed
	 */
	linesChanged: number;

	/**
	 * Generated unified diff
	 */
	diff: string;

	/**
	 * Status of the operation
	 */
	status: 'success' | 'partial' | 'failed';

	/**
	 * Error message if status is 'failed'
	 */
	error?: string;

	/**
	 * Backup file path if backup was created
	 */
	backupPath?: string;

	/**
	 * Original content before edit
	 */
	originalContent?: string;

	/**
	 * Modified content after edit
	 */
	modifiedContent?: string;
}

/**
 * Result of applying a diff
 */
export interface ApplyResult {
	/**
	 * Whether the application was successful
	 */
	success: boolean;

	/**
	 * Files that were modified
	 */
	appliedFiles: string[];

	/**
	 * Number of lines changed per file
	 */
	changesPerFile: Record<string, number>;

	/**
	 * Errors encountered during application
	 */
	errors: string[];

	/**
	 * Preview of changes (if dry-run)
	 */
	preview?: string[];
}

/**
 * Result of a patch operation
 */
export interface PatchResult {
	/**
	 * File that was patched
	 */
	file: string;

	/**
	 * Operation type
	 */
	operation: 'edit' | 'insert' | 'delete' | 'replace';

	/**
	 * Number of lines changed
	 */
	linesChanged: number;

	/**
	 * Generated unified diff
	 */
	diff: string;

	/**
	 * Status of the operation
	 */
	status: 'success' | 'partial' | 'failed';

	/**
	 * Error message if status is 'failed'
	 */
	error?: string;
}

/**
 * Options for edit operations
 */
export interface EditOptions {
	/**
	 * Create backup before editing
	 */
	createBackup?: boolean;

	/**
	 * Preview changes without applying
	 */
	dryRun?: boolean;

	/**
	 * Validate syntax after edit (if language supported)
	 */
	validateSyntax?: boolean;

	/**
	 * Encoding for file operations
	 */
	encoding?: BufferEncoding;
}

/**
 * Symbol location information
 */
export interface SymbolLocation {
	/**
	 * File containing the symbol
	 */
	file: string;

	/**
	 * Symbol path (e.g., 'MyClass/myMethod')
	 */
	symbolPath: string;

	/**
	 * Start line of symbol (0-indexed)
	 */
	startLine: number;

	/**
	 * End line of symbol (0-indexed, inclusive)
	 */
	endLine: number;

	/**
	 * Symbol type
	 */
	type?: 'function' | 'method' | 'class' | 'variable' | 'interface' | 'type';
}

/**
 * Risk assessment for a patch
 */
export interface PatchRiskAssessment {
	/**
	 * Risk level
	 */
	riskLevel: 'low' | 'medium' | 'high';

	/**
	 * Warnings about the patch
	 */
	warnings: string[];

	/**
	 * Whether the patch affects binary files
	 */
	isBinary: boolean;

	/**
	 * Whether the patch affects multiple files
	 */
	affectsMultipleFiles: boolean;

	/**
	 * Total number of changes
	 */
	totalChanges: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Token budget for the PatchMaker worker
 */
export const PATCH_MAKER_TOKEN_BUDGET = 60;

/**
 * Default options for edit operations
 */
const DEFAULT_EDIT_OPTIONS: Required<EditOptions> = {
	createBackup: true,
	dryRun: false,
	validateSyntax: true,
	encoding: 'utf-8',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a backup file with timestamp
 */
async function createBackup(filePath: string): Promise<string> {
	const timestamp = Date.now();
	const backupPath = `${filePath}.backup-${timestamp}`;
	await fs.copyFile(filePath, backupPath);
	return backupPath;
}

/**
 * Check if a file is binary
 */
function isBinaryFile(filePath: string): boolean {
	const binaryExtensions = [
		'.bin',
		'.exe',
		'.dll',
		'.so',
		'.dylib',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.ico',
		'.pdf',
		'.zip',
		'.tar',
		'.gz',
	];
	const ext = path.extname(filePath).toLowerCase();
	return binaryExtensions.includes(ext);
}

/**
 * Check if a file is sensitive
 */
function isSensitiveFile(filePath: string): boolean {
	const sensitivePatterns = [
		'package-lock.json',
		'yarn.lock',
		'pnpm-lock.yaml',
		'.env',
		'.env.local',
		'.env.production',
		'credentials',
		'secret',
		'private',
		'.pem',
		'.key',
		'.cert',
	];
	const lowerPath = filePath.toLowerCase();
	return sensitivePatterns.some(pattern => lowerPath.includes(pattern));
}

/**
 * Simple syntax validation for common languages
 */
function validateSyntax(
	content: string,
	filePath: string,
): {
	valid: boolean;
	error?: string;
} {
	const ext = path.extname(filePath).toLowerCase();

	try {
		switch (ext) {
			case '.json':
				JSON.parse(content);
				break;
			case '.md':
				// Markdown is always valid
				break;
			default:
				// For other languages, we do basic bracket matching
				let depth = 0;
				for (const char of content) {
					if (char === '{' || char === '(' || char === '[') {
						depth++;
					} else if (char === '}' || char === ')' || char === ']') {
						depth--;
						if (depth < 0) {
							return {valid: false, error: 'Unmatched closing bracket'};
						}
					}
				}
				if (depth !== 0) {
					return {valid: false, error: 'Unmatched opening bracket'};
				}
		}
		return {valid: true};
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Unknown syntax error',
		};
	}
}

/**
 * Generate unified diff between two strings
 */
export function generatePatch(
	original: string,
	modified: string,
	filePath = 'file',
): string {
	return createDiff(original, modified, `a/${filePath}`, `b/${filePath}`);
}

/**
 * Count lines changed in a diff
 */
function countDiffLines(diff: string): number {
	const lines = diff.split('\n');
	let count = 0;
	for (const line of lines) {
		if (line.startsWith('+') || line.startsWith('-')) {
			// Ignore diff headers
			if (!line.startsWith('+++') && !line.startsWith('---')) {
				count++;
			}
		}
	}
	return count;
}

// ============================================================================
// PATCHMAKER WORKER CLASS
// ============================================================================

/**
 * PatchMaker Worker Agent
 *
 * Specializes in precise code edits and patch generation.
 */
export class PatchMakerWorker {
	private _tokenBudget: number;
	private _backupDir: string;
	private _dryRun: boolean;

	/**
	 * Create a new PatchMaker worker
	 */
	constructor(options?: {
		tokenBudget?: number;
		backupDir?: string;
		dryRun?: boolean;
	}) {
		this._tokenBudget = options?.tokenBudget ?? PATCH_MAKER_TOKEN_BUDGET;
		this._backupDir = options?.backupDir ?? process.cwd();
		this._dryRun = options?.dryRun ?? false;
	}

	/**
	 * Get the current token budget
	 */
	get tokenBudget(): number {
		return this._tokenBudget;
	}

	/**
	 * Set the token budget
	 */
	set tokenBudget(budget: number) {
		this._tokenBudget = budget;
	}

	/**
	 * Get or set dry-run mode
	 */
	get dryRun(): boolean {
		return this._dryRun;
	}

	set dryRun(enabled: boolean) {
		this._dryRun = enabled;
	}

	// ========================================================================
	// SYMBOL-LEVEL OPERATIONS
	// ========================================================================

	/**
	 * Edit a symbol by replacing its body
	 *
	 * @param file - File path containing the symbol
	 * @param symbolPath - Path to the symbol (e.g., 'MyClass/myMethod')
	 * @param newBody - New symbol body content
	 * @param options - Edit options
	 * @returns Edit result with diff
	 */
	async editSymbol(
		file: string,
		symbolPath: string,
		newBody: string,
		options: EditOptions = {},
	): Promise<EditResult> {
		const opts = {
			...DEFAULT_EDIT_OPTIONS,
			...options,
			dryRun: this._dryRun || options.dryRun,
		};

		try {
			const resolvedPath = path.resolve(file);

			// Check file exists
			const exists = await this.fileExists(resolvedPath);
			if (!exists) {
				return this.createFailedResult(file, `File not found: ${file}`);
			}

			// Read file content
			const originalContent = await fs.readFile(resolvedPath, opts.encoding);
			const lines = originalContent.split('\n');

			// Find symbol (simple regex-based search)
			const symbolLocation = this.findSymbolLocation(
				originalContent,
				symbolPath,
			);
			if (!symbolLocation) {
				return this.createFailedResult(file, `Symbol not found: ${symbolPath}`);
			}

			// Validate line range
			if (
				symbolLocation.startLine < 0 ||
				symbolLocation.endLine >= lines.length ||
				symbolLocation.startLine > symbolLocation.endLine
			) {
				return this.createFailedResult(
					file,
					`Invalid line range: ${symbolLocation.startLine}-${symbolLocation.endLine}`,
				);
			}

			// Create backup if requested
			let backupPath: string | undefined;
			if (opts.createBackup && !opts.dryRun) {
				backupPath = await createBackup(resolvedPath);
			}

			// Build new content
			const before = lines.slice(0, symbolLocation.startLine + 1);
			const after = lines.slice(symbolLocation.endLine + 1);
			const newLines = newBody.split('\n');
			const modifiedContent = [...before, ...newLines, ...after].join('\n');

			// Validate syntax if requested
			if (opts.validateSyntax) {
				const validation = validateSyntax(modifiedContent, resolvedPath);
				if (!validation.valid) {
					return this.createFailedResult(
						file,
						`Syntax validation failed: ${validation.error}`,
					);
				}
			}

			// Write file if not dry-run
			if (!opts.dryRun) {
				await fs.writeFile(resolvedPath, modifiedContent, opts.encoding);
			}

			// Generate diff
			const diff = generatePatch(
				originalContent,
				modifiedContent,
				path.basename(file),
			);

			return {
				success: true,
				file,
				linesChanged: countDiffLines(diff),
				diff,
				status: 'success',
				backupPath,
				originalContent,
				modifiedContent,
			};
		} catch (error) {
			return this.createFailedResult(
				file,
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}

	/**
	 * Edit a range of lines in a file
	 *
	 * @param file - File path to edit
	 * @param start - Start line number (0-indexed)
	 * @param end - End line number (0-indexed, inclusive)
	 * @param replacement - Replacement content
	 * @param options - Edit options
	 * @returns Edit result with diff
	 */
	async editRange(
		file: string,
		start: number,
		end: number,
		replacement: string,
		options: EditOptions = {},
	): Promise<EditResult> {
		const opts = {
			...DEFAULT_EDIT_OPTIONS,
			...options,
			dryRun: this._dryRun || options.dryRun,
		};

		try {
			const resolvedPath = path.resolve(file);

			// Check file exists
			const exists = await this.fileExists(resolvedPath);
			if (!exists) {
				return this.createFailedResult(file, `File not found: ${file}`);
			}

			// Check for binary file
			if (isBinaryFile(resolvedPath)) {
				return this.createFailedResult(file, 'Cannot edit binary files');
			}

			// Check for sensitive file
			if (isSensitiveFile(resolvedPath)) {
				return this.createFailedResult(
					file,
					'Cannot edit sensitive files without explicit confirmation',
				);
			}

			// Read file content
			const originalContent = await fs.readFile(resolvedPath, opts.encoding);
			const lines = originalContent.split('\n');

			// Validate line range
			if (start < 0 || end >= lines.length || start > end) {
				return this.createFailedResult(
					file,
					`Invalid line range: ${start}-${end} (file has ${lines.length} lines)`,
				);
			}

			// Create backup if requested
			let backupPath: string | undefined;
			if (opts.createBackup && !opts.dryRun) {
				backupPath = await createBackup(resolvedPath);
			}

			// Build new content
			const before = lines.slice(0, start);
			const after = lines.slice(end + 1);
			const replacementLines = replacement.split('\n');
			const modifiedContent = [...before, ...replacementLines, ...after].join(
				'\n',
			);

			// Validate syntax if requested
			if (opts.validateSyntax) {
				const validation = validateSyntax(modifiedContent, resolvedPath);
				if (!validation.valid) {
					return this.createFailedResult(
						file,
						`Syntax validation failed: ${validation.error}`,
					);
				}
			}

			// Write file if not dry-run
			if (!opts.dryRun) {
				await fs.writeFile(resolvedPath, modifiedContent, opts.encoding);
			}

			// Generate diff
			const diff = generatePatch(
				originalContent,
				modifiedContent,
				path.basename(file),
			);

			return {
				success: true,
				file,
				linesChanged: countDiffLines(diff),
				diff,
				status: 'success',
				backupPath,
				originalContent,
				modifiedContent,
			};
		} catch (error) {
			return this.createFailedResult(
				file,
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}

	/**
	 * Insert content at a specific line
	 *
	 * @param file - File path to edit
	 * @param line - Line number to insert at (0-indexed)
	 * @param content - Content to insert
	 * @param position - Insert before or after the line
	 * @param options - Edit options
	 * @returns Edit result with diff
	 */
	async insertAt(
		file: string,
		line: number,
		content: string,
		position: 'before' | 'after' = 'after',
		options: EditOptions = {},
	): Promise<EditResult> {
		const opts = {
			...DEFAULT_EDIT_OPTIONS,
			...options,
			dryRun: this._dryRun || options.dryRun,
		};

		try {
			const resolvedPath = path.resolve(file);

			// Check file exists
			const exists = await this.fileExists(resolvedPath);
			if (!exists) {
				return this.createFailedResult(file, `File not found: ${file}`);
			}

			// Check for binary file
			if (isBinaryFile(resolvedPath)) {
				return this.createFailedResult(file, 'Cannot edit binary files');
			}

			// Read file content
			const originalContent = await fs.readFile(resolvedPath, opts.encoding);
			const lines = originalContent.split('\n');

			// Validate line number
			if (line < 0 || line > lines.length) {
				return this.createFailedResult(
					file,
					`Invalid line number: ${line} (file has ${lines.length} lines)`,
				);
			}

			// Create backup if requested
			let backupPath: string | undefined;
			if (opts.createBackup && !opts.dryRun) {
				backupPath = await createBackup(resolvedPath);
			}

			// Insert content
			const contentLines = content.split('\n');
			const insertIndex = position === 'after' ? line + 1 : line;
			lines.splice(insertIndex, 0, ...contentLines);
			const modifiedContent = lines.join('\n');

			// Validate syntax if requested
			if (opts.validateSyntax) {
				const validation = validateSyntax(modifiedContent, resolvedPath);
				if (!validation.valid) {
					return this.createFailedResult(
						file,
						`Syntax validation failed: ${validation.error}`,
					);
				}
			}

			// Write file if not dry-run
			if (!opts.dryRun) {
				await fs.writeFile(resolvedPath, modifiedContent, opts.encoding);
			}

			// Generate diff
			const diff = generatePatch(
				originalContent,
				modifiedContent,
				path.basename(file),
			);

			return {
				success: true,
				file,
				linesChanged: countDiffLines(diff),
				diff,
				status: 'success',
				backupPath,
				originalContent,
				modifiedContent,
			};
		} catch (error) {
			return this.createFailedResult(
				file,
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}

	// ========================================================================
	// DIFF OPERATIONS
	// ========================================================================

	/**
	 * Apply a unified diff to a file
	 *
	 * @param file - File path to apply diff to
	 * @param diff - Unified diff content
	 * @param options - Edit options
	 * @returns Apply result
	 */
	async applyDiff(
		file: string,
		diff: string,
		options: EditOptions = {},
	): Promise<ApplyResult> {
		const opts = {
			...DEFAULT_EDIT_OPTIONS,
			...options,
			dryRun: this._dryRun || options.dryRun,
		};
		const appliedFiles: string[] = [];
		const changesPerFile: Record<string, number> = {};
		const errors: string[] = [];
		const preview: string[] = [];

		try {
			const resolvedPath = path.resolve(file);

			// Check file exists
			const exists = await this.fileExists(resolvedPath);
			if (!exists) {
				errors.push(`File not found: ${file}`);
				return {success: false, appliedFiles, changesPerFile, errors};
			}

			if (opts.dryRun) {
				preview.push(`[DRY RUN] Would apply patch to: ${resolvedPath}`);
				return {
					success: true,
					appliedFiles: [resolvedPath],
					changesPerFile: {[resolvedPath]: 0},
					errors,
					preview,
				};
			}

			// Create backup if requested
			if (opts.createBackup) {
				await createBackup(resolvedPath);
			}

			// Read original content
			const originalContent = await fs.readFile(resolvedPath, opts.encoding);

			// Apply diff using the diff library
			const patches = diffLib.parsePatch(diff);
			let modifiedContent = originalContent;

			for (const patch of patches) {
				const result = diffLib.applyPatch(originalContent, patch);
				if (result === false) {
					errors.push(`Failed to apply patch to ${file}`);
					return {success: false, appliedFiles, changesPerFile, errors};
				}
				modifiedContent = result;
			}

			// Validate syntax if requested
			if (opts.validateSyntax) {
				const validation = validateSyntax(modifiedContent, resolvedPath);
				if (!validation.valid) {
					errors.push(`Syntax validation failed: ${validation.error}`);
					return {success: false, appliedFiles, changesPerFile, errors};
				}
			}

			// Write modified content
			await fs.writeFile(resolvedPath, modifiedContent, opts.encoding);

			// Calculate changes
			const generatedDiff = generatePatch(
				originalContent,
				modifiedContent,
				path.basename(file),
			);
			const linesChanged = countDiffLines(generatedDiff);

			appliedFiles.push(resolvedPath);
			changesPerFile[resolvedPath] = linesChanged;

			return {
				success: errors.length === 0,
				appliedFiles,
				changesPerFile,
				errors,
			};
		} catch (error) {
			errors.push(error instanceof Error ? error.message : 'Unknown error');
			return {success: false, appliedFiles, changesPerFile, errors};
		}
	}

	/**
	 * Assess the risk of applying a patch
	 *
	 * @param diff - Unified diff content
	 * @returns Risk assessment
	 */
	assessPatchRisk(diff: string): PatchRiskAssessment {
		const warnings: string[] = [];
		let riskLevel: 'low' | 'medium' | 'high' = 'low';
		let totalChanges = 0;

		// Parse the diff
		const lines = diff.split('\n');
		const files = new Set<string>();

		for (const line of lines) {
			// Track files
			if (line.startsWith('+++') || line.startsWith('---')) {
				const filePath = line
					.replace(/^\+\+\+ |^--- /, '')
					.replace(/^[ab]\//, '')
					.replace(/^\/dev\/null/, '')
					.trim();
				if (filePath && filePath !== 'dev/null') {
					files.add(filePath);

					// Check for binary files
					if (isBinaryFile(filePath)) {
						riskLevel = 'high';
						warnings.push(`Binary file detected: ${filePath}`);
					}

					// Check for sensitive files
					if (isSensitiveFile(filePath)) {
						riskLevel = 'high';
						warnings.push(`Sensitive file modification: ${filePath}`);
					}
				}
			}

			// Count changes
			if (line.startsWith('+') && !line.startsWith('+++')) {
				totalChanges++;
			} else if (line.startsWith('-') && !line.startsWith('---')) {
				totalChanges++;
			}

			// Check for file deletions
			if (line.startsWith('--- /dev/null')) {
				riskLevel = 'high';
				warnings.push('New file creation detected');
			}
			if (line.startsWith('+++ /dev/null')) {
				riskLevel = 'high';
				warnings.push('File deletion detected');
			}
		}

		// Large number of changes = higher risk
		if (totalChanges > 100) {
			riskLevel = 'high';
			warnings.push(`Large number of changes: ${totalChanges} lines`);
		} else if (totalChanges > 30) {
			riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
		}

		// Multiple files = at least medium risk
		if (files.size > 3 && riskLevel === 'low') {
			riskLevel = 'medium';
			warnings.push(`Multiple files affected: ${files.size} files`);
		}

		return {
			riskLevel,
			warnings,
			isBinary: warnings.some(w => w.includes('Binary')),
			affectsMultipleFiles: files.size > 1,
			totalChanges,
		};
	}

	// ========================================================================
	// MULTI-FILE OPERATIONS
	// ========================================================================

	/**
	 * Apply multiple patches atomically (all-or-nothing)
	 *
	 * @param patches - Array of file paths and their diffs
	 * @param options - Edit options
	 * @returns Combined apply result
	 */
	async applyPatchesAtomically(
		patches: Array<{file: string; diff: string}>,
		options: EditOptions = {},
	): Promise<ApplyResult> {
		const opts = {
			...DEFAULT_EDIT_OPTIONS,
			...options,
			dryRun: this._dryRun || options.dryRun,
		};
		const appliedFiles: string[] = [];
		const changesPerFile: Record<string, number> = {};
		const errors: string[] = [];
		const backups: string[] = [];

		// If dry-run, just preview
		if (opts.dryRun) {
			const preview: string[] = ['[DRY RUN] Would apply patches atomically:'];
			for (const patch of patches) {
				preview.push(`  - ${patch.file}`);
			}
			return {
				success: true,
				appliedFiles,
				changesPerFile: {},
				errors,
				preview,
			};
		}

		// Phase 1: Create backups for all files
		try {
			for (const patch of patches) {
				const resolvedPath = path.resolve(patch.file);
				const exists = await this.fileExists(resolvedPath);
				if (!exists) {
					errors.push(`File not found: ${patch.file}`);
					continue;
				}
				if (opts.createBackup) {
					const backupPath = await createBackup(resolvedPath);
					backups.push(backupPath);
				}
			}

			if (errors.length > 0) {
				return {success: false, appliedFiles, changesPerFile, errors};
			}

			// Phase 2: Apply all patches
			for (const patch of patches) {
				const result = await this.applyDiff(patch.file, patch.diff, {
					...opts,
					createBackup: false, // Already created
				});

				if (!result.success) {
					errors.push(...result.errors);
					// Rollback: restore from backups
					await this.restoreBackups(backups);
					return {
						success: false,
						appliedFiles: result.appliedFiles,
						changesPerFile: {...changesPerFile, ...result.changesPerFile},
						errors,
					};
				}

				appliedFiles.push(...result.appliedFiles);
				Object.assign(changesPerFile, result.changesPerFile);
			}

			return {
				success: true,
				appliedFiles,
				changesPerFile,
				errors,
			};
		} catch (error) {
			// Rollback on error
			await this.restoreBackups(backups);
			errors.push(error instanceof Error ? error.message : 'Unknown error');
			return {success: false, appliedFiles, changesPerFile, errors};
		}
	}

	// ========================================================================
	// HELPER METHODS
	// ========================================================================

	/**
	 * Check if a file exists
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Create a failed edit result
	 */
	private createFailedResult(file: string, error: string): EditResult {
		return {
			success: false,
			file,
			linesChanged: 0,
			diff: '',
			status: 'failed',
			error,
		};
	}

	/**
	 * Find a symbol's location in content (simple implementation)
	 */
	private findSymbolLocation(
		content: string,
		symbolPath: string,
	): SymbolLocation | null {
		const lines: string[] = content.split('\n');
		const parts: string[] = symbolPath.split('/');

		// For simple cases, search for the symbol name
		const symbolName: string = parts.at(-1) ?? '';
		const parentName: string | null =
			parts.length > 1 ? parts[0] ?? null : null;

		let startLine = -1;
		let endLine = -1;

		// Find parent class/interface first
		if (parentName !== null) {
			const parentPattern = new RegExp(
				`\\b(class|interface|type)\\s+${parentName}\\b`,
			);
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line !== undefined && parentPattern.test(line)) {
					startLine = i;
					break;
				}
			}
		}

		// Find the symbol
		const symbolPattern = new RegExp(
			`\\b(function|method|const|let|var|async\\s+function)\\s+${symbolName}\\b|${symbolName}\\s*[:=]\\s*(function|async|\\()`,
		);

		const searchStart = startLine >= 0 ? startLine : 0;
		for (let i = searchStart; i < lines.length; i++) {
			const line = lines[i];
			if (line === undefined) {
				continue;
			}
			if (symbolPattern.test(line)) {
				startLine = i;
				// Find the end (simplified: look for closing brace or next symbol)
				for (let j = i + 1; j < lines.length; j++) {
					const innerLine = lines[j];
					if (innerLine === undefined) {
						continue;
					}
					if (/^\s*(function|const|let|var|class|interface)/.test(innerLine)) {
						endLine = j - 1;
						break;
					}
					// If we find a closing brace at same indentation, assume end
					if (innerLine.trim() === '}' && i > 0) {
						const startMatch = line.match(/^\s*/);
						const endMatch = innerLine.match(/^\s*/);
						const startMatchStr = startMatch?.[0] ?? '';
						const endMatchStr = endMatch?.[0] ?? '';
						const indent = startMatchStr.length;
						const lineIndent = endMatchStr.length;
						if (lineIndent === indent) {
							endLine = j;
							break;
						}
					}
				}
				if (endLine === -1) {
					endLine = i; // Default to just the symbol line
				}
				break;
			}
		}

		if (startLine >= 0) {
			return {
				file: '', // Will be filled by caller
				symbolPath,
				startLine,
				endLine,
			};
		}

		return null;
	}

	/**
	 * Restore files from backups
	 */
	private async restoreBackups(backupPaths: string[]): Promise<void> {
		for (const backupPath of backupPaths) {
			try {
				// Original file is backup path without the .backup- suffix
				const originalPath = backupPath.replace(/\.backup-\d+$/, '');
				await fs.copyFile(backupPath, originalPath);
				await fs.unlink(backupPath); // Remove backup
			} catch {
				// Continue with other backups
			}
		}
	}

	/**
	 * Clean up old backup files
	 */
	async cleanupBackups(
		olderThanMs: number = 24 * 60 * 60 * 1000,
	): Promise<void> {
		try {
			const files = await fs.readdir(this._backupDir);
			const now = Date.now();

			for (const file of files) {
				if (file.includes('.backup-')) {
					const filePath = path.join(this._backupDir, file);
					const stats = await fs.stat(filePath);
					const age = now - stats.mtimeMs;

					if (age > olderThanMs) {
						await fs.unlink(filePath);
					}
				}
			}
		} catch {
			// Ignore cleanup errors
		}
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new PatchMaker worker with default options
 */
export function createPatchMaker(options?: {
	tokenBudget?: number;
	backupDir?: string;
	dryRun?: boolean;
}): PatchMakerWorker {
	return new PatchMakerWorker(options);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default PatchMakerWorker;
