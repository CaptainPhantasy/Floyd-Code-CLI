import { ScreenSpec, LayoutNode } from './spec.js';

export function emitTsx(spec: ScreenSpec): string {
  const { nodes, meta } = spec;

  // Header
  let out = `import React from 'react';
import { Box, Text } from 'ink';
import { Frame } from './ui/Frame'; // Generated helper
import { theme } from './theme';

export const GeneratedScreen = () => {
  return (
    <Box flexDirection="column" width={${meta.cols}} height={${meta.rows}} borderStyle="single" borderColor="${spec.theme.tokens?.border?.color || 'gray'}">
`;

  // Sort nodes by Y then X
  const sorted = [...nodes].sort((a, b) => {
    if (a.rect.y === b.rect.y) return a.rect.x - b.rect.x;
    return a.rect.y - b.rect.y;
  });

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
        if (node.rect.y < currentYEnd) {
            currentRow.push(node);
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
      const rowHeight = Math.max(...rowNodes.map(n => n.rect.h));
      
      out += `      {/* Row ${i+1} */}\n`;
      out += `      <Box flexDirection="row" height={${rowHeight}}>\n`;
      
      let currentX = 0;
      
      rowNodes.forEach(node => {
          const gap = node.rect.x - currentX;
          if (gap > 0) {
              out += `        <Box width={${gap}} /> {/* Spacer */}\n`;
          }
          
          out += `        <Frame 
          title="${node.content?.title || node.name}" 
          width={${node.rect.w}} 
          height={${node.rect.h}} 
          color="${node.style.color || 'white'}"
          border={${node.style.border}}
          borderStyle="${node.style.borderStyle || 'round'}"
          padding={${node.style.padding || 0}}
        >\n`;
          
          // Enhanced Content Placeholder
          if (node.type === 'list') {
              out += `          <Text>• Item 1</Text>
          <Text>• Item 2</Text>
          <Text>• Item 3</Text>\n`;
          } else if (node.type === 'input') {
               out += `          <Text color="gray">Type command...</Text>\n`;
          } else if (node.type === 'header') {
               out += `          <Text bold>${(node.content?.title || node.name).toUpperCase()}</Text>\n`;
          } else if (node.type === 'log') {
              out += `          <Text dimColor>[10:00:01] System init...</Text>
          <Text dimColor>[10:00:02] Connected.</Text>
          <Text dimColor>[10:00:03] Waiting for input.</Text>\n`;
          } else if (node.type === 'table') {
              out += `          <Box flexDirection="row" borderStyle="single" borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
            <Box width="30%"><Text bold>ID</Text></Box>
            <Box width="70%"><Text bold>Status</Text></Box>
          </Box>
          <Box flexDirection="row"><Box width="30%"><Text>01</Text></Box><Box width="70%"><Text color="green">OK</Text></Box></Box>
          <Box flexDirection="row"><Box width="30%"><Text>02</Text></Box><Box width="70%"><Text color="yellow">Pending</Text></Box></Box>\n`;
          } else {
               out += `          <Text>Placeholder: ${node.type}</Text>\n`;
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