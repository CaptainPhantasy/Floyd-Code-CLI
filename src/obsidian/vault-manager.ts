/**
 * Obsidian Vault Manager
 *
 * Handles vault discovery, selection, and file operations for Obsidian vaults.
 *
 * @module obsidian/vault-manager
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface VaultInfo {
	name: string;
	path: string;
	noteCount: number;
	lastModified: Date;
}

export interface VaultConfig {
	vaults: Record<string, string>; // name -> path mapping
	activeVault?: string;
}

const VAULT_CONFIG_PATH = path.join(
	os.homedir(),
	'.floyd',
	'obsidian-vaults.json',
);

// ----------------------------------------------------------------------------
// Vault Manager
// ----------------------------------------------------------------------------

export class VaultManager {
	private config: VaultConfig;

	constructor() {
		this.config = {vaults: {}};
	}

	/**
	 * Initialize the vault manager by loading existing config
	 */
	async initialize(): Promise<void> {
		try {
			if (await fs.pathExists(VAULT_CONFIG_PATH)) {
				this.config = await fs.readJson(VAULT_CONFIG_PATH);
			}
		} catch (error) {
			console.warn('Failed to load vault config, starting fresh:', error);
			this.config = {vaults: {}};
		}
	}

	/**
	 * Save the current vault configuration
	 */
	private async saveConfig(): Promise<void> {
		try {
			await fs.ensureDir(path.dirname(VAULT_CONFIG_PATH));
			await fs.writeJson(VAULT_CONFIG_PATH, this.config, {spaces: 2});
		} catch (error) {
			throw new Error(`Failed to save vault config: ${error}`);
		}
	}

	/**
	 * List all registered vaults with metadata
	 */
	async listVaults(): Promise<VaultInfo[]> {
		const vaults: VaultInfo[] = [];

		for (const [name, vaultPath] of Object.entries(this.config.vaults)) {
			try {
				if (await fs.pathExists(vaultPath)) {
					const noteCount = await this.countMarkdownFiles(vaultPath);
					const stats = await fs.stat(vaultPath);
					const lastModified = stats.mtime;

					vaults.push({
						name,
						path: vaultPath,
						noteCount,
						lastModified,
					});
				}
			} catch (error) {
				console.warn(`Failed to read vault "${name}" at ${vaultPath}:`, error);
			}
		}

		return vaults.sort(
			(a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
		);
	}

	/**
	 * Count markdown files in a directory recursively
	 */
	private async countMarkdownFiles(dirPath: string): Promise<number> {
		let count = 0;

		try {
			const entries = await fs.readdir(dirPath, {withFileTypes: true});

			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name);

				if (entry.isDirectory()) {
					// Skip .git, .obsidian, and other hidden dirs
					if (!entry.name.startsWith('.')) {
						count += await this.countMarkdownFiles(fullPath);
					}
				} else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
					count++;
				}
			}
		} catch (error) {
			console.warn(`Failed to count markdown files in ${dirPath}:`, error);
		}

		return count;
	}

	/**
	 * Check if a file is a markdown file
	 */
	private isMarkdownFile(filename: string): boolean {
		const ext = path.extname(filename).toLowerCase();
		return ['.md', '.markdown', '.mdown', '.mkd', '.mkdn'].includes(ext);
	}

	/**
	 * Select a vault as the active vault
	 */
	async selectVault(vaultName: string): Promise<string | null> {
		if (!(vaultName in this.config.vaults)) {
			return null;
		}

		this.config.activeVault = vaultName;
		await this.saveConfig();

		const vaultPath = this.config.vaults[vaultName];
		return vaultPath ?? null;
	}

	/**
	 * Get the currently active vault path
	 */
	getActiveVault(): string | null {
		if (
			this.config.activeVault &&
			this.config.activeVault in this.config.vaults
		) {
			const vaultPath = this.config.vaults[this.config.activeVault];
			return vaultPath ?? null;
		}
		return null;
	}

	/**
	 * Get path for a specific vault by name
	 */
	getVaultPath(vaultName: string): string | null {
		return this.config.vaults[vaultName] ?? null;
	}

	/**
	 * Add a new vault to the configuration
	 */
	async addVault(name: string, vaultPath: string): Promise<boolean> {
		// Validate the path exists
		if (!(await fs.pathExists(vaultPath))) {
			throw new Error(`Path does not exist: ${vaultPath}`);
		}

		// Resolve to absolute path
		const absolutePath = path.resolve(vaultPath);
		const stat = await fs.stat(absolutePath);

		if (!stat.isDirectory()) {
			throw new Error(`Path is not a directory: ${vaultPath}`);
		}

		this.config.vaults[name] = absolutePath;
		await this.saveConfig();

		return true;
	}

	/**
	 * Remove a vault from the configuration
	 */
	async removeVault(vaultName: string): Promise<boolean> {
		if (!(vaultName in this.config.vaults)) {
			return false;
		}

		delete this.config.vaults[vaultName];

		// Clear active vault if it was the removed one
		if (this.config.activeVault === vaultName) {
			this.config.activeVault = undefined;
		}

		await this.saveConfig();
		return true;
	}

	/**
	 * Create a new vault directory structure
	 */
	async createVault(name: string, basePath?: string): Promise<string> {
		// Default to Obsidian's default vault location
		let vaultBasePath = basePath;

		if (!vaultBasePath) {
			const platform = os.platform();

			if (platform === 'darwin') {
				vaultBasePath = path.join(
					os.homedir(),
					'Library',
					'CloudStorage',
					'OneDrive-Personal',
					'Obsidian',
				);
			} else if (platform === 'win32') {
				vaultBasePath = path.join(os.homedir(), 'OneDrive', 'Obsidian');
			} else {
				vaultBasePath = path.join(os.homedir(), 'Obsidian');
			}

			// Fallback to Documents if default doesn't exist
			if (!(await fs.pathExists(vaultBasePath))) {
				vaultBasePath = path.join(os.homedir(), 'Documents', 'Obsidian');
			}
		}

		const vaultPath = path.join(vaultBasePath, name);

		// Create the vault directory
		await fs.ensureDir(vaultPath);

		// Create .obsidian directory (marker for Obsidian)
		const obsidianDir = path.join(vaultPath, '.obsidian');
		await fs.ensureDir(obsidianDir);

		// Create basic Obsidian config
		const obsidianConfig = {
			enabledPlugins: [],
			theme: 'moonstone',
		};

		await fs.writeJson(path.join(obsidianDir, 'workspace.json'), {});
		await fs.writeJson(
			path.join(obsidianDir, 'appearance.json'),
			obsidianConfig,
		);

		// Add to vault registry
		await this.addVault(name, vaultPath);

		return vaultPath;
	}

	/**
	 * Get all markdown files in a vault
	 */
	async getVaultNotes(vaultName?: string): Promise<string[]> {
		const vaultPath = vaultName
			? this.getVaultPath(vaultName)
			: this.getActiveVault();

		if (!vaultPath) {
			return [];
		}

		const notes: string[] = [];
		await this.collectMarkdownFiles(vaultPath, notes);

		return notes;
	}

	/**
	 * Recursively collect markdown file paths
	 */
	private async collectMarkdownFiles(
		dirPath: string,
		results: string[],
	): Promise<void> {
		try {
			const entries = await fs.readdir(dirPath, {withFileTypes: true});

			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name);

				if (entry.isDirectory()) {
					if (!entry.name.startsWith('.')) {
						await this.collectMarkdownFiles(fullPath, results);
					}
				} else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
					results.push(fullPath);
				}
			}
		} catch (error) {
			console.warn(`Failed to read directory ${dirPath}:`, error);
		}
	}
}

// ----------------------------------------------------------------------------
// Convenience Functions
// ----------------------------------------------------------------------------

/**
 * Create and initialize a new VaultManager instance
 */
export async function createVaultManager(): Promise<VaultManager> {
	const manager = new VaultManager();
	await manager.initialize();
	return manager;
}

/**
 * List all available vaults
 */
export async function listVaults(): Promise<VaultInfo[]> {
	const manager = await createVaultManager();
	return manager.listVaults();
}

/**
 * Select a vault as active
 */
export async function selectVault(vaultName: string): Promise<string | null> {
	const manager = await createVaultManager();
	return manager.selectVault(vaultName);
}

/**
 * Create a new vault
 */
export async function createVault(
	name: string,
	basePath?: string,
): Promise<string> {
	const manager = await createVaultManager();
	return manager.createVault(name, basePath);
}

/**
 * Get the path of a vault by name
 */
export async function getVaultPath(vaultName: string): Promise<string | null> {
	const manager = await createVaultManager();
	return manager.getVaultPath(vaultName);
}
