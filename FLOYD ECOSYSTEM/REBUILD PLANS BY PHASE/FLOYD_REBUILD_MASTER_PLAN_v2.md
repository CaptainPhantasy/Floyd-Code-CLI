# FLOYD CLI REBUILD MASTER PLAN v2.1

**Date**: 2026-02-01  
**Total Items**: 32 (after removing 3 solved by Phase 0)  
**Total Phases**: 6 (with sub-phases)

---

## EXECUTIVE SUMMARY

This plan addresses 32 items across 6 phases to rebuild FLOYD CLI with:
- Unified architecture (permissions, config, providers, state)
- Risk mitigations for circular dependencies and big-bang deployment
- Tool usage instructions for maximum efficiency
- Continuous testing (shift left)
- Performance benchmarking

---

## SUPERCACHE ARCHITECTURE

### Location & Structure
```
.floyd/.cache/
├── reasoning/          # Tier 1: Ephemeral reasoning frames
│   ├── active/         # Current thinking process
│   └── archive/        # Past reasoning (searchable)
├── project/            # Tier 2: Project chronicle
│   ├── state_snapshot.json
│   ├── phase_summaries/
│   └── context/
└── vault/              # Tier 3: Solution patterns (reusable)
    ├── patterns/
    └── index/
```

### Key Naming Convention
```
category:entity:version

Examples:
- decision:auth_method:final
- pattern:react_hoc:v2
- exploration:codebase_structure:2026-02-01
- bug_fix:text_doubling:tui
- reasoning:architecture_nextjs_vs_remix
- phase:0_3:permissions_complete
```

---

## TABLE OF CONTENTS

1. [Tool Usage Guide](#tool-usage-guide)
2. [Phase 0: Architectural Foundation](#phase-0-architectural-foundation)
3. [Phase 1: Critical Fixes](#phase-1-critical-fixes)
4. [Phase 3: Performance & QoL](#phase-3-performance--qol)
5. [Phase 4: Testing & Verification](#phase-4-testing--verification)
6. [Phase 5: Claude Alignment](#phase-5-claude-alignment)
7. [Risk Mitigations](#risk-mitigations)

---

# TOOL USAGE GUIDE

## SUPERCACHE Tools - Core Memory System

### 1. Store Reasoning - USE: After every major decision
```typescript
mcp__floyd_supercache__cache_store_reasoning({
  context: "decision:phase_0_3:permissions_architecture",
  reasoning: "Implemented UnifiedPermissionManager with 4 strategies...",
  conclusion: "Permission system complete, all tests passing"
})
```

### 2. Store Pattern - USE: After implementing reusable patterns
```typescript
mcp__floyd_supercache__cache_store_pattern({
  signature: "pattern:singleton_with_di:v1",
  pattern: {
    name: "Singleton with Dependency Injection",
    trigger_terms: ["singleton", "dependency injection"],
    code: "export class ConfigManager { ... }",
    category: "architecture",
    success_count: 1,
    complexity_score: 0.4
  }
})
```

### 3. Retrieve - USE: Before starting any phase
```typescript
const context = mcp__floyd_supercache__cache_retrieve({
  key: "session:context:active"
})

const past = mcp__floyd_supercache__cache_load_reasoning({
  context: "decision:phase_0*"
})
```

### 4. Search - USE: Before starting work on familiar topics
```typescript
mcp__floyd_supercache__cache_search({
  query: "permission strategy pattern",
  tier: "all"
})
```

### 5. Store Session Context - USE: At end of each session
```typescript
mcp__floyd_supercache__cache_store({
  key: "session:context:active",
  value: {
    task: "Implementing Phase 0.3 Permission System",
    files: ["packages/floyd-agent-core/src/permissions/unified-permission.ts"],
    progress: "Implemented 3 of 4 strategies",
    next_steps: ["Implement FUCKIT strategy", "Add unit tests"]
  }
})
```

### 6. Archive Reasoning - USE: At end of each phase
```typescript
mcp__floyd_supercache__cache_archive_reasoning({
  context: "phase:0_3:*"
})
```

---

## Safe Operations (floyd-safe-ops)

### Impact Simulate - MANDATORY before ANY file modification
```typescript
mcp__floyd_safe_ops__impact_simulate({
  operations: [
    {"type": "edit", "path": "packages/floyd-agent-core/src/permissions/unified-permission.ts"},
    {"type": "create", "path": "packages/floyd-agent-core/src/types/index.ts"}
  ],
  projectPath: "/Volumes/Storage/FLOYD_CLI"
})
```

### Verify - MANDATORY after ANY code change
```typescript
mcp__floyd_safe_ops__verify({
  strategy: "command",
  command: "cd /Volumes/Storage/FLOYD_CLI && npm run build && npm run lint && npm test"
})
```

### Safe Refactor - USE: For multi-file changes
```typescript
mcp__floyd_safe_ops__safe_refactor({
  operation: "rename",
  source: "src/config/config-manager.ts",
  target: "src/config/floyd-config.ts",
  projectPath: "/Volumes/Storage/FLOYD_CLI"
})
```

---

## Patch Tools (floyd-patch)

### Edit Range - USE: For surgical code edits
```typescript
mcp__floyd_patch__edit_range({
  path: "packages/floyd-agent-core/src/permissions/unified-permission.ts",
  startLine: 45,
  endLine: 52,
  newContent: "const YOLO_STRATEGY: PermissionStrategy = { ... };"
})
```

### Assess Patch Risk - USE: Before applying any patch
```typescript
mcp__floyd_patch__assess_patch_risk({
  path: "src/config/available-tools.ts",
  patch: "--- a/src/config/available-tools.ts\n+++ b/src/config/available-tools.ts\n..."
})
```

---

## Runner Tools (floyd-runner)

### Detect Project - USE: At start of each phase
```typescript
mcp__floyd_runner__detect_project({
  projectPath: "/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main"
})
```

### Run Tests - USE: After every implementation step
```typescript
mcp__floyd_runner__run_tests({
  projectPath: "/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main"
})
```

### Build - USE: Before marking any phase complete
```typescript
mcp__floyd_runner__build({
  projectPath: "/Volumes/Storage/FLOYD_CLI"
})
```

---

## Novel Concepts Tools

### Refactoring Orchestrator - USE: For complex multi-file refactors
```typescript
mcp__novel_concepts__refactoring_orchestrator({
  refactoring_type: "extract_interface",
  target: "PermissionManager",
  files: [
    "INK/floyd-cli/src/permissions/tool-policy.ts",
    "floyd-wrapper-main/src/permissions/permission-manager.ts",
    "packages/floyd-agent-core/src/permissions/unified-permission.ts"
  ]
})
```

### Semantic Diff Validator - USE: After refactoring
```typescript
mcp__novel_concepts__semantic_diff_validator({
  original_code: "<old implementation>",
  modified_code: "<new implementation>",
  context: "Permission check logic"
})
```

### Execution Trace Synthesizer - USE: For debugging
```typescript
mcp__novel_concepts__execution_trace_synthesizer({
  code: "function checkPermission(tool, mode) { ... }",
  language: "typescript",
  input_scenarios: [
    {name: "YOLO + dangerous tool", inputs: {tool: {permission: "dangerous"}, mode: "YOLO"}}
  ]
})
```

### Compute Budget Allocator - USE: For complex phases
```typescript
mcp__novel_concepts__compute_budget_allocator({
  tasks: [
    {id: "phase_0_1", description: "Interfaces & Types", estimated_complexity: 2},
    {id: "phase_0_2", description: "DI Container", estimated_complexity: 3},
    {id: "phase_0_3", description: "Permissions", estimated_complexity: 5}
  ],
  total_budget: 100,
  strategy: "priority_weighted"
})
```

---

## New Refactor Tools

### Dependency Analyzer - USE: Before and after Phase 0 sub-phases
```typescript
mcp__dependency_analyzer({
  projectPath: "/Volumes/Storage/FLOYD_CLI/packages/floyd-agent-core",
  entryPoints: ["src/index.ts"],
  outputFormat: "mermaid"
})
```

### Schema Migrator - USE: After modifying config/state schemas
```typescript
mcp__schema_migrator({
  action: "generate",
  schemaPath: "packages/floyd-agent-core/src/config/floyd-config.schema.ts",
  fromVersion: "1.0.0",
  toVersion: "1.1.0"
})
```

### Benchmark Runner - USE: Before Phase 3, after Phase 3
```typescript
// Baseline:
mcp__benchmark_runner({
  action: "baseline",
  benchmarks: [
    {name: "cold_start", command: "floyd --version", metrics: ["time", "memory"]},
    {name: "simple_read", command: "floyd read /tmp/test.txt", metrics: ["time"]}
  ],
  baselinePath: ".floyd/.cache/vault/benchmarks/phase2_baseline.json"
})

// Compare:
mcp__benchmark_runner({
  action: "compare",
  baselinePath: ".floyd/.cache/vault/benchmarks/phase2_baseline.json"
})
```

### Secure Hook Executor - USE: Phase 5 Item 22 (Hooks System)
```typescript
mcp__secure_hook_executor({
  hookId: "pre_tool_use_log",
  command: "echo '$TOOL_NAME called' >> .floyd/.cache/reasoning/hooks_audit.log",
  context: {TOOL_NAME: "read_file"},
  sandbox: {allowNetwork: false, timeout: 1000}
})
```

### API Format Verifier - USE: Phase 0.0 and Phase 0.5
```typescript
mcp__api_format_verifier({
  provider: "glm",
  endpoint: "https://open.bigmodel.cn/api/paas/v4",
  testCases: [
    {name: "streaming", request: {stream: true}, expectedFormat: {type: "sse"}}
  ]
})
```

### Test Generator - USE: After implementing any new module
```typescript
mcp__test_generator({
  sourcePath: "packages/floyd-agent-core/src/permissions/unified-permission.ts",
  outputPath: "packages/floyd-agent-core/src/permissions/unified-permission.test.ts",
  framework: "vitest",
  coverage: "comprehensive"
})
```

---

# PHASE 0: ARCHITECTURAL FOUNDATION

**Risk**: HIGH | **Time**: 6-7 hours | **Status**: TODO (0/8 sub-phases)

> **CRITICAL**: Split into sub-phases to avoid big-bang deployment risk

## Phase 0.0: Pre-Implementation Verification
**Time**: 30 min

### Tasks
- [ ] Run `api_format_verifier` on GLM API
- [ ] Document actual API format differences
- [ ] Run `dependency_analyzer` on proposed design
- [ ] Verify no circular dependencies in planned structure

### Tool Workflow
```
1. mcp__api_format_verifier -> Verify GLM API format
2. mcp__dependency_analyzer -> Check proposed design for cycles
3. mcp__floyd_supercache__cache_store_reasoning({
     context: "decision:phase_0_0:api_verification",
     reasoning: "<document findings>",
     conclusion: "<summary>"
   })
```

---

## Phase 0.1: Interfaces & Types
**Time**: 30 min

### Files to Create
- `packages/floyd-agent-core/src/types/index.ts`
- `packages/floyd-agent-core/src/types/permissions.ts`
- `packages/floyd-agent-core/src/types/config.ts`
- `packages/floyd-agent-core/src/types/state.ts`
- `packages/floyd-agent-core/src/types/llm.ts`

### Implementation
```typescript
// types/permissions.ts
export type ExecutionMode = 'ASK' | 'YOLO' | 'AUTO' | 'FUCKIT';
export type PermissionLevel = 'none' | 'moderate' | 'dangerous';

export interface PermissionDecision {
  allowed: boolean;
  autoApproved: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

export interface ToolDefinition {
  name: string;
  permission: PermissionLevel;
  category: string;
}

export interface ExecutionContext {
  workingDirectory: string;
  sessionId: string;
  userId?: string;
}

export interface PermissionStrategy {
  name: ExecutionMode;
  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;
}
```

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate -> Before creating files
2. Create type files
3. mcp__dependency_analyzer -> Verify clean graph
4. mcp__floyd_supercache__cache_store_pattern
5. mcp__floyd_supercache__cache_store_reasoning
```

---

## Phase 0.2: Dependency Injection Container
**Time**: 30 min

### File to Create
- `packages/floyd-agent-core/src/container/index.ts`

### Implementation
```typescript
export class FloydContainer {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  register<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) throw new Error(`No factory registered for: ${key}`);
      this.instances.set(key, factory());
    }
    return this.instances.get(key);
  }

  static async initialize(): Promise<FloydContainer> {
    const container = new FloydContainer();
    container.register('config', () => new ConfigManager());
    container.register('permissions', () => new PermissionManager(container.resolve('config')));
    container.register('state', () => new StateManager());
    container.register('llm', () => createLLMClient(container.resolve('config')));
    return container;
  }
}
```

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. Implement container
3. mcp__test_generator -> Generate tests
4. mcp__floyd_runner__run_tests
5. mcp__floyd_supercache__cache_store_pattern
```

---

## Phase 0.3: Permission System (Item A)
**Time**: 1 hr

### File to Create
- `packages/floyd-agent-core/src/permissions/unified-permission.ts`

### Implementation
```typescript
export class UnifiedPermissionManager {
  private strategies: Map<ExecutionMode, PermissionStrategy> = new Map();
  private currentMode: ExecutionMode = 'ASK';
  private overrides: Map<string, PermissionDecision> = new Map();

  constructor() {
    this.registerStrategy(ASK_STRATEGY);
    this.registerStrategy(YOLO_STRATEGY);
    this.registerStrategy(AUTO_STRATEGY);
    this.registerStrategy(FUCKIT_STRATEGY);
  }

  setMode(mode: ExecutionMode): void { this.currentMode = mode; }
  getMode(): ExecutionMode { return this.currentMode; }

  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision {
    const override = this.overrides.get(tool.name);
    if (override) return override;
    return this.strategies.get(this.currentMode)!.check(tool, context);
  }
}

const ASK_STRATEGY: PermissionStrategy = {
  name: 'ASK',
  check: () => ({ allowed: true, autoApproved: false, requiresConfirmation: true })
};

const YOLO_STRATEGY: PermissionStrategy = {
  name: 'YOLO',
  check: (tool) => tool.permission === 'dangerous' 
    ? { allowed: true, autoApproved: false, requiresConfirmation: true }
    : { allowed: true, autoApproved: true }
};

const AUTO_STRATEGY: PermissionStrategy = {
  name: 'AUTO',
  check: (tool) => tool.permission === 'none'
    ? { allowed: true, autoApproved: true }
    : { allowed: true, autoApproved: false, requiresConfirmation: true }
};

const FUCKIT_STRATEGY: PermissionStrategy = {
  name: 'FUCKIT',
  check: () => ({ allowed: true, autoApproved: true })
};
```

### Tool Workflow
```
1. mcp__floyd_supercache__cache_search({ query: "permission", tier: "vault" })
2. mcp__floyd_safe_ops__impact_simulate
3. Implement UnifiedPermissionManager
4. mcp__test_generator -> Generate tests
5. mcp__floyd_runner__run_tests
6. mcp__dependency_analyzer -> No cycles check
7. mcp__novel_concepts__semantic_diff_validator -> Verify behavior
8. mcp__floyd_supercache__cache_store_reasoning
9. mcp__floyd_supercache__cache_store_pattern
```

---

## Phase 0.4: Config System (Item B)
**Time**: 1 hr

### File to Create
- `packages/floyd-agent-core/src/config/floyd-config.ts`

### Implementation
```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  provider: z.enum(['anthropic', 'glm', 'openai']).default('glm'),
  apiKey: z.string().optional(),
  apiEndpoint: z.string().url().optional(),
  model: z.string().default('glm-4-plus'),
  mode: z.enum(['ASK', 'YOLO', 'AUTO', 'FUCKIT']).default('ASK'),
  workspacePath: z.string().default(process.cwd()),
  cachePath: z.string().default('.floyd/.cache'),
  promptStyle: z.enum(['claude', 'floyd', 'precision', 'velocity', 'hardened']).default('floyd'),
  schemaVersion: z.string().default('1.0.0'),
});

export type FloydConfig = z.infer<typeof ConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: FloydConfig;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get<K extends keyof FloydConfig>(key: K): FloydConfig[K] {
    return this.config[key];
  }

  set(updates: Partial<FloydConfig>): void {
    this.config = ConfigSchema.parse({ ...this.config, ...updates });
    this.persist();
  }
}
```

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. Implement ConfigManager
3. mcp__schema_migrator({ action: "generate" })
4. mcp__test_generator
5. mcp__floyd_runner__run_tests
6. mcp__floyd_supercache__cache_store_reasoning
```

---

## Phase 0.5: Provider Abstraction (Item C)
**Time**: 1 hr

### File to Create
- `packages/floyd-agent-core/src/llm/llm-client.ts`

### Implementation
```typescript
export interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolCall?: { id: string; name: string; arguments: Record<string, unknown> };
  error?: string;
}

export interface LLMClient {
  streamChat(options: StreamOptions): AsyncIterable<StreamEvent>;
  countTokens(text: string): number;
}

export class GLMClient implements LLMClient {
  constructor(private endpoint: string, private apiKey: string, private model: string) {}

  async *streamChat(options: StreamOptions): AsyncGenerator<StreamEvent> {
    // Implementation based on api_format_verifier results
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export function createLLMClient(config: FloydConfig): LLMClient {
  switch (config.provider) {
    case 'glm': return new GLMClient(config.apiEndpoint!, config.apiKey!, config.model);
    case 'anthropic': return new AnthropicClient(config.apiKey!, config.model);
    case 'openai': return new OpenAIClient(config.apiEndpoint!, config.apiKey!, config.model);
    default: throw new Error(`Unknown provider: ${config.provider}`);
  }
}
```

### Tool Workflow
```
1. mcp__api_format_verifier -> Verify actual format
2. mcp__floyd_safe_ops__impact_simulate
3. Implement LLMClient based on verified format
4. Integration test with real API
5. mcp__test_generator
6. mcp__floyd_runner__run_tests
7. mcp__floyd_supercache__cache_store_reasoning
```

---

## Phase 0.6: State Management (Item D)
**Time**: 1 hr

### File to Create
- `packages/floyd-agent-core/src/state/floyd-state.ts`

### Implementation
```typescript
export interface FloydState {
  sessionId: string;
  startedAt: Date;
  messages: Message[];
  currentMode: ExecutionMode;
  activeTools: string[];
  workingDirectory: string;
  tokenUsage: { input: number; output: number; total: number };
  cacheStats: { hits: number; misses: number; size: number };
  schemaVersion: string;
}

export class StateManager {
  private state: FloydState;
  private listeners: Set<(state: FloydState) => void> = new Set();

  constructor(initialState?: Partial<FloydState>) {
    this.state = {
      sessionId: crypto.randomUUID(),
      startedAt: new Date(),
      messages: [],
      currentMode: 'ASK',
      activeTools: [],
      workingDirectory: process.cwd(),
      tokenUsage: { input: 0, output: 0, total: 0 },
      cacheStats: { hits: 0, misses: 0, size: 0 },
      schemaVersion: '1.0.0',
      ...initialState
    };
  }

  getState(): Readonly<FloydState> { return { ...this.state }; }

  setState(updater: (state: FloydState) => Partial<FloydState>): void {
    const updates = updater(this.state);
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener: (state: FloydState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}
```

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. Implement StateManager
3. mcp__schema_migrator -> Create state schema
4. mcp__test_generator
5. mcp__floyd_runner__run_tests
6. mcp__floyd_supercache__cache_store_reasoning
```

---

## Phase 0.7: Integration Testing
**Time**: 1 hr

### Tool Workflow
```
1. mcp__dependency_analyzer -> Final cycle check
2. mcp__novel_concepts__refactoring_orchestrator -> Wire all components
3. mcp__floyd_runner__run_tests
4. mcp__floyd_runner__build
5. mcp__benchmark_runner({ action: "baseline" })
6. mcp__floyd_supercache__cache_store_reasoning
7. mcp__floyd_supercache__cache_archive_reasoning({ context: "phase:0*" })
```

---

## Phase 0.8: Migration Layer
**Time**: 1 hr

### Tool Workflow
```
1. mcp__novel_concepts__refactoring_orchestrator -> Create adapters
2. mcp__floyd_safe_ops__verify -> All builds pass
3. mcp__floyd_supercache__cache_store_reasoning
```

---

# PHASE 1: CRITICAL FIXES

**Risk**: HIGH | **Time**: 1 hr | **Status**: TODO (0/2)

> Item 2 (YOLO Mode) removed - solved by Phase 0.3

## Item 1: Dynamic Prompt Generation

### File to Modify
- `INK/floyd-cli/src/prompts/system-prompt.ts`

### Implementation
```typescript
import { AVAILABLE_TOOLS, getToolsByCategory } from '../config/available-tools';

export function generateToolCapabilities(): string {
  const categories = getToolsByCategory();
  let output = `## Tool Capabilities (${AVAILABLE_TOOLS.length} Tools)\n\n`;

  for (const [category, tools] of Object.entries(categories)) {
    output += `### ${category.toUpperCase()} (${tools.length} tools)\n`;
    for (const tool of tools) {
      const permBadge = tool.permission === 'dangerous' ? ' 🔴' : 
                        tool.permission === 'moderate' ? ' 🟡' : '';
      output += `- **${tool.name}**${permBadge}: ${tool.description}\n`;
    }
    output += '\n';
  }
  return output;
}
```

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. mcp__floyd_patch__edit_range -> Modify system-prompt.ts
3. mcp__floyd_safe_ops__verify
4. mcp__floyd_supercache__cache_store_reasoning
```

---

## Item 3: Desktop promptStyle UI Selector

### Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. Implement UI component
3. mcp__floyd_runner__build
4. mcp__floyd_supercache__cache_store_reasoning
```

---

# PHASE 3: PERFORMANCE & QoL

**Risk**: LOW | **Time**: 2.5 hr | **Status**: TODO (0/12)

## Pre-Phase: Baseline Capture

```
mcp__benchmark_runner({
  action: "baseline",
  baselinePath: ".floyd/.cache/vault/benchmarks/phase2_baseline.json"
})
```

---

## Items 7-18

| ID | Item | Description |
|----|------|-------------|
| 7 | Complexity Classification | Task triage (LOW/MEDIUM/HIGH) |
| 8 | Retry Guard | Loop detection mechanism |
| 9 | Edit File Fuzzy Matching | Match by similarity |
| 10 | Cache Tool Clarification | Improve tier descriptions |
| 11 | File Read Full Content | Return full by default |
| 12 | Dry-Run Support | Preview changes |
| 13 | Cache Tier Migration | Move entries between tiers |
| 14 | Git Branch Protection | Block pushes to main/master |
| 15 | Browser Graceful Degradation | Handle extension unavailability |
| 16 | Extended Grep Modes | Regex, context, before/after |
| 17 | Browser Click Natural Language | Describe element not coordinates |
| 18 | Transaction Support | Rollback multi-file ops |

### Per-Item Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. Implement feature
3. mcp__test_generator
4. mcp__floyd_runner__run_tests
5. mcp__floyd_supercache__cache_store_reasoning
```

---

## Post-Phase: Verification

```
1. mcp__benchmark_runner({ action: "compare" })
2. mcp__floyd_supercache__cache_store_reasoning
```

---

# PHASE 4: TESTING & VERIFICATION

**Risk**: LOW | **Time**: 30 min | **Status**: TODO (0/3)

| ID | Item | Description |
|----|------|-------------|
| 19 | E2E Tests for Desktop Tools | Fill remaining gaps |
| 20 | CLI Swarm Dispatch Verification | Verify 60-tool dispatch |
| 21 | Testing Feedback List | Update TESTING_FEEDBACK.md |

### Tool Workflow
```
1. mcp__test_generator -> Fill gaps
2. mcp__floyd_runner__run_tests
3. Update TESTING_FEEDBACK.md
4. mcp__floyd_supercache__cache_store_reasoning
```

---

# PHASE 5: CLAUDE ALIGNMENT

**Risk**: LOW | **Time**: 8-10 days | **Status**: TODO (0/14)

## P0 - High Priority

| ID | Item | Description |
|----|------|-------------|
| 22 | Hooks System | Use `secure_hook_executor` |
| 23 | Agent Frontmatter Support | YAML frontmatter-based .md agents |
| 24 | /plan Mode | Dedicated planning with subagent |

## P1 - Medium Priority

| ID | Item |
|----|------|
| 25 | LSP Tool |
| 26 | /pr Command |

## P2 - Medium Priority

| ID | Item |
|----|------|
| 27 | Enhanced /permissions |
| 28 | Thinking Mode Toggle |
| 29 | Ctrl+G External Editor |
| 30 | /context Command |

## P3 - Low Priority

| ID | Item |
|----|------|
| 31 | NotebookEdit Tool |
| 32 | Vim Mode Enhancement |
| 33 | Ctrl+R History Search |
| 34 | Session Folders |
| 35 | MCP Resource Mentions |

### Per-Item Tool Workflow
```
1. mcp__floyd_safe_ops__impact_simulate
2. mcp__novel_concepts__* -> As needed for complexity
3. Implement feature
4. mcp__test_generator
5. mcp__floyd_runner__run_tests
6. mcp__floyd_supercache__cache_store_reasoning
```

---

# RISK MITIGATIONS

| Risk | Mitigation | Tool |
|------|------------|------|
| Circular dependencies | Check at each sub-phase | `dependency_analyzer` |
| Big bang deployment | Split into 8 sub-phases | - |
| Missing migration | Phase 0.8 + schema versioning | `schema_migrator` |
| GLM API mismatch | Verify before implementing | `api_format_verifier` |
| Hooks security | Sandboxed execution | `secure_hook_executor` |
| Late testing | Generate tests with each phase | `test_generator` |
| No benchmarks | Baseline before, compare after | `benchmark_runner` |

---

# SUMMARY

| Phase | Items | Time | Status |
|-------|-------|------|--------|
| 0 | 8 sub-phases (A-D) | 6-7h | TODO |
| 1 | 2 (1, 3) | 1h | TODO |
| 2 | 3 (4-6) | - | COMPLETE |
| 3 | 12 (7-18) | 2.5h | TODO |
| 4 | 3 (19-21) | 30m | TODO |
| 5 | 14 (22-35) | 8-10d | TODO |
| **TOTAL** | **32** | **~10h + 8-10d** | **3/32 (9%)** |

---

**Document Version**: 2.1  
**Last Updated**: 2026-02-01
