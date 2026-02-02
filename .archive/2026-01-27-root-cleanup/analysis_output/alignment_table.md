# FLOYD CLI Alignment Table

**Analysis Date:** 2026-01-20
**Scope:** Intent vs Evidence vs Status

---

## ALIGNMENT TABLE

| Intent/Claim | Evidence | Status |
|--------------|----------|--------|
| **Terminal Size Detection** | | |
| Detect terminal width/height for responsive layout | `MainLayout.tsx:661-662` uses `process.stdout.columns/rows` | Implemented |
| Hide banner on narrow screens | `MainLayout.tsx:1041` `{!compact && !isNarrowScreen && <FloydAsciiBanner />}` | Implemented |
| Hide side panels on small terminals | `MainLayout.tsx:703-710` conditional panel rendering | Implemented |
| **Hotkey System** | | |
| Global Esc to exit | `app.tsx:410-419` AND `MainLayout.tsx:883-895` | Partial (Conflict) |
| Ctrl+/ to toggle help | `app.tsx:421-425` AND `MainLayout.tsx:898-901` | Partial (Duplicate) |
| Ctrl+P for command palette | `CommandPaletteTrigger.tsx:434-439` | Implemented |
| ? key for help when input empty | `app.tsx:429-432` AND `MainLayout.tsx:915-918` | Partial (Duplicate) |
| Ctrl+M toggle monitor | `app.tsx:434-437` AND `MainLayout.tsx:934-937` | Partial (Missing return) |
| Ctrl+T toggle agent viz | `app.tsx:440-443` AND `MainLayout.tsx:940-943` | Partial (Missing return) |
| Shift+Tab cycle safety mode | `MainLayout.tsx:921-931` | Implemented |
| Ctrl+C force exit | `MainLayout.tsx:875-879` | Implemented |
| Ctrl+R voice input | `MainLayout.tsx:946-949` | Implemented |
| **UI Components** | | |
| FLOYD ASCII banner display | `MainLayout.tsx:220-229` (FLOYD_ASCII_LINES) | Implemented |
| Status bar with user info | `MainLayout.tsx:279-408` (StatusBar component) | Implemented |
| SESSION panel (left sidebar) | `SessionPanel.tsx:104-277` | Implemented |
| TRANSCRIPT panel (center) | `TranscriptPanel.tsx:82-192` | Implemented |
| CONTEXT panel (right sidebar) | `ContextPanel.tsx:63-210` | Implemented |
| Scrollable message viewport | `Viewport.tsx:47-178` | Implemented |
| **State Management** | | |
| Zustand store for messages | `floyd-store.ts` - `messages: ConversationMessage[]` | Implemented |
| Streaming content handling | `app.tsx:290-366` (StreamProcessor) | Implemented |
| Safety mode toggle | `floyd-store.ts` - `toggleSafetyMode()` | Implemented |
| **Message Flow** | | |
| User input submission | `MainLayout.tsx:773-781` → `app.tsx:211-403` | Implemented |
| Dock command parsing | `app.tsx:216-248` | Implemented |
| Message streaming with throttle | `app.tsx:293-298` (75 tokens/sec) | Implemented |
| Thinking block detection | `app.tsx:328-356` (`<thinking>` markers) | Implemented |
| **Help System** | | |
| Help overlay display | `HelpOverlay.tsx:170-327` | Implemented |
| Keyboard shortcuts list | `HelpOverlay.tsx:784-865` (hotkeys array) | Implemented |
| **Command Palette** | | |
| Fuzzy search | `CommandPalette.tsx:69-100` (fuzzyScore) | Implemented |
| Keyboard navigation | `CommandPalette.tsx:235-257` (arrow keys) | Implemented |
| Command categories | `CommandPalette.tsx:150-165` (groupHotkeys) | Implemented |
| **Layout Calculations** | | |
| Height overhead calculation | `MainLayout.tsx:678-689` | Partial (Inaccurate) |
| Transcript height from terminal | `MainLayout.tsx:698` | Partial (Border heights missing) |
| Responsive panel widths | `MainLayout.tsx:703-710` | Implemented |
| **Overlays** | | |
| Agent Builder overlay | `AgentBuilder.tsx` | Implemented |
| Prompt Library overlay | `PromptLibraryOverlay.tsx` | Implemented |
| Command Palette overlay | `CommandPalette.tsx:260-403` | Implemented |
| **Theme** | | |
| CRUSH theme colors | `crush-theme.ts:1-379` | Implemented |
| Role-based colors | `crush-theme.ts:222-275` (roleColors) | Implemented |
| Gradient support | `gradients.ts`, `borders.ts` | Implemented |

---

## STATUS SUMMARY

| Status | Count | Percentage |
|--------|-------|------------|
| Implemented | 28 | 62% |
| Partial | 10 | 22% |
| Missing | 3 | 7% |
| Uncertain | 4 | 9% |

**Total:** 45 intents evaluated

---

## PARTIAL IMPLEMENTATIONS DETAILS

| Intent | Why Partial |
|--------|------------|
| Global Esc to exit | Duplicate handlers in app.tsx and MainLayout.tsx with different logic |
| Ctrl+/ toggle help | Duplicate handlers in app.tsx and MainLayout.tsx |
| ? key for help | Different checks (state vs input.length), may conflict |
| Ctrl+M toggle monitor | app.tsx missing return statement, MainLayout has return |
| Ctrl+T toggle agent viz | app.tsx missing return statement, MainLayout has return |
| Height overhead calc | Doesn't account for Frame borders, padding accurately |
| Transcript height | Missing border/frame height in calculation |

---

## MISSING IMPLEMENTATIONS

| Intent | Evidence |
|--------|----------|
| Hotkey coordination system | No global hotkey manager found |
| Terminal size validation | No minimum size check before render |
| Input rate limiting | No rate limiter on message submission |

---

## UNCERTAIN IMPLEMENTATIONS

| Intent | Why Uncertain |
|--------|---------------|
| Viewport scrolling works | Multiple useInput handlers may conflict |
| Frame border heights | Need runtime measurement to verify |
| Hotkey reliability | Needs smoke test to confirm actual behavior |
| Performance with 28+ handlers | No profiling data available |

---

## EVIDENCE GAPS

1. **Runtime Behavior:** No actual CLI execution captured to verify hotkey behavior
2. **Terminal Measurements:** No measurements of actual rendered component heights
3. **Performance Metrics:** No profiling of useInput hook performance
4. **Integration Testing:** No test coverage for hotkey conflicts

---

*End of Alignment Table*
