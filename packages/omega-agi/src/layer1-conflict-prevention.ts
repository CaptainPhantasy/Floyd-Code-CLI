/**
 * OMEGA AGI - Layer 1: Conflict Prevention
 * 
 * Implements atomic file locking via SUPERCACHE to prevent multiple agents
 * from editing the same file simultaneously.
 * 
 * Research basis: Hivemind Orchestrator Level 1
 * Power level: ⚡⚡⚡⚡⚡⚡
 */

export interface FileLock {
  file: string;
  lock_id: string;
  agent_id: string;
  acquired_at: number;
  ttl: number;  // Milliseconds until auto-release
}

export interface LockResult {
  success: boolean;
  lock?: FileLock;
  reason?: string;
  holder?: string;  // If locked, who holds it
}

/**
 * ConflictPrevention - Atomic file locking via SUPERCACHE
 * 
 * Prevents multiple agents from editing same file simultaneously.
 * Uses SUPERCACHE reasoning tier for short-lived locks with TTL.
 */
export class ConflictPrevention {
  private readonly DEFAULT_TTL = 300_000;  // 5 minutes
  private readonly LOCK_PREFIX = 'lock:file:';
  
  constructor(
    private cache: SupercacheClient,
    private options: {
      defaultTTL?: number;
      autoRefresh?: boolean;  // Auto-refresh locks while agent working
      heartbeatInterval?: number;
    } = {}
  ) {}
  
  /**
   * Acquire exclusive lock on a file
   * Returns true if lock acquired, false if already locked by another agent
   */
  async acquireLock(
    file: string,
    agent_id: string,
    ttl?: number
  ): Promise<LockResult> {
    const lock_key = this.getLockKey(file);
    const lock_ttl = ttl || this.options.defaultTTL || this.DEFAULT_TTL;
    
    // Check if already locked
    const existing = await this.cache.retrieve({
      tier: 'reasoning',
      key: lock_key
    });
    
    if (existing && existing.found) {
      const existingLock: FileLock = JSON.parse(existing.value);
      
      // Check if lock expired (shouldn't happen due to TTL, but defensive)
      const age = Date.now() - existingLock.acquired_at;
      if (age < existingLock.ttl) {
        // Still held by another agent
        return {
          success: false,
          reason: 'File locked by another agent',
          holder: existingLock.agent_id
        };
      }
    }
    
    // Acquire lock (atomic operation via SUPERCACHE)
    const lock: FileLock = {
      file,
      lock_id: this.generateLockId(),
      agent_id,
      acquired_at: Date.now(),
      ttl: lock_ttl
    };
    
    try {
      await this.cache.store({
        tier: 'reasoning',
        key: lock_key,
        value: JSON.stringify(lock),
        metadata: {
          expires_in: Math.floor(lock_ttl / 1000),  // Convert to seconds
          agent_id,
          file
        }
      });
      
      return {
        success: true,
        lock
      };
    } catch (error) {
      return {
        success: false,
        reason: `Failed to acquire lock: ${error}`
      };
    }
  }
  
  /**
   * Release lock on a file
   * Only succeeds if called by the lock holder
   */
  async releaseLock(file: string, agent_id: string): Promise<boolean> {
    const lock_key = this.getLockKey(file);
    
    // Verify ownership before releasing
    const existing = await this.cache.retrieve({
      tier: 'reasoning',
      key: lock_key
    });
    
    if (!existing || !existing.found) {
      return false;  // No lock to release
    }
    
    const lock: FileLock = JSON.parse(existing.value);
    
    if (lock.agent_id !== agent_id) {
      throw new Error(
        `Cannot release lock held by ${lock.agent_id} (caller: ${agent_id})`
      );
    }
    
    // Release lock
    await this.cache.delete({
      tier: 'reasoning',
      key: lock_key
    });
    
    return true;
  }
  
  /**
   * Check if file is locked
   */
  async isLocked(file: string): Promise<{ locked: boolean; holder?: string }> {
    const lock_key = this.getLockKey(file);
    const existing = await this.cache.retrieve({
      tier: 'reasoning',
      key: lock_key
    });
    
    if (!existing || !existing.found) {
      return { locked: false };
    }
    
    const lock: FileLock = JSON.parse(existing.value);
    return {
      locked: true,
      holder: lock.agent_id
    };
  }
  
  /**
   * Acquire multiple file locks atomically
   * Either all locks acquired or none (transaction semantics)
   */
  async acquireMultipleLocks(
    files: string[],
    agent_id: string,
    ttl?: number
  ): Promise<LockResult> {
    const acquired: string[] = [];
    
    try {
      // Try to acquire all locks
      for (const file of files) {
        const result = await this.acquireLock(file, agent_id, ttl);
        
        if (!result.success) {
          // Rollback - release all acquired locks
          for (const acquiredFile of acquired) {
            await this.releaseLock(acquiredFile, agent_id);
          }
          
          return {
            success: false,
            reason: `Failed to acquire lock on ${file}: ${result.reason}`,
            holder: result.holder
          };
        }
        
        acquired.push(file);
      }
      
      // All locks acquired successfully
      return {
        success: true,
        lock: {
          file: files.join(', '),
          lock_id: this.generateLockId(),
          agent_id,
          acquired_at: Date.now(),
          ttl: ttl || this.DEFAULT_TTL
        }
      };
    } catch (error) {
      // Rollback on any error
      for (const acquiredFile of acquired) {
        await this.releaseLock(acquiredFile, agent_id).catch(() => {});
      }
      
      throw error;
    }
  }
  
  /**
   * Refresh lock TTL (extend lease)
   */
  async refreshLock(file: string, agent_id: string, additionalTTL?: number): Promise<boolean> {
    const lock_key = this.getLockKey(file);
    const existing = await this.cache.retrieve({
      tier: 'reasoning',
      key: lock_key
    });
    
    if (!existing || !existing.found) {
      return false;
    }
    
    const lock: FileLock = JSON.parse(existing.value);
    
    if (lock.agent_id !== agent_id) {
      throw new Error('Cannot refresh lock held by another agent');
    }
    
    // Update with new TTL
    lock.ttl = additionalTTL || this.DEFAULT_TTL;
    lock.acquired_at = Date.now();  // Reset timer
    
    await this.cache.store({
      tier: 'reasoning',
      key: lock_key,
      value: JSON.stringify(lock),
      metadata: {
        expires_in: Math.floor(lock.ttl / 1000),
        agent_id,
        file
      }
    });
    
    return true;
  }
  
  /**
   * List all active locks
   */
  async listLocks(): Promise<FileLock[]> {
    const allLocks = await this.cache.list({ tier: 'reasoning' });
    
    const locks: FileLock[] = [];
    
    for (const entry of allLocks.entries) {
      if (entry.key.startsWith(this.LOCK_PREFIX)) {
        try {
          const lock: FileLock = JSON.parse(entry.value || '{}');
          locks.push(lock);
        } catch {
          // Skip invalid lock entries
        }
      }
    }
    
    return locks;
  }
  
  /**
   * Cleanup expired locks (defensive - TTL should handle this)
   */
  async cleanupExpiredLocks(): Promise<number> {
    const locks = await this.listLocks();
    let cleaned = 0;
    
    for (const lock of locks) {
      const age = Date.now() - lock.acquired_at;
      if (age >= lock.ttl) {
        await this.cache.delete({
          tier: 'reasoning',
          key: this.getLockKey(lock.file)
        });
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  private getLockKey(file: string): string {
    return `${this.LOCK_PREFIX}${file}`;
  }
  
  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Helper interface for SUPERCACHE client
 * (Would use actual floyd-supercache MCP client in production)
 */
interface SupercacheClient {
  store(params: {
    tier: 'reasoning' | 'project' | 'vault';
    key: string;
    value: string;
    metadata?: any;
  }): Promise<{success: boolean}>;
  
  retrieve(params: {
    tier: 'reasoning' | 'project' | 'vault';
    key: string;
  }): Promise<{found: boolean; value?: string}>;
  
  delete(params: {
    tier: 'reasoning' | 'project' | 'vault';
    key: string;
  }): Promise<void>;
  
  list(params: {
    tier: 'reasoning' | 'project' | 'vault';
  }): Promise<{count: number; entries: Array<{key: string; value?: string}>}>;
}
