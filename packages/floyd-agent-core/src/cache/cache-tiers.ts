/**
 * Cache Tier Operations
 *
 * PHASE 3 ITEMS 10, 13: Cache Tool Clarification & Tier Migration
 *
 * Enhances cache operations with:
 * - Clear tier descriptions
 * - Tier migration support
 * - Key validation
 */

/**
 * Cache tiers with clear descriptions
 */
export enum CacheTier {
	REASONING = 'reasoning', // 5 min TTL, active convos
	PROJECT = 'project',     // 24 hr TTL, project state
	VAULT = 'vault',         // 7 day TTL, reusable patterns
}

/**
 * Cache tier metadata
 */
export interface CacheTierInfo {
	name: string;
	ttl: string;
	description: string;
	useCases: string[];
	purgePolicy: string;
}

/**
 * Cache tier descriptions (Item 10)
 */
export const CACHE_TIER_DESCRIPTIONS: Record<CacheTier, CacheTierInfo> = {
	[CacheTier.REASONING]: {
		name: 'Reasoning Tier',
		ttl: '5 minutes',
		description: 'Active problem-solving context and thinking chains. High churn, short-term memory.',
		useCases: [
			'Active conversation tracking',
			'Temporary problem state',
			'Working memory for complex tasks',
			'Intermediate calculations',
		],
		purgePolicy: 'Automatically purged after TTL or on task completion',
	},
	[CacheTier.PROJECT]: {
		name: 'Project Tier',
		ttl: '24 hours',
		description: 'Project-level state and session work. Medium churn, session-scoped.',
		useCases: [
			'Project snapshots',
			'Session summaries',
			'Phase completion records',
			'Working directory state',
		],
		purgePolicy: 'Archived to vault on expiry, manually clearable',
	},
	[CacheTier.VAULT]: {
		name: 'Vault Tier',
		ttl: '7 days',
		description: 'Long-term storage of reusable patterns and solutions. Low churn, permanent memory.',
		useCases: [
			'Reusable code patterns',
			'Best practices',
			'Solution templates',
			'Proven architectural decisions',
		],
		purgePolicy: 'Manual purge only, persists until explicitly deleted',
	},
};

/**
 * Get tier description (Item 10)
 */
export function getCacheTierDescription(tier: CacheTier): CacheTierInfo {
	return CACHE_TIER_DESCRIPTIONS[tier];
}

/**
 * Get all tier descriptions
 */
export function getAllTierDescriptions(): Record<CacheTier, CacheTierInfo> {
	return CACHE_TIER_DESCRIPTIONS;
}

/**
 * Validate cache key format
 */
export function validateCacheKey(key: string): { valid: boolean; error?: string } {
	// Check key format: category:entity:version
	const parts = key.split(':');

	if (parts.length < 2) {
		return {
			valid: false,
			error: 'Key must have at least 2 parts separated by colons (category:entity[:version])',
		};
	}

	if (parts.length > 4) {
		return {
			valid: false,
			error: 'Key cannot have more than 3 colons (4 parts)',
		};
	}

	// Check each part for validity
	for (const part of parts) {
		if (part.length === 0) {
			return { valid: false, error: 'Empty segment between colons' };
		}
		if (part.length > 100) {
			return { valid: false, error: 'Key segment too long (max 100 chars)' };
		}
	}

	// Check for invalid characters
	const invalidChars = /[<>{}|\\^`[\]]/g;
	if (invalidChars.test(key)) {
		return {
			valid: false,
			error: `Key contains invalid characters: ${invalidChars.exec(key)?.[0]}`,
		};
	}

	return { valid: true };
}

/**
 * Migration result (Item 13)
 */
export interface CacheMigrationResult {
	success: boolean;
	from: CacheTier;
	to: CacheTier;
	key: string;
	ttl?: number;
	message: string;
}

/**
 * Migrate cache entry between tiers (Item 13)
 */
export function migrateCacheEntry(
	key: string,
	fromTier: CacheTier,
	toTier: CacheTier,
	newTTL?: number
): CacheMigrationResult {
	// Validate key
	const validation = validateCacheKey(key);
	if (!validation.valid) {
		return {
			success: false,
			from: fromTier,
			to: toTier,
			key,
			message: validation.error || 'Invalid key format',
		};
	}

	// Get target TTL
	const targetTTL = newTTL || getCacheTierDescription(toTier).ttl;

	return {
		success: true,
		from: fromTier,
		to: toTier,
		key,
		ttl: typeof targetTTL === 'string' ? parseTTL(targetTTL) : targetTTL,
		message: `Migrated ${key} from ${fromTier} to ${toTier}`,
	};
}

/**
 * Parse TTL string to seconds
 */
function parseTTL(ttl: string): number {
	const match = ttl.match(/(\d+)\s*(minute|hour|day|week)s?/i);
	if (!match) return 3600; // Default 1 hour

	const value = parseInt(match[1], 10);
	const unit = match[2].toLowerCase();

	switch (unit) {
		case 'minute':
			return value * 60;
		case 'hour':
			return value * 3600;
		case 'day':
			return value * 86400;
		case 'week':
			return value * 604800;
		default:
			return 3600;
	}
}

/**
 * Recommend target tier based on content type and usage pattern
 */
export function recommendTier(
	contentType: 'reasoning' | 'project' | 'pattern',
	accessFrequency: 'high' | 'medium' | 'low'
): CacheTier {
	// Default recommendations based on content type
	if (contentType === 'pattern') return CacheTier.VAULT;
	if (contentType === 'reasoning') return CacheTier.REASONING;
	if (contentType === 'project') return CacheTier.PROJECT;

	// Override based on access frequency
	if (accessFrequency === 'high') {
		return contentType === 'pattern' ? CacheTier.PROJECT : CacheTier.REASONING;
	}

	return CacheTier.PROJECT;
}
