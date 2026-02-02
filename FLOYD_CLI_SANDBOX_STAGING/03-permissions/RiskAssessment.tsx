/**
 * RiskAssessment Component
 *
 * Visual risk level indicator and calculator for tool calls.
 *
 * Features:
 * - Risk level calculation (low/medium/high)
 * - Visual indicator with color coding
 * - Risk factor explanations
 * - Confidence score display
 * - CRUSH theme styling
 */

import {Box, Text} from 'ink';
import {
	RiskLevel,
	type RiskAssessment as RiskAssessmentResult,
	classifyRisk,
	getRiskDescription,
	getRecommendedAction,
} from './risk-classifier.js';
import {crushTheme, roleColors} from '../theme/crush-theme.js';

// Re-export types and functions for convenience
export type {RiskLevel};
export type {RiskAssessment as RiskAssessmentResult} from './risk-classifier';
export {classifyRisk, getRiskDescription, getRecommendedAction};

export interface RiskAssessmentProps {
	toolName: string;
	arguments?: Record<string, unknown>;
	visible?: boolean;
	showDetails?: boolean;
	showReasons?: boolean;
	compact?: boolean;
}

// Risk level configuration
const RISK_CONFIG = {
	[RiskLevel.LOW]: {
		color: crushTheme.status.ready,
		label: 'LOW',
		symbol: '[SAFE]',
		bar: '▂',
		description: 'Read-only, minimal side effects',
	},
	[RiskLevel.MEDIUM]: {
		color: crushTheme.status.warning,
		label: 'MEDIUM',
		symbol: '[CAUT]',
		bar: '▅',
		description: 'May modify data or access external resources',
	},
	[RiskLevel.HIGH]: {
		color: crushTheme.status.error,
		label: 'HIGH',
		symbol: '[DANG]',
		bar: '▇',
		description: 'Destructive operation or significant system change',
	},
} as const;

// Confidence bar segments
const CONFIDENCE_SEGMENTS = 5;

/**
 * Create a visual confidence bar
 */
function confidenceBar(confidence: number): string {
	const filled = Math.round(confidence * CONFIDENCE_SEGMENTS);
	const empty = CONFIDENCE_SEGMENTS - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Risk Assessment Badge Component (compact)
 */
export interface RiskBadgeProps {
	level: RiskLevel;
	confidence?: number;
	showLabel?: boolean;
}

export function RiskBadge({
	level,
	confidence,
	showLabel = true,
}: RiskBadgeProps) {
	const config = RISK_CONFIG[level];

	return (
		<Box flexDirection="row">
			<Text bold color={config.color}>
				{config.symbol}
			</Text>
			{showLabel && (
				<>
					<Box marginLeft={1} />
					<Text bold color={config.color}>
						{config.label}
					</Text>
				</>
			)}
			{confidence !== undefined && (
				<>
					<Box marginLeft={1} />
					<Text color={crushTheme.text.secondary} dimColor>
						{confidenceBar(confidence)}
					</Text>
				</>
			)}
		</Box>
	);
}

/**
 * Risk Assessment Display Component
 */
export function RiskAssessmentDisplay({
	toolName,
	arguments: args = {},
	visible = true,
	showDetails = true,
	showReasons = true,
	compact = false,
}: RiskAssessmentProps) {
	if (!visible) return null;

	const assessment: RiskAssessmentResult = classifyRisk(toolName, args);
	const config = RISK_CONFIG[assessment.level];
	const recommended = getRecommendedAction(assessment.level);

	// Compact mode - just the badge
	if (compact) {
		return (
			<RiskBadge
				level={assessment.level}
				confidence={assessment.confidence}
				showLabel
			/>
		);
	}

	// Full mode
	return (
		<Box flexDirection="column">
			{/* Risk Level Header */}
			<Box flexDirection="row" alignItems="center">
				<Text bold color={config.color}>
					{config.symbol} {config.label} RISK
				</Text>

				{showDetails && (
					<>
						<Box marginLeft={1} />
						<Text color={crushTheme.text.secondary}>{config.bar}</Text>
					</>
				)}
			</Box>

			{/* Risk Description */}
			{showDetails && (
				<Box marginTop={1}>
					<Text color={crushTheme.text.secondary}>{config.description}</Text>
				</Box>
			)}

			{/* Risk Factors */}
			{showReasons && assessment.reasons.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold color={roleColors.systemLabel}>
						Factors:
					</Text>
					{assessment.reasons.map((reason, i) => (
						<Box key={i} flexDirection="row" marginLeft={2}>
							<Text color={crushTheme.accent.info}>•</Text>
							<Box marginLeft={1} />
							<Text color={crushTheme.text.secondary}>{reason}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Confidence Score */}
			{showDetails && (
				<Box marginTop={1} flexDirection="row" alignItems="center">
					<Text color={crushTheme.text.secondary}>Confidence:</Text>
					<Box marginLeft={1} />
					<Text color={config.color}>
						{confidenceBar(assessment.confidence)}
					</Text>
					<Box marginLeft={1} />
					<Text color={crushTheme.text.secondary}>
						{Math.round(assessment.confidence * 100)}%
					</Text>
				</Box>
			)}

			{/* Recommended Action */}
			{showDetails && (
				<Box marginTop={1}>
					<Text color={crushTheme.text.tertiary}>
						Recommended:{' '}
						<Text
							bold
							color={
								recommended === 'allow'
									? crushTheme.status.ready
									: crushTheme.accent.info
							}
						>
							{recommended === 'allow'
								? 'Auto-approve'
								: recommended === 'ask'
								? 'Ask user'
								: 'Deny'}
						</Text>
					</Text>
				</Box>
			)}
		</Box>
	);
}

// Alias for backward compatibility
export const RiskAssessment = RiskAssessmentDisplay;

/**
 * Risk Gauge Component (horizontal bar)
 */
export interface RiskGaugeProps {
	level: RiskLevel;
	width?: number;
	showScale?: boolean;
}

export function RiskGauge({
	level,
	width = 20,
	showScale = false,
}: RiskGaugeProps) {
	const config = RISK_CONFIG[level];

	// Calculate fill percentage based on level
	const fillPercent =
		level === RiskLevel.LOW ? 0.33 : level === RiskLevel.MEDIUM ? 0.66 : 1;
	const filledWidth = Math.round(width * fillPercent);

	// Create the gauge bar
	const filledBar = '━'.repeat(filledWidth);
	const emptyBar = '─'.repeat(width - filledWidth);

	return (
		<Box flexDirection="row" alignItems="center">
			<Text color={config.color}>{filledBar}</Text>
			<Text color={crushTheme.bg.elevated}>{emptyBar}</Text>

			{showScale && (
				<>
					<Box marginLeft={1} />
					<Text bold color={config.color}>
						{config.label}
					</Text>
				</>
			)}
		</Box>
	);
}

/**
 * Risk Summary Component (one-line summary)
 */
export interface RiskSummaryProps {
	toolName: string;
	arguments?: Record<string, unknown>;
}

export function RiskSummary({
	toolName,
	arguments: args = {},
}: RiskSummaryProps) {
	const assessment: RiskAssessmentResult = classifyRisk(toolName, args);
	const config = RISK_CONFIG[assessment.level];

	return (
		<Box flexDirection="row">
			<Text bold color={config.color}>
				{config.symbol}
			</Text>
			<Box marginLeft={1} />
			<Text color={crushTheme.text.primary}>{toolName}</Text>
			<Box marginLeft={1} />
			<Text color={crushTheme.text.secondary} dimColor>
				{config.label}
			</Text>
		</Box>
	);
}

/**
 * Multi-tool Risk Assessment Component
 */
export interface MultiToolRiskProps {
	tools: Array<{name: string; arguments?: Record<string, unknown>}>;
	visible?: boolean;
}

export function MultiToolRisk({tools, visible = true}: MultiToolRiskProps) {
	if (!visible || tools.length === 0) return null;

	// Assess all tools
	const assessments = tools.map(tool => ({
		...classifyRisk(tool.name, tool.arguments || {}),
		name: tool.name,
	}));

	// Calculate overall risk
	const hasHigh = assessments.some(a => a.level === RiskLevel.HIGH);
	const hasMedium = assessments.some(a => a.level === RiskLevel.MEDIUM);
	const overallLevel = hasHigh
		? RiskLevel.HIGH
		: hasMedium
		? RiskLevel.MEDIUM
		: RiskLevel.LOW;

	const overallConfig = RISK_CONFIG[overallLevel];

	return (
		<Box flexDirection="column">
			{/* Overall Risk */}
			<Box flexDirection="row" marginBottom={1}>
				<Text bold color={overallConfig.color}>
					{overallConfig.symbol} Overall Risk: {overallConfig.label}
				</Text>
				<Text color={crushTheme.text.secondary}>
					{' '}
					({assessments.length} tool{assessments.length !== 1 ? 's' : ''})
				</Text>
			</Box>

			{/* Individual tool risks */}
			{assessments.map((assessment, i) => {
				const config = RISK_CONFIG[assessment.level];

				return (
					<Box key={i} flexDirection="row" marginLeft={2}>
						<Text color={config.color}>{config.symbol}</Text>
						<Box marginLeft={1} />
						<Text color={crushTheme.text.primary}>{assessment.name}</Text>
					</Box>
				);
			})}
		</Box>
	);
}

export default RiskAssessmentDisplay;
