# Aider Quick Reference

## Launching Aider

From `TUI REBUILD` directory:
```bash
cd "/Volumes/Storage/FLOYD_CLI/TUI REBUILD"
aider
```

## Important: How to Add Files

Aider does NOT automatically read files you mention. You MUST use `/add`:

```
/add PHASE_01_SCAFFOLD/Claude.md
/add src/app.tsx
/add package.json
```

## Common Commands

| Command | What it does |
|---------|--------------|
| `/add <file>` | Add file to chat context |
| `/drop <file>` | Remove file from context |
| `/ls` | List files in context |
| `/tokens` | Show token usage |
| `/commit` | Commit changes |
| `/diff` | Show git diff |
| `/run <cmd>` | Run shell command |
| `/help` | Show all commands |

## Architect Mode Planning

To create a plan with architect mode:
```
Plan Phase 1 scaffold implementation based on PHASE_01_SCAFFOLD/Claude.md
```

Then add files first:
```
/add PHASE_01_SCAFFOLD/Claude.md
/add src/
```

## Current Config

- **Model**: Opus 4.5 (architect/planning)
- **Editor Model**: Sonnet 4.5 (code edits)
- **Context**: Only `src/` by default
- **Thinking tokens**: 4096

## MCP Tools Available

- **floyd-patch**: `apply_unified_diff`, `edit_range`, `insert_at`, `delete_range`, `assess_patch_risk`
- **floyd-runner**: `run_tests`, `format`, `lint`, `build`, `detect_project`
- **web-reader**: Fetch web pages as markdown

To use MCP tools in Aider, just reference them naturally:
```
Use floyd-patch to edit lines 10-20 of src/app.tsx
Run floyd-runner build on the project
```
