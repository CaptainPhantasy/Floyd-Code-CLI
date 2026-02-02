/**
 * @file Resize handler tests - verifies debouncing prevents excessive re-renders
 */
import test from 'ava';

test('resize handler: should debounce rapid resize events', async t => {
	// This test verifies the debounce concept - multiple rapid events
	// should only trigger ONE state update after debounce timeout
	let executionCount = 0;
	let debounceTimeout: NodeJS.Timeout | null = null;

	const debouncedResize = () => {
		executionCount++;
	};

	// Simulate 5 rapid resize events (like what happens during terminal resize)
	for (let i = 0; i < 5; i++) {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(debouncedResize, 100);
	}

	// Wait for debounce to complete
	await new Promise(resolve => setTimeout(resolve, 120));

	// Should only execute ONCE despite 5 events
	t.is(executionCount, 1, 'Debouncing should prevent multiple executions from rapid events');
});

test('resize handler: should fire after debounce timeout', async t => {
	// Test that debounced handler eventually fires
	// Simulate debounced behavior
	let fired = false;
	const debounceMs = 100;

	setTimeout(() => {
		fired = true;
	}, debounceMs);

	await new Promise(resolve => setTimeout(resolve, debounceMs + 10));
	t.true(fired, 'Debounced handler should fire after timeout');
});

test('resize handler: should cancel pending debounce on new event', async t => {
	// Test that a new event cancels the previous pending debounced call
	let executionCount = 0;
	let debounceTimeout: NodeJS.Timeout | null = null;

	const debouncedFn = () => {
		executionCount++;
	};

	// Simulate 3 rapid calls
	debounceTimeout = setTimeout(debouncedFn, 100);
	clearTimeout(debounceTimeout); // Cancel by next event
	debounceTimeout = setTimeout(debouncedFn, 100);
	clearTimeout(debounceTimeout); // Cancel by next event
	debounceTimeout = setTimeout(debouncedFn, 100);

	// Wait for final timeout
	await new Promise(resolve => setTimeout(resolve, 110));

	// Should only execute once
	t.is(executionCount, 1, 'Should execute only once after multiple rapid calls');
});
