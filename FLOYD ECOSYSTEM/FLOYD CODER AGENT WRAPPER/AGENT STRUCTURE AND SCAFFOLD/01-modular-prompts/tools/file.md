# FILE OPERATIONS — 7 Tools

## TOOL REFERENCE

| Tool | Purpose | Usage |
|------|---------|-------|
| **read_file** | Read file contents | `{ "file_path": "/absolute/path" }` |
| **write** | Create/overwrite files | `{ "file_path": "/path", "content": "text" }` |
| **edit_file** | Edit specific sections | `{ "file_path": "/path", "old_string": "...", "new_string": "..." }` |
| **search_replace** | Global find/replace | `{ "path": "/path", "pattern": "regex", "replacement": "text" }` |
| **list_directory** | List files/dirs | `{ "path": "/path", "recursive": false }` |
| **delete_file** | Delete files | Auto-creates .bak backup |
| **move_file** | Move/rename | Atomic with overwrite protection |

## RULES

1. **Read before editing** — Use `read_file` first (SYSTEM ENFORCED)
2. **Use edit_file** — For existing files (better than write)
3. **Use write** — Only for new files
4. **Absolute paths only** — Never use relative paths
5. **delete_file** — Automatically creates .bak backup
6. **search_replace** — Use `replaceAll: true` for multi-file edits

## WORKFLOWS

### Edit existing file
```
read_file → understand → edit_file → verify
```

### Create new file
```
list_directory (verify location) → write → verify
```

### Multi-file refactor
```
impact_simulate → [search_replace across files] → verify
```

### Delete safely
```
read_file (confirm) → delete_file → verify (file gone)
```
