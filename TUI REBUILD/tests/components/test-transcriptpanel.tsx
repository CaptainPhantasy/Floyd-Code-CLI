/**
 * Test render for TranscriptPanel component
 * Run with: npx tsx tests/components/test-transcriptpanel.tsx
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../../src/store/tui-store.js';
import { TranscriptPanel } from '../../src/components/TranscriptPanel.js';

// Initialize store with test messages
useTuiStore.setState({
  mode: 'yolo',
  model: 'glm-4-plus',
  connectionStatus: 'online',
  isThinking: false,
  thinkingEnabled: true,
  whimsicalPhrase: null,
  messages: [
    {
      id: '1',
      role: 'user',
      content: 'Hello Floyd! How are you today?',
      timestamp: Date.now() - 10000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I am doing well! Thank you for asking. How can I help you with your code today?',
      timestamp: Date.now() - 5000,
    },
  ],
  streamingContent: '',
  overlayMode: 'none',
  backgroundTasks: [],
});

const { waitUntilExit } = render(<TranscriptPanel />);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
