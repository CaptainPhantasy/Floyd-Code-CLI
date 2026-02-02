import React from 'react';
import { render } from 'ink';
import { DesignerWizard } from '../designer/DesignerWizard.js';
import { ScreenSpec } from '../generator/spec.js';
import fs from 'fs-extra';
import path from 'path';

interface DesignFlags {
  image?: string;
  cols?: number;
  rows?: number;
  out?: string;
}

export async function runDesign(flags: DesignFlags) {
  const cols = flags.cols || 80;
  const rows = flags.rows || 24;
  const savePath = flags.out || 'design-spec.json';

  const initialSpec: ScreenSpec = {
    meta: {
      name: 'Untitled Layout',
      createdAt: new Date().toISOString(),
      cols,
      rows,
      imagePath: flags.image
    },
    theme: { preset: 'floyd-neon' },
    nodes: []
  };

  // Check if spec exists to resume?
  if (fs.existsSync(savePath)) {
      try {
          const existing = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
          initialSpec.nodes = existing.nodes || [];
      } catch (e) {
          console.log("Could not load existing spec, starting fresh.");
      }
  }

  // Clear screen slightly
  console.clear();

  const { waitUntilExit } = render(
    <DesignerWizard initialSpec={initialSpec} savePath={savePath} />
  );

  await waitUntilExit();
}
