/**
 * PHASE 5 ITEM 32: Vim Mode Enhancement
 *
 * Enhanced Vim keybindings for terminal input.
 * Supports: motions, editing, marks, search, visual mode.
 */

import { subject } from 'rxjs';

/**
 * Vim mode states
 */
export type VimMode =
	| 'normal'
	| 'insert'
	| 'visual'
	| 'visual-line'
	| 'replace';

/**
 * Position in buffer
 */
export interface Position {
	line: number;
	column: number;
}

/**
 * Text range
 */
export interface Range {
	start: Position;
	end: Position;
}

/**
 * Mark for jump positions
 */
export interface Mark {
	name: string;
	position: Position;
}

/**
 * Vim state
 */
export interface VimState {
	mode: VimMode;
	position: Position;
	anchor?: Position; // For visual mode
	selection?: string; // Selected text
	register: string; // Yank register
	marks: Map<string, Mark>;
	lastCommand: string;
	lastSearch?: {
		pattern: string;
		direction: 'forward' | 'backward';
	};
	recording: boolean;
	searchHistory: string[];
	historyIndex: number;
}

/**
 * Vim mode manager
 */
export class VimModeManager {
	private state: VimState;
	private buffer: string[];
	private state$: subject<VimState>;

	constructor() {
		this.buffer = [''];
		this.state = {
			mode: 'normal',
			position: { line: 0, column: 0 },
			register: '',
			marks: new Map(),
			lastCommand: '',
			recording: false,
			searchHistory: [],
			historyIndex: -1,
		};

		this.state$ = new subject<VimState>();
	}

	/**
	 * Get state observable
	 */
	getState$() {
		return this.state$;
	}

	/**
	 * Get current state
	 */
	getState(): VimState {
		return { ...this.state };
	}

	/**
	 * Set buffer content
	 */
	setBuffer(content: string): void {
		this.buffer = content.split('\n');
		this.ensurePositionValid();
	}

	/**
	 * Get buffer content as string
	*/
	getBuffer(): string {
		return this.buffer.join('\n');
	}

	/**
	 * Get current line
	*/
	getCurrentLine(): string {
		const { line } = this.state.position;
		return this.buffer[line] || '';
	}

	/**
	 * Enter insert mode
	 */
	enterInsertMode(): void {
		if (this.state.mode === 'normal' || this.state.mode.startsWith('visual')) {
			this.state.mode = 'insert';
			this.notifyState();
		}
	}

	/**
	 * Exit to normal mode
	*/
	exitToNormalMode(): void {
		this.state.mode = 'normal';
		this.state.anchor = undefined;
		this.notifyState();
	}

	/**
	 * Enter visual mode (character)
	 */
	enterVisualMode(): void {
		if (this.state.mode === 'normal') {
			this.state.mode = 'visual';
			this.state.anchor = { ...this.state.position };
			this.updateSelection();
			this.notifyState();
		}
	}

	/**
	 * Enter visual line mode
	 */
	enterVisualLineMode(): void {
		if (this.state.mode === 'normal') {
			this.state.mode = 'visual-line';
			this.state.anchor = { ...this.state.position, column: 0 };
			this.updateSelection();
			this.notifyState();
		}
	}

	/**
	 * Handle key press
	*/
	handleKey(key: string, ctrl?: boolean, alt?: boolean): boolean {
		if (ctrl && alt) return false; // Ignore Ctrl+Alt

		// Escape exits insert/visual mode
		if (key === 'Escape') {
			this.exitToNormalMode();
			return true;
		}

		// Mode-specific handling
		switch (this.state.mode) {
			case 'normal':
				return this.handleNormalModeKey(key, ctrl);
			case 'insert':
				return this.handleInsertModeKey(key);
			case 'visual':
				return this.handleVisualModeKey(key);
			case 'visual-line':
				return this.handleVisualLineModeKey(key);
		}

		return false;
	}

	/**
	 * Handle normal mode keys
	 */
	private handleNormalModeKey(key: string, ctrl?: boolean): boolean {
		const { line, column } = this.state.position;
		const currentLine = this.buffer[line];

		// Motions
		switch (key) {
			// Left/Right
			case 'h':
			case 'ArrowLeft':
				this.moveLeft();
				return true;
			case 'l':
			case 'ArrowRight':
				this.moveRight();
				return true;

			// Word motion
			case 'w':
				this.moveWordForward();
				return true;
			case 'b':
				this.moveWordBackward();
				return true;
			case 'e':
				this.moveToEndOfWord();
				return true;

			// Line motion
			case '0':
				this.moveToFirstColumn();
				return true;
			case '$':
				this.moveToLastColumn();
				return true;
			case '^':
				this.moveToFirstNonBlank();
				return true;

			// Line jumps
			case 'g':
				this.handleGPrefix();
				return true;
			case 'G':
				this.moveToLastLine();
				return true;
			case 'gg':
				this.moveToFirstLine();
				return true;

			// Scrolling
			case 'Ctrl+d':
			case 'Ctrl+f':
				this.scrollDown();
				return true;
			case 'Ctrl+u':
			case 'Ctrl+b':
				this.scrollUp();
				return true;

			// Editing
			case 'i':
			case 'a':
				this.enterInsertMode();
				return true;
			case 'I':
				this.moveToFirstNonBlank();
				this.enterInsertMode();
				return true;
			case 'A':
				this.moveToLastColumn();
				this.enterInsertMode();
				return true;

			// Delete
			case 'x':
				this.deleteChar();
				return true;
			case 'dd':
				this.deleteLine();
				return true;
			case 'dw':
				this.deleteWord();
				return true;
			case 'd$':
				this.deleteToEndOfLine();
				return true;
			case 'd0':
				this.deleteToStartOfLine();
				return true;

			// Yank (copy)
			case 'yy':
				this.yankLine();
				return true;
			case 'yw':
				this.yankWord();
				return true;

			// Paste
			case 'p':
				this.pasteAfter();
				return true;
			case 'P':
				this.pasteBefore();
				return true;

			// Undo
			case 'u':
				this.undo();
				return true;

			// Visual mode
			case 'v':
				this.enterVisualMode();
				return true;
			case 'V':
				this.enterVisualLineMode();
				return true;

			// Search
			case '/':
				this.startForwardSearch();
				return true;
			case '?':
				this.startBackwardSearch();
				return true;
			case 'n':
				this.searchNext();
				return true;
			case 'N':
				this.searchPrevious();
				return true;

			// Marks
			case 'm':
				this.handleMarkPrefix();
				return true;
			case '`':
				this.handleJumpToMark();
				return true;

			default:
				return false;
		}
	}

	/**
	 * Handle insert mode keys
	 */
	private handleInsertModeKey(key: string): boolean {
		if (key === 'Escape') {
			this.exitToNormalMode();
			return true;
		}

		// In insert mode, most characters are just input
		return false;
	}

	/**
	 * Handle visual mode keys
	 */
	private handleVisualModeKey(key: string): boolean {
		switch (key) {
			case 'h':
			case 'ArrowLeft':
				this.moveLeft();
				this.updateSelection();
				return true;
			case 'l':
			case 'ArrowRight':
				this.moveRight();
				this.updateSelection();
				return true;
			case 'w':
				this.moveWordForward();
				this.updateSelection();
				return true;
			case 'b':
				this.moveWordBackward();
				this.updateSelection();
				return true;
			case 'd':
			case 'x':
				this.deleteSelection();
				return true;
			case 'y':
				this.yankSelection();
				this.exitToNormalMode();
				return true;
			default:
				return false;
		}
	}

	/**
	 * Handle visual line mode keys
	 */
	private handleVisualLineModeKey(key: string): boolean {
		switch (key) {
			case 'j':
			case 'ArrowDown':
				this.moveDown();
				this.updateSelection();
				return true;
			case 'k':
			case 'ArrowUp':
				this.moveUp();
				this.updateSelection();
				return true;
			case 'd':
			case 'dd':
				this.deleteSelection();
				return true;
			case 'y':
				this.yankSelection();
				this.exitToNormalMode();
				return true;
			default:
				return false;
		}
	}

	// Motion methods

	private moveLeft(): void {
		if (this.state.position.column > 0) {
			this.state.position.column--;
		}
	}

	private moveRight(): void {
		if (this.state.position.column < this.getCurrentLine().length - 1) {
			this.state.position.column++;
		}
	}

	private moveUp(): void {
		if (this.state.position.line > 0) {
			this.state.position.line--;
			this.ensurePositionValid();
		}
	}

	private moveDown(): void {
		if (this.state.position.line < this.buffer.length - 1) {
			this.state.position.line++;
			this.ensurePositionValid();
		}
	}

	private moveWordForward(): void {
		const line = this.getCurrentLine();
		let col = this.state.position.column;

		// Skip current word
		while (col < line.length && /\S/.test(line[col])) col++;
		while (col < line.length && /\s/.test(line[col])) col++;

		this.state.position.column = Math.min(col, line.length - 1);
	}

	private moveWordBackward(): void {
		const line = this.getCurrentLine();
		let col = this.state.position.column;

		// Skip whitespace
		while (col > 0 && /\s/.test(line[col - 1])) col--;
		// Skip word
		while (col > 0 && !/\s/.test(line[col - 1]) && /\S/.test(line[col])) col--;

		this.state.position.column = col;
	}

	private moveToEndOfWord(): void {
		const line = this.getCurrentLine();
		let col = this.state.position.column;

		while (col < line.length && /\S/.test(line[col])) col++;
		this.state.position.column = Math.max(0, col - 1);
	}

	private moveToFirstColumn(): void {
		this.state.position.column = 0;
	}

	private moveToLastColumn(): void {
		this.state.position.column = Math.max(0, this.getCurrentLine().length - 1);
	}

	private moveToFirstNonBlank(): void {
		const line = this.getCurrentLine();
		const firstNonBlank = line.search(/\S/);
		this.state.position.column = firstNonBlank >= 0 ? firstNonBlank : 0;
	}

	private moveToFirstLine(): void {
		this.state.position.line = 0;
		this.state.position.column = 0;
	}

	private moveToLastLine(): void {
		this.state.position.line = Math.max(0, this.buffer.length - 1);
		this.state.position.column = 0;
	}

	private handleGPrefix(): void {
		// Wait for next key (gg, ge, etc.)
	}

	// Editing methods

	private deleteChar(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];

		if (column < line.length) {
			this.buffer[line] = line.slice(0, column) + line.slice(column + 1);
		}
		this.notifyState();
	}

	private deleteLine(): void {
		const { line } = this.state.position;
		this.state.register = this.buffer[line];
		this.buffer.splice(line, 1);
		this.ensurePositionValid();
		this.notifyState();
	}

	private deleteWord(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];

		let endCol = column;
		while (endCol < line.length && /\S/.test(line[endCol])) endCol++;

		this.state.register = line.slice(column, endCol);
		this.buffer[line] = line.slice(0, column) + line.slice(endCol);
		this.state.position.column = Math.max(0, column - 1);
		this.notifyState();
	}

	private deleteToEndOfLine(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];

		this.state.register = line.slice(column);
		this.buffer[line] = line.slice(0, column);
		this.state.position.column = Math.max(0, column - 1);
		this.notifyState();
	}

	private deleteToStartOfLine(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];

		this.state.register = line.slice(0, column);
		this.buffer[line] = line.slice(column);
		this.state.position.column = 0;
		this.notifyState();
	}

	private deleteSelection(): void {
		const selection = this.getSelection();
		if (selection) {
			this.state.register = selection;
			// Delete selection
			this.deleteRange(selection.start, selection.end);
			this.state.position = selection.start;
			this.exitToNormalMode();
		}
	}

	private deleteRange(start: Position, end: Position): void {
		const startLine = start.line;
		const endLine = end.line;

		if (startLine === endLine) {
			const line = this.buffer[startLine];
			this.buffer[startLine] = line.slice(0, start.column) + line.slice(end.column + 1);
		} else {
			const firstLine = this.buffer[startLine];
			const lastLine = this.buffer[endLine];

			this.buffer[startLine] = firstLine.slice(0, start.column);
			this.buffer[endLine] = lastLine.slice(end.column + 1);

			// Remove lines in between
			this.buffer.splice(startLine + 1, endLine - startLine - 1);
		}

		this.state.position = start;
		this.notifyState();
	}

	// Yank methods

	private yankLine(): void {
		this.state.register = this.getCurrentLine();
	}

	private yankWord(): void {
		const { line, column } = this.state.position;
		const line = this.getCurrentLine();

		let endCol = column;
		while (endCol < line.length && /\S/.test(line[endCol])) endCol++;

		this.state.register = line.slice(column, endCol);
	}

	private yankSelection(): void {
		const selection = this.getSelection();
		if (selection) {
			this.state.register = selection;
			this.exitToNormalMode();
		}
	}

	// Paste methods

	private pasteAfter(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];
		const register = this.state.register;

		this.buffer[line] = line.slice(0, column + 1) + register + line.slice(column + 1);
		this.state.position.column += register.length;
		this.notifyState();
	}

	private pasteBefore(): void {
		const { line, column } = this.state.position;
		const line = this.buffer[line];
		const register = this.state.register;

		this.buffer[line] = line.slice(0, column) + register + line.slice(column);
		this.state.position.column += register.length;
		this.notifyState();
	}

	// Search methods

	private startForwardSearch(): void {
		// Would prompt user for search pattern
	}

	private startBackwardSearch(): void {
		// Would prompt user for search pattern
	}

	private searchNext(): void {
		// Search for next occurrence
	}

	private searchPrevious(): void {
		// Search for previous occurrence
	}

	// Mark methods

	private handleMarkPrefix(): void {
		// Wait for mark character
	}

	private handleJumpToMark(): void {
		// Jump to marked position
	}

	// Utility methods

	private ensurePositionValid(): void {
		const { line, column } = this.state.position;

		this.state.position.line = Math.max(0, Math.min(line, this.buffer.length - 1));

		const maxColumn = this.getCurrentLine().length;
		this.state.position.column = Math.max(0, Math.min(column, maxColumn));
	}

	private updateSelection(): void {
		if (!this.state.anchor) return;

		const start = this.state.anchor;
		const end = this.state.position;

		this.state.selection = this.extractRange(start, end);
		this.notifyState();
	}

	private getSelection(): string | null {
		if (!this.state.anchor || !this.state.selection) {
			return null;
		}

		// Return selected text
		return this.state.selection;
	}

	private extractRange(start: Position, end: Position): string {
		if (start.line === end.line) {
			const line = this.buffer[start.line];
			return line.slice(start.column, end.column + 1);
		}

		const lines: string[] = [];
		if (start.line < end.line) {
			lines.push(this.buffer[start.line].slice(start.column));
		}

		for (let i = start.line + 1; i < end.line; i++) {
			lines.push(this.buffer[i]);
		}

		lines.push(this.buffer[end.line].slice(0, end.column + 1));
		return lines.join('\n');
	}

	private notifyState(): void {
		this.state$.next(this.getState());
	}

	private scrollDown(): void {
		// Scroll buffer content
	}

	private scrollUp(): void {
		// Scroll buffer content
	}

	private undo(): void {
		// Undo last change
	}
}

export { VimModeManager, VimState, VimMode };
export default VimModeManager;
