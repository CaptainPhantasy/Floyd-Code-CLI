# Floyd Suite Analysis - Detailed Technical Reference

## Error Details

### floyd-agent-core Error 1: Type Mismatch

```
src/container/index.ts(178,9): error TS2322: Type 'SafetyMode' is not assignable to type 'PermissionMode'.
  Type '"yolo"' is not assignable to type 'PermissionMode'.
```

**Location:** `packages/floyd-agent-core/src/container/index.ts:178`

**Code:**
```typescript
// Line 175-181
container.register('permissions', () => {
  const config = ConfigManager.get('permissions');
  return new UnifiedPermissionManager({
    mode: config.mode,  // <-- config.mode is SafetyMode, but constructor expects PermissionMode
    cwd,
  });
});
```

**Root Cause:**
- `SafetyMode` = `'ask' | 'yolo' | 'plan' | 'auto' | 'dialogue' | 'fuckit'`
- `PermissionMode` = `'ask' | 'plan' | 'auto' | 'discuss' | 'fuckit'`
- Types diverged in commit `a6e1b7f`

---

### floyd-agent-core Error 2: Missing Export

```
src/index.ts(69,3): error TS2724: '"./permissions/unified-permission.js"' has no exported member named 'createYoloManager'. Did you mean 'createPlanManager'?
```

**Location:** `packages/floyd-agent-core/src/index.ts:69`

**Code:**
```typescript
// Lines 66-79
export {
  UnifiedPermissionManager,
  createPermissionManager,
  createYoloManager,  // <-- This doesn't exist anymore
  createAskManager,
  createPlanManager,
  // ...
} from './permissions/unified-permission.js';
```

**Root Cause:** `createYoloManager` function was removed in commit `a6e1b7f`

---

## Commit History

```
b9ec824 - feat: Complete Phase 5 - Claude Alignment (14/14 items)  <-- LAST KNOWN GOOD
    ↓
a6e1b7f - fix: TUI text doubling, add prefix parser, improve MCP tooling  <-- BUG INTRODUCED
    ↓
e883dc8 - Fix CLI build: Update agent-core dependency, add polyfills
    ↓
... (later commits)
    ↓
8fa7f0b - fix(tui): improve terminal detection and quit behavior  <-- CURRENT HEAD
```

---

## Files Changed in a6e1b7f

```
packages/floyd-agent-core/src/permissions/unified-permission.ts
packages/floyd-agent-core/src/types/permissions.ts
```

The refactor:
1. ✅ Changed `PermissionMode` type
2. ✅ Replaced `YoloPermissionStrategy` with `DiscussPermissionStrategy`
3. ✅ Removed `DialoguePermissionStrategy`
4. ✅ Removed `createYoloManager` factory
5. ❌ Did NOT update `SafetyMode` in `types/config.ts`
6. ❌ Did NOT update `SafetyMode` in `config/floyd-config.ts`
7. ❌ Did NOT update exports in `index.ts`
8. ❌ Did NOT update tests

---

## Strategy Class Comparison

### At b9ec824 (working):
```
Line 249: class YoloPermissionStrategy
Line 279: class PlanPermissionStrategy
Line 322: class AskPermissionStrategy
Line 429: class AutoPermissionStrategy
Line 505: class DialoguePermissionStrategy
Line 576: class FuckitPermissionStrategy
```

### Current (broken):
```
Line 247: class DiscussPermissionStrategy  <-- replaces Yolo
Line 318: class PlanPermissionStrategy
Line 361: class AskPermissionStrategy
Line 468: class AutoPermissionStrategy
Line 545: class FuckitPermissionStrategy
          (DialoguePermissionStrategy MISSING)
          (YoloPermissionStrategy MISSING)
```

---

## Switch Statement Comparison

### At b9ec824:
```typescript
switch (config.mode) {
  case 'yolo': return new YoloPermissionStrategy(config);
  case 'plan': return new PlanPermissionStrategy(config);
  case 'ask': return new AskPermissionStrategy(config);
  case 'auto': return new AutoPermissionStrategy(config);
  case 'dialogue': return new DialoguePermissionStrategy(config);
  case 'fuckit': return new FuckitPermissionStrategy(config);
  default: return new AskPermissionStrategy({ ...config, mode: 'ask' });
}
```

### Current:
```typescript
switch (config.mode) {
  case 'plan': return new PlanPermissionStrategy(config);
  case 'ask': return new AskPermissionStrategy(config);
  case 'auto': return new AutoPermissionStrategy(config);
  case 'discuss': return new DiscussPermissionStrategy(config);
  case 'fuckit': return new FuckitPermissionStrategy(config);
  default: return new AskPermissionStrategy({ ...config, mode: 'ask' });
}
```

**Impact:** If `mode: 'yolo'` is passed, it falls through to default and uses `AskPermissionStrategy` - completely wrong behavior!

---

## Test Expectations

From `packages/floyd-agent-core/src/__tests__/phase0-integration.test.ts`:

```typescript
// Line 55-66: Tests createYoloManager
const manager = createYoloManager();
const response = await manager.checkPermission(request);
assert.equal(response.granted, true);
assert.equal(response.mode, 'yolo');  // <-- Expects 'yolo'

// Line 99-101: Tests mode switching
const manager = new UnifiedPermissionManager({ mode: 'yolo' });
assert.equal(manager.getMode(), 'yolo');  // <-- Expects 'yolo'
```

---

## Files Using yolo/dialogue Modes

```
packages/floyd-agent-core/src/types/config.ts:12
packages/floyd-agent-core/src/config/floyd-config.ts:30,518
packages/floyd-agent-core/src/permissions/policies.ts:107
packages/floyd-agent-core/src/prompts/tool-capabilities.ts:22,75,164
packages/floyd-agent-core/src/index.ts:69
packages/floyd-agent-core/src/__tests__/phase0-integration.test.ts:17,55,65,99,101,143,150,334
```

All of these expect `yolo` and `dialogue` to exist.

---

## Live Test Results (from previous session)

```bash
# With b9ec824 unified-permission.ts:
$ npm run build --prefix packages/floyd-agent-core
> tsc -b
(no errors)

$ npm test --prefix packages/floyd-agent-core
# tests 1
# pass 1
# fail 0
# coverage: 66.86%
```

---

## FloydDesktopWeb Errors (separate issue)

```
server/browork-manager.ts(228,9): error TS2769 - tools type mismatch
server/browork-manager.ts(330,37): error TS2339 - toolCall.function doesn't exist
server/browork-manager.ts(331,48): error TS2339 - same
server/index.ts(21,37): error TS2459 - Provider not exported
server/index.ts(188,20): error TS2339 - setBaseURL doesn't exist
server/index.ts(190,32): error TS2345 - Provider type mismatch
server/index.ts(306,20): error TS2339 - setBaseURL doesn't exist
server/index.ts(308,32): error TS2345 - Provider type mismatch
server/mcp/resource-parser.ts(80,14): error TS2323 - duplicate export
server/mcp/resource-parser.ts(476,2): error TS2323 - duplicate export
server/mcp/resource-parser.ts(476,2): error TS2484 - export conflict
server/mcp/resource-parser.ts(477,2): error TS2484 - export conflict
server/mcp/resource-parser.ts(478,2): error TS2484 - export conflict
server/mcp/resource-parser.ts(479,2): error TS2484 - export conflict
server/mcp/resource-parser.ts(480,2): error TS2484 - export conflict
server/mcp/resource-parser.ts(481,2): error TS2484 - export conflict
server/process-manager.ts(91,44): error TS7006 - implicit any
```

These are independent of floyd-agent-core and can be fixed separately.

---

## INK/floyd-cli Issue (discovered during verification)

**Problem:** No tsconfig.json exists in `INK/floyd-cli/`

When `tsc` runs, it traverses up and finds the root `tsconfig.json` which includes `src/` - but that's the ROOT src/, not INK/floyd-cli/src/.

**Evidence:**
```
../../src/app.tsx(9,64): error TS2307: Cannot find module 'floyd-agent-core'
```

The path `../../src/app.tsx` from `INK/floyd-cli/` is `/Volumes/Storage/FLOYD_CLI/src/app.tsx` - the wrong directory!

**Fix:** Create proper tsconfig.json in INK/floyd-cli/
