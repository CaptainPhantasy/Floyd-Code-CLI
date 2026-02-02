/**
 * FUCKIT Mode State Tracker
 *
 * Tracks pending FUCKIT mode activation to require explicit user confirmation.
 * This prevents accidental activation of the dangerous unrestricted mode.
 *
 * @module utils/fuckit-state
 */

/**
 * FUCKIT mode state manager
 */
class FuckitStateManager {
	private pendingFuckitMode: boolean = false;
	private pendingFuckitTimestamp: number = 0;

	/**
	 * Request FUCKIT mode activation (requires confirmation)
	 * @returns true if request was set, false if already pending
	 */
	requestFuckitMode(): boolean {
		if (this.pendingFuckitMode) {
			return false; // Already pending
		}
		this.pendingFuckitMode = true;
		this.pendingFuckitTimestamp = Date.now();
		return true;
	}

	/**
	 * Check if FUCKIT mode is pending confirmation
	 */
	isPending(): boolean {
		// Pending request expires after 60 seconds
		if (this.pendingFuckitMode && Date.now() - this.pendingFuckitTimestamp > 60000) {
			this.clear();
			return false;
		}
		return this.pendingFuckitMode;
	}

	/**
	 * Confirm and activate FUCKIT mode
	 * @returns true if confirmed, false if no pending request
	 */
	confirmFuckitMode(): boolean {
		if (!this.isPending()) {
			return false;
		}
		this.clear();
		return true;
	}

	/**
	 * Clear pending FUCKIT mode request
	 */
	clear(): void {
		this.pendingFuckitMode = false;
		this.pendingFuckitTimestamp = 0;
	}

	/**
	 * Get the time elapsed since request (in seconds)
	 */
	getElapsedSeconds(): number {
		if (!this.pendingFuckitMode) {
			return 0;
		}
		return Math.floor((Date.now() - this.pendingFuckitTimestamp) / 1000);
	}
}

// Export singleton instance
export const fuckitState = new FuckitStateManager();
