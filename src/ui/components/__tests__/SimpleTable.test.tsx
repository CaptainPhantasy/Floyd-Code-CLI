/**
 * SimpleTable Component Tests
 *
 * Tests for the ESM-compatible table component replacement.
 */

import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {SimpleTable} from '../SimpleTable.js';

test('SimpleTable renders data correctly', t => {
	const data = [
		['1', 'Alice', 'Engineer'],
		['2', 'Bob', 'Designer'],
		['3', 'Charlie', 'Manager'],
	];

	const {lastFrame} = render(<SimpleTable data={data} />);

	t.truthy(lastFrame());
	t.regex(lastFrame() || '', /Alice/);
	t.regex(lastFrame() || '', /Bob/);
	t.regex(lastFrame() || '', /Charlie/);
});

test('SimpleTable renders with column headers', t => {
	const data = [
		['1', 'Alice', 'Engineer'],
		['2', 'Bob', 'Designer'],
	];
	const columns = ['ID', 'Name', 'Role'];

	const {lastFrame} = render(
		<SimpleTable data={data} columns={columns} />,
	);

	t.truthy(lastFrame());
	t.regex(lastFrame() || '', /ID/);
	t.regex(lastFrame() || '', /Name/);
	t.regex(lastFrame() || '', /Role/);
});

test('SimpleTable handles empty data', t => {
	const {lastFrame} = render(<SimpleTable data={[]} />);

	t.truthy(lastFrame());
	t.regex(lastFrame() || '', /No data/);
});

test('SimpleTable truncates long content', t => {
	const data = [
		['1', 'A'.repeat(100), 'B'.repeat(100)],
	];

	const {lastFrame} = render(<SimpleTable data={data} />);

	// Should truncate to max 30 chars per column
	t.truthy(lastFrame());
	const output = lastFrame() || '';
	// Should not contain the full 100-character strings
	t.false(output.includes('A'.repeat(100)));
});
