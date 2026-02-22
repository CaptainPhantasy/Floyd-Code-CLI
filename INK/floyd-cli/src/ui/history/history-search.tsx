/**
 * PHASE 5 ITEM 33: Ctrl+R History Search
 *
 * Interactive reverse search in command history.
 * Similar to bash Ctrl+R behavior.
 */

import { Subject } from 'rxjs';

/**
 * History entry
 */
export interface HistoryEntry {
	input: string;
	timestamp: number;
	index: number;
}

/**
 * Search state
 */
export interface SearchState {
	searching: boolean;
	query: string;
	matchedIndex: number;
	matchedInput?: string;
}

/**
 * History search manager
 */
export class HistorySearchManager {
	private history: HistoryEntry[] = [];
	private maxHistory: number = 1000;
	private state$ = new Subject<SearchState>();
	private currentState: SearchState = {
		searching: false,
		query: '',
		matchedIndex: -1,
	};

	constructor(maxHistory?: number) {
		if (maxHistory) {
			this.maxHistory = maxHistory;
		}
	}

	/**
	 * Add entry to history
	 */
	add(input: string): void {
		// Remove duplicates of consecutive same input
		const lastEntry = this.history[this.history.length - 1];
		if (lastEntry && lastEntry.input === input) {
			return; // Don't add duplicate
		}

		this.history.push({
			input,
			timestamp: Date.now(),
			index: this.history.length,
		});

		// Trim history if too large
		if (this.history.length > this.maxHistory) {
			this.history.shift();
			// Re-index
			for (let i = 0; i < this.history.length; i++) {
				this.history[i].index = i;
			}
		}
	}

	/**
	 * Start reverse search
	 */
	startSearch(): void {
		this.currentState = {
			searching: true,
			query: '',
			matchedIndex: -1,
		};
		this.state$.next(this.currentState);
	}

	/**
	 * Stop search
	 */
	stopSearch(acceptedInput?: string): void {
		if (acceptedInput) {
			this.add(acceptedInput);
		}

		this.currentState = {
			searching: false,
			query: '',
			matchedIndex: -1,
		};
		this.state$.next(this.currentState);
	}

	/**
	 * Update search query
	 */
	updateQuery(query: string): void {
		this.currentState.query = query;
		this.currentState.matchedIndex = this.findMatch(query);

		const match = this.currentState.matchedIndex >= 0
			? this.history[this.currentState.matchedIndex]
			: undefined;

		this.currentState.matchedInput = match?.input;
		this.state$.next(this.currentState);
	}

	/**
	 * Find best matching history entry for query
	 */
	private findMatch(query: string): number {
		if (!query) {
			return -1;
		}

		// Find most recent match (reverse search)
		const queryLower = query.toLowerCase();

		for (let i = this.history.length - 1; i >= 0; i--) {
			const entry = this.history[i];
			if (entry.input.toLowerCase().includes(queryLower)) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Get next match (search backward)
	 */
	nextMatch(): boolean {
		if (!this.currentState.searching) {
			return false;
		}

		const query = this.currentState.query;
		if (!query) {
			return false;
		}

		const queryLower = query.toLowerCase();
		const currentIndex = this.currentState.matchedIndex;

		// Search backward from current match
		for (let i = currentIndex - 1; i >= 0; i--) {
			const entry = this.history[i];
			if (entry.input.toLowerCase().includes(queryLower)) {
				this.currentState.matchedIndex = i;
				this.currentState.matchedInput = entry.input;
				this.state$.next(this.currentState);
				return true;
			}
		}

		return false;
	}

	/**
	 * Get previous match (search forward)
	 */
	previousMatch(): boolean {
		if (!this.currentState.searching) {
			return false;
		}

		const query = this.currentState.query;
		if (!query) {
			return false;
		}

		const queryLower = query.toLowerCase();
		const currentIndex = this.currentState.matchedIndex;

		// Search forward from current match
		for (let i = currentIndex + 1; i < this.history.length; i++) {
			const entry = this.history[i];
			if (entry.input.toLowerCase().includes(queryLower)) {
				this.currentState.matchedIndex = i;
				this.currentState.matchedInput = entry.input;
				this.state$.next(this.currentState);
				return true;
			}
		}

		return false;
	}

	/**
	 * Accept current match
	 */
	acceptMatch(): string | null {
		if (this.currentState.matchedInput !== undefined) {
			const accepted = this.currentState.matchedInput;
			this.stopSearch(accepted);
			return accepted;
		}
		return null;
	}

	/**
	 * Get current state
	 */
	getState(): SearchState {
		return { ...this.currentState };
	}

	/**
	 * Get state observable
	 */
	getState$() {
		return this.state$;
	}

	/**
	 * Get all history entries
	 */
	getHistory(): HistoryEntry[] {
		return [...this.history];
	}

	/**
	 * Clear history
	 */
	clearHistory(): void {
		this.history = [];
	}

	/**
	 * Get history by index
	 */
	getByIndex(index: number): HistoryEntry | undefined {
		return this.history[index];
	}

	/**
	 * Search for exact match
	 */
	exactMatch(query: string): number[] {
		const matches: number[] = [];
		const queryLower = query.toLowerCase();

		for (let i = 0; i < this.history.length; i++) {
			if (this.history[i].input.toLowerCase() === queryLower) {
				matches.push(i);
			}
		}

		return matches;
	}

	/**
	 * Get search suggestions for query
	 */
	getSuggestions(query: string): string[] {
		const suggestions: string[] = [];
		const queryLower = query.toLowerCase();

		// Find all matches
		for (const entry of this.history) {
			if (entry.input.toLowerCase().includes(queryLower)) {
				suggestions.push(entry.input);
			}
		}

		// Return unique suggestions, most recent first
		const unique = [...new Set(suggestions)];
		return unique.reverse().slice(0, 10);
	}

	/**
	 * Format search results for display
	 */
	formatSearchResults(query: string): string {
		const matches = this.getSuggestions(query);

		if (matches.length === 0) {
			return `\nNo matches found for: ${query}\n`;
		}

		let output = `\nFound ${matches.length} match${matches.length === 1 ? '' : 'es'} for: ${query}\n`;
		output += '─'.repeat(50) + '\n';

		for (let i = 0; i < Math.min(matches.length, 10); i++) {
			const index = this.history.findIndex(h => h.input === matches[i]);
			const relativeTime = this.getRelativeTime(this.history[index].timestamp);
			output += `\n${i + 1}. ${matches[i]}`;
			output += ` (${relativeTime})`;
		}

		if (matches.length > 10) {
			output += `\n... and ${matches.length - 10} more`;
		}

		return output + '\n';
	}

	/**
	 * Get relative time string
	 */
	private getRelativeTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;

		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days}d ago`;
		} else if (hours > 0) {
			return `${hours}h ago`;
		} else if (minutes > 0) {
			return `${minutes}m ago`;
		} else if (seconds > 0) {
			return `${seconds}s ago`;
		} else {
			return 'just now';
		}
	}
}

/**
 * Global history search instance
 */
let globalHistorySearch: HistorySearchManager | null = null;

export function getHistorySearchManager(maxHistory?: number): HistorySearchManager {
	if (!globalHistorySearch) {
		globalHistorySearch = new HistorySearchManager(maxHistory);
	}
	return globalHistorySearch;
}

export default HistorySearchManager;
