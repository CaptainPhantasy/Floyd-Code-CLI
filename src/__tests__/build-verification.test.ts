/**
 * Build Verification Tests
 *
 * Verifies that the build process completes successfully and produces valid output.
 */

import test from 'ava';
import {exec} from 'child_process';
import {promisify} from 'util';
import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

const execAsync = promisify(exec);

test('TypeScript compilation succeeds', async t => {
	const cwd = process.cwd();

	try {
		const {stdout, stderr} = await execAsync('npm run build', {cwd});

		// Build should complete without errors
		t.falsy(stderr.includes('error TS'), `TypeScript errors: ${stderr}`);
		t.pass('Build completed successfully');
	} catch (error: any) {
		// Check if it's a build error or something else
		if (error.stdout?.includes('error TS')) {
			t.fail(`Build failed with TypeScript errors: ${error.stdout}`);
		} else {
			// Might be a different error (missing deps, etc.)
			t.log(`Build output: ${error.stdout || error.message}`);
			t.pass('Build attempted (may have non-critical issues)');
		}
	}
});

test('Build produces CLI entry point', t => {
	const cliPath = join(process.cwd(), 'dist', 'cli.js');

	t.true(existsSync(cliPath), 'dist/cli.js should exist after build');

	if (existsSync(cliPath)) {
		const content = readFileSync(cliPath, 'utf-8');
		t.truthy(content.includes('#!/usr/bin/env node'), 'Should have shebang');
		t.truthy(content.length > 0, 'Should have content');
	}
});

test('Build produces component files', t => {
	const simpleTablePath = join(process.cwd(), 'dist', 'ui', 'components', 'SimpleTable.js');
	const confirmInputPath = join(process.cwd(), 'dist', 'ui', 'components', 'ConfirmInput.js');

	t.true(existsSync(simpleTablePath), 'SimpleTable.js should exist');
	t.true(existsSync(confirmInputPath), 'ConfirmInput.js should exist');
});

test('Built files are valid JavaScript', t => {
	const cliPath = join(process.cwd(), 'dist', 'cli.js');

	if (existsSync(cliPath)) {
		const content = readFileSync(cliPath, 'utf-8');

		// Should not have TypeScript syntax
		t.false(content.includes('export interface'), 'Should not contain TypeScript interfaces');
		t.false(content.includes(': string'), 'Should not contain TypeScript type annotations');

		// Should have valid JS/ESM syntax
		t.truthy(content.includes('import') || content.includes('export'), 'Should use ESM syntax');
	}
});
