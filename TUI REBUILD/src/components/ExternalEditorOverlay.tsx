import * as Ink from 'ink';
import { useEffect, useState } from 'react';
import { useTuiStore } from '../store/tui-store.js';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';

export function ExternalEditorOverlay() {
  const input = useTuiStore((state) => state.input);
  const setInput = useTuiStore((state) => state.setInput);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);
  const [status] = useState('Opening external editor...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const runEditor = async () => {
      try {
        // 1. Create temp file
        const tmpDir = tmpdir();
        const tmpFile = path.join(tmpDir, `floyd-edit-${Date.now()}.md`);
        fs.writeFileSync(tmpFile, input || '');

        // 2. Determine editor
        const editor = process.env.EDITOR || 'vim';
        
        // 3. Spawn editor
        // We use stdio: 'inherit' to let the editor take over the terminal
        const child = spawn(editor, [tmpFile], {
          stdio: 'inherit',
          shell: true
        });

        child.on('error', (err) => {
          if (isMounted) setError(`Failed to start editor: ${err.message}`);
        });

        child.on('exit', (code) => {
          if (code === 0) {
            // 4. Read content back
            try {
              const newContent = fs.readFileSync(tmpFile, 'utf-8');
              if (isMounted) {
                setInput(newContent.trim()); // Trim to be clean
                closeOverlay();
              }
            } catch (readErr) {
              if (isMounted) setError(`Failed to read temp file: ${(readErr as Error).message}`);
            }
          } else {
            if (isMounted) setError(`Editor exited with code ${code}`);
          }
          
          // Cleanup
          try {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
          } catch {
            // ignore
          }
        });

      } catch (err) {
        if (isMounted) setError(`Unexpected error: ${(err as Error).message}`);
      }
    };

    // Small timeout to allow render to show "Opening..." before takeover
    const timer = setTimeout(runEditor, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Run once on mount

  if (error) {
    return (
      <Ink.Box
        flexDirection="column"
        borderStyle="double"
        borderColor="red"
        padding={1}
        alignItems="center"
        width="100%"
      >
        <Ink.Text bold color="red">Editor Error</Ink.Text>
        <Ink.Text>{error}</Ink.Text>
        <Ink.Text dimColor>Press Esc to close</Ink.Text>
      </Ink.Box>
    );
  }

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="single"
      borderColor="#6B50FF"
      padding={1}
      alignItems="center"
      width="100%"
      height={10}
      justifyContent="center"
    >
      <Ink.Text bold color="#6B50FF">EXTERNAL EDITOR</Ink.Text>
      <Ink.Text>{status}</Ink.Text>
      <Ink.Text dimColor>Waiting for editor to close...</Ink.Text>
    </Ink.Box>
  );
}
