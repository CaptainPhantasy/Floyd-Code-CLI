/**
 * ContextPanel Component
 *
 * Right sidebar panel displaying contextual information:
 * - Current plan checklist
 * - Files touched list
 * - Open diffs summary
 * - Browser state
 * - Quick actions shortcuts
 *
 * Matches the mockup's CONTEXT panel design.
 */

import {Box, Text} from 'ink';
import {Frame} from '../crush/Frame.js';
import {floydTheme, crushTheme, statusColors} from '../../theme/crush-theme.js';

export interface PlanItem {
	label: string;
	done: boolean;
}

export interface DiffSummary {
	count: number;
	lines: number;
	files: number;
}

export interface BrowserState {
	domain: string;
	status: 'allowed' | 'blocked';
	ownedTabs?: number;
}

export interface QuickAction {
	shortcut: string;
	label: string;
}

export interface ContextPanelProps {
	/** Current plan checklist items */
	currentPlan?: PlanItem[];

	/** List of files that have been touched */
	filesTouched?: string[];

	/** Open diffs summary */
	openDiffs?: DiffSummary;

	/** Browser state information */
	browserState?: BrowserState;

	/** Quick action shortcuts */
	quickActions?: QuickAction[];

	/** Compact mode */
	compact?: boolean;
}

/**
 * ContextPanel - Right sidebar with contextual information
 */
export function ContextPanel({
	currentPlan = [],
	filesTouched = [],
	openDiffs,
	browserState,
	quickActions = [],
	compact = false,
}: ContextPanelProps) {
	return (
		<Frame
			title=" CONTEXT "
			borderStyle="round"
			borderVariant="focus"
			padding={1}
			width="100%"
			height="100%"
		>
			<Box flexDirection="column" gap={1} width="100%">
				{/* Current Plan */}
				{currentPlan.length > 0 && (
					<Box flexDirection="column" marginBottom={1} width="100%">
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.primary}>
								CURRENT PLAN
							</Text>
						</Box>
						{currentPlan.map((item, index) => (
							<Box key={index} flexDirection="row" gap={1} width="100%">
								<Text
									color={
										item.done ? statusColors.ready : floydTheme.colors.fgMuted
									}
								>
									{item.done ? '[x]' : '[ ]'}
								</Text>
								<Text
									color={
										item.done
											? floydTheme.colors.fgSubtle
											: floydTheme.colors.fgBase
									}
									dimColor={item.done}
									wrap="truncate"
								>
									{item.label}
								</Text>
							</Box>
						))}
					</Box>
				)}

				{/* Files Touched */}
				{filesTouched.length > 0 && (
					<Box flexDirection="column" marginBottom={1} width="100%">
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.secondary}>
								FILES TOUCHED
							</Text>
						</Box>
						{filesTouched.map((file, index) => (
							<Text
								key={index}
								color={floydTheme.colors.fgBase}
								dimColor={index >= 5} // Dim files beyond first 5
								wrap="truncate"
							>
								• {file}
							</Text>
						))}
					</Box>
				)}

				{/* Open Diffs */}
				{openDiffs && (
					<Box flexDirection="column" marginBottom={1} width="100%">
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.tertiary}>
								OPEN DIFFS
							</Text>
						</Box>
						<Text color={floydTheme.colors.fgBase}>
							{openDiffs.count} {openDiffs.count === 1 ? 'diff' : 'diffs'} (
							{openDiffs.lines} {openDiffs.lines === 1 ? 'line' : 'lines'} /{' '}
							{openDiffs.files} {openDiffs.files === 1 ? 'file' : 'files'})
						</Text>
					</Box>
				)}

				{/* Browser State */}
				{browserState && (
					<Box flexDirection="column" marginBottom={1} width="100%">
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.info}>
								BROWSER
							</Text>
						</Box>
						<Box flexDirection="row" gap={1} width="100%">
							<Text color={floydTheme.colors.fgBase} wrap="truncate">{browserState.domain}</Text>
							<Box
								borderStyle="single"
								borderColor={
									browserState.status === 'allowed'
										? statusColors.ready
										: statusColors.error
								}
								paddingX={1}
							>
								<Text
									color={
										browserState.status === 'allowed'
											? statusColors.ready
											: statusColors.error
									}
								>
									{browserState.status === 'allowed' ? '[✓]' : '[x]'}
								</Text>
							</Box>
							{browserState.ownedTabs !== undefined && (
								<Text color={floydTheme.colors.fgSubtle} dimColor>
									owned: {browserState.ownedTabs}
								</Text>
							)}
						</Box>
					</Box>
				)}

				{/* Quick Actions */}
				{quickActions.length > 0 && (
					<Box flexDirection="column" marginTop={1} width="100%">
						<Box marginBottom={0}>
							<Text bold color={crushTheme.accent.highlight}>
								QUICK ACTS
							</Text>
						</Box>
						{quickActions.map((action, index) => (
							<Box key={index} flexDirection="row" gap={1} width="100%">
								<Text color={crushTheme.accent.primary}>{action.shortcut}</Text>
								<Text color={floydTheme.colors.fgBase} wrap="truncate">{action.label}</Text>
							</Box>
						))}
					</Box>
				)}
			</Box>
		</Frame>
	);
}

export default ContextPanel;
