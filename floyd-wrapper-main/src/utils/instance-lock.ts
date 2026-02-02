/**
 * Instance Lock - Floyd Wrapper
 *
 * Prevents multiple Floyd instances from running concurrently on the same project.
 * Uses PID-based lock file in .floyd/ directory.
 *
 * FIX #6: Add Instance Lock (MEDIUM PRIORITY)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { logger } from './logger.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Lock file content structure
 */
interface LockFileContent {
  /** Process ID of the instance holding the lock */
  pid: number;
  /** Timestamp when lock was acquired */
  timestamp: string;
  /** Hostname where lock was acquired */
  hostname: string;
  /** Platform where lock was acquired */
  platform: string;
}

/**
 * Result of lock acquisition attempt
 */
interface LockResult {
  /** Whether lock was acquired */
  success: boolean;
  /** Error message if lock failed */
  error?: string;
  /** PID of existing instance if lock exists */
  existingPid?: number;
}

// ============================================================================
// Instance Lock Class
// ============================================================================

/**
 * Manages instance locking to prevent multiple Floyd instances
 */
export class InstanceLock {
  private lockFilePath: string;
  private ourPid: number;
  private locked: boolean = false;
  private cleanupRegistered: boolean = false;

  constructor(projectRoot: string) {
    this.lockFilePath = path.join(projectRoot, '.floyd', 'lock');
    this.ourPid = process.pid;
  }

  /**
   * Attempt to acquire the instance lock
   *
   * @param force - If true, override existing lock
   * @returns Lock result with success status and error details
   */
  acquire(force: boolean = false): LockResult {
    // Ensure .floyd directory exists
    const lockDir = path.dirname(this.lockFilePath);
    if (!fs.existsSync(lockDir)) {
      try {
        fs.mkdirSync(lockDir, { recursive: true });
      } catch (error) {
        logger.error(`Failed to create .floyd directory: ${error}`);
        return {
          success: false,
          error: `Failed to create .floyd directory: ${error}`,
        };
      }
    }

    // Check if lock file exists
    if (fs.existsSync(this.lockFilePath)) {
      if (!force) {
        const existing = this.readLockFile();
        if (existing) {
          const isAlive = this.isProcessAlive(existing.pid);
          if (isAlive) {
            logger.warn(
              `Floyd instance already running (PID: ${existing.pid}) on ${existing.hostname}`
            );
            return {
              success: false,
              error: `Floyd is already running (PID: ${existing.pid})${existing.pid !== this.ourPid ? ` on ${existing.hostname}` : ''}\nUse --force to override`,
              existingPid: existing.pid,
            };
          } else {
            // Lock file exists but process is dead - clean it up
            logger.debug(`Cleaning up stale lock file from PID ${existing.pid}`);
            try {
              fs.unlinkSync(this.lockFilePath);
            } catch (error) {
              logger.warn(`Failed to remove stale lock file: ${error}`);
            }
          }
        }
      } else {
        // Force mode - remove existing lock
        logger.debug('Force mode: removing existing lock file');
        try {
          fs.unlinkSync(this.lockFilePath);
        } catch (error) {
          logger.warn(`Failed to remove lock file for force override: ${error}`);
        }
      }
    }

    // Create new lock file
    const lockContent: LockFileContent = {
      pid: this.ourPid,
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      platform: os.platform(),
    };

    try {
      fs.writeFileSync(this.lockFilePath, JSON.stringify(lockContent, null, 2), 'utf-8');
      this.locked = true;
      logger.debug(`Instance lock acquired: PID ${this.ourPid}`);

      // Register cleanup handlers once
      if (!this.cleanupRegistered) {
        this.registerCleanup();
        this.cleanupRegistered = true;
      }

      return { success: true };
    } catch (error) {
      logger.error(`Failed to create lock file: ${error}`);
      return {
        success: false,
        error: `Failed to create lock file: ${error}`,
      };
    }
  }

  /**
   * Release the instance lock
   */
  release(): void {
    if (!this.locked) {
      return; // Nothing to release
    }

    try {
      if (fs.existsSync(this.lockFilePath)) {
        const existing = this.readLockFile();
        // Only remove if we own the lock
        if (existing && existing.pid === this.ourPid) {
          fs.unlinkSync(this.lockFilePath);
          logger.debug('Instance lock released');
        }
      }
    } catch (error) {
      logger.warn(`Failed to remove lock file: ${error}`);
    } finally {
      this.locked = false;
    }
  }

  /**
   * Read and parse the lock file
   *
   * @returns Parsed lock content or null if invalid/missing
   */
  private readLockFile(): LockFileContent | null {
    try {
      const content = fs.readFileSync(this.lockFilePath, 'utf-8');
      return JSON.parse(content) as LockFileContent;
    } catch (error) {
      logger.warn(`Failed to read lock file: ${error}`);
      return null;
    }
  }

  /**
   * Check if a process is alive
   *
   * @param pid - Process ID to check
   * @returns true if process is running, false otherwise
   */
  private isProcessAlive(pid: number): boolean {
    try {
      // Send signal 0 to check if process exists
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register cleanup handlers for process exit
   */
  private registerCleanup(): void {
    // Register cleanup on exit
    const cleanup = () => this.release();

    // Handle various exit signals
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught exception: ${error}`);
      cleanup();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled rejection: ${reason}`);
      cleanup();
      process.exit(1);
    });
  }

  /**
   * Get the lock file path
   */
  getLockPath(): string {
    return this.lockFilePath;
  }

  /**
   * Check if we currently hold the lock
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get info about existing lock (if any)
   *
   * @returns Lock file content or null if no lock exists
   */
  getExistingLockInfo(): LockFileContent | null {
    if (!fs.existsSync(this.lockFilePath)) {
      return null;
    }
    return this.readLockFile();
  }
}

// ============================================================================
// Global Instance Lock Factory
// ============================================================================

/**
 * Create an instance lock for the given project root
 *
 * @param projectRoot - Root directory of the project
 * @returns InstanceLock instance
 */
export function createInstanceLock(projectRoot: string): InstanceLock {
  return new InstanceLock(projectRoot);
}
