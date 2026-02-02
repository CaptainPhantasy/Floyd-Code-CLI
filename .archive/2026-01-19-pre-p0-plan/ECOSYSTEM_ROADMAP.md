# Floyd Ecosystem Roadmap

**Last Updated:** 2026-01-18
**Goal:** Ship Floyd as Douglas's personal daily driver replacement for the Claude ecosystem

---

## ⚠️ SYNCHRONIZATION RULES

> **MANDATORY:** This document MUST stay synchronized with `master_plan.md`
> 
> - Any update here → Update `master_plan.md`
> - Any update to `master_plan.md` → Update here
> - Orchestrator verifies parity after each specialist disposal
> - See `.floyd/AGENT_ORCHESTRATION.md` for full protocol

---

## Claude Ecosystem Analysis

### Claude Desktop (MCP Hub)
| Feature | Description | Floyd Status |
|---------|-------------|--------------|
| MCP Protocol | Open standard for AI-tool connections | ✅ Implemented |
| Prebuilt Connectors | Notion, Figma, Stripe, Linear, etc. | ⚠️ Config exists, needs more servers |
| Permission Control | User approves each MCP server | ⚠️ Basic - needs UI |
| Tool Invocation Modes | auto, required, none | ❌ Not implemented |
| Parallel Tool Use | Multiple tools concurrently | ❌ Not implemented |
| MCP Manager | Visual server management | ✅ MCPSettings component |
| Persistent Memory | Semantic memory across sessions | ⚠️ Basic - needs enhancement |
| MS365 Connector | Enterprise content integration | ❌ Not planned |

### Claude Code (Agentic CLI)
| Feature | Description | Floyd Status |
|---------|-------------|--------------|
| Whole-project context | Understands codebase structure | ⚠️ Basic - needs enhancement |
| Multi-file edits | Refactor across files | ✅ Via Edit/MultiEdit tools |
| Auto / Interactive modes | Plan → approve or auto-execute | ❌ Not implemented |
| Git integration | Commits, branches, PRs | ⚠️ Via Bash tool only |
| Model selection | Switch Opus/Sonnet/Haiku | ✅ Provider selection UI |
| MCP + Hooks | Tool integrations | ✅ MCP implemented |
| IDE integration | VS Code, JetBrains | ❌ Not implemented |
| Memory layers | Project, local, global preferences | ⚠️ Basic config only |
| Skill hot-reload | Changed skills take effect immediately | ❌ Not implemented |
| Plugin ecosystem | Shareable skills/commands | ❌ Not implemented |
| Sandbox modes | Reduce permission prompts | ❌ Not implemented |

### Claude for Chrome (Browser Agent)
| Feature | Description | Floyd Status |
|---------|-------------|--------------|
| Side panel interaction | Chat while browsing | ✅ Implemented |
| Page context reading | Understand live pages | ✅ read_page, get_page_text |
| Element interaction | Click, type, fill forms | ✅ click, type tools |
| Multi-tab workflows | Work across tab groups | ⚠️ Basic - get_tabs, tabs_create |
| Scheduled tasks | Daily/weekly automations | ❌ Not implemented |
| Workflow recording | Save steps as shortcuts | ❌ Not implemented |
| Planning mode | Approve plan then execute | ❌ Not implemented |
| Developer tools | Console, network, DOM access | ⚠️ Basic |
| Background tasks | Run while switching tabs | ⚠️ Service worker only |
| Site permissions | Allow/block specific sites | ⚠️ Basic safety layer |
| Prompt injection defense | Detect hidden instructions | ⚠️ Sanitizer exists |

### Claude Cowork (Non-technical Agent)
| Feature | Description | Floyd Status |
|---------|-------------|--------------|
| Folder access | Read/write local files | ✅ Via FileBrowser |
| Multi-step tasks | Parallelized execution | ✅ Browork sub-agents |
| Agentic loop | Goal → plan → execute → check | ⚠️ Basic agent loop |
| File organization | Sort, rename, organize | ⚠️ Via tools only |
| Data extraction | Images → spreadsheets | ❌ Not implemented |
| Document drafting | Reports from notes | ⚠️ Via agent |
| External integrations | Notion, Asana, PayPal | ❌ Not implemented |

---

## Recent Progress (Last 3 Days)

### ✅ Completed

1. **FloydDesktop Three-Panel Layout**
   - ProjectsPanel (left) - Projects & sessions management
   - ChatPanel (center) - Conversation with streaming
   - ContextPanel (right) - Files, Tools, Extension, Browork tabs

2. **Provider System**
   - Multi-provider support (GLM, Anthropic, OpenAI, DeepSeek)
   - Dynamic model lists per provider
   - Auto-populated endpoints
   - Settings persistence

3. **Browork Sub-Agent System**
   - Real implementation with isolated AgentEngine instances
   - Progress tracking and status updates
   - IPC communication with real-time updates

4. **UI Components**
   - FileBrowser with lazy directory loading
   - ToolsPanel showing MCP tools by server
   - ExtensionPanel for Chrome extension status
   - CommandPalette (Cmd+K)
   - KeyboardShortcuts modal
   - ExportDialog (Markdown, JSON, HTML)
   - InputBar with slash commands & file attachments

5. **Agent Core Improvements**
   - useAgentStream hook fixes for session changes
   - createSession type mismatch fixed
   - setSetting return type standardized

### ⚠️ In Progress

1. **Testing** - Need comprehensive tests
2. **IPC Type Safety** - Some handlers need refinement
3. **Chrome Extension** - Needs more features

---

## Refined Roadmap

### Phase 5: Testing & Stability (Current Priority)

**Goal:** Ensure everything that's built actually works reliably

| Task | Priority | Effort |
|------|----------|--------|
| First 15 interactions simulation (Desktop) | HIGH | 1 day |
| Unit tests for floyd-agent-core | HIGH | 2 days |
| Integration tests for IPC handlers | HIGH | 1 day |
| Chrome extension end-to-end test | MEDIUM | 1 day |
| Error boundary components | MEDIUM | 0.5 days |

### Phase 6: Claude Code Parity (CLI Enhancement)

**Goal:** Match Claude Code's agentic coding features

| Task | Priority | Effort |
|------|----------|--------|
| Auto / Interactive modes | HIGH | 2 days |
| Plan → Execute workflow | HIGH | 2 days |
| Git integration commands | HIGH | 1 day |
| Skill system (loadable commands) | MEDIUM | 3 days |
| Memory layers (project, local, global) | MEDIUM | 2 days |
| IDE extension (VS Code) | LOW | 5+ days |

### Phase 7: Chrome Extension Enhancement

**Goal:** Match Claude for Chrome's browser automation

| Task | Priority | Effort |
|------|----------|--------|
| Multi-tab workflows (tab groups) | HIGH | 2 days |
| Workflow recording | HIGH | 3 days |
| Scheduled tasks | MEDIUM | 2 days |
| Planning mode | MEDIUM | 2 days |
| Site permission UI | LOW | 1 day |
| Prompt injection defense | LOW | 2 days |

### Phase 8: Cowork Features (Browork Enhancement)

**Goal:** Match Claude Cowork's non-technical user features

| Task | Priority | Effort |
|------|----------|--------|
| Folder-scoped operations | HIGH | 1 day |
| Batch file operations | HIGH | 1 day |
| Progress visualization | MEDIUM | 1 day |
| Sub-agent result aggregation | MEDIUM | 2 days |
| Document generation templates | LOW | 2 days |

### Phase 9: MCP Ecosystem

**Goal:** Rich MCP server ecosystem like Claude Desktop

| Task | Priority | Effort |
|------|----------|--------|
| GitHub MCP server | HIGH | 1 day |
| Filesystem MCP server | HIGH | Already exists |
| Google Drive connector | MEDIUM | 2 days |
| Notion connector | MEDIUM | 2 days |
| MCP server marketplace UI | LOW | 3 days |

### Phase 10: Enterprise Features

**Goal:** Enterprise-ready features

| Task | Priority | Effort |
|------|----------|--------|
| Audit logging | MEDIUM | 2 days |
| SSO integration | LOW | 3 days |
| Team workspaces | LOW | 5 days |
| Usage analytics | LOW | 2 days |

---

## Architecture Alignment

### Current vs Claude Ecosystem

```
FLOYD Ecosystem                    Claude Ecosystem
─────────────────                  ─────────────────
FloydDesktop    ←─────────────────→ Claude Desktop
  ├── MCP Hub                        ├── MCP Hub
  ├── Browork (sub-agents)           ├── Cowork integration
  └── Provider agnostic              └── Anthropic only

Floyd CLI       ←─────────────────→ Claude Code
  ├── Terminal TUI (Ink)             ├── Terminal CLI
  ├── Agent loop                     ├── Agentic coding
  └── Needs: Auto mode, Skills       └── Full featured

FloydChrome     ←─────────────────→ Claude for Chrome
  ├── Side panel                     ├── Side panel
  ├── Browser tools                  ├── Browser tools
  └── Needs: Workflows, Recording    └── Full featured

Browork         ←─────────────────→ Claude Cowork
  ├── Sub-agent spawning             ├── Agentic loop
  ├── Task delegation                ├── File operations
  └── Needs: Better UX               └── Full featured
```

### Key Differentiators

| Aspect | Floyd | Claude |
|--------|-------|--------|
| Provider | Multi-provider (GLM, Anthropic, OpenAI, DeepSeek) | Anthropic only |
| Cost | Can use cheaper providers | $20-200/month |
| Open Source | Yes | No |
| Self-hosted | Yes | No |
| MCP | Standard MCP | Standard MCP |

---

## Success Metrics

### Feature Parity Scorecard

| Component | Current Score | Target |
|-----------|--------------|--------|
| Floyd Desktop vs Claude Desktop | 65% | 90% |
| Floyd CLI vs Claude Code | 40% | 85% |
| FloydChrome vs Claude Chrome | 50% | 80% |
| Browork vs Cowork | 35% | 75% |

### Definition of "Parity"

- **90%**: All core features work reliably
- **85%**: Most workflows achievable
- **80%**: Basic feature set complete
- **75%**: MVP with key differentiators

---

## Next Steps (Immediate)

1. **Complete Phase 5 testing** - Validate all built features work
2. **Fix identified bugs** - Address issues from code walkthrough
3. **Document deployment** - Installation and configuration guides
4. **Create demo videos** - Show what Floyd can do
5. **Plan Phase 6** - Prioritize Claude Code features

---

*This roadmap is a living document. Update as priorities shift.*
