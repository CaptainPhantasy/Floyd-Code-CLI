# CLAUDE SYSTEM ALIGNMENT ANALYSIS
**FLOYD Ecosystem → Claude Desktop/Code/Cowork Feature Parity**

**Date:** 2026-01-29 00:45:00 EST
**Purpose:** Guide final phase alignment with Claude system capabilities
**Target:** FLOYD ecosystem rough working versions → polished rebuild

---

## EXECUTIVE SUMMARY

The FLOYD ecosystem has **60 tools** across 10 categories, which **exceeds** Claude Code's ~50 tools in raw count. However, FLOYD lacks key Claude features in:
- Plugin ecosystem architecture
- Hooks system (lifecycle events)
- Multi-agent orchestration
- Desktop extension format (.mcpb)
- IDE integration parity

**FLOYD's Unique Advantages:**
- SUPERCACHE 3-tier memory (Reasoning/Project/Vault)
- ZAI Annual Max Coding Plan integration
- Sandbox protection with checkpoint/rewind
- Browork sub-agent system
- FloydDesktopWeb as unified hub

**Alignment Strategy:** Hybrid approach - maintain FLOYD innovations while adopting Claude patterns where they add value.

---

## ECOSYSTEM ARCHITECTURE COMPARISON

### Current FLOYD Components

| Component | Status | Purpose | Claude Counterpart |
|-----------|--------|---------|-------------------|
| **floyd-wrapper-main** | Active | Core CLI wrapper with 60 tools | Claude Code CLI |
| **INK/floyd-cli** | Active | Ink-based TUI | Claude Code CLI (terminal UI) |
| **FloydDesktopWeb** | Active | Desktop web app | Claude Desktop |
| **FloydChromeBuild** | Active | Chrome extension | Claude in Chrome (beta) |
| **packages/floyd-agent-core** | Active | Shared agent logic | @anthropic-ai/claude-agent-sdk |
| **Floyd IDE (CURSE'M)** | Active | VS Code-based IDE | Cursor/VS Code + Claude |
| **mobile/** | Staged | Mobile app | Claude iOS app |
| **Browork** | Embedded | Sub-agent system | Claude Cowork (partial) |

### Claude System Architecture (for Reference)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE SYSTEM ARCHITECTURE               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  Claude Desktop  │      │   Claude Code    │             │
│  │  (Electron App)  │      │   (CLI/VS Code)  │             │
│  └────────┬─────────┘      └────────┬─────────┘             │
│           │                         │                        │
│           │    ┌────────────────────┴────────┐               │
│           │    │    MCP Protocol          │               │
│           │    │  (.mcpb extensions)      │               │
│           │    └─────────────────────────────┘               │
│           │                         │                        │
│  ┌────────▼─────────┐      ┌───────▼──────────┐             │
│  │  Claude Cowork   │      │   Claude.ai      │             │
│  │  (File Access)   │      │   (Web Session)  │             │
│  └──────────────────┘      └──────────────────┘             │
│                                                              │
│  ┌───────────────────────────────────────────────────┐      │
│  │          Plugin Ecosystem                      │      │
│  │  • Commands (.md files)                          │      │
│  │  • Agents (.md frontmatter)                      │      │
│  │  • Skills (.md frontmatter)                       │      │
│  │  • Hooks (.json/.py/.sh)                          │      │
│  │  • MCP Servers (.mcpb bundles)                    │      │
│  └───────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## DETAILED FEATURE COMPARISON

### 1. TOOLS COMPARISON

| Category | Claude Code Tools | FLOYD Tools | Gap Analysis |
|----------|-------------------|-------------|--------------|
| **File Ops** | Read, Write, Edit, Glob | read_file, write, edit_file, search_replace, list_directory, move_file, delete_file | ✅ **PARITY** - FLOYD has more granular tools |
| **Git** | commit, push, PR, diff, status, log | git_status, git_add, git_commit, git_diff, git_log, git_branch, git_checkout, git_stash, git_merge | ✅ **PARITY** - FLOYD has more comprehensive git tools |
| **Search** | Grep, codebase search (Explore) | grep, codebase_search | ✅ **PARITY** |
| **Terminal** | Bash, background commands | run, start_process, interact_with_process, read_process_output, force_terminate, list_processes, kill_process, execute_code | ✅ **PARITY** - FLOYD has richer process control |
| **LSP** | go-to-definition, find references, hover | ❌ **MISSING** | ⚠️ **ADD LSP tool** for code intelligence |
| **Notebooks** | Jupyter notebook read/edit | ❌ **MISSING** | ⚠️ **ADD NotebookEdit tool** |
| **Browser** | (via Claude in Chrome) | browser_status, browser_navigate, browser_read_page, browser_screenshot, browser_click, browser_type, browser_find, browser_get_tabs, browser_create_tab | ✅ **PARITY** - FLOYD has Chrome extension |
| **Cache/Memory** | compact, @-mention file, CLAUDE.md | cache_store, cache_retrieve, cache_delete, cache_clear, cache_list, cache_search, cache_stats, cache_prune, cache_store_pattern, cache_store_reasoning, cache_load_reasoning, cache_archive_reasoning | ✅ **SUPERIOR** - FLOYD has 3-tier SUPERCACHE |
| **Patching** | Edit (range-based) | apply_unified_diff, edit_range, insert_at, delete_range, assess_patch_risk | ✅ **PARITY** |
| **Special** | Plan mode, Thinking mode | verify, safe_refactor, impact_simulate | ✅ **DIFFERENT** - FLOYD has impact simulation |
| **Web** | WebSearch, WebFetch | fetch | ⚠️ **PARTIAL** - Has fetch, no dedicated WebSearch |

**VERDICT:** FLOYD has **60 tools** vs Claude's **~50 tools**. FLOYD is ahead in:
- Process control (9 tools)
- SUPERCACHE (12 tools)
- Browser automation (9 tools)
- Git workflow (9 tools)

FLOYD needs to add:
- **LSP tool** (code intelligence)
- **NotebookEdit tool** (Jupyter support)
- **WebSearch tool** (dedicated, not just fetch)

---

### 2. PLUGIN SYSTEM COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **Commands** | ✅ .md files in .claude/commands/ | ✅ .js files in .floyd/commands/ | ⚠️ **Different format** - FLOYD uses JS, Claude uses markdown |
| **Agents** | ✅ .md files with frontmatter | ⚠️ **Planned but not implemented** | ❌ **GAP** - Implement agent frontmatter |
| **Skills** | ✅ .md files with frontmatter | ⚠️ **SkillsManager exists** | ⚠️ **PARTIAL** - SkillsManager in FloydDesktopWeb |
| **Hooks** | ✅ .json/.py/.sh lifecycle events | ❌ **NOT IMPLEMENTED** | ❌ **GAP** - Implement hooks system |
| **MCP Integration** | ✅ .mcp.json, stdio/HTTP/SSE | ✅ MCP client exists | ⚠️ **PARTIAL** - No .mcpb bundle support |
| **Hot Reload** | ✅ Auto-reload on change | ⚠️ **Manual reload** | ⚠️ **IMPROVEMENT NEEDED** |
| **Marketplace** | ✅ Plugin directory | ❌ **NONE** | ⚠️ **OPTIONAL** - Community marketplace |
| **CLI for plugins** | ✅ /plugin install/enable/disable | ❌ **NONE** | ⚠️ **ADD /plugin commands** |

**RECOMMENDATIONS:**

1. **Implement Hooks System** (HIGH PRIORITY)
   ```typescript
   // .floyd/hooks.json structure
   {
     "hooks": [
       {
         "event": "SessionStart",
         "command": "./scripts/init.sh"
       },
       {
         "event": "PreToolUse",
         "command": "python3 hooks/pre_tool.py"
       },
       {
         "event": "PostToolUse",
         "command": "./hooks/post_tool.sh"
       },
       {
         "event": "PermissionRequest",
         "handler": "auto_approve_safe_commands"
       }
     ]
   }
   ```

2. **Add Agent Frontmatter Support** (HIGH PRIORITY)
   ```yaml
   # .floyd/agents/code-reviewer.md
   ---
   description: Expert code reviewer with security focus
   model: glm-4.7
   permissionMode: auto-allow
   allowedTools:
     - Read
     - Grep
     - Bash
   skills:
     - security/analysis
     - refactoring/patterns
   ---

   You are a security-focused code reviewer...
   ```

3. **Unify Command Format** (MEDIUM PRIORITY)
   - Support both `.js` (current FLOYD) AND `.md` (Claude) commands
   - Add markdown parser for command definitions

4. **Add /plugin Commands** (MEDIUM PRIORITY)
   ```bash
   /plugin install <name>     # Install from marketplace
   /plugin enable <name>      # Enable installed plugin
   /plugin disable <name>     # Disable plugin
   /plugin list               # List all plugins
   /plugin validate           # Validate plugin structure
   ```

---

### 3. PERMISSION SYSTEM COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **Scopes** | Global, User, Local, Session | ⚠️ **Simpler levels** | ⚠️ **ADD Session scope** |
| **Wildcards** | ✅ `Bash(npm *)`, `Bash(git * main)` | ⚠️ **Basic patterns** | ⚠️ **ENHANCE wildcards** |
| **Risk Classification** | ✅ Auto (safe), ask, deny | ✅ none, moderate, dangerous | ✅ **PARITY** |
| **Ask UI** | ✅ Inline yes/no | ✅ AskUserQuestion overlay | ✅ **PARITY** |
| **Permission Dialog** | ✅ Tab hints, auto-accept | ⚠️ **Basic UI** | ⚠️ **ENHANCE UX** |
| **/permissions command** | ✅ Manage rules | ⚠️ **Basic permissions** | ⚠️ **ADD full command** |

**RECOMMENDATIONS:**

1. **Enhance Wildcard Support** in `tool-policy.ts`:
   ```typescript
   // Add support for Claude-style patterns
   const PATTERNS = {
     'Bash(npm *)': (args) => args.command?.startsWith('npm '),
     'Bash(git * main)': (args) => args.command?.includes(' main'),
     'Read(*.ts)': (args) => args.file_path?.endsWith('.ts'),
   };
   ```

2. **Add /permissions Command**:
   ```bash
   /permissions              # Show all permission rules
   /permissions add <rule>   # Add new rule
   /permissions remove <rule> # Remove rule
   /permissions test <tool>  # Test what permission would apply
   ```

---

### 4. MODES & AGENTS COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **Plan Mode** | ✅ Dedicated Plan agent | ⚠️ **No dedicated mode** | ❌ **GAP** - Add /plan mode |
| **Thinking Mode** | ✅ Extended reasoning (Alt+T) | ⚠️ **Via prompt only** | ⚠️ **ADD toggle** |
| **Explore Agent** | ✅ Haiku-powered search | ⚠️ **codebase_search exists** | ⚠️ **FORMALIZE as agent** |
| **Custom Agents** | ✅ @-mention to invoke | ❌ **NOT IMPLEMENTED** | ❌ **GAP** |
| **Background Agents** | ✅ Ctrl+B to background | ⚠️ **Via start_process** | ⚠️ **ADD Ctrl+B** |
| **Forked Context** | ✅ Skills run in sub-agent | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** |

**RECOMMENDATIONS:**

1. **Implement Plan Mode** (HIGH PRIORITY - HIGH VALUE):
   ```typescript
   // /plan command structure
   class PlanMode {
     async enter(): Promise<void> {
       // Switch to planning subagent
       // Use Sonnet for planning (faster)
       // Build detailed step-by-step plan
       // Show plan for user approval
       // Execute only after approval
     }
   }
   ```

2. **Add Thinking Mode Toggle** (MEDIUM PRIORITY):
   ```typescript
   // Add Alt+T shortcut in INK/floyd-cli
   toggleThinking(): void {
     this.useExtendedReasoning = !this.useExtendedReasoning;
     // Append "Think step by step" to system prompt when enabled
   }
   ```

3. **Formalize Explore Agent** (LOW PRIORITY):
   ```yaml
   # .floyd/agents/explore.yaml
   description: Fast codebase exploration using Haiku 4.5
   model: glm-4.5-air  # Fast model
   allowedTools:
     - grep
     - list_directory
     - read_file
   ```

---

### 5. SESSION & MEMORY COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **Session Persistence** | ✅ --continue, --resume | ✅ Sessions stored | ✅ **PARITY** |
| **Named Sessions** | ✅ /rename, /resume <name> | ⚠️ **Sessions have names** | ⚠️ **ADD /rename command** |
| **Session Folder** | ✅ Organize sessions | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** |
| **Auto-Compact** | ✅ At 80% context | ⚠️ **Manual /compact** | ⚠️ **ADD auto threshold** |
| **CLAUDE.md** | ✅ Project instructions | ⚠️ **Via FLOYD.md** | ✅ **PARITY** |
| **@-mention files** | ✅ @file or @folder | ⚠️ **Via UI** | ⚠️ **ENHANCE syntax** |
| **Context Visualization** | ✅ /context breakdown | ⚠️ **Limited** | ⚠️ **ENHANCE /context** |

**RECOMMENDATIONS:**

1. **Add /context Command** (MEDIUM PRIORITY):
   ```typescript
   // /context output format
   {
     "total_tokens": 45000,
     "used_percentage": 22.5,
     "breakdown": {
       "system_prompt": 1200,
       "conversation": 28000,
       "tools": 5000,
       "files": 8000,
       "mcp_servers": 3000
     },
     "suggestions": [
       "Compact conversation to free up context",
       "Unload unused MCP servers"
     ]
   }
   ```

2. **Enhance @-mention Syntax**:
   ```typescript
   // Support Claude-style @-mentions
   @~/path/to/file       // Relative to home
   @./file.ts            // Relative to cwd
   @src/components/**   // Glob pattern
   @mcp:server:resource // MCP resource
   ```

---

### 6. MCP (MODEL CONTEXT PROTOCOL) COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **MCP stdio** | ✅ | ✅ | ✅ **PARITY** |
| **MCP HTTP/SSE** | ✅ | ✅ | ✅ **PARITY** |
| **MCP OAuth** | ✅ | ⚠️ **Basic support** | ⚠️ **ENHANCE OAuth flow** |
| **Resource @-mention** | ✅ @resource:// | ❌ **NOT IMPLEMENTED** | ⚠️ **ADD resource mentions** |
| **MCP .mcpb bundles** | ✅ Desktop Extensions | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** for CLI |
| **Dynamic tool list** | ✅ list_changed | ⚠️ **Static list** | ⚠️ **ADD dynamic updates** |
| **MCP Prompts** | ✅ @prompts | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** |

**RECOMMENDATIONS:**

1. **Add Resource Mentions** (MEDIUM PRIORITY):
   ```typescript
   // Support @resource:// syntax for MCP resources
   @github://anthropic/claude-code/issues/123
   @postgres://query/SELECT * FROM users
   @gdrive://document/1ABC...
   ```

2. **Implement MCPB Bundles for Desktop** (LOW PRIORITY):
   ```bash
   # For FloydDesktopWeb, support .mcpb installation
   floyd-desktop install-extension path/to/extension.mcpb
   ```

---

### 7. TERMINAL/CLI FEATURES COMPARISON

| Feature | Claude Code | FLOYD (INK) | Gap |
|---------|-------------|-------------|-----|
| **Vim Mode** | ✅ Full vi keybindings | ⚠️ **Limited** | ⚠️ **ENHANCE Vim support** |
| **Ctrl+R History** | ✅ Search history | ⚠️ **Basic history** | ⚠️ **ADD search** |
| **Ctrl+G Edit** | ✅ Open in $EDITOR | ❌ **NOT IMPLEMENTED** | ⚠️ **ADD** |
| **Background Tasks** | ✅ Ctrl+B, /tasks | ⚠️ **start_process** | ⚠️ **ADD Ctrl+B** |
| **Queue Messages** | ✅ Type while agent runs | ⚠️ **Limited** | ⚠️ **ENHANCE** |
| **Tab Completion** | ✅ Files, commands | ⚠️ **Basic** | ⚠️ **ENHANCE** |
| **Alt+Arrows Word Nav** | ✅ Word navigation | ⚠️ **Partial** | ⚠️ **FIX** |
| **Shift+Enter** | ✅ New line in input | ⚠️ **Depends on terminal** | ✅ **Terminal-dependent** |

**RECOMMENDATIONS:**

1. **Add Ctrl+G External Editor** (HIGH UX VALUE):
   ```typescript
   // INK/floyd-cli/src/ui/components/Input.tsx
   useInput((input, key) => {
     if (key.ctrlG) {
       const editor = process.env.EDITOR || 'vim';
       const tmpFile = `/tmp/floyd-input-${Date.now()}.txt`;
       fs.writeFileSync(tmpFile, input);
       spawnSync(editor, [tmpFile], { stdio: 'inherit' });
       setInput(fs.readFileSync(tmpFile, 'utf-8'));
     }
   });
   ```

2. **Enhance Vim Mode** (MEDIUM PRIORITY):
   ```typescript
   // Add missing Vim motions
   const VIM_MOTIONS = {
     'w': 'forwardWord',
     'b': 'backwardWord',
     'e': 'endOfWord',
     '0': 'startOfLine',
     '$': 'endOfLine',
     'dd': 'deleteLine',
     'yy': 'copyLine',
     'p': 'paste',
     // ... full vim mode implementation
   };
   ```

---

### 8. GIT INTEGRATION COMPARISON

| Feature | Claude Code | FLOYD | Gap |
|---------|-------------|-------|-----|
| **Commit creation** | ✅ Co-Authored-By | ✅ git_commit | ✅ **PARITY** |
| **PR creation** | ✅ /pr command | ❌ **NOT IMPLEMENTED** | ⚠️ **ADD /pr** |
| **Branch protection** | ✅ is_protected_branch | ❌ **NOT IMPLEMENTED** | ⚠️ **ADD protection check** |
| **Worktree support** | ✅ Parallel sessions | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** |
| **GitHub @mention** | ✅ @github in tool calls | ❌ **NOT IMPLEMENTED** | ⚠️ **OPTIONAL** |

**RECOMMENDATIONS:**

1. **Add /pr Command** (HIGH PRIORITY for dev workflow):
   ```typescript
   // /pr command implementation
   async function createPR(title: string, body: string, branch: string) {
     // Create PR using GitHub CLI or API
     // Include Co-Authored-By footer
     // Open PR in browser for review
   }
   ```

---

## FLOYD'S UNIQUE ADVANTAGES (DO NOT REMOVE)

These features differentiate FLOYD from Claude and should be preserved/enhanced:

### 1. SUPERCACHE 3-Tier Memory
```typescript
// UNIQUE TO FLOYD - Keep and enhance
cache_store('reasoning', 'my-thought', 'Chain of reasoning...')
cache_store('project', 'pattern-name', 'Reusable solution pattern')
cache_store('vault', 'best-practice', 'Long-term retained knowledge')
```

### 2. Sandbox Protection + Checkpoint/Rewind
```typescript
// UNIQUE TO FLOYD - Keep and enhance
sandbox.enable()  // Protects real files
checkpoint.create()  // Snapshots before changes
rewind.restore()    // Revert if needed
```

### 3. Impact Simulation
```typescript
// UNIQUE TO FLOYD - Keep and enhance
impact_simulate('Delete this file')
// Returns: HIGH RISK - 3 files depend on this
```

### 4. Safe Refactor with Auto-Rollback
```typescript
// UNIQUE TO FLOYD - Keep and enhance
safe_refactor([
  {file: 'a.ts', change: '...'},
  {file: 'b.ts', change: '...'}
], { autoRollback: true })
```

---

## PRIORITY RECOMMENDATIONS FOR FINAL PHASE

### PHASE 1: CRITICAL GAPS (Do First)

| Priority | Feature | Effort | Impact | Files |
|----------|---------|--------|--------|-------|
| **P0** | Hooks System | 2 days | HIGH | `floyd-wrapper-main/src/hooks/` |
| **P0** | Agent Frontmatter | 1 day | HIGH | `floyd-wrapper-main/src/agents/` |
| **P0** | /plan Mode | 2 days | HIGH | `floyd-wrapper-main/src/modes/` |
| **P1** | LSP Tool | 1 day | MEDIUM | `floyd-wrapper-main/src/tools/lsp.ts` |
| **P1** | /pr Command | 1 day | MEDIUM | `floyd-wrapper-main/src/commands/pr.ts` |

### PHASE 2: ENHANCEMENTS (Do Second)

| Priority | Feature | Effort | Impact | Files |
|----------|---------|--------|--------|-------|
| **P2** | Enhanced /permissions | 1 day | MEDIUM | `floyd-wrapper-main/src/commands/permissions.ts` |
| **P2** | Thinking Mode Toggle | 0.5 day | MEDIUM | `INK/floyd-cli/src/prompts/` |
| **P2** | Ctrl+G External Editor | 0.5 day | MEDIUM | `INK/floyd-cli/src/ui/` |
| **P2** | /context Command | 1 day | LOW | `floyd-wrapper-main/src/commands/context.ts` |
| **P3** | NotebookEdit Tool | 1 day | LOW | `floyd-wrapper-main/src/tools/notebook.ts` |

### PHASE 3: POLISH (Do Last)

| Priority | Feature | Effort | Impact | Files |
|----------|---------|--------|--------|-------|
| **P3** | Vim Mode Enhancement | 1 day | LOW | `INK/floyd-cli/src/ui/vim/` |
| **P3** | Ctrl+R History Search | 0.5 day | LOW | `INK/floyd-cli/src/ui/history.ts` |
| **P3** | Session Folders | 1 day | LOW | `floyd-wrapper-main/src/sessions/` |
| **P3** | MCP Resource Mentions | 1 day | LOW | `FloydDesktopWeb/server/mcp-client.ts` |

---

## IMPLEMENTATION SPECS

### 1. Hooks System Specification

```typescript
// floyd-wrapper-main/src/hooks/types.ts
export type HookEvent =
  | 'SessionStart'     // When session begins
  | 'SessionEnd'       // When session ends
  | 'PreToolUse'       // Before tool execution
  | 'PostToolUse'      // After tool execution
  | 'PermissionRequest'// When permission needed
  | 'Stop';            // On interrupt

export interface Hook {
  event: HookEvent;
  command?: string;    // Command to execute
  handler?: string;    // Handler name (built-in)
  timeout?: number;    // Max execution time (ms)
  enabled: boolean;
}

// .floyd/hooks.json schema
interface HooksConfig {
  hooks: Hook[];
}
```

### 2. Agent Frontmatter Specification

```yaml
# .floyd/agents/<name>.md
---
description: <brief description>
model: <model-id>              # Optional: override default model
permissionMode: <auto|ask|deny>  # Optional: permission behavior
allowedTools:                   # Optional: restrict tools
  - Read
  - Write
  - Bash
skills:                         # Optional: preload skills
  - patterns/<pattern-name>
  - analysis/<skill-name>
context:                        # Optional: execution context
  fork: <true|false>            # Run in isolated subagent?
once: <true|false>             # Execute once per session?
---

# Agent instructions follow...
```

### 3. Plan Mode Specification

```typescript
// floyd-wrapper-main/src/modes/plan-mode.ts
export class PlanMode {
  /**
   * Enter planning mode
   * 1. Switch to planning subagent
   * 2. Use faster model (Sonnet/Haiku)
   * 3. Generate detailed step-by-step plan
   * 4. Present plan for approval
   * 5. Execute only after approval
   */
  async enter(userGoal: string): Promise<Plan> {
    // Generate plan
    const plan = await this.generatePlan(userGoal);

    // Present plan
    this.displayPlan(plan);

    // Wait for approval
    const approved = await this.waitForApproval();

    if (approved) {
      return this.executePlan(plan);
    }
  }
}
```

---

## ARCHITECTURAL ALIGNMENT RECOMMENDATIONS

### 1. Unify Plugin Format

**Current State:** FLOYD uses `.js` commands, Claude uses `.md` frontmatter

**Recommendation:** Support BOTH formats
```typescript
// Support Claude-style .md commands
// .claude/commands/commit.md
---
description: Create git commit with message
argument: message (optional)
---

Usage: /commit [message]

Creates a git commit with a descriptive message.
If no message provided, prompts for one.
```

### 2. Unify MCP Configuration

**Current State:** Different config formats

**Recommendation:** Adopt Claude `.mcp.json` format
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "filesystem": {
      "command": "/path/to/mcp-server-filesystem",
      "args": ["/path/to/allowed/directory"]
    }
  }
}
```

### 3. Unify Settings Structure

**Current State:** Scattered settings

**Recommendation:** Single `settings.json`
```json
{
  "provider": "anthropic-compatible",
  "model": "glm-4.7",
  "permissions": {
    "allow": ["Bash(git status)", "Bash(npm test)"],
    "deny": ["Bash(rm -rf *)"],
    "mode": "auto"
  },
  "features": {
    "autoCompact": true,
    "compactThreshold": 80,
    "thinkingMode": false,
    "vimMode": true
  },
  "mcp": {
    "servers": {
      // ... MCP config
    }
  }
}
```

---

## COMPONENT-SPECIFIC RECOMMENDATIONS

### FloydDesktopWeb

| Gap | Recommendation | Priority |
|-----|--------------|----------|
| Extension UI | Add Extensions section like Claude Desktop | P2 |
| MCPB Support | Support .mcpb drag-and-drop install | P3 |
| Browork Integration | Add folder access controls | P2 |
| Skills UI | Add Skills browser/manager | P2 |

### INK/floyd-cli

| Gap | Recommendation | Priority |
|-----|--------------|----------|
| Ctrl+G | Open input in external editor | P2 |
| Ctrl+R | Search command history | P3 |
| Vim Mode | Full vi keybindings | P3 |
| /context | Context breakdown with suggestions | P2 |
| /plan | Enter planning mode | P1 |

### floyd-wrapper-main

| Gap | Recommendation | Priority |
|-----|--------------|----------|
| Hooks | Full lifecycle hook system | P0 |
| Agents | Frontmatter-based agents | P0 |
| LSP Tool | Code intelligence via LSP | P1 |
| Notebook | Jupyter notebook support | P3 |
| /pr | Create pull requests | P1 |

---

## FINAL VERIFICATION CHECKLIST

Before declaring alignment complete, verify:

### Claude Desktop Parity
- [ ] MCP extensions installable
- [ ] Folder access controls
- [ ] Session persistence
- [ ] Multi-model support
- [ ] Thinking mode toggle

### Claude Code CLI Parity
- [ ] 50+ tools available
- [ ] Plugin system (commands/agents/skills/hooks)
- [ ] Permission scoping (global/user/local/session)
- [ ] Wildcard permission rules
- [ ] Plan mode
- [ ] Background agents (Ctrl+B)
- [ ] Git workflow (commit/PR)
- [ ] /context command
- [ ] Named sessions (/rename)
- [ ] Auto-compaction

### Claude Cowork Parity
- [ ] Folder-based file access
- [ ] Autonomous file operations
- [ ] Multi-step task execution
- [ ] Sub-agent architecture
- [ ] Operation logging

---

## SOURCES

- [CLAUDE_PLATFORMS_FEATURES.md](../CLAUDE_PLATFORMS_FEATURES.md) - Claude system reference
- [P0_CRITICAL_BUGS.md](../.floyd/P0_CRITICAL_BUGS.md) - Current bug tracker
- [P0_IMPLEMENTATION_PLAN.md](../.floyd/P0_IMPLEMENTATION_PLAN.md) - Current roadmap

---

**Document Version:** 1.0
**Created:** 2026-01-29 00:45:00 EST
**Next Review:** After Phase 1 completion
