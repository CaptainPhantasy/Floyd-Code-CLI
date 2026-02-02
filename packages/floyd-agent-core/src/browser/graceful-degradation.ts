/**
 * Browser Graceful Degradation
 *
 * PHASE 3 ITEM 15: Browser Graceful Degradation
 *
 * Handles browser extension unavailability gracefully:
 * - Connection checking
 * - Fallback behavior
 * - Clear error messages
 */

export interface BrowserStatus {
	available: boolean;
	extension: 'chrome' | 'firefox' | 'none';
	error?: string;
	fallbackBehavior: 'skip' | 'simulate' | 'fail';
}

/**
 * Check browser connection status
 */
export async function checkBrowserConnection(wsUrl: string = 'ws://localhost:3005'): Promise<BrowserStatus> {
	try {
		// Try to connect with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2000);

		const response = await fetch(wsUrl, {
			method: 'GET',
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			return {
				available: true,
				extension: 'chrome',
				fallbackBehavior: 'skip',
			};
		}

		return {
			available: false,
			extension: 'none',
			error: 'Browser extension not responding',
			fallbackBehavior: 'skip',
		};
	} catch (error) {
		return {
			available: false,
			extension: 'none',
			error: error instanceof Error ? error.message : 'Connection failed',
			fallbackBehavior: 'skip',
		};
	}
}

/**
 * Execute browser operation with graceful degradation
 */
export async function executeWithFallback<T>(
	operation: () => Promise<T>,
	fallback: () => T,
	_context: string
): Promise<{ result: T; usedFallback: boolean; error?: string }> {
	try {
		// Check if browser is available before attempting operation
		const status = await checkBrowserConnection();

		if (!status.available) {
			// Use fallback
			const fallbackResult = fallback();
			return {
				result: fallbackResult,
				usedFallback: true,
				error: status.error,
			};
		}

		// Attempt browser operation
		const result = await operation();
		return {
			result,
			usedFallback: false,
		};
	} catch (error) {
		// Operation failed, use fallback
		const fallbackResult = fallback();
		return {
			result: fallbackResult,
			usedFallback: true,
			error: error instanceof Error ? error.message : 'Operation failed',
		};
	}
}

/**
 * Get graceful degradation message for user
 */
export function getDegradationMessage(context: string, error: string): string {
	return `Browser operation "${context}" skipped: ${error}. The operation will continue without browser automation.`;
}

/**
 * Browser operation wrappers with built-in fallback
 */
export const BrowserOperations = {
	async navigate(url: string, fallback?: () => void) {
		return executeWithFallback(
			() => executeBrowserCommand('navigate', { url }),
			fallback || (() => {
				// Default: log that we're skipping navigation
				console.log(`[Browser] Skipping navigate to ${url}`);
			}),
			'navigate'
		);
	},

	async readPage(fallback?: () => string) {
		return executeWithFallback(
			() => executeBrowserCommand('read_page', {}),
			fallback || (() => '[Browser content unavailable]'),
			'read_page'
		);
	},

	async screenshot(fallback?: () => void) {
		return executeWithFallback(
			() => executeBrowserCommand('screenshot', {}),
			fallback || (() => {
				console.log('[Browser] Skipping screenshot');
			}),
			'screenshot'
		);
	},
};

/**
 * Mock browser command executor (replace with actual implementation)
 */
async function executeBrowserCommand(command: string, params: Record<string, unknown>): Promise<unknown> {
	// This would be replaced with actual MCP browser tool calls
	// For now, simulate success
	return { command, params, success: true };
}
