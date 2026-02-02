/**
 * BudgetMeter Component
 *
 * Usage/cost visualization with progress bars.
 * Displays token usage, API costs, and budget tracking.
 *
 * Features:
 * - Token usage tracking (input/output/total)
 * - Cost estimation display
 * - Budget progress bars with warning levels
 * - Per-request cost breakdown
 * - Remaining budget calculation
 * - Historical usage trends
 */

import {useState} from 'react';
import {Box, Text} from 'ink';
import {crushTheme} from '../../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenUsage {
	/** Input tokens used */
	input: number;

	/** Output tokens used */
	output: number;

	/** Cache read tokens (if available) */
	cacheRead?: number;

	/** Cache write tokens (if available) */
	cacheWrite?: number;
}

export interface CostBreakdown {
	/** Cost in USD */
	inputCost: number;

	/** Cost in USD */
	outputCost: number;

	/** Cache read cost (if applicable) */
	cacheReadCost?: number;

	/** Cache write cost (if applicable) */
	cacheWriteCost?: number;

	/** Total cost */
	totalCost: number;
}

export interface BudgetConfig {
	/** Maximum budget in USD */
	maxBudget: number;

	/** Budget warning threshold (0-1) */
	warningThreshold: number;

	/** Budget critical threshold (0-1) */
	criticalThreshold: number;

	/** Cost per million input tokens */
	inputCostPerMillion: number;

	/** Cost per million output tokens */
	outputCostPerMillion: number;

	/** Cache read cost per million tokens */
	cacheReadCostPerMillion?: number;

	/** Cache write cost per million tokens */
	cacheWriteCostPerMillion?: number;

	/** Currency symbol */
	currency?: string;
}

export interface BudgetMeterProps {
	/** Current token usage */
	usage: TokenUsage;

	/** Budget configuration */
	config: BudgetConfig;

	/** Show detailed cost breakdown */
	showBreakdown?: boolean;

	/** Show cache stats if available */
	showCache?: boolean;

	/** Compact mode */
	compact?: boolean;

	/** Width constraint */
	width?: number;

	/** Historical usage for trend display */
	historicalUsage?: TokenUsage[];

	/** Custom currency formatter */
	formatCurrency?: (amount: number) => string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate total tokens
 */
function getTotalTokens(usage: TokenUsage): number {
	return (
		usage.input +
		usage.output +
		(usage.cacheRead || 0) +
		(usage.cacheWrite || 0)
	);
}

/**
 * Calculate cost from token usage
 */
function calculateCost(usage: TokenUsage, config: BudgetConfig): CostBreakdown {
	const inputCost = (usage.input / 1_000_000) * config.inputCostPerMillion;
	const outputCost = (usage.output / 1_000_000) * config.outputCostPerMillion;
	const cacheReadCost =
		config.cacheReadCostPerMillion && usage.cacheRead
			? (usage.cacheRead / 1_000_000) * config.cacheReadCostPerMillion
			: 0;
	const cacheWriteCost =
		config.cacheWriteCostPerMillion && usage.cacheWrite
			? (usage.cacheWrite / 1_000_000) * config.cacheWriteCostPerMillion
			: 0;

	return {
		inputCost,
		outputCost,
		cacheReadCost,
		cacheWriteCost,
		totalCost: inputCost + outputCost + cacheReadCost + cacheWriteCost,
	};
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
	if (num < 1000) return num.toString();
	if (num < 1_000_000) return `${(num / 1000).toFixed(1)}k`;
	return `${(num / 1_000_000).toFixed(2)}M`;
}

/**
 * Format currency (default)
 */
function formatCurrencyDefault(amount: number, currency = '$'): string {
	if (amount < 0.01) return `${currency}${(amount * 100).toFixed(2)}¢`;
	if (amount < 1) return `${currency}${amount.toFixed(3)}`;
	return `${currency}${amount.toFixed(2)}`;
}

/**
 * Get budget status color
 */
function getBudgetStatusColor(ratio: number, config: BudgetConfig): string {
	if (ratio >= config.criticalThreshold) {
		return crushTheme.status.error;
	}
	if (ratio >= config.warningThreshold) {
		return crushTheme.status.warning;
	}
	return crushTheme.status.ready;
}

/**
 * Get budget status label
 */
function getBudgetStatusLabel(ratio: number, config: BudgetConfig): string {
	if (ratio >= config.criticalThreshold) {
		return 'CRITICAL';
	}
	if (ratio >= config.warningThreshold) {
		return 'WARNING';
	}
	if (ratio >= 0.5) {
		return 'OK';
	}
	return 'GOOD';
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

interface BudgetProgressBarProps {
	ratio: number;
	config: BudgetConfig;
	width: number;
	showLabel?: boolean;
}

function BudgetProgressBar({
	ratio,
	config,
	width,
	showLabel = true,
}: BudgetProgressBarProps) {
	const color = getBudgetStatusColor(ratio, config);
	const filledWidth = Math.round((width - 2) * Math.min(1, ratio));
	const emptyWidth = width - 2 - filledWidth;

	return (
		<Box flexDirection="row" width={width}>
			<Text color={color}>[</Text>
			<Text color={color}>{'█'.repeat(filledWidth)}</Text>
			<Text color={crushTheme.bg.elevated}>{'█'.repeat(emptyWidth)}</Text>
			<Text color={color}>]</Text>
			{showLabel && <Text color={color}> {Math.round(ratio * 100)}%</Text>}
		</Box>
	);
}

// ============================================================================
// TOKEN DISPLAY COMPONENT
// ============================================================================

interface TokenDisplayProps {
	usage: TokenUsage;
	config: BudgetConfig;
	cost: CostBreakdown;
	showCache: boolean;
	formatCost: (amount: number) => string;
}

function TokenDisplay({usage, cost, showCache, formatCost}: TokenDisplayProps) {
	return (
		<Box flexDirection="column" gap={0}>
			{/* Input tokens */}
			<Box flexDirection="row" justifyContent="space-between" width={40}>
				<Text color={crushTheme.text.tertiary}>Input:</Text>
				<Text color={crushTheme.text.primary}>
					{formatNumber(usage.input)} tokens
				</Text>
			</Box>

			{/* Output tokens */}
			<Box flexDirection="row" justifyContent="space-between" width={40}>
				<Text color={crushTheme.text.tertiary}>Output:</Text>
				<Text color={crushTheme.text.primary}>
					{formatNumber(usage.output)} tokens
				</Text>
			</Box>

			{/* Cache tokens */}
			{showCache && ((usage.cacheRead ?? 0) || (usage.cacheWrite ?? 0)) && (
				<>
					{(usage.cacheRead ?? 0) > 0 && (
						<Box flexDirection="row" justifyContent="space-between" width={40}>
							<Text color={crushTheme.text.tertiary}>Cache Read:</Text>
							<Text color={crushTheme.accent.tertiary}>
								{formatNumber(usage.cacheRead ?? 0)} tokens
							</Text>
						</Box>
					)}
					{(usage.cacheWrite ?? 0) > 0 && (
						<Box flexDirection="row" justifyContent="space-between" width={40}>
							<Text color={crushTheme.text.tertiary}>Cache Write:</Text>
							<Text color={crushTheme.accent.tertiary}>
								{formatNumber(usage.cacheWrite ?? 0)} tokens
							</Text>
						</Box>
					)}
				</>
			)}

			{/* Total tokens */}
			<Box
				flexDirection="row"
				justifyContent="space-between"
				width={40}
				marginTop={0}
			>
				<Text bold color={crushTheme.text.primary}>
					Total:
				</Text>
				<Text bold color={crushTheme.text.primary}>
					{formatNumber(getTotalTokens(usage))} tokens
				</Text>
			</Box>

			{/* Cost breakdown */}
			<Box marginTop={1} flexDirection="column" gap={0}>
				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Input Cost:</Text>
					<Text color={crushTheme.text.secondary}>
						{formatCost(cost.inputCost)}
					</Text>
				</Box>
				<Box flexDirection="row" justifyContent="space-between" width={40}>
					<Text color={crushTheme.text.tertiary}>Output Cost:</Text>
					<Text color={crushTheme.text.secondary}>
						{formatCost(cost.outputCost)}
					</Text>
				</Box>
				{(cost.cacheReadCost || cost.cacheWriteCost) && (
					<Box flexDirection="row" justifyContent="space-between" width={40}>
						<Text color={crushTheme.text.tertiary}>Cache Savings:</Text>
						<Text color={crushTheme.status.ready}>
							-
							{formatCost(
								(cost.cacheReadCost || 0) + (cost.cacheWriteCost || 0),
							)}
						</Text>
					</Box>
				)}
				<Box
					flexDirection="row"
					justifyContent="space-between"
					width={40}
					marginTop={0}
				>
					<Text bold color={crushTheme.text.primary}>
						Total Cost:
					</Text>
					<Text bold color={crushTheme.accent.secondary}>
						{formatCost(cost.totalCost)}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

// ============================================================================
// USAGE TREND COMPONENT
// ============================================================================

interface UsageTrendProps {
	historical: TokenUsage[];
	width: number;
}

function UsageTrend({historical, width}: UsageTrendProps) {
	if (historical.length < 2) return null;

	// Calculate trend
	const recent = historical.slice(-5);
	const totals = recent.map(h => getTotalTokens(h));
	const max = Math.max(...totals, 1);

	// Create sparkline
	const sparklineWidth = width - 10;
	const normalized = totals.map(t =>
		Math.round((t / max) * (sparklineWidth - 1)),
	);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={crushTheme.text.secondary}>Trend:</Text>
			{normalized.map((height, i) => {
				const char =
					height === 0
						? '▁'
						: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'][
								Math.min(7, Math.ceil((height / (sparklineWidth - 1)) * 7))
						  ];
				return (
					<Text key={i} color={crushTheme.accent.tertiary}>
						{char}
					</Text>
				);
			})}
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * BudgetMeter - Usage/cost visualization display
 */
export function BudgetMeter({
	usage,
	config,
	showBreakdown = true,
	showCache = true,
	compact = false,
	width = 50,
	historicalUsage,
	formatCurrency = a => formatCurrencyDefault(a, config.currency),
}: BudgetMeterProps) {
	const cost = calculateCost(usage, config);
	const budgetRatio =
		config.maxBudget > 0 ? cost.totalCost / config.maxBudget : 0;
	const remainingBudget = Math.max(0, config.maxBudget - cost.totalCost);
	const statusColor = getBudgetStatusColor(budgetRatio, config);
	const statusLabel = getBudgetStatusLabel(budgetRatio, config);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box borderStyle="single" borderColor={statusColor} paddingX={1}>
				<Text bold color={statusColor}>
					Budget
				</Text>
				<Text color={crushTheme.text.secondary}> ({statusLabel})</Text>
			</Box>

			{/* Budget progress */}
			<Box marginTop={1} marginBottom={1}>
				<Box
					flexDirection="row"
					justifyContent="space-between"
					width={width}
					marginBottom={0}
				>
					<Text color={crushTheme.text.tertiary}>
						Spent: {formatCurrency(cost.totalCost)}
					</Text>
					<Text color={crushTheme.text.secondary}>
						of {formatCurrency(config.maxBudget)}
					</Text>
				</Box>
				<Box marginTop={0}>
					<BudgetProgressBar
						ratio={budgetRatio}
						config={config}
						width={width - 2}
					/>
				</Box>
				{remainingBudget > 0 && (
					<Box marginTop={0}>
						<Text color={crushTheme.text.secondary} dimColor>
							Remaining: {formatCurrency(remainingBudget)}
						</Text>
					</Box>
				)}
			</Box>

			{/* Compact or detailed view */}
			{compact ? (
				// Compact view
				<Box flexDirection="row" justifyContent="space-between" width={width}>
					<Text color={crushTheme.text.tertiary}>
						{formatNumber(getTotalTokens(usage))} tokens
					</Text>
					<Text color={crushTheme.accent.secondary}>
						{formatCurrency(cost.totalCost)}
					</Text>
				</Box>
			) : (
				// Detailed breakdown
				showBreakdown && (
					<Box marginBottom={1}>
						<TokenDisplay
							usage={usage}
							config={config}
							cost={cost}
							showCache={showCache}
							formatCost={formatCurrency}
						/>
					</Box>
				)
			)}

			{/* Historical trend */}
			{!compact && historicalUsage && historicalUsage.length > 1 && (
				<Box>
					<UsageTrend historical={historicalUsage} width={width} />
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// MULTI-BUDGET VARIANT
// ============================================================================

export interface BudgetItem {
	/** Item name */
	name: string;

	/** Current usage */
	usage: TokenUsage;

	/** Individual budget (0 = no limit) */
	budget?: number;
}

export interface MultiBudgetMeterProps {
	/** Multiple budget items to display */
	items: BudgetItem[];

	/** Shared budget configuration */
	config: BudgetConfig;

	/** Overall budget limit */
	totalBudget: number;

	/** Width constraint */
	width?: number;
}

/**
 * MultiBudgetMeter - Display multiple budget items stacked
 */
export function MultiBudgetMeter({
	items,
	config,
	totalBudget,
	width = 60,
}: MultiBudgetMeterProps) {
	// Calculate totals
	const totalUsage: TokenUsage = {
		input: items.reduce((sum, item) => sum + item.usage.input, 0),
		output: items.reduce((sum, item) => sum + item.usage.output, 0),
		cacheRead: items.reduce(
			(sum, item) => sum + (item.usage.cacheRead || 0),
			0,
		),
		cacheWrite: items.reduce(
			(sum, item) => sum + (item.usage.cacheWrite || 0),
			0,
		),
	};

	const totalCost = calculateCost(totalUsage, config);
	const budgetRatio = totalBudget > 0 ? totalCost.totalCost / totalBudget : 0;
	const statusColor = getBudgetStatusColor(budgetRatio, config);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box borderStyle="single" borderColor={statusColor} paddingX={1}>
				<Text bold color={statusColor}>
					Budget Overview
				</Text>
				<Text color={crushTheme.text.secondary}> ({items.length} items)</Text>
			</Box>

			{/* Overall budget bar */}
			<Box marginTop={1} marginBottom={1}>
				<BudgetProgressBar
					ratio={budgetRatio}
					config={config}
					width={width - 2}
				/>
				<Box
					flexDirection="row"
					justifyContent="space-between"
					width={width}
					marginTop={0}
				>
					<Text color={crushTheme.text.tertiary}>
						Total: {formatCurrencyDefault(totalCost.totalCost, config.currency)}
					</Text>
					<Text color={crushTheme.text.secondary}>
						of {formatCurrencyDefault(totalBudget, config.currency)}
					</Text>
				</Box>
			</Box>

			{/* Individual items */}
			<Box flexDirection="column" gap={0}>
				{items.map((item, index) => {
					const itemCost = calculateCost(item.usage, config);
					const itemRatio =
						item.budget && item.budget > 0
							? itemCost.totalCost / item.budget
							: 0;

					return (
						<Box key={index} flexDirection="column" marginBottom={0}>
							<Box
								flexDirection="row"
								justifyContent="space-between"
								width={width - 2}
							>
								<Text color={crushTheme.text.tertiary}>{item.name}</Text>
								<Text color={crushTheme.text.secondary}>
									{formatCurrencyDefault(itemCost.totalCost, config.currency)}
									{item.budget &&
										` / ${formatCurrencyDefault(item.budget, config.currency)}`}
								</Text>
							</Box>
							{item.budget && item.budget > 0 && (
								<Box marginTop={0} marginLeft={1}>
									<BudgetProgressBar
										ratio={itemRatio}
										config={config}
										width={width - 4}
										showLabel={false}
									/>
								</Box>
							)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactBudgetMeterProps {
	usage: TokenUsage;
	config: BudgetConfig;
	currency?: string;
}

/**
 * CompactBudgetMeter - Single-line budget display
 */
export function CompactBudgetMeter({
	usage,
	config,
	currency,
}: CompactBudgetMeterProps) {
	const cost = calculateCost(usage, config);
	const budgetRatio =
		config.maxBudget > 0 ? cost.totalCost / config.maxBudget : 0;
	const statusColor = getBudgetStatusColor(budgetRatio, config);

	const displayCurrency = currency || config.currency || '$';

	return (
		<Box flexDirection="row" gap={2}>
			<Text color={crushTheme.text.tertiary}>
				{formatNumber(getTotalTokens(usage))} tokens
			</Text>
			<Text color={statusColor}>
				{formatCurrencyDefault(cost.totalCost, displayCurrency)}
			</Text>
			{config.maxBudget > 0 && (
				<Text color={crushTheme.text.secondary} dimColor>
					/ {formatCurrencyDefault(config.maxBudget, displayCurrency)}
				</Text>
			)}
		</Box>
	);
}

// ============================================================================
// HOOKS FOR INTEGRATION
// ============================================================================

/**
 * Hook for managing budget meter state
 */
export interface UseBudgetMeterResult {
	usage: TokenUsage;
	cost: CostBreakdown;
	budgetRatio: number;
	remaining: number;
	addTokens: (tokens: Partial<TokenUsage>) => void;
	reset: () => void;
}

export function useBudgetMeter(config: BudgetConfig): UseBudgetMeterResult {
	const [usage, setUsage] = useState<TokenUsage>({input: 0, output: 0});

	const cost = calculateCost(usage, config);
	const budgetRatio =
		config.maxBudget > 0 ? cost.totalCost / config.maxBudget : 0;
	const remaining = Math.max(0, config.maxBudget - cost.totalCost);

	const addTokens = (tokens: Partial<TokenUsage>) => {
		setUsage(prev => ({
			input: prev.input + (tokens.input || 0),
			output: prev.output + (tokens.output || 0),
			cacheRead: (prev.cacheRead || 0) + (tokens.cacheRead || 0),
			cacheWrite: (prev.cacheWrite || 0) + (tokens.cacheWrite || 0),
		}));
	};

	const reset = () => {
		setUsage({input: 0, output: 0});
	};

	return {
		usage,
		cost,
		budgetRatio,
		remaining,
		addTokens,
		reset,
	};
}

export default BudgetMeter;
