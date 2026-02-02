# FLOYD TUI - Complete Project Plan (0 to Shipped)

**Version:** 1.0
**Created:** 2026-01-28
**Status:** READY FOR BUILD
**Methodology:** Verification-First Development (VFD)

---

## Phase 0: Pre-Build Verification (Day 0)

**Purpose:** Ensure all dependencies are current and build environment is ready.

### Checklist V0.1: Environment Verification

| Step | Command | Expected Output | Receipt Format |
|------|---------|-----------------|----------------|
| 0.1 | `node --version` | v20.x+ or v22.x | Paste version |
| 0.2 | `npm --version` | 10.x+ | Paste version |
| 0.3 | `pwd` | `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main` | Verify path |
| 0.4 | `ls -la` | Show project root | Confirm structure |
| 0.5 | `cat package.json \| grep '"type"'` | `"type": "module"` | Confirm ESM |

### Checklist V0.2: Dependency Validation

| Step | Command | Expected Output | Receipt Format |
|------|---------|-----------------|----------------|
| 0.6 | `npm view ink version` | 6.6.0 or higher | Paste version |
| 0.7 | `npm view @inkjs/ui version` | 2.x or higher | Paste version |
| 0.8 | `npm view ink-text-input version` | 6.x or higher | Paste version |
| 0.9 | `npm view react version` | 18.3.x or higher | Paste version |

### Verification Receipt Template

```
V0.1 ENVIRONMENT CHECK
======================
Date: YYYY-MM-DD HH:MM:SS
Node: [paste output]
NPM: [paste output]
Path: [paste output]

Result: PASS/FAIL

V0.2 DEPENDENCY CHECK
=====================
Ink: [paste output]
Ink-UI: [paste output]
Ink-TextInput: [paste output]
React: [paste output]

Result: PASS/FAIL
```

---

## Phase 1: Project Scaffolding (Day 0-1)

**Purpose:** Create the basic TUI project structure with all necessary files.

### Checklist V1.1: Directory Structure

```bash
floyd-wrapper-main/
├── src/
│   ├── tui/                    # NEW - TUI-specific code
│   │   ├── components/
│   │   │   ├── StatusBar.tsx
│   │   │   ├── TranscriptPanel.tsx
│   │   │   ├── InputArea.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── PermissionDialog.tsx
│   │   │   ├── HelpOverlay.tsx
│   │   │   └── ProviderConfig.tsx
│   │   ├── theme/
│   │   │   ├── colors.ts
│   │   │   └── crush-theme.ts
│   │   ├── store/
│   │   │   └── tui-store.ts
│   │   ├── hooks/
│   │   │   ├── use-keyboard.ts
│   │   │   └── use-streaming.ts
│   │   ├── utils/
│   │   │   └── provider-config.ts
│   │   └── app.tsx              # TUI entry point
│   └── cli-tui.ts               # NEW - TUI launcher
└── tsconfig.json
```

### Checklist V1.2: File Creation Verification

For EACH file created, provide:

```
V1.2.{N} FILE: src/tui/components/StatusBar.tsx
===============================================
Command: ls -lh src/tui/components/StatusBar.tsx
Output:
-rw-r--r-- 1 user staff 1.2K Jan 28 12:34 src/tui/components/StatusBar.tsx

Command: wc -l src/tui/components/StatusBar.tsx
Output:
42 src/tui/components/StatusBar.tsx

Command: head -20 src/tui/components/StatusBar.tsx
Output:
[paste first 20 lines]

Result: PASS - File created with correct content
```

### Checklist V1.3: TypeScript Compilation

```
V1.3 TYPE COMPILATION
====================
Command: npm run build
Output:
[paste full build output - MINIMUM 10 lines]

Result: PASS/FAIL

If FAIL:
[paste error messages]
Fix applied: [describe fix]
Re-run command: [paste output]
```

### Phase 1 Completion Criteria

- [ ] All directories created (ls -la confirms structure)
- [ ] All 15+ component files created
- [ ] TypeScript compilation passes (0 errors)
- [ ] Import paths resolve correctly (no module not found errors)

---

## Phase 2: Core Components (Day 1-3)

**Purpose:** Build each TUI component with full testing and verification.

### Checklist V2.1: StatusBar Component

**File:** `src/tui/components/StatusBar.tsx`

| Verification | Command | Expected |
|--------------|---------|----------|
| File exists | `ls -lh` | Non-zero file |
| Exports default | `grep "export" StatusBar.tsx` | Export function/component |
| TypeScript valid | `tsc --noEmit StatusBar.tsx` | No errors |
| Props interface | `grep "interface.*Props"` | StatusBarProps defined |

**DIFF Verification:**
```bash
# After implementation, show what changed
git diff src/tui/components/StatusBar.tsx
```

### Checklist V2.2: TranscriptPanel Component

**File:** `src/tui/components/TranscriptPanel.tsx`

**Key Features to Verify:**
1. Messages render with correct prefixes (`> You:` / `* Floyd:`)
2. Colors match CRUSH theme spec
3. Tool calls show inline status
4. Streaming cursor appears during generation
5. Virtual scrolling enabled (window-based)

**Verification Script:**
```bash
# Create test render
cat > test-transcript.tsx << 'EOF'
import { render } from 'ink';
import { TranscriptPanel } from './src/tui/components/TranscriptPanel';

const testMessages = [
  { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
  { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() },
];

render(<TranscriptPanel messages={testMessages} height={20} />);
EOF

tsx test-transcript.tsx
```

**Receipt:**
```
V2.2 TRANSCRIPTPANEL VERIFICATION
=================================
Command: tsx test-transcript.tsx
Output:
[paste terminal output showing rendered TUI]

Result: PASS/FAIL
Visual check: [confirm messages appear with correct colors/prefixes]
```

### Checklist V2.3: InputArea Component

**File:** `src/tui/components/InputArea.tsx`

**Key Features to Verify:**
1. TextInput from ink-text-input works
2. 5000 char max enforced
3. 200ms debounce on submit
4. Placeholder changes when thinking
5. Hint footer shows shortcuts

### Checklist V2.4: CommandPalette Component

**File:** `src/tui/components/CommandPalette.tsx`

**Key Features to Verify:**
1. Opens with Ctrl+P
2. Fuzzy search works
3. Arrow key navigation
4. Enter executes
5. Esc closes

### Checklist V2.5: PermissionDialog Component

**File:** `src/tui/components/PermissionDialog.tsx`

**Key Features to Verify:**
1. Shows tool name and target
2. y/n/Esc key handling
3. Danger level styling
4. Blocks UI until decision

### Phase 2 Completion Criteria

- [ ] All components render without errors
- [ ] TypeScript compilation passes
- [ ] Manual TUI test shows correct visual output
- [ ] Keyboard shortcuts work as specified
- [ ] No console errors or warnings

---

## Phase 3: State Management (Day 3-4)

**Purpose:** Integrate Zustand store for TUI state.

### Checklist V3.1: Store Initialization

**File:** `src/tui/store/tui-store.ts`

```typescript
import { create } from 'zustand';

interface TuiStore {
  // UI State
  mode: 'yolo' | 'ask' | 'plan' | 'auto' | 'dialogue' | 'fuckit';
  model: string;
  provider: string;
  connectionStatus: 'online' | 'offline' | 'connecting';
  isThinking: boolean;
  whimsicalPhrase: string | null;

  // Messages
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
  }>;
  streamingContent: string;

  // Overlays
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  providerConfigOpen: boolean;

  // Actions
  setMode: (mode: TuiStore['mode']) => void;
  cycleMode: () => void;
  addMessage: (message: Omit<TuiStore['messages'][0], 'id'>) => void;
  setStreamingContent: (content: string) => void;
  setThinking: (thinking: boolean, phrase?: string) => void;
  setConnectionStatus: (status: TuiStore['connectionStatus']) => void;
  toggleCommandPalette: () => void;
  toggleHelp: () => void;
}

export const useTuiStore = create<TuiStore>((set, get) => ({
  // Initial state
  mode: 'yolo',
  model: 'glm-4-plus',
  provider: 'glm',
  connectionStatus: 'offline',
  isThinking: false,
  whimsicalPhrase: null,
  messages: [],
  streamingContent: '',
  commandPaletteOpen: false,
  helpOpen: false,
  providerConfigOpen: false,

  // Actions
  setMode: (mode) => set({ mode }),
  cycleMode: () => {
    const modes = ['yolo', 'ask', 'plan', 'auto', 'dialogue', 'fuckit'] as const;
    const current = get().mode;
    const idx = modes.indexOf(current);
    set({ mode: modes[(idx + 1) % modes.length] });
  },
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: crypto.randomUUID() }]
  })),
  setStreamingContent: (content) => set({ streamingContent: content }),
  setThinking: (thinking, phrase) => set({ isThinking: thinking, whimsicalPhrase: phrase || null }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  toggleHelp: () => set((state) => ({ helpOpen: !state.helpOpen })),
}));
```

**Verification:**
```
V3.1 STORE VERIFICATION
======================
Command: tsx -e "import { useTuiStore } from './src/tui/store/tui-store.ts'; console.log('OK')"
Output:
OK

Command: tsx -e "import { useTuiStore } from './src/tui/store/tui-store.ts'; const s = useTuiStore.getState(); s.cycleMode(); console.log(s.mode)"
Output:
ask

Result: PASS - Store initializes and actions work
```

### Phase 3 Completion Criteria

- [ ] Store exports correctly
- [ ] All state properties defined
- [ ] All actions work correctly
- [ ] TypeScript types are valid
- [ ] No runtime errors on store access

---

## Phase 4: Provider Integration (Day 4-5)

**Purpose:** Connect TUI to existing GLM client and execution engine.

### Checklist V4.1: Provider Configuration UI

**File:** `src/tui/components/ProviderConfig.tsx`

**Verification:**
```
V4.1 PROVIDER CONFIG VERIFICATION
==================================
Command: tsx src/cli-tui.ts --tui --test-provider
Output:
[paste provider selection UI]

Test key press 1: Select GLM
Test key press 2: Select OpenAI
Test key press Esc: Exit

Result: PASS - Provider selection works
```

### Checklist V4.2: API Key Validation

**File:** `src/tui/utils/provider-config.ts`

```typescript
export async function validateApiKey(config: ProviderConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
```

**Verification:**
```
V4.2 API KEY VALIDATION
======================
Command: tsx -e "
import { validateApiKey } from './src/tui/utils/provider-config.ts';
validateApiKey({
  name: 'Test',
  endpoint: 'https://api.z.ai/api/coding/paas/v4',
  model: 'glm-4-plus',
  apiKey: process.env.GLM_API_KEY || 'invalid'
}).then(r => console.log('Valid:', r))
"
Output:
Valid: true

Result: PASS - API validation works
```

### Checklist V4.3: GLM Client Integration

**Integration Point:** Wire existing `floyd-wrapper-main/src/llm/glm-client.ts` to TUI

```typescript
// src/tui/hooks/use-streaming.ts
import { useTuiStore } from '../store/tui-store.js';
import { GLMClient } from '../../llm/glm-client.js';

export function useStreaming() {
  const { addMessage, setStreamingContent, setThinking } = useTuiStore();

  const streamMessage = async (prompt: string, client: GLMClient) => {
    setThinking(true, 'Chasing the perfect implementation...');

    // Create user message
    addMessage({
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    });

    let fullResponse = '';

    // Stream from existing GLM client
    for await (const chunk of client.streamChat({ messages: [{ role: 'user', content: prompt }] })) {
      if (chunk.type === 'token') {
        fullResponse += chunk.content;
        setStreamingContent(fullResponse);
      }
    }

    // Complete message
    addMessage({
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
    });

    setStreamingContent('');
    setThinking(false);
  };

  return { streamMessage };
}
```

**Verification:**
```
V4.3 GLM CLIENT INTEGRATION
==========================
Command: npm run build
Output:
[paste build output - confirm no import errors]

Command: tsx src/cli-tui.ts --tui --test-stream
Input: Hello
Output:
[paste streaming response]

Result: PASS - Streaming works end-to-end
```

### Phase 4 Completion Criteria

- [ ] Provider selection UI works
- [ ] API key validates correctly
- [ ] GLM client imports and executes
- [ ] Streaming responses render in TUI
- [ ] Mode-based permissions work

---

## Phase 5: Keyboard Shortcuts (Day 5-6)

**Purpose:** Implement all keyboard shortcuts per TUI mockup.

### Checklist V5.1: Global Shortcuts

| Shortcut | Action | Verification |
|----------|--------|--------------|
| `Ctrl+Q` | Exit | App terminates cleanly |
| `Ctrl+C` | Exit | App terminates cleanly |
| `Ctrl+P` | Command Palette | Overlay opens |
| `Ctrl+/` | Help Overlay | Overlay opens |
| `Shift+Tab` | Cycle Mode | Mode badge changes |
| `Esc` | Close overlay | Overlay closes |

**Verification Script:**
```typescript
// src/tui/hooks/use-keyboard.ts
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';

export function useKeyboard() {
  const {
    toggleCommandPalette,
    toggleHelp,
    cycleMode,
    commandPaletteOpen,
    helpOpen,
  } = useTuiStore();

  useInput((input, key) => {
    // Don't handle if overlays are open (they handle their own input)
    if (commandPaletteOpen || helpOpen) return;

    // Ctrl+P - Command palette
    if (key.ctrl && input === 'p') {
      toggleCommandPalette();
      return;
    }

    // Ctrl+/ - Help
    if (key.ctrl && input === '/') {
      toggleHelp();
      return;
    }

    // Ctrl+Q - Exit
    if (key.ctrl && input === 'q') {
      process.exit(0);
    }

    // Shift+Tab - Cycle mode
    if (key.tab && key.shift) {
      cycleMode();
      return;
    }
  });
}
```

**Verification:**
```
V5.1 KEYBOARD SHORTCUTS VERIFICATION
===================================
Test 1: Ctrl+P
Action: Press Ctrl+P
Expected: Command palette opens
Actual: [paste observation]
Result: PASS/FAIL

Test 2: Ctrl+/
Action: Press Ctrl+/
Expected: Help overlay opens
Actual: [paste observation]
Result: PASS/FAIL

Test 3: Shift+Tab
Action: Press Shift+Tab
Expected: Mode cycles YOLO → ASK → PLAN...
Actual: [paste observation]
Result: PASS/FAIL

[Continue for all shortcuts...]
```

### Phase 5 Completion Criteria

- [ ] All 15+ shortcuts work
- [ ] Shortcuts don't conflict with input
- [ ] Esc is context-aware
- [ ] Double-press exit works (Ctrl+Q x2)

---

## Phase 6: Theme & Styling (Day 6-7)

**Purpose:** Implement CRUSH theme with correct colors.

### Checklist V6.1: Color System

**File:** `src/tui/theme/colors.ts`

```typescript
export const CRUSH_THEME = {
  colors: {
    // Base colors
    bg: '#1a1a2e',
    fgBase: '#e0e0e0',
    fgMuted: '#808080',
    border: '#303050',
    borderFocus: '#6B50FF',
    selection: '#6B50FF40',

    // Role colors
    userLabel: '#82AAFF',
    assistantLabel: '#FF60FF',
    systemLabel: '#FFA500',
    toolLabel: '#00BCD4',

    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    working: '#FFC107',
    offline: '#9E9E9E',
    ready: '#8BC34A',

    // Mode colors
    yolo: '#FFC107',
    ask: '#2196F3',
    plan: '#4CAF50',
    auto: '#9C27B0',
    dialogue: '#00BCD4',
    fuckit: '#F44336',
  },
};
```

**Verification:**
```
V6.1 COLOR VERIFICATION
======================
Command: tsx -e "
import { CRUSH_THEME } from './src/tui/theme/colors.ts';
console.log(JSON.stringify(CRUSH_THEME.colors, null, 2));
"
Output:
[paste color object]

Visual check: [Run TUI and confirm colors match spec]
Mode badges: [Confirm each mode has correct color]
Result: PASS/FAIL
```

### Phase 6 Completion Criteria

- [ ] All colors defined
- [ ] Colors match CRUSH theme spec
- [ ] Terminal supports truecolor (24-bit)
- [ ] Graceful fallback for limited terminals

---

## Phase 7: Testing & Smoke Tests (Day 7-8)

**Purpose:** Comprehensive testing before shipping.

### Checklist V7.1: Unit Tests

```bash
# Install test dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

**Test Coverage Requirements:**
- Components: 80%+ coverage
- Store: 90%+ coverage
- Hooks: 85%+ coverage
- Utils: 90%+ coverage

### Checklist V7.2: Integration Tests

```typescript
// tests/tui-integration.test.tsx
import { render } from 'ink-testing-library';
import { FloydTUI } from '../src/tui/app.js';

describe('Floyd TUI Integration', () => {
  it('renders status bar with correct props', async () => {
    const { lastFrame } = render(<FloydTUI />);
    expect(lastFrame()).toContain('FLOYD GOD TIER');
    expect(lastFrame()).toContain('[YOLO]');
  });

  it('handles user input correctly', async () => {
    const { lastFrame, stdin } = render(<FloydTUI />);
    stdin.write('Hello');
    await delay(100);
    // Verify input appears
  });
});
```

### Checklist V7.3: 15-Turn Smoke Test

Execute 15 real interactions and document each:

```
V7.3 15-TURN SMOKE TEST
======================

Turn 1: Launch TUI
Command: npm run start -- --tui
Expected: TUI renders with banner, status bar, input
Actual: [paste screenshot description]
Result: PASS/FAIL

Turn 2: Type first message
Input: "Hello Floyd"
Expected: Message appears in transcript, Floyd responds
Actual: [paste observation]
Result: PASS/FAIL

Turn 3: Mode switch
Action: Press Shift+Tab
Expected: Mode changes YOLO → ASK
Actual: [paste observation]
Result: PASS/FAIL

[Continue for 15 turns...]

Summary: X/15 passed
```

### Phase 7 Completion Criteria

- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] 15-turn smoke test passes (95%+)
- [ ] No console errors or warnings
- [ ] Memory stable (no leaks)

---

## Phase 8: Build & Package (Day 8-9)

**Purpose:** Prepare for distribution.

### Checklist V8.1: Production Build

```bash
# Build for production
npm run build

# Verify output
ls -lh dist/
```

**Expected Output:**
```
V8.1 PRODUCTION BUILD
====================
Command: npm run build
Output:
✓ Built in 2.3s

dist/
├── tui/
│   ├── components/
│   │   ├── StatusBar.js
│   │   ├── StatusBar.d.ts
│   │   └── ...
│   ├── app.js
│   └── app.d.ts
├── cli-tui.js
└── cli-tui.d.ts

Result: PASS - Build successful
```

### Checklist V8.2: Bundle Size Check

```bash
# Check bundle size
du -sh dist/tui/
```

**Target:** Keep TUI bundle under 500KB (unminified)

### Checklist V8.3: Binary Generation

```bash
# Package as executable
npm pkg set "bin.floyd-tui=./dist/cli-tui.js"
npm link
```

**Verification:**
```
V8.3 BINARY VERIFICATION
========================
Command: floyd-tui --version
Output: floyd-tui v1.0.0

Command: floyd-tui --tui
Output: [TUI launches]

Result: PASS - Binary works
```

### Phase 8 Completion Criteria

- [ ] Production build succeeds
- [ ] Bundle size acceptable
- [ ] Binary executes correctly
- [ ] All imports resolve

---

## Phase 9: DIFF Verification (Day 9-10)

**Purpose:** Confirm build matches specification exactly.

### Checklist V9.1: File Diff Verification

For each component, verify implementation matches spec:

```bash
# StatusBar diff check
git diff --no-index src/tui/components/StatusBar.tsx FLOYD\ ECOSYSTEM/TUI_MOCKUP.md
```

**Better: Side-by-side comparison**

```bash
# Show StatusBar implementation
cat src/tui/components/StatusBar.tsx

# Compare with spec (lines 432-493 of TUI_MOCKUP.md)
sed -n '432,493p' "FLOYD ECOSYSTEM/TUI_MOCKUP.md"
```

**Verification Template:**
```
V9.1.{COMPONENT} DIFF VERIFICATION
==================================
Component: StatusBar
Spec Lines: 432-493

Differences:
- Line X: Spec has A, Implementation has B
- Line Y: Spec has C, Implementation has D

Matches: ✓ (or ✗ with explanation)

Result: PASS/FAIL
```

### Checklist V9.2: Feature Parity Matrix

| Feature | Spec | Implementation | Status |
|---------|------|----------------|--------|
| Status bar with mode badge | TUI_MOCKUP.md:74-82 | StatusBar.tsx:20-30 | ✓ |
| Messages flow UP | TUI_MOCKUP.md:86 | TranscriptPanel.tsx:40-50 | ✓ |
| Inline tool status | TUI_MOCKUP.md:150-164 | TranscriptPanel.tsx:70-80 | ✓ |
| Ctrl+P command palette | TUI_MOCKUP.md:230 | CommandPalette.tsx:10-20 | ✓ |
| Permission dialogs | TUI_MOCKUP.md:357-379 | PermissionDialog.tsx:5-15 | ✓ |
| Mode colors | TUI_MOCKUP.md:112-119 | colors.ts:30-40 | ✓ |

**Verification:**
```
V9.2 FEATURE PARITY
===================
Total features: 42
Implemented: 42
Parity: 100%

Result: PASS - All features from spec implemented
```

### Phase 9 Completion Criteria

- [ ] All components match spec
- [ ] No missing features
- [ ] All keyboard shortcuts work
- [ ] Visual layout matches mockup

---

## Phase 10: Final Verification & Ship (Day 10)

**Purpose:** Final checks before declaring ready.

### Checklist V10.1: Quality Gate

```
V10.1 QUALITY GATE
==================

Phase A: Code Walkthrough
- Files changed: [list all]
- Build status: [npm run build output]
- Lint status: [npm run lint output]

Phase B: 15-Turn Simulation (3 consecutive clean runs)

Run 1: [date/time]
- Turn 1-15: [PASS/FAIL each]
- Clean run: YES/NO
- Receipts: [attach screenshots or logs]

Run 2: [date/time]
- Turn 1-15: [PASS/FAIL each]
- Clean run: YES/NO
- Receipts: [attach screenshots or logs]

Run 3: [date/time]
- Turn 1-15: [PASS/FAIL each]
- Clean run: YES/NO
- Receipts: [attach screenshots or logs]

Phase C: Smoke Tests (3 rounds)

Round 1: Fresh Install
- Pass rate: X/100 tests
- Failures: [list any]

Round 2: Edge Cases
- Pass rate: X/100 tests
- Failures: [list any]

Round 3: Integration
- Pass rate: X/100 tests
- Failures: [list any]

Combined Pass Rate: X% (must be ≥95%)

VERDICT: READY FOR DOUGLAS | NOT READY
```

### Checklist V10.2: Ship Checklist

- [ ] All 10 phases complete
- [ ] Quality gate passed (95%+)
- [ ] Documentation updated
- [ ] Binary tests work
- [ ] No known bugs
- [ ] Provider switching works
- [ ] All modes functional
- [ ] Keyboard shortcuts work
- [ ] Colors match CRUSH theme
- [ ] Memory stable

---

## Appendix A: Verification Receipt Format

All receipts MUST follow this format:

```
VERIFICATION RECEIPT
===================
Agent: [agent ID]
Date: YYYY-MM-DD HH:MM:SS
Phase: [Phase number]
Component: [Component name]

Test Description:
[What was tested]

Command Run:
[exact command]

Full Output:
[paste MINIMUM 5 lines of output]

Expected:
[what should happen]

Actual:
[what actually happened]

Result: PASS | FAIL

If FAIL:
- Error: [paste error]
- Fix applied: [describe]
- Re-verification: [paste output]
```

---

## Appendix B: DIFF Format

When submitting build for review, include:

```bash
# Generate full diff
git diff HEAD > floyd-tui-build.patch

# Generate summary
git diff --stat HEAD

# Show only TUI changes
git diff HEAD -- src/tui/

# Show file list
git diff --name-only HEAD
```

**Include in final report:**
```
BUILD DIFF SUMMARY
==================
Files changed: X
Lines added: Y
Lines removed: Z
Net change: ±N

Component breakdown:
- StatusBar.tsx: +42 -5
- TranscriptPanel.tsx: +128 -0
- InputArea.tsx: +67 -0
...
```

---

## Appendix C: Failure Recovery

If any verification fails:

1. **Stop** - Do not continue to next phase
2. **Document** - Record exact failure in receipts
3. **Fix** - Apply specific fix
4. **Rebuild** - Run `npm run build`
5. **Retest** - Re-run failed verification
6. **Document** - Record fix success

**Example:**
```
FAILURE: TranscriptPanel compilation error
==========================================
Error: TS2307: Cannot find module 'ink-text-input'

Fix applied: npm install ink-text-input@^6.0.0

Rebuild: npm run build
Output: ✓ Built successfully

Retest: tsx -e "import { TranscriptPanel } from './src/tui/components/TranscriptPanel.js'"
Output: (no errors)

Result: PASS - Fix verified
```

---

## Appendix D: Resources

**Documentation:**
- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [Ink UI Components](https://github.com/vadimdemedes/ink-ui)
- [Zustand Guide](https://github.com/pmndrs/zustand)

**Internal:**
- `TUI_MOCKUP.md` - Visual specification and reference code
- `FLOYD_GOD_TIER.md` - Architecture and provider config
- `floyd-wrapper-main/src/llm/glm-client.ts` - Existing GLM client

**Commands:**
```bash
# Development
npm run dev        # Watch mode
npm run build      # Production build
npm run lint       # Lint check
npm test           # Run tests

# TUI Launch
npm start -- --tui           # Launch TUI
npm start -- --tui --debug   # Debug mode
npm start -- --tui --test    # Test mode
```

---

**End of Project Plan**

---

**Status:** READY FOR BUILD
**Next Action:** Execute Phase 0 - Pre-Build Verification
