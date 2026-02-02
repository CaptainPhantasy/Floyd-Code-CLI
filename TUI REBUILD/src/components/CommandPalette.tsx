import * as Ink from 'ink';
import { useState, useEffect } from 'react';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';

interface Command {
  id: string;
  label: string;
  shortcut: string;
  action: () => void;
}

const getCommands = (store: ReturnType<typeof useTuiStore.getState>): Command[] => [
  {
    id: 'toggle-thinking',
    label: 'Toggle Thinking Mode',
    shortcut: 'Tab',
    action: () => store.toggleThinking(),
  },
  {
    id: 'cycle-mode',
    label: 'Cycle Execution Mode',
    shortcut: 'Shift+Tab',
    action: () => store.cycleMode(),
  },
  {
    id: 'clear-transcript',
    label: 'Clear Transcript',
    shortcut: 'Ctrl+L',
    action: () => store.clearMessages(),
  },
  {
    id: 'export-transcript',
    label: 'Export Transcript',
    shortcut: 'Ctrl+E',
    action: () => store.exportTranscript(),
  },
  {
    id: 'switch-model',
    label: 'Switch Model',
    shortcut: 'Alt+P',
    action: () => {
      const models = ['GLM-4.7', 'gpt-4o', 'claude-opus-4', 'deepseek-coder'];
      const currentIdx = models.indexOf(store.model);
      const nextModel = models[(currentIdx + 1) % models.length];
      store.setModel(nextModel);
    },
  },
  {
    id: 'background-tasks',
    label: 'Background Tasks',
    shortcut: 'Ctrl+O',
    action: () => store.setOverlayMode('background'),
  },
  {
    id: 'rewind',
    label: 'Rewind / Restore Checkpoint',
    shortcut: 'Ctrl+Z',
    action: () => store.setOverlayMode('rewind'),
  },
  {
    id: 'create-checkpoint',
    label: 'Create Manual Checkpoint',
    shortcut: '',
    action: async () => {
      // This would need project context - placeholder for now
      console.log('Checkpoint creation would go here');
    },
  },
];

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const store = useTuiStore();
  const closeOverlay = useTuiStore((state) => state.closeOverlay);

  const commands = getCommands(store);
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.shortcut.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard input for navigation and execution
  useInput((input, key) => {
    // Handle navigation
    if (key.upArrow) {
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
      return;
    }

    // Handle number keys for quick selection
    const num = parseInt(input, 10);
    if (num >= 1 && num <= filteredCommands.length) {
      filteredCommands[num - 1].action();
      closeOverlay();
      setQuery('');
      return;
    }

    // Execute selected command on Enter
    if (key.return && filteredCommands.length > 0) {
      filteredCommands[selectedIndex].action();
      closeOverlay();
      setQuery('');
      return;
    }

    // Close on Escape
    if (key.escape) {
      closeOverlay();
      setQuery('');
      return;
    }
  });

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={1}
      width={60}
      height={20}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Command Palette</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box marginBottom={1}>
        <Ink.Text color="#FFC107">{'> '}</Ink.Text>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Type to filter commands..."
        />
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1}>
        {filteredCommands.length === 0 ? (
          <Ink.Box paddingY={1}>
            <Ink.Text dimColor>No commands found</Ink.Text>
          </Ink.Box>
        ) : (
          filteredCommands.map((cmd, index) => (
            <Ink.Box key={cmd.id} paddingY={0}>
              <Ink.Text
                backgroundColor={index === selectedIndex ? '#6B50FF' : undefined}
                color="#82AAFF"
              >{`[${index + 1}]`}</Ink.Text>
              <Ink.Text
                backgroundColor={index === selectedIndex ? '#6B50FF' : undefined}
                bold={index === selectedIndex}
              > {cmd.label}</Ink.Text>
              <Ink.Text
                backgroundColor={index === selectedIndex ? '#6B50FF' : undefined}
                dimColor
              > ({cmd.shortcut})</Ink.Text>
            </Ink.Box>
          ))
        )}
      </Ink.Box>

      <Ink.Box marginTop={1}>
        <Ink.Text dimColor>
          ↑/↓: Navigate • Enter: Execute • 1-9: Quick select • Esc: Close
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
