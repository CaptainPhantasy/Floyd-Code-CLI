// SUPERCACHE - 3-Tier Caching System for FLOYD (Web Port)
// Tier 1: Reasoning - Current conversation (5 min TTL)
// Tier 2: Project - Project context (24 hours TTL)
// Tier 3: Vault - Reusable wisdom (7 days TTL)
import fs from 'fs/promises';
import path from 'path';
const TTL_CONFIG = {
    reasoning: 5 * 60 * 1000, // 5 minutes
    project: 24 * 60 * 60 * 1000, // 24 hours
    vault: 7 * 24 * 60 * 60 * 1000, // 7 days
};
const SIZE_LIMITS = {
    reasoning: 100,
    project: 500,
    vault: 1000,
};
const CACHE_VERSION = 1;
export class CacheManager {
    cacheRoot;
    tiers = ['reasoning', 'project', 'vault'];
    constructor(dataDir) {
        this.cacheRoot = path.join(dataDir, '.cache');
    }
    getTierPath(tier) {
        return path.join(this.cacheRoot, tier);
    }
    getEntryPath(tier, key) {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.getTierPath(tier), `${safeKey}.json`);
    }
    async store(tier, key, value, metadata) {
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            lastAccess: Date.now(),
            ttl: TTL_CONFIG[tier],
            tier,
            metadata,
            version: CACHE_VERSION,
        };
        const tierPath = this.getTierPath(tier);
        await fs.mkdir(tierPath, { recursive: true });
        await fs.writeFile(this.getEntryPath(tier, key), JSON.stringify(entry, null, 2));
        await this.enforceSizeLimit(tier);
    }
    async retrieve(tier, key) {
        const entryPath = this.getEntryPath(tier, key);
        try {
            const content = await fs.readFile(entryPath, 'utf-8');
            const entry = JSON.parse(content);
            const now = Date.now();
            if (now - entry.timestamp > entry.ttl) {
                await this.delete(tier, key);
                return null;
            }
            entry.lastAccess = now;
            await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
            return entry.value;
        }
        catch {
            return null;
        }
    }
    async delete(tier, key) {
        try {
            await fs.unlink(this.getEntryPath(tier, key));
            return true;
        }
        catch {
            return false;
        }
    }
    async list(tier) {
        const tierPath = this.getTierPath(tier);
        const entries = [];
        try {
            const files = await fs.readdir(tierPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(tierPath, file), 'utf-8');
                    const entry = JSON.parse(content);
                    if (Date.now() - entry.timestamp <= entry.ttl) {
                        entries.push(entry);
                    }
                }
            }
        }
        catch { }
        return entries.sort((a, b) => b.timestamp - a.timestamp);
    }
    async search(tier, query) {
        const all = await this.list(tier);
        const q = query.toLowerCase();
        return all.filter(e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q));
    }
    async enforceSizeLimit(tier) {
        const entries = await this.list(tier);
        const limit = SIZE_LIMITS[tier];
        if (entries.length <= limit)
            return;
        const toRemove = entries
            .sort((a, b) => (a.lastAccess || a.timestamp) - (b.lastAccess || b.timestamp))
            .slice(0, entries.length - limit);
        for (const entry of toRemove) {
            await this.delete(tier, entry.key);
        }
    }
}
