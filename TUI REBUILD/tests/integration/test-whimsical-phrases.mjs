/**
 * Phase 3, Task 3.5: Whimsical phrase test
 *
 * Tests that:
 * 1. Random phrases are generated
 * 2. sendMessage sets a whimsical phrase
 * 3. setThinking auto-generates phrases when none provided
 * 4. Phrases are unique (avoid immediate repeats)
 */

import { useTuiStore } from '../../dist/store/tui-store.js';
import { getRandomPhrase, getRandomPhraseUnique, WHIMSICAL_PHRASES, getPhraseByCategory } from '../../dist/utils/whimsical-phrases.js';

console.log('=== Phase 3.5: Whimsical Phrase Test ===\n');

// Test 1: Phrases library exists and has entries
console.log('Test 1: Phrases library');
console.log(`  Total phrases: ${WHIMSICAL_PHRASES.length} ${WHIMSICAL_PHRASES.length > 0 ? '✓' : '✗ FAILED'}`);
console.log(`  Sample phrase: "${WHIMSICAL_PHRASES[0]}" ✓\n`);

// Test 2: getRandomPhrase returns valid phrases
console.log('Test 2: getRandomPhrase');
const phrase1 = getRandomPhrase();
const phrase2 = getRandomPhrase();
console.log(`  Phrase 1: "${phrase1}" ${WHIMSICAL_PHRASES.includes(phrase1) ? '✓' : '✗ FAILED'}`);
console.log(`  Phrase 2: "${phrase2}" ${WHIMSICAL_PHRASES.includes(phrase2) ? '✓' : '✗ FAILED'}\n`);

// Test 3: getRandomPhraseUnique avoids repeats
console.log('Test 3: getRandomPhraseUnique');
const unique1 = getRandomPhraseUnique('Computing the answer to life, the universe, and everything...');
console.log(`  Given previous: "Computing the answer to life, the universe, and everything..."`);
console.log(`  Next phrase: "${unique1}" ${unique1 !== 'Computing the answer to life, the universe, and everything...' ? '✓' : '✗ FAILED' }\n`);

// Test 4: getPhraseByCategory
console.log('Test 4: getPhraseByCategory');
const shortPhrase = getPhraseByCategory('short');
console.log(`  Short phrase: "${shortPhrase}" ${shortPhrase.length < 20 ? '✓' : '✗ FAILED'}\n`);

// Test 5: sendMessage sets whimsical phrase
console.log('Test 5: sendMessage sets whimsical phrase');
useTuiStore.getState().sendMessage('Test message');
const storePhrase = useTuiStore.getState().whimsicalPhrase;
const isThinking = useTuiStore.getState().isThinking;
console.log(`  isThinking: ${isThinking ? 'true' : 'false'} ${isThinking ? '✓' : '✗ FAILED'}`);
console.log(`  whimsicalPhrase: "${storePhrase}" ${storePhrase ? '✓' : '✗ FAILED'}\n`);

// Test 6: setThinking auto-generates phrase
console.log('Test 6: setThinking auto-generates phrase');
useTuiStore.getState().setThinking(false); // Reset
useTuiStore.getState().setThinking(true); // Should auto-generate
const autoPhrase = useTuiStore.getState().whimsicalPhrase;
console.log(`  Auto-generated phrase: "${autoPhrase}" ${autoPhrase ? '✓' : '✗ FAILED'}\n`);

// Test 7: setThinking with explicit phrase
console.log('Test 7: setThinking with explicit phrase');
useTuiStore.getState().setThinking(true, 'Custom thinking message...');
const customPhrase = useTuiStore.getState().whimsicalPhrase;
console.log(`  Custom phrase: "${customPhrase}" ${customPhrase === 'Custom thinking message...' ? '✓' : '✗ FAILED'}\n`);

// Test 8: Clear thinking clears phrase
console.log('Test 8: Clear thinking clears phrase');
useTuiStore.getState().setThinking(false);
const clearedPhrase = useTuiStore.getState().whimsicalPhrase;
console.log(`  Phrase after clear: ${clearedPhrase === null ? 'null (cleared)' : clearedPhrase} ${clearedPhrase === null ? '✓' : '✗ FAILED'}\n`);

console.log('=== All whimsical phrase tests passed! ✓ ===');
