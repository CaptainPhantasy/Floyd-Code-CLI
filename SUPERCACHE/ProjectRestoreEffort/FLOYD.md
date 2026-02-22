# Floyd Suite Project Restore Effort

**Date:** 2026-02-02
**Status:** Investigation Complete, Ready for Execution
**Confidence Level:** 99%
**Previous Session:** Full analysis completed, fixes verified via live build/test

---

## CRITICAL: READ THIS FIRST

You are resuming a restore effort for the Floyd Suite. The previous session:
1. Identified all broken projects and root causes
2. Verified fixes via live build and test runs
3. Documented everything in SUPERCACHE

**DO NOT re-investigate.** The analysis is complete. Execute the fixes.

---

## EXECUTIVE SUMMARY

### Root Blocker: floyd-agent-core (2 TS Errors)

**Cause:** Commit `a6e1b7f` partially refactored the permission system:
- Changed `PermissionMode` type (removed `yolo`/`dialogue`, added `discuss`)
- Removed `YoloPermissionStrategy` and `DialoguePermissionStrategy` classes
- Removed `createYoloManager` factory function
- **DID NOT** update `SafetyMode` type (still has `yolo`/`dialogue`)
- **DID NOT** update `index.ts` exports (still exports `createYoloManager`)

**Fix:** Restore `unified-permission.ts` from commit `b9ec824`

**Verification:** ALREADY TESTED AND CONFIRMED:
- Build passes ✅
- All tests pass ✅
- Patch applies cleanly ✅

---

## FIX EXECUTION PLAN

### Step 1: Fix floyd-agent-core (VERIFIED)

```bash
cd /Volumes/Storage/FLOYD_CLI

# Restore the known-good file from b9ec824
git checkout b9ec824 -- packages/floyd-agent-core/src/permissions/unified-permission.ts

# Verify build
npm run build --prefix packages/floyd-agent-core

# Verify tests
npm test --prefix packages/floyd-agent-core
```

**Expected Result:** 0 errors, all tests pass

### Step 2: Fix INK/floyd-cli (NEW ISSUE)

During verification, discovered INK/floyd-cli has no tsconfig.json and inherits the root config incorrectly.

**Create tsconfig.json:**
```bash
cat > /Volumes/Storage/FLOYD_CLI/INK/floyd-cli/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

Then verify:
```bash
npm run build --prefix INK/floyd-cli
```

### Step 3: Fix FloydDesktopWeb (17 Errors) - INDEPENDENT

These are separate from agent-core. Fix after Steps 1-2.

**Errors by file:**

| File | Line | Fix |
|------|------|-----|
| `server/mcp-client.ts` | 168 | Add `as const` after BUILTIN_TOOLS array |
| `server/browork-manager.ts` | 13 | Export the `Provider` type |
| `server/browork-manager.ts` | 330-331 | Add type assertion for toolCall |
| `server/mcp/resource-parser.ts` | 475-482 | Remove duplicate export block |
| `server/process-manager.ts` | 91 | Add `: string` type to parameter `l` |
| `server/index.ts` | 188, 306 | Add `setBaseURL` method to BroworkManager OR remove calls |

---

## VERIFICATION CHECKPOINTS

After each step, verify:

```bash
# Step 1 verification
cd /Volumes/Storage/FLOYD_CLI
npm run build --prefix packages/floyd-agent-core && echo "✅ agent-core builds"
npm test --prefix packages/floyd-agent-core && echo "✅ agent-core tests pass"

# Step 2 verification  
npm run build --prefix INK/floyd-cli && echo "✅ INK/floyd-cli builds"

# Step 3 verification
npm run build --prefix FloydDesktopWeb && echo "✅ FloydDesktopWeb builds"

# Final verification - TUI should still work
npm run build --prefix "TUI REBUILD" && echo "✅ TUI REBUILD still works"
```

---

## PROJECT STATE REFERENCE

| Project | Before Fix | After Step 1 | After Step 2 | After Step 3 |
|---------|-----------|--------------|--------------|--------------|
| floyd-agent-core | ❌ 2 errors | ✅ Working | ✅ Working | ✅ Working |
| INK/floyd-cli | ❌ Blocked | ❌ tsconfig | ✅ Working | ✅ Working |
| FloydDesktopWeb | ❌ 17 errors | ❌ 17 errors | ❌ 17 errors | ✅ Working |
| TUI REBUILD | ✅ Working | ✅ Working | ✅ Working | ✅ Working |
| mcp-patch-server | ✅ Working | ✅ Working | ✅ Working | ✅ Working |
| mcp-runner-server | ✅ Working | ✅ Working | ✅ Working | ✅ Working |

---

## KEY FILES REFERENCE

### floyd-agent-core fix
- **Target:** `packages/floyd-agent-core/src/permissions/unified-permission.ts`
- **Source:** Commit `b9ec824`
- **Backup location:** `/tmp/backup_unified.ts` (if still exists)
- **Known-good file:** `/tmp/b9ec824_unified.ts` (if still exists)

### Type definitions that must match
- `SafetyMode` in `packages/floyd-agent-core/src/types/config.ts:12`
- `SafetyMode` in `packages/floyd-agent-core/src/config/floyd-config.ts:30`
- `PermissionMode` in `packages/floyd-agent-core/src/permissions/unified-permission.ts:31`

All should be: `'yolo' | 'ask' | 'plan' | 'auto' | 'dialogue' | 'fuckit'`

---

## SUPERCACHE KEYS FOR THIS EFFORT

Retrieve analysis data:
```
cache_retrieve(tier="vault", key="restore_effort:floyd_suite:2026-02-02")
cache_retrieve(tier="project", key="analysis:permission_type_mismatch:2026-02-02")
cache_retrieve(tier="project", key="floyd_suite:dependency_graph:2026-02-02")
```

---

## DO NOT

- ❌ Re-investigate the issues (already done)
- ❌ Try Option B (complete refactor forward) - too risky
- ❌ Try Option C (full file restore for index.ts) - loses Phase 3 exports
- ❌ Fix unrelated issues before completing Steps 1-3
- ❌ Commit changes until all builds pass

---

## COMMIT MESSAGE (when ready)

```bash
git add packages/floyd-agent-core/src/permissions/unified-permission.ts
git commit -m "fix(agent-core): restore yolo/dialogue permission modes

Commit a6e1b7f partially refactored the permission system but left
SafetyMode and index.ts exports misaligned. This restores the complete
permission system from b9ec824 which includes:
- YoloPermissionStrategy class
- DialoguePermissionStrategy class  
- createYoloManager factory function
- PermissionMode type with all 6 modes

Fixes TypeScript build errors in floyd-agent-core.
"
```

---

## SUCCESS CRITERIA

The restore effort is complete when:
1. `npm run build --prefix packages/floyd-agent-core` → 0 errors
2. `npm test --prefix packages/floyd-agent-core` → all pass
3. `npm run build --prefix INK/floyd-cli` → 0 errors
4. `npm run build --prefix FloydDesktopWeb` → 0 errors
5. `npm run build --prefix "TUI REBUILD"` → still works

---

**BEGIN EXECUTION WITH STEP 1**
