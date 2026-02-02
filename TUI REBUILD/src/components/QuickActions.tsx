import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

interface QuickAction {
  id: string;
  label: string;
  shortcut: string;
  action: () => void;
}

interface QuickActionsProps {
  onApply?: () => void;
  onExplain?: () => void;
  onDiff?: () => void;
  onUndo?: () => void;
}

/**
 * Quick action buttons shown after assistant response
 * Provides quick access to common actions
 */
export function QuickActions(props: QuickActionsProps) {
  const { onApply, onExplain, onDiff, onUndo } = props;
  const undoLastExchange = useTuiStore((state) => state.undoLastExchange);

  const actions: QuickAction[] = [
    { id: 'apply', label: 'Apply', shortcut: '1/a', action: onApply || (() => {}) },
    { id: 'explain', label: 'Explain', shortcut: '2/e', action: onExplain || (() => {}) },
    { id: 'diff', label: 'Diff', shortcut: '3/d', action: onDiff || (() => {}) },
    { id: 'undo', label: 'Undo', shortcut: '4/u', action: onUndo || undoLastExchange },
  ];

  return (
    <Ink.Box marginTop={1} paddingX={1} borderStyle="single" borderColor="#303050">
      <Ink.Box flexDirection="row" gap={2}>
        {actions.map((action) => (
          <Ink.Box key={action.id}>
            <Ink.Text color="#6B50FF">[</Ink.Text>
            <Ink.Text bold color="#82AAFF">{action.shortcut}</Ink.Text>
            <Ink.Text color="#6B50FF">:</Ink.Text>
            <Ink.Text color="#e0e0e0">{action.label}</Ink.Text>
            <Ink.Text color="#6B50FF">]</Ink.Text>
          </Ink.Box>
        ))}
      </Ink.Box>
    </Ink.Box>
  );
}
