import * as Ink from 'ink';

export function HelpOverlay() {
  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={2}
      paddingY={1}
      width={80}
      height={25}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold color="#FF60FF">FLOYD GOD TIER - Keyboard Shortcuts</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" gap={1}>
        {/* Global Shortcuts */}
        <Ink.Box>
          <Ink.Text bold color="#FFC107">Global Shortcuts</Ink.Text>
        </Ink.Box>
        <Ink.Box flexDirection="column" marginLeft={2}>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Ctrl+Q       </Ink.Text>
            <Ink.Text>Exit application (double-press)</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Ctrl+/      </Ink.Text>
            <Ink.Text>Toggle this help overlay</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Ctrl+P      </Ink.Text>
            <Ink.Text>Open command palette</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Ctrl+O      </Ink.Text>
            <Ink.Text>Open overlays menu</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Esc         </Ink.Text>
            <Ink.Text>Close overlay / cancel</Ink.Text>
          </Ink.Box>
        </Ink.Box>

        {/* Execution Modes */}
        <Ink.Box marginTop={1}>
          <Ink.Text bold color="#FFC107">Execution Modes</Ink.Text>
        </Ink.Box>
        <Ink.Box flexDirection="column" marginLeft={2}>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Shift+Tab   </Ink.Text>
            <Ink.Text>Cycle execution mode</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#82AAFF">Tab         </Ink.Text>
            <Ink.Text>Toggle thinking mode</Ink.Text>
          </Ink.Box>
        </Ink.Box>

        {/* Modes Description */}
        <Ink.Box marginTop={1}>
          <Ink.Text bold color="#FFC107">Modes</Ink.Text>
        </Ink.Box>
        <Ink.Box flexDirection="column" marginLeft={2}>
          <Ink.Box>
            <Ink.Text color="#FFC107">YOLO      </Ink.Text>
            <Ink.Text>Auto-approve safe tools</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#2196F3">ASK       </Ink.Text>
            <Ink.Text>Confirm all tool execution</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#4CAF50">PLAN      </Ink.Text>
            <Ink.Text>Read-only analysis mode</Ink.Text>
          </Ink.Box>
          <Ink.Box>
            <Ink.Text color="#00BCD4">DIALOGUE  </Ink.Text>
            <Ink.Text>Quick chat, no tools</Ink.Text>
          </Ink.Box>
        </Ink.Box>
      </Ink.Box>
    </Ink.Box>
  );
}
