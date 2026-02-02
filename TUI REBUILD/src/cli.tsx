#!/usr/bin/env node
import { render } from 'ink';
import { App } from './app.js';
import { TuiErrorBoundary } from './components/TuiErrorBoundary.js';

async function main() {
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
