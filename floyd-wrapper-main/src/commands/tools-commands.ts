/**
 * Tools Slash Commands - Floyd Wrapper
 *
 * Commands for viewing tool registry and permission levels
 */

import type { SlashCommand } from './slash-commands.js';
import { toolRegistry } from '../tools/index.js';

// ============================================================================
// TOOLS COMMANDS
// ============================================================================

// Command: /tools
export const toolsCommand: SlashCommand = {
  name: 'tools',
  description: 'List all available tools with permission levels',
  usage: '/tools [--dangerous]',
  aliases: ['tool'],
  handler: async (ctx) => {
    const filter = ctx.args[0]?.toLowerCase();
    const allTools = toolRegistry.getAll();

    // Filter by permission if requested
    let filteredTools = allTools;
    if (filter === '--dangerous' || filter === 'dangerous') {
      filteredTools = allTools.filter(t => t.permission === 'dangerous');
    } else if (filter === '--moderate' || filter === 'moderate') {
      filteredTools = allTools.filter(t => t.permission === 'moderate');
    } else if (filter === '--none' || filter === 'none') {
      filteredTools = allTools.filter(t => t.permission === 'none');
    }

    ctx.terminal.section('🔧 Tool Registry');

    if (filteredTools.length === 0) {
      ctx.terminal.muted('No tools found matching the filter.');
      return;
    }

    // Calculate column widths
    const maxNameLength = Math.max(...filteredTools.map(t => t.name.length), 15);
    const maxCategoryLength = Math.max(...filteredTools.map(t => t.category.length), 10);

    // Table header
    const headerName = 'Tool Name'.padEnd(maxNameLength);
    const headerCategory = 'Category'.padEnd(maxCategoryLength);
    const headerPermission = 'Permission';

    ctx.terminal.info(`${headerName} ${headerCategory} ${headerPermission}`);
    ctx.terminal.muted(`${'─'.repeat(maxNameLength)} ${'─'.repeat(maxCategoryLength)} ${'─'.repeat(headerPermission.length)}`);

    // Table rows
    for (const tool of filteredTools) {
      const permissionIcon =
        tool.permission === 'dangerous' ? '🔴' :
        tool.permission === 'moderate' ? '🟡' :
        tool.permission === 'none' ? '🟢' : '⚪';

      const name = tool.name.padEnd(maxNameLength);
      const category = tool.category.padEnd(maxCategoryLength);
      const permission = `${permissionIcon} ${tool.permission}`;

      ctx.terminal.muted(`${name} ${category} ${permission}`);
    }

    ctx.terminal.blank();
    ctx.terminal.info('Legend: 🟢 none (read-only) | 🟡 moderate | 🔴 dangerous');
    ctx.terminal.muted(`Total: ${allTools.length} tools, showing: ${filteredTools.length}`);
  },
};

// Command: /tool <name> - Show tool details
export const toolInfoCommand: SlashCommand = {
  name: 'tool',
  description: 'Show detailed information about a specific tool',
  usage: '/tool <name>',
  handler: async (ctx) => {
    const toolName = ctx.args[0];
    if (!toolName) {
      ctx.terminal.error('Usage: /tool <name>');
      ctx.terminal.muted('Example: /tool write_file');
      return;
    }

    const tool = toolRegistry.get(toolName);
    if (!tool) {
      ctx.terminal.error(`Tool "${toolName}" not found.`);
      ctx.terminal.muted('Use /tools to list all available tools.');
      return;
    }

    ctx.terminal.section(`🔧 ${tool.name}`);

    const permissionIcon =
      tool.permission === 'dangerous' ? '🔴 DANGEROUS' :
      tool.permission === 'moderate' ? '🟡 MODERATE' :
      tool.permission === 'none' ? '🟢 NONE (read-only)' : tool.permission;

    ctx.terminal.info(`Permission: ${permissionIcon}`);
    ctx.terminal.info(`Category: ${tool.category}`);
    ctx.terminal.blank();

    ctx.terminal.info('Description:');
    ctx.terminal.muted(`  ${tool.description}`);
    ctx.terminal.blank();

    if (tool.example) {
      ctx.terminal.info('Example:');
      ctx.terminal.muted(`  ${JSON.stringify(tool.example, null, 2)}`);
    }
  },
};

// ============================================================================
// EXPORT ALL COMMANDS
// ============================================================================

export const toolsCommands: SlashCommand[] = [
  toolsCommand,
  toolInfoCommand,
];
