# FLOYD CLI REBUILD - Phase Completion Hook

**Purpose**: Automated quality gate system ensuring each phase is 100% complete before proceeding.

---

## THE LOOP

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE COMPLETION LOOP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ 1. COMPLETE  │───▶│ 2. CRITIC    │───▶│ 3. FIX       │      │
│  │    PHASE     │    │   AUDIT      │    │   ISSUES     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │              │
│         │            100% PASS │            NEEDS FIX           │
│         └─────────────────────┴───────────────────┘             │
│                           │                                     │
│                           ▼                                     │
│                  ┌──────────────┐                               │
│                  │ 4. NEXT      │                               │
│                  │    PHASE     │                               │
│                  └──────────────┘                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## TRIGGER CONDITION

The Phase Completion Hook triggers when:

```typescript
// Phase marked as complete by implementer
phase_status.status === "complete_awaiting_audit"
```

---

## STATUS FILE: `phase-status.json`

```json
{
  "currentPhase": 1,
  "phases": {
    "0": {
      "name": "Architectural Foundation",
      "status": "verified",
      "items": ["A", "B", "C", "D"],
      "completedItems": ["A", "B", "C", "D"],
      "auditScore": 100,
      "lastAuditAt": "2026-02-01T20:00:00Z",
      "criticReport": "phase_0_audit_report.md"
    },
    "1": {
      "name": "Critical Fixes",
      "status": "in_progress",
      "items": [1, 2, 3],
      "completedItems": [],
      "auditScore": null,
      "lastAuditAt": null,
      "criticReport": null
    }
  },
  "auditHistory": []
}
```

### Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `not_started` | Phase not begun | Start phase |
| `in_progress` | Work in progress | Continue work |
| `complete_awaiting_audit` | **TRIGGER HOOK** | Run repo-critic-enforcer |
| `verified` | Critic approved 100% | Move to next phase |
| `failed_audit` | Critic found issues | Fix and re-run audit |
| `blocked` | Blocked by dependency | Resolve blocker |

---

## HOOK PROTOCOL

### Step 1: Mark Phase Complete

Implementer updates `phase-status.json`:

```json
{
  "currentPhase": 1,
  "phases": {
    "1": {
      "status": "complete_awaiting_audit",
      "completedItems": [1, 2, 3]
    }
  }
}
```

### Step 2: Auto-Trigger Critic (Claude executes)

```bash
claude "You are the repo-critic-enforcer agent.
Audit Phase 1 completion.
Read: FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/PHASE_1_Critical_Fixes.md
Verify: All items implemented, build passes, lint passes, no regressions.
Generate report. If 100%, approve. If not, list fixes needed."
```

### Step 3: Critic Generates Report

`phase_1_audit_report.md`:

```markdown
# PHASE 1 AUDIT REPORT

**Date**: 2026-02-01
**Auditor**: repo-critic-enforcer
**Score**: 85/100

## VERIFICATION RESULTS

| Item | Status | Notes |
|------|--------|-------|
| 1 | ✅ PASS | Dynamic prompts working |
| 2 | ❌ FAIL | YOLO mode still inconsistent |
| 3 | ✅ PASS | Desktop selector implemented |

## ISSUES FOUND

1. **HIGH**: YOLO mode still prompts for moderate tools
   - File: INK/floyd-cli/src/config/available-tools.ts:42
   - Fix: Remove "requires permission" from description

2. **MEDIUM**: Test coverage low for Item 2
   - Add: YOLO mode permission tests

## VERDICT

**STATUS**: ❌ FAILED - Needs fixes before Phase 2
**REQUIRED ACTIONS**: Fix Item 2, add tests, re-run audit
```

### Step 4: Update Status

```json
{
  "phases": {
    "1": {
      "status": "failed_audit",
      "auditScore": 85,
      "lastAuditAt": "2026-02-01T20:15:00Z",
      "criticReport": "phase_1_audit_report.md"
    }
  }
}
```

### Step 5: Fix Issues (Implementer)

Fix the issues, then **return to Step 1** with `status: "complete_awaiting_audit"`

### Step 6: When 100% Approved

```json
{
  "phases": {
    "1": {
      "status": "verified",
      "auditScore": 100,
      "criticReport": "phase_1_audit_report.md"
    }
  },
  "currentPhase": 2
}
```

**→ PROCEED TO PHASE 2**

---

## CRITIC APPROVAL CRITERIA

The repo-critic-enforcer MUST verify:

### 1. Implementation Completeness
- [ ] All items in phase implemented
- [ ] Code follows planned architecture
- [ ] No TODO/FIXME placeholders

### 2. Build & Test
- [ ] `npm run build` passes (exit code 0)
- [ ] `npm run lint` passes (exit code 0)
- [ ] Tests pass (if tests exist)

### 3. No Regressions
- [ ] Previous phases still work
- [ ] No new breaking changes
- [ ] Git diff reviewed

### 4. Documentation
- [ ] Phase plan updated with completion status
- [ ] Audit report generated
- [ ] phase-status.json accurate

### SCORING

| Score | Status | Meaning |
|-------|--------|---------|
| 100 | ✅ VERIFIED | Perfect, proceed to next phase |
| 90-99 | ⚠️ MINOR | Minor issues, fix recommended |
| 70-89 | ❌ NEEDS FIX | Must fix before proceeding |
| <70 | ❌ FAILED | Major issues, re-implement |

---

## AUDIT HISTORY

Each audit is logged:

```json
{
  "auditHistory": [
    {
      "phase": 1,
      "timestamp": "2026-02-01T20:00:00Z",
      "score": 85,
      "status": "failed_audit",
      "issues": ["YOLO mode inconsistent", "Missing tests"]
    },
    {
      "phase": 1,
      "timestamp": "2026-02-01T21:30:00Z",
      "score": 100,
      "status": "verified",
      "issues": []
    }
  ]
}
```

---

## FULLY AUTONOMOUS RECURSIVE PROTOCOL

### CLAUDE'S RESPONSIBILITY - NO USER INPUT REQUIRED

When Claude completes a phase implementation:

1. **AUTOMATICALLY** update `phase-status.json` with `"complete_awaiting_audit"`
2. **AUTOMATICALLY** announce: `**PHASE {N} COMPLETE - TRIGGERING AUDIT**`
3. **AUTOMATICALLY** invoke repo-critic-enforcer agent via Task tool
4. **AUTOMATICALLY** read audit report and check score

If score == 100:
- Update status to `"verified"`
- Announce: `**PHASE {N} VERIFIED ✅ - MOVING TO PHASE {N+1}**`
- **AUTOMATICALLY** begin Phase {N+1} implementation
- **LOOP CONTINUES**

If score < 100:
- Update status to `"failed_audit"`
- Announce: `**PHASE {N} AUDIT FAILED {score}/100 - FIXING ISSUES**`
- **AUTOMATICALLY** fix all issues found
- **AUTOMATICALLY** re-run audit from step 1
- **LOOP CONTINUES** until 100%

### CRITICAL: RECURSIVE BEHAVIOR

```
Claude completes Phase N
    ↓
Claude marks "complete_awaiting_audit"
    ↓
Claude says "PHASE N COMPLETE - TRIGGERING AUDIT"
    ↓
Claude invokes repo-critic-enforcer
    ↓
Claude reads audit report
    ↓
    ├─ 100%? → Claude marks "verified"
    │           Claude says "PHASE N VERIFIED"
    │           Claude AUTOMATICALLY starts Phase N+1
    │           ↓ (LOOP)
    │
    └─ <100%? → Claude marks "failed_audit"
                Claude says "AUDIT FAILED - FIXING"
                Claude fixes issues
                Claude re-triggers audit
                ↓ (RECURSE)
```

### DO NOT WAIT FOR USER

- ❌ DO NOT ask "Should I proceed?"
- ❌ DO NOT ask "Should I fix issues?"
- ✅ DO complete phase → audit → fix → audit → next phase
- ✅ DO continue recursively until all phases done

---

## FILE LOCATIONS

- **Status File**: `FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/phase-status.json`
- **This Hook**: `FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/PHASE_COMPLETION_HOOK.md`
- **Audit Reports**: `FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/AUDIT_REPORTS/`
- **Phase Plans**: `FLOYD ECOSYSTEM/REBUILD PLANS BY PHASE/PHASE_*.md`

---

*This hook ensures quality gates are never bypassed. Every phase must be 100% verified before proceeding.*
