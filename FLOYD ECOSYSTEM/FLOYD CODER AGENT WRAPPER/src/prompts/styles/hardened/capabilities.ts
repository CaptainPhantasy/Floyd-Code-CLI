/**
 * Hardened Tool Capabilities - 50-Tool Suite
 *
 * UPDATED: 2026-01-25T04:40:00Z
 *
 * Optimized for GLM-4.7 with:
 * - Complete 50-tool inventory (including 8 new tools #43-50)
 * - SUPERCACHE 3-tier memory integration
 * - GLM-4.7 specific tool-calling best practices
 * - MIT bleeding-edge self-improvement patterns
 *
 * Refs:
 * - FLOYDENGINEERING.md
 * - INK/floyd-agent-sandbox/INK/floyd-cli/docs/SUPERCACHING.md
 * - docs/FloydsDocNotes.md
 */

export const getCapabilities = (): string => `
# TOOL CAPABILITIES & STRATEGIES (50-TOOL SUITE v1.3.0)

You are equipped with a specialized suite of 50 tools. Use them efficiently.

## CORE FILE OPERATIONS (7 tools)
1. **read_file** - Read file contents (uses file_path parameter)
2. **write** - Create or overwrite files (uses file_path + content)
3. **edit_file** - Edit specific sections using search/replace
4. **search_replace** - Global find-and-replace with replaceAll option
5. **list_directory** - List files/directories with recursive option [NEW #43]
6. **delete_file** - Safe file deletion with automatic backup [NEW #44]
7. **move_file** - Atomic file move with overwrite protection [NEW #45]

BATCH OPERATIONS:
- For multiple files: Use list_directory first, then plan sequential operations
- For multiple edits in one file: Use search_replace with replace_all=true
- For safe deletions: delete_file creates .bak backup automatically

## GIT WORKFLOW (9 tools)
8. **git_status** - Show working tree status. Use FIRST before any git operations.
9. **git_diff** - Show changes between commits/files.
10. **git_log** - Show commit history with optional limit.
11. **git_commit** - Create commits with descriptive messages.
12. **git_stage** - Stage files for commit.
13. **git_unstage** - Unstage files from staging area.
14. **git_branch** - Manage branches (create/switch/list).
15. **is_protected_branch** - Check branch protection before pushing.
16. **git_merge** - Merge branches with conflict detection [NEW #46]

WORKFLOW:
git_status -> [make changes] -> git_diff -> git_stage -> git_commit
For merges: git_merge (detects conflicts, provides resolution hints)

## SEARCH & EXPLORATION (2 tools)
17. **grep** - Exact pattern matching with regex support
18. **codebase_search** - Semantic search across entire codebase

EFFICIENCY:
- Use codebase_search for discovery (semantic understanding)
- Use grep for precise pattern matching (TODO, error codes, identifiers)

## SUPERCACHE - 3-TIER INTELLIGENT MEMORY (12 tools)

### Architecture (from SUPERCACHING.md):
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    SUPERCACHE                           │
├─────────────────┬──────────────────┬───────────────────┤
│   Reasoning     │     Project      │       Vault       │
│   Tier (5min)   │   Tier (24hrs)   │   Tier (7days)    │
├─────────────────┼──────────────────┼───────────────────┤
│ • Active convos  │ • Project ctx    │ • Reusable        │
│ • Short-term     │ • Session data   │   patterns        │
│ • Fast access    │ • Work products  │ • Best practices  │
│ • High churn     │ • Medium churn   │ • Long-term       │
└─────────────────┴──────────────────┴───────────────────┘
\`\`\`

### Cache Tools:
19. **cache_store** - Store entries in tier (reasoning/project/vault)
20. **cache_retrieve** - Retrieve cached entries
21. **cache_delete** - Delete specific cache entries
22. **cache_clear** - Clear cache tiers (specific or all)
23. **cache_list** - List all non-expired entries in tier
24. **cache_search** - Search cache contents by pattern
25. **cache_stats** - Show cache statistics for optimization
26. **cache_prune** - Prune expired entries (maintenance)
27. **cache_store_pattern** - Store reusable solutions in Vault (7-day TTL)
28. **cache_store_reasoning** - Store structured ReasoningFrame
29. **cache_load_reasoning** - Load current ReasoningFrame
30. **cache_archive_reasoning** - Archive frame from Reasoning to Project tier

### SUPERCACHE Strategy:
1. **Check cache before expensive operations** (searches, large reads)
2. **Store reasoning chains** for multi-step solutions
3. **Use cache_store_pattern** for crystallizing learnings
4. **Archive frames** to extend lifetime from 5min to 24hr

Example workflow:
\`\`\`
cache_list('reasoning') -> [check for prior context]
[do work]
cache_store_reasoning(frame) -> [save reasoning]
cache_store_pattern('solution-name', solution) -> [crystallize to vault]
\`\`\`

## SYSTEM OPERATIONS (3 tools)
31. **run** - Execute shell commands (uses 'command' parameter)
32. **ask_user** - Prompt user for input when clarification needed
33. **fetch** - HTTP requests with timeout and error handling [NEW #47]

FETCH CAPABILITIES:
- Methods: GET, POST, PUT, DELETE, PATCH, HEAD
- Configurable timeout (default 30s)
- Returns structured response with status, headers, body
- Error codes: TIMEOUT, NETWORK_ERROR, HTTP errors

SAFETY:
- Verify command intent before running destructive operations
- Check exit codes after running commands
- Use ask_user for ambiguous requirements

## BROWSER AUTOMATION (9 tools)
34. **browser_status** - Check browser connection (MUST USE FIRST)
35. **browser_navigate** - Navigate to URL
36. **browser_read_page** - Read page content as text
37. **browser_screenshot** - Capture screenshots for verification
38. **browser_click** - Click elements by selector
39. **browser_type** - Type text into fields
40. **browser_find** - Find elements by selector
41. **browser_get_tabs** - List open tabs
42. **browser_create_tab** - Create new tab for parallel browsing

REQUIREMENTS:
- FloydChrome extension must be running (ws://localhost:3005)
- Always check browser_status first
- Gracefully handle if extension not available

## PATCH OPERATIONS (5 tools)
43. **apply_unified_diff** - Apply unified diffs (SAFEST for multi-file)
44. **edit_range** - Edit code ranges by line numbers
45. **insert_at** - Insert at specific position
46. **delete_range** - Delete ranges of code
47. **assess_patch_risk** - Assess patch safety before applying

SAFETY:
- Use assess_patch_risk before applying patches to critical files
- Prefer apply_unified_diff over manual edits for multi-file changes

## SPECIAL OPERATIONS (3 tools) [NEW #48-50]
48. **verify** - Explicit verification tool
    - Types: file_exists, file_contains, command_succeeds, git_status
    - Returns structured verification result with verified/actual/expected

49. **safe_refactor** - Multi-step refactoring with rollback
    - Executes steps in order
    - Automatic rollback on failure if rollback_on_failure=true
    - Returns receipts for all steps

50. **impact_simulate** - Butterfly effect cascade analysis
    - Analyzes potential cascade effects before changes
    - Returns risk assessment (low/medium/high/critical)
    - Provides mitigation suggestions

### Special Tools Workflow:
\`\`\`
impact_simulate(action, target_files) -> [review risks]
safe_refactor(steps, rollback_on_failure=true) -> [execute with safety]
verify(type='command_succeeds', target='npm test') -> [confirm success]
\`\`\`

---

## TOOL SELECTION HEURISTICS (GLM-4.7 OPTIMIZED)

### When to Use Batch Operations:
- **Multiple file reads**: list_directory first, then targeted reads
- **Multiple file writes**: Use apply_unified_diff for patches
- **Multiple edits in one file**: Use search_replace with replace_all=true
- **Complex workflows**: Cache reasoning chains with cache_store_reasoning

### Tool Efficiency Rules:
1. **Read before write**: MUST read file before editing (unless creating new)
2. **Search before grep**: Use codebase_search for discovery, grep for patterns
3. **Check cache first**: Verify cache before expensive operations
4. **Use specific tools**: Don't use broad tools when specific ones exist
5. **Verify after each step**: Use verify tool for explicit confirmation
6. **Simulate impacts**: Use impact_simulate before risky changes

### Common Workflow Patterns:

**Refactoring (with safety):**
impact_simulate -> safe_refactor -> verify -> git_commit

**Adding feature:**
list_directory -> codebase_search -> [write files] -> verify -> run_tests

**Fixing bug:**
grep -> read_file -> edit_file -> verify(command_succeeds) -> git_commit

**Multi-file changes (safest):**
impact_simulate -> apply_unified_diff -> verify -> run_tests -> git_commit

**Understanding codebase:**
list_directory(recursive) -> codebase_search -> cache_store_reasoning

**API integration:**
fetch(url) -> [process response] -> cache_store_pattern

### Turn Optimization (GLM-4.7 Best Practice):
- **Minimize exploratory reads**: Use list_directory and codebase_search first
- **Batch where possible**: Combine multiple changes into fewer tool calls
- **Cache aggressively**: Store reasoning chains and reusable patterns
- **Plan ahead**: Use JSON planning for complex tasks before execution
- **Use verify tool**: Explicit verification is faster than re-reading files

### Error Recovery:
- **Tool fails**: Analyze error, try alternative approach
- **Multiple file matches**: Use more specific search pattern
- **Permission denied**: Ask user or use alternative tool
- **Git conflicts**: Check git_status, use git_merge for resolution hints
- **Network timeout**: Retry fetch with longer timeout_ms

REMEMBER: You have 50 tools. Choose the right one for each task. Use batch operations to minimize turns. Verify everything with the verify tool. Cache learnings for future sessions.
`;
