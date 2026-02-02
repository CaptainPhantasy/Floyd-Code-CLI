/**
 * Browser Automation Module
 *
 * Exports all browser automation components including:
 * - BrowserController: Puppeteer wrapper for browser control
 * - PageInteractor: High-level page interaction utilities
 * - SafetyMiddleware: URL validation, script sanitization, and permission checking
 *
 * @module browser
 */

export {
	BrowserController,
	getBrowserController,
	resetBrowserController,
	type BrowserLaunchOptions,
	type ScreenshotOptions,
	type NavigationOptions,
	type ScriptResult,
	BrowserNotAvailableError,
	NavigationError,
	ScriptExecutionError,
} from './browser-controller.js';

export {
	PageInteractor,
	createInteractor,
	quickClick,
	quickFill,
	quickExtract,
	type ElementSelector,
	type ClickOptions,
	type FillOptions,
	type WaitOptions,
	type ExtractOptions,
	type ExtractResult,
	ElementNotFoundError,
	InteractionTimeoutError,
} from './page-interactor.js';

export {
	SafetyMiddleware,
	UrlValidator,
	ScriptSanitizer,
	PermissionChecker,
	type UrlValidationOptions,
	type ScriptSanitizationOptions,
	type PermissionOptions,
	type SafetyCheckResult,
	UnsafeUrlError,
	ScriptRejectedError,
	PermissionDeniedError,
} from './safety-middleware.js';
