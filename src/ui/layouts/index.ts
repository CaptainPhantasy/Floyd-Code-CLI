/**
 * Layout Components
 *
 * Exports all layout components for the FLOYD CLI.
 *
 * @module ui/layouts
 */

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export {
	MainLayout,
	CompactMainLayout,
	type MainLayoutProps,
	type CompactMainLayoutProps,
	type ChatMessage,
	type MessageRole,
} from './MainLayout.js';

// ============================================================================
// DUAL SCREEN LAYOUT
// ============================================================================

export {
	DualScreenLayout,
	type DualScreenLayoutProps,
	type SessionState,
	type DualScreenConfig,
	createDualScreenConfig,
	launchDefaultSession,
} from './DualScreenLayout.js';

// ============================================================================
// MONITOR LAYOUT
// ============================================================================

export {
	MonitorLayout,
	type MonitorLayoutProps,
	type MonitorData,
} from './MonitorLayout.js';

// ============================================================================
// ENHANCED MAIN LAYOUT (Three-pane with Frame components)
// ============================================================================

export {
	EnhancedMainLayout,
	type EnhancedMainLayoutProps,
} from './EnhancedMainLayout.js';
