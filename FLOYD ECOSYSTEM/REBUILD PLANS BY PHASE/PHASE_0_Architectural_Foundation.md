# PHASE 0: ARCHITECTURAL FOUNDATION

**RISK**: HIGH
**TIME**: 3-4 hours
**ITEMS**: 4 (A-D)
**MUST FIX TOGETHER**: These 4 items are tightly coupled

> **CRITICAL**: Fixing one without the others will break the system. DO ALL 4 TOGETHER.

---

## AUDIT TRAIL

| Item | ID | Status | Files |
|------|-----|--------|-------|
| Unified Permission System | A | TODO | packages/floyd-agent-core/src/permissions/unified-permission.ts (NEW) |
| Configuration Standardization | B | TODO | packages/floyd-agent-core/src/config/floyd-config.ts (NEW) |
| Provider Abstraction Layer | C | TODO | packages/floyd-agent-core/src/llm/llm-client.ts (NEW) |
| State Management Unification | D | TODO | packages/floyd-agent-core/src/state/floyd-state.ts (NEW) |

---

## ITEM A: Unified Permission System (CRITICAL)

**Problem**: Permission behavior varies across CLI, wrapper, Desktop. YOLO mode hardcoded differently.

**Root Cause**: No unified permission abstraction. Each component implements its own checks.

**Files**:
- `INK/floyd-cli/src/permissions/tool-policy.ts` (lines 159-169)
- `floyd-wrapper-main/src/permissions/permission-manager.ts`
- `INK/floyd-cli/src/permissions/risk-classifier.ts`
- `INK/floyd-cli/src/ui/permissions/ask-overlay.tsx`

**Implementation**:
```typescript
// NEW: packages/floyd-agent-core/src/permissions/unified-permission.ts
export interface PermissionStrategy {
  name: ExecutionMode;
  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision;
}

export class UnifiedPermissionManager {
  private strategies: Map<ExecutionMode, PermissionStrategy> = new Map();
  private currentMode: ExecutionMode = 'ASK';

  setMode(mode: ExecutionMode): void {
    this.currentMode = mode;
  }

  check(tool: ToolDefinition, context: ExecutionContext): PermissionDecision {
    const strategy = this.strategies.get(this.currentMode);
    return strategy.check(tool, context);
  }
}

const YOLO_STRATEGY: PermissionStrategy = {
  name: 'YOLO',
  check: (tool, ctx) => {
    if (tool.permission === 'dangerous') {
      return { allowed: false, reason: 'Dangerous tool requires confirmation' };
    }
    return { allowed: true, autoApproved: true };
  }
};
```

**Verification**:
1. All modes work consistently across CLI/wrapper/Desktop
2. Security audit of permission bypass paths
3. Integration tests for all mode/tool combinations

---

## ITEM B: Configuration Standardization (CRITICAL)

**Problem**: Hardcoded defaults scattered. No single source of truth.

**Root Cause**: Configuration fragmented across multiple files.

**Files** (all need changes):
- `floyd-wrapper-main/src/config/`
- `INK/floyd-cli/src/utils/config.ts`
- `FloydDesktopWeb/server/index.ts`
- Various files with hardcoded defaults

**Implementation**:
```typescript
// NEW: packages/floyd-agent-core/src/config/floyd-config.ts
export interface FloydConfig {
  // API
  provider: 'anthropic' | 'glm' | 'openai';
  apiKey: string;
  apiEndpoint: string;
  model: string;

  // Mode
  mode: ExecutionMode;

  // Paths
  workspacePath: string;
  cachePath: string;

  // Prompts
  promptStyle: PromptStyle;

  // Permissions
  autoConfirm: boolean;
  allowDangerous: boolean;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: FloydConfig;

  static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
      // Load from config file, environment, defaults
    }
    return this.instance;
  }

  get(): Readonly<FloydConfig> {
    return this.config;
  }

  set(updates: Partial<FloydConfig>): void {
    this.config = { ...this.config, ...updates };
    this.persist();
  }

  private persist(): void {
    // Save to ~/.floyd/config.json
  }
}
```

**Verification**:
1. All components read from same ConfigManager
2. Environment variables override defaults
3. Config file changes hot-reload

---

## ITEM C: Provider Abstraction Layer (CRITICAL)

**Problem**: GLM uses OpenAI format, code expects Anthropic - API failures.

**Root Cause**: Direct GLM client integration without abstraction.

**Files**:
- `floyd-wrapper-main/src/llm/glm-client.ts` (existing, working)
- `floyd-wrapper-main/src/llm/anthropic-client.ts` (NEW)
- `floyd-wrapper-main/src/llm/openai-client.ts` (NEW)
- `floyd-wrapper-main/src/llm/llm-client.ts` (NEW abstraction)

**Implementation**:
```typescript
// packages/floyd-agent-core/src/llm/llm-client.ts
export interface LLMClient {
  streamChat(options: StreamOptions): AsyncIterable<StreamEvent>;
}

export class GLMClient implements LLMClient {
  constructor(private config: FloydConfig) {}

  async *streamChat(options: StreamOptions): AsyncGenerator<StreamEvent> {
    // Use OpenAI-compatible format for GLM
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: options.messages,
        tools: options.tools,
        stream: true
      })
    });
    // Parse SSE stream...
  }
}

// Factory
export function createLLMClient(provider: string, config: FloydConfig): LLMClient {
  const implementations = {
    'glm': GLMClient,
    'anthropic': AnthropicClient,
    'openai': OpenAIClient
  };
  return new implementations[provider](config);
}
```

**Verification**:
1. GLM streaming works with tool calls
2. Can switch providers via config
3. Error handling consistent across providers

---

## ITEM D: State Management Unification (HIGH)

**Problem**: Separate stores in CLI, Desktop, wrapper. No synchronization.

**Root Cause**: Each component manages own state independently.

**Files**:
- `INK/floyd-cli/src/store/floyd-store.ts` (787 lines)
- `FloydDesktopWeb/` (different state)
- `floyd-wrapper-main/` (no centralized state)

**Implementation**:
```typescript
// NEW: packages/floyd-agent-core/src/state/floyd-state.ts
export interface FloydState {
  // Session
  sessionId: string;
  messages: FloydMessage[];

  // Execution
  currentMode: ExecutionMode;
  activeTools: string[];

  // Cache
  cacheStats: CacheStats;

  // UI (optional, for Desktop/CLI)
  uiState?: Record<string, unknown>;
}

export class StateManager {
  private state: FloydState;
  private subscribers: Set<(state: FloydState) => void> = new Set();

  getState(): Readonly<FloydState> {
    return this.state;
  }

  setState(updater: (state: FloydState) => Partial<FloydState>): void {
    const updates = updater(this.state);
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(callback: (state: FloydState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }
}

// Singleton instance
export const globalState = new StateManager();
```

**Verification**:
1. State updates propagate to all subscribers
2. No memory leaks from subscriptions
3. Race conditions handled

---

## DEPENDENCIES

| Depends On | Item | Reason |
|------------|------|--------|
| None | A | Foundation for all |
| A | B | Config needs permission mode |
| B | C | Provider needs config |
| C | D | State needs provider/config |

## CASCADING RISKS

1. **Item A (Permissions)**: Fixing without B-D will break permission system
2. **Item B (Config)**: Hardcoded values will remain scattered
3. **Item C (Provider)**: GLM streaming may break if refactored incorrectly
4. **Item D (State)**: Inconsistent state without config/permission foundation

---

**Phase 0 Status**: TODO (0/4 complete)
