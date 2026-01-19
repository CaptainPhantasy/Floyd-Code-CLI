/**
 * Agent Visualization Components
 *
 * Exports all agent-related UI components for displaying:
 * - Real-time thinking and streaming
 * - Task progression and checklists
 * - Swarm orchestration and status
 * - Budget and usage tracking
 * - Rate limiting and throughput
 *
 * @module ui/agent
 */

// ============================================================================
// THINKING STREAM
// ============================================================================

export {
	ThinkingStream,
	CompactThinkingStream,
	useThinkingStream,
	type ThinkingStreamProps,
	type CompactThinkingStreamProps,
	type ThinkingStatus,
	type ThoughtBlock,
	type UseThinkingStreamResult,
} from './ThinkingStream.js';

// ============================================================================
// TASK CHECKLIST
// ============================================================================

export {
	TaskChecklist,
	TaskGroupList,
	CompactTaskList,
	useTaskChecklist,
	type TaskChecklistProps,
	type TaskGroupListProps,
	type CompactTaskListProps,
	type TaskStatus,
	type Task,
	type TaskGroup,
	type UseTaskChecklistResult,
} from './TaskChecklist.js';

// ============================================================================
// SWARM ORCHESTRATOR
// ============================================================================

export {
	SwarmOrchestrator,
	CompactSwarmView,
	useSwarmOrchestrator,
	type SwarmOrchestratorProps,
	type CompactSwarmViewProps,
	type SwarmMetrics,
	type UseSwarmOrchestratorResult,
} from './SwarmOrchestrator.js';

// Re-export from scheduler
export type {
	SwarmDefinition,
	SwarmRole,
} from '../../throughput/swarm-scheduler.js';

// ============================================================================
// BUDGET METER
// ============================================================================

export {
	BudgetMeter,
	MultiBudgetMeter,
	CompactBudgetMeter,
	useBudgetMeter,
	type BudgetMeterProps,
	type MultiBudgetMeterProps,
	type CompactBudgetMeterProps,
	type TokenUsage,
	type CostBreakdown,
	type BudgetConfig,
	type BudgetItem,
	type UseBudgetMeterResult,
} from './BudgetMeter.js';

// ============================================================================
// RATE LIMIT GAUGE
// ============================================================================

export {
	RateLimitGauge,
	CompactRateLimitGauge,
	MiniRateLimitGauge,
	MultiRateLimitGauge,
	useRateLimitGauge,
	type RateLimitGaugeProps,
	type CompactRateLimitGaugeProps,
	type MiniRateLimitGaugeProps,
	type MultiRateLimitGaugeProps,
	type RateLimitConfig,
	type RateLimitItem,
	type UseRateLimitGaugeResult,
} from './RateLimitGauge.js';

// Re-export from scheduler
export type {SchedulerMetrics} from '../../throughput/scheduler.js';

// ============================================================================
// AGENT VIZ PANEL
// ============================================================================

export {
	AgentVizPanel,
	CompactAgentVizPanel,
	MiniAgentViz,
	useAgentVizPanel,
	type AgentVizPanelProps,
	type CompactAgentVizPanelProps,
	type MiniAgentVizProps,
	type UseAgentVizPanelResult,
	type AgentVizTab,
} from './AgentVizPanel.js';
