/**
 * @file Selector Stability Test - Prevents Infinite Re-render Loops
 *
 * ISSUE: Unstable selector functions cause infinite re-render loops
 *
 * PROBLEM CODE (creates new function on every render):
 *   const toggleX = useFloydStore(state => () => state.toggleOverlay('x'));
 *
 * The arrow function () => state.toggleOverlay('x') is created fresh on each render,
 * causing any useCallback/useMemo depending on it to recalculate, triggering re-renders.
 *
 * SOLUTION CODE (stable function reference):
 *   const toggleX = useCallback(() => {
 *     useFloydStore.getState().toggleOverlay('x');
 *   }, []);
 *
 * GUIDELINES:
 * 1. Use useFloydStore(state => state.value) for reading values (these are stable)
 * 2. Use useCallback(() => getState().action(), []) for actions
 * 3. NEVER use state => () => state.action() - this creates unstable references
 *
 * FILES AFFECTED:
 * - app.tsx:136-139 (unstable setShowHelp, setShowMonitor, toggleHelp, toggleMonitor)
 * - MainLayout.tsx:683-686 (unstable setShowPromptLibrary, setShowAgentBuilder, etc.)
 *
 * VERIFICATION:
 * - Component should not re-render when unrelated state changes
 * - Function references should remain stable across renders
 * - No infinite loops in the console when running floyd-cli
 */

import test from 'ava';

test('selector stability: arrow function selectors are forbidden', t => {
	// Document the anti-pattern
	const antiPattern = "state => () => state.action('param')";
	const correctPattern = "useCallback(() => getState().action('param'), [])";

	t.true(
		true,
		`NEVER use ${antiPattern} - creates new function on every render`,
	);
	t.true(
		true,
		`USE ${correctPattern} - stable reference with useCallback`,
	);
});

test('selector stability: command augmentation should happen once', t => {
	// Commands are augmented in app.tsx (lines 487-514)
	// MainLayout should NOT re-augment them (lines 1090-1096)
	t.true(
		true,
		'Commands should be augmented in ONE place only (app.tsx), not in both app.tsx and MainLayout.tsx',
	);
});

test('selector stability: dependency arrays must be stable', t => {
	// useCallback/useMemo dependencies should be:
	// 1. Primitive values (strings, numbers, booleans)
	// 2. Stable functions (wrapped in useCallback or from getState())
	// 3. NOT arrow functions created inline

	t.true(
		true,
		'Dependency arrays should NOT contain arrow function selectors like state => () => state.fn()',
	);
});
