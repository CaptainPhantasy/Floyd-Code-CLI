/**
 * Layout Constants Tests
 *
 * Tests for centralized layout constants for height calculations.
 */

import test from 'ava';
import { LAYOUT } from '../layout.ts';

test('layout breakpoints are defined', t => {
	t.is(LAYOUT.BREAKPOINTS.VERY_NARROW, 80);
	t.is(LAYOUT.BREAKPOINTS.NARROW, 100);
	t.is(LAYOUT.BREAKPOINTS.WIDE, 120);
	t.is(LAYOUT.BREAKPOINTS.ULTRA_WIDE, 160);
});

test('overhead values match actual heights', t => {
	t.is(LAYOUT.OVERHEAD.BANNER, 9);      // 8 lines + 1 margin
	t.is(LAYOUT.OVERHEAD.STATUSBAR, 3);   // borders + content
	t.is(LAYOUT.OVERHEAD.INPUT, 6);       // borders + content + hint
	t.is(LAYOUT.OVERHEAD.FRAME, 5);       // borders + padding + title
});

test('getTotalOverhead calculates correctly', t => {
	// Status(3) + Input(6) + Frame(5) + Margin(3) = 17
	// With Banner(9) = 26
	t.is(LAYOUT.getTotalOverhead(true), 26);   // with banner
	t.is(LAYOUT.getTotalOverhead(false), 17);  // no banner
});

test('calculateAvailableHeight returns correct values', t => {
	// 24 - 26 = -2 -> 1 (min)
	t.is(LAYOUT.calculateAvailableHeight(24, true, false), 1);
	// 24 - 17 = 7
	t.is(LAYOUT.calculateAvailableHeight(24, false, false), 7);
});

test('calculateAvailableHeight minimum is 1', t => {
	t.is(LAYOUT.calculateAvailableHeight(10, true, false), 1); // below minimum
	t.is(LAYOUT.calculateAvailableHeight(5, false, false), 1);  // way below minimum
});
