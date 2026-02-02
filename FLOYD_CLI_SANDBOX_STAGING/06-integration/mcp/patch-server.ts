/**
 * MCP Patch Server
 *
 * Provides tools for applying unified diffs, editing file ranges,
 * inserting content, and deleting ranges with safety checks.
 *
 * Tools:
 * - apply_unified_diff: Apply a unified diff patch
 * - edit_range: Edit a specific line range in a file
 * - insert_at: Insert content at a specific line
 * - delete_range: Delete a specific line range
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import {parsePatch, applyPatches} from 'diff';
import parseDiff from 'parse-diff';

export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	content: string;
}

export interface DiffFile {
	path: string;
	oldPath?: string;
	status: 'added' | 'deleted' | 'modified' | 'renamed';
	hunks: DiffHunk[];
}

export interface RiskAssessment {
	riskLevel: 'low' | 'medium' | 'high';
	warnings: string[];
	isBinary: boolean;
	affectsMultipleFiles: boolean;
	totalChanges: number;
}

/**
 * Assess the risk of applying a patch
 */
export function assessRisk(parsedDiff: DiffFile[]): RiskAssessment {
	const warnings: string[] = [];
	let riskLevel: 'low' | 'medium' | 'high' = 'low';
	let totalChanges = 0;

	for (const file of parsedDiff) {
		totalChanges += file.hunks.length;

		// Check for binary file indicators
		if (
			file.path.includes('.bin') ||
			file.path.includes('.exe') ||
			file.path.includes('.dll')
		) {
			riskLevel = 'high';
			warnings.push(`Binary file detected: ${file.path}`);
		}

		// Check for sensitive files
		const sensitivePatterns = [
			'package-lock.json',
			'yarn.lock',
			'pnpm-lock.yaml',
			'.env',
			'credentials',
			'secret',
			'private',
		];
		for (const pattern of sensitivePatterns) {
			if (file.path.toLowerCase().includes(pattern)) {
				riskLevel = 'high';
				warnings.push(`Sensitive file modification: ${file.path}`);
			}
		}

		// Check for large hunks (risky refactorings)
		for (const hunk of file.hunks) {
			if (hunk.oldLines > 50 || hunk.newLines > 50) {
				riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
				warnings.push(
					`Large hunk in ${file.path}: ${hunk.oldLines} -> ${hunk.newLines} lines`,
				);
			}
		}

		// Check for deletions
		if (file.status === 'deleted') {
			riskLevel = 'high';
			warnings.push(`File deletion: ${file.path}`);
		}
	}

	// Multiple files = medium risk at minimum
	if (parsedDiff.length > 3 && riskLevel === 'low') {
		riskLevel = 'medium';
	}

	return {
		riskLevel,
		warnings,
		isBinary: warnings.some(w => w.includes('Binary')),
		affectsMultipleFiles: parsedDiff.length > 1,
		totalChanges,
	};
}

/**
 * Parse a unified diff string
 */
export function parseUnifiedDiff(diffText: string): DiffFile[] {
	const parsed = parseDiff(diffText);
	return parsed.map(file => ({
		path: file.to || file.from || '',
		oldPath: file.from !== file.to ? file.from : undefined,
		status: getDiffStatus(file),
		hunks: file.chunks.map(chunk => ({
			oldStart: chunk.oldStart,
			oldLines: chunk.oldLines,
			newStart: chunk.newStart,
			newLines: chunk.newLines,
			content: chunk.changes.map(c => c.content || c.type).join('\n'),
		})),
	}));
}

function getDiffStatus(file: any): DiffFile['status'] {
	if (file.to === '/dev/null') return 'deleted';
	if (file.from === '/dev/null') return 'added';
	if (file.from !== file.to) return 'renamed';
	return 'modified';
}

/**
 * Apply a unified diff to a file
 */
export async function applyUnifiedDiff(
	diffText: string,
	options: {
		dryRun?: boolean;
		rootPath?: string;
	} = {},
): Promise<{
	success: boolean;
	appliedFiles: string[];
	errors: string[];
	preview?: string[];
}> {
	const {dryRun = false, rootPath = process.cwd()} = options;

	const parsed = parseDiff(diffText);
	const appliedFiles: string[] = [];
	const errors: string[] = [];
	const preview: string[] = [];

	for (const file of parsed) {
		const filePath = path.resolve(rootPath, file.to || '');

		if (dryRun) {
			preview.push(`[DRY RUN] Would modify: ${filePath}`);
			continue;
		}

		try {
			// Ensure directory exists
			await fs.ensureDir(path.dirname(filePath));

			// Read existing content or create new file
			let content = '';
			if (await fs.pathExists(filePath)) {
				content = await fs.readFile(filePath, 'utf-8');
			}

			// Apply the patch using applyPatches
			const patches = parsePatch(diffText);
			applyPatches(patches, {
				loadFile: (_index, callback) => {
					callback(null, content);
				},
				patched: (_index, patchedContent) => {
					if (patchedContent) {
						content = patchedContent;
					}
				},
				complete: _err => {
					// Patch application complete
				},
			});

			await fs.writeFile(filePath, content, 'utf-8');
			appliedFiles.push(filePath);
		} catch (error) {
			errors.push(`Error processing ${filePath}: ${(error as Error).message}`);
		}
	}

	return {
		success: errors.length === 0,
		appliedFiles,
		errors,
		...(dryRun && {preview}),
	};
}

/**
 * Edit a specific range of lines in a file
 */
export async function editRange(
	filePath: string,
	startLine: number,
	endLine: number,
	newContent: string,
	options: {
		dryRun?: boolean;
		createBackup?: boolean;
	} = {},
): Promise<{
	success: boolean;
	originalLines?: string[];
	modifiedLines?: string[];
	error?: string;
}> {
	const {dryRun = false, createBackup = true} = options;

	try {
		const resolvedPath = path.resolve(filePath);

		if (!(await fs.pathExists(resolvedPath))) {
			return {success: false, error: `File not found: ${filePath}`};
		}

		const content = await fs.readFile(resolvedPath, 'utf-8');
		const lines = content.split('\n');

		// Validate line range
		if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
			return {
				success: false,
				error: `Invalid line range: ${startLine}-${endLine} (file has ${lines.length} lines)`,
			};
		}

		// Create backup if requested
		if (createBackup && !dryRun) {
			await fs.copy(resolvedPath, `${resolvedPath}.backup`, {overwrite: true});
		}

		const originalLines = lines.slice(startLine, endLine + 1);
		const newLines = newContent.split('\n');

		if (!dryRun) {
			lines.splice(startLine, endLine - startLine + 1, ...newLines);
			await fs.writeFile(resolvedPath, lines.join('\n'), 'utf-8');
		}

		return {
			success: true,
			originalLines,
			modifiedLines: newLines,
		};
	} catch (error) {
		return {success: false, error: (error as Error).message};
	}
}

/**
 * Insert content at a specific line
 */
export async function insertAt(
	filePath: string,
	lineNumber: number,
	content: string,
	options: {
		dryRun?: boolean;
		createBackup?: boolean;
	} = {},
): Promise<{
	success: boolean;
	insertedLines?: string[];
	error?: string;
}> {
	const {dryRun = false, createBackup = true} = options;

	try {
		const resolvedPath = path.resolve(filePath);

		if (!(await fs.pathExists(resolvedPath))) {
			return {success: false, error: `File not found: ${filePath}`};
		}

		const fileContent = await fs.readFile(resolvedPath, 'utf-8');
		const lines = fileContent.split('\n');

		if (lineNumber < 0 || lineNumber > lines.length) {
			return {
				success: false,
				error: `Invalid line number: ${lineNumber} (file has ${lines.length} lines)`,
			};
		}

		if (createBackup && !dryRun) {
			await fs.copy(resolvedPath, `${resolvedPath}.backup`, {overwrite: true});
		}

		const newLines = content.split('\n');

		if (!dryRun) {
			lines.splice(lineNumber, 0, ...newLines);
			await fs.writeFile(resolvedPath, lines.join('\n'), 'utf-8');
		}

		return {
			success: true,
			insertedLines: newLines,
		};
	} catch (error) {
		return {success: false, error: (error as Error).message};
	}
}

/**
 * Delete a range of lines from a file
 */
export async function deleteRange(
	filePath: string,
	startLine: number,
	endLine: number,
	options: {
		dryRun?: boolean;
		createBackup?: boolean;
	} = {},
): Promise<{
	success: boolean;
	deletedLines?: string[];
	error?: string;
}> {
	const {dryRun = false, createBackup = true} = options;

	try {
		const resolvedPath = path.resolve(filePath);

		if (!(await fs.pathExists(resolvedPath))) {
			return {success: false, error: `File not found: ${filePath}`};
		}

		const content = await fs.readFile(resolvedPath, 'utf-8');
		const lines = content.split('\n');

		if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
			return {
				success: false,
				error: `Invalid line range: ${startLine}-${endLine} (file has ${lines.length} lines)`,
			};
		}

		if (createBackup && !dryRun) {
			await fs.copy(resolvedPath, `${resolvedPath}.backup`, {overwrite: true});
		}

		const deletedLines = lines.slice(startLine, endLine + 1);

		if (!dryRun) {
			lines.splice(startLine, endLine - startLine + 1);
			await fs.writeFile(resolvedPath, lines.join('\n'), 'utf-8');
		}

		return {
			success: true,
			deletedLines,
		};
	} catch (error) {
		return {success: false, error: (error as Error).message};
	}
}

/**
 * Create and start the MCP patch server
 */
export async function createPatchServer(): Promise<Server> {
	const server = new Server(
		{
			name: 'floyd-patch-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: 'apply_unified_diff',
					description:
						'Apply a unified diff patch to files. Supports dry-run mode for preview.',
					inputSchema: {
						type: 'object',
						properties: {
							diff: {
								type: 'string',
								description: 'The unified diff content to apply',
							},
							dryRun: {
								type: 'boolean',
								description: 'Preview changes without applying them',
								default: false,
							},
							rootPath: {
								type: 'string',
								description:
									'Root path for resolving file paths (defaults to current working directory)',
							},
							assessRisk: {
								type: 'boolean',
								description: 'Perform risk assessment before applying',
								default: true,
							},
						},
						required: ['diff'],
					},
				},
				{
					name: 'edit_range',
					description:
						'Edit a specific range of lines in a file. Automatically creates backups.',
					inputSchema: {
						type: 'object',
						properties: {
							filePath: {
								type: 'string',
								description: 'Path to the file to edit',
							},
							startLine: {
								type: 'number',
								description: 'Start line number (0-indexed)',
							},
							endLine: {
								type: 'number',
								description: 'End line number (0-indexed, inclusive)',
							},
							content: {
								type: 'string',
								description: 'New content to insert',
							},
							dryRun: {
								type: 'boolean',
								description: 'Preview changes without applying',
								default: false,
							},
						},
						required: ['filePath', 'startLine', 'endLine', 'content'],
					},
				},
				{
					name: 'insert_at',
					description:
						'Insert content at a specific line in a file. Automatically creates backups.',
					inputSchema: {
						type: 'object',
						properties: {
							filePath: {
								type: 'string',
								description: 'Path to the file',
							},
							lineNumber: {
								type: 'number',
								description: 'Line number to insert at (0-indexed)',
							},
							content: {
								type: 'string',
								description: 'Content to insert',
							},
							dryRun: {
								type: 'boolean',
								description: 'Preview changes without applying',
								default: false,
							},
						},
						required: ['filePath', 'lineNumber', 'content'],
					},
				},
				{
					name: 'delete_range',
					description:
						'Delete a range of lines from a file. Automatically creates backups.',
					inputSchema: {
						type: 'object',
						properties: {
							filePath: {
								type: 'string',
								description: 'Path to the file',
							},
							startLine: {
								type: 'number',
								description: 'Start line number (0-indexed)',
							},
							endLine: {
								type: 'number',
								description: 'End line number (0-indexed, inclusive)',
							},
							dryRun: {
								type: 'boolean',
								description: 'Preview changes without applying',
								default: false,
							},
						},
						required: ['filePath', 'startLine', 'endLine'],
					},
				},
				{
					name: 'assess_patch_risk',
					description: 'Assess the risk level of a patch before applying it',
					inputSchema: {
						type: 'object',
						properties: {
							diff: {
								type: 'string',
								description: 'The unified diff content to assess',
							},
						},
						required: ['diff'],
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async request => {
		const {name, arguments: args} = request.params;

		try {
			switch (name) {
				case 'apply_unified_diff': {
					const {
						diff,
						dryRun = false,
						rootPath,
						assessRisk: shouldAssess = true,
					} = args as {
						diff: string;
						dryRun?: boolean;
						rootPath?: string;
						assessRisk?: boolean;
					};

					// Parse and validate diff
					const parsed = parseUnifiedDiff(diff);
					if (parsed.length === 0) {
						throw new Error('No valid diff found in input');
					}

					// Risk assessment
					let risk: RiskAssessment | undefined;
					if (shouldAssess) {
						risk = assessRisk(parsed);
					}

					// Apply the diff
					const result = await applyUnifiedDiff(diff, {dryRun, rootPath});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										...result,
										risk,
										parsedFiles: parsed.map(f => ({
											path: f.path,
											status: f.status,
											hunks: f.hunks.length,
										})),
									},
									null,
									2,
								),
							},
						],
					};
				}

				case 'edit_range': {
					const {
						filePath,
						startLine,
						endLine,
						content,
						dryRun = false,
					} = args as {
						filePath: string;
						startLine: number;
						endLine: number;
						content: string;
						dryRun?: boolean;
					};

					const result = await editRange(
						filePath,
						startLine,
						endLine,
						content,
						{dryRun},
					);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				}

				case 'insert_at': {
					const {
						filePath,
						lineNumber,
						content,
						dryRun = false,
					} = args as {
						filePath: string;
						lineNumber: number;
						content: string;
						dryRun?: boolean;
					};

					const result = await insertAt(filePath, lineNumber, content, {
						dryRun,
					});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				}

				case 'delete_range': {
					const {
						filePath,
						startLine,
						endLine,
						dryRun = false,
					} = args as {
						filePath: string;
						startLine: number;
						endLine: number;
						dryRun?: boolean;
					};

					const result = await deleteRange(filePath, startLine, endLine, {
						dryRun,
					});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				}

				case 'assess_patch_risk': {
					const {diff} = args as {diff: string};

					const parsed = parseUnifiedDiff(diff);
					const risk = assessRisk(parsed);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										...risk,
										files: parsed.map(f => ({
											path: f.path,
											status: f.status,
											hunkCount: f.hunks.length,
										})),
									},
									null,
									2,
								),
							},
						],
					};
				}

				default:
					throw new Error(`Unknown tool: ${name}`);
			}
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							error: (error as Error).message,
							tool: name,
						}),
					},
				],
				isError: true,
			};
		}
	});

	return server;
}

/**
 * Start the patch server (for standalone execution)
 */
export async function startPatchServer(): Promise<void> {
	const server = await createPatchServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Keep process alive
	console.error('Floyd MCP Patch Server started');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	startPatchServer().catch(console.error);
}
