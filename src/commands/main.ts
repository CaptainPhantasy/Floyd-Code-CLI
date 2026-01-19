/**
 * Main CLI Entry Command
 */

import { render } from 'ink';
import React from 'react';
import App from '../app.js';

export interface CLIOptions {
  chrome?: boolean;
  name?: string;
  help?: boolean;
  version?: boolean;
}

export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--chrome' || arg === '-c') options.chrome = true;
    else if (arg === '--name' || arg === '-n') options.name = args[++i];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
  }
  return options;
}

export function showHelp(): void {
  console.log(`
Floyd CLI - AI-powered coding assistant

Usage: floyd [options]

Options:
  -c, --chrome    Enable Chrome extension bridge
  -n, --name      Set user name
  -h, --help      Show help
  -v, --version   Show version
`);
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(args);
  if (options.help) { showHelp(); return; }
  if (options.version) { console.log('Floyd CLI v0.1.0'); return; }

  const { waitUntilExit } = render(
    React.createElement(App, {
      name: options.name ?? 'User',
      chrome: options.chrome ?? false,
    })
  );
  await waitUntilExit();
}

export default main;
