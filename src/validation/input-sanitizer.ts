/**
 * Input Sanitizer
 *
 * Purpose: Clean and validate user input to prevent security issues
 * Exports: InputSanitizer class, sanitizePath, sanitizeShellCommand, sanitizeHtml
 * Related: schema-validator.ts, security/audit-logger.ts
 */

import path from 'path';
import os from 'os';

/**
 * Sanitization result type
 */
export interface SanitizationResult {
	safe: boolean;
	value: string;
	warnings: string[];
}

/**
 * Dangerous shell character patterns that could lead to command injection
 */
const DANGEROUS_SHELL_PATTERNS = [
	/;\s*\w/, // Command chaining with semicolon
	/\|\|?\s*\w/, // Pipes
	/&\&?\s*\w/, // Background execution and logical AND
	/\$\([^)]+\)/, // Command substitution $(...)
	/`[^`]+`/, // Command substitution with backticks
	/\${[^}]+}/, // Variable expansion with braces
	/\$[({]/, // Start of dangerous expansion
	/>[>|]?\s*\w/, // Output redirection
	/<\s*\w/, // Input redirection
	/\n\r/, // Newlines in commands
	/\x00/, // Null bytes
];

/**
 * Dangerous HTML/HTML tag patterns
 */
const DANGEROUS_HTML_PATTERNS = [
	/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
	/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
	/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
	/<embed\b[^>]*>/gi,
	/on\w+\s*=/gi, // Event handlers like onclick, onerror
	/javascript:/gi,
	/data:\s*(?!image\/)/gi, // data: URLs except images
	/<\?php/, // PHP tags
	/<%[\s\S]*%>/, // ASP-style tags
];

/**
 * HTML entity map for escaping
 */
const HTML_ENTITY_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;',
};

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
	/\.\.[/\\]/, // Parent directory references
	/~[^/\\]*[/\\]/, // Home directory with other paths
	/[\\/]\.[\\/]/, // Current directory references in middle of path
	/\0/, // Null bytes
];

/**
 * InputSanitizer provides cleaning and validation of user input
 *
 * Features:
 * - File path sanitization (prevent path traversal)
 * - Shell command sanitization (prevent command injection)
 * - HTML sanitization (prevent XSS)
 * - Input validation with detailed warnings
 */
export class InputSanitizer {
	private static readonly maxPathLength = 4096;
	private static readonly maxCommandLength = 10000;
	private static readonly maxHtmlLength = 100_000;

	/**
	 * Sanitize a file path to prevent path traversal attacks
	 *
	 * @param inputPath - Path to sanitize
	 * @param basePath - Base directory to resolve against (default: current working directory)
	 * @returns SanitizationResult with safe path
	 */
	static sanitizePath(
		inputPath: string,
		basePath: string = process.cwd(),
	): SanitizationResult {
		const warnings: string[] = [];

		// Check for null bytes
		if (inputPath.includes('\0')) {
			return {
				safe: false,
				value: '',
				warnings: ['Null bytes detected in path'],
			};
		}

		// Trim whitespace
		const trimmed = inputPath.trim();

		// Check length
		if (trimmed.length > this.maxPathLength) {
			return {
				safe: false,
				value: '',
				warnings: [`Path exceeds maximum length of ${this.maxPathLength}`],
			};
		}

		// Check for empty path
		if (trimmed.length === 0) {
			return {
				safe: false,
				value: '',
				warnings: ['Empty path provided'],
			};
		}

		// Check for dangerous patterns
		for (const pattern of PATH_TRAVERSAL_PATTERNS) {
			if (pattern.test(trimmed)) {
				warnings.push(
					`Potentially dangerous path pattern detected: ${pattern.source}`,
				);
			}
		}

		// Expand home directory if present
		let expanded = trimmed;
		if (expanded.startsWith('~') || expanded.startsWith('~')) {
			const homeDir = os.homedir();
			if (expanded.startsWith('~/')) {
				expanded = path.join(homeDir, expanded.slice(2));
			} else if (expanded === '~') {
				expanded = homeDir;
			} else {
				// ~username pattern - not supported for security
				warnings.push('Tilde expansion for other users not supported');
			}
		}

		// Resolve the path
		let resolved: string;
		try {
			if (path.isAbsolute(expanded)) {
				resolved = path.normalize(expanded);
			} else {
				resolved = path.normalize(path.join(basePath, expanded));
			}
		} catch {
			return {
				safe: false,
				value: '',
				warnings: ['Failed to resolve path'],
			};
		}

		// Verify the resolved path is within allowed bounds
		// For now, we warn but allow paths that might traverse outside
		// In production, you might want to restrict to specific directories
		const resolvedAbsolute = path.resolve(resolved);
		const baseAbsolute = path.resolve(basePath);

		if (!resolvedAbsolute.startsWith(baseAbsolute)) {
			warnings.push(
				'Path resolves outside of base directory - ensure this is intended',
			);
		}

		// Check for suspicious file extensions (optional, for upload scenarios)
		const suspiciousExtensions = [
			'.exe',
			'.bat',
			'.cmd',
			'.sh',
			'.ps1',
			'.dll',
			'.so',
			'.dylib',
		];
		const ext = path.extname(resolved).toLowerCase();
		if (suspiciousExtensions.includes(ext)) {
			warnings.push(`File has executable extension: ${ext}`);
		}

		return {
			safe: warnings.length === 0,
			value: resolved,
			warnings,
		};
	}

	/**
	 * Sanitize a shell command to prevent command injection
	 *
	 * @param command - Command string to sanitize
	 * @returns SanitizationResult with safe command or rejection
	 */
	static sanitizeShellCommand(command: string): SanitizationResult {
		const warnings: string[] = [];

		// Check for null bytes
		if (command.includes('\0')) {
			return {
				safe: false,
				value: '',
				warnings: ['Null bytes detected in command'],
			};
		}

		// Trim whitespace
		const trimmed = command.trim();

		// Check length
		if (trimmed.length > this.maxCommandLength) {
			return {
				safe: false,
				value: '',
				warnings: [
					`Command exceeds maximum length of ${this.maxCommandLength}`,
				],
			};
		}

		// Check for empty command
		if (trimmed.length === 0) {
			return {
				safe: false,
				value: '',
				warnings: ['Empty command provided'],
			};
		}

		// Check for dangerous patterns
		const dangerous: string[] = [];
		for (const pattern of DANGEROUS_SHELL_PATTERNS) {
			const matches = trimmed.match(pattern);
			if (matches) {
				dangerous.push(matches[0]);
			}
		}

		if (dangerous.length > 0) {
			return {
				safe: false,
				value: '',
				warnings: [
					`Dangerous shell patterns detected: ${dangerous.join(', ')}`,
					'Command chaining, pipes, and command substitution are not allowed',
				],
			};
		}

		// Check for commands that should be blocked
		const blockedCommands = [
			'rm ',
			'del ',
			'format',
			'fdisk',
			'mkfs',
			' shutdown',
			' reboot',
			' init 0',
			' init 6',
			' halt',
			' poweroff',
			':(){:|:&};:', // Fork bomb
			'chmod 777',
			'chown',
			'wget ', // Potential download
			'curl ', // Potential download
			'nc -l', // Netcat listener
		];

		const commandLower = trimmed.toLowerCase();
		for (const blocked of blockedCommands) {
			if (commandLower.includes(blocked)) {
				warnings.push(
					`Command contains potentially harmful: ${blocked.trim()}`,
				);
			}
		}

		// Allow only "safe" characters for basic commands
		// This is conservative - adjust based on your use case
		// Allow: alphanumeric, spaces, dots, dashes, underscores, slashes, colons, at signs, equals
		const safePattern = /^[a-zA-Z0-9\s._\-/:@=,$%+]+$/;
		if (!safePattern.test(trimmed)) {
			warnings.push('Command contains special characters that may be unsafe');
		}

		return {
			safe: warnings.length === 0,
			value: trimmed,
			warnings,
		};
	}

	/**
	 * Sanitize HTML content to prevent XSS attacks
	 *
	 * @param html - HTML string to sanitize
	 * @param options - Sanitization options
	 * @returns SanitizationResult with safe HTML
	 */
	static sanitizeHtml(
		html: string,
		options: {
			allowTags?: string[];
			stripAllTags?: boolean;
			maxLength?: number;
		} = {},
	): SanitizationResult {
		const warnings: string[] = [];
		const {
			allowTags = [],
			stripAllTags = false,
			maxLength = this.maxHtmlLength,
		} = options;

		// Check for null bytes
		if (html.includes('\0')) {
			return {
				safe: false,
				value: '',
				warnings: ['Null bytes detected in HTML'],
			};
		}

		// Check length
		if (html.length > maxLength) {
			return {
				safe: false,
				value: '',
				warnings: [`HTML exceeds maximum length of ${maxLength}`],
			};
		}

		let sanitized = html;

		// Check for dangerous patterns first
		for (const pattern of DANGEROUS_HTML_PATTERNS) {
			const matches = sanitized.match(pattern);
			if (matches) {
				warnings.push(
					`Dangerous HTML pattern detected: ${matches[0].substring(0, 50)}`,
				);
			}
		}

		// Remove dangerous tags completely
		sanitized = sanitized.replace(
			/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			'',
		);
		sanitized = sanitized.replace(
			/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
			'',
		);
		sanitized = sanitized.replace(
			/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
			'',
		);
		sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
		sanitized = sanitized.replace(/<\?php[\s\S]*?\?>/gi, '');
		sanitized = sanitized.replace(/<%[\s\S]*?%>/gi, '');

		// Remove event handlers (onclick, onerror, etc.)
		sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
		sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

		// Remove javascript: and data: URLs (except images)
		sanitized = sanitized.replace(/javascript:/gi, '');
		sanitized = sanitized.replace(/data:(?!image\/)/gi, 'data-blocked:');

		if (stripAllTags) {
			// Strip all HTML tags
			sanitized = sanitized.replace(/<[^>]+>/g, '');
		} else if (allowTags.length > 0) {
			// Keep only allowed tags
			const allowedPattern = new RegExp(
				`<(?!\\/?(${allowTags.join('|')})\\b)[^>]+>`,
				'gi',
			);
			sanitized = sanitized.replace(allowedPattern, '');
		} else {
			// Escape HTML entities for complete safety
			sanitized = sanitized.replace(
				/[&<>"'`=/]/g,
				char => HTML_ENTITY_MAP[char] || char,
			);
		}

		// Additional checks
		if (sanitized.includes('<') && !stripAllTags && allowTags.length === 0) {
			warnings.push('HTML content may contain unescaped tags');
		}

		return {
			safe: warnings.length === 0,
			value: sanitized,
			warnings,
		};
	}

	/**
	 * Sanitize a generic string input
	 *
	 * @param input - String to sanitize
	 * @param options - Options for sanitization
	 * @returns SanitizationResult
	 */
	static sanitizeString(
		input: string,
		options: {
			maxLength?: number;
			allowHtml?: boolean;
			trim?: boolean;
			removeControlChars?: boolean;
		} = {},
	): SanitizationResult {
		const warnings: string[] = [];
		const {
			maxLength = 10_000,
			allowHtml = false,
			trim = true,
			removeControlChars = true,
		} = options;

		let result = input;

		// Check for null bytes
		if (result.includes('\0')) {
			return {
				safe: false,
				value: '',
				warnings: ['Null bytes detected'],
			};
		}

		// Trim if requested
		if (trim) {
			result = result.trim();
		}

		// Remove control characters except newlines and tabs
		if (removeControlChars) {
			result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
		}

		// Check length
		if (result.length > maxLength) {
			warnings.push(
				`Input truncated from ${result.length} to ${maxLength} characters`,
			);
			result = result.substring(0, maxLength);
		}

		// Check for HTML if not allowed
		if (!allowHtml && result.includes('<')) {
			warnings.push('Input contains HTML characters');
			// Escape HTML entities
			result = result.replace(
				/[&<>"'`=/]/g,
				char => HTML_ENTITY_MAP[char] || char,
			);
		}

		return {
			safe: warnings.length === 0,
			value: result,
			warnings,
		};
	}

	/**
	 * Validate and sanitize a URL
	 *
	 * @param url - URL to validate
	 * @param options - Validation options
	 * @returns SanitizationResult
	 */
	static sanitizeUrl(
		url: string,
		options: {
			allowedProtocols?: string[];
			allowLocal?: boolean;
		} = {},
	): SanitizationResult {
		const warnings: string[] = [];
		const {
			allowedProtocols = ['http:', 'https:', 'file:'],
			allowLocal = false,
		} = options;

		try {
			const parsed = new URL(url);

			// Check protocol
			if (!allowedProtocols.includes(parsed.protocol)) {
				warnings.push(`Protocol '${parsed.protocol}' is not in allowed list`);
			}

			// Check for local addresses if not allowed
			if (!allowLocal) {
				const hostname = parsed.hostname.toLowerCase();
				if (
					hostname === 'localhost' ||
					hostname.startsWith('127.') ||
					hostname.startsWith('192.168.') ||
					hostname.startsWith('10.') ||
					hostname.startsWith('172.16.') ||
					hostname === '::1'
				) {
					warnings.push('Local addresses are not allowed');
				}
			}

			return {
				safe: warnings.length === 0,
				value: parsed.href,
				warnings,
			};
		} catch {
			return {
				safe: false,
				value: '',
				warnings: ['Invalid URL format'],
			};
		}
	}
}

/**
 * Convenience function to sanitize a file path
 *
 * @param inputPath - Path to sanitize
 * @param basePath - Base directory for relative paths
 * @returns Sanitized path
 */
export function sanitizePath(inputPath: string, basePath?: string): string {
	const result = InputSanitizer.sanitizePath(inputPath, basePath);
	return result.value;
}

/**
 * Convenience function to sanitize a shell command
 *
 * @param command - Command to sanitize
 * @returns Sanitized command
 */
export function sanitizeShellCommand(command: string): string {
	const result = InputSanitizer.sanitizeShellCommand(command);
	return result.value;
}

/**
 * Convenience function to sanitize HTML
 *
 * @param html - HTML to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML
 */
export function sanitizeHtml(
	html: string,
	options?: Parameters<typeof InputSanitizer.sanitizeHtml>[1],
): string {
	const result = InputSanitizer.sanitizeHtml(html, options);
	return result.value;
}
