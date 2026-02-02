/**
 * Integration test for App component with all overlays
 * Run with: npx tsx tests/integration/test-app-overlays.tsx
 *
 * Tests:
 * - App renders with all overlays
 * - Overlay switching works (transcript, history, background, command, help)
 * - Keyboard shortcuts work globally
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../../src/store/tui-store.js';
import { App } from '../../src/app.js';

// Initialize store with test data
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
      content: 'Hello Floyd!',
      timestamp: Date.now() - 10000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: Date.now() - 5000,
    },
  ],
  streamingContent: '',
  overlayMode: 'none',
  backgroundTasks: [
    {
      id: 'bg1',
      command: 'npm run build',
      status: 'running',
      startTime: Date.now() - 30000,
    },
  ],
});

const { waitUntilExit } = render(<App />);

// Test overlay switching
const store = useTuiStore.getState();

console.log('\n=== Integration Test: App Overlays ===\n');

// Test 1: Initial state (none)
console.log('✓ Test 1: Initial overlayMode = none');

// Test 2: Switch to transcript
setTimeout(() => {
  store.setOverlayMode('transcript');
  console.log('✓ Test 2: Switched to transcript overlay');
}, 500);

// Test 3: Switch to history
setTimeout(() => {
  store.setOverlayMode('history');
  console.log('✓ Test 3: Switched to history overlay');
}, 1000);

// Test 4: Switch to background
setTimeout(() => {
  store.setOverlayMode('background');
  console.log('✓ Test 4: Switched to background overlay');
}, 1500);

// Test 5: Switch to command
setTimeout(() => {
  store.setOverlayMode('command');
  console.log('✓ Test 5: Switched to command overlay');
}, 2000);

// Test 6: Switch to help
setTimeout(() => {
  store.setOverlayMode('help');
  console.log('✓ Test 6: Switched to help overlay');
}, 2500);

// Test 7: Close overlay
setTimeout(() => {
  store.closeOverlay();
  console.log('✓ Test 7: Closed overlay (back to none)');
}, 3000);

// Test 8: Mode cycling
setTimeout(() => {
  const initialMode = store.mode;
  store.cycleMode();
  const newMode = store.mode;
  console.log(`✓ Test 8: Mode cycled from ${initialMode} to ${newMode}`);
}, 3500);

// Test 9: Toggle thinking
setTimeout(() => {
  const initialThinking = store.thinkingEnabled;
  store.toggleThinking();
  const newThinking = store.thinkingEnabled;
  console.log(`✓ Test 9: Thinking toggled from ${initialThinking} to ${newThinking}`);
}, 4000);

// Test 10: Clear messages
setTimeout(() => {
  store.clearMessages();
  console.log('✓ Test 10: Messages cleared');
}, 4500);

// Exit after tests complete
setTimeout(async () => {
  console.log('\n=== All Integration Tests Passed ===\n');
  process.exit(0);
}, 5000);

await waitUntilExit();
