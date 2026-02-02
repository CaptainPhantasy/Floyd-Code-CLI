#!/usr/bin/env node
/**
 * Smoke Test for Floyd Agent MCP Server
 *
 * Tests the agent server functionality
 */

import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ANSI_GREEN = '\x1b[32m';
const ANSI_RED = '\x1b[31m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_BLUE = '\x1b[36m';
const ANSI_RESET = '\x1b[0m';

function log(color, emoji, ...args) {
  console.log(color + emoji + ' ' + ANSI_RESET, ...args);
}

async function testAgentServer() {
  log(ANSI_BLUE, '🧪', 'Starting Floyd Agent MCP Server Smoke Test...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Verify compiled output exists
  log(ANSI_BLUE, '📋', 'Test 1: Verify agent-server.ts compiled successfully');
  const compiledPath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/dist/mcp/agent-server.js';
  if (existsSync(compiledPath)) {
    log(ANSI_GREEN, '✅', 'Compiled file exists at dist/mcp/agent-server.js');
    results.passed++;
    results.tests.push({ name: 'Compilation', status: 'PASS' });
  } else {
    log(ANSI_RED, '❌', 'Compiled file NOT found. Run: npm run build');
    results.failed++;
    results.tests.push({ name: 'Compilation', status: 'FAIL', error: 'Compiled output not found' });
  }

  // Test 2: Verify source file structure
  log(ANSI_BLUE, '📋', '\nTest 2: Verify agent-server source structure');
  const sourcePath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/mcp/agent-server.ts';
  if (existsSync(sourcePath)) {
    const content = await readFile(sourcePath, 'utf-8');
    const requiredExports = ['createAgentServer', 'startAgentServer', 'AgentClient', 'SessionManager'];
    const missing = [];

    for (const exp of requiredExports) {
      if (!content.includes(`export ${exp}`) && !content.includes(`export class ${exp}`)) {
        missing.push(exp);
      }
    }

    if (missing.length === 0) {
      log(ANSI_GREEN, '✅', `All required exports present: ${requiredExports.join(', ')}`);
      results.passed++;
      results.tests.push({ name: 'Exports', status: 'PASS' });
    } else {
      log(ANSI_RED, '❌', `Missing exports: ${missing.join(', ')}`);
      results.failed++;
      results.tests.push({ name: 'Exports', status: 'FAIL', error: `Missing: ${missing}` });
    }
  } else {
    log(ANSI_RED, '❌', 'Source file not found!');
    results.failed++;
    results.tests.push({ name: 'Source file', status: 'FAIL', error: 'File not found' });
  }

  // Test 3: Verify MCP tools are defined
  log(ANSI_BLUE, '📋', '\nTest 3: Verify MCP tools are defined');
  const sourceContent = await readFile(sourcePath, 'utf-8');
  const requiredTools = ['chat_send', 'chat_stream', 'chat_history', 'chat_status', 'chat_delete'];
  const missingTools = requiredTools.filter(t => !sourceContent.includes(`name: '${t}'`));

  if (missingTools.length === 0) {
    log(ANSI_GREEN, '✅', `All MCP tools defined: ${requiredTools.join(', ')}`);
    results.passed++;
    results.tests.push({ name: 'MCP Tools', status: 'PASS' });
  } else {
    log(ANSI_RED, '❌', `Missing tools: ${missingTools.join(', ')}`);
    results.failed++;
    results.tests.push({ name: 'MCP Tools', status: 'FAIL', error: `Missing: ${missingTools}` });
  }

  // Test 4: Check API key handling
  log(ANSI_BLUE, '📋', '\nTest 4: Verify API key configuration');
  if (sourceContent.includes('FLOYD_GLM_API_KEY') && sourceContent.includes('GLM_API_KEY')) {
    log(ANSI_GREEN, '✅', 'API key environment variables handled correctly');
    results.passed++;
    results.tests.push({ name: 'API Key Config', status: 'PASS' });
  } else {
    log(ANSI_RED, '❌', 'API key handling not found');
    results.failed++;
    results.tests.push({ name: 'API Key Config', status: 'FAIL' });
  }

  // Test 5: Verify session management
  log(ANSI_BLUE, '📋', '\nTest 5: Verify session management implementation');
  if (sourceContent.includes('class SessionManager') &&
      sourceContent.includes('getOrCreateSession') &&
      sourceContent.includes('getSession')) {
    log(ANSI_GREEN, '✅', 'Session management properly implemented');
    results.passed++;
    results.tests.push({ name: 'Session Management', status: 'PASS' });
  } else {
    log(ANSI_RED, '❌', 'Session management incomplete');
    results.failed++;
    results.tests.push({ name: 'Session Management', status: 'FAIL' });
  }

  // Test 6: Check streaming support
  log(ANSI_BLUE, '📋', '\nTest 6: Verify streaming chat support');
  if (sourceContent.includes('streamChat') && sourceContent.includes('AsyncGenerator')) {
    log(ANSI_GREEN, '✅', 'Streaming chat support implemented');
    results.passed++;
    results.tests.push({ name: 'Streaming Support', status: 'PASS' });
  } else {
    log(ANSI_YELLOW, '⚠️', 'Streaming support may be incomplete');
    results.tests.push({ name: 'Streaming Support', status: 'WARN' });
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  log(ANSI_BLUE, '📊', 'SMOKE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`${ANSI_GREEN}Passed: ${results.passed}${ANSI_RESET}`);
  console.log(`${ANSI_RED}Failed: ${results.failed}${ANSI_RESET}`);

  if (results.tests.some(t => t.status === 'WARN')) {
    const warns = results.tests.filter(t => t.status === 'WARN').length;
    console.log(`${ANSI_YELLOW}Warnings: ${warns}${ANSI_RESET}`);
  }

  console.log('\nDetailed Results:');
  for (const test of results.tests) {
    const status = test.status === 'PASS' ? ANSI_GREEN + '✅' :
                   test.status === 'FAIL' ? ANSI_RED + '❌' :
                   ANSI_YELLOW + '⚠️';
    console.log(`  ${status} ${test.name}${ANSI_RESET}`);
    if (test.error) {
      console.log(`     └─ ${test.error}`);
    }
  }

  console.log('='.repeat(50));

  return results;
}

// Run tests
testAgentServer()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
