import React from 'react';
import { Box, Text } from 'ink';
import { Frame } from './ui/Frame';
import { theme } from './theme';

export const GeneratedScreen = () => {
  return (
    <Box flexDirection="column" width={160} height={45} borderStyle="single" borderColor="gray">
      {/* Row 1 */}
      <Box flexDirection="row" height={5}>
        <Frame 
          title="FLOYD MONITOR" 
          width={160} 
          height={5} 
          color="magenta"
          border={true}
          borderStyle="double"
          padding={0}
        >
          <Text bold>HEADER</Text>
        </Frame>
      </Box>
      {/* Row 2 */}
      <Box flexDirection="row" height={20}>
        <Frame 
          title="SYSTEM" 
          width={100} 
          height={4} 
          color="cyan"
          border={true}
          borderStyle="round"
          padding={0}
        >
          <Text>STATUS: OK  •  MODE: DESIGN  •  FPS: 60</Text>
        </Frame>
        <Frame 
          title="EVENTS" 
          width={100} 
          height={20} 
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
        <Frame 
          title="ERRORS" 
          width={60} 
          height={6} 
          color="yellow"
          border={true}
          borderStyle="round"
          padding={0}
        >
          <Text dimColor>[10:41:02] booting...
[10:41:03] loading config
[10:41:05] connected
[10:41:07] streaming
[10:41:10] ok</Text>
        </Frame>
        <Frame 
          title="WORKERS" 
          width={60} 
          height={10} 
          color="magenta"
          border={true}
          borderStyle="round"
          padding={0}
        >
          <Text>ID   STATUS    ETA
001  READY     0:12
002  RUNNING   1:05
003  BLOCKED   --</Text>
        </Frame>
        <Frame 
          title="ALERTS" 
          width={60} 
          height={8} 
          color="yellow"
          border={true}
          borderStyle="round"
          padding={0}
        >
          <Text>• JOB QUEUE
• ACTIVE TASKS
• UPCOMING</Text>
        </Frame>
      </Box>
      {/* Row 3 */}
      <Box flexDirection="row" height={10}>
        <Frame 
          title="GIT/FS" 
          width={50} 
          height={10} 
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
          title="BROWSER" 
          width={50} 
          height={10} 
          color="green"
          border={true}
          borderStyle="round"
          padding={1}
        >
          <Text>• JOB QUEUE
• ACTIVE TASKS
• UPCOMING</Text>
        </Frame>
        <Frame 
          title="CONTROLS" 
          width={60} 
          height={10} 
          color="white"
          border={true}
          borderStyle="round"
          padding={0}
        >
          <Text color="gray">COMMAND PALETTE...</Text>
        </Frame>
      </Box>
      {/* Row 4 */}
      <Box flexDirection="row" height={3}>
        <Frame 
          title="STATUS" 
          width={160} 
          height={3} 
          color="gray"
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
