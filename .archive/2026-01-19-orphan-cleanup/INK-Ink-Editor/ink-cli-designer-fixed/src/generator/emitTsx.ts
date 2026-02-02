import { ScreenSpec, LayoutNode } from './spec.js';

// Heuristic Generator
// Instead of a perfect constraint solver, we will use the "Absolute Grid" pattern
// which is robust for generated code. We create a container Box with relative positioning
// and place items inside it using specific margins to simulate absolute coordinates.
// Ink doesn't support absolute positioning, so we have to use Flexbox.
// 
// Strategy: 
// 1. Sort nodes by Y, then X.
// 2. We can't easily flatten arbitrary rects to Flexbox without a complex engine.
// 3. FALLBACK: We generate a <Box width={W} height={H}> where every child is a <Box> 
//    that uses `marginTop` and `marginLeft` to position itself relative to the previous flow?
//    No, that's messy.
// 4. BETTER STRATEGY: We will output a component that uses a "Canvas" concept.
//    Ideally, we'd output clean rows/cols, but for this specific tool, 
//    valid React code is the priority.
//
//    Let's try to detect simple rows.
//    1. Group nodes that have the same Y and H.
//    2. Output a <Box flexDirection="row"> for them.
//    3. Any node that doesn't align gets its own Row.

export function emitTsx(spec: ScreenSpec): string {
  const { nodes, meta } = spec;

  // Header
  const screenBorderColor = 'gray';
  let out = `import React from 'react';
import { Box, Text } from 'ink';
import { Frame } from './ui/Frame';
import { theme } from './theme';

export const GeneratedScreen = () => {
  return (
    <Box flexDirection="column" width={${meta.cols}} height={${meta.rows}} borderStyle="single" borderColor="${screenBorderColor}">
`;

  // Sort nodes by Y then X
  const sorted = [...nodes].sort((a, b) => {
    if (a.rect.y === b.rect.y) return a.rect.x - b.rect.x;
    return a.rect.y - b.rect.y;
  });

  // Simple "Stack" generation
  // We will wrap every node in a Box that tries to position it.
  // Since we can't do absolute, we will rely on the user having created "bands" (rows).
  // If the user created a chaotic layout, this will look weird in standard Ink.
  // 
  // Improved Logic:
  // Detect overlapping Y-intervals to form "Rows".
  
  const rows: LayoutNode[][] = [];
  let currentRow: LayoutNode[] = [];
  let currentYStart = -1;
  let currentYEnd = -1;

  sorted.forEach(node => {
    if (currentRow.length === 0) {
        currentRow.push(node);
        currentYStart = node.rect.y;
        currentYEnd = node.rect.y + node.rect.h;
    } else {
        // Does this node overlap significantly with the current row's Y band?
        // Simple heuristic: if it starts within the current band, add it.
        if (node.rect.y < currentYEnd) {
            currentRow.push(node);
            // Extend band if needed? Usually rows are uniform height in CLI.
            currentYEnd = Math.max(currentYEnd, node.rect.y + node.rect.h);
        } else {
            rows.push(currentRow);
            currentRow = [node];
            currentYStart = node.rect.y;
            currentYEnd = node.rect.y + node.rect.h;
        }
    }
  });
  if (currentRow.length > 0) rows.push(currentRow);

  // Render Rows
  rows.forEach((rowNodes, i) => {
      // Sort inside row by X
      rowNodes.sort((a,b) => a.rect.x - b.rect.x);
      
      // Determine row height (max of nodes)
      const rowHeight = Math.max(...rowNodes.map(n => n.rect.h));
      
      out += `      {/* Row ${i+1} */}\n`;
      out += `      <Box flexDirection="row" height={${rowHeight}}>\n`;
      
      let currentX = 0;
      
      rowNodes.forEach(node => {
          // Spacer?
          const gap = node.rect.x - currentX;
          if (gap > 0) {
              out += `        <Box width={${gap}} /> {/* Spacer */}\n`;
          }
          
          // The Node
          out += `        <Frame 
          title="${node.content?.title || node.name}" 
          width={${node.rect.w}} 
          height={${node.rect.h}} 
          color="${node.style.color || 'white'}"
          border={${node.style.border}}
          borderStyle="${node.style.borderStyle}"
          padding={${node.style.padding}}
        >\n`;
          
          // Content Placeholder based on Type (no lorem ipsum; useful labels)
          switch (node.type) {
            case 'list':
              out += `          <Text>• JOB QUEUE\n• ACTIVE TASKS\n• UPCOMING</Text>\n`;
              break;
            case 'table':
              out += `          <Text>ID   STATUS    ETA\n001  READY     0:12\n002  RUNNING   1:05\n003  BLOCKED   --</Text>\n`;
              break;
            case 'log':
              out += `          <Text dimColor>[10:41:02] booting...\n[10:41:03] loading config\n[10:41:05] connected\n[10:41:07] streaming\n[10:41:10] ok</Text>\n`;
              break;
            case 'input':
              out += `          <Text color="gray">COMMAND PALETTE...</Text>\n`;
              break;
            case 'header':
              out += `          <Text bold>${node.name.toUpperCase()}</Text>\n`;
              break;
            case 'status':
              out += `          <Text>STATUS: OK  •  MODE: DESIGN  •  FPS: 60</Text>\n`;
              break;
            default:
              out += `          <Text dimColor>${node.content?.placeholderText || node.type.toUpperCase()}</Text>\n`;
          }

          out += `        </Frame>\n`;
          
          currentX = node.rect.x + node.rect.w;
      });
      
      out += `      </Box>\n`;
  });

  out += `    </Box>
  );
};
`;

  return out;
}
