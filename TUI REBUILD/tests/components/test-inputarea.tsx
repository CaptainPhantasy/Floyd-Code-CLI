/**
 * Test render for InputArea component
 * Run with: npx tsx tests/components/test-inputarea.tsx
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../../src/store/tui-store.js';
import { InputArea } from '../../src/components/InputArea.js';

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
  overlayMode: 'none',
  backgroundTasks: [],
});

const { waitUntilExit } = render(<InputArea />);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
