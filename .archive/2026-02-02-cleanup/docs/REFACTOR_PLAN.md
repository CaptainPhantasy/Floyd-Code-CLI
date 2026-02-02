# Floyd CLI Refactor Plan

**Date**: 2026-01-29
**Strategy**: Phase-based execution with build verification gates

---

## MODE DEFINITIONS (GLOBAL REQUIREMENT)

| Mode | Behavior |
|------|----------|
| **ASK** | Learning mode - Agent answers questions, provides sources, teaches |
| **PLAN** | Like current planning mode - Creates markdown plan + todo list, executes when approved |
| **AUTO** | Safe tools auto-approved, destructive tools require approval with clear UI/UX |
| **DISCUSS** | Active dialogue - Agent and user take turns, maintain rapport |
| **FUCKIT** | NO RESTRICTIONS - Agent follows orders without asking |

**CRITICAL**: Mode behavior must be CONSISTENT across:
- System prompts
- Tool descriptions
- Permission logic
- UI/UX
- All code locations

---

## GLOBAL REQUIREMENTS

1. **NO restriction language in tool descriptions** - Describe what tool does, nothing about permission/danger
2. **Provider Abstraction** - Support GLM, DeepSeek, Mistral, OpenAI, Anthropic, XAI, + Other (manual config)
3. **Leave config scattered for now** - No ConfigManager rework at this stage
4. **Build + smoke test between phases**

---

## PHASE 0: CORE MODE REFACTOR (DO FIRST)

**Risk**: HIGH - Affects all permission logic
**Time**: 2-3 hours

### Item 0.1: Replace YOLO with 5 New Modes

**Files**:
- `INK/floyd-cli/src/prompts/system-prompt.ts`
- `floyd-wrapper-main/src/prompts/`
- `INK/floyd-cli/src/permissions/tool-policy.ts`
- `floyd-wrapper-main/src/permissions/permission-manager.ts`

**Changes**:
1. Remove YOLO mode references
2. Add ASK, PLAN, AUTO, DISCUSS, FUCKIT modes
3. Update mode descriptions in prompts
4. Update permission logic for each mode

**Verification**:
- Each mode behaves as defined
- FUCKIT mode has NO permission checks
- AUTO mode approves safe tools, prompts for destructive

---

### Item 0.2: Remove All "Requires Permission" Language from Tool Descriptions

**Files**:
- `INK/floyd-cli/src/config/available-tools.ts`
- `floyd-wrapper-main/src/prompts/system/capabilities.ts`
- Any other files with tool descriptions

**Changes**:
- Remove: "Requires permission", "dangerous", "⚠️", any restriction language
- Keep: Pure descriptions of what the tool does

**Before/After Example**:
```diff
- description: 'Delete files permanently. Always confirm first. ⚠️ DANGEROUS'
+ description: 'Delete files from disk. Automatically creates .bak backup.'
```

**Verification**:
```bash
cd /Volumes/Storage/FLOYD_CLI
grep -r "requires permission" INK/floyd-cli/ floyd-wrapper-main/src/
grep -r "DANGEROUS" INK/floyd-cli/src/config/ floyd-wrapper-main/src/prompts/
# Should return nothing related to tool descriptions
```

---

### Item 0.3: Update Permission Logic to Match New Modes

**Files**:
- `INK/floyd-cli/src/permissions/tool-policy.ts`
- `floyd-wrapper-main/src/permissions/permission-manager.ts`
- `INK/floyd-cli/src/permissions/risk-classifier.ts`

**Mode → Permission Mapping**:
```typescript
const MODE_PERMISSIONS: Record<ExecutionMode, PermissionBehavior> = {
  ASK: { alwaysPrompt: true },
  PLAN: { readOnly: true, promptForExecution: true },
  AUTO: { autoApproveSafe: true, promptForDestructive: true },
  DISCUSS: { alwaysPrompt: true, encourageDialogue: true },
  FUCKIT: { autoApproveAll: true, noRestrictions: true }
};
```

**Verification**:
- Test each mode with safe/destructive tools
- FUCKIT mode never prompts
- AUTO mode prompts only for destructive

---

## PHASE 1: PROVIDER ABSTRACTION

**Risk**: MEDIUM - Affects LLM communication
**Time**: 2-3 hours

### Item 1.1: Create Provider Abstraction Layer

**New File**: `packages/floyd-agent-core/src/llm/provider-registry.ts`

**GLM Max Coding Annual Pass Endpoints**:
- **Anthropic-compatible** (Floyd default): `https://api.z.ai/api/anthropic`
- **OpenAI-compatible** (other tools): `https://api.z.ai/api/coding/paas/v4`

**Supported Providers**:
- GLM (default - Anthropic endpoint for Floyd)
- DeepSeek
- Mistral
- OpenAI
- Anthropic (official)
- XAI
- Other (manual config: endpoint, key, format)

**Interface**:
```typescript
interface LLMProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'custom';
  endpoint: string;
  apiKey: string;
  model: string;
}

class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private currentProvider: string;

  register(name: string, provider: LLMProvider): void;
  setCurrent(name: string): void;
  getCurrent(): LLMProvider;
  // For "Other" - manual config
  registerCustom(name: string, config: Record<string, string>): void;
}

// DEFAULT: GLM with Anthropic endpoint
const GLM_DEFAULT = {
  name: 'glm',
  type: 'anthropic',
  endpoint: 'https://api.z.ai/api/anthropic',
  apiKey: process.env.GLM_API_KEY,
  model: 'glm-4.7'
};
```

**Verification**:
- GLM Anthropic endpoint works for Floyd
- Can switch to OpenAI-compatible endpoint
- Can switch to other providers

---

### Item 1.2: Update GLM Client to Use Registry

**Current GLM Client** (`floyd-wrapper-main/src/llm/glm-client.ts`):
- Uses OpenAI-compatible format
- Endpoint: `https://api.z.ai/api/coding/paas/v4`

**Files to Update**:
- `floyd-wrapper-main/src/llm/glm-client.ts`
- Any direct Anthropic SDK usage

**Changes**:
- GLM client supports BOTH Anthropic and OpenAI-compatible endpoints
- Default to Anthropic endpoint for Floyd (`https://api.z.ai/api/anthropic`)
- Falls back to current env vars if not set
- ProviderRegistry allows switching

**Verification**:
- Current GLM setup still works
- Can switch to Anthropic endpoint
- Can switch to other providers

---

## PHASE 2: TOOL EXECUTION FIXES

**Risk**: MEDIUM
**Time**: 1-2 hours

### Item 2.1: Terminal Tool ENOENT Fix

**File**: `floyd-wrapper-main/src/tools/system/index.ts`

**Issue**: `ls`, `echo`, `touch` fail with ENOENT, `pwd` works

**Fix**: Ensure full shell environment (PATH, etc.)

**Verification**:
```bash
pwd && ls -la && echo test && touch /tmp/floyd-test && rm /tmp/floyd-test
# All should work
```

---

### Item 2.2: Tool Parameter Validation

**File**: `floyd-wrapper-main/src/tools/file/file-core.ts`

**Issue**: `read_text_file` allows both head+tail, no validation

**Fix**: Add input validation before execution

**Verification**:
- Invalid inputs return clear errors
- Valid inputs still work

---

### Item 2.3: Standardized Error Responses

**New File**: `floyd-wrapper-main/src/tools/types.ts`

**Interface**:
```typescript
interface ToolError {
  type: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'COMMAND_NOT_FOUND';
  message: string;
  context?: Record<string, unknown>;
}

interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}
```

**Verification**:
- All tools return consistent error format
- Error types are specific

---

## PHASE 3: DYNAMIC PROMPTS & UI

**Risk**: LOW
**Time**: 1-2 hours

### Item 3.1: Dynamic Prompt Generation

**Files**:
- `INK/floyd-cli/src/prompts/system-prompt.ts`
- `INK/floyd-cli/src/config/available-tools.ts`
- `floyd-wrapper-main/src/prompts/system/capabilities.ts`

**Issue**: Hardcoded tool descriptions drift from AVAILABLE_TOOLS

**Fix**: Generate tool descriptions dynamically from AVAILABLE_TOOLS

**Verification**:
- Tool count in prompt matches AVAILABLE_TOOLS.length
- Adding tool automatically updates prompt

---

### Item 3.2: Desktop promptStyle UI Selector

**Files**:
- `FloydDesktopWeb/server/index.ts`
- `FloydDesktopWeb/server/prompts/` (need claude/floyd/custom styles)
- Client UI

**Issue**: API supports promptStyle but no UI

**Fix**: Add dropdown selector, implement all 4 styles

**Verification**:
- Settings shows promptStyle selector
- Switching styles changes behavior
- Screenshot verification

---

## PHASE 4: TESTING & QUALITY OF LIFE

**Risk**: LOW
**Time**: 2-3 hours

### Item 4.1: E2E Tests for Desktop Tools

**New File**: `FloydDesktopWeb/server/tool-executor.test.ts`

- Test all 34 new tools
- Cover edge cases

---

### Item 4.2: CLI Swarm Dispatch Verification

- Verify 60-tool support
- Test parallel dispatch

---

### Item 4.3: Testing Feedback List

**New File**: `INK/floyd-cli/docs/TESTING_FEEDBACK.md`

---

## PHASE 5: REMAINING QUALITY OF LIFE (OPTIONAL)

These can be done incrementally:
- Edit File Fuzzy Matching
- Cache Tool Clarification
- File Read Full Content Default
- Dry-Run Support
- Cache Tier Migration
- Git Branch Protection
- Browser Graceful Degradation
- Extended Grep Modes
- Browser Click Natural Language
- Transaction Support
- Smart Search
- Cache Usage Stats
- Complexity Classification
- Retry Guard

---

## EXECUTION SUMMARY

| Phase | Items | Risk | Time | Must Complete |
|-------|-------|------|------|---------------|
| 0 | Mode Refactor + Clean Descriptions | HIGH | 2-3h | YES |
| 1 | Provider Abstraction | MEDIUM | 2-3h | YES |
| 2 | Tool Execution Fixes | MEDIUM | 1-2h | YES |
| 3 | Dynamic Prompts + UI | LOW | 1-2h | YES |
| 4 | Testing | LOW | 2-3h | YES |
| 5 | Quality of Life | LOW | TBD | NO |

## PROGRESS TRACKING

| Phase | Status | Notes |
|-------|--------|-------|
| 0 | TODO | Core refactor - DO FIRST |
| 1 | TODO | Provider layer |
| 2 | TODO | Tool fixes |
| 3 | TODO | Prompts & UI |
| 4 | TODO | Testing |
| 5 | TODO | Optional improvements |

## VERIFICATION PROTOCOL

**Per Phase**:
1. `npm run build` succeeds
2. Smoke tests pass
3. Code diffs presented
4. Global consistency check (mode behavior matches across ALL locations)

**Final Verification**:
1. All 5 modes work as defined
2. No "requires permission" in tool descriptions
3. Provider switching works
4. Terminal commands work
5. Tests pass

---

## CHANGE LOG

| Date | Phase/Item | Status | Notes |
|------|-----------|--------|-------|
| 2026-01-29 | Plan Updated | TODO | Re-scoped to 5 modes, removed config centralization, focused on core issues |
