/**
 * ConfirmInput Component Tests
 *
 * Tests for the ESM-compatible confirmation input component.
 */

import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {ConfirmInput} from '../ConfirmInput.js';

test('ConfirmInput renders message', t => {
	const {lastFrame} = render(
		<ConfirmInput
			message="Are you sure?"
			onConfirm={() => {}}
		/>,
	);

	t.truthy(lastFrame());
	t.regex(lastFrame() || '', /Are you sure\?/);
});

test('ConfirmInput shows Yes/No options', t => {
	const {lastFrame} = render(
		<ConfirmInput
			message="Delete this?"
			onConfirm={() => {}}
		/>,
	);

	t.truthy(lastFrame());
	const output = lastFrame() || '';
	t.regex(output, /Yes/);
	t.regex(output, /No/);
});

test('ConfirmInput defaults to No', t => {
	const {lastFrame} = render(
		<ConfirmInput
			message="Confirm?"
			onConfirm={() => {}}
		/>,
	);

	t.truthy(lastFrame());
	const output = lastFrame() || '';
	// Should show No as selected (with ▶)
	t.regex(output, /▶.*No/);
});

test('ConfirmInput defaults to Yes when specified', t => {
	const {lastFrame} = render(
		<ConfirmInput
			message="Confirm?"
			onConfirm={() => {}}
			defaultValue={true}
		/>,
	);

	t.truthy(lastFrame());
	const output = lastFrame() || '';
	// Should show Yes as selected
	t.regex(output, /▶.*Yes/);
});
