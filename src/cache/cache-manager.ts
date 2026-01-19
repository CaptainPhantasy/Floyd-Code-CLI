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

export class CacheManager {
	private cacheRoot: string;
	private tiers: CacheTier[] = ['reasoning', 'project', 'vault'];

	constructor(projectRoot: string) {
		this.cacheRoot = join(projectRoot, '.floyd', '.cache');
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
		const entry: CacheEntry = {
			key,
			value,
			timestamp: Date.now(),
			ttl: TTL_CONFIG[tier],
			tier,
			metadata,
		};

		const entryPath = this.getEntryPath(tier, key);
		await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
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

			return entry.value;
		} catch {
			return null;
		}
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
			const files = await fs.readdir(tierPath);
			for (const file of files) {
				if (file.endsWith('.json')) {
					await fs.unlink(join(tierPath, file));
					deleted++;
				}
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

	async storeReasoningFrame(frame: ReasoningFrame): Promise<void> {
		const lastStep = frame.cog_steps[frame.cog_steps.length - 1];

		frame.glm_context = {
			thinking_mode: 'preserved',
			last_cog_step_hash: lastStep ? this.hash(JSON.stringify(lastStep)) : 0,
			session_continuity_token: this.generateContinuityToken(),
		};

		const filepath = join(this.cacheRoot, 'reasoning', 'active', 'frame.json');
		await fs.writeFile(filepath, JSON.stringify(frame, null, 2));

		// Auto-commit to project chronicle every 5 steps
		if (frame.cog_steps.length % 5 === 0) {
			await this.commitToProjectChronicle(frame);
		}
	}

	async loadReasoningFrame(): Promise<ReasoningFrame | null> {
		const filepath = join(this.cacheRoot, 'reasoning', 'active', 'frame.json');
		try {
			const content = await fs.readFile(filepath, 'utf-8');
			return JSON.parse(content) as ReasoningFrame;
		} catch {
			return null;
		}
	}

	async archiveFrame(): Promise<void> {
		const activePath = join(this.cacheRoot, 'reasoning', 'active', 'frame.json');
		const archivePath = join(
			this.cacheRoot,
			'reasoning',
			'archive',
			`frame-${Date.now()}.json`,
		);

		try {
			await fs.rename(activePath, archivePath);
		} catch {
			// File may not exist
		}
	}

	private async commitToProjectChronicle(frame: ReasoningFrame): Promise<void> {
		const chroniclePath = join(
			this.cacheRoot,
			'project',
			'phase_summaries',
			`chronicle-${Date.now()}.json`,
		);
		await fs.writeFile(chroniclePath, JSON.stringify(frame, null, 2));
	}

	// --- Vault Pattern Methods ---

	async storePattern(name: string, pattern: string, tags?: string[]): Promise<void> {
		const entry: CacheEntry = {
			key: name,
			value: pattern,
			timestamp: Date.now(),
			ttl: TTL_CONFIG.vault,
			tier: 'vault',
			metadata: { tags },
		};

		const patternPath = join(this.cacheRoot, 'vault', 'patterns', `${name}.json`);
		await fs.writeFile(patternPath, JSON.stringify(entry, null, 2));

		// Update index
		await this.updateVaultIndex(name, tags);
	}

	private async updateVaultIndex(name: string, tags?: string[]): Promise<void> {
		const indexPath = join(this.cacheRoot, 'vault', 'index', 'patterns.json');
		let index: Record<string, string[]> = {};

		try {
			const content = await fs.readFile(indexPath, 'utf-8');
			index = JSON.parse(content);
		} catch {
			// Index doesn't exist yet
		}

		index[name] = tags || [];
		await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
	}
}
