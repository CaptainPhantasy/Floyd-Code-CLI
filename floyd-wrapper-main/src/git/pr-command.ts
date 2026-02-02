/**
 * PHASE 5 ITEM 26: /pr Command
 *
 * GitHub Pull Request creation command.
 * Integrates with gh CLI and git workflows.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * PR creation options
 */
export interface PROptions {
	title: string;
	body?: string;
	branch?: string;
	base?: string;
	draft?: boolean;
	labels?: string[];
	reviewers?: string[];
	assignees?: string[];
}

/**
 * PR result
 */
export interface PRResult {
	url: string;
	number: number;
	title: string;
	draft: boolean;
}

/**
 * GitHub client wrapper using gh CLI
 */
class GitHubClient {
	private available: boolean = false;

	constructor() {
		this.checkAvailable();
	}

	private async checkAvailable(): Promise<void> {
		try {
			const result = spawn('gh', ['--version'], { stdio: 'pipe' });
			await new Promise((resolve) => {
				result.on('close', (code) => {
					this.available = code === 0;
					resolve();
				});
				result.on('error', () => {
					this.available = false;
					resolve();
				});
				setTimeout(() => resolve(), 1000);
			});
		} catch {
			this.available = false;
		}
	}

	async isAvailable(): Promise<boolean> {
		return this.available;
	}

	async getCurrentBranch(): Promise<string> {
		return new Promise((resolve, reject) => {
			const result = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';
			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			result.on('close', (code) => {
				if (code === 0) {
					resolve(output.trim());
				} else {
					reject(new Error(`git rev-parse failed: ${code}`));
				}
			});
		});
	}

	async getBaseBranch(): Promise<string> {
		try {
			// Try to get default branch from remote
			const result = spawn('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';
			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			await new Promise((resolve) => {
				result.on('close', (code) => {
					if (code === 0) {
						const match = output.match(/refs\/remotes\/origin\/(.+)/);
						if (match) {
							resolve(match[1]);
							return;
						}
					}
					resolve('main'); // Default fallback
				});
			});
		} catch {
			return 'main';
		}
	}

	async hasUncommittedChanges(): Promise<boolean> {
		return new Promise((resolve) => {
			const result = spawn('git', ['status', '--porcelain'], {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';
			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			result.on('close', () => {
				resolve(output.trim().length > 0);
			});
		});
	}

	async createPR(options: PROptions): Promise<PRResult> {
		const currentBranch = options.branch || await this.getCurrentBranch();
		const baseBranch = options.base || await this.getBaseBranch();

		// Build gh pr create command
		const args = ['pr', 'create', '--title', options.title];

		if (options.body) {
			args.push('--body', options.body);
		}

		args.push('--base', baseBranch);
		args.push('--head', currentBranch);

		if (options.draft) {
			args.push('--draft');
		}

		if (options.labels && options.labels.length > 0) {
			args.push('--labels', options.labels.join(','));
		}

		if (options.reviewers && options.reviewers.length > 0) {
			args.push('--reviewer', options.reviewers.join(','));
		}

		if (options.assignees && options.assignees.length > 0) {
			args.push('--assignee', options.assignees.join(','));
		}

		// Add Co-Authored-By footer if not already present
		let body = options.body || '';
		const coAuthoredBy = '\n\nCo-Authored-By: FLOYD <noreply@floyd.ai>';
		if (!body.includes('Co-Authored-By')) {
			body += coAuthoredBy;
			// Update body argument
			const bodyIndex = args.indexOf('--body');
			if (bodyIndex >= 0) {
				args[bodyIndex + 1] = body;
			} else {
				args.push('--body', body);
			}
		}

		// Execute gh pr create
		return new Promise((resolve, reject) => {
			const result = spawn('gh', args, {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';
			let stderr = '';

			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			result.stderr?.on('data', (data) => {
				stderr += data.toString();
			});

			result.on('close', async (code) => {
				if (code === 0) {
					// Parse PR URL from output
					const urlMatch = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/);
					const numberMatch = output.match(/\/pull\/(\d+)/);

					if (urlMatch) {
						// Get PR details
						const pr = await this.getPR(currentBranch);
						if (pr) {
							resolve({
								url: pr.url,
								number: pr.number,
								title: pr.title,
								draft: pr.draft || false,
							});
						} else {
							resolve({
								url: urlMatch[0],
								number: numberMatch ? parseInt(numberMatch[1], 10) : 0,
								title: options.title,
								draft: options.draft || false,
							});
						}
					} else {
						reject(new Error('Could not parse PR URL from output'));
					}
				} else {
					reject(new Error(`gh pr create failed: ${stderr || output}`));
				}
			});
		});
	}

	async getPR(branch: string): Promise<PRResult | null> {
		return new Promise((resolve) => {
			const result = spawn('gh', ['pr', 'view', '--json', 'url,number,title,draft', '--head', branch], {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';

			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			result.on('close', (code) => {
				if (code === 0 && output) {
					try {
						const pr = JSON.parse(output);
						resolve({
							url: pr.url,
							number: pr.number,
							title: pr.title,
							draft: pr.draft || false,
						});
					} catch {
						resolve(null);
					}
				} else {
					resolve(null);
				}
			});
		});
	}

	async listPRs(base?: string): Promise<PRResult[]> {
		return new Promise((resolve) => {
			const args = ['pr', 'list', '--json', 'url,number,title,draft,headRefName'];
			if (base) {
				args.push('--base', base);
			}
			args.push('--limit', '100');

			const result = spawn('gh', args, {
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			let output = '';

			result.stdout?.on('data', (data) => {
				output += data.toString();
			});

			result.on('close', (code) => {
				if (code === 0 && output) {
					try {
						const lines = output.trim().split('\n');
						const prs: PRResult[] = [];
						for (const line of lines) {
							if (line) {
								const pr = JSON.parse(line);
								prs.push({
									url: pr.url,
									number: pr.number,
									title: pr.title,
									draft: pr.draft || false,
								});
							}
						}
						resolve(prs);
					} catch {
						resolve([]);
					}
				} else {
					resolve([]);
				}
			});
		});
	}
}

/**
 * Generate PR body from git commits
 */
export async function generatePRBodyFromCommits(): Promise<string> {
	return new Promise((resolve) => {
		const result = spawn('git', ['log', '--format=%s%n%b', 'HEAD@{upstream}..HEAD'], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let output = '';

		result.stdout?.on('data', (data) => {
			output += data.toString();
		});

		result.on('close', (code) => {
			if (code === 0 && output.trim()) {
				resolve(output.trim());
			} else {
				resolve('');
			}
		});
	});
}

/**
 * Generate PR body from template
 */
export function generatePRBody(template?: {
	issueNumber?: string;
	description?: string;
	changes?: string[];
	testNotes?: string;
}): string {
	let body = '';

	if (template?.issueNumber) {
		body += `Resolves #${template.issueNumber}\n\n`;
	}

	if (template?.description) {
		body += `## Description\n\n${template.description}\n\n`;
	}

	if (template?.changes && template.changes.length > 0) {
		body += `## Changes\n\n`;
		for (const change of template.changes) {
			body += `- ${change}\n`;
		}
		body += '\n';
	}

	if (template?.testNotes) {
		body += `## Testing\n\n${template.testNotes}\n\n`;
	}

	return body || '';
}

/**
 * Main /pr command handler
 */
export async function handlePrCommand(options: PROptions): Promise<{
	success: boolean;
	pr?: PRResult;
	error?: string;
}> {
	try {
		const client = new GitHubClient();

		// Check if gh is available
		if (!(await client.isAvailable())) {
			return {
				success: false,
				error: 'GitHub CLI (gh) is not installed or not authenticated',
			};
		}

		// Check for uncommitted changes
		const hasChanges = await client.hasUncommittedChanges();
		if (hasChanges) {
			return {
				success: false,
				error: 'You have uncommitted changes. Please commit or stash them first.',
			};
		}

		// Generate body if not provided
		let body = options.body;
		if (!body) {
			body = await generatePRBodyFromCommits();
			if (!body) {
				body = generatePRBody({
					description: options.title,
				});
			}
		}

		// Create PR
		const pr = await client.createPR({
			...options,
			body,
		});

		return {
			success: true,
			pr,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * CLI command definition
 */
export const prCommand = {
	description: 'Create a GitHub Pull Request',
	usage: '/pr <title> [options]',
	options: {
		'--body <text>': 'PR description body',
		'--branch <name>': 'Branch name (default: current)',
		'--base <name>': 'Base branch (default: main or master)',
		'--draft': 'Create as draft PR',
		'--labels <list>': 'Comma-separated labels',
		'--reviewers <list>': 'Comma-separated reviewers',
		'--assignees <list>': 'Comma-separated assignees',
	},
	examples: [
		'/pr "Fix authentication bug"',
		'/pr "Add user registration" --body "Implements #123" --labels enhancement',
		'/pr "Refactor API" --base develop --draft',
	],
	handler: handlePrCommand,
};

export { GitHubClient };
export default prCommand;
