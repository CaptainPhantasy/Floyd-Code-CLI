# PHASE 2: TOOL EXECUTION FIXES

**RISK**: MEDIUM
**TIME**: 1 hour
**ITEMS**: 3 (4-6)
**FOCUS**: Tool reliability and error handling

> Fix symptoms that have high impact on tool execution quality.

---

## AUDIT TRAIL

| Item | ID | Status | Files |
|------|-----|--------|-------|
| Terminal Tool ENOENT (Shell Environment) | 4 | ✅ DONE | floyd-wrapper-main/src/tools/system/index.ts |
| Tool Parameter Validation | 5 | ✅ DONE | 25+ files — all tools now have safeParse validation |
| Standardized Error Responses | 6 | ✅ DONE | floyd-wrapper-main/src/tools/types.ts (aligned) |

**Audit completed:** 2026-01-29 — See `PHASE_2_AUDIT_REPORT.md` for details
**Second pass completed:** All remaining issues fixed, full alignment achieved

---

## ITEM 4: Terminal Tool ENOENT (Shell Environment)

**Problem**: Commands fail with ENOENT (ls, echo fail, pwd works).

**Root Cause**: No shell environment initialization. PATH not properly inherited.

**File**: `floyd-wrapper-main/src/tools/system/index.ts`

**Implementation**:
```typescript
// The fix is already correct - ensure process.env is inherited
const result = await execa(command, args, {
  cwd: executionCwd,
  timeout,
  env: {
    ...process.env,  // This should work, but verify shell profile loaded
    ...env
  },
  reject: false,
});
```

**IMPORTANT**: If simple PATH inheritance doesn't work, need full shell login:
```typescript
// Alternative: Spawn with login shell for full environment
const shell = process.env.SHELL || '/bin/bash';
const result = await execa(`${shell} -lc "${command} ${args.join(' ')}"`, {
  cwd: executionCwd,
  timeout,
  env: { ...process.env, ...env }
});
```

**Verification**:
```
pwd    # ✅
ls -la # ✅
echo test # ✅
touch /tmp/floyd-test && rm /tmp/floyd-test # ✅
npm test # ✅
git status # ✅
```

---

## ITEM 5: Tool Parameter Validation

**Problem**: read_text_file allows both head+tail, delete_range doesn't validate ranges.

**Root Cause**: No validation middleware before tool execution.

**File**: `floyd-wrapper-main/src/tools/file/file-core.ts`

**Implementation**:
```typescript
// Add validation at top of file-core.ts
interface ValidationError { field: string; message: string; }

function validateReadInput(input: ReadTextFileInput): ValidationError | null {
  if (input.head !== undefined && input.tail !== undefined) {
    return { field: 'head,tail', message: 'Cannot specify both head and tail' };
  }
  if (input.head !== undefined && input.head < 1) {
    return { field: 'head', message: 'head must be >= 1' };
  }
  if (input.tail !== undefined && input.tail < 1) {
    return { field: 'tail', message: 'tail must be >= 1' };
  }
  return null;
}

// In readTextFile, before execution:
const validation = validateReadInput(input);
if (validation) {
  return {
    success: false,
    error: { type: 'INVALID_INPUT', message: validation.message }
  };
}
```

**Verification**:
1. Test invalid inputs return proper errors
2. Test valid inputs still work

---

## ITEM 6: Standardized Error Responses

**Problem**: Tools fail silently or with minimal context.

**Root Cause**: No unified error interface.

**File**: `floyd-wrapper-main/src/tools/types.ts` (NEW)

**Implementation**:
```typescript
// Define standard error interface
export interface ToolError {
  type: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_INPUT' |
        'COMMAND_NOT_FOUND' | 'BROWSER_EXTENSION_UNAVAILABLE' |
        'NO_MATCH_FOUND' | 'PROTECTED_BRANCH';
  message: string;
  context?: Record<string, unknown>;
}

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

// Update all tools to return this format
// Example for read_file:
try {
  await fs.access(filePath, fs.constants.R_OK);
  const content = await fs.readFile(filePath, 'utf-8');
  return { success: true, data: content };
} catch (error) {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === 'ENOENT') {
    return {
      success: false,
      error: { type: 'FILE_NOT_FOUND', message: `File not found: ${filePath}` }
    };
  }
  // ... other error types
}
```

**Verification**:
1. All tools return ToolResponse format
2. Error types distinguish ENOENT vs EACCES

---

## DEPENDENCIES

All items in this phase are independent and can be fixed in any order.

## CASCADING RISKS

1. **Item 4 (Terminal)**: If shell environment fix doesn't work, may need deeper changes to how commands spawn
2. **Item 6 (Error Responses)**: Updating all tools to use new interface is tedious. Use automated refactoring where possible

---

**Phase 2 Status**: ✅ COMPLETE (3/3 complete)

**Completed**: 2026-01-29

**Changes Made**:
1. **Item 4**: Added `reject: false` and `shell: true` to execa options in system/index.ts
2. **Item 5**: Added Zod-level validation for `edit_range`, `delete_range`, and `insert_at` tools with `.refine()` for startLine <= endLine
3. **Item 6**: Created `floyd-wrapper-main/src/tools/types.ts` with `ToolErrorType`, `ToolError`, `ToolResponse`, and helper functions

---

## VERIFICATION RECEIPTS

All smoke tests passed (11/11 assertions):

### ITEM 4: Terminal Tool (Shell Environment)
| Test | Result | Receipt |
|------|--------|---------|
| `pwd` | ✅ | `exitCode: 0, stdout: "/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main"` |
| `ls -la /tmp` | ✅ | `exitCode: 0, stdout: "lrwxr-xr-x@ 1 root wheel 11 /tmp -> private/tmp"` |
| `echo test` | ✅ | `exitCode: 0, stdout: "test"` |
| `nonexistent-command-xyz` | ✅ | `exitCode: 127, success: false` (graceful failure, no throw) |

### ITEM 5: Parameter Validation
| Test | Result | Receipt |
|------|--------|---------|
| `edit_range` with startLine=10 > endLine=5 | ✅ | `success: false, errorCode: "VALIDATION_ERROR"` |
| `delete_range` with startLine=-1 | ✅ | `success: false, errorCode: "VALIDATION_ERROR"` |
| `insert_at` with empty filePath | ✅ | `success: false, errorCode: "VALIDATION_ERROR"` |

### ITEM 6: Standardized Error Types
| Test | Result | Receipt |
|------|--------|---------|
| `errorResponse('FILE_NOT_FOUND', ...)` | ✅ | `hasError: true, hasContext: true, hasCorrectType: true` |
| `validationError('Invalid input')` | ✅ | `errorType: "VALIDATION_ERROR", hasCorrectType: true` |
| `notFoundError('config.json', '/etc/config.json')` | ✅ | `hasPath: true, hasCorrectType: true` |
| `successResponse({ data: 'test' })` | ✅ | `hasData: true, noError: true` |

**Receipt cached to SUPERCACHE**: `phase-2-verification-receipt`
