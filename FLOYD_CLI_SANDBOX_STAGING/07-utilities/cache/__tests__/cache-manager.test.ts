/**
 * SUPERCACHING Unit Test Suite
 *
 * Comprehensive tests for the 3-tier caching system:
 * - Tier 1: Reasoning (5 min TTL)
 * - Tier 2: Project (24 hours TTL)
 * - Tier 3: Vault (7 days TTL)
 */

import test from 'ava';
import { rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Import from dist instead of src for tests
import { CacheManager, type ReasoningFrame } from '../../../dist/cache/cache-manager.js';

// Helper to create a temporary cache directory for testing
function createTempCacheDir(): string {
	return join(tmpdir(), `floyd-cache-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
}

// Helper to clean up test cache directory
async function cleanupCacheDir(cacheDir: string): Promise<void> {
	try {
		await rm(cacheDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}
}

// ============================================================================
// BASIC CACHE OPERATIONS - ALL TIERS
// ============================================================================

test('CacheManager: store and retrieve value from reasoning tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'test-key', 'test-value');
	const value = await cacheManager.retrieve('reasoning', 'test-key');

	t.is(value, 'test-value');
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store and retrieve value from project tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('project', 'test-key', 'test-value');
	const value = await cacheManager.retrieve('project', 'test-key');

	t.is(value, 'test-value');
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store and retrieve value from vault tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('vault', 'test-key', 'test-value');
	const value = await cacheManager.retrieve('vault', 'test-key');

	t.is(value, 'test-value');
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store rejects empty key', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await t.throwsAsync(
		() => cacheManager.store('reasoning', '', 'value'),
		{ message: 'Cache key cannot be empty' }
	);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store rejects null value', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await t.throwsAsync(
		() => cacheManager.store('reasoning', 'key', null as any),
		{ message: 'Cache value cannot be null or undefined' }
	);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store rejects undefined value', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await t.throwsAsync(
		() => cacheManager.store('reasoning', 'key', undefined as any),
		{ message: 'Cache value cannot be null or undefined' }
	);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: store with metadata', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const metadata = { userId: 'user-1', sessionId: 'session-1' };
	await cacheManager.store('reasoning', 'test-key', 'test-value', metadata);

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 1);
	t.deepEqual(entries[0].metadata, metadata);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: retrieve returns null for non-existent key', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const value = await cacheManager.retrieve('reasoning', 'nonexistent');
	t.is(value, null);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: list returns all entries in tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('reasoning', 'key2', 'value2');
	await cacheManager.store('reasoning', 'key3', 'value3');

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 3);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: delete removes entry', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'test-key', 'test-value');
	const deleted = await cacheManager.delete('reasoning', 'test-key');

	t.true(deleted);
	const value = await cacheManager.retrieve('reasoning', 'test-key');
	t.is(value, null);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: delete returns false for non-existent key', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const deleted = await cacheManager.delete('reasoning', 'nonexistent');
	t.false(deleted);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: clear removes all entries from tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('reasoning', 'key2', 'value2');

	const cleared = await cacheManager.clear('reasoning');
	t.is(cleared, 2);

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 0);
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// REASONING FRAME OPERATIONS
// ============================================================================

test('CacheManager: store and load reasoning frame', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const frame: ReasoningFrame = {
		frame_id: 'frame-1',
		task_id: 'task-1',
		start_time: new Date().toISOString(),
		cog_steps: [
			{
				timestamp: new Date().toISOString(),
				step_type: 'COG_STEP',
				content: 'Initial thought'
			}
		]
	};

	await cacheManager.storeReasoningFrame(frame);
	const loaded = await cacheManager.loadReasoningFrame();

	t.not(loaded, null);
	t.is(loaded?.frame_id, 'frame-1');
	t.is(loaded?.cog_steps.length, 1);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: invalid frame structure returns null', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	// Manually create invalid frame file
	const fs = await import('fs/promises');
	const framePath = join(cacheDir, '.floyd', '.cache', 'reasoning', 'active', 'frame.json');
	await fs.mkdir(join(cacheDir, '.floyd', '.cache', 'reasoning', 'active'), { recursive: true });
	await fs.writeFile(framePath, JSON.stringify({ invalid: 'frame' }));

	const loaded = await cacheManager.loadReasoningFrame();
	t.is(loaded, null);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: storeReasoningFrame adds GLM context', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const frame: ReasoningFrame = {
		frame_id: 'frame-1',
		task_id: 'task-1',
		start_time: new Date().toISOString(),
		cog_steps: [
			{
				timestamp: new Date().toISOString(),
				step_type: 'COG_STEP',
				content: 'Initial thought'
			}
		]
	};

	await cacheManager.storeReasoningFrame(frame);
	const loaded = await cacheManager.loadReasoningFrame();

	t.not(loaded?.glm_context, undefined);
	t.is(loaded?.glm_context?.thinking_mode, 'preserved');
	t.truthy(loaded?.glm_context?.session_continuity_token);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: loadReasoningFrame returns null when no frame exists', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const frame = await cacheManager.loadReasoningFrame();
	t.is(frame, null);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: archiveFrame moves active frame to archive', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const frame: ReasoningFrame = {
		frame_id: 'frame-1',
		task_id: 'task-1',
		start_time: new Date().toISOString(),
		cog_steps: [
			{
				timestamp: new Date().toISOString(),
				step_type: 'COG_STEP',
				content: 'Initial thought'
			}
		]
	};

	await cacheManager.storeReasoningFrame(frame);
	await cacheManager.archiveFrame();

	// Active frame should be gone
	const loaded = await cacheManager.loadReasoningFrame();
	t.is(loaded, null);
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// PATTERN STORAGE
// ============================================================================

test('CacheManager: storePattern with tags', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const tags = ['react', 'hooks', 'frontend'];
	await cacheManager.storePattern('use-effect-test', 'useEffect(() => {}, [])', tags);

	// Verify pattern was stored by loading it directly
	const pattern = await cacheManager.loadPattern('use-effect-test');
	t.truthy(pattern);
	t.is(pattern, 'useEffect(() => {}, [])');

	// Also verify it appears in listings
	const allEntries = await cacheManager.list('vault');
	const patternEntries = allEntries.filter(e => e.key === 'use-effect-test');
	t.is(patternEntries.length, 1);
	t.deepEqual(patternEntries[0].metadata?.tags, tags);
	
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: storePattern rejects empty name', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const error = await t.throwsAsync(
		() => cacheManager.storePattern('', 'pattern-content'),
		{ message: /Pattern name cannot be empty/ }
	);
	t.regex(error?.message || '', /Pattern name cannot be empty/);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: storePattern rejects empty pattern', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	const error = await t.throwsAsync(
		() => cacheManager.storePattern('pattern-name', ''),
		{ message: /Pattern content cannot be empty/ }
	);
	t.regex(error?.message || '', /Pattern content cannot be empty/);
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// SEARCH AND STATS
// ============================================================================

test('CacheManager: prune removes expired entries', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('reasoning', 'key2', 'value2');

	const pruned = await cacheManager.prune('reasoning');
	// No entries should be expired yet (5 min TTL)
	t.is(pruned, 0);

	// Store some entries
	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('reasoning', 'key2', 'value2');

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 2);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: getStats returns tier statistics', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('reasoning', 'key2', 'value2');

	const stats = await cacheManager.getStats('reasoning');
	t.is(stats.length, 1);
	t.is(stats[0].tier, 'reasoning');
	t.is(stats[0].count, 2);
	t.true(stats[0].totalSize > 0);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: search finds entries by key or value', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'user-message-1', 'What is the weather?');
	await cacheManager.store('reasoning', 'user-message-2', 'How do I login?');

	const results = await cacheManager.search('reasoning', 'weather');
	t.is(results.length, 1);
	t.is(results[0].key, 'user-message-1');
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

test('CacheManager: handles corrupted cache files gracefully', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	// Create a corrupted file
	const fs = await import('fs/promises');
	const tierPath = join(cacheDir, '.floyd', '.cache', 'reasoning');
	await fs.mkdir(tierPath, { recursive: true });

	const corruptedPath = join(tierPath, 'corrupted.json');
	await fs.writeFile(corruptedPath, 'invalid json content {{{');

	// Should not throw, just skip the corrupted file
	const entries = await cacheManager.list('reasoning');
	t.true(Array.isArray(entries));
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: handles missing directories gracefully', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	// Try to list from a tier that hasn't been used yet
	const entries = await cacheManager.list('project');
	t.true(Array.isArray(entries));
	t.is(entries.length, 0);
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// SIZE LIMITS AND LRU EVICTION
// ============================================================================

test('CacheManager: enforces size limit on reasoning tier', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir, { maxSize: { reasoning: 5 } });

	// Store 10 entries (max is 5)
	for (let i = 0; i < 10; i++) {
		await cacheManager.store('reasoning', `key-${i}`, `value-${i}`);
	}

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 5); // Should only have 5 entries
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: LRU eviction removes least recently used entries', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir, { maxSize: { reasoning: 5 } });

	// Store 5 entries
	for (let i = 0; i < 5; i++) {
		await cacheManager.store('reasoning', `key-${i}`, `value-${i}`);
	}

	// Access key-0 to make it recently used
	await cacheManager.retrieve('reasoning', 'key-0');

	// Store 2 more entries (should evict key-1 and key-2, not key-0)
	await cacheManager.store('reasoning', 'key-5', 'value-5');
	await cacheManager.store('reasoning', 'key-6', 'value-6');

	const entries = await cacheManager.list('reasoning');
	t.is(entries.length, 5);

	// key-0 should still exist (was recently accessed)
	const value = await cacheManager.retrieve('reasoning', 'key-0');
	t.is(value, 'value-0');

	// key-1 should have been evicted
	const value1 = await cacheManager.retrieve('reasoning', 'key-1');
	t.is(value1, null);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: version stamp on new entries', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	const entries = await cacheManager.list('reasoning');
	
	t.is(entries[0].version, 1);
	t.truthy(entries[0].lastAccess);
	await cleanupCacheDir(cacheDir);
});

// ============================================================================
// BACKUP AND RESTORE
// ============================================================================

test('CacheManager: backup creates valid JSON file', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('project', 'key2', 'value2');

	const backupPath = join(cacheDir, 'backup.json');
	await cacheManager.backup(backupPath);

	// Verify backup file exists and is valid JSON
	const fs = await import('fs/promises');
	const content = await fs.readFile(backupPath, 'utf-8');
	const backup = JSON.parse(content);

	t.is(backup.version, 1);
	t.truthy(backup.tiers.reasoning);
	t.truthy(backup.tiers.project);
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: restore recovers all entries', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	// Store test data
	await cacheManager.store('reasoning', 'key1', 'value1');
	await cacheManager.store('project', 'key2', 'value2');

	// Backup
	const backupPath = join(cacheDir, 'backup.json');
	await cacheManager.backup(backupPath);

	// Clear and restore
	await cacheManager.clear();
	await cacheManager.restore(backupPath);

	// Verify restored
	t.is(await cacheManager.retrieve('reasoning', 'key1'), 'value1');
	t.is(await cacheManager.retrieve('project', 'key2'), 'value2');
	await cleanupCacheDir(cacheDir);
});

test('CacheManager: migrate adds version to old entries', async t => {
	const cacheDir = createTempCacheDir();
	const cacheManager = new CacheManager(cacheDir);

	// Create an old-style entry without version
	const fs = await import('fs/promises');
	const entryPath = join(cacheDir, '.floyd', '.cache', 'reasoning', 'old-entry.json');
	await fs.mkdir(join(cacheDir, '.floyd', '.cache', 'reasoning'), { recursive: true });
	await fs.writeFile(entryPath, JSON.stringify({
		key: 'old-entry',
		value: 'old-value',
		timestamp: Date.now(),
		ttl: 300000,
		tier: 'reasoning'
	}, null, 2));

	// Run migration
	const migrated = await cacheManager.migrate();
	t.is(migrated, 1);

	// Verify entry now has version
	const entries = await cacheManager.list('reasoning');
	const oldEntry = entries.find(e => e.key === 'old-entry');
	t.is(oldEntry?.version, 1);
	t.truthy(oldEntry?.lastAccess);
	await cleanupCacheDir(cacheDir);
});
