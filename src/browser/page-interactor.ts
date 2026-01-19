/**
 * Page Interactor
 *
 * High-level page interaction utilities built on top of BrowserController.
 * Provides methods for clicking, filling forms, waiting for elements,
 * and extracting data from pages.
 *
 * @module browser/page-interactor
 */

import type {Page} from 'puppeteer';
import {
	getBrowserController,
	type BrowserController,
} from './browser-controller.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Element selector strategies
 */
export type SelectorStrategy =
	| 'css' // CSS selector
	| 'xpath' // XPath expression
	| 'text' // Text content search
	| 'aria'; // ARIA label or role

/**
 * Element selector configuration
 */
export interface ElementSelector {
	/** Selector strategy to use */
	strategy?: SelectorStrategy;
	/** Selector value (CSS, XPath, text, or ARIA) */
	value: string;
	/** Frame index for nested iframes (0 = main frame) */
	frameIndex?: number;
	/** Wait timeout in milliseconds */
	timeout?: number;
}

/**
 * Click interaction options
 */
export interface ClickOptions {
	/** Mouse button to click */
	button?: 'left' | 'right' | 'middle';
	/** Number of clicks (default: 1) */
	clickCount?: number;
	/** Delay between clicks in milliseconds */
	delay?: number;
	/** Whether to scroll element into view first */
	scrollToView?: boolean;
}

/**
 * Fill options for form fields
 */
export interface FillOptions {
	/** Delay between keystrokes in milliseconds */
	keystrokeDelay?: number;
	/** Clear field before filling */
	clearFirst?: boolean;
	/** Whether to blur element after filling */
	blurAfter?: boolean;
}

/**
 * Wait options
 */
export interface WaitOptions {
	/** Maximum wait time in milliseconds */
	timeout?: number;
	/** Polling interval in milliseconds */
	polling?: number;
}

/**
 * Data extraction configuration
 */
export interface ExtractOptions {
	/** Attribute to extract (if not text content) */
	attribute?: string;
	/** Extract multiple elements */
	multiple?: boolean;
	/** Wait for element before extracting */
	waitFor?: boolean;
	/** Maximum wait time in milliseconds */
	timeout?: number;
}

/**
 * Extracted data result
 */
export interface ExtractResult<T = unknown> {
	/** Whether extraction was successful */
	success: boolean;
	/** Extracted data (if successful) */
	data?: T;
	/** Error message (if failed) */
	error?: string;
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Error thrown when element is not found
 */
export class ElementNotFoundError extends Error {
	constructor(selector: ElementSelector) {
		super(`Element not found: ${JSON.stringify(selector)}`);
		this.name = 'ElementNotFoundError';
	}
}

/**
 * Error thrown when interaction times out
 */
export class InteractionTimeoutError extends Error {
	constructor(action: string, selector: ElementSelector) {
		super(
			`Timeout waiting for ${action} on element: ${JSON.stringify(selector)}`,
		);
		this.name = 'InteractionTimeoutError';
	}
}

// ============================================================================
// PAGE INTERACTOR
// ============================================================================

/**
 * High-level page interaction utilities.
 * Works with a BrowserController to perform actions on the active page.
 */
export class PageInteractor {
	/** Underlying browser controller */
	private controller: BrowserController;

	/**
	 * Create a new PageInteractor
	 * @param controller - BrowserController instance (uses global if not provided)
	 */
	constructor(controller?: BrowserController) {
		this.controller = controller ?? getBrowserController();
	}

	/**
	 * Click an element on the page
	 * @param selector - Element selector
	 * @param options - Click options
	 * @returns Promise resolving when click completes
	 * @throws ElementNotFoundError if element doesn't exist
	 * @throws InteractionTimeoutError if click times out
	 */
	async click(
		selector: ElementSelector,
		options: ClickOptions = {},
	): Promise<void> {
		const page = this.getPage();
		const element = await this.findElement(selector);

		if (options.scrollToView ?? true) {
			await page.evaluate(el => {
				if (el) {
					el.scrollIntoView({behavior: 'smooth', block: 'center'});
				}
			}, element);
		}

		const clickOptions = {
			button: options.button ?? 'left',
			clickCount: options.clickCount ?? 1,
			delay: options.delay,
		};

		if (element) {
			await element.click(clickOptions);
		}
	}

	/**
	 * Fill a form field with text
	 * @param selector - Element selector
	 * @param text - Text to fill
	 * @param options - Fill options
	 * @returns Promise resolving when fill completes
	 */
	async fill(
		selector: ElementSelector,
		text: string,
		options: FillOptions = {},
	): Promise<void> {
		const element = await this.findElement(selector);

		if (!element) {
			throw new ElementNotFoundError(selector);
		}

		if (options.clearFirst ?? true) {
			await element.click({clickCount: 3}); // Select all
			await element.press('Backspace');
		}

		const keystrokeDelay = options.keystrokeDelay ?? 10;
		await element.type(text, {delay: keystrokeDelay});

		if (options.blurAfter ?? true) {
			// Evaluate blur in page context
			const page = this.getPage();
			await page.evaluate(el => {
				(el as HTMLElement).blur();
			}, element);
		}
	}

	/**
	 * Fill multiple form fields at once
	 * @param fields - Map of selectors to values
	 * @param options - Fill options applied to all fields
	 * @returns Promise resolving when all fills complete
	 */
	async fillMany(
		fields: Record<string, string>,
		options: FillOptions = {},
	): Promise<void> {
		for (const [selector, value] of Object.entries(fields)) {
			const elementSelector: ElementSelector = {
				strategy: 'css',
				value: selector,
			};
			await this.fill(elementSelector, value, options);
		}
	}

	/**
	 * Wait for an element to appear on the page
	 * @param selector - Element selector
	 * @param options - Wait options
	 * @returns Promise resolving when element is found
	 * @throws InteractionTimeoutError if timeout exceeded
	 */
	async waitFor(
		selector: ElementSelector,
		options: WaitOptions = {},
	): Promise<void> {
		const timeout = options.timeout ?? 30000;
		const polling = options.polling ?? 100;

		const startTime = Date.now();
		while (Date.now() - startTime < timeout) {
			try {
				await this.findElement(selector, {timeout: polling});
				return;
			} catch {
				// Continue polling
			}
		}

		throw new InteractionTimeoutError('waitFor', selector);
	}

	/**
	 * Wait for page to finish loading
	 * @param options - Wait options
	 * @returns Promise resolving when page is loaded
	 */
	async waitForLoad(options: WaitOptions = {}): Promise<void> {
		const timeout = options.timeout ?? 30000;
		const page = this.getPage();

		await Promise.race([
			page.waitForNavigation({waitUntil: 'networkidle2'}),
			new Promise(resolve => setTimeout(resolve, timeout)),
		]);
	}

	/**
	 * Extract text or attribute from element(s)
	 * @param selector - Element selector
	 * @param options - Extraction options
	 * @returns Extracted data result
	 */
	async extract<T = string>(
		selector: ElementSelector,
		options: ExtractOptions = {},
	): Promise<ExtractResult<T>> {
		try {
			if (options.waitFor) {
				await this.waitFor(selector, {timeout: options.timeout});
			}

			if (options.multiple) {
				const elements = await this.findAllElements(selector);
				const results: unknown[] = [];

				for (const element of elements) {
					const data = await this.extractFromElement(
						element,
						options.attribute,
					);
					results.push(data);
				}

				return {success: true, data: results as T};
			} else {
				const element = await this.findElement(selector);
				const data = await this.extractFromElement(element, options.attribute);
				return {success: true, data: data as T};
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {success: false, error: message};
		}
	}

	/**
	 * Extract structured data from the page using JSON-LD or similar
	 * @returns Extracted structured data
	 */
	async extractStructuredData(): Promise<
		ExtractResult<Record<string, unknown>>
	> {
		const page = this.getPage();

		try {
			const data = await page.evaluate(() => {
				// Try JSON-LD
				const scripts = Array.from(
					document.querySelectorAll('script[type="application/ld+json"]'),
				);
				const jsonLd: unknown[] = [];

				for (const script of scripts) {
					try {
						jsonLd.push(JSON.parse(script.textContent || ''));
					} catch {
						// Skip invalid JSON
					}
				}

				// Get meta tags
				const metaTags: Record<string, string> = {};
				const metas = Array.from(
					document.querySelectorAll('meta[name], meta[property]'),
				);
				for (const meta of metas) {
					const name =
						meta.getAttribute('name') || meta.getAttribute('property');
					const content = meta.getAttribute('content');
					if (name && content) {
						metaTags[name] = content;
					}
				}

				return {
					jsonLd,
					metaTags,
					title: document.title,
					url: window.location.href,
				};
			});

			return {success: true, data: data as Record<string, unknown>};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {success: false, error: message};
		}
	}

	/**
	 * Hover over an element
	 * @param selector - Element selector
	 * @returns Promise resolving when hover completes
	 */
	async hover(selector: ElementSelector): Promise<void> {
		const element = await this.findElement(selector);
		if (element) {
			await element.hover();
		}
	}

	/**
	 * Select an option from a dropdown
	 * @param selector - Select element selector
	 * @param value - Option value to select
	 * @returns Promise resolving when selection completes
	 */
	async selectOption(selector: ElementSelector, value: string): Promise<void> {
		const element = await this.findElement(selector);
		if (element) {
			await element.select(value);
		}
	}

	/**
	 * Get the current page URL
	 * @returns Current URL
	 */
	getUrl(): string | null {
		return this.controller.getCurrentUrl();
	}

	/**
	 * Navigate back in history
	 * @returns Promise resolving when navigation completes
	 */
	async goBack(): Promise<void> {
		const page = this.getPage();
		await page.goBack();
	}

	/**
	 * Navigate forward in history
	 * @returns Promise resolving when navigation completes
	 */
	async goForward(): Promise<void> {
		const page = this.getPage();
		await page.goForward();
	}

	/**
	 * Reload the current page
	 * @returns Promise resolving when reload completes
	 */
	async reload(): Promise<void> {
		const page = this.getPage();
		await page.reload();
	}

	// ========================================================================
	// PRIVATE HELPERS
	// ========================================================================

	/**
	 * Get the active page, throwing if not available
	 * @returns Active Page instance
	 */
	private getPage(): Page {
		const page = this.controller.getPage();
		if (!page) {
			throw new Error('Browser is not available. Call launchBrowser() first.');
		}
		return page;
	}

	/**
	 * Find a single element by selector
	 * @param selector - Element selector
	 * @param options - Find options
	 * @returns Element handle
	 */
	private async findElement(
		selector: ElementSelector,
		options: WaitOptions = {},
	): Promise<ReturnType<Page['waitForSelector']>> {
		const page = this.getPage();
		const timeout = options.timeout ?? selector.timeout ?? 30000;

		let query = selector.value;

		switch (selector.strategy ?? 'css') {
			case 'xpath':
				query = `xpath/${query}`;
				break;
			case 'text':
				query = `::-p-text(${JSON.stringify(query)})`;
				break;
			case 'aria':
				query = `aria/${query}`;
				break;
			default:
				// CSS selector (default)
				break;
		}

		try {
			return await page.waitForSelector(query, {timeout});
		} catch {
			throw new ElementNotFoundError(selector);
		}
	}

	/**
	 * Find all elements matching selector
	 * @param selector - Element selector
	 * @returns Array of element handles
	 */
	private async findAllElements(
		selector: ElementSelector,
	): Promise<ReturnType<Page['$$']>> {
		const page = this.getPage();

		switch (selector.strategy ?? 'css') {
			case 'xpath':
				// Use $$eval with XPath to get elements
				return await page.$$(`xpath/.${selector.value}`);
			case 'text':
				return await page.$$(`::-p-text(${JSON.stringify(selector.value)})`);
			case 'aria':
				return await page.$$(`aria/${selector.value}`);
			default:
				return await page.$$(selector.value);
		}
	}

	/**
	 * Extract data from a single element handle
	 * @param element - Element handle
	 * @param attribute - Attribute name (or undefined for text content)
	 * @returns Extracted data
	 */
	private async extractFromElement(
		element: Awaited<ReturnType<Page['waitForSelector']>>,
		attribute?: string,
	): Promise<string> {
		const page = this.getPage();

		return await page.evaluate(
			(el, attr) => {
				if (!el) {
					return '';
				}
				if (attr) {
					return el.getAttribute(attr) || '';
				}
				return (el as HTMLElement).textContent || '';
			},
			element,
			attribute,
		);
	}
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a PageInteractor with the global browser controller
 * @returns New PageInteractor instance
 */
export function createInteractor(): PageInteractor {
	return new PageInteractor();
}

/**
 * Quick click using global interactor
 * @param selector - Element selector
 * @param options - Click options
 * @returns Promise resolving when click completes
 */
export async function quickClick(
	selector: ElementSelector,
	options?: ClickOptions,
): Promise<void> {
	const interactor = createInteractor();
	await interactor.click(selector, options);
}

/**
 * Quick fill using global interactor
 * @param selector - Element selector
 * @param text - Text to fill
 * @param options - Fill options
 * @returns Promise resolving when fill completes
 */
export async function quickFill(
	selector: ElementSelector,
	text: string,
	options?: FillOptions,
): Promise<void> {
	const interactor = createInteractor();
	await interactor.fill(selector, text, options);
}

/**
 * Quick extract using global interactor
 * @param selector - Element selector
 * @param options - Extract options
 * @returns Extracted data
 */
export async function quickExtract<T = string>(
	selector: ElementSelector,
	options?: ExtractOptions,
): Promise<ExtractResult<T>> {
	const interactor = createInteractor();
	return await interactor.extract<T>(selector, options);
}
