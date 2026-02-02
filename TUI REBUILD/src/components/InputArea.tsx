import * as Ink from 'ink';
import TextInput from 'ink-text-input';
import { useTuiStore } from '../store/tui-store.js';
import { useState } from 'react';

const MAX_INPUT_LENGTH = 5000;
const SUBMIT_DEBOUNCE_MS = 200;

export function InputArea() {
  const input = useTuiStore((state) => state.input);
  const setInput = useTuiStore((state) => state.setInput);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const isThinking = useTuiStore((state) => state.isThinking);
  const overlayMode = useTuiStore((state) => state.overlayMode);
  const sendMessage = useTuiStore((state) => state.sendMessage);

  const handleSubmit = (value: string) => {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_DEBOUNCE_MS) return;
    if (!value.trim()) return;
    if (value.length > MAX_INPUT_LENGTH) return;
    if (isThinking) return;

    setLastSubmitTime(now);
    setInput('');
    sendMessage(value);
  };

  return (
    <Ink.Box flexDirection="column" width="100%" marginTop={1} paddingX={0}>
      <Ink.Box
        borderStyle="single"
        borderColor="#6B50FF"
        paddingX={1}
        paddingY={1}
        width="100%"
      >
        <Ink.Text color="#FFC107">{'> '} </Ink.Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={isThinking ? 'Please wait...' : ''}
        />
        {overlayMode === 'none' && (
          <Ink.Text dimColor> Ctrl+O</Ink.Text>
        )}
      </Ink.Box>

      <Ink.Box marginTop={0} flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Ink.Text dimColor color="#808080">
          Ctrl+P:Cmds Ctrl+/:Help Tab:Thinking Shift+Tab:Mode
        </Ink.Text>
        <Ink.Text dimColor color="#808080">
          Ctrl+Q:Exit
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
