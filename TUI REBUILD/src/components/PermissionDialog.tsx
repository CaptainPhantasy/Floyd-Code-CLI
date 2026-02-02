import * as Ink from 'ink';
import { useState } from 'react';
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';

interface PermissionRequest {
  toolName: string;
  target: string;
  dangerLevel: 'safe' | 'moderate' | 'dangerous';
  description?: string;
}

interface PermissionDialogProps {
  request: PermissionRequest;
  onApprove: () => void;
  onDeny: () => void;
}

/**
 * Permission dialog for ASK mode
 * Shows when Floyd wants to execute a tool
 */
export function PermissionDialog(props: PermissionDialogProps) {
  const { request, onApprove, onDeny } = props;
  const mode = useTuiStore((state) => state.mode);
  const [handled, setHandled] = useState(false);

  // Only show in ASK mode
  if (mode !== 'ask') {
    // Auto-approve in other modes
    if (!handled) {
      setHandled(true);
      onApprove();
    }
    return null;
  }

  const dangerColor = request.dangerLevel === 'dangerous' ? '#F44336' :
                     request.dangerLevel === 'moderate' ? '#FFC107' : '#4CAF50';

  // Handle keyboard input for y/N/Esc
  useInput((input, key) => {
    if (handled) return;

    // y or Y: Approve
    if (input.toLowerCase() === 'y') {
      setHandled(true);
      onApprove();
      return;
    }

    // n or N: Deny
    if (input.toLowerCase() === 'n') {
      setHandled(true);
      onDeny();
      return;
    }

    // Esc: Cancel (deny)
    if (key.escape) {
      setHandled(true);
      onDeny();
      return;
    }

    // Enter: Default to deny
    if (key.return) {
      setHandled(true);
      onDeny();
      return;
    }
  });

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor={dangerColor}
      paddingX={2}
      paddingY={1}
      width={70}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold color={dangerColor}>
          {request.dangerLevel === 'dangerous' ? '⚠️  ' : ''}
          Permission Request
        </Ink.Text>
        <Ink.Text dimColor> [y/N]</Ink.Text>
      </Ink.Box>

      <Ink.Box marginBottom={1} flexDirection="column">
        <Ink.Text>Floyd wants to: </Ink.Text>
        <Ink.Text bold color="#FF60FF">{request.toolName}</Ink.Text>
      </Ink.Box>

      <Ink.Box marginBottom={1} flexDirection="column">
        <Ink.Text>Target: </Ink.Text>
        <Ink.Text color="#82AAFF">{request.target}</Ink.Text>
      </Ink.Box>

      {request.description && (
        <Ink.Box marginBottom={1}>
          <Ink.Text dimColor>{request.description}</Ink.Text>
        </Ink.Box>
      )}

      <Ink.Box marginTop={1}>
        <Ink.Text dimColor>
          Press y to approve, N to deny, Esc to cancel
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
