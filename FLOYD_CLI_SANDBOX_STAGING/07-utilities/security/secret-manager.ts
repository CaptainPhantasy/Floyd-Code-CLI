/**
 * Secret Manager
 *
 * Purpose: API key and secret management with secure storage
 * Exports: SecretManager, getApiKey, storeApiKey, hasApiKey
 * Related: api-key-manager.ts
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * Supported API key sources (priority order)
 */
enum KeySource {
	EnvVar = 'environment',
	ConfigFile = 'config_file',
	Keychain = 'keychain', // Future: keytar integration
}

/**
 * API key storage location
 */
const FLOYD_DIR = path.join(os.homedir(), '.floyd');
const KEYS_FILE = path.join(FLOYD_DIR, 'keys.json');
const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

/**
 * Supported API key environment variables (in priority order)
 */
const ENV_VAR_PRIORITY = [
	'ANTHROPIC_AUTH_TOKEN',
	'GLM_API_KEY',
	'ZHIPU_API_KEY',
	'ANTHROPIC_API_KEY',
	'OPENAI_API_KEY',
];

/**
 * Key metadata for tracking
 */
interface KeyMetadata {
	source: KeySource;
	timestamp: number;
	keyId: string; // Hash of key for identification (not the key itself)
}

/**
 * Stored keys structure
 */
interface StoredKeys {
	[key: string]: string; // Service name -> encrypted key
}

/**
 * SecretManager handles secure storage and retrieval of API keys
 *
 * Features:
 * - Environment variable discovery with priority ordering
 * - File-based storage with encryption
 * - Key validation
 * - Secure key identification (hash-based)
 */
export class SecretManager {
	private static algorithm = 'aes-256-gcm';
	private static keyLength = 32;
	private static ivLength = 16;
	// private static saltLength = 64; // Reserved for future key rotation
	private static tagLength = 16;

	/**
	 * Derive an encryption key from the machine ID
	 *
	 * Uses machine-specific data to create a unique key per installation
	 */
	private static deriveKey(): Buffer {
		// Create a machine-specific salt
		const machineId = [
			os.hostname(),
			os.platform(),
			os.arch(),
			os.userInfo().username,
		].join('|');

		const salt = crypto.createHash('sha256').update(machineId).digest();

		// Use a pepper value (in production, this should be more secure)
		const pepper = 'floyd-secret-pepper-2024';

		return crypto.pbkdf2Sync(
			pepper,
			salt,
			100000, // iterations
			this.keyLength,
			'sha256',
		);
	}

	/**
	 * Encrypt a value
	 *
	 * @param value - Value to encrypt
	 * @returns Encrypted value with IV and auth tag
	 */
	private static encrypt(value: string): string {
		const key = this.deriveKey();
		const iv = crypto.randomBytes(this.ivLength);
		const cipher = crypto.createCipheriv(this.algorithm, key, iv) as any;

		let encrypted = cipher.update(value, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		const authTag = cipher.getAuthTag();

		// Combine: salt (for future key rotation) + iv + authTag + encrypted
		const combined = Buffer.concat([
			iv,
			authTag,
			Buffer.from(encrypted, 'hex'),
		]);

		return combined.toString('base64');
	}

	/**
	 * Decrypt a value
	 *
	 * @param encrypted - Encrypted value
	 * @returns Decrypted value
	 * @throws Error if decryption fails
	 */
	private static decrypt(encrypted: string): string {
		try {
			const key = this.deriveKey();
			const combined = Buffer.from(encrypted, 'base64');

			const iv = combined.subarray(0, this.ivLength);
			const authTag = combined.subarray(
				this.ivLength,
				this.ivLength + this.tagLength,
			);
			const encryptedData = combined.subarray(this.ivLength + this.tagLength);

			const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as any;
			decipher.setAuthTag(authTag);

			let decrypted = decipher.update(
				encryptedData.toString('hex'),
				'hex',
				'utf8',
			);
			decrypted += decipher.final('utf8');

			return decrypted;
		} catch {
			throw new Error('Failed to decrypt stored key');
		}
	}

	/**
	 * Create a hash for key identification (not the key itself)
	 *
	 * @param key - Key to hash
	 * @returns Hash string for identification
	 */
	private static hashKey(key: string): string {
		return crypto
			.createHash('sha256')
			.update(key)
			.digest('hex')
			.substring(0, 16);
	}

	/**
	 * Check if an API key exists in any source
	 *
	 * Searches in priority order:
	 * 1. Environment variables
	 * 2. Claude settings file (~/.claude/settings.json)
	 * 3. Floyd keys file (~/.floyd/keys.json)
	 *
	 * @returns KeyMetadata if found, null otherwise
	 */
	static hasApiKey(): KeyMetadata | null {
		// Check environment variables first
		for (const envVar of ENV_VAR_PRIORITY) {
			const key = process.env[envVar];
			if (key && key.length > 0) {
				return {
					source: KeySource.EnvVar,
					timestamp: Date.now(),
					keyId: this.hashKey(key),
				};
			}
		}

		// Check Claude settings file
		try {
			if (fs.existsSync(SETTINGS_FILE)) {
				const settings = fs.readJsonSync(SETTINGS_FILE);
				if (settings.apiKey || settings.accessToken) {
					const key = settings.apiKey || settings.accessToken;
					return {
						source: KeySource.ConfigFile,
						timestamp: Date.now(),
						keyId: this.hashKey(key as string),
					};
				}
			}
		} catch {
			// Continue to next check
		}

		// Check Floyd keys file
		try {
			if (fs.existsSync(KEYS_FILE)) {
				const keys = fs.readJsonSync(KEYS_FILE) as StoredKeys;
				if (keys['api']) {
					return {
						source: KeySource.ConfigFile,
						timestamp: Date.now(),
						keyId: 'encrypted-key', // Cannot expose actual keyId
					};
				}
			}
		} catch {
			// File doesn't exist or is invalid
		}

		return null;
	}

	/**
	 * Get an API key from available sources
	 *
	 * Searches in priority order and returns the first valid key found.
	 *
	 * @returns API key string or null if not found
	 */
	static getApiKey(): string | null {
		// Check environment variables first
		for (const envVar of ENV_VAR_PRIORITY) {
			const key = process.env[envVar];
			if (key && key.length > 10) {
				// Basic validation: API keys are typically > 10 chars
				return key;
			}
		}

		// Check Claude settings file
		try {
			if (fs.existsSync(SETTINGS_FILE)) {
				const settings = fs.readJsonSync(SETTINGS_FILE);
				const key = settings.apiKey || settings.accessToken;
				if (key && typeof key === 'string' && key.length > 10) {
					return key;
				}
			}
		} catch {
			// Continue to next check
		}

		// Check Floyd keys file
		try {
			if (fs.existsSync(KEYS_FILE)) {
				const keys = fs.readJsonSync(KEYS_FILE) as StoredKeys;
				if (keys['api']) {
					// Decrypt the stored key
					return this.decrypt(keys['api']);
				}
			}
		} catch {
			// File doesn't exist, is invalid, or decryption failed
		}

		return null;
	}

	/**
	 * Securely store an API key
	 *
	 * Stores the key in ~/.floyd/keys.json with encryption.
	 *
	 * @param key - API key to store
	 * @param serviceName - Service name (default: 'api')
	 * @returns true if successful
	 */
	static async storeApiKey(key: string, serviceName = 'api'): Promise<boolean> {
		try {
			// Ensure .floyd directory exists
			await fs.ensureDir(FLOYD_DIR);

			// Set restrictive permissions
			await fs.chmod(FLOYD_DIR, 0o700);

			// Load existing keys or create new
			let keys: StoredKeys = {};
			if (fs.existsSync(KEYS_FILE)) {
				try {
					keys = await fs.readJson(KEYS_FILE);
				} catch {
					// File is corrupt, start fresh
					keys = {};
				}
			}

			// Encrypt and store the key
			keys[serviceName] = this.encrypt(key);
			await fs.writeJson(KEYS_FILE, keys, {spaces: 2});

			// Set restrictive permissions on keys file
			await fs.chmod(KEYS_FILE, 0o600);

			return true;
		} catch (error) {
			console.error('Failed to store API key:', error);
			return false;
		}
	}

	/**
	 * Remove a stored API key
	 *
	 * @param serviceName - Service name to remove (default: 'api')
	 * @returns true if key was removed
	 */
	static async removeApiKey(serviceName = 'api'): Promise<boolean> {
		try {
			if (!fs.existsSync(KEYS_FILE)) {
				return false;
			}

			const keys = await fs.readJson(KEYS_FILE);
			if (keys[serviceName]) {
				delete keys[serviceName];
				await fs.writeJson(KEYS_FILE, keys, {spaces: 2});
				return true;
			}

			return false;
		} catch {
			return false;
		}
	}

	/**
	 * List all stored service names (not the keys themselves)
	 *
	 * @returns Array of service names with stored keys
	 */
	static async listStoredKeys(): Promise<string[]> {
		try {
			if (!fs.existsSync(KEYS_FILE)) {
				return [];
			}

			const keys = await fs.readJson(KEYS_FILE);
			return Object.keys(keys);
		} catch {
			return [];
		}
	}

	/**
	 * Validate an API key format
	 *
	 * Basic validation for common API key formats.
	 *
	 * @param key - Key to validate
	 * @returns true if key appears valid
	 */
	static validateApiKey(key: string): boolean {
		if (!key || typeof key !== 'string') {
			return false;
		}

		const trimmed = key.trim();

		// Check minimum length
		if (trimmed.length < 10) {
			return false;
		}

		// Check for common patterns that indicate an API key
		// This is a basic check, not a comprehensive validation
		const patterns = [
			/^sk-[a-zA-Z0-9]{32,}/, // OpenAI/Anthropic style
			/^[a-zA-Z0-9_-]{20,}$/, // Generic API key
			/^glm-[a-zA-Z0-9]/, // GLM style
		];

		return patterns.some(pattern => pattern.test(trimmed));
	}

	/**
	 * Get the key source for debugging
	 *
	 * @returns String describing where the key would come from
	 */
	static getKeySourceInfo(): string {
		const metadata = this.hasApiKey();
		if (!metadata) {
			return 'No API key found';
		}

		const sourceMap: Record<KeySource, string> = {
			[KeySource.EnvVar]: 'Environment variable',
			[KeySource.ConfigFile]: 'Configuration file',
			[KeySource.Keychain]: 'System keychain',
		};

		return `${sourceMap[metadata.source]} (key ID: ${metadata.keyId})`;
	}
}

/**
 * Convenience function to get an API key
 *
 * @returns API key or null
 */
export function getApiKey(): string | null {
	return SecretManager.getApiKey();
}

/**
 * Convenience function to store an API key
 *
 * @param key - API key to store
 * @returns true if successful
 */
export async function storeApiKey(key: string): Promise<boolean> {
	return SecretManager.storeApiKey(key);
}

/**
 * Convenience function to check if an API key exists
 *
 * @returns KeyMetadata or null
 */
export function hasApiKey(): ReturnType<typeof SecretManager.hasApiKey> {
	return SecretManager.hasApiKey();
}
