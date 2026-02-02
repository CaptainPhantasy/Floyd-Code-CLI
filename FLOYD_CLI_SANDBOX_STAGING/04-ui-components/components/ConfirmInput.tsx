/**
 * Confirm Input Component
 *
 * ESM-compatible replacement for ink-confirm-input.
 * Provides a yes/no confirmation prompt.
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {floydTheme, roleColors} from '../../theme/crush-theme.js';

export interface ConfirmInputProps {
	/** Confirmation message */
	message: string;

	/** Callback when confirmed (true) or cancelled (false) */
	onConfirm: (confirmed: boolean) => void;

	/** Callback when cancelled (optional, for compatibility) */
	onCancel?: () => void;

	/** Default value (default: false) */
	defaultValue?: boolean;
}

/**
 * ConfirmInput - Yes/No confirmation component
 */
export function ConfirmInput({
	message,
	onConfirm,
	onCancel,
	defaultValue = false,
}: ConfirmInputProps) {
	const [selected, setSelected] = useState<'yes' | 'no'>(
		defaultValue ? 'yes' : 'no',
	);

	useInput((input, key) => {
		// Ctrl+Q - Quit the entire CLI immediately
		if (key.ctrl && (input === 'q' || input === 'Q')) {
			process.exit(0);
		}

		if (key.return) {
			onConfirm(selected === 'yes');
			return;
		}

		if (key.leftArrow || key.rightArrow || input === 'y' || input === 'n') {
			setSelected(prev => (prev === 'yes' ? 'no' : 'yes'));
			return;
		}

		if (key.escape) {
			onConfirm(false);
			onCancel?.();
			return;
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			<Text color={roleColors.inputPrompt}>{message}</Text>
			<Box flexDirection="row" gap={2}>
				<Text
					color={
						selected === 'yes'
							? floydTheme.colors.fgBase
							: floydTheme.colors.fgSubtle
					}
				backgroundColor={
					selected === 'yes' ? floydTheme.colors.bgSubtle : undefined
				}
				>
					{selected === 'yes' ? '▶' : ' '} Yes (Y)
				</Text>
				<Text
					color={
						selected === 'no'
							? floydTheme.colors.fgBase
							: floydTheme.colors.fgSubtle
					}
				backgroundColor={
					selected === 'no' ? floydTheme.colors.bgSubtle : undefined
				}
				>
					{selected === 'no' ? '▶' : ' '} No (N)
				</Text>
			</Box>
			<Text color={roleColors.hint} dimColor>
				[Enter] Confirm • [Esc] Cancel • [←→] or [Y/N] Toggle
			</Text>
		</Box>
	);
}

export default ConfirmInput;
