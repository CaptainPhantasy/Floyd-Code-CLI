# FLOYD Task Queue for Next Orchestrator

**Created:** 2026-01-17
**Context:** Phase 1A (Legacy Code Removal) complete. Ready for next phase work.
**Current Branch:** fix/test-build-errors

---

## 🔥 High Priority Tasks

### Task 1: Complete Phase 1B - Enhanced Tool Registry
**File:** `.floyd/branch.md`
**Status:** PENDING
**Description:** The dynamic tool registry exists but lacks metadata and configuration-based loading.

**Sub-tasks:**
1. Create `tui/floydtools/metadata.go` with `ToolMetadata` struct
2. Add `ToolWithMetadata` struct combining Tool + metadata
3. Implement `RegisterWithMetadata()` in registry
4. Add tool categories: "filesystem", "search", "system", "cache"
5. Create `tui/floydtools/config.go` for JSON-based tool definitions
6. Implement watch mode for runtime tool detection

**Files to modify/create:**
- `tui/floydtools/metadata.go` (NEW)
- `tui/floydtools/config.go` (NEW)
- `tui/floydtools/registry.go` (MODIFY - add metadata support)

**Verification:** `go test ./tui/floydtools/... && go build ./...`

---

### Task 2: Extract Shared floyd-agent-core Package
**File:** `FloydDesktop/README.md` references this
**Status:** PENDING
**Description:** Extract the shared AgentEngine into a standalone npm package that both CLI and Desktop can import.

**Sub-tasks:**
1. Create `/Volumes/Storage/FLOYD_CLI/packages/floyd-agent-core/`
2. Copy `INK/floyd-cli/src/agent/` → `packages/floyd-agent-core/src/agent/`
3. Copy `INK/floyd-cli/src/mcp/` → `packages/floyd-agent-core/src/mcp/`
4. Copy `INK/floyd-cli/src/store/` → `packages/floyd-agent-core/src/store/`
5. Copy `INK/floyd-cli/src/permissions/` → `packages/floyd-agent-core/src/permissions/`
6. Copy `INK/floyd-cli/src/utils/` → `packages/floyd-agent-core/src/utils/`
7. Create `packages/floyd-agent-core/package.json` with proper exports
8. Create `packages/floyd-agent-core/tsconfig.json`
9. Update `INK/floyd-cli/package.json` to import from `floyd-agent-core`
10. Update `FloydDesktop/package.json` to import from `floyd-agent-core`

**Files to create:**
- `packages/floyd-agent-core/package.json`
- `packages/floyd-agent-core/tsconfig.json`
- `packages/floyd-agent-core/src/index.ts`

**Verification:** `npm run build` in both CLI and Desktop should succeed

---

### Task 3: Implement FloydDesktop IPC Bridge
**File:** `FloydDesktop/IMPLEMENTATION.md`
**Status:** PENDING
**Description:** Create the IPC bridge between Electron renderer and AgentEngine.

**Sub-tasks:**
1. Create `FloydDesktop/electron/ipc/agent-bridge.ts`
2. Implement IPC handlers:
   - `agent:sendMessage` (streaming)
   - `agent:listTools`
   - `agent:getHistory`
   - `agent:loadSession`
   - `agent:newSession`
3. Create preload script `FloydDesktop/electron/preload.ts`
4. Expose `window.floydAPI` to renderer

**Files to create:**
- `FloydDesktop/electron/ipc/agent-bridge.ts`
- `FloydDesktop/electron/preload.ts`
- `FloydDesktop/electron/ipc/index.ts`

**Verification:** Manual test - send message from renderer to agent

---

### Task 4: Build FloydDesktop React UI Components
**File:** `FloydDesktop/IMPLEMENTATION.md`
**Status:** PENDING
**Description:** Create React components for the Desktop app interface.

**Sub-tasks:**
1. Create `FloydDesktop/src/components/ChatPanel.tsx`
2. Create `FloydDesktop/src/components/Sidebar.tsx`
3. Create `FloydDesktop/src/components/ToolCallCard.tsx`
4. Create `FloydDesktop/src/components/Settings.tsx`
5. Create `FloydDesktop/src/hooks/useAgent.ts`
6. Create `FloydDesktop/src/App.tsx` main layout

**Files to create:**
- `FloydDesktop/src/components/*.tsx` (5 components)
- `FloydDesktop/src/hooks/useAgent.ts`
- `FloydDesktop/src/App.tsx`

**Verification:** `npm run dev` - UI renders without errors

---

## 🟡 Medium Priority Tasks

### Task 5: Phase 2 - Sub-Agent Spawning Enhancement
**File:** `docs/path-forward.md`
**Status:** PENDING
**Description:** The orchestrator exists but needs enhanced sub-agent capabilities.

**Sub-tasks:**
1. Review `agent/orchestrator.go` implementation
2. Add `spawn(agentType, task, context)` method
3. Implement specialized agent types: planner, coder, tester, search
4. Add result collection from sub-agents
5. Create `/spawn` CLI command for manual spawning
6. Update docs with spawn usage examples

**Files to modify:**
- `agent/orchestrator.go` (ENHANCE)
- New: `agent/subagent.go` (possibly)

**Verification:** Test spawning multiple agents in parallel

---

### Task 6: MCP Tool Schema Enhancement
**File:** `.floyd/ULTRATHINK_ANALYSIS.md`
**Status:** PENDING
**Description:** MCP tools lack rich metadata for auto-discovery and categorization.

**Sub-tasks:**
1. Add `ToolMetadata` interface to MCP types
2. Implement `ToolRegistry.discover()` for auto-discovery
3. Add `ToolRegistry.watchForChanges()` for hot-reload
4. Implement tool categorization in MCP client manager
5. Add tool health checking mechanism
6. Create tool versioning support

**Files to modify:**
- `INK/floyd-cli/src/mcp/client-manager.ts`
- New: `INK/floyd-cli/src/mcp/registry.ts`

**Verification:** Tools auto-discover on server connect

---

### Task 7: SUPERCACHE Implementation (Phase 4)
**File:** `docs/path-forward.md`
**Status:** PENDING
**Description:** Implement the 3-tier SUPERCACHE system.

**Sub-tasks:**
1. Create `.floyd/.cache/` directory structure:
   - `reasoning/active/`, `reasoning/archive/`
   - `project/phase_summaries/`, `project/context/`
   - `vault/patterns/`, `vault/index/`
2. Implement `CacheManager` class with TTL management
3. Add `cache_store`, `cache_retrieve`, `cache_vault_search` tools
4. Create cache pruning logic for expired entries
5. Implement cache search functionality

**Files to create:**
- `INK/floyd-cli/src/cache/manager.ts`
- `INK/floyd-cli/src/cache/tiers.ts`
- Update tools registration

**Verification:** Cache persists across sessions, TTL works

---

### Task 8: FloydChrome Extension Tool Templates
**File:** `FloydChromeBuild/floydchrome/`
**Status:** PENDING
**Description:** Chrome tool templates are JSON snippets - make them callable.

**Sub-tasks:**
1. Review existing tools in `FloydChromeBuild/floydchrome/tools/`
2. Integrate tools with MCP server
3. Test each tool: navigate, read_page, click, type, get_tabs, etc.
4. Add error handling and logging
5. Document tool usage in README

**Files to modify:**
- `FloydChromeBuild/floydchrome/tools/*.js`

**Verification:** Each tool callable from Floyd agent

---

## 🟢 Low Priority Tasks

### Task 9: Update Documentation for Phase 1B Completion
**File:** `AGENT_REPORT.md`, `docs/path-forward.md`
**Status:** PENDING
**Description:** Update docs after Phase 1B is complete.

**Sub-tasks:**
1. Mark Phase 1B complete in `AGENT_REPORT.md`
2. Update `docs/path-forward.md` with Phase 2 planning
3. Add tool metadata examples to docs
4. Update architecture diagrams if needed

---

### Task 10: Add Unit Tests for Tool Registry
**File:** `tui/floydtools/`
**Status:** PENDING
**Description:** The registry has no tests.

**Sub-tasks:**
1. Create `tui/floydtools/registry_test.go`
2. Test concurrent registration
3. Test tool retrieval
4. Test metadata handling
5. Test category listing

**Files to create:**
- `tui/floydtools/registry_test.go`

**Verification:** `go test ./tui/floydtools/...` passes

---

### Task 11: Create FloydDesktop Installer
**File:** `FloydDesktop/`
**Status:** PENDING
**Description:** Create installers for macOS, Windows, Linux.

**Sub-tasks:**
1. Configure `electron-builder` in `package.json`
2. Create app icons
3. Test build on macOS
4. Create DMG/EXE/deb packages
5. Add release notes

**Files to modify:**
- `FloydDesktop/package.json`
- `FloydDesktop/electron-builder.yml`

---

### Task 12: Performance Benchmarking
**File:** Various
**Status:** PENDING
**Description:** Benchmark registry vs enum lookup (mentioned in docs).

**Sub-tasks:**
1. Create benchmark suite
2. Measure tool dispatch performance
3. Compare before/after metrics
4. Document findings

---

## Task Selection Guidelines

### Start With These (Quick Wins):
1. **Task 1** (Phase 1B) - Registry enhancement, builds on Phase 1A
2. **Task 9** (Documentation) - Easy, can be done anytime

### Next Priority (Architecture):
3. **Task 2** (Shared Core) - Unblocks FloydDesktop
4. **Task 3** (IPC Bridge) - Needed for Desktop

### If You Like UI Work:
5. **Task 4** (React Components) - Desktop UI

### If You Like Infrastructure:
6. **Task 5** (Sub-Agents) - Enhance orchestrator
7. **Task 6** (MCP Enhancement) - Tool discovery

### For Advanced Work:
8. **Task 7** (SUPERCACHE) - Major feature
9. **Task 8** (Chrome Tools) - Integration work

---

## Before Starting Any Task

1. Read `docs/FLOYD_ARCHITECTURE.md` for context
2. Read `.floyd/ULTRATHINK_ANALYSIS.md` for recent findings
3. Check `AGENT_REPORT.md` for what's been done
4. Run `go test ./... && go build ./...` to verify baseline
5. Update `.floyd/branch.md` with your chosen task

---

## After Completing a Task

1. Run tests to verify no regressions
2. Update the task status in this file
3. Add receipt (command output, file snippets) to `AGENT_REPORT.md`
4. Commit changes with descriptive message
5. Update relevant documentation

---

**Orchestrator Notes:**
- Use `TodoWrite` tool to track sub-task progress
- Use parallel Task launches where appropriate
- Verify everything before claiming "done"
- Update docs immediately after completion
- Report blocking issues to user promptly
