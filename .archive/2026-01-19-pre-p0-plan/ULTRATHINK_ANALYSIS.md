# ULTRATHINK Analysis: FLOYD CLI Architecture Assessment

**Date:** 2026-01-17
**Method:** Multi-agent parallel exploration
**Status:** ✅ Complete - Ready for Phase 1 Implementation

---

## Executive Summary

FLOYD CLI has a **hybrid architecture** with both legacy (enum-based) and modern (dynamic registry) tool systems. The foundation is solid but requires **surgical cleanup** to enable Phase 1 (Dynamic Tool Registry) from the path-forward.md roadmap.

**Key Finding:** The dynamic registry already exists in `tui/floydtools/` and works well. The blocking issue is legacy code in `agent/tools.go` that creates confusion and maintenance burden.

---

## Current Architecture Assessment

### ✅ What Works Well

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| **Dynamic Tool Registry** | `tui/floydtools/registry.go` | ✅ Production | Thread-safe, clean API |
| **Tool Interface** | `tui/floydtools/tool.go` | ✅ Stable | Well-designed contract |
| **Tool Executor** | `agent/tools/executor.go` | ✅ Modern | Parallel execution support |
| **Agent Loop** | `agent/loop/agent.go` | ✅ Functional | Streaming tool calls |
| **API Client** | `agent/client.go` | ✅ Stable | GLM-4.7 streaming |
| **Test Suite** | Across packages | ✅ All Passing | 100% success rate |

### ⚠️ What Needs Refactoring

| Component | Location | Issue | Action |
|-----------|----------|-------|--------|
| **Legacy Tools** | `agent/tools.go` | Enum-based dispatch | DEPRECATED - Remove |
| **Tool Schema** | `agent/tools/schema.go` | Redundant caching | Simplify/merge |
| **Message Conversion** | `agent/loop/agent.go` | Duplicate formats | Consolidate |
| **MCP Integration** | `mcp/server.go` | Go server unused | Rebuild or remove |

---

## Phase 1: Dynamic Tool Registry - Implementation Plan

### Step 1: Remove Legacy Code (Clean Slate)

**File: `agent/tools.go`** - 348 lines to remove:

```go
// Lines 16-26: Remove ToolKind enum
type ToolKind string
const (
    ToolBash ToolKind = "bash"
    ToolRead ToolKind = "read"
    // ... all enum constants
)

// Lines 28-33: Remove ToolDefinition
type ToolDefinition struct { ... }

// Lines 62-263: Remove all Exec* methods
func (e *AsyncToolExecutor) ExecBash(input string) { ... }
func (e *AsyncToolExecutor) ExecRead(input string) { ... }
// ... all Exec* methods

// Lines 297-342: Remove GetDefaultToolDefinitions
func GetDefaultToolDefinitions() []ToolDefinition { ... }
```

**Action:** Delete entire file, update imports in dependent files.

### Step 2: Consolidate Tool Schema Building

**File: `agent/tools/schema.go`** - 307 lines to simplify:

```go
// Current: Separate caching layer
// Proposed: Move schema generation to registry
type ToolWithSchema struct {
    Tool
    Schema JSONSchemaDescription
}

func (r *Registry) GetToolSchemas() []ToolWithSchema {
    r.mu.RLock()
    defer r.mu.RUnlock()

    schemas := make([]ToolWithSchema, 0, len(r.tools))
    for name, tool := range r.tools {
        schemas = append(schemas, ToolWithSchema{
            Tool: tool,
            Schema: buildSchema(tool),
        })
    }
    return schemas
}
```

**Action:** Simplify to 50 lines, move caching to registry.

### Step 3: Update Orchestrator Integration

**File: `agent/orchestrator.go`** - Lines referencing ToolKind:

```go
// Current: Uses legacy ToolKind
tool := agent.GetTool(ToolBash)

// Proposed: Uses dynamic registry
tool := floydtools.Get("bash")
```

**Action:** Search/replace all ToolKind references with string registry keys.

---

## Current Tool Inventory

### TUI FloydTools (Dynamic Registry)

| Tool | File | Category | Status |
|------|------|----------|--------|
| **Bash** | `bash.go` | System | ✅ Complete |
| **Cache** | `cache.go` | Cache | ✅ Complete |
| **Edit** | `edit.go` | File | ✅ Complete |
| **Glob** | `glob.go` | Search | ✅ Complete |
| **Grep** | `grep.go` | Search | ✅ Complete |
| **LS** | `ls.go` | File | ✅ Complete |
| **MultiEdit** | `multiedit.go` | File | ✅ Complete |
| **Read** | `read.go` | File | ✅ Complete |
| **Write** | `write.go` | File | ✅ Complete |

**Total: 9 production-ready tools**

---

## MCP Integration Status

### Existing Implementations

| Component | Location | Type | Status |
|-----------|----------|------|--------|
| **Go MCP Server** | `mcp/server.go` | Server | ⚠️ Archived |
| **TS MCP Client** | `INK/floyd-cli/src/mcp/` | Client | ✅ Active |
| **Chrome Extension** | `FloydChromeBuild/floydchrome/mcp/` | Bridge | ✅ Active |
| **Native Messaging** | `FloydChromeBuild/floydchrome/native-messaging/` | Transport | ✅ Active |

### Gaps Identified

1. **Dynamic Tool Discovery** - Current: static listing
2. **Tool Metadata** - Current: basic schema only
3. **Tool Routing** - Current: linear search
4. **Tool Caching** - Current: in-memory only
5. **Tool Versioning** - Current: not implemented

---

## Next Steps (Priority Order)

### Immediate (This Session)

1. **Remove `agent/tools.go`** - Delete 348 lines of legacy code
2. **Update imports** - Fix all files referencing removed code
3. **Run tests** - Verify no regressions
4. **Build verification** - Ensure compilation succeeds

### Phase 1B (Dynamic Registry Enhancement)

1. **Add ToolMetadata struct** - Name, description, category, version
2. **Implement categorization** - Group tools by functionality
3. **Add watch mode** - Detect tool changes at runtime
4. **Create tool config** - JSON-based tool definitions

### Phase 2 (Sub-Agent Spawning)

1. **Enhance orchestrator** - Better context cloning
2. **Add agent types** - planner, coder, tester, search
3. **Implement spawn command** - `/spawn coder "fix auth"`
4. **Result collection** - Aggregate sub-agent output

### Phase 3 (Browser Automation)

1. **Playwright integration** - Real browser control
2. **Screenshot API** - Visual context capture
3. **DOM analysis** - Element inspection
4. **Click/type actions** - User interaction simulation

### Phase 4 (SUPERCACHE)

1. **Cache directory structure** - `.floyd/.cache/` layout
2. **Three-tier storage** - reasoning, project, vault
3. **TTL management** - Automatic expiration
4. **Search API** - Cache content retrieval

---

## File Changes Summary

### Files to Delete
- `agent/tools.go` (348 lines) - Legacy enum system

### Files to Modify
- `agent/orchestrator.go` - Remove ToolKind references
- `agent/tools/schema.go` - Simplify schema building
- `agent/loop/agent.go` - Consolidate message types

### Files to Create
- `tui/floydtools/metadata.go` - Tool metadata support
- `tui/floydtools/config.go` - Configuration loading
- `tui/floydtools/watcher.go` - Runtime tool detection

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing workflows | HIGH | Run full test suite after changes |
| Missing tool during migration | MEDIUM | Inventory all tools before delete |
| TUI integration broken | HIGH | Verify floyd_mode.go compatibility |
| MCP server incompatibility | LOW | Go server is archived anyway |

---

## Verification Commands

```bash
# Pre-cleanup verification
go test ./... 2>&1 | grep -E "^(ok|FAIL)"
go build ./...

# Post-cleanup verification
go test ./... 2>&1 | grep -E "^(ok|FAIL)"
go build ./...
./floyd  # Manual smoke test
```

---

## Success Criteria

Phase 1 is complete when:
- [ ] `agent/tools.go` is deleted
- [ ] All tests still pass
- [ ] Build succeeds without warnings
- [ ] TUI tools work as before
- [ ] Documentation updated

---

**Analysis Complete. Ready to proceed with Phase 1A: Legacy Code Removal.**
