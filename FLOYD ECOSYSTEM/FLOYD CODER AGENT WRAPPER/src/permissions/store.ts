/**
 * Permission Store
 *
 * Persistent store for permission decisions.
 * Saves to .floyd/permissions.json
 */

import fs from 'fs-extra';
import path from 'path';
import {
	PermissionPolicy,
	PermissionRule,
	PermissionDecision,
	PermissionScope,
	DEFAULT_POLICIES,
	cleanExpiredRules,
	mergeRule,
	createPermissionRule,
} from './policies.js';

const PERMISSIONS_FILE_VERSION = '1.0.0';

export interface PermissionsFile {
	version: string;
	decisions: Record<string, PermissionRule>;
	rememberUntil: 'session' | 'forever';
	updatedAt: number;
}

export class PermissionStore {
	private filePath: string;
	private policies: PermissionPolicy;
	private loaded = false;

	constructor(cwd: string = process.cwd()) {
		this.filePath = path.join(cwd, '.floyd', 'permissions.json');
		this.policies = DEFAULT_POLICIES;
	}

	/**
	 * Load permissions from disk
	 */
	async load(): Promise<PermissionPolicy> {
		try {
			if (await fs.pathExists(this.filePath)) {
				const data = (await fs.readJson(this.filePath)) as PermissionsFile;

				// Check version compatibility
				if (data.version !== PERMISSIONS_FILE_VERSION) {
					console.warn(
						`Permissions file version ${data.version} differs from expected ${PERMISSIONS_FILE_VERSION}`,
					);
				}

				// Convert old format to new format if needed
				const rules = Object.values(data.decisions || {});

				this.policies = {
					rules: cleanExpiredRules({
						rules,
						defaultBehavior: 'ask',
						rememberUntil: 'session',
					}).rules,
					defaultBehavior: 'ask',
					rememberUntil: data.rememberUntil || 'session',
				};
			} else {
				// Ensure directory exists
				await fs.ensureDir(path.dirname(this.filePath));
				this.policies = DEFAULT_POLICIES;
			}
		} catch (error) {
			console.error('Failed to load permissions:', error);
			this.policies = DEFAULT_POLICIES;
		}

		this.loaded = true;
		return this.policies;
	}

	/**
	 * Save permissions to disk
	 */
	async save(): Promise<void> {
		try {
			await fs.ensureDir(path.dirname(this.filePath));

			// Clean expired rules before saving
			this.policies = cleanExpiredRules(this.policies);

			const data: PermissionsFile = {
				version: PERMISSIONS_FILE_VERSION,
				decisions: {},
				rememberUntil: this.policies.rememberUntil,
				updatedAt: Date.now(),
			};

			// Convert rules to record
			for (const rule of this.policies.rules) {
				const key = `${rule.toolName}:${rule.decision}:${rule.scope}`;
				data.decisions[key] = rule;
			}

			await fs.writeJson(this.filePath, data, {spaces: 2});
		} catch (error) {
			console.error('Failed to save permissions:', error);
			throw error;
		}
	}

	/**
	 * Get the current policies (loading if necessary)
	 */
	async getPolicies(): Promise<PermissionPolicy> {
		if (!this.loaded) {
			await this.load();
		}
		return this.policies;
	}

	/**
	 * Check if a tool has a stored permission decision
	 */
	async checkPermission(toolName: string): Promise<PermissionDecision | null> {
		const policies = await this.getPolicies();

		// Find valid rule for this tool
		const validRule = policies.rules.find(
			rule =>
				rule.toolName === toolName &&
				rule.expiresAt !== undefined &&
				rule.expiresAt > Date.now(),
		);

		if (validRule) {
			return validRule.decision;
		}

		return null;
	}

	/**
	 * Record a permission decision
	 */
	async recordDecision(
		toolName: string,
		decision: PermissionDecision,
		scope: PermissionScope,
	): Promise<void> {
		const policies = await this.getPolicies();
		const rule = createPermissionRule(
			toolName,
			decision,
			scope,
			policies.rememberUntil,
		);
		this.policies = mergeRule(policies, rule);
		await this.save();
	}

	/**
	 * Clear all permission decisions
	 */
	async clearAll(): Promise<void> {
		this.policies = DEFAULT_POLICIES;
		await this.save();
	}

	/**
	 * Clear decision for a specific tool
	 */
	async clearTool(toolName: string): Promise<void> {
		const policies = await this.getPolicies();
		this.policies = {
			...policies,
			rules: policies.rules.filter(rule => rule.toolName !== toolName),
		};
		await this.save();
	}

	/**
	 * Get all stored rules
	 */
	async getAllRules(): Promise<PermissionRule[]> {
		const policies = await this.getPolicies();
		return [...policies.rules];
	}

	/**
	 * Set the remember until policy
	 */
	async setRememberUntil(value: 'session' | 'forever'): Promise<void> {
		const policies = await this.getPolicies();
		this.policies = {
			...policies,
			rememberUntil: value,
		};
		await this.save();
	}

	/**
	 * Get the remember until policy
	 */
	async getRememberUntil(): Promise<'session' | 'forever'> {
		const policies = await this.getPolicies();
		return policies.rememberUntil;
	}

	/**
	 * Import rules from an object (useful for migration)
	 */
	async importRules(rules: PermissionRule[]): Promise<void> {
		let policies = await this.getPolicies();
		for (const rule of rules) {
			policies = mergeRule(policies, rule);
		}
		this.policies = policies;
		await this.save();
	}

	/**
	 * Export rules as an object
	 */
	async exportRules(): Promise<PermissionRule[]> {
		const policies = await this.getPolicies();
		return [...policies.rules];
	}
}
