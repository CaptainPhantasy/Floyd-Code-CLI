import React from 'react';
import { Box, Text } from 'ink';
import { Frame } from './ui/Frame';

/**
 * Generated from: floyd-monitor-dashboard
 * Dimensions: 160x50
 */
export const MonitorDashboard: React.FC = () => {
  return (
    <Box flexDirection="column" width={160} height={50}>
      {/* Header Area */}
      <Box flexDirection="column" width={160} height={10}>
        <Box flexDirection="row" height={8}>
          <Box width={2} />
          <Frame
            title="FLOYD"
            width={40}
            height={8}
            color="white"
            border={false}
            borderStyle="single"
            padding={0}
          >
            <Text bold color="magenta">LOGO</Text>
          </Frame>
          <Box width={78} />
          <Frame
            title=""
            width={38}
            height={6}
            color="magenta"
            border={true}
            borderStyle="bold"
            padding={1}
          >
            <Text bold color="magenta">VERSION INFO</Text>
          </Frame>
        </Box>
        <Frame
          title=""
          width={156}
          height={1}
          color="white"
          border={false}
          borderStyle="single"
          padding={0}
        >
          <Text>CPU 18% • MEM 7.2GB • Load 0.58</Text>
        </Frame>
      </Box>
      {/* Main Layout */}
      <Box flexDirection="column" width={160} height={39}>
        <Box flexDirection="row" height={38}>
          <Box width={1} />
          {/* Left Column */}
          <Box flexDirection="column" width={104} height={38}>
            <Frame
              title="SYSTEM"
              width={104}
              height={5}
              color="white"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text>CPU 18% • MEM 7.2GB • Load 0.58</Text>
            </Frame>
            <Frame
              title="EVENTS"
              width={104}
              height={22}
              color="blue"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text dimColor>[00:42:11] event.started\n[00:42:12] tool.requested\n[00:42:13] worker.state</Text>
            </Frame>
            <Box flexDirection="row" height={9}>
              <Frame
                title="GIT/FS"
                width={38}
                height={9}
                color="white"
                border={true}
                borderStyle="round"
                padding={1}
              >
                <Text dimColor>• Item 1\n• Item 2\n• Item 3</Text>
              </Frame>
              <Box width={1} />
              <Frame
                title="BROWSER"
                width={65}
                height={9}
                color="white"
                border={true}
                borderStyle="round"
                padding={1}
              >
                <Text dimColor>• Item 1\n• Item 2\n• Item 3</Text>
              </Frame>
            </Box>
          </Box>
          <Box width={1} />
          {/* Right Column */}
          <Box flexDirection="column" width={53} height={38}>
            <Frame
              title="ERRORS"
              width={53}
              height={9}
              color="white"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text dimColor>• Item 1\n• Item 2\n• Item 3</Text>
            </Frame>
            <Frame
              title="WORKERS"
              width={53}
              height={14}
              color="white"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text dimColor>ID   STATUS    LAST\n001  Working   00:42:14\n002  Idle      00:41:59</Text>
            </Frame>
            <Frame
              title="ALERTS"
              width={53}
              height={6}
              color="white"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text dimColor>• Item 1\n• Item 2\n• Item 3</Text>
            </Frame>
            <Frame
              title="CONTROLS"
              width={53}
              height={6}
              color="white"
              border={true}
              borderStyle="round"
              padding={1}
            >
              <Text color="gray">Press Enter to interact...</Text>
            </Frame>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
