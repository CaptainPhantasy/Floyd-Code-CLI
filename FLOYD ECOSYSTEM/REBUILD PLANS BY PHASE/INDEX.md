# FLOYD CLI SYSTEMATIC REFACTOR PLAN - PHASE INDEX

**Date**: 2026-01-29
**Total Items**: 35 (A-D + 1-35)
**Total Phases**: 6 (0-5)

---

## PHASE OVERVIEW

| Phase | Items | Risk | Time | Focus | Status |
|-------|-------|------|------|-------|--------|
| [0 - Architectural Foundation](./PHASE_0_Architectural_Foundation.md) | A-D (4) | HIGH | 3-4h | Foundation | TODO |
| [1 - Critical Fixes](./PHASE_1_Critical_Fixes.md) | 1-3 (3) | HIGH | 1-2h | Root Causes | TODO |
| [2 - Tool Execution Fixes](./PHASE_2_Tool_Execution_Fixes.md) | 4-6 (3) | MEDIUM | 1h | Reliability | TODO |
| [3 - Performance & QoL](./PHASE_3_Performance_QoL.md) | 7-18 (12) | LOW | 2-3h | UX | TODO |
| [4 - Testing & Verification](./PHASE_4_Testing_Verification.md) | 19-21 (3) | LOW | 1h | Coverage | TODO |
| [5 - Claude Alignment](./PHASE_5_Claude_Alignment.md) | 22-35 (14) | LOW | 8-10d | Parity | TODO |

---

## EXECUTION PATH

```
Phase 0 (Architectural Foundation)
    ├─ Item A: Unified Permission System
    ├─ Item B: Configuration Standardization
    ├─ Item C: Provider Abstraction Layer
    └─ Item D: State Management Unification
           ↓
Phase 1 (Critical Fixes)
    ├─ Item 1: Dynamic Prompt Generation
    ├─ Item 2: YOLO Mode Permission Consistency (depends on Phase 0 Item A)
    └─ Item 3: Desktop promptStyle UI Selector
           ↓
Phase 2 (Tool Execution Fixes)
    ├─ Item 4: Terminal Tool ENOENT
    ├─ Item 5: Tool Parameter Validation
    └─ Item 6: Standardized Error Responses
           ↓
Phase 3 (Performance & QoL)
    ├─ Item 7: Complexity Classification
    ├─ Item 8: Retry Guard
    └─ Items 9-18: Quality of Life Fixes
           ↓
Phase 4 (Testing & Verification)
    ├─ Item 19: E2E Tests for Desktop Tools
    ├─ Item 20: CLI Swarm Dispatch Verification
    └─ Item 21: Testing Feedback List
           ↓
Phase 5 (Claude Alignment)
    ├─ Items 22-24: P0 (Hooks, Agents, /plan)
    ├─ Items 25-26: P1 (LSP, /pr)
    ├─ Items 27-30: P2 (permissions, thinking, editor, context)
    └─ Items 31-35: P3 (notebook, vim, history, sessions, MCP)
```

---

## CRITICAL DEPENDENCIES

| Phase | Depends On | Reason |
|-------|------------|--------|
| Phase 1 Item 2 | Phase 0 Item A | Full permission fix requires unified system |
| Phase 5 Item 23 | Phase 5 Item 22 | Agent frontmatter uses hooks |
| Phase 5 Item 24 | Phase 5 Item 22 | Planning mode uses hooks |

---

## AUDIT SUMMARY

### Items by Status
- TODO: 35/35 (100%)
- In Progress: 0/35
- Complete: 0/35

### Items by Priority
- P0 (Critical): 7 items
- P1 (High): 2 items
- P2 (Medium): 4 items
- P3 (Low): 6 items
- Architectural: 4 items
- Testing: 3 items
- QoL: 9 items

---

## VERIFICATION PROTOCOL

Per Phase:
1. Build: `npm run build` succeeds
2. Smoke Test: Test all fixes in phase
3. Regression: Ensure nothing broke
4. Code Diff: Present actual diffs

Final Verification:
1. All 35 items complete
2. Full build succeeds
3. All smoke tests pass
4. E2E tests pass
5. Documentation updated
6. Claude parity checklist verified

---

**Overall Progress**: 0/35 complete (0%)
