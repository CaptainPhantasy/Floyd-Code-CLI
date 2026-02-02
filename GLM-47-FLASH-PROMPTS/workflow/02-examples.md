# GLM-4.7 FLASH — Workflow Examples

## COMPLETE WORKFLOW EXAMPLES

### Example 1: Bug Fix

**User:** "There's a null pointer in the user service"

```
grep({ "pattern": "NullPointerException|NullPointerException|null pointer", "path": "/src" })
→ read_file({ "file_path": "/src/user/service.ts" })
→ edit_file({ "file_path": "/src/user/service.ts", "old_string": "if (user.name == null)", "new_string": "if (user?.name)" })
→ verify({ "type": "command_succeeds", "target": "npm test -- --grep 'user'" })
```

---

### Example 2: Feature Addition

**User:** "Add rate limiting to the API"

```
codebase_search({ "query": "rate limiting middleware express" })
→ cache_retrieve({ "tier": "vault", "key": "express-rate-limit-pattern" })
→ [if miss]
   → read_file({ "file_path": "/src/middleware/rate-limit.ts" })
   → cache_store_pattern({ "key": "express-rate-limit-pattern", "value": "..." })
→ edit_file({ "file_path": "/src/api/index.ts", "old_string": "...", "new_string": "..." })
→ verify({ "type": "command_succeeds", "target": "npm test" })
```

---

### Example 3: Multi-File Refactor

**User:** "Rename User to Customer across the codebase"

```
impact_simulate({ "action": "Rename User to Customer", "target_files": ["src/**/*.ts"] })
→ [returns: high risk, 47 files affected]
→ safe_refactor({
    "steps": [
      { "tool": "search_replace", "args": { "path": "/src", "pattern": "User", "replacement": "Customer", "replaceAll": true } },
      { "tool": "run", "args": { "command": "npm run type-check" } }
    ],
    "rollback_on_failure": true
  })
→ verify({ "type": "command_succeeds", "target": "npm test" })
```

---

### Example 4: Git Workflow

**User:** "Commit these changes"

```
git_status
→ git_diff
→ git_stage({ "paths": ["/src/modified/file.ts"] })
→ run({ "command": "npm test -- --grep 'modified'" })
→ git_commit({ "message": "Fix: Handle edge case in user validation" })
```

---

### Example 5: Parallel Discovery

**User:** "Find all TODO comments"

```
[grep({ "pattern": "TODO|FIXME", "path": "/src" }), codebase_search({ "query": "unfinished implementation" })]
→ [analyze results]
→ [report grouped by priority]
```

---

### Example 6: Cache Reuse

**User:** "Set up authentication again"

```
cache_retrieve({ "tier": "vault", "key": "auth-setup-pattern" })
→ [pattern found]
→ apply pattern
→ verify
→ cache_store_pattern({ "key": "auth-setup-v2", "value": "improved pattern" })
```

---

### Example 7: Safe Browser Automation

**User:** "Read the documentation for this API"

```
browser_status
→ [connected: true]
→ browser_navigate({ "url": "https://api.example.com/docs" })
→ browser_read_page
→ [extract API info]
→ cache_store_pattern({ "key": "api-docs-...", "value": "..." })
```

---

### Example 8: Plan Mode Analysis

**User (in PLAN mode):** "How would you add caching?"

```
read_file({ "file_path": "/src/api/service.ts" })
→ codebase_search({ "query": "currently caching strategy" })
→ [analyze current state]
→ [produce plan]
```

**Output:**
```
## Analysis
Currently no caching. Each API call hits the database directly.

## Plan
1. Add Redis caching layer to /src/cache/
2. Implement cache decorator in /src/utils/cache.ts
3. Add cache middleware to /src/middleware/cache.ts
4. Update service.ts to use cache

## Files to create/modify
- /src/cache/redis.ts (new)
- /src/utils/cache.ts (new)
- /src/middleware/cache.ts (new)
- /src/api/service.ts:42 (add cache)
```
