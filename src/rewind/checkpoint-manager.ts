/**
 * Checkpoint Manager
 *
 * Creates, manages, and restores checkpoints.
 *
 * @module rewind/checkpoint-manager
 */

import {mkdir, writeFile, readFile, readdir, unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import type {FileSnapshot} from './file-snapshot.js';
import {FileSnapshotManager} from './file-snapshot.js';
import {calculateTotalSnapshotsSize, formatBytes} from './file-snapshot.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Checkpoint metadata
 */
export interface Checkpoint {
	/** Unique checkpoint ID */
	id: string;

	/** Checkpoint name */
	name: string;

	/** Checkpoint description */
	description?: string;

	/** File snapshots */
	snapshots: FileSnapshot[];

	/** Timestamp */
	createdAt: Date;

	/** Total size in bytes */
	size: number;

	/** Number of files */
	fileCount: number;

	/** Checkpoint tags */
	tags: string[];

	/** Automatic checkpoint (created before dangerous operation) */
	automatic: boolean;
}

/**
 * Checkpoint creation options
 */
export interface CheckpointOptions {
	/** Checkpoint name */
	name?: string;

	/** Checkpoint description */
	description?: string;

	/** Checkpoint tags */
	tags?: string[];

	/** Automatic checkpoint */
	automatic?: boolean;

	/** Include patterns (glob patterns) */
	include?: string[];

	/** Exclude patterns (glob patterns) */
	exclude?: string[];
}

/**
 * Checkpoint storage options
 */
export interface CheckpointStorageOptions {
	/** Checkpoints directory */
	checkpointsDir?: string;

	/** Maximum checkpoints to keep */
	maxCheckpoints?: number;

	/** Maximum total storage size in bytes */
	maxStorageSize?: number;

	/** Compression (not implemented yet) */
	compression?: boolean;
}

// ============================================================================
// CHECKPOINT MANAGER CLASS
// ============================================================================

/**
 * CheckpointManager - Create and manage checkpoints
 *
 * Provides checkpoint functionality for undo/redo operations.
 * Checkpoints capture file states at a point in time.
 */
export class CheckpointManager {
	private readonly storageDir: string;
	private readonly options: Required<CheckpointStorageOptions>;
	private readonly snapshotManager: FileSnapshotManager;
	private readonly checkpoints: Map<string, Checkpoint> = new Map();

	constructor(options: CheckpointStorageOptions = {}) {
		this.storageDir = options.checkpointsDir ||
			join(homedir(), '.floyd', 'checkpoints');

		this.options = {
			checkpointsDir: this.storageDir,
			maxCheckpoints: options.maxCheckpoints ?? 50,
			maxStorageSize: options.maxStorageSize ?? 500 * 1024 * 1024, // 500 MB
			compression: options.compression ?? false,
		};

		this.snapshotManager = new FileSnapshotManager({
			includeStats: true,
			includeHash: true,
		});
	}

	/**
	 * Initialize checkpoint manager
	 */
	async initialize(): Promise<void> {
		// Create checkpoints directory
		await mkdir(this.storageDir, {recursive: true});

		// Load existing checkpoints
		await this.loadCheckpoints();
	}

	/**
	 * Create a checkpoint
	 */
	async createCheckpoint(
		paths: string[],
		options: CheckpointOptions = {},
	): Promise<Checkpoint> {
		// Generate checkpoint ID
		const id = this.generateCheckpointId();

		// Create snapshots
		const snapshots = await this.snapshotManager.createSnapshots(paths);

		if (snapshots.length === 0) {
			throw new Error('No files were snapshotted');
		}

		// Calculate size
		const size = calculateTotalSnapshotsSize(snapshots);

		// Create checkpoint
		const checkpoint: Checkpoint = {
			id,
			name: options.name || `checkpoint-${id.slice(0, 8)}`,
			description: options.description,
			snapshots,
			createdAt: new Date(),
			size,
			fileCount: snapshots.length,
			tags: options.tags || [],
			automatic: options.automatic ?? false,
		};

		// Save checkpoint
		await this.saveCheckpoint(checkpoint);

		// Add to memory
		this.checkpoints.set(id, checkpoint);

		// Cleanup old checkpoints
		await this.cleanup();

		return checkpoint;
	}

	/**
	 * Restore a checkpoint
	 */
	async restoreCheckpoint(checkpointId: string): Promise<void> {
		const checkpoint = this.checkpoints.get(checkpointId);

		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		// Restore each file
		for (const snapshot of checkpoint.snapshots) {
			try {
				await writeFile(snapshot.path, snapshot.content, 'utf-8');
			} catch (error) {
				console.error(`Failed to restore ${snapshot.path}:`, error);
			}
		}
	}

	/**
	 * Restore specific files from a checkpoint
	 */
	async restoreFiles(
		checkpointId: string,
		filePaths: string[],
	): Promise<void> {
		const checkpoint = this.checkpoints.get(checkpointId);

		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		// Find snapshots for requested files
		const snapshotsToRestore = checkpoint.snapshots.filter(s =>
			filePaths.includes(s.path),
		);

		if (snapshotsToRestore.length === 0) {
			throw new Error('No matching files found in checkpoint');
		}

		// Restore files
		for (const snapshot of snapshotsToRestore) {
			try {
				await writeFile(snapshot.path, snapshot.content, 'utf-8');
			} catch (error) {
				console.error(`Failed to restore ${snapshot.path}:`, error);
			}
		}
	}

	/**
	 * Delete a checkpoint
	 */
	async deleteCheckpoint(checkpointId: string): Promise<boolean> {
		const checkpoint = this.checkpoints.get(checkpointId);

		if (!checkpoint) {
			return false;
		}

		// Delete checkpoint file
		try {
			const checkpointPath = join(this.storageDir, `${checkpointId}.json`);
			await unlink(checkpointPath);
		} catch {
			// Ignore if file doesn't exist
		}

		// Remove from memory
		this.checkpoints.delete(checkpointId);

		return true;
	}

	/**
	 * Get a checkpoint by ID
	 */
	getCheckpoint(checkpointId: string): Checkpoint | undefined {
		return this.checkpoints.get(checkpointId);
	}

	/**
	 * Get all checkpoints
	 */
	getAllCheckpoints(): Checkpoint[] {
		return Array.from(this.checkpoints.values())
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	/**
	 * Get checkpoints by tag
	 */
	getCheckpointsByTag(tag: string): Checkpoint[] {
		return this.getAllCheckpoints().filter(c => c.tags.includes(tag));
	}

	/**
	 * Get automatic checkpoints
	 */
	getAutomaticCheckpoints(): Checkpoint[] {
		return this.getAllCheckpoints().filter(c => c.automatic);
	}

	/**
	 * Get manual checkpoints
	 */
	getManualCheckpoints(): Checkpoint[] {
		return this.getAllCheckpoints().filter(c => !c.automatic);
	}

	/**
	 * Get checkpoint statistics
	 */
	getStats(): {
		totalCheckpoints: number;
		automaticCheckpoints: number;
		manualCheckpoints: number;
		totalSize: number;
		totalFiles: number;
		oldestCheckpoint?: Date;
		newestCheckpoint?: Date;
	} {
		const checkpoints = this.getAllCheckpoints();
		const automatic = checkpoints.filter(c => c.automatic).length;
		const manual = checkpoints.length - automatic;
		const totalSize = checkpoints.reduce((sum, c) => sum + c.size, 0);
		const totalFiles = checkpoints.reduce((sum, c) => sum + c.fileCount, 0);

		return {
			totalCheckpoints: checkpoints.length,
			automaticCheckpoints: automatic,
			manualCheckpoints: manual,
			totalSize,
			totalFiles,
			oldestCheckpoint: checkpoints[checkpoints.length - 1]?.createdAt,
			newestCheckpoint: checkpoints[0]?.createdAt,
		};
	}

	/**
	 * Clear all checkpoints
	 */
	async clearAll(): Promise<void> {
		const checkpointIds = Array.from(this.checkpoints.keys());

		for (const id of checkpointIds) {
			await this.deleteCheckpoint(id);
		}
	}

	/**
	 * Save checkpoint to disk
	 */
	private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
		const checkpointPath = join(this.storageDir, `${checkpoint.id}.json`);

		// Convert snapshots to JSON format
		const checkpointData = {
			...checkpoint,
			snapshots: checkpoint.snapshots.map(s =>
				this.snapshotManager.snapshotToJSON(s),
			),
		};

		await writeFile(checkpointPath, JSON.stringify(checkpointData, null, 2), 'utf-8');
	}

	/**
	 * Load checkpoints from disk
	 */
	private async loadCheckpoints(): Promise<void> {
		try {
			const files = await readdir(this.storageDir);

			for (const file of files) {
				if (!file.endsWith('.json')) {
					continue;
				}

				try {
					const checkpointPath = join(this.storageDir, file);
					const content = await readFile(checkpointPath, 'utf-8');
					const data = JSON.parse(content);

					// Parse snapshots back from JSON
					const snapshots = data.snapshots.map((s: string) =>
						this.snapshotManager.snapshotFromJSON(s),
					);

					// Create checkpoint
					const checkpoint: Checkpoint = {
						...data,
						snapshots,
						createdAt: new Date(data.createdAt),
					};

					this.checkpoints.set(checkpoint.id, checkpoint);
				} catch (error) {
					console.error(`Failed to load checkpoint from ${file}:`, error);
				}
			}
		} catch {
			// Directory doesn't exist yet
		}
	}

	/**
	 * Cleanup old checkpoints
	 */
	private async cleanup(): Promise<void> {
		const checkpoints = this.getAllCheckpoints();
		const stats = this.getStats();

		// Check max checkpoints limit
		if (checkpoints.length > this.options.maxCheckpoints) {
			// Remove oldest automatic checkpoints first
			const toRemove = checkpoints
				.filter(c => c.automatic)
				.slice(this.options.maxCheckpoints);

			for (const checkpoint of toRemove) {
				await this.deleteCheckpoint(checkpoint.id);
			}
		}

		// Check storage size limit
		if (stats.totalSize > this.options.maxStorageSize) {
			// Remove oldest checkpoints until under limit
			const checkpoints = this.getAllCheckpoints();
			let currentSize = stats.totalSize;

			for (const checkpoint of checkpoints) {
				if (currentSize <= this.options.maxStorageSize) {
					break;
				}

				await this.deleteCheckpoint(checkpoint.id);
				currentSize -= checkpoint.size;
			}
		}
	}

	/**
	 * Generate checkpoint ID
	 */
	private generateCheckpointId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).slice(2, 10);
		return `cp-${timestamp}-${random}`;
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default global checkpoint manager instance
 */
let defaultCheckpointManager: CheckpointManager | null = null;

/**
 * Get or create the default checkpoint manager
 */
export function getDefaultCheckpointManager(
	options?: CheckpointStorageOptions,
): CheckpointManager {
	if (!defaultCheckpointManager) {
		defaultCheckpointManager = new CheckpointManager(options);
	}
	return defaultCheckpointManager;
}

/**
 * Reset the default checkpoint manager (useful for testing)
 */
export function resetDefaultCheckpointManager(): void {
	defaultCheckpointManager = null;
}

export {FileSnapshotManager, formatBytes};
export default CheckpointManager;
