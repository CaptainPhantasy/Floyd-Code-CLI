/**
 * Test render for CommandPalette component
 * Run with: npx tsx tests/components/test-commandpalette.tsx
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../../src/store/tui-store.js';
import { CommandPalette } from '../../src/components/CommandPalette.js';

// Initialize store
useTuiStore.setState({
  mode: 'yolo',
  model: 'glm-4-plus',
  connectionStatus: 'online',
  isThinking: false,
  thinkingEnabled: true,
  whimsicalPhrase: null,
  messages: [],
  streamingContent: '',
  overlayMode: 'command',
  backgroundTasks: [],
});

const { waitUntilExit } = render(<CommandPalette />);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
