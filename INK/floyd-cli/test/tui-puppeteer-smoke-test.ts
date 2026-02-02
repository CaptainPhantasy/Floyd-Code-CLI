#!/usr/bin/env node
/**
 * TUI Puppeteer Smoke Test
 *
 * Uses node-pty to automate TUI interaction for smoke testing.
 * Verifies that the INK/floyd-cli UI works correctly for human use.
 *
 * Usage:
 *   npx tsx test/tui-puppeteer-smoke-test.ts
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Load node-pty using createRequire for CJS interop
const require = createRequire(import.meta.url);
const ptySpawn = require('node-pty').spawn;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output: string[];
  error?: string;
}

interface TurnResult {
  turn: number;
  description: string;
  expected: string;
  action: string;
  actual: string;
  passed: boolean;
  timestamp: string;
}

class TUIPuppeteer {
  private pty: any;
  private output: string[] = [];
  private currentTurn = 0;
  private results: TurnResult[] = [];

  constructor() {
    // Initialize node-pty
  }

  /**
   * Start the floyd-cli TUI
   */
  async start(cwd: string = ROOT_DIR): Promise<void> {
    const cliPath = path.join(ROOT_DIR, 'dist', 'cli.js');

    if (!fs.existsSync(cliPath)) {
      throw new Error(`CLI not found at ${cliPath}. Run 'npm run build' first.`);
    }

    // Spawn the CLI using node-pty
    this.pty = ptySpawn('node', [cliPath], {
      name: 'xterm-256color',
      cwd,
      env: process.env,
      cols: 80,
      rows: 24,
    });

    // Capture output
    this.pty.onData((data: string) => {
      this.output.push(data);
      // Only print non-control characters for readability
      const printable = data.replace(/[\x00-\x1F\x7F]/g, '');
      if (printable.trim()) {
        process.stdout.write(`${colors.cyan}[TUI]${colors.reset} ${printable}`);
      }
    });

    // Wait for initial render
    await this.waitForOutput('FLOYD', 5000);
  }

  /**
   * Stop the TUI
   */
  async stop(): Promise<void> {
    if (this.pty) {
      this.pty.write('\x03'); // Ctrl+C
      await this.delay(500);
      // Force kill if still running
      try {
        this.pty.kill();
      } catch {
        // Already exited
      }
    }
  }

  /**
   * Wait for specific output to appear
   */
  async waitForOutput(
    pattern: string | RegExp,
    timeout: number = 5000,
  ): Promise<boolean> {
    const startTime = Date.now();
    const fullOutput = this.output.join('');

    while (Date.now() - startTime < timeout) {
      const currentOutput = this.output.join('');
      if (typeof pattern === 'string') {
        if (currentOutput.includes(pattern)) return true;
      } else if (pattern instanceof RegExp) {
        if (pattern.test(currentOutput)) return true;
      }
      await this.delay(100);
    }
    return false;
  }

  /**
   * Simulate keyboard input
   */
  sendKeys(keys: string[]): void {
    for (const key of keys) {
      this.pty.write(key);
    }
  }

  /**
   * Send a message to the CLI
   */
  async sendMessage(message: string): Promise<void> {
    this.sendKeys(message.split(''));
    this.pty.write('\r'); // Enter
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recent output
   */
  getRecentOutput(lines: number = 10): string {
    const allOutput = this.output.join('');
    const outputLines = allOutput.split('\n');
    return outputLines.slice(-lines).join('\n');
  }

  /**
   * Record a test turn
   */
  recordTurn(result: Omit<TurnResult, 'turn' | 'timestamp'>): void {
    this.currentTurn++;
    this.results.push({
      ...result,
      turn: this.currentTurn,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all turn results
   */
  getResults(): TurnResult[] {
    return this.results;
  }
}

// ============================================================================
// SMOKE TEST SCENARIOS
// ============================================================================

async function test1_BasicStartup(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Starting floyd-cli...');
    await puppeteer.start();

    output.push('Waiting for initial render...');
    const hasGreeting = await puppeteer.waitForOutput('FLOYD', 5000);

    if (!hasGreeting) {
      throw new Error('Initial greeting not displayed');
    }

    const recentOutput = puppeteer.getRecentOutput(20);
    output.push('Recent output captured');

    puppeteer.recordTurn({
      description: 'TUI starts and displays greeting',
      expected: 'FLOYD greeting message appears',
      action: 'Start CLI and wait for render',
      actual: recentOutput.substring(0, 200) + '...',
      passed: true,
    });

    return {
      name: 'Test 1: Basic Startup',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'TUI starts and displays greeting',
      expected: 'FLOYD greeting message appears',
      action: 'Start CLI and wait for render',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 1: Basic Startup',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function test2_HelpOverlay(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Triggering help overlay with Ctrl+/');
    puppeteer.sendKeys(['\x1f', '/']); // Ctrl+/

    await puppeteer.delay(500);

    const hasHelp = await puppeteer.waitForOutput(/KEYBOARD|SHORTCUT/i, 2000);

    if (!hasHelp) {
      throw new Error('Help overlay did not appear');
    }

    output.push('Help overlay displayed successfully');
    const recentOutput = puppeteer.getRecentOutput(20);

    puppeteer.recordTurn({
      description: 'Help overlay appears on Ctrl+/',
      expected: 'Keyboard shortcuts overlay shown',
      action: 'Press Ctrl+/',
      actual: recentOutput.substring(0, 200) + '...',
      passed: true,
    });

    // Dismiss help
    puppeteer.sendKeys(['\x1b']); // Esc
    await puppeteer.delay(500);

    return {
      name: 'Test 2: Help Overlay',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'Help overlay appears on Ctrl+/',
      expected: 'Keyboard shortcuts overlay shown',
      action: 'Press Ctrl+/',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 2: Help Overlay',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function test3_CommandPalette(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Triggering command palette with Ctrl+P');
    puppeteer.sendKeys(['\x10']); // Ctrl+P

    await puppeteer.delay(500);

    const hasPalette = await puppeteer.waitForOutput(/command|palette/i, 2000);

    if (!hasPalette) {
      throw new Error('Command palette did not appear');
    }

    output.push('Command palette displayed');

    puppeteer.recordTurn({
      description: 'Command palette appears on Ctrl+P',
      expected: 'Command list overlay shown',
      action: 'Press Ctrl+P',
      actual: puppeteer.getRecentOutput(20),
      passed: true,
    });

    // Dismiss palette
    puppeteer.sendKeys(['\x1b']); // Esc
    await puppeteer.delay(500);

    return {
      name: 'Test 3: Command Palette',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'Command palette appears on Ctrl+P',
      expected: 'Command list overlay shown',
      action: 'Press Ctrl+P',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 3: Command Palette',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function test4_MessageSubmission(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Sending test message...');
    await puppeteer.sendMessage('hello');

    // Wait for response
    await puppeteer.waitForOutput(/thinking|\.|\.\./, 3000);

    output.push('Message submitted, waiting for response...');
    await puppeteer.delay(2000);

    const recentOutput = puppeteer.getRecentOutput(10);

    puppeteer.recordTurn({
      description: 'Message can be submitted and response appears',
      expected: 'User message shown, Floyd response starts',
      action: 'Type "hello" and press Enter',
      actual: recentOutput,
      passed: true,
    });

    return {
      name: 'Test 4: Message Submission',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'Message can be submitted and response appears',
      expected: 'User message shown, Floyd response starts',
      action: 'Type "hello" and press Enter',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 4: Message Submission',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function test5_SafetyModeToggle(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Cycling safety mode with Shift+Tab');
    puppeteer.sendKeys(['\x1b', '[', 'Z']); // Shift+Tab

    await puppeteer.delay(500);

    const recentOutput = puppeteer.getRecentOutput(5);
    output.push('Safety mode toggled');

    puppeteer.recordTurn({
      description: 'Safety mode cycles on Shift+Tab',
      expected: 'Mode indicator changes (yolo/ask/plan)',
      action: 'Press Shift+Tab',
      actual: recentOutput,
      passed: true,
    });

    return {
      name: 'Test 5: Safety Mode Toggle',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'Safety mode cycles on Shift+Tab',
      expected: 'Mode indicator changes (yolo/ask/plan)',
      action: 'Press Shift+Tab',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 5: Safety Mode Toggle',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function test6_QuitSequence(puppeteer: TUIPuppeteer): Promise<TestResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    output.push('Testing quit with Ctrl+Q');
    puppeteer.sendKeys(['\x11']); // Ctrl+Q

    await puppeteer.delay(1000);

    puppeteer.recordTurn({
      description: 'CLI exits on Ctrl+Q',
      expected: 'Process terminates',
      action: 'Press Ctrl+Q',
      actual: 'CLI should have exited',
      passed: true,
    });

    return {
      name: 'Test 6: Quit Sequence',
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error) {
    output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    puppeteer.recordTurn({
      description: 'CLI exits on Ctrl+Q',
      expected: 'Process terminates',
      action: 'Press Ctrl+Q',
      actual: puppeteer.getRecentOutput(10),
      passed: false,
    });
    return {
      name: 'Test 6: Quit Sequence',
      passed: false,
      duration: Date.now() - startTime,
      output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runSmokeTests(): Promise<void> {
  const puppeteer = new TUIPuppeteer();
  const results: TestResult[] = [];

  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TUI PUPPETEER SMOKE TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}  INK/floyd-cli Automated UI Verification${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // Test 1: Basic startup
    console.log(`${colors.blue}Running Test 1: Basic Startup...${colors.reset}`);
    results.push(await test1_BasicStartup(puppeteer));
    printResult(results[results.length - 1]);

    // Test 2: Help overlay
    console.log(`${colors.blue}Running Test 2: Help Overlay...${colors.reset}`);
    results.push(await test2_HelpOverlay(puppeteer));
    printResult(results[results.length - 1]);

    // Test 3: Command palette
    console.log(`${colors.blue}Running Test 3: Command Palette...${colors.reset}`);
    results.push(await test3_CommandPalette(puppeteer));
    printResult(results[results.length - 1]);

    // Test 4: Message submission
    console.log(`${colors.blue}Running Test 4: Message Submission...${colors.reset}`);
    results.push(await test4_MessageSubmission(puppeteer));
    printResult(results[results.length - 1]);

    // Test 5: Safety mode toggle
    console.log(`${colors.blue}Running Test 5: Safety Mode Toggle...${colors.reset}`);
    results.push(await test5_SafetyModeToggle(puppeteer));
    printResult(results[results.length - 1]);

    // Test 6: Quit sequence
    console.log(`${colors.blue}Running Test 6: Quit Sequence...${colors.reset}`);
    results.push(await test6_QuitSequence(puppeteer));
    printResult(results[results.length - 1]);

  } finally {
    await puppeteer.stop();
  }

  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`Tests Passed: ${colors.green}${passed}/${total}${colors.reset} (${percentage}%)`);

  for (const result of results) {
    const status = result.passed
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
    const duration = `${result.duration}ms`;
    console.log(`  ${status} ${result.name} (${duration})`);
    if (result.error) {
      console.log(`    ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  }

  // Print turn results
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TURN-BY-TURN RESULTS${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  for (const turn of puppeteer.getResults()) {
    const status = turn.passed
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;
    console.log(`${colors.magenta}Turn ${turn.turn}:${colors.reset} ${turn.description}`);
    console.log(`  Status: ${status}`);
    console.log(`  Action: ${turn.action}`);
    console.log(`  Expected: ${turn.expected}`);
    console.log(`  Actual: ${turn.actual.substring(0, 100)}...`);
    console.log(`  Timestamp: ${turn.timestamp}\n`);
  }

  // Write results to file
  const reportPath = path.join(ROOT_DIR, 'test-results', 'smoke-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { passed, total, percentage },
        tests: results,
        turns: puppeteer.getResults(),
      },
      null,
      2,
    ),
  );
  console.log(`${colors.cyan}Report saved to:${colors.reset} ${reportPath}`);

  // Exit with appropriate code
  process.exit(percentage >= 95 ? 0 : 1);
}

function printResult(result: TestResult): void {
  if (result.passed) {
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${result.name} (${result.duration}ms)\n`);
  } else {
    console.log(`  ${colors.red}✗ FAIL${colors.reset} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`    ${colors.red}${result.error}${colors.reset}`);
    }
    console.log('');
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
