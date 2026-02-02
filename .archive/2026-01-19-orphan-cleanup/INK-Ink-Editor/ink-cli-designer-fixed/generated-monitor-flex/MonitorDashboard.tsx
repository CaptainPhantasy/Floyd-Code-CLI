import React from 'react';
import { Box, Text, useApp } from 'ink';
import { Frame } from './ui/Frame';

/**
 * Generated from: floyd-monitor-dashboard
 * Original spec dimensions: 160x50
 * This layout uses flexGrow to fill available terminal space
 */
export const MonitorDashboard: React.FC = () => {
  const { exit } = useApp();
  
  return (
    <Box flexDirection="column" flexGrow={1} minHeight={50}>
      <Box flexGrow={0.2} flexDirection="column">
        {/* Header Area */}
        <Box flexDirection="column" flexGrow={0.2}>
          <Box flexDirection="row" flexGrow={0.8}>
            <Box flexGrow={0.25}>
              <Frame
                title="FLOYD"
                flexGrow={1}
                color="white"
                border={false}
                borderStyle="single"
                padding={0}
              >
                <Text bold color="magenta">LOGO</Text>
              </Frame>
            </Box>
            <Box flexGrow={0.2375}>
              <Frame
                title=""
                flexGrow={1}
                color="magenta"
                border={true}
                borderStyle="bold"
                padding={1}
              >
                <Text bold color="magenta">VERSION INFO</Text>
              </Frame>
            </Box>
          </Box>
          <Box flexGrow={0.1}>
            <Frame
              title=""
              minHeight={1}
              flexGrow={1}
              color="white"
              border={false}
              borderStyle="single"
              padding={0}
            >
              <Text>CPU 18% • MEM 7.2GB • Load 0.58</Text>
            </Frame>
          </Box>
        </Box>
      </Box>
      <Box flexGrow={0.78} flexDirection="column">
        {/* Main Layout */}
        <Box flexDirection="column" flexGrow={0.78}>
          <Box flexDirection="row" flexGrow={0.9743589743589743}>
            <Box flexGrow={0.65}>
              {/* Left Column */}
              <Box flexDirection="column" flexGrow={1}>
                <Box flexGrow={0.13157894736842105}>
                  <Frame
                    title="SYSTEM"
                    flexGrow={1}
                    color="white"
                    border={true}
                    borderStyle="round"
                    padding={1}
                  >
                    <Text>CPU 18% • MEM 7.2GB • Load 0.58</Text>
                  </Frame>
                </Box>
                <Box flexGrow={0.5789473684210527}>
                  <Frame
                    title="EVENTS"
                    flexGrow={1}
                    color="blue"
                    border={true}
                    borderStyle="round"
                    padding={1}
                  >
                    <Box flexDirection="column">
                      <Text dimColor>[00:42:11] event.started</Text>
                      <Text dimColor>[00:42:12] tool.requested</Text>
                      <Text dimColor>[00:42:13] worker.state</Text>
                    </Box>
                  </Frame>
                </Box>
                <Box flexDirection="row" flexGrow={0.23684210526315788}>
                  <Box flexGrow={0.36538461538461536}>
                    <Frame
                      title="GIT/FS"
                      flexGrow={1}
                      color="white"
                      border={true}
                      borderStyle="round"
                      padding={1}
                    >
                      <Box flexDirection="column">
                        <Text dimColor>• Item 1</Text>
                        <Text dimColor>• Item 2</Text>
                        <Text dimColor>• Item 3</Text>
                      </Box>
                    </Frame>
                  </Box>
                  <Box flexGrow={0.625}>
                    <Frame
                      title="BROWSER"
                      flexGrow={1}
                      color="white"
                      border={true}
                      borderStyle="round"
                      padding={1}
                    >
                      <Box flexDirection="column">
                        <Text dimColor>• Item 1</Text>
                        <Text dimColor>• Item 2</Text>
                        <Text dimColor>• Item 3</Text>
                      </Box>
                    </Frame>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box flexGrow={0.33125}>
              {/* Right Column */}
              <Box flexDirection="column" flexGrow={1}>
                <Box flexGrow={0.23684210526315788}>
                  <Frame
                    title="ERRORS"
                    flexGrow={1}
                    color="white"
                    border={true}
                    borderStyle="round"
                    padding={1}
                  >
                    <Box flexDirection="column">
                      <Text dimColor>• Item 1</Text>
                      <Text dimColor>• Item 2</Text>
                      <Text dimColor>• Item 3</Text>
                    </Box>
                  </Frame>
                </Box>
                <Box flexGrow={0.3684210526315789}>
                  <Frame
                    title="WORKERS"
                    flexGrow={1}
                    color="white"
                    border={true}
                    borderStyle="round"
                    padding={1}
                  >
                    <Box flexDirection="column">
                      <Text dimColor>ID   STATUS    LAST</Text>
                      <Text dimColor>001  Working   00:42:14</Text>
                      <Text dimColor>002  Idle      00:41:59</Text>
                    </Box>
                  </Frame>
                </Box>
                <Box flexGrow={0.15789473684210525}>
                  <Frame
                    title="ALERTS"
                    flexGrow={1}
                    color="white"
                    border={true}
                    borderStyle="round"
                    padding={1}
                  >
                    <Box flexDirection="column">
                      <Text dimColor>• Item 1</Text>
                      <Text dimColor>• Item 2</Text>
                      <Text dimColor>• Item 3</Text>
                    </Box>
                  </Frame>
                </Box>
                <Box flexGrow={0.15789473684210525}>
                  <Frame
                    title="CONTROLS"
                    flexGrow={1}
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
        </Box>
      </Box>
    </Box>
  );
};
