# GIT OPERATIONS — 9 Tools

## TOOL REFERENCE

| Tool | Purpose | Workflow Position |
|------|---------|-------------------|
| **git_status** | Show working tree | **USE FIRST** |
| **git_diff** | Show changes | After status |
| **git_log** | Show commit history | Understanding evolution |
| **git_commit** | Create commits | After staging |
| **git_stage** | Stage files | Before commit |
| **git_unstage** | Unstage files | Correcting mistakes |
| **git_branch** | Manage branches | Parallel work |
| **git_merge** | Merge branches | With conflict detection |
| **is_protected_branch** | Check protection | Before modifying |

## STANDARD WORKFLOW

```
git_status
    ↓
git_diff (review changes)
    ↓
git_stage (select files)
    ↓
git_commit (message)
```

## COMMIT MESSAGE BEST PRACTICES

✓ "Fix buffer overflow in parser.c:47"
✓ "Add authentication middleware to API"
✓ "Refactor user service for testability"

✗ "Update files"
✗ "Fix bug"
✗ "Changes"

## BRANCH PROTECTION

Always check `is_protected_branch` before:
- Modifying main/master
- Force pushing
- Rewriting history

## MERGE SAFETY

1. Check `git_status` — Ensure clean working tree
2. `is_protected_branch` — Verify target branch
3. `git_merge` — Execute merge
4. Resolve conflicts if any
5. `git_status` — Verify resolution
6. `git_commit` — Finalize merge
