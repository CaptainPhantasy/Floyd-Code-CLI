# FLOYD CLI System Map

**Analysis Date:** 2026-01-20
**Repository:** /Volumes/Storage/FLOYD_CLI
**Component:** INK/floyd-cli (CLI Implementation)

---

## 1. CONTEXT INFERRED

### Project Overview
- **Name:** FLOYD CLI (File-Logged Orchestrator Yielding Deliverables)
- **Purpose:** Douglas's personal daily driver replacement for the Claude ecosystem
- **Architecture:** TypeScript + React Ink + MCP (Model Context Protocol) + GLM-4.7 API
- **Entry Point:** `INK/floyd-cli/src/cli.tsx` -> `INK/floyd-cli/src/app.tsx` -> `MainLayout.tsx`

### Technology Stack
- **UI Framework:** Ink (React for CLI terminals)
- **State Management:** Zustand (`floyd-store.ts`)
- **Agent Engine:** `floyd-agent-core` package
- **MCP Integration:** Built-in servers (patch, runner, git, cache)
- **Theme:** CRUSH (CharmUI + Rustic + User-focused + Speedy + Hybrid)

---

## 2. REPO / SYSTEM MAP

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOYD CLI                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  cli.tsx (Entry Point)                                    │  │
│  │  - meow CLI parsing                                       │  │
│  │  - render(<App>)                                          │  │
│  └────────────────────┬──────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐  │
│  │  app.tsx (Main Application)                                │  │
│  │  - AgentEngine initialization                             │  │
│  │  - MCPClientManager setup                                 │  │
│  │  - SessionManager                                         │  │
│  │  - useInput handlers (Esc, Ctrl+/, Ctrl+M, Ctrl+T, etc) │  │
│  │  - Message submission handling                            │  │
│  └────────────────────┬──────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐  │
│  │  MainLayout.tsx (Primary UI Layout)                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ FloydAsciiBanner (8 lines)                         │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │ StatusBar (2 lines)                                  │  │  │
│  │  │   - User name, mode, connection, status            │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │ 3-Column Content Area (responsive)                   │  │  │
│  │  │  ┌────────┬──────────────┬────────┐                │  │  │
│  │  │  │ SESSION│  TRANSCRIPT  │ CONTEXT│                │  │  │
│  │  │  │ Panel  │    Panel     │ Panel  │                │  │  │
│  │  │  │ (20c)  │  (flex grow)  │ (20c)  │                │  │  │
│  │  │  └────────┴──────────────┴────────┘                │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │ InputArea (3 lines)                                 │  │  │
│  │  │   - TextInput + hints                                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Overlays (when active):                                 │  │
│  │  - HelpOverlay (Ctrl+/, ?)                                │  │
│  │  - CommandPalette (Ctrl+P, /)                             │  │
│  │  - PromptLibraryOverlay (Ctrl+Shift+P)                    │  │
│  │  - AgentBuilderOverlay                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  State Management:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Zustand Store (floyd-store.ts)                           │  │
│  │  - messages: ConversationMessage[]                        │  │
│  │  - streamingContent: string                               │  │
│  │  - status: ThinkingStatus                                 │  │
│  │  - safetyMode: 'yolo' | 'ask' | 'plan'                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Agent Core (packages/floyd-agent-core):                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - AgentEngine (main orchestration)                       │  │
│  │  - MCPClientManager (tool servers)                        │  │
│  │  - PermissionManager (tool authorization)                 │  │
│  │  - SessionManager (conversation state)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Key Dependencies
- `ink`: React rendering for terminal
- `ink-text-input`: Text input component
- `zustand`: State management
- `floyd-agent-core`: Local package for agent logic
- `@anthropic-ai/sdk`: API client (configured for GLM-4.7)

### MCP Servers
- Built-in: `patch-server.ts`, `runner-server.ts`, `git-server.ts`, `cache-server.ts`
- External: Configured via `.floyd/mcp.json`

---

## 3. FILE STRUCTURE & KEY FILES

### Layout Files
| File | Purpose |
|------|---------|
| `src/ui/layouts/MainLayout.tsx` | Primary interactive layout (1229 lines) |
| `src/ui/layouts/MonitorLayout.tsx` | Monitor dashboard |
| `src/ui/layouts/DualScreenLayout.tsx` | Dual-screen configuration |
| `src/ui/layouts/EnhancedMainLayout.tsx` | Three-pane with Frame components |

### Panel Files
| File | Purpose |
|------|---------|
| `src/ui/panels/TranscriptPanel.tsx` | Message history display |
| `src/ui/panels/SessionPanel.tsx` | Left sidebar (repo, git, safety) |
| `src/ui/panels/ContextPanel.tsx` | Right sidebar (plan, files, diffs) |

### Component Files
| File | Purpose |
|------|---------|
| `src/ui/components/CommandPalette.tsx` | Fuzzy-find command overlay |
| `src/ui/components/CommandPaletteTrigger.tsx` | Ctrl+P trigger wrapper |
| `src/ui/components/AgentBuilder.tsx` | Agent configuration UI |
| `src/ui/overlays/HelpOverlay.tsx` | Keyboard shortcuts help |

### Core Application
| File | Purpose |
|------|---------|
| `src/app.tsx` | Main application component (649 lines) |
| `src/cli.tsx` | CLI entry point with meow |
| `src/store/floyd-store.ts` | Zustand state store |

---

## 4. DATA FLOW

### Message Flow
```
User Input (TextInput)
    │
    ▼
MainLayout.handleSubmit()
    │
    ▼
App.handleSubmit()
    │
    ├─► Check dock commands
    ├─► Add user message to Zustand store
    ├─► Create AgentEngine generator
    └─► Process stream through StreamProcessor
            │
            ▼
        Chunk processing
            │
            ├─► Detect <thinking> blocks
            ├─► Append streaming content
            └─► Update message in store
```

### Hotkey Flow (CURRENT - PROBLEMATIC)
```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEM: Multiple useInput hooks compete for key events    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app.tsx useInput (lines 409-448):                          │
│  - Esc (exit/help/monitor)                                   │
│  - Ctrl+/ (toggle help)                                       │
│  - ? (toggle help when input empty)                           │
│  - Ctrl+M (toggle monitor)                                    │
│  - Ctrl+T (toggle agent viz)                                  │
│  - Ctrl+Y (toggle safety mode)                               │
│                                                              │
│  MainLayout.tsx useInput (lines 872-956):                    │
│  - Ctrl+C (exit)                                             │
│  - Esc (overlay/exit)                                        │
│  - Ctrl+/ (toggle help)                                       │
│  - Ctrl+P (command palette - PASS THROUGH)                    │
│  - ? (when input empty)                                       │
│  - Shift+Tab (safety mode cycle)                              │
│  - Ctrl+M (toggle monitor)                                    │
│  - Ctrl+T (toggle agent viz)                                  │
│  - Ctrl+R (voice input)                                       │
│  - Ctrl+Shift+P (prompt library)                              │
│                                                              │
│  CommandPaletteTrigger.tsx useInput (lines 434-452):         │
│  - Ctrl+P (toggle palette)                                    │
│  - / (when openKeys includes it)                              │
│  - Esc (close)                                                │
│                                                              │
│  Viewport.tsx useInput (lines 115-136):                       │
│  - Arrow keys (scroll)                                        │
│  - PageUp/Down                                                │
│  - Ctrl+A/E (top/bottom)                                     │
│                                                              │
│  HelpOverlay.tsx useInput (lines 189-221):                    │
│  - Esc (close)                                                │
│  - Ctrl+/ (close)                                             │
│  - Arrow keys (navigate)                                     │
│  - Enter (execute)                                           │
│                                                              │
│  ... and 20+ more useInput hooks                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. TERMINAL SIZING ANALYSIS

### Terminal Detection
**Location:** `src/ui/layouts/MainLayout.tsx:661-670`

```typescript
const terminalWidth = process.stdout.columns || 80;
const terminalHeight = process.stdout.rows || 24;

const isWideScreen = terminalWidth >= 120;
const isUltraWideScreen = terminalWidth >= 160;
const isNarrowScreen = terminalWidth < 100;
const isVeryNarrowScreen = terminalWidth < 80;
```

### Height Calculations
**Location:** `src/ui/layouts/MainLayout.tsx:678-700`

```typescript
const getOverheadHeight = () => {
    if (isVeryNarrowScreen) return 5;  // StatusBar(2) + Input(3)
    if (isNarrowScreen) return 5;       // StatusBar(2) + Input(3)
    return 15;  // Banner(10) + StatusBar(2) + Input(3)
};

const overheadHeight = getOverheadHeight();
const availableHeight = terminalHeight - overheadHeight;
const transcriptHeight = Math.max(1, availableHeight - 1);
```

### Panel Widths
**Location:** `src/ui/layouts/MainLayout.tsx:703-710`

```typescript
const sessionPanelWidth = isVeryNarrowScreen ? 0
    : isNarrowScreen ? 16
    : isUltraWideScreen ? 24
    : 20;

const contextPanelWidth = isVeryNarrowScreen ? 0
    : isNarrowScreen ? 0
    : isUltraWideScreen ? 24
    : 20;
```

### Known Sizing Issues
1. **DEBUG statements left in production** (line 665)
2. **Negative height possible** if terminal < 15 rows on wide screens
3. **Frame border heights not calculated** (padding adds to height)

---

## 6. HOTKEY IMPLEMENTATION DETAILS

### Documented Hotkeys

| Hotkey | Implementation | Status |
|--------|----------------|--------|
| `Esc` | app.tsx:410, MainLayout.tsx:883 | CONFLICT |
| `Ctrl+/` | app.tsx:422, MainLayout.tsx:898 | DUPLICATE |
| `Ctrl+P` | CommandPaletteTrigger.tsx:436 | PASS-THRU |
| `?` | app.tsx:429, MainLayout.tsx:915 | DUPLICATE |
| `Ctrl+M` | app.tsx:435, MainLayout.tsx:934 | DUPLICATE |
| `Ctrl+T` | app.tsx:440, MainLayout.tsx:940 | DUPLICATE |
| `Ctrl+Y` | app.tsx:445 | APP ONLY |
| `Ctrl+C` | MainLayout.tsx:875 | MAIN LAYOUT |
| `Shift+Tab` | MainLayout.tsx:921 | MAIN LAYOUT |
| `Ctrl+R` | MainLayout.tsx:946 | MAIN LAYOUT |
| `Ctrl+Shift+P` | MainLayout.tsx:952 | MAIN LAYOUT |

### Hotkey Issues Summary

1. **CONFLICT:** Esc handled in both app.tsx and MainLayout.tsx with different logic
2. **DUPLICATE:** Ctrl+/ appears in both components
3. **DUPLICATE:** Ctrl+M appears in both components
4. **DUPLICATE:** Ctrl+T appears in both components
5. **DUPLICATE:** ? key appears in both components
6. **MISSING:** No global hotkey coordinator/manager
7. **RISK:** 28+ `useInput` hooks can interfere with each other

---

## 7. KNOWN BUGS FROM P0_DOCUMENT

### Relevant Bugs for CLI

| Bug # | Description | File | Status |
|-------|-------------|------|--------|
| #41 | Extend save confirmation time | (Desktop) | Pending |
| #42 | Add more commands to palette | - | Pending |
| #43 | Remove non-functional slash commands | - | Pending |
| #45 | Add keyboard shortcuts hint | - | Pending |
| #50 | Add getting started to CLI help | - | Pending |
| #52 | Show setup instructions in CLI greeting | - | Pending |

---

## 8. EVIDENCE REFERENCES

### Key Files Referenced
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/app.tsx` - Main app logic
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/layouts/MainLayout.tsx` - Primary layout
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/layouts/index.ts` - Layout exports
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/components/CommandPalette.tsx` - Command palette
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/components/CommandPaletteTrigger.tsx` - Trigger wrapper
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/overlays/HelpOverlay.tsx` - Help overlay
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/crush/Viewport.tsx` - Scrollable viewport
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/theme/crush-theme.ts` - Theme definition
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/package.json` - Dependencies
- `/Volumes/Storage/FLOYD_CLI/.floyd/P0_CRITICAL_BUGS.md` - Known bugs

### Build Verification
```bash
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
npm run build
# Output: tsc compilation successful
# Build artifacts in dist/
```

---

*End of System Map*
