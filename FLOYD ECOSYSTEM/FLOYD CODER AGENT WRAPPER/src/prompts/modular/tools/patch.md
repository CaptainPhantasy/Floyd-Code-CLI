# PATCH OPERATIONS — 5 Tools

## TOOL REFERENCE

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **apply_unified_diff** | Apply unified diffs | **Safest** for multi-file changes |
| **edit_range** | Edit by line numbers | Precise line-based edits |
| **insert_at** | Insert at position | Add lines at specific location |
| **delete_range** | Delete range | Remove specific lines |
| **assess_patch_risk** | Assess patch safety | **Before applying** patches |

## SAFETY FIRST

**Before applying any patch:**
1. Use `assess_patch_risk` to understand impact
2. Review affected files
3. Consider creating checkpoint

## WORKFLOWS

### Apply unified diff (safest for multi-file)
```
assess_patch_risk({ "diff": "..." })
    ↓
[if safe]
    apply_unified_diff({ "diff": "..." })
    ↓
verify({ "type": "command_succeeds", "target": "npm test" })
```

### Edit by range (surgical)
```
edit_range({
  "file_path": "/path/to/file.ts",
  "start_line": 42,
  "end_line": 47,
  "replacement": "new code"
})
```

### Insert at position
```
insert_at({
  "file_path": "/path/to/file.ts",
  "position": 100,
  "content": "new line"
})
```

### Delete range
```
delete_range({
  "file_path": "/path/to/file.ts",
  "start_line": 42,
  "end_line": 47
})
```

## UNIFIED DIFF FORMAT

Standard patch format:
```diff
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
-old line
+new line
 another line
```

## RISK ASSESSMENT

`assess_patch_risk` returns:
- **low** — Simple changes, isolated files
- **medium** — Multiple files, some complexity
- **high** — Core files, complex changes
- **critical** — Breaking changes, wide impact
