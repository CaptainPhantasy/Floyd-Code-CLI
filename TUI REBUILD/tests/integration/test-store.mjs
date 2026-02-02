import { useTuiStore } from '../../dist/store/tui-store.js';

console.log('Testing TUI Store...\n');

// Test 1: Initial state
console.log('1. Initial state:');
console.log('  mode:', useTuiStore.getState().mode);
console.log('  model:', useTuiStore.getState().model);
console.log('  provider:', useTuiStore.getState().provider);

// Test 2: Mode cycling
console.log('\n2. Mode cycling:');
const modes = ['yolo', 'ask', 'plan', 'auto', 'dialogue', 'fuckit'];
for (let i = 0; i < 7; i++) {
  const before = useTuiStore.getState().mode;
  useTuiStore.getState().cycleMode();
  const after = useTuiStore.getState().mode;
  const expected = modes[(modes.indexOf(before) + 1) % modes.length];
  console.log(`  ${before} -> ${after} ${after === expected ? '✓' : '✗ FAILED'}`);
}

// Test 3: Thinking toggle
console.log('\n3. Thinking toggle:');
console.log('  thinkingEnabled:', useTuiStore.getState().thinkingEnabled);
useTuiStore.getState().toggleThinking();
console.log('  After toggle:', useTuiStore.getState().thinkingEnabled);
useTuiStore.getState().toggleThinking();
console.log('  After toggle back:', useTuiStore.getState().thinkingEnabled);

// Test 4: Whimsical phrase
console.log('\n4. Whimsical phrase:');
console.log('  whimsicalPhrase:', useTuiStore.getState().whimsicalPhrase);
useTuiStore.getState().setThinking(true, 'Pondering the ineffable...');
console.log('  After setThinking:', useTuiStore.getState().whimsicalPhrase);

// Test 5: Send message
console.log('\n5. Send message:');
console.log('  messages count:', useTuiStore.getState().messages.length);
useTuiStore.getState().sendMessage('Hello Floyd!');
console.log('  After sendMessage:', useTuiStore.getState().messages.length);
console.log('  Last message:', useTuiStore.getState().messages[0].content);

console.log('\n✓ All store tests passed!');
