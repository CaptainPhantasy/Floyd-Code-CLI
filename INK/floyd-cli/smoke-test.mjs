#!/usr/bin/env node
/**
 * Floyd Chat Integration Smoke Test
 *
 * Comprehensive test of the Floyd Agent MCP Server and VSCode bridge integration
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const ANSI = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, emoji, ...args) {
  console.log(color + emoji + ANSI.reset, ...args);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  console.log(ANSI.bold + ANSI.blue + title + ANSI.reset);
  console.log('='.repeat(60));
}

const results = {
  floydCli: { pass: 0, fail: 0, warn: 0, tests: [] },
  vscodeExt: { pass: 0, fail: 0, warn: 0, tests: [] },
  integration: { pass: 0, fail: 0, warn: 0, tests: [] }
};

function recordResult(category, name, status, details = '') {
  const result = { name, status, details };
  results[category].tests.push(result);

  if (status === 'PASS') results[category].pass++;
  else if (status === 'FAIL') results[category].fail++;
  else results[category].warn++;
}

async function testFloydAgentServer() {
  header('PART 1: Floyd Agent MCP Server');

  const sourcePath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/mcp/agent-server.ts';
  const distPath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/dist/mcp/agent-server.js';
  const content = await readFile(sourcePath, 'utf-8');

  // Test 1: Source file exists
  log(ANSI.blue, '📋', 'Test 1.1: Source file exists');
  if (existsSync(sourcePath)) {
    log(ANSI.green, '✅', 'agent-server.ts exists');
    recordResult('floydCli', 'Source file exists', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Source file not found');
    recordResult('floydCli', 'Source file exists', 'FAIL');
  }

  // Test 2: Compiled output exists
  log(ANSI.blue, '📋', 'Test 1.2: Compiled output exists');
  if (existsSync(distPath)) {
    const distContent = await readFile(distPath, 'utf-8');
    log(ANSI.green, '✅', 'dist/mcp/agent-server.js exists (' + distContent.split('\n').length + ' lines)');
    recordResult('floydCli', 'Compiled output exists', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Compiled output not found');
    recordResult('floydCli', 'Compiled output exists', 'FAIL');
  }

  // Test 3: Required exports
  log(ANSI.blue, '📋', 'Test 1.3: Required exports present');
  const exports = ['createAgentServer', 'startAgentServer', 'ChatMessage', 'ChatSession', 'AgentClient', 'SessionManager'];
  const missing = [];
  for (const exp of exports) {
    if (!content.includes('export ' + exp) && !content.includes('export class ' + exp) && !content.includes('export interface ' + exp) && !content.includes('export async function ' + exp)) {
      missing.push(exp);
    }
  }
  if (missing.length === 0) {
    log(ANSI.green, '✅', 'All exports present:', exports.join(', '));
    recordResult('floydCli', 'Required exports', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Missing exports:', missing.join(', '));
    recordResult('floydCli', 'Required exports', 'FAIL', 'Missing: ' + missing.join(', '));
  }

  // Test 4: MCP tools defined
  log(ANSI.blue, '📋', 'Test 1.4: MCP tools defined');
  const tools = ['chat_send', 'chat_stream', 'chat_history', 'chat_status', 'chat_delete'];
  const missingTools = tools.filter(t => !content.includes(`name: '${t}'`));
  if (missingTools.length === 0) {
    log(ANSI.green, '✅', 'All MCP tools defined:', tools.join(', '));
    recordResult('floydCli', 'MCP tools', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Missing tools:', missingTools.join(', '));
    recordResult('floydCli', 'MCP tools', 'FAIL', 'Missing: ' + missingTools.join(', '));
  }

  // Test 5: Session management
  log(ANSI.blue, '📋', 'Test 1.5: Session management');
  if (content.includes('class SessionManager') && content.includes('getOrCreateSession')) {
    log(ANSI.green, '✅', 'SessionManager class with getOrCreateSession method');
    recordResult('floydCli', 'Session management', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Session management incomplete');
    recordResult('floydCli', 'Session management', 'FAIL');
  }

  // Test 6: Agent client
  log(ANSI.blue, '📋', 'Test 1.6: Agent client implementation');
  if (content.includes('class AgentClient') && content.includes('async chat') && content.includes('async *streamChat')) {
    log(ANSI.green, '✅', 'AgentClient with chat and streamChat methods');
    recordResult('floydCli', 'Agent client', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Agent client incomplete');
    recordResult('floydCli', 'Agent client', 'FAIL');
  }

  // Test 7: History persistence
  log(ANSI.blue, '📋', 'Test 1.7: History persistence');
  if (content.includes('chat-sessions.json') && content.includes('saveHistory') && content.includes('loadHistory')) {
    log(ANSI.green, '✅', 'History persistence to ~/.floyd/chat-sessions.json');
    recordResult('floydCli', 'History persistence', 'PASS');
  } else {
    log(ANSI.red, '❌', 'History persistence incomplete');
    recordResult('floydCli', 'History persistence', 'FAIL');
  }
}

async function testVSCodeExtension() {
  header('PART 2: VSCode Multi-Chat Extension');

  const extPath = '/Volumes/Storage/FLOYD_CLI/floyd-extensions/floyd-multi-chat';
  const sourcePath = path.join(extPath, 'src/extension.ts');
  const distPath = path.join(extPath, 'out/extension.js');
  const content = await readFile(sourcePath, 'utf-8');

  // Test 1: Source exists
  log(ANSI.blue, '📋', 'Test 2.1: Extension source exists');
  if (existsSync(sourcePath)) {
    log(ANSI.green, '✅', 'extension.ts exists');
    recordResult('vscodeExt', 'Extension source exists', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Extension source not found');
    recordResult('vscodeExt', 'Extension source exists', 'FAIL');
  }

  // Test 2: Compiled output exists
  log(ANSI.blue, '📋', 'Test 2.2: Extension compiled');
  if (existsSync(distPath)) {
    const distContent = await readFile(distPath, 'utf-8');
    log(ANSI.green, '✅', 'out/extension.js exists (' + distContent.split('\n').length + ' lines)');
    recordResult('vscodeExt', 'Extension compiled', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Compiled extension not found');
    recordResult('vscodeExt', 'Extension compiled', 'FAIL');
  }

  // Test 3: Bridge server
  log(ANSI.blue, '📋', 'Test 2.3: Floyd Bridge Server');
  if (content.includes('class FloydBridgeServer') && content.includes('BRIDGE_PORT')) {
    log(ANSI.green, '✅', 'FloydBridgeServer class defined');
    recordResult('vscodeExt', 'Bridge server class', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Bridge server not found');
    recordResult('vscodeExt', 'Bridge server class', 'FAIL');
  }

  // Test 4: HTTP endpoints
  log(ANSI.blue, '📋', 'Test 2.4: HTTP endpoints');
  const endpoints = ['/status', '/sessions', '/open', '/send', '/close'];
  const missingEndpoints = endpoints.filter(e => !content.includes(`'${e}'`) && !content.includes(`"${e}"`));
  if (missingEndpoints.length === 0) {
    log(ANSI.green, '✅', 'All HTTP endpoints defined:', endpoints.join(', '));
    recordResult('vscodeExt', 'HTTP endpoints', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Missing endpoints:', missingEndpoints.join(', '));
    recordResult('vscodeExt', 'HTTP endpoints', 'FAIL', 'Missing: ' + missingEndpoints.join(', '));
  }

  // Test 5: sendMessageToSession method
  log(ANSI.blue, '📋', 'Test 2.5: sendMessageToSession method');
  if (content.includes('sendMessageToSession') && content.includes('sendViaFloydAgent')) {
    log(ANSI.green, '✅', 'sendMessageToSession with Floyd agent integration');
    recordResult('vscodeExt', 'sendMessageToSession', 'PASS');
  } else {
    log(ANSI.red, '❌', 'sendMessageToSession method not found');
    recordResult('vscodeExt', 'sendMessageToSession', 'FAIL');
  }

  // Test 6: Floyd agent integration
  log(ANSI.blue, '📋', 'Test 2.6: Floyd agent server integration');
  if (content.includes('checkFloydAgentServer') && content.includes('localhost:34568')) {
    log(ANSI.green, '✅', 'Floyd agent server check at localhost:34568');
    recordResult('vscodeExt', 'Floyd agent integration', 'PASS');
  } else {
    log(ANSI.yellow, '⚠️', 'Floyd agent integration may be incomplete');
    recordResult('vscodeExt', 'Floyd agent integration', 'WARN', 'Integration not found');
  }

  // Test 7: Bridge server startup
  log(ANSI.blue, '📋', 'Test 2.7: Bridge server startup in activate()');
  if (content.includes('bridgeServer.start()') && content.includes('bridgeServer.setManager')) {
    log(ANSI.green, '✅', 'Bridge server starts on extension activation');
    recordResult('vscodeExt', 'Bridge server startup', 'PASS');
  } else {
    log(ANSI.red, '❌', 'Bridge server startup not configured');
    recordResult('vscodeExt', 'Bridge server startup', 'FAIL');
  }
}

async function testBridgeClient() {
  header('PART 3: Floyd CLI Bridge Client');

  const bridgePath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/integrations/vscode-chat-bridge.ts';
  const distPath = '/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/dist/integrations/vscode-chat-bridge.js';

  if (existsSync(bridgePath)) {
    const content = await readFile(bridgePath, 'utf-8');

    // Test 1: Source exists
    log(ANSI.blue, '📋', 'Test 3.1: Bridge client source exists');
    log(ANSI.green, '✅', 'vscode-chat-bridge.ts exists');
    recordResult('integration', 'Bridge client source', 'PASS');

    // Test 2: Compiled
    log(ANSI.blue, '📋', 'Test 3.2: Bridge client compiled');
    if (existsSync(distPath)) {
      log(ANSI.green, '✅', 'dist/integrations/vscode-chat-bridge.js exists');
      recordResult('integration', 'Bridge client compiled', 'PASS');
    } else {
      log(ANSI.red, '❌', 'Bridge client not compiled');
      recordResult('integration', 'Bridge client compiled', 'FAIL');
    }

    // Test 3: VSCodeChatBridge class
    log(ANSI.blue, '📋', 'Test 3.3: VSCodeChatBridge class');
    if (content.includes('export class VSCodeChatBridge')) {
      log(ANSI.green, '✅', 'VSCodeChatBridge class exported');
      recordResult('integration', 'VSCodeChatBridge class', 'PASS');
    } else {
      log(ANSI.red, '❌', 'VSCodeChatBridge class not found');
      recordResult('integration', 'VSCodeChatBridge class', 'FAIL');
    }

    // Test 4: Bridge methods
    log(ANSI.blue, '📋', 'Test 3.4: Bridge client methods');
    const methods = ['isAvailable', 'openChat', 'sendMessage', 'listSessions', 'closeSession'];
    const missingMethods = methods.filter(m => !content.includes(m));
    if (missingMethods.length === 0) {
      log(ANSI.green, '✅', 'All methods present:', methods.join(', '));
      recordResult('integration', 'Bridge client methods', 'PASS');
    } else {
      log(ANSI.red, '❌', 'Missing methods:', missingMethods.join(', '));
      recordResult('integration', 'Bridge client methods', 'FAIL', 'Missing: ' + missingMethods.join(', '));
    }

    // Test 5: Helper functions
    log(ANSI.blue, '📋', 'Test 3.5: Helper functions');
    if (content.includes('openVSCodeChat') && content.includes('sendToVSCodeChat')) {
      log(ANSI.green, '✅', 'Helper functions openVSCodeChat, sendToVSCodeChat');
      recordResult('integration', 'Helper functions', 'PASS');
    } else {
      log(ANSI.red, '❌', 'Helper functions not found');
      recordResult('integration', 'Helper functions', 'FAIL');
    }

    // Test 6: Bridge configuration
    log(ANSI.blue, '📋', 'Test 3.6: Bridge port configuration');
    if (content.includes('BRIDGE_PORT = 34567')) {
      log(ANSI.green, '✅', 'Bridge configured for port 34567');
      recordResult('integration', 'Bridge port config', 'PASS');
    } else {
      log(ANSI.red, '❌', 'Bridge port not configured correctly');
      recordResult('integration', 'Bridge port config', 'FAIL');
    }
  } else {
    log(ANSI.red, '❌', 'Bridge client source not found');
    recordResult('integration', 'Bridge client source', 'FAIL');
  }
}

function printSummary() {
  header('SMOKE TEST SUMMARY');

  const totalTests = results.floydCli.tests.length + results.vscodeExt.tests.length + results.integration.tests.length;
  const totalPass = results.floydCli.pass + results.vscodeExt.pass + results.integration.pass;
  const totalFail = results.floydCli.fail + results.vscodeExt.fail + results.integration.fail;
  const totalWarn = results.floydCli.warn + results.vscodeExt.warn + results.integration.warn;

  console.log(`\n${ANSI.bold}Total Tests:${ANSI.reset} ${totalTests}`);
  console.log(`${ANSI.green}✅ Passed:${ANSI.reset} ${totalPass}`);
  console.log(`${ANSI.red}❌ Failed:${ANSI.reset} ${totalFail}`);
  console.log(`${ANSI.yellow}⚠️  Warnings:${ANSI.reset} ${totalWarn}`);

  // Floyd CLI Results
  console.log(`\n${ANSI.blue}${ANSI.bold}Floyd CLI (${results.floydCli.tests.length} tests)${ANSI.reset}`);
  for (const t of results.floydCli.tests) {
    const icon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⚠️';
    const color = t.status === 'PASS' ? ANSI.green : t.status === 'FAIL' ? ANSI.red : ANSI.yellow;
    console.log(`  ${color}${icon} ${t.name}${ANSI.reset}`);
  }

  // VSCode Extension Results
  console.log(`\n${ANSI.magenta}${ANSI.bold}VSCode Extension (${results.vscodeExt.tests.length} tests)${ANSI.reset}`);
  for (const t of results.vscodeExt.tests) {
    const icon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⚠️';
    const color = t.status === 'PASS' ? ANSI.green : t.status === 'FAIL' ? ANSI.red : ANSI.yellow;
    console.log(`  ${color}${icon} ${t.name}${ANSI.reset}`);
  }

  // Integration Results
  console.log(`\n${ANSI.cyan}${ANSI.bold}Integration (${results.integration.tests.length} tests)${ANSI.reset}`);
  for (const t of results.integration.tests) {
    const icon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⚠️';
    const color = t.status === 'PASS' ? ANSI.green : t.status === 'FAIL' ? ANSI.red : ANSI.yellow;
    console.log(`  ${color}${icon} ${t.name}${ANSI.reset}`);
  }

  console.log('\n' + '='.repeat(60));

  if (totalFail === 0) {
    console.log(ANSI.green + ANSI.bold + '🎉 ALL TESTS PASSED!' + ANSI.reset);
    console.log(ANSI.green + 'The Floyd Chat integration is ready for use.' + ANSI.reset);
  } else {
    console.log(ANSI.red + ANSI.bold + '⚠️  SOME TESTS FAILED' + ANSI.reset);
    console.log(ANSI.red + 'Please fix the issues above before deployment.' + ANSI.reset);
  }

  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log(ANSI.bold + ANSI.blue + '\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          FLOYD CHAT INTEGRATION SMOKE TEST              ║');
  console.log('╚════════════════════════════════════════════════════════════╝' + ANSI.reset);

  await testFloydAgentServer();
  await testVSCodeExtension();
  await testBridgeClient();
  printSummary();

  process.exit(results.floydCli.fail + results.vscodeExt.fail + results.integration.fail > 0 ? 1 : 0);
}

main().catch(console.error);
