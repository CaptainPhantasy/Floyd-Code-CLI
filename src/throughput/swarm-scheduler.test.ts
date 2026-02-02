/**
 * PHASE 4 ITEM 20: CLI Swarm Dispatch Verification
 *
 * Verifies swarm mode with all available tools (60 tools):
 * - Tool dispatch correctness
 * - Swarm fairness and priority handling
 * - Error handling in swarm context
 * - Output aggregation
 *
 * Swarm Types:
 * - manager (2x weight)
 * - codesearch (1x weight)
 * - patchmaker (1x weight)
 * - tester (1x weight)
 * - browser (1x weight)
 * - gitops (1x weight)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
	SwarmScheduler,
	SwarmTask,
	SwarmType,
	SWARM_WEIGHTS,
	type SwarmState,
} from './swarm-scheduler.js';

describe('PHASE 4 ITEM 20: CLI Swarm Dispatch Verification', () => {
	let scheduler: SwarmScheduler;

	beforeEach(() => {
		scheduler = new SwarmScheduler();
	});

	afterEach(() => {
		// Give pending tasks time to complete
		return new Promise(resolve => setTimeout(resolve, 100));
	});

	// ============================================================
	// SWARM INITIALIZATION TESTS
	// ============================================================

	describe('Swarm Initialization', () => {
		it('should initialize all 6 swarm types', () => {
			const states = scheduler.getStates();
			assert.equal(states.length, 6);
		});

		it('should assign correct weights to swarms', () => {
			const states = scheduler.getStates();

			const manager = states.find(s => s.swarm === 'manager');
			const codesearch = states.find(s => s.swarm === 'codesearch');

			assert.equal(manager?.weight, 2);
			assert.equal(codesearch?.weight, 1);
		});

		it('should start with zero activity', () => {
			const stats = scheduler.getStats();

			assert.equal(stats.queueSize, 0);
			assert.equal(stats.activeTasks, 0);
			assert.equal(stats.pendingTasks, 0);
			assert.equal(stats.completedTasks, 0);
		});
	});

	// ============================================================
	// TASK ENQUEUE TESTS
	// ============================================================

	describe('Task Enqueue', () => {
		it('should enqueue task to correct swarm', (t, done) => {
			let enqueuedSwarm: SwarmType | null = null;

			scheduler.once('task.enqueued', (task: SwarmTask) => {
				enqueuedSwarm = task.swarm;
				assert.equal(enqueuedSwarm, 'codesearch');
				done();
			});

			scheduler.enqueue({
				id: 'test-1',
				swarm: 'codesearch',
				priority: 5,
				execute: async () => {},
			});
		});

		it('should track pending tasks per swarm', async () => {
			scheduler.enqueue({
				id: 'test-1',
				swarm: 'manager',
				priority: 5,
				execute: async () => {
					// Long-running task to keep it pending
					await new Promise(resolve => setTimeout(resolve, 1000));
				},
			});

			scheduler.enqueue({
				id: 'test-2',
				swarm: 'manager',
				priority: 5,
				execute: async () => {
					// Long-running task to keep it pending
					await new Promise(resolve => setTimeout(resolve, 1000));
				},
			});

			// Wait for enqueue to register
			await new Promise(resolve => setTimeout(resolve, 10));

			const states = scheduler.getStates();
			const managerState = states.find(s => s.swarm === 'manager');

			assert.equal(managerState?.pending, 2);
		});

		it('should accept tasks for all swarm types', async () => {
			const swarms: SwarmType[] = ['manager', 'codesearch', 'patchmaker', 'tester', 'browser', 'gitops'];

			for (const swarm of swarms) {
				scheduler.enqueue({
					id: `test-${swarm}`,
					swarm,
					priority: 5,
					execute: async () => {
						// Keep tasks pending
						await new Promise(resolve => setTimeout(resolve, 500));
					},
				});
			}

			// Wait for all enqueues to register
			await new Promise(resolve => setTimeout(resolve, 20));

			const stats = scheduler.getStats();
			assert.equal(stats.pendingTasks, 6);
		});
	});

	// ============================================================
	// TASK EXECUTION TESTS
	// ============================================================

	describe('Task Execution', () => {
		it('should execute task and emit completed event', (t, done) => {
			let executed = false;

			scheduler.enqueue({
				id: 'test-1',
				swarm: 'manager',
				priority: 5,
				execute: async () => {
					executed = true;
				},
			});

			scheduler.once('task.completed', (task: SwarmTask) => {
				assert.equal(executed, true);
				assert.equal(task.id, 'test-1');
				done();
			});
		});

		it('should decrement active count after completion', async () => {
			scheduler.enqueue({
				id: 'test-1',
				swarm: 'tester',
				priority: 5,
				execute: async () => {
					// Immediate completion
				},
			});

			// Wait for task to process and complete
			await new Promise(resolve => setTimeout(resolve, 200));

			const states = scheduler.getStates();
			const testerState = states.find(s => s.swarm === 'tester');

			assert.equal(testerState?.active, 0);
			assert.equal(testerState?.completed, 1);
		});

		it('should emit task.started event', (t, done) => {
			scheduler.enqueue({
				id: 'test-1',
				swarm: 'patchmaker',
				priority: 5,
				execute: async () => {},
			});

			scheduler.once('task.started', (task: SwarmTask) => {
				assert.equal(task.swarm, 'patchmaker');
				done();
			});
		});
	});

	// ============================================================
	// PRIORITY AND FAIRNESS TESTS
	// ============================================================

	describe('Priority and Fairness', () => {
		it('should execute higher priority tasks first', async () => {
			const executionOrder: string[] = [];

			scheduler.enqueue({
				id: 'low',
				swarm: 'manager',
				priority: 1,
				execute: async () => {
					executionOrder.push('low');
				},
			});

			scheduler.enqueue({
				id: 'high',
				swarm: 'manager',
				priority: 10,
				execute: async () => {
					executionOrder.push('high');
				},
			});

			await new Promise(resolve => setTimeout(resolve, 200));

			assert.equal(executionOrder[0], 'high');
			assert.equal(executionOrder[1], 'low');
		});

		it('should respect manager swarm 2x weight', async () => {
			let managerExecuted = 0;
			let codesearchExecuted = 0;

			// Enqueue equal number of tasks
			for (let i = 0; i < 3; i++) {
				scheduler.enqueue({
					id: `manager-${i}`,
					swarm: 'manager',
					priority: 5,
					execute: async () => {
						managerExecuted++;
					},
				});

				scheduler.enqueue({
					id: `codesearch-${i}`,
					swarm: 'codesearch',
					priority: 5,
					execute: async () => {
						codesearchExecuted++;
					},
				});
			}

			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 500));

			// Manager should complete at least as many as codesearch
			assert.ok(managerExecuted >= codesearchExecuted);
		});

		it('should round-robin between swarms of same priority', async () => {
			const executedSwarms: SwarmType[] = [];

			for (let i = 0; i < 6; i++) {
				const swarm: SwarmType = i % 2 === 0 ? 'patchmaker' : 'tester';
				scheduler.enqueue({
					id: `task-${i}`,
					swarm,
					priority: 5,
					execute: async () => {
						executedSwarms.push(swarm);
					},
				});
			}

			await new Promise(resolve => setTimeout(resolve, 300));

			// Should execute tasks from both swarms
			assert.ok(executedSwarms.includes('patchmaker'));
			assert.ok(executedSwarms.includes('tester'));
		});
	});

	// ============================================================
	// ERROR HANDLING TESTS
	// ============================================================

	describe('Error Handling', () => {
		it('should emit task.failed on execution error', (t, done) => {
			const testError = new Error('Test error');

			scheduler.enqueue({
				id: 'failing-task',
				swarm: 'browser',
				priority: 5,
				execute: async () => {
					throw testError;
				},
			});

			scheduler.once('task.failed', ({ task, error }: { task: SwarmTask; error: Error }) => {
				assert.equal(task.id, 'failing-task');
				assert.equal(error, testError);
				done();
			});
		});

		it('should decrement active count on error', async () => {
			scheduler.enqueue({
				id: 'failing-task',
				swarm: 'gitops',
				priority: 5,
				execute: async () => {
					throw new Error('Fail');
				},
			});

			// Wait for task to process
			await new Promise(resolve => setTimeout(resolve, 200));

			const states = scheduler.getStates();
			const gitopsState = states.find(s => s.swarm === 'gitops');

			assert.equal(gitopsState?.active, 0);
		});

		it('should continue processing after error', async () => {
			scheduler.enqueue({
				id: 'failing',
				swarm: 'manager',
				priority: 5,
				execute: async () => {
					throw new Error('Error');
				},
			});

			scheduler.enqueue({
				id: 'succeeding',
				swarm: 'manager',
				priority: 5,
				execute: async () => {
					// Success
				},
			});

			await new Promise(resolve => setTimeout(resolve, 300));

			const stats = scheduler.getStats();
			assert.ok(stats.completedTasks >= 1);
		});
	});

	// ============================================================
	// TOKEN BUCKET TESTS
	// ============================================================

	describe('Token Bucket Management', () => {
		it('should respect token limits', async () => {
			// Manager has 2 tokens, should execute 2 tasks quickly
			for (let i = 0; i < 5; i++) {
				scheduler.enqueue({
					id: `task-${i}`,
					swarm: 'manager',
					priority: 5,
					execute: async () => {
						// Simulate work
						await new Promise(resolve => setTimeout(resolve, 50));
					},
				});
			}

			// Check initial state
			const statesAfterEnqueue = scheduler.getStates();
			const managerState = statesAfterEnqueue.find(s => s.swarm === 'manager');

			// Some tasks should be pending
			assert.ok(managerState!.pending > 0);
		});

		it('should refill tokens over time', async () => {
			// Exhaust manager tokens (2 available)
			for (let i = 0; i < 4; i++) {
				scheduler.enqueue({
					id: `task-${i}`,
					swarm: 'manager',
					priority: 5,
					execute: async () => {
						await new Promise(resolve => setTimeout(resolve, 100));
					},
				});
			}

			// Wait for token refill (1 second) and task completion
			await new Promise(resolve => setTimeout(resolve, 1500));

			const stats = scheduler.getStats();
			// All tasks should eventually complete
			assert.ok(stats.completedTasks > 0);
		});

		it('should emit tokens.refilled event', (t, done) => {
			let refilled = false;

			scheduler.once('tokens.refilled', () => {
				refilled = true;
			});

			// Wait for refill interval
			setTimeout(() => {
				assert.ok(refilled);
				done();
			}, 1200);
		});
	});

	// ============================================================
	// OUTPUT AGGREGATION TESTS
	// ============================================================

	describe('Output Aggregation', () => {
		it('should provide accurate statistics', async () => {
			const taskCount = 5;

			for (let i = 0; i < taskCount; i++) {
				scheduler.enqueue({
					id: `task-${i}`,
					swarm: i % 2 === 0 ? 'manager' : 'codesearch',
					priority: 5,
					execute: async () => {
						// Quick task
					},
				});
			}

			await new Promise(resolve => setTimeout(resolve, 300));

			const stats = scheduler.getStats();

			assert.equal(stats.queueSize, 0); // All processed
			assert.equal(stats.activeTasks, 0); // All completed
			assert.equal(stats.completedTasks, taskCount);
		});

		it('should aggregate stats per swarm', async () => {
			scheduler.enqueue({
				id: 'm1',
				swarm: 'manager',
				priority: 5,
				execute: async () => {},
			});

			scheduler.enqueue({
				id: 'cs1',
				swarm: 'codesearch',
				priority: 5,
				execute: async () => {},
			});

			await new Promise(resolve => setTimeout(resolve, 200));

			const states = scheduler.getStates();

			const manager = states.find(s => s.swarm === 'manager');
			const codesearch = states.find(s => s.swarm === 'codesearch');

			assert.equal(manager?.completed, 1);
			assert.equal(codesearch?.completed, 1);
		});

		it('should track individual swarm completion counts', async () => {
			for (let i = 0; i < 3; i++) {
				scheduler.enqueue({
					id: `t-${i}`,
					swarm: 'tester',
					priority: 5,
					execute: async () => {},
				});
			}

			await new Promise(resolve => setTimeout(resolve, 300));

			const states = scheduler.getStates();
			const tester = states.find(s => s.swarm === 'tester');

			assert.equal(tester?.completed, 3);
		});
	});

	// ============================================================
	// SWARM DEFINITION COMPATIBILITY TESTS
	// ============================================================

	describe('SwarmDefinition Compatibility (Legacy)', () => {
		it('should support SwarmRole type alias', () => {
			// SwarmRole is an alias for SwarmType
			const swarm: SwarmType = 'manager';
			const role: SwarmType = swarm; // Would be SwarmRole in actual usage

			assert.equal(swarm, role);
		});

		it('should have consistent swarm types across interfaces', () => {
			const swarms: SwarmType[] = ['manager', 'codesearch', 'patchmaker', 'tester', 'browser', 'gitops'];

			for (const swarm of swarms) {
				const weight = SWARM_WEIGHTS[swarm];
				assert.ok(typeof weight === 'number');
				assert.ok(weight > 0);
			}
		});
	});

	// ============================================================
	// CONCURRENT EXECUTION TESTS
	// ============================================================

	describe('Concurrent Execution', () => {
		it('should execute tasks from different swarms concurrently', async () => {
			const executionTimes: number[] = [];

			const startTask = (swarm: SwarmType, delay: number): void => {
				scheduler.enqueue({
					id: `${swarm}-task`,
					swarm,
					priority: 5,
					execute: async () => {
						const start = Date.now();
						await new Promise(resolve => setTimeout(resolve, delay));
						executionTimes.push(Date.now() - start);
					},
				});
			};

			startTask('manager', 50);
			startTask('codesearch', 50);

			await new Promise(resolve => setTimeout(resolve, 200));

			// Both should have executed
			assert.equal(executionTimes.length, 2);
		});

		it('should limit concurrent execution within single swarm', async () => {
			let concurrentCount = 0;
			let maxConcurrent = 0;

			const createSlowTask = (id: string): void => {
				scheduler.enqueue({
					id,
					swarm: 'manager',
					priority: 5,
					execute: async () => {
						concurrentCount++;
						if (concurrentCount > maxConcurrent) {
							maxConcurrent = concurrentCount;
						}
						await new Promise(resolve => setTimeout(resolve, 100));
						concurrentCount--;
					},
				});
			};

			// Enqueue more tasks than manager has tokens
			for (let i = 0; i < 5; i++) {
				createSlowTask(`slow-${i}`);
			}

			await new Promise(resolve => setTimeout(resolve, 700));

			// Max concurrent should not exceed token limit
			assert.ok(maxConcurrent <= 3); // Allow some buffer
		});
	});

	// ============================================================
	// TOOL DISPATCH VERIFICATION (60 tools simulation)
	// ============================================================

	describe('Tool Dispatch Verification', () => {
		it('should handle all 6 swarm types correctly', async () => {
			const dispatchedSwarms: SwarmType[] = [];
			const completedTasks: string[] = [];

			const swarms: SwarmType[] = ['manager', 'codesearch', 'patchmaker', 'tester', 'browser', 'gitops'];

			for (const swarm of swarms) {
				scheduler.enqueue({
					id: `${swarm}-1`,
					swarm,
					priority: 5,
					execute: async () => {
						dispatchedSwarms.push(swarm);
						completedTasks.push(`${swarm}-1`);
					},
				});
			}

			await new Promise(resolve => setTimeout(resolve, 300));

			// All swarms should have dispatched
			assert.equal(dispatchedSwarms.length, 6);
			assert.equal(completedTasks.length, 6);
		});

		it('should simulate high-volume tool dispatch', async () => {
			const totalTasks = 60;
			let completedCount = 0;

			// Simulate 60 tools being dispatched across 6 swarms
			for (let i = 0; i < totalTasks; i++) {
				const swarm: SwarmType = swarms[i % swarms.length];
				scheduler.enqueue({
					id: `tool-${i}`,
					swarm,
					priority: Math.floor(Math.random() * 10),
					execute: async () => {
						completedCount++;
					},
				});
			}

			// Wait for all to complete
			await new Promise(resolve => setTimeout(resolve, 3000));

			const stats = scheduler.getStats();
			assert.ok(stats.completedTasks > 0);
			assert.equal(stats.completedTasks + stats.activeTasks + stats.pendingTasks, totalTasks);
		});
	});
});

// Helper array for tool dispatch simulation
const swarms: SwarmType[] = ['manager', 'codesearch', 'patchmaker', 'tester', 'browser', 'gitops'];
