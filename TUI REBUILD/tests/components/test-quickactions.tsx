/**
 * Test render for QuickActions component
 * Run with: npx tsx tests/components/test-quickactions.tsx
 */

import React from 'react';
import { render } from 'ink';
import { QuickActions } from '../../src/components/QuickActions.js';

const { waitUntilExit } = render(
  <QuickActions 
    onApply={() => console.log('Apply')}
    onExplain={() => console.log('Explain')}
    onDiff={() => console.log('Diff')}
    onUndo={() => console.log('Undo')}
  />
);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
