/**
 * 🔒 LOCKED FILE - CORE STABILITY
 * This file has been audited and stabilized by Gemini 4.
 * Please do not modify without explicit instruction and regression testing.
 * Ref: geminireport.md
 */

/**
 * MCP Explorer Server
 * 
 * Provides high-level tools for codebase navigation, surgical editing,
 * and structural analysis. *
 * Tools:
 * - project_map: Get a compressed directory tree of the codebase
 * - smart_replace: Perform surgical search and replace on a file
 * - list_symbols: Extract structural symbols (functions, classes) from a file
 * - manage_scratchpad: Read/write/append to a persistent scratchpad for planning
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';

/**
 * Manage Scratchpad
 */
async function manageScratchpad(action: 'read' | 'write' | 'append' | 'clear', content?: string) {
  const scratchpadPath = path.join(process.cwd(), '.floyd', 'scratchpad.md');
  await fs.ensureDir(path.dirname(scratchpadPath));

  if (action === 'read') {
    if (await fs.pathExists(scratchpadPath)) {
      return await fs.readFile(scratchpadPath, 'utf-8');
    }
    return '(Scratchpad is empty)';
  }

  if (action === 'write') {
    if (!content) throw new Error('Content is required for write action');
    await fs.writeFile(scratchpadPath, content, 'utf-8');
    return 'Scratchpad updated.';
  }

  if (action === 'append') {
    if (!content) throw new Error('Content is required for append action');
    await fs.appendFile(scratchpadPath, '\n' + content, 'utf-8');
    return 'Content appended to scratchpad.';
  }

  if (action === 'clear') {
    await fs.writeFile(scratchpadPath, '', 'utf-8');
    return 'Scratchpad cleared.';
  }

  throw new Error(`Invalid action: ${action}`);
}

/**
 * Generate a compressed directory tree
 */
async function getProjectMap(rootPath: string, options: { maxDepth?: number; ignorePatterns?: string[] } = {}) {
  const { maxDepth = 3, ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.floyd'] } = options;
  
  const files = await globby('**/*', {
    cwd: rootPath,
    ignore: ignorePatterns,
    deep: maxDepth,
    onlyFiles: false,
    markDirectories: true,
  });

  const tree: any = {};
  for (const file of files) {
    const parts = file.split('/');
    let current = tree;
    for (const part of parts) {
      if (!part) continue;
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  function formatTree(node: any, indent = ''): string {
    let result = '';
    const keys = Object.keys(node).sort();
    for (const key of keys) {
      const isDir = Object.keys(node[key]).length > 0;
      result += `${indent}${isDir ? '📁' : '📄'} ${key}\n`;
      result += formatTree(node[key], indent + '  ');
    }
    return result;
  }

  return formatTree(tree);
}

/**
 * Surgical Search and Replace
 */
async function smartReplace(
  filePath: string,
  searchString: string,
  replaceString: string,
  options: { dryRun?: boolean } = {}
) {
  const resolvedPath = path.resolve(filePath);
  if (!(await fs.pathExists(resolvedPath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  
  if (!content.includes(searchString)) {
    // Try to be helpful: check if it's a whitespace issue
    const normalizedSearch = searchString.replace(/\s+/g, ' ').trim();
    const normalizedContent = content.replace(/\s+/g, ' ');
    
    if (normalizedContent.includes(normalizedSearch)) {
      throw new Error(`Search string found but whitespace does not match exactly. Use exact string from file.`);
    }
    
    throw new Error(`Search string not found in file.`);
  }

  // Check for multiple occurrences
  const occurrences = content.split(searchString).length - 1;
  if (occurrences > 1) {
    throw new Error(`Multiple occurrences (${occurrences}) of search string found. Please provide more context to uniquely identify the target block.`);
  }

  const newContent = content.replace(searchString, replaceString);

  if (!options.dryRun) {
    await fs.writeFile(resolvedPath, newContent, 'utf-8');
  }

  return {
    success: true,
    filePath,
    occurrences,
    dryRun: options.dryRun,
  };
}

/**
 * List symbols in a file (basic regex-based LSP-lite)
 */
async function listSymbols(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  if (!(await fs.pathExists(resolvedPath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  const lines = content.split('\n');
  const symbols: any[] = [];

  // Simple regex for TS/JS symbols
  const patterns = [
    { type: 'class', regex: /class\s+([a-zA-Z0-9_]+)/ },
    { type: 'function', regex: /(?:async\s+)?function\s+([a-zA-Z0-9_]+)/ },
    { type: 'const_func', regex: /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/ },
    { type: 'interface', regex: /interface\s+([a-zA-Z0-9_]+)/ },
    { type: 'type', regex: /type\s+([a-zA-Z0-9_]+)/ },
    { type: 'export_default', regex: /export\s+default\s+(?:class|function)?\s*([a-zA-Z0-9_]+)?/ },
  ];

  lines.forEach((line, index) => {
    for (const p of patterns) {
      const match = line.match(p.regex);
      if (match) {
        symbols.push({
          name: match[1] || 'default',
          type: p.type,
          line: index + 1,
          preview: line.trim(),
        });
        break;
      }
    }
  });

  return symbols;
}

/**
 * Create the Explorer server
 */
export function createExplorerServer(): Server {
  const server = new Server(
    {
      name: 'floyd-explorer-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'project_map',
          description: 'Get a compressed directory tree of the codebase to understand project structure.',
          inputSchema: {
            type: 'object',
            properties: {
              maxDepth: { type: 'number', description: 'Maximum depth of the tree (default: 3)' },
              ignorePatterns: { type: 'array', items: { type: 'string' }, description: 'Patterns to ignore' },
            },
          },
        },
        {
          name: 'smart_replace',
          description: 'Surgical search and replace. Replaces a unique block of text with new content.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Path to the file' },
              searchString: { type: 'string', description: 'The exact text block to find' },
              replaceString: { type: 'string', description: 'The new text block' },
              dryRun: { type: 'boolean', description: 'Preview change without applying' },
            },
            required: ['filePath', 'searchString', 'replaceString'],
          },
        },
        {
          name: 'list_symbols',
          description: 'List structural symbols (classes, functions, interfaces) in a file.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Path to the file' },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'manage_scratchpad',
          description: 'Manage a persistent scratchpad for planning and task tracking. Use this to keep track of your progress.',
          inputSchema: {
            type: 'object',
            properties: {
              action: { 
                type: 'string', 
                enum: ['read', 'write', 'append', 'clear'],
                description: 'Action to perform' 
              },
              content: { 
                type: 'string', 
                description: 'Content to write or append (required for write/append)' 
              },
            },
            required: ['action'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'project_map': {
          const result = await getProjectMap(process.cwd(), args as any);
          return { content: [{ type: 'text', text: result }] };
        }
        case 'smart_replace': {
          const { filePath, searchString, replaceString, dryRun } = args as any;
          const result = await smartReplace(filePath, searchString, replaceString, { dryRun });
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        case 'list_symbols': {
          const { filePath } = args as any;
          const result = await listSymbols(filePath);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        case 'manage_scratchpad': {
          const { action, content } = args as any;
          const result = await manageScratchpad(action, content);
          return { content: [{ type: 'text', text: result }] };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the server
 */
export async function startExplorerServer(): Promise<void> {
  const server = createExplorerServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Floyd MCP Explorer Server started');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startExplorerServer().catch(console.error);
}
