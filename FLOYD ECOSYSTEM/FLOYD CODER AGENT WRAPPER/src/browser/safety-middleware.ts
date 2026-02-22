/**
 * Safety Middleware
 *
 * Security checks and validation for browser automation.
 * Prevents dangerous operations and validates URLs.
 *
 * @module browser/safety-middleware
 */

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Error for unsafe URLs
 */
export class UnsafeUrlError extends Error {
	constructor(url: string, reason: string) {
		super(`Unsafe URL: ${url} (${reason})`);
		this.name = 'UnsafeUrlError';
	}
}

/**
 * Error for rejected scripts
 */
export class ScriptRejectedError extends Error {
	constructor(script: string, reason: string) {
		super(`Script rejected: ${reason}`);
		this.name = 'ScriptRejectedError';
	}
}

/**
 * Error for permission denied
 */
export class PermissionDeniedError extends Error {
	constructor(action: string) {
		super(`Permission denied: ${action}`);
		this.name = 'PermissionDeniedError';
	}
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Safety configuration
 */
export interface SafetyConfig {
	/** Allowed URL patterns */
	allowedUrlPatterns?: RegExp[];

	/** Denied URL patterns */
	deniedUrlPatterns?: RegExp[];

	/** Allow file:// URLs */
	allowFileUrls?: boolean;

	/** Allow data URLs */
	allowDataUrls?: boolean;

	/** Allow JavaScript execution */
	allowJavaScript?: boolean;

	/** Maximum page size (bytes) */
	maxPageSize?: number;

	/** Request timeout (ms) */
	requestTimeout?: number;
}

/**
 * Safety check result
 */
export interface SafetyResult {
	/** Whether the operation is allowed */
	allowed: boolean;

	/** Reason if not allowed */
	reason?: string;

	/** Warnings */
	warnings: string[];
}

// ============================================================================
// SAFETY MIDDLEWARE CLASS
// ============================================================================

/**
 * SafetyMiddleware - Security validation for browser operations
 */
export class SafetyMiddleware {
	private readonly config: Required<SafetyConfig>;

	constructor(config: SafetyConfig = {}) {
		this.config = {
			allowedUrlPatterns: config.allowedUrlPatterns ?? [
				/^https?:\/\//, // HTTP/HTTPS
			],
			deniedUrlPatterns: config.deniedUrlPatterns ?? [
				/^file:/, // file:// URLs
				/^data:/, // data: URLs
				/^ftp:/, // FTP
				/^javascript:/, // JavaScript URLs
			],
			allowFileUrls: config.allowFileUrls ?? false,
			allowDataUrls: config.allowDataUrls ?? false,
			allowJavaScript: config.allowJavaScript ?? true,
			maxPageSize: config.maxPageSize ?? 10 * 1024 * 1024, // 10MB
			requestTimeout: config.requestTimeout ?? 30000, // 30s
		};
	}

	/**
	 * Check if a URL is safe to navigate to
	 */
	checkUrl(url: string): SafetyResult {
		const warnings: string[] = [];

		// Check denied patterns first
		for (const pattern of this.config.deniedUrlPatterns) {
			if (pattern.test(url)) {
				let reason = 'URL matches denied pattern';

				if (pattern.source.includes('file:') && !this.config.allowFileUrls) {
					reason = 'file:// URLs are not allowed';
				} else if (pattern.source.includes('data:') && !this.config.allowDataUrls) {
					reason = 'data: URLs are not allowed';
				}

				return {
					allowed: false,
					reason,
					warnings,
				};
			}
		}

		// Check if URL matches allowed patterns
		let allowed = false;
		for (const pattern of this.config.allowedUrlPatterns) {
			if (pattern.test(url)) {
				allowed = true;
				break;
			}
		}

		if (!allowed) {
			return {
				allowed: false,
				reason: 'URL does not match any allowed pattern',
				warnings,
			};
		}

		// Warnings for potentially risky URLs
		if (url.includes('localhost') || url.includes('127.0.0.1')) {
			warnings.push('Navigating to localhost may expose local services');
		}

		return {allowed: true, warnings};
	}

	/**
	 * Validate script before execution
	 */
	checkScript(script: string): SafetyResult {
		const warnings: string[] = [];

		if (!this.config.allowJavaScript) {
			return {
				allowed: false,
				reason: 'JavaScript execution is disabled',
				warnings,
			};
		}

		// Check for dangerous patterns
		const dangerousPatterns = [
			/eval\s*\(/,
			/new\s+Function\s*\(/,
			/document\.write\s*\(/,
			/\.innerHTML\s*=/,
			/\.outerHTML\s*=/,
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(script)) {
				warnings.push(`Script contains potentially dangerous pattern: ${pattern.source}`);
			}
		}

		// Check script length
		if (script.length > 10000) {
			warnings.push('Script is very long, may cause performance issues');
		}

		return {
			allowed: true,
			warnings,
		};
	}

	/**
	 * Validate file download
	 */
	checkDownload(url: string, filename: string): SafetyResult {
		const warnings: string[] = [];

		// Check URL safety first
		const urlCheck = this.checkUrl(url);
		if (!urlCheck.allowed) {
			return urlCheck;
		}

		// Check filename
		const dangerousExtensions = [
			'.exe',
			'.bat',
			'.cmd',
			'.sh',
			'.ps1',
			'.app',
			'.dmg',
			'.deb',
			'.rpm',
		];

		const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
		if (dangerousExtensions.includes(ext)) {
			warnings.push(`Downloading executable file: ${ext}`);
		}

		return {
			allowed: true,
			warnings,
		};
	}

	/**
	 * Get current configuration
	 */
	getConfig(): SafetyConfig {
		return {...this.config};
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

let defaultMiddleware: SafetyMiddleware | null = null;

/**
 * Get or create the default safety middleware
 */
export function getSafetyMiddleware(config?: SafetyConfig): SafetyMiddleware {
	if (!defaultMiddleware) {
		defaultMiddleware = new SafetyMiddleware(config);
	}
	return defaultMiddleware;
}

export default SafetyMiddleware;
