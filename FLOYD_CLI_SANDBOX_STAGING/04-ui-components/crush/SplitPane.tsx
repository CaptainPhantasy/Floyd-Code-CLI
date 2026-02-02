/**
 * SplitPane Component
 *
 * Resizable split pane layout for side-by-side or top-bottom content.
 * Provides the foundation for multi-pane layouts like the mockup.
 *
 * Features:
 * - Horizontal and vertical splits
 * - Resizable panes (via props)
 * - Percentage-based sizing
 * - Focus cycling
 */

import {type ReactNode} from 'react';
import {Box} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export interface SplitPaneProps {
	/** Left/top pane content */
	primary: ReactNode;

	/** Right/bottom pane content */
	secondary: ReactNode;

	/** Split direction */
	direction?: 'horizontal' | 'vertical';

	/** Primary pane size (percentage or pixels) */
	primarySize?: number | string;

	/** Secondary pane size (percentage or pixels) */
	secondarySize?: number | string;

	/** Show divider */
	showDivider?: boolean;

	/** Divider character */
	divider?: string;
}

/**
 * SplitPane - Resizable split layout
 */
export function SplitPane({
	primary,
	secondary,
	direction = 'horizontal',
	primarySize = '50%',
	secondarySize = '50%',
	showDivider = true,
	divider = '│',
}: SplitPaneProps) {
	const isHorizontal = direction === 'horizontal';

	const primarySizeValue =
		typeof primarySize === 'number' ? `${primarySize}%` : primarySize;
	const secondarySizeValue =
		typeof secondarySize === 'number' ? `${secondarySize}%` : secondarySize;

	if (isHorizontal) {
		return (
			<Box flexDirection="row" width="100%" height="100%">
				<Box flexBasis={primarySizeValue} flexGrow={0} flexShrink={0}>
					{primary}
				</Box>
				{showDivider && (
					<Box
						flexDirection="column"
						borderStyle="single"
						borderColor={floydTheme.colors.border}
						width={1}
					>
						<Box>{divider}</Box>
					</Box>
				)}
				<Box flexBasis={secondarySizeValue} flexGrow={1} flexShrink={1}>
					{secondary}
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%" height="100%">
			<Box flexBasis={primarySizeValue} flexGrow={0} flexShrink={0}>
				{primary}
			</Box>
			{showDivider && (
				<Box
					flexDirection="row"
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					height={1}
				>
					<Box>{divider}</Box>
				</Box>
			)}
			<Box flexBasis={secondarySizeValue} flexGrow={1} flexShrink={1}>
				{secondary}
			</Box>
		</Box>
	);
}

/**
 * ThreePaneSplit - Three-way split (for SESSION | TRANSCRIPT | CONTEXT layout)
 */
export interface ThreePaneSplitProps {
	left: ReactNode;
	middle: ReactNode;
	right: ReactNode;
	leftSize?: number | string;
	middleSize?: number | string;
	rightSize?: number | string;
	showDividers?: boolean;
}

export function ThreePaneSplit({
	left,
	middle,
	right,
	leftSize = '25%',
	middleSize = '50%',
	rightSize = '25%',
	showDividers = true,
}: ThreePaneSplitProps) {
	const leftSizeValue =
		typeof leftSize === 'number' ? `${leftSize}%` : leftSize;
	const middleSizeValue =
		typeof middleSize === 'number' ? `${middleSize}%` : middleSize;
	const rightSizeValue =
		typeof rightSize === 'number' ? `${rightSize}%` : rightSize;

	return (
		<Box flexDirection="row" width="100%" height="100%">
			<Box flexBasis={leftSizeValue} flexGrow={0} flexShrink={0}>
				{left}
			</Box>
			{showDividers && (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					width={1}
				>
					<Box>│</Box>
				</Box>
			)}
			<Box flexBasis={middleSizeValue} flexGrow={1} flexShrink={1}>
				{middle}
			</Box>
			{showDividers && (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={floydTheme.colors.border}
					width={1}
				>
					<Box>│</Box>
				</Box>
			)}
			<Box flexBasis={rightSizeValue} flexGrow={0} flexShrink={0}>
				{right}
			</Box>
		</Box>
	);
}

export default SplitPane;
