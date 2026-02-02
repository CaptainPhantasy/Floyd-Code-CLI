/**
 * OMEGA AGI - Layer 1: Task Board Integration
 * 
 * Integrates ConflictPrevention with distributed_task_board.
 * When agent claims task, automatically acquires all necessary file locks.
 * 
 * Research basis: Hivemind Orchestrator Level 1 + distributed_task_board
 */

import { ConflictPrevention, type FileLock, type LockResult } from './layer1-conflict-prevention.js';

export interface FileAwareTask {
  id: string;
  description: string;
  priority: number;
  estimated_effort?: number;
  files_to_edit?: string[];  // Files this task will modify
  dependencies?: string[];
  state?: 'pending' | 'ready' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
}

export interface TaskClaimResult {
  success: boolean;
  task?: FileAwareTask;
  locks?: FileLock[];
  reason?: string;
  conflicting_files?: Array<{
    file: string;
    held_by: string;
  }>;
}

/**
 * SwarmTaskCoordinator - File-aware task claiming with automatic locking
 */
export class SwarmTaskCoordinator {
  constructor(
    private conflictPrevention: ConflictPrevention,
    private taskBoard: DistributedTaskBoard
  ) {}
  
  /**
   * Claim task and acquire all necessary file locks atomically
   * 
   * If any file is locked, entire operation fails (transaction semantics)
   */
  async claimTaskWithLocks(
    task_id: string,
    agent_id: string
  ): Promise<TaskClaimResult> {
    // Get task details
    const task = await this.taskBoard.getTask(task_id);
    
    if (!task) {
      return {
        success: false,
        reason: `Task ${task_id} not found`
      };
    }
    
    // Check if task is ready (dependencies satisfied)
    if (task.state === 'in_progress') {
      return {
        success: false,
        reason: 'Task already claimed by another agent',
        task
      };
    }
    
    if (task.state === 'blocked' || task.state === 'pending') {
      return {
        success: false,
        reason: `Task not ready (state: ${task.state})`,
        task
      };
    }
    
    // Acquire file locks if task specifies files
    const files = task.files_to_edit || [];
    
    if (files.length > 0) {
      const lockResult = await this.conflictPrevention.acquireMultipleLocks(
        files,
        agent_id
      );
      
      if (!lockResult.success) {
        // Find which files are locked and by whom
        const conflicting: Array<{file: string; held_by: string}> = [];
        
        for (const file of files) {
          const status = await this.conflictPrevention.isLocked(file);
          if (status.locked && status.holder !== agent_id) {
            conflicting.push({
              file,
              held_by: status.holder!
            });
          }
        }
        
        return {
          success: false,
          reason: 'Cannot acquire file locks',
          task,
          conflicting_files: conflicting
        };
      }
    }
    
    // Claim task on task board
    try {
      const claimResult = await this.taskBoard.claimTask(task_id, agent_id);
      
      if (!claimResult.success) {
        // Task claim failed - release locks
        if (files.length > 0) {
          for (const file of files) {
            await this.conflictPrevention.releaseLock(file, agent_id);
          }
        }
        
        return {
          success: false,
          reason: 'Failed to claim task on board',
          task
        };
      }
      
      return {
        success: true,
        task: claimResult.task,
        locks: files.map(file => ({
          file,
          lock_id: `lock_${task_id}_${file}`,
          agent_id,
          acquired_at: Date.now(),
          ttl: this.conflictPrevention['DEFAULT_TTL']
        }))
      };
    } catch (error) {
      // Rollback locks on failure
      if (files.length > 0) {
        for (const file of files) {
          await this.conflictPrevention.releaseLock(file, agent_id).catch(() => {});
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Complete task and release all file locks
   */
  async completeTaskWithUnlock(
    task_id: string,
    agent_id: string
  ): Promise<{success: boolean; unlocked_dependents?: string[]}> {
    // Get task to find files
    const task = await this.taskBoard.getTask(task_id);
    
    if (!task) {
      return { success: false };
    }
    
    // Complete task on board
    const completeResult = await this.taskBoard.completeTask(task_id);
    
    // Release all file locks
    const files = task.files_to_edit || [];
    for (const file of files) {
      await this.conflictPrevention.releaseLock(file, agent_id).catch(() => {
        // Ignore errors (lock might have expired)
      });
    }
    
    return {
      success: true,
      unlocked_dependents: completeResult.newly_ready
    };
  }
  
  /**
   * Get all ready tasks that have no file conflicts
   * (i.e., tasks this agent can claim immediately)
   */
  async getClaimableTasks(agent_id: string): Promise<FileAwareTask[]> {
    const readyTasks = await this.taskBoard.getReadyTasks();
    const claimable: FileAwareTask[] = [];
    
    for (const task of readyTasks) {
      const files = task.files_to_edit || [];
      
      if (files.length === 0) {
        // No file dependencies, always claimable
        claimable.push(task);
        continue;
      }
      
      // Check if all files are available
      let allAvailable = true;
      for (const file of files) {
        const status = await this.conflictPrevention.isLocked(file);
        if (status.locked && status.holder !== agent_id) {
          allAvailable = false;
          break;
        }
      }
      
      if (allAvailable) {
        claimable.push(task);
      }
    }
    
    return claimable;
  }
  
  /**
   * Find alternative tasks when preferred task is locked
   * Returns tasks with no file conflicts, sorted by priority
   */
  async findAlternativeTasks(
    agent_id: string,
    preferredTaskId: string
  ): Promise<FileAwareTask[]> {
    const claimable = await this.getClaimableTasks(agent_id);
    
    // Remove preferred task from alternatives
    const alternatives = claimable.filter(t => t.id !== preferredTaskId);
    
    // Sort by priority (higher = more important)
    return alternatives.sort((a, b) => b.priority - a.priority);
  }
}

/**
 * Helper interface for distributed task board
 * (Would use actual novel-concepts distributed_task_board MCP in production)
 */
interface DistributedTaskBoard {
  getTask(task_id: string): Promise<FileAwareTask | null>;
  getReadyTasks(): Promise<FileAwareTask[]>;
  claimTask(task_id: string, agent_id: string): Promise<{
    success: boolean;
    task?: FileAwareTask;
  }>;
  completeTask(task_id: string): Promise<{
    success: boolean;
    newly_ready?: string[];
  }>;
}
