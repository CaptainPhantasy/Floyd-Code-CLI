// Nested TSX Generator - supports hierarchical layouts with children
// This handles specs with nested children arrays for complex layouts

interface NestedNode {
  id: string;
  name: string;
  type: string;
  rect: { x: number; y: number; w: number; h: number };
  style: {
    border: boolean;
    borderStyle: 'single' | 'round' | 'double' | 'bold';
    padding: number;
    color: string;
  };
  content?: { title?: string };
  children?: NestedNode[];
}

interface NestedSpec {
  meta: { name: string; cols: number; rows: number };
  theme: { preset: string };
  nodes: NestedNode[];
}

function getContentPlaceholder(type: string, name: string, indent: string = '  '): string {
  switch (type) {
    case 'list':
      return `${indent}<Box flexDirection="column">\n${indent}  <Text dimColor>• Item 1</Text>\n${indent}  <Text dimColor>• Item 2</Text>\n${indent}  <Text dimColor>• Item 3</Text>\n${indent}</Box>`;
    case 'table':
      return `${indent}<Box flexDirection="column">\n${indent}  <Text dimColor>ID   STATUS    LAST</Text>\n${indent}  <Text dimColor>001  Working   00:42:14</Text>\n${indent}  <Text dimColor>002  Idle      00:41:59</Text>\n${indent}</Box>`;
    case 'log':
      return `${indent}<Box flexDirection="column">\n${indent}  <Text dimColor>[00:42:11] event.started</Text>\n${indent}  <Text dimColor>[00:42:12] tool.requested</Text>\n${indent}  <Text dimColor>[00:42:13] worker.state</Text>\n${indent}</Box>`;
    case 'input':
      return `${indent}<Text color="gray">Press Enter to interact...</Text>`;
    case 'header':
      return `${indent}<Text bold color="magenta">${name.toUpperCase()}</Text>`;
    case 'status':
      return `${indent}<Text>CPU 18% • MEM 7.2GB • Load 0.58</Text>`;
    default:
      return `${indent}<Text dimColor>${type.toUpperCase()}</Text>`;
  }
}

function calculateFlexGrow(nodeSize: number, parentSize: number): number {
  // Convert to flexGrow ratio
  // Ensure minimum of 1 for major sections to guarantee expansion
  const ratio = parentSize > 0 ? nodeSize / parentSize : 1;
  // For major sections, ensure at least 1, otherwise use calculated ratio
  return ratio < 0.1 ? 1 : Math.max(ratio, 0.1);
}

function renderNode(
  node: NestedNode, 
  parentWidth: number = 0, 
  parentHeight: number = 0,
  indent: string = '      '
): string {
  // If this is a container (no border, has children), render children directly
  if (!node.style.border && node.children && node.children.length > 0) {
    // Container node - use flexGrow based on parent proportions
    const flexGrow = parentHeight > 0 ? calculateFlexGrow(node.rect.h, parentHeight) : 1;
    let out = `${indent}{/* ${node.name} */}\n`;
    out += `${indent}<Box flexDirection="column" flexGrow={${flexGrow}}>\n`;
    
    // Group children by Y position for row layout
    const rows = groupByRows(node.children);
    
    rows.forEach((rowNodes, rowIdx) => {
      if (rowNodes.length === 1) {
        // Single node in row - use flexGrow based on height
        const childFlexGrow = calculateFlexGrow(rowNodes[0].rect.h, node.rect.h);
        out += `${indent}  <Box flexGrow={${childFlexGrow}}>\n`;
        out += renderNode(rowNodes[0], node.rect.w, node.rect.h, indent + '    ');
        out += `${indent}  </Box>\n`;
      } else {
        // Multiple nodes in row - use flexDirection="row"
        const rowHeight = Math.max(...rowNodes.map(n => n.rect.h));
        const rowFlexGrow = calculateFlexGrow(rowHeight, node.rect.h);
        out += `${indent}  <Box flexDirection="row" flexGrow={${rowFlexGrow}}>\n`;
        
        rowNodes.forEach(child => {
          // Calculate flexGrow for each child based on width ratio
          const childFlexGrow = calculateFlexGrow(child.rect.w, node.rect.w);
          out += `${indent}    <Box flexGrow={${childFlexGrow}}>\n`;
          out += renderNode(child, child.rect.w, child.rect.h, indent + '      ');
          out += `${indent}    </Box>\n`;
        });
        out += `${indent}  </Box>\n`;
      }
    });
    
    out += `${indent}</Box>\n`;
    return out;
  }
  
  // Leaf node or bordered node - render as Frame
  const hasBorder = node.style.border;
  const title = node.content?.title || '';
  
  // For bordered panels, use flexGrow but also set minWidth/minHeight for very small panels
  const minWidth = node.rect.w < 20 ? node.rect.w : undefined;
  const minHeight = node.rect.h < 5 ? node.rect.h : undefined;
  
  let out = `${indent}<Frame\n`;
  out += `${indent}  title="${title}"\n`;
  if (minWidth) {
    out += `${indent}  minWidth={${minWidth}}\n`;
  }
  if (minHeight) {
    out += `${indent}  minHeight={${minHeight}}\n`;
  }
  out += `${indent}  flexGrow={1}\n`;
  out += `${indent}  color="${node.style.color}"\n`;
  out += `${indent}  border={${hasBorder}}\n`;
  out += `${indent}  borderStyle="${node.style.borderStyle}"\n`;
  out += `${indent}  padding={${node.style.padding}}\n`;
  out += `${indent}>\n`;
  
  // Add content placeholder or recurse into children
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      out += renderNode(child, node.rect.w, node.rect.h, indent + '  ');
    });
  } else {
    out += getContentPlaceholder(node.type, node.name, indent + '  ') + '\n';
  }
  
  out += `${indent}</Frame>\n`;
  return out;
}

function groupByRows(nodes: NestedNode[]): NestedNode[][] {
  // Sort by Y then X
  const sorted = [...nodes].sort((a, b) => {
    if (a.rect.y === b.rect.y) return a.rect.x - b.rect.x;
    return a.rect.y - b.rect.y;
  });
  
  const rows: NestedNode[][] = [];
  let currentRow: NestedNode[] = [];
  let currentYEnd = -1;
  
  sorted.forEach(node => {
    if (currentRow.length === 0) {
      currentRow.push(node);
      currentYEnd = node.rect.y + node.rect.h;
    } else if (node.rect.y < currentYEnd) {
      // Overlaps with current row
      currentRow.push(node);
      currentYEnd = Math.max(currentYEnd, node.rect.y + node.rect.h);
    } else {
      // New row
      rows.push(currentRow);
      currentRow = [node];
      currentYEnd = node.rect.y + node.rect.h;
    }
  });
  
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

export function emitNestedTsx(spec: NestedSpec): string {
  const { nodes, meta } = spec;
  
  let out = `import React from 'react';
import { Box, Text, useApp } from 'ink';
import { Frame } from './ui/Frame';

/**
 * Generated from: ${meta.name}
 * Original spec dimensions: ${meta.cols}x${meta.rows}
 * This layout uses flexGrow to fill available terminal space
 */
export const MonitorDashboard: React.FC = () => {
  const { exit } = useApp();
  
  return (
    <Box flexDirection="column" flexGrow={1} minHeight={${meta.rows}}>
`;

  // Group top-level nodes by rows
  const rows = groupByRows(nodes);
  
  rows.forEach((rowNodes, rowIdx) => {
    if (rowNodes.length === 1) {
      // Single node in row - use flexGrow based on height proportion
      const flexGrow = calculateFlexGrow(rowNodes[0].rect.h, meta.rows);
      out += `      <Box flexGrow={${flexGrow}} flexDirection="column">\n`;
      out += renderNode(rowNodes[0], meta.cols, meta.rows, '        ');
      out += `      </Box>\n`;
    } else {
      // Multiple nodes in row - use flexDirection="row" with flexGrow={1} to fill width
      const rowHeight = Math.max(...rowNodes.map(n => n.rect.h));
      const rowFlexGrow = calculateFlexGrow(rowHeight, meta.rows);
      out += `      <Box flexDirection="row" flexGrow={${rowFlexGrow}}>\n`;
      rowNodes.forEach(node => {
        // Calculate flexGrow based on width ratio, ensure it expands
        const childFlexGrow = calculateFlexGrow(node.rect.w, meta.cols);
        out += `        <Box flexGrow={${childFlexGrow}} flexDirection="column">\n`;
        out += renderNode(node, node.rect.w, node.rect.h, '          ');
        out += `        </Box>\n`;
      });
      out += `      </Box>\n`;
    }
  });

  out += `    </Box>
  );
};
`;

  return out;
}
