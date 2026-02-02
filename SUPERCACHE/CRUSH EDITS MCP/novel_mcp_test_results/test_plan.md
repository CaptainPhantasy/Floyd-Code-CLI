# Novel Concepts MCP Test Plan for STAT

**Date:** 2026-02-01
**Repository:** STAT (Healthcare Attestation)
**Goal:** Test all 10 Novel Concepts MCP tools with STAT-relevant use cases

## Tools to Test

### Memory & Learning (3 tools)
1. **concept_web_weaver** - Build concept graph for STAT roles
2. **episodic_memory_bank** - Store problem-solving episode
3. **analogy_synthesizer** - Generate analogy for clawback system

### Safe Code Manipulation (2 tools)
4. **semantic_diff_validator** - Validate hypothetical code change
5. **refactoring_orchestrator** - Plan multi-file refactor

### Multi-Agent Coordination (2 tools)
6. **consensus_protocol** - Run deliberation on technical decision
7. **distributed_task_board** - Create tasks with dependencies

### Context Management (2 tools)
8. **adaptive_context_compressor** - Compress conversation snippet
9. **compute_budget_allocator** - Allocate budget for complex task

### Verification (1 tool)
10. **execution_trace_synthesizer** - Generate execution trace for STAT function

## Test Cases

### Test 1: concept_web_weaver
**Input:** STAT 4-role canon architecture
**Expected:** Concept graph showing relationships between Companion, Observer, Advisor, Leadership
**STAT Context:** /Volumes/Storage/STAT/backend/src/authorization/mod.rs

### Test 2: episodic_memory_bank
**Input:** Problem-solving episode (Phase 3 attestation implementation)
**Expected:** Structured memory with key decisions and outcomes
**STAT Context:** /Volumes/Storage/STAT/docs/stat-finalization-refactor/PHASE3-COMPLETE.md

### Test 3: analogy_synthesizer
**Input:** Clawback protection system architecture
**Expected:** Real-world analogy for understanding
**STAT Context:** /Volumes/Storage/STAT/backend/src/services/clawback/

### Test 4: semantic_diff_validator
**Input:** Hypothetical change to authorization policy
**Expected:** Validation of semantic correctness
**STAT Context:** Compare before/after of policy.rs

### Test 5: refactoring_orchestrator
**Input:** Plan to remove executive personas
**Expected:** Multi-file refactor plan with dependencies
**STAT Context:** Phase 6 of stat-finalization-refactor

### Test 6: consensus_protocol
**Input:** Technical decision (e.g., "Should we use SQLx or Diesel?")
**Expected:** Deliberation process with multiple perspectives
**STAT Context:** Backend ORM decision making

### Test 7: distributed_task_board
**Input:** STAT Finalization Refactor phases
**Expected:** Task board with dependencies and assignments
**STAT Context:** Phases 0-8 of refactor

### Test 8: adaptive_context_compressor
**Input:** Long conversation about STAT roles
**Expected:** Compressed context preserving key points
**STAT Context:** This conversation itself

### Test 9: compute_budget_allocator
**Input:** Full STAT system verification task
**Expected:** Budget allocation across subtasks
**STAT Context:** Running all tests + lint + typecheck

### Test 10: execution_trace_synthesizer
**Input:** STAT authorization check function
**Expected:** Execution trace with decision points
**STAT Context:** authorize() function in policy.rs

## Results Tracking

All results will be stored in: /Volumes/Storage/STAT/novel_mcp_test_results/

Cache keys will be recorded for each successful test.
