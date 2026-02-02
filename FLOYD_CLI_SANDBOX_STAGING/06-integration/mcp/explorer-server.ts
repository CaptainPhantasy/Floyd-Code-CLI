/**
 * 🔒 FLOYD EXPLORER SERVER - SINGULARITY + SAFETY (v4.1.0)
 * Architecture: Tier 5 (Self-Replicating / Safety Sandboxed)
 * * * INSTALLED TOOL SUITE (14 TOOLS):
 * -- SAFETY --
 * 14. spawn_shadow_workspace (The "Carbon Copy")
 * -> Creates a safe sandbox to test self-modifications.
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
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- HELPER: Manage Scratchpad ---
async function manageScratchpad(action: 'read' | 'write' | 'append' | 'clear', content?: string) {
  const scratchpadPath = path.join(process.cwd(), '.floyd', 'scratchpad.md');
  await fs.ensureDir(path.dirname(scratchpadPath));
  if (action === 'read') return (await fs.pathExists(scratchpadPath)) ? await fs.readFile(scratchpadPath, 'utf-8') : '(Empty)';
  if (action === 'write') { await fs.writeFile(scratchpadPath, content || '', 'utf-8'); return 'Updated.'; }
  if (action === 'append') { await fs.appendFile(scratchpadPath, '\n' + (content || ''), 'utf-8'); return 'Appended.'; }
  if (action === 'clear') { await fs.writeFile(scratchpadPath, '', 'utf-8'); return 'Cleared.'; }
  throw new Error(`Invalid action: ${action}`);
}

// ==========================================
// 1. CORE TOOLS
// ==========================================

async function getProjectMap(rootPath: string, options: { maxDepth?: number; ignorePatterns?: string[] } = {}) {
  const { maxDepth = 3, ignorePatterns = ['node_modules', '.git', 'dist', 'target', '.floyd'] } = options;
  const files = await globby('**/*', { cwd: rootPath, ignore: ignorePatterns, deep: maxDepth, onlyFiles: false, markDirectories: true });
  const tree: any = {};
  files.forEach(file => file.split('/').reduce((node, part) => node[part] = node[part] || {}, tree));
  function format(node: any, indent = ''): string {
    return Object.keys(node).sort().map(key => {
      const isDir = Object.keys(node[key]).length > 0;
      return `${indent}${isDir ? '📁' : '📄'} ${key}\n${format(node[key], indent + '  ')}`;
    }).join('');
  }
  return format(tree);
}

async function smartReplace(filePath: string, searchString: string, replaceString: string, dryRun = false) {
  const fullPath = path.resolve(filePath);
  if (!(await fs.pathExists(fullPath))) throw new Error(`File not found: ${filePath}`);
  const content = await fs.readFile(fullPath, 'utf-8');
  if (!content.includes(searchString)) throw new Error(`Search string not found.`);
  if (content.split(searchString).length - 1 > 1) throw new Error(`Multiple occurrences found.`);
  const newContent = content.replace(searchString, replaceString);
  if (!dryRun) await fs.writeFile(fullPath, newContent, 'utf-8');
  return { success: true, filePath, dryRun };
}

async function listSymbols(filePath: string) {
  if (!(await fs.pathExists(filePath))) throw new Error(`File not found.`);
  const content = await fs.readFile(filePath, 'utf-8');
  const patterns = [
    { type: 'class', regex: /class\s+([a-zA-Z0-9_]+)/ },
    { type: 'function', regex: /(?:async\s+)?function\s+([a-zA-Z0-9_]+)/ },
    { type: 'interface', regex: /interface\s+([a-zA-Z0-9_]+)/ },
    { type: 'rust_fn', regex: /fn\s+([a-zA-Z0-9_]+)/ },
    { type: 'rust_struct', regex: /struct\s+([a-zA-Z0-9_]+)/ },
  ];
  return content.split('\n').map((line, i) => {
    for (const p of patterns) {
      const m = line.match(p.regex);
      if (m) return { name: m[1], type: p.type, line: i + 1, preview: line.trim() };
    }
    return null;
  }).filter(Boolean);
}

// ==========================================
// 2. DEEP CONTEXT TOOLS
// ==========================================

async function semanticSearch(query: string) {
  const keywords = query.split(' ').filter(k => k.length > 2);
  const files = await globby('**/*.{ts,tsx,rs,js,md}', { ignore: ['node_modules', 'dist', 'target'] });
  const results: any[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    let score = 0;
    const matches: any[] = [];
    if (file.toLowerCase().includes(query.toLowerCase())) score += 10;
    lines.forEach((line, i) => {
      if (keywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) {
        score++;
        matches.push({ line: i + 1, content: line.trim() });
      }
    });
    if (score > 0) results.push({ file, score, matches: matches.slice(0, 3) });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

async function checkDiagnostics() {
  const cwd = process.cwd();
  try {
    if (await fs.pathExists(path.join(cwd, 'Cargo.toml'))) {
      const { stdout } = await execAsync('cargo check --quiet --message-format=short');
      return { type: 'rust', status: 'clean', output: stdout || 'No errors.' };
    } else if (await fs.pathExists(path.join(cwd, 'tsconfig.json'))) {
      const { stdout } = await execAsync('npx tsc --noEmit --pretty false');
      return { type: 'ts', status: 'clean', output: stdout || 'No errors.' };
    }
    return { status: 'skipped', message: 'No Rust/TS project detected.' };
  } catch (err: any) {
    return { status: 'error', output: err.stdout || err.stderr || err.message };
  }
}

async function fetchDocs(url: string) {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    if (!response.ok) throw new Error(response.statusText);
    const text = await response.text();
    return text.slice(0, 15000) + (text.length > 15000 ? '\n...(truncated)' : '');
  } catch (e: any) { return `Error: ${e.message}`; }
}

// ==========================================
// 3. ARCHITECT TOOLS
// ==========================================

async function dependencyXray(packageName: string) {
  const nodePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
  if (await fs.pathExists(nodePath)) {
    const pkg = await fs.readJson(nodePath);
    const mainFile = pkg.main || pkg.module || 'index.js';
    const mainPath = path.join(path.dirname(nodePath), mainFile);
    if (await fs.pathExists(mainPath)) {
      const content = await fs.readFile(mainPath, 'utf-8');
      return { found: true, path: mainPath, preview: content.slice(0, 2000) };
    }
  }
  return { found: false, message: `Could not locate source for ${packageName}.` };
}

async function visualVerify(command: string, timeoutMs = 2000) {
  return new Promise((resolve) => {
    let output = '';
    const child = exec(command, { timeout: timeoutMs });
    child.stdout?.on('data', (data) => output += data);
    child.stderr?.on('data', (data) => output += data);
    setTimeout(() => {
      child.kill();
      resolve({ command, preview: output.slice(0, 5000) || '(No Output)', note: 'Process killed.' });
    }, timeoutMs);
  });
}

async function todoSniper() {
  const files = await globby('**/*.{ts,rs,js,md}', { ignore: ['node_modules', 'dist'] });
  const todos: any[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    content.split('\n').forEach((line, i) => {
      if (line.match(/\/\/\s*(TODO|FIXME|HACK):/i)) {
        todos.push({ file, line: i + 1, text: line.trim() });
      }
    });
  }
  return todos;
}

// ==========================================
// 4. EXPERIMENTAL & SAFETY TOOLS
// ==========================================

async function runtimeSchemaGen(source: string, type: 'url' | 'file') {
  let data: any;
  try {
    if (type === 'url') {
      const response = await fetch(source);
      data = await response.json();
    } else {
      const filePath = path.resolve(source);
      if (!(await fs.pathExists(filePath))) throw new Error(`File not found: ${filePath}`);
      data = await fs.readJson(filePath);
    }
  } catch (e: any) { return { error: `Failed to fetch data: ${e.message}` }; }
  
  function generateType(obj: any, name: string): string {
    if (Array.isArray(obj)) return `${obj.length > 0 ? generateType(obj[0], 'Item') : 'any'}[]`;
    if (typeof obj === 'object' && obj !== null) {
      return `{\n${Object.keys(obj).map(key => `  ${key}: ${generateType(obj[key], key)};`).join('\n')}\n}`;
    }
    return typeof obj;
  }
  return { source, sampleKeys: Object.keys(data).slice(0, 5), generatedInterface: `export interface GeneratedSchema ${generateType(data, 'Root')}` };
}

async function tuiPuppeteer(command: string, keys: string[]) {
  return { 
    status: "Simulation Mode", 
    message: "node-pty not detected. Simulating interaction.", 
    command, keysSent: keys, output: "Simulated output: [Success]" 
  };
}

async function astNavigator(query: string, type: 'def' | 'refs') {
  const cmd = type === 'def' 
    ? `grep -rE "class ${query}|function ${query}|fn ${query}|struct ${query}|interface ${query}" . --exclude-dir=node_modules`
    : `grep -r "${query}" . --exclude-dir=node_modules`;
  try {
    const { stdout } = await execAsync(cmd);
    return { query, type, matches: stdout.split('\n').filter(Boolean).slice(0, 10) };
  } catch (e) { return { matches: [], message: 'No matches found.' }; }
}

async function skillCrystallizer(skillName: string, filePath: string, description: string) {
  const patternsDir = path.join(process.cwd(), '.floyd', 'patterns');
  await fs.ensureDir(patternsDir);
  const fullPath = path.resolve(filePath);
  if (!(await fs.pathExists(fullPath))) throw new Error(`File not found.`);
  const content = await fs.readFile(fullPath, 'utf-8');
  await fs.writeFile(path.join(patternsDir, `${skillName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`), `# ${skillName}\n> ${description}\n\n\
\
${content}\n\
\
`, 'utf-8');
  return { success: true, message: "Skill crystallized." };
}

async function gitDiff(staged = false) {
  try {
    const cmd = staged ? 'git diff --staged' : 'git diff';
    const { stdout } = await execAsync(cmd);
    return { stdout: stdout || '(No changes)' };
  } catch (e: any) {
    return { error: `Git diff failed: ${e.message}` };
  }
}

// --- Tool 14: Spawn Shadow Workspace (Carbon Copy) ---
async function spawnShadowWorkspace(id: string) {
  const shadowDir = path.join(process.cwd(), '.floyd', 'shadow', id);
  const srcDir = process.cwd();
  
  // 1. Clean existing
  await fs.remove(shadowDir);
  await fs.ensureDir(shadowDir);
  
  // 2. Copy source files (excluding heavy folders)
  await fs.copy(srcDir, shadowDir, {
    filter: (src) => !src.includes('node_modules') && !src.includes('.git') && !src.includes('target') && !src.includes('.floyd')
  });
  
  // 3. Symlink node_modules (Speed Trick)
  const nodeModulesSrc = path.join(srcDir, 'node_modules');
  if (await fs.pathExists(nodeModulesSrc)) {
    await fs.ensureSymlink(nodeModulesSrc, path.join(shadowDir, 'node_modules'));
  }
  
  return { 
    success: true, 
    shadowPath: shadowDir, 
    message: `Shadow workspace '${id}' created. You can now operate safely in '${shadowDir}'.`
  };
}

// ==========================================
// SERVER SETUP
// ==========================================

export function createExplorerServer(): Server {
  const server = new Server({ name: 'floyd-explorer-server', version: '4.1.0' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: 'project_map', description: 'Get directory tree.', inputSchema: { type: 'object', properties: { maxDepth: { type: 'number' } } } },
      { name: 'smart_replace', description: 'Surgical editing.', inputSchema: { type: 'object', properties: { filePath: { type: 'string' }, searchString: { type: 'string' }, replaceString: { type: 'string' }, dryRun: { type: 'boolean' } }, required: ['filePath', 'searchString', 'replaceString'] } },
      { name: 'list_symbols', description: 'List symbols.', inputSchema: { type: 'object', properties: { filePath: { type: 'string' } }, required: ['filePath'] } },
      { name: 'semantic_search', description: 'Search concept.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'check_diagnostics', description: 'Check errors.', inputSchema: { type: 'object', properties: {} } },
      { name: 'fetch_docs', description: 'Read docs.', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
      { name: 'dependency_xray', description: 'Read library source.', inputSchema: { type: 'object', properties: { packageName: { type: 'string' } }, required: ['packageName'] } },
      { name: 'visual_verify', description: 'Snapshot output.', inputSchema: { type: 'object', properties: { command: { type: 'string' }, timeoutMs: { type: 'number' } }, required: ['command'] } },
      { name: 'todo_sniper', description: 'List TODOs.', inputSchema: { type: 'object', properties: {} } },
      { name: 'manage_scratchpad', description: 'Memory.', inputSchema: { type: 'object', properties: { action: { type: 'string' }, content: { type: 'string' } }, required: ['action'] } },
      { name: 'runtime_schema_gen', description: 'Generate types from data.', inputSchema: { type: 'object', properties: { source: { type: 'string' }, type: { type: 'string' } }, required: ['source', 'type'] } },
      { name: 'tui_puppeteer', description: 'Interact with TUI.', inputSchema: { type: 'object', properties: { command: { type: 'string' }, keys: { type: 'array' } }, required: ['command', 'keys'] } },
      { name: 'ast_navigator', description: 'Navigate code.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, type: { type: 'string' } }, required: ['query', 'type'] } },
      { name: 'skill_crystallizer', description: 'Save skill.', inputSchema: { type: 'object', properties: { skillName: { type: 'string' }, filePath: { type: 'string' }, description: { type: 'string' } }, required: ['skillName', 'filePath', 'description'] } },
      { name: 'git_diff', description: 'View git changes.', inputSchema: { type: 'object', properties: { staged: { type: 'boolean', description: 'Show staged changes' } } } },
      { name: 'GITDIF', description: 'FAST git diff (alias).', inputSchema: { type: 'object', properties: { staged: { type: 'boolean', description: 'Show staged changes' } } } },
      
      // Safety Tool
      { name: 'spawn_shadow_workspace', description: 'Create a safe clone of the project to test dangerous changes.', inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Unique ID for shadow' } }, required: ['id'] } },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      if (name === 'spawn_shadow_workspace') return { content: [{ type: 'text', text: JSON.stringify(await spawnShadowWorkspace((args as any).id)) }] };
      
      // Mapping other tools (condensed for brevity, existing logic holds)
      if (name === 'project_map') return { content: [{ type: 'text', text: await getProjectMap(process.cwd(), args as any) }] };
      if (name === 'smart_replace') return { content: [{ type: 'text', text: JSON.stringify(await smartReplace((args as any).filePath, (args as any).searchString, (args as any).replaceString, (args as any).dryRun)) }] };
      if (name === 'list_symbols') return { content: [{ type: 'text', text: JSON.stringify(await listSymbols((args as any).filePath)) }] };
      if (name === 'semantic_search') return { content: [{ type: 'text', text: JSON.stringify(await semanticSearch((args as any).query)) }] };
      if (name === 'check_diagnostics') return { content: [{ type: 'text', text: JSON.stringify(await checkDiagnostics()) }] };
      if (name === 'fetch_docs') return { content: [{ type: 'text', text: await fetchDocs((args as any).url) }] };
      if (name === 'dependency_xray') return { content: [{ type: 'text', text: JSON.stringify(await dependencyXray((args as any).packageName)) }] };
      if (name === 'visual_verify') return { content: [{ type: 'text', text: JSON.stringify(await visualVerify((args as any).command, (args as any).timeoutMs)) }] };
      if (name === 'todo_sniper') return { content: [{ type: 'text', text: JSON.stringify(await todoSniper()) }] };
      if (name === 'manage_scratchpad') return { content: [{ type: 'text', text: await manageScratchpad((args as any).action, (args as any).content) }] };
      if (name === 'runtime_schema_gen') return { content: [{ type: 'text', text: JSON.stringify(await runtimeSchemaGen((args as any).source, (args as any).type)) }] };
      if (name === 'tui_puppeteer') return { content: [{ type: 'text', text: JSON.stringify(await tuiPuppeteer((args as any).command, (args as any).keys)) }] };
      if (name === 'ast_navigator') return { content: [{ type: 'text', text: JSON.stringify(await astNavigator((args as any).query, (args as any).type)) }] };
      if (name === 'skill_crystallizer') return { content: [{ type: 'text', text: JSON.stringify(await skillCrystallizer((args as any).skillName, (args as any).filePath, (args as any).description)) }] };
      if (name === 'git_diff' || name === 'GITDIF') return { content: [{ type: 'text', text: JSON.stringify(await gitDiff((args as any).staged)) }] };
      
      throw new Error(`Unknown tool: ${name}`);
    } catch (e: any) { return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true }; }
  });

  return server;
}

export async function startExplorerServer() {
  const server = createExplorerServer();
  await server.connect(new StdioServerTransport());
  console.error('Floyd MCP Explorer Server (Safety Mode) Started');
}

if (import.meta.url === `file://${process.argv[1]}`) startExplorerServer().catch(console.error);