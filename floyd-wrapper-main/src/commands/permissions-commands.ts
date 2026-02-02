/**
 * Permissions Slash Commands - Floyd Wrapper
 *
 * Commands for viewing permission audit trail and statistics
 */

import type { SlashCommand } from './slash-commands.js';
import { permissionManager } from '../permissions/permission-manager.js';

// ============================================================================
// PERMISSIONS COMMANDS
// ============================================================================

// Command: /permissions [history|stats|clear]
export const permissionsCommand: SlashCommand = {
  name: 'permissions',
  description: 'View permission audit trail and statistics',
  usage: '/permissions [history|stats|clear]',
  aliases: ['perms', 'audit'],
  handler: async (ctx) => {
    const subCommand = ctx.args[0]?.toLowerCase() || 'stats';

    if (subCommand === 'history') {
      await showHistory(ctx);
    } else if (subCommand === 'stats') {
      await showStats(ctx);
    } else if (subCommand === 'clear') {
      await clearHistory(ctx);
    } else {
      ctx.terminal.error(`Unknown subcommand: ${subCommand}`);
      ctx.terminal.muted('Usage: /permissions [history|stats|clear]');
    }
  },
};

// ============================================================================
// SUB-COMMAND HANDLERS
// ============================================================================

async function showHistory(ctx: SlashCommandContext): Promise<void> {
  const history = permissionManager.getAuditHistory();

  ctx.terminal.section('📋 Permission History');

  if (history.length === 0) {
    ctx.terminal.muted('No permission decisions recorded yet.');
    return;
  }

  // Show last 20 entries
  const recent = history.slice(-20).reverse();

  for (const entry of recent) {
    const icon = entry.decision === 'GRANTED' ? '✅' : '❌';
    const level =
      entry.permissionLevel === 'dangerous' ? '🔴' :
      entry.permissionLevel === 'moderate' ? '🟡' : '🟢';

    ctx.terminal.muted(`${icon} ${level} ${entry.toolName}:${entry.target} (${entry.timestamp})`);
  }

  if (history.length > 20) {
    ctx.terminal.muted(`... and ${history.length - 20} more entries`);
  }

  ctx.terminal.info(`Total: ${history.length} entries`);
}

async function showStats(ctx: SlashCommandContext): Promise<void> {
  const stats = permissionManager.getAuditStats();

  ctx.terminal.section('📊 Permission Statistics');

  if (stats.total === 0) {
    ctx.terminal.muted('No permission decisions recorded yet.');
    return;
  }

  const grantRate = stats.granted > 0 ? ((stats.granted / stats.total) * 100).toFixed(1) : '0';
  const denyRate = stats.denied > 0 ? ((stats.denied / stats.total) * 100).toFixed(1) : '0';

  ctx.terminal.info(`Total Requests: ${stats.total}`);
  ctx.terminal.blank();
  ctx.terminal.muted(`  Granted: ${stats.granted} (${grantRate}%)`);
  ctx.terminal.muted(`  Denied:  ${stats.denied} (${denyRate}%)`);
  ctx.terminal.blank();

  // Show breakdown by permission level
  if (Object.keys(stats.byLevel).length > 0) {
    ctx.terminal.info('By Permission Level:');
    for (const [level, data] of Object.entries(stats.byLevel)) {
      const icon = level === 'dangerous' ? '🔴' : level === 'moderate' ? '🟡' : '🟢';
      ctx.terminal.muted(`  ${icon} ${level}: ${data.granted} granted, ${data.denied} denied`);
    }
  }
}

async function clearHistory(ctx: SlashCommandContext): Promise<void> {
  permissionManager.clearAuditHistory();
  ctx.terminal.success('Permission audit history cleared.');
}

// ============================================================================
// EXPORT ALL COMMANDS
// ============================================================================

export const permissionsCommands: SlashCommand[] = [
  permissionsCommand,
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
    blank: () => void;
  };
}
