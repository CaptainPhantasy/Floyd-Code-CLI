# Floyd CLI Systematic Refactor Plan

**Date**: 2026-01-29
**Scope**: 27 items total (18 original + 5 high-priority + 4 architectural)
**Strategy**: Root-cause-first with cascading-risk-aware phases

---

## ROOT CAUSE ANALYSIS

| Fix | Type | Cascading Risk |
|-----|------|----------------|
| Terminal ENOENT | SYMPTOM | HIGH - affects 30+ tools |
| YOLO Mode | ROOT_CAUSE | HIGH - security model |
| Dynamic Prompts | ROOT_CAUSE | LOW - localized |
| Tool Validation | SYMPTOM | MEDIUM - error propagation |
| Error Responses | SYMPTOM | MEDIUM - UX impact |
| **Provider Abstraction (NEW)** | **ROOT_CAUSE** | **CRITICAL - API failures** |
| **State Management (NEW)** | **ROOT_CAUSE** | **HIGH - consistency** |
| **Configuration (NEW)** | **ROOT_CAUSE** | **HIGH - maintenance** |
| **Permission System (NEW)** | **ROOT_CAUSE** | **HIGH - security** |

---

## EXECUTION STRATEGY

### Must-Fix-Together Groups

**GROUP A: Architectural Foundation** (Phase 0)
- Items A-D: Provider Abstraction, State Management, Configuration, Permission System
- MUST FIX TOGETHER - tightly coupled
- Risk: HIGH
- Time: 3-4 hours

**GROUP B: Permission System** (Phase 1)
- YOLO mode + permission descriptions
- Risk: HIGH - security

**GROUP C: Tool Execution** (Phase 2)
- Terminal ENOENT + parameter validation + error responses
- Risk: MEDIUM

---

## PHASE 0: ARCHITECTURAL FOUNDATION (FIX TOGETHER)

### Item A: Unified Permission System (NEW - CRITICAL)
**Status**: TODO
**Files**:
- `packages/floyd-agent-core/src/permissions/unified-permission.ts` (NEW)
- `INK/floyd-cli/src/permissions/tool-policy.ts`
- `floyd-wrapper-main/src/permissions/permission-manager.ts`

### Item B: Configuration Standardization (NEW - CRITICAL)
**Status**: TODO
**Files**:
- `packages/floyd-agent-core/src/config/floyd-config.ts` (NEW)
- `floyd-wrapper-main/src/config/`
- `INK/floyd-cli/src/utils/config.ts`

### Item C: Provider Abstraction Layer (NEW - CRITICAL)
**Status**: TODO
**Files**:
- `packages/floyd-agent-core/src/llm/llm-client.ts` (NEW)
- `floyd-wrapper-main/src/llm/glm-client.ts`

### Item D: State Management Unification (NEW - HIGH)
**Status**: TODO
**Files**:
- `packages/floyd-agent-core/src/state/floyd-state.ts` (NEW)
- `INK/floyd-cli/src/store/floyd-store.ts`

---

## PHASE 1: CRITICAL FIXES (ROOT CAUSES)

### Item 1: Dynamic Prompt Generation
**Status**: TODO
**Files**: `INK/floyd-cli/src/prompts/system-prompt.ts`

### Item 2: YOLO Mode Permission Consistency
**Status**: TODO
**Files**: `INK/floyd-cli/src/config/available-tools.ts`

### Item 3: Desktop promptStyle UI Selector
**Status**: TODO
**Files**: `FloydDesktopWeb/server/index.ts`

---

## PHASE 2: TOOL EXECUTION FIXES

### Item 4: Terminal Tool ENOENT
**Status**: TODO
**Files**: `floyd-wrapper-main/src/tools/system/index.ts`

### Item 5: Tool Parameter Validation
**Status**: TODO
**Files**: `floyd-wrapper-main/src/tools/file/file-core.ts`

### Item 6: Standardized Error Responses
**Status**: TODO
**Files**: `floyd-wrapper-main/src/tools/types.ts` (NEW)

---

## PHASE 3: PERFORMANCE & QUALITY OF LIFE

### Item 7: Complexity Classification
**Status**: TODO

### Item 8: Retry Guard
**Status**: TODO

### Items 9-18: Quality of Life Fixes
**Status**: TODO (includes: fuzzy edit, cache tools, dry-run, migration, git protection, browser errors, grep modes, browser click, transactions, smart search, cache stats)

---

## PHASE 4: TESTING & VERIFICATION

### Item 19: E2E Tests for Desktop Tools
**Status**: TODO

### Item 20: CLI Swarm Dispatch Verification
**Status**: TODO

### Item 21: Testing Feedback List
**Status**: TODO

---

## PROGRESS TRACKING

| Phase | Items | Complete | Blocked |
|-------|-------|----------|---------|
| 0 | A-D (4) | 0 | 0 |
| 1 | 1-3 (3) | 0 | 0 |
| 2 | 4-6 (3) | 0 | 0 |
| 3 | 7-18 (12) | 0 | 0 |
| 4 | 19-21 (3) | 0 | 0 |
| **TOTAL** | **27** | **0** | **0** |

---

## CRITICAL PATH WARNINGS

1. **Phase 0 MUST BE DONE FIRST** - Items A-D are tightly coupled. Fixing one without others will break the system.

2. **Phase 1 Item 2 depends on Phase 0** - YOLO mode fix requires unified permission system from Phase 0.

3. **Provider Abstraction is CRITICAL** - GLM uses OpenAI format. Wrong abstraction will break API communication.

---

## CHANGE LOG

| Date | Phase/Item | Status | Notes |
|------|-----------|--------|-------|
| 2026-01-29 | Plan created | TODO | Root cause analysis completed, 27 items identified across 5 phases |
