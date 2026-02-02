#!/usr/bin/env node
import { render } from 'ink';
import { App } from './app.js';
import { TuiErrorBoundary } from './components/TuiErrorBoundary.js';

async function main() {
  // Check for interactive terminal support
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const hasSetRawMode = typeof process.stdin.setRawMode === 'function';
  
  if (!isTTY || !hasSetRawMode) {
    console.error('Error: FLOYD TUI requires an interactive terminal.');
    console.error('Run directly in a terminal (not via pipe, background, or non-TTY).');
    console.error('');
    console.error('Try: npm start');
    console.error('Or:  node dist/cli.js');
    process.exit(1);
  }

  const { waitUntilExit } = render(
    <TuiErrorBoundary>
      <App />
    </TuiErrorBoundary>
  );

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    process.exit(0);
  });

  await waitUntilExit();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
