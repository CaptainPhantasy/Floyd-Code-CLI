# GLM-4.7 FLASH — Tool Usage Patterns

## HIGH-FREQUENCY PATTERNS

These are the patterns you will execute 80% of the time. Master these.

### Pattern 1: Understand and Edit

**When:** User asks to modify code

```
read_file({ "file_path": "/path/to/file.ts" })
→ understand context
→ edit_file({ "file_path": "...", "old_string": "...", "new_string": "..." })
→ verify({ "type": "file_contains", "file_path": "...", "target": "new code" })
```

### Pattern 2: Batch Read

**When:** Need to understand multiple files

```
[read_file("src/a.ts"), read_file("src/b.ts"), read_file("src/c.ts")]
```

GLM-4.7-Flash handles batched tool calls efficiently. Always batch independent file reads.

### Pattern 3: Search and Fix

**When:** Finding and fixing bugs

```
grep({ "pattern": "bug|error|TODO", "path": "/src" })
→ [get locations]
→ read_file({ "file_path": "bug-location.ts" })
→ edit_file({ "file_path": "...", "old_string": "buggy code", "new_string": "fixed code" })
→ verify({ "type": "command_succeeds", "target": "npm test -- --grep 'bug'" })
```

### Pattern 4: Safe Multi-File Change

**When:** Refactoring across files

```
impact_simulate({ "action": "Extract auth logic", "target_files": ["a.ts", "b.ts", "c.ts"] })
→ [returns risk level]
→ safe_refactor({
    "steps": [
      { "tool": "edit_file", "args": { "file_path": "a.ts", ... } },
      { "tool": "edit_file", "args": { "file_path": "b.ts", ... } },
      { "tool": "run", "args": { "command": "npm test" } }
    ],
    "rollback_on_failure": true
  })
→ verify
```

### Pattern 5: Cache Reuse

**When:** Solving a problem you've seen before

```
cache_retrieve({ "tier": "vault", "key": "jwt-auth-pattern" })
→ [if hit]
→ apply pattern
→ [if miss]
→ solve → cache_store_pattern({ "key": "...", "value": "..." })
```

### Pattern 6: Git Workflow

**When:** Committing changes

```
git_status
→ git_diff (review)
→ git_stage({ "paths": ["modified/file.ts"] })
→ run({ "command": "npm test -- --grep 'modified'" })
→ git_commit({ "message": "Fix: Description of change" })
```

---

## PARALLEL EXECUTION RULES

### WHEN TO BATCH

**Independent file reads:** YES
```
[read_file("a.ts"), read_file("b.ts"), read_file("c.ts")]
```

**Independent searches:** YES
```
[grep({ "pattern": "TODO" }), codebase_search({ "query": "auth" })]
```

**Independent writes:** NO — Must verify sequentially

### WHEN TO SEQUENTIAL

**Dependent edits:** Verify after each
```
edit_file(file1) → verify → edit_file(file2) → verify
```

**Tests:** Run after all changes
```
[multiple edits] → run(tests) → verify
```

---

## ERROR RECOVERY PATTERNS

### File Not Found
```
list_directory({ "path": "/path/to/verify" })
→ [find correct path]
→ read_file({ "file_path": "/correct/path" })
```

### Permission Denied
```
→ Check file permissions
→ ask_user({ "prompt": "Need write permission for /path/to/file" })
```

### Command Failed
```
→ Read error message
→ [try alternative approach]
→ verify({ "type": "command_succeeds", "target": "alternative-command" })
```

### Merge Conflict
```
→ read_file(conflict markers)
→ [resolve manually]
→ git_stage
→ git_commit
```
