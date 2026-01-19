/**
 * Safety Middleware
 *
 * Safety checks and validation for browser automation operations.
 * Provides URL validation, script sanitization, and permission checking
 * to ensure safe browser automation.
 *
 * @module browser/safety-middleware
 */

import {URL} from 'node:url';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Safety check result
 */
export interface SafetyCheckResult {
	/** Whether the check passed */
	passed: boolean;
	/** Reason for failure (if any) */
	reason?: string;
	/** Blocking category (if blocked) */
	category?: 'malware' | 'phishing' | 'adult' | 'dangerous' | 'permission';
}

/**
 * URL validation options
 */
export interface UrlValidationOptions {
	/** Allow localhost URLs */
	allowLocalhost?: boolean;
	/** Allow private network IPs */
	allowPrivateNetwork?: boolean;
	/** Allowed protocols (default: ['http:', 'https:']) */
	allowedProtocols?: string[];
	/** Blocklisted domains */
	blocklist?: string[];
	/** Allowlisted domains (if set, only these are allowed) */
	allowlist?: string[];
}

/**
 * Script sanitization options
 */
export interface ScriptSanitizationOptions {
	/** Allow console access */
	allowConsole?: boolean;
	/** Allow network requests */
	allowNetwork?: boolean;
	/** Allow DOM manipulation */
	allowDomManipulation?: boolean;
	/** Maximum script length */
	maxLength?: number;
	/** Allowed function calls */
	allowedCalls?: string[];
}

/**
 * Permission check options
 */
export interface PermissionOptions {
	/** Require user consent for navigation */
	consentForNavigation?: boolean;
	/** Require user consent for scripts */
	consentForScripts?: boolean;
	/** Require user consent for screenshots */
	consentForScreenshots?: boolean;
	/** Maximum total operations per session */
	maxOperations?: number;
	/** Maximum operations per minute */
	rateLimit?: number;
}

/**
 * Permission state tracking
 */
interface PermissionState {
	/** Granted permissions */
	granted: Set<string>;
	/** Denied permissions */
	denied: Set<string>;
	/** Operation timestamps for rate limiting */
	operations: number[];
	/** Total operation count */
	totalOperations: number;
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Error thrown when URL validation fails
 */
export class UnsafeUrlError extends Error {
	constructor(url: string, reason: string) {
		super(`URL validation failed for "${url}": ${reason}`);
		this.name = 'UnsafeUrlError';
	}
}

/**
 * Error thrown when script is rejected
 */
export class ScriptRejectedError extends Error {
	constructor(reason: string) {
		super(`Script rejected: ${reason}`);
		this.name = 'ScriptRejectedError';
	}
}

/**
 * Error thrown when permission is denied
 */
export class PermissionDeniedError extends Error {
	constructor(action: string) {
		super(`Permission denied for action: ${action}`);
		this.name = 'PermissionDeniedError';
	}
}

// ============================================================================
// URL VALIDATOR
// ============================================================================

/**
 * URL validation and safety checking
 */
export class UrlValidator {
	private options: UrlValidationOptions;

	/** Known dangerous TLDs */
	private static readonly DANGEROUS_TLDS = new Set([
		'.xyz',
		'.top',
		'.zip',
		'.mov',
		'.tk',
		'.ml',
		'.ga',
		'.cf',
		'.gq',
	]);

	/** Known malicious patterns */
	private static readonly MALICIOUS_PATTERNS = [
		/\/login\?.*password/i,
		/\/account\?.*verify/i,
		/\/secure\?.*update/i,
		/bank.*login/i,
		/paypal.*signin/i,
		/apple.*id.*signin/i,
	];

	constructor(options: UrlValidationOptions = {}) {
		this.options = {
			allowLocalhost: true,
			allowPrivateNetwork: true,
			allowedProtocols: ['http:', 'https:'],
			blocklist: [],
			allowlist: [],
			...options,
		};
	}

	/**
	 * Validate a URL for safety
	 * @param urlString - URL string to validate
	 * @returns Safety check result
	 */
	validateUrl(urlString: string): SafetyCheckResult {
		try {
			const url = new URL(urlString);

			// Check protocol
			if (
				this.options.allowedProtocols &&
				!this.options.allowedProtocols.includes(url.protocol)
			) {
				return {
					passed: false,
					reason: `Protocol "${url.protocol}" is not allowed`,
					category: 'dangerous',
				};
			}

			// Check localhost
			if (!this.options.allowLocalhost && this.isLocalhost(url)) {
				return {
					passed: false,
					reason: 'Localhost URLs are not allowed',
					category: 'dangerous',
				};
			}

			// Check private network
			if (!this.options.allowPrivateNetwork && this.isPrivateNetwork(url)) {
				return {
					passed: false,
					reason: 'Private network URLs are not allowed',
					category: 'dangerous',
				};
			}

			// Check blocklist
			if (this.options.blocklist) {
				for (const blocked of this.options.blocklist) {
					if (
						url.hostname === blocked ||
						url.hostname.endsWith(`.${blocked}`)
					) {
						return {
							passed: false,
							reason: `Domain "${url.hostname}" is blocklisted`,
							category: 'dangerous',
						};
					}
				}
			}

			// Check allowlist (if set, only allowlisted domains pass)
			if (this.options.allowlist && this.options.allowlist.length > 0) {
				let allowed = false;
				for (const allowedDomain of this.options.allowlist) {
					if (
						url.hostname === allowedDomain ||
						url.hostname.endsWith(`.${allowedDomain}`)
					) {
						allowed = true;
						break;
					}
				}
				if (!allowed) {
					return {
						passed: false,
						reason: `Domain "${url.hostname}" is not in the allowlist`,
						category: 'permission',
					};
				}
			}

			// Check for dangerous TLDs
			const hostname = url.hostname.toLowerCase();
			for (const tld of Array.from(UrlValidator.DANGEROUS_TLDS)) {
				if (hostname.endsWith(tld)) {
					return {
						passed: false,
						reason: `TLD "${tld}" is commonly used for malicious sites`,
						category: 'dangerous',
					};
				}
			}

			// Check for malicious patterns
			for (const pattern of UrlValidator.MALICIOUS_PATTERNS) {
				if (pattern.test(url.href)) {
					return {
						passed: false,
						reason: 'URL matches known phishing pattern',
						category: 'phishing',
					};
				}
			}

			return {passed: true};
		} catch {
			return {
				passed: false,
				reason: 'Invalid URL format',
				category: 'dangerous',
			};
		}
	}

	/**
	 * Check if URL is localhost
	 * @param url - Parsed URL
	 * @returns true if localhost
	 */
	private isLocalhost(url: URL): boolean {
		const hostname = url.hostname.toLowerCase();
		return (
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '[::1]' ||
			hostname.startsWith('127.')
		);
	}

	/**
	 * Check if URL is private network
	 * @param url - Parsed URL
	 * @returns true if private network
	 */
	private isPrivateNetwork(url: URL): boolean {
		const hostname = url.hostname.toLowerCase();

		// Check for private IP ranges
		const privatePatterns = [
			/^10\./,
			/^172\.(1[6-9]|2\d|3[01])\./,
			/^192\.168\./,
			/^127\./,
			/^localhost$/i,
			/\.local$/i,
		];

		for (const pattern of privatePatterns) {
			if (pattern.test(hostname)) {
				return true;
			}
		}

		return false;
	}
}

// ============================================================================
// SCRIPT SANITIZER
// ============================================================================

/**
 * JavaScript code sanitization for safe execution
 */
export class ScriptSanitizer {
	private options: ScriptSanitizationOptions;

	/** Dangerous function calls that are blocked by default */
	private static readonly BLOCKED_CALLS = new Set([
		'eval',
		'Function',
		'fetch',
		'XMLHttpRequest',
		'WebSocket',
		'Worker',
		'importScripts',
		'localStorage',
		'sessionStorage',
		'indexedDB',
		'document.cookie',
		'document.write',
		'document.writeln',
	]);

	/** Dangerous patterns */
	private static readonly DANGEROUS_PATTERNS = [
		/\.prototype\./,
		/__proto__/,
		/constructor\[/,
		/\.\.\//,
		/data:text\/html/i,
		/atob\(/,
		/btoa\(/,
	];

	constructor(options: ScriptSanitizationOptions = {}) {
		this.options = {
			allowConsole: false,
			allowNetwork: false,
			allowDomManipulation: true,
			maxLength: 10000,
			allowedCalls: [],
			...options,
		};
	}

	/**
	 * Sanitize JavaScript code before execution
	 * @param script - JavaScript code to sanitize
	 * @returns Safety check result
	 */
	sanitizeScript(script: string): SafetyCheckResult {
		// Check length
		if (this.options.maxLength && script.length > this.options.maxLength) {
			return {
				passed: false,
				reason: `Script exceeds maximum length of ${this.options.maxLength} characters`,
				category: 'dangerous',
			};
		}

		// Check for dangerous patterns
		for (const pattern of ScriptSanitizer.DANGEROUS_PATTERNS) {
			if (pattern.test(script)) {
				return {
					passed: false,
					reason: `Script contains dangerous pattern: ${pattern.source}`,
					category: 'dangerous',
				};
			}
		}

		// Check console access
		if (!this.options.allowConsole && /console\./.test(script)) {
			return {
				passed: false,
				reason: 'Console access is not allowed',
				category: 'dangerous',
			};
		}

		// Check network calls
		if (!this.options.allowNetwork) {
			const networkPatterns = [
				/fetch\(/,
				/XMLHttpRequest/,
				/WebSocket\(/,
				/\.send\(/,
			];
			for (const pattern of networkPatterns) {
				if (pattern.test(script)) {
					return {
						passed: false,
						reason: 'Network requests are not allowed',
						category: 'dangerous',
					};
				}
			}
		}

		// Check for explicitly blocked calls
		for (const blocked of Array.from(ScriptSanitizer.BLOCKED_CALLS)) {
			if (new RegExp(`\\b${blocked}\\b`).test(script)) {
				// Skip if in allowed list
				if (!this.options.allowedCalls?.includes(blocked)) {
					return {
						passed: false,
						reason: `Function call "${blocked}" is not allowed`,
						category: 'dangerous',
					};
				}
			}
		}

		// Check DOM manipulation
		if (!this.options.allowDomManipulation) {
			const domPatterns = [
				/\.innerHTML\s*=/,
				/\.outerHTML\s*=/,
				/document\.write/,
				/document\.writeln/,
				/\.insertAdjacentHTML/,
			];
			for (const pattern of domPatterns) {
				if (pattern.test(script)) {
					return {
						passed: false,
						reason: 'DOM manipulation is not allowed',
						category: 'dangerous',
					};
				}
			}
		}

		return {passed: true};
	}

	/**
	 * Wrap script in try-catch for safer execution
	 * @param script - JavaScript code to wrap
	 * @returns Wrapped script
	 */
	wrapScript(script: string): string {
		return `
			(function() {
				try {
					${script}
				} catch (error) {
					return { error: error.message };
				}
			})()
		`;
	}
}

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

/**
 * Permission and consent management for browser operations
 */
export class PermissionChecker {
	private options: PermissionOptions;
	private state: PermissionState;

	constructor(options: PermissionOptions = {}) {
		this.options = {
			consentForNavigation: true,
			consentForScripts: true,
			consentForScreenshots: false,
			maxOperations: 1000,
			rateLimit: 60,
			...options,
		};

		this.state = {
			granted: new Set(),
			denied: new Set(),
			operations: [],
			totalOperations: 0,
		};
	}

	/**
	 * Check if permission is granted for an action
	 * @param action - Action to check permission for
	 * @returns Safety check result
	 */
	checkPermission(action: string): SafetyCheckResult {
		// Check if explicitly denied
		if (this.state.denied.has(action)) {
			return {
				passed: false,
				reason: `Permission for "${action}" was previously denied`,
				category: 'permission',
			};
		}

		// Check if previously granted
		if (this.state.granted.has(action)) {
			// Still need to check rate limits
			return this.checkRateLimit();
		}

		// Check if consent is required but not granted
		if (this.requiresConsent(action) && !this.state.granted.has(action)) {
			return {
				passed: false,
				reason: `User consent required for "${action}"`,
				category: 'permission',
			};
		}

		// Check rate limits
		return this.checkRateLimit();
	}

	/**
	 * Grant permission for an action
	 * @param action - Action to grant permission for
	 */
	grantPermission(action: string): void {
		this.state.granted.add(action);
		this.state.denied.delete(action);
	}

	/**
	 * Deny permission for an action
	 * @param action - Action to deny permission for
	 */
	denyPermission(action: string): void {
		this.state.denied.add(action);
		this.state.granted.delete(action);
	}

	/**
	 * Record an operation for rate limiting
	 */
	recordOperation(): void {
		const now = Date.now();
		this.state.operations.push(now);
		this.state.totalOperations++;

		// Clean up old operations (older than 1 minute)
		const oneMinuteAgo = now - 60000;
		this.state.operations = this.state.operations.filter(t => t > oneMinuteAgo);
	}

	/**
	 * Reset permission state
	 */
	reset(): void {
		this.state = {
			granted: new Set(),
			denied: new Set(),
			operations: [],
			totalOperations: 0,
		};
	}

	/**
	 * Get current permission state snapshot
	 * @returns Permission state
	 */
	getState(): {
		granted: string[];
		denied: string[];
		totalOperations: number;
		recentOperations: number;
	} {
		return {
			granted: Array.from(this.state.granted),
			denied: Array.from(this.state.denied),
			totalOperations: this.state.totalOperations,
			recentOperations: this.state.operations.length,
		};
	}

	/**
	 * Check if action requires explicit consent
	 * @param action - Action to check
	 * @returns true if consent is required
	 */
	private requiresConsent(action: string): boolean {
		switch (action) {
			case 'navigate':
				return this.options.consentForNavigation ?? true;
			case 'executeScript':
				return this.options.consentForScripts ?? true;
			case 'screenshot':
				return this.options.consentForScreenshots ?? false;
			default:
				return false;
		}
	}

	/**
	 * Check rate limits
	 * @returns Safety check result
	 */
	private checkRateLimit(): SafetyCheckResult {
		// Check total operations
		if (
			this.options.maxOperations &&
			this.state.totalOperations >= this.options.maxOperations
		) {
			return {
				passed: false,
				reason: `Maximum operation limit (${this.options.maxOperations}) reached`,
				category: 'permission',
			};
		}

		// Check rate limit (per minute)
		if (this.options.rateLimit) {
			const oneMinuteAgo = Date.now() - 60000;
			const recentOps = this.state.operations.filter(t => t > oneMinuteAgo);

			if (recentOps.length >= this.options.rateLimit) {
				return {
					passed: false,
					reason: `Rate limit exceeded (${recentOps.length}/${this.options.rateLimit} per minute)`,
					category: 'permission',
				};
			}
		}

		return {passed: true};
	}
}

// ============================================================================
// SAFETY MIDDLEWARE (COMPOSITE)
// ============================================================================

/**
 * Composite safety middleware combining all safety checks
 */
export class SafetyMiddleware {
	private urlValidator: UrlValidator;
	private scriptSanitizer: ScriptSanitizer;
	private permissionChecker: PermissionChecker;

	constructor(
		urlOptions?: UrlValidationOptions,
		scriptOptions?: ScriptSanitizationOptions,
		permissionOptions?: PermissionOptions,
	) {
		this.urlValidator = new UrlValidator(urlOptions);
		this.scriptSanitizer = new ScriptSanitizer(scriptOptions);
		this.permissionChecker = new PermissionChecker(permissionOptions);
	}

	/**
	 * Validate a URL before navigation
	 * @param url - URL to validate
	 * @returns Safety check result
	 */
	validateUrl(url: string): SafetyCheckResult {
		return this.urlValidator.validateUrl(url);
	}

	/**
	 * Sanitize a script before execution
	 * @param script - Script to sanitize
	 * @returns Safety check result
	 */
	sanitizeScript(script: string): SafetyCheckResult {
		return this.scriptSanitizer.sanitizeScript(script);
	}

	/**
	 * Check permission for an action
	 * @param action - Action to check
	 * @returns Safety check result
	 */
	checkPermission(action: string): SafetyCheckResult {
		return this.permissionChecker.checkPermission(action);
	}

	/**
	 * Record an operation
	 */
	recordOperation(): void {
		this.permissionChecker.recordOperation();
	}

	/**
	 * Grant permission for an action
	 * @param action - Action to grant
	 */
	grantPermission(action: string): void {
		this.permissionChecker.grantPermission(action);
	}

	/**
	 * Deny permission for an action
	 * @param action - Action to deny
	 */
	denyPermission(action: string): void {
		this.permissionChecker.denyPermission(action);
	}

	/**
	 * Reset all safety state
	 */
	reset(): void {
		this.permissionChecker.reset();
	}

	/**
	 * Get safety state snapshot
	 * @returns Current state
	 */
	getState() {
		return this.permissionChecker.getState();
	}
}
