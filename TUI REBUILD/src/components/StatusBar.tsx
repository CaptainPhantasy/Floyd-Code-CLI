import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';
import { MODE_COLORS } from '../theme/colors.js';

export function StatusBar() {
  const _initialized = useTuiStore((state) => state._initialized);
  const mode = useTuiStore((state) => state.mode);
  const model = useTuiStore((state) => state.model);
  const connectionStatus = useTuiStore((state) => state.connectionStatus);
  const thinkingEnabled = useTuiStore((state) => state.thinkingEnabled);
  const backgroundTaskCount = useTuiStore((state) =>
    state.backgroundTasks.filter(t => t.status === 'running').length
  );

  const connectionColor = connectionStatus === 'online'
    ? '#4CAF50'
    : connectionStatus === 'connecting'
    ? '#FFC107'
    : '#F44336';

  return (
    <Ink.Box
      borderStyle="single"
      borderColor="#303050"
      paddingX={1}
      paddingY={0}
      width="100%"
    >
      <Ink.Box width="100%" justifyContent="space-between" alignItems="center">
        <Ink.Box flexDirection="row" gap={1}>
          <Ink.Text bold color="#FF60FF">FLOYD</Ink.Text>
          {!_initialized ? (
            <Ink.Text color="#FFC107">[INITIALIZING...]</Ink.Text>
          ) : (
            <>
              <Ink.Text color={MODE_COLORS[mode]}>[{mode.toUpperCase()}]</Ink.Text>
              <Ink.Text dimColor>{model}</Ink.Text>
            </>
          )}
        </Ink.Box>

        <Ink.Box flexDirection="row" gap={1}>
          <Ink.Text color={connectionColor}>{connectionStatus.toUpperCase()}</Ink.Text>
          <Ink.Text dimColor>|</Ink.Text>
          <Ink.Text color={thinkingEnabled ? '#4CAF50' : '#808080'}>
            Thinking: {thinkingEnabled ? 'ON' : 'OFF'}
          </Ink.Text>
          {backgroundTaskCount > 0 && (
            <>
              <Ink.Text dimColor>|</Ink.Text>
              <Ink.Text color="#FFC107">bg:{backgroundTaskCount}</Ink.Text>
            </>
          )}
        </Ink.Box>
      </Ink.Box>
    </Ink.Box>
  );
}
