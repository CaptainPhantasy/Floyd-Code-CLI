/**
 * Test render for StatusBar component
 * Run with: npx tsx tests/components/test-statusbar.tsx
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../../src/store/tui-store.js';
import { StatusBar } from '../../src/components/StatusBar.js';

// Initialize store with test data
useTuiStore.setState({
  mode: 'yolo',
  model: 'glm-4-plus',
  connectionStatus: 'online',
  isThinking: false,
  thinkingEnabled: true,
  whimsicalPhrase: null,
  messages: [],
  streamingContent: '',
  overlayMode: 'none',
  backgroundTasks: [
    { id: '1', command: 'npm test', status: 'running', startTime: Date.now() },
  ],
});

const { waitUntilExit } = render(<StatusBar />);

// Exit after 2 seconds
setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
