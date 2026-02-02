/**
 * OMEGA AGI - Live Demo: Conflict Prevention
 * 
 * Demonstrates multiple agents coordinating via SUPERCACHE locks
 * to avoid file conflicts.
 */

import { ConflictPrevention } from './layer1-conflict-prevention.js';
import { SwarmTaskCoordinator } from './layer1-task-integration.js';

/**
 * Simulate multiple agents trying to work on same codebase
 */
async function demoConflictPrevention() {
  console.log('🌌 OMEGA AGI - Layer 1 Demo: Conflict Prevention\n');
  console.log('════════════════════════════════════════════════\n');
  
  // Mock SUPERCACHE client (would use real MCP client in production)
  const mockCache = createMockSupercache();
  const conflictPrevention = new ConflictPrevention(mockCache);
  
  // Scenario 1: Agent A acquires lock successfully
  console.log('Scenario 1: Agent A acquires lock on auth.ts');
  const lockA = await conflictPrevention.acquireLock('src/auth.ts', 'agent_a');
  console.log(`✓ Agent A: ${lockA.success ? 'LOCKED' : 'FAILED'}`);
  console.log(`  Lock ID: ${lockA.lock?.lock_id}\n`);
  
  // Scenario 2: Agent B tries to acquire same lock (should fail)
  console.log('Scenario 2: Agent B tries to lock auth.ts (should fail)');
  const lockB = await conflictPrevention.acquireLock('src/auth.ts', 'agent_b');
  console.log(`✗ Agent B: ${lockB.success ? 'LOCKED' : 'BLOCKED'}`);
  console.log(`  Reason: ${lockB.reason}`);
  console.log(`  Held by: ${lockB.holder}\n`);
  
  // Scenario 3: Agent B finds alternative file
  console.log('Scenario 3: Agent B locks different file (validators.ts)');
  const lockB2 = await conflictPrevention.acquireLock('src/validators.ts', 'agent_b');
  console.log(`✓ Agent B: ${lockB2.success ? 'LOCKED' : 'FAILED'}`);
  console.log(`  File: validators.ts\n`);
  
  // Scenario 4: List all active locks
  console.log('Scenario 4: Check all active locks');
  const allLocks = await conflictPrevention.listLocks();
  console.log(`  Active locks: ${allLocks.length}`);
  allLocks.forEach(lock => {
    console.log(`  - ${lock.file} (held by ${lock.agent_id})`);
  });
  console.log();
  
  // Scenario 5: Agent A releases lock
  console.log('Scenario 5: Agent A finishes work, releases lock');
  await conflictPrevention.releaseLock('src/auth.ts', 'agent_a');
  console.log(`✓ Agent A: Released auth.ts\n`);
  
  // Scenario 6: Agent B can now acquire lock
  console.log('Scenario 6: Agent B can now lock auth.ts');
  const lockB3 = await conflictPrevention.acquireLock('src/auth.ts', 'agent_b');
  console.log(`✓ Agent B: ${lockB3.success ? 'LOCKED' : 'FAILED'}`);
  console.log();
  
  // Scenario 7: Atomic multi-file locking
  console.log('Scenario 7: Agent C needs multiple files (auth.ts + validators.ts)');
  console.log('  Both locked by Agent B → should fail atomically');
  const lockC = await conflictPrevention.acquireMultipleLocks(
    ['src/auth.ts', 'src/validators.ts'],
    'agent_c'
  );
  console.log(`✗ Agent C: ${lockC.success ? 'LOCKED' : 'FAILED'}`);
  console.log(`  Reason: ${lockC.reason}\n`);
  
  // Scenario 8: Agent B releases all locks
  console.log('Scenario 8: Agent B releases both files');
  await conflictPrevention.releaseLock('src/auth.ts', 'agent_b');
  await conflictPrevention.releaseLock('src/validators.ts', 'agent_b');
  console.log(`✓ Agent B: Released all locks\n`);
  
  // Scenario 9: Agent C can now acquire both
  console.log('Scenario 9: Agent C acquires both files atomically');
  const lockC2 = await conflictPrevention.acquireMultipleLocks(
    ['src/auth.ts', 'src/validators.ts'],
    'agent_c'
  );
  console.log(`✓ Agent C: ${lockC2.success ? 'LOCKED' : 'FAILED'}`);
  console.log(`  Files: ${lockC2.lock?.file}\n`);
  
  // Final state
  console.log('════════════════════════════════════════════════');
  console.log('✅ DEMO COMPLETE - Zero conflicts detected\n');
  console.log('Key Insights:');
  console.log('  • Atomic locking prevents simultaneous edits');
  console.log('  • Failed lock → agent finds alternative work');
  console.log('  • Multi-file transactions: all-or-nothing');
  console.log('  • Zero data corruption possible\n');
}

/**
 * Mock SUPERCACHE for demo (replace with real MCP client)
 */
function createMockSupercache() {
  const store = new Map<string, {value: string; metadata: any; expires: number}>();
  
  return {
    async store(params: any) {
      const expiresAt = Date.now() + ((params.metadata?.expires_in || 300) * 1000);
      store.set(params.key, {
        value: params.value,
        metadata: params.metadata,
        expires: expiresAt
      });
      return { success: true };
    },
    
    async retrieve(params: any) {
      const entry = store.get(params.key);
      if (!entry) {
        return { found: false };
      }
      
      // Check expiration
      if (Date.now() > entry.expires) {
        store.delete(params.key);
        return { found: false };
      }
      
      return {
        found: true,
        value: entry.value
      };
    },
    
    async delete(params: any) {
      store.delete(params.key);
    },
    
    async list(params: any) {
      const entries: Array<{key: string; value: string}> = [];
      for (const [key, entry] of store) {
        if (Date.now() <= entry.expires) {
          entries.push({ key, value: entry.value });
        }
      }
      return { count: entries.length, entries };
    }
  };
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoConflictPrevention().catch(console.error);
}

export { demoConflictPrevention };
