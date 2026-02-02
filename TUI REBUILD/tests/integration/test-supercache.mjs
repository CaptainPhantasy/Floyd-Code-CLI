/**
 * Phase 3, Task 3.3: SUPERCACHE Integration Smoke Test
 *
 * Tests that persistence actually communicates with SUPERCACHE server
 */

import { saveCache, loadCache, clearState } from '../../dist/utils/persistence.js';

const SUPERCACHE_SERVER = '/Volumes/Storage/MCP/floyd-supercache-server/dist/index.js';

console.log('=== SUPERCACHE Integration Smoke Test ===\n');

// Test 1: Check server exists
console.log('Test 1: SUPERCACHE server exists');
import { existsSync } from 'fs';
const serverExists = existsSync(SUPERCACHE_SERVER);
console.log(`  Server path: ${SUPERCACHE_SERVER}`);
console.log(`  Exists: ${serverExists ? 'YES ✓' : 'NO ✗ FAILED'}\n`);

if (!serverExists) {
  console.error('✗ SUPERCACHE server not found - cannot proceed');
  process.exit(1);
}

// Test 2: Save and retrieve a value
console.log('Test 2: Save and retrieve value');
const testKey = `test:tui:${Date.now()}`;
const testValue = 'test-value-123';

try {
  const saved = await saveCache(testKey, testValue);
  console.log(`  saveCache("${testKey}", "${testValue}"): ${saved ? 'SUCCESS ✓' : 'FAILED ✗'}`);

  if (saved) {
    const loaded = await loadCache(testKey);
    console.log(`  loadCache("${testKey}"): "${loaded}" ${loaded === testValue ? '✓' : '✗ FAILED'}`);
  }
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

// Test 3: Save TUI mode
console.log('\nTest 3: Save TUI mode preference');
try {
  const modeSaved = await saveCache('tui:mode', 'ask');
  console.log(`  Saved mode "ask": ${modeSaved ? 'SUCCESS ✓' : 'FAILED ✗'}`);

  if (modeSaved) {
    const modeLoaded = await loadCache('tui:mode');
    console.log(`  Loaded mode: "${modeLoaded}" ${modeLoaded === 'ask' ? '✓' : '✗ FAILED'}`);
  }
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

// Test 4: Save TUI provider
console.log('\nTest 4: Save TUI provider configuration');
try {
  const providerSaved = await saveCache('tui:provider', 'openai');
  console.log(`  Saved provider "openai": ${providerSaved ? 'SUCCESS ✓' : 'FAILED ✗'}`);

  if (providerSaved) {
    const providerLoaded = await loadCache('tui:provider');
    console.log(`  Loaded provider: "${providerLoaded}" ${providerLoaded === 'openai' ? '✓' : '✗ FAILED'}`);
  }
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

// Test 5: Save TUI thinkingEnabled
console.log('\nTest 5: Save TUI thinkingEnabled');
try {
  const thinkingSaved = await saveCache('tui:thinkingEnabled', 'false');
  console.log(`  Saved thinkingEnabled "false": ${thinkingSaved ? 'SUCCESS ✓' : 'FAILED ✗'}`);

  if (thinkingSaved) {
    const thinkingLoaded = await loadCache('tui:thinkingEnabled');
    console.log(`  Loaded thinkingEnabled: "${thinkingLoaded}" ${thinkingLoaded === 'false' ? '✓' : '✗ FAILED'}`);
  }
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

// Test 6: Save complex JSON (recent messages)
console.log('\nTest 6: Save JSON (recent messages)');
try {
  const messages = [
    { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
    { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
  ];
  const jsonValue = JSON.stringify(messages);
  const jsonSaved = await saveCache('tui:recentMessages', jsonValue);
  console.log(`  Saved messages JSON: ${jsonSaved ? 'SUCCESS ✓' : 'FAILED ✗'}`);

  if (jsonSaved) {
    const jsonLoaded = await loadCache('tui:recentMessages');
    const parsed = JSON.parse(jsonLoaded);
    console.log(`  Loaded messages: ${parsed.length} items ${parsed.length === 2 ? '✓' : '✗ FAILED'}`);
  }
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

// Test 7: Load non-existent key returns null
console.log('\nTest 7: Load non-existent key returns null');
try {
  const notFound = await loadCache('tui:nonexistent:key');
  console.log(`  Result: ${notFound === null ? 'null ✓' : notFound === '' ? 'empty string (acceptable)' : '✗ FAILED'}`);
} catch (err) {
  console.log(`  Error: ${err.message} ✗`);
}

console.log('\n=== SUPERCACHE Integration Test Complete ===');
console.log('\n⚠️  Note: SUPERCACHE communication requires the server to be running.');
console.log('If tests failed, ensure the SUPERCACHE server is operational.');
