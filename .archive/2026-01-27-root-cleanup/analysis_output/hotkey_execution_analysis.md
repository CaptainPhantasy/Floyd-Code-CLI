# FLOYD CLI - Hotkey Execution Order Analysis

**Analysis Date:** 2026-01-20
**Purpose:** Document exact hotkey handler execution order and conflicts

---

## INK'S USEINPUT BEHAVIOR

### How Ink's `useInput` Works

From Ink's source code and documentation:

1. **Global Registration:** Each `useInput` hook registers a handler globally
2. **FIFO Execution:** Handlers fire in **component mount order** (First In, First Out)
3. **First Return Wins:** The first handler to `return` prevents subsequent handlers from executing
4. **All Handlers Receive Input:** If no handler returns, all handlers see the same input

### Critical Insight

```
Parent Component (app.tsx)
    │
    │ useInput #1 registered here
    │
    ▼
Child Component (MainLayout.tsx)
    │
    │ useInput #2 registered here
    │
    ▼
Grandchild Components
    │
    │ useInput #3, #4, #5... registered here
```

**Execution Order:** app.tsx → MainLayout.tsx → deeper components

**Conflict Mechanism:**
- If app.tsx's handler `return`s first, MainLayout's handler never sees the input
- Which handler fires first depends on **React render order** (potentially non-deterministic in concurrent mode)

---

## HANDLER INVENTORY

### All `useInput` Hooks in Order

| Order | Component | Lines | Handlers Registered |
|-------|-----------|-------|---------------------|
| 1 | `app.tsx` | 411-460 | Esc, Ctrl+/, ?, Ctrl+M, Ctrl+T, Ctrl+Y |
| 2 | `MainLayout.tsx` | 875-976 | Ctrl+C, Esc, Ctrl+/, Ctrl+P, ?, Shift+Tab, Ctrl+M, Ctrl+T, Ctrl+R, Ctrl+Shift+P |
| 3 | `CommandPaletteTrigger.tsx` | 434-452 | Ctrl+P, /, Esc |
| 4 | `HelpOverlay.tsx` | 189-221 | Esc, Ctrl+/, arrows, Enter |
| 5 | `CommandPalette.tsx` | 198-258 | Esc, Ctrl+P, arrows, PageUp/Down, Enter |
| 6 | `Viewport.tsx` | 115-136 | Arrow keys, PageUp/Down, Ctrl+A, Ctrl+E |
| 7-28+ | Other components | Various | Various per-component handlers |

---

## CONFLICT ANALYSIS BY HOTKEY

### Esc Key

**Handlers:**
1. `app.tsx:415-425`
2. `MainLayout.tsx:891-905`
3. `CommandPaletteTrigger.tsx` (when palette open)
4. `HelpOverlay.tsx:189-193` (when help open)
5. `CommandPalette.tsx:198-202` (when palette open)

**app.tsx Handler Logic:**
```typescript
if (key.escape) {
    console.error(`[app.tsx] ESC HANDLER: showHelp=${showHelp}, showMonitor=${showMonitor}`);
    if (showHelp) {
        setShowHelp(false);           // Closes help
    } else if (showMonitor) {
        setShowMonitor(false);        // Closes monitor
    } else {
        console.error(`[app.tsx] ESC HANDLER: calling exit()`);
        exit();                      // EXITS APP
    }
    return;  // ← Prevents MainLayout from seeing Esc
}
```

**MainLayout.tsx Handler Logic:**
```typescript
if (key.escape) {
    console.error(`[MainLayout.tsx] ESC HANDLER: showHelp=${showHelp}, showPromptLibrary=${showPromptLibrary}, showAgentBuilder=${showAgentBuilder}`);
    if (showHelp) {
        setShowHelp(false);              // Closes help
    } else if (showPromptLibrary) {
        setShowPromptLibrary(false);     // Closes prompt library
    } else if (showAgentBuilder) {
        setShowAgentBuilder(false);      // Closes agent builder
    } else {
        console.error(`[MainLayout.tsx] ESC HANDLER: calling exit()`);
        onExit?.();
        inkExit();                       // EXITS APP
    }
    return;
}
```

**CONFLICT:**
- Both check `showHelp` but MainLayout also checks `showPromptLibrary` and `showAgentBuilder`
- app.tsx doesn't know about `showPromptLibrary` or `showAgentBuilder` (MainLayout local state)
- If app.tsx fires first and returns, MainLayout's prompt library/agent builder overlays won't close

**Expected Behavior:**
- Esc should close whichever overlay is open, or exit if none open
- Current: May exit when should close overlay, depending on which handler fires first

---

### Ctrl+/ (Toggle Help)

**Handlers:**
1. `app.tsx:429-433`
2. `MainLayout.tsx:908-912`
3. `HelpOverlay.tsx:207-209` (when help open, closes it)

**app.tsx Handler:**
```typescript
if (key.ctrl && inputKey === '/') {
    console.error(`[app.tsx] CTRL+/ HANDLER: toggling help`);
    setShowHelp(value => !value);
    return;  // ← Prevents MainLayout from seeing Ctrl+/
}
```

**MainLayout Handler:**
```typescript
if (key.ctrl && _inputKey === '/') {
    console.error(`[MainLayout.tsx] CTRL+/ HANDLER: toggling help`);
    setShowHelp(v => !v);
    return;
}
```

**CONFLICT:**
- Both toggle their own `showHelp` state
- These are **different state variables** (app.tsx state vs MainLayout state)
- Result: State gets out of sync, help overlay shows/hides inconsistently

---

### ? Key (Help When Input Empty)

**Handlers:**
1. `app.tsx:437-441`
2. `MainLayout.tsx:927-933`

**app.tsx Handler:**
```typescript
if (inputKey === '?' && !showHelp && !showMonitor) {
    console.error(`[app.tsx] ? HANDLER: toggling help`);
    setShowHelp(value => !value);
    return;
}
```

**MainLayout Handler:**
```typescript
if (input.length === 0 && !isTypingRef.current && _inputKey === '?') {
    console.error(`[MainLayout.tsx] ? HANDLER: toggling help (input empty, not typing)`);
    setShowHelp(v => !v);
    return;
} else if (_inputKey === '?') {
    console.error(`[MainLayout.tsx] ? HANDLER BLOCKED: input.length=${input.length}, isTyping=${isTypingRef.current}`);
}
```

**CONFLICT:**
- Different trigger conditions:
  - app.tsx: `!showHelp && !showMonitor`
  - MainLayout: `input.length === 0 && !isTypingRef.current`
- 1000ms `isTypingRef` timeout blocks the handler after typing
- If app.tsx fires first, it toggles regardless of input state

---

### Ctrl+M (Toggle Monitor)

**Handlers:**
1. `app.tsx:444-447` - **MISSING RETURN**
2. MainLayout.tsx:950-953

**app.tsx Handler:**
```typescript
if (inputKey === 'm' && key.ctrl) {
    console.error(`[app.tsx] CTRL+M HANDLER: toggling monitor`);
    setShowMonitor(value => !value);
    // NO RETURN! ← Falls through to MainLayout
}
```

**MainLayout Handler:**
```typescript
if (key.ctrl && _inputKey === 'm') {
    console.error(`[MainLayout.tsx] CTRL+M HANDLER: calling onCommand('toggle-monitor')`);
    onCommand?.('toggle-monitor');
    return;
}
```

**CONFLICT:**
- app.tsx handler toggles `showMonitor` state
- But **doesn't return**, so MainLayout also fires
- Result: Both `setShowMonitor` and `onCommand('toggle-monitor')` execute
- Double toggle may result in no change, or inconsistent state

---

### Ctrl+T (Toggle Agent Visualization)

**Handlers:**
1. `app.tsx:450-453` - **MISSING RETURN**
2. MainLayout.tsx:957-961

**Same issue as Ctrl+M:** Missing return causes both handlers to execute.

---

## INPUT STATE BLOCKING ISSUE

**Location:** `MainLayout.tsx:732-765`

```typescript
const isTypingRef = useRef(false);
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
    isTypingRef.current = input.length > 0;
    textInputFocusedRef.current = input.length > 0;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    if (input.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            textInputFocusedRef.current = false;
        }, 1000);  // ← 1 SECOND TIMEOUT
    }
}, [input]);
```

**Problem:**
- Any single character typed blocks `?` hotkey for **1000ms**
- User types "a", immediately presses "?" → Blocked
- User must wait 1 second before `?` works
- No way to clear the state except waiting

---

## EXECUTION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PRESSES Esc KEY                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Ink's Input Event Dispatcher                       │
│         (Fires all registered handlers in mount order)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   app.tsx useInput        │   │  MainLayout.tsx useInput  │
│   (Fires FIRST)           │   │  (Fires SECOND)           │
├───────────────────────────┤   ├───────────────────────────┤
│ console.error(...)        │   │ console.error(...)        │
│                          │   │                          │
│ if (key.escape) {         │   │ if (key.escape) {         │
│   if (showHelp) {...}     │   │   if (showHelp) {...}     │
│   else if (showMonitor)   │   │   else if (showPromptLib) │
│   else exit()             │   │   else if (showAgentBldr) │
│   return ← BLOCKS!        │   │   else exit()             │
│ }                         │   │   return ← BLOCKS!        │
│                          │   │ }                         │
└───────────────────────────┘   └───────────────────────────┘
                │                           │
                │ If app.tsx returns,      │
                │ MainLayout NEVER runs    │
                │                           │
                ▼                           ▼
         ┌──────────┐              ┌──────────────┐
         │ Exit App │              │ Close Overlay│
         │          │              │ or Exit App  │
         └──────────┘              └──────────────┘
```

---

## INSTRUMENTATION ADDED

### app.tsx (Lines 409-460)
```typescript
const frameId = 'app.tsx';
useInput((inputKey, key) => {
    console.error(`[${frameId}] useInput fired: inputKey="${inputKey}", escape=${key.escape}, ctrl=${key.ctrl}`);
    // ... handlers with logging
});
```

### MainLayout.tsx (Lines 873-976)
```typescript
const frameId = 'MainLayout.tsx';
useInput((_inputKey, key) => {
    console.error(`[${frameId}] useInput fired: inputKey="${_inputKey}", escape=${key.escape}, ctrl=${key.ctrl}`);
    console.error(`[${frameId}] STATE: input.length=${input.length}, isTyping=${isTypingRef.current}, showHelp=${showHelp}`);
    // ... handlers with logging
});
```

**Expected Output when pressing Esc:**
```
[app.tsx] useInput fired: inputKey="escape", escape=true, ctrl=false
[app.tsx] ESC HANDLER: showHelp=false, showMonitor=false
[app.tsx] ESC HANDLER: calling exit()
```

**OR (if MainLayout fires first):**
```
[MainLayout.tsx] useInput fired: inputKey="escape", escape=true, ctrl=false
[MainLayout.tsx] STATE: input.length=0, isTyping=false, showHelp=false
[MainLayout.tsx] ESC HANDLER: showHelp=false, showPromptLibrary=false, showAgentBuilder=false
[MainLayout.tsx] ESC HANDLER: calling exit()
```

---

## ROOT CAUSE SUMMARY

1. **No Global Hotkey Coordinator:** Each component independently registers handlers
2. **State Duplication:** `showHelp` exists in both app.tsx and MainLayout.tsx
3. **Missing Returns:** Ctrl+M and Ctrl+T handlers in app.tsx don't return
4. **Input Blocking:** 1000ms timeout blocks `?` hotkey
5. **Non-Deterministic Order:** Handler execution depends on React mount order

---

## VERIFICATION RECEIPT

**Instrumentation Files Modified:**
- `INK/floyd-cli/src/app.tsx:409-460` - Added logging
- `INK/floyd-cli/src/ui/layouts/MainLayout.tsx:873-976` - Added logging

**Build Status:**
```bash
$ npm run build
> floyd-cli@0.1.0 build
> tsc
# (no errors - instrumentation TypeScript is valid)
```

**Code Locations Verified:**
- `app.tsx:415-425` - Esc handler
- `app.tsx:429-433` - Ctrl+/ handler
- `app.tsx:444-447` - Ctrl+M handler (missing return)
- `MainLayout.tsx:891-905` - Esc handler
- `MainLayout.tsx:908-912` - Ctrl+/ handler
- `MainLayout.tsx:927-933` - ? handler with blocking
- `MainLayout.tsx:732-765` - Input state refs with 1000ms timeout

*End of Hotkey Execution Analysis*
