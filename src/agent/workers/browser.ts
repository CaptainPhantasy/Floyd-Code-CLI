/**
 * Browser Worker Agent
 *
 * Web interaction and content extraction specialist.
 * Handles browser automation, page interaction, and content extraction
 * with integrated safety checks and Chrome extension support.
 *
 * @module agent/workers/browser
 */

import {
	BrowserController,
	getBrowserController,
	type BrowserLaunchOptions,
} from '../../browser/browser-controller.js';
import {
	PageInteractor,
	createInteractor,
	type ElementSelector,
} from '../../browser/page-interactor.js';
import {
	SafetyMiddleware,
	UnsafeUrlError,
	ScriptRejectedError,
	PermissionDeniedError,
} from '../../browser/safety-middleware.js';
import {readFileSync} from 'fs';
import {join} from 'path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Page snapshot structure for accessibility analysis
 */
export interface PageSnapshot {
	/** Page URL */
	url: string;
	/** Page title */
	title: string;
	/** Accessibility tree of elements */
	tree: SnapshotNode[];
	/** Timestamp of snapshot */
	timestamp: number;
}

/**
 * Single node in the accessibility tree
 */
export interface SnapshotNode {
	/** Node type (element, text, etc.) */
	type: string;
	/** Tag name if element */
	tag?: string;
	/** Text content if text node */
	text?: string;
	/** ARIA role if available */
	role?: string;
	/** ARIA label if available */
	label?: string;
	/** Element attributes */
	attributes?: Record<string, string>;
	/** Child nodes */
	children?: SnapshotNode[];
	/** Whether element is interactive */
	interactive?: boolean;
	/** Element selector for targeting */
	selector?: string;
}

/**
 * Result of a browser worker operation
 */
export interface BrowserResult {
	/** Action performed */
	action: string;
	/** Current URL */
	url: string;
	/** Operation status */
	status: 'success' | 'failed' | 'blocked';
	/** Optional result data */
	data?: {
		/** Page title */
		title?: string;
		/** Extracted text content */
		text?: string;
		/** Page snapshot */
		snapshot?: PageSnapshot;
		/** Screenshot path */
		screenshot?: string;
		/** Script evaluation result */
		scriptResult?: unknown;
		/** Elements found */
		elements?: SnapshotNode[];
		/** Selector used */
		selector?: string;
		/** Text typed */
		textTyped?: string;
		/** Timeout value */
		timeout?: number;
		/** Value selected */
		value?: string;
		/** Structured data */
		structuredData?: unknown;
		[key: string]: unknown;
	};
	/** Error message if failed */
	error?: string;
}

/**
 * Browser worker configuration options
 */
export interface BrowserWorkerOptions {
	/** Browser launch options */
	launchOptions?: BrowserLaunchOptions;
	/** Whether to use Chrome extension (if available) */
	useChromeExtension?: boolean;
	/** Path to allowlist JSON file */
	allowlistPath?: string;
	/** Maximum operations per session */
	maxOperations?: number;
	/** Rate limit (operations per minute) */
	rateLimit?: number;
	/** Maximum page size in bytes */
	maxPageSize?: number;
	/** Request timeout in milliseconds */
	requestTimeout?: number;
	/** Token budget for operations (default: 50) */
	tokenBudget?: number;
}

/**
 * Allowlist configuration
 */
interface AllowlistConfig {
	/** Schema version */
	version: string;
	/** Allowed domains */
	domains: string[];
	/** Allowed path patterns */
	paths: string[];
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Error thrown when operation exceeds token budget
 */
export class TokenBudgetExceededError extends Error {
	constructor(budget: number, requested: number) {
		super(`Token budget exceeded: ${requested} > ${budget}`);
		this.name = 'TokenBudgetExceededError';
	}
}

/**
 * Error thrown when domain is not in allowlist
 */
export class DomainNotAllowedError extends Error {
	constructor(domain: string) {
		super(`Domain "${domain}" is not in the allowlist`);
		this.name = 'DomainNotAllowedError';
	}
}

/**
 * Error thrown when auth zone is detected
 */
export class AuthZoneError extends Error {
	constructor(url: string) {
		super(`Authentication zone detected at "${url}". Operation blocked.`);
		this.name = 'AuthZoneError';
	}
}

/**
 * Error thrown when tab is not owned
 */
export class TabNotOwnedError extends Error {
	constructor(tabId: number) {
		super(`Tab ${tabId} is not owned by this session`);
		this.name = 'TabNotOwnedError';
	}
}

// ============================================================================
// BROWSER WORKER
// ============================================================================

/**
 * Browser Worker Agent
 *
 * Web interaction and content extraction specialist.
 * Handles browser automation with integrated safety checks.
 */
export class BrowserWorker {
	/** Browser controller instance */
	private controller: BrowserController;

	/** Page interactor instance */
	private interactor: PageInteractor;

	/** Safety middleware for validation */
	private safety: SafetyMiddleware;

	/** Worker configuration */
	private options: BrowserWorkerOptions;

	/** Allowlist configuration */
	private allowlist: AllowlistConfig | null = null;

	/** Owned tabs for Chrome extension mode */
	private ownedTabs: Set<number> = new Set();

	/** Current operation count */
	private operationCount = 0;

	/** Operation timestamps for rate limiting */
	private operations: number[] = [];

	/** Current URL */
	private currentUrl: string | null = null;

	/** Token budget remaining */
	private tokenBudget: number;

	/** Authentication zone patterns */
	private static readonly AUTH_ZONE_PATTERNS = [
		/login/i,
		/signin/i,
		/sign-in/i,
		/auth/i,
		/oauth/i,
		/sso/i,
		/password/i,
		/credential/i,
		/account.*verify/i,
		/secure.*update/i,
		/bank.*login/i,
		/paypal.*signin/i,
		/apple.*id.*signin/i,
	];

	/**
	 * Create a new BrowserWorker
	 * @param options - Worker configuration options
	 */
	constructor(options: BrowserWorkerOptions = {}) {
		this.options = {
			tokenBudget: 50,
			maxOperations: 1000,
			rateLimit: 60,
			maxPageSize: 10 * 1024 * 1024, // 10MB
			requestTimeout: 30000,
			allowlistPath: join(process.cwd(), '.floyd', 'allowlist.json'),
			...options,
		};

		this.tokenBudget = this.options.tokenBudget ?? 50;

		// Initialize browser controller
		this.controller = getBrowserController(this.options.launchOptions);

		// Initialize page interactor
		this.interactor = createInteractor();

		// Initialize safety middleware
		this.safety = new SafetyMiddleware(
			{
				allowLocalhost: true,
				allowPrivateNetwork: true,
				blocklist: [],
				allowlist: [],
			},
			{
				allowConsole: false,
				allowNetwork: false,
				allowDomManipulation: true,
				maxLength: 10000,
			},
			{
				consentForNavigation: false,
				consentForScripts: true,
				consentForScreenshots: false,
				maxOperations: this.options.maxOperations,
				rateLimit: this.options.rateLimit,
			},
		);

		// Load allowlist if path provided
		this.loadAllowlist();
	}

	/**
	 * Initialize the browser worker
	 * Launches browser and sets up connections
	 */
	async initialize(): Promise<void> {
		// Launch browser if not using Chrome extension
		if (!this.options.useChromeExtension) {
			await this.controller.launchBrowser(this.options.launchOptions);
		}
		// Chrome extension support can be added here via WebSocket bridge
	}

	/**
	 * Navigate to a URL
	 * @param url - Target URL to navigate to
	 * @returns Promise resolving to navigation result
	 */
	async navigate(url: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('navigate', async () => {
			// Validate URL against safety checks
			const safetyResult = this.safety.validateUrl(url);
			if (!safetyResult.passed) {
				throw new UnsafeUrlError(url, safetyResult.reason ?? 'Unknown reason');
			}

			// Check allowlist
			if (!this.isDomainAllowed(url)) {
				throw new DomainNotAllowedError(new URL(url).hostname);
			}

			// Check for auth zones
			if (this.isAuthZone(url)) {
				throw new AuthZoneError(url);
			}

			// Navigate
			await this.controller.navigateTo(url, {
				timeout: this.options.requestTimeout,
			});

			this.currentUrl = url;

			// Get page title
			const title = await this.controller.getPageTitle();

			return {
				action: 'navigate',
				url,
				status: 'success',
				data: {title: title ?? undefined},
			};
		});
	}

	/**
	 * Click an element on the page
	 * @param selector - Element selector (CSS, XPath, text, or ARIA)
	 * @returns Promise resolving to click result
	 */
	async click(selector: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('click', async () => {
			const elementSelector = this.parseSelector(selector);

			await this.interactor.click(elementSelector, {
				scrollToView: true,
				button: 'left',
				clickCount: 1,
			});

			return {
				action: 'click',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {selector},
			};
		});
	}

	/**
	 * Type text into an input element
	 * @param selector - Element selector
	 * @param text - Text to type
	 * @returns Promise resolving to type result
	 */
	async type(selector: string, text: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('type', async () => {
			const elementSelector = this.parseSelector(selector);

			await this.interactor.fill(elementSelector, text, {
				clearFirst: true,
				keystrokeDelay: 10,
				blurAfter: true,
			});

			return {
				action: 'type',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {selector, textTyped: text},
			};
		});
	}

	/**
	 * Get a snapshot of the current page structure
	 * @returns Promise resolving to page snapshot
	 */
	async snapshot(): Promise<PageSnapshot> {
		if (!this.currentUrl) {
			throw new Error('No page loaded. Navigate to a URL first.');
		}

		// Estimate token cost: ~5 tokens
		this.checkTokenBudget(5);

		const page = this.controller.getPage();
		if (!page) {
			throw new Error('Browser page not available');
		}

		// Execute script to get accessibility tree
		const result = await this.controller.executeScript(`
			(() => {
				function buildTree(node, depth = 0) {
					if (depth > 50) return null; // Limit depth

					const info = {
						type: node.nodeType === Node.ELEMENT_NODE ? 'element' : 'text',
						tag: node.tagName?.toLowerCase(),
						text: node.textContent?.trim()?.slice(0, 100),
						role: node.getAttribute('role') || node.ariaRoleDescription || undefined,
						label: node.getAttribute('aria-label') || undefined,
						interactive: [
							'a', 'button', 'input', 'select', 'textarea',
							'[onclick]', '[onmousedown]', '[role="button"]',
							'[tabindex]'
						].some(s => {
							if (s.startsWith('[')) {
								return node.matches(s);
							}
							return node.tagName?.toLowerCase() === s ||
							       node.getAttribute('role') === s.replace('[role="', '').replace('"]', '');
						}),
						selector: depth === 0 ? 'body' : undefined
					};

					// Generate simple selector for interactive elements
					if (info.interactive && node.id) {
						info.selector = '#' + node.id;
					} else if (info.interactive && node.className) {
						const classes = node.className.split(' ').filter(c => c).slice(0, 2);
						if (classes.length) {
							info.selector = node.tagName?.toLowerCase() + '.' + classes.join('.');
						}
					}

					const children = [];
					for (const child of node.childNodes) {
						if (child.nodeType === Node.ELEMENT_NODE ||
						    (child.nodeType === Node.TEXT_NODE && child.textContent?.trim())) {
							const childInfo = buildTree(child, depth + 1);
							if (childInfo) children.push(childInfo);
						}
					}

					return { ...info, children: children.length ? children : undefined };
				}

				return buildTree(document.body);
			})()
		`);

		if (!result.success) {
			throw new Error(`Failed to capture snapshot: ${result.error}`);
		}

		const title = await this.controller.getPageTitle();

		return {
			url: this.currentUrl,
			title: title ?? 'Unknown',
			tree: (result.result as SnapshotNode)
				? [result.result as SnapshotNode]
				: [],
			timestamp: Date.now(),
		};
	}

	/**
	 * Extract text content from the page
	 * @param selector - Optional selector to extract from specific element
	 * @returns Promise resolving to extracted text
	 */
	async extractText(selector?: string): Promise<string> {
		// Estimate token cost: ~10 tokens
		this.checkTokenBudget(10);

		const page = this.controller.getPage();
		if (!page) {
			throw new Error('Browser page not available');
		}

		let text = '';

		if (selector) {
			// Extract from specific element
			const elementSelector = this.parseSelector(selector);
			const result = await this.interactor.extract<string>(elementSelector, {
				waitFor: true,
			});

			if (!result.success) {
				throw new Error(`Failed to extract text: ${result.error}`);
			}

			text = result.data ?? '';
		} else {
			// Extract all visible text from page
			const result = await this.controller.executeScript(`
				(() => {
					// Get main content areas
					const main = document.querySelector('main, article, [role="main"]');
					const target = main || document.body;

					// Remove script and style content
					const clones = target.cloneNode(true);
					clones.querySelectorAll('script, style, noscript').forEach(el => el.remove());

					// Get text content
					return clones.textContent?.trim() || '';
				})()
			`);

			if (!result.success) {
				throw new Error(`Failed to extract text: ${result.error}`);
			}

			text = (result.result as string) ?? '';
		}

		return text;
	}

	/**
	 * Evaluate JavaScript in the browser context
	 * @param script - JavaScript code to execute
	 * @returns Promise resolving to evaluation result
	 */
	async evaluate(script: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('evaluate', async () => {
			// Sanitize script
			const safetyResult = this.safety.sanitizeScript(script);
			if (!safetyResult.passed) {
				throw new ScriptRejectedError(safetyResult.reason ?? 'Script rejected');
			}

			// Check permission
			const permResult = this.safety.checkPermission('executeScript');
			if (!permResult.passed) {
				throw new PermissionDeniedError('executeScript');
			}

			// Execute script
			const result = await this.controller.executeScript(script);

			if (!result.success) {
				return {
					action: 'evaluate',
					url: this.currentUrl ?? 'unknown',
					status: 'failed',
					error: result.error,
				};
			}

			return {
				action: 'evaluate',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {scriptResult: result.result},
			};
		});
	}

	/**
	 * Wait for an element to appear on the page
	 * @param selector - Element selector to wait for
	 * @param timeout - Optional timeout in milliseconds (default: 30000)
	 * @returns Promise resolving when element is found
	 */
	async waitFor(selector: string, timeout = 30000): Promise<BrowserResult> {
		return this.executeWithErrorHandling('waitFor', async () => {
			const elementSelector = this.parseSelector(selector);

			await this.interactor.waitFor(elementSelector, {
				timeout,
			});

			return {
				action: 'waitFor',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {selector, timeout},
			};
		});
	}

	/**
	 * Take a screenshot of the current page
	 * @param path - Optional file path to save screenshot
	 * @returns Promise resolving to screenshot result
	 */
	async screenshot(path?: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('screenshot', async () => {
			await this.controller.takeScreenshot({
				path,
				type: 'png',
				fullPage: false,
			});

			return {
				action: 'screenshot',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {
					screenshot: path ?? 'screenshot taken',
				},
			};
		});
	}

	/**
	 * Navigate back in browser history
	 * @returns Promise resolving to navigation result
	 */
	async goBack(): Promise<BrowserResult> {
		return this.executeWithErrorHandling('goBack', async () => {
			await this.interactor.goBack();
			this.currentUrl = this.controller.getCurrentUrl();
			return {
				action: 'goBack',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
			};
		});
	}

	/**
	 * Navigate forward in browser history
	 * @returns Promise resolving to navigation result
	 */
	async goForward(): Promise<BrowserResult> {
		return this.executeWithErrorHandling('goForward', async () => {
			await this.interactor.goForward();
			this.currentUrl = this.controller.getCurrentUrl();
			return {
				action: 'goForward',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
			};
		});
	}

	/**
	 * Reload the current page
	 * @returns Promise resolving to reload result
	 */
	async reload(): Promise<BrowserResult> {
		return this.executeWithErrorHandling('reload', async () => {
			await this.interactor.reload();
			return {
				action: 'reload',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
			};
		});
	}

	/**
	 * Hover over an element
	 * @param selector - Element selector
	 * @returns Promise resolving to hover result
	 */
	async hover(selector: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('hover', async () => {
			const elementSelector = this.parseSelector(selector);
			await this.interactor.hover(elementSelector);

			return {
				action: 'hover',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {selector},
			};
		});
	}

	/**
	 * Select an option from a dropdown
	 * @param selector - Select element selector
	 * @param value - Option value to select
	 * @returns Promise resolving to selection result
	 */
	async selectOption(selector: string, value: string): Promise<BrowserResult> {
		return this.executeWithErrorHandling('selectOption', async () => {
			const elementSelector = this.parseSelector(selector);
			await this.interactor.selectOption(elementSelector, value);

			return {
				action: 'selectOption',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {selector, value},
			};
		});
	}

	/**
	 * Extract structured data from the page (JSON-LD, meta tags, etc.)
	 * @returns Promise resolving to structured data
	 */
	async extractStructuredData(): Promise<BrowserResult> {
		return this.executeWithErrorHandling('extractStructuredData', async () => {
			const result = await this.interactor.extractStructuredData();

			if (!result.success) {
				return {
					action: 'extractStructuredData',
					url: this.currentUrl ?? 'unknown',
					status: 'failed',
					error: result.error,
				};
			}

			return {
				action: 'extractStructuredData',
				url: this.currentUrl ?? 'unknown',
				status: 'success',
				data: {structuredData: result.data},
			};
		});
	}

	/**
	 * Get the current page URL
	 * @returns Current URL or null
	 */
	getCurrentUrl(): string | null {
		return this.currentUrl;
	}

	/**
	 * Check if browser is active
	 * @returns true if browser is running
	 */
	isActive(): boolean {
		return this.controller.isActive();
	}

	/**
	 * Get remaining token budget
	 * @returns Remaining tokens
	 */
	getTokenBudget(): number {
		return this.tokenBudget;
	}

	/**
	 * Reset token budget
	 * @param budget - New token budget (default: 50)
	 */
	resetTokenBudget(budget = 50): void {
		this.tokenBudget = budget;
	}

	/**
	 * Get operation count
	 * @returns Total operations performed
	 */
	getOperationCount(): number {
		return this.operationCount;
	}

	/**
	 * Get owned tabs (Chrome extension mode)
	 * @returns Array of owned tab IDs
	 */
	getOwnedTabs(): number[] {
		return Array.from(this.ownedTabs);
	}

	/**
	 * Check if a tab is owned
	 * @param tabId - Tab ID to check
	 * @returns true if tab is owned
	 */
	isTabOwned(tabId: number): boolean {
		return this.ownedTabs.has(tabId);
	}

	/**
	 * Claim ownership of a tab
	 * @param tabId - Tab ID to claim
	 */
	claimTab(tabId: number): void {
		this.ownedTabs.add(tabId);
	}

	/**
	 * Release tab ownership
	 * @param tabId - Tab ID to release
	 */
	releaseTab(tabId: number): void {
		this.ownedTabs.delete(tabId);
	}

	/**
	 * Get safety state snapshot
	 * @returns Current safety state
	 */
	getSafetyState() {
		return this.safety.getState();
	}

	/**
	 * Grant permission for an action
	 * @param action - Action to grant permission for
	 */
	grantPermission(action: string): void {
		this.safety.grantPermission(action);
	}

	/**
	 * Deny permission for an action
	 * @param action - Action to deny permission for
	 */
	denyPermission(action: string): void {
		this.safety.denyPermission(action);
	}

	/**
	 * Clean up resources
	 */
	async shutdown(): Promise<void> {
		await this.controller.closeBrowser();
		this.ownedTabs.clear();
		this.safety.reset();
	}

	// ========================================================================
	// PRIVATE METHODS
	// ========================================================================

	/**
	 * Execute an action with error handling and safety checks
	 * @param action - Action name
	 * @param fn - Function to execute
	 * @returns Browser result
	 */
	private async executeWithErrorHandling(
		action: string,
		fn: () => Promise<BrowserResult>,
	): Promise<BrowserResult> {
		// Check rate limits
		const rateResult = this.safety.checkPermission(action);
		if (!rateResult.passed) {
			return {
				action,
				url: this.currentUrl ?? 'unknown',
				status: 'blocked',
				error: rateResult.reason,
			};
		}

		// Record operation
		this.safety.recordOperation();
		this.operationCount++;
		this.operations.push(Date.now());

		// Clean up old operation timestamps
		const oneMinuteAgo = Date.now() - 60000;
		this.operations = this.operations.filter(t => t > oneMinuteAgo);

		try {
			const result = await fn();
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				action,
				url: this.currentUrl ?? 'unknown',
				status: 'failed',
				error: message,
			};
		}
	}

	/**
	 * Parse a selector string into an ElementSelector
	 * @param selector - Selector string (css:, xpath:, text:, aria:, or raw CSS)
	 * @returns ElementSelector object
	 */
	private parseSelector(selector: string): ElementSelector {
		if (selector.startsWith('xpath:')) {
			return {
				strategy: 'xpath',
				value: selector.slice(6).trim(),
			};
		}

		if (selector.startsWith('text:')) {
			return {
				strategy: 'text',
				value: selector.slice(5).trim(),
			};
		}

		if (selector.startsWith('aria:')) {
			return {
				strategy: 'aria',
				value: selector.slice(5).trim(),
			};
		}

		if (selector.startsWith('css:')) {
			return {
				strategy: 'css',
				value: selector.slice(4).trim(),
			};
		}

		// Default to CSS selector
		return {
			strategy: 'css',
			value: selector,
		};
	}

	/**
	 * Check if domain is allowed based on allowlist
	 * @param url - URL to check
	 * @returns true if domain is allowed
	 */
	private isDomainAllowed(url: string): boolean {
		// If no allowlist configured, allow all
		if (!this.allowlist || this.allowlist.domains.length === 0) {
			return true;
		}

		try {
			const urlObj = new URL(url);
			const hostname = urlObj.hostname.toLowerCase();

			// Check exact matches and subdomain matches
			for (const domain of this.allowlist.domains) {
				if (hostname === domain || hostname.endsWith(`.${domain}`)) {
					return true;
				}
			}

			return false;
		} catch {
			return false;
		}
	}

	/**
	 * Check if URL is an authentication zone
	 * @param url - URL to check
	 * @returns true if URL appears to be an auth zone
	 */
	private isAuthZone(url: string): boolean {
		return BrowserWorker.AUTH_ZONE_PATTERNS.some(pattern => pattern.test(url));
	}

	/**
	 * Load allowlist from file
	 */
	private loadAllowlist(): void {
		if (!this.options.allowlistPath) {
			return;
		}

		try {
			const content = readFileSync(this.options.allowlistPath, 'utf-8');
			this.allowlist = JSON.parse(content) as AllowlistConfig;
		} catch (error) {
			// Allowlist not found or invalid - continue without it
			this.allowlist = null;
		}
	}

	/**
	 * Check if operation fits within token budget
	 * @param cost - Token cost of operation
	 * @throws TokenBudgetExceededError if budget exceeded
	 */
	private checkTokenBudget(cost: number): void {
		if (cost > this.tokenBudget) {
			throw new TokenBudgetExceededError(this.tokenBudget, cost);
		}
		this.tokenBudget -= cost;
	}
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new browser worker instance
 * @param options - Worker configuration options
 * @returns BrowserWorker instance
 */
export function createBrowserWorker(
	options?: BrowserWorkerOptions,
): BrowserWorker {
	return new BrowserWorker(options);
}

/**
 * Quick navigate using a temporary browser worker
 * @param url - URL to navigate to
 * @param options - Optional worker configuration
 * @returns Promise resolving to navigation result
 */
export async function quickNavigate(
	url: string,
	options?: BrowserWorkerOptions,
): Promise<BrowserResult> {
	const worker = new BrowserWorker(options);
	await worker.initialize();
	try {
		return await worker.navigate(url);
	} finally {
		await worker.shutdown();
	}
}

/**
 * Quick extract using a temporary browser worker
 * @param url - URL to extract from
 * @param selector - Optional selector to extract from
 * @param options - Optional worker configuration
 * @returns Promise resolving to extracted text
 */
export async function quickExtract(
	url: string,
	selector?: string,
	options?: BrowserWorkerOptions,
): Promise<string> {
	const worker = new BrowserWorker(options);
	await worker.initialize();
	try {
		await worker.navigate(url);
		return await worker.extractText(selector);
	} finally {
		await worker.shutdown();
	}
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default BrowserWorker;
