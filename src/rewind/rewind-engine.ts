/**
 * Rewind Engine
 *
 * Manages undo/redo operations with checkpoints.
 *
 * @module rewind/rewind-engine
 */

import type {Checkpoint} from './checkpoint-manager.js';
import {CheckpointManager} from './checkpoint-manager.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rewind history entry
 */
export interface RewindHistoryEntry {
	/** Action type */
	type: 'checkpoint' | 'restore' | 'delete';

	/** Checkpoint ID */
	checkpointId: string;

	/** Timestamp */
	timestamp: Date;

	/** Description */
	description?: string;
}

/**
 * Rewind state
 */
export interface RewindState {
	/** Current position in history */
	currentPosition: number;

	/** History of actions */
	history: RewindHistoryEntry[];
}

/**
 * Rewind engine options
 */
export interface RewindEngineOptions {
	/** Maximum history size */
	maxHistorySize?: number;

	/** Enable automatic checkpoints */
	autoCheckpoint?: boolean;

	/** Auto-checkpoint patterns (dangerous operations) */
	autoCheckpointPatterns?: string[];
}

// ============================================================================
// REWIND ENGINE CLASS
// ============================================================================

/**
 * RewindEngine - Undo/redo with checkpoint management
 *
 * Manages a timeline of checkpoints and allows navigating back
 * and forth through file system states.
 */
export class RewindEngine {
	private readonly checkpointManager: CheckpointManager;
	private readonly state: RewindState;
	private readonly options: Required<RewindEngineOptions>;

	constructor(
		checkpointManager: CheckpointManager,
		options: RewindEngineOptions = {},
	) {
		this.checkpointManager = checkpointManager;
		this.options = {
			maxHistorySize: options.maxHistorySize ?? 100,
			autoCheckpoint: options.autoCheckpoint ?? true,
			autoCheckpointPatterns: options.autoCheckpointPatterns || [
				'**/*.ts',
				'**/*.tsx',
				'**/*.js',
				'**/*.jsx',
				'**/*.json',
			],
		};

		this.state = {
			currentPosition: -1,
			history: [],
		};
	}

	/**
	 * Create a checkpoint and add to history
	 */
	async checkpoint(
		paths: string[],
		options?: {
			name?: string;
			description?: string;
			tags?: string[];
			automatic?: boolean;
		},
	): Promise<Checkpoint> {
		// Create checkpoint
		const checkpoint = await this.checkpointManager.createCheckpoint(paths, {
			name: options?.name,
			description: options?.description,
			tags: options?.tags,
			automatic: options?.automatic,
		});

		// Add to history
		this.addToHistory({
			type: 'checkpoint',
			checkpointId: checkpoint.id,
			timestamp: new Date(),
			description: options?.description || checkpoint.name,
		});

		return checkpoint;
	}

	/**
	 * Rewind to a previous checkpoint
	 */
	async rewind(checkpointId: string): Promise<void> {
		const checkpoint = this.checkpointManager.getCheckpoint(checkpointId);

		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		// Restore checkpoint
		await this.checkpointManager.restoreCheckpoint(checkpointId);

		// Add to history
		this.addToHistory({
			type: 'restore',
			checkpointId,
			timestamp: new Date(),
			description: `Restored: ${checkpoint.name}`,
		});
	}

	/**
	 * Rewind to latest checkpoint
	 */
	async rewindToLatest(): Promise<void> {
		const checkpoints = this.checkpointManager.getAllCheckpoints();

		if (checkpoints.length === 0) {
			throw new Error('No checkpoints available');
		}

		await this.rewind(checkpoints[0].id);
	}

	/**
	 * Rewind by N steps
	 */
	async rewindBy(steps: number): Promise<void> {
		const history = this.getRestoreHistory();

		if (history.length === 0) {
			throw new Error('No restore history available');
		}

		if (steps > history.length) {
			steps = history.length;
		}

		const targetEntry = history[steps - 1];
		await this.rewind(targetEntry.checkpointId);
	}

	/**
	 * Redo - go forward in history
	 */
	async redo(): Promise<void> {
		const history = this.state.history;
		const position = this.state.currentPosition;

		// Find next restore operation
		for (let i = position + 1; i < history.length; i++) {
			const entry = history[i];

			if (entry.type === 'restore') {
				// Restore the checkpoint that was restored at this point
				await this.checkpointManager.restoreCheckpoint(entry.checkpointId);

				// Update position
				this.state.currentPosition = i;

				return;
			}
		}

		throw new Error('Nothing to redo');
	}

	/**
	 * Delete a checkpoint
	 */
	async deleteCheckpoint(checkpointId: string): Promise<boolean> {
		const deleted = await this.checkpointManager.deleteCheckpoint(checkpointId);

		if (deleted) {
			// Add to history
			this.addToHistory({
				type: 'delete',
				checkpointId,
				timestamp: new Date(),
				description: `Deleted checkpoint: ${checkpointId}`,
			});
		}

		return deleted;
	}

	/**
	 * Get restore history (chronological)
	 */
	getRestoreHistory(): RewindHistoryEntry[] {
		return this.state.history
			.filter(entry => entry.type === 'restore')
			.reverse();
	}

	/**
	 * Get checkpoint history (all operations)
	 */
	getCheckpointHistory(): RewindHistoryEntry[] {
		return [...this.state.history].reverse();
	}

	/**
	 * Get current state
	 */
	getState(): RewindState {
		return {
			currentPosition: this.state.currentPosition,
			history: [...this.state.history],
		};
	}

	/**
	 * Get available checkpoints for rewind
	 */
	getAvailableCheckpoints(): Checkpoint[] {
		return this.checkpointManager.getAllCheckpoints();
	}

	/**
	 * Get summary
	 */
	getSummary(): {
		totalCheckpoints: number;
		historySize: number;
		availableRewinds: number;
		latestCheckpoint?: Checkpoint;
	} {
		const checkpoints = this.checkpointManager.getAllCheckpoints();
		const restoreHistory = this.getRestoreHistory();

		return {
			totalCheckpoints: checkpoints.length,
			historySize: this.state.history.length,
			availableRewinds: restoreHistory.length,
			latestCheckpoint: checkpoints[0],
		};
	}

	/**
	 * Clear history
	 */
	clearHistory(): void {
		this.state.history = [];
		this.state.currentPosition = -1;
	}

	/**
	 * Add entry to history
	 */
	private addToHistory(entry: RewindHistoryEntry): void {
		// Remove any entries after current position (undo branch)
		this.state.history = this.state.history.slice(0, this.state.currentPosition + 1);

		// Add new entry
		this.state.history.push(entry);
		this.state.currentPosition = this.state.history.length - 1;

		// Trim history if too large
		if (this.state.history.length > this.options.maxHistorySize) {
			const removeCount = this.state.history.length - this.options.maxHistorySize;
			this.state.history = this.state.history.slice(removeCount);
			this.state.currentPosition = this.state.history.length - 1;
		}
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default global rewind engine instance
 */
let defaultRewindEngine: RewindEngine | null = null;

/**
 * Get or create the default rewind engine
 */
export function getDefaultRewindEngine(
	checkpointManager?: CheckpointManager,
	options?: RewindEngineOptions,
): RewindEngine {
	if (!defaultRewindEngine) {
		const manager = checkpointManager || new CheckpointManager();
		defaultRewindEngine = new RewindEngine(manager, options);
	}
	return defaultRewindEngine;
}

/**
 * Reset the default rewind engine (useful for testing)
 */
export function resetDefaultRewindEngine(): void {
	defaultRewindEngine = null;
}

export default RewindEngine;
