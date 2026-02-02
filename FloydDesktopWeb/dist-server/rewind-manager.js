/**
 * Rewind Manager - Floyd DesktopWeb
 *
 * Provides checkpoint and rewind functionality via REST API.
 * Uses the same checkpoint format as TUI REBUILD.
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';

// ============================================================================
// TYPES
// ============================================================================

export interface FileSnapshot {
  path: string;
  content: string;
  size: number;
  hash: string;
  createdAt: number;
  mtime?: number;
  mode?: number;
}

export interface Checkpoint {
  id: string;
  name: string;
  description?: string;
  snapshots: FileSnapshot[];
  createdAt: Date;
  size: number;
  fileCount: number;
  tags: string[];
  automatic: boolean;
}

export interface RewindStats {
  totalCheckpoints: number;
  automaticCheckpoints: number;
  manualCheckpoints: number;
  totalSize: number;
  totalFiles: number;
  oldestCheckpoint?: string;
  newestCheckpoint?: string;
}

// ============================================================================
// REWIND MANAGER CLASS
// ============================================================================

export class RewindManager {
  private storageDir: string;
  private maxCheckpoints: number;
  private maxStorageSize: number;
  private checkpoints: Map<string, Checkpoint>;
  private initialized: boolean;

  constructor() {
    this.storageDir = path.join(homedir(), '.floyd', 'checkpoints');
    this.maxCheckpoints = 50;
    this.maxStorageSize = 500 * 1024 * 1024; // 500 MB
    this.checkpoints = new Map();
    this.initialized = false;
  }

  /**
   * Initialize rewind manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await fs.mkdir(this.storageDir, { recursive: true });
    await this.loadCheckpoints();
    this.initialized = true;
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(
    paths: string[],
    options: {
      name?: string;
      description?: string;
      tags?: string[];
      automatic?: boolean;
    } = {}
  ): Promise<Checkpoint> {
    await this.initialize();

    const id = this.generateId();
    const snapshots: FileSnapshot[] = [];

    for (const filePath of paths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        const hash = createHash('sha256').update(content).digest('hex');

        snapshots.push({
          path: filePath,
          content,
          size: Buffer.byteLength(content),
          hash,
          createdAt: Date.now(),
          mtime: stats.mtimeMs,
          mode: stats.mode,
        });
      } catch {
        // Skip files that can't be read
      }
    }

    if (snapshots.length === 0) {
      throw new Error('No files were snapshotted');
    }

    const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);

    const checkpoint: Checkpoint = {
      id,
      name: options.name || `checkpoint-${id.slice(0, 8)}`,
      description: options.description,
      snapshots,
      createdAt: new Date(),
      size: totalSize,
      fileCount: snapshots.length,
      tags: options.tags || [],
      automatic: options.automatic ?? false,
    };

    await this.saveCheckpoint(checkpoint);
    this.checkpoints.set(id, checkpoint);
    await this.cleanup();

    return checkpoint;
  }

  /**
   * Rewind to a checkpoint
   */
  async rewindTo(checkpointId: string): Promise<{ restored: string[]; failed: string[] }> {
    await this.initialize();

    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const restored: string[] = [];
    const failed: string[] = [];

    for (const snapshot of checkpoint.snapshots) {
      try {
        await fs.writeFile(snapshot.path, snapshot.content, 'utf-8');
        restored.push(snapshot.path);
      } catch {
        failed.push(snapshot.path);
      }
    }

    return { restored, failed };
  }

  /**
   * Rewind specific files from a checkpoint
   */
  async rewindFiles(
    checkpointId: string,
    filePaths: string[]
  ): Promise<{ restored: string[]; failed: string[] }> {
    await this.initialize();

    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const restored: string[] = [];
    const failed: string[] = [];

    const snapshotsToRestore = checkpoint.snapshots.filter((s) =>
      filePaths.includes(s.path)
    );

    for (const snapshot of snapshotsToRestore) {
      try {
        await fs.writeFile(snapshot.path, snapshot.content, 'utf-8');
        restored.push(snapshot.path);
      } catch {
        failed.push(snapshot.path);
      }
    }

    return { restored, failed };
  }

  /**
   * List all checkpoints
   */
  async listCheckpoints(): Promise<Checkpoint[]> {
    await this.initialize();
    return Array.from(this.checkpoints.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get a specific checkpoint
   */
  async getCheckpoint(id: string): Promise<Checkpoint | undefined> {
    await this.initialize();
    return this.checkpoints.get(id);
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(id: string): Promise<boolean> {
    await this.initialize();

    if (!this.checkpoints.has(id)) {
      return false;
    }

    try {
      await fs.unlink(path.join(this.storageDir, `${id}.json`));
    } catch {
      // Ignore
    }

    this.checkpoints.delete(id);
    return true;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<RewindStats> {
    await this.initialize();

    const checkpoints = await this.listCheckpoints();
    const automatic = checkpoints.filter((c) => c.automatic).length;

    return {
      totalCheckpoints: checkpoints.length,
      automaticCheckpoints: automatic,
      manualCheckpoints: checkpoints.length - automatic,
      totalSize: checkpoints.reduce((sum, c) => sum + c.size, 0),
      totalFiles: checkpoints.reduce((sum, c) => sum + c.fileCount, 0),
      oldestCheckpoint: checkpoints[checkpoints.length - 1]?.createdAt.toISOString(),
      newestCheckpoint: checkpoints[0]?.createdAt.toISOString(),
    };
  }

  /**
   * Clear all checkpoints
   */
  async clearAll(): Promise<void> {
    await this.initialize();

    for (const id of this.checkpoints.keys()) {
      await this.deleteCheckpoint(id);
    }
  }

  /**
   * Get diff between checkpoint and current state
   */
  async getDiff(
    checkpointId: string,
    filePath: string
  ): Promise<{
    original: string | null;
    current: string | null;
    changed: boolean;
  }> {
    await this.initialize();

    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const snapshot = checkpoint.snapshots.find((s) => s.path === filePath);
    const original = snapshot?.content ?? null;

    let current: string | null = null;
    try {
      current = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist
    }

    return {
      original,
      current,
      changed: original !== current,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `cp-${timestamp}-${random}`;
  }

  private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const data = {
      ...checkpoint,
      snapshots: checkpoint.snapshots.map((s) => ({
        ...s,
        content: Buffer.from(s.content).toString('base64'),
      })),
    };

    await fs.writeFile(
      path.join(this.storageDir, `${checkpoint.id}.json`),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }

  private async loadCheckpoints(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const content = await fs.readFile(path.join(this.storageDir, file), 'utf-8');
          const data = JSON.parse(content);

          const checkpoint: Checkpoint = {
            ...data,
            createdAt: new Date(data.createdAt),
            snapshots: data.snapshots.map((s: any) => ({
              ...s,
              content: Buffer.from(s.content, 'base64').toString('utf-8'),
            })),
          };

          this.checkpoints.set(checkpoint.id, checkpoint);
        } catch {
          // Skip invalid checkpoints
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  private async cleanup(): Promise<void> {
    const checkpoints = await this.listCheckpoints();

    // Enforce max checkpoints
    if (checkpoints.length > this.maxCheckpoints) {
      const toRemove = checkpoints.filter((c) => c.automatic).slice(this.maxCheckpoints);

      for (const cp of toRemove) {
        await this.deleteCheckpoint(cp.id);
      }
    }

    // Enforce storage limit
    const stats = await this.getStats();
    if (stats.totalSize > this.maxStorageSize) {
      const sorted = checkpoints.slice();
      let currentSize = stats.totalSize;

      for (const cp of sorted) {
        if (currentSize <= this.maxStorageSize) break;
        await this.deleteCheckpoint(cp.id);
        currentSize -= cp.size;
      }
    }
  }
}

// ============================================================================
// SINGLETON & EXPRESS ROUTES
// ============================================================================

let instance: RewindManager | null = null;

export function getRewindManager(): RewindManager {
  if (!instance) {
    instance = new RewindManager();
  }
  return instance;
}

/**
 * Setup Express routes for rewind functionality
 */
export function setupRewindRoutes(app: any): void {
  const rewind = getRewindManager();

  // List checkpoints
  app.get('/api/rewind/checkpoints', async (req: any, res: any) => {
    try {
      const checkpoints = await rewind.listCheckpoints();
      // Return without full content to reduce payload
      const summary = checkpoints.map((cp) => ({
        id: cp.id,
        name: cp.name,
        description: cp.description,
        createdAt: cp.createdAt,
        size: cp.size,
        fileCount: cp.fileCount,
        tags: cp.tags,
        automatic: cp.automatic,
        files: cp.snapshots.map((s) => s.path),
      }));
      res.json({ checkpoints: summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get checkpoint details
  app.get('/api/rewind/checkpoints/:id', async (req: any, res: any) => {
    try {
      const checkpoint = await rewind.getCheckpoint(req.params.id);
      if (!checkpoint) {
        return res.status(404).json({ error: 'Checkpoint not found' });
      }
      res.json(checkpoint);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create checkpoint
  app.post('/api/rewind/checkpoints', async (req: any, res: any) => {
    try {
      const { paths, name, description, tags, automatic } = req.body;
      if (!paths || !Array.isArray(paths)) {
        return res.status(400).json({ error: 'paths array required' });
      }
      const checkpoint = await rewind.createCheckpoint(paths, {
        name,
        description,
        tags,
        automatic,
      });
      res.json(checkpoint);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rewind to checkpoint
  app.post('/api/rewind/checkpoints/:id/restore', async (req: any, res: any) => {
    try {
      const { files } = req.body;
      let result;
      if (files && Array.isArray(files)) {
        result = await rewind.rewindFiles(req.params.id, files);
      } else {
        result = await rewind.rewindTo(req.params.id);
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete checkpoint
  app.delete('/api/rewind/checkpoints/:id', async (req: any, res: any) => {
    try {
      const deleted = await rewind.deleteCheckpoint(req.params.id);
      res.json({ deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get stats
  app.get('/api/rewind/stats', async (req: any, res: any) => {
    try {
      const stats = await rewind.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get diff
  app.get('/api/rewind/checkpoints/:id/diff', async (req: any, res: any) => {
    try {
      const { file } = req.query;
      if (!file) {
        return res.status(400).json({ error: 'file query param required' });
      }
      const diff = await rewind.getDiff(req.params.id, file as string);
      res.json(diff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear all
  app.delete('/api/rewind/checkpoints', async (req: any, res: any) => {
    try {
      await rewind.clearAll();
      res.json({ cleared: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default RewindManager;
