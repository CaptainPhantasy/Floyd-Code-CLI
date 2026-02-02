# Master Plan & Objectives (FLOYD)

**Last Updated:** 2026-01-18
**Status:** ✅ Phase 4 Complete | Phase 5 (Testing) In Progress

---

## ⚠️ SYNCHRONIZATION RULES

> **MANDATORY:** This document MUST stay synchronized with `ECOSYSTEM_ROADMAP.md`
> 
> - Any update here → Update `ECOSYSTEM_ROADMAP.md`
> - Any update to `ECOSYSTEM_ROADMAP.md` → Update here
> - Orchestrator verifies parity after each specialist disposal
> - See `.floyd/AGENT_ORCHESTRATION.md` for full protocol

---

## Primary Goal

**Ship Floyd as Douglas's personal daily driver replacement for the Claude ecosystem.**

This is not a demo. This is not a proof of concept. This is Douglas's production tool.

| Floyd | Replaces |
|-------|----------|
| **FloydDesktop** | Claude Desktop (MCP hub, multi-provider) |
| **Floyd CLI** | Claude Code (agentic coding) |
| **FloydChrome** | Claude for Chrome (browser automation) |
| **Browork** | Claude Cowork (non-technical agent) |

**Current Status:** All interfaces implemented. Testing and feature parity work in progress.

---

## Architecture Shift (2026-01-16)

### Decision: Go Retirement

The Go-based agent was **retired** as "too clunky." All development now uses TypeScript with a shared agent core package.

| Component | Old (Go) | New (TypeScript) | Status |
|-----------|-----------|------------------|--------|
| CLI Agent | Go + Bubbletea | TypeScript Ink | ✅ Complete |
| Shared Core | N/A | `floyd-agent-core` | ✅ Complete |
| Chrome Extension | JavaScript | TypeScript + WebSocket MCP | ✅ Complete |
| Desktop | Planned | Electron + React | ✅ Complete |

---

## Current Implementation Status

### ✅ Phase 1: Shared Agent Core Package
**Location:** `packages/floyd-agent-core/`

**Modules Created:**
- `AgentEngine` - Main orchestrator with streaming support
- `MCPClientManager` - Tool discovery and execution (WebSocket + stdio)
- `WebSocketTransport` - WebSocket transport for MCP protocol
- `SessionManager` - JSON file session persistence (`.floyd/sessions/`)
- `PermissionManager` - Tool access control with wildcards
- `Config` - Settings from CLAUDE.md and `.floyd/settings.json`

**Build Status:** ✅ TypeScript compiles successfully (`npx tsc --noEmit`)

### ✅ Phase 2: Chrome Extension Refactor
**Location:** `FloydChromeBuild/floydchrome/src/`

**Changes:**
- Converted from JavaScript to TypeScript
- Added Vite build system with `@crxjs/vite-plugin`
- Implemented WebSocket MCP client for connecting to FloydDesktop
- Added FloydAgent with task processing and tool execution
- Browser automation tools (navigate, click, type, read, find)
- Safety layer for content sanitization

**Build Status:** ✅ TypeScript compiles successfully

### ✅ Phase 3: FloydDesktop Implementation
**Location:** `FloydDesktop/`

**Completed:**
- Electron main process with AgentEngine integration
- React UI with Vite + Tailwind CSS
- WebSocket MCP server (port 3000) for Chrome extension
- IPC bridge between renderer and main process
- ChatPanel with streaming responses
- Sidebar with session management
- StatusPanel for connection status
- ToolCallCard for tool execution visualization

**Architecture:**
```
FloydDesktop (Electron)
├── Main Process
│   ├── AgentEngine (from floyd-agent-core)
│   ├── MCP Server (WebSocket, port 3000)
│   └── IPC Handlers (AgentIPC)
└── Renderer Process
    ├── React UI (Vite + Tailwind)
    ├── ChatPanel (message display + input)
    ├── Sidebar (session list)
    ├── StatusPanel (connection status)
    └── ToolCallCard (tool execution)
```

**Build Status:** ✅ Compiles successfully (`npm run build`)

---

## Technology Stack

### Core
- **Language:** TypeScript 5.8.3
- **Runtime:** Node.js ES2022
- **API:** GLM-4.7 via api.z.ai proxy (Anthropic-compatible)

### UI Frameworks
- **CLI:** React Ink (terminal UI)
- **Desktop:** React + Vite
- **Extension:** Vite + @crxjs/vite-plugin

### Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.71.2",
  "@modelcontextprotocol/sdk": "^1.25.2",
  "ink": "^4.x",
  "react": "^18.x",
  "uuid": "^13.0.0",
  "ws": "^8.18.0"
}
```

---

## Definition of Done

### Completed ✅
- [x] App compiles/runs end-to-end (CLI + Extension)
- [x] Core flows implemented per PRD
- [x] Lint/typecheck passes
- [x] Shared agent core package created
- [x] Chrome extension TypeScript refactor
- [x] WebSocket MCP transport implemented

### Pending ⏸️
- [ ] Tests added/updated where appropriate
- [ ] Deployment notes + env vars documented
- [ ] Final output is PR-ready (NO direct main pushes)
- [ ] Handoff checklist written for Douglas

---

## Strategic Steps (Revised)

### ✅ Phase 1: Shared Agent Core
**Timeline:** Completed 2026-01-17
- [x] Created `packages/floyd-agent-core/`
- [x] Implemented AgentEngine with streaming
- [x] Implemented MCPClientManager (WebSocket + stdio)
- [x] Implemented SessionManager (JSON persistence)
- [x] Implemented PermissionManager
- [x] Implemented Config manager

### ✅ Phase 2: Chrome Extension Refactor
**Timeline:** Completed 2026-01-17
- [x] Set up TypeScript + Vite build
- [x] Converted all JavaScript to TypeScript
- [x] Implemented WebSocket MCP client
- [x] Implemented FloydAgent with task processing
- [x] Added browser automation tools
- [x] Added safety layer (sanitization, permissions)
- [x] Created ARCHITECTURE.md documentation

### ✅ Phase 3: FloydDesktop Implementation
**Timeline:** Completed 2026-01-17
- [x] Initialize Electron project
- [x] Set up Vite + React build
- [x] Implement IPC bridge
- [x] Create React UI components
- [x] Implement WebSocket MCP server
- [x] Import floyd-agent-core

### ⏸️ Phase 4: Testing & Documentation
**Timeline:** Pending
- [ ] Add unit tests for floyd-agent-core
- [ ] Add integration tests for MCP protocol
- [ ] Document deployment process
- [ ] Write handoff checklist

---

## Context & Constraints

### Hard Rules
1. **NEVER push to main/master directly**
2. **Use absolute paths, not relative paths**
3. **Read files before editing them**
4. **Verify builds before claiming completion**
5. **Update related docs when changing behavior**

### Branch Strategy
- **Preferred Workflow:** feature branch → PR → Douglas approves merge
- **Current Branch:** master (surgery performed - needs PR creation)

---

## File Structure

```
/Volumes/Storage/FLOYD_CLI/
├── packages/
│   └── floyd-agent-core/        # ✅ Shared TypeScript agent core
├── INK/
│   └── floyd-cli/               # ✅ CLI (React Ink UI)
├── FloydDesktop/                # ✅ Desktop (Electron + React)
├── FloydChromeBuild/
│   └── floydchrome/             # ✅ Chrome Extension (TypeScript v2.0.0)
├── .archive/                     # Archived code (retired Go/TUI)
├── agent/                       # ⚠️ Legacy Go agent (do not use)
├── tui/                         # ⚠️ Legacy Go TUI (do not use)
├── .floyd/                       # Active development workspace
├── docs/                        # Documentation
├── Claude.md                     # Agent operating system
└── README.md                     # Project readme
```

---

## API Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `https://api.z.ai/api/anthropic` |
| Model | `claude-opus-4` → GLM-4.7 |
| Streaming | Supported |
| Max Tokens | 8192 |
| Max Turns | 10 |

### Environment Variables (priority order)
1. `ANTHROPIC_AUTH_TOKEN`
2. `GLM_API_KEY`
3. `ZHIPU_API_KEY`
4. `~/.claude/settings.json`

---

## Recent Progress (2026-01-17 to 2026-01-18)

### ✅ Completed This Session

1. **FloydDesktop Three-Panel Layout**
   - ProjectsPanel (left) - Projects & sessions management
   - ChatPanel (center) - Conversation with streaming
   - ContextPanel (right) - Files, Tools, Extension, Browork tabs

2. **Multi-Provider System**
   - GLM, Anthropic, OpenAI, DeepSeek support
   - Dynamic model lists per provider
   - Auto-populated endpoints
   - Settings persistence to disk

3. **Browork Sub-Agent System**
   - Real implementation with isolated AgentEngine instances
   - Progress tracking and status updates
   - IPC communication with real-time updates

4. **New UI Components**
   - FileBrowser with lazy directory loading
   - ToolsPanel showing MCP tools by server
   - ExtensionPanel for Chrome extension status
   - CommandPalette (Cmd+K)
   - KeyboardShortcuts modal
   - ExportDialog (Markdown, JSON, HTML)
   - InputBar with slash commands & file attachments

5. **Bug Fixes**
   - process.cwd() in renderer → optional parameter
   - createSession return type mismatch
   - InputBar commandIndex bounds
   - FileBrowser directory expansion logic
   - TypeScript errors resolved

---

## Feature Parity with Claude

See **`.floyd/ECOSYSTEM_ROADMAP.md`** for detailed comparison.

| Component | Claude Equivalent | Parity |
|-----------|------------------|--------|
| FloydDesktop | Claude Desktop | 65% |
| Floyd CLI | Claude Code | 40% |
| FloydChrome | Claude for Chrome | 50% |
| Browork | Claude Cowork | 35% |

### Key Gaps to Address

1. **Claude Code features:** Auto mode, plan→execute, skills, memory layers
2. **Chrome features:** Workflow recording, scheduled tasks, multi-tab
3. **Cowork features:** Better UX, file batch operations, templates

---

## Next Steps (Prioritized)

### Immediate (Phase 5)
1. **Testing** - First 15 interactions simulation, unit tests
2. **Bug fixes** - Address any remaining issues
3. **Documentation** - Deployment, configuration guides

### Short-term (Phase 6-7)
1. **Claude Code parity** - Auto mode, git integration, skills
2. **Chrome enhancement** - Workflow recording, scheduled tasks

### Medium-term (Phase 8-9)
1. **Browork enhancement** - Better UX, templates
2. **MCP ecosystem** - More connectors (GitHub, Google Drive, Notion)

---

## Key Differentiators vs Claude

| Aspect | Floyd | Claude |
|--------|-------|--------|
| Provider | Multi-provider | Anthropic only |
| Cost | Can use cheaper providers | $20-200/month |
| Open Source | Yes | No |
| Self-hosted | Yes | No |

---

*See `.floyd/ECOSYSTEM_ROADMAP.md` for the full roadmap and feature comparison.*
