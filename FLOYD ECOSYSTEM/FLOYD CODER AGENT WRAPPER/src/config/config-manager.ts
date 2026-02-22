/**
 * Config Manager
 *
 * Configuration management with environment variable support,
 * config file loading, and validation.
 *
 * @module config/config-manager
 */

import {readFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration options
 */
export interface Config {
	/** Anthropic API key */
	apiKey?: string;

	/** API base URL */
	apiBase?: string;

	/** Default model */
	model?: string;

	/** Maximum tokens per request */
	maxTokens?: number;

	/** Request timeout (ms) */
	timeout?: number;

	/** Execution mode */
	mode?: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit';

	/** Working directory */
	cwd?: string;

	/** Enable debug output */
	debug?: boolean;

	/** Enable verbose output */
	verbose?: boolean;

	/** Enable quiet mode (minimal output) */
	quiet?: boolean;

	/** Enable colored output */
	color?: boolean;

	/** Maximum turns */
	maxTurns?: number;

	/** Session ID */
	sessionId?: string;

	/** Custom system prompt */
	systemPrompt?: string;

	/** Enable/disable streaming */
	streaming?: boolean;

	/** Temperature */
	temperature?: number;

	/** Top P sampling */
	topP?: number;
}

/**
 * Config manager options
 */
export interface ConfigManagerOptions {
	/** Explicit config file path */
	configPath?: string;

	/** Working directory */
	cwd?: string;

	/** Environment variables map */
	env?: Record<string, string | undefined>;
}

// ============================================================================
// CONFIG MANAGER CLASS
// ============================================================================

/**
 * ConfigManager - Load and manage configuration
 *
 * Configuration priority (highest to lowest):
 * 1. Explicit configPath
 * 2. .floyd/config.json in cwd
 * 3. ~/.floyd/config.json
 * 4. Environment variables
 * 5. Default values
 */
export class ConfigManager {
	private readonly options: Required<Omit<ConfigManagerOptions, 'env'>> & {env: Record<string, string | undefined>};
	private config: Config | null = null;

	constructor(options: ConfigManagerOptions = {}) {
		this.options = {
			configPath: options.configPath ?? '',
			cwd: options.cwd ?? process.cwd(),
			env: options.env ?? process.env,
		};
	}

	/**
	 * Load configuration from all sources
	 */
	async load(): Promise<Config> {
		if (this.config) {
			return this.config;
		}

		// Start with defaults
		this.config = this.getDefaults();

		// Load from global config
		const globalConfig = this.loadGlobalConfig();
		if (globalConfig) {
			this.config = {...this.config, ...globalConfig};
		}

		// Load from project config
		const projectConfig = this.loadProjectConfig();
		if (projectConfig) {
			this.config = {...this.config, ...projectConfig};
		}

		// Load from explicit config path
		if (this.options.configPath) {
			const explicitConfig = this.loadConfigFile(this.options.configPath);
			if (explicitConfig) {
				this.config = {...this.config, ...explicitConfig};
			}
		}

		// Override with environment variables
		this.config = this.applyEnvVars(this.config);

		return this.config;
	}

	/**
	 * Get configuration without loading (returns defaults)
	 */
	getDefaults(): Config {
		return {
			model: 'claude-opus-4',
			maxTokens: 8192,
			timeout: 60000,
			mode: 'ask',
			cwd: this.options.cwd,
			debug: false,
			verbose: false,
			quiet: false,
			color: true,
			maxTurns: 20,
			streaming: true,
			temperature: 1.0,
			topP: 0.95,
		};
	}

	/**
	 * Get current config (loads if not loaded)
	 */
	get(): Config {
		if (!this.config) {
			return this.getDefaults();
		}
		return this.config;
	}

	/**
	 * Set a config value
	 */
	set(key: keyof Config, value: unknown): void {
		if (!this.config) {
			this.config = this.getDefaults();
		}
		this.config[key] = value as never;
	}

	/**
	 * Get API key from various sources
	 */
	getApiKey(): string | undefined {
		return this.options.env.ANTHROPIC_API_KEY ||
			this.options.env.FLOYD_API_KEY ||
			this.config?.apiKey;
	}

	/**
	 * Validate configuration
	 */
	validate(): {valid: boolean; errors: string[]} {
		const errors: string[] = [];

		if (!this.getApiKey()) {
			errors.push('API key not found. Set ANTHROPIC_API_KEY or FLOYD_API_KEY environment variable.');
		}

		const cwd = this.config?.cwd || this.options.cwd;
		if (cwd && !existsSync(cwd)) {
			errors.push(`Working directory does not exist: ${cwd}`);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	// -------------------------------------------------------------------------
	// PRIVATE METHODS
	// -------------------------------------------------------------------------

	/**
	 * Load global config from ~/.floyd/config.json
	 */
	private loadGlobalConfig(): Partial<Config> | null {
		const globalConfigPath = join(homedir(), '.floyd', 'config.json');
		return this.loadConfigFile(globalConfigPath);
	}

	/**
	 * Load project config from .floyd/config.json
	 */
	private loadProjectConfig(): Partial<Config> | null {
		const projectConfigPath = join(this.options.cwd, '.floyd', 'config.json');
		return this.loadConfigFile(projectConfigPath);
	}

	/**
	 * Load config from a specific file path
	 */
	private loadConfigFile(path: string): Partial<Config> | null {
		try {
			if (!existsSync(path)) {
				return null;
			}

			const content = readFileSync(path, 'utf-8');
			const parsed = JSON.parse(content) as Config;

			return parsed;
		} catch (error) {
			// Silently fail if config file is invalid
			return null;
		}
	}

	/**
	 * Apply environment variables to config
	 */
	private applyEnvVars(config: Config): Config {
		const env = this.options.env;

		return {
			...config,
			apiKey: env.ANTHROPIC_API_KEY || env.FLOYD_API_KEY || config.apiKey,
			apiBase: env.FLOYD_API_BASE || config.apiBase,
			model: env.FLOYD_MODEL || config.model,
			mode: (env.FLOYD_MODE as Config['mode']) || config.mode,
			cwd: env.FLOYD_CWD || config.cwd,
			debug: env.FLOYD_DEBUG === '1' || env.DEBUG === '1' || config.debug,
			verbose: env.FLOYD_VERBOSE === '1' || config.verbose,
			quiet: env.FLOYD_QUIET === '1' || config.quiet,
			color: env.FLOYD_NO_COLOR === '1' ? false : config.color,
		};
	}
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

let defaultManager: ConfigManager | null = null;

/**
 * Get or create the default config manager
 */
export function getConfigManager(options?: ConfigManagerOptions): ConfigManager {
	if (!defaultManager) {
		defaultManager = new ConfigManager(options);
	}
	return defaultManager;
}

/**
 * Reset the default config manager
 */
export function resetConfigManager(): void {
	defaultManager = null;
}

export default ConfigManager;
