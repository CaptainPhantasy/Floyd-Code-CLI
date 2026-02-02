# CLI First-Test Simulation - 15 Effects Verification

**Date:** 2026-01-18  
**Status:** READY FOR EXECUTION  
**Platform:** macOS (darwin 25.3.0), Node.js v24.10.0

---

## Prerequisites

1. ✅ Build completed successfully (`npm run build`)
2. ✅ MCP config file exists (`.floyd/mcp.json`)
3. ⚠️ API key set (`GLM_API_KEY` environment variable)
4. ⚠️ Interactive terminal required (Ink needs raw mode stdin)

---

## First-Test Effects (1-15)

### Effect #1: Build Completes Successfully
**Trigger:** `cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli && npm run build`  
**Expected:** TypeScript compiles without errors  
**Receipt:** `tsc` exits with code 0, `dist/` directory populated  
**Status:** ✅ VERIFIED

### Effect #2: CLI Entry Point Exists
**Trigger:** `ls -la dist/cli.js`  
**Expected:** File exists and is executable  
**Receipt:** File listing shows `dist/cli.js`  
**Status:** ✅ VERIFIED

### Effect #3: Environment Variables Loaded
**Trigger:** `export GLM_API_KEY=test-key && npm start` (first few lines)  
**Expected:** dotenv loads `.env` file, no errors  
**Receipt:** `[dotenv@17.2.3] injecting env (X) from .env` message appears  
**Status:** ⚠️ REQUIRES INTERACTIVE TERMINAL

### Effect #4: Application Initializes
**Trigger:** `npm start` in interactive terminal  
**Expected:** React/Ink app mounts, no immediate crashes  
**Receipt:** Terminal clears, UI components render  
**Status:** ⚠️ REQUIRES INTERACTIVE TERMINAL

### Effect #5: MCP Client Manager Created
**Trigger:** App initialization (useEffect in app.tsx)  
**Expected:** `new MCPClientManager()` succeeds  
**Receipt:** No error in console, initialization continues  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #6: Built-in MCP Servers Start
**Trigger:** `await localMcpManager.startBuiltinServers()`  
**Expected:** Four servers (patch, runner, git, cache) start via `npx tsx`  
**Receipt:** Console logs: "Started built-in MCP server: patch" (etc.)  
**Status:** ⚠️ REQUIRES RUNTIME TEST  
**Known Issue:** Fixed path resolution to use `tsx` and point to source `.ts` files

### Effect #7: External MCP Servers Connect
**Trigger:** `await mcpManager.connectExternalServers(process.cwd())`  
**Expected:** Reads `.floyd/mcp.json`, connects to enabled servers  
**Receipt:** Console logs connection status or "No external servers configured"  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #8: Agent Engine Initializes
**Trigger:** `new AgentEngine(...)` with MCP manager, session manager, etc.  
**Expected:** Engine created, `initSession()` called  
**Receipt:** No errors, agent status becomes 'idle'  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #9: Zustand Store Initializes
**Trigger:** `useFloydStore.getState().initSession(...)`  
**Expected:** Store session initialized, messages array empty  
**Receipt:** Store state accessible, no errors  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #10: Initial Greeting Appears
**Trigger:** `addMessage(greeting)` in initialization  
**Expected:** "Hello! I am Floyd (GLM-4 Powered). How can I help you today?" in transcript  
**Receipt:** Message visible in TranscriptPanel  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #11: UI Layout Renders
**Trigger:** `<MainLayout ... />` renders  
**Expected:** 3-column layout (SESSION | TRANSCRIPT | CONTEXT) visible  
**Receipt:** Panels render with borders, content visible  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #12: Input Area Visible
**Trigger:** `<InputArea />` renders  
**Expected:** Input box with `❯` prompt and placeholder text  
**Receipt:** Input field visible at bottom, hint text shows shortcuts  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #13: Session Panel Shows Info
**Trigger:** `<SessionPanel />` renders  
**Expected:** Repo name, Git status, tool toggles, YOLO button visible  
**Receipt:** Left panel shows project information  
**Status:** ⚠️ REQUIRES RUNTIME TEST

### Effect #14: Keyboard Input Works
**Trigger:** Type characters in terminal  
**Expected:** Text appears in input field  
**Receipt:** Characters visible as typed  
**Status:** ⚠️ REQUIRES INTERACTIVE TERMINAL

### Effect #15: Help Overlay Toggles
**Trigger:** Press `?` when input is empty  
**Expected:** Help overlay appears/disappears  
**Receipt:** Overlay shows keyboard shortcuts, toggles on `?` and `Ctrl+/`  
**Status:** ⚠️ REQUIRES INTERACTIVE TERMINAL

---

## Fixes Applied

### MCP Server Path Resolution Fix
**File:** `src/mcp/client-manager.ts`  
**Change:** 
- Switched from `ts-node/esm` to `tsx` for better ESM support
- Fixed path resolution to point to source `.ts` files (works in both dev and production)
- Removed duplicate process creation, use `connectStdio` directly

**Code:**
```typescript
// Before: Used ts-node/esm with wrong paths
const process = execa('node', ['--loader', 'ts-node/esm', ...args]);

// After: Use tsx with correct source paths
await this.connectStdio(`builtin-${serverName}`, 'npx', ['tsx', ...args]);
```

**Receipt:** Build succeeds, no TypeScript errors

---

## Known Risks

1. **Interactive Terminal Required** - Ink apps cannot be tested via pipes/redirects. Must run in actual terminal.
2. **MCP Server Dependencies** - Built-in servers require `tsx` to be available (in devDependencies, should work via `npx`)
3. **TMUX Session for Dock** - Dock commands require `tmux` session named 'floyd' to exist
4. **API Key Required** - Agent won't function without valid `GLM_API_KEY`

---

## Next Actions for User

1. **Open Interactive Terminal** - Run `npm start` directly (not piped)
2. **Verify UI Renders** - Check that 3-column layout appears
3. **Test Hotkeys** - Try `?`, `Ctrl+/`, `Ctrl+P`, `Ctrl+Y`
4. **Send Test Message** - Type "Hello" and verify response streams
5. **Check Console Logs** - Look for MCP server startup messages
6. **Test Dock Command** - Type `:dock btop` (if TMUX session exists)

---

## Execution Command

```bash
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
export GLM_API_KEY=your-key-here  # If not in .env
npm start
```

**Note:** This must run in an interactive terminal. Cannot be tested via automation due to Ink's raw mode requirement.
