import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function HistorySearchOverlay() {
  const messages = useTuiStore((state) => state.messages);

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={1}
      height={15}
      width={60}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Search History:</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1}>
        {messages.map((msg, index) => {
          const preview = String(msg.content).substring(0, 50) + '...';
          return (
            <Ink.Box key={msg.id} paddingY={0}>
              <Ink.Text dimColor>[{index + 1}] </Ink.Text>
              <Ink.Text color={msg.role === 'user' ? '#82AAFF' : '#FF60FF'}>
                {msg.role === 'user' ? '> You:' : '* Floyd:'}
              </Ink.Text>
              <Ink.Text> {preview}</Ink.Text>
            </Ink.Box>
          );
        })}
      </Ink.Box>
    </Ink.Box>
  );
}
