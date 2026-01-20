/**
 * File Snapshot
 *
 * Captures and stores file state for checkpoints.
 *
 * @module rewind/file-snapshot
 */

import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Stats} from 'node:fs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * File snapshot data
 */
export interface FileSnapshot {
	/** File path */
	path: string;

	/** File content hash */
	hash: string;

	/** File content */
	content: string;

	/** File stats */
	stats: {
		size: number;
		mode: number;
		mtime: Date;
		birthtime?: Date;
	};

	/** Snapshot timestamp */
	snapshotAt: Date;
}

/**
 * Snapshot options
 */
export interface SnapshotOptions {
	/** Include file stats */
	includeStats?: boolean;

	/** Include content hash */
	includeHash?: boolean;

	/** Compression (not implemented yet) */
	compress?: boolean;
}

// ============================================================================
// FILE SNAPSHOT CLASS
// ============================================================================

/**
 * FileSnapshot - Capture and store file state
 *
 * Creates snapshots of files for use in checkpoints.
 * Stores content, hash, and metadata for later restoration.
 */
export class FileSnapshotManager {
	private readonly options: Required<SnapshotOptions>;

	constructor(options: SnapshotOptions = {}) {
		this.options = {
			includeStats: options.includeStats ?? true,
			includeHash: options.includeHash ?? true,
			compress: options.compress ?? false,
		};
	}

	/**
	 * Create a snapshot of a file
	 */
	async createSnapshot(path: string): Promise<FileSnapshot> {
		// Read file content
		const content = await readFile(path, 'utf-8');

		// Generate hash
		const hash = this.options.includeHash
			? this.generateHash(content)
			: '';

		// Get file stats
		let fileStats: Stats | undefined;
		if (this.options.includeStats) {
			fileStats = await stat(path);
		}

		// Create snapshot
		const snapshot: FileSnapshot = {
			path,
			hash,
			content,
			stats: fileStats
				? {
					size: fileStats.size,
					mode: fileStats.mode,
					mtime: fileStats.mtime,
					birthtime: fileStats.birthtime,
				}
				: {
					size: content.length,
					mode: 0,
					mtime: new Date(),
				},
			snapshotAt: new Date(),
		};

		return snapshot;
	}

	/**
	 * Create snapshots of multiple files
	 */
	async createSnapshots(paths: string[]): Promise<FileSnapshot[]> {
		const snapshots: FileSnapshot[] = [];

		for (const path of paths) {
			try {
				const snapshot = await this.createSnapshot(path);
				snapshots.push(snapshot);
			} catch (error) {
				// Skip files that can't be read
				console.warn(`Failed to snapshot ${path}:`, error);
			}
		}

		return snapshots;
	}

	/**
	 * Validate a snapshot (check if file has changed)
	 */
	async validateSnapshot(snapshot: FileSnapshot): Promise<boolean> {
		try {
			const currentContent = await readFile(snapshot.path, 'utf-8');
			const currentHash = this.generateHash(currentContent);

			return currentHash === snapshot.hash;
		} catch {
			// File no longer exists or can't be read
			return false;
		}
	}

	/**
	 * Get snapshot size in bytes
	 */
	getSnapshotSize(snapshot: FileSnapshot): number {
		// Content size (UTF-16: 2 bytes per char)
		const contentSize = snapshot.content.length * 2;

		// Stats size (rough estimate)
		const statsSize = JSON.stringify(snapshot.stats).length * 2;

		// Path size
		const pathSize = snapshot.path.length * 2;

		// Hash size
		const hashSize = snapshot.hash.length * 2;

		return contentSize + statsSize + pathSize + hashSize + 100; // 100 bytes overhead
	}

	/**
	 * Convert snapshot to JSON (for storage)
	 */
	snapshotToJSON(snapshot: FileSnapshot): string {
		return JSON.stringify(snapshot);
	}

	/**
	 * Parse snapshot from JSON
	 */
	snapshotFromJSON(json: string): FileSnapshot {
		const parsed = JSON.parse(json);

		// Convert date strings back to Date objects
		return {
			...parsed,
			snapshotAt: new Date(parsed.snapshotAt),
			stats: {
				...parsed.stats,
				mtime: new Date(parsed.stats.mtime),
				birthtime: parsed.stats.birthtime
					? new Date(parsed.stats.birthtime)
					: undefined,
			},
		};
	}

	/**
	 * Generate content hash
	 */
	private generateHash(content: string): string {
		return createHash('sha256').update(content).digest('hex');
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total size of multiple snapshots
 */
export function calculateTotalSnapshotsSize(snapshots: FileSnapshot[]): number {
	const manager = new FileSnapshotManager();

	return snapshots.reduce((total, snapshot) => {
		return total + manager.getSnapshotSize(snapshot);
	}, 0);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB'];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default FileSnapshotManager;
