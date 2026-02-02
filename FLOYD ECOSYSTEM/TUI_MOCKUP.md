# FLOYD TUI MOCKUP - Overlay Architecture Edition

**Version:** 2.0
**Created:** 2026-01-28
**Updated:** 2026-01-29 - Overlay Architecture (Claude Code Aligned)
**Purpose:** Provider-agnostic TUI that accepts any vendor API key and embodies the FLOYD GOD TIER agent

**Design Philosophy:** "Stability comes from what you DO NOT show on screen." The default interface is minimal. Features are hidden behind triggered sub-screens (overlays) accessed via keyboard shortcuts.

---

# PAGE 1: TUI DESIGN MOCKUP

## Visual Layout - Minimal Default (Primary Interface)

**KEY PRINCIPLE:** The default screen shows ONLY what's necessary. Full history, settings, and advanced features are behind overlays.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FLOYD | YOLO | glm-4-plus | Online | Thinking: ON  |  3 background tasks         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ You: Help me implement JWT authentication                                     │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: I'll help you implement JWT authentication. Let me first examine   │   │
│  │ your existing auth setup...                                                  │   │
│  │                                                                              │   │
│  │   [running...] grep -r "jwt" src/                                            │   │
│  │   [OK] Found 7 matches in 3 files                                           │   │
│  │                                                                              │   │
│  │   [OK] Read src/auth/jwt.ts (142 lines)                                      │   │
│  │                                                                              │   │
│  │ Based on your existing setup, here's what I recommend:                       │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ > [_]                                                                      Ctrl+O │
│                     Ctrl+P:Commands  Ctrl+/:Help  Ctrl+Q:Exit  Tab:Thinking       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Default Mode Characteristics:**
- **Compact Status Bar:** Single line, no ASCII art (clean, minimal)
- **Current Exchange Only:** Shows last user message + current response
- **No Full History:** History accessed via Ctrl+O overlay
- **Inline Tool Status:** Tool calls show inline with response
- **Background Task Indicator:** Shows count of running background tasks

---

## Visual Layout - Transcript Overlay (Ctrl+O)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  TRANSCRIPT MODE                                                    [Esc: Close]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ You: Hello Floyd                                                             │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: Hello! I'm Floyd, your God Tier AI assistant. How can I help?     │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ You: Help me implement a new feature                                        │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: I'd be happy to help. What feature?                                │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ You: A user authentication system with JWT                                  │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: Got it. Let me break this down...                                  │   │
│  │                                                                              │   │
│  │   [running...] grep -r "auth" src/                                          │   │
│  │   [OK] Found 3 files                                                       │   │
│  │                                                                              │   │
│  │   [OK] Read src/auth/jwt.ts (142 lines)                                     │   │
│  │                                                                              │   │
│  │ Here's my implementation plan:                                             │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ You: Help me implement JWT authentication                                    │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: I'll help you implement JWT authentication. Let me first examine   │   │
│  │ your existing auth setup...                                                  │   │
│  │                                                                              │   │
│  │   [running...] grep -r "jwt" src/                                            │   │
│  │   [OK] Found 7 matches in 3 files                                           │   │
│  │                                                                              │   │
│  │   [OK] Read src/auth/jwt.ts (142 lines)                                      │   │
│  │                                                                              │   │
│  │ Based on your existing setup, here's what I recommend:                       │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  PgUp/PgDn: Scroll  |  Ctrl+F: Search  |  Esc: Close                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Transcript Overlay Characteristics:**
- **Full History:** Shows complete conversation with virtual scrolling
- **Search:** Ctrl+F for fuzzy search through history
- **Navigation:** PgUp/PgDn to scroll, Enter to insert selection into input
- **Toggle:** Ctrl+O toggles between overlay and minimal mode

---

## Visual Layout - History Search Overlay (Ctrl+R)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Search History: jwt                                              [Esc: Close]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: Help me implement JWT authentication                          [1/3]    │   │
│  │                                                                              │   │
│  │ Preview: I'll help you implement JWT authentication. Let me examine your...  │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: A user authentication system with JWT                           [2/3]    │   │
│  │                                                                              │   │
│  │ Preview: Got it. Let me break this down...                                   │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: [running...] grep -r "jwt" src/                             [3/3]    │   │
│  │                                                                              │   │
│  │ Preview: [OK] Found 7 matches in 3 files                                     │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ↑/↓: Navigate  |  Enter: Insert  |  Esc: Close                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**History Search Characteristics:**
- **Fuzzy Search:** Type to filter through conversation history
- **Preview:** Shows context for each match
- **Arrow Navigation:** Up/Down to select, Enter to insert into input
- **Real-time:** Updates as you type

---

## Visual Layout - Background Tasks Overlay (Ctrl+B)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Background Tasks                                                 [Esc: Close]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [⚙] npm install --save-dev @types/react                             Running  │   │
│  │    Started: 2 minutes ago  |  ETA: ~1 minute                                   │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [✓] npm test                                                            Done   │   │
│  │    Completed: 30 seconds ago  |  Exit: 0 (23 passed)                          │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [✓] git push origin feature/auth                                        Done   │   │
│  │    Completed: 2 minutes ago                                                  │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  Press Ctrl+B on a running command to foreground it                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Background Tasks Characteristics:**
- **Non-blocking:** Long-running tools can be backgrounded
- **Status Tracking:** Running, Done, Failed states
- **Notifications:** Toast notifications when tasks complete
- **Foreground:** Press Ctrl+B on a task to bring it back

---

## Screen Zones & Features

### Zone 1: Compact Status Bar (Top)
- **Purpose:** Minimal status information, always visible
- **Elements (left to right):**
  1. **Brand:** "FLOYD" (shortened for space)
  2. **Mode:** [YOLO] with color badge
  3. **Model:** glm-4-plus (or current model)
  4. **Connection:** Online/Offline/Connecting
  5. **Thinking:** ON/OFF (toggle with Tab)
  6. **Background Tasks:** Count (3 background tasks)
- **Behavior:** Hidden on narrow terminals (<80 cols)
- **Colors:** Mode-specific badges (YOLO=yellow, ASK=blue, PLAN=green)

### Zone 2: Main Content Area (Context-Dependent)
- **Default Mode:** Current exchange only (user message + response)
- **Transcript Mode (Ctrl+O):** Full conversation history
- **Search Mode (Ctrl+R):** Fuzzy search results
- **Other Overlays:** Replace main content as needed
- **Flow Direction:** Messages UP (newest at bottom) - mimics Claude Code

### Zone 3: Input Frame (Bottom)
- **Purpose:** User input area
- **Style:** Single-bordered box (cleaner than double)
- **Elements:**
  - `> ` prompt (always visible)
  - Current input (empty placeholder shown as `[_]`)
  - Right-aligned: Ctrl+O hint (indicates transcript available)
- **Hint Line:** Keyboard shortcuts below input
- **Validation:** 5000 char max, 200ms debounce

---

## Overlay System Architecture

### Overlay Modes

| Mode | Trigger | Purpose | Priority |
|------|---------|---------|----------|
| `none` | Default | Main interface | - |
| `transcript` | Ctrl+O | Full conversation history | P0 |
| `history` | Ctrl+R | Interactive history search | P1 |
| `background` | Ctrl+B | Background task management | P0 |
| `command` | Ctrl+P | Command palette | P0 |
| `help` | Ctrl+/ or ? | Help overlay | P0 |
| `config` | /config | Interactive settings | P1 |
| `context` | /context | Context visualizer | P1 |
| `editor` | Ctrl+G | External editor | P1 |

### Overlay Behavior Rules

1. **Single Active Overlay:** Only one overlay active at a time
2. **Esc Closes:** Pressing Esc closes the current overlay, returns to default
3. **Context-Aware:** Esc in default mode exits application
4. **Keyboard Routing:** When overlay is open, keys route to overlay first
5. **Overlay Stack:** Overlays don't nest - opening a new overlay replaces the current

---

## Mode System & Behavior

### Mode Badge Colors

| Mode | Color | Behavior |
|------|-------|----------|
| **YOLO** | Yellow (▀) | Auto-approve safe tools, confirm dangerous ones |
| **ASK** | Blue (▀) | Explain before dangerous tools, confirm all |
| **PLAN** | Green (▀) | Read-only - no writes, no git mutations |
| **AUTO** | Purple (▀) | Adaptive - single-file OK, multi-file ASK |
| **DIALOGUE** | Cyan (▀) | One-line responses, no tools |
| **FUCKIT** | Red (▀) | ALL permissions - no confirmations |

### Mode Switching
- **Shift+Tab:** Cycle through modes (YOLO → ASK → PLAN → AUTO → DIALOGUE → FUCKIT → YOLO)
- **Visual Feedback:** Full-screen mode transition banner with mode description
- **Confirmation:** Changes apply immediately after Shift+Tab

---

## Keyboard Shortcuts (Claude Code Aligned)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Q` | **EXIT** (double-press for safety) | Always |
| `Ctrl+C` | Exit (alternative) | Always |
| `Ctrl+O` | **Toggle Transcript Overlay** | Always |
| `Ctrl+G` | **Edit in External Editor** | Input focus |
| `Ctrl+R` | **History Search** | Always |
| `Ctrl+B` | **Background Tasks** | When tool running |
| `Ctrl+L` | Clear terminal | Always |
| `Tab` | **Toggle Thinking Mode** | Always |
| `Alt+P` | Switch model | Always |
| `Alt+T` | Toggle thinking (alternative) | Always |
| `Ctrl+P` | Command Palette | Always |
| `Ctrl+/` or `?` | Help Overlay | Always |
| `Shift+Tab` | Cycle Mode | Always |
| `Ctrl+K` | Session Switcher | Always |
| `Ctrl+V` | Voice Input (STT) | When available |
| `Ctrl+M` | Monitor Dashboard | Always |
| `Ctrl+T` | Toggle Agent Viz | Always |
| `Ctrl+Shift+P` | Prompt Library | Always |
| `Ctrl+Z` | Zen Mode | Always |
| `Esc` | Close overlay / Exit | Context-aware |
| `1,2,3,4` | Quick Actions | After response |

---

## Tool Execution Display

### Inline Tool Status Pattern

```
* Floyd: Let me search for authentication patterns...

  [running...] grep -r "jwt" src/
  [OK] Found 7 matches

* Floyd: Now reading the auth module...

  [running...] read_file src/auth/jwt.ts
  [OK] Read 142 lines

* Floyd: Here's what I found...
```

### Compact File Reference (Key to Uncrowded UX)

```
* Floyd: I've examined the authentication system:

  [OK] Read src/auth/jwt.ts (142 lines) [+]
  [OK] Read src/auth/types.ts (89 lines)

  The JWT implementation uses the `jsonwebtoken` library...
```

**Rules:**
- File reads show: `[OK] Read {path} ({lineCount} lines)`
- Full content NEVER dumped inline
- Use `+` indicator if content was truncated
- User can expand with: "Show me the full content of src/auth/jwt.ts"

---

## Streaming Response Display

### Token Streaming Pattern

```
* Floyd: Here's my implementation:

  ╭──────────────────────────────────────────────────────────────────╮
  │ import { sign } from 'jsonwebtoken';                              │
  │                                                                   │
  │ export async function generateToken(payload: any) {              │
  │   return sign(payload, process.env.JWT_SECRET);                    │
  │ }                                                                 │
  ╰──────────────────────────────────────────────────────────────────╯

  The token expires in 24 hours by default...
```

**Features:**
- Real-time token-by-token rendering
- Syntax highlighting in code blocks
- Streaming indicator (cursor/bold) during generation
- Auto-scroll to newest content
- "Streaming complete" message when done

### Thinking Spinner (When Reasoning Enabled)

```
* Floyd: <thinking>

</thinking>

I need to analyze the authentication patterns first...

  [●●●] Analyzing request patterns...
```

**Rules:**
- Thinking blocks hidden by default (collapsed)
- Show whimsical phrase during analysis: "Chasing the perfect implementation..."
- Spinner with activity: `[●●●]` or `[⚙]` when working
- Never show raw `<thinking>` content to user (anti-clutter)
- Tab key toggles thinking mode ON/OFF

---

## Command Palette (Ctrl+P)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ >                                                                    [Esc]  │
│                                                                        │
│  Search commands...                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  /provider          Set API provider                            │ │
│  │  /mode              Switch execution mode                       │ │
│  │  /session           Manage sessions                            │ │
│  │  /context           View context usage                         │ │
│  │  /config            Edit settings                              │ │
│  │  /export            Export transcript                           │ │
│  │  /clear             Clear conversation                         │ │
│  │  /help              Show all commands                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Recent:                                                               │
│  •  npm test                                                            │
│  •  git status                                                          │
│  •  src/auth/                                                           │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Fuzzy search through commands and files
- Arrow keys to navigate
- Enter to execute, Esc to close
- Shows recent inputs as suggestions
- File browsing integration

---

## Help Overlay (Ctrl+/)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  KEYBOARD SHORTCUTS                                    [Esc: Close]          │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Overlay Shortcuts (NEW)                                          │ │
│  │  ├─ Ctrl+O     Toggle transcript overlay (full history)         │ │
│  │  ├─ Ctrl+R     Interactive history search                       │ │
│  │  ├─ Ctrl+G     Edit prompt in external editor ($EDITOR)         │ │
│  │  ├─ Ctrl+B     Background task management                      │ │
│  │  ├─ Tab        Toggle thinking mode ON/OFF                     │ │
│  │  └─ Esc        Close overlay / Exit when in main view          │ │
│  │                                                                   │ │
│  │ Global Shortcuts                                                 │ │
│  │  ├─ Ctrl+Q     Exit application (double-press for safety)      │ │
│  │  ├─ Ctrl+/     Toggle this help overlay                         │ │
│  │  ├─ Ctrl+P     Open command palette                             │ │
│  │  ├─ Shift+Tab   Cycle execution mode                           │ │
│  │  ├─ Ctrl+L     Clear terminal                                   │ │
│  │  └─ Alt+P      Switch model                                     │ │
│  │                                                                   │ │
│  │ Navigation Shortcuts                                             │ │
│  │  ├─ PgUp/PgDn  Scroll through transcript                       │ │
│  │  ├─ Ctrl+K     Session switcher                                │ │
│  │  ├─ Ctrl+F     Search within transcript (in overlay)           │ │
│  │  └─ Ctrl+Z     Toggle Zen mode                                 │ │
│  │                                                                   │ │
│  │ Execution Modes:                                                    │
│  │  • YOLO     Auto-approve safe tools, confirm dangerous            │ │
│  │  • ASK      Confirm before any tool execution                     │ │
│  │  • PLAN     Read-only analysis mode                             │ │
│  │  • AUTO     Adaptive mode based on task complexity               │ │
│  │  • DIALOGUE  Quick chat mode, no tools                            │ │
│  │  • FUCKIT   All permissions, no confirmations                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Provider Configuration (First Run)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FLOYD GOD TIER - First Run Configuration                            [Ctrl+C]   │
│                                                                        │
│  Welcome! Floyd needs to know which AI provider to use.                     │
│                                                                        │
│  Select your provider:                                                       │
│                                                                        │
│  1. GLM (Zai) - Default RECOMMENDED                                    │
│     Endpoint: https://api.z.ai/api/coding/paas/v4                         │
│     Model: glm-4-plus                                                   │
│                                                                        │
│  2. OpenAI                                                          │
│     Endpoint: https://api.openai.com/v1                               │
│     Model: gpt-4o                                                     │
│                                                                        │
│  3. Anthropic                                                        │
│     Endpoint: https://api.anthropic.com/v1                            │
│     Model: claude-opus-4                                              │
│                                                                        │
│  4. DeepSeek                                                         │
│     Endpoint: https://api.deepseek.com/v1                             │
│     Model: deepseek-coder                                             │
│                                                                        │
│  5. xAI/GROK                                                        │
│     Endpoint: https://api.x.ai/v1                                   │
│     Model: grok-beta                                                  │
│                                                                        │
│  Or enter custom endpoint and model...                                     │
│  >>>                                                                    │
│                                                                        │
│  Enter your API key (will be saved to ~/.floyd/.env):                       │
│  >>>                                                                    │
│                                                                        │
│  [Loading provider capabilities...]                                          │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Permission Dialogs (ASK mode only)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  Permission Request                                             [y/N]      │
│                                                                        │
│  Floyd wants to: delete_file                                          │
│                                                                        │
│  Target: src/old-auth.ts                                                   │
│                                                                        │
│  This will permanently delete the file. This action cannot be undone.      │
│                                                                        │
│  Press y to approve, N to deny, Esc to cancel                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Only shows in ASK mode (other modes auto-approve)
- Shows tool name, target, and danger level
- Single key press (y/n) for efficiency
- Dangerous tools (delete, git_commit, etc.) always confirm
- Safe tools (read, grep) auto-approve even in ASK mode

---

## Quick Actions (After Response)

When Floyd completes a response, show quick actions:

```
* Floyd: Here's the JWT implementation...

  ╭──────────────────────────────────────────────────────────────────╮
  │ import { sign } from 'jsonwebtoken';                              │
  │                                                                   │
  │ export async function generateToken(payload: any) {              │
  │   return sign(payload, process.env.JWT_SECRET);                    │
  │ }                                                                 │
  ╰──────────────────────────────────────────────────────────────────╯

  [1:Apply]  [2:Explain]  [3:Diff]  [4:Undo]
```

**Quick Action Keys:**
- `1` or `a` - Apply the suggested changes
- `2` or `e` - Explain the response in more detail
- `3` or `d` - Show diff of proposed changes
- `4` or `u` - Undo the last exchange

---

## Status Messages (System Feedback)

```
[OK] Transcript exported to transcript-1706484291.md
[D] Opening diff preview... (Showing proposed changes)
[!] No recent response with changes to diff.
[←] Reverted to previous state. Last exchange removed.
[⚙] Background task started: npm install
[✓] Background task completed: npm test (exit 0)
```

**Message Types:**
- `[OK]` - Success (green)
- `[D]` - Debug/info (blue)
- `[!]` - Warning/error (red)
- `[←]` - State change (purple)
- `[⚠]` - Permission denied (yellow)
- `[⚙]` - Background task started
- `[✓]` - Background task completed

---

# PAGE 2: REFERENCE CODE SNIPPETS

This page contains the exact code patterns needed to implement the TUI as specified.

## File: src/store/tui-store.ts

```typescript
import { create } from 'zustand';

export type OverlayMode = 'none' | 'transcript' | 'history' | 'background' | 'command' | 'help' | 'config' | 'context' | 'editor';

export type FloydMode = 'yolo' | 'ask' | 'plan' | 'auto' | 'dialogue' | 'fuckit';

export type ConnectionStatus = 'online' | 'offline' | 'connecting';

interface BackgroundTask {
  id: string;
  command: string;
  status: 'running' | 'done' | 'failed';
  startTime: number;
  endTime?: number;
  exitCode?: number;
  output?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | React.ReactNode;
  timestamp: number;
  streaming?: boolean;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  error?: string;
}

interface TuiStore {
  // State
  mode: FloydMode;
  model: string;
  provider: string;
  connectionStatus: ConnectionStatus;
  isThinking: boolean;
  thinkingEnabled: boolean;
  whimsicalPhrase: string | null;
  messages: ChatMessage[];
  streamingContent: string;
  overlayMode: OverlayMode;
  backgroundTasks: BackgroundTask[];

  // Actions
  setMode: (mode: FloydMode) => void;
  cycleMode: () => void;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setThinking: (thinking: boolean, phrase?: string) => void;
  toggleThinking: () => void;
  addMessage: (message: ChatMessage) => void;
  setStreamingContent: (content: string) => void;
  setOverlayMode: (mode: OverlayMode) => void;
  closeOverlay: () => void;
  addBackgroundTask: (task: Omit<BackgroundTask, 'id'>) => string;
  updateBackgroundTask: (id: string, updates: Partial<BackgroundTask>) => void;
  sendMessage: (content: string) => void;
  undoLastExchange: () => void;
}

export const useTuiStore = create<TuiStore>((set, get) => ({
  // Initial state
  mode: 'yolo',
  model: 'glm-4-plus',
  provider: 'glm',
  connectionStatus: 'offline',
  isThinking: false,
  thinkingEnabled: true,
  whimsicalPhrase: null,
  messages: [],
  streamingContent: '',
  overlayMode: 'none',
  backgroundTasks: [],

  // Mode actions
  setMode: (mode) => set({ mode }),
  cycleMode: () => {
    const modes: FloydMode[] = ['yolo', 'ask', 'plan', 'auto', 'dialogue', 'fuckit'];
    const currentIdx = modes.indexOf(get().mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    set({ mode: nextMode });
  },

  // Model actions
  setModel: (model) => set({ model }),
  setProvider: (provider) => set({ provider }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Thinking actions
  setThinking: (isThinking, whimsicalPhrase) => set({ isThinking, whimsicalPhrase }),
  toggleThinking: () => set((state) => ({ thinkingEnabled: !state.thinkingEnabled })),

  // Message actions
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  setStreamingContent: (streamingContent) => set({ streamingContent }),

  // Overlay actions
  setOverlayMode: (overlayMode) => set({ overlayMode }),
  closeOverlay: () => set({ overlayMode: 'none' }),

  // Background tasks
  addBackgroundTask: (task) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      backgroundTasks: [...state.backgroundTasks, { ...task, id }],
    }));
    return id;
  },
  updateBackgroundTask: (id, updates) => set((state) => ({
    backgroundTasks: state.backgroundTasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),

  // High-level actions
  sendMessage: (content) => {
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isThinking: true,
    }));
    // Actual API call would be triggered by a separate effect
  },
  undoLastExchange: () => set((state) => ({
    messages: state.messages.slice(0, -2),
  })),
}));
```

---

## File: src/components/StatusBar.tsx

```tsx
import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';
import { MODE_COLORS } from '../theme/colors.js';

export function StatusBar() {
  const mode = useTuiStore((state) => state.mode);
  const model = useTuiStore((state) => state.model);
  const connectionStatus = useTuiStore((state) => state.connectionStatus);
  const isThinking = useTuiStore((state) => state.isThinking);
  const thinkingEnabled = useTuiStore((state) => state.thinkingEnabled);
  const backgroundTaskCount = useTuiStore((state) => state.backgroundTasks.filter(t => t.status === 'running').length);

  const connectionColor = connectionStatus === 'online'
    ? '#4CAF50'
    : connectionStatus === 'connecting'
    ? '#FFC107'
    : '#F44336';

  return (
    <Ink.Box
      borderStyle="single"
      borderColor="#303050"
      paddingX={1}
      paddingY={0}
      width="100%"
    >
      <Ink.Box width="100%" justifyContent="space-between" alignItems="center">
        {/* Left: Brand + Mode + Model */}
        <Ink.Box flexDirection="row" gap={1}>
          <Ink.Text bold color="#FF60FF">FLOYD</Ink.Text>
          <Ink.Text color={MODE_COLORS[mode]}>[{mode.toUpperCase()}]</Ink.Text>
          <Ink.Text dimColor>{model}</Ink.Text>
        </Ink.Box>

        {/* Right: Connection + Thinking + Background */}
        <Ink.Box flexDirection="row" gap={1}>
          <Ink.Text color={connectionColor}>{connectionStatus.toUpperCase()}</Ink.Text>
          <Ink.Text dimColor>|</Ink.Text>
          <Ink.Text color={thinkingEnabled ? '#4CAF50' : '#808080'}>
            Thinking: {thinkingEnabled ? 'ON' : 'OFF'}
          </Ink.Text>
          {backgroundTaskCount > 0 && (
            <>
              <Ink.Text dimColor>|</Ink.Text>
              <Ink.Text color="#FFC107">{backgroundTaskCount} background tasks</Ink.Text>
            </>
          )}
        </Ink.Box>
      </Ink.Box>
    </Ink.Box>
  );
}
```

---

## File: src/components/CurrentExchange.tsx

```tsx
import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';
import { roleColors } from '../theme/colors.js';

export function CurrentExchange() {
  const messages = useTuiStore((state) => state.messages);
  const streamingContent = useTuiStore((state) => state.streamingContent);
  const isThinking = useTuiStore((state) => state.isThinking);

  // Get last 2 messages (user + assistant) for current exchange
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  return (
    <Ink.Box flexDirection="column" flexGrow={1} paddingX={1}>
      {/* User's last message */}
      {lastUserMessage && (
        <Ink.Box marginBottom={1}>
          <Ink.Text bold color="#82AAFF">> You: </Ink.Text>
          <Ink.Text>{lastUserMessage.content}</Ink.Text>
        </Ink.Box>
      )}

      {/* Assistant's response (streaming) */}
      {(lastAssistantMessage || streamingContent || isThinking) && (
        <Ink.Box>
          <Ink.Text bold color="#FF60FF">* Floyd: </Ink.Text>
          {streamingContent ? (
            <Ink.Text>{streamingContent}</Ink.Text>
          ) : lastAssistantMessage ? (
            <Ink.Text>{lastAssistantMessage.content}</Ink.Text>
          ) : isThinking ? (
            <Ink.Text dimColor>Working...</Ink.Text>
          ) : null}
        </Ink.Box>
      )}
    </Ink.Box>
  );
}
```

---

## File: src/components/TranscriptOverlay.tsx

```tsx
import * as Ink from 'ink';
import { useTuiStore } from '../store/tui-store.js';
import { useInput } from 'ink';
import { roleColors } from '../theme/colors.js';

export function TranscriptOverlay() {
  const messages = useTuiStore((state) => state.messages);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay();
      return;
    }
    // Additional search/navigation handled here
  });

  const filteredMessages = searchQuery
    ? messages.filter(m =>
        String(m.content).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <Ink.Box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={1}
      paddingY={0}
      backgroundColor="#1a1a2e"
    >
      {/* Header */}
      <Ink.Box marginBottom={1} borderBottom={true} borderColor="#303050">
        <Ink.Text bold>TRANSCRIPT MODE</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      {/* Messages */}
      <Ink.Box flexDirection="column" flexGrow={1} overflowY="hidden" paddingY={1}>
        {filteredMessages.map((msg) => {
          const isUser = msg.role === 'user';
          const prefix = isUser ? '> You:' : '* Floyd:';
          const color = isUser ? '#82AAFF' : '#FF60FF';

          return (
            <Ink.Box key={msg.id} flexDirection="column" marginBottom={1}>
              <Ink.Text bold color={color}>{prefix}</Ink.Text>
              <Ink.Text marginLeft={2}>{msg.content}</Ink.Text>
            </Ink.Box>
          );
        })}
      </Ink.Box>

      {/* Footer */}
      <Ink.Box borderTop={true} borderColor="#303050" paddingY={1}>
        <Ink.Text dimColor>PgUp/PgDn: Scroll | Ctrl+F: Search | Esc: Close</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
```

---

## File: src/components/HistorySearchOverlay.tsx

```tsx
import * as Ink from 'ink';
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';
import { roleColors } from '../theme/colors.js';

export function HistorySearchOverlay() {
  const messages = useTuiStore((state) => state.messages);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredMessages = messages.filter(m =>
    String(m.content).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(filteredMessages.length - 1, i + 1));
    }
    if (key.return && filteredMessages[selectedIndex]) {
      // Insert selected message into input
      // TODO: Send to input
      closeOverlay();
    }
  });

  return (
    <Ink.Box
      position="absolute"
      top={5}
      left={10}
      width={80}
      height={20}
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={1}
      backgroundColor="#1a1a2e"
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Search History: {searchQuery}</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1}>
        {filteredMessages.map((msg, index) => {
          const isSelected = index === selectedIndex;
          const preview = String(msg.content).substring(0, 60) + '...';

          return (
            <Ink.Box
              key={msg.id}
              paddingY={0}
              backgroundColor={isSelected ? '#6B50FF40' : 'transparent'}
            >
              <Ink.Text
                bold={isSelected}
                color={isSelected ? '#6B50FF' : '#e0e0e0'}
              >
                [{index + 1}/{filteredMessages.length}] {msg.role === 'user' ? '> You:' : '* Floyd:'} {preview}
              </Ink.Text>
            </Ink.Box>
          );
        })}
      </Ink.Box>

      <Ink.Box marginTop={1}>
        <Ink.Text dimColor>↑/↓: Navigate | Enter: Insert | Esc: Close</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
```

---

## File: src/components/BackgroundTasksOverlay.tsx

```tsx
import * as Ink from 'ink';
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function BackgroundTasksOverlay() {
  const backgroundTasks = useTuiStore((state) => state.backgroundTasks);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay();
    }
  });

  const getIcon = (status: string) => {
    switch (status) {
      case 'running': return '[⚙]';
      case 'done': return '[✓]';
      case 'failed': return '[✗]';
      default: return '[?]';
    }
  };

  const getStatusText = (task: any) => {
    if (task.status === 'running') {
      const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
      return `Running | Elapsed: ${elapsed}s`;
    }
    if (task.status === 'done') {
      return `Done | Exit: ${task.exitCode}`;
    }
    return 'Failed';
  };

  return (
    <Ink.Box
      position="absolute"
      top={5}
      left={10}
      width={80}
      height={20}
      flexDirection="column"
      borderStyle="double"
      borderColor="#FFC107"
      paddingX={1}
      backgroundColor="#1a1a2e"
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Background Tasks</Ink.Text>
        <Ink.Text dimColor> [Esc: Close]</Ink.Text>
      </Ink.Box>

      <Ink.Box flexDirection="column" flexGrow={1}>
        {backgroundTasks.length === 0 ? (
          <Ink.Text dimColor>No background tasks</Ink.Text>
        ) : (
          backgroundTasks.map((task) => (
            <Ink.Box
              key={task.id}
              flexDirection="column"
              marginBottom={1}
              paddingX={1}
              borderStyle="single"
              borderColor="#303050"
            >
              <Ink.Box flexDirection="row" justifyContent="space-between">
                <Ink.Text>
                  {getIcon(task.status)} {task.command}
                </Ink.Text>
                <Ink.Text
                  color={
                    task.status === 'running' ? '#FFC107' :
                    task.status === 'done' ? '#4CAF50' :
                    '#F44336'
                  }
                >
                  {task.status === 'running' ? 'Running' :
                   task.status === 'done' ? 'Done' : 'Failed'}
                </Ink.Text>
              </Ink.Box>
              <Ink.Text dimColor>{getStatusText(task)}</Ink.Text>
            </Ink.Box>
          ))
        )}
      </Ink.Box>

      <Ink.Box marginTop={1}>
        <Ink.Text dimColor>Ctrl+B on a running task to foreground it</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
```

---

## File: src/components/InputArea.tsx

```tsx
import * as Ink from 'ink';
import TextInput from 'ink-text-input';
import { useTuiStore } from '../store/tui-store.js';

const MAX_INPUT_LENGTH = 5000;
const SUBMIT_DEBOUNCE_MS = 200;

export function InputArea() {
  const [input, setInput] = React.useState('');
  const [lastSubmitTime, setLastSubmitTime] = React.useState(0);
  const isThinking = useTuiStore((state) => state.isThinking);
  const overlayMode = useTuiStore((state) => state.overlayMode);
  const setOverlayMode = useTuiStore((state) => state.setOverlayMode);
  const closeOverlay = useTuiStore((state) => state.closeOverlay);
  const toggleThinking = useTuiStore((state) => state.toggleThinking);
  const cycleMode = useTuiStore((state) => state.cycleMode);
  const messages = useTuiStore((state) => state.sendMessage);

  const handleSubmit = (value: string) => {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_DEBOUNCE_MS) return;
    if (!value.trim()) return;
    if (value.length > MAX_INPUT_LENGTH) return;
    if (isThinking) return;

    setLastSubmitTime(now);
    setInput('');
    messages(value);
  };

  // Handle keyboard shortcuts
  Ink.useInput((inputChar, key) => {
    // Don't handle if input has focus and it's a regular character
    if (inputChar && !key.ctrl && !key.meta && overlayMode === 'none') {
      return; // Let TextInput handle it
    }

    // Esc - close overlay or exit
    if (key.escape) {
      if (overlayMode !== 'none') {
        closeOverlay();
      } else {
        process.exit(0);
      }
      return;
    }

    // Tab - toggle thinking mode
    if (key.tab && !key.shift) {
      toggleThinking();
      return;
    }

    // Shift+Tab - cycle mode
    if (key.tab && key.shift) {
      cycleMode();
      return;
    }

    // Ctrl+O - transcript overlay
    if (key.ctrl && inputChar === 'o') {
      setOverlayMode(overlayMode === 'transcript' ? 'none' : 'transcript');
      return;
    }

    // Ctrl+R - history search
    if (key.ctrl && inputChar === 'r') {
      setOverlayMode(overlayMode === 'history' ? 'none' : 'history');
      return;
    }

    // Ctrl+B - background tasks
    if (key.ctrl && inputChar === 'b') {
      setOverlayMode(overlayMode === 'background' ? 'none' : 'background');
      return;
    }

    // Ctrl+P - command palette
    if (key.ctrl && inputChar === 'p') {
      setOverlayMode(overlayMode === 'command' ? 'none' : 'command');
      return;
    }

    // Ctrl+/ - help
    if (key.ctrl && inputChar === '/') {
      setOverlayMode(overlayMode === 'help' ? 'none' : 'help');
      return;
    }
  }, [overlayMode]);

  return (
    <Ink.Box flexDirection="column" width="100%" marginTop={1} paddingX={0}>
      {/* Input box */}
      <Ink.Box
        borderStyle="single"
        borderColor="#6B50FF"
        paddingX={1}
        paddingY={1}
        width="100%"
      >
        <Ink.Text color="#FFC107">{'> '} </Ink.Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={isThinking ? 'Please wait...' : ''}
        />
        {overlayMode === 'none' && (
          <Ink.Text dimColor> Ctrl+O</Ink.Text>
        )}
      </Ink.Box>

      {/* Hint footer */}
      <Ink.Box marginTop={0} flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Ink.Text dimColor color="#808080">
          Ctrl+P:Commands Ctrl+/:Help Tab:Thinking Shift+Tab:Mode
        </Ink.Text>
        <Ink.Text dimColor color="#808080">
          Ctrl+Q:Exit
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
```

---

## File: src/theme/colors.ts

```typescript
export const floydTheme = {
  colors: {
    bg: '#1a1a2e',
    fgBase: '#e0e0e0',
    fgMuted: '#808080',
    border: '#303050',
    borderFocus: '#6B50FF',
    selection: '#6B50FF40',

    // Role colors
    userLabel: '#82AAFF',
    assistantLabel: '#FF60FF',
    systemLabel: '#FFA500',
    toolLabel: '#00BCD4',

    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    working: '#FFC107',
    offline: '#9E9E9E',
    ready: '#8BC34A',

    // Accent colors
    accent: '#6B50FF',
    accentSecondary: '#FF60FF',
    accentTertiary: '#B85CFF',

    // Input colors
    inputPrompt: '#FFC107',
    hint: '#808080',
    thinking: '#FF60FF',
  },
};

export const roleColors = {
  headerTitle: '#FF60FF',
  headerStatus: '#B85CFF',
  userLabel: '#82AAFF',
  assistantLabel: '#FF60FF',
  systemLabel: '#FFA500',
  toolLabel: '#00BCD4',
  thinking: '#FF60FF',
  muted: '#808080',
};

export const MODE_COLORS = {
  yolo: '#FFC107',
  ask: '#2196F3',
  plan: '#4CAF50',
  auto: '#9C27B0',
  dialogue: '#00BCD4',
  fuckit: '#F44336',
};
```

---

## Integration: Main App Layout

```tsx
import * as Ink from 'ink';
import { render } from 'ink';
import { StatusBar } from './components/StatusBar.js';
import { CurrentExchange } from './components/CurrentExchange.js';
import { InputArea } from './components/InputArea.js';
import { TranscriptOverlay } from './components/TranscriptOverlay.js';
import { HistorySearchOverlay } from './components/HistorySearchOverlay.js';
import { BackgroundTasksOverlay } from './components/BackgroundTasksOverlay.js';
import { CommandPalette } from './components/CommandPalette.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { useTuiStore } from './store/tui-store.js';

function FloydTUI() {
  const overlayMode = useTuiStore((state) => state.overlayMode);

  return (
    <Ink.Box flexDirection="column" paddingY={0} height="100%">
      {/* Status bar - always visible */}
      <StatusBar />

      {/* Main content area - context dependent */}
      {overlayMode === 'none' && <CurrentExchange />}

      {/* Overlays */}
      {overlayMode === 'transcript' && <TranscriptOverlay />}
      {overlayMode === 'history' && <HistorySearchOverlay />}
      {overlayMode === 'background' && <BackgroundTasksOverlay />}
      {overlayMode === 'command' && <CommandPalette />}
      {overlayMode === 'help' && <HelpOverlay />}

      {/* Input area - always visible */}
      <InputArea />
    </Ink.Box>
  );
}

// Entry point for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  render(<FloydTUI />);
}

export default FloydTUI;
```

---

## Key Dependencies (package.json)

**VERIFIED 2026-01-29:** LOCKED VERSIONS (no ~ or ^)

```json
{
  "dependencies": {
    "ink": "6.6.0",
    "@inkjs/ui": "2.0.0",
    "ink-text-input": "6.0.0",
    "react": "19.1.0",
    "zustand": "5.0.2",
    "chalk": "5.4.1"
  },
  "devDependencies": {
    "@types/node": "22.10.5",
    "@types/react": "19.1.5",
    "tsx": "4.19.2",
    "typescript": "5.7.3"
  }
}
```

**CRITICAL CONFIGURATION (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react",
    "lib": ["ES2022", "DOM"]
  }
}
```

**CRITICAL - Namespace Import Pattern:**
ALL Ink components must use namespace imports to avoid DOM type collisions:
```tsx
// ✅ CORRECT
import * as Ink from 'ink';
<Ink.Text>Hello</Ink.Text>

// ❌ WRONG - Collides with DOM Text interface
import { Text } from 'ink';
<Text>Hello</Text>
```

---

## Summary: What This TUI Provides

1. **Minimal Default Interface** - Only current exchange visible, history behind overlay
2. **Overlay Architecture** - All advanced features behind triggered sub-screens
3. **Provider-Agnostic** - Accepts any API key, configures on first run
4. **Mode System** - YOLO/ASK/PLAN/AUTO/DIALOGUE/FUCKIT with visual indicators
5. **Inline Tool Status** - No separate panels, status inline with messages
6. **Background Tasks** - Non-blocking tool execution with Ctrl+B
7. **History Search** - Interactive fuzzy search with Ctrl+R
8. **Transcript Overlay** - Full conversation history with Ctrl+O
9. **Keyboard First** - All actions have shortcuts, no mouse needed
10. **God Tier Agent** - Full Floyd capabilities with lean core prompts

---

**End of TUI Mockup Document v2.0**

**For implementation guidance, see:**
- `/TUI REBUILD/CLAUDE_CODE_ALIGNMENT_ANALYSIS.md` - Claude Code alignment details
- `/TUI REBUILD/CHANGELOG.md` - Build progress tracking
