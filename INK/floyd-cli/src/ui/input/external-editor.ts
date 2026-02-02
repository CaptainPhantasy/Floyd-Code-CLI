/**
 * PHASE 5 ITEM 29: Ctrl+G External Editor
 *
 * Edit input in external $EDITOR.
 * Opens temporary file with current input, replaces on save.
 */

import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

/**
 * External editor options
 */
export interface ExternalEditorOptions {
	editor?: string; // Editor command (default: $EDITOR or 'vim')
	tempDir?: string; // Temp directory (default: OS temp dir)
	extension?: string; // File extension (default: '.txt')
	prefix?: string; // File prefix (default: 'floyd-input-')
}

/**
 * External editor result
 */
export interface EditorResult {
	success: boolean;
	edited?: string;
	error?: string;
	tempFile?: string;
}

/**
 * Edit input in external editor
 */
export function editInExternalEditor(
	input: string,
	options: ExternalEditorOptions = {}
): EditorResult {
	const editor = options.editor || process.env.EDITOR || process.env.VISUAL || 'vim';
	const tempDir = options.tempDir || os.tmpdir();
	const extension = options.extension || '.txt';
	const prefix = options.prefix || 'floyd-input-';

	const tempFile = path.join(tempDir, `${prefix}${Date.now()}${extension}`);

	try {
		// Write current input to temp file
		fs.writeFileSync(tempFile, input, 'utf-8');

		// Determine editor args based on common editors
		const args = getEditorArgs(editor, tempFile);

		// Open editor
		const result = spawnSync(editor, args, {
			stdio: 'inherit',
		});

		if (result.status !== 0) {
			return {
				success: false,
				error: `Editor exited with code ${result.status}`,
				tempFile,
			};
		}

		// Read edited content
		const edited = fs.readFileSync(tempFile, 'utf-8');

		return {
			success: true,
			edited,
			tempFile,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	} finally {
		// Cleanup temp file
		try {
			fs.unlinkSync(tempFile);
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * Get editor arguments for common editors
 */
function getEditorArgs(editor: string, filePath: string): string[] {
	const editorCommand = editor.toLowerCase().split('/').pop() || editor;

	// Common editor argument patterns
	const editorArgs: Record<string, (file: string) => string[]> = {
		vi: [filePath],
		vim: [filePath],
		nvim: [filePath],
		neovim: [filePath],
		emacs: [filePath],
		nano: [filePath],
		code: ['--wait', filePath],
		'code-insiders': ['--wait', filePath],
		sublime: [filePath],
		atom: ['--wait', filePath],
		vscode: ['--wait', filePath],
		'viw': [filePath],
	};

	if (editorArgs[editorCommand]) {
		return editorArgs[editorCommand];
	}

	// Default: just pass the file path
	return [filePath];
}

/**
 * Check if Ctrl+G should be handled
 */
export function shouldHandleCtrlG(key: {
	ctrl?: boolean;
	name?: string;
	shift?: boolean;
	alt?: boolean;
}): boolean {
	return key.ctrl === true && key.name === 'g';
}

/**
 * Format status message for editor
 */
export function formatEditorStatus(editor: string, action: 'opening' | 'closed' | 'error'): string {
	switch (action) {
		case 'opening':
			return `Opening ${editor} editor...`;
		case 'closed':
			return `Editor closed. Input updated.`;
		case 'error':
			return `Editor error. See above.`;
		default:
		return '';
	}
}

/**
 * Get preferred editor from environment
 */
export function getPreferredEditor(): string {
	return process.env.EDITOR || process.env.VISUAL || 'vim';
}

/**
 * Check if editor is available
 */
export function isEditorAvailable(editor?: string): boolean {
	const editorCmd = editor || getPreferredEditor();

	try {
		const result = spawnSync('which', [editorCmd]);
		return result.status === 0;
	} catch {
		return false;
	}
}

/**
 * List available editors
 */
export function listAvailableEditors(): string[] {
	const commonEditors = [
		'vim',
		'vi',
		'nvim',
		'neovim',
		'emacs',
		'nano',
		'code',
		'code-insiders',
		'subl',
		'atom',
		'vscode',
	];

	const available: string[] = [];

	for (const editor of commonEditors) {
		if (isEditorAvailable(editor)) {
			available.push(editor);
		}
	}

	return available;
}

/**
 * Async version of editInExternalEditor
 */
export async function editInExternalEditorAsync(
	input: string,
	options: ExternalEditorOptions = {}
): Promise<EditorResult> {
	const editor = options.editor || process.env.EDITOR || process.env.VISUAL || 'vim';
	const tempDir = options.tempDir || os.tmpdir();
	const extension = options.extension || '.txt';
	const prefix = options.prefix || 'floyd-input-';

	const tempFile = path.join(tempDir, `${prefix}${Date.now()}${extension}`);

	try {
		// Write current input to temp file
		await fs.writeFile(tempFile, input, 'utf-8');

		// Determine editor args
		const args = getEditorArgs(editor, tempFile);

		// Open editor (using spawn for async would require child_process promises)
		const result = spawnSync(editor, args, {
			stdio: 'inherit',
		});

		if (result.status !== 0) {
			return {
				success: false,
				error: `Editor exited with code ${result.status}`,
				tempFile,
			};
		}

		// Read edited content
		const edited = await fs.readFile(tempFile, 'utf-8');

		return {
			success: true,
			edited,
			tempFile,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	} finally {
		// Cleanup temp file
		try {
			await fs.unlink(tempFile);
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * Input hook for Ink components
 * Returns true if Ctrl+G was handled
 */
export function createExternalEditorHook(setInput: (value: string) => void) {
	return (key: { ctrl?: boolean; name?: string; shift?: boolean; alt?: boolean }): boolean => {
		if (shouldHandleCtrlG(key)) {
			const currentInput = ''; // In real use, would get from component state

			const result = editInExternalEditor(currentInput);

			if (result.success && result.edited !== undefined) {
				setInput(result.edited);
			} else if (result.error) {
				console.error(`Editor error: ${result.error}`);
			}

			return true; // Event was handled
		}

		return false; // Event not handled
	};
}

/**
 * Get instructions for user
 */
export function getEditorInstructions(): string {
	const editor = getPreferredEditor();
	const available = listAvailableEditors();

	let instructions = `\nExternal Editor (${editor})\n`;
	instructions += `─────────────────────\n`;
	instructions += `Press Ctrl+G to edit your input in ${editor}.\n`;

	if (available.length === 0) {
		instructions += `\n⚠️  No editors found! Set $EDITOR environment variable.\n`;
		instructions += `   Example: export EDITOR=vim\n`;
	} else {
		instructions += `\nAvailable editors: ${available.join(', ')}\n`;
	}

	instructions += `\nTip: Set $EDITOR to your preferred editor:\n`;
	instructions += `  export EDITOR=code  # For VS Code\n`;
	instructions += `  export EDITOR=vim   # For Vim\n`;

	return instructions;
}

export default editInExternalEditor;
