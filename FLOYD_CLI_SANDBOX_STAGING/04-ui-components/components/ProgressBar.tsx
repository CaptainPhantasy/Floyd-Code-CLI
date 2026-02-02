/**
 * Progress Bar Component
 *
 * ESM-compatible replacement for ink-progress-bar.
 * Simple progress bar display.
 */

import {Box, Text} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export interface ProgressBarProps {
	/** Progress value (0-100) */
	percent: number;

	/** Character to use for filled portion (default: '█') */
	character?: string;

	/** Character to use for empty portion (default: '░') */
	emptyCharacter?: string;

	/** Width of the progress bar (default: 20) */
	width?: number;

	/** Show percentage text (default: true) */
	showPercentage?: boolean;
}

/**
 * ProgressBar - Simple progress bar component
 */
export function ProgressBar({
	percent,
	character = '█',
	emptyCharacter = '░',
	width = 20,
	showPercentage = true,
}: ProgressBarProps) {
	const clampedPercent = Math.max(0, Math.min(100, percent));
	const filled = Math.round((clampedPercent / 100) * width);
	const empty = width - filled;

	const filledBar = character.repeat(filled);
	const emptyBar = emptyCharacter.repeat(empty);

	return (
		<Box flexDirection="row" gap={1}>
			<Text color={floydTheme.colors.primary}>
				{filledBar}
			</Text>
			<Text color={floydTheme.colors.fgSubtle}>
				{emptyBar}
			</Text>
			{showPercentage && (
				<Text color={floydTheme.colors.fgBase}>
					{clampedPercent.toFixed(0)}%
				</Text>
			)}
		</Box>
	);
}

export default ProgressBar;
