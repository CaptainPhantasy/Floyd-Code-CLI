# FLOYD TUI MOCKUP v2 - Overlay Architecture

**Version:** 2.0
**Updated:** 2026-01-29
**Purpose:** Claude Code-aligned TUI with overlay architecture

**Design Philosophy:** "Stability comes from what you DO NOT show on screen."

---

## VISUAL LAYOUT - MINIMAL DEFAULT (Primary)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FLOYD | YOLO | glm-4-plus | Online | T:ON | bg:2                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: Help me implement JWT authentication                                    │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: I'll help with JWT auth. Let me examine your setup...                │   │
│  │                                                                              │   │
│  │   [running...] grep -r "jwt" src/                                            │   │
│  │   [OK] Found 7 matches                                                       │   │
│  │                                                                              │   │
│  │   [OK] Read src/auth/jwt.ts (142 lines)                                      │   │
│  │                                                                              │   │
│  │ Based on your setup, here's what I recommend...                              │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ > [_] repla⟨Tab to accept⟩ce the old one                                         │
│     ~~~~~~~~~~~~~~~~ (ghost suggestion, dim color)                               │
│                      Ctrl+O:History  Ctrl+R:Search  Tab:Suggest  Ctrl+P:Cmd      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- **Compact Status Bar:** Single line, no ASCII art
- **Current Exchange Only:** Last user message + current response
- **No Full History:** Access via Ctrl+O overlay
- **T:ON/OFF:** Thinking mode toggle indicator (Tab to toggle)
- **bg:N:** Background task count

---

## OVERLAY 1: TRANSCRIPT (Ctrl+O)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FULL TRANSCRIPT                                                     [Esc: Close] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: Hello Floyd                                                            │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: Hello! How can I help?                                               │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: Help me implement JWT                                                  │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ * Floyd: Let me check your setup...                                           │   │
│  │   [OK] Read src/auth/jwt.ts (142 lines)                                       │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  PgUp/PgDn: Scroll  |  Ctrl+F: Search in transcript  |  Esc: Close               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## OVERLAY 2: HISTORY SEARCH (Ctrl+R)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Search History: jwt                                              [Esc: Close]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: Help me implement JWT auth                                     [1/3]   │   │
│  │   Preview: I'll help with JWT auth. Let me examine...                       │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ > You: A user auth system with JWT                                     [2/3]   │   │
│  │   Preview: Let me check your existing auth setup...                         │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ↑/↓: Navigate  |  Enter: Insert into input  |  Esc: Close                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## OVERLAY 3: BACKGROUND TASKS (Ctrl+B)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Background Tasks (2 running)                                           [Esc: Close]│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [⚙] npm install --save-dev @types/react                            Running   │   │
│  │    Started: 2m ago  |  ETA: ~1m                                           │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [⚙] npm run build                                                  Running   │   │
│  │    Started: 1m ago                                                        │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  ╭─────────────────────────────────────────────────────────────────────────────╮   │
│  │ [✓] git push origin feature/auth                                     Done      │   │
│  │    Completed: 30s ago  |  Exit: 0                                          │   │
│  ╰─────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                     │
│  Press Ctrl+B on running task to foreground                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## KEYBOARD SHORTCUTS (Updated)

| Shortcut | Action | Context |
|----------|--------|---------|
| **Claude Code Aligned** |
| `Ctrl+O` | Toggle transcript overlay | Always |
| `Ctrl+R` | History search (fuzzy) | Always |
| `Ctrl+B` | Background tasks overlay | Always |
| `Ctrl+G` | Edit in external editor ($EDITOR) | Input |
| `Tab` | (1) Accept suggestion OR (2) Toggle thinking | When suggestion exists / Always |
| `Ctrl+L` | Clear terminal | Always |
| `Alt+P` | Switch model while typing | Input |
| `Alt+T` | Toggle thinking (alternative) | Always |
| **FLOYD Original** |
| `Ctrl+Q` | Exit (double-press) | Always |
| `Ctrl+C` | Exit | Always |
| `Ctrl+P` | Command palette | Always |
| `Ctrl+/` or `?` | Help overlay | Always |
| `Shift+Tab` | Cycle mode (FLOYD 6-mode) | Always |
| `Ctrl+K` | Session switcher | Always |
| `Esc` | Close overlay / Exit | Context |
| `Ctrl+V` | Voice input (STT) | When available |

---

## TAB SUGGESTION - Next Message Prediction

**Concept:** Ghost text in input bar suggests the next query based on conversation context. Press Tab to accept.

**Visual:**
```
> [_] repla⟨Tab to accept⟩ce the old one
    ~~~~~~~~~~~~~~~~ (dim/ghost color)
```

**How it works:**
1. **Inference Engine** analyzes conversation history and Floyd's last response
2. **Suggestion appears** as ghost text in dim color after the cursor
3. **Tab key** accepts the suggestion (fills the input)
4. **Tab without suggestion** cycles through alternative suggestions
5. **Any typing** dismisses the suggestion immediately

**Suggestion Examples:**

| Floyd's Response | Suggestion Shows | User Intent |
|-----------------|------------------|-------------|
| "Here's my implementation..." | `Apply the changes` | Quick approval |
| "Should I use A or B?" | `Go with option A` | Decision |
| "Found 3 bugs. Fix them?" | `Yes, fix all 3` | Confirmation |
| "Which provider?" | `Use GLM-4-plus` | Configuration |
| "Done reading. What next?" | `What did you find?` | Follow-up |
| "Should I refactor this?" | `Show me the refactored version` | Request output |
| "All tests pass." | `Commit the changes` | Next action |
| "Need more info." | `Read the config file` | Suggest tool |
| "Ready to proceed?" | `Yes, continue` | Confirmation |
| "Or should I..." | `replace the old one` | Completion |

**Inference Logic:**

```typescript
// src/hooks/use-suggestion.ts

interface SuggestionEngine {
  // Context patterns that trigger suggestions
  patterns: {
    responseEnd: string[];      // "Any questions?", "Sound good?"
    actionRequest: string[];    // "Should I...?", "Want me to...?"
    completionOffer: string[];  // "Here's the code", "Done with..."
    choiceOffer: string[];      // "Option A or B?", "Which one?"
  }

  // Suggestion categories
  suggestions: {
    confirmation: string[];     // "Yes", "Please do", "Go ahead"
    action: string[];           // "Apply", "Commit", "Show me"
    continuation: string[];     // "What's next?", "Tell me more"
    alternative: string[];      // "Try option B", "Use X instead"
  }

  // Generate suggestion from context
  generate(lastMessage: string, history: Message[]): string | null;
}
```

**State Management:**

```typescript
// Add to tui-store.ts
interface TuiStore {
  // Suggestion state
  currentSuggestion: string | null;
  suggestionAlternatives: string[];
  suggestionIndex: number;
  setCurrentSuggestion: (suggestion: string) => void;
  acceptSuggestion: () => void;
  cycleSuggestion: () => void;
  dismissSuggestion: () => void;
}
```

**InputArea Component Update:**

```tsx
// src/components/InputArea.tsx

export function InputArea({ value, onChange, onSubmit }: InputAreaProps) {
  const currentSuggestion = useTuiStore(s => s.currentSuggestion);
  const acceptSuggestion = useTuiStore(s => s.acceptSuggestion);

  return (
    <Ink.Box borderStyle="single" paddingX={1}>
      <Ink.Text color={colors.prompt}>{'> '} </Ink.Text>

      {/* Actual input */}
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />

      {/* Ghost suggestion */}
      {currentSuggestion && (
        <Ink.Text dimColor bold>
          {currentSuggestion}
        </Ink.Text>
      )}

      {/* Tab hint */}
      {currentSuggestion && (
        <Ink.Text dimColor>
          {' '}⟨Tab to accept⟩
        </Ink.Text>
      )}
    </Ink.Box>
  );
}

// Handle Tab in keyboard routing
Ink.useInput((input, key) => {
  if (key.tab && !key.shift && currentSuggestion) {
    // Accept suggestion
    acceptSuggestion();
    return;
  }
});
```

---

## COMPONENT LIST

### Core Components (Phase 1A)
1. **CompactStatusBar.tsx** - Single-line status bar
2. **MinimalTranscript.tsx** - Current exchange only
3. **InputArea.tsx** - User input with Tab suggestion support
4. **OverlayManager.tsx** - Orchestrates overlay state
5. **SuggestionEngine.ts** - Next message inference logic

### Overlay Components (Phase 1A)
5. **TranscriptOverlay.tsx** (Ctrl+O) - Full history with scroll
6. **HistorySearchOverlay.tsx** (Ctrl+R) - Fuzzy search
7. **BackgroundTaskOverlay.tsx** (Ctrl+B) - Task management

### Additional Overlays (Phase 2)
8. **ExternalEditorOverlay.tsx** (Ctrl+G) - $EDITOR integration
9. **CommandPalette.tsx** (Ctrl+P) - Commands
10. **HelpOverlay.tsx** (Ctrl+/) - Keyboard shortcuts

---

## OVERLAY STATE MANAGEMENT

```typescript
// store/tui-store.ts

interface OverlayState {
  mode: 'none' | 'transcript' | 'history' | 'background' | 'editor' | 'help' | 'command';
}

interface TuiStore {
  // Overlay state
  overlayMode: OverlayState['mode'];
  setOverlayMode: (mode: OverlayState['mode']) => void;

  // Thinking toggle
  thinkingEnabled: boolean;
  toggleThinking: () => void;

  // Background tasks
  backgroundTasks: BackgroundTask[];
  addBackgroundTask: (task: BackgroundTask) => void;
  removeBackgroundTask: (taskId: string) => void;
  foregroundTask: (taskId: string) => void;

  // Tab suggestion
  currentSuggestion: string | null;
  suggestionAlternatives: string[];
  suggestionIndex: number;
  setCurrentSuggestion: (suggestion: string) => void;
  acceptSuggestion: () => void;
  cycleSuggestion: () => void;
  dismissSuggestion: () => void;
}
```

---

## MAIN APP LAYOUT (Updated)

```tsx
import * as Ink from 'ink';
import { render } from 'ink';
import { useTuiStore } from './store/tui-store.js';
import { CompactStatusBar } from './components/CompactStatusBar.js';
import { MinimalTranscript } from './components/MinimalTranscript.js';
import { InputArea } from './components/InputArea.js';
import { TranscriptOverlay } from './overlays/TranscriptOverlay.js';
import { HistorySearchOverlay } from './overlays/HistorySearchOverlay.js';
import { BackgroundTaskOverlay } from './overlays/BackgroundTaskOverlay.js';

export default function FloydTUI() {
  const overlayMode = useTuiStore(s => s.overlayMode);
  const thinkingEnabled = useTuiStore(s => s.thinkingEnabled);
  const backgroundTasks = useTuiStore(s => s.backgroundTasks);
  const mode = useTuiStore(s => s.mode);
  const model = useTuiStore(s => s.model);
  const connectionStatus = useTuiStore(s => s.connectionStatus);
  const currentExchange = useTuiStore(s => s.currentExchange);

  // Keyboard routing
  Ink.useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      useTuiStore.getState().setOverlayMode(
        overlayMode === 'transcript' ? 'none' : 'transcript'
      );
      return;
    }
    if (key.ctrl && input === 'r') {
      useTuiStore.getState().setOverlayMode('history');
      return;
    }
    if (key.ctrl && input === 'b') {
      useTuiStore.getState().setOverlayMode('background');
      return;
    }
    if (key.tab && !key.shift) {
      useTuiStore.getState().toggleThinking();
      return;
    }
    if (key.escape) {
      useTuiStore.getState().setOverlayMode('none');
    }
  });

  return (
    <Ink.Box flexDirection="column" height="100%">
      {/* Compact Status Bar - Always visible */}
      <CompactStatusBar
        mode={mode}
        model={model}
        connectionStatus={connectionStatus}
        thinkingEnabled={thinkingEnabled}
        backgroundTaskCount={backgroundTasks.length}
      />

      {/* Main Content - Context-dependent */}
      {overlayMode === 'none' && (
        <MinimalTranscript exchange={currentExchange} />
      )}

      {overlayMode === 'transcript' && (
        <TranscriptOverlay />
      )}

      {overlayMode === 'history' && (
        <HistorySearchOverlay />
      )}

      {overlayMode === 'background' && (
        <BackgroundTaskOverlay />
      )}

      {/* Input Area - Always visible */}
      <InputArea overlayMode={overlayMode} />
    </Ink.Box>
  );
}

render(<FloydTUI />);
```

---

## MODE COLORS (FLOYD 6-Mode)

| Mode | Color | Behavior |
|------|-------|----------|
| YOLO | Yellow #FFC107 | Auto-approve safe, confirm dangerous |
| ASK | Blue #2196F3 | Confirm all |
| PLAN | Green #4CAF50 | Read-only |
| AUTO | Purple #9C27B0 | Adaptive |
| DIALOGUE | Cyan #00BCD4 | One-line, no tools |
| FUCKIT | Red #F44336 | No confirmations |

---

## NAMESPACE IMPORT PATTERN (CRITICAL)

```tsx
// ✅ CORRECT - Use namespace imports for all Ink components
import * as Ink from 'ink';

<Ink.Box flexDirection="column">
  <Ink.Text>Hello</Ink.Text>
</Ink.Box>

// ❌ WRONG - Collides with DOM Text interface
import { Box, Text } from 'ink';
<Box><Text>Hello</Text></Box>
```

---

## DEPENDENCIES (LOCKED)

```json
{
  "dependencies": {
    "ink": "6.6.0",
    "@inkjs/ui": "2.0.0",
    "ink-text-input": "6.0.0",
    "react": "19.1.0",
    "zustand": "5.0.2"
  },
  "devDependencies": {
    "@types/react": "19.1.5",
    "typescript": "5.7.3"
  }
}
```

---

## TSCONFIG (ESNext + bundler)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react",
    "lib": ["ES2022", "DOM"]
  }
}
```

---

**End of TUI Mockup v2**

**Next:** Implement Phase 1A - Overlay Architecture
