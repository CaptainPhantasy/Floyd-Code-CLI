# FLOYD TUI REBUILD - STRICT BUILD PROTOCOL

This protocol is MANDATORY. You MUST follow these steps in order. Skipping any step is a CRITICAL FAILURE.

---

## Project Context

Working Directory: /Volumes/Storage/FLOYD_CLI/TUI REBUILD
Phase: Phase 3 Complete → Phase 4 Ready
Last Updated: 2026-02-01
Project Type: Node.js/TypeScript with Ink TUI
Isolation: Separate node_modules/, no impact on parent FLOYD_CLI projects

---

## MCP Tools Available (46 tools across 6 servers)

### Floyd Patch Server (5 tools)
- apply_unified_diff - Apply patches (dry-run, risk assessment)
- edit_range - Edit specific line range
- insert_at - Insert at line number
- delete_range - Delete line range
- assess_patch_risk - Risk assessment before patching

### Floyd Runner Server (6 tools)
- detect_project - Auto-detect project type and commands
- run_tests - Run test suite
- format - Format code
- lint - Run linter
- build - Build project
- check_permission - Check if permission granted

### Floyd Supercache Server (12 tools)
- cache_store, cache_retrieve, cache_delete, cache_clear, cache_list, cache_search, cache_stats, cache_prune
- cache_store_pattern - Store code patterns
- cache_store_reasoning, cache_load_reasoning, cache_archive_reasoning - Reasoning persistence

**Full SUPERCACHE Usage Guide:** See `SUPERCACHE/EFFECTIVE_USAGE_GUIDE.md`

**Quick SUPERCACHE Reference:**
- `cache_store` - Save any data with optional TTL
- `cache_retrieve` - Get stored data by key
- `cache_search` - Find cached content by query
- `cache_store_reasoning` - Capture decision logic (context, reasoning, conclusion)
- `cache_load_reasoning` - Recall past decision-making
- `cache_store_pattern` - Save reusable code solutions
- `cache_stats` - Check cache health and size
- `cache_prune` - Remove old entries by age

**Key Naming Pattern:** `category:entity:version` (e.g., `decision:auth_method:final`, `bug_fix:text_doubling:tui`)

**Three-Tier Architecture:**
- Tier 1 (reasoning): Active problem-solving, TTL: hours-days
- Tier 2 (project): Project state/phases, TTL: days-weeks
- Tier 3 (vault): Reusable patterns, TTL: permanent

### Floyd Safe Ops Server (3 tools)
- safe_refactor - Refactoring with rollback
- impact_simulate - Simulate change impact
- verify - Verify changes didn't break functionality

### Floyd Terminal Server (10 tools)
- start_process, interact_with_process, read_process_output, force_terminate
- list_sessions, list_processes, kill_process
- execute_code, create_directory, get_file_info

### Novel Concepts Server (10 tools)
- compute_budget_allocator - Allocate reasoning across tasks
- concept_web_weaver - Knowledge graph weaving
- episodic_memory_bank - Cross-session memory
- analogy_synthesizer - Generate analogies
- semantic_diff_validator - Semantic difference validation
- refactoring_orchestrator - Multi-file refactoring
- consensus_protocol - Build reasoning consensus
- distributed_task_board - Distributed task management
- adaptive_context_compressor - Compress context intelligently
- execution_trace_synthesizer - Debugging trace synthesis

--- Use when: Complex planning, multi-file changes, decision making, or debugging

7. Web Reader (1 tool) - Web Content

- mcp__web_reader__webReader - Fetch web pages and convert to markdown

Use when: Reading documentation, API docs, or web content

8. Vision Analysis (1 tool) - Image Understanding

- mcp__4_5v_mcp__analyze_image - Analyze images with AI vision

Use when: Analyzing screenshots, diagrams, or visual content

---
HOW TO USE THESE TOOLS

These are ALREADY LOADED in your session. Call them directly using the tool syntax.

Examples:

# Store reasoning about STAT architecture
mcp__floyd_supercache__cache_store_reasoning(
context="stat_architecture_decision",
reasoning="Chose Axum 0.7 over Actix-web for better async trait support",
conclusion="Axum selected for STAT backend"
)

# Simulate impact before changing attestation flow
mcp__floyd_safe_ops__impact_simulate(
operations=[{"type": "edit", "path": "backend/src/api/attestation.rs"}],
projectPath="/Volumes/Storage/STAT"
)

# Run backend tests
mcp__floyd_runner__run_tests(projectPath="/Volumes/Storage/STAT/backend")

# Check if build permission granted
mcp__floyd_runner__check_permission(
toolName="build",
projectPath="/Volumes/Storage/STAT/backend"
)

---
MANDATORY USAGE PATTERNS

1. Before Code Changes

# Always simulate first
mcp__floyd_safe_ops__impact_simulate(operations=[...], projectPath="/Volumes/Storage/STAT")

# Then verify after
mcp__floyd_safe_ops__verify(strategy="command", command="cargo test")

2. Complex Decisions

# Store reasoning for future sessions
mcp__floyd_supercache__cache_store_reasoning(
context="phase4_implementation",
reasoning="Implemented exception execution system with rollback capability",
conclusion="Phase 4 complete with 2,134 lines added"
)

3. Multi-File Changes

# Use orchestrator for coordinated changes
mcp__novel_concepts__refactoring_orchestrator(
refactoring_type="extract_interface",
target="AttestationService",
files=["backend/src/api/attestation.rs", "backend/src/services/attestation.rs"]
)

4. Debugging

# Generate execution traces before fixing bugs
mcp__novel_concepts__execution_trace_synthesizer(
code="function processAttestation(id) { ... }",
language="javascript",
input_scenarios=[{"name": "valid id", "inputs": {"id": 123}}]
)

---
VERIFIED WORKING (2026-02-01)

All 44 tools confirmed loaded in your session via /context:
┌───────────────────┬────────────┬───────────┐
│      Server       │ Tool Count │  Status   │
├───────────────────┼────────────┼───────────┤
│ floyd-patch       │ 5          │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ floyd-runner      │ 6          │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ floyd-supercache  │ 12         │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ floyd-safe-ops    │ 3          │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ floyd-terminal    │ 10         │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ novel-concepts    │ 10         │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ web_reader        │ 1          │ ✅ Loaded │
├───────────────────┼────────────┼───────────┤
│ 4.5v-mcp (vision) │ 1          │ ✅ Loaded │
└───────────────────┴────────────┴───────────┘
---
THE TL;DR

You have 44 additional tools in this session. They work. Use them.

Don't limit yourself to standard Claude capabilities. These tools give you:
- Persistent memory across sessions (SUPERCACHE)
- Safe code changes with rollback (SAFE-OPS, PATCH)
- Process management (TERMINAL)
- Advanced reasoning (NOVEL CONCEPTS)
- Project automation (RUNNER)
- Web + Vision capabilities

The tools are loaded. Call them directly.

## STRICT BUILD PROTOCOL - MANDATORY EXECUTION FLOW

### Step 0: PRE-CHANGE BASELINE (MANDATORY - NEVER SKIP)


R

**Date:** 2026-02-02
**Status:** Ready for decision on alignment strategy
