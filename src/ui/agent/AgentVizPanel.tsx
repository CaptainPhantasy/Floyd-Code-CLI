/**
 * AgentVizPanel Component
 *
 * Main panel showing all agent state in one view.
 * Integrates TaskChecklist, ThinkingStream, BudgetMeter, RateLimitGauge, and SwarmOrchestrator.
 *
 * Features:
 * - Unified agent state display
 * - Tab-based navigation for different views
 * - Compact mode for small terminals
 * - Real-time updates with animations
 * - CRUSH theme styling throughout
 */

import {useState, useCallback} from 'react';
import {Box, Text} from 'ink';
import {crushTheme} from '../../theme/crush-theme.js';

// Import all agent visualization components
import {TaskChecklist, CompactTaskList, type Task} from './TaskChecklist.js';
import {
	ThinkingStream,
	CompactThinkingStream,
	type ThoughtBlock,
	type ThinkingStatus,
} from './ThinkingStream.js';
import {
	BudgetMeter,
	CompactBudgetMeter,
	type TokenUsage,
	type BudgetConfig,
} from './BudgetMeter.js';
import {
	RateLimitGauge,
	CompactRateLimitGauge,
	type RateLimitConfig,
} from './RateLimitGauge.js';
import {
	SwarmOrchestrator,
	CompactSwarmView,
	type SwarmDefinition,
} from './SwarmOrchestrator.js';
import type {SchedulerMetrics} from '../../throughput/scheduler.js';

// ============================================================================
// TYPES
// ============================================================================

export type AgentVizTab = 'tasks' | 'thinking' | 'budget' | 'rate' | 'swarm';

export interface AgentVizPanelProps {
	/** Current task list */
	tasks?: Task[];

	/** Thought blocks for thinking stream */
	thoughts?: ThoughtBlock[];

	/** Token usage for budget meter */
	tokenUsage?: TokenUsage;

	/** Budget configuration */
	budgetConfig?: BudgetConfig;

	/** Rate limit metrics */
	rateLimitMetrics?: SchedulerMetrics;

	/** Rate limit configuration */
	rateLimitConfig?: RateLimitConfig;

	/** Swarm definitions */
	swarms?: SwarmDefinition[];

	/** Current agent status */
	agentStatus?: ThinkingStatus;

	/** Compact mode (smaller display) */
	compact?: boolean;

	/** Width constraint */
	width?: number;

	/** Show tabs for navigation */
	showTabs?: boolean;

	/** Default active tab */
	defaultTab?: AgentVizTab;

	/** Custom tab labels */
	customTabLabels?: Partial<Record<AgentVizTab, string>>;

	/** Enable animations */
	animate?: boolean;

	/** Callback when tab changes */
	onTabChange?: (tab: AgentVizTab) => void;
}

// ============================================================================
// TAB LABELS
// ============================================================================

const DEFAULT_TAB_LABELS: Record<AgentVizTab, string> = {
	tasks: 'Tasks',
	thinking: 'Thinking',
	budget: 'Budget',
	rate: 'Rate',
	swarm: 'Swarm',
};

function getTabLabel(
	tab: AgentVizTab,
	customLabels?: Partial<Record<AgentVizTab, string>>,
): string {
	return customLabels?.[tab] ?? DEFAULT_TAB_LABELS[tab];
}

function getTabColor(_tab: AgentVizTab, isActive: boolean): string {
	if (isActive) {
		return crushTheme.accent.secondary;
	}
	return crushTheme.text.secondary;
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

interface TabNavigationProps {
	tabs: AgentVizTab[];
	activeTab: AgentVizTab;
	customLabels?: Partial<Record<AgentVizTab, string>>;
	onTabChange: (tab: AgentVizTab) => void;
	width: number;
}

function TabNavigation({
	tabs,
	activeTab,
	customLabels,
	width,
}: TabNavigationProps) {
	return (
		<Box flexDirection="row" gap={1} marginBottom={1} width={width}>
			{tabs.map((tab, index) => {
				const isActive = tab === activeTab;
				const label = getTabLabel(tab, customLabels);
				const color = getTabColor(tab, isActive);

				return (
					<Box
						key={tab}
						borderStyle={isActive ? 'double' : 'single'}
						borderColor={color}
						paddingX={1}
					>
						<Text bold color={color}>
							{index + 1}. {label}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}

// ============================================================================
// COMPACT TAB INDICATOR
// ============================================================================

interface CompactTabIndicatorProps {
	activeTab: AgentVizTab;
	customLabels?: Partial<Record<AgentVizTab, string>>;
}

function CompactTabIndicator({
	activeTab,
	customLabels,
}: CompactTabIndicatorProps) {
	const label = getTabLabel(activeTab, customLabels);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={crushTheme.text.secondary}>View:</Text>
			<Text bold color={crushTheme.accent.secondary}>
				{label}
			</Text>
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AgentVizPanel - Unified agent state visualization panel
 *
 * Displays all agent-related information in a tabbed interface:
 * - Tasks: Task checklist with progress tracking
 * - Thinking: Real-time thinking stream
 * - Budget: Token usage and cost tracking
 * - Rate: Rate limiting and throughput
 * - Swarm: Multi-agent swarm orchestration
 */
export function AgentVizPanel({
	tasks = [],
	thoughts = [],
	tokenUsage = {input: 0, output: 0},
	budgetConfig = {
		maxBudget: 10,
		warningThreshold: 0.7,
		criticalThreshold: 0.9,
		inputCostPerMillion: 2.5,
		outputCostPerMillion: 10.0,
		currency: '$',
	},
	rateLimitMetrics = {
		currentRpm: 0,
		queueLength: 0,
		droppedRequests: 0,
		totalRequests: 0,
		totalErrors: 0,
		isBackedOff: false,
		backoffRemainingMs: 0,
		backpressure: false,
		waitTime: 0,
	},
	rateLimitConfig = {
		targetRpm: 2000,
		hardCapRpm: 5000,
		warningThreshold: 0.8,
		criticalThreshold: 0.95,
		maxQueueSize: 200,
	},
	swarms = [],
	agentStatus = 'idle',
	compact = false,
	width = 60,
	showTabs = true,
	defaultTab = 'tasks',
	customTabLabels,
	animate = true,
	onTabChange,
}: AgentVizPanelProps) {
	const [activeTab, setActiveTab] = useState<AgentVizTab>(defaultTab);

	const handleTabChange = useCallback(
		(tab: AgentVizTab) => {
			setActiveTab(tab);
			onTabChange?.(tab);
		},
		[onTabChange],
	);

	// Available tabs
	const availableTabs: AgentVizTab[] = ['tasks', 'thinking'];

	// Add budget tab if config provided
	if (budgetConfig) {
		availableTabs.push('budget');
	}

	// Add rate limit tab if metrics provided
	if (rateLimitMetrics) {
		availableTabs.push('rate');
	}

	// Add swarm tab if swarms provided
	if (swarms && swarms.length > 0) {
		availableTabs.push('swarm');
	}

	// Ensure active tab is valid
	const safeActiveTab: AgentVizTab = availableTabs.includes(activeTab)
		? activeTab
		: availableTabs[0] ?? 'tasks';

	// ============================================================================
	// RENDER CONTENT BASED ON ACTIVE TAB
	// ============================================================================

	const renderContent = () => {
		switch (safeActiveTab) {
			case 'tasks':
				return (
					<TaskChecklist
						tasks={tasks}
						showProgress={!compact}
						showTimestamps={false}
						showDescriptions={!compact}
						width={width}
						animate={animate}
					/>
				);

			case 'thinking':
				return (
					<ThinkingStream
						thoughts={thoughts}
						maxThoughts={compact ? 5 : 10}
						showTimestamps={!compact}
						animate={animate}
						width={width}
					/>
				);

			case 'budget':
				return (
					<BudgetMeter
						usage={tokenUsage}
						config={budgetConfig}
						showBreakdown={!compact}
						showCache={true}
						compact={compact}
						width={width}
					/>
				);

			case 'rate':
				return (
					<RateLimitGauge
						metrics={rateLimitMetrics}
						config={rateLimitConfig}
						showDetails={!compact}
						showQueue={!compact}
						compact={compact}
						width={width}
					/>
				);

			case 'swarm':
				return (
					<SwarmOrchestrator
						swarms={swarms}
						showDetails={!compact}
						compact={compact}
						width={width}
						animate={animate}
					/>
				);

			default:
				return null;
		}
	};

	// ============================================================================
	// COMPACT MODE
	// ============================================================================

	if (compact) {
		return (
			<Box flexDirection="column" width={width}>
				{/* Header with tab indicator */}
				<Box
					borderStyle="single"
					borderColor={crushTheme.accent.primary}
					paddingX={1}
					marginBottom={1}
				>
					<Text bold color={crushTheme.accent.secondary}>
						Agent State
					</Text>
					<Text> </Text>
					<CompactTabIndicator
						activeTab={safeActiveTab}
						customLabels={customTabLabels}
					/>
				</Box>

				{/* Content based on active tab */}
				{safeActiveTab === 'tasks' && (
					<CompactTaskList tasks={tasks} maxItems={5} showIcons />
				)}

				{safeActiveTab === 'thinking' && thoughts.length > 0 && (
					<CompactThinkingStream
						content={thoughts[thoughts.length - 1]?.content ?? ''}
						status={agentStatus}
						label="Thinking"
					/>
				)}

				{safeActiveTab === 'budget' && (
					<CompactBudgetMeter usage={tokenUsage} config={budgetConfig} />
				)}

				{safeActiveTab === 'rate' && (
					<CompactRateLimitGauge
						metrics={rateLimitMetrics}
						config={rateLimitConfig}
					/>
				)}

				{safeActiveTab === 'swarm' && <CompactSwarmView swarms={swarms} />}
			</Box>
		);
	}

	// ============================================================================
	// FULL MODE
	// ============================================================================

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor={crushTheme.accent.primary}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={crushTheme.accent.secondary}>
					Agent Visualization
				</Text>
				<Text color={crushTheme.text.secondary}>
					{' '}
					({availableTabs.length} panels)
				</Text>
			</Box>

			{/* Tab navigation */}
			{showTabs && availableTabs.length > 1 && (
				<TabNavigation
					tabs={availableTabs}
					activeTab={safeActiveTab}
					customLabels={customTabLabels}
					onTabChange={handleTabChange}
					width={width}
				/>
			)}

			{/* Content area */}
			<Box marginTop={1}>{renderContent()}</Box>

			{/* Keyboard hints */}
			{showTabs && availableTabs.length > 1 && (
				<Box marginTop={1}>
					<Text color={crushTheme.text.subtle} dimColor>
						Press 1-{availableTabs.length} to switch views
					</Text>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactAgentVizPanelProps {
	tasks?: Task[];
	thoughts?: ThoughtBlock[];
	tokenUsage?: TokenUsage;
	budgetConfig?: BudgetConfig;
	rateLimitMetrics?: SchedulerMetrics;
	rateLimitConfig?: RateLimitConfig;
	swarms?: SwarmDefinition[];
	agentStatus?: ThinkingStatus;
	width?: number;
}

/**
 * CompactAgentVizPanel - Single-line summary of agent state
 */
export function CompactAgentVizPanel({
	tasks = [],
	thoughts: _thoughts = [],
	tokenUsage = {input: 0, output: 0},
	budgetConfig,
	rateLimitMetrics: _rateLimitMetrics,
	swarms = [],
	agentStatus = 'idle',
	width = 50,
}: CompactAgentVizPanelProps) {
	// Calculate summary metrics
	const completeTasks = tasks.filter(t => t.status === 'complete').length;
	const totalTasks = tasks.length;

	return (
		<Box flexDirection="row" gap={2} width={width}>
			{/* Task summary */}
			{totalTasks > 0 && (
				<Text color={crushTheme.status.ready}>
					{completeTasks}/{totalTasks} tasks
				</Text>
			)}

			{/* Thinking status */}
			{(agentStatus === 'thinking' || agentStatus === 'streaming') && (
				<Text color={crushTheme.status.working}>Thinking...</Text>
			)}

			{/* Token usage */}
			{budgetConfig && tokenUsage && (
				<Text color={crushTheme.text.secondary}>
					{tokenUsage.input + tokenUsage.output} tokens
				</Text>
			)}

			{/* Swarm status */}
			{swarms.length > 0 && (
				<Text color={crushTheme.accent.primary}>
					{
						swarms.filter(s => s.status === 'active' || s.status === 'busy')
							.length
					}
					/{swarms.length} swarms
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// MINI VARIANT
// ============================================================================

export interface MiniAgentVizProps {
	agentStatus?: ThinkingStatus;
	taskProgress?: number; // 0-100
	width?: number;
}

/**
 * MiniAgentViz - Minimal status indicator
 */
export function MiniAgentViz({
	agentStatus = 'idle',
	taskProgress = 0,
	width = 20,
}: MiniAgentVizProps) {
	const getStatusColor = (): string => {
		switch (agentStatus) {
			case 'thinking':
			case 'streaming':
				return crushTheme.status.working;
			case 'complete':
				return crushTheme.status.ready;
			case 'error':
				return crushTheme.status.error;
			default:
				return crushTheme.status.offline;
		}
	};

	const statusColor = getStatusColor();
	const progressWidth = Math.round((width - 2) * (taskProgress / 100));
	const emptyWidth = width - 2 - progressWidth;

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={statusColor}>
				{agentStatus === 'thinking' || agentStatus === 'streaming' ? '●' : '○'}
			</Text>
			{taskProgress > 0 && (
				<Box flexDirection="row">
					<Text color={statusColor}>[</Text>
					<Text color={statusColor}>{'━'.repeat(progressWidth)}</Text>
					<Text color={crushTheme.bg.elevated}>{'━'.repeat(emptyWidth)}</Text>
					<Text color={statusColor}>]</Text>
					<Text color={statusColor}> {taskProgress}%</Text>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// HOOK FOR INTEGRATION
// ============================================================================

export interface UseAgentVizPanelResult {
	activeTab: AgentVizTab;
	setTab: (tab: AgentVizTab) => void;
	nextTab: () => void;
	prevTab: () => void;
}

/**
 * Hook for managing AgentVizPanel tab state
 */
export function useAgentVizPanel(
	initialTab: AgentVizTab = 'tasks',
): UseAgentVizPanelResult {
	const [activeTab, setActiveTab] = useState<AgentVizTab>(initialTab);

	const tabs: AgentVizTab[] = ['tasks', 'thinking', 'budget', 'rate', 'swarm'];

	const nextTab = () => {
		const currentIndex = tabs.indexOf(activeTab);
		const nextIndex = (currentIndex + 1) % tabs.length;
		const nextTab = tabs[nextIndex];
		if (nextTab) {
			setActiveTab(nextTab);
		}
	};

	const prevTab = () => {
		const currentIndex = tabs.indexOf(activeTab);
		const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		const prevTab = tabs[prevIndex];
		if (prevTab) {
			setActiveTab(prevTab);
		}
	};

	return {
		activeTab,
		setTab: setActiveTab,
		nextTab,
		prevTab,
	};
}

export default AgentVizPanel;
