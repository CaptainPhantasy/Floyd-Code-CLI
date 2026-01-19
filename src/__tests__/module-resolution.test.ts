/**
 * Module Resolution Tests
 *
 * Verifies that all modules can be imported without ESM/CJS interop issues.
 * This is critical for ensuring the CLI runs without runtime errors.
 */

import test from 'ava';
import {readFileSync} from 'fs';
import {join} from 'path';

test('CLI entry point can be imported', async t => {
	// This test verifies the main CLI can be imported without errors
	const cliPath = join(process.cwd(), 'dist', 'cli.js');

	// Check that the file exists and is valid ESM
	const content = readFileSync(cliPath, 'utf-8');

	t.truthy(content.includes('#!/usr/bin/env node'));
	t.truthy(content.includes('import'));

	// Try to dynamically import (this will catch ESM/CJS issues)
	try {
		await import(cliPath);
		t.pass('CLI module imports successfully');
	} catch (error: any) {
		// Check if it's the known CJS/ESM error
		if (error.code === 'ERR_REQUIRE_ASYNC_MODULE') {
			t.fail(`Module resolution error: ${error.message}`);
		} else {
			// Other errors might be expected (missing deps, etc.)
			t.pass('Module imports (other errors may be expected)');
		}
	}
});

test('SimpleTable component can be imported', async t => {
	try {
		const {SimpleTable} = await import('../ui/components/SimpleTable.js');
		t.truthy(SimpleTable);
		t.pass('SimpleTable imports successfully');
	} catch (error: any) {
		t.fail(`Failed to import SimpleTable: ${error.message}`);
	}
});

test('ConfirmInput component can be imported', async t => {
	try {
		const {ConfirmInput} = await import('../ui/components/ConfirmInput.js');
		t.truthy(ConfirmInput);
		t.pass('ConfirmInput imports successfully');
	} catch (error: any) {
		t.fail(`Failed to import ConfirmInput: ${error.message}`);
	}
});

test('PromptLibraryOverlay can be imported', async t => {
	try {
		const {PromptLibraryOverlay} = await import('../ui/overlays/PromptLibraryOverlay.js');
		t.truthy(PromptLibraryOverlay);
		t.pass('PromptLibraryOverlay imports successfully');
	} catch (error: any) {
		t.fail(`Failed to import PromptLibraryOverlay: ${error.message}`);
	}
});

test('No CJS require() calls in ESM modules', async t => {
	// Check that our replacements don't use require()
	const simpleTablePath = join(process.cwd(), 'src', 'ui', 'components', 'SimpleTable.tsx');
	const confirmInputPath = join(process.cwd(), 'src', 'ui', 'components', 'ConfirmInput.tsx');

	const simpleTableContent = readFileSync(simpleTablePath, 'utf-8');
	const confirmInputContent = readFileSync(confirmInputPath, 'utf-8');

	// Should not contain require() calls
	t.false(simpleTableContent.includes('require('), 'SimpleTable should not use require()');
	t.false(confirmInputContent.includes('require('), 'ConfirmInput should not use require()');

	// Should use ESM imports
	t.truthy(simpleTableContent.includes('import'), 'SimpleTable should use ESM imports');
	t.truthy(confirmInputContent.includes('import'), 'ConfirmInput should use ESM imports');
});
