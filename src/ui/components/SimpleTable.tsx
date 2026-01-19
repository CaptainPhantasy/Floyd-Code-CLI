/**
 * Simple Table Component
 *
 * A lightweight table component for Ink that doesn't have ESM/CJS interop issues.
 * Replaces ink-table for compatibility.
 */

import {Box, Text} from 'ink';

export interface SimpleTableProps {
	data: string[][];
	columns?: string[];
}

/**
 * Simple table component that renders data in a grid
 */
export function SimpleTable({data, columns}: SimpleTableProps) {
	if (data.length === 0) {
		return <Text>No data</Text>;
	}

	// Calculate column widths
	const colWidths: number[] = [];
	const allRows = columns ? [columns, ...data] : data;

	for (let col = 0; col < (allRows[0]?.length || 0); col++) {
		let maxWidth = 0;
		for (const row of allRows) {
			const cell = String(row[col] || '');
			maxWidth = Math.max(maxWidth, cell.length);
		}
		colWidths.push(Math.min(maxWidth + 2, 30)); // Max 30 chars per column
	}

	return (
		<Box flexDirection="column">
			{allRows.map((row, rowIdx) => (
				<Box key={rowIdx} flexDirection="row">
					{row.map((cell, colIdx) => {
						const cellText = String(cell || '');
						const isHeader = rowIdx === 0 && columns !== undefined;

						return (
							<Box
								key={colIdx}
								width={colWidths[colIdx]}
								paddingX={1}
								borderStyle={isHeader ? 'single' : undefined}
							>
								<Text
									wrap="truncate"
									bold={isHeader}
									color={isHeader ? undefined : undefined}
								>
									{cellText}
								</Text>
							</Box>
						);
					})}
				</Box>
			))}
		</Box>
	);
}

export default SimpleTable;
