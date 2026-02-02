# FLOYD CLI REFACTOR PLAN - ALIGNMENT TASK LIST

**Generated:** 2026-02-02
**Baseline:** 89% complete (187/210 points)
**Goal:** 100% alignment with refactor plan
**Working Directory:** `/Volumes/Storage/FLOYD_CLI`

---

## EXECUTIVE SUMMARY

```
████████████████████████████░░ 89.0%
```

| Phase | Items | Score | Status |
|-------|-------|-------|--------|
| Phase 0: Architectural Foundation | 4 | 39/40 (97.5%) | ✅ COMPLETE |
| Phase 1: Permission System | 2 | 19/20 (95.0%) | ✅ COMPLETE |
| Phase 2: Tool Execution | 3 | 13/30 (43.3%) | ⚠️ NEEDS WORK |
| Phase 3: Advanced Operations | 12 | 116/120 (96.7%) | ✅ COMPLETE |
| **OVERALL** | **21** | **187/210 (89.0%)** | **A-** |

---

## PRIORITY OVERVIEW

```
🔴 P0 - CRITICAL (2 tasks)    ────────  ~3-4 days
├── #4: Tool Parameter Validation Layer    [Phase 2]
└── #5: Terminal Tool ENOENT Handling        [Phase 2]

🟡 P1 - HIGH (1 task)          ───────────  ~1 day
└── #6: File Read Chunking Integration       [Phase 2]

🟢 P2 - LOW (2 tasks)          ───────────  ~1 day
├── #7: DeepSeek LLM Client                [Phase 0]
└── #8: Mode-Specific System Prompts         [Phase 1]

TOTAL EFFORT: ~5-6 days
```

---

## 🔴 P0 TASKS

### #4: Implement Tool Parameter Validation Layer

**Phase:** 2 - Tool Execution Fixes
**Current Gap:** 0/10 (NOT IMPLEMENTED)
**Effort:** 2-3 days
**Priority:** P0 - CRITICAL (safety)

**Problem:**
No validation layer before tool execution. Invalid parameters can cause silent failures or unexpected behavior. Tools accept any input without schema validation.

**Root Cause:**
Missing validation middleware in tool execution pipeline.

**Deliverables:**
1. Create `packages/floyd-agent-core/src/validation/validator.ts`
2. Implement JSON Schema validation for all tool inputs
3. Add pre-execution validation hooks
4. Create user-friendly validation error messages
5. Integrate validation into tool execution pipeline

**Acceptance Criteria:**
- [ ] All tool parameters validated before execution
- [ ] Invalid inputs return `ToolError` with `INVALID_INPUT` type
- [ ] Validation errors include field name and helpful message
- [ ] Unit tests for validation layer (90%+ coverage)
- [ ] Integrated with MCP servers

**Files to Create:**
```
packages/floyd-agent-core/src/validation/
├── validator.ts           # Main validation logic
├── schema-registry.ts     # Tool schema definitions
├── validation-hooks.ts    # Pre-execution hooks
└── index.ts
```

**Related Files:**
- `packages/floyd-agent-core/src/permissions/unified-permission.ts`
- `packages/floyd-agent-core/src/llm/types.ts`
- `src/mcp/runner-server.ts`
- `src/mcp/patch-server.ts`

**Implementation Reference:**
```typescript
// validation/validator.ts
export interface ValidationError {
  field: string;
  message: string;
  received: unknown;
}

export interface ValidationSchema {
  type: 'object';
  properties: Record<string, { type: string; description?: string }>;
  required: string[];
}

export function validateToolInput(
  toolName: string,
  input: Record<string, unknown>,
  schema: ValidationSchema
): ValidationError | null {
  // Validate against schema
  // Return null if valid, ValidationError if invalid
}
```

---

### #5: Fix Terminal Tool ENOENT Handling

**Phase:** 2 - Tool Execution Fixes
**Current Gap:** 4/10 (PARTIAL)
**Effort:** 1 day
**Priority:** P0 - CRITICAL (UX)

**Problem:**
Commands fail with ENOENT. PATH not properly inherited. No user-friendly error messages or path suggestions.

**Root Cause:**
Shell environment not properly initialized. Commands like `ls`, `echo`, `npm` fail because shell profiles aren't loaded.

**Deliverables:**
1. Fix `src/mcp/runner-server.ts` shell environment initialization
2. Implement login shell spawning for full environment
3. Add path correction suggestions
4. Create working directory validation
5. Add ENOENT-specific user-friendly error messages

**Acceptance Criteria:**
- [ ] Commands like `ls`, `echo`, `npm`, `git` work without ENOENT
- [ ] Missing commands suggest installation (e.g., "Install Node.js with: brew install node")
- [ ] Working directory validated before execution
- [ ] Full shell profile loaded (PATH, aliases, functions)
- [ ] ENOENT errors include actionable suggestions

**Files to Modify:**
```
src/mcp/runner-server.ts
src/mcp/runner-server/src/executor.ts
packages/floyd-agent-core/src/guards/retry-guard.ts
```

**Implementation Reference (from refactor plan):**
```typescript
// Alternative: Spawn with login shell for full environment
const shell = process.env.SHELL || '/bin/bash';
const result = await execa(`${shell} -lc "${command} ${args.join(' ')}"`, {
  cwd: executionCwd,
  timeout,
  env: { ...process.env, ...env }
});
```

**Verification Commands:**
```bash
pwd          # ✅ should work
ls -la        # ✅ should work
echo test     # ✅ should work
npm test      # ✅ should work
git status    # ✅ should work
```

---

## 🟡 P1 TASKS

### #6: Integrate File Read Chunking into read_file Tool

**Phase:** 2 - Tool Execution Fixes
**Current Gap:** 6/10 (FUNCTIONS EXIST, NOT INTEGRATED)
**Effort:** 1 day
**Priority:** P1 - HIGH

**Problem:**
Chunking functions exist in `file-read.ts` but are not used by the actual read_file tool. Large files exceed context window and get truncated.

**Root Cause:**
Chunking logic created but not wired into tool execution pipeline.

**Current State:**
- `shouldChunk()` function exists
- `calculateChunkCount()` function exists
- `calculateLineRange()` function exists
- No automatic chunking for large files
- No chunk pagination protocol

**Deliverables:**
1. Wire up `shouldChunk()` into read_file tool execution
2. Implement automatic chunking for files >50K tokens
3. Add chunk pagination protocol for LLM context
4. Create context window awareness
5. Add chunk metadata to responses

**Acceptance Criteria:**
- [ ] Files >50K tokens automatically chunked
- [ ] Each chunk includes line range metadata (start-end)
- [ ] Chunk boundaries respect code structure (no mid-function breaks)
- [ ] LLM receives chunk information in tool response
- [ ] Multi-chunk files include total chunk count

**Files to Modify:**
```
packages/floyd-agent-core/src/io/file-read.ts
src/mcp/explorer-server.ts (read_file tool implementation)
```

**Implementation Reference:**
```typescript
// In read_file tool
const { shouldChunk, calculateChunkCount } = await import('@floyd/agent-core/io');

if (shouldChunk(filePath)) {
  const chunkCount = calculateChunkCount(filePath);
  // Return first chunk with metadata
  return {
    success: true,
    data: firstChunk,
    metadata: {
      chunked: true,
      currentChunk: 1,
      totalChunks: chunkCount,
      lineRange: { start: 1, end: 500 }
    }
  };
}
```

---

## 🟢 P2 TASKS

### #7: Implement DeepSeek LLM Client

**Phase:** 0 - Architectural Foundation
**Current Gap:** 9/10 (MINOR)
**Effort:** 0.5 day
**Priority:** P2 - LOW

**Problem:**
LLM types reference DeepSeek but client not implemented. Missing provider option.

**Root Cause:**
DeepSeek API client not created when LLM abstraction was implemented.

**Current State:**
- `LLMClient` interface exists
- AnthropicClient ✅
- GLMClient ✅
- OpenAIClient ✅
- DeepSeekClient ❌

**Deliverables:**
1. Create `packages/floyd-agent-core/src/llm/deepseek-client.ts`
2. Implement `LLMClient` interface
3. Follow existing client pattern (Anthropic/GLM/OpenAI)
4. Add DeepSeek API endpoint configuration
5. Export in main index
6. Update ConfigManager to support deepseek provider

**Acceptance Criteria:**
- [ ] DeepSeekClient implements LLMClient interface
- [ ] Streaming support via AsyncGenerator<StreamChunk>
- [ ] Tool calls properly formatted for DeepSeek API
- [ ] Error handling consistent with other clients
- [ ] Exported from `src/llm/index.ts`
- [ ] ConfigManager accepts 'deepseek' as provider option

**Files to Create:**
```
packages/floyd-agent-core/src/llm/deepseek-client.ts
```

**Files to Modify:**
```
packages/floyd-agent-core/src/llm/index.ts
packages/floyd-agent-core/src/config/floyd-config.ts
```

**Implementation Reference (from glm-client.ts):**
```typescript
export class DeepSeekClient implements LLMClient {
  constructor(config: FloydConfig) {
    this.endpoint = config.apiEndpoint;
    this.apiKey = config.apiKey;
  }

  async *streamChat(options: StreamOptions): AsyncGenerator<StreamChunk> {
    // Implement streaming logic
  }

  cancel(): void {
    // Implement cancellation
  }
}
```

---

### #8: Add Mode-Specific System Prompt Assembly

**Phase:** 1 - Permission System
**Current Gap:** 9/10 (MINOR)
**Effort:** 0.5 day
**Priority:** P2 - LOW

**Problem:**
Limited mode-specific system prompt assembly. Tool capabilities don't adapt to permission mode. Users may be confused about what requires permission.

**Root Cause:**
System prompt generation doesn't fully account for current permission mode.

**Current State:**
- `generateToolCapabilities()` exists
- Mode-specific descriptions partially implemented
- Not fully integrated with `UnifiedPermissionManager`

**Deliverables:**
1. Extend `generateToolCapabilities()` to accept mode parameter
2. Add mode-specific permission descriptions to system prompt
3. Integrate with `UnifiedPermissionManager` mode detection
4. Update system prompt templates for each mode (YOLO, ASK, PLAN, AUTO, DIALOGUE, FUCKIT)
5. Test mode switching updates system prompt correctly

**Acceptance Criteria:**
- [ ] System prompt explicitly states current permission mode
- [ ] Tool descriptions reflect mode behavior (auto-approved vs requires permission)
- [ ] YOLO mode prompt clearly indicates auto-approval behavior
- [ ] PLAN mode prompt indicates read-only restrictions
- [ ] Mode switching immediately reflects in system prompt

**Files to Modify:**
```
packages/floyd-agent-core/src/prompts/tool-capabilities.ts
packages/floyd-agent-core/src/prompts/available-tools.ts
```

**Implementation Reference:**
```typescript
// Extend generateToolCapabilities()
export function generateToolCapabilities(mode: PermissionMode = 'ask'): string {
  const categories = getToolsByCategory();
  let output = `## Tool Capabilities (${AVAILABLE_TOOLS.length} Tools)\n\n`;

  // Add mode-specific header
  output += `**Permission Mode: ${mode.toUpperCase()}**\n\n`;

  if (mode === 'yolo') {
    output += `All tools with permission 'none' and 'moderate' are auto-approved.\n`;
    output += `Only 'dangerous' tools require confirmation.\n\n`;
  } else if (mode === 'plan') {
    output += `Read-only mode - all write/destructive operations are disabled.\n\n`;
  } else if (mode === 'ask') {
    output += `Read operations are auto-approved.\n`;
    output += `Write and destructive operations require confirmation.\n\n`;
  }

  // Rest of tool listing...
  return output;
}
```

---

## DEPENDENCY GRAPH

```
#4 (Validation Layer)
    ├── blocks → #6 (Chunking) - validation needed before chunking
    └── blocks → #5 (Terminal) - validation needed for command execution

#5 (Terminal ENOENT)
    └── blocked by → #4 (Validation Layer)

#6 (File Chunking)
    └── independent - can start after #4

#7 (DeepSeek)
    └── independent - no dependencies

#8 (Mode Prompts)
    └── independent - no dependencies
```

---

## EXECUTION ORDER

```
Week 1 (Critical Path):
├── Day 1-3:  #4 Parameter Validation Layer
└── Day 4:    #5 Terminal ENOENT Handling

Week 2 (High & Low):
├── Day 1:    #6 File Read Chunking
├── Day 2:    #7 DeepSeek Client
└── Day 3:    #8 Mode-Specific Prompts
```

---

## PHASE-BY-PHASE ALIGNMENT TARGETS

### Phase 0: Architectural Foundation
**Current:** 97.5% → **Target:** 100% (+2.5%)

| Item | Current | Target | Task |
|------|---------|--------|------|
| Provider Abstraction | 9/10 | 10/10 | #7: DeepSeek Client |

### Phase 1: Permission System
**Current:** 95.0% → **Target:** 100% (+5%)

| Item | Current | Target | Task |
|------|---------|--------|------|
| Dynamic Prompts | 9/10 | 10/10 | #8: Mode-Specific Prompts |

### Phase 2: Tool Execution
**Current:** 43.3% → **Target:** 100% (+56.7%)

| Item | Current | Target | Task |
|------|---------|--------|------|
| Parameter Validation | 0/10 | 10/10 | #4: Validation Layer |
| Terminal ENOENT | 4/10 | 10/10 | #5: ENOENT Handling |
| Error Responses | 9/10 | 10/10 | Already complete |

### Phase 3: Advanced Operations
**Current:** 96.7% → **Target:** 100% (+3.3%)

| Item | Current | Target | Task |
|------|---------|--------|------|
| File Chunking | 6/10 | 10/10 | #6: Chunking Integration |

---

## PROGRESS TRACKING

| Phase | Plan | Current | After Tasks | Delta |
|-------|------|---------|--------------|-------|
| Phase 0 | 97.5% | 97.5% | 100% | +2.5% |
| Phase 1 | 95.0% | 95.0% | 100% | +5.0% |
| Phase 2 | 43.3% | 43.3% | 100% | +56.7% |
| Phase 3 | 96.7% | 96.7% | 100% | +3.3% |
| **OVERALL** | **89.0%** | **89.0%** | **100%** | **+11.0%** |

---

## VERIFICATION CHECKLIST

### Pre-Completion (per task)
- [ ] Code follows existing patterns in `floyd-agent-core`
- [ ] TypeScript compiles without errors
- [ ] No new linting violations
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Documentation updated

### Post-Completion (all tasks)
- [ ] `npm run lint` passes without errors
- [ ] `npm run build` completes successfully
- [ ] `npm test` shows >90% coverage for new code
- [ ] Terminal commands work without ENOENT errors
- [ ] Large files (>50K tokens) are automatically chunked
- [ ] DeepSeek client streams responses correctly
- [ ] System prompts reflect current permission mode
- [ ] Final alignment audit shows 100% completion

---

## REFERENCE FILES

### Core Architecture
- `packages/floyd-agent-core/src/permissions/unified-permission.ts` (752 lines)
- `packages/floyd-agent-core/src/config/floyd-config.ts` (676 lines)
- `packages/floyd-agent-core/src/state/floyd-state.ts` (820 lines)
- `packages/floyd-agent-core/src/llm/` (4 client implementations)

### Tools & MCP Servers
- `src/mcp/runner-server.ts` - Terminal execution
- `src/mcp/explorer-server.ts` - File operations
- `src/mcp/patch-server.ts` - Patch operations

### Validation References
- `packages/floyd-agent-core/src/permissions/risk-classifier.ts` - Risk patterns
- `packages/floyd-agent-core/src/io/dry-run.ts` - Dry-run pattern

---

## NOTES

- All tasks should follow existing code patterns in `packages/floyd-agent-core`
- Use TypeScript strict mode throughout
- Maintain platform-agnostic design (no UI framework dependencies)
- Test on Node.js >=20 (floyd-agent-core requirement)
- Document new functions with TSDoc comments
- Update REFACTOR_PHASE_STATUS.json upon completion

---

**Last Updated:** 2026-02-02
**Status:** 6 tasks pending, ready for assignment
