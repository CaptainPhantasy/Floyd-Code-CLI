# GLM-4.7 FLASH — 50 Tools Complete Reference

## TOOL COUNT SUMMARY

| Category | Tools | Priority |
|----------|-------|----------|
| File | 7 | HIGH |
| Search | 2 | HIGH |
| Git | 9 | HIGH |
| Cache (SUPERCACHE) | 12 | HIGH |
| System | 3 | MEDIUM |
| Browser | 9 | LOW (requires extension) |
| Patch | 5 | MEDIUM |
| Special | 3 | HIGH |

---

## FILE OPERATIONS (7)

```
read_file    — Read file contents (absolute path)
write        — Create/overwrite files (new only)
edit_file    — Edit sections (old_string → new_string)
search_replace — Global find/replace
list_directory — List files/dirs (recursive)
delete_file  — Delete files (auto .bak)
move_file    — Move/rename (atomic)
```

**WORKFLOW:** read_file → understand → edit_file/write → verify

---

## SEARCH OPERATIONS (2)

```
codebase_search — Semantic search (concepts, patterns)
grep           — Regex search (identifiers, literals)
```

**WORKFLOW:** codebase_search(discovery) → grep(precision)

---

## GIT OPERATIONS (9)

```
git_status         — Working tree (USE FIRST)
git_diff           — Changes
git_log            — History
git_commit         — Commit
git_stage          — Stage files
git_unstage        — Unstage
git_branch         — Manage branches
git_merge          — Merge (with conflict detection)
is_protected_branch — Check protection
```

**WORKFLOW:** git_status → git_diff → git_stage → git_commit

---

## SUPERCACHE — 3-Tier Memory (12 tools)

```
┌─────────────┬──────────────┬─────────────┐
│ Reasoning   │ Project      │ Vault       │
│ (5 min TTL) │ (24 hr TTL)  │ (7 day TTL) │
├─────────────┼──────────────┼─────────────┤
│ Active work │ Session work  │ Reusable   │
│ Short-term  │ File edits    │ patterns    │
└─────────────┴──────────────┴─────────────┘
```

```
cache_store           — Store in tier
cache_retrieve        — Retrieve from tier
cache_delete          — Delete entry
cache_clear           — Clear tier
cache_list            — List entries
cache_search          — Search cache
cache_stats           — Statistics
cache_prune           — Remove expired
cache_store_pattern   — CRYSTALLIZE to Vault (use often!)
cache_store_reasoning  — Store reasoning chain
cache_load_reasoning   — Load reasoning chain
cache_archive_reasoning — Move to Project tier
```

**STRATEGY:** Check cache → use or solve → cache_store_pattern

---

## SYSTEM OPERATIONS (3)

```
run       — Execute shell (absolute paths, chain with &&)
ask_user  — Prompt for input (when clarification needed)
fetch     — HTTP requests (GET/POST/PUT/DELETE/PATCH/HEAD)
```

---

## BROWSER AUTOMATION (9)

*Requires FloydChrome on ws://localhost:3005*

```
browser_status      — Check connection (USE FIRST)
browser_navigate    — Go to URL
browser_read_page   — Read page (returns markdown)
browser_screenshot  — Screenshot
browser_click       — Click element
browser_type        — Type text
browser_find        — Find elements
browser_get_tabs    — List tabs
browser_create_tab  — New tab
```

**WORKFLOW:** browser_status → [if connected] → navigate/read → [work]

---

## PATCH OPERATIONS (5)

```
apply_unified_diff   — Apply patches (safest for multi-file)
edit_range          — Edit by line numbers
insert_at           — Insert at position
delete_range        — Delete range
assess_patch_risk    — Assess risk (use first)
```

---

## SPECIAL OPERATIONS (3)

```
verify           — Explicit verification (file_exists, file_contains, command_succeeds)
safe_refactor     — Multi-step with rollback
impact_simulate   — Butterfly analysis (low/medium/high/critical)
```

**SAFETY WORKFLOW:** impact_simulate → safe_refactor → verify
