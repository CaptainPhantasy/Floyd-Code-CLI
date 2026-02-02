/**
 * ToolGrid Component
 *
 * Grid layout for displaying tool cards and other components.
 * Supports auto-sizing, flexible columns, and responsive layouts.
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

export type GridItemStatus =
	| 'default'
	| 'active'
	| 'success'
	| 'error'
	| 'warning';

export interface GridItem {
	id: string;
	content: ReactNode;
	label?: string;
	status?: GridItemStatus;
}

export interface ToolGridProps {
	/** Items to display in the grid */
	items?: GridItem[];

	/** Children to render as grid items (alternative to items prop) */
	children?: ReactNode;

	/** Number of columns */
	columns?: number | 'auto';

	/** Grid width */
	width?: number;

	/** Gap between items */
	gap?: number;

	/** Show borders around items */
	showBorders?: boolean;

	/** Compact mode */
	compact?: boolean;

	/** Equal height for all items */
	equalHeight?: boolean;

	/** Max rows before scrolling */
	maxRows?: number;

	/** Empty state message */
	emptyMessage?: string;
}

/**
 * Get color for status
 */
function getStatusColor(status?: GridItemStatus): string {
	switch (status) {
		case 'active':
			return floydRoles.thinking;
		case 'success':
			return floydTheme.colors.success;
		case 'error':
			return floydTheme.colors.error;
		case 'warning':
			return floydTheme.colors.warning;
		default:
			return floydTheme.colors.fgMuted;
	}
}

/**
 * Get status indicator character
 */
function getStatusIndicator(status?: GridItemStatus): string {
	switch (status) {
		case 'active':
			return '●';
		case 'success':
			return '✓';
		case 'error':
			return '✕';
		case 'warning':
			return '⚠';
		default:
			return '○';
	}
}

/**
 * Calculate columns based on width and content
 */
function calculateColumns(
	columns: number | 'auto',
	itemCount: number,
	gridWidth?: number,
): number {
	if (columns === 'auto') {
		// Auto-calculate based on width and item count
		const idealWidth = 30; // Ideal item width
		const maxColumns = gridWidth ? Math.floor(gridWidth / idealWidth) : 3;
		return Math.min(maxColumns, Math.max(1, itemCount));
	}
	return columns;
}

/**
 * Calculate item width based on grid width and columns
 */
function calculateItemWidth(
	gridWidth: number,
	columns: number,
	gap: number,
): number {
	const totalGap = gap * (columns - 1);
	return Math.floor((gridWidth - totalGap) / columns);
}

/**
 * Render a single grid item
 */
function renderGridItem(
	item: GridItem,
	itemWidth: number,
	showBorders: boolean,
): ReactNode {
	const statusColor = item.status ? getStatusColor(item.status) : undefined;
	const statusIndicator = item.status
		? getStatusIndicator(item.status)
		: undefined;

	return (
		<Box
			key={item.id}
			width={itemWidth}
			flexDirection="column"
			borderStyle={showBorders ? 'single' : undefined}
			borderColor={statusColor ?? floydTheme.colors.border}
			paddingX={showBorders ? 1 : 0}
			paddingY={showBorders ? 0 : 0}
		>
			{/* Label row */}
			{item.label && (
				<Box marginBottom={0} justifyContent="space-between" width="100%">
					<Text bold color={floydTheme.colors.fgSelected}>
						{item.label}
					</Text>
					{statusIndicator && (
						<Text color={statusColor}>{statusIndicator}</Text>
					)}
				</Box>
			)}

			{/* Content */}
			{item.content}
		</Box>
	);
}

/**
 * ToolGrid component
 */
export function ToolGrid({
	items = [],
	children,
	columns = 'auto',
	width = 80,
	gap = 1,
	showBorders = true,
	maxRows,
	emptyMessage = 'No items to display',
}: ToolGridProps) {
	// Determine columns
	const gridColumns = calculateColumns(columns, items.length, width);
	const itemWidth = calculateItemWidth(width, gridColumns, gap);

	// Split items into rows
	const rows: GridItem[][] = [];
	for (let i = 0; i < items.length; i += gridColumns) {
		rows.push(items.slice(i, i + gridColumns));
	}

	// Apply max rows limit
	const displayRows = maxRows ? rows.slice(0, maxRows) : rows;
	const hiddenCount =
		maxRows && rows.length > maxRows ? rows.slice(maxRows).flat().length : 0;

	return (
		<Box flexDirection="column" width={width}>
			{items.length === 0 ? (
				<Box justifyContent="center" paddingY={2}>
					<Text dimColor color={floydTheme.colors.fgMuted}>
						{emptyMessage}
					</Text>
				</Box>
			) : (
				<>
					{/* Grid rows */}
					{displayRows.map((row, rowIndex) => (
						<Box
							key={rowIndex}
							marginBottom={rowIndex < displayRows.length - 1 ? gap : 0}
						>
							{row.map((item, colIndex) => (
								<Box
									key={item.id}
									marginRight={colIndex < row.length - 1 ? gap : 0}
								>
									{renderGridItem(item, itemWidth, showBorders)}
								</Box>
							))}
						</Box>
					))}

					{/* Hidden items indicator */}
					{hiddenCount > 0 && (
						<Box marginTop={1}>
							<Text dimColor color={floydTheme.colors.fgMuted}>
								+{hiddenCount} more item{hiddenCount > 1 ? 's' : ''} hidden
							</Text>
						</Box>
					)}
				</>
			)}

			{/* Children rendering (alternative to items) */}
			{!items.length && children && (
				<Box flexDirection="row" flexWrap="wrap" gap={gap}>
					{children}
				</Box>
			)}
		</Box>
	);
}

/**
 * ToolGridItem - Individual item for use in ToolGrid with children
 */
export interface ToolGridItemProps {
	/** Unique identifier */
	id: string;

	/** Label for the item */
	label?: string;

	/** Status indicator */
	status?: GridItemStatus;

	/** Content */
	children: ReactNode;

	/** Width override */
	width?: number;
}

export function ToolGridItem({
	label,
	status,
	children,
	width,
}: ToolGridItemProps) {
	const statusColor = status ? getStatusColor(status) : undefined;
	const statusIndicator = status ? getStatusIndicator(status) : undefined;

	return (
		<Box
			width={width}
			flexDirection="column"
			borderStyle="single"
			borderColor={statusColor ?? floydTheme.colors.border}
			paddingX={1}
			paddingY={0}
		>
			{label && (
				<Box marginBottom={0} justifyContent="space-between" width="100%">
					<Text bold color={floydTheme.colors.fgSelected}>
						{label}
					</Text>
					{statusIndicator && (
						<Text color={statusColor}>{statusIndicator}</Text>
					)}
				</Box>
			)}
			{children}
		</Box>
	);
}

/**
 * MetricGrid - Grid for displaying metrics/statistics
 */
export interface MetricGridProps {
	/** Metric items */
	metrics: Array<{
		label: string;
		value: string | number;
		unit?: string;
		change?: number;
		color?: string;
	}>;

	/** Columns */
	columns?: number;

	/** Grid width */
	width?: number;
}

export function MetricGrid({
	metrics,
	columns = 4,
	width = 80,
}: MetricGridProps) {
	const itemWidth = calculateItemWidth(width, columns, 1);

	// Split into rows
	const rows: (typeof metrics)[] = [];
	for (let i = 0; i < metrics.length; i += columns) {
		rows.push(metrics.slice(i, i + columns));
	}

	return (
		<Box flexDirection="column" width={width}>
			{rows.map((row, rowIndex) => (
				<Box key={rowIndex} marginBottom={rowIndex < rows.length - 1 ? 1 : 0}>
					{row.map((metric, colIndex) => {
						const changeColor =
							metric.change !== undefined
								? metric.change >= 0
									? floydTheme.colors.success
									: floydTheme.colors.error
								: undefined;

						return (
							<Box
								key={`${rowIndex}-${colIndex}`}
								width={itemWidth}
								marginRight={colIndex < row.length - 1 ? 1 : 0}
								flexDirection="column"
							>
								<Box justifyContent="space-between" width="100%">
									<Text dimColor color={floydTheme.colors.fgMuted}>
										{metric.label}
									</Text>
									{metric.change !== undefined && (
										<Text color={changeColor} dimColor>
											{metric.change >= 0 ? '▲' : '▼'}
											{Math.abs(metric.change).toFixed(1)}%
										</Text>
									)}
								</Box>
								<Box marginTop={0}>
									<Text bold color={metric.color ?? floydRoles.thinking}>
										{typeof metric.value === 'number'
											? metric.value.toLocaleString()
											: metric.value}
										{metric.unit && <Text dimColor>{metric.unit}</Text>}
									</Text>
								</Box>
							</Box>
						);
					})}
				</Box>
			))}
		</Box>
	);
}

/**
 * CommandGrid - Grid for displaying command/action cards
 */
export interface CommandGridProps {
	/** Command items */
	commands: Array<{
		key: string;
		label: string;
		description?: string;
		action?: () => void;
	}>;

	/** Grid width */
	width?: number;
}

export function CommandGrid({commands, width = 80}: CommandGridProps) {
	const columns = 2;
	const itemWidth = calculateItemWidth(width, columns, 1);

	const rows: (typeof commands)[] = [];
	for (let i = 0; i < commands.length; i += columns) {
		rows.push(commands.slice(i, i + columns));
	}

	return (
		<Box flexDirection="column" width={width}>
			{rows.map((row, rowIndex) => (
				<Box key={rowIndex} marginBottom={rowIndex < rows.length - 1 ? 1 : 0}>
					{row.map((cmd, colIndex) => (
						<Box
							key={cmd.key}
							width={itemWidth}
							marginRight={colIndex < row.length - 1 ? 1 : 0}
							borderStyle="single"
							borderColor={floydTheme.colors.border}
							paddingX={1}
							paddingY={0}
							flexDirection="column"
						>
							<Box justifyContent="space-between" width="100%">
								<Text bold color={floydTheme.colors.fgSelected}>
									{cmd.label}
								</Text>
								<Text dimColor color={floydRoles.thinking}>
									[{cmd.key}]
								</Text>
							</Box>
							{cmd.description && (
								<Text dimColor color={floydTheme.colors.fgMuted}>
									{cmd.description.length > 35
										? cmd.description.slice(0, 35) + '...'
										: cmd.description}
								</Text>
							)}
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
}

export default ToolGrid;
