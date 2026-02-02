# CLAUDE'S AUTONOMOUS PHASE EXECUTION PROTOCOL

**READ THIS BEFORE STARTING ANY WORK**

---

## THE RULE

You execute phases **autonomously** and **recursively**:

1. Complete Phase → **AUTO-AUDIT** → **AUTO-FIX** → **AUTO-NEXT-PHASE**
2. NO user prompts between phases
3. NO "should I continue?" questions
4. Continue until ALL 6 phases complete

---

## THE RECURSIVE LOOP

```
START PHASE N
    │
    ▼
IMPLEMENT ALL ITEMS
    │
    ▼
UPDATE phase-status.json → "complete_awaiting_audit"
    │
    ▼
ANNOUNCE: "PHASE N COMPLETE - TRIGGERING AUDIT"
    │
    ▼
INVOKE repo-critic-enforcer
    │
    ▼
READ AUDIT REPORT
    │
    ├─────────────────┤
    │                 │
  100%            < 100%
    │                 │
    ▼                 ▼
MARK "verified"   MARK "failed_audit"
    │                 │
    ▼                 ▼
ANNOUNCE:         ANNOUNCE:
"PHASE N VERIFIED" "AUDIT FAILED - FIXING"
    │                 │
    ▼                 ▼
START PHASE N+1    FIX ALL ISSUES
    │                 │
    └─────────────────┘
                    │
                    ▼
              (RE-TRIGGER AUDIT)
```

---

## TRIGGER PHRASES

Use these exact phrases when milestones happen:

### When Phase Implementation Complete
```
**PHASE {N} COMPLETE - TRIGGERING AUDIT**

All {count} items implemented:
- Item X: ✅
- Item Y: ✅
- Item Z: ✅

Invoking repo-critic-enforcer...
```

### When Audit Passes (100%)
```
**PHASE {N} VERIFIED ✅**

Audit Score: 100/100
All checks passed.

→ AUTOMATICALLY PROCEEDING TO PHASE {N+1}
```

### When Audit Fails (<100%)
```
**PHASE {N} AUDIT FAILED ❌**

Audit Score: {X}/100
Issues found: {count}

→ AUTOMATICALLY FIXING AND RE-RUNNING AUDIT
```

---

## STATUS FILE TRACKING

After each action, UPDATE `phase-status.json`:

| Action | Status Field |
|--------|-------------|
| Start phase | `status: "in_progress"` |
| Finish implementation | `status: "complete_awaiting_audit"` |
| Audit fails | `status: "failed_audit"` |
| Audit passes | `status: "verified"` |

---

## THE AGENT CHAIN

```
You (Implementation)
    ↓
Task tool: repo-critic-enforcer
    ↓
Audit report generated
    ↓
You (read report)
    ↓
    ├─ 100%? → Continue to next phase
    │           ↓
    │       You (Implementation)
    │           ↓
    │       Task tool: repo-critic-enforcer
    │           ↓ (REPEAT)
    │
    └─ <100%? → Fix issues
                ↓
            You (Implementation)
                ↓
            Task tool: repo-critic-enforcer
                ↓ (REPEAT)
```

---

## PHASE SUMMARY

| Phase | Items | Description |
|-------|-------|-------------|
| 0 | A-D | Architectural Foundation ✅ DONE |
| 1 | 1-3 | Critical Fixes |
| 2 | 4-6 | Tool Execution Fixes |
| 3 | 7-18 | Performance & QoL |
| 4 | 19-21 | Testing & Verification |
| 5 | 22-35 | Claude Alignment |

---

## CURRENT STATE

```json
{
  "currentPhase": 1,
  "phase_0": "verified",
  "phase_1": "not_started",
  "phase_2": "not_started",
  "phase_3": "not_started",
  "phase_4": "not_started",
  "phase_5": "not_started"
}
```

---

## YOUR MISSION

**Execute Phases 1-5 autonomously using the recursive loop.**

Start: Phase 1 (Critical Fixes)
End: When Phase 5 is verified

**GO GO GO**
