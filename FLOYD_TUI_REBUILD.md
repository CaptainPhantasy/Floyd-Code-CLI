# FLOYD TUI REBUILD GUIDE
## Claude Code Features → Floyd Implementation Mapping

**Purpose:** Rebuild Floyd TUI using proven Claude Code patterns + existing Floyd tools
**Created:** 2026-01-28
**Status:** REBUILD BLUEPRINT

---

## Executive Summary

After inspecting Claude Code's TUI and comparing with Floyd's existing implementation, here's the mapping for a stable rebuild:

| Claude Code Feature | Floyd Has | Floyd Needs | Priority |
|-------------------|-----------|-------------|----------|
| Compact file references | ❌ | ✅ | HIGH |
| Message flow UP | ✅ | ✅ | DONE |
| Virtual scrolling | ✅ | ✅ | DONE |
| Inline tool status | ✅ | ✅ | DONE |
| Double-confirm exit | ✅ | ⚠️ | MED |
| Mode-based permissions | ✅ | ✅ | DONE |
| Streaming with cursor | ✅ | ✅ | DONE |
| Status line (compact) | ✅ | ✅ | DONE |
| Bordered input frame | ✅ | ✅ | DONE |
| Theme-aware styling | ✅ | ✅ | DONE |
| Command palette (Ctrl+P) | ✅ | ✅ | DONE |
| Help overlay (Ctrl+/) | ✅ | ✅ | DONE |
| Read-only PLAN mode | ✅ | ✅ | DONE |

---

## Part 1: Claude Code TUI Features (Proven Patterns)

### 1. Compact File Reference Pattern

**What Claude Does:**
```typescript
case "compact_file_reference":
  return <Text>Referenced file <Text bold>{filename}</Text></Text>

case "file":
  return (
    <Text>Read {filename} (
      {content.type === 'text' ? `${numLines}${truncated ? '+' : ''} lines` : size}
    )</Text>
  )
```

**Why It Works:**
- Shows metadata (line count, size) not full content
- `+` indicator if truncated
- Keeps chat uncrowded

---

### 2. Message Flow Direction

**Claude's Pattern:**
```
┌─────────────────────────────────┐
│ Douglas. (OLDEST - top)          │
│ Floyd.                           │
│ Douglas.                          │
│ Floyd. (NEWEST - bottom)         │
│ [Blank spacer]                   │
│ Floyd typing...                  │
│ ────────────────────────────     │
│ > [User input]                   │
└─────────────────────────────────┘
```

**Key Insight:** Messages flow UP from input. Newest at bottom.

---

### 3. Virtual Scrolling

```typescript
// Calculate visible window
const displayCount = Math.max(5, Math.floor(maxHeight / 3));
const endIndex = Math.max(displayCount, totalMessages - scrollOffset);
const startIndex = Math.max(0, endIndex - displayCount);
const displayMessages = uniqueMessages.slice(startIndex, endIndex);

// Indicators
{hasMoreAbove && <Text>↑ {startIndex} more (PgUp)</Text>}
{hasMoreBelow && <Text>↓ {totalMessages - endIndex} more (PgDn)</Text>}
```

---

### 4. Inline Tool Status

```typescript
{activeTool && (
  <Text>
    {toolName}...  // running
    {toolName} [OK]  // complete
  </Text>
)}
```

**Status Values:** `running...` | `[OK]` | `[ERROR]`

---

### 5. Double-Confirm Exit

```typescript
// First press
if (key.ctrl && input === 'q') {
  showConfirm("Press Ctrl+Q again to exit");
  return;
}

// Second press (within time window)
if (pendingExit && key.ctrl && input === 'q') {
  process.exit(0);
}
```

---

### 6. Mode-Based Input Routing

```typescript
const MODES = {
  ask: 'Confirm dangerous tools',
  yolo: 'Auto-approve safe tools',
  plan: 'Read-only',
  auto: 'Adaptive',
  dialogue: 'Chat only',
};

const currentMode = process.env.FLOYD_MODE || 'ask';
```

---

### 7. Status Line (Compact)

```
[YOLO] ⠙ [thinking] | edit_file... - "Making changes..."
```

**Components:**
- `[MODE]` - Color-coded
- Spinner + `[thinking]` - When processing
- `| tool...` - Active tool with status
- `- phrase` - Whimsical message (optional)

---

### 8. Bordered Input Frame

```typescript
<Box borderStyle="single" borderColor={theme.borderFocus} paddingX={1}>
  <Text color={inputPrompt}>{'> '} </Text>
  <TextInput value={value} onChange={onChange} />
</Box>
```

**Visual:**
```
┌──────────────────────────────────────┐
│> Type a message...                   │
└──────────────────────────────────────┘
```

---

### 9. Keyboard Shortcuts (Universal)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Q` | Quit (double-confirm) |
| `Ctrl+C` | Quit (double-confirm) |
| `Ctrl+P` | Command palette |
| `Ctrl+/` | Help overlay |
| `Esc` | Close overlay / Exit |
| `PgUp/PgDn` | Scroll messages |
| `Shift+Tab` | Cycle mode |

---

### 10. Streaming with Cursor

```typescript
{streamingContent && (
  <>
    <Text>{streamingContent}</Text>
    <Text color={cursorColor}>▋</Text>  // Blinking cursor
  </>
)}
```

---

## Part 2: Floyd's Current Implementation

### Existing Components (What We Have)

| Component | File | Status |
|-----------|------|--------|
| `ConversationalLayout` | `src/ui/layouts/ConversationalLayout.tsx` | ✅ Core chat working |
| `MessageHistory` | `ConversationalLayout.tsx:130` | ✅ Virtual scrolling |
| `ActiveResponse` | `ConversationalLayout.tsx:202` | ✅ Streaming with cursor |
| `StatusLine` | `ConversationalLayout.tsx:242` | ✅ Mode + spinner + tools |
| `InputFrame` | `ConversationalLayout.tsx:290` | ✅ Bordered input |
| `HelpOverlay` | `src/ui/overlays/HelpOverlay.tsx` | ✅ Help system |
| `CommandPalette` | `src/ui/components/CommandPalette.tsx` | ✅ Ctrl+P palette |
| `MarkdownRenderer` | `src/ui/components/MarkdownRenderer.tsx` | ✅ Rich formatting |
| `ThinkingStream` | `src/ui/agent/ThinkingStream.tsx` | ✅ Thinking indicator |
| `ToolTimeline` | `src/ui/monitor/ToolTimeline.tsx` | ✅ Tool execution tracking |

---

### Floyd's Current Layout (from Chat Diagram)

```typescript
// From ConversationalLayout.tsx lines 469-478
// =========================================================================
// LAYOUT: Chat Diagram Structure
// =========================================================================
// 1. Message History (flows up - oldest at top, newest at bottom)
// 2. BLANK LINE spacer
// 3. Floyd's active response (what Floyd is typing)
// 4. Status line (spinner [thinking] | tool calls)
// 5. Input frame (bordered, with > prompt)
// 6. Bottom padding
// =========================================================================
```

**This matches Claude's pattern exactly.**

---

## Part 3: The Rebuild Plan

### Phase 1: Core Chat (Foundation)

**Status:** ✅ ALREADY DONE

`ConversationalLayout.tsx` implements:
- ✅ Message flow UP (oldest at top)
- ✅ Virtual scrolling with PgUp/PgDn
- ✅ Active response with streaming cursor
- ✅ Status line with mode + spinner + tools
- ✅ Bordered input frame

**Files:**
- `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/layouts/ConversationalLayout.tsx`

---

### Phase 2: Compact File References (NEEDED)

**What to Add:**

```typescript
// Add to MessageHistory component
interface FileReference {
  filename: string;
  lineCount?: number;
  truncated?: boolean;
  size?: string;
}

function FileReference({ref}: {ref: FileReference}) {
  return (
    <Text dimColor>
      Referenced file <Text bold>{ref.filename}</Text>
      {ref.lineCount && ` (${ref.lineCount} lines)`}
      {ref.truncated && '+'}
    </Text>
  );
}
```

**Trigger:** When tool returns file content, show metadata instead of full content.

---

### Phase 3: Double-Confirm Exit (ENHANCE)

**Current State:** Single Ctrl+Q exits immediately

**Enhancement Needed:**

```typescript
// Add to ConversationalLayout
const [pendingExit, setPendingExit] = useState(false);
const exitTimerRef = useRef<NodeJS.Timeout>();

useInput((_key, key) => {
  if (key.ctrl && (_key === 'q' || _key === 'Q')) {
    if (pendingExit) {
      // Second press - confirmed exit
      clearTimeout(exitTimerRef.current);
      onExit?.();
      inkExit();
      setTimeout(() => process.exit(0), 50);
    } else {
      // First press - show confirmation
      setPendingExit(true);
      exitTimerRef.current = setTimeout(() => setPendingExit(false), 3000);
    }
    return;
  }
});

// Show in UI when pending
{pendingExit && (
  <Text color="red" bold>
    Press Ctrl+Q again to exit
  </Text>
)}
```

---

### Phase 4: Mode Integration (ALREADY DONE)

**Floyd's modes match Claude's pattern:**

| Floyd Mode | Equivalent | Behavior |
|------------|------------|----------|
| `yolo` | Claude's YOLO | Auto-approve safe tools |
| `ask` | Claude's ASK | Confirm dangerous tools |
| `plan` | Claude's PLAN | Read-only |
| `auto` | Claude's AUTO | Adaptive |
| `dialogue` | N/A | Chat without tools |
| `fuckit` | N/A | All permissions |

**Integration Point:** `FLOYD_MODE` environment variable

---

### Phase 5: Tool Status Display (ALREADY DONE)

From `ConversationalLayout.tsx` lines 242-277:

```typescript
const StatusLine = memo(function StatusLine({isThinking, whimsicalPhrase, toolExecutions, safetyMode}) {
  const activeTool = toolExecutions.find(t => t.status === 'running');

  return (
    <Text>
      <Text bold color={getModeColor(safetyMode)}>[{safetyMode.toUpperCase()}]</Text>
      {isThinking && <Spinner type="moon" />}
      {activeTool && <Text>| {activeTool.toolName}...</Text>}
    </Text>
  );
});
```

**This matches Claude's pattern.**

---

## Part 4: Keyboard Shortcut Mapping

### Floyd's Current Shortcuts

| Shortcut | Action | Status |
|----------|--------|--------|
| `Ctrl+Q` | Quit | ✅ |
| `Esc` | Exit | ✅ |
| `Ctrl+P` | Command palette | ✅ |
| `Ctrl+/` | Help | ✅ |
| `PgUp/PgDn` | Scroll messages | ✅ |
| `Shift+Tab` | Cycle safety mode | ✅ |
| `/` | Command palette (alt) | ✅ |

**Matches Claude's pattern.**

---

## Part 5: Theme System (ALREADY DONE)

### Floyd's CRUSH Theme

From `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/theme/crush-theme.ts`:

```typescript
export const floydTheme = {
  colors: {
    fgBase: '#e0e0e0',
    fgMuted: '#808080',
    fgSubtle: '#606060',
    borderFocus: '#ff6b6b',
    // ... CRUSH theme colors
  }
};

export const roleColors = {
  userLabel: '#4ecdc4',      // Cyan
  assistantLabel: '#ff6b6b',  // Red
  systemLabel: '#ffe66d',     // Yellow
  toolLabel: '#95e1d3',       // Green
  thinking: '#f06595',        // Pink
  inputPrompt: '#ffffff',     // White
};
```

**Theme-aware styling is implemented.**

---

## Part 6: Component Inventory

### Keep These (Working Well)

✅ `ConversationalLayout` - Core chat layout
✅ `MessageHistory` - Virtual scrolling
✅ `ActiveResponse` - Streaming with cursor
✅ `StatusLine` - Mode + spinner + tools
✅ `InputFrame` - Bordered input
✅ `HelpOverlay` - Help system
✅ `CommandPalette` - Ctrl+P palette
✅ `MarkdownRenderer` - Rich formatting
✅ `ThinkingStream` - Thinking indicator
✅ `ToolTimeline` - Tool tracking

### Add These (From Claude)

⚠️ `FileReference` - Compact file display
⚠️ `DoubleConfirmExit` - Two-stage quit
⚠️ `LongOutputCollapse` - Expandable long outputs

### Remove These (Over-engineered)

❌ Unnecessary dashboards (keep Monitor, remove fluff)
❌ Redundant overlays (consolidate Help/Commands)
❌ Complex animations (keep simple spinners)

---

## Part 7: Minimal Viable TUI

### The Lean Architecture

```
┌─────────────────────────────────────────────┐
│ Message History (scrollable)                 │  ← 5 lines visible
│ Douglas. Hello                              │
│ Floyd. Hi there!                            │
│ Douglas. Can you help?                      │
│ ↑ 3 more (PgUp)                             │
├─────────────────────────────────────────────┤
│ Floyd. I'm reading the file...              │  ← Active response
│ ▋                                          │
├─────────────────────────────────────────────┤
│ [YOLO] ⠙ [thinking] | read_file...         │  ← Status line
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │  ← Input frame
│ │> Type a message...                      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Height Calculation:**
```typescript
const messageHeight = terminalHeight - 11;  // Reserve for UI elements
const displayCount = Math.floor(messageHeight / 3);
```

---

## Part 8: Rebuild Checklist

### Before Rebuild

- [ ] Backup working `ConversationalLayout.tsx`
- [ ] Document current keyboard shortcuts
- [ ] Test all existing modes (yolo/ask/plan)

### Rebuild Steps

1. [ ] **Preserve Core Layout**
   - Keep message flow UP
   - Keep virtual scrolling
   - Keep bordered input

2. [ ] **Add Compact File References**
   - Create `FileReference` component
   - Use when tools return file content

3. [ ] **Enhance Exit Behavior**
   - Implement double-confirm
   - Add visual "Press again to exit"

4. [ ] **Consolidate Overlays**
   - Merge Help/Commands into single overlay
   - Ensure Esc closes any overlay

5. [ ] **Test All Shortcuts**
   - Verify each shortcut works
   - Document in Help overlay

### After Rebuild

- [ ] Run `npm run build`
- [ ] Test in terminal at various heights
- [ ] Verify all modes work
- [ ] Test with long conversations

---

## Part 9: Quick Reference

### File Locations

| Component | Path |
|-----------|------|
| Main Layout | `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/layouts/ConversationalLayout.tsx` |
| Theme | `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/theme/crush-theme.ts` |
| Store | `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/store/floyd-store.ts` |
| Command Palette | `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/components/CommandPalette.tsx` |
| Help Overlay | `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/ui/overlays/HelpOverlay.tsx` |

### CLI Invocation

```bash
# Launch TUI
floyd --tui

# With specific mode
floyd --tui --mode yolo

# With Flash mode
floyd --tui --flash
```

---

## Part 10: Success Criteria

A successful TUI rebuild will have:

- [ ] Messages flow UP (newest at bottom)
- [ ] Virtual scrolling with PgUp/PgDn
- [ ] Compact file references (metadata, not content)
- [ ] Inline tool status ([OK], running...)
- [ ] Double-confirm exit pattern
- [ ] Mode indicator [YOLO] / [ASK] / [PLAN]
- [ ] Bordered input frame with `> ` prompt
- [ ] Streaming cursor ▋
- [ ] Help overlay (Ctrl+/)
- [ ] Command palette (Ctrl+P)
- [ ] Stable at any terminal height

---

## Conclusion

**Floyd's TUI is 90% aligned with Claude Code's proven patterns.**

The rebuild is minimal:
1. Add compact file references
2. Enhance double-confirm exit
3. Consolidate overlays

**Core architecture is solid. Focus on refinement, not redesign.**
