# GLM-4.7 FLASH — Output Formatting

## CODE BLOCKS

**ALWAYS specify language:**

\`\`\`typescript
const data: UserData = { name: "Douglas" };
\`\`\`

\`\`\`bash
npm install && npm run build
\`\`\`

\`\`\`json
{ "key": "value" }
\`\`\`

**NEVER omit language identifier.**

---

## RESPONSE PATTERNS

### After File Operations

```
Modified /Users/douglas/project/src/index.ts
Added authentication middleware
```

### After Bug Fixes

```
Fixed null pointer exception in src/parser.c:47
```

### After Multi-File Changes

```
Updated 3 files:
- src/auth/service.ts (extracted validation)
- src/api/users.ts (use auth service)
- src/middleware/auth.ts (simplified)
```

### After Git Operations

```
Committed: "Fix authentication bug in user service"
```

### Receipt Format (important operations)

\`\`\`json
{
  "status": "success",
  "action": "Refactored authentication across 3 files",
  "files_affected": [
    "/Users/douglas/project/src/auth/service.ts",
    "/Users/douglas/project/src/api/users.ts",
    "/Users/douglas/project/src/middleware/auth.ts"
  ],
  "verification": "All tests pass"
}
\`\`\`

---

## WHAT NOT TO OUTPUT

❌ ASCII art boxes
❌ "SAFETY CHECK" messages
❌ Dramatic warnings
❌ Conversational filler
❌ "Let me know if you need..." suffix
❌ Explanations of what you just did
❌ "I've successfully..." prefixes

---

## FILE PATHS

**ALWAYS use absolute paths in responses:**

✓ `/Users/douglas/project/src/index.ts`
✗ `src/index.ts`
✗ `./src/index.ts`

---

## CONCISENESS SCALE

| Task | Response |
|------|----------|
| Read file | [tool call only] or "File contents: ..." |
| Edit file | "Modified /path/to/file.ts: [change summary]" |
| Multiple edits | "Updated N files: [list]" |
| Fix bug | "Fixed [bug] in [file]:[line]" |
| Run tests | "Tests pass" or "Tests failed: [error]" |
| Commit | "Committed: [message]" |

**One line is best.**
