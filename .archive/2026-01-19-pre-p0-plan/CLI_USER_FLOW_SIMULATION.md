# Actual User Flow Simulation - Floyd CLI

**Date:** 2026-01-18  
**Status:** READY FOR TESTING - All fixes applied, needs real runtime verification

---

## What Was Fixed

1. **? Hotkey race condition** - Added focus tracking to prevent help overlay from triggering while typing questions
2. **Double text output** - Removed redundant `setLocalMessages` updates, using Zustand store as single source of truth
3. **Text contrast** - Increased subtle/secondary text colors by 10% for better readability
4. **Input area width** - Reduced side panel widths (18→16, 20→18) to give more space to input
5. **Text overflow** - Added `wrap="wrap"` or `wrap="truncate"` to all Text components displaying dynamic content
6. **Streaming speed** - Increased token rate from 25/sec to 75/sec for faster, more responsive display
7. **Streaming location** - Improved framing and alignment of streaming content with cursor indicator
8. **Help overlay commands** - Wired all keyboard shortcuts with action callbacks
9. **YOLO mode toggle** - Added `safetyMode` to Zustand store, Ctrl+Y keyboard shortcut, and toggle functionality
10. **Error boundary** - Created ErrorBoundary component wrapping MainLayout to prevent full app crashes
11. **Built-in MCP servers** - Added `startBuiltinServers()` call on initialization
12. **Dock control** - Integrated dock command parsing and execution (e.g., `:dock btop`)
13. **MCP config** - Created `.floyd/mcp.json` from example template
14. **Agent engine consolidation** - Removed duplicate `orchestrator.ts`, fixed imports

---

## Actual User Steps (What You Experience)

### Step 1: Navigate to project directory
**Command:** `cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli`  
**What happens:** Terminal changes directory  
**What you see:** Prompt shows new directory

### Step 2: Build the project
**Command:** `npm run build`  
**What should happen:** TypeScript compiles successfully  
**What you see:** `tsc` output, no errors  
**What might be broken:** Type errors, missing dependencies

### Step 3: Set API key (if not already set)
**Command:** `export GLM_API_KEY=your-key-here` (or set in `.env`)  
**What happens:** Environment variable is set  
**What you see:** No output (normal)

### Step 4: Launch the CLI
**Command:** `npm start` or `node dist/cli.js`  
**What should happen:** CLI application starts, Ink UI initializes  
**What you see:** Terminal clears, 3-column layout appears (SESSION | TRANSCRIPT | CONTEXT)  
**What might be broken:** Blank screen, error messages, app crashes immediately

### Step 5: See initial greeting
**What should happen:** AgentEngine initializes, greeting message appears  
**What you see:** "Hello! I am Floyd (GLM-4 Powered). How can I help you today?" in transcript panel  
**What might be broken:** No greeting, error message instead, initialization hangs

### Step 6: See session panel (left)
**What should happen:** SessionPanel renders with repo info, Git status, tool toggles  
**What you see:** 
- Repo name and tech stack
- Git branch and status
- Tool toggle states
- YOLO button (showing current safety mode)
**What might be broken:** Panel empty, Git info missing, layout broken

### Step 7: See input area (bottom)
**What should happen:** InputArea component renders with prompt and hint  
**What you see:** 
- `❯` prompt
- "Type a message..." placeholder
- Hint text: "Ctrl+P: Commands • Ctrl+/: Help • Esc: Exit"
**What might be broken:** Input not visible, too narrow, hint text missing

### Step 8: Type a question (test ? hotkey fix)
**Action:** Type "What?" quickly  
**What should happen:** Text appears in input, help overlay does NOT trigger  
**What you see:** "What?" appears in input field  
**What might be broken:** Help overlay triggers when typing "?"

### Step 9: Press ? when input is empty
**Action:** Clear input, press `?`  
**What should happen:** Help overlay appears  
**What you see:** Keyboard shortcuts displayed in overlay  
**What might be broken:** Overlay doesn't appear, wrong shortcuts shown

### Step 10: Test Ctrl+/ for help
**Action:** Press `Ctrl+/`  
**What should happen:** Help overlay toggles  
**What you see:** Overlay appears/disappears  
**What might be broken:** Nothing happens, overlay doesn't toggle

### Step 11: Test Ctrl+P for command palette
**Action:** Press `Ctrl+P`  
**What should happen:** Command palette opens with fuzzy search  
**What you see:** List of commands, search input  
**What might be broken:** Palette doesn't open, no commands listed

### Step 12: Test Ctrl+Y for YOLO toggle
**Action:** Press `Ctrl+Y`  
**What should happen:** Safety mode toggles between 'safe' and 'yolo'  
**What you see:** YOLO button in SessionPanel updates (YOLO ON/OFF)  
**What might be broken:** Nothing happens, state doesn't persist

### Step 13: Send a message
**Action:** Type "Hello" and press Enter  
**What should happen:** 
- Message appears in transcript
- Agent starts thinking/streaming
- Response streams in at 75 tokens/sec
- No duplicate text
**What you see:** 
- Your message: "Hello"
- Assistant response streaming with cursor indicator
**What might be broken:** 
- Double text output
- Streaming too slow/fast
- Text overflows container
- No response

### Step 14: Test dock command
**Action:** Type `:dock btop` and press Enter  
**What should happen:** Dock command executes in TMUX session 'floyd'  
**What you see:** System message: "⚓ Dock command executed: btop"  
**What might be broken:** 
- Command not recognized
- TMUX session doesn't exist (graceful error)
- No feedback message

### Step 15: Test text contrast
**What should happen:** All text is readable with 10% increased contrast  
**What you see:** Subtle/secondary text is lighter (#706F7B, #959AA2)  
**What might be broken:** Text still too dark, contrast not improved

---

## Configuration Guide

### MCP Server Configuration

**Location:** `INK/floyd-cli/.floyd/mcp.json`

**How to configure:**
1. File already exists (copied from example)
2. Edit `.floyd/mcp.json` to enable desired servers
3. Set `enabled: true` for servers you want
4. Add required environment variables (API keys, tokens)
5. Restart CLI for changes to take effect

**Example:**
```json
{
  "version": "1.0",
  "servers": [
    {
      "name": "filesystem",
      "enabled": true,
      "transport": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/allowed"]
      }
    }
  ]
}
```

### Built-in MCP Servers

These start automatically on CLI launch:
- **patch** - File patching operations
- **runner** - Command execution
- **git** - Git operations
- **cache** - Caching utilities

No configuration needed - they're built into the CLI.

### Dock Commands

**Prerequisites:** TMUX session named 'floyd' must exist

**Usage:**
- `:dock btop` - Launch btop in monitor pane
- `:dock lazygit` - Launch lazygit
- `:btop` - Shorthand for btop

**Setup:**
1. Create TMUX session: `tmux new-session -d -s floyd`
2. CLI will execute dock commands in this session
3. If session doesn't exist, graceful error message shown

---

## Known Issues Fixed

1. ✅ ? hotkey race condition (focus tracking)
2. ✅ Double text output (single source of truth)
3. ✅ Text contrast (10% increase)
4. ✅ Input area width (reduced side panels)
5. ✅ Text overflow (wrap props)
6. ✅ Streaming speed (75 tokens/sec)
7. ✅ Streaming location (improved framing)
8. ✅ Help overlay commands (wired actions)
9. ✅ YOLO toggle (Ctrl+Y, state persistence)
10. ✅ Error boundary (crash prevention)
11. ✅ Built-in MCP servers (auto-start)
12. ✅ Dock control (command parsing)
13. ✅ MCP config (file created)
14. ✅ Agent engine (consolidated)

---

## Next: Real Runtime Testing Required

All fixes are in place. Now we need to verify:

1. **Build succeeds** - `npm run build` completes without errors
2. **CLI launches** - `npm start` shows UI without crashing
3. **Initialization works** - Greeting appears, panels render
4. **Hotkeys work** - ?, Ctrl+/, Ctrl+P, Ctrl+Y all function
5. **Input works** - Can type, submit messages
6. **Streaming works** - Responses stream at correct speed, no duplicates
7. **Dock works** - Commands execute (or show graceful error)
8. **Text rendering** - No overflow, proper contrast
9. **Error handling** - Errors caught by boundary, don't crash app
10. **State persistence** - YOLO mode, messages persist

The following test will verify all 15 effects in sequence.
