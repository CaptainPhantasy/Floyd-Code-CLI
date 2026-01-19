/**
 * UI Components
 *
 * Barrel export for all UI components in the FLOYD CLI.
 *
 * @module ui
 */

// ============================================================================
// LAYOUTS
// ============================================================================

export {
	MainLayout,
	CompactMainLayout,
	MonitorLayout,
	type MainLayoutProps,
	type CompactMainLayoutProps,
	type MonitorLayoutProps,
	type ChatMessage,
	type MessageRole,
} from './layouts/index.js';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
	ToolCard,
	ToolCardList,
	type ToolCardProps,
	type ToolCardListProps,
} from './components/ToolCard.js';

export {
	WorkerBadge,
	StatusRow,
	type WorkerBadgeProps,
	type StatusRowProps,
} from './components/WorkerBadge.js';

export {
	CommandPalette,
	CommandPaletteTrigger,
	commonCommands,
	type CommandPaletteProps,
	type CommandItem,
} from './components/CommandPalette.js';

export {
	DiffViewer,
	CompactDiffView,
	DiffSummary,
	parseUnifiedDiff,
	type DiffViewerProps,
	type CompactDiffViewProps,
	type DiffSummaryProps,
	type DiffLine,
	type DiffLineType,
	type DiffHunk,
	type DiffFile,
} from './components/DiffViewer.js';

// ============================================================================
// AGENT VISUALIZATION
// ============================================================================

export {
	ThinkingStream,
	CompactThinkingStream,
	useThinkingStream,
	type ThinkingStreamProps,
	type CompactThinkingStreamProps,
	type ThoughtBlock,
	type ThinkingStatus,
} from './agent/ThinkingStream.js';

export {
	TaskChecklist,
	TaskGroupList,
	CompactTaskList,
	useTaskChecklist,
	type TaskChecklistProps,
	type TaskGroupListProps,
	type CompactTaskListProps,
	type Task,
	type TaskStatus,
	type TaskGroup,
} from './agent/TaskChecklist.js';

export {
	SwarmOrchestrator,
	CompactSwarmView,
	useSwarmOrchestrator,
	type SwarmOrchestratorProps,
	type CompactSwarmViewProps,
	type SwarmMetrics,
} from './agent/SwarmOrchestrator.js';

export type {SwarmDefinition, SwarmRole} from './agent/SwarmOrchestrator.js';

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
} from './agent/BudgetMeter.js';

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
} from './agent/RateLimitGauge.js';

// ============================================================================
// MONITOR
// ============================================================================

export {
	WorkerStateBoard,
	CompactWorkerState,
	WorkerStatusBadge,
	WorkerProgressRow,
	type WorkerStateBoardProps,
	type WorkerState,
	type WorkerStateStatus,
	type WorkerType,
} from './monitor/WorkerStateBoard.js';

export {
	ToolTimeline,
	CompactTimeline,
	ToolExecutionCard,
	type ToolTimelineProps,
	type ToolExecutionCardProps,
	type ToolExecution,
	type ToolExecutionStatus,
} from './monitor/ToolTimeline.js';

export {
	EventStream,
	CompactEventStream,
	type EventStreamProps,
	type CompactEventStreamProps,
	type StreamEvent,
	type EventType,
	type EventSeverity,
} from './monitor/EventStream.js';

export {
	SystemMetrics,
	MetricGauge,
	MetricsPanel,
	type SystemMetricsProps,
	type MetricGaugeProps,
	type MetricsPanelProps,
	type MetricData,
	type SystemMetricsData,
} from './monitor/SystemMetrics.js';

export {
	BrowserState,
	CompactBrowserState,
	DomainPermissionToggle,
	BrowserConnectionIndicator,
	type BrowserStateProps,
	type DomainPermissionToggleProps,
	type BrowserConnectionIndicatorProps,
	type BrowserConnectionStatus,
	type DomainPermission,
	type DomainRule,
	type ActiveTab,
	type PermissionRequest,
} from './monitor/BrowserState.js';

export {
	GitActivity,
	CompactGitStatus,
	GitBranchSelector,
	GitSyncIndicator,
	type GitActivityProps,
	type GitBranchSelectorProps,
	type GitSyncIndicatorProps,
	type GitSyncStatus,
	type GitFileChange,
	type GitCommit,
	type GitStatus,
} from './monitor/GitActivity.js';

export {
	AlertTicker,
	CompactAlertTicker,
	AlertBanner,
	AlertSummary,
	type AlertTickerProps,
	type AlertBannerProps,
	type AlertSummaryProps,
	type AlertSeverity,
	type AlertType,
	type Alert,
} from './monitor/AlertTicker.js';

// ============================================================================
// THEME
// ============================================================================

export {
	crushTheme,
	floydTheme,
	bgColors,
	textColors,
	accentColors,
	statusColors,
	extendedColors,
	roleColors,
	getColor,
	hasColor,
	type CrushTheme,
	type BgColors,
	type TextColors,
	type AccentColors,
	type StatusColors,
	type RoleColors,
} from '../theme/crush-theme.js';

export {
	pulseFrames,
	spinFrames,
	type AnimationPreset,
	type AnimationTiming,
} from '../theme/animations.js';
