/**
 * Shared Types for Agent Visualization Components
 *
 * Common interfaces and types used across agent UI components.
 * These types provide consistency between components and their data sources.
 *
 * @module ui/agent/types
 */

// ============================================================================
// COMMON STATUS TYPES
// ============================================================================

/**
 * Generic status that applies to most agent operations
 */
export type AgentStatus =
	| 'idle'
	| 'pending'
	| 'running'
	| 'working'
	| 'thinking'
	| 'streaming'
	| 'complete'
	| 'success'
	| 'error'
	| 'cancelled'
	| 'blocked'
	| 'skipped';

/**
 * Result type for operations that can succeed or fail
 */
export type OperationResult<T = unknown, E = Error> =
	| {success: true; data: T}
	| {success: false; error: E};

// ============================================================================
// TIMESTAMP TYPES
// ============================================================================

/**
 * Timestamp with millisecond precision
 */
export type Timestamp = number;

/**
 * Date range for filtering
 */
export interface DateRange {
	start: Date;
	end: Date;
}

// ============================================================================
// PROGRESS TYPES
// ============================================================================

/**
 * Progress tracking for long-running operations
 */
export interface Progress {
	/** Current value (0-100 for percentage) */
	value: number;

	/** Maximum value (100 for percentage) */
	max: number;

	/** Current status message */
	message?: string;

	/** Estimated time remaining in milliseconds */
	eta?: number;

	/** Start timestamp */
	startTime: Timestamp;

	/** Estimated completion timestamp */
	estimatedCompletion?: Timestamp;
}

// ============================================================================
// METADATA TYPES
// ============================================================================

/**
 * Arbitrary metadata attached to agent operations
 */
export type Metadata = Record<string, unknown>;

/**
 * Duration in milliseconds
 */
export type DurationMs = number;

/**
 * Format duration for display
 */
export type FormattedDuration = string;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Optional partial - all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// COMPONENT PROP BASES
// ============================================================================

/**
 * Base props for all visualized components
 */
export interface BaseComponentProps {
	/** Unique identifier for the component instance */
	id?: string;

	/** Additional CSS class names (not used in Ink but for compatibility) */
	className?: string;

	/** Test ID for testing purposes */
	testId?: string;

	/** Custom width constraint */
	width?: number;
}

/**
 * Props for components that support animation
 */
export interface AnimatableProps {
	/** Enable animations */
	animate?: boolean;

	/** Animation speed preset */
	animationSpeed?: 'fast' | 'normal' | 'slow';
}

/**
 * Props for components that display status
 */
export interface StatusComponentProps {
	/** Current status */
	status: AgentStatus;

	/** Status label override */
	statusLabel?: string;

	/** Show status indicator icon */
	showIcon?: boolean;
}

/**
 * Props for components that can be in different display modes
 */
export interface DisplayModeProps {
	/** Display mode variant */
	mode?: 'full' | 'compact' | 'minimal';

	/** Show detailed information */
	showDetails?: boolean;
}

// ============================================================================
// REAL-TIME UPDATE TYPES
// ============================================================================

/**
 * Real-time update callback for streaming data
 */
export type UpdateCallback<T> = (data: T) => void;

/**
 * Streaming data chunk
 */
export interface DataChunk<T> {
	/** Chunk data */
	data: T;

	/** Chunk index */
	index: number;

	/** Whether this is the final chunk */
	isFinal: boolean;

	/** Timestamp when chunk was received */
	timestamp: Timestamp;
}

// ============================================================================
// RE-EXPORTS FROM RELATED MODULES
// ============================================================================

// Re-export scheduler types for convenience
export type {SchedulerMetrics} from '../../throughput/scheduler.js';
export type {
	SwarmDefinition,
	SwarmRole,
} from '../../throughput/swarm-scheduler.js';

// Note: Types cannot be exported as default values since they only exist at compile-time.
// All types are available as named exports above.
