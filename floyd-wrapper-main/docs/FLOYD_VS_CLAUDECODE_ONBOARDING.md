# Floyd Wrapper vs Claude Code CLI
## Feature Comparison & Onboarding Guide

**Last Updated:** January 2026
**Purpose:** Help users transitioning from Claude Code CLI understand Floyd Wrapper's capabilities, identify alignment gaps, and document improvements.

---

## Quick Reference Table

| Feature | Claude Code | Floyd Wrapper | Status |
|---------|-------------|---------------|--------|
| **Session Management** |
| Interrupt without kill (Ctrl+C) | ✅ State-aware | ✅ InterruptManager | ✅ ALIGNED |
| Session persistence | ✅ Auto-resume | ⚠️ Manual | 🔧 NEEDS WORK |
| Context window management | ✅ Auto-compact | ⚠️ Basic | 🔧 NEEDS WORK |
| **Safety & Recovery** |
| Auto-checkpoints | ✅ Before destructive ops | ✅ CheckpointManager | ✅ ALIGNED |
| Undo/Rewind | ✅ `/undo` command | ✅ `/rewind` command | ✅ ALIGNED |
| Sandbox mode | ✅ Container isolation | ✅ Directory-based | ✅ ALIGNED |
| Dry-run preview | ✅ Built-in | ✅ DryRunSandbox | ✅ ALIGNED |
| **Permissions** |
| Permission levels | ✅ auto/ask/deny | ✅ auto/ask/deny | ✅ ALIGNED |
| YOLO mode | ✅ `--dangerously-skip-permissions` | ⚠️ Flag exists, needs sandbox auto-enable | 🔧 PARTIAL |
| Tool approval UI | ✅ Rich diff preview | ⚠️ Basic | 🔧 NEEDS WORK |
| **Tools** |
| File operations | ✅ read/write/edit | ✅ read/write/edit/delete/move | ✅ IMPROVED |
| Search (ripgrep) | ✅ `rg` integration | ✅ `grep_search` tool | ✅ ALIGNED |
| Git operations | ✅ Full git suite | ⚠️ Basic (status, diff, merge) | 🔧 NEEDS WORK |
| Browser automation | ✅ Puppeteer | ⚠️ Planned | 🔧 TODO |
| Shell commands | ✅ `bash` tool | ✅ `run_command` tool | ✅ ALIGNED |
| **MCP Integration** |
| MCP server support | ✅ Native | ⚠️ Planned | 🔧 TODO |
| Custom tools via MCP | ✅ | ⚠️ | 🔧 TODO |
| **UI/UX** |
| Streaming output | ✅ Token streaming | ✅ Token streaming | ✅ ALIGNED |
| Thinking display | ✅ Extended thinking | ✅ Extended thinking | ✅ ALIGNED |
| Markdown rendering | ✅ Rich terminal | ⚠️ Basic | 🔧 NEEDS WORK |
| Syntax highlighting | ✅ | ⚠️ Partial | 🔧 NEEDS WORK |
| **Slash Commands** |
| `/help` | ✅ | ✅ | ✅ ALIGNED |
| `/clear` | ✅ | ✅ | ✅ ALIGNED |
| `/compact` | ✅ Context compression | ⚠️ Planned | 🔧 TODO |
| `/cost` | ✅ Token/cost tracking | ⚠️ Planned | 🔧 TODO |
| `/doctor` | ✅ System diagnostics | ⚠️ Planned | 🔧 TODO |
| `/init` | ✅ CLAUDE.md generation | ⚠️ FLOYD.md planned | 🔧 TODO |
| `/checkpoint` | ✅ | ✅ NEW | ✅ IMPROVED |
| `/rewind` | ✅ | ✅ NEW | ✅ ALIGNED |
| `/sandbox` | ⚠️ Implicit | ✅ Explicit control | ✅ IMPROVED |

---

## Feature Deep Dives

### 1. Interrupt Handling

#### Claude Code Behavior
- Single Ctrl+C during tool execution: Cancel current tool, return to prompt
- Single Ctrl+C while idle: Show exit confirmation
- Double Ctrl+C: Force exit
- Preserves conversation context on interrupt

#### Floyd Wrapper Behavior
```
State: idle → Ctrl+C → confirm_exit (or ignore)
State: thinking → Ctrl+C → cancel_turn
State: tool_executing → Ctrl+C → abort_tool (AbortController)
State: streaming → Ctrl+C → cancel_turn
3 rapid Ctrl+C → force_exit
```

**Key Classes:**
- `InterruptManager` - Singleton state machine
- `InterruptableState` enum - `idle | thinking | tool_executing | tool_pending | streaming`
- `InterruptEvent` - Event emitter for interrupt callbacks

**Usage:**
```typescript
import { getInterruptManager, InterruptableState } from '@cursem/floyd-wrapper';

const im = getInterruptManager();
im.setState(InterruptableState.tool_executing);

// Get abort signal for cancellable operations
const signal = im.getAbortSignal();
await fetch(url, { signal });
```

---

### 2. Auto-Checkpoints

#### Claude Code Behavior
- Creates automatic backups before file modifications
- Stored in `.claude/backups/`
- `/undo` command restores last state
- Limited to most recent change

#### Floyd Wrapper Behavior
- Creates snapshots before ANY dangerous tool execution
- Snapshots include full file content + metadata (hash, size, timestamps)
- Multiple checkpoints retained with configurable limits
- Explicit restore to any checkpoint

**Dangerous Tools (auto-checkpoint triggers):**
```typescript
const DANGEROUS_TOOLS = [
  'delete_file',
  'move_file',
  'write_file',
  'edit_file',
  'apply_patch',
  'run_command',
  'git_merge',
  'git_reset',
];
```

**Key Classes:**
- `CheckpointManager` - Manages checkpoint lifecycle
- `FileSnapshotManager` - Creates file snapshots with content hashing

**Commands:**
```
/checkpoint list          - Show all checkpoints
/checkpoint create [name] - Manual checkpoint
/checkpoint restore <id>  - Restore to checkpoint
/checkpoint clear         - Delete all checkpoints
/checkpoint stats         - Show storage usage

/rewind <checkpoint-id>   - Quick restore shortcut
/rewind                   - Restore most recent
```

**Storage:** `~/.floyd/checkpoints/`

---

### 3. Sandbox Mode

#### Claude Code Behavior
- Implicit sandboxing in certain contexts
- Container-based isolation (Docker)
- Changes applied atomically after review

#### Floyd Wrapper Behavior
- Explicit sandbox control via `/sandbox` commands
- Directory-based isolation (copies project to temp)
- Review diff before commit
- Also supports `DryRunSandbox` for virtual-only tracking

**Commands:**
```
/sandbox start   - Begin sandboxed session
/sandbox status  - Show sandbox state and changes
/sandbox diff    - Preview all changes
/sandbox commit  - Apply changes to real project
/sandbox discard - Throw away all changes
```

**Key Classes:**
- `SandboxManager` - Full directory copy sandbox
- `DryRunSandbox` - Virtual tracking only (no file copies)

**Exclude Patterns (not copied to sandbox):**
```
node_modules, .git, .floyd, dist, build,
.next, .cache, __pycache__, venv, target, vendor
```

---

## Gaps to Address (Priority Order)

### P0 - Critical Alignment Gaps

| Gap | Claude Code | Floyd Current | Recommendation |
|-----|-------------|---------------|----------------|
| `/compact` command | Auto-summarizes to free context | Not implemented | Implement context compression |
| Session persistence | Resume on crash/restart | Lost on exit | Add session serialization |
| MCP support | Native tool extension | Not implemented | High priority for extensibility |

### P1 - Important Gaps

| Gap | Claude Code | Floyd Current | Recommendation |
|-----|-------------|---------------|----------------|
| `/cost` tracking | Shows tokens + estimated cost | Not implemented | Add usage tracking |
| `/doctor` diagnostics | Checks environment setup | Not implemented | Add system health check |
| Rich markdown/syntax | Full terminal rendering | Basic output | Integrate marked + chalk |
| Git full suite | commit, push, pull, branch, etc. | status, diff, merge only | Expand git tools |

### P2 - Nice to Have

| Gap | Claude Code | Floyd Current | Recommendation |
|-----|-------------|---------------|----------------|
| Browser automation | Puppeteer built-in | Not implemented | Add browser tool |
| Image support | Vision model integration | Not implemented | Add image tools |
| `/init` command | Generates CLAUDE.md | Not implemented | Generate FLOYD.md |

---

## Improvements Over Claude Code

Floyd Wrapper includes several enhancements:

### 1. Explicit Sandbox Control
- Claude: Implicit sandboxing, user unsure when active
- Floyd: `/sandbox start|status|diff|commit|discard` - full control

### 2. Multi-Checkpoint History
- Claude: Single undo step
- Floyd: Named checkpoints, restore to any point

### 3. Receipt System
- Claude: Basic tool results
- Floyd: `ToolReceipt` with status, warnings, duration, next_actions

### 4. Hardened Prompts
- Claude: Standard system prompts
- Floyd: Modular prompt system (capabilities.ts, rules.ts)

### 5. Tool Registry Architecture
- Claude: Fixed tool set
- Floyd: Dynamic registration, category-based organization, Zod validation

---

## Migration Checklist

If coming from Claude Code CLI:

- [ ] **Interrupt handling** works the same (Ctrl+C)
- [ ] **Permissions** use same levels (`--permission-mode auto|ask|deny`)
- [ ] **File tools** are compatible (read_file, write_file, etc.)
- [ ] `/checkpoint` replaces `/undo` (more powerful)
- [ ] `/sandbox` is now explicit (start it manually)
- [ ] No `/compact` yet - manage context manually
- [ ] No `/cost` yet - check logs for token usage
- [ ] No MCP yet - use built-in tools only

---

## Command Reference (Floyd Equivalents)

| Claude Code | Floyd Wrapper | Notes |
|-------------|---------------|-------|
| `/undo` | `/rewind` | Floyd supports multiple checkpoints |
| `/clear` | `/clear` | Same |
| `/help` | `/help` | Same |
| `/compact` | ❌ | Not yet implemented |
| `/cost` | ❌ | Not yet implemented |
| `/doctor` | ❌ | Not yet implemented |
| `/init` | ❌ | Not yet implemented |
| `--dangerously-skip-permissions` | `--yolo` | Same effect |
| `--print` | ❌ | Print mode not implemented |
| `--continue` | ❌ | Session resume not implemented |

---

## Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│  CLI Entry → Session Manager → Tool Executor → API Client       │
│      ↓              ↓               ↓             ↓             │
│  readline     MCP Registry    Bash/Browser    Anthropic         │
│      ↓              ↓               ↓             ↓             │
│  Compact      Custom Tools    Sandboxing    Streaming           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FLOYD WRAPPER ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│  FloydCLI → FloydAgentEngine → ToolRegistry → GLM API Client    │
│      ↓              ↓               ↓             ↓             │
│  Terminal    InterruptManager   Tools/*      OpenRouter/        │
│      ↓              ↓               ↓        Anthropic          │
│  SlashCmd    CheckpointManager  Sandbox      Streaming          │
│      ↓              ↓               ↓             ↓             │
│  Commands    FileSnapshot      DryRun       TokenStream         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps for Full Alignment

1. **Implement `/compact`** - Context window management is critical
2. **Add session persistence** - Resume interrupted sessions
3. **MCP integration** - Allow custom tool extensions
4. **Rich terminal output** - Syntax highlighting, markdown rendering
5. **Full git tool suite** - commit, push, pull, branch, etc.
6. **Usage tracking** - Token counts and cost estimation

---

*This document should be updated as features are added to Floyd Wrapper.*
