/**
 * Test render for HelpOverlay component
 * Run with: npx tsx tests/components/test-helpoverlay.tsx
 */

import React from 'react';
import { render } from 'ink';
import { HelpOverlay } from '../../src/components/HelpOverlay.js';

const { waitUntilExit } = render(<HelpOverlay />);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
