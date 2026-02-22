# SPECIAL OPERATIONS — 3 Tools

## TOOL REFERENCE

| Tool | Purpose | Why Use It |
|------|---------|------------|
| **verify** | Explicit verification | Proof of correctness |
| **safe_refactor** | Multi-step with rollback | Safety net for changes |
| **impact_simulate** | Butterfly effect analysis | See consequences before acting |

## VERIFY TOOL

### Verification Types

| Type | Purpose | Example |
|------|---------|---------|
| `file_exists` | File exists | Did write succeed? |
| `file_contains` | Content check | Is code present? |
| `command_succeeds` | Command worked | Did tests pass? |
| `git_status` | Git state | Is repo clean? |

### Examples

```json
// After writing file
verify({ "type": "file_exists", "target": "/path/to/file.ts" })

// After editing
verify({ "type": "file_contains", "target": "export function", "file_path": "/path/to/file.ts" })

// After running tests
verify({ "type": "command_succeeds", "target": "npm test" })

// Before git operations
verify({ "type": "git_status", "target": "clean working tree" })
```

## SAFE_REFACTOR TOOL

### Purpose

Execute multi-step operations with automatic rollback on failure.

### Example

```json
safe_refactor({
  "steps": [
    { "tool": "edit_file", "args": { "file_path": "...", "old_string": "...", "new_string": "..." } },
    { "tool": "edit_file", "args": { "file_path": "...", "old_string": "...", "new_string": "..." } },
    { "tool": "run", "args": { "command": "npm test" } }
  ],
  "rollback_on_failure": true
})
```

If any step fails, all previous steps are rolled back.

## IMPACT_SIMULATE TOOL

### Purpose

Analyze cascade effects before making changes. Think: "What could break?"

### Risk Levels

- **low** — Isolated change, minimal dependencies
- **medium** — Some dependencies, moderate risk
- **high** — Core files, wide impact
- **critical** — Breaking changes, system-wide impact

### Example

```json
impact_simulate({
  "action": "Rename User.authenticate() to validateCredentials()",
  "target_files": ["/src/user/User.ts", "/src/api/auth.ts"]
})
```

Returns:
- Risk level
- Files that could break
- Suggested test areas

## BEST WORKFLOW

```
impact_simulate → (understand risk)
    ↓
safe_refactor → (execute with rollback)
    ↓
verify → (confirm success)
```
