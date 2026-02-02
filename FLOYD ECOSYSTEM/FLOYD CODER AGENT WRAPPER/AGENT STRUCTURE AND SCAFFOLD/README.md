# FLOYD CLI - AGENT STRUCTURE AND SCAFFOLD

**Purpose:** Complete reference library for rebuilding the FLOYD CLI agent system from scratch.

**Created:** 2026-01-28
**Status:** REFERENCE ONLY - These are copies. Original files remain in their source locations.

---

## QUICK START FOR REBUILDING

If you are an agent tasked with rebuilding or extending the FLOYD CLI system:

1. **Read this README first** - Understand the architecture
2. **Study the dependency map** - Know what connects to what
3. **Review original locations** - Understand where files live in the active codebase
4. **Follow the rebuild checklist** - Step-by-step reconstruction guide

---

## DIRECTORY STRUCTURE

```
AGENT STRUCTURE AND SCAFFOLD/
├── 01-modular-prompts/           # Modular prompt templates (.floyd-prompts/)
├── 02-prompt-styles/             # Prompt style implementations
├── 03-prompt-engine/             # Prompt assembly engine + dependencies
├── 04-cli-permissions/           # Permission system (policies, risk classification)
├── 05-cli-store/                 # State management (Zustand stores)
├── 06-cli-agent/                 # Agent implementation (manager, workers)
├── 07-agent-prompts/             # Agent instruction templates
├── 08-cli-documentation/         # User/developer documentation
├── 09-wrapper-source/            # Wrapper-level prompt switching
└── README.md                     # This file
```

---

## ARCHITECTURE OVERVIEW

### Three-Layer Prompt System

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: PROMPT STYLES                   │
│  (02-prompt-styles/)                                         │
│                                                             │
│  architect/      claude-style/      floyd47/                │
│  hardened/       pair/              precision/              │
│  suggested/      system/            velocity/               │
│                                                             │
│  Each style is a complete prompt template selected by CLI   │
│  flags: --claude, --floyd47, --hardened, etc.              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 2: PROMPT ENGINE                    │
│  (03-prompt-engine/)                                         │
│                                                             │
│  engine.ts           - Main assembly logic                  │
│  system-prompt.ts    - Base prompt construction             │
│  tool-templates.ts   - Tool usage patterns                  │
│  few-shot-examples.ts- Example prompts                      │
│                                                             │
│  Combines styles + context + tools into final prompt        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 3: MODULAR PROMPTS                   │
│  (01-modular-prompts/)                                      │
│                                                             │
│  identity/    - Core identity ("You are FLOYD...")          │
│  modes/       - Execution modes (ask, yolo, plan, etc.)    │
│  tools/       - Per-tool instructions                       │
│  policies/    - Safety and behavior policies                │
└─────────────────────────────────────────────────────────────┘
```

### Supporting Systems

```
┌─────────────────────────────────────────────────────────────┐
│                   PERMISSIONS SYSTEM                        │
│  (04-cli-permissions/)                                      │
│                                                             │
│  policies.ts         - Permission gating rules             │
│  risk-classifier.ts  - Destructive operation detection     │
│  tool-policy.ts      - Per-tool permission requirements    │
│  ask-ui.tsx          - Permission request UI               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                         │
│  (05-cli-store/)                                            │
│                                                             │
│  floyd-store.ts      - Main Zustand store                   │
│  prompt-store.ts     - Prompt configuration                │
│  session-store.ts    - Session state                       │
│  tool-usage-store.ts - Tool usage tracking                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AGENT SYSTEM                            │
│  (06-cli-agent/)                                            │
│                                                             │
│  manager.ts          - Agent lifecycle management           │
│  custom-agent.ts     - User-defined agent support           │
│  profiles.ts         - Agent behavior profiles              │
│  workers/            - Specialized task workers            │
└─────────────────────────────────────────────────────────────┘
```

---

## ORIGINAL FILE LOCATIONS

| This Reference | Original Location | Purpose |
|----------------|-------------------|---------|
| `01-modular-prompts/` | `floyd-wrapper-main/.floyd-prompts/` | Modular prompt templates |
| `02-prompt-styles/` | `floyd-wrapper-main/src/prompts/` | Prompt style implementations |
| `03-prompt-engine/` | `INK/floyd-cli/src/prompts/` | Prompt assembly engine |
| `03-prompt-engine/dependencies/` | `INK/floyd-cli/src/config/` | Tool definitions |
| `04-cli-permissions/` | `INK/floyd-cli/src/permissions/` | Permission system |
| `05-cli-store/` | `INK/floyd-cli/src/store/` | State management |
| `06-cli-agent/` | `INK/floyd-cli/src/agent/` | Agent implementation |
| `07-agent-prompts/` | `.floyd/prompts/` | Agent instruction templates |
| `08-cli-documentation/` | `INK/floyd-cli/docs/` | User documentation |
| `09-wrapper-source/` | `floyd-wrapper-main/src/prompts/` | Wrapper-level prompts |

---

## DEPENDENCY MAP

### Critical Dependencies for Rebuild

```
engine.ts
    ├── system-prompt.ts
    │       └── ../config/available-tools.ts  ← CRITICAL: 621 lines of tool definitions
    ├── tool-templates.ts
    ├── few-shot-examples.ts
    └── components/
            ├── SystemPrompt.tsx
            ├── TaskPrompt.tsx
            ├── ToolsPrompt.tsx
            ├── ContextPrompt.tsx
            └── PromptBuilder.tsx
```

### External Dependencies (from package.json)

```json
{
  "dependencies": {
    "react": "^18.x",           // UI components
    "zustand": "^4.x",          // State management
    "ink": "^4.x",              // CLI UI framework
    "openai": "^4.x",           // AI client (or GLM equivalent)
    "@anthropic-ai/sdk": "^0.x" // AI client
  }
}
```

---

## REBUILD CHECKLIST

Use this checklist when rebuilding the system from scratch.

### Phase 1: Foundation (Day 1)

- [ ] **Create project structure**
  ```bash
  mkdir -p src/{prompts,permissions,store,agent,config}
  mkdir -p dist
  ```

- [ ] **Initialize package.json** - Copy from `03-prompt-engine/dependencies/package.json`
- [ ] **Configure TypeScript** - Copy from `03-prompt-engine/dependencies/tsconfig.json`
- [ ] **Install dependencies** - Run `npm install`

### Phase 2: Tool Registry (Day 1)

- [ ] **Create `available-tools.ts`** - This is CRITICAL. Copy from:
  - `03-prompt-engine/dependencies/available-tools.ts` (621 lines)
  - Defines all tools, their parameters, and categories

- [ ] **Create `builtin-servers.ts`** - MCP server configurations

### Phase 3: Prompt Engine (Day 2)

- [ ] **Create core prompt files** in `src/prompts/`:
  - [ ] `engine.ts` - Main assembly logic
  - [ ] `system-prompt.ts` - Base prompt construction
  - [ ] `tool-templates.ts` - Tool usage patterns
  - [ ] `few-shot-examples.ts` - Example prompts

- [ ] **Create React components** in `src/prompts/components/`:
  - [ ] `SystemPrompt.tsx`
  - [ ] `TaskPrompt.tsx`
  - [ ] `ToolsPrompt.tsx`
  - [ ] `ContextPrompt.tsx`
  - [ ] `PromptBuilder.tsx`

### Phase 4: Prompt Styles (Day 3)

- [ ] **Create style directories** in `src/prompts/`:
  ```
  architect/
  claude-style/
  floyd47/
      └── flash/
  hardened/
  pair/
  precision/
  suggested/
  system/
  velocity/
  ```

- [ ] **Copy style implementations** from `02-prompt-styles/`
  - Each directory has an `index.ts` with the complete prompt template

### Phase 5: Permission System (Day 4)

- [ ] **Create permission files** in `src/permissions/`:
  - [ ] `policies.ts` - Permission gating rules
  - [ ] `risk-classifier.ts` - Detects destructive operations
  - [ ] `tool-policy.ts` - Per-tool requirements
  - [ ] `ask-ui.tsx` - Permission request UI
  - [ ] `ask-overlay.tsx` - Permission overlay

### Phase 6: State Management (Day 5)

- [ ] **Create store files** in `src/store/`:
  - [ ] `floyd-store.ts` - Main Zustand store
  - [ ] `prompt-store.ts` - Prompt configuration
  - [ ] `session-store.ts` - Session state
  - [ ] `tool-usage-store.ts` - Tool usage tracking
  - [ ] `agent-store.ts` - Agent configuration
  - [ ] `conversation-store.ts` - Chat history

### Phase 7: Agent System (Day 6)

- [ ] **Create agent files** in `src/agent/`:
  - [ ] `manager.ts` - Agent lifecycle
  - [ ] `custom-agent.ts` - User-defined agents
  - [ ] `profiles.ts` - Behavior profiles
  - [ ] `workers/` - Specialized workers
      - [ ] `base-worker.ts`
      - [ ] `code-search.ts`
      - [ ] `browser.ts`
      - [ ] `patch-maker.ts`
      - [ ] `tester.ts`

### Phase 8: CLI Integration (Day 7)

- [ ] **Create CLI entry point** (`src/cli.tsx`)
- [ ] **Implement flag parsing**:
  - `--claude` - Use Claude-style prompt
  - `--floyd47` - Use Floyd 4.7 GLM-optimized prompt
  - `--hardened` - Use hardened prompt system
  - `--flash` - Use Flash mode (glm-4-flash)
  - `--no-reasoning` - Disable reasoning

- [ ] **Wire up prompt style selection**
- [ ] **Test all prompt styles**
- [ ] **Verify permission system**

---

## KEY FILES TO UNDERSTAND

### Must-Read for Rebuild

| File | Lines | Why Important |
|------|-------|---------------|
| `03-prompt-engine/dependencies/available-tools.ts` | 621 | Defines ALL tools - without this, nothing works |
| `03-prompt-engine/engine.ts` | 315 | Shows how prompts are assembled |
| `03-prompt-engine/system-prompt.ts` | ~400 | Base prompt construction |
| `02-prompt-styles/hardened/index.ts` | 387 | Example of complete prompt style |
| `04-cli-permissions/policies.ts` | 150 | Permission gating rules |
| `05-cli-store/floyd-store.ts` | 1200 | State management patterns |

---

## CLI FLAG REFERENCE

The FLOYD CLI supports these modes (from `floyd --help`):

| Flag | Purpose | Prompt Style Used |
|------|---------|-------------------|
| `--claude` | Claude-style prompt | `claude-style/index.ts` |
| `--floyd47` | Floyd 4.7 GLM-optimized | `floyd47/index.ts` |
| `--hardened` | Hardened prompt system | `hardened/index.ts` |
| `--flash` | Flash mode (fast & cheap) | `floyd47/flash/index.ts` |
| `--no-reasoning` | Disable reasoning | Modifies all styles |
| `--mode ask` | Ask mode | Modular: `modes/ask.md` |
| `--mode yolo` | YOLO mode | Modular: `modes/yolo.md` |
| `--mode plan` | Plan mode | Modular: `modes/plan.md` |
| `--mode auto` | Auto mode | Modular: `modes/auto.md` |
| `--mode dialogue` | Dialogue mode | Modular: `modes/dialogue.md` |

---

## REBUILD TROUBLESHOOTING

### Common Issues

**Problem:** Module not found errors
```
Solution: Check that all imports use .js extensions (ESM)
         Check that available-tools.ts is in src/config/
```

**Problem:** Tools not appearing in prompts
```
Solution: Verify AVAILABLE_TOOLS is exported from available-tools.ts
         Check that system-prompt.ts imports from ../config/available-tools.js
```

**Problem:** Prompt styles not switching
```
Solution: Verify CLI flag parsing in wrapper
         Check that prompt style files export a default function
```

**Problem:** TypeScript errors
```
Solution: Copy tsconfig.json from 03-prompt-engine/dependencies/
         Ensure "module": "NodeNext" and "moduleResolution": "NodeNext"
```

---

## VALIDATION CHECKLIST

After rebuild, verify:

- [ ] All prompt styles can be selected via flags
- [ ] Tool registry loads correctly
- [ ] Permissions prompt for destructive operations
- [ ] State persists across sessions
- [ ] Agents can be created and managed
- [ ] UI renders correctly (Ink components)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)

---

## DOCUMENTATION INDEX

| Document | Location | Purpose |
|----------|----------|---------|
| PROMPT_LIBRARY.md | 08-cli-documentation/ | Prompt system overview |
| USER_GUIDE.md | 08-cli-documentation/ | End-user documentation |
| SUPERCACHING.md | 08-cli-documentation/ | Cache system details |
| CLAUDE.md | 08-cli-documentation/ | Technical architecture |
| QUICK_START.md | 08-cli-documentation/ | Setup instructions |

---

## AGENT PROMPT REFERENCE

These prompts define agent behaviors for various specialized tasks:

| Prompt | Purpose |
|--------|---------|
| AGENT_INSTRUCTIONS.md | Core agent instructions |
| agent-forge.md | Custom agent builder |
| butterfly-effect.md | Strategic foresight |
| codebase-system-analyzer.md | Codebase analysis |
| executive-orchestrator.md | Multi-agent coordination |
| repo-critic-enforcer.md | Production validation |

---

## VERSION HISTORY

| Date | Change |
|------|--------|
| 2026-01-28 | Initial reference library created |

---

## CONTACT & CONTEXT

This reference library was created to support the FLOYD CLI project - a File-Logged Orchestrator Yielding Deliverables.

**Project Root:** `/Volumes/Storage/FLOYD_CLI/`
**CLI Location:** `INK/floyd-cli/`
**Wrapper Location:** `floyd-wrapper-main/`

**For questions or updates:** Refer to the original files in their source locations. This reference is a snapshot - the original files may have been updated since this copy was made.
