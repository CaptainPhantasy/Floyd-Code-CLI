import {useRef} from 'react';
import {useInput} from 'ink';
import {useTuiStore} from '../store/tui-store.js';

interface KeyboardOptions {
	disabled?: boolean;
	onKeyPress?: (key: string, fullInput: string) => void;
}

/**
 * Global keyboard hook for FLOYD TUI
 * Handles all keyboard shortcuts
 */
export function useKeyboard(options: KeyboardOptions = {}) {
	const {disabled = false, onKeyPress} = options;
	const overlayMode = useTuiStore(state => state.overlayMode);
	const cycleMode = useTuiStore(state => state.cycleMode);
	const closeOverlay = useTuiStore(state => state.closeOverlay);
	const toggleThinking = useTuiStore(state => state.toggleThinking);
	const setOverlayMode = useTuiStore(state => state.setOverlayMode);

	const lastKeyPress = useRef<number>(0);

	useInput((input, key) => {
		if (disabled) return;

		const now = Date.now();

		// Ctrl+Q: Immediate quit
		if (key.ctrl && input === 'q') {
			process.exit(0);
		}

		// Ctrl+C: Double-tap to quit (prevent accidental)
		if (key.ctrl && input === 'c') {
			if (now - lastKeyPress.current < 500) {
				process.exit(0);
			}
			lastKeyPress.current = now;
			return;
		}

		// Ctrl+/: Help overlay
		if (key.ctrl && input === '/') {
			if (overlayMode === 'help') {
				closeOverlay();
			} else {
				setOverlayMode('help');
			}
			return;
		}

		// Ctrl+P: Command palette
		if (key.ctrl && input === 'p') {
			if (overlayMode === 'command') {
				closeOverlay();
			} else {
				setOverlayMode('command');
			}
			return;
		}

		// Ctrl+O: Toggle Transcript
		if (key.ctrl && input === 'o') {
			if (overlayMode === 'transcript') {
				closeOverlay();
			} else {
				setOverlayMode('transcript');
			}
			return;
		}

		// Ctrl+B: Toggle Background Tasks
		if (key.ctrl && input === 'b') {
			if (overlayMode === 'background') {
				closeOverlay();
			} else {
				setOverlayMode('background');
			}
			return;
		}

		// Ctrl+R: Toggle History Search
		if (key.ctrl && input === 'r') {
			if (overlayMode === 'history') {
				closeOverlay();
			} else {
				setOverlayMode('history');
			}
			return;
		}

		// Ctrl+G: Toggle External Editor
		if (key.ctrl && input === 'g') {
			if (overlayMode === 'editor') {
				closeOverlay();
			} else {
				setOverlayMode('editor');
			}
			return;
		}

		// Ctrl+Z: Rewind (checkpoint restore)
		if (key.ctrl && input === 'z') {
			if (overlayMode === 'rewind') {
				closeOverlay();
			} else {
				setOverlayMode('rewind');
			}
			return;
		}

		// Shift+Tab: Cycle mode
		if (key.shift && key.tab) {
			cycleMode();
			return;
		}

		// Tab: Toggle thinking
		if (key.tab && !key.shift) {
			toggleThinking();
			return;
		}

		// Esc: Close overlay or double-tap to quit
		if (key.escape) {
			if (overlayMode !== 'none') {
				closeOverlay();
			} else {
				// Double-Esc to quit when no overlay open
				if (now - lastKeyPress.current < 500) {
					process.exit(0);
				}
				lastKeyPress.current = now;
			}
			return;
		}

		// Callback for custom handling
		if (onKeyPress) {
			onKeyPress(input, input);
		}
	});

	return {
		overlayMode,
		closeOverlay,
		setOverlayMode,
	};
}
