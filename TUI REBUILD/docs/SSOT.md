# FLOYD TUI REBUILD - Single Source of Truth (SSOT)

**Project:** FLOYD TUI - Provider-Agnostic Terminal UI
**Root:** `/Volumes/Storage/FLOYD_CLI/TUI REBUILD`
**Last Updated:** 2026-02-01

---

## 1. Document Management Rules

### 1.1 Receipt Format Requirements

All phase receipts MUST follow this format:

```markdown
### Phase XX: [Name] - RECEIPTS

**Date:** YYYY-MM-DD
**Status:** ✅ COMPLETE / ⏸ IN PROGRESS / ❌ BLOCKED

---

## Task XX.N: [Task Name]

**Files Modified:**
- `path/to/file.ts`
- `path/to/other.ts`

**Changes:**
- Bullet list of changes made

**Verification:**
```bash
$ command
# Expected output
```
```

### 1.2 CHANGELOG.md Update Policy

**When to Update:**
- After every phase completion
- After any breaking change
- After any feature addition
- After any bug fix

**Entry Format:**
```markdown
## YYYY-MM-DDTHH:MM:SS-TZ - Phase XX: [Name] ✅
- **Agent:** agent-id or 'manual'
- **Changes:**
  - [List changes made]
- **Build:** PASS / FAIL
- **Lint:** PASS / FAIL
- **Tests:** PASS / FAIL / N/A
- **Receipts:** PHASE_XX_NAME/RECEIPTS.md
- **Next:** Phase XX or description
```

### 1.3 README.md Synchronization Rules

**Status Table Must Reflect:**
- All phases with actual completion status
- Current working phase
- Blocked phases with reason

**Update Frequency:**
- After every phase completion
- After every blocker resolution

---

## 2. Code ↔ Documentation Parity Mapping

### 2.1 Component Files → Documentation

| Component | Doc File | Parity Check |
|-----------|----------|--------------|
| StatusBar.tsx | TUI_MOCKUP.md | Manual check |
| tui-store.ts | PHASE_03_STATE/RECEIPTS.md | Auto-sync via build |
| All components | CHANGELOG.md | Required on change |

### 2.2 Phase Folders → Completion Status

| Phase | Folder | Status | Receipts |
|-------|--------|--------|----------|
| Phase 0 | PHASE_00_PREBUILD | ✅ Complete | RECEIPTS.md |
| Phase 1 | PHASE_01_SCAFFOLD | ✅ Complete | RECEIPTS.md |
| Phase 2 | PHASE_02_COMPONENTS | ✅ Complete | RECEIPTS.md |
| Phase 3 | PHASE_03_STATE | ✅ Complete | RECEIPTS.md |
| Phase 4 | PHASE_04_LLM | ⏸ Pending | RECEIPTS.md |

---

## 3. Boot Markers

### 3.1 Required Boot Markers

All applications MUST emit:

1. **APP_BOOT_OK** - Emitted when app successfully initializes
   - Format: `console.log('APP_BOOT_OK ' + new Date().toISOString())`
   - Location: `src/app.tsx` after `initialize()` completes

2. **SMOKE_TEST_PASS** - Emitted by headless smoke test
   - Format: `console.log('SMOKE_TEST_PASS')`
   - Location: `tests/smoke-test.mjs`

### 3.2 Boot Marker Detection

```bash
# Verify boot marker exists
grep -r "APP_BOOT_OK" src/

# Verify boot marker in running app
npm run start 2>&1 | grep "APP_BOOT_OK"
```

---

## 4. Error Handling Standards

### 4.1 Store Initialization

Store `initialize()` MUST:
- Log success with APP_BOOT_OK
- Log failure but still emit APP_BOOT_OK (app can run without cache)
- Not silently fail

### 4.2 Non-TTY Environments

Components using `useInput` or `setRawMode` MUST:
- Check `process.stdin.isTTY` before use
- Check `typeof process.stdin.setRawMode === 'function'` before use
- Skip raw mode in non-TTY (tests, CI/CD)

---

## 5. Testing Requirements

### 5.1 Component Tests

All components MUST have:
- Test file in `tests/components/test-[component].tsx`
- Proper React import: `import React from 'react'`
- Store initialization before render
- Exit after 2 seconds

### 5.2 Integration Tests

Integration tests MUST verify:
- All overlay modes switch correctly
- Store actions work (cycleMode, toggleThinking, etc.)
- Messages can be added/cleared

### 5.3 Smoke Tests

Smoke tests MUST:
- Boot the application
- Wait for APP_BOOT_OK marker
- Check for critical output
- Exit cleanly with code 0

---

## 6. Build & Lint Standards

### 6.1 Build Requirements

- `npm run build` MUST exit with code 0
- `tsc` MUST complete without errors
- `dist/` directory MUST contain compiled JS

### 6.2 Lint Requirements

- `npm run lint` MUST exit with code 0
- `eslint src` MUST report 0 errors, 0 warnings
- No `any` types without justification

---

## 7. Guard Requirements

### 7.1 TTY Guards

Before using `setRawMode`:

```typescript
const isTTY = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
if (!isTTY) {
  return; // Skip raw mode in tests/CI
}
```

### 7.2 Loading State Guards

Components MUST check `_initialized`:

```typescript
const _initialized = useTuiStore((state) => state._initialized);

if (!_initialized) {
  return <Ink.Text>Loading...</Ink.Text>;
}
```

---

## 8. Verification Commands

### 8.1 Pre-commit Checklist

```bash
# Build passes
npm run build

# Lint passes
npm run lint

# Boot marker exists
grep -q "APP_BOOT_OK" src/app.tsx

# TTY guard exists
grep -q "isTTY.*setRawMode" src/app.tsx

# Loading state check exists
grep -q "_initialized" src/components/StatusBar.tsx

# SSOT exists
test -f docs/SSOT.md
```

### 8.2 Phase Completion Verification

```bash
# Receipts exist
test -f PHASE_XX_NAME/RECEIPTS.md

# CHANGELOG updated
grep -q "Phase XX" CHANGELOG.md

# README status updated
grep -q "Phase XX" README.md
```

---

**This SSOT is the authoritative source for all project documentation rules.**

If any document conflicts with this SSOT, the SSOT takes precedence.

---

**Last Updated:** 2026-02-01
**Maintained By:** Project protocol
