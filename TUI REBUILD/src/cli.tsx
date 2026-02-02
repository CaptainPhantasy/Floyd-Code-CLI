#!/usr/bin/env node
import { render } from 'ink';
import { App } from './app.js';

async function main() {
  const { waitUntilExit } = render(<App />);

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
