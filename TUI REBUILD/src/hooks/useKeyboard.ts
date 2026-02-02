import {useRef} from 'react';
import {useInput} from 'ink';
import {useTuiStore} from '../store/tui-store';

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

		// Ctrl+Q: Quit (double-press safety)
		if (key.ctrl && input === 'q') {
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

		// Ctrl+O: Overlay menu
		if (key.ctrl && input === 'o') {
			// Cycle through overlays
			const overlays = ['transcript', 'history', 'background'] as const;
			const currentIdx = overlays.indexOf(
				overlayMode as (typeof overlays)[number],
			);
			if (currentIdx >= 0) {
				const nextIdx = (currentIdx + 1) % overlays.length;
				setOverlayMode(overlays[nextIdx]);
			} else {
				setOverlayMode('transcript');
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

		// Esc: Close overlay
		if (key.escape) {
			closeOverlay();
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
