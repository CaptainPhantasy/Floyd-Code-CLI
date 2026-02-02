# FixMe

Issues to address:

## Inconsistency in YOLO Mode vs Tool Permission Requirements

**Problem**: The system prompt declares YOLO mode with automatic tool approval, but tool descriptions still contain "requires permission" language.

**Evidence**:
```
## EXECUTION MODE: YOLO
You are in YOLO mode. Safe tools will be approved automatically. 
Proceed with confidence and only stop for critical decisions.
```

But tool schemas say:
```typescript
"Run tests for the detected project. Requires permission if not previously granted."
"Format code using the project's configured formatter. Requires permission."
"Run the project's linter. Requires permission."
"Build the project. Requires permission."
```

**Impact**: Creates mixed messaging and inconsistent behavior expectations.

**Solution Options**:
1. Remove permission language from tool descriptions in YOLO mode
2. Add conditional logic: "Requires permission (unless in YOLO mode)"
3. Update system prompt to clarify YOLO mode overrides tool-specific permission requirements

---

## Tool Parameter Validation Missing

**Problem**: Many tools accept parameters but don't validate them before filesystem operations, leading to potential errors.

**Examples**:
- `read_text_file` accepts `head` and `tail` but doesn't prevent both being used (caused error during analysis)
- `delete_range` doesn't validate line ranges before deletion
- Cache operations don't validate key/value length or content type

**Impact**: Unhandled errors, confusing error messages, potential data loss

**Solution**: Add input validation middleware before tool execution

---

## No Complexity Classification Before Execution

**Problem**: Every task gets the same cognitive weight. Simple tasks ("add error handling") trigger full reasoning chains instead of immediate action.

**Evidence from Grading.md**:
- Simple icon assignment took 6 minutes with 4 approaches
- Planning ratio ~10:1 instead of < 1:3
- Time-to-first-code > 60s instead of < 30s

**Impact**: Massive inefficiency on routine tasks
**Solution**: Add complexity triage:
```
Low (immediate): Simple edits, one-file changes
Medium (brief plan): 2-5 file changes
High (full reasoning): Architecture changes, >5 files
```

---

## Missing Efficiency Self-Correction Triggers

**Problem**: No automatic detection when stuck in retry loops or over-thinking.

**Evidence**:
- Agent made 4 failed approaches on macOS icon task without recognizing pattern
- No "if >2 attempts, pause" logic
- No time budget enforcement

**Impact**: Endless retry loops, wasted compute

**Solution**: Add guardrails:
- "If >2 attempts fail, pause and analyze root cause"
- "If task > 2x expected time, flag and reassess"
- "If planning tokens > action tokens, stop and execute"

---

## Cache Store Pattern vs Cache Store Tool Confusion

**Problem**: Two separate interfaces for similar operations:

1. `cache_store_pattern` - Stores to vault tier with name/tags
2. `cache_store` - General storage to any tier with key/value

**Issue**: Agent may use wrong one, or not know when to use which

**Solution**: Consolidate or clarify distinction in prompts

---

## Silent Failures in Some Tools

**Problem**: Some tools fail silently or provide minimal error context.

**Examples**:
- Python AppKit approach in thinking.md produced no output but didn't work
- Many file operations don't distinguish between "not found" and "permission denied"

**Impact**: Agent can't determine why operation failed, leading to blind retries

**Solution**: Ensure all tools return:
```
{
  success: boolean,
  error?: {
    type: "FILE_NOT_FOUND" | "PERMISSION_DENIED" | "INVALID_INPUT" | ...,  
    message: string,
    context?: Record<string, unknown>
  }
}
```

---

## File Read Tool Not Full Content by Default

**Problem**: `read_text_file` has head/tail parameters but no clear way to just get full content.

**Issue**: During analysis, had to make multiple attempts to read thinking.md fully

**Solution**: Default to full content, use head/tail only when explicitly requested

---

*File created: 2026-01-29*
*Last updated: 2026-01-29 (added 6 more issues)*
