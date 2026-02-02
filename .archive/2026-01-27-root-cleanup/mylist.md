# FLOYD's Tool List and Call Structure

## Core Tool Categories

### 1. File Operations
- `read_file` - Read file contents
- `write` - Create or overwrite files
- `edit_file` - Edit specific sections using search/replace
- `search_replace` - Global find-and-replace
- `list_directory` - List files/directories
- `delete_file` - Safe file deletion with backup
- `move_file` - Atomic file move with protection

### 2. Git Workflow
- `git_status` - Show working tree status
- `git_diff` - Show changes between commits
- `git_log` - Show commit history
- `git_commit` - Create commits
- `git_add` - Stage files
- `git_branch` - Manage branches
- `git_checkout` - Switch branches
- `git_stash` - Stash/restore changes
- `git_merge` - Merge branches

### 3. Search & Exploration
- `grep` - Pattern matching with regex
- `codebase_search` - Semantic search across codebase

### 4. SUPERCACHE (Memory System)
- `cache_store` - Store entries in tier
- `cache_retrieve` - Retrieve cached entries
- `cache_delete` - Delete cache entries
- `cache_clear` - Clear cache tiers
- `cache_list` - List cache entries
- `cache_search` - Search cache contents
- `cache_stats` - Cache statistics
- `cache_prune` - Remove expired entries
- `cache_store_pattern` - Store reusable solutions (Vault, 7-day TTL)
- `cache_store_reasoning` - Store reasoning frame
- `cache_load_reasoning` - Load reasoning frame
- `cache_archive_reasoning` - Archive reasoning to Project tier

### 5. System Operations
- `run` - Execute shell commands
- `ask_user` - Prompt user for input
- `fetch` - HTTP requests

### 6. Browser Automation
- `browser_status` - Check browser connection
- `browser_navigate` - Navigate to URL
- `browser_read_page` - Read page content
- `browser_screenshot` - Capture screenshots
- `browser_click` - Click elements
- `browser_type` - Type text into fields
- `browser_find` - Find elements
- `browser_get_tabs` - List tabs
- `browser_create_tab` - Create new tab

### 7. Patch Operations
- `apply_unified_diff` - Apply unified diffs (safest)
- `edit_range` - Edit code by line numbers
- `insert_at` - Insert at specific position
- `delete_range` - Delete code ranges
- `assess_patch_risk` - Assess patch safety

### 8. Special Operations
- `verify` - Explicit verification tool
- `safe_refactor` - Multi-step refactoring with rollback
- `impact_simulate` - Cascade effect analysis

## Call Structure

### File Tool Pattern
```javascript
{
  "file_path": "/path/to/file",  // Always use absolute paths
  // Additional params based on tool
}
```

### Git Tool Pattern
```javascript
{
  "repo_path": "/path/to/repo",  // Optional, defaults to CWD
  // Additional params based on tool
}
```

### Cache Tool Pattern
```javascript
{
  "tier": "reasoning" | "project" | "vault",
  "key": "unique-key",
  // Additional params based on tool
}
```

### Verification Tool Pattern
```javascript
{
  "type": "file_exists" | "file_contains" | "command_succeeds" | "git_status",
  // Additional params based on type
}
```

## Tool Selection Heuristics

1. **Read before write** - MUST read before editing existing files
2. **Search before grep** - Use codebase_search for discovery
3. **Check cache first** - Before expensive operations
4. **Use specific tools** - Don't use broad when specific exists
5. **Verify after each step** - Use verify tool for confirmation
6. **Simulate impacts** - Before risky changes

## TTL Settings

- **Reasoning Tier**: 5 minutes
- **Project Tier**: 24 hours
- **Vault Tier**: 7 days
