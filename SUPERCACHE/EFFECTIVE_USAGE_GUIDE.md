# FLOYD SUPERCACHE - Effective Usage Guide

**Version:** 2.0
**Last Updated:** 2026-02-01
**Status:** Production Ready

---

## Table of Contents

1. [What is SUPERCACHE?](#what-is-supercache)
2. [The Three-Tier Architecture](#the-three-tier-architecture)
3. [Core Tools & When to Use Them](#core-tools--when-to-use-them)
4. [Effective Usage Patterns](#effective-usage-patterns)
5. [Key Naming Conventions](#key-naming-conventions)
6. [Cache Hygiene & Maintenance](#cache-hygiene--maintenance)
7. [Advanced Workflows](#advanced-workflows)
8. [Troubleshooting](#troubleshooting)

---

## What is SUPERCACHE?

SUPERCACHE is a **persistent, cross-session memory system** for Claude Code. It survives:
- Session restarts
- Claude Code updates
- System reboots
- Project switches

**Key Value Proposition:** Remember everything important, forget nothing useful.

---

## The Three-Tier Architecture

```
.floyd/.cache/
├── reasoning/          # Tier 1: Ephemeral reasoning frames
│   ├── active/         # Current thinking process
│   └── archive/        # Past reasoning (searchable)
├── project/            # Tier 2: Project chronicle
│   ├── state_snapshot.json
│   ├── phase_summaries/
│   └── context/
└── vault/              # Tier 3: Solution patterns (reusable)
    ├── patterns/
    └── index/
```

### Tier 1: Reasoning Frames (Short-Term Memory)
**Purpose:** Capture your thinking process AS IT HAPPENS
**TTL:** Hours to days
**Use for:** Active problem-solving, debugging, exploration

### Tier 2: Project Chronicle (Medium-Term Memory)
**Purpose:** Project state, phases, decisions made
**TTL:** Days to weeks
**Use for:** Project status, phase completions, errors encountered

### Tier 3: Solution Vault (Long-Term Memory)
**Purpose:** Reusable patterns, proven solutions
**TTL:** Permanent (until explicitly deleted)
**Use for:** Code patterns, architectures, configurations

---

## Core Tools & When to Use Them

### 1. `cache_store` - Store Any Data

```typescript
// Basic storage
mcp__floyd_supercache__cache_store({
  key: "my:data",
  value: { important: "information" }
})

// With TTL (seconds)
mcp__floyd_supercache__cache_store({
  key: "temp:data",
  value: { expires: "soon" },
  ttl: 3600  // 1 hour
})
```

**When to use:**
- Storing intermediate results
- Saving computed data for reuse
- Caching API responses

### 2. `cache_retrieve` - Retrieve Stored Data

```typescript
const data = mcp__floyd_supercache__cache_retrieve({
  key: "my:data"
})
```

**When to use:**
- Checking if something was already computed
- Resuming interrupted work
- Looking up past decisions

### 3. `cache_store_reasoning` - Capture Your Thinking

```typescript
mcp__floyd_supercache__cache_store_reasoning({
  context: "architecture_decision_2024-02-01",
  reasoning: "Considered Axum vs Actix-web. Axum has better async trait support which is critical for our concurrent attestation processing. Actix-web has larger ecosystem but Axum's type-safe routing prevents entire classes of bugs.",
  conclusion: "Selected Axum 0.7 for STAT backend"
})
```

**When to use:**
- AFTER making any significant decision
- WHEN choosing between alternatives
- AFTER solving a difficult bug
- WHEN rejecting a suggested approach

### 4. `cache_load_reasoning` - Recall Past Thinking

```typescript
const past = mcp__floyd_supercache__cache_load_reasoning({
  context: "architecture_decision_2024-02-01"
})
```

**When to use:**
- Starting a new session on an ongoing project
- Someone asks "why did we do it this way?"
- Reviewing decisions before making changes

### 5. `cache_store_pattern` - Save Reusable Solutions

```typescript
mcp__floyd_supercache__cache_store_pattern({
  signature: "nextauth_middleware_role_check_v1",
  pattern: {
    name: "NextAuth Middleware with Role-Based Access",
    trigger_terms: ["auth middleware", "role check", "protected route"],
    code: `export { default } from "next-auth/middleware"
export const config = { matcher: ["/dashboard/:path*"] }

const roleHierarchy = { admin: 3, moderator: 2, user: 1 }

export function middleware(req: NextRequest) {
  const token = getToken({ req })
  if (!token?.role) return NextResponse.redirect(new URL("/login", req.url))
  // ... rest of pattern
    `,
    category: "auth_flow",
    success_count: 1,
    complexity_score: 0.6
  }
})
```

**When to use:**
- AFTER implementing something that works perfectly
- WHEN user says "that's exactly what I needed"
- AFTER solving a problem you might encounter again

### 6. `cache_search` - Find Cached Content

```typescript
const results = mcp__floyd_supercache__cache_search({
  query: "attestation authorization",
  tier: "all"  // or "reasoning", "project", "vault"
})
```

**When to use:**
- Starting work on a familiar topic
- Looking for past solutions
- Checking if something was already decided

### 7. `cache_stats` - Health Check

```typescript
const stats = mcp__floyd_supercache__cache_stats({})
```

**When to use:**
- BEFORE starting a new session
- WHEN cache seems slow
- AFTER cache cleanup

### 8. `cache_prune` - Remove Old Data

```typescript
mcp__floyd_supercache__cache_prune({
  older_than: "7d",
  tier: "reasoning"
})
```

**When to use:**
- Routine maintenance (weekly)
- WHEN cache_stats shows large size
- AFTER project completion

---

## Effective Usage Patterns

### Pattern 1: The Decision Cycle

Always store reasoning BEFORE and AFTER decisions:

```typescript
// BEFORE: Store consideration
mcp__floyd_supercache__cache_store_reasoning({
  context: "api_design_2024-02-01_consideration",
  reasoning: "Need to choose between REST and GraphQL. REST is simpler but GraphQL gives frontend more flexibility.",
  conclusion: "PENDING DECISION"
})

// ... do research, discuss ...

// AFTER: Store final decision
mcp__floyd_supercache__cache_store_reasoning({
  context: "api_design_2024-02-01_final",
  reasoning: "After evaluation, GraphQL adds complexity without clear benefit. Our data model is hierarchical, REST works fine.",
  conclusion: "Selected REST with OpenAPI spec"
})
```

### Pattern 2: The Exploration Log

While exploring codebases, store your findings:

```typescript
mcp__floyd_supercache__cache_store({
  key: "exploration:auth_system_2024-02-01",
  value: {
    findings: [
      "Auth uses NextAuth v5 beta",
      "Roles stored in user.role field",
      "Middleware at /middleware.ts",
      "No role hierarchy implemented yet"
    ],
    files_read: [
      "src/app/middleware.ts",
      "src/lib/auth.ts",
      "prisma/schema.prisma"
    ],
    timestamp: new Date().toISOString()
  }
})
```

### Pattern 3: The Bug Resolution

When you solve a bug, store it for posterity:

```typescript
mcp__floyd_supercache__cache_store({
  key: "bug_fix:infinite_render_2024-02-01",
  value: {
    symptom: "Infinite re-render loop in useEffect",
    cause: "Missing dependency in useEffect array + state update in render",
    solution: "Added proper dependency array and moved state update to useEffect callback",
    files: ["src/components/StatusBar.tsx"],
    diff_summary: "Changed dependency from [] to [data, status]"
  }
})
```

### Pattern 4: The Pattern Extraction

After implementing something reusable:

```typescript
mcp__floyd_supercache__cache_store_pattern({
  signature: "ink_tui_component_v1",
  pattern: {
    name: "Ink TUI Component Template",
    trigger_terms: ["ink", "tui", "terminal ui"],
    category: "ui_component",
    code: `import { Box, Text } from 'ink'

export const MyComponent = ({ prop1, prop2 }) => (
  <Box borderStyle="round" padding={1}>
    <Text>{prop1}</Text>
  </Box>
)`,
    complexity_score: 0.3
  }
})
```

---

## Key Naming Conventions

Use **consistent, searchable** key names:

### Pattern: `category:entity:version`

```typescript
// Good keys
"decision:auth_method:final"
"pattern:react_hoc:v2"
"exploration:codebase_structure:2024-02-01"
"bug_fix:text_doubling:tui"
"reasoning:architecture_nextjs_vs_remix"

// Bad keys (don't do this)
"stuff"           // too vague
"data"            // meaningless
"temp1"           // not searchable
"a"               // useless
```

### Date Format
Always use ISO 8601: `2024-02-01` or `2024-02-01T14:30:00Z`

### Versioning
Use semantic versions for patterns:
```typescript
pattern_name_v1  // First version
pattern_name_v2  // Second version (when API changes)
```

---

## Cache Hygiene & Maintenance

### Daily Habits

```typescript
// 1. At session start: Check cache status
mcp__floyd_supercache__cache_stats({})

// 2. Before big decisions: Search past reasoning
mcp__floyd_supercache__cache_search({
  query: keywords_from_current_problem
})

// 3. After solving: Store the solution
mcp__floyd_supercache__cache_store_reasoning({...})
```

### Weekly Maintenance

```typescript
// 1. Archive old reasoning frames
mcp__floyd_supercache__cache_prune({
  older_than: "7d",
  tier: "reasoning"
})

// 2. Review and promote patterns to vault
// (Manually review archived reasoning for reusable patterns)

// 3. Check cache health
mcp__floyd_supercache__cache_stats({})
```

### Project Completion

```typescript
// 1. Archive project chronicle
mcp__floyd_supercache__cache_store({
  key: `project:${project_name}:final_summary`,
  value: {
    completed: new Date().toISOString(),
    phases_completed: [...],
    total_changes: count,
    lessons_learned: [...]
  }
})

// 2. Extract reusable patterns
// (Review vault and extract cross-project patterns)

// 3. Clear ephemeral data
mcp__floyd_supercache__cache_clear({ tier: "reasoning" })
```

---

## Advanced Workflows

### Workflow 1: Cross-Session Context Recovery

```typescript
// Session 1: Store context
mcp__floyd_supercache__cache_store({
  key: "session:context:active",
  value: {
    task: "Implementing TUI text doubling fix",
    files: ["src/ui/layouts/terminal.tsx"],
    progress: "Found issue in render loop",
    next_steps: ["Fix state update", "Test with npm test"]
  }
})

// Session 2 (later): Resume
const context = mcp__floyd_supercache__cache_retrieve({
  key: "session:context:active"
})

// Output: I was working on TUI text doubling fix...
```

### Workflow 2: Decision Review Board

```typescript
// Store all decisions with a common prefix
mcp__floyd_supercache__cache_store_reasoning({
  context: `decision:${Date.now()}:tech_stack`,
  reasoning: "...",
  conclusion: "Next.js 14 + TypeScript + Tailwind"
})

// Later: Review all decisions
const decisions = mcp__floyd_supercache__cache_search({
  query: "decision:",
  tier: "all"
})
```

### Workflow 3: Pattern Library Building

```typescript
// After each successful implementation
mcp__floyd_supercache__cache_store_pattern({
  signature: `${category}:${pattern_name}_v${version}`,
  pattern: {
    name: "Human readable name",
    trigger_terms: [...],
    code: "...",
    category,
    success_count: 1,
    complexity_score: estimated_complexity
  }
})

// When starting similar work
const patterns = mcp__floyd_supercache__cache_search({
  query: "react component",
  tier: "vault"
})
```

---

## Troubleshooting

### Cache Miss (Key Not Found)

```typescript
// Before using cached data, always check
const result = mcp__floyd_supercache__cache_retrieve({
  key: "my:key"
})

if (result.error === "CACHE_MISS") {
  // Handle gracefully - compute fresh or store first
}
```

### Cache Corruption

```typescript
// If cache behaves strangely, clear and rebuild
mcp__floyd_supercache__cache_clear({})
mcp__floyd_supercache__cache_store({
  key: "cache:init",
  value: { initialized: new Date().toISOString() }
})
```

### Slow Performance

```typescript
// 1. Check cache size
const stats = mcp__floyd_supercache__cache_stats({})

// 2. If too large, prune old entries
mcp__floyd_supercache__cache_prune({
  older_than: "30d",
  tier: "reasoning"
})
```

### Search Not Finding Results

```typescript
// Use broader search terms
mcp__floyd_supercache__cache_search({
  query: "auth",  // Not "authentication middleware role check"
  tier: "all"     // Not "vault"
})
```

---

## Quick Reference Card

| Tool | Purpose | Use When |
|------|---------|----------|
| `cache_store` | Store any data | Saving results, caching |
| `cache_retrieve` | Get stored data | Resuming work, checking cache |
| `cache_delete` | Remove specific key | Cleanup, outdated data |
| `cache_clear` | Wipe a tier | Fresh start, corruption |
| `cache_list` | List all keys | Discovery, audit |
| `cache_search` | Search content | Finding past work |
| `cache_stats` | Get cache metrics | Health check |
| `cache_prune` | Remove old entries | Maintenance |
| `cache_store_pattern` | Save reusable solution | Successful implementation |
| `cache_store_reasoning` | Capture decision logic | After decisions |
| `cache_load_reasoning` | Recall decision logic | Resuming project |
| `cache_archive_reasoning` | Move to archive | End of session/phase |

---

## Best Practices Summary

1. **BEFORE major work:** Search cache for relevant past work
2. **DURING decisions:** Store reasoning with context
3. **AFTER success:** Extract reusable patterns
4. **ON completion:** Archive and summarize
5. **REGULARLY:** Prune old data, check stats

---

**For more details, see:**
- Technical Blueprint: `INK/floyd-agent-sandbox/docs/# FLOYD-S SUPERCACHE TECHNICAL IMPLEMENTATION BLUEPRINT.md`
- MCP Server: `/Volumes/Storage/MCP/floyd-supercache-server/`

