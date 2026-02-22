# FLOYD Ecosystem Architecture Report
## A Comprehensive Analysis of the Sovereign Alternative to Anthropic & CURSOR

**Generated:** 2026-02-15
**Version:** 1.0
**Status:** Historical Reference Document

---

## Executive Summary

The FLOYD Ecosystem was designed as a **sovereign, open-architecture alternative** to the vertically-integrated Anthropic Claude ecosystem and CURSOR IDE. It represents an ambitious attempt to replicate and, in some areas, exceed the capabilities of commercial AI development tools while maintaining:

- **90% cost reduction** (~$270/year vs ~$2,400/year for Anthropic Max)
- **Complete data sovereignty** (local processing, no cloud dependency)
- **Multi-provider flexibility** (GLM, Anthropic, OpenAI, DeepSeek)
- **Unified TypeScript codebase** (shared `floyd-agent-core` across all interfaces)

---

## The Five FLOYD Applications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOYD ECOSYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 GLM-4.7 / GLM-5 API (api.z.ai)                      │   │
│   │               Anthropic-Compatible Proxy Endpoint                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  Shared Agent Core (floyd-agent-core)               │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│   │  │ AgentEngine │  │ MCP Client  │  │  Session    │  │ Permission│  │   │
│   │  │(Orchestrator│  │  Manager    │  │  Store      │  │  Manager  │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                          │              │              │                     │
│         ┌────────────────┼──────────────┼──────────────┼────────────────┐   │
│         ▼                ▼              ▼              ▼                ▼   │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────┐ │
│   │  Floyd    │   │  Floyd    │   │  Floyd    │   │  CURSE'M  │   │Floyd  │ │
│   │   CLI     │   │ Desktop   │   │  Chrome   │   │    IDE    │   │Mobile │ │
│   │ (Terminal)│   │  (Electron│   │ Extension │   │ (NetBeans)│   │(React │ │
│   │           │   │   +Web)   │   │           │   │   Fork)   │   │Native)│ │
│   └───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────┘ │
│         │               │               │               │               │   │
│         ▼               ▼               ▼               ▼               ▼   │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────┐ │
│   │  Claude   │   │  Claude   │   │  Claude   │   │  CURSOR   │   │ Claude │ │
│   │   Code    │   │  Desktop  │   │for Chrome │   │    IDE    │   │ Mobile │ │
│   │  (CLI)    │   │           │   │           │   │           │   │        │ │
│   └───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────┘ │
│         │               │               │               │               │   │
│   [ REPLACES ]    [ REPLACES ]    [ REPLACES ]    [ REPLACES ]   [REPLACES] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Floyd CLI → Replaces Claude Code CLI

### Target Product: Claude Code CLI
**Vendor:** Anthropic
**Cost:** ~$200/month (part of Max plan)
**Key Features:**
- Natural language command interpretation
- Agentic execution loop (plan → execute → verify)
- File operations (read, write, edit)
- Shell command execution
- Git operations
- MCP server integration
- Context management with automatic summarization

### Floyd CLI Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLOYD CLI ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Entry Point (cli.tsx)                                                     │
│         │                                                                   │
│         ▼                                                                   │
│   Main Application (app.tsx)                                                │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    FloydAgentEngine                                 │   │
│   │  ┌──────────────────────────────────────────────────────────────┐  │   │
│   │  │              Agentic Execution Loop                           │  │   │
│   │  │  1. Call LLM (GLM-4.7/5)                                     │  │   │
│   │  │  2. Parse tool calls                                         │  │   │
│   │  │  3. Execute tools via ToolRegistry                           │  │   │
│   │  │  4. Stream results back                                      │  │   │
│   │  │  5. Repeat until completion (max 10-20 turns)                │  │   │
│   │  └──────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                    │                                               │
│         ▼                    ▼                                               │
│   ┌───────────┐        ┌───────────┐                                        │
│   │    Tool   │        │   Stream  │                                        │
│   │  Registry │        │ Processor │                                        │
│   ├───────────┤        ├───────────┤                                        │
│   │File Tools │        │Token      │                                        │
│   │- Read     │        │Streaming  │                                        │
│   │- Write    │        │Incremental│                                        │
│   │- Edit     │        │Render     │                                        │
│   │- Grep     │        └───────────┘                                        │
│   │- Glob     │                                                             │
│   ├───────────┤                                                             │
│   │System     │                                                             │
│   │- Bash     │                                                             │
│   │- AskUser  │                                                             │
│   └───────────┘                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parity Matrix

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Feature                    │ Claude Code    │ Floyd CLI      │ Status      │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Natural language commands  │ ✓              │ ✓              │ ✅ PARITY   │
│ Streaming responses        │ ✓              │ ✓              │ ✅ PARITY   │
│ Tool calling loop          │ ✓              │ ✓ (max 10-20)  │ ✅ PARITY   │
│ Session persistence        │ Cloud-based    │ JSON files     │ ✅ PARITY   │
│ MCP integration            │ ✓              │ ✓ (stdio+WS)   │ ✅ PARITY   │
│ Repository map             │ ✓              │ Via Grep/Glob  │ ✅ PARITY   │
│ Browser automation         │ Via Chrome ext │ Via puppeteer  │ ✅ PARITY   │
│ Permission system          │ ✓              │ ✓              │ ✅ PARITY   │
│ Tmux integration           │ ✗              │ ✓              │ ✅ ADVANTAGE│
│ Multi-provider support     │ Anthropic only │ GLM/OpenAI/etc │ ✅ ADVANTAGE│
│ Cost                       │ ~$2,400/yr     │ ~$270/yr       │ ✅ ADVANTAGE│
│ Context auto-compact       │ ✓              │ ⚠ Basic        │ 🔧 GAP      │
│ Cloud session sync         │ ✓              │ Local only     │ 🔧 GAP      │
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## 2. Floyd Desktop (FloydDesktopWeb) → Replaces Claude Desktop

### Target Product: Claude Desktop
**Vendor:** Anthropic
**Cost:** ~$200/month (part of Max plan)
**Key Features:**
- Native desktop application (macOS/Windows)
- MCP host for local tool servers
- "Computer Use" vision-based GUI control
- Project management
- File browser integration
- Multi-turn conversation with tool visualization

### Floyd Desktop Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLOYDDESKTOP ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Main Process (Node.js/Electron)                  │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │              Shared Agent Engine (floyd-agent-core)           │  │   │
│   │  │  - Anthropic SDK (via api.z.ai proxy)                        │  │   │
│   │  │  - MCP Client Manager (WebSocket server on port 3000/3005)    │  │   │
│   │  │  - Session Manager (JSON storage)                            │  │   │
│   │  │  - Permission Manager                                        │  │   │
│   │  │  - Tool calling loop (max 10 turns)                          │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │                                                                      │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │                   IPC Bridge (AgentBridge)                     │  │   │
│   │  │  - agent:sendMessage (streaming)                              │  │   │
│   │  │  - agent:listTools                                            │  │   │
│   │  │  - agent:getHistory                                           │  │   │
│   │  │  - agent:loadSession                                          │  │   │
│   │  │  - agent:newSession                                           │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕ IPC                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  Renderer Process (React)                           │   │
│   │  - Chat panel with streaming response                               │   │
│   │  - File browser / workspace view                                    │   │
│   │  - Tool call visualization (expandable cards)                       │   │
│   │  - Session history sidebar                                          │   │
│   │  - Settings panel (multi-provider)                                  │   │
│   │  - Browork sub-agent panel                                          │   │
│   │  - Chrome extension status panel                                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                          ┌─────────────────────┐                            │
│                          │  Floyd Chrome       │                            │
│                          │  Extension          │                            │
│                          │  (Connects via      │                            │
│                          │   WebSocket to      │                            │
│                          │   port 3000/3005)   │                            │
│                          └─────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Provider Configuration

```typescript
// Multi-provider support - key differentiator from Claude Desktop
export const PROVIDERS = {
  glm: {
    id: 'glm',
    name: 'GLM (Zai)',
    endpoint: 'https://api.z.ai/api/anthropic',
    models: [
      { id: 'claude-opus-4', name: 'GLM-5 (via claude-opus-4)' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
  },
  openai: { /* ... */ },
  deepseek: { /* ... */ },
};
```

### Parity Matrix

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Feature                    │ Claude Desktop │ Floyd Desktop  │ Status      │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Chat interface             │ ✓              │ ✓              │ ✅ PARITY   │
│ Streaming responses        │ ✓              │ ✓              │ ✅ PARITY   │
│ MCP host                   │ ✓              │ ✓ (WS :3000)   │ ✅ PARITY   │
│ Tool visualization         │ ✓              │ ✓ (ToolCallCard│ ✅ PARITY   │
│ Session history            │ ✓              │ ✓ (Sidebar)    │ ✅ PARITY   │
│ Settings persistence       │ ✓              │ ✓              │ ✅ PARITY   │
│ Projects                   │ ✓              │ ✓ (ProjectsPanel│ ✅ PARITY   │
│ File browser               │ ✓              │ ✓              │ ✅ PARITY   │
│ Multi-provider             │ ✗              │ ✓ (4+ providers│ ✅ ADVANTAGE│
│ Browork sub-agent          │ ✗              │ ✓ (BroworkPanel│ ✅ ADVANTAGE│
│ Extension status panel     │ ✗              │ ✓              │ ✅ ADVANTAGE│
│ Computer Use               │ ✓              │ ⚠ Via Chrome   │ 🔧 PARTIAL  │
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## 3. Floyd Chrome Extension → Replaces Claude for Chrome

### Target Product: Claude for Chrome
**Vendor:** Anthropic
**Cost:** ~$200/month (part of Max plan)
**Key Features:**
- Native Chrome integration
- Visual understanding via screenshots
- Shared authentication sessions
- Side panel UI
- Page navigation and interaction
- Tab management

### Floyd Chrome Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLOYDCHROME ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Chrome Extension Manifest V3                      │   │
│   │  - Service Worker (background.ts)                                   │   │
│   │  - Content Scripts (content.ts)                                     │   │
│   │  - Side Panel UI (sidepanel/index.html)                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      FloydAgent Class                                │   │
│   │  - WebSocket client to FloydDesktop (port 3000/3005)                │   │
│   │  - MCP tool server for browser operations                           │   │
│   │  - Safety layer (permissions, sanitizer)                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          Tool Inventory                              │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│   │  │ Navigation      │  │ Reading         │  │ Interaction     │     │   │
│   │  │ - navigate      │  │ - read_page     │  │ - click         │     │   │
│   │  │ - scroll        │  │ - get_page_text │  │ - type          │     │   │
│   │  │ - back          │  │ - find          │  │ - hover         │     │   │
│   │  │ - forward       │  │                 │  │                 │     │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│   │  ┌─────────────────┐                                                 │   │
│   │  │ Tab Management  │                                                 │   │
│   │  │ - tabs_create   │                                                 │   │
│   │  │ - get_tabs      │                                                 │   │
│   │  └─────────────────┘                                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                         Key Difference from Claude:                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Claude: Uses screenshots + vision model for page understanding     │   │
│   │  Floyd: Uses Accessibility Tree + DOM (no vision model required)    │   │
│   │                                                                      │   │
│   │  Advantage: Faster, less bandwidth, works on text-heavy pages       │   │
│   │  Trade-off: May miss visual-only elements (canvas animations)       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parity Matrix

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Feature                    │Claude for Chrome│FloydChrome    │ Status      │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Native Chrome integration  │ ✓              │ ✓ (Extension) │ ✅ PARITY   │
│ Visual understanding       │ Screenshots    │ A11y tree+DOM  │ ≈ DIFFERENT │
│ Shared auth sessions       │ ✓              │ ✓              │ ✅ PARITY   │
│ Side panel UI              │ ✓              │ ✓              │ ✅ PARITY   │
│ Navigation tools           │ ✓              │ ✓              │ ✅ PARITY   │
│ Click/type tools           │ ✓              │ ✓              │ ✅ PARITY   │
│ Tab management             │ ✓              │ ✓              │ ✅ PARITY   │
│ Page reading               │ ✓              │ ✓ (a11y tree)  │ ✅ PARITY   │
│ Desktop connection         │ N/A (native)   │ WS to Desktop  │ ≈ DIFFERENT │
│ Canvas element support     │ ✓ (vision)     │ ⚠ Limited      │ 🔧 GAP      │
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## 4. CURSE'M IDE → Replaces CURSOR IDE

### Target Product: CURSOR IDE
**Vendor:** Cursor Inc.
**Cost:** ~$20-40/month (Pro/Business)
**Key Features:**
- VS Code fork with AI integration
- Inline code completion
- Chat interface in editor
- Codebase-wide context
- Multi-file refactoring
- AI-powered debugging

### CURSE'M IDE Implementation (Planned)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CURSE'M IDE ARCHITECTURE                               │
│                    (Apache NetBeans Rebrand Fork)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Apache NetBeans Base                              │   │
│   │  - Java-based IDE platform                                          │   │
│   │  - Modular plugin architecture                                      │   │
│   │  - Cross-platform (macOS/Windows/Linux)                             │   │
│   │  - Mature code editor with syntax highlighting                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Floyd CURSE'M Branding                            │   │
│   │  ┌───────────────────────────────────────────────────────────────┐  │   │
│   │  │  Color Palette (Legacy AI / Floyd CLI Theme):                 │  │   │
│   │  │  - Background Primary:   #0E111A (The Void)                   │  │   │
│   │  │  - Background Secondary: #1C165E (Deep Indigo)                │  │   │
│   │  │  - Accent Primary:       #AB18E4 (Electric Purple)            │  │   │
│   │  │  - Accent Secondary:     #371DF4 (Electric Blue)              │  │   │
│   │  │  - Selection:            #561DFF (Bright Neon)                │  │   │
│   │  │  - Text Primary:         #FFFFFF                               │  │   │
│   │  │  - Text Secondary:       #5C5B62 (Muted Gray)                 │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   │                                                                      │   │
│   │  Branding Hierarchy:                                                 │   │
│   │  - Product Name: Floyd CURSE'M IDE                                   │   │
│   │  - Parent Brand: Legacy AI                                           │   │
│   │  - Tagline: "The Ultimate Terminal-Centric Environment"              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    GLM Integration (Planned)                         │   │
│   │  - Inline code completion via GLM API                                │   │
│   │  - Chat panel with floyd-agent-core integration                      │   │
│   │  - Multi-file refactoring with agentic loop                          │   │
│   │  - Context-aware suggestions                                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parity Matrix

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Feature                    │ CURSOR IDE     │ CURSE'M IDE    │ Status      │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ IDE base                   │ VS Code fork   │ NetBeans fork  │ ≈ DIFFERENT │
│ AI code completion         │ ✓ (Claude/GPT) │ ⚠ Planned      │ 🔧 TODO     │
│ Chat in editor             │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Codebase context           │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Multi-file refactoring     │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ AI debugging               │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Custom branding            │ ✗              │ ✓ (Legacy AI)  │ ✅ ADVANTAGE│
│ GLM integration            │ ✗              │ ✓ (Planned)    │ ✅ ADVANTAGE│
│ Cost                       │ ~$240-480/yr   │ ~$270/yr (GLM) │ ✅ ADVANTAGE│
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## 5. Floyd Mobile → Replaces Claude Mobile

### Target Product: Claude Mobile (iOS/Android)
**Vendor:** Anthropic
**Cost:** ~$200/month (part of Max plan)
**Key Features:**
- Native iOS/Android apps
- Cloud-hosted session continuity
- Voice input
- Push notifications
- Remote monitoring of desktop sessions

### Floyd Mobile Implementation (Planned)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLOYD MOBILE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    React Native App (Planned)                        │   │
│   │  - iOS and Android support                                          │   │
│   │  - Deep link handler (floyd://connect)                              │   │
│   │  - QR code scanner for pairing                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Connection Scenarios                              │   │
│   │                                                                      │   │
│   │  Scenario 1: Mobile ↔ CLI (Local Network)                           │   │
│   │  ┌───────────┐     WebSocket      ┌───────────┐                     │   │
│   │  │  Mobile   │◄──────────────────►│   CLI     │                     │   │
│   │  │   App     │   ws://host:3000   │  (bridge) │                     │   │
│   │  └───────────┘                    └───────────┘                     │   │
│   │                                                                      │   │
│   │  Scenario 2: Mobile ↔ CLI → Browser (Chrome Relay)                  │   │
│   │  ┌───────────┐     WebSocket      ┌───────────┐    MCP     ┌──────┐│   │
│   │  │  Mobile   │◄──────────────────►│   CLI     │◄──────────►│Chrome││   │
│   │  │   App     │                    │(ChromeBr) │            │ Ext  ││   │
│   │  └───────────┘                    └───────────┘            └──────┘│   │
│   │                                                                      │   │
│   │  Scenario 3: Mobile ↔ iPhone (Remote via NGROK)                     │   │
│   │  ┌───────────┐    NGROK Tunnel   ┌───────────────────────────────┐  │   │
│   │  │  iPhone   │◄─────────────────►│  Mac (Development Machine)    │  │   │
│   │  │  (Remote) │  wss://xxx.ngrok  │  ┌───────────┐  ┌───────────┐  │  │   │
│   │  └───────────┘                   │  │   CLI     │  │  NGROK    │  │  │   │
│   │                                  │  │  (bridge) │  │  Tunnel   │  │  │   │
│   │                                  │  └───────────┘  └───────────┘  │  │   │
│   │                                  └───────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Pairing Flow (NGROK + QR)                         │   │
│   │                                                                      │   │
│   │  1. User runs: floyd --bridge                                       │   │
│   │  2. Bridge server starts on localhost:3000                          │   │
│   │  3. NGROK tunnel established (wss://xxx.ngrok.io)                   │   │
│   │  4. QR code displayed in terminal with connection payload           │   │
│   │  5. User scans QR with iPhone camera                                │   │
│   │  6. FLOYD Mobile app opens via deep link                            │   │
│   │  7. WebSocket connection established                                │   │
│   │  8. Ready for remote chat/control                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parity Matrix

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Feature                    │ Claude Mobile  │ Floyd Mobile   │ Status      │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Native iOS/Android         │ ✓              │ ⚠ React Native │ 🔧 PLANNED  │
│ Cloud session sync         │ ✓              │ ⚠ NGROK tunnel │ 🔧 PLANNED  │
│ Voice input                │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Push notifications         │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Remote desktop monitoring  │ ✓              │ ⚠ Planned      │ 🔧 TODO     │
│ Browser control from mobile│ ✗              │ ✓ (via CLI)    │ ✅ ADVANTAGE│
│ No cloud dependency        │ ✗              │ ✓ (local-only) │ ✅ ADVANTAGE│
│ QR pairing                 │ ✗              │ ✓ (Planned)    │ ✅ ADVANTAGE│
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## Integration: How the Five Apps Work Together

### Communication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTER-APP COMMUNICATION PROTOCOLS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │   FloydDesktopWeb   │                              │
│                        │   (Central Hub)     │                              │
│                        │   WS-MCP :3005      │                              │
│                        └──────────┬──────────┘                              │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         │                         │                         │              │
│         ▼                         ▼                         ▼              │
│   ┌───────────┐            ┌───────────┐            ┌───────────┐         │
│   │Floyd CLI  │            │  Chrome   │            │  Mobile   │         │
│   │(Bridge)   │            │ Extension │            │   App     │         │
│   │:3000      │            │  (WS)     │            │ (NGROK)   │         │
│   └───────────┘            └───────────┘            └───────────┘         │
│         │                         │                         │              │
│         │                         │                         │              │
│         └─────────────────────────┼─────────────────────────┘              │
│                                   │                                         │
│                                   ▼                                         │
│                        ┌─────────────────────┐                              │
│                        │   Shared Session    │                              │
│                        │   (JSON Storage)    │                              │
│                        │   ~/.floyd/         │                              │
│                        └─────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Shared Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARED COMPONENT LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    floyd-agent-core (npm package)                    │   │
│   │                                                                      │   │
│   │  Used by: Floyd CLI, Floyd Desktop, Floyd Chrome (via Desktop)      │   │
│   │                                                                      │   │
│   │  Components:                                                         │   │
│   │  - AgentEngine: Main orchestrator, streaming, tool loop             │   │
│   │  - MCPClientManager: Tool discovery and execution                   │   │
│   │  - SessionManager: JSON persistence, history                        │   │
│   │  - PermissionManager: Safety rules, risk classification             │   │
│   │  - ConfigManager: API keys, settings                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SUPERCACHE (3-Tier Memory)                        │   │
│   │                                                                      │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│   │  │ Tier 1          │  │ Tier 2          │  │ Tier 3          │     │   │
│   │  │ REASONING       │  │ PROJECT         │  │ VAULT           │     │   │
│   │  │ TTL: 5 min      │  │ TTL: 24 hours   │  │ TTL: 7 days     │     │   │
│   │  │                 │  │                 │  │                 │     │   │
│   │  │ Current session │  │ Decisions,      │  │ Reusable        │     │   │
│   │  │ working memory  │  │ phase summaries │  │ patterns        │     │   │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│   │                                                                      │   │
│   │  Storage: .floyd/.cache/ (JSON files)                               │   │
│   │  Tools: cache_store, cache_retrieve, cache_list, cache_stats        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    MCP (Model Context Protocol)                      │   │
│   │                                                                      │   │
│   │  Servers:                                                            │   │
│   │  - floyd-patch-server: edit_range, apply_unified_diff, etc.         │   │
│   │  - floyd-runner-server: run_tests, lint, build, format              │   │
│   │  - floyd-supercache: cache_store, cache_retrieve, etc.              │   │
│   │  - floyd-safe-ops: safe_refactor, impact_simulate, verify           │   │
│   │  - floyd-terminal: start_process, execute_code, etc.                │   │
│   │  - novel-concepts: episodic_memory, consensus_protocol, etc.        │   │
│   │                                                                      │   │
│   │  Transports: stdio, WebSocket                                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Economic Comparison

```
┌────────────────────────────┬────────────────┬────────────────┬─────────────┐
│ Cost Category              │Anthropic+Curs │ FLOYD Ecosystem│ Savings     │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Claude Max Plan            │ $200/month     │ -              │ -           │
│ CURSOR Pro                 │ $20/month      │ -              │ -           │
│ GLM API (Zai)              │ -              │ ~$22/month     │ -           │
│ ────────────────────────────────────────────────────────────────────────── │
│ Annual Total               │ ~$2,640        │ ~$270          │ ~90%        │
├────────────────────────────┼────────────────┼────────────────┼─────────────┤
│ Data Privacy               │ Cloud-hosted   │ Local-only     │ Priceless   │
│ Vendor Lock-in             │ High           │ Zero           │ Priceless   │
│ Multi-provider             │ No             │ Yes (4+)       │ Flexible    │
│ Source Code                │ Closed         │ Open (TypeScript│ Transparent │
└────────────────────────────┴────────────────┴────────────────┴─────────────┘
```

---

## Key Architectural Decisions

### 1. Unified TypeScript Monorepo
Unlike the original proposal to integrate third-party tools (Aider, Open WebUI, Mem0), the actual implementation built a **purpose-built system** from scratch.

**Advantages:**
- Single codebase, shared `floyd-agent-core`
- Consistent UX across all interfaces
- Changes propagate to all apps automatically
- Native feel (Electron, Chrome Extension, React Native)

**Trade-offs:**
- Higher initial development effort
- More code to maintain

### 2. SUPERCACHE vs Mem0
The original proposal called for Mem0 with vector embeddings. The actual implementation uses a **3-tier JSON file system**.

**Advantages:**
- Simpler, no additional infrastructure
- Faster to implement
- Human-readable storage

**Trade-offs:**
- No semantic search (yet)
- Manual context management

### 3. Accessibility Tree vs Screenshots
For browser automation, Floyd uses **Accessibility Tree + DOM** instead of Claude's **screenshots + vision model**.

**Advantages:**
- Faster, less bandwidth
- Works on text-heavy pages
- No vision model required

**Trade-offs:**
- May miss visual-only elements (canvas animations)
- Less intuitive for layout understanding

### 4. NGROK Tunnels vs Cloud Hosting
For mobile access, Floyd uses **NGROK tunnels** instead of cloud-hosted sessions.

**Advantages:**
- No cloud infrastructure costs
- Complete data privacy
- Works offline (local network)

**Trade-offs:**
- Requires development machine to be running
- Less seamless than native cloud sync
- QR codes expire (security feature)

---

## Current Status Summary

```
┌────────────────────────────┬────────────────┬────────────────────────────┐
│ Component                  │ Parity Level   │ Status                     │
├────────────────────────────┼────────────────┼────────────────────────────┤
│ Floyd CLI                  │ 40-85%         │ Functional, actively dev   │
│ Floyd Desktop (Web)        │ 65-90%         │ Functional, multi-provider │
│ Floyd Chrome Extension     │ 50-80%         │ Built, connects to Desktop │
│ CURSE'M IDE                │ 0-30%          │ Planned (NetBeans fork)    │
│ Floyd Mobile               │ 0-70%          │ Planned (React Native)     │
├────────────────────────────┼────────────────┼────────────────────────────┤
│ Shared Agent Core          │ Complete       │ Production ready           │
│ SUPERCACHE                 │ Complete       │ 3-tier JSON system         │
│ MCP Servers                │ 46+ tools      │ Production ready           │
└────────────────────────────┴────────────────┴────────────────────────────┘
```

---

## Conclusion

The FLOYD Ecosystem represents a comprehensive attempt to build a **sovereign alternative** to the vertically-integrated Anthropic + CURSOR ecosystem. Key achievements:

1. **90% cost reduction** through GLM API proxy
2. **Complete data sovereignty** with local-only processing
3. **Multi-provider flexibility** (GLM, Anthropic, OpenAI, DeepSeek)
4. **Unified architecture** with shared `floyd-agent-core`
5. **Open source** TypeScript codebase

The ecosystem demonstrates that an alternative to commercial AI development tools is not only possible but **already functional** for the core use cases (CLI, Desktop, Chrome Extension). The planned additions (CURSE'M IDE, Floyd Mobile) would complete the parity with the target products.

**Central Thesis:** *"Agentic Flow" is the new unit of developer productivity, and owning that infrastructure—rather than renting it—provides control, privacy, and economic freedom that no subscription can match.*

---

## Part II: Ecosystem Evolution — From Monorepo to Independent Applications

**Updated:** 2026-02-15
**Version:** 1.1

### The Bifurcation Event

The FLOYD ecosystem evolved from a unified monorepo (`/Volumes/Storage/FLOYD_CLI/`) to **five independent repositories**, each with its own codebase, dependencies, and release cycle. This architectural decision was made to:

1. Enable independent development and deployment
2. Reduce cross-dependency complexity
3. Allow technology-specific optimizations (Go for CLI, TypeScript for Web)
4. Support different release cadences per application

---

### Current Independent Instances (Canon)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOYD ECOSYSTEM — INDEPENDENT INSTANCES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  App                │ Canonical Location                        │ Tech │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  Floyd CLI          │ /Volumes/Storage/floyd-main               │ Go   │  │
│  │  Floyd Desktop      │ /Volumes/Storage/FloydDesktopWeb-v2       │ TS   │  │
│  │  Floyd Chrome Ext   │ /Volumes/Storage/FLOYD Extension for Chrome│ TS  │  │
│  │  Floyd Mobile PWA   │ /Volumes/Storage/FLOYD MOBILE PWA...      │ TS   │  │
│  │  CURSE'M IDE        │ /Applications/FLOYD CURSE'M.app           │ VSC  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Note: Original monorepo at /Volumes/Storage/FLOYD_CLI/ is now archive     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Floyd CLI (floyd-main) — The Go Rewrite

**Location:** `/Volumes/Storage/floyd-main/`
**Technology:** Go 1.25.5 + BubbleTea TUI
**Status:** Production (82MB compiled binary)

The CLI was completely rewritten from TypeScript/Ink to Go for:
- Faster startup time
- Lower memory footprint
- Native binary distribution (no Node.js required)
- Better integration with system tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLOYD CLI (Go) ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   main.go → internal/                                                       │
│       ├── agent/           # Core agent implementation                      │
│       │   ├── agent.go     # SessionAgent with streaming, summarization    │
│       │   ├── coordinator.go # Orchestrates agents, tools, providers       │
│       │   ├── prompt/      # Template-based prompt builder                 │
│       │   ├── hyper/       # Custom LLM provider                           │
│       │   └── tools/       # All agent tool implementations                │
│       │       ├── mcp/     # Model Context Protocol                        │
│       │       ├── edit.go  # File editing                                  │
│       │       ├── bash.go  # Shell commands                                │
│       │       └── view.go  # File reading                                  │
│       ├── ui/              # BubbleTea TUI                                 │
│       │   ├── model/       # Main UI model                                 │
│       │   ├── chat/        # Chat message rendering                        │
│       │   └── dialog/      # Dialog implementations                        │
│       ├── db/              # SQLite + sqlc (session persistence)           │
│       ├── session/         # Session management                            │
│       ├── config/          # Configuration types                           │
│       └── permission/      # Permission service                            │
│                                                                             │
│   Build: go build . → ./floyd (82MB binary)                                │
│   Test:  task test / go test ./...                                         │
│   Lint:  task lint:fix                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Changes from TypeScript Version:**
- Migrated from Ink (React TUI) to BubbleTea (Go TUI)
- SQLite database for sessions (was JSON files)
- sqlc for type-safe SQL queries
- Goose for migrations
- Embedded templates (Go 1.16+ embed feature)

---

### 2. Floyd Desktop (FloydDesktopWeb-v2) — The Hub

**Location:** `/Volumes/Storage/FloydDesktopWeb-v2/`
**Technology:** TypeScript + React + Vite + Electron
**Status:** Functional, active development

The desktop app serves as the **central hub** for the ecosystem, providing:
- WebSocket MCP server (ports 3001/3005)
- Multi-provider configuration
- Chrome extension connectivity
- Session management with `.floyd-data/` storage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLOYDDESKTOP-V2 STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   /Volumes/Storage/FloydDesktopWeb-v2/                                      │
│   ├── server/                 # Backend server                              │
│   │   ├── ws-mcp-server.ts    # WebSocket MCP server (port 3005)           │
│   │   ├── mcp-client.ts       # MCP client for tool servers                │
│   │   └── browork-manager.ts  # Browser automation manager                 │
│   ├── dist-server/            # Compiled server code                        │
│   ├── dist/                   # Frontend build output                       │
│   ├── cli-client.js           # CLI integration client                      │
│   ├── floyd-cli               # CLI wrapper script                          │
│   ├── .floyd-data/            # Session storage                             │
│   │   └── sessions/           # JSON session files                          │
│   └── FLOYD.MD                # Governance document                         │
│                                                                             │
│   Commands:                                                                 │
│   - npm run dev      # Start development server                             │
│   - npm run build    # Build for production                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Floyd Chrome Extension — Browser Control

**Location:** `/Volumes/Storage/FLOYD Extension for Chrome/`
**Technology:** TypeScript + Chrome Extension Manifest V3
**Status:** Built, connection debugging in progress

The extension enables browser automation through:
- WebSocket connection to Floyd Desktop
- MCP tool server for browser operations
- Accessibility tree-based page understanding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLOYD CHROME EXTENSION STATUS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Location: /Volumes/Storage/FLOYD Extension for Chrome/                    │
│   ├── FloydChromeBuild/       # Extension build                             │
│   │   └── floydchrome/        # Extension source                            │
│   │       └── dist/           # Compiled extension                          │
│   └── HANDOFF.md              # Current status and next steps               │
│                                                                             │
│   Current Issue (2026-02-15):                                               │
│   - Extension loads in Chrome but NOT connecting to WebSocket               │
│   - Target: ws://localhost:3005 (FloydDesktop)                              │
│   - Needs: Debug background.js.js connection code                           │
│                                                                             │
│   Tools Available:                                                          │
│   - navigate, scroll, back, forward                                         │
│   - read_page, get_page_text, find                                          │
│   - click, type, hover                                                      │
│   - tabs_create, get_tabs                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Floyd Mobile PWA — Remote Access

**Location:** `/Volumes/Storage/FLOYD MOBILE  PWA w: NGROK TUNNEL/`
**Technology:** React 19 + Vite + vite-plugin-pwa
**Status:** PWA functional, NGROK tunnel configured

The mobile app provides remote access to FLOYD via:
- Progressive Web App (installable on iOS/Android)
- WebSocket connection through NGROK tunnel
- Deep link handler for QR pairing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOYD MOBILE PWA STRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   /Volumes/Storage/FLOYD MOBILE  PWA w: NGROK TUNNEL/                       │
│   ├── mobile/                 # Mobile application                          │
│   │   ├── FloydMobile/        # React + Vite PWA                            │
│   │   │   ├── src/            # Source code                                 │
│   │   │   ├── public/         # Static assets                               │
│   │   │   └── package.json    # React 19.2.3, Vite 7.3.1                   │
│   │   ├── Floyd API CONTRACTS.md # API specifications                       │
│   │   └── .floyd/             # Floyd operational data                      │
│   ├── FLOYD.md                # Agent protocol document                     │
│   ├── AGENTS.md               # Agent guidelines                            │
│   ├── ask-floyd.js            # API test client                             │
│   ├── capture-screenshot.js   # Screenshot utility                          │
│   └── test-browser-fix.js     # Browser automation tests                    │
│                                                                             │
│   Technology Stack:                                                         │
│   - Frontend: React 19.2.3                                                  │
│   - Build: Vite 7.3.1                                                       │
│   - PWA: vite-plugin-pwa 0.21.0                                             │
│   - Service Worker: Workbox 7.0.0                                           │
│                                                                             │
│   Commands:                                                                 │
│   - npm run dev       # Development server                                  │
│   - npm run build     # Production build                                    │
│   - npm run preview   # Preview production                                  │
│   - npm run lint      # ESLint                                              │
│   - npm run typecheck # TypeScript check                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. CURSE'M IDE — VS Code Fork

**Location:** `/Applications/FLOYD CURSE'M.app`
**Technology:** VS Code (Electron) Fork
**Status:** Installed, branding in progress

**Critical Discovery:** The CURSE'M IDE is actually a **VS Code fork** (not NetBeans as originally planned), making it more aligned with CURSOR's approach:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURSE'M IDE ANALYSIS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Bundle Identifier: com.microsoft.VSCode                                   │
│   Executable: Electron                                                      │
│   Version: 1.109.3                                                          │
│   Base: VS Code (same as CURSOR)                                            │
│                                                                             │
│   /Applications/FLOYD CURSE'M.app/Contents/                                 │
│   ├── MacOS/                  # Electron executable                         │
│   ├── Frameworks/             # Electron frameworks                         │
│   ├── Resources/              # App resources                               │
│   ├── Info.plist              # Bundle configuration                        │
│   └── _CodeSignature/         # Code signing                                │
│                                                                             │
│   Advantages of VS Code Fork (vs NetBeans):                                 │
│   ✅ Same base as CURSOR — direct competitor                                │
│   ✅ Larger extension ecosystem                                             │
│   ✅ More familiar to developers                                            │
│   ✅ TypeScript/JavaScript native support                                   │
│   ✅ Better performance                                                     │
│                                                                             │
│   Pending:                                                                  │
│   - GLM integration for AI features                                         │
│   - Custom branding application                                             │
│   - Floyd CLI integration                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Updated Status Summary (2026-02-15)

```
┌────────────────────────────┬────────────────┬────────────────────────────┐
│ Component                  │ Parity Level   │ Current Status             │
├────────────────────────────┼────────────────┼────────────────────────────┤
│ Floyd CLI (Go)             │ 70-90%         │ PRODUCTION, 82MB binary    │
│ Floyd Desktop (v2)         │ 65-90%         │ Functional, WS hub active  │
│ Floyd Chrome Extension     │ 50-80%         │ Built, WS connection debug │
│ Floyd Mobile PWA           │ 40-70%         │ PWA working, tunnel ready  │
│ CURSE'M IDE                │ 10-30%         │ VS Code fork, needs AI     │
├────────────────────────────┼────────────────┼────────────────────────────┤
│ Original Monorepo          │ Archived       │ /Volumes/Storage/FLOYD_CLI │
│ Go Tooling (floyd-main)    │ Complete       │ Go 1.25.5, BubbleTea       │
│ MCP Protocol               │ Complete       │ stdio + WebSocket          │
│ NGROK Tunnel               │ Ready          │ Mobile remote access       │
└────────────────────────────┴────────────────┴────────────────────────────┘
```

---

### Inter-App Communication (Current)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CURRENT COMMUNICATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌─────────────────────┐                            │
│                          │  FloydDesktop-v2    │                            │
│                          │  (Central Hub)      │                            │
│                          │  WS-MCP :3001/3005  │                            │
│                          └──────────┬──────────┘                            │
│                                     │                                       │
│           ┌─────────────────────────┼─────────────────────────┐            │
│           │                         │                         │            │
│           ▼                         ▼                         ▼            │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐   │
│   │  floyd-main   │         │ FloydChrome   │         │ Floyd Mobile  │   │
│   │  (Go CLI)     │         │ Extension     │         │ PWA           │   │
│   │               │         │               │         │               │   │
│   │ - stdio MCP   │         │ - WS :3005    │         │ - NGROK       │   │
│   │ - Native bin  │         │ - Manifest V3 │         │ - Deep links  │   │
│   │ - SQLite sess │         │ - A11y tree   │         │ - QR pairing  │   │
│   └───────────────┘         └───────────────┘         └───────────────┘   │
│           │                         │                         │            │
│           └─────────────────────────┼─────────────────────────┘            │
│                                     │                                       │
│                                     ▼                                       │
│                          ┌─────────────────────┐                            │
│                          │  CURSE'M IDE        │                            │
│                          │  (VS Code Fork)     │                            │
│                          │  - Pending: AI      │                            │
│                          │  - Pending: Floyd   │                            │
│                          └─────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Next Steps for Suite Integration

1. **Floyd Chrome Extension**
   - Debug WebSocket connection to FloydDesktop-v2
   - Verify tool call routing
   - Test browser automation end-to-end

2. **CURSE'M IDE**
   - Apply Floyd branding (color palette, icons)
   - Integrate GLM API for AI features
   - Connect to Floyd Desktop via WebSocket

3. **Floyd Mobile PWA**
   - Test NGROK tunnel with QR pairing
   - Verify deep link handler
   - Test browser control from mobile

4. **Cross-App Session Sync**
   - Define session protocol between apps
   - Implement shared `.floyd/` directory
   - Test session handoff between CLI and Desktop

---

*FLOYD: File-Logged Orchestrator Yielding Deliverables*
*Building complete software, not MVPs.*
