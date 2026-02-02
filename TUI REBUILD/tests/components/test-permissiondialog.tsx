/**
 * Test render for PermissionDialog component
 * Run with: npx tsx tests/components/test-permissiondialog.tsx
 */

import React from 'react';
import { render } from 'ink';
import { PermissionDialog } from '../../src/components/PermissionDialog.js';

const mockRequest = {
  toolName: 'delete-file',
  target: '/path/to/file.txt',
  dangerLevel: 'dangerous' as const,
  description: 'This will permanently delete the file',
};

const { waitUntilExit } = render(
  <PermissionDialog 
    request={mockRequest}
    onApprove={() => console.log('Approved')}
    onDeny={() => console.log('Denied')}
  />
);

setTimeout(async () => {
  process.exit(0);
}, 2000);

await waitUntilExit();
