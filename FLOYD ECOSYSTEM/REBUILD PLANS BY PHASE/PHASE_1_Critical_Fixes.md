# PHASE 1: CRITICAL FIXES (ROOT CAUSES)

**RISK**: HIGH
**TIME**: 1-2 hours
**ITEMS**: 3 (1-3)
**DEPENDENCY**: Partial - Item 2 depends on Phase 0 Item A

> Focus on fixing root causes that affect system behavior and security.

---

## AUDIT TRAIL

| Item | ID | Status | Files |
|------|-----|--------|-------|
| Dynamic Prompt Generation | 1 | TODO | INK/floyd-cli/src/prompts/system-prompt.ts |
| YOLO Mode Permission Consistency | 2 | TODO | INK/floyd-cli/src/config/available-tools.ts |
| Desktop promptStyle UI Selector | 3 | TODO | FloydDesktopWeb/server/index.ts |

---

## ITEM 1: Dynamic Prompt Generation

**Problem**: Hardcoded tool descriptions in system-prompt.ts. Drift from AVAILABLE_TOOLS.

**Root Cause**: Static prompt templates don't adapt to runtime tool changes.

**Files**:
- `INK/floyd-cli/src/prompts/system-prompt.ts`
- `INK/floyd-cli/src/config/available-tools.ts`
- `floyd-wrapper-main/src/prompts/system/capabilities.ts` (also hardcoded)

**Implementation**:
```typescript
// Replace hardcoded getToolCapabilities()
export function getToolCapabilities(): string {
  const categories = getToolsByCategory();
  let output = `## Tool Capabilities (${AVAILABLE_TOOLS.length} Tools)\n\n`;

  for (const [category, tools] of Object.entries(categories)) {
    output += `### ${category.toUpperCase()} (${tools.length} tools)\n`;
    for (const tool of tools) {
      const perm = tool.permission ? ` [${tool.permission.toUpperCase()}]` : '';
      output += `- **${tool.name}**${perm}: ${tool.description}\n`;
    }
    output += '\n';
  }
  return output;
}
```

**Verification**:
1. Build CLI, verify tool count matches
2. Add tool to AVAILABLE_TOOLS, rebuild, verify appears
3. Check wrapper capabilities.ts also updated

---

## ITEM 2: YOLO Mode Permission Consistency

**Problem**: Tool descriptions say "requires permission" but YOLO auto-approves moderate tools.

**Root Cause**: Fragmented permission system (see Item A Phase 0).

**Files**:
- `INK/floyd-cli/src/config/available-tools.ts`
- System prompt mode descriptions

**Quick Fix** (until Phase 0 Item A complete):
1. Remove "requires permission" from all tool descriptions
2. Add mode-specific guidance to system prompt

**Implementation**:
```typescript
// Update available-tools.ts descriptions
// Remove all instances of "Requires permission." or similar

// Update system prompt mode description
case 'YOLO':
  return `You are in YOLO mode. Tools with permission 'none' and 'moderate' are auto-approved.
         Only 'dangerous' tools require confirmation.`;
```

**Verification**:
1. Grep for "requires permission" - should find none
2. Set YOLO mode, test moderate/dangerous tools

---

## ITEM 3: Desktop promptStyle UI Selector

**Problem**: API supports promptStyle but frontend doesn't expose it.

**Root Cause**: Incomplete feature implementation.

**Files**:
- `FloydDesktopWeb/server/index.ts`
- `FloydDesktopWeb/server/prompts/` (need claude/floyd/custom styles)
- Client UI (needs selector component)

**Implementation**:
1. Add promptStyle to Settings interface
2. Implement prompt builders for all 4 styles
3. Add UI dropdown selector
4. Wire up to API

**Verification**:
1. Settings page shows promptStyle selector
2. Switching styles changes behavior
3. Screenshot of UI

---

## DEPENDENCIES

| Depends On | Item | Reason |
|------------|------|--------|
| Phase 0 Item A | 2 | Full fix requires unified permissions |
| None | 1 | Independent |
| None | 3 | Independent |

## CASCADING RISKS

1. **Item 2 (YOLO)**: Depends on Phase 0 Item A for complete fix
2. **Item 1 (Dynamic Prompts)**: May expose tool descriptions that need updating
3. **Item 3 (promptStyle)**: Low risk, isolated to Desktop

---

**Phase 1 Status**: TODO (0/3 complete)
