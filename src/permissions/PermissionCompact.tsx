/**
 * PermissionCompact Component
 *
 * Compact inline permission prompt for quick authorization.
 *
 * Features:
 * - Single-line display for minimal space usage
 * - Quick Y/N keyboard shortcuts
 * - Risk level indicator with color
 * - Tool name and brief description
 * - CRUSH theme styling
 */

import {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import {RiskLevel, RiskAssessment, classifyRisk} from './risk-classifier.js';
import {PermissionScope, PermissionDecision} from './policies.js';
import {crushTheme, roleColors} from '../theme/crush-theme.js';

// Re-export types for convenience
export type {RiskLevel, RiskAssessment};
export type {PermissionScope, PermissionDecision};

export interface CompactPermissionRequest {
	id: string;
	toolName: string;
	arguments?: Record<string, unknown>;
	timestamp?: number;
}

export interface CompactPermissionResponse {
	id: string;
	decision: PermissionDecision;
	scope: PermissionScope;
}

export interface PermissionCompactProps {
	request: CompactPermissionRequest;
	onResponse: (response: CompactPermissionResponse) => void;
	visible: boolean;
	focus?: boolean;
	maxWidth?: number;
}

// Risk level indicators
const RISK_INDICATORS = {
	[RiskLevel.LOW]: {
		color: crushTheme.status.ready,
		symbol: '[SAFE]',
	},
	[RiskLevel.MEDIUM]: {
		color: crushTheme.status.warning,
		symbol: '[CAUT]',
	},
	[RiskLevel.HIGH]: {
		color: crushTheme.status.error,
		symbol: '[DANG]',
	},
} as const;

// Truncate utility
function truncate(text: string, maxWidth: number): string {
	if (text.length <= maxWidth) return text;
	return text.slice(0, maxWidth - 3) + '...';
}

/**
 * Compact Inline Permission Prompt
 */
export function PermissionCompact({
	request,
	onResponse,
	visible,
	focus = true,
	maxWidth = 60,
}: PermissionCompactProps) {
	const [selectedScope, setSelectedScope] = useState<PermissionScope>('once');

	// Get risk assessment
	const assessment: RiskAssessment = classifyRisk(
		request.toolName,
		request.arguments || {},
	);
	const riskIndicator = RISK_INDICATORS[assessment.level];

	// Reset state when request changes
	useEffect(() => {
		setSelectedScope('once');
	}, [request.id]);

	// Handle response submission
	const submitResponse = useCallback(
		(decision: PermissionDecision) => {
			onResponse({
				id: request.id,
				decision,
				scope: selectedScope,
			});
		},
		[request.id, selectedScope, onResponse],
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
			});
			return;
		}

		if (key.return) {
			// Enter = allow
			submitResponse('allow');
			return;
		}

		// Quick responses
		if (input === 'y' || input === 'Y') {
			submitResponse('allow');
		}

		if (input === 'n' || input === 'N') {
			submitResponse('deny');
		}

		// Scope selection
		if (input === '1') {
			setSelectedScope('once');
		}
		if (input === '2') {
			setSelectedScope('session');
		}
		if (input === '3') {
			setSelectedScope('always');
		}
	});

	if (!visible) return null;

	// Calculate widths for layout
	const promptWidth = maxWidth - 20; // Reserve space for [Y]es [N]o
	const toolName = truncate(request.toolName, Math.max(20, promptWidth));

	return (
		<Box
			flexDirection="row"
			alignItems="center"
			paddingX={1}
			borderStyle="round"
			borderColor={riskIndicator.color}
		>
			{/* Risk Indicator */}
			<Text bold color={riskIndicator.color}>
				{riskIndicator.symbol}
			</Text>

			{/* Spacer */}
			<Box width={1} />

			{/* Tool Name */}
			<Text color={crushTheme.text.primary}>{toolName}</Text>

			{/* Spacer */}
			<Box flexGrow={1} />

			{/* Scope Indicator */}
			{selectedScope !== 'once' && (
				<>
					<Text color={crushTheme.text.secondary} dimColor>
						({selectedScope})
					</Text>
					<Box width={1} />
				</>
			)}

			{/* Action Hints */}
			<Text color={roleColors.hint} dimColor>
				[
			</Text>
			<Text bold color={crushTheme.status.ready}>
				Y
			</Text>
			<Text color={roleColors.hint} dimColor>
				]es [
			</Text>
			<Text bold color={crushTheme.status.error}>
				N
			</Text>
			<Text color={roleColors.hint} dimColor>
				]o 1-3
			</Text>
		</Box>
	);
}

/**
 * Even more compact version - single character indicator
 */
export interface PermissionMinimalProps {
	request: CompactPermissionRequest;
	onResponse: (response: CompactPermissionResponse) => void;
	visible: boolean;
	focus?: boolean;
}

export function PermissionMinimal({
	request,
	onResponse,
	visible,
	focus = true,
}: PermissionMinimalProps) {
	const [selectedScope, setSelectedScope] = useState<PermissionScope>('once');

	const assessment: RiskAssessment = classifyRisk(
		request.toolName,
		request.arguments || {},
	);
	const riskIndicator = RISK_INDICATORS[assessment.level];

	useEffect(() => {
		setSelectedScope('once');
	}, [request.id]);

	const submitResponse = useCallback(
		(decision: PermissionDecision) => {
			onResponse({
				id: request.id,
				decision,
				scope: selectedScope,
			});
		},
		[request.id, selectedScope, onResponse],
	);

	useInput((input, key) => {
		if (!visible || !focus) return;

		if (key.escape || input === 'n' || input === 'N') {
			onResponse({id: request.id, decision: 'deny', scope: 'once'});
		}

		if (key.return || input === 'y' || input === 'Y') {
			submitResponse('allow');
		}

		if (input === '1') setSelectedScope('once');
		if (input === '2') setSelectedScope('session');
		if (input === '3') setSelectedScope('always');
	});

	if (!visible) return null;

	return (
		<Box flexDirection="row" alignItems="center">
			<Text bold color={riskIndicator.color}>
				{riskIndicator.symbol}
			</Text>
			<Box width={1} />
			<Text color={crushTheme.text.primary}>
				{truncate(request.toolName, 30)}
			</Text>
			<Box marginLeft={1} />
			<Text color={roleColors.hint} dimColor>
				[
			</Text>
			<Text bold color={crushTheme.status.ready}>
				Y
			</Text>
			<Text color={roleColors.hint} dimColor>
				/
			</Text>
			<Text bold color={crushTheme.status.error}>
				N
			</Text>
			<Text color={roleColors.hint} dimColor>
				]
			</Text>
		</Box>
	);
}

/**
 * Horizontal bar-style permission prompt
 */
export interface PermissionBarProps {
	request: CompactPermissionRequest;
	onResponse: (response: CompactPermissionResponse) => void;
	visible: boolean;
	focus?: boolean;
	width?: number;
}

export function PermissionBar({
	request,
	onResponse,
	visible,
	focus = true,
	width = 80,
}: PermissionBarProps) {
	const [selectedScope, setSelectedScope] = useState<PermissionScope>('once');

	const assessment: RiskAssessment = classifyRisk(
		request.toolName,
		request.arguments || {},
	);
	const riskIndicator = RISK_INDICATORS[assessment.level];

	useEffect(() => {
		setSelectedScope('once');
	}, [request.id]);

	const submitResponse = useCallback(
		(decision: PermissionDecision) => {
			onResponse({
				id: request.id,
				decision,
				scope: selectedScope,
			});
		},
		[request.id, selectedScope, onResponse],
	);

	useInput((input, key) => {
		if (!visible || !focus) return;

		if (key.escape || input === 'n' || input === 'N') {
			onResponse({id: request.id, decision: 'deny', scope: 'once'});
		}

		if (key.return || input === 'y' || input === 'Y') {
			submitResponse('allow');
		}

		if (input === '1') setSelectedScope('once');
		if (input === '2') setSelectedScope('session');
		if (input === '3') setSelectedScope('always');
	});

	if (!visible) return null;

	// Create a horizontal bar with the request
	const padding = '─'.repeat(Math.max(0, Math.floor((width - 40) / 2)));

	return (
		<Box flexDirection="row">
			<Text color={riskIndicator.color}>{padding}</Text>
			<Text bold color={riskIndicator.color}>
				{riskIndicator.symbol}
			</Text>
			<Text color={crushTheme.text.primary}>
				{' '}
				{truncate(request.toolName, 20)}{' '}
			</Text>
			<Text color={roleColors.hint} dimColor>
				[Y]es [N]o
			</Text>
			<Text color={riskIndicator.color}>
				{'─'.repeat(Math.max(0, width - padding.length - 40))}
			</Text>
		</Box>
	);
}

export default PermissionCompact;
