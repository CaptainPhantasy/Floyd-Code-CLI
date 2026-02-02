#!/usr/bin/env node

/**
 * Verify error boundary is loaded
 */

async function test() {
	console.log('Testing TUI Error Boundary...\n');

	try {
		const {TuiErrorBoundary} = await import(
			'./dist/components/TuiErrorBoundary.js'
		);
		console.log('✅ TuiErrorBoundary imported successfully');

		const {App} = await import('./dist/app.js');
		console.log('✅ App component imported successfully');

		console.log('\n🎉 Error boundary integration complete!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

test();
