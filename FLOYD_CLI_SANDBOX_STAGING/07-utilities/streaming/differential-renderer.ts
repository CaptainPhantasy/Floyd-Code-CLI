/**
 * Differential Renderer
 *
 * Purpose: Minimize terminal flicker by only re-rendering changed content
 * Exports: DifferentialRenderer class
 * Related: streaming-engine.ts
 */

/**
 * Configuration for differential rendering
 */
export interface DifferentialRendererConfig {
	/** Enable diff-based rendering */
	enabled?: boolean;
	/** Minimum change size to trigger re-render (in characters) */
	minChangeSize?: number;
	/** Enable line-level diffing (more efficient) */
	lineLevelDiff?: boolean;
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<DifferentialRendererConfig> = {
	enabled: true,
	minChangeSize: 1,
	lineLevelDiff: true,
	debug: false,
};

/**
 * Represents a diff between two text states
 */
export interface TextDiff {
	/** Previous text state */
	previous: string;
	/** Current text state */
	current: string;
	/** New content that was added */
	added: string;
	/** Content that was removed (usually empty for streaming) */
	removed: string;
	/** Start position of the change */
	changeStart: number;
	/** End position of the change */
	changeEnd: number;
}

/**
 * DifferentialRenderer minimizes terminal flicker by computing diffs
 *
 * Features:
 * - Line-level diffing for efficiency
 * - Character-level diffing for precision
 * - Tracks only new content (streaming is append-only)
 * - Provides change metadata for UI optimization
 */
export class DifferentialRenderer {
	private config: Required<DifferentialRendererConfig>;
	private previousState = '';
	private changeCount = 0;

	constructor(config: DifferentialRendererConfig = {}) {
		this.config = {...DEFAULT_CONFIG, ...config};
	}

	/**
	 * Compute the difference between previous and current state
	 *
	 * @param current - Current text state
	 * @returns Diff information
	 */
	computeDiff(current: string): TextDiff {
		if (!this.config.enabled) {
			return {
				previous: this.previousState,
				current,
				added: current,
				removed: '',
				changeStart: 0,
				changeEnd: current.length,
			};
		}

		// For streaming, content is append-only, so we can optimize
		if (current.startsWith(this.previousState)) {
			const added = current.substring(this.previousState.length);
			const changeStart = this.previousState.length;
			const changeEnd = current.length;

			if (this.config.debug) {
				console.debug('[DifferentialRenderer] Append-only change:', {
					addedLength: added.length,
					changeStart,
					changeEnd,
				});
			}

			this.previousState = current;
			this.changeCount++;

			return {
				previous: this.previousState.substring(0, changeStart),
				current,
				added,
				removed: '',
				changeStart,
				changeEnd,
			};
		}

		// Content was modified (not just appended) - compute full diff
		return this.computeFullDiff(current);
	}

	/**
	 * Compute a full diff when content changes non-append
	 *
	 * Uses line-level diffing for efficiency
	 */
	private computeFullDiff(current: string): TextDiff {
		if (this.config.lineLevelDiff) {
			return this.computeLineDiff(current);
		}

		return this.computeCharDiff(current);
	}

	/**
	 * Compute diff at line level (more efficient)
	 */
	private computeLineDiff(current: string): TextDiff {
		const prevLines = this.previousState.split('\n');
		const currLines = current.split('\n');

		// Find common prefix
		let commonPrefix = 0;
		while (
			commonPrefix < prevLines.length &&
			commonPrefix < currLines.length &&
			prevLines[commonPrefix] === currLines[commonPrefix]
		) {
			commonPrefix++;
		}

		// Find common suffix
		let commonSuffix = 0;
		while (
			commonSuffix < prevLines.length - commonPrefix &&
			commonSuffix < currLines.length - commonPrefix &&
			prevLines[prevLines.length - 1 - commonSuffix] ===
				currLines[currLines.length - 1 - commonSuffix]
		) {
			commonSuffix++;
		}

		// Compute changed region
		const removedLines = prevLines.slice(commonPrefix, prevLines.length - commonSuffix);
		const addedLines = currLines.slice(commonPrefix, currLines.length - commonSuffix);

		// Convert back to character positions
		const prefixText = prevLines.slice(0, commonPrefix).join('\n');
		const changeStart = prefixText.length + (commonPrefix > 0 ? 1 : 0);
		const removedText = removedLines.join('\n');
		const addedText = addedLines.join('\n');
		const changeEnd = changeStart + removedText.length;

		if (this.config.debug) {
			console.debug('[DifferentialRenderer] Line diff:', {
				commonPrefix,
				commonSuffix,
				removedLines: removedLines.length,
				addedLines: addedLines.length,
			});
		}

		this.previousState = current;
		this.changeCount++;

		return {
			previous: this.previousState,
			current,
			added: addedText,
			removed: removedText,
			changeStart,
			changeEnd,
		};
	}

	/**
	 * Compute diff at character level (more precise but slower)
	 */
	private computeCharDiff(current: string): TextDiff {
		const prev = this.previousState;
		const curr = current;

		// Find longest common prefix
		let prefixLen = 0;
		while (
			prefixLen < prev.length &&
			prefixLen < curr.length &&
			prev[prefixLen] === curr[prefixLen]
		) {
			prefixLen++;
		}

		// Find longest common suffix
		let suffixLen = 0;
		while (
			suffixLen < prev.length - prefixLen &&
			suffixLen < curr.length - prefixLen &&
			prev[prev.length - 1 - suffixLen] === curr[curr.length - 1 - suffixLen]
		) {
			suffixLen++;
		}

		const changeStart = prefixLen;
		const changeEnd = prev.length - suffixLen;
		const removed = prev.substring(changeStart, changeEnd);
		const added = curr.substring(changeStart, curr.length - suffixLen);

		if (this.config.debug) {
			console.debug('[DifferentialRenderer] Char diff:', {
				prefixLen,
				suffixLen,
				removedLength: removed.length,
				addedLength: added.length,
			});
		}

		this.previousState = current;
		this.changeCount++;

		return {
			previous: prev,
			current: curr,
			added,
			removed,
			changeStart,
			changeEnd,
		};
	}

	/**
	 * Get only the new content (for streaming append)
	 *
	 * @param current - Current text state
	 * @returns New content that was added
	 */
	getNewContent(current: string): string {
		if (current.startsWith(this.previousState)) {
			return current.substring(this.previousState.length);
		}

		// Content changed non-append, compute diff
		const diff = this.computeDiff(current);
		return diff.added;
	}

	/**
	 * Check if there are any changes
	 *
	 * @param current - Current text state
	 * @returns True if content changed
	 */
	hasChanges(current: string): boolean {
		return current !== this.previousState;
	}

	/**
	 * Reset the renderer state
	 */
	reset(): void {
		this.previousState = '';
		this.changeCount = 0;
	}

	/**
	 * Get current state
	 */
	getState(): string {
		return this.previousState;
	}

	/**
	 * Set state (useful for initialization)
	 */
	setState(state: string): void {
		this.previousState = state;
	}

	/**
	 * Get statistics
	 */
	getStats(): {
		changeCount: number;
		currentLength: number;
	} {
		return {
			changeCount: this.changeCount,
			currentLength: this.previousState.length,
		};
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<DifferentialRendererConfig>): void {
		this.config = {...this.config, ...config};
	}
}

/**
 * Create a differential renderer with default configuration
 */
export function createDifferentialRenderer(
	config?: DifferentialRendererConfig,
): DifferentialRenderer {
	return new DifferentialRenderer(config);
}
