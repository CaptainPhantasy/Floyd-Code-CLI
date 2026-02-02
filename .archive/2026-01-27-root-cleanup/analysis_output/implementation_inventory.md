# FLOYD CLI Implementation Inventory

**Analysis Date:** 2026-01-20
**Focus:** CLI Shortcomings, Hotkey Issues, and UI/UX Behavior

---

## 1. CLI TERMINAL SIZING ANALYSIS

### Exact Terminal Frame Dimensions

**Detection Location:** `src/ui/layouts/MainLayout.tsx:661-670`

```typescript
const terminalWidth = process.stdout.columns || 80;
const terminalHeight = process.stdout.rows || 24;
```

**Responsive Breakpoints:**

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Very Narrow | < 80 | Hide both side panels, hide banner |
| Narrow | < 100 | Hide CONTEXT panel, keep SESSION (16 cols) |
| Normal | 100-119 | Show both panels (20 cols each) |
| Wide | 120-159 | SESSION (20 cols), CONTEXT (20 cols) |
| Ultra Wide | >= 160 | SESSION (24 cols), CONTEXT (24 cols) |

### Sizing Logic Issues

#### Issue #1: DEBUG in Production
**File:** `src/ui/layouts/MainLayout.tsx:664-665`

```typescript
// DEBUG: Log terminal size to help diagnose scrolling issues
console.error(`[DEBUG] Terminal: ${terminalWidth} cols x ${terminalHeight} rows`);
```

**Problem:** Debug statements left in production code polluting stderr.

#### Issue #2: Hardcoded Height Calculations
**File:** `src/ui/layouts/MainLayout.tsx:678-689`

```typescript
const getOverheadHeight = () => {
    if (isVeryNarrowScreen) {
        return 5;  // StatusBar(2) + Input(3)
    }
    if (isNarrowScreen) {
        return 5;  // StatusBar(2) + Input(3)
    }
    return 15;  // Banner(10) + StatusBar(2) + Input(3)
};
```

**Problem:**
- Assumes exact line counts for components
- Does not account for actual rendered height
- Border height not included in calculation
- Padding not factored in

#### Issue #3: Frame Border Height Not Accounted For
**File:** `src/ui/crush/Frame.tsx`

```typescript
<Box borderStyle="round" borderColor={...} paddingX={1} paddingY={0}>
```

**Problem:**
- `borderStyle="round"` adds 2 lines (top + bottom border)
- `paddingX={1}` adds horizontal padding only
- Actual rendered height > calculated height
- TranscriptPanel uses Frame which adds extra height

#### Issue #4: TranscriptHeight Calculation
**File:** `src/ui/layouts/MainLayout.tsx:698`

```typescript
const transcriptHeight = Math.max(1, availableHeight - 1);
```

**Problem:**
- Assumes all overhead is correct
- Does not account for Frame borders in TranscriptPanel
- Does not account for Viewport borders
- Can cause terminal overflow on small screens

---

## 2. EXPECTED VS ACTUAL UI/UX BEHAVIOR

### Expected User Flow (From Design)

1. **Startup:**
   - Show FLOYD ASCII banner (8 lines)
   - Show status bar with user info
   - Show 3-panel layout (SESSION | TRANSCRIPT | CONTEXT)
   - Show input field with hints
   - Display greeting message

2. **Input:**
   - User types in TextInput
   - Press Enter to submit
   - Show streaming response
   - Display whimsical phrase during thinking

3. **Navigation:**
   - Ctrl+P opens command palette
   - Ctrl+/ or ? shows help
   - Esc exits (or closes overlay)
   - Shift+Tab cycles safety mode

### Actual Behavior Analysis

#### Startup Flow
**Files:** `app.tsx:139-205`, `MainLayout.tsx:1039-1121`

**Actual:**
- [x] ASCII banner renders (8 lines)
- [x] Status bar renders (2 lines with borders)
- [x] 3-panel layout renders
- [x] Input field renders
- [x] Greeting message added to store

**Issues:**
- Panel visibility depends on terminal width (responsive)
- On very narrow screens (< 80), only TRANSCRIPT shows
- No explicit minimum terminal size check before starting

#### Input Flow
**Files:** `MainLayout.tsx:773-781`, `app.tsx:211-403`

**Actual:**
- [x] TextInput receives keystrokes
- [x] Enter submits via handleSubmit
- [x] Dock commands parsed (`:dock btop`)
- [x] Message added to Zustand store
- [x] AgentEngine processes via generator
- [x] Stream throttled at 75 tokens/sec

**Issues:**
- No validation of message length
- No rate limiting on submissions
- Whimsical phrase shown but not added to messages (correct)

#### Navigation Flow
**Files:** `app.tsx:409-448`, `MainLayout.tsx:872-956`

**Actual:**
- [?] Esc works (CONFLICT between implementations)
- [?] Ctrl+/ works (DUPLICATE handlers)
- [?] Ctrl+P works (delegated to CommandPaletteTrigger)
- [?] ? key works (DUPLICATE handlers, typing check)
- [x] Shift+Tab cycles safety mode (MainLayout only)

**Issues:**
- Multiple `useInput` hooks create conflicts
- No way to know which handler catches the key first
- Inconsistent behavior depending on component mount order

---

## 3. HOTKEY LOGIC ANALYSIS

### Hotkey Handlers Inventory

| Component | Lines | Handlers Registered |
|-----------|-------|---------------------|
| app.tsx | 409-448 | Esc, Ctrl+/, ?, Ctrl+M, Ctrl+T, Ctrl+Y |
| MainLayout.tsx | 872-956 | Ctrl+C, Esc, Ctrl+/, Ctrl+P, ?, Shift+Tab, Ctrl+M, Ctrl+T, Ctrl+R, Ctrl+Shift+P |
| CommandPaletteTrigger.tsx | 434-452 | Ctrl+P, /, Esc |
| Viewport.tsx | 115-136 | Arrow keys, PageUp/Down, Ctrl+A, Ctrl+E |
| HelpOverlay.tsx | 189-221 | Esc, Ctrl+/, Arrow keys, Enter |
| CommandPalette.tsx | 198-258 | Esc, Ctrl+P, Arrow keys, PageUp/Down, Enter |
| PromptLibraryOverlay.tsx | 425- | Esc, Arrow keys, Enter |
| AgentBuilder.tsx | 67, 141, 241, 310 | Various per step |
| TerminalEmbed.tsx | 418 | Arrow keys, Ctrl+C |
| ConfirmInput.tsx | 39 | Enter, Esc |
| DiffViewer.tsx | 427 | Arrow keys, PageUp/Down |
| FilePicker.tsx | 425, 708 | Arrow keys, Enter, Esc |
| ConfigApp.tsx | 37 | Esc, ? |
| ApiSettings.tsx | 128 | Esc, Ctrl+S |
| AgentManager.tsx | 90 | Arrow keys, Enter |
| MonitorConfig.tsx | 67 | Arrow keys, Enter |
| PromptLibrary.tsx | 80 | Arrow keys, Enter |
| PermissionCompact.tsx | 104, 241, 329 | Arrow keys, Enter, Esc |
| PermissionModal.tsx | 144 | Arrow keys, Enter, Esc |
| ask-overlay.tsx | 144 | Arrow keys, Enter, Esc, y, n |
| EnhancedMainLayout.tsx | 195 | Esc |

**Total: 28+ useInput hooks**

### Line-by-Line Hotkey Analysis

#### app.tsx useInput (Lines 409-448)

```typescript
useInput((inputKey, key) => {
    // LINE 410-419: Esc handling
    if (key.escape) {
        if (showHelp) {
            setShowHelp(false);
        } else if (showMonitor) {
            setShowMonitor(false);
        } else {
            exit();
        }
        return;
    }

    // LINE 421-425: Ctrl+/ toggle help
    if (key.ctrl && inputKey === '/') {
        setShowHelp(value => !value);
        return;
    }

    // LINE 428-432: ? toggle help (with state check)
    if (inputKey === '?' && !showHelp && !showMonitor) {
        setShowHelp(value => !value);
        return;
    }

    // LINE 434-437: Ctrl+M toggle monitor
    if (inputKey === 'm' && key.ctrl) {
        setShowMonitor(value => !value);
    }

    // LINE 439-442: Ctrl+T toggle agent viz
    if (inputKey === 't' && key.ctrl) {
        setShowAgentViz(value => !value);
    }

    // LINE 444-447: Ctrl+Y toggle YOLO mode
    if (inputKey === 'y' && key.ctrl) {
        toggleSafetyMode();
    }
});
```

**Issues:**
1. **Missing `return` statements** after Ctrl+M and Ctrl+T (lines 436, 441)
2. **No coordination with MainLayout handlers**
3. **State checks (? hotkey)** not synchronized with MainLayout's input check

#### MainLayout.tsx useInput (Lines 872-956)

```typescript
useInput((_inputKey, key) => {
    // LINE 875-879: Ctrl+C exit (highest priority)
    if (key.ctrl && (_inputKey === 'c' || _inputKey === 'C')) {
        onExit?.();
        inkExit();
        return;
    }

    // LINE 883-895: Esc handling
    if (key.escape) {
        if (showHelp) {
            setShowHelp(false);
        } else if (showPromptLibrary) {
            setShowPromptLibrary(false);
        } else if (showAgentBuilder) {
            setShowAgentBuilder(false);
        } else {
            onExit?.();
            inkExit();
        }
        return;
    }

    // LINE 898-901: Ctrl+/ toggle help
    if (key.ctrl && _inputKey === '/') {
        setShowHelp(v => !v);
        return;
    }

    // LINE 904-910: Ctrl+P pass-through
    if (key.ctrl && _inputKey === 'p') {
        if (showHelp) {
            setShowHelp(false);
        }
        return;
    }

    // LINE 915-918: ? hotkey with input check
    if (input.length === 0 && !isTypingRef.current && _inputKey === '?') {
        setShowHelp(v => !v);
        return;
    }

    // LINE 921-931: Shift+Tab safety mode cycle
    if (key.tab && key.shift) {
        const modes: Array<'yolo' | 'ask' | 'plan'> = ['yolo', 'ask', 'plan'];
        const currentIndex = modes.indexOf(currentSafetyMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const newMode = modes[nextIndex];

        setCurrentSafetyMode(newMode);
        onSafetyModeChange?.(newMode);
        onCommand?.('safety-mode-changed');
        return;
    }

    // LINE 934-937: Ctrl+M toggle monitor
    if (key.ctrl && _inputKey === 'm') {
        onCommand?.('toggle-monitor');
        return;
    }

    // LINE 940-943: Ctrl+T toggle agent viz
    if (key.ctrl && _inputKey === 't') {
        onCommand?.('toggle-agent-viz');
        return;
    }

    // LINE 946-949: Ctrl+R voice input
    if (key.ctrl && _inputKey === 'r') {
        handleVoiceInput();
        return;
    }

    // LINE 952-955: Ctrl+Shift+P prompt library
    if (key.ctrl && key.shift && _inputKey === 'p') {
        setShowPromptLibrary(v => !v);
        return;
    }
});
```

**Issues:**
1. **Duplicate Esc handling** with app.tsx (different overlay states)
2. **Duplicate Ctrl+/ handling** with app.tsx
3. **Duplicate ? handling** with app.tsx (different checks)
4. **Duplicate Ctrl+M** with app.tsx
5. **Duplicate Ctrl+T** with app.tsx
6. **Missing return** after Ctrl+P (could allow fallthrough)

### Why Hotkeys Are Not Working

**Root Cause:** Ink's `useInput` registers handlers in component mount order. When multiple components call `useInput`, they ALL receive the same key events. The handler that returns first prevents others from executing.

**Specific Failure Modes:**

1. **Esc Key Confusion:**
   - app.tsx handles: showHelp, showMonitor, exit
   - MainLayout handles: showHelp, showPromptLibrary, showAgentBuilder, exit
   - Result: If app.tsx mounts first, it may exit when MainLayout should close overlay

2. **Ctrl+/ Confusion:**
   - Both toggle `setShowHelp`
   - Different state variables (`showHelp` in each component)
   - Result: State gets out of sync

3. **? Key Confusion:**
   - app.tsx checks `!showHelp && !showMonitor`
   - MainLayout checks `input.length === 0 && !isTypingRef.current`
   - Result: Different trigger conditions cause inconsistent behavior

4. **Ctrl+M/T Confusion:**
   - app.tsx: Missing `return` statements
   - MainLayout: Has `return` and calls `onCommand`
   - Result: Both handlers may execute, or MainLayout may not execute

### Input State Check Issue

**File:** `MainLayout.tsx:732-765`

```typescript
const inputRef = useRef(input);
const isTypingRef = useRef(false);
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const textInputFocusedRef = useRef(false);

useEffect(() => {
    inputRef.current = input;
    isTypingRef.current = input.length > 0;
    textInputFocusedRef.current = input.length > 0;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    if (input.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            textInputFocusedRef.current = false;
        }, 1000);
    } else {
        isTypingRef.current = false;
        textInputFocusedRef.current = false;
    }

    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };
}, [input]);
```

**Issues:**
1. **1000ms timeout** is too long - user may think ? hotkey is broken
2. **`input.length > 0`** means any character typed blocks ? for 1 second
3. **No way to clear the typing state** except waiting
4. **Ink TextInput** may have its own focus state not tracked here

---

## 4. CLI SHORTCOMINGS

### Critical Issues

| # | Issue | File | Lines | Severity |
|---|-------|------|-------|----------|
| 1 | Multiple duplicate `useInput` handlers | Multiple | - | CRITICAL |
| 2 | No global hotkey coordinator | - | - | CRITICAL |
| 3 | Esc key conflicts | app.tsx, MainLayout.tsx | 410, 883 | CRITICAL |
| 4 | Ctrl+/ duplicate | app.tsx, MainLayout.tsx | 422, 898 | HIGH |
| 5 | ? key inconsistent checks | app.tsx, MainLayout.tsx | 429, 915 | HIGH |
| 6 | Ctrl+M missing return in app.tsx | app.tsx | 434-437 | HIGH |
| 7 | Ctrl+T missing return in app.tsx | app.tsx | 439-442 | HIGH |
| 8 | 1000ms typing timeout blocks ? | MainLayout.tsx | 750 | MEDIUM |
| 9 | Terminal height calculation inaccurate | MainLayout.tsx | 678-700 | MEDIUM |
| 10 | DEBUG statements in production | MainLayout.tsx | 664-665 | MEDIUM |
| 11 | Viewport scroll conflicts | Viewport.tsx | 115-136 | MEDIUM |
| 12 | No minimum terminal size check | cli.tsx | - | LOW |

### Major Issues

| # | Issue | File | Lines | Severity |
|---|-------|------|-------|----------|
| 13 | Frame border height not in calc | MainLayout.tsx | 678 | MAJOR |
| 14 | No input validation | MainLayout.tsx | 773 | MAJOR |
| 15 | No rate limiting on messages | app.tsx | 211 | MAJOR |
| 16 | getOverheadHeight() duplicated logic | MainLayout.tsx | 678-689 | MAJOR |
| 17 | Safety mode state duplicated | app.tsx, MainLayout | 131, 657 | MAJOR |
| 18 | No hotkey for "New Task" | - | - | MAJOR |
| 19 | Shift+Tab only works in MainLayout | MainLayout.tsx | 921 | MAJOR |

### Minor Issues

| # | Issue | File | Lines | Severity |
|---|-------|------|-------|----------|
| 20 | CommandPalette shows `/` as open key | MainLayout.tsx | 1033 | MINOR |
| 21 | Help overlay title inconsistent | MainLayout.tsx, HelpOverlay | 994, 233 | MINOR |
| 22 | No "getting started" guide | app.tsx | 527-567 | MINOR |
| 23 | Whimsical phrase never shown in status bar | MainLayout.tsx | 396 | MINOR |
| 24 | StatusBar hardcodes "FLOYD CLI" | MainLayout.tsx | 353 | MINOR |
| 25 | SessionPanel toolStates always empty | MainLayout.tsx | 644 | MINOR |

---

## 5. DETAILED CODE WALKTHROUGH

### MainLayout Component Breakdown

#### State Initialization (Lines 653-658)
```typescript
const [input, setInput] = useState('');
const [showHelp, setShowHelp] = useState(showHelpProp);
const [showPromptLibrary, setShowPromptLibrary] = useState(showPromptLibraryProp);
const [showAgentBuilder, setShowAgentBuilder] = useState(false);
const [currentSafetyMode, setCurrentSafetyMode] = useState<'yolo' | 'ask' | 'plan'>(safetyMode || 'ask');
const {exit: inkExit} = useApp();
```

**Analysis:**
- Local state for overlay visibility
- Safety mode duplicated from prop
- Uses Ink's `useApp` for exit

#### Terminal Size Detection (Lines 661-700)
```typescript
const terminalWidth = process.stdout.columns || 80;
const terminalHeight = process.stdout.rows || 24;

console.error(`[DEBUG] Terminal: ${terminalWidth} cols x ${terminalHeight} rows`);

const isWideScreen = terminalWidth >= 120;
const isUltraWideScreen = terminalWidth >= 160;
const isNarrowScreen = terminalWidth < 100;
const isVeryNarrowScreen = terminalWidth < 80;

const getOverheadHeight = () => { /* ... */ };
const overheadHeight = getOverheadHeight();
const availableHeight = terminalHeight - overheadHeight;
const transcriptHeight = Math.max(1, availableHeight - 1);
```

**Issues:**
1. `console.error` in production
2. Hardcoded breakpoint values
3. No reactivity to terminal resize

#### Input State Refs (Lines 732-765)
```typescript
const inputRef = useRef(input);
const isTypingRef = useRef(false);
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const textInputFocusedRef = useRef(false);

useEffect(() => {
    inputRef.current = input;
    isTypingRef.current = input.length > 0;
    textInputFocusedRef.current = input.length > 0;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    if (input.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            textInputFocusedRef.current = false;
        }, 1000);
    }
    // ...
}, [input]);
```

**Issues:**
1. Refs don't help with useInput since they're not in the same scope
2. 1000ms timeout is too long for UX
3. No manual clear mechanism

#### Input Handler (Lines 872-956)
See detailed analysis above.

#### Render Structure (Lines 1029-1121)
```typescript
return (
    <CommandPaletteTrigger
        commands={augmentedCommands}
        initialOpen={false}
        openKeys={['/']}  // Add / as a trigger key
        onCommandSelected={(commandText) => {
            setInput(commandText);
        }}
    >
        <Box flexDirection="column" padding={0} width="100%" height="100%">
            {/* ASCII Banner */}
            {!compact && !isNarrowScreen && <FloydAsciiBanner />}

            {/* Status Bar */}
            {customHeader || <StatusBar ... />}

            {/* 3-Column Content */}
            <Box flexDirection="row" flexGrow={1} gap={...}>
                {showSessionPanel && <SessionPanel ... />}
                <TranscriptPanel ... />
                {showContextPanel && <ContextPanel ... />}
            </Box>

            {/* Input */}
            {customFooter || <InputArea ... />}
        </Box>
    </CommandPaletteTrigger>
);
```

**Analysis:**
- CommandPaletteTrigger wraps entire UI
- `/` key triggers palette (may conflict with paths)
- Panel visibility depends on terminal width
- No explicit terminal size minimum

---

## 6. STATE MANAGEMENT FLOW

### Zustand Store Structure
**File:** `src/store/floyd-store.ts`

```typescript
interface FloydStore {
    // Session
    initSession(id: string, name: string, root: string): void;

    // Messages
    messages: ConversationMessage[];
    addMessage(message: ConversationMessage): void;
    updateMessage(id: string, updates: Partial<ConversationMessage>): void;
    clearMessages(): void;

    // Streaming
    streamingContent: string;
    appendStreamingContent(content: string): void;
    clearStreamingContent(): void;

    // Status
    status: ThinkingStatus;
    setStatus(status: ThinkingStatus): void;

    // Safety
    safetyMode: 'yolo' | 'ask' | 'plan';
    setSafetyMode(mode: 'yolo' | 'ask' | 'plan'): void;
    toggleSafetyMode(): void;
}
```

### State Synchronization Issues

1. **Safety Mode Duplication:**
   - `app.tsx:131` - `const safetyMode = useFloydStore(state => state.safetyMode);`
   - `MainLayout.tsx:657` - `const [currentSafetyMode, setCurrentSafetyMode] = useState(...)`
   - Result: Can get out of sync

2. **Messages State:**
   - `app.tsx:119` - Reads from Zustand
   - `MainLayout.tsx:768-771` - Local state synchronized via useEffect
   - Result: Double caching, potential staleness

3. **Overlay State:**
   - `showHelp` in both app.tsx and MainLayout.tsx
   - No single source of truth
   - Result: Requires careful prop drilling

---

## 7. SUMMARY OF FINDINGS

### Confidence Score: 75/100

**What Was Confirmed:**
- Terminal size detection and breakpoints
- Height calculation methodology
- All `useInput` hook locations and handlers
- Hotkey conflicts and duplications
- State management structure

**What Needs Investigation:**
- Actual runtime behavior of useInput conflicts
- Real terminal size measurements
- Performance impact of 28+ useInput hooks
- Whether Frame borders cause overflow

**What Would Raise Confidence to 90+:**
1. Runtime smoke tests with terminal output
2. Measurement of actual Frame heights
3. Testing of hotkey conflicts in action
4. Profiling of useInput performance

---

*End of Implementation Inventory*
