/**
 * PHASE 5 ITEM 25: LSP Tool - Tool Definitions
 *
 * LSP tool wrappers for use in agent workflows.
 */

import { getLSPClient } from './lsp-client.js';
import type { LSPPosition, LSPLocation, LSPHover, LSPSymbol } from './lsp-client.js';

/**
 * LSP tool results for agent consumption
 */
export interface LSPToolResult {
	success: boolean;
	result?: any;
	error?: string;
}

/**
 * Go to definition tool
 * Finds where a symbol is defined
 */
export async function lsp_goto_definition(
	filePath: string,
	line: number,
	character: number
): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.openFile(filePath);

		const locations: LSPLocation[] = await client.gotoDefinition(
			filePath,
			line,
			character
		);

		return {
			success: true,
			result: {
				locations: locations.map(loc => ({
					file: loc.uri,
					startLine: loc.range.start.line,
					startCol: loc.range.start.character,
					endLine: loc.range.end.line,
					endCol: loc.range.end.character,
				})),
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Find references tool
 * Finds all references to a symbol
 */
export async function lsp_find_references(
	filePath: string,
	line: number,
	character: number
): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.openFile(filePath);

		const locations: LSPLocation[] = await client.findReferences(
			filePath,
			line,
			character
		);

		return {
			success: true,
			result: {
				references: locations.map(loc => ({
					file: loc.uri,
					startLine: loc.range.start.line,
					startCol: loc.range.start.character,
				})),
				count: locations.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Hover tool
 * Get type information and documentation
 */
export async function lsp_hover(
	filePath: string,
	line: number,
	character: number
): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.openFile(filePath);

		const hover: LSPHover | null = await client.hover(
			filePath,
			line,
			character
		);

		return {
			success: true,
			result: hover ? {
				contents: hover.contents,
				range: hover.range,
			} : null,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Document symbols tool
 * Get outline of file (functions, classes, etc.)
 */
export async function lsp_symbols(filePath: string): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.openFile(filePath);

		const symbols: LSPSymbol[] = await client.documentSymbols(filePath);

		return {
			success: true,
			result: {
				symbols: symbols.map(s => ({
					name: s.name,
					kind: s.kind,
					container: s.containerName,
					file: s.location.uri,
					line: s.location.range.start.line,
				})),
				count: symbols.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Rename tool
 * Rename a symbol across all references
 */
export async function lsp_rename(
	filePath: string,
	line: number,
	character: number,
	newName: string
): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.openFile(filePath);

		const renameResult = await client.rename(
			filePath,
			line,
			character,
			newName
		);

		if (!renameResult) {
			return {
				success: false,
				error: 'Rename returned no result',
			};
		}

		return {
			success: true,
			result: {
				changes: renameResult.changes.map((change: any) => ({
					file: change.uri,
					edits: change.edits.length,
				})),
				totalFiles: renameResult.changes.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Close all LSP connections
 */
export async function lsp_close_all(): Promise<LSPToolResult> {
	try {
		const client = getLSPClient();
		await client.closeAll();

		return {
			success: true,
			result: {
				message: 'All LSP connections closed',
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Format position as human-readable string
 */
export function formatPosition(pos: LSPPosition): string {
	return `Line ${pos.line + 1}, Column ${pos.character + 1}`;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
	return ['typescript', 'javascript', 'python', 'rust', 'go'];
}
