/**
 * Permission UI Components
 *
 * Complete permission system UI components for FLOYD CLI.
 *
 * Components:
 * - PermissionModal: Full-screen permission modal with full details
 * - PermissionCompact: Compact inline permission prompts
 * - PermissionHistory: Display past permission decisions
 * - RiskAssessment: Visual risk indicators and assessment
 *
 * Types:
 * - PermissionRequest: Input for permission requests
 * - PermissionResponse: Output from permission UI
 * - HistoryEntry: Entry for permission history
 * - RiskLevel: Enum of risk levels
 * - RiskAssessment: Risk assessment result
 * - PermissionDecision: Allow/deny decision
 * - PermissionScope: Once/session/always scope
 *
 * Usage:
 * ```tsx
 * import { PermissionModal, PermissionCompact, PermissionHistory } from './permissions';
 * ```
 */

// ============================================================================
// Core Module Exports
// ============================================================================

export * from './policies.js';
export * from './risk-classifier.js';
export * from './store.js';
export * from './ask-ui.js';
export * from './ask-overlay.js';

// ============================================================================
// PermissionModal Component
// ============================================================================

import {PermissionModal as PermissionModalImport} from './PermissionModal.js';
export type {
	PermissionRequest as ModalPermissionRequest,
	PermissionResponse as ModalPermissionResponse,
	PermissionModalProps,
} from './PermissionModal.js';

// Re-export for convenience
export type {PermissionScope, PermissionDecision} from './policies.js';

// ============================================================================
// PermissionCompact Component
// ============================================================================

import {
	PermissionCompact as PermissionCompactImport,
	PermissionMinimal as PermissionMinimalImport,
	PermissionBar as PermissionBarImport,
} from './PermissionCompact.js';
export type {
	CompactPermissionRequest,
	CompactPermissionResponse,
	PermissionCompactProps,
	PermissionMinimalProps,
	PermissionBarProps,
} from './PermissionCompact.js';

// ============================================================================
// PermissionHistory Component
// ============================================================================

import {
	PermissionHistory as PermissionHistoryImport,
	PermissionHistorySummary as PermissionHistorySummaryImport,
	PermissionHistoryTable as PermissionHistoryTableImport,
} from './PermissionHistory.js';
export type {
	HistoryEntry,
	PermissionHistoryProps,
	PermissionHistorySummaryProps,
	PermissionHistoryTableProps,
} from './PermissionHistory.js';

// ============================================================================
// RiskAssessment Component
// ============================================================================

import {
	RiskAssessment as RiskAssessmentImport,
	RiskBadge as RiskBadgeImport,
	RiskGauge as RiskGaugeImport,
	RiskSummary as RiskSummaryImport,
	MultiToolRisk as MultiToolRiskImport,
} from './RiskAssessment.js';
export type {
	RiskAssessmentProps,
	RiskBadgeProps,
	RiskGaugeProps,
	RiskSummaryProps,
	MultiToolRiskProps,
} from './RiskAssessment.js';

// Re-export types
export type {RiskLevel} from './risk-classifier.js';

// Re-export components for direct import
export const PermissionModal = PermissionModalImport;
export const PermissionCompact = PermissionCompactImport;
export const PermissionMinimal = PermissionMinimalImport;
export const PermissionBar = PermissionBarImport;
export const PermissionHistory = PermissionHistoryImport;
export const PermissionHistorySummary = PermissionHistorySummaryImport;
export const PermissionHistoryTable = PermissionHistoryTableImport;
export const RiskAssessment = RiskAssessmentImport;
export const RiskBadge = RiskBadgeImport;
export const RiskGauge = RiskGaugeImport;
export const RiskSummary = RiskSummaryImport;
export const MultiToolRisk = MultiToolRiskImport;

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * All permission components in one object
 */
export const PermissionComponents = {
	Modal: PermissionModalImport,
	Compact: PermissionCompactImport,
	Minimal: PermissionMinimalImport,
	Bar: PermissionBarImport,
	History: PermissionHistoryImport,
	HistorySummary: PermissionHistorySummaryImport,
	HistoryTable: PermissionHistoryTableImport,
	Risk: RiskAssessmentImport,
	RiskBadge: RiskBadgeImport,
	RiskGauge: RiskGaugeImport,
	RiskSummary: RiskSummaryImport,
	MultiToolRisk: MultiToolRiskImport,
} as const;

/**
 * All permission types
 */
export const PermissionTypes = {
	RiskLevel: {
		LOW: 'low',
		MEDIUM: 'medium',
		HIGH: 'high',
	} as const,
	Decision: {
		ALLOW: 'allow',
		DENY: 'deny',
	} as const,
	Scope: {
		ONCE: 'once',
		SESSION: 'session',
		ALWAYS: 'always',
	} as const,
};

// ============================================================================
// Default Export
// ============================================================================

export default PermissionComponents;
