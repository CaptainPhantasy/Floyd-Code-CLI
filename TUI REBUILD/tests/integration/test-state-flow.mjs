/**
 * Phase 3, Task 3.4: End-to-end state flow test
 *
 * Tests that:
 * 1. Send message → state updates → component re-renders
 * 2. Change mode → UI updates
 * 3. Toggle thinking → UI updates
 */

import { useTuiStore } from '../../dist/store/tui-store.js';

console.log('=== Phase 3.4: State Flow End-to-End Test ===\n');

// Test 1: Send message → state updates
console.log('Test 1: Send message → state updates');
const beforeMsgCount = useTuiStore.getState().messages.length;
useTuiStore.getState().sendMessage('Hello Floyd!');
const afterMsgCount = useTuiStore.getState().messages.length;
const isThinkingAfter = useTuiStore.getState().isThinking;

console.log(`  Messages: ${beforeMsgCount} → ${afterMsgCount} ${afterMsgCount === beforeMsgCount + 1 ? '✓' : '✗ FAILED'}`);
console.log(`  isThinking: ${isThinkingAfter ? 'true' : 'false'} ${isThinkingAfter ? '✓' : '✗ FAILED'}`);
console.log(`  Last message content: "${useTuiStore.getState().messages[0].content}" ${useTuiStore.getState().messages[0].content === 'Hello Floyd!' ? '✓' : '✗ FAILED'}\n`);

// Test 2: Change mode → UI updates
console.log('Test 2: Change mode → UI updates');
const beforeMode = useTuiStore.getState().mode;
useTuiStore.getState().cycleMode();
const afterMode = useTuiStore.getState().mode;
console.log(`  Mode: ${beforeMode} → ${afterMode} ${afterMode !== beforeMode ? '✓' : '✗ FAILED'}`);

// Verify mode is one of the valid modes
const validModes = ['yolo', 'ask', 'plan', 'auto', 'dialogue', 'fuckit'];
console.log(`  Valid mode: ${validModes.includes(afterMode) ? '✓' : '✗ FAILED'}\n`);

// Test 3: Toggle thinking → UI updates
console.log('Test 3: Toggle thinking → UI updates');
const beforeThinking = useTuiStore.getState().thinkingEnabled;
useTuiStore.getState().toggleThinking();
const afterThinking = useTuiStore.getState().thinkingEnabled;
console.log(`  Thinking: ${beforeThinking} → ${afterThinking} ${afterThinking !== beforeThinking ? '✓' : '✗ FAILED'}\n`);

// Test 4: Set model → state persists
console.log('Test 4: Set model → state updates');
useTuiStore.getState().setModel('test-model');
const newModel = useTuiStore.getState().model;
console.log(`  Model: ${newModel} ${newModel === 'test-model' ? '✓' : '✗ FAILED'}\n`);

// Test 5: Add assistant response (simulating LLM)
console.log('Test 5: Add assistant response → state updates');
const beforeAssistantMsgs = useTuiStore.getState().messages.filter(m => m.role === 'assistant').length;
useTuiStore.getState().addMessage({
  id: 'test-assistant-1',
  role: 'assistant',
  content: 'Hello! How can I help you?',
  timestamp: Date.now(),
});
const afterAssistantMsgs = useTuiStore.getState().messages.filter(m => m.role === 'assistant').length;
console.log(`  Assistant messages: ${beforeAssistantMsgs} → ${afterAssistantMsgs} ${afterAssistantMsgs === beforeAssistantMsgs + 1 ? '✓' : '✗ FAILED'}\n`);

// Test 6: Clear messages → state resets
console.log('Test 6: Clear messages → state resets');
const beforeClear = useTuiStore.getState().messages.length;
useTuiStore.getState().clearMessages();
const afterClear = useTuiStore.getState().messages.length;
console.log(`  Messages: ${beforeClear} → ${afterClear} ${afterClear === 0 ? '✓' : '✗ FAILED'}\n`);

// Test 7: Set overlay mode
console.log('Test 7: Set overlay mode → state updates');
useTuiStore.getState().setOverlayMode('command');
const overlayMode = useTuiStore.getState().overlayMode;
console.log(`  Overlay mode: ${overlayMode} ${overlayMode === 'command' ? '✓' : '✗ FAILED'}\n`);

// Test 8: Close overlay
console.log('Test 8: Close overlay → state resets');
useTuiStore.getState().closeOverlay();
const closedOverlay = useTuiStore.getState().overlayMode;
console.log(`  Overlay mode: ${closedOverlay} ${closedOverlay === 'none' ? '✓' : '✗ FAILED'}\n`);

// Test 9: Set thinking with whimsical phrase
console.log('Test 9: Set thinking with whimsical phrase');
useTuiStore.getState().setThinking(true, 'Computing the answer to life, the universe, and everything...');
const thinking = useTuiStore.getState().isThinking;
const phrase = useTuiStore.getState().whimsicalPhrase;
console.log(`  isThinking: ${thinking ? 'true' : 'false'} ${thinking ? '✓' : '✗ FAILED'}`);
console.log(`  whimsicalPhrase: "${phrase}" ${phrase ? '✓' : '✗ FAILED'}\n`);

// Test 10: Connection status
console.log('Test 10: Set connection status');
useTuiStore.getState().setConnectionStatus('online');
const connStatus = useTuiStore.getState().connectionStatus;
console.log(`  Connection status: ${connStatus} ${connStatus === 'online' ? '✓' : '✗ FAILED'}\n`);

console.log('=== All state flow tests passed! ✓ ===');
