/**
 * CRUSH Theme - Complete Color Palette
 * Based on CharmTone color system from Charmbracelet
 *
 * Theme Philosophy:
 * - CharmUI: High-contrast neon/pink aesthetics with personality
 * - Rustic: Dark backgrounds for reduced eye strain
 * - User-focused: Clear visual hierarchy with purposeful color usage
 * - Speedy: Fast visual feedback with status colors
 * - Hybrid: Works across different terminal capabilities
 *
 * Source: https://github.com/charmbracelet/x/blob/main/exp/charmtone/charmtone.go
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Background colors - The "Rustic" foundation
 * Dark backgrounds for reduced eye strain during long coding sessions
 */
export const bgColors = {
	/** Main background - Pepper */
	base: '#201F26' as const,

	/** Elevated elements - BBQ */
	elevated: '#2d2c35' as const,

	/** Overlay backgrounds - Charcoal */
	overlay: '#3A3943' as const,

	/** Modal/Dialog backgrounds - Iron */
	modal: '#4D4C57' as const,
};

/**
 * Text colors - The "Ash" scale
 * Clear typography hierarchy for readability
 */
export const textColors = {
	/** Primary text - Ash */
	primary: '#DFDBDD' as const,

	/** Secondary text - Squid (increased contrast by 10%) */
	secondary: '#959AA2' as const,

	/** Tertiary text - Smoke */
	tertiary: '#BFBCC8' as const,

	/** Subtle text - Oyster (increased contrast by 10%) */
	subtle: '#706F7B' as const,

	/** Selected text - Salt */
	selected: '#F1EFEF' as const,

	/** Inverse text - Butter */
	inverse: '#FFFAF1' as const,
};

/**
 * Primary accent colors - The "Charm" signature
 * Purple-Pink-Teal triad for the distinctive CRUSH look
 */
export const accentColors = {
	/** Primary accent - Charple (purple) */
	primary: '#6B50FF' as const,

	/** Secondary accent - Dolly (pink) */
	secondary: '#FF60FF' as const,

	/** Tertiary accent - Bok (teal) */
	tertiary: '#68FFD6' as const,

	/** Highlight accent - Zest (yellow) */
	highlight: '#E8FE96' as const,

	/** Info accent - Malibu (blue) */
	info: '#00A4FF' as const,
};

/**
 * Status colors - The "Speedy" feedback
 * Clear visual indicators for system states
 */
export const statusColors = {
	/** Ready/Success - Guac */
	ready: '#12C78F' as const,

	/** Working/Processing - Charple */
	working: '#6B50FF' as const,

	/** Warning/Caution - Zest */
	warning: '#E8FE96' as const,

	/** Error/Critical - Sriracha */
	error: '#EB4268' as const,

	/** Blocked/Waiting - Dolly */
	blocked: '#FF60FF' as const,

	/** Online/Connected - Guac */
	online: '#12C78F' as const,

	/** Offline/Disconnected - Squid */
	offline: '#858392' as const,

	/** Busy/Processing - Citron */
	busy: '#E8FF27' as const,
};

/**
 * Extended palette - All CharmTone colors
 * Additional colors for specific UI elements
 */
export const extendedColors = {
	// Reds/Pinks
	coral: '#FF577D' as const,
	salmon: '#FF7F90' as const,
	cherry: '#FF3888' as const,
	sriracha: '#EB4268' as const,
	chili: '#E23080' as const,
	bengal: '#FF6E63' as const,
	blush: '#FF84FF' as const,

	// Purples
	violet: '#C259FF' as const,
	mauve: '#D46EFF' as const,
	grape: '#7134DD' as const,
	plum: '#9953FF' as const,
	orchid: '#AD6EFF' as const,
	jelly: '#4A30D9' as const,
	hazy: '#8B75FF' as const,
	prince: '#9C35E1' as const,
	urchin: '#C337E0' as const,

	// Blues
	malibu: '#00A4FF' as const,
	sardine: '#4FBEFE' as const,
	damson: '#007AB8' as const,
	thunder: '#4776FF' as const,
	anchovy: '#719AFC' as const,
	sapphire: '#4949FF' as const,
	guppy: '#7272FF' as const,
	oceania: '#2B55B3' as const,
	ox: '#3331B2' as const,

	// Greens
	guac: '#12C78F' as const,
	julep: '#00FFB2' as const,
	pickle: '#00A475' as const,
	gator: '#18463D' as const,
	spinach: '#1C3634' as const,

	// Yellows
	citron: '#E8FF27' as const,

	// Oranges/Tans
	cumin: '#BF976F' as const,
	tang: '#FF985A' as const,
	yam: '#FFB587' as const,
	paprika: '#D36C64' as const,
	uni: '#FF937D' as const,
};

// ============================================================================
// THEME EXPORT
// ============================================================================

/**
 * Complete CRUSH theme object
 * Main export for consuming components
 */
export const crushTheme = {
	name: 'crush' as const,

	// Backgrounds
	bg: bgColors,

	// Text
	text: textColors,

	// Accents
	accent: accentColors,

	// Status
	status: statusColors,

	// Extended palette
	extended: extendedColors,

	// Legacy compatibility (for existing components)
	legacy: {
		primary: accentColors.primary,
		secondary: accentColors.secondary,
		tertiary: accentColors.tertiary,
		accent: accentColors.highlight,
		bgBase: bgColors.base,
		bgSubtle: bgColors.overlay,
		bgOverlay: bgColors.modal,
		fgBase: textColors.primary,
		fgMuted: textColors.secondary,
		fgSubtle: textColors.subtle,
		fgSelected: textColors.selected,
		border: bgColors.overlay,
		borderFocus: accentColors.primary,
		success: statusColors.ready,
		error: statusColors.error,
		warning: statusColors.warning,
		info: accentColors.info,
	},
};

// ============================================================================
// ROLE-BASED COLORS
// ============================================================================

/**
 * Semantic role colors for specific UI elements
 * Maps UI roles to appropriate colors from the palette
 */
export const roleColors = {
	/** Header title gradient */
	headerTitle: accentColors.secondary,

	/** Header status text */
	headerStatus: textColors.primary,

	/** User message label */
	userLabel: statusColors.ready,

	/** Assistant message label */
	assistantLabel: accentColors.info,

	/** System message label */
	systemLabel: accentColors.highlight,

	/** Tool call label */
	toolLabel: accentColors.tertiary,

	/** Thinking/processing indicator */
	thinking: accentColors.highlight,

	/** Input prompt */
	inputPrompt: statusColors.ready,

	/** Hint/help text */
	hint: textColors.secondary,

	/** Code syntax highlighting */
	syntax: {
		keywords: accentColors.info, // Malibu
		functions: statusColors.ready, // Guac
		strings: extendedColors.cumin,
		numbers: extendedColors.julep,
		comments: textColors.subtle,
		classes: textColors.selected,
		operators: extendedColors.bengal,
		punctuation: accentColors.highlight,
	},

	/** Diff view colors */
	diff: {
		addition: {
			lineNumber: '#629657',
			symbol: '#629657',
			background: '#323931',
		},
		deletion: {
			lineNumber: '#a45c59',
			symbol: '#a45c59',
			background: '#383030',
		},
	},
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CrushTheme = typeof crushTheme;
export type BgColors = typeof bgColors;
export type TextColors = typeof textColors;
export type AccentColors = typeof accentColors;
export type StatusColors = typeof statusColors;
export type RoleColors = typeof roleColors;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================>

/**
 * Get a color from the theme by key path
 * @param path - Dot-notation path to color (e.g., 'bg.base', 'status.error')
 * @returns Color hex string or undefined if not found
 */
export function getColor(path: string): string | undefined {
	const keys = path.split('.');
	let current: any = crushTheme;

	for (const key of keys) {
		if (current?.[key] !== undefined) {
			current = current[key];
		} else {
			return undefined;
		}
	}

	return typeof current === 'string' ? current : undefined;
}

/**
 * Check if a color exists in the theme
 * @param color - Hex color string to check
 * @returns True if color is in the theme palette
 */
export function hasColor(color: string): boolean {
	const allColors = Object.values({
		...bgColors,
		...textColors,
		...accentColors,
		...statusColors,
		...extendedColors,
	});

	return allColors.includes(color as any);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================>

export default crushTheme;

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================>

/**
 * @deprecated Use crushTheme instead. Kept for backward compatibility.
 */
export const floydTheme = {
	name: 'charmtone',
	colors: {
		primary: accentColors.primary,
		secondary: accentColors.secondary,
		tertiary: accentColors.tertiary,
		accent: accentColors.highlight,
		bgBase: bgColors.base,
		bgSubtle: bgColors.overlay,
		bgOverlay: bgColors.modal,
		fgBase: textColors.primary,
		fgMuted: textColors.secondary,
		fgSubtle: textColors.subtle,
		fgSelected: textColors.selected,
		border: bgColors.overlay,
		borderFocus: accentColors.primary,
		success: statusColors.ready,
		error: statusColors.error,
		warning: statusColors.warning,
		info: accentColors.info,
	},
};

/**
 * @deprecated Use roleColors instead. Kept for backward compatibility.
 */
export const floydRoles = {
	headerTitle: accentColors.secondary,
	headerStatus: textColors.primary,
	userLabel: statusColors.ready,
	assistantLabel: accentColors.info,
	systemLabel: accentColors.highlight,
	toolLabel: accentColors.tertiary,
	thinking: accentColors.highlight,
	inputPrompt: statusColors.ready,
	hint: textColors.secondary,
};
