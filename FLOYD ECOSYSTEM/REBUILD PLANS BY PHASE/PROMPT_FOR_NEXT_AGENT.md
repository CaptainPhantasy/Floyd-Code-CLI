# PHASE 0: ARCHITECTURAL FOUNDATION - AGENT PROMPT

**Agent Type Required:** `repo-god-architect` or `butterfly-effect`
**Risk Level:** HIGH
**Estimated Time:** 3-4 hours
**Dependencies:** None (but Items A-D are tightly coupled - DO ALL 4 TOGETHER)

---

## AUDIT STATUS (As of 2026-01-29)

**Main FLOYD CLI Rebuild:** 3/35 complete (8.6%)
- Phase 2: ✅ COMPLETE (Items 4-6 verified)
- Phase 0: TODO (Items A-D) ← **YOU ARE HERE**

**Blocker:** Phase 0 blocks Phase 1 Item 2 (YOLO Mode Permission Consistency)

---

## YOUR MISSION

Implement **4 tightly coupled architectural items** that create the foundation for ALL remaining phases.

**CRITICAL WARNING:** DO NOT implement these items individually. They are interdependent:
- **Item A** (Permissions) must be done first
- **Item B** (Config) depends on A
- **Item C** (Provider) depends on B
- **Item D** (State) depends on C

**Strategy:** Implement all 4 in a single coordinated effort, then test together.

---

## ITEM A: Unified Permission System (CRITICAL)

### Problem Statement
Permission behavior varies across CLI, wrapper, and Desktop:
- `INK/floyd-cli/src/permissions/tool-policy.ts` has one implementation
- `floyd-wrapper-main/src/permissions/permission-manager.ts` has another
- `packages/floyd-agent-core/src/permissions/permission-manager.ts` is a "reference implementation"
- YOLO mode is hardcoded differently in each

### Existing Implementation (READ THIS FIRST)

**File:** `packages/floyd-agent-core/src/permissions/permission-manager.ts`
- Has `SimplePermissionManager` class with `checkPermission()` method
- Returns `PermissionLevel = 'ask' | 'allow' | 'deny'`
- Has wildcard pattern support
- Lacks: ExecutionMode strategies (ASK/YOLO/PLAN), tool context awareness

**File:** `floyd-wrapper-main/src/permissions/permission-manager.ts`
- Production permission system with readline prompting
- Risk classification (needs review)

### What You Need to Create

**NEW:** `packages/floyd-agent-core/src/permissions/unified-permission.ts`

```typescript
// Core interfaces
export type ExecutionMode = 'ASK' | 'YOLO' | 'PLAN' | 'AUTO' | 'DIALOGUE' | 'FUCKIT';

export interface PermissionStrategy {
  name: ExecutionMode;
  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;
}

export interface PermissionDecision {
  allowed: boolean;
  autoApproved?: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

export interface ToolDefinition {
  name: string;
  permission?: 'none' | 'moderate' | 'dangerous';
  destructive?: boolean;
}

export interface ExecutionContext {
  mode: ExecutionMode;
  workspacePath: string;
  toolName: string;
}

// Main unified manager
export class UnifiedPermissionManager {
  private strategies: Map<ExecutionMode, PermissionStrategy> = new Map();
  private currentMode: ExecutionMode = 'ASK';

  setMode(mode: ExecutionMode): void;
  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;

  // Mode-specific strategies
  private askStrategy: PermissionStrategy;
  private yoloStrategy: PermissionStrategy;  // Auto-approve moderate, ask dangerous
  private planStrategy: PermissionStrategy;
  // ... other modes
}
```

### Verification Criteria
1. All modes (ASK/YOLO/PLAN/AUTO/DIALOGUE/FUCKIT) work consistently
2. Security audit: No permission bypass paths
3. Integration tests: All mode/tool combinations pass
4. Backward compatible: Existing code still works

---

## ITEM B: Configuration Standardization (CRITICAL)

### Problem Statement
Configuration is fragmented:
- `floyd-wrapper-main/src/utils/config.ts` has `FloydConfig` interface
- `INK/floyd-cli/src/utils/config.ts` has a different config
- `FloydDesktopWeb/server/index.ts` has its own config
- Hardcoded defaults scattered everywhere

### Existing Implementation (READ THIS FIRST)

**File:** `floyd-wrapper-main/src/utils/config.ts`
- Has `FloydConfig` interface with GLM settings, feature flags, permissions
- `loadConfig()` reads from environment variables only
- NO persistence to `~/.floyd/config.json`
- NO hot-reload on config file changes

### What You Need to Create

**NEW:** `packages/floyd-agent-core/src/config/floyd-config.ts`

```typescript
// Unified config interface (extend existing FloydConfig)
export interface FloydConfig {
  // API (from existing)
  provider: 'anthropic' | 'glm' | 'openai';
  apiKey: string;
  apiEndpoint: string;
  model: string;

  // Mode (from existing)
  mode: ExecutionMode;  // Use Item A's type

  // Paths
  workspacePath: string;
  cachePath: string;
  configPath: string;  // ~/.floyd/config.json

  // Prompts
  promptStyle: 'claude' | 'floyd47' | 'hardened' | 'suggested';

  // Permissions (from existing, extend)
  autoConfirm: boolean;
  allowDangerous: boolean;

  // Feature flags (from existing)
  useSuggestedPrompt: boolean;
  useHardenedPrompt: boolean;
  useFloyd47Prompt: boolean;
  useClaudePrompt: boolean;
  enablePreservedThinking: boolean;
  enableTurnLevelThinking: boolean;
  // ... etc
}

// Singleton ConfigManager
export class ConfigManager {
  private static instance: ConfigManager;
  private config: FloydConfig;
  private watchers: Set<(config: FloydConfig) => void> = new Set();

  static getInstance(): ConfigManager;

  get(): Readonly<FloydConfig>;
  set(updates: Partial<FloydConfig>): void;

  // NEW: Persistence
  private persist(): void;  // Save to ~/.floyd/config.json
  private load(): FloydConfig;  // Load from file + env + defaults

  // NEW: Hot-reload
  watch(callback: (config: FloydConfig) => void): () => void;
  private notify(): void;
}

// Factory
export function loadConfig(configPath?: string): FloydConfig;
export function saveConfig(config: Partial<FloydConfig>): void;
```

### File Locations for Config
- **Default:** `~/.floyd/config.json`
- **Project override:** `.floyd/config.json`
- **Environment variables:** Override all (FLOYD_GLM_API_KEY, etc.)

### Verification Criteria
1. All three platforms (CLI/wrapper/Desktop) read from same ConfigManager
2. Environment variables override defaults
3. Config file changes trigger hot-reload
4. No hardcoded defaults in application code

---

## ITEM C: Provider Abstraction Layer (CRITICAL)

### Problem Statement
GLM uses OpenAI format, but code expects Anthropic format in some places:
- `floyd-wrapper-main/src/llm/glm-client.ts` is a standalone GLM client (WORKING, DO NOT BREAK)
- `packages/floyd-agent-core/src/llm/factory.ts` has provider detection
- `packages/floyd-agent-core/src/llm/anthropic-client.ts` exists
- `packages/floyd-agent-core/src/llm/openai-client.ts` exists

**CRITICAL:** The GLM client in `floyd-wrapper-main` is marked "DO NOT MODIFY" - it works.

### Existing Implementation (READ THIS FIRST)

**File:** `packages/floyd-agent-core/src/llm/factory.ts`
- Already has `createLLMClient()` with provider detection
- Has `isOpenAICompatible()` and `inferProviderFromEndpoint()`
- Returns either `AnthropicClient` or `OpenAICompatibleClient`

**File:** `floyd-wrapper-main/src/llm/glm-client.ts`
- Standalone GLM client with SSE parsing
- Uses OpenAI-compatible format
- Has token tracking, retry logic, abort signal support
- **DO NOT MODIFY THIS FILE** - it's verified working

### What You Need to Create

**NEW:** `packages/floyd-agent-core/src/llm/llm-client.ts` (unified abstraction)

```typescript
// Unified LLM client interface
export interface LLMClient {
  streamChat(options: StreamOptions): AsyncIterable<StreamEvent>;
  cancel(): void;
  getTokenUsage(): TokenUsage;
}

// Stream options (unified across providers)
export interface StreamOptions {
  messages: FloydMessage[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  abortSignal?: AbortSignal;
}

// Stream events (unified format)
export interface StreamEvent {
  type: 'token' | 'tool_use' | 'done' | 'error';
  content: string;
  toolUse?: ToolUse;
  error?: string;
}

// Factory (extend existing factory.ts)
export function createLLMClient(config: FloydConfig): LLMClient {
  // Use existing factory logic, add GLM wrapper
  const provider = config.provider || inferProviderFromEndpoint(config.apiEndpoint);

  switch (provider) {
    case 'glm':
      return new GLMClientWrapper(config);  // Wrap existing GLM client
    case 'anthropic':
      return new AnthropicClient(config);
    case 'openai':
      return new OpenAIClient(config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// GLM wrapper (ADAPTER PATTERN)
class GLMClientWrapper implements LLMClient {
  private inner: GLMClient;  // From floyd-wrapper-main

  constructor(config: FloydConfig) {
    this.inner = new GLMClient(config);
  }

  async *streamChat(options: StreamOptions): AsyncIterable<StreamEvent> {
    // Convert options to GLM format
    // Delegate to existing GLM client
    // Convert events back to unified format
  }
}
```

### Verification Criteria
1. GLM streaming works with tool calls (existing behavior preserved)
2. Can switch providers via config change
3. Error handling consistent across providers
4. No breaking changes to existing GLM client

---

## ITEM D: State Management Unification (HIGH)

### Problem Statement
Separate stores in CLI, Desktop, and wrapper:
- `INK/floyd-cli/src/store/floyd-store.ts` (787 lines)
- `FloydDesktopWeb/` has different state management
- `floyd-wrapper-main/` has no centralized state

### Existing Implementation (READ THIS FIRST)

**File:** `INK/floyd-cli/src/store/floyd-store.ts`
- Large Zustand-like store
- Manages messages, mode, tools, cache stats
- NO synchronization with other components

### What You Need to Create

**NEW:** `packages/floyd-agent-core/src/state/floyd-state.ts`

```typescript
// Unified state interface
export interface FloydState {
  // Session
  sessionId: string;
  messages: FloydMessage[];

  // Execution (use Item A's ExecutionMode)
  currentMode: ExecutionMode;
  activeTools: string[];

  // Cache
  cacheStats: CacheStats;

  // UI (optional, for Desktop/CLI overlay)
  uiState?: Record<string, unknown>;
}

// State manager with pub/sub
export class StateManager {
  private state: FloydState;
  private subscribers: Set<(state: FloydState) => void> = new Set();

  getState(): Readonly<FloydState>;
  setState(updater: (state: FloydState) => Partial<FloydState>): void;

  // Subscription management
  subscribe(callback: (state: FloydState) => void): () => void;
  unsubscribe(callback: (state: FloydState) => void): void;

  private notify(): void;
}

// Singleton instance
export const globalState = new StateManager();
```

### Integration Points
1. CLI uses `globalState.subscribe()` to update UI
2. Desktop polls `globalState.getState()` for display
3. Wrapper writes to `globalState.setState()` on events

### Verification Criteria
1. State updates propagate to all subscribers
2. No memory leaks from subscriptions
3. Race conditions handled (concurrent setState)
4. Backward compatible with existing stores

---

## DEPENDENCY GRAPH

```
Item A (Permissions)
    ↓
Item B (Config) ← needs A's ExecutionMode type
    ↓
Item C (Provider) ← needs B's FloydConfig
    ↓
Item D (State) ← needs B's FloydConfig, A's ExecutionMode
```

**Implementation Order:** A → B → C → D
**Testing Order:** All together (integration test only)

---

## CASCADING RISKS (MUST READ)

1. **Item A (Permissions)**: If you fix this without B-D, permission system breaks
2. **Item B (Config)**: If you don't migrate all hardcoded values, they remain scattered
3. **Item C (Provider)**: If you modify the existing GLM client, tool calling breaks
4. **Item D (State)**: If you don't handle race conditions, state corruption occurs

---

## EXISTING FILES TO READ FIRST

Before implementing anything, read these files:

```bash
# Permissions
packages/floyd-agent-core/src/permissions/permission-manager.ts
floyd-wrapper-main/src/permissions/permission-manager.ts
INK/floyd-cli/src/permissions/tool-policy.ts

# Config
floyd-wrapper-main/src/utils/config.ts
INK/floyd-cli/src/utils/config.ts

# Provider/LLM
packages/floyd-agent-core/src/llm/factory.ts
floyd-wrapper-main/src/llm/glm-client.ts  # DO NOT MODIFY
packages/floyd-agent-core/src/llm/anthropic-client.ts
packages/floyd-agent-core/src/llm/openai-client.ts

# State
INK/floyd-cli/src/store/floyd-store.ts
```

---

## NEW FILES TO CREATE

```bash
packages/floyd-agent-core/src/permissions/unified-permission.ts  # NEW
packages/floyd-agent-core/src/config/floyd-config.ts             # NEW
packages/floyd-agent-core/src/llm/llm-client.ts                  # NEW (adapter)
packages/floyd-agent-core/src/state/floyd-state.ts               # NEW
```

---

## EXISTING FILES TO MODIFY

```bash
# Update to use unified systems
packages/floyd-agent-core/src/index.ts  # Export new modules

# Config migration (use ConfigManager instead of loadConfig)
floyd-wrapper-main/src/index.ts
INK/floyd-cli/src/app.tsx

# State migration (use globalState instead of local stores)
INK/floyd-cli/src/store/floyd-store.ts  # Refactor to use globalState
FloydDesktopWeb/server/index.ts
```

---

## VERIFICATION PROTOCOL

After implementing all 4 items:

### 1. Build Test
```bash
cd floyd-wrapper-main && npm run build
cd ../packages/floyd-agent-core && npm run build
cd ../INK/floyd-cli && npm run build
```

**Expected:** All builds pass with 0 errors

### 2. Integration Test
```bash
# Test permission modes
floyd --mode ask "Test moderate tool"
floyd --mode yolo "Test moderate tool"  # Should auto-approve
floyd --mode yolo "Test dangerous tool"  # Should ask

# Test config persistence
echo '{"provider": "anthropic"}' > ~/.floyd/config.json
floyd "Check provider"  # Should load from file

# Test state sync
# Run CLI and Desktop simultaneously, verify state updates propagate
```

### 3. Smoke Test Matrix

| Test | Expected | Receipt |
|------|----------|---------|
| ASK mode + moderate tool | Ask for confirmation | Screenshot/terminal output |
| YOLO mode + moderate tool | Auto-approve | `allowed: true, autoApproved: true` |
| YOLO mode + dangerous tool | Ask for confirmation | Prompt appears |
| Config file change | Hot-reload within 1s | State update logged |
| Provider switch (GLM→Anthropic) | New client created | No errors |
| State update propagation | All subscribers notified | Subscriber count matches |

---

## ACCEPTANCE CRITERIA

### Item A: Unified Permission System
- [ ] `UnifiedPermissionManager` class exists with all strategies
- [ ] All 6 modes (ASK/YOLO/PLAN/AUTO/DIALOGUE/FUCKIT) implemented
- [ ] YOLO auto-approves moderate, asks dangerous
- [ ] Security audit passed (no bypass paths)
- [ ] Integration tests pass

### Item B: Configuration Standardization
- [ ] `ConfigManager` singleton with persistence
- [ ] `~/.floyd/config.json` format defined
- [ ] Environment variables override defaults
- [ ] Hot-reload on file change
- [ ] All components use ConfigManager

### Item C: Provider Abstraction Layer
- [ ] `LLMClient` interface with unified `streamChat()`
- [ ] `createLLMClient()` factory with GLM/Anthropic/OpenAI
- [ ] GLM streaming preserves existing behavior
- [ ] Provider switch via config works

### Item D: State Management Unification
- [ ] `StateManager` with pub/sub pattern
- [ ] `globalState` singleton exported
- [ ] No memory leaks (subscription cleanup)
- [ ] Race condition handling
- [ ] All components use globalState

---

## MCP TOOLS AVAILABLE

You have 46 MCP tools across 6 servers. Use them:

1. **SUPERCACHE** - Cache your reasoning before starting
2. **SAFE-OPS** - Use `impact_simulate` before changes
3. **PATCH** - Use `edit_range` for surgical changes
4. **RUNNER** - Use `run_tests` after each item

---

## HANDOFF INSTRUCTIONS

When you complete Phase 0:

1. Update `PHASE_0_Architectural_Foundation.md` status:
   ```markdown
   | Unified Permission System | A | ✅ DONE | packages/floyd-agent-core/src/permissions/unified-permission.ts |
   | Configuration Standardization | B | ✅ DONE | packages/floyd-agent-core/src/config/floyd-config.ts |
   | Provider Abstraction Layer | C | ✅ DONE | packages/floyd-agent-core/src/llm/llm-client.ts |
   | State Management Unification | D | ✅ DONE | packages/floyd-agent-core/src/state/floyd-state.ts |
   ```

2. Update `INDEX.md`:
   ```markdown
   | Phase 0 | A-D (4) | HIGH | 3-4h | Foundation | ✅ DONE |
   ```

3. Create `PHASE_0_COMPLETION_REPORT.md` with:
   - All files created/modified
   - Build verification receipts
   - Smoke test results
   - Migration guide for remaining phases

4. Next phase: Phase 1 (Critical Fixes) can now proceed unblocked

---

## CRITICAL FILES (DO NOT MODIFY)

```bash
floyd-wrapper-main/src/llm/glm-client.ts  # VERIFIED WORKING, DO NOT TOUCH
packages/floyd-agent-core/src/stt/*.ts     # Speech-to-text, unrelated
```

---

## SUCCESS METRICS

1. **Build:** All 3 projects build with 0 errors
2. **Tests:** Integration test passes (all 4 items working together)
3. **Smoke:** Permission modes work as expected
4. **Config:** Persistence and hot-reload verified
5. **Provider:** GLM streaming still works (no regression)
6. **State:** Subscribers receive updates

---

**Remember:** These 4 items are TIGHTLY COUPLED. Implement all 4, then test together. Do not ship partial work.

**Good luck. The foundation of FLOYD depends on this phase.**
