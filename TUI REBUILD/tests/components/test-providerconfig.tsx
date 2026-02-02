/**
 * Test render for ProviderConfig component
 * Run with: npx tsx tests/components/test-providerconfig.tsx
 */

import React from 'react';
import { render } from 'ink';
import { ProviderConfig } from '../../src/components/ProviderConfig.js';

const { waitUntilExit } = render(
  <ProviderConfig 
    onComplete={(config) => console.log('Config:', config)}
  />
);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
