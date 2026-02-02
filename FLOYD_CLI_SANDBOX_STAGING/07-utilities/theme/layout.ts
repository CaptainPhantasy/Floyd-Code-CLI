/**
 * Layout Constants
 *
 * Centralized layout dimensions for height calculations.
 * These values represent the actual rendered heights of UI components.
 */

export const LAYOUT = {
	/** Terminal width breakpoints for responsive layout */
	BREAKPOINTS: {
		/** Very narrow terminals (≤80 columns) - minimal UI */
		VERY_NARROW: 80,
		/** Narrow terminals (≤100 columns) - compact UI */
		NARROW: 100,
		/** Wide terminals (≤120 columns) - standard UI */
		WIDE: 120,
		/** Ultra-wide terminals (>120 columns) - expanded UI */
		ULTRA_WIDE: 160,
	},

	/** Fixed overhead heights in rows (lines) */
	OVERHEAD: {
		/** ASCII banner: 8 lines + marginBottom(1) = 9 */
		BANNER: 9,

		/** Status bar: top border + content + bottom border = 3 */
		STATUSBAR: 3,

		/** Input area: top border + content + bottom border + hint = 6 */
		INPUT: 6,

		/** Frame borders and padding: ~5 lines */
		FRAME: 5,

		/** Safety margin to prevent overflow: 3 lines */
		SAFETY_MARGIN: 3,
	},

	/**
	 * Calculate total overhead based on which components are visible.
	 * @param hasBanner - Whether the ASCII banner is displayed
	 * @returns Total overhead in lines
	 */
	getTotalOverhead(hasBanner: boolean): number {
		return this.OVERHEAD.STATUSBAR +
		       this.OVERHEAD.INPUT +
		       this.OVERHEAD.FRAME +
		       this.OVERHEAD.SAFETY_MARGIN +
		       (hasBanner ? this.OVERHEAD.BANNER : 0);
	},

	/**
	 * Calculate available height for the transcript/content area.
	 * @param terminalHeight - Total terminal height in rows
	 * @param hasBanner - Whether the ASCII banner is displayed
	 * @param isNarrow - Whether this is a narrow layout (affects calculation)
	 * @returns Available height in lines (minimum 1)
	 */
	calculateAvailableHeight(
		terminalHeight: number,
		hasBanner: boolean,
		isNarrow: boolean
	): number {
		const overhead = isNarrow
			? this.OVERHEAD.STATUSBAR + this.OVERHEAD.INPUT + this.OVERHEAD.FRAME + this.OVERHEAD.SAFETY_MARGIN
			: this.getTotalOverhead(hasBanner);

		return Math.max(1, terminalHeight - overhead);
	},
};

export default LAYOUT;
