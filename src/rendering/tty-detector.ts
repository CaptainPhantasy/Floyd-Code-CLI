/**
 * TTY Detector - Terminal Capability Detection
 *
 * Detects terminal capabilities for adaptive rendering.
 * Provides information about color support, Unicode, and terminal features.
 *
 * Features:
 * - Color support detection (16, 256, truecolor)
 * - Unicode/emoji support detection
 * - Terminal size detection
 * - Capability flags
 * - Terminal type identification
 */

import {platform} from 'os';

// ============================================================================
// TYPES
// ============================================================================

export interface TerminalCapabilities {
	/** Number of supported colors (0, 16, 256, 16777216) */
	colors: number;

	/** True if terminal supports truecolor (24-bit) */
	truecolor: boolean;

	/** True if terminal supports Unicode */
	unicode: boolean;

	/** True if terminal supports emoji */
	emoji: boolean;

	/** Terminal width in columns */
	width: number;

	/** Terminal height in rows */
	height: number;

	/** Detected terminal type */
	type: TerminalType;

	/** True if running in a browser/CI environment */
	isBrowser: boolean;

	/** True if running in CI */
	isCI: boolean;

	/** Environment name */
	env: string;
}

export type TerminalType =
	| 'unknown'
	| 'kitty'
	| 'iterm'
	| 'terminal-app'
	| 'alacritty'
	| 'gnome-terminal'
	| 'konsole'
	| 'xfce-terminal'
	| 'vscode'
	| 'jetbrains'
	| 'tmux'
	| 'screen'
	| 'wsl'
	| 'windows-terminal'
	| 'powershell'
	| 'cmd'
	| 'emacs'
	| 'vim'
	| 'less'
	| 'lynx';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Get terminal type from environment variables
 */
function detectTerminalType(): TerminalType {
	const env = process.env;

	// Check TERM_PROGRAM
	const termProgram = env['TERM_PROGRAM']?.toLowerCase();
	if (termProgram) {
		if (termProgram.includes('vscode')) return 'vscode';
		if (termProgram.includes('iterm')) return 'iterm';
		if (termProgram.includes('apple')) return 'terminal-app';
		if (termProgram.includes('vim')) return 'vim';
		if (termProgram.includes('emacs')) return 'emacs';
	}

	// Check TERM variable
	const term = env['TERM']?.toLowerCase();
	if (term) {
		if (term.includes('screen')) return 'screen';
		if (term.includes('tmux')) return 'tmux';
		if (term.includes('xterm-kitty')) return 'kitty';
		if (term.includes('alacritty')) return 'alacritty';
		if (env['WSL_DISTRO_NAME']) return 'wsl';
	}

	// Check WT_SESSION for Windows Terminal
	if (env['WT_SESSION']) return 'windows-terminal';

	// Check specific program variables
	if (env['VSCODE_PID']) return 'vscode';
	if (env['TELEMETRY_ID']?.includes('JetBrains')) return 'jetbrains';
	if (env['ISSH']) return 'iterm'; // SSH often from iTerm

	// Check platform-specific defaults
	if (platform() === 'win32') {
		if (env['PSModulePath']) return 'powershell';
		return 'cmd';
	}

	return 'unknown';
}

/**
 * Detect if running in CI environment
 */
function detectCI(): boolean {
	const env = process.env;

	const ciVars = [
		'CI',
		'CONTINUOUS_INTEGRATION',
		'BUILD_NUMBER',
		'RUN_ID',
		'GITHUB_ACTIONS',
		'GITLAB_CI',
		'TRAVIS',
		'CIRCLECI',
		'APPVEYOR',
		'JENKINS_URL',
		'CODEBUILD_BUILD_ID',
	];

	return ciVars.some(v => env[v] !== undefined);
}

/**
 * Detect color support level
 */
function detectColorSupport(): number {
	const env = process.env;

	// Explicitly disabled
	if (env['NO_COLOR']) {
		return 0;
	}

	// Forced color level
	const forceColor = env['FORCE_COLOR'];
	if (forceColor !== undefined) {
		const level = Number.parseInt(forceColor, 10);
		if (forceColor === '0') return 0;
		if (forceColor === '1' || forceColor === '') return 16;
		if (level >= 3 || forceColor === 'truecolor' || forceColor === '24bit')
			return 16777216;
		if (level === 2) return 256;
		return 16;
	}

	// Check COLORTERM for truecolor
	const colorterm = env['COLORTERM']?.toLowerCase();
	if (colorterm?.includes('truecolor') || colorterm?.includes('24bit')) {
		return 16777216;
	}

	// Check terminal type capabilities
	const term = env['TERM']?.toLowerCase();
	if (term) {
		// Modern terminals support 256 colors
		if (term.includes('256color') || term.includes('xterm-256color')) {
			return 256;
		}
	}

	// Default to 16 colors for TTY
	if (process.stdout.isTTY) {
		return 16;
	}

	return 0;
}

/**
 * Detect Unicode support
 */
function detectUnicode(): boolean {
	const env = process.env;

	// Explicitly disabled
	if (env['LC_ALL'] === 'C' || env['LC_CTYPE'] === 'C' || env['LANG'] === 'C') {
		return false;
	}

	// Check locale
	const locale = env['LC_ALL'] || env['LC_CTYPE'] || env['LANG'] || '';
	const hasUTF8 =
		locale.includes('UTF-8') ||
		locale.includes('utf-8') ||
		locale.includes('utf8');

	return hasUTF8 || process.stdout.isTTY;
}

/**
 * Detect emoji support
 */
function detectEmoji(): boolean {
	// Emoji requires both Unicode and a capable terminal
	return detectUnicode() && process.stdout.isTTY;
}

/**
 * Get terminal size
 */
function getTerminalSize(): {width: number; height: number} {
	const defaultSize = {width: 80, height: 24};

	// Try to get from stdout
	if (process.stdout.columns && process.stdout.rows) {
		return {
			width: process.stdout.columns,
			height: process.stdout.rows,
		};
	}

	// Try environment variables
	const env = process.env;
	const cols = Number.parseInt(env['COLUMNS'] ?? '', 10);
	const rows = Number.parseInt(env['LINES'] ?? '', 10);

	if (!Number.isNaN(cols) && !Number.isNaN(rows)) {
		return {width: cols, height: rows};
	}

	return defaultSize;
}

/**
 * Detect if running in browser
 */
function detectBrowser(): boolean {
	return (
		typeof process?.versions?.['electron'] !== 'undefined' ||
		typeof window !== 'undefined'
	);
}

/**
 * Get environment name
 */
function detectEnvironment(): string {
	if (detectCI()) return 'ci';
	if (detectBrowser()) return 'browser';
	if (process.env['TMUX']) return 'tmux';
	if (process.env['SSH_CONNECTION'] || process.env['SSH_CLIENT']) return 'ssh';
	if (process.stdout.isTTY) return 'terminal';
	return 'unknown';
}

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Get terminal capabilities
 */
export function getCapabilities(): TerminalCapabilities {
	return {
		colors: detectColorSupport(),
		truecolor: detectColorSupport() === 16777216,
		unicode: detectUnicode(),
		emoji: detectEmoji(),
		width: getTerminalSize().width,
		height: getTerminalSize().height,
		type: detectTerminalType(),
		isBrowser: detectBrowser(),
		isCI: detectCI(),
		env: detectEnvironment(),
	};
}

/**
 * Quick TTY detection
 */
export function isTTY(): boolean {
	return process.stdout.isTTY;
}

/**
 * Check if terminal supports color
 */
export function supportsColor(): boolean {
	return detectColorSupport() > 0;
}

/**
 * Check if terminal supports truecolor
 */
export function supportsTruecolor(): boolean {
	return detectColorSupport() === 16777216;
}

/**
 * Check if terminal supports Unicode
 */
export function supportsUnicode(): boolean {
	return detectUnicode();
}

/**
 * Check if terminal supports emoji
 */
export function supportsEmoji(): boolean {
	return detectEmoji();
}

/**
 * Get terminal size
 */
export function getTerminalSizeSync(): {width: number; height: number} {
	return getTerminalSize();
}

/**
 * Check if running in CI
 */
export function isCI(): boolean {
	return detectCI();
}

/**
 * Check if running in a browser environment
 */
export function isBrowser(): boolean {
	return detectBrowser();
}

/**
 * Get the detected terminal type
 */
export function getTerminalType(): TerminalType {
	return detectTerminalType();
}

/**
 * Detect if terminal supports background colors
 */
export function supportsBackgroundColors(): boolean {
	const colors = detectColorSupport();
	return colors >= 16;
}

/**
 * Detect if terminal supports underline
 */
export function supportsUnderline(): boolean {
	// Most modern terminals support underline
	return process.stdout.isTTY;
}

/**
 * Detect if terminal supports bold
 */
export function supportsBold(): boolean {
	// Most modern terminals support bold
	return process.stdout.isTTY;
}

/**
 * Detect if terminal supports italic
 */
export function supportsItalic(): boolean {
	const term = process.env['TERM']?.toLowerCase();
	// iTerm2 and some others support italic
	return term?.includes('iterm') || term?.includes('xterm') || false;
}

/**
 * Detect if terminal supports strikethrough
 */
export function supportsStrikethrough(): boolean {
	// Few terminals support this, but we'll assume yes for modern terminals
	return process.stdout.isTTY;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamp a value to terminal width
 */
export function clampToWidth(value: number, min = 10, max?: number): number {
	const maxWidth = max ?? getTerminalSize().width;
	return Math.max(min, Math.min(value, maxWidth));
}

/**
 * Clamp a value to terminal height
 */
export function clampToHeight(value: number, min = 5, max?: number): number {
	const maxHeight = max ?? getTerminalSize().height;
	return Math.max(min, Math.min(value, maxHeight));
}

/**
 * Check if we should use Unicode box drawing characters
 */
export function useUnicodeBorders(): boolean {
	return supportsUnicode() && !detectCI();
}

/**
 * Get appropriate fallback characters for rendering
 */
export function getFallbackChars() {
	const unicode = supportsUnicode();

	return {
		// Borders
		horizontal: unicode ? '' : '-',
		vertical: unicode ? '' : '|',
		topLeft: unicode ? '' : '+',
		topRight: unicode ? '' : '+',
		bottomLeft: unicode ? '' : '+',
		bottomRight: unicode ? '' : '+',

		// UI elements
		bullet: unicode ? '' : '*',
		check: unicode ? '' : 'v',
		cross: unicode ? '' : 'x',
		arrow: unicode ? '->' : '->',
		ellipsis: unicode ? '' : '...',

		// Spinners
		spinnerDots: unicode
			? ['', '', '', '', '', '', '', '', '', '']
			: ['-', '\\', '|', '/'],
	};
}

/**
 * Get recommended rendering mode based on capabilities
 */
export type RenderMode = 'full' | 'basic' | 'minimal';

export function getRenderMode(): RenderMode {
	const caps = getCapabilities();

	if (!caps.colors) {
		return 'minimal';
	}

	if (caps.colors < 256 || !caps.unicode) {
		return 'basic';
	}

	return 'full';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
	getCapabilities,
	isTTY,
	supportsColor,
	supportsTruecolor,
	supportsUnicode,
	supportsEmoji,
	getTerminalSize: getTerminalSizeSync,
	isCI,
	isBrowser,
	getTerminalType,
	supportsBackgroundColors,
	supportsUnderline,
	supportsBold,
	supportsItalic,
	supportsStrikethrough,
	clampToWidth,
	clampToHeight,
	useUnicodeBorders,
	getFallbackChars,
	getRenderMode,
};
