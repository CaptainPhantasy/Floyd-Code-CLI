/**
 * Sandbox Slash Commands - Floyd Wrapper
 *
 * Commands for managing the isolated sandbox environment in YOLO mode.
 */

import type { SlashCommand } from './slash-commands.js';
import { getSandboxManager } from '../sandbox/index.js';

// ============================================================================
// SANDBOX COMMANDS
// ============================================================================

// Command: /sandbox [start|commit|discard|status|help]
export const sandboxCommand: SlashCommand = {
  name: 'sandbox',
  description: 'Manage isolated sandbox environment',
  usage: '/sandbox [start|commit|discard|status|help]',
  aliases: ['sb'],
  handler: async (ctx) => {
    const subCommand = ctx.args[0]?.toLowerCase() || 'status';

    if (subCommand === 'start') {
      await handleStart(ctx);
    } else if (subCommand === 'commit') {
      await handleCommit(ctx);
    } else if (subCommand === 'discard') {
      await handleDiscard(ctx);
    } else if (subCommand === 'status') {
      await handleStatus(ctx);
    } else if (subCommand === 'help') {
      showHelp(ctx);
    } else {
      ctx.terminal.error(`Unknown subcommand: ${subCommand}`);
      showHelp(ctx);
    }
  },
};

// ============================================================================
// SUB-COMMAND HANDLERS
// ============================================================================

async function handleStart(ctx: SlashCommandContext): Promise<void> {
  const sandboxManager = getSandboxManager();

  if (sandboxManager.isActive()) {
    const session = sandboxManager.getSession();
    ctx.terminal.warning('Sandbox is already active');
    ctx.terminal.muted(`Session: ${session?.id}`);
    ctx.terminal.muted('Use "/sandbox commit" to apply changes or "/sandbox discard" to cancel');
    return;
  }

  try {
    ctx.terminal.info('Starting sandbox...');
    const session = await sandboxManager.start(process.cwd());

    ctx.terminal.success(`Sandbox started: ${session.id.slice(0, 12)}...`);
    ctx.terminal.muted(`Project root: ${session.projectRoot}`);
    ctx.terminal.muted(`Sandbox root: ${session.sandboxRoot}`);
    ctx.terminal.blank();
    ctx.terminal.info('YOLO mode will now operate in the isolated sandbox.');
    ctx.terminal.muted('Use "/sandbox commit" to apply changes to the real project.');
    ctx.terminal.muted('Use "/sandbox discard" to cancel all changes.');
  } catch (error) {
    ctx.terminal.error(`Failed to start sandbox: ${error}`);
  }
}

async function handleCommit(ctx: SlashCommandContext): Promise<void> {
  const sandboxManager = getSandboxManager();

  if (!sandboxManager.isActive()) {
    ctx.terminal.warning('No active sandbox session');
    ctx.terminal.muted('Use "/sandbox start" to create a sandbox first');
    return;
  }

  const summary = sandboxManager.getChangesSummary();

  if (summary.total === 0) {
    ctx.terminal.info('No changes to commit');
    return;
  }

  ctx.terminal.section('📦 Committing Sandbox Changes');
  ctx.terminal.muted(`Created: ${summary.created}`);
  ctx.terminal.muted(`Modified: ${summary.modified}`);
  ctx.terminal.muted(`Deleted: ${summary.deleted}`);
  ctx.terminal.blank();

  try {
    const result = await sandboxManager.commit();

    if (result.success) {
      ctx.terminal.success(`Committed ${result.committed.length} files to real project`);
      if (result.committed.length > 0) {
        ctx.terminal.muted('Files:');
        for (const file of result.committed.slice(0, 10)) {
          ctx.terminal.muted(`  ✓ ${file}`);
        }
        if (result.committed.length > 10) {
          ctx.terminal.muted(`  ... and ${result.committed.length - 10} more`);
        }
      }
    } else {
      ctx.terminal.error(`Some files failed to commit`);
      if (result.failed.length > 0) {
        ctx.terminal.muted('Failed:');
        for (const file of result.failed) {
          ctx.terminal.muted(`  ✗ ${file}`);
        }
      }
    }
  } catch (error) {
    ctx.terminal.error(`Failed to commit: ${error}`);
  }
}

async function handleDiscard(ctx: SlashCommandContext): Promise<void> {
  const sandboxManager = getSandboxManager();

  if (!sandboxManager.isActive()) {
    ctx.terminal.warning('No active sandbox session');
    ctx.terminal.muted('Use "/sandbox start" to create a sandbox first');
    return;
  }

  const summary = sandboxManager.getChangesSummary();

  if (summary.total > 0) {
    ctx.terminal.section('🗑️  Discarding Sandbox Changes');
    ctx.terminal.muted(`Created: ${summary.created}`);
    ctx.terminal.muted(`Modified: ${summary.modified}`);
    ctx.terminal.muted(`Deleted: ${summary.deleted}`);
    ctx.terminal.blank();
    ctx.terminal.warning('All sandbox changes will be permanently discarded');
  }

  try {
    await sandboxManager.discard();
    ctx.terminal.success('Sandbox discarded');
    ctx.terminal.muted('No changes were applied to the real project');
  } catch (error) {
    ctx.terminal.error(`Failed to discard: ${error}`);
  }
}

async function handleStatus(ctx: SlashCommandContext): Promise<void> {
  const sandboxManager = getSandboxManager();

  if (!sandboxManager.isActive()) {
    ctx.terminal.info('🔓 Sandbox: INACTIVE');
    ctx.terminal.muted('Use "/sandbox start" to create a sandbox');
    return;
  }

  const session = sandboxManager.getSession();
  const summary = sandboxManager.getChangesSummary();

  ctx.terminal.section('🔒 Sandbox Status');

  if (session) {
    ctx.terminal.muted(`Session: ${session.id}`);
    ctx.terminal.muted(`State: ${session.state.toUpperCase()}`);
    ctx.terminal.blank();
  }

  if (summary.total > 0) {
    ctx.terminal.info(`Changes: ${summary.total} files`);
    ctx.terminal.muted(`  Created: ${summary.created}`);
    ctx.terminal.muted(`  Modified: ${summary.modified}`);
    ctx.terminal.muted(`  Deleted: ${summary.deleted}`);
    ctx.terminal.blank();
    ctx.terminal.muted('Use "/sandbox commit" to apply changes');
    ctx.terminal.muted('Use "/sandbox discard" to cancel changes');
  } else {
    ctx.terminal.muted('No changes tracked yet');
  }
}

function showHelp(ctx: SlashCommandContext): void {
  ctx.terminal.section('🔒 Sandbox Commands');
  ctx.terminal.blank();
  ctx.terminal.info('Usage: /sandbox [command]');
  ctx.terminal.blank();
  ctx.terminal.muted('Commands:');
  ctx.terminal.muted('  start     Create a new isolated sandbox');
  ctx.terminal.muted('  commit    Apply sandbox changes to real project');
  ctx.terminal.muted('  discard   Cancel all sandbox changes');
  ctx.terminal.muted('  status    Show sandbox status and changes');
  ctx.terminal.muted('  help      Show this help message');
  ctx.terminal.blank();
  ctx.terminal.info('Examples:');
  ctx.terminal.muted('  /sandbox start');
  ctx.terminal.muted('  /sandbox status');
  ctx.terminal.muted('  /sandbox commit');
  ctx.terminal.blank();
  ctx.terminal.info('About:');
  ctx.terminal.muted('The sandbox provides an isolated environment where YOLO mode');
  ctx.terminal.muted('can operate safely. Changes are tracked and only applied when');
  ctx.terminal.muted('you explicitly run "/sandbox commit".');
}

// ============================================================================
// EXPORT ALL COMMANDS
// ============================================================================

export const sandboxCommands: SlashCommand[] = [
  sandboxCommand,
];

// ============================================================================
// TYPES
// ============================================================================

interface SlashCommandContext {
  args: string[];
  terminal: {
    section: (title: string) => void;
    info: (msg: string) => void;
    muted: (msg: string) => void;
    error: (msg: string) => void;
    success: (msg: string) => void;
    warning: (msg: string) => void;
    blank: () => void;
  };
}
