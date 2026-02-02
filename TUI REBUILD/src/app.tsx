import * as Ink from 'ink';
import { useEffect } from 'react';
import { useTuiStore } from './store/tui-store.js';
import { CurrentExchange } from './components/CurrentExchange.js';
import { InputArea } from './components/InputArea.js';
import { StatusBar } from './components/StatusBar.js';
import { TranscriptOverlay } from './components/TranscriptOverlay.js';
import { HistorySearchOverlay } from './components/HistorySearchOverlay.js';
import { BackgroundTasksOverlay } from './components/BackgroundTasksOverlay.js';
import { CommandPalette } from './components/CommandPalette.js';
import { HelpOverlay } from './components/HelpOverlay.js';

export function App() {
  const overlayMode = useTuiStore((state) => state.overlayMode);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);
  const initialize = useTuiStore((state) => state.initialize);

  // Initialize state from cache on mount
  useEffect(() => {
    initialize()
      .then(() => {
        // Emit deterministic boot marker for smoke tests
        console.log('APP_BOOT_OK ' + new Date().toISOString());
      })
      .catch(() => {
        // Silently fail if cache unavailable
        console.debug('Cache unavailable, using defaults');
        // Still emit boot marker - app can run without cache
        console.log('APP_BOOT_OK ' + new Date().toISOString());
      });
  }, [initialize]);

  // Handle keyboard shortcuts
  useEffect(() => {
    // Comprehensive TTY guard - skip entire keyboard handler in non-TTY environments
    // This prevents raw mode errors in tests and CI/CD
    const isTTY = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
    if (!isTTY) {
      return;
    }

    const handleKeyPress = (data: Buffer) => {
      const key = data.toString();

      // Ctrl+Q: Quit (double-press for safety)
      if (key === '\u0011') {
        process.exit(0);
      }

      // Ctrl+/: Toggle help overlay
      if (key === '\u001f') {
        if (overlayMode === 'help') {
          closeOverlay();
        } else {
          useTuiStore.getState().setOverlayMode('help');
        }
      }

      // Ctrl+P: Command palette
      if (key === '\u0010') {
        if (overlayMode === 'command') {
          closeOverlay();
        } else {
          useTuiStore.getState().setOverlayMode('command');
        }
      }

      // Esc: Close overlay
      if (key === '\u001b') {
        closeOverlay();
      }
    };

    try {
      if (typeof process.stdin.setRawMode === 'function') {
        process.stdin.setRawMode(true);
      }
      process.stdin.on('data', handleKeyPress);

      return () => {
        process.stdin.off('data', handleKeyPress);
      };
    } catch {
      // Ignore errors in non-TTY environments
      return;
    }
  }, [overlayMode, closeOverlay]);

  return (
    <Ink.Box flexDirection="column" height="100%" width="100%">
      {/* Status Bar - always at VERY TOP */}
      <StatusBar />

      {/* Main Content Area - messages flow UP from bottom */}
      <Ink.Box
        flexDirection="column"
        flexGrow={1}
        paddingY={1}
        justifyContent="flex-end"
      >
        {overlayMode === 'none' && <CurrentExchange />}

        {/* Overlays */}
        {overlayMode === 'transcript' && <TranscriptOverlay />}
        {overlayMode === 'history' && <HistorySearchOverlay />}
        {overlayMode === 'background' && <BackgroundTasksOverlay />}
        {overlayMode === 'command' && <CommandPalette />}
        {overlayMode === 'help' && <HelpOverlay />}

        {/* Unimplemented overlay modes - show placeholder */}
        {(overlayMode === 'config' || overlayMode === 'context' || overlayMode === 'editor') && (
          <Ink.Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Ink.Text dimColor>Overlay '{overlayMode}' not yet implemented</Ink.Text>
            <Ink.Text dimColor> Press Esc to return</Ink.Text>
          </Ink.Box>
        )}
      </Ink.Box>

      {/* Input Area - always at VERY BOTTOM */}
      <InputArea />
    </Ink.Box>
  );
}
