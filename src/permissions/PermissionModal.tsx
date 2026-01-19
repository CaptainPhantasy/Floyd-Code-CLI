/**
 * PermissionModal Component
 *
 * Full-screen permission modal for tool authorization requests.
 *
 * Features:
 * - Tool name and description
 * - Risk level indicator (low/medium/high) with visual styling
 * - Allow/Deny buttons with keyboard shortcuts
 * - Remember choice checkbox (once/session/always)
 * - Argument display with truncation for long values
 * - CRUSH theme styling
 */

import {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import {
	RiskLevel,
	RiskAssessment,
	classifyRisk,
	getRiskDescription,
} from './risk-classifier.js';
import {PermissionScope, PermissionDecision, getScopeText} from './policies.js';
import {crushTheme, roleColors} from '../theme/crush-theme.js';

// Re-export types for convenience
export type {RiskLevel, RiskAssessment};
export type {PermissionScope, PermissionDecision};

export interface PermissionRequest {
	id: string;
	toolName: string;
	description?: string;
	arguments: Record<string, unknown>;
	timestamp: number;
}

export interface PermissionResponse {
	id: string;
	decision: PermissionDecision;
	scope: PermissionScope;
	remember: boolean;
}

export interface PermissionModalProps {
	request: PermissionRequest;
	onResponse: (response: PermissionResponse) => void;
	visible: boolean;
	focus?: boolean;
}

// Risk level configuration
const RISK_CONFIG = {
	[RiskLevel.LOW]: {
		color: crushTheme.status.ready,
		label: 'LOW',
		symbol: '[SAFE]',
		borderColor: crushTheme.status.ready,
	},
	[RiskLevel.MEDIUM]: {
		color: crushTheme.status.warning,
		label: 'MEDIUM',
		symbol: '[CAUT]',
		borderColor: crushTheme.status.warning,
	},
	[RiskLevel.HIGH]: {
		color: crushTheme.status.error,
		label: 'HIGH',
		symbol: '[DANG]',
		borderColor: crushTheme.status.error,
	},
} as const;

// Modal dimensions
const MODAL_WIDTH = 70;
const MODAL_PADDING = 2;

// Utility: Truncate text to fit width
function truncate(text: string, maxWidth: number): string {
	if (text.length <= maxWidth) return text;
	return text.slice(0, maxWidth - 3) + '...';
}

// Utility: Format arguments for display
function formatArguments(
	args: Record<string, unknown>,
	maxWidth: number,
): string[] {
	const lines: string[] = [];
	const innerWidth = maxWidth - MODAL_PADDING * 2 - 4;

	for (const [key, value] of Object.entries(args)) {
		const valueStr =
			typeof value === 'string' ? value : JSON.stringify(value, null, 0);

		const truncated = truncate(valueStr, innerWidth - key.length - 5);
		lines.push(`  ${key}: ${truncated}`);
	}

	return lines;
}

/**
 * Full-screen Permission Modal Component
 */
export function PermissionModal({
	request,
	onResponse,
	visible,
	focus = true,
}: PermissionModalProps) {
	const [selectedScope, setSelectedScope] = useState<PermissionScope>('once');
	const [remember, setRemember] = useState(false);
	const [focusedButton, setFocusedButton] = useState<'allow' | 'deny'>('allow');

	// Get risk assessment
	const assessment: RiskAssessment = classifyRisk(
		request.toolName,
		request.arguments,
	);
	const riskConfig = RISK_CONFIG[assessment.level];

	// Reset state when request changes
	useEffect(() => {
		setSelectedScope('once');
		setRemember(false);
		setFocusedButton('allow');
	}, [request.id]);

	// Handle response submission
	const submitResponse = useCallback(
		(decision: PermissionDecision) => {
			onResponse({
				id: request.id,
				decision,
				scope: remember ? selectedScope : 'once',
				remember,
			});
		},
		[request.id, remember, selectedScope, onResponse],
	);

	// Handle keyboard input
	useInput((input, key) => {
		if (!visible || !focus) return;

		if (key.escape) {
			// ESC = deny once
			onResponse({
				id: request.id,
				decision: 'deny',
				scope: 'once',
				remember: false,
			});
			return;
		}

		if (key.return) {
			submitResponse(focusedButton);
			return;
		}

		if (key.leftArrow || key.upArrow) {
			setFocusedButton('allow');
		}

		if (key.rightArrow || key.downArrow) {
			setFocusedButton('deny');
		}

		// Scope selection with number keys
		if (input === '1') {
			setSelectedScope('once');
		}
		if (input === '2') {
			setSelectedScope('session');
		}
		if (input === '3') {
			setSelectedScope('always');
		}

		// Toggle remember checkbox
		if (input === 'r' || input === 'R') {
			setRemember(prev => !prev);
		}

		// Quick approve/deny
		if (input === 'y' || input === 'Y') {
			submitResponse('allow');
		}

		if (input === 'n' || input === 'N') {
			submitResponse('deny');
		}

		// Quick approve once
		if (input === 'a' || input === 'A') {
			onResponse({
				id: request.id,
				decision: 'allow',
				scope: 'once',
				remember: false,
			});
		}
	});

	if (!visible) return null;

	// Format arguments for display
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
			{/* Main Modal Frame */}
			<Box
				flexDirection="column"
				width={MODAL_WIDTH}
				borderStyle="double"
				borderColor={riskConfig.borderColor}
				paddingX={MODAL_PADDING}
				paddingY={1}
			>
				{/* Header with Risk Level */}
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={riskConfig.borderColor}
					paddingX={1}
					marginBottom={1}
				>
					<Box justifyContent="space-between" width="100%">
						<Text bold color={riskConfig.color}>
							{riskConfig.symbol} {riskConfig.label} RISK
						</Text>
						<Text color={crushTheme.text.secondary}>
							{new Date(request.timestamp).toLocaleTimeString()}
						</Text>
					</Box>
				</Box>

				{/* Tool Name */}
				<Box marginBottom={1}>
					<Text bold color={roleColors.systemLabel}>
						Tool Request:
					</Text>
					<Text color={crushTheme.text.primary}>
						{' '}
						{truncate(request.toolName, MODAL_WIDTH - MODAL_PADDING * 2 - 15)}
					</Text>
				</Box>

				{/* Tool Description (if provided) */}
				{request.description && (
					<Box marginBottom={1}>
						<Text color={crushTheme.text.secondary}>
							{truncate(request.description, MODAL_WIDTH - MODAL_PADDING * 2)}
						</Text>
					</Box>
				)}

				{/* Risk Description */}
				<Box marginBottom={1}>
					<Text color={crushTheme.text.tertiary}>
						{getRiskDescription(assessment.level)}
					</Text>
				</Box>

				{/* Arguments Section */}
				{argsLines.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Box marginBottom={1}>
							<Text bold color={roleColors.toolLabel}>
								Arguments:
							</Text>
						</Box>
						<Box
							flexDirection="column"
							borderStyle="single"
							borderColor={crushTheme.bg.elevated}
							paddingX={1}
							paddingY={1}
						>
							{argsLines.slice(0, 5).map((line, i) => (
								<Text key={i} color={crushTheme.text.primary}>
									{line}
								</Text>
							))}
							{argsLines.length > 5 && (
								<Text color={crushTheme.text.secondary}>
									... and {argsLines.length - 5} more
								</Text>
							)}
						</Box>
					</Box>
				)}

				{/* Risk Reasons (if any) */}
				{assessment.reasons.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Text bold color={crushTheme.accent.info}>
							Risk Factors:
						</Text>
						{assessment.reasons.slice(0, 2).map((reason, i) => (
							<Text key={i} color={crushTheme.text.secondary}>
								{' '}
								{truncate(reason, MODAL_WIDTH - MODAL_PADDING * 2 - 4)}
							</Text>
						))}
					</Box>
				)}

				{/* Remember Choice Section */}
				<Box flexDirection="column" marginBottom={1}>
					<Box marginBottom={1}>
						<Text
							bold
							color={
								remember ? crushTheme.accent.primary : crushTheme.text.secondary
							}
						>
							{remember ? '[X]' : '[ ]'} Remember this choice (R to toggle)
						</Text>
					</Box>

					{remember && (
						<Box marginLeft={2}>
							{(['once', 'session', 'always'] as PermissionScope[]).map(
								scope => (
									<Box key={scope} marginRight={3}>
										<Text
											bold={selectedScope === scope}
											color={
												selectedScope === scope
													? crushTheme.accent.primary
													: crushTheme.text.secondary
											}
										>
											{selectedScope === scope ? '[X]' : '[ ]'}{' '}
											{getScopeText(scope)}
											{scope === 'once' && ' (1)'}
											{scope === 'session' && ' (2)'}
											{scope === 'always' && ' (3)'}
										</Text>
									</Box>
								),
							)}
						</Box>
					)}
				</Box>

				{/* Action Buttons */}
				<Box justifyContent="space-between" marginTop={1}>
					{/* Approve Button */}
					<Box
						borderStyle={focusedButton === 'allow' ? 'double' : 'single'}
						borderColor={
							focusedButton === 'allow'
								? crushTheme.status.ready
								: crushTheme.bg.elevated
						}
						paddingX={2}
					>
						<Text
							bold={focusedButton === 'allow'}
							color={
								focusedButton === 'allow'
									? crushTheme.status.ready
									: crushTheme.text.primary
							}
						>
							Allow
						</Text>
					</Box>

					{/* Hint */}
					<Text color={roleColors.hint} dimColor>
						Y: Allow | N: Deny | R: Remember | Enter: Confirm
					</Text>

					{/* Deny Button */}
					<Box
						borderStyle={focusedButton === 'deny' ? 'double' : 'single'}
						borderColor={
							focusedButton === 'deny'
								? crushTheme.status.error
								: crushTheme.bg.elevated
						}
						paddingX={2}
					>
						<Text
							bold={focusedButton === 'deny'}
							color={
								focusedButton === 'deny'
									? crushTheme.status.error
									: crushTheme.text.primary
							}
						>
							Deny
						</Text>
					</Box>
				</Box>

				{/* Help Footer */}
				<Box marginTop={1} justifyContent="center">
					<Text color={roleColors.hint} dimColor>
						Arrows: Select | 1-3: Scope | Esc: Deny once | A: Allow once
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

export default PermissionModal;
