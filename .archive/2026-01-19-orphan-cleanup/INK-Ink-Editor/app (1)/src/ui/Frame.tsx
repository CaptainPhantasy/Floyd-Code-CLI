import React from 'react';
import { Box, Text } from 'ink';

// A generic wrapper that handles borders and titles commonly used in the generated code
interface FrameProps {
  title?: string;
  width?: number;
  height?: number;
  border?: boolean;
  borderStyle?: 'single' | 'round' | 'double' | 'bold';
  padding?: number;
  color?: string;
  children?: React.ReactNode;
}

export const Frame: React.FC<FrameProps> = ({ 
  title, width, height, border = true, borderStyle = 'round', padding = 0, color = 'white', children 
}) => {
  return (
    <Box 
      width={width} 
      height={height} 
      borderStyle={border ? borderStyle : undefined} 
      borderColor={color}
      flexDirection="column"
      paddingX={1}
      padding={padding}
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