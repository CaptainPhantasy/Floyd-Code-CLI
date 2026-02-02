import * as Ink from 'ink';
import {useEffect} from 'react';
import {useTuiStore} from './store/tui-store.js';
import {useKeyboard} from './hooks/useKeyboard.js';
import {CurrentExchange} from './components/CurrentExchange.js';
import {InputArea} from './components/InputArea.js';
import {StatusBar} from './components/StatusBar.js';
import {TranscriptOverlay} from './components/TranscriptOverlay.js';
import {HistorySearchOverlay} from './components/HistorySearchOverlay.js';
import {BackgroundTasksOverlay} from './components/BackgroundTasksOverlay.js';
import {CommandPalette} from './components/CommandPalette.js';
import {HelpOverlay} from './components/HelpOverlay.js';
import {ExternalEditorOverlay} from './components/ExternalEditorOverlay.js';
import {RewindOverlay} from './components/RewindOverlay.js';
import {TuiErrorBoundary} from './components/TuiErrorBoundary.js';

function AppInternal() {
	const overlayMode = useTuiStore(state => state.overlayMode);
	const initialize = useTuiStore(state => state.initialize);

	// Enable global keyboard shortcuts
	useKeyboard();

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
				{overlayMode === 'editor' && <ExternalEditorOverlay />}
				{overlayMode === 'rewind' && <RewindOverlay />}

				{/* Unimplemented overlay modes - show placeholder */}
				{(overlayMode === 'config' ||
					overlayMode === 'context' ||
					overlayMode === 'diff') && (
					<Ink.Box justifyContent="center" alignItems="center" flexGrow={1}>
						<Ink.Text dimColor>
							Overlay '{overlayMode}' not yet implemented
						</Ink.Text>
						<Ink.Text dimColor> Press Esc to return</Ink.Text>
					</Ink.Box>
				)}
			</Ink.Box>

			{/* Input Area - always at VERY BOTTOM */}
			<InputArea />
		</Ink.Box>
	);
}

export function App() {
	return (
		<TuiErrorBoundary>
			<AppInternal />
		</TuiErrorBoundary>
	);
}
