import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function TranscriptOverlay() {
  const messages = useTuiStore((state) => state.messages);

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={1}
      paddingY={0}
      height={20}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>TRANSCRIPT MODE</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1} overflowY="hidden" paddingY={1}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const prefix = isUser ? '> You:' : '* Floyd:';
          const color = isUser ? '#82AAFF' : '#FF60FF';

          return (
            <Ink.Box key={msg.id} flexDirection="column" marginBottom={1}>
              <Ink.Text bold color={color}>{prefix}</Ink.Text>
              <Ink.Box paddingLeft={2}>
                <Ink.Text>{msg.content}</Ink.Text>
              </Ink.Box>
            </Ink.Box>
          );
        })}
      </Ink.Box>

      <Ink.Box marginTop={0}>
        <Ink.Text dimColor>Esc: Close</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
