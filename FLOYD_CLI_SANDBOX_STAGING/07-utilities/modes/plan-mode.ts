/**
 * Plan Mode
 *
 * Read-only codebase exploration mode.
 * Agents can analyze and propose changes but cannot modify files.
 *
 * @module modes/plan-mode
 */

import {readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Plan mode state
 */
export interface PlanModeState {
	/** Whether plan mode is active */
	active: boolean;

	/** Changes proposed during plan mode */
	proposedChanges: ProposedChange[];

	/** Files read during plan mode */
	readFiles: string[];

	/** Plan mode start time */
	startedAt?: Date;
}

/**
 * Proposed file change
 */
export interface ProposedChange {
	/** Change ID */
	id: string;

	/** File path */
	path: string;

	/** Change type */
	type: 'create' | 'update' | 'delete';

	/** Original content (for updates/deletes) */
	originalContent?: string;

	/** New content (for creates/updates) */
	newContent?: string;

	/** Diff preview */
	diff?: string;

	/** Change description */
	description: string;

	/** Risk level */
	risk: 'low' | 'medium' | 'high';

	/** Timestamp */
	timestamp: Date;
}

/**
 * Plan mode options
 */
export interface PlanModeOptions {
	/** Maximum number of proposed changes */
	maxChanges?: number;

	/** Enable risk assessment */
	enableRiskAssessment?: boolean;

	/** Enable diff generation */
	enableDiffGeneration?: boolean;
}

/**
 * Virtual file system state
 */
interface VirtualFileSystem {
	/** Proposed file contents */
	proposedFiles: Map<string, string>;

	/** Deleted files */
	deletedFiles: Set<string>;
}

// ============================================================================
// PLAN MODE CLASS
// ============================================================================

/**
 * PlanMode - Read-only exploration with change proposal
 *
 * When active, all file write operations are intercepted and recorded
 * as proposed changes instead of being executed. This allows agents to
 * explore the codebase and propose changes safely.
 */
export class PlanMode {
	private readonly state: PlanModeState;
	private readonly options: Required<PlanModeOptions>;
	private readonly virtualFileSystem: VirtualFileSystem;

	constructor(options: PlanModeOptions = {}) {
		this.options = {
			maxChanges: options.maxChanges ?? 1000,
			enableRiskAssessment: options.enableRiskAssessment ?? true,
			enableDiffGeneration: options.enableDiffGeneration ?? true,
		};

		this.state = {
			active: false,
			proposedChanges: [],
			readFiles: [],
		};

		this.virtualFileSystem = {
			proposedFiles: new Map(),
			deletedFiles: new Set(),
		};
	}

	/**
	 * Activate plan mode
	 */
	activate(): void {
		if (this.state.active) {
			return;
		}

		this.state.active = true;
		this.state.startedAt = new Date();
		this.clear();
	}

	/**
	 * Deactivate plan mode
	 */
	deactivate(): void {
		this.state.active = false;
	}

	/**
	 * Check if plan mode is active
	 */
	isActive(): boolean {
		return this.state.active;
	}

	/**
	 * Propose a file change
	 */
	async proposeChange(params: {
		path: string;
		type: 'create' | 'update' | 'delete';
		content?: string;
		description?: string;
	}): Promise<ProposedChange> {
		if (!this.state.active) {
			throw new Error('Plan mode is not active');
		}

		// Check max changes limit
		if (this.state.proposedChanges.length >= this.options.maxChanges) {
			throw new Error(`Maximum number of proposed changes (${this.options.maxChanges}) reached`);
		}

		// Generate change ID
		const id = this.generateChangeId(params.path, params.type);

		// Read original content for updates/deletes
		let originalContent: string | undefined;
		if (params.type === 'update' || params.type === 'delete') {
			try {
				originalContent = await readFile(params.path, 'utf-8');
			} catch {
				// File doesn't exist
				originalContent = undefined;
			}
		}

		// Assess risk
		const risk = this.options.enableRiskAssessment
			? this.assessRisk(params.path, params.type, originalContent, params.content)
			: 'medium';

		// Generate diff
		let diff: string | undefined;
		if (this.options.enableDiffGeneration && params.content) {
			diff = this.generateDiff(originalContent || '', params.content, params.path);
		}

		// Create proposed change
		const change: ProposedChange = {
			id,
			path: params.path,
			type: params.type,
			originalContent,
			newContent: params.content,
			diff,
			description: params.description || `${params.type} ${params.path}`,
			risk,
			timestamp: new Date(),
		};

		// Record in state
		this.state.proposedChanges.push(change);

		// Update virtual file system
		if (params.type === 'create' || params.type === 'update') {
			this.virtualFileSystem.proposedFiles.set(params.path, params.content || '');
		} else if (params.type === 'delete') {
			this.virtualFileSystem.deletedFiles.add(params.path);
			this.virtualFileSystem.proposedFiles.delete(params.path);
		}

		return change;
	}

	/**
	 * Read a file (tracks reads in plan mode)
	 */
	async readFile(path: string): Promise<string> {
		// Check virtual file system first
		if (this.virtualFileSystem.proposedFiles.has(path)) {
			const content = this.virtualFileSystem.proposedFiles.get(path);
			this.trackRead(path);
			return content || '';
		}

		// Check if file was deleted
		if (this.virtualFileSystem.deletedFiles.has(path)) {
			throw new Error(`File has been proposed for deletion: ${path}`);
		}

		// Read actual file
		const content = await readFile(path, 'utf-8');
		this.trackRead(path);
		return content;
	}

	/**
	 * Check if a file exists (respects virtual file system)
	 */
	async fileExists(path: string): Promise<boolean> {
		// Check virtual file system
		if (this.virtualFileSystem.proposedFiles.has(path)) {
			return true;
		}

		if (this.virtualFileSystem.deletedFiles.has(path)) {
			return false;
		}

		// Check actual file system
		try {
			await stat(path);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get all proposed changes
	 */
	getProposedChanges(): ProposedChange[] {
		return [...this.state.proposedChanges];
	}

	/**
	 * Get proposed changes by risk level
	 */
	getChangesByRisk(risk: 'low' | 'medium' | 'high'): ProposedChange[] {
		return this.state.proposedChanges.filter(c => c.risk === risk);
	}

	/**
	 * Get proposed changes by type
	 */
	getChangesByType(type: 'create' | 'update' | 'delete'): ProposedChange[] {
		return this.state.proposedChanges.filter(c => c.type === type);
	}

	/**
	 * Get plan summary
	 */
	getSummary(): {
		active: boolean;
		totalChanges: number;
		creates: number;
		updates: number;
		deletes: number;
		highRisk: number;
		mediumRisk: number;
		lowRisk: number;
		filesRead: number;
		duration?: number;
	} {
		const creates = this.state.proposedChanges.filter(c => c.type === 'create').length;
		const updates = this.state.proposedChanges.filter(c => c.type === 'update').length;
		const deletes = this.state.proposedChanges.filter(c => c.type === 'delete').length;
		const highRisk = this.state.proposedChanges.filter(c => c.risk === 'high').length;
		const mediumRisk = this.state.proposedChanges.filter(c => c.risk === 'medium').length;
		const lowRisk = this.state.proposedChanges.filter(c => c.risk === 'low').length;

		const duration = this.state.startedAt
			? Date.now() - this.state.startedAt.getTime()
			: undefined;

		return {
			active: this.state.active,
			totalChanges: this.state.proposedChanges.length,
			creates,
			updates,
			deletes,
			highRisk,
			mediumRisk,
			lowRisk,
			filesRead: this.state.readFiles.length,
			duration,
		};
	}

	/**
	 * Clear plan mode state
	 */
	clear(): void {
		this.state.proposedChanges = [];
		this.state.readFiles = [];
		this.virtualFileSystem.proposedFiles.clear();
		this.virtualFileSystem.deletedFiles.clear();
		this.state.startedAt = this.state.active ? this.state.startedAt : undefined;
	}

	/**
	 * Export plan as JSON
	 */
	exportPlan(): string {
		return JSON.stringify({
			summary: this.getSummary(),
			changes: this.state.proposedChanges,
			readFiles: this.state.readFiles,
			exportedAt: new Date().toISOString(),
		}, null, 2);
	}

	/**
	 * Generate change ID
	 */
	private generateChangeId(path: string, type: string): string {
		const hash = createHash('sha256')
			.update(`${path}:${type}:${Date.now()}`)
			.digest('hex')
			.slice(0, 8);
		return `${type}-${hash}`;
	}

	/**
	 * Track a file read
	 */
	private trackRead(path: string): void {
		if (!this.state.readFiles.includes(path)) {
			this.state.readFiles.push(path);
		}
	}

	/**
	 * Assess risk level of a change
	 */
	private assessRisk(
		path: string,
		type: string,
		originalContent: string | undefined,
		newContent: string | undefined,
	): 'low' | 'medium' | 'high' {
		// High risk indicators
		if (path.includes('package.json') || path.includes('tsconfig.json')) {
			return 'high';
		}

		if (type === 'delete') {
			return 'high';
		}

		// Check file size changes
		if (originalContent && newContent) {
			const sizeChange = Math.abs(newContent.length - originalContent.length);
			const ratio = sizeChange / originalContent.length;

			if (ratio > 0.5) {
				return 'high';
			}
			if (ratio > 0.2) {
				return 'medium';
			}
		}

		// Default to medium for updates, low for creates
		return type === 'update' ? 'medium' : 'low';
	}

	/**
	 * Generate diff preview
	 */
	private generateDiff(original: string, modified: string, path: string): string {
		const originalLines = original.split('\n');
		const modifiedLines = modified.split('\n');

		const maxLines = 20;
		let diff = '';
		let lineCount = 0;

		// Simple line-by-line diff (first N changes)
		for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
			const origLine = originalLines[i] ?? '';
			const modLine = modifiedLines[i] ?? '';

			if (origLine !== modLine) {
				if (lineCount >= maxLines) {
					diff += '...\n';
					break;
				}

				if (origLine) {
					diff += `- ${origLine}\n`;
				}
				if (modLine) {
					diff += `+ ${modLine}\n`;
				}
				lineCount++;
			}
		}

		return diff || 'No changes';
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default global plan mode instance
 */
let defaultPlanMode: PlanMode | null = null;

/**
 * Get or create the default plan mode instance
 */
export function getDefaultPlanMode(options?: PlanModeOptions): PlanMode {
	if (!defaultPlanMode) {
		defaultPlanMode = new PlanMode(options);
	}
	return defaultPlanMode;
}

/**
 * Reset the default plan mode (useful for testing)
 */
export function resetDefaultPlanMode(): void {
	defaultPlanMode = null;
}

export default PlanMode;
