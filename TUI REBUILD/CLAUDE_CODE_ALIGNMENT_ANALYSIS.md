# Claude Code vs FLOYD TUI - Alignment Analysis

**Date:** 2026-01-29T03:00:00-08:00
**Purpose:** Identify gaps between Claude Code UX and current FLOYD TUI plan
**Goal:** Achieve Claude Code-level UX quality with FLOYD's unique features

---

## EXECUTIVE SUMMARY

**Assessment:** PARTIALLY ALIGNED - Critical UX patterns missing

**Key Finding:** Claude Code's "stability comes from what they DO NOT show on screen" philosophy is **not fully adopted** in current TUI_MOCKUP.md. The spec is too "always-on" with visible panels rather than "triggered sub-screens" approach.

**Critical Gaps:**
1. Missing overlay-driven architecture (Ctrl+O, Ctrl+G patterns)
2. No external editor integration
3. No interactive history search
4. Missing background task management
5. No thinking toggle (Tab)
6. Limited session management

---

## COMPARATIVE FEATURE MATRIX

| Feature | Claude Code | FLOYD TUI (Current) | Gap | Priority |
|---------|-------------|---------------------|-----|----------|
| **Core UX Patterns** |
| Overlay-based UI | YES (triggered sub-screens) | Partial (some overlays) | **MEDIUM** | P0 |
| Minimal main interface | YES (only essentials) | NO (full panels visible) | **HIGH** | P0 |
| Ctrl+O Transcript overlay | YES (verbose mode) | NO (inline panel) | **HIGH** | P0 |
| Ctrl+G External editor | YES ($EDITOR) | NO | **HIGH** | P1 |
| Ctrl+R History search | YES (interactive fuzzy) | NO (basic) | **MEDIUM** | P1 |
| Ctrl+B Background tasks | YES (notifications) | NO | **HIGH** | P0 |
| Tab Thinking toggle | YES (on/off) | NO | **MEDIUM** | P1 |
| Session Management | YES (named, resume) | Basic (switcher) | **MEDIUM** | P1 |
| **Command System** |
| /context command | YES (context visualizer) | NO | **MEDIUM** | P1 |
| /stats command | YES (usage stats) | NO | **LOW** | P2 |
| /config command | YES (interactive settings) | NO | **MEDIUM** | P1 |
| /plugins command | YES (manage extensions) | NO | **MEDIUM** | P1 |
| /mcp command | YES (MCP servers) | NO | **MEDIUM** | P1 |
| **Subagent System** |
| Plan agent | YES (plan mode) | YES (plan mode) | NONE | - |
| Explore agent | YES | Planned | **LOW** | P2 |
| Task agents | YES | Planned | **LOW** | P2 |
| **Advanced Features** |
| Auto-compact long chats | YES | NO | **MEDIUM** | P1 |
| Memory system (#) | YES | NO | **LOW** | P2 |
| @-mention autocomplete | YES | NO | **MEDIUM** | P1 |
| Diff preview | YES | Planned | **LOW** | P2 |
| Git operations | YES (inline) | Planned | **LOW** | P2 |
| **Keyboard Shortcuts** |
| Ctrl+Q Exit | YES (double-press) | YES | NONE | - |
| Ctrl+C Exit | YES | YES | NONE | - |
| Ctrl+P Commands | YES | YES | NONE | - |
| Ctrl+/ Help | YES | YES | NONE | - |
| Esc Close overlay | YES (context-aware) | YES | NONE | - |
| Shift+Tab Mode | YES | YES | NONE | - |
| Ctrl+L Clear | YES | NO | **LOW** | P2 |
| Alt+P Switch model | YES | NO | **LOW** | P2 |
| **FLOYD Unique Features** |
| 6-mode system | NO | YES (YOLO/ASK/PLAN/AUTO/DIALOGUE/FUCKIT) | - | - |
| 50-tool suite | NO | YES | - | - |
| Provider-agnostic | NO | YES | - | - |
| Lean Core prompts | NO | YES | - | - |
| Permission dialogs | YES | YES (ASK mode) | NONE | - |

---

## CRITICAL UX PATTERN GAPS

### 1. Overlay Architecture vs Always-On Panels

**Claude Code Approach:**
- Main screen shows ONLY: prompt, current response, minimal status
- Everything else is BEHIND keyboard shortcuts (triggered sub-screens)
- Ctrl+O toggles verbose transcript mode (overlay)
- Ctrl+G opens external editor for current prompt (overlay)
- Ctrl+R shows history search (overlay)
- Ctrl+B shows background tasks (overlay)

**Current FLOYD TUI:**
- StatusBar, TranscriptPanel, InputArea ALWAYS visible
- No overlay-based transcript mode
- Full panels take up screen real estate constantly

**Impact:** MEDIUM-HIGH - The "always-on" approach crowds the interface

**Recommendation:**
```tsx
// ADD: OverlayManager component that handles:
// - Ctrl+O: Full-screen transcript overlay
// - Ctrl+G: External editor spawn
// - Ctrl+R: Interactive history search overlay
// - Ctrl+B: Background task notifications

// MODIFY: Main App Layout
// - Default: Minimal mode (only input + current response)
// - Ctrl+O: Toggle verbose transcript overlay
// - StatusBar: Compact (brand + mode only, hide details)
```

### 2. External Editor Integration (Ctrl+G)

**Claude Code:**
```
Ctrl+G → Opens $EDITOR (vim/nano/vscode) with current prompt
Save & exit → Prompt content updated in TUI
```

**Current FLOYD TUI:** Missing entirely

**Recommendation:**
```tsx
// ADD: ExternalEditorOverlay component
// - On Ctrl+G: Write current input to temp file
// - Spawn $EDITOR on temp file
// - On editor exit: Read file content back to input
// - Handle: Ctrl+C to cancel without changes
```

### 3. Interactive History Search (Ctrl+R)

**Claude Code:**
```
Ctrl+R → Opens fuzzy search through conversation history
Arrow keys navigate → Enter to select
Shows: preview of matched message
```

**Current FLOYD TUI:** Basic session switcher only

**Recommendation:**
```tsx
// ADD: HistorySearchOverlay component
// - Fuzzy search through message history
// - Arrow key navigation
// - Preview window for selected message
// - Enter to insert into current input
```

### 4. Background Task Management (Ctrl+B)

**Claude Code:**
```
Ctrl+B → Background current command
Notification: [Task running in background: npm install]
Task completion: [OK] Background task completed
```

**Current FLOYD TUI:** No background task support

**Recommendation:**
```tsx
// ADD: BackgroundTaskManager
// - Ctrl+B to background long-running tools
// - Task queue with status tracking
// - Non-blocking notifications
// - Task completion callbacks
```

### 5. Thinking Toggle (Tab)

**Claude Code:**
```
Tab → Toggle thinking mode on/off
Status: [Thinking: ON] or [Thinking: OFF]
```

**Current FLOYD TUI:** No toggle

**Recommendation:**
```tsx
// ADD: ThinkingModeToggle
// - Tab key toggles thinking mode
// - Store in tui-store: thinkingEnabled: boolean
// - Visual indicator in StatusBar
```

---

## KEYBOARD SHORTCUT COMPARISON

### Claude Code Shortcuts (from CHANGELOG.md)

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Toggle transcript mode (verbose overlay) |
| `Ctrl+G` | Edit prompt in external editor ($EDITOR) |
| `Ctrl+R` | Interactive history search |
| `Ctrl+B` | Background running tasks |
| `Ctrl+L` | Clear terminal |
| `Tab` | Toggle thinking mode |
| `Shift+Tab` | Toggle auto-accept edits |
| `Esc` | Interrupt generation / Close overlay |
| `Alt+P` | Switch model while typing |
| `Alt+T` | Toggle thinking mode (alternative) |
| `Ctrl+Q` | Exit |
| `Ctrl+C` | Exit |
| `Ctrl+P` | Command palette |
| `?` | Help overlay |
| `Ctrl+K` | Session switcher |

### Current FLOYD TUI Shortcuts

| Shortcut | Action | Match? |
|----------|--------|--------|
| `Ctrl+Q` | Exit (double-press) | YES |
| `Ctrl+C` | Exit | YES |
| `Ctrl+P` | Command Palette | YES |
| `Ctrl+/` | Help Overlay | YES (different from ?) |
| `Shift+Tab` | Cycle Mode | NO (Claude: auto-accept edits) |
| `Ctrl+M` | Monitor Dashboard | NO (FLOYD-specific) |
| `Ctrl+T` | Toggle Agent Viz | NO (FLOYD-specific) |
| `Ctrl+R` | Voice Input (STT) | NO (Claude: history search) |
| `Ctrl+K` | Session Switcher | YES |
| `Ctrl+Shift+P` | Prompt Library | NO (FLOYD-specific) |
| `Ctrl+Z` | Zen Mode | NO (FLOYD-specific) |
| `?` | Help (when input empty) | YES |
| `Esc` | Close overlay / Exit | YES |
| `1,2,3,4` | Quick Actions | NO (FLOYD-specific) |

**CONFLICTS TO RESOLVE:**
- `Ctrl+R`: FLOYD uses for Voice Input, Claude uses for History Search
  - **Recommendation:** Claude's pattern is more fundamental. Move Voice Input to `Ctrl+V` or `Ctrl+Shift+R`
- `Shift+Tab`: FLOYD uses for Mode cycling, Claude uses for auto-accept edits
  - **Recommendation:** Keep FLOYD's mode cycling (unique feature), add `Ctrl+Enter` for auto-accept

---

## MISSING CLAUDE CODE FEATURES

### Priority 0 (Critical for UX Parity)

1. **Ctrl+O: Transcript Mode Overlay**
   - Full-screen overlay showing full conversation history
   - Toggles with Ctrl+O
   - Scrollable, searchable
   - **Why P0:** Core to Claude Code's "minimal main screen" philosophy

2. **Ctrl+B: Background Tasks**
   - Non-blocking tool execution
   - Status notifications
   - Task completion callbacks
   - **Why P0:** Essential for long-running operations (npm install, etc.)

### Priority 1 (Important for UX Quality)

3. **Ctrl+G: External Editor**
   - Edit current prompt in $EDITOR
   - Complex prompt editing
   - **Why P1:** Power user feature for complex prompts

4. **Ctrl+R: Interactive History Search**
   - Fuzzy search through conversation
   - Re-use previous prompts
   - **Why P1:** Productivity booster

5. **Tab: Thinking Toggle**
   - Enable/disable extended reasoning
   - Cost/speed control
   - **Why P1:** User control over behavior

6. **/context: Context Visualizer**
   - Show token usage
   - Context window status
   - **Why P1:** Transparency for users

7. **/config: Interactive Settings**
   - Change settings without editing files
   - **Why P1:** Usability

8. **Session Management (Named Sessions)**
   - Save/resume named conversations
   - **Why P1:** Workflow organization

9. **Auto-compact Long Conversations**
   - Summarize old messages
   - **Why P1:** Performance for long sessions

10. **@-mention Autocomplete**
    - File/folder completion
    - **Why P1:** Efficiency

### Priority 2 (Nice to Have)

11. **/stats: Usage Statistics**
12. **/plugins: Plugin Management**
13. **/mcp: MCP Server Management**
14. **Memory System (#)**
15. **Ctrl+L: Clear Terminal**

---

## ALIGNMENT RECOMMENDATIONS

### Phase 1A: Core Overlay Architecture (P0)

**Changes to TUI_MOCKUP.md:**

1. **Redesign Main Layout as Minimal Default**
   ```
   DEFAULT MODE (Minimal):
   ┌─────────────────────────────────────────┐
   │ FLOYD | YOLO | glm-4-plus | Online       │ <- Compact StatusBar
   ├─────────────────────────────────────────┤
   │                                         │
   │  > [Current response only]              │ <- No full history
   │                                         │
   │  * Floyd: [streaming response...]      │
   │                                         │
   ├─────────────────────────────────────────┤
   │ > [input]                    Ctrl+O:View │ <- Hint for Ctrl+O
   └─────────────────────────────────────────┘

   CTRL+O MODE (Verbose Overlay):
   ┌─────────────────────────────────────────┐
   │  TRANSCRIPT                             │
   │  ┌─────────────────────────────────┐   │
   │  │ [Full conversation history]     │   │
   │  │ > You: Hello                    │   │
   │  │ * Floyd: Hi there!              │   │
   │  │ > You: Help me auth             │   │
   │  │ * Floyd: Sure...                │   │
   │  │                                 │   │
   │  └─────────────────────────────────┘   │
   │                                         │
   │  [Esc: Close, PgUp/PgDn: Scroll]        │
   └─────────────────────────────────────────┘
   ```

2. **Add OverlayManager Component**
   - Manages overlay state (none, transcript, history, editor)
   - Keyboard routing based on active overlay
   - Esc = context-aware close

3. **Implement Ctrl+O Toggle**
   - Toggles between minimal and verbose modes
   - State: `overlayMode: 'none' | 'transcript' | 'history' | 'editor' | 'background'`

### Phase 1B: Background Tasks (P0)

4. **Add BackgroundTaskManager**
   - Ctrl+B backgrounds current tool execution
   - Notification system for task events
   - Task queue with status tracking

### Phase 2: Productivity Features (P1)

5. **Implement Ctrl+G External Editor**
6. **Implement Ctrl+R History Search**
7. **Implement Tab Thinking Toggle**
8. **Add /context, /config commands**
9. **Enhanced Session Management**

### Phase 3: Advanced Features (P2)

10. **Auto-compact conversations**
11. **@-mention autocomplete**
12. **/stats, /plugins, /mcp commands**
13. **Memory system**

---

## MODIFIED KEYBOARD SHORTCUTS (Aligned)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+Q` | Exit (double-press) | Same as Claude Code |
| `Ctrl+C` | Exit | Same as Claude Code |
| `Ctrl+O` | Toggle transcript overlay | **NEW** - Claude Code pattern |
| `Ctrl+G` | Edit in external editor | **NEW** - Claude Code pattern |
| `Ctrl+R` | Interactive history search | **CHANGED** - Was: Voice Input |
| `Ctrl+B` | Background task management | **NEW** - Claude Code pattern |
| `Ctrl+L` | Clear terminal | **NEW** - Claude Code pattern |
| `Tab` | Toggle thinking mode | **NEW** - Claude Code pattern |
| `Ctrl+P` | Command palette | Same |
| `Ctrl+/` or `?` | Help overlay | Same |
| `Shift+Tab` | Cycle mode | **FLOYD-specific** (keep) |
| `Esc` | Close overlay / Exit | Same (context-aware) |
| `Ctrl+K` | Session switcher | Same |
| `Ctrl+M` | Monitor dashboard | **FLOYD-specific** |
| `Ctrl+T` | Toggle agent viz | **FLOYD-specific** |
| `Ctrl+V` | Voice input (STT) | **MOVED** - Was Ctrl+R |
| `Ctrl+Shift+P` | Prompt library | **FLOYD-specific** |
| `Ctrl+Z` | Zen mode | **FLOYD-specific** |
| `1,2,3,4` | Quick actions | **FLOYD-specific** |
| `Alt+P` | Switch model | **NEW** - Claude Code pattern |
| `Alt+T` | Toggle thinking (alt) | **NEW** - Claude Code pattern |

---

## ARCHITECTURAL CHANGES NEEDED

### 1. Overlay State Management

```typescript
// ADD to tui-store.ts:
interface TuiStore {
  // Overlay state
  overlayMode: 'none' | 'transcript' | 'history' | 'editor' | 'background' | 'help' | 'config';
  setOverlayMode: (mode) => void;

  // Thinking toggle
  thinkingEnabled: boolean;
  toggleThinking: () => void;

  // Background tasks
  backgroundTasks: BackgroundTask[];
  addBackgroundTask: (task) => void;
}
```

### 2. New Components (Priority Order)

**P0 (Phase 1A/1B):**
1. `OverlayManager.tsx` - Orchestrates overlay state
2. `TranscriptOverlay.tsx` - Full-screen conversation history (Ctrl+O)
3. `BackgroundTaskOverlay.tsx` - Task management (Ctrl+B)
4. `BackgroundTaskManager.ts` - Task queue logic

**P1 (Phase 2):**
5. `HistorySearchOverlay.tsx` - Interactive history search (Ctrl+R)
6. `ExternalEditorOverlay.tsx` - Editor integration (Ctrl+G)
7. `ThinkingToggle.tsx` - Tab toggle component
8. `ContextVisualizer.tsx` - /context command
9. `ConfigEditor.tsx` - /config command

**P2 (Phase 3):**
10. `AutoCompactor.ts` - Conversation summarization
11. `FileAutocomplete.tsx` - @-mention completion
12. `StatsView.tsx` - /stats command
13. `PluginManager.tsx` - /plugins command
14. `McpManager.tsx` - /mcp command
15. `MemoryManager.tsx` - Memory system

---

## UPDATED COMPONENT LIST

### Current (TUI_MOCKUP.md):
- StatusBar.tsx
- TranscriptPanel.tsx
- InputArea.tsx
- QuickActions.tsx
- CommandPalette.tsx
- PermissionDialog.tsx
- HelpOverlay.tsx
- ProviderConfig.tsx

### ADD (Phase 1A/1B):
- OverlayManager.tsx (**NEW P0**)
- TranscriptOverlay.tsx (**NEW P0**)
- BackgroundTaskOverlay.tsx (**NEW P0**)
- BackgroundTaskManager.ts (**NEW P0**)

### MODIFY:
- App.tsx → Support overlay architecture
- StatusBar.tsx → Compact mode
- TranscriptPanel.tsx → Render inside overlay, not always-on

### ADD (Phase 2):
- HistorySearchOverlay.tsx (**NEW P1**)
- ExternalEditorOverlay.tsx (**NEW P1**)
- ThinkingToggle.tsx (**NEW P1**)
- ContextVisualizer.tsx (**NEW P1**)
- ConfigEditor.tsx (**NEW P1**)
- SessionManager.tsx (ENHANCE P1)

### ADD (Phase 3):
- AutoCompactor.ts (**NEW P2**)
- FileAutocomplete.tsx (**NEW P2**)
- StatsView.tsx (**NEW P2**)
- PluginManager.tsx (**NEW P2**)
- McpManager.tsx (**NEW P2**)
- MemoryManager.tsx (**NEW P2**)

---

## PHASE RECOMMENDATION

### Plan A: Full Claude Code Parity (Recommended)

**Approach:** Implement P0 and P1 features before declaring "ready"

**Timeline:**
- Phase 1A: Overlay Architecture (P0) - 2 days
- Phase 1B: Background Tasks (P0) - 1 day
- Phase 2: Productivity Features (P1) - 3 days
- Phase 3: Polish & Testing - 2 days

**Total:** ~8 days additional to current plan

**Benefits:**
- True Claude Code UX parity
- "What they DO NOT show on screen" philosophy
- Power user features from day one

### Plan B: Minimal V1 with Add-ons

**Approach:** Ship minimal version, add features later

**Phase 1 (V1):** Current TUI_MOCKUP.md + Ctrl+O overlay only
**Phase 2 (V1.1):** Add background tasks, history search
**Phase 3 (V1.2):** Add editor integration, thinking toggle

**Risks:**
- May not achieve "Claude Code UX quality" goal
- Redesign required for overlay architecture later

**Benefits:**
- Faster to initial release
- Learn from user feedback

---

## FINAL VERDICT

**Current State:** PARTIALLY ALIGNED

**Critical Issue:** The "always-on" panel architecture contradicts Claude Code's "triggered sub-screen" philosophy. This is the primary misalignment.

**To Achieve Claude Code UX Quality:**

1. **MUST DO (P0):**
   - Implement overlay architecture (Ctrl+O for transcript)
   - Add background task support (Ctrl+B)
   - Redesign main layout as minimal default

2. **SHOULD DO (P1):**
   - External editor integration (Ctrl+G)
   - Interactive history search (Ctrl+R)
   - Thinking toggle (Tab)
   - /context, /config commands

3. **NICE TO HAVE (P2):**
   - Auto-compact, @-mentions, /stats, plugins

**Recommendation:** Proceed with **Plan A (Full Parity)** for genuine Claude Code UX quality. The overlay architecture is fundamental and should be built from the start, not retrofitted.

---

**Next Steps:**
1. Update TUI_MOCKUP.md with overlay architecture
2. Redesign main layout as minimal default
3. Add OverlayManager, TranscriptOverlay, BackgroundTaskOverlay to spec
4. Update keyboard shortcuts table
5. Revise phase plan to include P0/P1 features

**Document Status:** READY FOR IMPLEMENTATION PLANNING
