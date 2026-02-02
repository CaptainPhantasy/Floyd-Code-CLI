import React from 'react';
import { Box, Text } from 'ink';

// A generic wrapper that handles borders and titles commonly used in the generated code
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
