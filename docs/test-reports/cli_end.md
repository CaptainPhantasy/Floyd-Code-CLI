# FLOYD API Contract - All 50 Endpoints

**Generated:** 2026-01-25
**Version:** 1.3.0
**Agent:** FLOYD (Level 5 Autonomous Software Engineering Agent)

---

## Table of Contents

1. [CORE FILE OPERATIONS](#core-file-operations-7-tools)
2. [GIT WORKFLOW](#git-workflow-9-tools)
3. [SEARCH & EXPLORATION](#search--exploration-2-tools)
4. [SUPERCACHE - 3-TIER MEMORY](#supercache---3-tier-memory-12-tools)
5. [SYSTEM OPERATIONS](#system-operations-3-tools)
6. [BROWSER AUTOMATION](#browser-automation-9-tools)
7. [PATCH OPERATIONS](#patch-operations-5-tools)
8. [SPECIAL OPERATIONS](#special-operations-3-tools)

---

## CORE FILE OPERATIONS (7 tools)

### 1. read_file
**Purpose:** Read file contents from the filesystem

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | Yes | Absolute path to the file |

**Returns:** `string` - File contents

**Usage Rules:**
- MUST use absolute paths
- MUST read before editing existing files
- Returns error if file doesn't exist

---

### 2. write
**Purpose:** Create or overwrite files

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | Yes | Absolute path to the file |
| content | string | Yes | Full content to write |

**Returns:** `{success: boolean, error?: string}`

**Usage Rules:**
- Creates new files or overwrites existing
- Use absolute paths only
- Creates parent directories if needed

---

### 3. edit_file
**Purpose:** Edit specific sections using search/replace

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | Yes | Absolute path to file |
| search | string | Yes | String to find |
| replace | string | Yes | Replacement string |
| replaceAll | boolean | No | Replace all occurrences (default: false) |

**Returns:** `{success: boolean, changes: number}`

**Usage Rules:**
- Read file first to understand structure
- Search string must be exact match
- Use replaceAll for global changes

---

### 4. search_replace
**Purpose:** Global find-and-replace with replaceAll option

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | Yes | Absolute path to file |
| search | string | Yes | Pattern to find |
| replace | string | Yes | Replacement pattern |
| replaceAll | boolean | No | Replace all matches (default: true) |

**Returns:** `{success: boolean, replacements: number}`

---

### 5. list_directory
**Purpose:** List files and directories

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | string | Yes | Directory path |
| recursive | boolean | No | List recursively (default: false) |

**Returns:** `Array<{name: string, type: 'file'|'dir'}>`

---

### 6. delete_file
**Purpose:** Safe file deletion with automatic backup

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | Yes | Absolute path to file |
| create_backup | boolean | No | Create backup (default: true) |

**Returns:** `{success: boolean, backup_path?: string}`

**Usage Rules:**
- Automatically creates timestamped backup
- Cannot delete directories

---

### 7. move_file
**Purpose:** Atomic file move with overwrite protection

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| source | string | Yes | Source file path |
| destination | string | Yes | Destination file path |
| overwrite | boolean | No | Allow overwrite (default: false) |

**Returns:** `{success: boolean, error?: string}`

---

## GIT WORKFLOW (9 tools)

### 8. git_status
**Purpose:** Show working tree status. Use FIRST before any git operations.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| repoPath | string | No | Path to git repo (defaults: cwd) |

**Returns:**
```
{
  branch: string,
  staged: string[],
  unstaged: string[],
  untracked: string[]
}
```

---

### 9. git_diff
**Purpose:** Show changes between commits, commit and working tree, etc.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| repoPath | string | No | Path to git repo |
| files | string[] | No | Specific files to diff (empty: all) |
| staged | boolean | No | Show staged changes (default: false) |
| cached | boolean | No | Alias for staged (default: false) |

**Returns:** `string` - Unified diff format

---

### 10. git_log
**Purpose:** Show commit history

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| repoPath | string | No | Path to git repo |
| maxCount | number | No | Max commits to show (default: 20) |
| since | string | No | Show commits since date |
| until | string | No | Show commits until date |
| author | string | No | Filter by author |
| file | string | No | Show commits affecting file |

**Returns:** `Array<{hash, author, date, message}>`

---

### 11. git_commit
**Purpose:** Record changes to repository. Warns for protected branches.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Commit message |
| repoPath | string | No | Path to git repo |
| stageAll | boolean | No | Stage all modified files (default: true) |
| stageFiles | string[] | No | Specific files to stage (overrides stageAll) |
| allowEmpty | boolean | No | Allow empty commit (default: false) |
| amend | boolean | No | Amend previous commit (default: false) |

**Returns:** `{success: boolean, commit_hash: string}`

---

### 12. git_add
**Purpose:** Stage files for commit

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| files | string[] | No | Files to stage (empty: all) |
| repoPath | string | No | Path to git repo |

**Returns:** `{success: boolean, staged: string[]}`

---

### 13. git_branch
**Purpose:** List, create, or switch branches

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | No | Action: 'list', 'current', 'create', 'switch' (default: 'list') |
| name | string | No | Branch name (for create/switch) |
| repoPath | string | No | Path to git repo |

**Returns:** Depends on action:
- list: `string[]` - All branches
- current: `string` - Current branch
- create/switch: `{success: boolean}`

---

### 14. git_checkout
**Purpose:** Switch branches or restore files

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| branch | string | No | Branch to switch to |
| file | string | No | File to restore |
| repoPath | string | No | Path to git repo |

**Returns:** `{success: boolean}`

---

### 15. git_stash
**Purpose:** Stash and restore uncommitted changes

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | 'push', 'pop', 'list', 'drop' |
| message | string | No | Stash message |
| index | number | No | Stash index (for pop/drop) |
| repoPath | string | No | Path to git repo |

**Returns:** Depends on action

---

### 16. git_merge
**Purpose:** Merge branches with conflict detection

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| branch | string | Yes | Branch to merge |
| repoPath | string | No | Path to git repo |
| strategy | string | No | Merge strategy (default: 'recursive') |

**Returns:** `{success: boolean, conflicts?: string[]}`

---

## SEARCH & EXPLORATION (2 tools)

### 17. grep
**Purpose:** Exact pattern matching with regex support

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pattern | string | Yes | Search pattern (regex supported) |
| path | string | Yes | Directory to search |
| recursive | boolean | No | Search recursively (default: true) |
| caseSensitive | boolean | No | Case sensitive (default: false) |

**Returns:** `Array<{file: string, line: number, match: string}>`

---

### 18. codebase_search
**Purpose:** Semantic search across entire codebase

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Natural language query |
| fileTypes | string[] | No | Filter by file extensions |
| maxResults | number | No | Max results (default: 50) |

**Returns:** `Array<{file: string, relevance: number, excerpt: string}>`

**Usage Rules:**
- Use for discovery and understanding
- More powerful than grep for conceptual searches
- Returns ranked results by relevance

---

## SUPERCACHE - 3-TIER MEMORY (12 tools)

**Tiers:**
- `reasoning` (5 min TTL) - Current conversation, active thinking
- `project` (24 hr TTL) - Project context, session work
- `vault` (7 day TTL) - Reusable patterns, best practices

### 19. cache_store
**Purpose:** Store entries in a cache tier

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | Yes | 'reasoning', 'project', or 'vault' |
| key | string | Yes | Unique key for the entry |
| value | string | Yes | Value to store |
| metadata | object | No | Optional JSON metadata |

**Returns:** `{success: boolean, expires_at: string}`

---

### 20. cache_retrieve
**Purpose:** Retrieve cached entry by key

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | Yes | 'reasoning', 'project', or 'vault' |
| key | string | Yes | Key to retrieve |

**Returns:** `{value: string, metadata: object, expires_at: string}`

---

### 21. cache_delete
**Purpose:** Delete cache entry by key

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | Yes | 'reasoning', 'project', or 'vault' |
| key | string | Yes | Key to delete |

**Returns:** `{success: boolean}`

---

### 22. cache_clear
**Purpose:** Clear all entries from a cache tier

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | No | Tier to clear (omits to clear all) |

**Returns:** `{success: boolean, cleared: number}`

---

### 23. cache_list
**Purpose:** List all non-expired entries in a tier

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | No | Tier to list (omits to list all) |

**Returns:** `Array<{key: string, expires_at: string, metadata: object}>`

---

### 24. cache_search
**Purpose:** Search cache by key or value pattern

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | Yes | 'reasoning', 'project', or 'vault' |
| query | string | Yes | Search query |

**Returns:** `Array<{key: string, value: string, match_score: number}>`

---

### 25. cache_stats
**Purpose:** Get cache statistics

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | No | Tier to get stats for (omits for all) |

**Returns:**
```
{
  entry_count: number,
  total_size: number,
  oldest_entry: string,
  newest_entry: string
}
```

---

### 26. cache_prune
**Purpose:** Remove expired entries

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tier | string | No | Tier to prune (omits for all) |

**Returns:** `{success: boolean, pruned: number}`

---

### 27. cache_store_pattern
**Purpose:** Store reusable solution to Vault tier

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Pattern name |
| pattern | string | Yes | Pattern content (code, solution, etc.) |
| tags | string[] | No | Categorization tags |

**Returns:** `{success: boolean, stored_at: string}`

**Usage Rules:**
- Stores to Vault tier (7-day TTL)
- Best for reusable code patterns
- Use tags for easy retrieval

---

### 28. cache_store_reasoning
**Purpose:** Store structured ReasoningFrame

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| frame | string | Yes | ReasoningFrame as JSON string |

**Returns:** `{success: boolean, frame_id: string}`

---

### 29. cache_load_reasoning
**Purpose:** Load current ReasoningFrame

**Parameters:** None

**Returns:** `{frame: object, loaded_at: string}`

---

### 30. cache_archive_reasoning
**Purpose:** Archive ReasoningFrame from reasoning to project tier

**Parameters:** None

**Returns:** `{success: boolean, archived_to: 'project'}`

**Usage Rules:**
- Extends lifetime from 5 min to 24 hours
- Preserves active reasoning for later sessions

---

## SYSTEM OPERATIONS (3 tools)

### 31. run
**Purpose:** Execute shell commands

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| command | string | Yes | Shell command to execute |
| cwd | string | No | Working directory |
| timeout | number | No | Timeout in seconds (default: 30) |
| env | object | No | Environment variables |

**Returns:**
```
{
  exit_code: number,
  stdout: string,
  stderr: string,
  timed_out: boolean
}
```

**Usage Rules:**
- MUST verify exit codes after execution
- Use for builds, tests, and system commands
- Handle errors with structured responses

---

### 32. ask_user
**Purpose:** Prompt user for input when clarification needed

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| prompt | string | Yes | Question to ask user |
| options | string[] | No | Multiple choice options |
| default | string | No | Default value |

**Returns:** `{response: string}`

---

### 33. fetch
**Purpose:** HTTP requests with timeout and error handling

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | Request URL |
| method | string | No | HTTP method (default: 'GET') |
| headers | object | No | Request headers |
| body | string | No | Request body |
| timeout | number | No | Timeout in seconds (default: 30) |

**Returns:**
```
{
  status: number,
  headers: object,
  data: any,
  error?: string
}
```

---

## BROWSER AUTOMATION (9 tools)

**CRITICAL:** MUST use browser_status FIRST before any browser operations.

### 34. browser_status
**Purpose:** Check browser connection status

**Parameters:** None

**Returns:**
```
{
  connected: boolean,
  browser_type: string,
  version: string,
  active_tabs: number
}
```

---

### 35. browser_navigate
**Purpose:** Navigate to URL

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | Target URL |
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `{success: boolean, loaded: boolean}`

---

### 36. browser_read_page
**Purpose:** Read page content as text

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `{content: string, title: string, url: string}`

---

### 37. browser_screenshot
**Purpose:** Capture screenshot for verification

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | string | Yes | Save path for screenshot |
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `{success: boolean, path: string}`

---

### 38. browser_click
**Purpose:** Click element by selector

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string | Yes | CSS selector |
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `{success: boolean, element_found: boolean}`

---

### 39. browser_type
**Purpose:** Type text into input field

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string | Yes | CSS selector for input field |
| text | string | Yes | Text to type |
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `{success: boolean}`

---

### 40. browser_find
**Purpose:** Find elements by selector

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string | Yes | CSS selector |
| tab_id | string | No | Specific tab (default: active) |

**Returns:** `Array<{tag: string, text: string, attributes: object}>`

---

### 41. browser_get_tabs
**Purpose:** List all open tabs

**Parameters:** None

**Returns:** `Array<{tab_id: string, title: string, url: string, active: boolean}>`

---

### 42. browser_create_tab
**Purpose:** Create new tab for parallel browsing

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | No | Initial URL (optional) |

**Returns:** `{success: boolean, tab_id: string}`

---

## PATCH OPERATIONS (5 tools)

### 43. apply_unified_diff
**Purpose:** Apply unified diffs (SAFEST for multi-file changes)

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| diff | string | Yes | Unified diff content |
| dryRun | boolean | No | Preview changes (default: false) |
| rootPath | string | No | Root path for resolving files |
| assessRisk | boolean | No | Risk assessment (default: true) |

**Returns:**
```
{
  success: boolean,
  files_changed: string[],
  lines_added: number,
  lines_removed: number,
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}
```

**Usage Rules:**
- Use for multi-file changes
- Always run dryRun first
- Automatic risk assessment

---

### 44. edit_range
**Purpose:** Edit code ranges by line numbers

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filePath | string | Yes | Path to file |
| startLine | number | Yes | Start line (0-indexed) |
| endLine | number | Yes | End line (0-indexed, inclusive) |
| content | string | Yes | New content to insert |
| dryRun | boolean | No | Preview changes (default: false) |

**Returns:** `{success: boolean, lines_modified: number}`

---

### 45. insert_at
**Purpose:** Insert content at specific line

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filePath | string | Yes | Path to file |
| lineNumber | number | Yes | Line to insert at (0-indexed) |
| content | string | Yes | Content to insert |
| dryRun | boolean | No | Preview changes (default: false) |

**Returns:** `{success: boolean, inserted_at: number}`

---

### 46. delete_range
**Purpose:** Delete range of lines from file

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filePath | string | Yes | Path to file |
| startLine | number | Yes | Start line (0-indexed) |
| endLine | number | Yes | End line (0-indexed, inclusive) |
| dryRun | boolean | No | Preview changes (default: false) |

**Returns:** `{success: boolean, lines_deleted: number}`

---

### 47. assess_patch_risk
**Purpose:** Assess patch safety before applying

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| diff | string | Yes | Unified diff content |

**Returns:**
```
{
  risk_level: 'low' | 'medium' | 'high' | 'critical',
  files_affected: string[],
  potential_breaking_changes: string[],
  recommendations: string[]
}
```

---

## SPECIAL OPERATIONS (3 tools)

### 48. verify
**Purpose:** Explicit verification tool for confirming operations

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | 'file_exists', 'file_contains', 'command_succeeds', 'git_status' |
| path | string | No | Path for file checks |
| content | string | No | Content for file_contains check |
| command | string | No | Command for command_succeeds check |

**Returns:**
```
{
  verified: boolean,
  actual: any,
  expected: any,
  message: string
}
```

---

### 49. safe_refactor
**Purpose:** Multi-step refactoring with automatic rollback

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| steps | Array<Step> | Yes | Array of refactor steps |
| rollback_on_failure | boolean | No | Auto rollback (default: true) |
| description | string | No | Refactor description |

**Step Object:**
```
{
  type: 'edit' | 'move' | 'delete',
  file: string,
  ...type_specific_params
}
```

**Returns:**
```
{
  success: boolean,
  completed_steps: number,
  total_steps: number,
  receipts: Array<Receipt>,
  rolled_back: boolean
}
```

**Usage Rules:**
- Executes steps in order
- Automatic rollback on failure
- Returns receipts for all steps

---

### 50. impact_simulate
**Purpose:** Butterfly effect cascade analysis before changes

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| changes | Array<Change> | Yes | Proposed changes |
| depth | number | No | Analysis depth (default: 5) |

**Change Object:**
```
{
  type: 'edit' | 'delete' | 'add',
  file: string,
  description: string
}
```

**Returns:**
```
{
  risk_level: 'low' | 'medium' | 'high' | 'critical',
  affected_files: string[],
  cascade_effects: Array<{
    file: string,
    impact: string,
    probability: number
  }>,
  mitigation_suggestions: string[]
}
```

**Usage Rules:**
- Analyzes potential cascade effects
- Use before risky multi-file changes
- Provides mitigation suggestions

---

## Tool Selection Heuristics

1. **Read before write**: MUST read file before editing (unless creating new)
2. **Search before grep**: Use codebase_search for discovery, grep for patterns
3. **Check cache first**: Verify cache before expensive operations
4. **Use specific tools**: Don't use broad tools when specific ones exist
5. **Verify after each step**: Use verify tool for explicit confirmation
6. **Simulate impacts**: Use impact_simulate before risky changes

---

## Error Handling Patterns

All tools return structured responses:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-25T23:16:51.235Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }
  },
  "timestamp": "2026-01-25T23:16:51.235Z"
}
```

**Common Error Codes:**
- `NOT_FOUND` - Resource doesn't exist
- `PERMISSION_DENIED` - Insufficient permissions
- `TIMEOUT` - Operation exceeded time limit
- `INVALID_INPUT` - Parameter validation failed
- `NETWORK_ERROR` - Network-related failure
- `INvariant_BROKEN` - Critical system invariant violated

---

## Rate Limits & Throttling

| Tool Category | Rate Limit | Burst |
|---------------|------------|-------|
| File Operations | 100 req/min | 20 |
| Git Operations | 50 req/min | 10 |
| Cache Operations | 200 req/min | 50 |
| Browser Automation | 30 req/min | 5 |
| Patch Operations | 20 req/min | 5 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3.0 | 2026-01-25 | Initial API contract documentation |

---

## Support & Contact

**Maintainer:** Douglas Allen Talley
**Organization:** Legacy AI (Nashville, Indiana)
**Documentation Root:** `/Volumes/Storage/FLOYD_CLI`

---

**End of API Contract**
