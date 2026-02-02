/**
 * File System Utilities
 *
 * Wrapper around Node.js fs with promises and helpful utilities.
 *
 * @module utils/fs
 */

import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import path from 'node:path';

// ============================================================================
// PROMISIFIED FS OPERATIONS
// ============================================================================

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
	try {
		await fs.mkdir(dirPath, {recursive: true});
	} catch (error) {
		// Ignore error if directory already exists
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
			throw error;
		}
	}
}

/**
 * Check if a file exists
 */
export async function exists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Check if a path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(filePath);
		return stats.isFile();
	} catch {
		return false;
	}
}

/**
 * Read a file as string
 */
export async function readFile(
	filePath: string,
	encoding: BufferEncoding = 'utf-8',
): Promise<string> {
	return fs.readFile(filePath, encoding);
}

/**
 * Write a file
 */
export async function writeFile(
	filePath: string,
	data: string,
	encoding: BufferEncoding = 'utf-8',
): Promise<void> {
	const dir = path.dirname(filePath);
	await ensureDir(dir);
	return fs.writeFile(filePath, data, encoding);
}

/**
 * Read JSON file
 */
export async function readJSON<T = unknown>(filePath: string): Promise<T> {
	const content = await readFile(filePath);
	return JSON.parse(content) as T;
}

/**
 * Write JSON file
 */
export async function writeJSON(
	filePath: string,
	data: unknown,
	indent: number | string = 2,
): Promise<void> {
	const content = JSON.stringify(data, null, indent);
	return writeFile(filePath, content);
}

/**
 * Delete a file
 */
export async function remove(filePath: string): Promise<void> {
	await fs.rm(filePath, {force: true, recursive: true});
}

/**
 * Copy a file
 */
export async function copy(src: string, dest: string): Promise<void> {
	const destDir = path.dirname(dest);
	await ensureDir(destDir);
	return fs.copyFile(src, dest);
}

/**
 * Move a file
 */
export async function move(src: string, dest: string): Promise<void> {
	const destDir = path.dirname(dest);
	await ensureDir(destDir);
	return fs.rename(src, dest);
}

/**
 * List files in a directory
 */
export async function readdir(dirPath: string): Promise<string[]> {
	return fs.readdir(dirPath);
}

/**
 * Get file stats
 */
export async function stat(filePath: string): Promise<fsSync.Stats> {
	return fs.stat(filePath);
}

// ============================================================================
// SYNCHRONOUS OPERATIONS
// ============================================================================

/**
 * Synchronously check if a file exists
 */
export function existsSync(filePath: string): boolean {
	return fsSync.existsSync(filePath);
}

/**
 * Synchronously read a file
 */
export function readFileSync(
	filePath: string,
	encoding: BufferEncoding = 'utf-8',
): string {
	return fsSync.readFileSync(filePath, encoding);
}

/**
 * Synchronously write a file
 */
export function writeFileSync(
	filePath: string,
	data: string,
	encoding: BufferEncoding = 'utf-8',
): void {
	const dir = path.dirname(filePath);
	fsSync.mkdirSync(dir, {recursive: true});
	fsSync.writeFileSync(filePath, data, encoding);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export path utilities
export {dirname, join, basename, resolve, sep} from 'node:path';

export default {
	ensureDir,
	exists,
	isDirectory,
	isFile,
	readFile,
	writeFile,
	readJSON,
	writeJSON,
	remove,
	copy,
	move,
	readdir,
	stat,
	existsSync,
	readFileSync,
	writeFileSync,
};
