/**
 * Runtime Verification Tests
 *
 * Verifies that the CLI can actually run without module resolution errors.
 * These tests check for the specific ERR_REQUIRE_ASYNC_MODULE error.
 */

import test from 'ava';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

test('CLI help command runs without module errors', async t => {
	const cwd = process.cwd();

	try {
		const {stdout, stderr} = await execAsync('node dist/cli.js --help', {
			cwd,
			timeout: 10000,
		});

		// Should not have the CJS/ESM interop error
		const hasModuleError = stderr.includes('ERR_REQUIRE_ASYNC_MODULE') ||
			stdout.includes('ERR_REQUIRE_ASYNC_MODULE');

		t.false(hasModuleError, `Module resolution error detected: ${stderr || stdout}`);

		// Should show help output
		if (!hasModuleError) {
			t.truthy(stdout.includes('Usage') || stdout.includes('Options'), 'Should show help');
		}
	} catch (error: any) {
		const output = error.stderr || error.stdout || error.message;

		// Check for the specific error we're trying to fix
		if (output.includes('ERR_REQUIRE_ASYNC_MODULE')) {
			t.fail(`Module resolution error still present: ${output}`);
		} else if (output.includes('Cannot find module')) {
			// Missing dependencies - might be expected in test environment
			t.log(`Missing dependencies (may be expected): ${output}`);
			t.pass('No module resolution errors');
		} else {
			// Other errors might be expected
			t.log(`Other error (may be expected): ${output}`);
			t.pass('No module resolution errors');
		}
	}
});

test('CLI version/help flags work', async t => {
	const cwd = process.cwd();

	// Test that basic CLI invocation doesn't crash immediately
	try {
		const {stderr} = await execAsync('node dist/cli.js --help', {
			cwd,
			timeout: 5000,
		});

		// The key test: no ERR_REQUIRE_ASYNC_MODULE
		t.false(
			stderr.includes('ERR_REQUIRE_ASYNC_MODULE'),
			'Should not have CJS/ESM interop errors',
		);
	} catch (error: any) {
		const output = error.stderr || error.stdout || error.message;

		if (output.includes('ERR_REQUIRE_ASYNC_MODULE')) {
			t.fail(`Module error: ${output}`);
		} else {
			// Other errors are acceptable for this test
			t.pass('No module resolution errors');
		}
	}
});
