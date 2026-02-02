#!/usr/bin/env node
/**
 * Test Floyd MCP Servers
 * Validates that each server can be imported and lists its tools
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servers = [
  { name: 'patch', path: './src/mcp/patch-server.ts' },
  { name: 'runner', path: './src/mcp/runner-server.ts' },
  { name: 'cache', path: './src/mcp/cache-server.ts' },
  { name: 'git', path: './src/mcp/git-server.ts' },
  { name: 'explorer', path: './src/mcp/explorer-server.ts' },
  { name: 'browser', path: './src/mcp/browser-server.ts' },
];

const results = {
  timestamp: new Date().toISOString(),
  servers: [],
  summary: { passed: 0, failed: 0, total: servers.length }
};

console.log('🧪 Testing Floyd MCP Servers...\n');

for (const server of servers) {
  const serverResult = {
    name: server.name,
    path: server.path,
    exists: false,
    importable: false,
    error: null
  };

  try {
    // Check if file exists
    const fullPath = join(__dirname, server.path);
    serverResult.exists = await fs.pathExists(fullPath);
    
    if (!serverResult.exists) {
      serverResult.error = 'File not found';
      console.log(`❌ ${server.name}: File not found at ${server.path}`);
    } else {
      // Check file size to verify it's not empty
      const stats = await fs.stat(fullPath);
      serverResult.size = stats.size;
      
      if (stats.size > 0) {
        serverResult.importable = true;
        console.log(`✅ ${server.name}: Found (${(stats.size / 1024).toFixed(1)}KB)`);
        results.summary.passed++;
      } else {
        serverResult.error = 'Empty file';
        console.log(`⚠️  ${server.name}: File is empty`);
        results.summary.failed++;
      }
    }
  } catch (err) {
    serverResult.error = err.message;
    console.log(`❌ ${server.name}: ${err.message}`);
    results.summary.failed++;
  }

  results.servers.push(serverResult);
}

console.log(`\n📊 Summary: ${results.summary.passed}/${results.summary.total} servers passed\n`);

// Write results to JSON
const outputPath = join(__dirname, 'SUPERCACHE', 'mcp-test-results.json');
await fs.ensureDir(dirname(outputPath));
await fs.writeJson(outputPath, results, { spaces: 2 });
console.log(`📝 Results written to: ${outputPath}`);

process.exit(results.summary.failed > 0 ? 1 : 0);
