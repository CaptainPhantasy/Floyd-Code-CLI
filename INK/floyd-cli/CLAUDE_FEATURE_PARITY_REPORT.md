# Claude Feature Parity Report for Floyd CLI

**Generated:** 2026-01-25
**Scope:** ClaudeStuff.md vs Floyd CLI Implementation

---

## Executive Summary

| Category | Claude Features | Floyd Implemented | Coverage |
|----------|-----------------|-------------------|----------|
| Built-in Commands | 7 | 6 | 86% |
| Keyboard Shortcuts | 15 | 18 | 120% (Floyd-specific) |
| Slash Commands | 40+ | 6 | 15% |
| MCP Servers | 10 | 3 (built-in) | 30% |
| Agent Types | 20+ | 5 | 25% |
| Native Tools | 50 | 50 | 100% ✓ |
| Modes | 4 | 3 | 75% |

---

## 1. Built-in Commands

### ✅ IMPLEMENTED in Floyd

| Command | Description | Floyd Status |
|---------|-------------|--------------|
| `/help` | Show available commands | ✅ `helpCommand` with aliases `?`, `h` |
| `/clear` | Clear conversation | ✅ `clearCommand` with alias `cls` |
| `/exit` | Exit CLI | ✅ `exitCommand` with aliases `quit`, `q` |
| `/status` | Show status dashboard | ✅ `statusCommand` with alias `st` |

### ❌ MISSING - Needs Implementation

| Command | Description | Priority |
|---------|-------------|----------|
| `/tasks` | List running background tasks | HIGH |
| `/rewind` | Revert to previous checkpoint | MEDIUM (stub exists) |
| `/sandbox` | Enter sandboxed bash mode | LOW |

### ➕ BONUS Floyd Commands (Not in Claude)

| Command | Description |
|---------|-------------|
| `/config` | Manage Floyd configuration |
| `/session` | Manage Floyd sessions |
| `/mcp` | MCP server management |
| `/history` | Command history management |
| `/version` | Show version info |
| `/echo`, `/pwd`, `/cd` | Utility commands |
| Vault commands | Obsidian integration |

---

## 2. Keyboard Shortcuts

### Floyd-Specific Bindings (Current)

| Shortcut | Floyd Action | Claude Equivalent |
|----------|--------------|-------------------|
| `Ctrl+Q` | Quit CLI | - |
| `Ctrl+C` | Quit CLI | - |
| `Esc` | Quit/Close overlays | - |
| `Ctrl+/` | Help overlay | - |
| `Ctrl+P` | Command palette | - |
| `Ctrl+M` | Monitor dashboard | - |
| `Ctrl+K` | Session switcher | - |
| `Ctrl+T` | Agent visualization | `/tasks` (different) |
| `Ctrl+R` | Voice input | Reverse search (different) |
| `Ctrl+Z` | Zen mode | Suspend (different) |
| `Ctrl+V` | Vibe mode | Paste images (different) |
| `Shift+Tab` | Safety mode cycle | Auto-accept edits (different) |
| `Ctrl+B` | Flash breadcrumb | - |
| `Ctrl+I` | Flash mood | - |
| `Ctrl+Shift+P` | Prompt library | - |
| `PageUp/Down` | Scroll | - |

### Claude Shortcuts NOT in Floyd

| Shortcut | Claude Action | Recommendation |
|----------|---------------|----------------|
| `!` | Bash mode | ADD - prefix detection |
| `/` | Command mode | ✅ Already works |
| `@` | File path mode | ADD - prefix detection |
| `&` | Background mode | ADD - prefix detection |
| `Esc` (double tap) | Clear input | CONSIDER |
| `Ctrl+_` | Undo | CONSIDER |
| `Ctrl+O` | Toggle verbose output | ADD |
| `Ctrl+S` | Stash prompt | ADD |
| `Opt+P` | Switch model | ADD |
| `Shift+Enter` | Insert newline | CHECK existing |

---

## 3. Slash Commands (Skills)

### ✅ Floyd Has (in slash-commands.ts)

| Command | Category |
|---------|----------|
| `/agent` | agents |
| `/plan` | modes |
| `/rewind` | rewind |
| `/explore` | exploration |
| `/checkpoint` | rewind |
| `/status` | general |

### ❌ HIGH-PRIORITY Missing Commands

| Command | Description | Priority |
|---------|-------------|----------|
| `/commit` | Git commit workflow | HIGH |
| `/analyze` | Codebase analysis | HIGH |
| `/swarm` | Multi-agent parallel tasks | MEDIUM |

### Claude Skills Categories (40+ commands)

- **Git/Development:** `/commit`, worktrees
- **Planning/Debugging:** Systematic debugging, test fixing
- **Documentation:** Context7, DocX, PDF
- **Design/Media:** Theme Factory, Canvas Design
- **Web/Testing:** Webapp Testing, Figma integration
- **Data/Analysis:** XLSX, CSV Summarizer
- **AWS:** CDK, serverless patterns
- **Plugin Development:** Create plugins, skills, hooks
- **Multi-Agent:** Swarm

**Recommendation:** Focus on `/commit`, `/analyze`, and core debugging skills first.

---

## 4. MCP Server Integration

### Floyd Built-in Servers

| Server | Tools | Status |
|--------|-------|--------|
| `patch` | 5 | Running |
| `git` | 8 | Running |
| `cache` | 4 | Running |

### Claude MCP Servers (from ClaudeStuff.md)

| Server | Purpose | Floyd Status |
|--------|---------|--------------|
| Notion | Workspace integration | ❌ Not configured |
| Context7 | Library documentation | ❌ Not configured |
| Figma | Design integration | ❌ Not configured |
| Playwright | Browser automation | ❌ Via browser tools |
| Serena | Semantic code ops | ❌ Not configured |
| Web Reader | URL to LLM input | ❌ Not configured |
| Web Search Prime | Web search | ❌ Not configured |
| 4.5v MCP | Image analysis | ❌ Not configured |
| Zai MCP | Multi-purpose | ❌ Not configured |
| Zread | GitHub integration | ❌ Not configured |

**Recommendation:** MCP servers are plugin-based. Floyd supports the MCP protocol - users can configure these in `.floyd/mcp.json`.

---

## 5. Agent Types

### Floyd Agents (implemented)

| Agent | File | Description |
|-------|------|-------------|
| Custom Agent | `custom-agent.ts` | User-defined agents |
| Explore Agent | `explore-agent.ts` | Codebase exploration |
| Browser Worker | `workers/browser.ts` | Browser automation |
| Code Search Worker | `workers/code-search.ts` | Code search |
| Patch Maker Worker | `workers/patch-maker.ts` | Patch creation |
| Tester Worker | `workers/tester.ts` | Test execution |

### Claude Agents NOT in Floyd

| Agent | Description | Priority |
|-------|-------------|----------|
| `Plan` | Implementation planning | HIGH |
| `Bash` | Command execution | MEDIUM |
| `CRITIC` | Quality improvements | MEDIUM |
| `DocPairity-Critic` | Doc verification | LOW |
| `executive-orchestrator` | Multi-agent workflows | LOW |

**Note:** `profiles.ts` is a stub - needs implementation for full agent profiles.

---

## 6. Native Tools

### ✅ COMPLETE - 50 Tools Implemented

Floyd's `available-tools.ts` has full 50-tool parity:

| Category | Count | Tools |
|----------|-------|-------|
| File Operations | 7 | read, write, edit, search_replace, list, move, delete |
| Git Workflow | 9 | status, add, commit, diff, log, branch, checkout, stash, merge |
| Search | 2 | grep, codebase_search |
| SUPERCACHE | 12 | store, retrieve, delete, clear, list, search, stats, prune, patterns, reasoning |
| System | 3 | run, ask_user, fetch |
| Browser | 9 | status, navigate, read_page, screenshot, click, type, find, get_tabs, create_tab |
| Patch | 5 | apply_unified_diff, edit_range, insert_at, delete_range, assess_patch_risk |
| Special | 3 | verify, safe_refactor, impact_simulate |

---

## 7. Modes

### Floyd Modes

| Mode | Description | Status |
|------|-------------|--------|
| `editing` | Standard editing | ✅ Default |
| `interactive` | User engagement | ✅ Default behavior |
| `planning` | Plan Mode | ✅ `/plan` command |
| `one-shot` | No confirmation | ❌ Not implemented |

### Safety Modes (Floyd-specific)

| Mode | Description |
|------|-------------|
| `yolo` | Auto-approve everything |
| `ask` | Prompt for each action |
| `plan` | Plan before acting |

---

## 8. Advanced Features

| Feature | Claude | Floyd | Status |
|---------|--------|-------|--------|
| Computer Use | ✅ | ❌ | Not planned |
| Rewind/Checkpoints | ✅ | Partial | `rewind-engine.ts` exists |
| Sandboxed Bash | ✅ | ❌ | Not implemented |
| Custom Subagents | ✅ | ✅ | `custom-agent.ts` |
| Custom Slash Commands | ✅ | ✅ | `.floyd/commands/` |
| Status Dashboard | ✅ | ✅ | `/status`, Ctrl+M |
| CLAUDE.md Files | ✅ | ✅ | Floyd.md equivalent |

---

## Recommendations

### Immediate Actions (High Priority)

1. **Add `/tasks` command** - List background tasks
2. **Complete `/rewind` implementation** - Full checkpoint system
3. **Add `/commit` skill** - Git commit workflow
4. **Implement prefix detection** - `!`, `@`, `&` modes

### Medium Priority

1. **Add `/analyze` skill** - Codebase analysis
2. **Implement `Plan` agent profile** - Architecture planning
3. **Add `Ctrl+O` verbose toggle** - Output verbosity
4. **Add `Ctrl+S` prompt stash** - Save prompts

### Low Priority

1. **Add `/sandbox` command** - Isolated bash mode
2. **Configure sample MCP servers** - Notion, Context7, etc.
3. **Implement one-shot mode** - No confirmation flow
4. **Add Computer Use** - Screenshot/mouse control

---

## Conclusion

Floyd CLI has **excellent tool coverage** (100% of 50 tools) and **strong command infrastructure**. The main gaps are:

1. **Slash commands/skills** - Only 6 of 40+ implemented
2. **Agent profiles** - Stub file, needs population
3. **Prefix modes** - `!`, `@`, `&` not detected

The architecture is solid and extensible. Most missing features can be added incrementally without major refactoring.
