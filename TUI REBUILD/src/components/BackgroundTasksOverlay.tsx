import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function BackgroundTasksOverlay() {
  const backgroundTasks = useTuiStore((state) => state.backgroundTasks);

  const getIcon = (status: string) => {
    switch (status) {
      case 'running': return '[⚙]';
      case 'done': return '[✓]';
      case 'failed': return '[✗]';
      default: return '[?]';
    }
  };

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#FFC107"
      paddingX={1}
      height={15}
      width={60}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Background Tasks</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1}>
        {backgroundTasks.length === 0 ? (
          <Ink.Text dimColor>No background tasks</Ink.Text>
        ) : (
          backgroundTasks.map((task) => (
            <Ink.Box
              key={task.id}
              flexDirection="column"
              marginBottom={1}
              paddingX={1}
              borderStyle="single"
              borderColor="#303050"
            >
              <Ink.Text>
                {getIcon(task.status)} {task.command}
              </Ink.Text>
            </Ink.Box>
          ))
        )}
      </Ink.Box>
    </Ink.Box>
  );
}
