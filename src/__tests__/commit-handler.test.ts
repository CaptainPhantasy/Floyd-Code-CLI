/**
 * Commit Handler Tests
 *
 * Test suite for /commit slash command handler
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {
	handleCommit,
	parseCommitArgs,
	formatCommitMessage,
	generateDefaultMessage,
	type CommitOptions,
} from '../commands/commit-handler.js';

// Mock the git-server module
vi.mock('../mcp/git-server.js', () => ({
	getGitStatus: vi.fn(),
	stageFiles: vi.fn(),
	createCommit: vi.fn(),
}));

import {getGitStatus, stageFiles, createCommit} from '../mcp/git-server.js';

const mockGetGitStatus = getGitStatus as ReturnType<typeof vi.fn>;
const mockStageFiles = stageFiles as ReturnType<typeof vi.fn>;
const mockCreateCommit = createCommit as ReturnType<typeof vi.fn>;

describe('parseCommitArgs', () => {
	it('should parse empty args with defaults', () => {
		const result = parseCommitArgs([]);
		expect(result.stageAll).toBe(true);
		expect(result.amend).toBeUndefined();
		expect(result.dryRun).toBeUndefined();
	});

	it('should parse --amend flag', () => {
		const result = parseCommitArgs(['--amend']);
		expect(result.amend).toBe(true);
	});

	it('should parse -a shorthand for amend', () => {
		const result = parseCommitArgs(['-a']);
		expect(result.amend).toBe(true);
	});

	it('should parse --dry-run flag', () => {
		const result = parseCommitArgs(['--dry-run']);
		expect(result.dryRun).toBe(true);
	});

	it('should parse -n shorthand for dry-run', () => {
		const result = parseCommitArgs(['-n']);
		expect(result.dryRun).toBe(true);
	});

	it('should parse -m message', () => {
		const result = parseCommitArgs(['-m', 'fix: resolve bug']);
		expect(result.message).toBe('fix: resolve bug');
	});

	it('should parse --message message', () => {
		const result = parseCommitArgs(['--message', 'feat: add feature']);
		expect(result.message).toBe('feat: add feature');
	});

	it('should parse bare message', () => {
		const result = parseCommitArgs(['fix:', 'resolve', 'bug']);
		expect(result.message).toBe('fix: resolve bug');
	});

	it('should parse --generate flag', () => {
		const result = parseCommitArgs(['--generate']);
		expect(result.generateMessage).toBe(true);
	});

	it('should parse --no-stage flag', () => {
		const result = parseCommitArgs(['--no-stage']);
		expect(result.stageAll).toBe(false);
	});

	it('should handle combined flags', () => {
		const result = parseCommitArgs([
			'--dry-run',
			'-m',
			'test message',
			'--amend',
		]);
		expect(result.dryRun).toBe(true);
		expect(result.message).toBe('test message');
		expect(result.amend).toBe(true);
	});
});

describe('formatCommitMessage', () => {
	it('should add FLOYD attribution', () => {
		const result = formatCommitMessage('fix: resolve bug');
		expect(result).toContain('fix: resolve bug');
		expect(result).toContain('Generated with FLOYD CLI');
		expect(result).toContain('Assisted-by: Claude via FLOYD');
	});

	it('should not duplicate attribution', () => {
		const messageWithAttribution = `fix: resolve bug


🤖 Generated with FLOYD CLI


Assisted-by: Claude via FLOYD <floyd@charmpunk.dev>`;

		const result = formatCommitMessage(messageWithAttribution);
		expect(result).toBe(messageWithAttribution);
	});
});

describe('generateDefaultMessage', () => {
	it('should generate message for added files', () => {
		const result = generateDefaultMessage({
			current: 'main',
			tracking: null,
			files: [{path: 'new-file.ts', status: 'A', staged: true}],
			ahead: 0,
			behind: 0,
		});
		expect(result).toBe('Add 1 file');
	});

	it('should generate message for modified files', () => {
		const result = generateDefaultMessage({
			current: 'main',
			tracking: null,
			files: [
				{path: 'file1.ts', status: 'M', staged: true},
				{path: 'file2.ts', status: 'M', staged: true},
			],
			ahead: 0,
			behind: 0,
		});
		expect(result).toBe('Modify 2 files');
	});

	it('should generate message for deleted files', () => {
		const result = generateDefaultMessage({
			current: 'main',
			tracking: null,
			files: [{path: 'old-file.ts', status: 'D', staged: true}],
			ahead: 0,
			behind: 0,
		});
		expect(result).toBe('Delete 1 file');
	});

	it('should generate combined message', () => {
		const result = generateDefaultMessage({
			current: 'main',
			tracking: null,
			files: [
				{path: 'new.ts', status: 'A', staged: true},
				{path: 'modified.ts', status: 'M', staged: true},
				{path: 'deleted.ts', status: 'D', staged: true},
			],
			ahead: 0,
			behind: 0,
		});
		expect(result).toBe('Add 1 file, modify 1 file, delete 1 file');
	});

	it('should return default for no categorized changes', () => {
		const result = generateDefaultMessage({
			current: 'main',
			tracking: null,
			files: [{path: 'unknown.ts', status: 'R', staged: true}],
			ahead: 0,
			behind: 0,
		});
		expect(result).toBe('Update codebase');
	});
});

describe('handleCommit', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should fail when not a git repository', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: false,
			error: 'Not a git repository',
		});

		const result = await handleCommit([], {args: []});

		expect(result.success).toBe(false);
		expect(result.error).toContain('Not a git repository');
	});

	it('should fail with no changes', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [],
			ahead: 0,
			behind: 0,
		});

		const result = await handleCommit([], {args: []});

		expect(result.success).toBe(false);
		expect(result.message).toBe('No changes to commit');
	});

	it('should stage files when no staged changes exist', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: false}],
			ahead: 0,
			behind: 0,
		});
		mockStageFiles.mockResolvedValue({success: true});
		mockCreateCommit.mockResolvedValue({
			success: true,
			hash: 'abc1234',
		});

		await handleCommit(['-m', 'test'], {args: []});

		expect(mockStageFiles).toHaveBeenCalled();
	});

	it('should use provided message', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: true}],
			ahead: 0,
			behind: 0,
		});
		mockStageFiles.mockResolvedValue({success: true});
		mockCreateCommit.mockResolvedValue({
			success: true,
			hash: 'abc1234',
		});

		const result = await handleCommit(['-m', 'fix: specific bug'], {args: []});

		expect(result.success).toBe(true);
		expect(mockCreateCommit).toHaveBeenCalledWith(
			expect.stringContaining('fix: specific bug'),
			expect.any(Object),
		);
	});

	it('should handle --dry-run', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: true}],
			ahead: 0,
			behind: 0,
		});

		const result = await handleCommit(['--dry-run', '-m', 'test'], {args: []});

		expect(result.success).toBe(true);
		expect(result.message).toContain('[DRY RUN]');
		expect(mockCreateCommit).not.toHaveBeenCalled();
	});

	it('should pass amend flag to createCommit', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: true}],
			ahead: 0,
			behind: 0,
		});
		mockStageFiles.mockResolvedValue({success: true});
		mockCreateCommit.mockResolvedValue({
			success: true,
			hash: 'abc1234',
		});

		await handleCommit(['--amend', '-m', 'amended'], {args: []});

		expect(mockCreateCommit).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({amend: true}),
		);
	});

	it('should return commit hash on success', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: true}],
			ahead: 0,
			behind: 0,
		});
		mockStageFiles.mockResolvedValue({success: true});
		mockCreateCommit.mockResolvedValue({
			success: true,
			hash: 'abc1234def',
		});

		const result = await handleCommit(['-m', 'test'], {args: []});

		expect(result.success).toBe(true);
		expect(result.commitHash).toBe('abc1234def');
	});

	it('should handle commit failure', async () => {
		mockGetGitStatus.mockResolvedValue({
			isRepo: true,
			current: 'main',
			tracking: null,
			files: [{path: 'file.ts', status: 'M', staged: true}],
			ahead: 0,
			behind: 0,
		});
		mockStageFiles.mockResolvedValue({success: true});
		mockCreateCommit.mockResolvedValue({
			success: false,
			error: 'Pre-commit hook failed',
		});

		const result = await handleCommit(['-m', 'test'], {args: []});

		expect(result.success).toBe(false);
		expect(result.error).toBe('Pre-commit hook failed');
	});
});
