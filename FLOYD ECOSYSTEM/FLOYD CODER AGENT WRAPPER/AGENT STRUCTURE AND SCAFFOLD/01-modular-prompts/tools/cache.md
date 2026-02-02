# SUPERCACHE — 3-Tier Memory System

## ARCHITECTURE

```
┌─────────────────┬──────────────────┬───────────────────┐
│   Reasoning     │     Project      │       Vault       │
│   (5 min TTL)   │   (24 hr TTL)    │   (7 day TTL)    │
├─────────────────┼──────────────────┼───────────────────┤
│ Active convo    │ Session work     │ Reusable patterns │
│ Short-term mem  │ File edits       │ Best practices    │
│ High churn      │ Medium churn     │ Long-term memory  │
└─────────────────┴──────────────────┴───────────────────┘
```

## TOOL REFERENCE (12 tools)

### Core Operations (6)
| Tool | Purpose |
|------|---------|
| **cache_store** | Store data in tier |
| **cache_retrieve** | Retrieve from tier |
| **cache_delete** | Delete entry |
| **cache_clear** | Clear entire tier |
| **cache_list** | List entries |
| **cache_search** | Search within tier |

### Statistics & Maintenance (2)
| Tool | Purpose |
|------|---------|
| **cache_stats** | Get cache statistics |
| **cache_prune** | Remove expired entries |

### Advanced Operations (4)
| Tool | Purpose |
|------|---------|
| **cache_store_pattern** | Crystallize solution to Vault (7-day retention) |
| **cache_store_reasoning** | Store thinking chain (5-min retention) |
| **cache_load_reasoning** | Load previous thinking chain |
| **cache_archive_reasoning** | Move Reasoning → Project (extends to 24-hr) |

## WHEN TO USE EACH TIER

### Reasoning (5 min)
- Active problem-solving context
- Multi-step reasoning chains
- Temporary calculations
- Working memory for current task

### Project (24 hr)
- File modifications made this session
- Architectural decisions
- Test results
- Bug findings

### Vault (7 day)
- Reusable patterns (e.g., "React + TypeScript setup pattern")
- Best practices learned
- Solutions to common problems
- Successful approaches

## STRATEGY

1. **Check cache first** — Before expensive operations, check if we've seen this before
2. **Store reasoning** — For complex multi-step solutions
3. **Crystallize patterns** — When you solve something reusable
4. **Archive smartly** — Move valuable reasoning to Project tier before it expires

## EXAMPLES

### Before codebase_search
```json
cache_retrieve({ "tier": "vault", "key": "authentication-pattern" })
```

### After solving complex problem
```json
cache_store_pattern({ "key": "jwt-validation-pattern", "value": "..." })
```

### During multi-step task
```json
cache_store_reasoning({ "key": "current-task-plan", "value": "..." })
```
