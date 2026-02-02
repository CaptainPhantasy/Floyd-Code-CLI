import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function CurrentExchange() {
  const messages = useTuiStore((state) => state.messages);
  const streamingContent = useTuiStore((state) => state.streamingContent);
  const isThinking = useTuiStore((state) => state.isThinking);
  const whimsicalPhrase = useTuiStore((state) => state.whimsicalPhrase);
  const thinkingEnabled = useTuiStore((state) => state.thinkingEnabled);

  // FLOW UP DESIGN: Messages displayed newest first (reverse order)
  // This makes them appear to flow UP from the input
  const reversedMessages = [...messages].reverse();

  // Display whimsical phrase if available, otherwise generic text
  const thinkingText = whimsicalPhrase || 'Working...';

  return (
    <Ink.Box flexDirection="column-reverse" flexGrow={1} paddingX={1}>
      {/* Messages flow UP - newest at bottom (closest to input), oldest at top */}
      {reversedMessages.map((msg) => (
        <Ink.Box key={msg.id} marginBottom={1}>
          {msg.role === 'user' ? (
            <Ink.Text bold color="#82AAFF">{'>'} You: </Ink.Text>
          ) : (
            <Ink.Text bold color="#FF60FF">* Floyd: </Ink.Text>
          )}
          <Ink.Text dimColor={msg.streaming}>
            {msg.content}
          </Ink.Text>
          {msg.streaming && <Ink.Text dimColor>▊</Ink.Text>}
        </Ink.Box>
      ))}

      {/* Show thinking indicator at bottom when Floyd is working */}
      {isThinking && thinkingEnabled && !streamingContent && (
        <Ink.Box marginBottom={1}>
          <Ink.Text bold color="#FF60FF">* Floyd: </Ink.Text>
          <Ink.Text dimColor italic>{thinkingText}</Ink.Text>
        </Ink.Box>
      )}

      {/* Empty spacer at bottom - visual separation from input */}
      <Ink.Box height={1} />
    </Ink.Box>
  );
}
