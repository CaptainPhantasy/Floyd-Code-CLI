# FLOYD ECOSYSTEM - CURRENT STATE

**Date:** 2026-01-28 16:30:00 EST
**Purpose:** Document current capabilities, learned lessons, and what to carry forward into the final unified architecture.

---

## EXECUTIVE SUMMARY

The FLOYD ecosystem has evolved into 6 modular components over the past month of development. We have:
- **2 working, production-ready components** (Wrapper, IDE)
- **2 functional but refining components** (Desktop, Chrome)
- **1 component needing ground-up rebuild** (TUI/CLI - accumulated technical debt)
- **1 skeleton component** (Mobile - needs full build)

**Key Learning:** The distinction between **CLI** (Command Line Interface - flags, pipes, stdout) and **TUI** (Terminal User Interface - interactive visual UI with Ink/React) caused early architectural confusion. We now understand both are needed, but as separate modes of a single unified wrapper.

---

## ECOSYSTEM COMPONENTS

### 1. Floyd Wrapper (`floyd-wrapper-main/`) ✅ **MATURE**

**Status:** Production-ready core orchestrator

**Capabilities:**
- LLM abstraction layer (GLM-4.7 API integration)
- 50+ tool registry with permission system
- Streaming response handling with SSE parsing
- Checkpoint/rewind system (file snapshots before destructive operations)
- Sandbox execution (dry-run mode)
- Session management with persistence
- Interrupt handling (Ctrl+C safety)
- Configuration management (env loading, project context)

**Architecture:**
```
floyd-wrapper-main/
├── agent/           # FloydAgentEngine (execution loop)
├── bridge/          # Agent communication handlers
├── commands/        # Floyd CLI commands
├── interrupts/      # InterruptManager
├── llm/             # GLMClient for API calls
├── mcp/             # Model Context Protocol servers
├── permissions/     # Tool permission gating
├── prompts/         # 9 prompt variants (2,822 lines)
├── rewind/          # CheckpointManager, FileSnapshotManager
├── sandbox/         # SandboxManager, DryRunSandbox
├── streaming/       # StreamProcessor, tag parsing
├── tools/           # 50+ tool implementations
├── types/           # TypeScript definitions
└── ui/              # Terminal rendering, monitoring
```

**Size:** 692 files, 166,189 lines

**What Works:**
- GLM-4.7 streaming with tool calling (verified working)
- Permission system with risk classification
- Multiple execution modes (ask, yolo, plan, auto, dialogue, fuckit)
- Tool registry with category-based organization
- Session persistence and resume

**Key Files to Preserve:**
- `src/llm/glm-client.ts` - Verified streaming implementation
- `src/tools/tool-registry.ts` - Tool registration pattern
- `src/rewind/index.ts` - Checkpoint system
- `src/interrupts/index.ts` - Clean shutdown handling

---

### 2. Floyd CLI/TUI (`INK/floyd-cli/`) ⚠️ **NEEDS REBUILD**

**Status:** Functional but accumulated 214 files of technical debt

**Capabilities:**
- Ink-based React TUI with full visual interface
- Zustand state management (10 stores)
- Multi-layout system (Main, Monitor, Conversational, DualScreen)
- Permission overlays with risk assessment
- Dashboard metrics (15 dashboards)
- MCP client integration
- Stream processing with tag parsing
- Command palette system
- Voice input (STT integration)

**Architecture:**
```
INK/floyd-cli/src/
├── agent/           # Agent workers (browser, code-search, patch-maker, tester)
├── browser/         # Browser control subsystem
├── cache/           # Three-tier caching (reasoning, project, vault)
├── commands/        # CLI commands (dock, tmux, monitor)
├── config/          # Configuration UI components
├── ipc/             # Inter-process communication
├── layouts/         # TUI layouts
├── mcp/             # MCP servers (cache, git, runner, explorer)
├── permissions/     # Policy enforcement, risk classification
├── prompts/         # Prompt construction (engine, components)
├── store/           # Zustand stores (floyd-store, dashboard-metrics, etc.)
├── streaming/       # Differential renderer, validation pipeline
├── theme/           # CRUSH theme (gradients, borders, animations)
├── ui/              # UI components (20+), overlays, panels, dashboards
└── utils/           # Utilities (config, diff-parser, file-watcher, etc.)
```

**Size:** 641 files, 185,426 lines

**Staged for Migration:** 214 files in `FLOYD_CLI_SANDBOX_STAGING/`

**What Works (Keep):**
- CRUSH theme system (gradients, borders, layout)
- Three-tier caching (reasoning 5min, project 24hr, vault 7days)
- Stream tag parsing (`<thinking>`, `<tool_use>`, etc.)
- Permission risk classifier
- Dashboard selectors pattern
- MCP server implementations

**What Failed (Discard):**
- Over-engineered component abstractions
- Circular dependencies in prompt system
- Duplicate stores with overlapping responsibilities
- UI components that reinvent Ink primitives

**Why Rebuild:**
- Month of experimental code accumulated
- Better understanding of Claude Code's patterns now
- Can start fresh with clean architecture

---

### 3. Floyd Desktop Web (`FloydDesktopWeb/`) 🔄 **IN PROGRESS**

**Status:** Functional, implementing feature parity with Claude.ai

**Capabilities:**
- Web-based chat interface (React)
- Projects organization
- Artifacts system
- File management
- Search & organization
- Message history

**Architecture:**
```
FloydDesktopWeb/
├── assets/          # Static assets
├── dist/            # Built output
├── dist-server/     # Server output
├── docs/            # Feature parity documentation
└── src/             # React application source
```

**Size:** 134 files, 83,829 lines

**Implementation Plan:** 9-12 weeks to feature parity
- Phase 1: Core Chat Organization
- Phase 2: Enhanced Message Management
- Phase 3: Search & Organization
- Phase 4: File Management Enhancements
- Phase 5: Artifacts System
- Phase 6: Polish & Advanced Features

**What Works:**
- React chat interface
- Message streaming
- Project context loading

---

### 4. Floyd Chrome Extension (`FloydChromeBuild/`) ✅ **FUNCTIONAL**

**Status:** Working browser automation

**Capabilities:**
- Browser navigation
- Page reading (accessibility tree)
- Element finding and interaction
- Screenshot capture (virtual eyes)
- Tab management
- Safety layer (allowlist, auth zones, owned tabs)

**Architecture:**
```
FloydChromeBuild/floydchrome/
├── src/
│   ├── background.ts      # Service worker
│   ├── content/           # Content scripts
│   ├── mcp/               # MCP client implementations
│   └── tools/             # Browser tools (navigate, read, click, type)
└── DOCS/                  # Architecture docs
```

**Size:** 86 files, 33,117 lines

**Connection Modes:**
1. WebSocket MCP (preferred) - connects to FloydDesktop port 3000
2. Native Messaging (fallback) - connects to FLOYD CLI native host

**What Works:**
- Browser automation via MCP
- Safety middleware
- Screenshot-based analysis

---

### 5. Floyd CURSE'M IDE (`/Applications/FLOYD CURSE'M.app`) ✅ **POLISHED**

**Status:** Fully functional VS Code fork, in active daily use

**Capabilities:**
- Full VS Code feature set
- Custom Floyd branding (CURSE'M theme)
- Multi-agent extension system
- Multi-chat panels (up to 10 simultaneous)
- Voice input (Web Speech API, `Cmd+Shift+V`)
- Custom agent creation with prompts

**Extensions:**
```
floyd-extensions/
├── floyd-custom-agents/     # 816 lines - Create/manage custom AI agents
├── floyd-multi-chat/        # 1,151 lines - Multiple simultaneous chat panels
└── floyd-voice-input/       # 1,324 lines - Voice-to-text input
```

**Total Extension Code:** ~3,291 lines of TypeScript

**What Works:**
- VS Code as daily driver IDE
- Custom agent profiles
- Multi-chat for parallel work
- Voice input for hands-free coding
- FLOYD CURSE'M theme integration

---

### 6. Floyd Mobile (`mobile/`) 🏗️ **SKELETON**

**Status:** Early development, needs full build

**Capabilities:**
- Remote Mac control (planned)
- Command dispatch (planned)
- NGROK tunnel integration (designed)

**Architecture:**
```
mobile/
├── FloydMobile/            # React Native app (skeleton)
├── docs/                   # API contracts
└── test-floyd-api.html     # API testing interface
```

**Size:** 8 files, 30 lines (skeleton only)

**API Contract Defined:**
- WebSocket: `ws://localhost:3000/agent`
- HTTP: `http://localhost:3000/api`
- Request/Response pattern with streaming support

**What Needs Build:**
- React Native app
- Floyd bridge server
- NGROK integration
- Mobile UI

---

## WHAT WE'VE LEARNED

### 1. CLI vs TUI - Understanding the Distinction

**CLI (Command Line Interface):**
- Flag-driven execution: `floyd --mode yolo --flash "prompt"`
- Pipeable stdin/stdout
- Scriptable and automatable
- Non-interactive by default

**TUI (Terminal User Interface):**
- Ink/React visual interface
- Interactive keyboard navigation
- Mouse-capable (with certain terminals)
- Rich UI (panels, dashboards, overlays)

**Lesson:** Both are needed, but as **modes** of a single wrapper, not separate codebases.

### 2. Prompt Engineering - What Works

**Successful Patterns:**
- **Concise system prompts** - Long prompts get ignored
- **Mode-based behavior** - ASK, YOLO, PLAN, AUTO, DIALOGUE
- **Capability lists** - Explicit tool descriptions
- **Turn-taking** - "Respond ONCE, then STOP"
- **Context injection** - Project FLOYD.md, git status, file tree

**Failed Patterns:**
- Over-engineered prompt "engines" with circular dependencies
- Few-shot examples that increased token costs without improving results
- Multi-stage prompt assembly that was hard to debug

**Keep:**
- `floyd-wrapper-main/src/prompts/system/` - Modular, clean
- `floyd-wrapper-main/src/prompts/floyd47/` - GLM-optimized
- `floyd-wrapper-main/src/prompts/suggested/` - Simple, lean

### 3. State Management - Zustand Works

**Pattern to Keep:**
```typescript
// Single source of truth with selectors
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (msg) => set(state => ({
        messages: [...state.messages, msg]
      })),
    }),
    { name: 'floyd-store' }
  )
);

// Selectors for derived data
const selectMessages = (state: StoreState) => state.messages;
```

**Anti-Pattern to Avoid:**
- Multiple overlapping stores
- Stores that duplicate data
- Stores without clear ownership

### 4. Permission System - Risk Classification Works

**Implemented:**
- `policies.ts` - Permission rules
- `risk-classifier.ts` - LOW/MEDIUM/HIGH assessment
- `tool-policy.ts` - Tool-specific policies
- `ask-ui.tsx` - Permission overlay

**Keep:**
- Risk-based permission gating
- Remember decisions (once, session, always)
- Wildcard patterns for tool matching

### 5. MCP Integration - Proven Pattern

**Working Implementation:**
- `mcp/cache-server.ts` - Cache operations as tools
- `mcp/git-server.ts` - Git operations
- `mcp/runner-server.ts` - Command execution
- Chrome extension connects via WebSocket MCP

**Keep:**
- Tool-based MCP protocol
- WebSocket connection for real-time
- Native messaging fallback

### 6. Streaming - SSE Parsing is Critical

**Verified Working:**
```typescript
// GLM-4.7 uses OpenAI-compatible format
// SSE events must be parsed correctly for tool calling
private processSSEEvent(line: string): void {
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    // Handle delta content
    // Handle tool calls
  }
}
```

**Lesson:** Don't modify streaming logic without thorough testing.

### 7. Caching - Three-Tier System Works

**Proven Architecture:**
```
Reasoning Cache: 5 minutes  (expensive LLM calls)
Project Cache:   24 hours   (project-specific data)
Vault Cache:     7 days     (persistent patterns)
```

**Keep:**
- TTL-based expiration
- Metadata tracking
- Archive operations between tiers

### 8. Safety - Sandbox and Checkpoints

**Implemented:**
- `CheckpointManager` - Pre-destructive snapshots
- `FileSnapshotManager` - File versioning
- `SandboxManager` - Dry-run mode
- `DryRunSandbox` - Preview changes before execution

**Keep:**
- Checkpoint before dangerous tools
- Restore capability
- Sandbox for testing

---

## CAPABILITIES TO CARRY FORWARD

### Core Wrapper Capabilities

| Capability | Implementation | Carry Forward |
|------------|----------------|--------------|
| LLM abstraction | GLMClient with streaming | ✅ Keep as-is |
| Tool registry | ToolRegistry class | ✅ Keep pattern |
| Permission gating | Risk-based policies | ✅ Keep |
| Execution modes | ASK, YOLO, PLAN, AUTO, DIALOGUE | ✅ Keep |
| Streaming response | SSE parsing | ✅ Don't modify |
| Session persistence | SessionManager | ✅ Keep |
| Checkpoint/rewind | CheckpointManager | ✅ Keep |
| Sandbox | DryRunSandbox | ✅ Keep |
| Interrupt handling | InterruptManager | ✅ Keep |
| MCP servers | Multiple implementations | ✅ Keep |

### TUI Capabilities

| Capability | Implementation | Carry Forward |
|------------|----------------|--------------|
| CRUSH theme | Gradients, borders, layout | ✅ Keep |
| Three-tier cache | Reasoning, project, vault | ✅ Keep |
| Stream tag parsing | `<thinking>`, `<tool_use>` | ✅ Keep |
| Permission UI | Risk classifier, overlays | ✅ Keep |
| Dashboard metrics | 15 dashboards | ✅ Keep |
| Command palette | Keyboard-driven UI | ✅ Keep |
| Multi-layout | Main, Monitor, Conversational | ✅ Keep |

### Extension Capabilities

| Capability | Implementation | Carry Forward |
|------------|----------------|--------------|
| Custom agents | Extension (816 lines) | ✅ Keep |
| Multi-chat | Extension (1,151 lines) | ✅ Keep |
| Voice input | Extension (1,324 lines) | ✅ Keep |
| CURSE'M theme | VS Code theme | ✅ Keep |

---

## ARCHITECTURE LESSONS

### What Worked

1. **Single Responsibility** - Each tool does one thing well
2. **Permission Gates** - Risk-based tool approval
3. **Mode-Based Behavior** - ASK vs YOLO changes permissions
4. **Streaming First** - Everything streams for responsiveness
5. **Checkpoint Before Destructive** - Always snapshot before rm, git push, etc.
6. **MCP for Integration** - Model Context Protocol for extensibility
7. **Zustand for State** - Simple, effective state management

### What Didn't Work

1. **Over-Abstraction** - Too many layers made debugging hard
2. **Circular Dependencies** - Prompt engine had circular imports
3. **Duplicate Stores** - Multiple stores with overlapping data
4. **Premature Optimization** - Caching before understanding usage patterns
5. **Large Prompts** - Concise prompts work better than comprehensive ones

---

## TECHNICAL DEBT SUMMARY

| Component | Debt Level | Action Required |
|-----------|------------|-----------------|
| floyd-wrapper-main | Low | Enhance as needed |
| INK/floyd-cli | High | Ground-up rebuild |
| FloydDesktopWeb | Medium | Continue implementation |
| FloydChromeBuild | Low | Polish/refine |
| Floyd CURSE'M IDE | None | Maintain |
| FloydMobile | Very High | Full build |

---

## NEXT STEPS FOR UNIFIED ARCHITECTURE

### 1. Single Wrapper, Multiple Modes

```typescript
// One wrapper that handles both CLI and TUI modes
class FloydWrapper {
  async run(input: Input, mode: 'cli' | 'tui'): Promise<void> {
    if (mode === 'cli') {
      return this.runCliMode(input);
    }
    return this.runTuiMode(input);
  }
}
```

### 2. Vendor-Agnostic LLM Interface

```typescript
interface LLMClient {
  streamChat(messages, tools, callbacks): AsyncGenerator<StreamEvent>;
}

class GLMClient implements LLMClient { /* ... */ }
class AnthropicClient implements LLMClient { /* ... */ }
class OpenAIClient implements LLMClient { /* ... */ }
```

### 3. Ecosystem Management

The unified wrapper must:
- Launch/manage FloydDesktop
- Connect to FloydChrome extension
- Bridge to FloydMobile
- Integrate with Floyd CURSE'M IDE

### 4. IDE Integration

Floyd as primary coding assistant in CURSE'M:
- Floyd-aware language server
- Inline suggestions via Floyd
- Chat panel integration
- Tool access from IDE

---

## METADATA

**Document Version:** 1.0
**Last Updated:** 2026-01-28 16:30:00 EST
**Author:** Claude Opus 4.5 (comprehensive ecosystem analysis)
**Status:** Ready for architectural planning

---

**End of current.md**
