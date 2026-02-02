import fs from 'fs-extra';
import path from 'path';
import { ScreenSpecSchema } from '../generator/spec.js';
import { emitTsx } from '../generator/emitTsx.js';
import { emitNestedTsx } from '../generator/emitNestedTsx.js';
import { emitTheme } from '../generator/emitTheme.js';

interface GenerateFlags {
  spec?: string;
  out?: string;
}

function emitFrame(): string {
  return `import React from 'react';
import { Box, Text } from 'ink';

export type FrameBorderStyle = 'single' | 'round' | 'double' | 'bold';

interface FrameProps {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  flexGrow?: number;
  border?: boolean;
  borderStyle?: FrameBorderStyle;
  padding?: 0 | 1 | 2;
  color?: string;
  children?: React.ReactNode;
}

export const Frame: React.FC<FrameProps> = ({ 
  title,
  width,
  height,
  minWidth,
  minHeight,
  flexGrow,
  border = true,
  borderStyle = 'round',
  padding = 0,
  color = 'white',
  children,
}) => {
  return (
    <Box 
      width={width} 
      height={height}
      minWidth={minWidth}
      minHeight={minHeight}
      flexGrow={flexGrow}
      borderStyle={border ? borderStyle : undefined} 
      borderColor={color}
      flexDirection="column"
      paddingX={padding}
      paddingY={padding}
    >
      {title && (
        <Box marginTop={-1} marginLeft={1}>
           <Text color={color} bold> {title} </Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
};
`;
}

// Check if spec has nested children
function hasNestedChildren(nodes: any[]): boolean {
  return nodes.some(n => n.children && Array.isArray(n.children) && n.children.length > 0);
}

export async function runGenerate(flags: GenerateFlags) {
  const specPath = flags.spec ?? 'design-spec.json';
  const outDir = flags.out ?? 'generated';

  if (!fs.existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  
  // Check if this is a nested spec (has children arrays)
  const isNested = raw.nodes && hasNestedChildren(raw.nodes);
  
  if (isNested) {
    // Use nested generator - skip zod validation for nested specs
    console.log('Detected nested spec format, using nested generator...');
    fs.ensureDirSync(outDir);
    fs.ensureDirSync(path.join(outDir, 'ui'));
    
    fs.writeFileSync(path.join(outDir, 'theme.ts'), emitTheme());
    fs.writeFileSync(path.join(outDir, 'MonitorDashboard.tsx'), emitNestedTsx(raw));
    fs.writeFileSync(path.join(outDir, 'ui', 'Frame.tsx'), emitFrame());
    return;
  }

  // Standard flat spec - use zod validation
  const parsed = ScreenSpecSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new Error(`Spec validation failed:\n${issues}`);
  }

  fs.ensureDirSync(outDir);
  fs.ensureDirSync(path.join(outDir, 'ui'));

  fs.writeFileSync(path.join(outDir, 'theme.ts'), emitTheme());
  fs.writeFileSync(path.join(outDir, 'GeneratedScreen.tsx'), emitTsx(parsed.data));
  fs.writeFileSync(path.join(outDir, 'ui', 'Frame.tsx'), emitFrame());
}
