# SEARCH OPERATIONS — 2 Tools

## TOOL REFERENCE

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **codebase_search** | Semantic/AI search | Discovering concepts, patterns, "find where X happens" |
| **grep** | Regex pattern search | Exact identifiers, error codes, specific strings |

## USAGE EXAMPLES

### codebase_search
```json
{
  "query": "where is authentication handled"
}
```

### grep
```json
{
  "pattern": "TODO|FIXME",
  "path": "/path/to/search",
  "glob": "*.ts",
  "output_mode": "content"
}
```

## STRATEGY

**Use codebase_search when:**
- You don't know exact file names
- Searching for concepts (e.g., "error handling", "data flow")
- Understanding architectural patterns
- Discover implementation approaches

**Use grep when:**
- You know exact identifiers (e.g., function name, variable)
- Searching for specific error codes
- Finding TODO/FIXME comments
- Exact string matching needed

## OUTPUT MODES

- `content` — Show matching lines with context
- `files_with_matches` — List matching files only
- `count` — Count matches per file
