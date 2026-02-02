/**
 * Headless Smoke Test for FLOYD TUI
 * Run with: npx tsx tests/smoke-test.tsx
 *
 * This test verifies the application can boot without hanging.
 * It runs without a TTY and checks for the APP_BOOT_OK marker.
 */

import React from 'react';
import { render } from 'ink';
import { useTuiStore } from '../src/store/tui-store.js';
import { App } from '../src/app.js';

console.log('=== SMOKE TEST START ===');

// Initialize store with minimal test data
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
  _initialized: true,
});

let bootOkReceived = false;
let renderStarted = false;

// Capture console output to check for APP_BOOT_OK
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const message = args.join(' ');
  if (message.includes('APP_BOOT_OK')) {
    bootOkReceived = true;
    originalLog('✓ Received APP_BOOT_OK marker');
  } else {
    originalLog(...args);
  }
};

// Set a timeout for the test
const TEST_TIMEOUT = 5000; // 5 seconds
const startTime = Date.now();

// Render the app (this will trigger initialization)
try {
  const { waitUntilExit } = render(<App />);
  renderStarted = true;
  originalLog('✓ App rendered successfully');
} catch (error) {
  originalLog('✗ Render failed: ' + (error as Error).message);
  process.exit(1);
}

// Wait for boot marker or timeout
const checkInterval = setInterval(() => {
  const elapsed = Date.now() - startTime;

  if (bootOkReceived) {
    clearInterval(checkInterval);
    console.log = originalLog; // Restore console.log

    console.log('=== SMOKE TEST RESULTS ===');
    console.log('✓ Render started:', renderStarted);
    console.log('✓ APP_BOOT_OK received:', bootOkReceived);
    console.log('✓ Elapsed time:', elapsed + 'ms');
    console.log('=== SMOKE_TEST_PASS ===');

    process.exit(0);
  }

  if (elapsed > TEST_TIMEOUT) {
    clearInterval(checkInterval);
    console.log = originalLog; // Restore console.log

    console.log('=== SMOKE TEST RESULTS ===');
    console.log('✓ Render started:', renderStarted);
    console.log('✗ APP_BOOT_OK received:', bootOkReceived);
    console.log('✗ Test timeout after ' + elapsed + 'ms');
    console.log('=== SMOKE_TEST_FAIL ===');

    process.exit(1);
  }
}, 100);

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.log = originalLog;
  console.log('✗ Uncaught exception:', (error as Error).message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.log = originalLog;
  console.log('✗ Unhandled rejection:', reason);
  process.exit(1);
});
