/**
 * Skill Registry
 *
 * Central registry for discovering, loading, and managing skills.
 * Supports skill discovery from multiple directories (global, project, built-in).
 *
 * @module skills/skill-registry
 */

import {readdir, readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import type {
	SkillDefinition,
	SkillInstance,
	SkillManifest,
	SkillMetadata,
} from './skill-definition.js';
import {validateSkillMetadata} from './skill-definition.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Skill registry options
 */
export interface SkillRegistryOptions {
	/** Global skills directory (default: ~/.floyd/skills) */
	globalSkillsDir?: string;

	/** Project skills directory (default: .floyd/skills) */
	projectSkillsDir?: string;

	/** Built-in skills directory */
	builtinSkillsDir?: string;

	/** Auto-load skills on discovery */
	autoLoad?: boolean;

	/** Enable skill caching */
	enableCache?: boolean;
}

/**
 * Skill discovery result
 */
export interface SkillDiscoveryResult {
	/** Discovered skills */
	skills: SkillMetadata[];

	/** Errors during discovery */
	errors: Array<{path: string; error: string}>;

	/** Discovery duration in ms */
	duration: number;
}

/**
 * Skill load result
 */
export interface SkillLoadResult {
	/** Loaded skill instances */
	loaded: SkillInstance[];

	/** Failed skills */
	failed: Array<{skillId: string; error: string}>;

	/** Load duration in ms */
	duration: number;
}

// ============================================================================
// SKILL REGISTRY CLASS
// ============================================================================

/**
 * SkillRegistry - Central registry for skill management
 *
 * Manages skill discovery, loading, and provides lookup functionality.
 * Skills are organized into three tiers:
 * 1. Built-in skills (distributed with Floyd CLI)
 * 2. Global skills (user-wide, installed in ~/.floyd/skills)
 * 3. Project skills (project-specific, installed in .floyd/skills)
 */
export class SkillRegistry {
	private readonly skills: Map<string, SkillInstance> = new Map();
	private readonly options: Required<SkillRegistryOptions>;

	constructor(options: SkillRegistryOptions = {}) {
		this.options = {
			globalSkillsDir: options.globalSkillsDir || join(homedir(), '.floyd', 'skills'),
			projectSkillsDir: options.projectSkillsDir || '.floyd/skills',
			builtinSkillsDir: options.builtinSkillsDir,
			autoLoad: options.autoLoad ?? true,
			enableCache: options.enableCache ?? true,
		};
	}

	/**
	 * Discover all available skills from all directories
	 */
	async discover(): Promise<SkillDiscoveryResult> {
		const startTime = Date.now();
		const skills: SkillMetadata[] = [];
		const errors: Array<{path: string; error: string}> = [];

		// Discover built-in skills
		if (this.options.builtinSkillsDir) {
			const result = await this.discoverInDirectory(this.options.builtinSkillsDir);
			skills.push(...result.skills);
			errors.push(...result.errors);
		}

		// Discover global skills
		try {
			const result = await this.discoverInDirectory(this.options.globalSkillsDir);
			skills.push(...result.skills);
			errors.push(...result.errors);
		} catch {
			// Global directory might not exist, ignore
		}

		// Discover project skills
		try {
			const result = await this.discoverInDirectory(this.options.projectSkillsDir);
			skills.push(...result.skills);
			errors.push(...result.errors);
		} catch {
			// Project directory might not exist, ignore
		}

		// Remove duplicates (project > global > built-in)
		const uniqueSkills = this.deduplicateSkills(skills);

		return {
			skills: uniqueSkills,
			errors,
			duration: Date.now() - startTime,
		};
	}

	/**
	 * Discover skills in a specific directory
	 */
	async discoverInDirectory(dir: string): Promise<SkillDiscoveryResult> {
		const startTime = Date.now();
		const skills: SkillMetadata[] = [];
		const errors: Array<{path: string; error: string}> = [];

		try {
			const entries = await readdir(dir, {withFileTypes: true});

			for (const entry of entries) {
				if (!entry.isDirectory()) {
					continue;
				}

				const skillPath = join(dir, entry.name);
				const manifestPath = join(skillPath, 'skill.json');

				try {
					// Check if skill.json exists
					const manifestStat = await stat(manifestPath);
					if (!manifestStat.isFile()) {
						continue;
					}

					// Read and parse manifest
					const manifestContent = await readFile(manifestPath, 'utf-8');
					const manifest = JSON.parse(manifestContent) as SkillManifest;

					// Create metadata
					const metadata: SkillMetadata = {
						id: manifest.id,
						name: manifest.name,
						description: manifest.description,
						version: manifest.version,
						author: manifest.author,
						tags: manifest.tags,
						category: manifest.category,
						path: skillPath,
						enabled: true,
					};

					// Validate metadata
					const validationErrors = validateSkillMetadata(metadata);
					if (validationErrors.length > 0) {
						errors.push({
							path: skillPath,
							error: `Validation failed: ${validationErrors.join(', ')}`,
						});
						continue;
					}

					skills.push(metadata);
				} catch (error) {
					errors.push({
						path: skillPath,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		} catch (error) {
			// Directory might not exist or be inaccessible
			errors.push({
				path: dir,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		return {
			skills,
			errors,
			duration: Date.now() - startTime,
		};
	}

	/**
	 * Load a skill by ID
	 */
	async loadSkill(skillId: string): Promise<SkillInstance | null> {
		// Check if already loaded
		const existing = this.skills.get(skillId);
		if (existing) {
			return existing;
		}

		// Discover and find the skill
		const discovery = await this.discover();
		const metadata = discovery.skills.find(s => s.id === skillId);

		if (!metadata) {
			return null;
		}

		try {
			// Load manifest
			const manifestPath = join(metadata.path, 'skill.json');
			const manifestContent = await readFile(manifestPath, 'utf-8');
			const manifest = JSON.parse(manifestContent) as SkillManifest;

			// Load main skill file
			const mainPath = join(metadata.path, manifest.main);
			const skillModule = await import(mainPath);

			// Get skill definition
			const definition = skillModule.default || skillModule;

			// Create skill instance
			const instance: SkillInstance = {
				metadata,
				manifest,
				definition,
				config: {},
				loaded: true,
				loadedAt: new Date(),
			};

			// Call onLoad hook
			if (definition.hooks?.onLoad) {
				await definition.hooks.onLoad();
			}

			// Register skill
			this.skills.set(skillId, instance);

			return instance;
		} catch (error) {
			console.error(`Failed to load skill ${skillId}:`, error);
			return null;
		}
	}

	/**
	 * Load all discovered skills
	 */
	async loadAll(): Promise<SkillLoadResult> {
		const startTime = Date.now();
		const loaded: SkillInstance[] = [];
		const failed: Array<{skillId: string; error: string}> = [];

		const discovery = await this.discover();

		for (const metadata of discovery.skills) {
			if (!metadata.enabled) {
				continue;
			}

			try {
				const instance = await this.loadSkill(metadata.id);
				if (instance) {
					loaded.push(instance);
				} else {
					failed.push({skillId: metadata.id, error: 'Failed to load'});
				}
			} catch (error) {
				failed.push({
					skillId: metadata.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			loaded,
			failed,
			duration: Date.now() - startTime,
		};
	}

	/**
	 * Unload a skill
	 */
	async unloadSkill(skillId: string): Promise<boolean> {
		const instance = this.skills.get(skillId);

		if (!instance) {
			return false;
		}

		try {
			// Call onUnload hook
			if (instance.definition.hooks?.onUnload) {
				await instance.definition.hooks.onUnload();
			}

			// Remove from registry
			this.skills.delete(skillId);

			return true;
		} catch (error) {
			console.error(`Failed to unload skill ${skillId}:`, error);
			return false;
		}
	}

	/**
	 * Reload a skill
	 */
	async reloadSkill(skillId: string): Promise<SkillInstance | null> {
		await this.unloadSkill(skillId);
		return this.loadSkill(skillId);
	}

	/**
	 * Get a skill instance by ID
	 */
	get(skillId: string): SkillInstance | undefined {
		return this.skills.get(skillId);
	}

	/**
	 * Check if a skill is loaded
	 */
	has(skillId: string): boolean {
		return this.skills.has(skillId);
	}

	/**
	 * Get all loaded skill IDs
	 */
	ids(): string[] {
		return Array.from(this.skills.keys());
	}

	/**
	 * Get all loaded skill instances
	 */
	all(): SkillInstance[] {
		return Array.from(this.skills.values());
	}

	/**
	 * Get skills by category
	 */
	byCategory(category: string): SkillInstance[] {
		return this.all().filter(
			skill => skill.metadata.category === category,
		);
	}

	/**
	 * Get skills by tag
	 */
	byTag(tag: string): SkillInstance[] {
		return this.all().filter(skill =>
			skill.metadata.tags.includes(tag),
		);
	}

	/**
	 * Find skills matching a pattern
	 */
	find(pattern: string | RegExp): SkillInstance[] {
		const allSkills = this.all();

		if (typeof pattern === 'string') {
			const searchPattern = pattern.toLowerCase();
			return allSkills.filter(skill => {
				const name = skill.metadata.name.toLowerCase();
				const description = skill.metadata.description.toLowerCase();
				const tags = skill.metadata.tags.map(t => t.toLowerCase());
				return (
					name.includes(searchPattern) ||
					description.includes(searchPattern) ||
					tags.some(t => t.includes(searchPattern))
				);
			});
		}

		// RegExp pattern
		return allSkills.filter(skill =>
			pattern.test(skill.metadata.name) ||
			pattern.test(skill.metadata.description),
		);
	}

	/**
	 * Get all tools from all loaded skills
	 */
	getAllTools(): Array<SkillInstance['definition']['tools'][0]> {
		const tools: Array<SkillInstance['definition']['tools'][0]> = [];

		for (const skill of this.all()) {
			if (skill.definition.tools) {
				tools.push(...skill.definition.tools);
			}
		}

		return tools;
	}

	/**
	 * Get all slash commands from all loaded skills
	 */
	getAllCommands(): Array<SkillInstance['definition']['commands'][0]> {
		const commands: Array<SkillInstance['definition']['commands'][0]> = [];

		for (const skill of this.all()) {
			if (skill.definition.commands) {
				commands.push(...skill.definition.commands);
			}
		}

		return commands;
	}

	/**
	 * Clear all loaded skills
	 */
	async clear(): Promise<void> {
		const skillIds = this.ids();

		for (const skillId of skillIds) {
			await this.unloadSkill(skillId);
		}
	}

	/**
	 * Get registry statistics
	 */
	getStats(): {
		totalLoaded: number;
		totalEnabled: number;
		categories: string[];
		tags: string[];
	} {
		const categories = new Set<string>();
		const tags = new Set<string>();

		for (const skill of this.all()) {
			if (skill.metadata.category) {
				categories.add(skill.metadata.category);
			}
			for (const tag of skill.metadata.tags) {
				tags.add(tag);
			}
		}

		return {
			totalLoaded: this.skills.size,
			totalEnabled: this.all().filter(s => s.metadata.enabled).length,
			categories: Array.from(categories).sort(),
			tags: Array.from(tags).sort(),
		};
	}

	/**
	 * Remove duplicate skills (project > global > built-in)
	 */
	private deduplicateSkills(skills: SkillMetadata[]): SkillMetadata[] {
		const skillMap = new Map<string, SkillMetadata>();

		// Sort by priority: project > global > built-in
		const sorted = [...skills].sort((a, b) => {
			const priority = (skill: SkillMetadata) => {
				if (skill.path.includes('.floyd/skills')) {
					// Project skills have highest priority
					return skill.path.startsWith(process.cwd())
						? 3
						: 2;
				}
				// Built-in skills have lowest priority
				return 1;
			};

			return priority(b) - priority(a);
		});

		// Add to map (higher priority skills overwrite lower priority)
		for (const skill of sorted) {
			skillMap.set(skill.id, skill);
		}

		return Array.from(skillMap.values());
	}
}

// ============================================================================
// DEFAULT REGISTRY INSTANCE
// ============================================================================

/**
 * Default global skill registry instance
 */
let defaultRegistry: SkillRegistry | null = null;

/**
 * Get or create the default registry
 */
export function getDefaultRegistry(options?: SkillRegistryOptions): SkillRegistry {
	if (!defaultRegistry) {
		defaultRegistry = new SkillRegistry(options);
	}
	return defaultRegistry;
}

/**
 * Reset the default registry (useful for testing)
 */
export function resetDefaultRegistry(): void {
	defaultRegistry = null;
}

export default SkillRegistry;
