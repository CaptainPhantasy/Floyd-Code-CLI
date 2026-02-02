/**
 * SwarmOrchestrator Component
 *
 * Visual swarm management with status per swarm.
 * Displays the multi-agent swarm system with real-time status indicators.
 *
 * Features:
 * - Visual grid layout for 6 swarms (2 manager + 4 worker)
 * - Real-time status updates per swarm
 * - Request load visualization
 * - Health indicators with color coding
 * - Swarm type differentiation (manager vs worker)
 * - Activity pulse animation for active swarms
 */

import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {crushTheme} from '../../theme/crush-theme.js';
import {pulseFrames} from '../../theme/animations.js';
import type {
	SwarmDefinition,
	SwarmRole,
} from '../../throughput/swarm-scheduler.js';

// Re-export types from scheduler for convenience
export type {SwarmDefinition, SwarmRole};

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export interface SwarmOrchestratorProps {
	/** Array of swarm definitions */
	swarms: SwarmDefinition[];

	/** Show detailed metrics per swarm */
	showDetails?: boolean;

	/** Compact mode (smaller display) */
	compact?: boolean;

	/** Width constraint */
	width?: number;

	/** Enable animations */
	animate?: boolean;

	/** Custom labels for swarm types */
	customLabels?: Partial<Record<SwarmRole, string>>;

	/** Callback when swarm is selected */
	onSelectSwarm?: (id: string) => void;

	/** Selected swarm ID */
	selectedSwarm?: string;
}

export interface SwarmMetrics {
	/** Total active swarms */
	activeSwarms: number;

	/** Total requests processed */
	totalRequests: number;

	/** Requests per swarm ID */
	requestsBySwarm: Record<string, number>;

	/** Average latency across swarms */
	averageSwarmLatency: number;

	/** Current rotation index */
	currentRotation: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get status color for swarm
 */
function getSwarmStatusColor(status: SwarmDefinition['status']): string {
	switch (status) {
		case 'active':
			return crushTheme.status.online;
		case 'busy':
			return crushTheme.status.busy;
		case 'idle':
			return crushTheme.status.offline;
		case 'error':
			return crushTheme.status.error;
		default:
			return crushTheme.text.secondary;
	}
}

/**
 * Get status indicator character
 */
function getSwarmStatusIndicator(status: SwarmDefinition['status']): string {
	switch (status) {
		case 'active':
			return '●';
		case 'busy':
			return '◐';
		case 'idle':
			return '○';
		case 'error':
			return '✕';
		default:
			return '?';
	}
}

/**
 * Get label for swarm role
 */
function getSwarmRoleLabel(
	role: SwarmRole,
	customLabels?: Partial<Record<SwarmRole, string>>,
): string {
	return customLabels?.[role] ?? (role === 'manager' ? 'Manager' : 'Worker');
}

/**
 * Get color for swarm role
 */
function getSwarmRoleColor(role: SwarmRole): string {
	return role === 'manager'
		? crushTheme.accent.primary
		: crushTheme.accent.tertiary;
}

/**
 * Calculate swarm load (0-100)
 */
function calculateSwarmLoad(swarm: SwarmDefinition): number {
	if (swarm.currentRequests === 0) return 0;
	// Assume max 10 concurrent requests for visualization
	return Math.min(100, (swarm.currentRequests / 10) * 100);
}

/**
 * Calculate success rate
 */
function calculateSuccessRate(swarm: SwarmDefinition): number {
	const total = swarm.completedRequests + swarm.failedRequests;
	if (total === 0) return 100;
	return Math.round((swarm.completedRequests / total) * 100);
}

// ============================================================================
// SWARM CARD COMPONENT
// ============================================================================

interface SwarmCardProps {
	swarm: SwarmDefinition;
	isSelected: boolean;
	compact: boolean;
	onSelect?: () => void;
}

function SwarmCard({swarm, isSelected, compact}: SwarmCardProps) {
	// Pulse animation for active/busy swarms
	useEffect(() => {
		if (swarm.status === 'active' || swarm.status === 'busy') {
			const pulseGen = pulseFrames();
			const interval = setInterval(() => {
				pulseGen.next();
			}, 50);

			return () => clearInterval(interval);
		}
		return undefined;
	}, [swarm.status]);

	const statusColor = getSwarmStatusColor(swarm.status);
	const roleColor = getSwarmRoleColor(swarm.role);
	const statusIndicator = getSwarmStatusIndicator(swarm.status);
	const roleLabel = getSwarmRoleLabel(swarm.role);
	const load = calculateSwarmLoad(swarm);
	const successRate = calculateSuccessRate(swarm);

	// Load bar width
	const loadWidth = Math.round((load / 100) * 10);
	const loadBar = '█'.repeat(loadWidth) + '░'.repeat(10 - loadWidth);

	return (
		<Box
			flexDirection="column"
			borderStyle={isSelected ? 'double' : 'single'}
			borderColor={isSelected ? roleColor : crushTheme.bg.elevated}
			paddingX={1}
			paddingY={0}
			width={compact ? 18 : 24}
		>
			{/* Header row */}
			<Box flexDirection="row" justifyContent="space-between" width="100%">
				<Box flexDirection="row">
					{/* Status indicator */}
					{swarm.status === 'active' || swarm.status === 'busy' ? (
						<Text color={statusColor}>
							<Spinner type="dots" />{' '}
						</Text>
					) : (
						<Text color={statusColor}>{statusIndicator} </Text>
					)}

					{/* Role label */}
					<Text bold color={roleColor}>
						{roleLabel}
					</Text>
				</Box>

				{/* Current requests */}
				{swarm.currentRequests > 0 && (
					<Text color={crushTheme.status.working}>{swarm.currentRequests}</Text>
				)}
			</Box>

			{/* Swarm ID */}
			{!compact && (
				<Box>
					<Text color={crushTheme.text.secondary} dimColor>
						{swarm.id}
					</Text>
				</Box>
			)}

			{/* Worker type if applicable */}
			{swarm.workerType && !compact && (
				<Box>
					<Text color={crushTheme.text.tertiary}>{swarm.workerType}</Text>
				</Box>
			)}

			{/* Load bar */}
			<Box marginTop={0}>
				<Text
					color={
						swarm.status === 'busy'
							? crushTheme.status.busy
							: crushTheme.bg.elevated
					}
				>
					{loadBar}
				</Text>
			</Box>

			{/* Stats row (non-compact) */}
			{!compact && (
				<Box flexDirection="row" justifyContent="space-between" marginTop={0}>
					<Box flexDirection="row" gap={2}>
						<Text color={crushTheme.status.ready}>
							✓{swarm.completedRequests}
						</Text>
						{swarm.failedRequests > 0 && (
							<Text color={crushTheme.status.error}>
								✕{swarm.failedRequests}
							</Text>
						)}
					</Box>
					{successRate < 100 && swarm.completedRequests > 0 && (
						<Text
							color={
								successRate > 80
									? crushTheme.status.ready
									: crushTheme.status.warning
							}
						>
							{successRate}%
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// SWARM GRID COMPONENT
// ============================================================================

interface SwarmGridProps {
	swarms: SwarmDefinition[];
	compact: boolean;
	selectedSwarm?: string;
	onSelectSwarm?: (id: string) => void;
}

function SwarmGrid({
	swarms,
	compact,
	selectedSwarm,
	onSelectSwarm,
}: SwarmGridProps) {
	// Group swarms by role for organized layout
	const managers = swarms.filter(s => s.role === 'manager');
	const workers = swarms.filter(s => s.role !== 'manager');

	return (
		<Box flexDirection="column" gap={1}>
			{/* Managers section */}
			{managers.length > 0 && (
				<Box flexDirection="column">
					<Box marginBottom={0}>
						<Text bold color={crushTheme.accent.primary}>
							Managers
						</Text>
					</Box>
					<Box flexDirection="row" gap={1} flexWrap="wrap">
						{managers.map(swarm => (
							<SwarmCard
								key={swarm.id}
								swarm={swarm}
								isSelected={selectedSwarm === swarm.id}
								compact={compact}
								onSelect={() => onSelectSwarm?.(swarm.id)}
							/>
						))}
					</Box>
				</Box>
			)}

			{/* Workers section */}
			{workers.length > 0 && (
				<Box flexDirection="column">
					<Box marginBottom={0} marginTop={managers.length > 0 ? 1 : 0}>
						<Text bold color={crushTheme.accent.tertiary}>
							Workers
						</Text>
					</Box>
					<Box flexDirection="row" gap={1} flexWrap="wrap">
						{workers.map(swarm => (
							<SwarmCard
								key={swarm.id}
								swarm={swarm}
								isSelected={selectedSwarm === swarm.id}
								compact={compact}
								onSelect={() => onSelectSwarm?.(swarm.id)}
							/>
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// METRICS SUMMARY
// ============================================================================

interface MetricsSummaryProps {
	swarms: SwarmDefinition[];
	metrics?: SwarmMetrics;
}

function MetricsSummary({swarms}: MetricsSummaryProps) {
	// Calculate metrics if not provided
	const activeCount = swarms.filter(
		s => s.status === 'active' || s.status === 'busy',
	).length;
	const busyCount = swarms.filter(s => s.status === 'busy').length;
	const idleCount = swarms.filter(s => s.status === 'idle').length;
	const errorCount = swarms.filter(s => s.status === 'error').length;

	const totalRequests = swarms.reduce(
		(sum, s) => sum + s.completedRequests + s.failedRequests,
		0,
	);
	const totalFailed = swarms.reduce((sum, s) => sum + s.failedRequests, 0);
	const avgSuccessRate =
		totalRequests > 0
			? Math.round(((totalRequests - totalFailed) / totalRequests) * 100)
			: 100;

	return (
		<Box
			flexDirection="row"
			gap={2}
			justifyContent="space-between"
			width="100%"
		>
			{/* Status counts */}
			<Box flexDirection="row" gap={2}>
				{busyCount > 0 && (
					<Text color={crushTheme.status.busy}>{busyCount} busy</Text>
				)}
				{activeCount > 0 && (
					<Text color={crushTheme.status.online}>{activeCount} active</Text>
				)}
				{idleCount > 0 && (
					<Text color={crushTheme.status.offline}>{idleCount} idle</Text>
				)}
				{errorCount > 0 && (
					<Text color={crushTheme.status.error}>{errorCount} error</Text>
				)}
			</Box>

			{/* Success rate */}
			{totalRequests > 0 && (
				<Text
					color={
						avgSuccessRate > 90
							? crushTheme.status.ready
							: crushTheme.status.warning
					}
				>
					{avgSuccessRate}% success
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// DETAILED SWARM VIEW
// ============================================================================

interface DetailedSwarmViewProps {
	swarm: SwarmDefinition;
}

function DetailedSwarmView({swarm}: DetailedSwarmViewProps) {
	const statusColor = getSwarmStatusColor(swarm.status);
	const roleColor = getSwarmRoleColor(swarm.role);
	const successRate = calculateSuccessRate(swarm);
	const load = calculateSwarmLoad(swarm);

	return (
		<Box flexDirection="column" paddingX={1}>
			{/* Swarm header */}
			<Box flexDirection="row" justifyContent="space-between" width="100%">
				<Box flexDirection="row">
					<Text bold color={roleColor}>
						{swarm.id}
					</Text>
					<Text color={crushTheme.text.secondary}>
						{' '}
						({getSwarmRoleLabel(swarm.role)})
					</Text>
				</Box>
				<Text color={statusColor} bold>
					{swarm.status.toUpperCase()}
				</Text>
			</Box>

			{/* Worker type */}
			{swarm.workerType && (
				<Box marginTop={0}>
					<Text color={crushTheme.text.tertiary}>Type: {swarm.workerType}</Text>
				</Box>
			)}

			{/* Stats */}
			<Box marginTop={1} flexDirection="column" gap={0}>
				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Current Load:</Text>
					<Box flexDirection="row">
						<Text
							color={
								swarm.status === 'busy'
									? crushTheme.status.busy
									: crushTheme.text.primary
							}
						>
							{swarm.currentRequests} requests
						</Text>
						<Text color={crushTheme.text.secondary}> ({load}%)</Text>
					</Box>
				</Box>

				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Completed:</Text>
					<Text color={crushTheme.status.ready}>{swarm.completedRequests}</Text>
				</Box>

				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Failed:</Text>
					<Text color={crushTheme.status.error}>{swarm.failedRequests}</Text>
				</Box>

				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Success Rate:</Text>
					<Text
						color={
							successRate > 90
								? crushTheme.status.ready
								: crushTheme.status.warning
						}
					>
						{successRate}%
					</Text>
				</Box>

				{swarm.averageLatency > 0 && (
					<Box flexDirection="row" justifyContent="space-between" width={40}>
						<Text color={crushTheme.text.tertiary}>Avg Latency:</Text>
						<Text color={crushTheme.text.primary}>
							{swarm.averageLatency}ms
						</Text>
					</Box>
				)}
			</Box>

			{/* Load bar */}
			<Box marginTop={1} width={40}>
				<Box
					flexDirection="row"
					justifyContent="space-between"
					width={40}
					marginBottom={0}
				>
					<Text color={crushTheme.text.tertiary}>Load:</Text>
					<Text color={crushTheme.text.secondary}>{load}%</Text>
				</Box>
				<Box>
					{Array.from({length: 40}).map((_, i) => {
						const fillIndex = Math.floor((load / 100) * 40);
						const isFilled = i < fillIndex;
						const color =
							load > 80
								? crushTheme.status.error
								: load > 50
								? crushTheme.status.busy
								: crushTheme.status.ready;
						return (
							<Text key={i} color={isFilled ? color : crushTheme.bg.elevated}>
								█
							</Text>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * SwarmOrchestrator - Visual swarm management display
 */
export function SwarmOrchestrator({
	swarms,
	showDetails = true,
	compact = false,
	width = 60,
	onSelectSwarm,
	selectedSwarm,
}: SwarmOrchestratorProps) {
	const [internalSelection, setInternalSelection] = useState<
		string | undefined
	>(selectedSwarm);
	const currentSelection = selectedSwarm ?? internalSelection;
	const selectedSwarmData = swarms.find(s => s.id === currentSelection);

	const handleSelectSwarm = (id: string) => {
		setInternalSelection(id);
		onSelectSwarm?.(id);
	};

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor={crushTheme.accent.primary}
				paddingX={1}
			>
				<Text bold color={crushTheme.accent.secondary}>
					Swarm Orchestrator
				</Text>
				<Text color={crushTheme.text.secondary}> ({swarms.length})</Text>
			</Box>

			{/* Metrics summary */}
			<Box marginTop={1} marginBottom={1}>
				<MetricsSummary swarms={swarms} />
			</Box>

			{/* Swarm grid */}
			<Box marginBottom={showDetails && selectedSwarmData ? 1 : 0}>
				<SwarmGrid
					swarms={swarms}
					compact={compact}
					selectedSwarm={currentSelection}
					onSelectSwarm={handleSelectSwarm}
				/>
			</Box>

			{/* Detailed view */}
			{showDetails && selectedSwarmData && (
				<Box
					borderStyle="double"
					borderColor={getSwarmRoleColor(selectedSwarmData.role)}
					paddingY={0}
				>
					<DetailedSwarmView swarm={selectedSwarmData} />
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactSwarmViewProps {
	swarms: SwarmDefinition[];
}

/**
 * CompactSwarmView - Single-line swarm status summary
 */
export function CompactSwarmView({swarms}: CompactSwarmViewProps) {
	const active = swarms.filter(
		s => s.status === 'active' || s.status === 'busy',
	).length;
	const busy = swarms.filter(s => s.status === 'busy').length;
	const totalRequests = swarms.reduce((sum, s) => sum + s.currentRequests, 0);

	return (
		<Box flexDirection="row" gap={2}>
			<Text color={crushTheme.accent.primary}>
				{active}/{swarms.length} swarms
			</Text>
			{busy > 0 && <Text color={crushTheme.status.busy}>{busy} busy</Text>}
			{totalRequests > 0 && (
				<Text color={crushTheme.text.secondary}>{totalRequests} requests</Text>
			)}
		</Box>
	);
}

// ============================================================================
// HOOKS FOR INTEGRATION
// ============================================================================

/**
 * Hook for managing swarm orchestrator state
 */
export interface UseSwarmOrchestratorResult {
	swarms: SwarmDefinition[];
	selectedSwarm: string | undefined;
	selectSwarm: (id: string) => void;
	updateSwarm: (id: string, updates: Partial<SwarmDefinition>) => void;
	getMetrics: () => SwarmMetrics;
}

export function useSwarmOrchestrator(
	initialSwarms: SwarmDefinition[] = [],
): UseSwarmOrchestratorResult {
	const [swarms, setSwarms] = useState<SwarmDefinition[]>(initialSwarms);
	const [selectedSwarm, setSelectedSwarm] = useState<string | undefined>();

	const selectSwarm = (id: string) => {
		setSelectedSwarm(id);
	};

	const updateSwarm = (id: string, updates: Partial<SwarmDefinition>) => {
		setSwarms(prev => prev.map(s => (s.id === id ? {...s, ...updates} : s)));
	};

	const getMetrics = (): SwarmMetrics => {
		const activeSwarms = swarms.filter(
			s => s.status === 'active' || s.status === 'busy',
		).length;
		const totalRequests = swarms.reduce(
			(sum, s) => sum + s.completedRequests + s.failedRequests,
			0,
		);
		const requestsBySwarm: Record<string, number> = {};
		for (const swarm of swarms) {
			requestsBySwarm[swarm.id] =
				swarm.completedRequests + swarm.failedRequests;
		}
		const averageSwarmLatency =
			swarms.reduce((sum, s) => sum + s.averageLatency, 0) / swarms.length;

		return {
			activeSwarms,
			totalRequests,
			requestsBySwarm,
			averageSwarmLatency: Math.round(averageSwarmLatency),
			currentRotation: 0,
		};
	};

	return {
		swarms,
		selectedSwarm,
		selectSwarm,
		updateSwarm,
		getMetrics,
	};
}

export default SwarmOrchestrator;
