/**
 * Browser Controller
 *
 * Puppeteer/Playwright wrapper for browser automation.
 * Provides core browser operations: launching, navigation,
 * screenshots, script execution, and cleanup.
 *
 * @module browser/browser-controller
 */

import {type Browser, type Page, type LaunchOptions} from 'puppeteer';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Browser launch configuration options
 */
export interface BrowserLaunchOptions {
	/** Whether to run headless (default: true) */
	headless?: boolean;
	/** Browser executable path (optional) */
	executablePath?: string;
	/** User data directory for persistent sessions */
	userDataDir?: string;
	/** Window width in pixels */
	width?: number;
	/** Window height in pixels */
	height?: number;
	/** Default navigation timeout in milliseconds */
	timeout?: number;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
	/** File path to save screenshot */
	path?: string;
	/** Screenshot encoding (default: 'png') */
	type?: 'png' | 'jpeg';
	/** Image quality for jpeg (0-100) */
	quality?: number;
	/** Whether to capture full scrollable page */
	fullPage?: boolean;
	/** Clip to specific region */
	clip?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

/**
 * Navigation options
 */
export interface NavigationOptions {
	/** Navigation timeout in milliseconds */
	timeout?: number;
	/** Wait until network is idle */
	waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

/**
 * Script execution result
 */
export interface ScriptResult {
	/** Whether execution was successful */
	success: boolean;
	/** Return value from script (if any) */
	result?: unknown;
	/** Error message if execution failed */
	error?: string;
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Error thrown when browser is not available
 */
export class BrowserNotAvailableError extends Error {
	constructor() {
		super('Browser is not available. Call launchBrowser() first.');
		this.name = 'BrowserNotAvailableError';
	}
}

/**
 * Error thrown when navigation fails
 */
export class NavigationError extends Error {
	constructor(url: string, reason: string) {
		super(`Failed to navigate to ${url}: ${reason}`);
		this.name = 'NavigationError';
	}
}

/**
 * Error thrown when script execution fails
 */
export class ScriptExecutionError extends Error {
	constructor(_script: string, reason: string) {
		super(`Script execution failed: ${reason}`);
		this.name = 'ScriptExecutionError';
	}
}

// ============================================================================
// BROWSER CONTROLLER
// ============================================================================

/**
 * Controller class for browser automation operations.
 * Wraps Puppeteer to provide a clean API for browser control.
 */
export class BrowserController {
	/** Puppeteer browser instance */
	private browser: Browser | null = null;

	/** Active page instance */
	private page: Page | null = null;

	/** Default launch options */
	private defaultOptions: BrowserLaunchOptions;

	/**
	 * Create a new BrowserController
	 * @param options - Default launch options
	 */
	constructor(options: BrowserLaunchOptions = {}) {
		this.defaultOptions = {
			headless: true,
			width: 1280,
			height: 720,
			timeout: 30000,
			...options,
		};
	}

	/**
	 * Launch a new browser instance
	 * @param options - Override launch options
	 * @returns Promise resolving when browser is ready
	 * @throws Error if browser fails to launch
	 */
	async launchBrowser(options: BrowserLaunchOptions = {}): Promise<void> {
		if (this.browser) {
			await this.closeBrowser();
		}

		const launchOptions: LaunchOptions = {
			headless: options.headless ?? this.defaultOptions.headless ?? true,
			executablePath:
				options.executablePath ?? this.defaultOptions.executablePath,
			userDataDir: options.userDataDir ?? this.defaultOptions.userDataDir,
			defaultViewport: {
				width: options.width ?? this.defaultOptions.width ?? 1280,
				height: options.height ?? this.defaultOptions.height ?? 720,
			},
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-web-security',
			],
		};

		try {
			// Dynamic import of puppeteer
			const puppeteer = await import('puppeteer');
			this.browser = await puppeteer.default.launch(launchOptions);
			this.page = await this.browser.newPage();

			// Set default timeout
			const timeout = options.timeout ?? this.defaultOptions.timeout ?? 30000;
			this.page.setDefaultTimeout(timeout);
			this.page.setDefaultNavigationTimeout(timeout);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to launch browser: ${message}`);
		}
	}

	/**
	 * Navigate to a URL
	 * @param url - Target URL to navigate to
	 * @param options - Navigation options
	 * @returns Promise resolving when navigation completes
	 * @throws BrowserNotAvailableError if browser not launched
	 * @throws NavigationError if navigation fails
	 */
	async navigateTo(
		url: string,
		options: NavigationOptions = {},
	): Promise<void> {
		if (!this.page || !this.browser) {
			throw new BrowserNotAvailableError();
		}

		const navOptions = {
			timeout: options.timeout ?? this.defaultOptions.timeout ?? 30000,
			waitUntil: options.waitUntil ?? 'networkidle2',
		};

		try {
			await this.page.goto(url, navOptions);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new NavigationError(url, message);
		}
	}

	/**
	 * Capture a screenshot of the current page
	 * @param options - Screenshot options
	 * @returns Promise resolving to screenshot buffer (if no path specified)
	 * @throws BrowserNotAvailableError if browser not launched
	 */
	async takeScreenshot(
		options: ScreenshotOptions = {},
	): Promise<Buffer | undefined> {
		if (!this.page || !this.browser) {
			throw new BrowserNotAvailableError();
		}

		const screenshotOptions: Parameters<Page['screenshot']>[0] = {
			path: options.path,
			type: options.type ?? 'png',
			quality: options.quality,
			fullPage: options.fullPage ?? false,
			clip: options.clip,
		};

		try {
			const buffer = await this.page.screenshot(screenshotOptions);
			return buffer as Buffer | undefined;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to take screenshot: ${message}`);
		}
	}

	/**
	 * Execute JavaScript in the page context
	 * @param script - JavaScript code to execute
	 * @param args - Arguments to pass to the script
	 * @returns Promise resolving to script result
	 * @throws BrowserNotAvailableError if browser not launched
	 * @throws ScriptExecutionError if execution fails
	 */
	async executeScript(
		script: string,
		...args: unknown[]
	): Promise<ScriptResult> {
		if (!this.page || !this.browser) {
			throw new BrowserNotAvailableError();
		}

		try {
			const result = await this.page.evaluate(script, ...args);
			return {
				success: true,
				result,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				success: false,
				error: message,
			};
		}
	}

	/**
	 * Get the current page URL
	 * @returns Current page URL or null if no page
	 */
	getCurrentUrl(): string | null {
		return this.page?.url() ?? null;
	}

	/**
	 * Get the page title
	 * @returns Page title or null if no page
	 */
	async getPageTitle(): Promise<string | null> {
		if (!this.page) return null;
		try {
			return await this.page.title();
		} catch {
			return null;
		}
	}

	/**
	 * Check if browser is currently active
	 * @returns true if browser is running
	 */
	isActive(): boolean {
		return this.browser?.isConnected() ?? false;
	}

	/**
	 * Close the browser and clean up resources
	 * @returns Promise resolving when cleanup completes
	 */
	async closeBrowser(): Promise<void> {
		if (this.browser) {
			try {
				await this.browser.close();
			} catch {
				// Ignore errors during close
			} finally {
				this.browser = null;
				this.page = null;
			}
		}
	}

	/**
	 * Get the underlying page instance (advanced usage)
	 * @returns Page instance or null
	 */
	getPage(): Page | null {
		return this.page;
	}

	/**
	 * Get the underlying browser instance (advanced usage)
	 * @returns Browser instance or null
	 */
	getBrowser(): Browser | null {
		return this.browser;
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global browser controller instance for convenience
 */
let globalController: BrowserController | null = null;

/**
 * Get or create the global browser controller
 * @param options - Options for initial creation
 * @returns Global BrowserController instance
 */
export function getBrowserController(
	options?: BrowserLaunchOptions,
): BrowserController {
	if (!globalController) {
		globalController = new BrowserController(options);
	}
	return globalController;
}

/**
 * Reset the global browser controller
 */
export function resetBrowserController(): void {
	if (globalController) {
		globalController.closeBrowser().catch(() => {
			// Ignore errors during cleanup
		});
	}
	globalController = null;
}
