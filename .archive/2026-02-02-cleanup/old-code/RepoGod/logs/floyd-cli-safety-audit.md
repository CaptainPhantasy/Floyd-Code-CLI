# FLOYD-CLI SAFETY CONTROL AUDIT
**Date:** 2026-01-27
**Agent:** RepoGod (Instance-Adaptive Scaling Mode)
**Scope:** Complete safety control inspection for floyd-cli environment

---

## EXECUTIVE SUMMARY

**Finding:** The safety control system has **8 critical gaps** that create a disconnect between user expectations and actual behavior.

**Status:** ⚠️ SAFETY CONTROLS ARE PRESENT BUT NOT VISIBLE TO USERS

**Key Issue:** The permission system defaults to **DENY** when no prompt function is registered, but users don't see this happening.

---

## PART 1: SAFETY CONTROL ARCHITECTURE

### 1.1 Permission System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERMISSION SYSTEM LAYERS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: Tool Definitions (available-tools.ts)                         │
│  ├── 50 tools with permission levels: 'none', 'ask', 'dangerous'       │
│  └── Example: read_file='none', write='ask', delete_file='dangerous'    │
│                                                                         │
│  Layer 2: Permission Manager (floyd-wrapper-main)                       │
│  ├── requestPermission() - Prompts user for approval                   │
│  ├── Auto-approve for 'none' permission tools                          │
│  └── Falls back to DENY if no prompt function registered               │
│                                                                         │
│  Layer 3: Execution Engine (execution-engine.ts)                        │
│  ├── Reads process.env.FLOYD_MODE for mode                             │
│  ├── Modes: fuckit, yolo, plan, ask, auto, dialogue                    │
│  └── Calls permissionManager.requestPermission()                       │
│                                                                         │
│  Layer 4: Floyd Store (floyd-store.ts)                                 │
│  ├── safetyMode state: 'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue'   │
│  ├── toggleSafetyMode() - cycles through modes                         │
│  ├── setSafetyMode() - sets specific mode                              │
│  └── Persisted to storage but NOT wired to execution                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mode Definitions

| Mode | Tool Permission Behavior | Expected User Control |
|------|-------------------------|----------------------|
| **fuckit** | ALL permissions granted, NO restrictions | 🔴 DANGEROUS - No safety |
| **yolo** | Safe tools auto-approved, dangerous still require permission | 🟡 MODERATE - Partial safety |
| **plan** | ONLY read-only tools allowed, all writes blocked | 🟢 SAFE - Read-only |
| **ask** | Default: ask for all tools except 'none' | 🟢 SAFE - Explicit approval |
| **auto** | Same as 'ask' (per code comment) | 🟢 SAFE - Explicit approval |
| **dialogue** | Quick chat mode, one line at a time | 🟢 SAFE - No tool use |

---

## PART 2: CRITICAL GAPS IDENTIFIED

### GAP #1: Silent Permission Denial (CRITICAL)

**Location:** `floyd-wrapper-main/src/permissions/permission-manager.ts:149-152`

```typescript
private promptUser(prompt: string, permissionLevel: 'moderate' | 'dangerous'): Promise<boolean> {
  // Use external prompt function if provided (injected by CLI)
  if (this.externalPromptFn) {
    return this.externalPromptFn(prompt, permissionLevel);
  }

  // Fallback: Default deny if no prompt function is set
  // This prevents readline conflicts in production
  logger.warn('No prompt function set, denying permission by default');
  return Promise.resolve(false);  // ⚠️ SILENT DENIAL
}
```

**Problem:**
- When `externalPromptFn` is not registered, permissions are **silently denied**
- User sees a generic "Permission denied" error
- No indication that the system needs configuration

**Impact:** Agent appears broken - it asks for permission but then reports denial without user interaction.

---

### GAP #2: Double Permission Systems (CONFUSION)

**Two Different Permission Managers:**

```
packages/floyd-agent-core/src/permissions/permission-manager.ts
  ├── checkPermission(toolName) -> 'allow' | 'deny' | 'ask'
  ├── Default: 'ask'
  ├── Used by: ???
  └── Simple: just checks allowed/denied sets

floyd-wrapper-main/src/permissions/permission-manager.ts
  ├── requestPermission(toolName, input) -> boolean
  ├── Default: deny (when no prompt function)
  ├── Used by: execution-engine.ts
  └── Complex: formats prompts, calls user, handles dangerous warnings
```

**Problem:**
- Two systems with different interfaces
- Unclear which one is actually used
- No documentation on when to use which

---

### GAP #3: Permission Level Mismatch (BUG)

**available-tools.ts (INK/floyd-cli):**
```typescript
permission?: 'none' | 'ask' | 'dangerous';
```

**tool-registry.ts (floyd-wrapper-main):**
```typescript
permission?: 'none' | 'moderate' | 'dangerous';
```

**Problem:**
- INK uses `'ask'` but wrapper expects `'moderate'`
- Any tool marked as `'ask'` will be treated as `'dangerous'` by the permission checker

**Impact:** Tools that should be moderate will trigger dangerous warnings.

---

### GAP #4: Mode Configuration Disconnect (DESIGN GAP)

**Two places store mode:**

1. **Execution Engine** reads: `process.env.FLOYD_MODE` (execution-engine.ts:313)
2. **Floyd Store** stores: `state.safetyMode` (floyd-store.ts:298)

**Problem:**
- Toggling safety mode in the UI does NOT update `process.env.FLOYD_MODE`
- Environment variable requires restart to change
- No visible connection between the two

**Impact:** User changes mode in UI but execution engine doesn't see the change.

---

### GAP #5: No Permission Audit Trail (TRANSPARENCY GAP)

**What happens:**
1. Agent calls tool
2. Permission is checked
3. Permission is granted or denied
4. Result is returned to agent

**What user sees:**
- Nothing (if denied silently)
- Generic error message
- No log of which permission was requested
- No record of what was approved/denied

**Missing:**
- `[PERMIT] write:src/file.ts - APPROVED`
- `[PERMIT] delete_file:node_modules - DENIED`
- User-visible permission log

---

### GAP #6: Plan Mode Restriction Not Visible (UX GAP)

**Plan mode behavior** (execution-engine.ts:350-358):
```typescript
} else if (mode === 'plan') {
  // PLAN mode: Only allow read-only tools (permission: 'none')
  if (permissionLevel === 'none') {
    permissionGranted = true;
  } else {
    logger.info(`Blocked tool execution in PLAN mode: ${toolName}`);
    permissionGranted = false;  // No user prompt, just block
  }
}
```

**Problem:**
- When in PLAN mode, write attempts are silently blocked
- Error message says "Tool execution blocked"
- No clear indication that PLAN mode is the reason

---

### GAP #7: FUCKIT Mode Exists and Is Unmarked (DANGER)

**FUCKIT mode** (execution-engine.ts:335-338):
```typescript
if (mode === 'fuckit') {
  // FUCKIT mode: NO RESTRICTIONS. ALL PERMISSIONS GRANTED.
  // This mode bypasses ALL permission checks - use at your own risk!
  permissionGranted = true;
  logger.info(`FUCKIT mode: Auto-approving ALL tools without permission: ${toolName}`);
}
```

**Problems:**
1. Mode exists that disables ALL safety checks
2. No visible warning when entering this mode
3. No confirmation required
4. Easily accessible through toggle cycle

**Safety Concern:** User can accidentally enter FUCKIT mode without realizing the implications.

---

### GAP #8: Working Directory Not Enforced (SAFETY GAP)

**Prompt claims:**
```
## Prohibited Actions (ABSOLUTE):
- MUST NEVER modify files outside working directory
```

**Reality:**
- No working directory check in execution engine
- No path validation before file operations
- Tools receive absolute paths that could point anywhere

**Impact:** Agent could potentially modify files outside the intended workspace.

---

## PART 3: VISIBILITY ASSESSMENT

### What IS Visible to Users

| Component | Visibility | Location |
|-----------|------------|----------|
| Safety mode state | ✅ Visible | Floyd store (can be displayed in UI) |
| Tool definitions | ✅ Visible | available-tools.ts (developer can read) |
| Permission levels | ✅ Visible | Tool definition metadata |
| Mode toggle | ✅ Visible | UI can call toggleSafetyMode() |

### What is NOT Visible to Users

| Component | Visibility | Impact |
|-----------|------------|--------|
| Permission requests | ❌ Silent | User doesn't see prompts when externalPromptFn missing |
| Permission denials | ❌ Generic error | No clear reason for denial |
| Permission audit log | ❌ Missing | Can't review what was approved/denied |
| Mode vs execution disconnect | ❌ Hidden | UI mode doesn't affect execution |
| Working directory enforcement | ❌ Not implemented | Safety claim is false |
| FUCKIT mode warning | ❌ Missing | No confirmation for dangerous mode |

---

## PART 4: LOGIC CHAIN VERIFICATION

### Expected User Flow

```
1. User: "Write a function"
2. Agent: Plans to write file
3. System: Shows permission prompt
4. User: Approves
5. Agent: Writes file
6. System: Shows success
```

### Actual Flow (When Broken)

```
1. User: "Write a function"
2. Agent: Plans to write file
3. System: Calls permissionManager.requestPermission()
4. System: No externalPromptFn registered
5. System: Logs warning "No prompt function set, denying permission"
6. System: Returns false
7. Agent: Receives {success: false, error: "Permission denied"}
8. User: Sees "Permission denied for tool 'write'"
9. User: Confused - never saw a prompt
```

---

## PART 5: RECOMMENDATIONS

### Priority 1 (CRITICAL - Fix Immediately)

1. **Fix Permission Prompt Fallback**
   - Instead of silent deny, throw clear error: "Permission system not initialized"
   - Or provide default readline-based prompt
   - Make the failure mode visible

2. **Unify Permission Levels**
   - Standardize on: 'none', 'moderate', 'dangerous'
   - Update available-tools.ts to use 'moderate' instead of 'ask'
   - Document the meaning of each level

3. **Wire Safety Mode to Execution**
   - Connect store.safetyMode to execution engine
   - Update system prompt when mode changes
   - Ensure UI changes take effect immediately

### Priority 2 (HIGH - User Safety)

4. **Add FUCKIT Mode Confirmation**
   - Require explicit confirmation when entering FUCKIT mode
   - Show warning: "This disables ALL safety checks"
   - Add visual indicator when in FUCKIT mode

5. **Implement Permission Audit Trail**
   - Log all permission requests with results
   - Make log visible to user
   - Format: `[PERMIT] <tool>:<target> - APPROVED/DENIED`

6. **Add Working Directory Enforcement**
   - Validate file paths are within working directory
   - Block or warn for out-of-bounds operations
   - Or remove the false claim from prompt

### Priority 3 (MEDIUM - UX Improvements)

7. **Clearer Error Messages**
   - Include mode information in denials
   - "Blocked in PLAN mode" instead of generic error
   - Show current mode in UI

8. **Mode Visualization**
   - Show current mode in status bar
   - Color-code by danger level
   - Show which mode is active at all times

---

## PART 6: TESTING RECOMMENDATIONS

### Safety Test Scenarios

```bash
# Test 1: Verify safe tools work in ASK mode
echo "read_file package.json" | floyd --mode ask

# Test 2: Verify write tools prompt in ASK mode
echo "write test.txt hello" | floyd --mode ask
# EXPECTED: Permission prompt appears
# CURRENT: Silent denial

# Test 3: Verify PLAN mode blocks writes
echo "write test.txt hello" | floyd --mode plan
# EXPECTED: Clear "blocked in PLAN mode" message
# CURRENT: Generic permission denied

# Test 4: Verify FUCKIT mode warns
floyd --mode fuckit
# EXPECTED: Confirmation prompt
# CURRENT: No warning, enters mode immediately

# Test 5: Verify working directory enforcement
echo "write /tmp/test.txt hello" | floyd
# EXPECTED: Blocked with "outside working directory"
# CURRENT: May succeed (not verified)
```

---

## PART 7: IMPLEMENTATION CHECKLIST

### For Each Gap

- [ ] **Gap #1**: Implement default prompt function or throw clear error
- [ ] **Gap #2**: Consolidate to single permission manager
- [ ] **Gap #3**: Update permission level names to match
- [ ] **Gap #4**: Wire store.safetyMode to execution engine
- [ ] **Gap #5**: Add permission audit logging
- [ ] **Gap #6**: Improve PLAN mode error messages
- [ ] **Gap #7**: Add FUCKIT mode confirmation
- [ ] **Gap #8**: Implement working directory checks

---

## SIGNATURE

**Audited by:** RepoGod (Instance-Adaptive Scaling Mode)
**Date:** 2026-01-27
**Status:** 8 CRITICAL GAPS IDENTIFIED
**Recommendation:** Fix Priority 1 items before deploying to production

---

## APPENDIX: FILE REFERENCES

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `floyd-wrapper-main/src/permissions/permission-manager.ts` | Permission checking | 71-99 (requestPermission), 143-153 (promptUser) |
| `floyd-wrapper-main/src/agent/execution-engine.ts` | Mode-based logic | 313-362 (permission check) |
| `INK/floyd-cli/src/config/available-tools.ts` | Tool definitions | 40 (permission type), 46-528 (tool list) |
| `INK/floyd-cli/src/store/floyd-store.ts` | UI state | 298 (safetyMode), 546-554 (mode toggle) |
| `packages/floyd-agent-core/src/permissions/permission-manager.ts` | Alt permission mgr | 38-64 (checkPermission) |
