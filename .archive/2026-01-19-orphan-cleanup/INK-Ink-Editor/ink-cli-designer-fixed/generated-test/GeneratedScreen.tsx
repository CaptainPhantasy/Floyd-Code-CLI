import React from 'react';
import { Box, Text } from 'ink';
import { Frame } from './ui/Frame';
import { theme } from './theme';

export const GeneratedScreen = () => {
  return (
    <Box flexDirection="column" width={80} height={24} borderStyle="single" borderColor="gray">
      {/* Row 1 */}
      <Box flexDirection="row" height={3}>
        <Frame 
          title="FLOYD" 
          width={80} 
          height={3} 
          color="magenta"
          border={true}
          borderStyle="double"
          padding={0}
        >
          <Text bold>HEADER</Text>
        </Frame>
      </Box>
      {/* Row 2 */}
      <Box flexDirection="row" height={18}>
        <Frame 
          title="NAV" 
          width={24} 
          height={18} 
          color="cyan"
          border={true}
          borderStyle="round"
          padding={1}
        >
          <Text>• JOB QUEUE
• ACTIVE TASKS
• UPCOMING</Text>
        </Frame>
        <Frame 
          title="LOG STREAM" 
          width={56} 
          height={18} 
          color="green"
          border={true}
          borderStyle="round"
          padding={1}
        >
          <Text dimColor>[10:41:02] booting...
[10:41:03] loading config
[10:41:05] connected
[10:41:07] streaming
[10:41:10] ok</Text>
        </Frame>
      </Box>
      {/* Row 3 */}
      <Box flexDirection="row" height={3}>
        <Frame 
          title="STATUS" 
          width={80} 
          height={3} 
          color="yellow"
          border={true}
          borderStyle="single"
          padding={0}
        >
          <Text>STATUS: OK  •  MODE: DESIGN  •  FPS: 60</Text>
        </Frame>
      </Box>
    </Box>
  );
};
