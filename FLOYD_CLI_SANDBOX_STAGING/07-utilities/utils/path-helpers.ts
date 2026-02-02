/**
 * Path Helpers Utility
 *
 * Purpose: File path manipulation and resolution utilities
 * Exports: PathHelpers class, normalizePath, resolvePath, etc.
 * Related: fs.ts
 */

import path from 'node:path';
import os from 'node:os';
import * as fs from 'node:fs';

// ============================================================================
// TYPES
// ============================================================================

export interface PathResolutionOptions {
	/**
	 * Prefer absolute paths
	 */
	absolute?: boolean;

	/**
	 * Expand ~ to home directory
	 */
	expandHome?: boolean;

	/**
	 * Normalize path separators
	 */
	normalize?: boolean;

	/**
	 * Resolve relative paths against cwd
	 */
	cwd?: string;
}

export interface PathInfo {
	/**
	 * The original path
	 */
	original: string;

	/**
	 * The normalized path
	 */
	normalized: string;

	/**
	 * Whether the path is absolute
	 */
	absolute: boolean;

	/**
	 * Whether the path exists
	 */
	exists: boolean;

	/**
	 * Whether path is a directory
	 */
	isDirectory: boolean;

	/**
	 * Whether path is a file
	 */
	isFile: boolean;

	/**
	 * Path extension (including dot)
	 */
	extension: string;

	/**
	 * Path basename (without extension)
	 */
	stem: string;

	/**
	 * Path basename (with extension)
	 */
	basename: string;

	/**
	 * Parent directory
	 */
	dirname: string;
}

// ============================================================================
// PATH HELPERS CLASS
// ============================================================================

/**
 * PathHelpers provides utility functions for path manipulation
 *
 * Features:
 * - Path normalization and resolution
 * - Home directory expansion
 * - Path information extraction
 * - Project root detection
 * - Git root detection
 */
export class PathHelpers {
	private cwd: string;

	constructor(cwd: string = process.cwd()) {
		this.cwd = cwd;
	}

	/**
	 * Set the current working directory
	 */
	setCwd(cwd: string): void {
		this.cwd = cwd;
	}

	/**
	 * Get the current working directory
	 */
	getCwd(): string {
		return this.cwd;
	}

	/**
	 * Normalize a path
	 */
	normalize(filePath: string): string {
		// Expand home directory
		filePath = this.expandHome(filePath);

		// Normalize path separators and resolve . and ..
		return path.normalize(filePath);
	}

	/**
	 * Resolve a path to absolute
	 */
	resolve(filePath: string): string {
		// Expand and normalize first
		filePath = this.normalize(filePath);

		// If already absolute, return normalized
		if (path.isAbsolute(filePath)) {
			return filePath;
		}

		// Resolve against cwd
		return path.resolve(this.cwd, filePath);
	}

	/**
	 * Expand ~ to home directory
	 */
	expandHome(filePath: string): string {
		if (filePath.startsWith('~/') || filePath === '~') {
			return filePath.replace('~', os.homedir());
		}
		return filePath;
	}

	/**
	 * Get the relative path from cwd to the given path
	 */
	relative(filePath: string): string {
		const absolute = this.resolve(filePath);
		return path.relative(this.cwd, absolute);
	}

	/**
	 * Join path segments
	 */
	join(...segments: string[]): string {
		return this.normalize(path.join(...segments));
	}

	/**
	 * Get comprehensive path information
	 */
	getPathInfo(filePath: string): PathInfo {
		const normalized = this.normalize(filePath);
		const absolute = this.resolve(filePath);
		const exists = fs.existsSync(absolute);

		let isDirectory = false;
		let isFile = false;

		if (exists) {
			const stats = fs.statSync(absolute);
			isDirectory = stats.isDirectory();
			isFile = stats.isFile();
		}

		const parsed = path.parse(absolute);

		return {
			original: filePath,
			normalized,
			absolute: path.isAbsolute(normalized),
			exists,
			isDirectory,
			isFile,
			extension: parsed.ext,
			stem: parsed.name,
			basename: parsed.base,
			dirname: parsed.dir,
		};
	}

	/**
	 * Find the project root by looking for marker files
	 */
	findProjectRoot(filePath: string = this.cwd): string | null {
		const markers = [
			'package.json',
			'tsconfig.json',
			'.git',
			'.floyd',
			'CLAUDE.md',
			'pyproject.toml',
			'Cargo.toml',
			'go.mod',
		];

		let current = this.resolve(filePath);

		while (true) {
			// Check if any marker exists in current directory
			for (const marker of markers) {
				const markerPath = path.join(current, marker);
				if (fs.existsSync(markerPath)) {
					return current;
				}
			}

			// Move to parent directory
			const parent = path.dirname(current);

			// Reached filesystem root
			if (parent === current) {
				return null;
			}

			current = parent;
		}
	}

	/**
	 * Find the git root directory
	 */
	findGitRoot(filePath: string = this.cwd): string | null {
		let current = this.resolve(filePath);

		while (true) {
			const gitPath = path.join(current, '.git');

			if (fs.existsSync(gitPath)) {
				return current;
			}

			const parent = path.dirname(current);

			if (parent === current) {
				return null;
			}

			current = parent;
		}
	}

	/**
	 * Get the FLOYD config directory
	 */
	getFloydConfigDir(): string {
		return path.join(os.homedir(), '.floyd');
	}

	/**
	 * Get the FLOYD cache directory
	 */
	getFloydCacheDir(): string {
		const cacheDir =
			process.env['FLOYD_CACHE_DIR'] ??
			path.join(os.homedir(), '.floyd', 'cache');
		return cacheDir;
	}

	/**
	 * Get the FLOYD sessions directory
	 */
	getFloydSessionsDir(): string {
		return path.join(this.getFloydConfigDir(), 'sessions');
	}

	/**
	 * Get the FLOYD audit log directory
	 */
	getFloydAuditDir(): string {
		return path.join(this.getFloydConfigDir(), 'audit');
	}

	/**
	 * Ensure all FLOYD directories exist
	 */
	ensureFloydDirs(): void {
		const dirs = [
			this.getFloydConfigDir(),
			this.getFloydCacheDir(),
			this.getFloydSessionsDir(),
			this.getFloydAuditDir(),
		];

		for (const dir of dirs) {
			fs.mkdirSync(dir, {recursive: true});
		}
	}
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultPathHelpers: PathHelpers = new PathHelpers();

/**
 * Get the default PathHelpers instance
 */
export function getPathHelpers(): PathHelpers {
	return defaultPathHelpers;
}

/**
 * Create a new PathHelpers instance
 */
export function createPathHelpers(cwd?: string): PathHelpers {
	return new PathHelpers(cwd);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Normalize a path
 */
export function normalizePath(filePath: string): string {
	return defaultPathHelpers.normalize(filePath);
}

/**
 * Resolve a path to absolute
 */
export function resolvePath(filePath: string, cwd?: string): string {
	const helpers = cwd ? new PathHelpers(cwd) : defaultPathHelpers;
	return helpers.resolve(filePath);
}

/**
 * Expand ~ to home directory
 */
export function expandHome(filePath: string): string {
	return defaultPathHelpers.expandHome(filePath);
}

/**
 * Get relative path from cwd
 */
export function relativePath(filePath: string, cwd?: string): string {
	const helpers = cwd ? new PathHelpers(cwd) : defaultPathHelpers;
	return helpers.relative(filePath);
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
	return defaultPathHelpers.join(...segments);
}

/**
 * Get path information
 */
export function getPathInfo(filePath: string): PathInfo {
	return defaultPathHelpers.getPathInfo(filePath);
}

/**
 * Find project root
 */
export function findProjectRoot(filePath?: string): string | null {
	return defaultPathHelpers.findProjectRoot(filePath);
}

/**
 * Find git root
 */
export function findGitRoot(filePath?: string): string | null {
	return defaultPathHelpers.findGitRoot(filePath);
}

/**
 * Get FLOYD config directory
 */
export function getFloydConfigDir(): string {
	return defaultPathHelpers.getFloydConfigDir();
}

/**
 * Get FLOYD cache directory
 */
export function getFloydCacheDir(): string {
	return defaultPathHelpers.getFloydCacheDir();
}

/**
 * Get FLOYD sessions directory
 */
export function getFloydSessionsDir(): string {
	return defaultPathHelpers.getFloydSessionsDir();
}

/**
 * Get FLOYD audit directory
 */
export function getFloydAuditDir(): string {
	return defaultPathHelpers.getFloydAuditDir();
}

/**
 * Ensure all FLOYD directories exist
 */
export function ensureFloydDirs(): void {
	defaultPathHelpers.ensureFloydDirs();
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Convert Windows backslashes to forward slashes
 */
export function toForwardSlash(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}

/**
 * Check if a path is within another path
 */
export function isWithinPath(child: string, parent: string): boolean {
	const helpers = defaultPathHelpers;
	const resolvedChild = helpers.resolve(child);
	const resolvedParent = helpers.resolve(parent);
	const relative = path.relative(resolvedParent, resolvedChild);
	return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Get the common ancestor path of two paths
 */
export function getCommonAncestor(path1: string, path2: string): string {
	const helpers = defaultPathHelpers;
	const resolved1 = helpers.resolve(path1);
	const resolved2 = helpers.resolve(path2);

	const parts1 = resolved1.split(path.sep);
	const parts2 = resolved2.split(path.sep);

	const common: string[] = [];
	for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
		const part1 = parts1[i];
		const part2 = parts2[i];
		if (part1 && part2 && part1 === part2) {
			common.push(part1);
		} else {
			break;
		}
	}

	return common.length > 0 ? common.join(path.sep) : path.sep;
}

export default PathHelpers;
