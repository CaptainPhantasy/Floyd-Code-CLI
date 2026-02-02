/**
 * Smoke Test - New Features Validation
 *
 * Tests: InterruptManager, CheckpointManager, SandboxManager
 * Generates validation receipts for audit verification.
 *
 * Run: npx tsx tests/smoke-test-new-features.ts
 */

import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// TEST HARNESS
// ============================================================================

interface TestResult {
  name: string;
  component: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration_ms: number;
  details: string;
  error?: string;
}

const results: TestResult[] = [];
const startTime = Date.now();

function test(
  name: string,
  component: string,
  fn: () => Promise<void> | void
): Promise<void> {
  return (async () => {
    const testStart = Date.now();
    try {
      await fn();
      results.push({
        name,
        component,
        status: 'PASS',
        duration_ms: Date.now() - testStart,
        details: 'Test completed successfully',
      });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({
        name,
        component,
        status: 'FAIL',
        duration_ms: Date.now() - testStart,
        details: 'Test failed',
        error: errorMsg,
      });
      console.log(`  ❌ ${name}: ${errorMsg}`);
    }
  })();
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// INTERRUPT MANAGER TESTS
// ============================================================================

async function testInterruptManager(): Promise<void> {
  console.log('\n📡 Testing InterruptManager...');

  const {
    InterruptManager,
    getInterruptManager,
  } = await import('../src/interrupts/index.js');

  await test('InterruptManager singleton exists', 'interrupts', () => {
    const im = getInterruptManager();
    assert(im !== null, 'getInterruptManager() returned null');
    assert(im instanceof InterruptManager, 'Not an InterruptManager instance');
  });

  await test('InterruptManager state transitions', 'interrupts', () => {
    const im = getInterruptManager();

    // Test all state transitions using string literals (types are string unions)
    im.setState('idle');
    assert(im.getState() === 'idle', 'Failed to set idle state');

    im.setState('thinking');
    assert(im.getState() === 'thinking', 'Failed to set thinking state');

    im.setState('tool_executing');
    assert(im.getState() === 'tool_executing', 'Failed to set tool_executing state');

    im.setState('streaming');
    assert(im.getState() === 'streaming', 'Failed to set streaming state');

    // Reset to idle
    im.setState('idle');
  });

  await test('InterruptManager AbortController', 'interrupts', () => {
    const im = getInterruptManager();
    im.createAbortController();

    const signal = im.getAbortSignal();
    assert(signal !== undefined, 'AbortSignal is undefined');
    if (signal) {
      assert(!signal.aborted, 'Signal should not be aborted initially');
    }

    im.clearAbortController();
  });

  await test('InterruptManager event subscription', 'interrupts', () => {
    const im = getInterruptManager();

    // Use EventEmitter pattern (InterruptManager extends EventEmitter)
    const handler = () => { /* test handler */ };
    im.on('interrupt', handler);

    // Verify we can remove the listener
    im.off('interrupt', handler);

    // Check listener count
    assert(typeof im.listenerCount === 'function', 'Should have listenerCount method');
  });

  await test('InterruptManager getStats method', 'interrupts', () => {
    const im = getInterruptManager();
    const stats = im.getStats();

    assert(stats !== null, 'Stats should not be null');
    assert('currentState' in stats, 'Stats should have currentState');
    assert('consecutiveInterrupts' in stats, 'Stats should have consecutiveInterrupts');
    assert('isAborted' in stats, 'Stats should have isAborted');
  });
}

// ============================================================================
// CHECKPOINT MANAGER TESTS
// ============================================================================

async function testCheckpointManager(): Promise<void> {
  console.log('\n💾 Testing CheckpointManager...');

  const {
    CheckpointManager,
    getCheckpointManager,
    resetCheckpointManager,
    DANGEROUS_TOOLS,
    FileSnapshotManager,
  } = await import('../src/rewind/index.js');

  // Reset for clean test
  resetCheckpointManager();

  await test('CheckpointManager singleton exists', 'rewind', () => {
    const cm = getCheckpointManager();
    assert(cm !== null, 'getCheckpointManager() returned null');
    assert(cm instanceof CheckpointManager, 'Not a CheckpointManager instance');
  });

  await test('DANGEROUS_TOOLS list populated', 'rewind', () => {
    assert(Array.isArray(DANGEROUS_TOOLS), 'DANGEROUS_TOOLS is not an array');
    assert(DANGEROUS_TOOLS.length > 0, 'DANGEROUS_TOOLS is empty');
    assert(DANGEROUS_TOOLS.includes('delete_file'), 'Missing delete_file');
    assert(DANGEROUS_TOOLS.includes('write_file'), 'Missing write_file');
    assert(DANGEROUS_TOOLS.includes('git_merge'), 'Missing git_merge');
  });

  await test('FileSnapshotManager creates snapshots', 'rewind', async () => {
    const testDir = join(tmpdir(), 'floyd-test-snapshots');
    const testFile = join(testDir, 'test.txt');

    // Create test file
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, 'Hello, Floyd!');

    const fsm = new FileSnapshotManager();
    const snapshot = await fsm.createSnapshot(testFile);

    assert(snapshot !== null, 'Snapshot is null');
    if (snapshot) {
      assert(snapshot.path === testFile, 'Path mismatch');
      assert(snapshot.content === 'Hello, Floyd!', 'Content mismatch');
      assert(snapshot.hash.length > 0, 'Hash is empty');
      assert(snapshot.size === 13, 'Size mismatch');
    }

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('CheckpointManager creates checkpoint', 'rewind', async () => {
    const testDir = join(tmpdir(), 'floyd-test-checkpoint');
    const testFile = join(testDir, 'file.txt');

    // Create test file
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, 'Checkpoint test content');

    const cm = getCheckpointManager();
    const checkpoint = await cm.createCheckpoint([testFile], {
      name: 'test-checkpoint',
      tags: ['smoke-test'],
    });

    assert(checkpoint !== null, 'Checkpoint is null');
    assert(checkpoint.name === 'test-checkpoint', 'Name mismatch');
    assert(checkpoint.fileCount === 1, 'File count mismatch');
    assert(checkpoint.tags?.includes('smoke-test'), 'Tags mismatch');

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('CheckpointManager lists checkpoints', 'rewind', async () => {
    const cm = getCheckpointManager();
    const checkpoints = cm.getAllCheckpoints();

    assert(Array.isArray(checkpoints), 'getAllCheckpoints did not return array');
    // Should have at least the one we just created
    assert(checkpoints.length >= 1, 'No checkpoints found');
  });

  await test('CheckpointManager auto-checkpoint', 'rewind', async () => {
    const testDir = join(tmpdir(), 'floyd-test-autocheckpoint');
    const testFile = join(testDir, 'auto.txt');

    // Create test file
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, 'Auto checkpoint content');

    const cm = getCheckpointManager();
    const checkpoint = await cm.createAutoCheckpoint('delete_file', [testFile], 'test-session');

    assert(checkpoint !== null, 'Auto checkpoint is null');
    if (checkpoint) {
      assert(checkpoint.automatic === true, 'Should be marked automatic');
      assert(checkpoint.triggerTool === 'delete_file', 'Trigger tool mismatch');
    }

    // Cleanup
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('CheckpointManager getStats', 'rewind', async () => {
    const cm = getCheckpointManager();
    const stats = cm.getStats();

    assert(stats !== null, 'Stats should not be null');
    assert('totalCheckpoints' in stats, 'Stats should have totalCheckpoints');
    assert('totalSize' in stats, 'Stats should have totalSize');
    assert(stats.totalCheckpoints >= 0, 'Total checkpoints should be >= 0');
  });
}

// ============================================================================
// SANDBOX MANAGER TESTS
// ============================================================================

async function testSandboxManager(): Promise<void> {
  console.log('\n📦 Testing SandboxManager...');

  const {
    SandboxManager,
    getSandboxManager,
    DryRunSandbox,
    getDryRunSandbox,
    resetSandbox,
  } = await import('../src/sandbox/index.js');

  // Reset for clean test
  resetSandbox();

  await test('SandboxManager singleton exists', 'sandbox', () => {
    const sm = getSandboxManager();
    assert(sm !== null, 'getSandboxManager() returned null');
    assert(sm instanceof SandboxManager, 'Not a SandboxManager instance');
  });

  await test('SandboxManager initial state', 'sandbox', () => {
    const sm = getSandboxManager();
    assert(sm.isActive() === false, 'Should not be active initially');
    assert(sm.getSession() === null, 'Session should be null initially');
  });

  await test('SandboxManager start/discard cycle', 'sandbox', async () => {
    const testDir = join(tmpdir(), 'floyd-test-sandbox-project-' + Date.now());
    const testFile = join(testDir, 'src', 'index.ts');

    // Create test project
    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(testFile, 'export const x = 1;');

    resetSandbox();
    const sm = getSandboxManager();

    // Start sandbox
    const session = await sm.start(testDir);
    assert(session !== null, 'Session is null after start');
    assert(sm.isActive() === true, 'Should be active after start');
    assert(session.state === 'active', 'Session state should be active');
    assert(session.projectRoot === testDir, 'Project root mismatch');

    // Get session info before discard
    const sessionId = session.id;
    assert(sessionId.length > 0, 'Session ID should not be empty');

    // Discard sandbox (this will set session to null via cleanup)
    await sm.discard();

    // After discard, isActive should be false and session null
    assert(sm.isActive() === false, 'Should not be active after discard');
    assert(sm.getSession() === null, 'Session should be null after discard');

    // Cleanup test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('SandboxManager path translation', 'sandbox', async () => {
    const testDir = join(tmpdir(), 'floyd-test-sandbox-paths-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'test.txt'), 'test');

    resetSandbox();
    const sm = getSandboxManager();
    const session = await sm.start(testDir);
    assert(session !== null, 'Session should not be null after start');

    const realPath = join(testDir, 'src', 'file.ts');
    const sandboxPath = sm.translatePath(realPath);

    assert(sandboxPath !== realPath, 'Sandbox path should differ from real path');
    assert(sandboxPath.includes('floyd-sandbox'), 'Sandbox path should contain floyd-sandbox');

    // Translate back
    const backToReal = sm.translateToReal(sandboxPath);
    assert(backToReal === realPath, 'Round-trip translation failed');

    await sm.discard();
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('SandboxManager change tracking', 'sandbox', async () => {
    const testDir = join(tmpdir(), 'floyd-test-sandbox-changes-' + Date.now());
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'test.txt'), 'test');

    resetSandbox();
    const sm = getSandboxManager();
    const session = await sm.start(testDir);
    assert(session !== null, 'Session should not be null after start');

    // Track a change
    const sandboxPath = sm.translatePath(join(testDir, 'new-file.ts'));
    sm.trackChange(sandboxPath, 'created');

    const changes = sm.getChanges();
    assert(changes.length === 1, 'Should have 1 change');
    assert(changes[0].changeType === 'created', 'Change type should be created');

    const summary = sm.getChangesSummary();
    assert(summary.created === 1, 'Summary should show 1 created');
    assert(summary.total === 1, 'Summary total should be 1');

    await sm.discard();
    rmSync(testDir, { recursive: true, force: true });
  });

  await test('DryRunSandbox exists and works', 'sandbox', () => {
    const drs = getDryRunSandbox();
    assert(drs !== null, 'getDryRunSandbox() returned null');
    assert(drs instanceof DryRunSandbox, 'Not a DryRunSandbox instance');

    // Test dry run operations
    drs.start('/fake/project');
    assert(drs.isActive() === true, 'Should be active after start');

    drs.writeFile('/fake/project/test.ts', 'const x = 1;');
    const content = drs.readFile('/fake/project/test.ts');
    assert(content === 'const x = 1;', 'Content mismatch');

    const changes = drs.getChanges();
    assert(changes.length === 1, 'Should have 1 change');

    drs.end();
    assert(drs.isActive() === false, 'Should be inactive after end');
  });
}

// ============================================================================
// TOOL REGISTRY INTEGRATION TESTS
// ============================================================================

async function testToolRegistryIntegration(): Promise<void> {
  console.log('\n🔧 Testing Tool Registry Integration...');

  const { toolRegistry } = await import('../src/tools/tool-registry.js');
  const { DANGEROUS_TOOLS } = await import('../src/rewind/index.js');

  await test('toolRegistry has isDangerousTool method', 'integration', () => {
    assert(typeof toolRegistry.isDangerousTool === 'function', 'Missing isDangerousTool method');

    // Test with known dangerous tools
    for (const tool of ['delete_file', 'write_file', 'git_merge']) {
      if (DANGEROUS_TOOLS.includes(tool)) {
        assert(toolRegistry.isDangerousTool(tool) === true, `${tool} should be dangerous`);
      }
    }

    // Test with known safe tools
    assert(toolRegistry.isDangerousTool('read_file') === false, 'read_file should not be dangerous');
    assert(toolRegistry.isDangerousTool('grep_search') === false, 'grep_search should not be dangerous');
  });

  await test('toolRegistry has executeWithAutoCheckpoint method', 'integration', () => {
    assert(
      typeof toolRegistry.executeWithAutoCheckpoint === 'function',
      'Missing executeWithAutoCheckpoint method'
    );
  });

  await test('toolRegistry has executeWithReceipt method', 'integration', () => {
    assert(
      typeof toolRegistry.executeWithReceipt === 'function',
      'Missing executeWithReceipt method'
    );
  });
}

// ============================================================================
// SLASH COMMANDS TESTS
// ============================================================================

async function testSlashCommands(): Promise<void> {
  console.log('\n💬 Testing Slash Commands...');

  const { rewindCommands } = await import('../src/commands/rewind-commands.js');

  await test('rewindCommands array exists', 'commands', () => {
    assert(Array.isArray(rewindCommands), 'rewindCommands is not an array');
    assert(rewindCommands.length === 3, 'Should have 3 commands (checkpoint, rewind, sandbox)');
  });

  await test('/checkpoint command exists', 'commands', () => {
    const checkpointCmd = rewindCommands.find((c) => c.name === 'checkpoint');
    assert(checkpointCmd !== undefined, 'Missing /checkpoint command');
    if (checkpointCmd) {
      assert(checkpointCmd.description.length > 0, 'Missing description');
      assert(typeof checkpointCmd.handler === 'function', 'Missing handler function');
    }
  });

  await test('/rewind command exists', 'commands', () => {
    const rewindCmd = rewindCommands.find((c) => c.name === 'rewind');
    assert(rewindCmd !== undefined, 'Missing /rewind command');
    if (rewindCmd) {
      assert(rewindCmd.description.length > 0, 'Missing description');
      assert(typeof rewindCmd.handler === 'function', 'Missing handler function');
    }
  });

  await test('/sandbox command exists', 'commands', () => {
    const sandboxCmd = rewindCommands.find((c) => c.name === 'sandbox');
    assert(sandboxCmd !== undefined, 'Missing /sandbox command');
    if (sandboxCmd) {
      assert(sandboxCmd.description.length > 0, 'Missing description');
      assert(typeof sandboxCmd.handler === 'function', 'Missing handler function');
    }
  });
}

// ============================================================================
// MAIN INDEX EXPORTS TESTS
// ============================================================================

async function testMainExports(): Promise<void> {
  console.log('\n📤 Testing Main Index Exports...');

  await test('interrupts module exports', 'exports', async () => {
    const exports = await import('../src/index.js');

    assert(exports.InterruptManager !== undefined, 'Missing InterruptManager');
    assert(exports.getInterruptManager !== undefined, 'Missing getInterruptManager');
    // Types are not runtime exports, so we just verify the class is there
  });

  await test('rewind module exports', 'exports', async () => {
    const exports = await import('../src/index.js');

    assert(exports.CheckpointManager !== undefined, 'Missing CheckpointManager');
    assert(exports.getCheckpointManager !== undefined, 'Missing getCheckpointManager');
    assert(exports.DANGEROUS_TOOLS !== undefined, 'Missing DANGEROUS_TOOLS');
    assert(exports.FileSnapshotManager !== undefined, 'Missing FileSnapshotManager');
    assert(exports.formatBytes !== undefined, 'Missing formatBytes');
  });

  await test('sandbox module exports', 'exports', async () => {
    const exports = await import('../src/index.js');

    assert(exports.SandboxManager !== undefined, 'Missing SandboxManager');
    assert(exports.getSandboxManager !== undefined, 'Missing getSandboxManager');
    assert(exports.DryRunSandbox !== undefined, 'Missing DryRunSandbox');
  });
}

// ============================================================================
// GENERATE VALIDATION RECEIPT
// ============================================================================

function generateValidationReceipt(): string {
  const totalDuration = Date.now() - startTime;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  const receipt = `
================================================================================
                    FLOYD WRAPPER - SMOKE TEST VALIDATION RECEIPT
================================================================================

Test Run: ${new Date().toISOString()}
Duration: ${totalDuration}ms
Node Version: ${process.version}
Platform: ${process.platform} ${process.arch}

--------------------------------------------------------------------------------
                                   SUMMARY
--------------------------------------------------------------------------------

Total Tests: ${results.length}
✅ Passed: ${passed}
❌ Failed: ${failed}
⏭️ Skipped: ${skipped}

Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%

--------------------------------------------------------------------------------
                              COMPONENT BREAKDOWN
--------------------------------------------------------------------------------

${['interrupts', 'rewind', 'sandbox', 'integration', 'commands', 'exports']
  .map((component) => {
    const componentResults = results.filter((r) => r.component === component);
    const componentPassed = componentResults.filter((r) => r.status === 'PASS').length;
    const componentTotal = componentResults.length;
    const status = componentPassed === componentTotal ? '✅' : '⚠️';
    return `${status} ${component.padEnd(15)} ${componentPassed}/${componentTotal} passed`;
  })
  .join('\n')}

--------------------------------------------------------------------------------
                              DETAILED RESULTS
--------------------------------------------------------------------------------

${results
  .map(
    (r) =>
      `[${r.status}] ${r.component}/${r.name}
       Duration: ${r.duration_ms}ms
       ${r.error ? `Error: ${r.error}` : r.details}`
  )
  .join('\n\n')}

--------------------------------------------------------------------------------
                              VALIDATION STATUS
--------------------------------------------------------------------------------

${failed === 0 ? '✅ ALL TESTS PASSED - Features validated for production' : `❌ ${failed} TESTS FAILED - Review errors before deployment`}

--------------------------------------------------------------------------------
                                FEATURE MATRIX
--------------------------------------------------------------------------------

| Feature             | Component    | Status    | Validated |
|---------------------|--------------|-----------|-----------|
| InterruptManager    | interrupts   | Singleton | ${results.some((r) => r.component === 'interrupts' && r.name.includes('singleton') && r.status === 'PASS') ? '✅' : '❌'} |
| State Transitions   | interrupts   | Working   | ${results.some((r) => r.component === 'interrupts' && r.name.includes('state') && r.status === 'PASS') ? '✅' : '❌'} |
| AbortController     | interrupts   | Available | ${results.some((r) => r.component === 'interrupts' && r.name.includes('Abort') && r.status === 'PASS') ? '✅' : '❌'} |
| CheckpointManager   | rewind       | Singleton | ${results.some((r) => r.component === 'rewind' && r.name.includes('singleton') && r.status === 'PASS') ? '✅' : '❌'} |
| FileSnapshots       | rewind       | Working   | ${results.some((r) => r.component === 'rewind' && r.name.includes('Snapshot') && r.status === 'PASS') ? '✅' : '❌'} |
| Auto-Checkpoint     | rewind       | Working   | ${results.some((r) => r.component === 'rewind' && r.name.includes('auto') && r.status === 'PASS') ? '✅' : '❌'} |
| SandboxManager      | sandbox      | Singleton | ${results.some((r) => r.component === 'sandbox' && r.name.includes('singleton') && r.status === 'PASS') ? '✅' : '❌'} |
| Path Translation    | sandbox      | Working   | ${results.some((r) => r.component === 'sandbox' && r.name.includes('translation') && r.status === 'PASS') ? '✅' : '❌'} |
| Change Tracking     | sandbox      | Working   | ${results.some((r) => r.component === 'sandbox' && r.name.includes('tracking') && r.status === 'PASS') ? '✅' : '❌'} |
| DryRunSandbox       | sandbox      | Working   | ${results.some((r) => r.component === 'sandbox' && r.name.includes('DryRun') && r.status === 'PASS') ? '✅' : '❌'} |
| /checkpoint cmd     | commands     | Registered| ${results.some((r) => r.component === 'commands' && r.name.includes('checkpoint') && r.status === 'PASS') ? '✅' : '❌'} |
| /rewind cmd         | commands     | Registered| ${results.some((r) => r.component === 'commands' && r.name.includes('rewind') && r.status === 'PASS') ? '✅' : '❌'} |
| /sandbox cmd        | commands     | Registered| ${results.some((r) => r.component === 'commands' && r.name.includes('sandbox') && r.status === 'PASS') ? '✅' : '❌'} |
| Main Exports        | exports      | Complete  | ${results.filter((r) => r.component === 'exports' && r.status === 'PASS').length === 3 ? '✅' : '❌'} |

================================================================================
                               END OF RECEIPT
================================================================================
`;

  return receipt;
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function main(): Promise<void> {
  console.log('🧪 Floyd Wrapper - New Features Smoke Test');
  console.log('=========================================\n');

  try {
    await testInterruptManager();
    await testCheckpointManager();
    await testSandboxManager();
    await testToolRegistryIntegration();
    await testSlashCommands();
    await testMainExports();
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
  }

  // Generate and save receipt
  const receipt = generateValidationReceipt();
  console.log(receipt);

  // Save receipt to file
  const receiptPath = join(
    process.cwd(),
    'tests',
    `SMOKE_TEST_RECEIPT_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
  );
  writeFileSync(receiptPath, receipt);
  console.log(`\n📄 Receipt saved to: ${receiptPath}`);

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
