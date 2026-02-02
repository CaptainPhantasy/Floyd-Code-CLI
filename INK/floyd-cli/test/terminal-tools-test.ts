/**
 * Terminal Tools E2E Test
 * Tests all new terminal/process capabilities
 */

import terminalManager from '../src/tools/terminal-manager.js';
import TerminalTools from '../src/tools/terminal-tools.js';

async function runTests() {
	const tools = new TerminalTools();
	const receipts: any[] = [];
	let passed = 0;
	let failed = 0;

	console.log('=== FLOYD CLI Terminal Tools E2E Test ===\n');

	// Test 1: start_process
	console.log('Test 1: start_process');
	try {
		const result = await tools.startProcess({
			command: 'echo "Hello from FLOYD CLI Terminal" && sleep 1',
			cwd: '/tmp',
		});
		if (result.success) {
			console.log('  ✅ PASS - Session:', result.result.sessionId);
			receipts.push({ test: 'start_process', status: 'pass', sessionId: result.result.sessionId });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'start_process', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'start_process', status: 'fail', error: err.message });
		failed++;
	}

	// Test 2: list_sessions
	console.log('\nTest 2: list_sessions');
	try {
		const result = await tools.listSessions();
		if (result.success) {
			const count = result.result.sessions.length;
			console.log(`  ✅ PASS - ${count} active sessions`);
			receipts.push({ test: 'list_sessions', status: 'pass', count });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'list_sessions', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'list_sessions', status: 'fail', error: err.message });
		failed++;
	}

	// Test 3: list_processes
	console.log('\nTest 3: list_processes');
	try {
		const result = await tools.listProcesses();
		if (result.success && result.result.processes) {
			const count = result.result.processes.length;
			console.log(`  ✅ PASS - ${count} system processes listed`);
			receipts.push({ test: 'list_processes', status: 'pass', count });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'list_processes', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'list_processes', status: 'fail', error: err.message });
		failed++;
	}

	// Test 4: execute_code (bash)
	console.log('\nTest 4: execute_code (bash)');
	try {
		const result = await tools.executeCode({
			language: 'bash',
			code: 'echo "Code execution works!"',
		});
		if (result.success) {
			console.log('  ✅ PASS - Output:', result.result?.output?.trim());
			receipts.push({ test: 'execute_code_bash', status: 'pass', output: result.result?.output });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'execute_code_bash', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'execute_code_bash', status: 'fail', error: err.message });
		failed++;
	}

	// Test 5: execute_code (node)
	console.log('\nTest 5: execute_code (node)');
	try {
		const result = await tools.executeCode({
			language: 'node',
			code: '2 + 2',
		});
		if (result.success) {
			console.log('  ✅ PASS - Output:', result.result?.output?.trim());
			receipts.push({ test: 'execute_code_node', status: 'pass', output: result.result?.output });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'execute_code_node', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'execute_code_node', status: 'fail', error: err.message });
		failed++;
	}

	// Test 6: create_directory
	console.log('\nTest 6: create_directory');
	try {
		const result = await tools.createDirectory({
			path: '/tmp/floyd-terminal-test-dir',
		});
		if (result.success) {
			console.log('  ✅ PASS - Directory created:', result.result.path);
			receipts.push({ test: 'create_directory', status: 'pass', path: result.result.path });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'create_directory', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'create_directory', status: 'fail', error: err.message });
		failed++;
	}

	// Test 7: get_file_info
	console.log('\nTest 7: get_file_info');
	try {
		const result = await tools.getFileInfo({
			path: '/tmp/floyd-terminal-test-dir',
		});
		if (result.success) {
			console.log('  ✅ PASS - Type:', result.result.type, 'Size:', result.result.size);
			receipts.push({ test: 'get_file_info', status: 'pass', type: result.result.type });
			passed++;
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'get_file_info', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'get_file_info', status: 'fail', error: err.message });
		failed++;
	}

	// Test 8: start_process with long-running task
	console.log('\nTest 8: start_process (long-running for interaction)');
	try {
		const result = await tools.startProcess({
			command: 'cat',
			cwd: '/tmp',
		});
		if (result.success) {
			const sessionId = result.result.sessionId;
			console.log('  ✅ PASS - Session:', sessionId);

			// Test 9: interact_with_process
			console.log('\nTest 9: interact_with_process');
			const interactResult = await tools.interactWithProcess({
				session_id: sessionId,
				input: 'Hello interactive session!',
			});
			if (interactResult.success) {
				console.log('  ✅ PASS - Input sent to session');
				receipts.push({ test: 'interact_with_process', status: 'pass', sessionId });
				passed++;
			} else {
				console.log('  ❌ FAIL -', interactResult.error);
				receipts.push({ test: 'interact_with_process', status: 'fail', error: interactResult.error });
				failed++;
			}

			// Test 10: read_process_output
			console.log('\nTest 10: read_process_output');
			const readResult = await tools.readProcessOutput({
				session_id: sessionId,
			});
			if (readResult.success) {
				console.log('  ✅ PASS - Output lines:', readResult.result?.output?.length || 0);
				receipts.push({ test: 'read_process_output', status: 'pass' });
				passed++;
			} else {
				console.log('  ❌ FAIL -', readResult.error);
				receipts.push({ test: 'read_process_output', status: 'fail', error: readResult.error });
				failed++;
			}

			// Test 11: force_terminate
			console.log('\nTest 11: force_terminate');
			const terminateResult = await tools.forceTerminate({
				session_id: sessionId,
			});
			if (terminateResult.success) {
				console.log('  ✅ PASS - Session terminated');
				receipts.push({ test: 'force_terminate', status: 'pass', sessionId });
				passed++;
			} else {
				console.log('  ❌ FAIL -', terminateResult.error);
				receipts.push({ test: 'force_terminate', status: 'fail', error: terminateResult.error });
				failed++;
			}
		} else {
			console.log('  ❌ FAIL -', result.error);
			receipts.push({ test: 'start_process_long', status: 'fail', error: result.error });
			failed++;
		}
	} catch (err: any) {
		console.log('  ❌ FAIL -', err.message);
		receipts.push({ test: 'start_process_long', status: 'fail', error: err.message });
		failed++;
	}

	// Summary
	console.log('\n=== Test Summary ===');
	console.log(`Total: ${passed + failed}`);
	console.log(`Passed: ${passed}`);
	console.log(`Failed: ${failed}`);

	// Write receipts
	const fs = await import('fs/promises');
	await fs.writeFile(
		'/tmp/floyd-cli-terminal-test-receipts.json',
		JSON.stringify(receipts, null, 2)
	);
	console.log('\nReceipts saved to: /tmp/floyd-cli-terminal-test-receipts.json');

	return { passed, failed, receipts };
}

// Run tests
runTests()
	.then(({ passed, failed }) => {
		process.exit(failed > 0 ? 1 : 0);
	})
	.catch(err => {
		console.error('Test suite error:', err);
		process.exit(1);
	});
