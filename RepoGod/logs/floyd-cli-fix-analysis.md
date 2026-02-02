# FLOYD-CLI CODE-WRITING REFUSAL: Analysis & Fix Plan

**Date:** 2026-01-27
**Agent:** RG1 (RepoGod Instance-1)
**Target:** INK/floyd-cli hardened prompt v1.3.0

---

## PART 1: ROOT CAUSE DIAGNOSIS

### The Symptom
Floyd-CLI refuses to write code. When asked to generate code, it responds with analysis and planning instead of actual code generation.

### The Root Cause
**File:** `INK/floyd-cli/src/prompts/hardened-prompt.ts`
**Lines:** 123-129 (The Killer Section)

```typescript
## Prohibited Actions (ABSOLUTE):
- MUST NEVER execute destructive commands without explicit approval
- MUST NEVER modify files outside working directory
- MUST NEVER bypass permission checks
- MUST NEVER assume file contents - MUST read first
- MUST NEVER generate code without understanding existing codebase  // ⚠️ FATAL PARADOX
- MUST NEVER execute build/test without verification
```

### The Refusal Cascade Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE DEATH SPIRAL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input: "Write a function that does X"                     │
│       ↓                                                          │
│  Agent reads: "MUST NEVER generate code without understanding"   │
│       ↓                                                          │
│  Agent internal logic: "I don't fully understand the codebase"   │
│       ↓                                                          │
│  Agent response: "Let me analyze first and create a plan..."     │
│       ↓                                                          │
│  Result: NO CODE WRITTEN                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Constraint-to-Capability Ratio Analysis

| Prompt Layer | Positive (CAN) | Negative (MUST/NEVER) | Ratio | Assessment |
|--------------|----------------|----------------------|-------|------------|
| **Layer 1: Identity** | ~12 statements | ~6 limitations | 2:1 | ✅ Healthy |
| **Layer 2: Policy** | ~6 neutral | ~35 "MUST/NEVER" | 1:6 | ❌ TOXIC |
| **Layer 3: Process** | ~8 neutral | ~15 "MUST/FOLLOW" | 1:2 | ❌ Restrictive |
| **Layer 4: SUPERCACHE** | ~12 capabilities | ~2 guidelines | 6:1 | ✅ Excellent |
| **Layer 5: Tools** | ~50 tools listed | ~6 heuristics | 8:1 | ✅ Excellent |
| **Layer 6: Format** | ~8 guidelines | ~2 requirements | 4:1 | ✅ Healthy |
| **OVERALL** | **~76** | **~62** | **1.2:1** | ⚠️ BORDERLINE |

**Problem:** Layer 2 (Policy) poisons Layer 1 (Identity) through GLM-4.7's front-loaded bias.

---

## PART 2: PROPOSED FIX - GLM-4.7 OPTIMIZED PROMPT v2.0

### Design Strategy

**1. Reorder for Front-Loaded Bias**
- Move CAN statements to front (Layer 1-2)
- Push MUST/NEVER to back (Layer 6)
- Separate capability from constraint by distance

**2. Change Language from Prohibitive to Permissive**
- Replace "MUST NEVER" with "SHOULD NOT" or "Avoid"
- Replace "MUST verify before" with "Verify after"
- Add "You are ENCOURAGED to" statements

**3. Eliminate the Paradox**
- Change: "MUST NEVER generate code without understanding"
- To: "Generate code. Then verify it works. That's how you learn."

**4. Tools as Permissions, Not Restrictions**
- Frame tools as things agent is EXPECTED to use
- Position permission system as "safety net, not wall"
- Explicit permission to write code when asked

---

## PART 3: PROOF REQUIREMENTS

### What Must Be Proven for Each Fix

#### PROOF FORMAT (Required for completion):

```
=== FIX #N: [Brief Description] ===

[1] CODE CHANGE PROOF
--------------------------
File: [path]
Lines Changed: [X-Y]
Command: [exact build command]
BUILD OUTPUT:
[paste FULL build output here - MINIMUM 10 lines]

Result: ✅ PASS | ❌ FAIL

[2] BEHAVIORAL PROOF
--------------------------
Test: [test description]
Command: [exact command to run]
OUTPUT:
[paste FULL output showing the behavior]
Expected: [what should happen]
Actual: [what actually happened]

Result: ✅ PASS | ❌ FAIL

[3] RECEIPT VERIFICATION
--------------------------
[Attach evidence that fix is working as intended]
```

### Minimum Evidence Required

| Fix Type | Code Proof Required | Behavior Proof Required | Receipt Required |
|----------|-------------------|----------------------|------------------|
| Prompt change | Full build output | Before/after agent response | Screenshot or log |
| Permission fix | Build + runtime output | Permission prompt shown | Terminal capture |
| UI integration | Build + no errors | UI renders correctly | Screenshot |
| Mode wiring | Build + no errors | Mode change affects behavior | Log output |

---

## PART 4: METRICS FOR COMPLETION

### Quantitative Metrics (Each Must Pass)

| Metric | Target | How to Measure | Proof |
|--------|--------|---------------|------|
| **Build Status** | 0 errors | `npm run build` exit code = 0 | Build log |
| **Type Errors** | 0 errors | `npm run build` output has no TypeScript errors | Build log |
| **Time to First Code** | < 30 seconds | From user request to first code line written | Timestamped log |
| **Planning Ratio** | < 1:3 | Planning tokens vs Action tokens | Token count |
| **Code Success Rate** | > 90% | Code written compiles/works | Test results |

### Qualitative Metrics (Must Pass)

| Metric | Target | Verification Method |
|--------|--------|-------------------|
| **Safety Intact** | Destructive ops still prompt | Manual test |
| **Prompt Injection Defense** | Still blocks malicious file content | Manual test |
| **Working Directory** | No writes outside CWD | Manual test |
| **Tool Usage** | All 50 tools accessible | Tool inventory |

---

## PART 5: VALIDATION RECEIPTS TO COLLECT

### Receipt Template (Required for each fix)

```
=== VALIDATION RECEIPT: FIX #[N] ===

Item: [Name of fix]
Date: [YYYY-MM-DD]
Agent: RG1
Status: COMPLETE | INCOMPLETE | BLOCKED

[1] BUILD VERIFICATION RECEIPT
-------------------------------
Command: cd [path] && npm run build

Output:
[PASTE FULL OUTPUT - Minimum 10 lines]

Exit Code: 0
Errors: 0
Warnings: [list any, or "None"]

Verification: ✅ BUILD PASSES

[2] RUNTIME VERIFICATION RECEIPT
--------------------------------
Test Case: [description]
Command: [exact command]

Input: [what was sent to agent]
Output: [agent's response]

Expected: [what should happen]
Actual: [what actually happened]

Verification: ✅ BEHAVIOR CORRECT | ❌ BEHAVIOR INCORRECT

[3] SAFETY VERIFICATION RECEIPT
------------------------------
Destructive operation test: [describe test]
Result: [prompt shown | no prompt (FAIL)]

Permission system test: [describe test]
Result: [working | bypassed (FAIL)]

Verification: ✅ SAFETY INTACT

[4] SCREENSHOT / VISUAL RECEIPT (if applicable)
-----------------------------------------
[Attach or describe screenshot]
Shows: [what the visual proof demonstrates]

---
FINAL STATUS: ✅ COMPLETE | ❌ INCOMPLETE | ⚠️ CONDITIONAL PASS
Notes: [any issues or edge cases]
Signed: RG1
```

---

## PART 6: 100% COMPLETION GUARANTEE

### What "Complete" Means

A fix item is **100% COMPLETE** ONLY when ALL of the following are true:

1. ✅ **Code is written** - The fix is implemented in source code
2. ✅ **Build passes** - `npm run build` completes with 0 errors
3. ✅ **Tests pass** - All applicable tests pass
4. **✅ Behavior verified** - Manual testing shows correct behavior
5. ✅ **Safety intact** - No safety regressions introduced
6. ✅ **Receipts collected** - All required receipts are documented
7. ✅ **No blockers** - No known bugs or issues remaining

### What "INCOMPLETE" Means

A fix is **INCOMPLETE** if ANY of the following are true:

1. ❌ Code not written
2. ❌ Build fails with errors
3. ❌ Tests fail
4. ❌ Behavior not verified
5. ❌ No receipts provided
6. ❌ Safety regression detected
7. ❌ Known blockers exist

### Moving Between Items

**RULE:** No item can be marked complete until ALL receipts are collected.

**PROCESS:**
```
Start item → Write code → Build → Verify → Collect receipts → Mark complete
     ↓
If ANY step fails:
     → Fix the issue
     → Rebuild
     → Re-verify
     → Update receipts
     → THEN mark complete
```

### Build Verification After Each Code Change

**REQUIRED PROCESS:**

1. **Write code** (Edit/Write tool)
2. **Build immediately** (Bash tool)
3. **Check output**
4. **If errors:** Fix and repeat from step 2
5. **If warnings:** Evaluate if critical
6. **Only then:** Move to verification

**NO EXCEPTIONS:**
- Do NOT batch multiple changes without building
- Do NOT claim completion without building
- Do NOT skip build to "save time"

---

## PART 7: IMPLEMENTATION CHECKLIST

### Phase 1: Create New Prompt File

| Task | Status | Receipt Required |
|------|--------|-----------------|
| [ ] Copy `hardened-prompt.ts` to `hardened-prompt-v2.ts` | ⏳ Pending | Build output |
| [ ] Reorder layers per new structure | ⏳ Pending | Diff output |
| [ ] Rewrite negative constraints to positive/neutral | ⏳ Pending | Before/after |
| [ ] Eliminate the "MUST NEVER generate code" paradox | ⏳ Pending | Code diff |
| [ ] Add tool permission section | ⏳ Pending | Code snippet |
| [ ] Update prompt version to v2.0 | ⏳ Pending | Build output |

**Completion Blocker:** Build must pass with 0 errors

### Phase 2: Update Agent Configuration

| Task | Status | Receipt Required |
|------|--------|-----------------|
| [ ] Update import to use new prompt | ⏳ Pending | Build output |
| [ ] Update any imports/references | ⏳ Pending | Build output |
| [ ] Build and verify compilation | ⏳ Pending | Full build log |
| [ ] Verify no TypeScript errors | ⏳ Pending | Error count = 0 |

**Completion Blocker:** Build must pass with 0 TypeScript errors

### Phase 3: Test Code-Writing Behavior

| Task | Status | Receipt Required |
|------|--------|-----------------|
| [ ] Test: "Write a function that sorts an array" | ⏳ Pending | Full agent response |
| [ ] Test: "Add error handling to this function" | ⏳ Pending | Full agent response |
| [ ] Test: "Create a new component" | ⏳ Pending | Full agent response |
| [ ] Verify agent writes code directly | ⏳ Pending | 3 consecutive passes |
| [ ] Measure time-to-first-code-line | ⏳ Pending | Timing measurement |

**Completion Blocker:** All 3 tests must pass with code generation

### Phase 4: Verify Safety Still Works

| Task | Status | Receipt Required |
|------|--------|-----------------|
| [ ] Test: Destructive operations still prompt | ⏳ Pending | Screenshot of prompt |
| [ ] Test: Risky commands still trigger approval | ⏳ Pending | Screenshot of prompt |
| [ ] Test: Prompt injection defense still functional | ⏳ Pending | Test output |
| [ ] Test: File operations stay within working directory | ⏳ Pending | Test output |

**Completion Blocker:** All 4 safety tests must pass

---

## PART 8: ROLLBACK PLAN

If issues arise:
1. Revert to `hardened-prompt.ts` (original)
2. Document what failed
3. Iterate with more conservative changes

**ROLLBACK RECEIPT TEMPLATE:**
```
=== ROLLBACK RECEIPT ===
Date: [timestamp]
Reason: [why rollback was needed]
Changes Reverted: [list of files]
Status: Restored to v1.3.0
```

---

## PART 9: SUCCESS CRITERIA

### Behavioral Changes (Observable)
- Agent writes code when asked
- Agent uses tools without excessive planning
- Agent still asks for dangerous operations
- Agent maintains verification discipline

### Metrics (Measurable)
- Time-to-first-code-line: < 30 seconds
- Planning-to-action ratio: < 1:3 (less planning, more doing)
- Code generation success rate: > 90%
- Safety violations: 0

---

## SIGNATURE

**Analysis by:** RG1 (RepoGod Instance-1)
**Date:** 2026-01-27
**Status:** READY FOR IMPLEMENTATION (awaiting user approval)

---

## APPENDIX: FILES TO MODIFY

1. **Primary:**
   - `INK/floyd-cli/src/prompts/hardened-prompt.ts`

2. **Possible updates:**
   - `INK/floyd-cli/src/store/floyd-store.ts` (if prompt import changes)
   - `INK/floyd-cli/src/prompts/system-prompt.ts` (for consistency)
