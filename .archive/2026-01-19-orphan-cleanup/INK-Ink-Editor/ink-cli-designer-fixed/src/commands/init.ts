import fs from 'fs-extra';
import path from 'path';
import { emitTheme } from '../generator/emitTheme.js';
import { ScreenSpec } from '../generator/spec.js';

interface InitFlags {
  cols?: number;
  rows?: number;
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

export async function runInit(flags: InitFlags) {
  const cols = flags.cols ?? 80;
  const rows = flags.rows ?? 24;
  const specPath = flags.out ?? 'design-spec.json';

  const spec: ScreenSpec = {
    meta: {
      name: 'Untitled Layout',
      createdAt: new Date().toISOString(),
      cols,
      rows,
    },
    theme: { preset: 'floyd-neon' },
    nodes: [],
  };

  fs.ensureDirSync(path.dirname(specPath) === '.' ? process.cwd() : path.dirname(specPath));
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  fs.ensureDirSync('generated/ui');
  fs.writeFileSync('generated/theme.ts', emitTheme());
  fs.writeFileSync('generated/ui/Frame.tsx', emitFrame());
}
