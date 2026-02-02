/**
 * Permission Store
 *
 * Persistent storage for permission decisions.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.3
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import type { PermissionDecision, PermissionScope } from './policies.js';

/**
 * Stored permission entry
 */
export interface StoredPermission {
  /** Tool name */
  toolName: string;
  /** Decision */
  decision: PermissionDecision;
  /** Scope */
  scope: PermissionScope;
  /** Timestamp when stored */
  timestamp: number;
  /** Expiry timestamp (for session scope) */
  expiresAt?: number;
  /** Reason for the decision */
  reason?: string;
}

/**
 * Permission store data structure
 */
interface PermissionStoreData {
  /** Store version */
  version: string;
  /** Session ID */
  sessionId: string;
  /** Permissions by tool name */
  permissions: Record<string, StoredPermission>;
}

/**
 * PermissionStore - Persists permission decisions
 *
 * Supports session-scoped and forever-scoped permissions.
 */
export class PermissionStore {
  private data: PermissionStoreData;
  private storePath: string;
  private sessionId: string;
  private loaded: boolean = false;

  constructor(cwd: string, sessionId?: string) {
    this.sessionId = sessionId ?? `session-${Date.now()}`;
    this.storePath = path.join(cwd, '.floyd', 'permissions.json');
    this.data = this.createEmptyData();
  }

  /**
   * Create empty store data
   */
  private createEmptyData(): PermissionStoreData {
    return {
      version: '1.0.0',
      sessionId: this.sessionId,
      permissions: {},
    };
  }

  /**
   * Load store from disk
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    if (existsSync(this.storePath)) {
      try {
        const content = await fs.readFile(this.storePath, 'utf-8');
        const loaded = JSON.parse(content) as PermissionStoreData;

        // Filter out expired session permissions from different sessions
        const now = Date.now();
        const filtered: Record<string, StoredPermission> = {};

        for (const [key, perm] of Object.entries(loaded.permissions)) {
          // Keep forever permissions
          if (perm.scope === 'forever') {
            filtered[key] = perm;
          }
          // Keep session permissions from current session that haven't expired
          else if (perm.scope === 'session') {
            if (loaded.sessionId === this.sessionId && (!perm.expiresAt || perm.expiresAt > now)) {
              filtered[key] = perm;
            }
          }
          // Once permissions are not persisted
        }

        this.data = {
          version: loaded.version,
          sessionId: this.sessionId,
          permissions: filtered,
        };
      } catch {
        // Start fresh on parse error
        this.data = this.createEmptyData();
      }
    }

    this.loaded = true;
  }

  /**
   * Save store to disk
   */
  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    await fs.writeFile(this.storePath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Check permission for a tool
   */
  async checkPermission(toolName: string): Promise<PermissionDecision | null> {
    await this.load();

    const stored = this.data.permissions[toolName];
    if (!stored) return null;

    // Check expiry
    if (stored.expiresAt && stored.expiresAt < Date.now()) {
      delete this.data.permissions[toolName];
      await this.save();
      return null;
    }

    return stored.decision;
  }

  /**
   * Record a permission decision
   */
  async recordDecision(
    toolName: string,
    decision: PermissionDecision,
    scope: PermissionScope,
    reason?: string
  ): Promise<void> {
    await this.load();

    // Don't store 'once' decisions
    if (scope === 'once') return;

    const stored: StoredPermission = {
      toolName,
      decision,
      scope,
      timestamp: Date.now(),
      reason,
    };

    // Session scope expires after 24 hours by default
    if (scope === 'session') {
      stored.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    this.data.permissions[toolName] = stored;
    await this.save();
  }

  /**
   * Remove a stored permission
   */
  async removePermission(toolName: string): Promise<void> {
    await this.load();
    delete this.data.permissions[toolName];
    await this.save();
  }

  /**
   * Clear all permissions
   */
  async clearAll(): Promise<void> {
    this.data = this.createEmptyData();
    await this.save();
  }

  /**
   * Clear session permissions only
   */
  async clearSession(): Promise<void> {
    await this.load();

    const filtered: Record<string, StoredPermission> = {};
    for (const [key, perm] of Object.entries(this.data.permissions)) {
      if (perm.scope === 'forever') {
        filtered[key] = perm;
      }
    }

    this.data.permissions = filtered;
    await this.save();
  }

  /**
   * Get all stored permissions
   */
  async getAllPermissions(): Promise<StoredPermission[]> {
    await this.load();
    return Object.values(this.data.permissions);
  }

  /**
   * Get permissions by scope
   */
  async getPermissionsByScope(scope: PermissionScope): Promise<StoredPermission[]> {
    await this.load();
    return Object.values(this.data.permissions).filter(p => p.scope === scope);
  }

  /**
   * Check if tool has stored permission
   */
  async hasPermission(toolName: string): Promise<boolean> {
    const decision = await this.checkPermission(toolName);
    return decision !== null;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Create new session (clears session permissions)
   */
  async newSession(): Promise<void> {
    this.sessionId = `session-${Date.now()}`;
    await this.clearSession();
  }
}

/**
 * Create a permission store for a working directory
 */
export function createPermissionStore(cwd: string, sessionId?: string): PermissionStore {
  return new PermissionStore(cwd, sessionId);
}
