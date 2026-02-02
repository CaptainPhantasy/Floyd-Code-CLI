import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

/**
 * Full transcript panel showing all messages
 * Used when overlayMode === 'transcript'
 */
export function TranscriptPanel() {
  const messages = useTuiStore((state) => state.messages);

  return (
    <Ink.Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.length === 0 ? (
        <Ink.Box justifyContent="center" alignItems="center" flexGrow={1}>
          <Ink.Text dimColor>No messages yet. Start a conversation!</Ink.Text>
        </Ink.Box>
      ) : (
        messages.map((msg) => {
          const isUser = msg.role === 'user';
          const prefix = isUser ? '> You:' : '* Floyd:';
          const color = isUser ? '#82AAFF' : '#FF60FF';

          return (
            <Ink.Box key={msg.id} flexDirection="column" marginBottom={1}>
              <Ink.Box>
                <Ink.Text bold color={color}>{prefix}</Ink.Text>
                <Ink.Text dimColor> [{new Date(msg.timestamp).toLocaleTimeString()}]</Ink.Text>
              </Ink.Box>
              <Ink.Box paddingLeft={2}>
                <Ink.Text>{String(msg.content)}</Ink.Text>
              </Ink.Box>
            </Ink.Box>
          );
        })
      )}
    </Ink.Box>
  );
}
