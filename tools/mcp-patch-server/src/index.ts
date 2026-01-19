/**
 * MCP Patch Server
 *
 * Provides tools for applying unified diffs, editing file ranges,
 * inserting content, and deleting ranges with safety checks.
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
	assessRisk,
	parseUnifiedDiff,
	type RiskAssessment,
} from './parser.js';
import {
	applyUnifiedDiff,
	editRange,
	insertAt,
	deleteRange,
} from './patcher.js';

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

					const parsed = parseUnifiedDiff(diff);
					if (parsed.length === 0) {
						throw new Error('No valid diff found in input');
					}

					let risk: RiskAssessment | undefined;
					if (shouldAssess) {
						risk = assessRisk(parsed);
					}

					const result = await applyUnifiedDiff(diff, {dryRun, rootPath});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										...result,
										risk,
										parsedFiles: parsed.map(file => ({
											path: file.path,
											status: file.status,
											hunks: file.hunks.length,
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
										files: parsed.map(file => ({
											path: file.path,
											status: file.status,
											hunkCount: file.hunks.length,
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

export async function startPatchServer(): Promise<void> {
	const server = await createPatchServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error('Floyd MCP Patch Server started');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	startPatchServer().catch(console.error);
}
