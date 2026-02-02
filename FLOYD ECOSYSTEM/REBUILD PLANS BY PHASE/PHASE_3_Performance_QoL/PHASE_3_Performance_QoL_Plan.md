# PHASE 3: PERFORMANCE & QUALITY OF LIFE

**RISK**: LOW
**TIME**: 2-3 hours
**ITEMS**: 12 (7-18)
**FOCUS**: Efficiency and user experience improvements

> Lower priority fixes with minimal cascading risk. Can be done incrementally.

---

## AUDIT TRAIL

| Item | ID | Status | Focus Area |
|------|-----|--------|------------|
| Complexity Classification | 7 | TODO | Performance |
| Retry Guard | 8 | TODO | Reliability |
| Quality of Life Fixes | 9-18 | TODO | UX (grouped) |

---

## ITEM 7: Complexity Classification

**Problem**: Every task gets full reasoning regardless of complexity.

**Root Cause**: No task triage before execution.

**File**: `floyd-wrapper-main/src/utils/complexity-classifier.ts` (NEW)

**Implementation**:
```typescript
const SAFE_TOOLS = ['read_file', 'list_directory', 'grep', 'codebase_search'];
const DANGEROUS_TOOLS = ['delete_file', 'git_merge', 'force_terminate'];

interface TaskComplexity {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: 'none' | 'brief' | 'full';
  maxPlanningTokens: number;
}

export function classifyComplexity(tools: string[], fileCount: number): TaskComplexity {
  if (fileCount === 1 && tools.every(t => SAFE_TOOLS.includes(t))) {
    return { level: 'LOW', reasoning: 'none', maxPlanningTokens: 100 };
  }
  if (fileCount <= 5 && !tools.some(t => DANGEROUS_TOOLS.includes(t))) {
    return { level: 'MEDIUM', reasoning: 'brief', maxPlanningTokens: 500 };
  }
  return { level: 'HIGH', reasoning: 'full', maxPlanningTokens: 2000 };
}
```

---

## ITEM 8: Retry Guard

**Problem**: No detection when stuck in retry loops.

**Root Cause**: No loop detection mechanism.

**File**: `floyd-wrapper-main/src/utils/retry-guard.ts` (NEW)

---

## ITEMS 9-18: Remaining Quality of Life Fixes

These are lower priority symptom fixes with minimal cascading risk:

| # | Item | Description | Files |
|---|------|-------------|-------|
| 9 | Edit File Fuzzy Matching | Match files by similarity when exact match fails | file tools |
| 10 | Cache Tool Clarification | Improve descriptions of cache tier behavior | cache-manager.ts |
| 11 | File Read Full Content Default | Return full content by default, not summary | file-core.ts |
| 12 | Dry-Run Support | Preview changes before applying | applicable tools |
| 13 | Cache Tier Migration | Move entries between tiers | cache-manager.ts |
| 14 | Git Branch Protection | Block pushes to main/master | git tools |
| 15 | Browser Graceful Degradation | Handle extension unavailability | browser tools |
| 16 | Extended Grep Modes | Add regex, context, before/after | grep tool |
| 17 | Browser Click Natural Language | Describe element to click, not coordinates | browser tools |
| 18 | Transaction Support | Rollback multi-file operations | transaction manager |
| 19 | Smart Search | Semantic search across files | search tools |
| 20 | Cache Usage Stats | Display hit/miss rates | cache-manager.ts |

> **Note**: These are tracked but not detailed in this document. Implementation details remain in original plan.

---

## DEPENDENCIES

All items in this phase are independent and can be fixed in any order.

## CASCADING RISKS

Minimal risk - all items are isolated improvements.

---

**Phase 3 Status**: TODO (0/12 complete)
