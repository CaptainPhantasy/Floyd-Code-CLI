/**
 * MCP Git Server
 *
 * Provides tools for git operations including status, diff, log,
 * and commit with real-time repo state tracking and protected branch warnings.
 *
 * Tools:
 * - git_status: Show repository status with staged/unstaged files
 * - git_diff: Show diffs for files or the working directory
 * - git_log: Show commit history
 * - git_commit: Create commits with staging area management
 * - git_branch: List and manage branches
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import simpleGit from 'simple-git';
import type {SimpleGit} from 'simple-git';
import path from 'path';

export interface GitStatus {
	current: string;
	tracking: string | null;
	files: Array<{
		path: string;
		status: string;
		staged: boolean;
	}>;
	ahead: number;
	behind: number;
}

export interface GitCommit {
	hash: string;
	message: string;
	author: string;
	date: string;
	files?: string[];
}

export interface GitDiff {
	file: string;
	status: 'modified' | 'added' | 'deleted' | 'renamed';
	chunks: Array<{
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		content: string;
	}>;
}

/**
 * Protected branch patterns that should trigger warnings
 */
const PROTECTED_BRANCH_PATTERNS = [
	'main',
	'master',
	'development',
	'develop',
	'production',
	'release',
];

/**
 * Get a git instance for a specific path
 */
export function getGitInstance(repoPath: string = process.cwd()): SimpleGit {
	return simpleGit({
		baseDir: repoPath,
		binary: 'git',
		maxConcurrentProcesses: 6,
	});
}

/**
 * Check if we're in a git repository
 */
export async function isGitRepository(
	repoPath: string = process.cwd(),
): Promise<boolean> {
	try {
		const git = getGitInstance(repoPath);
		await git.checkIsRepo();
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the current git status
 */
export async function getGitStatus(
	repoPath: string = process.cwd(),
): Promise<GitStatus & {isRepo: boolean; error?: string}> {
	try {
		if (!(await isGitRepository(repoPath))) {
			return {
				isRepo: false,
				current: '',
				tracking: null,
				files: [],
				ahead: 0,
				behind: 0,
				error: 'Not a git repository',
			};
		}

		const git = getGitInstance(repoPath);
		const status = await git.status();

		return {
			isRepo: true,
			current: status.current || 'HEAD',
			tracking: status.tracking || null,
			ahead: status.ahead || 0,
			behind: status.behind || 0,
			files: status.files.map(f => {
				const working = (f as {working_dir?: string}).working_dir;
				return {
					path: f.path,
					status:
						!working || f.index === working ? f.index : `${f.index}/${working}`,
					staged: f.index !== '?',
				};
			}),
		};
	} catch (error) {
		return {
			isRepo: false,
			current: '',
			tracking: null,
			files: [],
			ahead: 0,
			behind: 0,
			error: (error as Error).message,
		};
	}
}

/**
 * Get git diff for files or working directory
 */
export async function getGitDiff(
	options: {
		repoPath?: string;
		files?: string[];
		staged?: boolean;
		cached?: boolean;
	} = {},
): Promise<GitDiff[] | {error: string}> {
	const {
		repoPath = process.cwd(),
		files,
		staged = false,
		cached = false,
	} = options;

	try {
		if (!(await isGitRepository(repoPath))) {
			return {error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);
		let diffArgs: string[] = [];

		if (cached || staged) {
			diffArgs.push('--cached');
		}

		if (files && files.length > 0) {
			diffArgs.push('--', ...files);
		}

		const diffResult = await git.diff(diffArgs);
		const summaryResult = await git.diff([
			'--name-status',
			...(cached || staged ? ['--cached'] : []),
			...(files ? ['--', ...files] : []),
		]);

		// Parse the diff into structured format
		const diffs: GitDiff[] = [];

		// Parse summary for file status
		const summaryLines = summaryResult.split('\n').filter(Boolean);
		const fileStatuses = new Map<
			string,
			'modified' | 'added' | 'deleted' | 'renamed'
		>();

		for (const line of summaryLines) {
			const [status, ...filePathParts] = line.split('\t');
			const filePath = filePathParts.join('\t') || line.slice(2);

			if (!status || status.length === 0) continue;

			switch (status[0]) {
				case 'M':
					fileStatuses.set(filePath, 'modified');
					break;
				case 'A':
					fileStatuses.set(filePath, 'added');
					break;
				case 'D':
					fileStatuses.set(filePath, 'deleted');
					break;
				case 'R':
					fileStatuses.set(filePath, 'renamed');
					break;
			}
		}

		// Return diff text for each file
		for (const [filePath, status] of fileStatuses) {
			diffs.push({
				file: filePath,
				status,
				chunks: [], // Parsed chunks would require more complex parsing
			});
		}

		// Also include raw diff for full context
		if (diffResult) {
			diffs.push({
				file: '__raw__',
				status: 'modified',
				chunks: [
					{
						oldStart: 0,
						oldLines: 0,
						newStart: 0,
						newLines: 0,
						content: diffResult,
					},
				],
			});
		}

		return diffs;
	} catch (error) {
		return {error: (error as Error).message};
	}
}

/**
 * Get git log
 */
export async function getGitLog(
	options: {
		repoPath?: string;
		maxCount?: number;
		since?: string;
		until?: string;
		author?: string;
		file?: string;
	} = {},
): Promise<GitCommit[] | {error: string}> {
	const {
		repoPath = process.cwd(),
		maxCount = 20,
		since,
		until,
		author,
		file,
	} = options;

	try {
		if (!(await isGitRepository(repoPath))) {
			return {error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);
		const logOptions: string[] = [
			`-n ${maxCount}`,
			'--pretty=format:%H|%an|%ai|%s',
		];

		if (since) logOptions.push(`--since=${since}`);
		if (until) logOptions.push(`--until=${until}`);
		if (author) logOptions.push(`--author=${author}`);
		if (file) logOptions.push('--', file);

		const logResult = await git.log(logOptions);

		return logResult.all.map(commit => ({
			hash: commit.hash,
			message: commit.message,
			author: commit.author_name,
			date: commit.date,
		}));
	} catch (error) {
		return {error: (error as Error).message};
	}
}

/**
 * Check if current branch is protected
 */
export function isProtectedBranch(branchName: string): boolean {
	const normalized = branchName.toLowerCase();
	return PROTECTED_BRANCH_PATTERNS.some(
		pattern => normalized === pattern || normalized.startsWith(`${pattern}/`),
	);
}

/**
 * Stage files for commit
 */
export async function stageFiles(
	files: string[],
	repoPath: string = process.cwd(),
): Promise<{success: boolean; staged: string[]; error?: string}> {
	try {
		if (!(await isGitRepository(repoPath))) {
			return {success: false, staged: [], error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);

		if (files.length === 0) {
			// Stage all modified files
			await git.add('.');
		} else {
			await git.add(files);
		}

		return {success: true, staged: files.length > 0 ? files : ['all']};
	} catch (error) {
		return {success: false, staged: [], error: (error as Error).message};
	}
}

/**
 * Unstage files
 */
export async function unstageFiles(
	files: string[],
	repoPath: string = process.cwd(),
): Promise<{success: boolean; unstaged: string[]; error?: string}> {
	try {
		if (!(await isGitRepository(repoPath))) {
			return {success: false, unstaged: [], error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);

		if (files.length === 0) {
			// Reset all staged files
			await git.reset();
		} else {
			await git.reset(files);
		}

		return {success: true, unstaged: files.length > 0 ? files : ['all']};
	} catch (error) {
		return {success: false, unstaged: [], error: (error as Error).message};
	}
}

/**
 * Create a commit
 */
export async function createCommit(
	message: string,
	options: {
		repoPath?: string;
		allowEmpty?: boolean;
		amend?: boolean;
		signoff?: boolean;
	} = {},
): Promise<{
	success: boolean;
	hash?: string;
	error?: string;
	warnings?: string[];
}> {
	const {
		repoPath = process.cwd(),
		allowEmpty = false,
		amend = false,
		signoff = false,
	} = options;
	const warnings: string[] = [];

	try {
		if (!(await isGitRepository(repoPath))) {
			return {success: false, error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);
		const status = await getGitStatus(repoPath);

		// Warn if on protected branch
		if (isProtectedBranch(status.current)) {
			warnings.push(`Committing to protected branch: ${status.current}`);
		}

		// Warn if nothing to commit
		if (status.files.length === 0 && !allowEmpty) {
			warnings.push('No changes to commit');
			return {success: false, error: 'Nothing to commit', warnings};
		}

		// Build commit args
		const commitArgs: string[] = [];
		if (allowEmpty) commitArgs.push('--allow-empty');
		if (amend) {
			commitArgs.push('--amend');
			warnings.push('Amending previous commit');
		}
		if (signoff) commitArgs.push('--signoff');
		commitArgs.push('-m', message);

		const result = await git.commit(message, commitArgs);

		return {
			success: true,
			hash: result.commit || '',
			warnings,
		};
	} catch (error) {
		return {
			success: false,
			error: (error as Error).message,
			warnings,
		};
	}
}

/**
 * Get current branch
 */
export async function getCurrentBranch(
	repoPath: string = process.cwd(),
): Promise<{branch?: string; error?: string}> {
	try {
		if (!(await isGitRepository(repoPath))) {
			return {error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);
		const status = await git.status();
		return {branch: status.current || 'HEAD'};
	} catch (error) {
		return {error: (error as Error).message};
	}
}

/**
 * List branches
 */
export async function listBranches(repoPath: string = process.cwd()): Promise<{
	branches: Array<{name: string; current: boolean; tracked?: string}>;
	error?: string;
}> {
	try {
		if (!(await isGitRepository(repoPath))) {
			return {branches: [], error: 'Not a git repository'};
		}

		const git = getGitInstance(repoPath);
		const branches = await git.branch();

		return {
			branches: branches.all.map(name => ({
				name,
				current: name === branches.current,
			})),
		};
	} catch (error) {
		return {branches: [], error: (error as Error).message};
	}
}

/**
 * Create and start the MCP git server
 */
export async function createGitServer(): Promise<Server> {
	const server = new Server(
		{
			name: 'floyd-git-server',
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
					name: 'git_status',
					description:
						'Show the working tree status. Returns staged/unstaged files and branch information.',
					inputSchema: {
						type: 'object',
						properties: {
							repoPath: {
								type: 'string',
								description:
									'Path to the git repository (defaults to current working directory)',
							},
						},
					},
				},
				{
					name: 'git_diff',
					description:
						'Show changes between commits, commit and working tree, etc.',
					inputSchema: {
						type: 'object',
						properties: {
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
							files: {
								type: 'array',
								items: {type: 'string'},
								description: 'Specific files to diff (empty for all)',
							},
							staged: {
								type: 'boolean',
								description: 'Show staged changes instead of working directory',
								default: false,
							},
							cached: {
								type: 'boolean',
								description: 'Alias for staged',
								default: false,
							},
						},
					},
				},
				{
					name: 'git_log',
					description: 'Show commit logs',
					inputSchema: {
						type: 'object',
						properties: {
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
							maxCount: {
								type: 'number',
								description: 'Maximum number of commits to show',
								default: 20,
							},
							since: {
								type: 'string',
								description:
									'Show commits since this date (e.g., "1 week ago")',
							},
							until: {
								type: 'string',
								description: 'Show commits until this date',
							},
							author: {
								type: 'string',
								description: 'Filter by author',
							},
							file: {
								type: 'string',
								description: 'Show commits affecting a specific file',
							},
						},
					},
				},
				{
					name: 'git_commit',
					description:
						'Record changes to the repository. Warns for protected branches.',
					inputSchema: {
						type: 'object',
						properties: {
							message: {
								type: 'string',
								description: 'Commit message',
							},
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
							stageAll: {
								type: 'boolean',
								description: 'Stage all modified files before committing',
								default: true,
							},
							stageFiles: {
								type: 'array',
								items: {type: 'string'},
								description: 'Specific files to stage (overrides stageAll)',
							},
							allowEmpty: {
								type: 'boolean',
								description: 'Allow empty commit',
								default: false,
							},
							amend: {
								type: 'boolean',
								description: 'Amend previous commit',
								default: false,
							},
						},
						required: ['message'],
					},
				},
				{
					name: 'git_stage',
					description: 'Stage files for commit',
					inputSchema: {
						type: 'object',
						properties: {
							files: {
								type: 'array',
								items: {type: 'string'},
								description: 'Files to stage (empty array stages all)',
							},
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
						},
					},
				},
				{
					name: 'git_unstage',
					description: 'Unstage files from the staging area',
					inputSchema: {
						type: 'object',
						properties: {
							files: {
								type: 'array',
								items: {type: 'string'},
								description: 'Files to unstage (empty array unstages all)',
							},
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
						},
					},
				},
				{
					name: 'git_branch',
					description: 'List, create, or switch branches',
					inputSchema: {
						type: 'object',
						properties: {
							repoPath: {
								type: 'string',
								description: 'Path to the git repository',
							},
							action: {
								type: 'string',
								enum: ['list', 'current', 'create', 'switch'],
								default: 'list',
								description: 'Action to perform',
							},
							name: {
								type: 'string',
								description: 'Branch name (for create/switch actions)',
							},
						},
					},
				},
				{
					name: 'is_protected_branch',
					description:
						'Check if a branch is protected (main, master, develop, etc.)',
					inputSchema: {
						type: 'object',
						properties: {
							branch: {
								type: 'string',
								description: 'Branch name to check',
							},
							repoPath: {
								type: 'string',
								description:
									'Path to git repository (to get current branch if not specified)',
							},
						},
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async request => {
		const {name, arguments: args} = request.params;

		try {
			switch (name) {
				case 'git_status': {
					const {repoPath} = args as {repoPath?: string};
					const cwd = path.resolve(repoPath || process.cwd());
					const status = await getGitStatus(cwd);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(status, null, 2),
							},
						],
					};
				}

				case 'git_diff': {
					const {
						repoPath,
						files,
						staged = false,
						cached = false,
					} = args as {
						repoPath?: string;
						files?: string[];
						staged?: boolean;
						cached?: boolean;
					};
					const cwd = path.resolve(repoPath || process.cwd());
					const diff = await getGitDiff({repoPath: cwd, files, staged, cached});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(diff, null, 2),
							},
						],
					};
				}

				case 'git_log': {
					const {
						repoPath,
						maxCount = 20,
						since,
						until,
						author,
						file,
					} = args as {
						repoPath?: string;
						maxCount?: number;
						since?: string;
						until?: string;
						author?: string;
						file?: string;
					};
					const cwd = path.resolve(repoPath || process.cwd());
					const log = await getGitLog({
						repoPath: cwd,
						maxCount,
						since,
						until,
						author,
						file,
					});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(log, null, 2),
							},
						],
					};
				}

				case 'git_commit': {
					const {
						message,
						repoPath,
						stageAll = true,
						stageFiles: filesToStage,
						allowEmpty = false,
						amend = false,
					} = args as {
						message: string;
						repoPath?: string;
						stageAll?: boolean;
						stageFiles?: string[];
						allowEmpty?: boolean;
						amend?: boolean;
					};
					const cwd = path.resolve(repoPath || process.cwd());

					// Stage files if requested
					if (filesToStage && filesToStage.length > 0) {
						await stageFiles(filesToStage, cwd);
					} else if (stageAll) {
						await stageFiles([], cwd);
					}

					const result = await createCommit(message, {
						repoPath: cwd,
						allowEmpty,
						amend,
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

				case 'git_stage': {
					const {files = [], repoPath} = args as {
						files?: string[];
						repoPath?: string;
					};
					const cwd = path.resolve(repoPath || process.cwd());
					const result = await stageFiles(files, cwd);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				}

				case 'git_unstage': {
					const {files = [], repoPath} = args as {
						files?: string[];
						repoPath?: string;
					};
					const cwd = path.resolve(repoPath || process.cwd());
					const result = await unstageFiles(files, cwd);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				}

				case 'git_branch': {
					const {
						repoPath,
						action = 'list',
						name,
					} = args as {
						repoPath?: string;
						action?: 'list' | 'current' | 'create' | 'switch';
						name?: string;
					};
					const cwd = path.resolve(repoPath || process.cwd());

					if (action === 'list') {
						const result = await listBranches(cwd);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(result, null, 2),
								},
							],
						};
					}

					if (action === 'current') {
						const result = await getCurrentBranch(cwd);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(result, null, 2),
								},
							],
						};
					}

					if (action === 'create' && name) {
						const git = getGitInstance(cwd);
						await git.branch([name]);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(
										{success: true, branch: name, created: true},
										null,
										2,
									),
								},
							],
						};
					}

					if (action === 'switch' && name) {
						const git = getGitInstance(cwd);
						await git.checkout(name);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(
										{success: true, branch: name, switched: true},
										null,
										2,
									),
								},
							],
						};
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{error: 'Invalid action or missing branch name'},
									null,
									2,
								),
							},
						],
						isError: true,
					};
				}

				case 'is_protected_branch': {
					const {branch, repoPath} = args as {
						branch?: string;
						repoPath?: string;
					};
					const cwd = path.resolve(repoPath || process.cwd());

					let branchToCheck = branch;
					if (!branchToCheck) {
						const current = await getCurrentBranch(cwd);
						branchToCheck = current.branch;
					}

					if (!branchToCheck) {
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(
										{error: 'Could not determine branch'},
										null,
										2,
									),
								},
							],
							isError: true,
						};
					}

					const isProtected = isProtectedBranch(branchToCheck);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										branch: branchToCheck,
										isProtected,
										protectedPatterns: PROTECTED_BRANCH_PATTERNS,
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
 * Start the git server (for standalone execution)
 */
export async function startGitServer(): Promise<void> {
	const server = await createGitServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Keep process alive
	console.error('Floyd MCP Git Server started');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	startGitServer().catch(console.error);
}
