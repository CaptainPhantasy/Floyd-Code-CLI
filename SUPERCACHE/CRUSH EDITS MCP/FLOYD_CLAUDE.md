# FLOYD MCP TOOLS — COMPLETE REFERENCE

**You have 51 tools across 8 MCP servers (41 FLOYD + 10 Novel Concepts). Use them.**

---

## SUPERCACHE — 3-Tier Memory System

**CRITICAL: This is your ONLY persistent memory between sessions.**

### Cache Structure
```
<projectRoot>/.floyd/.cache/
├── reasoning/     # TTL: 5 min   — Temporary reasoning chains
├── project/       # TTL: 24 hours — Project-specific context
└── vault/         # TTL: 7 days   — Permanent patterns & wisdom
    ├── patterns/  # Reusable solution patterns
    └── index/     # Pattern index (tags, metadata)
```

### MCP Servers Index (Cached in `mcp:servers:*`)
| Server | Location | Tools |
|--------|----------|-------|
| floyd-supercache | floyd-supercache-server/ | 12 cache tools |
| floyd-patch | floyd-patch-server/ | 5 file surgery tools |
| floyd-runner | floyd-runner-server/ | 6 project tools |
| floyd-safe-ops | floyd-safe-ops-server/ | 3 safe refactor tools |
| floyd-terminal | floyd-terminal-server/ | 9 process tools |
| floyd-devtools | floyd-devtools-server/ | 6 dev tools |
| novel-concepts | novel-concepts-server/ | 10 LLM extension tools |

### SUPERCACHE Tools (12)
| Tool | Purpose |
|------|---------|
| `cache_store` | Store key-value data |
| `cache_retrieve` | Retrieve cached data |
| `cache_delete` | Delete specific entries |
| `cache_clear` | Clear all cache |
| `cache_list` | List all entries |
| `cache_search` | Search by key/pattern |
| `cache_stats` | Cache statistics |
| `cache_prune` | Remove stale entries |
| `cache_store_pattern` | Bulk pattern storage |
| `cache_store_reasoning` | Store reasoning chains |
| `cache_load_reasoning` | Load reasoning chains |
| `cache_archive_reasoning` | Archive old reasoning |

### SUPERCACHE Protocol — MANDATORY

**ON SESSION START:**
```
1. cache_stats              # What's in memory?
2. cache_list               # Show all keys
3. cache_load_reasoning     # Get recent reasoning
4. cache_search "session:latest"  # Find last session
```

**EVERY TIME YOU:**
- Learn something → `cache_store` key=`project:{name}:learnings:{topic}`
- Make a decision → `cache_store_reasoning`
- Find important files → `cache_store_pattern`
- Complete a task → `cache_store` key=`session:{date}:summary`

**NAMESPACE CONVENTIONS:**
```
project:{name}:files:{pattern}      — Important files
project:{name}:decisions:{topic}    — Decisions made
project:{name}:learnings:{what}     — Things learned
project:{name}:context:{feature}    — Feature context
global:patterns:{lang}:{pattern}    — Cross-project patterns
session:{date}:summary              — Session summaries
```

**NO EXCEPTIONS.** If you don't cache it, you WILL forget it between sessions.

---

## floyd-patch (5 tools) — File Surgery

| Tool | Purpose |
|------|---------|
| `apply_unified_diff` | Apply unified diff patches (with dry-run preview) |
| `edit_range` | Edit specific line ranges in files |
| `insert_at` | Insert content at specific line |
| `delete_range` | Delete line ranges from files |
| `assess_patch_risk` | Risk assessment before applying patches |

**Use when:** Editing files, applying git diffs, surgical code changes

---

## floyd-runner (6 tools) — Project Commands

| Tool | Purpose |
|------|---------|
| `detect_project` | Auto-detect Node/Go/Rust/Python projects |
| `run_tests` | Run project tests |
| `format` | Format code with project formatter |
| `lint` | Run project linter |
| `build` | Build the project |
| `check_permission` | Check if permission granted for operations |

**Use when:** Running tests, formatting, linting, building projects

---

## floyd-safe-ops (3 tools) — Safe Refactor

| Tool | Purpose |
|------|---------|
| `safe_refactor` | Refactor with automatic rollback on failure |
| `impact_simulate` | Simulate impact of changes before applying |
| `verify` | Explicit verification tool to confirm changes work |

**Use when:** Risky refactors, impact analysis, verification needed

---

## floyd-terminal (9 tools) — Process Management

| Tool | Purpose |
|------|---------|
| `start_process` | Spawn persistent processes (SSH, databases, dev servers) |
| `interact_with_process` | Send input to running process |
| `read_process_output` | Read process output without sending input |
| `force_terminate` | Force terminate a session |
| `list_sessions` | List all active terminal sessions |
| `list_processes` | List system processes with CPU/memory |
| `kill_process` | Kill process by PID |
| `execute_code` | Run Python/Node/Bash code in memory |
| `create_directory` | mkdir -p |
| `get_file_info` | Get detailed file metadata |

**Use when:** Long-running processes, background tasks, code execution

---

## floyd-devtools (6 tools) — Development Utilities

| Tool | Purpose |
|------|---------|
| `dependency_analyzer` | Detect circular dependencies using Tarjan's SCC algorithm |
| `schema_migrator` | Config/state migrations with versioning & rollback |
| `benchmark_runner` | Performance tracking with statistical analysis (P95/P99) |
| `secure_hook_executor` | Sandboxed hook execution with safety checks |
| `api_format_verifier` | LLM API validation (OpenAI/Anthropic/Google) + cost estimation |
| `test_generator` | Auto-generate tests for Jest/Vitest/pytest |

**Use when:** Code analysis, schema migrations, benchmarking, safe code execution, API validation, test generation

**`dependency_analyzer` actions:** `analyze`, `visualize`, `find_cycles`, `suggest_fixes`
- **Languages:** TypeScript, JavaScript, Python, Go
- **Algorithm:** Tarjan's Strongly Connected Components
- **Output:** Circular dependency paths with risk levels

**`schema_migrator` actions:** `generate_migration`, `validate_schema`, `apply_migration`, `rollback`, `diff_versions`, `list_migrations`
- **Strategies:** strict, lenient, transform
- **Versioned:** Tracks all schema versions with migration history

**`benchmark_runner` actions:** `run`, `compare`, `baseline`, `report`, `regression_check`, `list`
- **Metrics:** Mean, Median, Min, Max, StdDev, P95, P99, Throughput
- **Regression detection:** Automatic threshold comparison

**`secure_hook_executor` actions:** `execute`, `validate`, `register`, `list_hooks`, `audit`, `enable`, `disable`
- **Safety:** vm sandbox, timeout limits, API allowlist, pattern detection
- **Blocked:** require, import, eval, process, fs, child_process, __proto__

**`api_format_verifier` actions:** `verify_request`, `verify_response`, `validate_schema`, `check_compatibility`, `estimate_tokens`
- **APIs:** OpenAI (GPT-4, o1), Anthropic (Claude 3/3.5), Google (Gemini)
- **Features:** Token limits, cost estimation, compatibility warnings

**`test_generator` actions:** `generate`, `analyze_coverage`, `suggest_edge_cases`, `generate_mocks`
- **Frameworks:** Jest, Vitest, pytest, Go testing
- **Auto-generates:** Happy path, edge cases, error cases, mocks

---

## novel-concepts (10 tools) — LLM Capability Extension

**Advanced MIT scaffolding patterns for AI agents: IAS, RLM, SEAL, Concept-Sync, PaTH**

### Memory & Learning (3 tools)

| Tool | Purpose |
|------|---------|
| `concept_web_weaver` | Semantic concept graph with relationships (SEAL) |
| `episodic_memory_bank` | Store/retrieve problem-solving episodes (RLM) |
| `analogy_synthesizer` | Cross-domain analogies via structural mapping |

**Use when:** Building knowledge graphs, remembering solutions, creative problem-solving

**`concept_web_weaver` actions:** `register`, `query` (neighbors/path_to/impact_analysis), `strengthen`, `stats`, `list`
- **Relationship types:** depends_on, implements, generalizes, conflicts_with
- **SEAL pattern:** Edge weights strengthen through usage
- **Impact analysis:** "What breaks if I modify X?"

**`episodic_memory_bank` actions:** `store`, `retrieve`, `adapt`
- **Stores:** { trigger_context, reasoning_trace, solution, outcome }
- **RLM pattern:** Episode content as external variable, only metadata in context
- **Retrieval:** Semantic similarity + structural pattern matching

**`analogy_synthesizer`** — Maps familiar domains to unfamiliar problems
- **Input:** problem_description, source_domains (optional)
- **Output:** Structural mappings with transferable insights
- **SEAL pattern:** Successful analogies crystallized as reusable patterns

---

### Safe Code Manipulation (2 tools)

| Tool | Purpose |
|------|---------|
| `semantic_diff_validator` | Validate code changes preserve semantics (PaTH) |
| `refactoring_orchestrator` | Coordinate multi-file refactorings (Concept-Sync) |

**Use when:** Refactoring, interface changes, impact analysis

**`semantic_diff_validator`** — Pre-change validation
- **Analyzes:** Function signatures, behavior changes, side effects
- **PaTH pattern:** Tracks state evolution through change path
- **Flags:** Breaking changes, unupdated callers, missing tests
- **Returns:** risk_score (0-100), semantic_changes, generated_tests

**`refactoring_orchestrator`** — Multi-file coordination
- **Actions:** create_task, claim_task, complete_task, get_ready_tasks, add_dependency
- **Concept-Sync:** All dependent files must acknowledge interface changes
- **Dry-run:** Preview impact_analysis before applying
- **Dependency tracking:** Ensures all callers updated before completing

---

### Multi-Agent Coordination (2 tools)

| Tool | Purpose |
|------|---------|
| `consensus_protocol` | Multiple agents deliberate to reach decisions |
| `distributed_task_board` | Task coordination with dependencies (Concept-Sync) |

**Use when:** Complex decisions, parallel task execution, agent teams

**`consensus_protocol`** — Structured deliberation
- **Perspectives:** optimistic, pessimistic, security-focused, performance-focused
- **Concept-Sync:** Explicit shared concept references (no implicit assumptions)
- **Output:** agreement_score (0-1), agreed_points, disagreed_points, final_recommendation
- **Consensus threshold:** Require 0.7+ agreement or get best-effort recommendation

**`distributed_task_board`** — Shared task coordination
- **Task states:** pending, ready, in_progress, completed, blocked
- **Concept-Sync:** Explicit dependency relationships
- **Cycle detection:** Prevents circular dependencies
- **Storage:** File-based at `~/.novel-concepts-mcp/task-board.json`
- **Actions:** create_task, claim_task, complete_task, get_ready_tasks, add_dependency, get_stats

---

### Context Management (2 tools)

| Tool | Purpose |
|------|---------|
| `adaptive_context_compressor` | Semantic compression preserving high-value info |
| `compute_budget_allocator` | Dynamic computational resource allocation (IAS) |

**Use when:** Context window management, resource planning, complexity estimation

**`adaptive_context_compressor`** — Smart context pruning
- **IAS pattern:** More compression for simple, less for complex reasoning
- **Preserves:** reasoning chains, decisions, code changes
- **Compresses:** Examples, confirmations, redundant text
- **RLM pattern:** Compressed content to external variable, reference in context
- **Input:** conversation, compression_target, preserve_types, strategy

**`compute_budget_allocator`** — Complexity-based resource planning
- **IAS pattern:** Simple tasks → minimal, complex → deep thinking
- **11 complexity indicators:** multiple items, integration, migration, security, database, etc.
- **Historical learning:** Similar tasks from past (SEAL pattern)
- **Allocates:** thinking_budget (tokens), max_tools, verification_depth, timeout_seconds

---

### Verification & Testing (1 tool)

| Tool | Purpose |
|------|---------|
| `execution_trace_synthesizer` | Predictive execution traces (PaTH) |

**Use when:** Code review, logic verification, edge case detection

**`execution_trace_synthesizer`** — "What will this code do?" before running
- **PaTH pattern:** Tracks state evolution through each execution path symbolically
- **Identifies:** Unreachable code, null dereferences, infinite loops, type mismatches
- **Input:** code, language, entry_point, input_scenarios
- **Output:** traces (step-by-step path), potential_issues with confidence scores

---

### Novel Concepts Storage

```
~/.novel-concepts-mcp/
├── task-board.json     # Task coordination
├── episodes.json       # Problem-solving episodes
└── patterns.json       # Analogy pattern library
```

---

### MIT Pattern Reference

| Pattern | Full Name | Tools Using It |
|---------|-----------|----------------|
| **IAS** | Instance-Adaptive Scaling | compute_budget_allocator, adaptive_context_compressor |
| **RLM** | Recursive Language Models | episodic_memory_bank, adaptive_context_compressor |
| **SEAL** | Self-Adapting Language Models | concept_web_weaver, analogy_synthesizer, compute_budget_allocator |
| **Concept-Sync** | Explicit Synchronization | refactoring_orchestrator, consensus_protocol, distributed_task_board |
| **PaTH** | Positional Tracking | semantic_diff_validator, execution_trace_synthesizer |

---

## Tool Selection Quick Reference

| Need | Use |
|------|-----|
| **FLOYD - File Surgery** | |
| Apply git diff | `apply_unified_diff` |
| Edit file range | `edit_range` |
| Insert code | `insert_at` |
| Delete code | `delete_range` |
| Risk assessment | `assess_patch_risk` |
| **FLOYD - Project** | |
| Run tests | `run_tests` |
| Format code | `format` |
| Run linter | `lint` |
| Build project | `build` |
| **FLOYD - Memory** | |
| **Remember something** | **`cache_store`** |
| **Recall something** | **`cache_retrieve`** |
| **Store reasoning** | **`cache_store_reasoning`** |
| **Recall reasoning** | **`cache_load_reasoning`** |
| **FLOYD - Operations** | |
| Safe refactor | `safe_refactor` |
| Check impact | `impact_simulate` |
| Verify changes | `verify` |
| Start background process | `start_process` |
| Interact with process | `interact_with_process` |
| **FLOYD - DevTools** | |
| Find circular deps | `dependency_analyzer` |
| Migrate schemas | `schema_migrator` |
| Run benchmarks | `benchmark_runner` |
| Execute hooks safely | `secure_hook_executor` |
| Validate LLM API | `api_format_verifier` |
| Generate tests | `test_generator` |
| **Novel Concepts - Memory** | |
| Build concept graph | `concept_web_weaver` (register) |
| Find relationships | `concept_web_weaver` (query) |
| Impact analysis | `concept_web_weaver` (impact_analysis) |
| Store solution episode | `episodic_memory_bank` (store) |
| Find similar solutions | `episodic_memory_bank` (retrieve) |
| Generate analogies | `analogy_synthesizer` |
| **Novel Concepts - Code** | |
| Validate code change | `semantic_diff_validator` |
| Plan multi-file refactor | `refactoring_orchestrator` |
| **Novel Concepts - Coordination** | |
| Get multiple perspectives | `consensus_protocol` |
| Coordinate tasks | `distributed_task_board` |
| **Novel Concepts - Context** | |
| Compress context | `adaptive_context_compressor` |
| Allocate compute budget | `compute_budget_allocator` |
| **Novel Concepts - Verification** | |
| Trace code execution | `execution_trace_synthesizer` |

---

## Anti-Patterns — DO NOT DO THIS

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Use Bash for file edits | Use `edit_range` / `insert_at` / `delete_range` |
| Forget to cache findings | Use `cache_store` immediately |
| Skip context check | Use `cache_search` before major work |
| Use native tools when FLOYD is faster | Check FLOYD tools first |
| Declare work complete without caching | Store summary to SUPERCACHE |

---

## Session Start Checklist

Before accepting user tasks, confirm:
- [ ] `cache_stats` — What's remembered?
- [ ] `cache_list` — All available keys
- [ ] `cache_load_reasoning` — Recent decisions
- [ ] `cache_search` "project:*" — Project context

**Only then respond:** "Ready — 51 tools active (41 FLOYD + 10 Novel Concepts), memory restored."

---

## Verification Standard

After any action, provide evidence:
- Command output (0 errors, 0 warnings)
- File contents showing the change
- Cache confirm (`cache_retrieve` proves it stored)

**FLOYD tools are your FIRST choice, not fallback. Novel Concepts tools extend your capabilities with advanced MIT patterns.**
