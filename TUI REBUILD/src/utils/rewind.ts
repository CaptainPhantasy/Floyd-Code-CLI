/**
 * Rewind System - FLOYD TUI
 *
 * Provides checkpoint and rewind functionality across all interfaces.
 * Uses the core CheckpointManager from floyd-wrapper-main.
 */

import {mkdir, writeFile, readFile, readdir, unlink, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface FileSnapshot {
	path: string;
	content: string;
	size: number;
	hash: string;
	createdAt: number;
	mtime?: number;
	mode?: number;
}

export interface Checkpoint {
	id: string;
	name: string;
	description?: string;
	snapshots: FileSnapshot[];
	createdAt: Date;
	size: number;
	fileCount: number;
	tags: string[];
	automatic: boolean;
}

export interface RewindStats {
	totalCheckpoints: number;
	automaticCheckpoints: number;
	manualCheckpoints: number;
	totalSize: number;
	totalFiles: number;
	oldestCheckpoint?: Date;
	newestCheckpoint?: Date;
}

// ============================================================================
// REWIND MANAGER
// ============================================================================

class RewindManager {
	private readonly storageDir: string;
	private readonly maxCheckpoints: number;
	private readonly maxStorageSize: number;
	private checkpoints: Map<string, Checkpoint> = new Map();
	private initialized = false;

	constructor() {
		this.storageDir = join(homedir(), '.floyd', 'checkpoints');
		this.maxCheckpoints = 50;
		this.maxStorageSize = 500 * 1024 * 1024; // 500 MB
	}

	/**
	 * Initialize rewind manager
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		await mkdir(this.storageDir, {recursive: true});
		await this.loadCheckpoints();
		this.initialized = true;
	}

	/**
	 * Create a checkpoint before dangerous operations
	 */
	async createCheckpoint(
		paths: string[],
		options: {
			name?: string;
			description?: string;
			tags?: string[];
			automatic?: boolean;
		} = {},
	): Promise<Checkpoint> {
		await this.initialize();

		const id = this.generateId();
		const snapshots: FileSnapshot[] = [];

		for (const path of paths) {
			try {
				const content = await readFile(path, 'utf-8');
				const stats = await stat(path);
				const hash = createHash('sha256').update(content).digest('hex');

				snapshots.push({
					path,
					content,
					size: Buffer.byteLength(content),
					hash,
					createdAt: Date.now(),
					mtime: stats.mtimeMs,
					mode: stats.mode,
				});
			} catch {
				// File doesn't exist or can't be read - skip
			}
		}

		if (snapshots.length === 0) {
			throw new Error('No files were snapshotted');
		}

		const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);

		const checkpoint: Checkpoint = {
			id,
			name: options.name || `checkpoint-${id.slice(0, 8)}`,
			description: options.description,
			snapshots,
			createdAt: new Date(),
			size: totalSize,
			fileCount: snapshots.length,
			tags: options.tags || [],
			automatic: options.automatic ?? false,
		};

		await this.saveCheckpoint(checkpoint);
		this.checkpoints.set(id, checkpoint);
		await this.cleanup();

		return checkpoint;
	}

	/**
	 * Rewind to a checkpoint
	 */
	async rewindTo(checkpointId: string): Promise<{restored: string[]; failed: string[]}> {
		await this.initialize();

		const checkpoint = this.checkpoints.get(checkpointId);
		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		const restored: string[] = [];
		const failed: string[] = [];

		for (const snapshot of checkpoint.snapshots) {
			try {
				await writeFile(snapshot.path, snapshot.content, 'utf-8');
				restored.push(snapshot.path);
			} catch (error) {
				failed.push(snapshot.path);
			}
		}

		return {restored, failed};
	}

	/**
	 * Rewind specific files from a checkpoint
	 */
	async rewindFiles(
		checkpointId: string,
		filePaths: string[],
	): Promise<{restored: string[]; failed: string[]}> {
		await this.initialize();

		const checkpoint = this.checkpoints.get(checkpointId);
		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		const restored: string[] = [];
		const failed: string[] = [];

		const snapshotsToRestore = checkpoint.snapshots.filter(s =>
			filePaths.includes(s.path),
		);

		for (const snapshot of snapshotsToRestore) {
			try {
				await writeFile(snapshot.path, snapshot.content, 'utf-8');
				restored.push(snapshot.path);
			} catch {
				failed.push(snapshot.path);
			}
		}

		return {restored, failed};
	}

	/**
	 * List all checkpoints
	 */
	async listCheckpoints(): Promise<Checkpoint[]> {
		await this.initialize();
		return Array.from(this.checkpoints.values()).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);
	}

	/**
	 * Get a specific checkpoint
	 */
	async getCheckpoint(id: string): Promise<Checkpoint | undefined> {
		await this.initialize();
		return this.checkpoints.get(id);
	}

	/**
	 * Delete a checkpoint
	 */
	async deleteCheckpoint(id: string): Promise<boolean> {
		await this.initialize();

		if (!this.checkpoints.has(id)) {
			return false;
		}

		try {
			await unlink(join(this.storageDir, `${id}.json`));
		} catch {
			// Ignore
		}

		this.checkpoints.delete(id);
		return true;
	}

	/**
	 * Get statistics
	 */
	async getStats(): Promise<RewindStats> {
		await this.initialize();

		const checkpoints = await this.listCheckpoints();
		const automatic = checkpoints.filter(c => c.automatic).length;

		return {
			totalCheckpoints: checkpoints.length,
			automaticCheckpoints: automatic,
			manualCheckpoints: checkpoints.length - automatic,
			totalSize: checkpoints.reduce((sum, c) => sum + c.size, 0),
			totalFiles: checkpoints.reduce((sum, c) => sum + c.fileCount, 0),
			oldestCheckpoint: checkpoints[checkpoints.length - 1]?.createdAt,
			newestCheckpoint: checkpoints[0]?.createdAt,
		};
	}

	/**
	 * Clear all checkpoints
	 */
	async clearAll(): Promise<void> {
		await this.initialize();

		for (const id of this.checkpoints.keys()) {
			await this.deleteCheckpoint(id);
		}
	}

	/**
	 * Get diff between checkpoint and current state
	 */
	async getDiff(checkpointId: string, filePath: string): Promise<{
		original: string | null;
		current: string | null;
		changed: boolean;
	}> {
		await this.initialize();

		const checkpoint = this.checkpoints.get(checkpointId);
		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		const snapshot = checkpoint.snapshots.find(s => s.path === filePath);
		const original = snapshot?.content ?? null;

		let current: string | null = null;
		try {
			current = await readFile(filePath, 'utf-8');
		} catch {
			// File doesn't exist
		}

		return {
			original,
			current,
			changed: original !== current,
		};
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	private generateId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).slice(2, 10);
		return `cp-${timestamp}-${random}`;
	}

	private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
		const data = {
			...checkpoint,
			snapshots: checkpoint.snapshots.map(s => ({
				...s,
				content: Buffer.from(s.content).toString('base64'),
			})),
		};

		await writeFile(
			join(this.storageDir, `${checkpoint.id}.json`),
			JSON.stringify(data, null, 2),
			'utf-8',
		);
	}

	private async loadCheckpoints(): Promise<void> {
		try {
			const files = await readdir(this.storageDir);

			for (const file of files) {
				if (!file.endsWith('.json')) continue;

				try {
					const content = await readFile(join(this.storageDir, file), 'utf-8');
					const data = JSON.parse(content);

					const checkpoint: Checkpoint = {
						...data,
						createdAt: new Date(data.createdAt),
						snapshots: data.snapshots.map((s: any) => ({
							...s,
							content: Buffer.from(s.content, 'base64').toString('utf-8'),
						})),
					};

					this.checkpoints.set(checkpoint.id, checkpoint);
				} catch {
					// Skip invalid checkpoints
				}
			}
		} catch {
			// Directory doesn't exist yet
		}
	}

	private async cleanup(): Promise<void> {
		const checkpoints = await this.listCheckpoints();

		// Enforce max checkpoints
		if (checkpoints.length > this.maxCheckpoints) {
			const toRemove = checkpoints
				.filter(c => c.automatic)
				.slice(this.maxCheckpoints);

			for (const cp of toRemove) {
				await this.deleteCheckpoint(cp.id);
			}
		}

		// Enforce storage limit
		const stats = await this.getStats();
		if (stats.totalSize > this.maxStorageSize) {
			const sorted = checkpoints.slice();
			let currentSize = stats.totalSize;

			for (const cp of sorted) {
				if (currentSize <= this.maxStorageSize) break;
				await this.deleteCheckpoint(cp.id);
				currentSize -= cp.size;
			}
		}
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: RewindManager | null = null;

export function getRewindManager(): RewindManager {
	if (!instance) {
		instance = new RewindManager();
	}
	return instance;
}

export default RewindManager;
