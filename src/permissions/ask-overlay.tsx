/**
 * Permission ASK Overlay Component
 *
 * Floating modal overlay for permission requests.
 * Shows tool name, arguments, risk assessment, and action buttons.
 *
 * CRUSH Theme:
 * - Frame with border and rounded corners
 * - Gradient header for risk level
 * - Action buttons with keyboard shortcuts
 * - Floating above existing content
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {
	RiskLevel,
	RiskAssessment,
	classifyRisk,
	getRiskDescription,
} from './risk-classifier.js';
import {
	PermissionScope,
	PermissionDecision,
	getScopeText,
	getRecommendedScope,
} from './policies.js';
import {floydTheme, floydRoles} from '../theme/crush-theme.js';

export interface PermissionRequest {
	id: string;
	toolName: string;
	arguments: Record<string, unknown>;
	timestamp: number;
}

export interface PermissionResponse {
	id: string;
	decision: PermissionDecision;
	scope: PermissionScope;
}

export interface AskOverlayProps {
	request: PermissionRequest;
	onResponse: (response: PermissionResponse) => void;
	visible: boolean;
}

// Risk level colors and styles
const RISK_STYLES: Record<
	RiskLevel,
	{color: string; label: string; bg: string; symbol: string}
> = {
	[RiskLevel.LOW]: {
		color: floydTheme.colors.success,
		label: 'LOW RISK',
		bg: floydTheme.colors.bgSubtle,
		symbol: '[SAFE]',
	},
	[RiskLevel.MEDIUM]: {
		color: floydTheme.colors.warning,
		label: 'MEDIUM RISK',
		bg: floydTheme.colors.bgSubtle,
		symbol: '[CAUT]',
	},
	[RiskLevel.HIGH]: {
		color: floydTheme.colors.error,
		label: 'HIGH RISK',
		bg: floydTheme.colors.bgSubtle,
		symbol: '[DANG]',
	},
};

// Modal dimensions
const MODAL_WIDTH = 80;
const MODAL_PADDING = 2;

/**
 * Truncate text to fit within width
 */
function truncate(text: string, maxWidth: number): string {
	if (text.length <= maxWidth) return text;
	return text.slice(0, maxWidth - 3) + '...';
}

/**
 * Format arguments for display
 */
function formatArguments(
	args: Record<string, unknown>,
	maxWidth: number,
): string[] {
	const lines: string[] = [];
	const innerWidth = maxWidth - MODAL_PADDING * 2 - 4; // Account for padding and border

	for (const [key, value] of Object.entries(args)) {
		const valueStr =
			typeof value === 'string' ? value : JSON.stringify(value, null, 0);

		// Truncate long values
		const truncated = truncate(valueStr, innerWidth - key.length - 5);

		if (truncated.length < valueStr.length) {
			lines.push(`  ${key}: ${truncated}`);
		} else {
			lines.push(`  ${key}: ${truncated}`);
		}
	}

	return lines;
}

/**
 * Permission ASK Overlay Modal Component
 */
export function AskOverlay({request, onResponse, visible}: AskOverlayProps) {
	const [selectedScope, setSelectedScope] = useState<PermissionScope>(() => {
		// Start with recommended scope based on risk
		const assessment = classifyRisk(request.toolName, request.arguments);
		return getRecommendedScope(assessment.level);
	});

	const [selectedDecision, setSelectedDecision] =
		useState<PermissionDecision>('allow');
	const [focusedButton, setFocusedButton] = useState<'approve' | 'deny'>(
		'approve',
	);

	// Get risk assessment
	const assessment: RiskAssessment = classifyRisk(
		request.toolName,
		request.arguments,
	);
	const riskStyle = RISK_STYLES[assessment.level];

	// Reset state when request changes
	useEffect(() => {
		setSelectedScope(getRecommendedScope(assessment.level));
		setSelectedDecision('allow');
		setFocusedButton('approve');
	}, [request.id, assessment.level]);

	// Handle keyboard input
	useInput((input, key) => {
		if (!visible) return;

		if (key.escape) {
			// ESC = deny once (quick deny)
			onResponse({
				id: request.id,
				decision: 'deny',
				scope: 'once',
			});
			return;
		}

		if (key.return) {
			// Enter = submit selected decision
			onResponse({
				id: request.id,
				decision: selectedDecision,
				scope: selectedScope,
			});
			return;
		}

		if (key.leftArrow) {
			setFocusedButton('approve');
			setSelectedDecision('allow');
		}

		if (key.rightArrow) {
			setFocusedButton('deny');
			setSelectedDecision('deny');
		}

		if (input === '1') {
			setSelectedScope('once');
		}
		if (input === '2') {
			setSelectedScope('session');
		}
		if (input === '3') {
			setSelectedScope('always');
		}

		if (input === 'y' || input === 'Y') {
			onResponse({
				id: request.id,
				decision: 'allow',
				scope: selectedScope,
			});
		}

		if (input === 'n' || input === 'N') {
			onResponse({
				id: request.id,
				decision: 'deny',
				scope: selectedScope,
			});
		}

		if (input === 'a' || input === 'A') {
			onResponse({
				id: request.id,
				decision: 'allow',
				scope: 'once',
			});
		}
	});

	if (!visible) return null;

	// Calculate dimensions
	const argsLines = formatArguments(request.arguments, MODAL_WIDTH);

	return (
		<Box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			width="100%"
			height="100%"
			paddingX={1}
		>
			{/* Modal Frame */}
			<Box
				flexDirection="column"
				width={MODAL_WIDTH}
				borderStyle="double"
				borderColor={riskStyle.color}
				paddingX={MODAL_PADDING}
			>
				{/* Header with Risk Level */}
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={riskStyle.color}
					paddingX={1}
					marginBottom={1}
				>
					<Box justifyContent="space-between" width="100%">
						<Text bold color={riskStyle.color}>
							{riskStyle.symbol} {riskStyle.label}
						</Text>
						<Text color={floydTheme.colors.fgMuted}>
							{new Date(request.timestamp).toLocaleTimeString()}
						</Text>
					</Box>
				</Box>

				{/* Tool Name */}
				<Box marginBottom={1}>
					<Text bold color={floydRoles.headerTitle}>
						Tool Request:
					</Text>
					<Text color={floydTheme.colors.fgBase}>
						{' '}
						{truncate(request.toolName, MODAL_WIDTH - MODAL_PADDING * 2 - 15)}
					</Text>
				</Box>

				{/* Risk Description */}
				<Box marginBottom={1}>
					<Text color={floydTheme.colors.fgMuted}>
						{getRiskDescription(assessment.level)}
					</Text>
				</Box>

				{/* Arguments Section */}
				{argsLines.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Box marginBottom={1}>
							<Text bold color={floydRoles.systemLabel}>
								Arguments:
							</Text>
						</Box>
						<Box
							flexDirection="column"
							borderStyle="single"
							borderColor={floydTheme.colors.border}
							paddingX={1}
						>
							{argsLines.slice(0, 5).map((line, i) => (
								<Text key={i} color={floydTheme.colors.fgBase}>
									{line}
								</Text>
							))}
							{argsLines.length > 5 && (
								<Text color={floydTheme.colors.fgMuted}>
									... and {argsLines.length - 5} more
								</Text>
							)}
						</Box>
					</Box>
				)}

				{/* Risk Reasons */}
				{assessment.reasons.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Text bold color={floydTheme.colors.info}>
							Why this risk level?
						</Text>
						{assessment.reasons.slice(0, 2).map((reason, i) => (
							<Text key={i} color={floydTheme.colors.fgMuted}>
								{' '}
								{truncate(reason, MODAL_WIDTH - MODAL_PADDING * 2 - 4)}
							</Text>
						))}
					</Box>
				)}

				{/* Scope Selection */}
				<Box flexDirection="column" marginBottom={1}>
					<Text bold color={floydRoles.headerStatus}>
						Remember this choice:
					</Text>
					<Box marginTop={1}>
						{(['once', 'session', 'always'] as PermissionScope[]).map(scope => (
							<Box key={scope} marginRight={2}>
								<Text
									bold={selectedScope === scope}
									color={
										selectedScope === scope
											? floydTheme.colors.borderFocus
											: floydTheme.colors.fgMuted
									}
								>
									{selectedScope === scope ? '[X]' : '[ ]'}{' '}
									{getScopeText(scope)}
									{scope === 'once' && ' (1)'}
									{scope === 'session' && ' (2)'}
									{scope === 'always' && ' (3)'}
								</Text>
							</Box>
						))}
					</Box>
				</Box>

				{/* Action Buttons */}
				<Box justifyContent="space-between" marginTop={1}>
					{/* Approve Button */}
					<Box
						borderStyle={focusedButton === 'approve' ? 'double' : 'single'}
						borderColor={
							focusedButton === 'approve'
								? floydTheme.colors.success
								: floydTheme.colors.border
						}
						paddingX={2}
					>
						<Text
							bold={focusedButton === 'approve' || selectedDecision === 'allow'}
							color={
								selectedDecision === 'allow'
									? floydTheme.colors.success
									: floydTheme.colors.fgMuted
							}
						>
							{selectedDecision === 'allow' ? '[X]' : '[ ]'} Approve
							{selectedDecision === 'allow' &&
								` (${getScopeText(selectedScope)})`}
						</Text>
					</Box>

					{/* Hint */}
					<Text color={floydRoles.hint} dimColor>
						Y/N | 1-3 | Enter | Esc
					</Text>

					{/* Deny Button */}
					<Box
						borderStyle={focusedButton === 'deny' ? 'double' : 'single'}
						borderColor={
							focusedButton === 'deny'
								? floydTheme.colors.error
								: floydTheme.colors.border
						}
						paddingX={2}
					>
						<Text
							bold={focusedButton === 'deny' || selectedDecision === 'deny'}
							color={
								selectedDecision === 'deny'
									? floydTheme.colors.error
									: floydTheme.colors.fgMuted
							}
						>
							{selectedDecision === 'deny' ? '[X]' : '[ ]'} Deny
							{selectedDecision === 'deny' &&
								` (${getScopeText(selectedScope)})`}
						</Text>
					</Box>
				</Box>

				{/* Help Footer */}
				<Box marginTop={1} justifyContent="center">
					<Text color={floydRoles.hint} dimColor>
						Arrows: Select decision | Y: Approve | N: Deny | 1-3: Scope | Enter:
						Confirm | Esc: Deny once
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

export default AskOverlay;
