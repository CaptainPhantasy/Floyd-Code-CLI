/**
 * PHASE 5 ITEM 31: NotebookEdit Tool
 *
 * Jupyter notebook (.ipynb) support for editing notebooks.
 * Provides cell-level operations: read, edit, insert, delete, append.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Jupyter notebook cell types
 */
export type CellType = 'code' | 'markdown';

/**
 * Jupyter cell structure
 */
export interface NotebookCell {
	cell_type: CellType;
	source: string[]; // Multi-line source
	metadata?: Record<string, unknown>;
	execution_count?: number;
	outputs?: CellOutput[];
	id?: string;
}

/**
 * Cell output (simplified)
 */
export interface CellOutput {
	output_type: 'stream' | 'execute_result' | 'display_data' | 'error';
	text?: string;
	data?: Record<string, unknown>;
	name?: string;
	value?: unknown;
	enmime?: string;
}

/**
 * Jupyter notebook structure
 */
export interface Notebook {
	nbformat: number;
	nbformat_minor: number;
	metadata: Record<string, unknown>;
	cells: NotebookCell[];
}

/**
 * Notebook edit operations
 */
export interface NotebookEdit {
	indexPath?: number; // For multi-line cells
	source: string[];
}

/**
 * Read notebook file
 */
export async function readNotebook(filePath: string): Promise<Notebook> {
	const content = await fs.readFile(filePath, 'utf-8');
	const notebook = JSON.parse(content) as Notebook;

	return notebook;
}

/**
 * Write notebook file
 */
export async function writeNotebook(filePath: string, notebook: Notebook): Promise<void> {
	const content = JSON.stringify(notebook, null, 2);
	await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Get cell by index
 */
export function getCell(notebook: Notebook, index: number): NotebookCell | null {
	if (index < 0 || index >= notebook.cells.length) {
		return null;
	}
	return notebook.cells[index];
}

/**
 * Find cell by content pattern
 */
export function findCellByContent(
	notebook: Notebook,
	pattern: string,
	cellType?: CellType
): number[] {
	const matches: number[] = [];

	for (let i = 0; i < notebook.cells.length; i++) {
		const cell = notebook.cells[i];

		if (cellType && cell.cell_type !== cellType) {
			continue;
		}

		const source = cell.source.join('\n');
		if (source.includes(pattern)) {
			matches.push(i);
		}
	}

	return matches;
}

/**
 * Edit cell source
 */
export function editCell(
	notebook: Notebook,
	index: number,
	edit: NotebookEdit
): boolean {
	const cell = getCell(notebook, index);
	if (!cell) {
		return false;
	}

	if (edit.source !== undefined) {
		cell.source = edit.source;
	}

	return true;
}

/**
 * Insert new cell
 */
export function insertCell(
	notebook: Notebook,
	index: number,
	cell: NotebookCell
): boolean {
	if (index < 0 || index > notebook.cells.length) {
		return false;
	}

	notebook.cells.splice(index, 0, cell);
	return true;
}

/**
 * Append cell to notebook
 */
export function appendCell(notebook: Notebook, cell: NotebookCell): void {
	notebook.cells.push(cell);
}

/**
 * Delete cell
 */
export function deleteCell(notebook: Notebook, index: number): boolean {
	if (index < 0 || index >= notebook.cells.length) {
		return false;
	}

	notebook.cells.splice(index, 1);
	return true;
}

/**
 * Create new code cell
 */
export function createCodeCell(source: string | string[]): NotebookCell {
	return {
		cell_type: 'code',
		source: Array.isArray(source) ? source : [source],
		metadata: {},
		execution_count: 0,
	};
}

/**
 * Create new markdown cell
 */
export function createMarkdownCell(source: string | string[]): NotebookCell {
	return {
		cell_type: 'markdown',
		source: Array.isArray(source) ? source : [source],
		metadata: {},
	};
}

/**
 * Get notebook statistics
 */
export function getNotebookStats(notebook: Notebook): {
	totalCells: number;
	codeCells: number;
	markdownCells: number;
	totalLines: number;
} {
	let codeCells = 0;
	let markdownCells = 0;
	let totalLines = 0;

	for (const cell of notebook.cells) {
		if (cell.cell_type === 'code') {
			codeCells++;
		} else if (cell.cell_type === 'markdown') {
			markdownCells++;
		}
		totalLines += cell.source.length;
	}

	return {
		totalCells: notebook.cells.length,
		codeCells,
		markdownCells,
		totalLines,
	};
}

/**
 * Validate notebook structure
 */
export function validateNotebook(notebook: Notebook): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (typeof notebook.nbformat !== 'number') {
		errors.push('Missing nbformat version');
	}

	if (notebook.cells && !Array.isArray(notebook.cells)) {
		errors.push('Cells must be an array');
	}

	for (let i = 0; i < notebook.cells.length; i++) {
		const cell = notebook.cells[i];

		if (!['code', 'markdown'].includes(cell.cell_type)) {
			errors.push(`Cell ${i}: Invalid cell_type "${cell.cell_type}"`);
		}

		if (!Array.isArray(cell.source)) {
			errors.push(`Cell ${i}: Source must be an array`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * NotebookEdit tool wrapper for agent use
 */
export class NotebookTool {
	/**
	 * Read cell content
	 */
	async readCell(filePath: string, cellIndex: number): Promise<{
		success: boolean;
		cell?: NotebookCell;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);
			const cell = getCell(notebook, cellIndex);

			if (!cell) {
				return {
					success: false,
					error: `Cell ${cellIndex} not found (notebook has ${notebook.cells.length} cells)`,
				};
			}

			return {
				success: true,
				cell,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Edit cell
	 */
	async editCell(
		filePath: string,
		cellIndex: number,
		newSource: string | string[]
	): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);
			const edited = editCell(notebook, cellIndex, {
				source: Array.isArray(newSource) ? newSource : [newSource],
			});

			if (!edited) {
				return {
					success: false,
					error: `Failed to edit cell ${cellIndex}`,
				};
			}

			await writeNotebook(filePath, notebook);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Insert cell
	 */
	async insertCell(
		filePath: string,
		index: number,
		cellType: CellType,
		source: string | string[]
	): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);

			const cell = cellType === 'code'
				? createCodeCell(source)
				: createMarkdownCell(source);

			const inserted = insertCell(notebook, index, cell);

			if (!inserted) {
				return {
					success: false,
					error: `Failed to insert cell at index ${index}`,
				};
			}

			await writeNotebook(filePath, notebook);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Append cell
	 */
	async appendCell(
		filePath: string,
		cellType: CellType,
		source: string | string[]
	): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);

			const cell = cellType === 'code'
				? createCodeCell(source)
				: createMarkdownCell(source);

			appendCell(notebook, cell);
			await writeNotebook(filePath, notebook);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Delete cell
	 */
	async deleteCell(
		filePath: string,
		cellIndex: number
	): Promise<{
		success: boolean;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);
			const deleted = deleteCell(notebook, cellIndex);

			if (!deleted) {
				return {
					success: false,
					error: `Failed to delete cell ${cellIndex}`,
				};
			}

			await writeNotebook(filePath, notebook);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Search for cells containing pattern
	 */
	async searchCells(
		filePath: string,
		pattern: string,
		cellType?: CellType
	): Promise<{
		success: boolean;
		matches?: number[];
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);
			const matches = findCellByContent(notebook, pattern, cellType);

			return {
				success: true,
				matches,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Get notebook info
	 */
	async getInfo(filePath: string): Promise<{
		success: boolean;
		info?: ReturnType<typeof getNotebookStats>;
		error?: string;
	}> {
		try {
			const notebook = await readNotebook(filePath);
			const stats = getNotebookStats(notebook);
			const validation = validateNotebook(notebook);

			return {
				success: validation.valid,
				info: stats,
				error: validation.valid ? undefined : validation.errors.join(', '),
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}
}

/**
 * Tool definitions for agent use
 */
export const notebookToolDefinitions = {
	notebook_read_cell: 'Read a cell from a Jupyter notebook',
	notebook_edit_cell: 'Edit a cell in a Jupyter notebook',
	notebook_insert_cell: 'Insert a new cell into a Jupyter notebook',
	notebook_append_cell: 'Append a new cell to a Jupyter notebook',
	notebook_delete_cell: 'Delete a cell from a Jupyter notebook',
	notebook_search: 'Search for cells matching a pattern in a notebook',
	notebook_info: 'Get information about a Jupyter notebook',
};

export { Notebook, NotebookCell, NotebookEdit, CellType };
export default NotebookTool;
