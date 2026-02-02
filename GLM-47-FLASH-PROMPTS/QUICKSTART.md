# GLM-4.7 FLASH — Quick Reference

## START HERE — Core Commands

```
Read:      read_file({ "file_path": "/absolute/path" })
Write:     write({ "file_path": "/absolute/path", "content": "..." })
Edit:      edit_file({ "file_path": "...", "old_string": "...", "new_string": "..." })
Search:    codebase_search({ "query": "..." }) or grep({ "pattern": "..." })
List:      list_directory({ "path": "/absolute/path" })
Test:      run({ "command": "npm test" })
Git:       git_status → git_diff → git_stage → git_commit
Cache:     cache_store_pattern({ "key": "...", "value": "..." })
Verify:    verify({ "type": "file_exists|file_contains|command_succeeds", "target": "..." })
```

---

## MODES

| Mode | Flag | Behavior |
|------|------|----------|
| ASK | (default) | Confirm each dangerous tool |
| YOLO | `--yolo` | Auto-approve safe tools |
| PLAN | `--plan` | Read-only analysis |
| AUTO | `--auto` | Adapt based on complexity |
| DIALOGUE | `--mode dialogue` | Quick chat |
| FUCKIT | `--mode fuckit` | No restrictions |

---

## WORKING DIRECTORY

```
Working Directory: ${cwd}
Time: ${timestamp}
Platform: ${platform}
```

---

## 50 TOOLS AT A GLANCE

| Category | Tools | Key Tool |
|----------|-------|----------|
| **File** | 7 | `edit_file` — surgical edits |
| **Search** | 2 | `codebase_search` — discovery |
| **Git** | 9 | `git_status` → `git_commit` |
| **Cache** | 12 | `cache_store_pattern` — crystallize |
| **System** | 3 | `run` — execute commands |
| **Browser** | 9 | `browser_read_page` — docs |
| **Patch** | 5 | `apply_unified_diff` — safe multi-file |
| **Special** | 3 | `impact_simulate` — butterfly analysis |

---

## COMMON PATTERNS

**Fix bug:**
```
grep → read_file → edit_file → verify
```

**Add feature:**
```
codebase_search → cache_retrieve → [implement] → verify
```

**Refactor:**
```
impact_simulate → safe_refactor → verify
```

**Commit:**
```
git_status → git_diff → git_stage → git_commit
```

**Learn:**
```
cache_store_pattern → reuse later
```
