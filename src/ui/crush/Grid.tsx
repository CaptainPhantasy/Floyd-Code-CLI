/**
 * Grid Component
 *
 * Flexible grid layout system for component arrangement.
 * Provides responsive grid layouts for complex UI structures.
 *
 * Features:
 * - Flexible column/row definitions
 * - Responsive sizing
 * - Gap control
 * - Alignment options
 */

import {type ReactNode} from 'react';
import {Box} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export type GridSize = number | string | 'auto' | '1fr';

export interface GridProps {
	/** Grid items */
	children: ReactNode;

	/** Number of columns */
	columns?: number;

	/** Column sizes (fractions or percentages) */
	columnSizes?: GridSize[];

	/** Row sizes (fractions or percentages) */
	rowSizes?: GridSize[];

	/** Gap between items */
	gap?: number;

	/** Horizontal alignment */
	alignItems?: 'flex-start' | 'center' | 'flex-end';

	/** Vertical alignment */
	justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';

	/** Full width */
	width?: number | '100%';

	/** Full height */
	height?: number | '100%' | 'auto';
}

/**
 * Grid - Flexible grid layout
 */
export function Grid({
	children,
	columns = 1,
	columnSizes,
	rowSizes,
	gap = 1,
	alignItems = 'flex-start',
	justifyContent = 'flex-start',
	width = '100%',
	height = 'auto',
}: GridProps) {
	const childrenArray = Array.isArray(children) ? children : [children];

	// Calculate column basis
	const getColumnBasis = (index: number): string => {
		if (columnSizes && columnSizes[index]) {
			const size = columnSizes[index];
			if (typeof size === 'number') {
				return `${size}fr`;
			}
			return String(size);
		}
		return '1fr';
	};

	// Organize children into rows
	const rows: ReactNode[][] = [];
	for (let i = 0; i < childrenArray.length; i += columns) {
		rows.push(childrenArray.slice(i, i + columns));
	}

	return (
		<Box
			flexDirection="column"
			width={width}
			height={height}
			gap={gap}
			justifyContent={justifyContent}
		>
			{rows.map((row, rowIndex) => (
				<Box
					key={rowIndex}
					flexDirection="row"
					gap={gap}
					alignItems={alignItems}
					width="100%"
				>
					{row.map((child, colIndex) => (
						<Box
							key={colIndex}
							flexBasis={getColumnBasis(colIndex)}
							flexGrow={1}
							flexShrink={1}
						>
							{child}
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
}

/**
 * GridItem - Individual grid item wrapper
 */
export interface GridItemProps {
	/** Item content */
	children: ReactNode;

	/** Column span */
	colSpan?: number;

	/** Row span */
	rowSpan?: number;

	/** Custom alignment */
	alignSelf?: 'flex-start' | 'center' | 'flex-end';
}

export function GridItem({
	children,
	colSpan = 1,
	rowSpan = 1,
	alignSelf,
}: GridItemProps) {
	return (
		<Box
			flexGrow={colSpan}
			flexShrink={1}
			alignSelf={alignSelf}
			height={rowSpan > 1 ? `${rowSpan * 100}%` : 'auto'}
		>
			{children}
		</Box>
	);
}

export default Grid;
