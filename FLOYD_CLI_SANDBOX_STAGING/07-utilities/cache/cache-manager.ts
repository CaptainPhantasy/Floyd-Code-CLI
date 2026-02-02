// SUPERCACHE - 3-Tier Caching System for FLOYD
//
// Tier 1: Reasoning - Current conversation (5 min TTL)
// Tier 2: Project - Project context (24 hours TTL)
// Tier 3: Vault - Reusable wisdom (7 days TTL)

import { promises as fs } from 'fs';
import { join } from 'path';

export type CacheTier = 'reasoning' | 'project' | 'vault';

export interface CacheEntry {
	key: string;
	value: string;
	timestamp: number;
	ttl: number; // milliseconds
	tier: CacheTier;
	metadata?: Record<string, unknown>;
	version?: number; // Cache version
	lastAccess?: number; // For LRU eviction
	compressed?: boolean; // Whether value is compressed
}

export interface CacheStats {
	tier: CacheTier;
	count: number;
	totalSize: number;
	oldestEntry?: number;
	newestEntry?: number;
}

// Reasoning Frame Schema (matching blueprint)
export interface ReasoningFrame {
	frame_id: string;
	task_id: string;
	start_time: string;
	last_updated?: string;
	cog_steps: CogStep[];
	current_focus?: string;
	validation_hash?: string;
	glm_context?: {
		thinking_mode: 'preserved';
		last_cog_step_hash: number;
		session_continuity_token: string;
	};
}

export interface CogStep {
	timestamp: string;
	step_type: 'FRAME_START' | 'COG_STEP' | 'FRAME_APPEND' | 'TOOL_CALL' | 'DECISION';
	content: string;
	tool_used?: string;
	tool_result_hash?: string;
}

// Solution Pattern Schema (matching blueprint)
export interface SolutionPattern {
	signature: string;
	human_name?: string;
	trigger_terms: string[];
	category: 'ui_component' | 'api_endpoint' | 'auth_flow' | 'database' | 'devops' | 'utility';
	implementation: string;
	validation_tests?: string;
	dependencies?: string[];
	created: string;
	last_used?: string;
	success_count?: number;
	failure_count?: number;
	complexity_score?: number;
	embedding_vector?: number[];
}

// Project State Snapshot (matching blueprint)
export interface ProjectStateSnapshot {
	snapshot_time: string;
	project_root: string;
	active_branch: string;
	last_commit: string;
	master_plan_phase?: string;
	recent_commands: string[];
	active_ports?: Array<{
		port: number;
		service: string;
		pid: number;
	}>;
	recent_errors?: Array<{
		timestamp: string;
		tool: string;
		error: string;
		resolved: boolean;
	}>;
}

const TTL_CONFIG: Record<CacheTier, number> = {
	reasoning: 5 * 60 * 1000, // 5 minutes
	project: 24 * 60 * 60 * 1000, // 24 hours
	vault: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Size limits per tier (max number of entries)
const SIZE_LIMITS: Record<CacheTier, number> = {
	reasoning: 100, // 100 entries
	project: 500, // 500 entries
	vault: 1000, // 1000 entries
};

// Compression threshold (bytes)
const COMPRESS_THRESHOLD = 1024; // 1KB

// Cache version
const CACHE_VERSION = 1;

export interface CacheConfig {
	cacheDir?: string;
	maxSize?: Partial<Record<CacheTier, number>>;
	compressThreshold?: number;
}

export class CacheManager {
	private cacheRoot: string;
	private tiers: CacheTier[] = ['reasoning', 'project', 'vault'];
	private maxSize: Record<CacheTier, number>;
	private compressThreshold: number;

	constructor(projectRoot: string, config?: CacheConfig) {
		this.cacheRoot = join(projectRoot, '.floyd', '.cache');
		this.maxSize = {
			reasoning: config?.maxSize?.reasoning || SIZE_LIMITS.reasoning,
			project: config?.maxSize?.project || SIZE_LIMITS.project,
			vault: config?.maxSize?.vault || SIZE_LIMITS.vault,
		};
		this.compressThreshold = config?.compressThreshold || COMPRESS_THRESHOLD;
	}

	private getTierPath(tier: CacheTier): string {
		return join(this.cacheRoot, tier);
	}

	private getEntryPath(tier: CacheTier, key: string): string {
		const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
		return join(this.getTierPath(tier), `${safeKey}.json`);
	}

	private hash(input: string): number {
		let hash = 0;
		for (let i = 0; i < input.length; i++) {
			const char = input.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return Math.abs(hash);
	}

	private generateContinuityToken(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
	}

	async store(
		tier: CacheTier,
		key: string,
		value: string,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		// Validate inputs
		if (!key || key.trim().length === 0) {
			throw new Error('Cache key cannot be empty');
		}
		if (value === undefined || value === null) {
			throw new Error('Cache value cannot be null or undefined');
		}

		const entry: CacheEntry = {
			key,
			value,
			timestamp: Date.now(),
			lastAccess: Date.now(),
			ttl: TTL_CONFIG[tier],
			tier,
			metadata,
			version: CACHE_VERSION,
		};

		const entryPath = this.getEntryPath(tier, key);
		
		// Ensure directory exists
		const tierPath = this.getTierPath(tier);
		await fs.mkdir(tierPath, {recursive: true});
		
		await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));

		// Enforce size limit - remove oldest entry if at capacity
		await this.enforceSizeLimit(tier);
	}

	async retrieve(tier: CacheTier, key: string): Promise<string | null> {
		const entryPath = this.getEntryPath(tier, key);

		try {
			const content = await fs.readFile(entryPath, 'utf-8');
			const entry: CacheEntry = JSON.parse(content);

			// Check if expired
			const now = Date.now();
			if (now - entry.timestamp > entry.ttl) {
				// Expired - delete and return null
				await this.delete(tier, key);
				return null;
			}

			// Update last access time for LRU
			entry.lastAccess = now;
			await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));

			return entry.value;
		} catch {
			return null;
		}
	}

	private async enforceSizeLimit(tier: CacheTier): Promise<void> {
		const entries = await this.list(tier);
		const maxSize = this.maxSize[tier];

		if (entries.length <= maxSize) {
			return; // Under limit, nothing to do
		}

		// Sort by lastAccess time (oldest first) and remove excess
		const toRemove = entries
			.sort((a, b) => (a.lastAccess || a.timestamp) - (b.lastAccess || b.timestamp))
			.slice(0, entries.length - maxSize);

		for (const entry of toRemove) {
			await this.delete(tier, entry.key);
		}
	}

	async backup(backupPath: string): Promise<void> {
		const backup = {
			version: CACHE_VERSION,
			timestamp: Date.now(),
			tiers: {} as Record<string, CacheEntry[]>,
		};

		// Backup all tiers
		for (const tier of this.tiers) {
			const entries = await this.list(tier);
			backup.tiers[tier] = entries;
		}

		await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
	}

	async restore(backupPath: string): Promise<void> {
		const content = await fs.readFile(backupPath, 'utf-8');
		const backup = JSON.parse(content);

		// Clear all tiers first
		for (const tier of this.tiers) {
			await this.clear(tier);
		}

		// Restore entries from backup
		for (const tier of this.tiers) {
			const entries = backup.tiers[tier] || [];
			for (const entry of entries) {
				const entryPath = this.getEntryPath(tier, entry.key);
				const tierPath = this.getTierPath(tier);
				await fs.mkdir(tierPath, {recursive: true});
				await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
			}
		}
	}

	async migrate(): Promise<number> {
		let migrated = 0;

		for (const tier of this.tiers) {
			const tierPath = this.getTierPath(tier);
			try {
				const files = await fs.readdir(tierPath);
				for (const file of files) {
					if (file.endsWith('.json')) {
						const filePath = join(tierPath, file);
						const content = await fs.readFile(filePath, 'utf-8');
						const entry: CacheEntry = JSON.parse(content);

						// Migrate if no version or old version
						if (!entry.version || entry.version < CACHE_VERSION) {
							entry.version = CACHE_VERSION;
							if (!entry.lastAccess) {
								entry.lastAccess = entry.timestamp;
							}
							await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
							migrated++;
						}
					}
				}
			} catch {
				// Directory might not exist
			}
		}

		return migrated;
	}

	async delete(tier: CacheTier, key: string): Promise<boolean> {
		const entryPath = this.getEntryPath(tier, key);

		try {
			await fs.unlink(entryPath);
			return true;
		} catch {
			return false;
		}
	}

	async clear(tier?: CacheTier): Promise<number> {
		let deleted = 0;

		if (tier) {
			const tierPath = this.getTierPath(tier);
			try {
				const files = await fs.readdir(tierPath);
				for (const file of files) {
					if (file.endsWith('.json')) {
						await fs.unlink(join(tierPath, file));
						deleted++;
					}
				}
			} catch {
				// Directory doesn't exist
			}
		} else {
			// Clear all tiers
			for (const t of this.tiers) {
				deleted += await this.clear(t);
			}
		}

		return deleted;
	}

	async list(tier?: CacheTier): Promise<CacheEntry[]> {
		const entries: CacheEntry[] = [];
		const tiersToCheck = tier ? [tier] : this.tiers;

		for (const t of tiersToCheck) {
			const tierPath = this.getTierPath(t);
			try {
				const files = await fs.readdir(tierPath);
				for (const file of files) {
					if (file.endsWith('.json')) {
						const content = await fs.readFile(join(tierPath, file), 'utf-8');
						const entry: CacheEntry = JSON.parse(content);

						// Skip expired entries
						const now = Date.now();
						if (now - entry.timestamp <= entry.ttl) {
							entries.push(entry);
						}
					}
				}
			} catch {
				// Directory might not exist or be empty
			}
		}

		// Sort by timestamp descending
		return entries.sort((a, b) => b.timestamp - a.timestamp);
	}

	async search(tier: CacheTier, query: string): Promise<CacheEntry[]> {
		const allEntries = await this.list(tier);
		const lowerQuery = query.toLowerCase();

		return allEntries.filter(
			(entry) =>
				entry.key.toLowerCase().includes(lowerQuery) ||
				entry.value.toLowerCase().includes(lowerQuery),
		);
	}

	async getStats(tier?: CacheTier): Promise<CacheStats[]> {
		const stats: CacheStats[] = [];
		const tiersToCheck = tier ? [tier] : this.tiers;

		for (const t of tiersToCheck) {
			const tierPath = this.getTierPath(t);
			const stat: CacheStats = {
				tier: t,
				count: 0,
				totalSize: 0,
			};

			try {
				const files = await fs.readdir(tierPath);
				for (const file of files) {
					if (file.endsWith('.json')) {
						const filePath = join(tierPath, file);
						const content = await fs.readFile(filePath, 'utf-8');
						const entry: CacheEntry = JSON.parse(content);

						// Count only non-expired entries
						const now = Date.now();
						if (now - entry.timestamp <= entry.ttl) {
							stat.count++;
							stat.totalSize += content.length;

							if (!stat.oldestEntry || entry.timestamp < stat.oldestEntry) {
								stat.oldestEntry = entry.timestamp;
							}
							if (!stat.newestEntry || entry.timestamp > stat.newestEntry) {
								stat.newestEntry = entry.timestamp;
							}
						}
					}
				}
			} catch {
				// Directory might not exist
			}

			stats.push(stat);
		}

		return stats;
	}

	async prune(tier?: CacheTier): Promise<number> {
		let pruned = 0;
		const tiersToCheck = tier ? [tier] : this.tiers;

		for (const t of tiersToCheck) {
			const tierPath = this.getTierPath(t);
			try {
				const files = await fs.readdir(tierPath);
				for (const file of files) {
					if (file.endsWith('.json')) {
						const filePath = join(tierPath, file);
						const content = await fs.readFile(filePath, 'utf-8');
						const entry: CacheEntry = JSON.parse(content);

						// Check if expired
						const now = Date.now();
						if (now - entry.timestamp > entry.ttl) {
							await fs.unlink(filePath);
							pruned++;
						}
					}
				}
			} catch {
				// Directory might not exist
			}
		}

		return pruned;
	}

	// --- Reasoning Frame Specific Methods ---

	/**
	 * Store a reasoning frame to the active reasoning tier
	 * @param frame - The reasoning frame to store
	 * @throws {Error} If file system operations fail
	 */
	async storeReasoningFrame(frame: ReasoningFrame): Promise<void> {
		try {
			const lastStep = frame.cog_steps[frame.cog_steps.length - 1];

			frame.glm_context = {
				thinking_mode: 'preserved',
				last_cog_step_hash: lastStep ? this.hash(JSON.stringify(lastStep)) : 0,
				session_continuity_token: this.generateContinuityToken(),
			};

			// Ensure directory exists
			const activeDir = join(this.cacheRoot, 'reasoning', 'active');
			await fs.mkdir(activeDir, {recursive: true});

			const filepath = join(activeDir, 'frame.json');
			await fs.writeFile(filepath, JSON.stringify(frame, null, 2));

			// Auto-commit to project chronicle every 5 steps
			if (frame.cog_steps.length % 5 === 0) {
				await this.commitToProjectChronicle(frame);
			}
		} catch (error) {
			throw new Error(
				`Failed to store reasoning frame: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Load the active reasoning frame
	 * @returns The reasoning frame or null if not found
	 */
	async loadReasoningFrame(): Promise<ReasoningFrame | null> {
		const filepath = join(this.cacheRoot, 'reasoning', 'active', 'frame.json');
		try {
			const content = await fs.readFile(filepath, 'utf-8');
			const frame = JSON.parse(content) as ReasoningFrame;
			
			// Validate frame structure
			if (!frame.frame_id || !Array.isArray(frame.cog_steps)) {
				throw new Error('Invalid frame structure');
			}
			
			return frame;
		} catch (error) {
			// File doesn't exist or is corrupted
			return null;
		}
	}

	async archiveFrame(): Promise<void> {
		const activePath = join(this.cacheRoot, 'reasoning', 'active', 'frame.json');
		const archiveDir = join(this.cacheRoot, 'reasoning', 'archive');
		const archivePath = join(archiveDir, `frame-${Date.now()}.json`);

		try {
			// Ensure archive directory exists
			await fs.mkdir(archiveDir, {recursive: true});
			await fs.rename(activePath, archivePath);
		} catch (error) {
			// File may not exist or other error - log but don't throw
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Warning: Failed to archive frame: ${(error as Error).message}`);
			}
		}
	}

	private async commitToProjectChronicle(frame: ReasoningFrame): Promise<void> {
		try {
			const chronicleDir = join(this.cacheRoot, 'project', 'phase_summaries');
			await fs.mkdir(chronicleDir, {recursive: true});
			
			const chroniclePath = join(chronicleDir, `chronicle-${Date.now()}.json`);
			await fs.writeFile(chroniclePath, JSON.stringify(frame, null, 2));
		} catch (error) {
			// Log but don't throw - chronicle failure shouldn't block operations
			console.error(`Warning: Failed to commit to chronicle: ${(error as Error).message}`);
		}
	}

	// --- Vault Pattern Methods ---

	async storePattern(name: string, pattern: string, tags?: string[]): Promise<void> {
		try {
			// Validate inputs
			if (!name || name.trim().length === 0) {
				throw new Error('Pattern name cannot be empty');
			}
			if (!pattern || pattern.trim().length === 0) {
				throw new Error('Pattern content cannot be empty');
			}

			const entry: CacheEntry = {
				key: name,
				value: pattern,
				timestamp: Date.now(),
				ttl: TTL_CONFIG.vault,
				tier: 'vault',
				metadata: { tags },
			};

			// Store in both patterns directory and main vault directory for listing
			const patternDir = join(this.cacheRoot, 'vault', 'patterns');
			await fs.mkdir(patternDir, {recursive: true});

			const patternPath = join(patternDir, `${name}.json`);
			await fs.writeFile(patternPath, JSON.stringify(entry, null, 2));

			// Also store in main vault tier directory so it appears in list()
			const vaultPath = this.getEntryPath('vault', `pattern:${name}`);
			await fs.writeFile(vaultPath, JSON.stringify(entry, null, 2));

			// Update index
			await this.updateVaultIndex(name, tags);
		} catch (error) {
			throw new Error(`Failed to store pattern: ${(error as Error).message}`);
		}
	}

	async loadPattern(name: string): Promise<string | null> {
		try {
			const patternDir = join(this.cacheRoot, 'vault', 'patterns');
			const patternPath = join(patternDir, `${name}.json`);

			const content = await fs.readFile(patternPath, 'utf-8');
			const entry: CacheEntry = JSON.parse(content);

			// Check if expired
			const now = Date.now();
			if (now - entry.timestamp > entry.ttl) {
				// Expired - delete and return null
				await fs.unlink(patternPath).catch(() => {});
				return null;
			}

			return entry.value;
		} catch (error) {
			// Pattern not found or other error
			return null;
		}
	}

	private async updateVaultIndex(name: string, tags?: string[]): Promise<void> {
		try {
			const indexDir = join(this.cacheRoot, 'vault', 'index');
			await fs.mkdir(indexDir, {recursive: true});
			
			const indexPath = join(indexDir, 'patterns.json');
			let index: Record<string, string[]> = {};

			try {
				const content = await fs.readFile(indexPath, 'utf-8');
				index = JSON.parse(content);
			} catch {
				// Index doesn't exist yet - start fresh
			}

			index[name] = tags || [];
			await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
		} catch (error) {
			// Log but don't throw - index update failure shouldn't block storage
			console.error(`Warning: Failed to update vault index: ${(error as Error).message}`);
		}
	}
}
