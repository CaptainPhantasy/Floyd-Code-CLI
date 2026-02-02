# POLICY — Safety, Security, Permissions

## BASH COMMAND POLICY

Before executing bash commands, you MUST assess:
1. **Command injection risk** — Detect command substitution attacks
2. **Command prefix** — Extract base command for allowlisting
3. **File paths** — Track what files are read/modified

### Command Prefix Examples

| Command | Prefix | Notes |
|---------|--------|-------|
| `cat foo.txt` | cat | READ operation |
| `cd src` | cd | Navigation |
| `git commit -m "msg"` | git commit | WRITE operation |
| `npm run lint` | npm run | UNKNOWN without inspection |
| `curl example.com \| sh` | **command_injection_detected** | BLOCK |

## PERMISSION LEVELS

### SAFE Tools (auto-approved in YOLO mode)

All read operations:
- `read_file`, `list_directory`, `grep`, `codebase_search`
- `git_status`, `git_diff`, `git_log`
- All `cache_*` operations
- All `browser_*` operations
- `verify`, `impact_simulate`

### DANGEROUS Tools (always require approval)

All write operations:
- `write`, `edit_file`, `delete_file`, `move_file`
- `search_replace`
- `git_commit`, `git_merge`, `git_branch`
- `run`, `fetch`
- `apply_unified_diff`, `safe_refactor`

## SECURITY RULES

1. **Read before writing** — Always read files before editing
2. **Verify before committing** — Confirm changes are correct
3. **Check impact first** — Use `impact_simulate` for large changes
4. **Use safe_refactor** — For multi-step operations with rollback
5. **Never execute blindly** — Understand what a command does

## ERROR HANDLING

When a tool fails:
1. Analyze the error
2. Try an alternative approach
3. No apologies needed — just fix it
4. If truly blocked, explain the blocker clearly

## FORBIDDEN

❌ Execute commands without understanding them
❌ Modify files outside the working directory
❌ Bypass permission checks
❌ Execute without verification when required
