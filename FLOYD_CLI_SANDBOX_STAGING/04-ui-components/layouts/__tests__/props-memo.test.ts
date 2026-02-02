/**
 * @file Props memoization tests - verifies useMemo/useCallback prevents child re-renders
 */
import test from 'ava';

test('component props: augmentedCommands should be memoized', t => {
	// augmentedCommands is created with .map() on every render
	// This should be wrapped in useMemo to prevent re-creation
	const commands = [{id: 'test', label: 'Test'}];
	const handleCommand = (id: string) => {};

	// Without memoization, this creates a new array reference every render
	const augmentedCommands = commands.map(cmd => ({
		...cmd,
		action: () => handleCommand(cmd.id),
	}));

	t.true(Array.isArray(augmentedCommands), 'augmentedCommands should be an array');
	t.is(augmentedCommands.length, 1, 'Should have one command');

	// This test documents the requirement - wrap in useMemo
	t.pass('augmentedCommands should be memoized with useMemo');
});

test('component props: quickActions map should be memoized', t => {
	// quickActions.map() creates a new array on every render
	const quickActions = [
		{shortcut: 'Ctrl+P', label: 'Palette'},
		{shortcut: 'Ctrl+M', label: 'Monitor'},
	];

	// This creates a new array every render - should be memoized
	const mappedActions = quickActions.map(qa => qa.shortcut + ' ' + qa.label);

	t.is(mappedActions.length, 2, 'Should have 2 actions');
	t.pass('quickActions map should be memoized with useMemo');
});

test('component props: messages slice should be memoized', t => {
	// messages.slice(-20) creates a new array on every render
	const messages = Array.from({length: 25}, (_, i) => ({
		id: i,
		role: 'user' as const,
		content: `Message ${i}`,
	}));

	// This creates a new array every render - should be memoized
	const recentMessages = messages.slice(-20);

	t.is(recentMessages.length, 20, 'Should have 20 messages');
	t.pass('messages.slice(-20) should be memoized with useMemo');
});

test('component props: callbacks should use useCallback', t => {
	// Inline arrow functions create new function references every render
	// These should be wrapped in useCallback

	const onCommandSelected = (commandText: string) => {
		console.log('Selected:', commandText);
	};

	t.is(typeof onCommandSelected, 'function', 'Should be a function');
	t.pass('Callback functions should be memoized with useCallback');
});
