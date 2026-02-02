# Floyd Wrapper Engineering Documentation

**Version:** 0.1.0
**Last Updated:** 2026-01-25
**Status:** Production-Ready with documented limitations

---

## System Architecture Overview

The Floyd Wrapper is a permission-gated agentic execution system built on GLM-4.7. It provides multiple execution modes with configurable safety boundaries.

### Core Components

| Component | File | Responsibility |
|-----------|------|-----------------|
| **CLI Entry** | `src/cli.ts` | TTY detection, readline management, signal handling |
| **Execution Engine** | `src/agent/execution-engine.ts` | Agentic loop, mode-based permission logic |
| **Permission Manager** | `src/permissions/permission-manager.ts` | Permission requests, auto-confirm logic |
| **Tool Registry** | `src/tools/index.ts` | Tool registration, execution, permission levels |
| **Stream Handler** | `src/streaming/stream-handler.ts` | GLM-4.7 streaming response processing |

---

## Permission System Design

### Permission Levels

Tools are categorized into three permission levels:

| Level | Description | Auto-approved in YOLO | Requires prompt in TTY | Denied in piped mode |
|-------|-------------|----------------------|----------------------|---------------------|
| **none** | Read-only operations | Yes | No | No (always allowed) |
| **moderate** | Non-destructive writes | Yes | Yes | Yes (no prompt possible) |
| **dangerous** | Destructive operations | No* | Yes | Yes (no prompt possible) |

*Dangerous tools require confirmation even in YOLO mode when a TTY is available.

### Tool Categorization

#### SAFE TOOLS (permission: none)
Always execute without prompting. Safe for automation.

- `list_directory` - List directory contents
- `read_file` - Read file contents
- `codebase_search` - Search codebase
- `git_status` - Show git status
- `git_diff` - Show git diff
- `git_log` - Show git log
- `git_is_protected` - Check branch protection
- `verify` - Verification operations
- `impact_simulate` - Simulate changes
- `cache_*` - Most cache operations (except clear)

#### MODERATE TOOLS (permission: moderate)
Auto-approved in YOLO mode (TTY only). Require confirmation in ASK mode. Denied in piped mode.

- `fetch` - HTTP requests
- `git_branch` - Branch operations
- `git_stage` - Stage files
- `git_unstage` - Unstage files
- `cache_store` - Store to cache (some tiers)

#### DANGEROUS TOOLS (permission: dangerous)
Require confirmation in ALL modes (when TTY available). Denied in piped mode.

- `write` - Create/overwrite files
- `edit_file` - Edit files (search/replace)
- `search_replace` - Global search/replace
- `run` - Execute terminal commands
- `delete_file` - Delete files (with backup)
- `move_file` - Move/rename files
- `apply_unified_diff` - Apply patches
- `edit_range` - Edit specific line ranges
- `insert_at` - Insert at line
- `delete_range` - Delete line ranges
- `safe_refactor` - Multi-step refactoring
- `git_commit` - Commit changes
- `git_merge` - Merge branches
- `browser_click` - Browser interaction
- `browser_type` - Browser typing
- `cache_clear` - Clear cache

---

## Execution Modes

### ASK Mode (default)
- All tools with `permission: none` execute automatically
- Tools with `permission: moderate` or `dangerous` require user confirmation
- **Best for:** Interactive development, learning the system

### YOLO Mode
- Auto-approves `permission: none` tools (safe)
- Auto-approves `permission: moderate` tools (in TTY mode only)
- **STILL requires confirmation** for `permission: dangerous` tools (in TTY mode)
- In piped/non-TTY mode: dangerous tools are DENIED (cannot prompt)
- **Best for:** Interactive development with reduced friction

### PLAN Mode
- Only allows `permission: none` tools (read-only)
- All write operations are blocked
- **Best for:** Planning, analysis, code review

### AUTO Mode
- Falls back to ASK mode behavior
- Future: Agent will select mode based on request analysis

### DIALOGUE Mode
- One-line-at-a-time output display
- Useful for reading long responses
- Permission behavior same as ASK mode

---

## Piped Input Limitations

### The Problem
When stdin is piped (non-TTY mode), the wrapper cannot create interactive readline interfaces for permission prompts. Attempting to do so causes `ERR_USE_AFTER_CLOSE` crashes.

### The Solution
The permission system detects `!process.stdin.isTTY` and:

1. **Auto-approves** `permission: none` tools (safe read operations)
2. **Denies** `permission: moderate` tools with clear warning
3. **Denies** `permission: dangerous` tools with clear warning

### Error Message
```
[WARN] Permission denied: Cannot prompt in non-interactive mode (piped input).
[INFO] For automation, use: --mode yolo (auto-approves safe tools) or --mode plan (read-only)
```

### Workarounds for Automation

1. **Use PLAN mode** for read-only operations:
   ```bash
   printf "List all files" | floyd --mode plan
   ```

2. **Pre-create files** and use safe editing tools:
   ```bash
   touch output.txt
   printf "Edit output.txt" | floyd --mode yolo  # May still fail for edit_file
   ```

3. **Interactive TTY mode** for full automation:
   ```bash
   # Use expect or similar tools to automate prompts
   expect -c 'spawn floyd --mode yolo; expect "Approve"; send "yes\n"; interact'
   ```

---

## Failure Mode Catalog

### E001: TTY Detection Failure
**Symptom:** Permission prompt causes `ERR_USE_AFTER_CLOSE`
**Cause:** Code attempts readline on piped stdin without checking TTY
**Fix:** Always check `process.stdin.isTTY` before creating readline
**Status:** FIXED in v0.1.0

### E002: YOLO Mode Confusion
**Symptom:** User expects YOLO to auto-approve all tools
**Cause:** Ambiguous documentation about "safe tools"
**Fix:** Clarified mode descriptions to specify exact permission levels
**Status:** FIXED in v0.1.0

### E003: Automation Blocking
**Symptom:** Cannot use Floyd in scripts due to permission prompts
**Cause:** Dangerous tools require prompts even in YOLO mode
**Mitigation:** Use PLAN mode for read-only, interactive TTY for writes
**Status:** BY DESIGN (security-first)

---

## Tool Contracts

### Permission Request Flow

```typescript
// 1. Tool execution requested
onToolStart(toolName, input)

// 2. Check permission level
const toolDef = toolRegistry.get(toolName);
const permissionLevel = toolDef.permission; // 'none' | 'moderate' | 'dangerous'

// 3. Apply mode-based logic
if (mode === 'yolo') {
  if (permissionLevel === 'dangerous') {
    permissionGranted = await permissionManager.requestPermission(toolName, input);
  } else {
    permissionGranted = true; // Auto-approve safe/moderate
  }
}

// 4. Check TTY status for permission prompt
if (!process.stdin.isTTY) {
  logger.warn('Permission denied: Cannot prompt in non-interactive mode');
  return false;
}

// 5. Execute if granted
if (permissionGranted) {
  result = await toolRegistry.execute(toolName, input);
}
```

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: 'PERMISSION_DENIED' | 'PLAN_MODE_BLOCK',
    message: 'Tool execution blocked. You are in PLAN mode, which permits only read-only operations.'
  }
}
```

---

## Capability Map

### Read Operations (Always Available)
- Directory listing: `list_directory`
- File reading: `read_file`
- Code search: `codebase_search`, `grep`
- Git status: `git_status`, `git_diff`, `git_log`

### Write Operations (Require TTY + Confirmation)
- File creation: `write` (dangerous)
- File editing: `edit_file`, `edit_range`, `insert_at` (dangerous)
- Command execution: `run` (dangerous)

### Automation-Friendly Operations
- Cache operations: Most `cache_*` tools
- Verification: `verify` tool
- Simulation: `impact_simulate`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-25 | Initial production release with hardened permission system |
| 0.1.0 | 2026-01-25 | Fixed TTY detection for piped input (E001) |
| 0.1.0 | 2026-01-25 | Clarified YOLO mode documentation (E002) |

---

## References

- Source: `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/`
- Test Reports: `floydtest1.md`, `floydtest2.md`, `floydtest3.md`
- Agent Instructions: `CLAUDE.md`
