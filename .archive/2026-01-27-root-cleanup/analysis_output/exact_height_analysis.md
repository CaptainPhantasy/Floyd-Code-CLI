# FLOYD CLI - Exact Height Analysis

**Analysis Date:** 2026-01-20
**Purpose:** Calculate exact terminal frame dimensions

---

## COMPONENT HEIGHT CALCULATIONS

### 1. FloydAsciiBanner
**File:** `MainLayout.tsx:220-229`

```typescript
const FLOYD_ASCII_LINES = [
    // 8 lines total
];
```

**Render:**
```tsx
<Box flexDirection="column" marginBottom={1}>
    {FLOYD_ASCII_LINES.map(...)}
</Box>
```

**Exact Height:**
- Content: 8 lines
- marginBottom: 1 line
- **Total: 9 lines**

---

### 2. StatusBar (Non-Compact)
**File:** `MainLayout.tsx:364-408`

```tsx
<Box
    borderStyle="round"     // +2 lines (top + bottom border)
    borderColor={...}
    paddingX={1}            // 0 vertical padding
    paddingY={0}            // 0 vertical padding
    marginBottom={0}
    width="100%"
>
    {/* 1 line of content */}
</Box>
```

**Exact Height:**
- Top border: 1 line
- Content: 1 line
- Bottom border: 1 line
- **Total: 3 lines**

---

### 3. InputArea
**File:** `MainLayout.tsx:564-595`

```tsx
<Box flexDirection="column" width="100%" marginTop={0} paddingX={0}>
    {/* Input box */}
    <Box
        borderStyle="double"    // +2 lines
        borderColor={...}
        paddingX={1}
        paddingY={0}            // 0 vertical padding
        width="100%"
    >
        <TextInput ... />
    </Box>

    {/* Hint footer */}
    <Box marginTop={0} flexDirection="row" ...>
        {/* 1 line of hints */}
    </Box>
</Box>
```

**Exact Height:**
- Input box top border: 1 line
- Input content: 1 line
- Input box bottom border: 1 line
- Hint line: 1 line
- **Total: 4 lines**

---

### 4. TranscriptPanel with Frame
**File:** `TranscriptPanel.tsx:93`

```tsx
<Frame
    title=" TRANSCRIPT "
    borderStyle="round"     // +2 lines
    borderVariant="focus"
    padding={2}             // +4 lines (2 top + 2 bottom)
>
    <Viewport height={height} ...>
        {/* Content */}
    </Viewport>
</Frame>
```

**Frame Component Analysis** (`Frame.tsx:139-163`):
```tsx
<Box
    borderStyle={...}       // +2 lines (top + bottom)
    paddingX={pad.x}        // Horizontal only
    paddingY={pad.y}        // pad.y = 1 from default padding={1}
    paddingTop={pad.top}    // pad.top = pad.y = 1 (from padding=2)
    paddingBottom={pad.bottom} // pad.bottom = pad.y = 1
>
    {title && (...)}        // Title adds 1 line when present
    {children}
</Box>
```

**Exact Frame Height:**
- Top border: 1 line
- Top padding: 1 line
- Title line: 1 line
- Content height: variable
- Bottom padding: 1 line
- Bottom border: 1 line
- **Overhead: 5 lines** (borders + padding + title)

---

## TERMINAL HEIGHT BREAKDOWN BY SCREEN SIZE

### Wide Screen (≥100 cols, banner visible)

```
┌─────────────────────────────────────────────────────────┐
│                    FLOYD ASCII Banner                    │  ← 8 lines
│                         (8 lines)                       │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ StatusBar with user info, connection, status      │  │  ← 3 lines
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────┬──────────────────────────────┬──────────┐  │
│  │        │  ┌────────────────────────┐  │          │  │
│  │SESSION │  │ ┌────────────────────┐ │  │ CONTEXT  │  │
│  │ Panel  │  │ │   TRANSCRIPT       │ │  │  Panel   │  │
│  │        │  │ │   (Frame)          │ │  │          │  │
│  │        │  │ │  ┌──────────────┐  │ │  │          │  │
│  │        │  │ │  │  Viewport    │  │ │  │          │  │
│  │        │  │ │  │  (variable)  │  │ │  │          │  │
│  │        │  │ │  │              │  │ │  │          │  │
│  │        │  │ │  └──────────────┘  │ │  │          │  │
│  │        │  │ └────────────────────┘ │  │          │  │
│  │        │  └──────────────────────────┘  │          │  │  ← variable
│  └────────┴──────────────────────────────┴──────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ❯ [Input box...........................]         │  │  ← 2 lines
│  ├───────────────────────────────────────────────────┤  │
│  │ Ctrl+P: Commands • Ctrl+/: Help • Esc: Exit      │  │  ← 1 line
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Height Calculation:**
```
Banner:          9 lines (8 content + 1 margin)
StatusBar:       3 lines (2 borders + 1 content)
InputArea:       4 lines (2 borders + 1 content + 1 hint)
─────────────────────────────────────
Fixed Overhead:  16 lines

Available for content: terminalHeight - 16 lines
```

**CODE'S CALCULATION (INCORRECT):**
```typescript
// MainLayout.tsx:678-689
const getOverheadHeight = () => {
    return 15;  // Banner(10) + StatusBar(2) + Input(3)
};
```

**ERROR:** Code calculates 15, but actual overhead is 16 lines!

### Narrow Screen (<100 cols, banner hidden)

```
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │  ← 3 lines
│  │ StatusBar (compact)                   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │         TRANSCRIPT (Frame)           │  │  ← variable
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │  ← 4 lines
│  │ ❯ [Input box...................]   │  │
│  ├──────────────────────────────────────┤  │
│  │ Ctrl+P: Cmds • Ctrl+/: Help • Esc   │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

**Height Calculation:**
```
StatusBar:       3 lines
InputArea:       4 lines
─────────────────────────
Fixed Overhead:  7 lines

Available for content: terminalHeight - 7 lines
```

**CODE'S CALCULATION:**
```typescript
if (isNarrowScreen) return 5;  // StatusBar(2) + Input(3)
```

**ERROR:** Code calculates 5, but actual overhead is 7 lines!

---

## FRAME BORDER HEIGHT IMPACT

### TranscriptPanel Frame Analysis

**Structure:**
```
┌─ TITLE ────────← 1 line (top border + title inline)
│               ← 1 line (top padding)
│ Content       ← content height
│               ← 1 line (bottom padding)
───────────────← 1 line (bottom border)
```

**Frame Overhead: 4 lines** (not 5 as title is inline with top border)

### Why This Matters

**Current code calculation:**
```typescript
const availableHeight = terminalHeight - overheadHeight;  // overhead = 15 or 5
const transcriptHeight = Math.max(1, availableHeight - 1);
```

**Actual needed:**
```typescript
const transcriptHeight = terminalHeight - overheadHeight - FRAME_OVERHEAD;
// where FRAME_OVERHEAD = 4 lines (top border + top padding + bottom padding + bottom border)
```

**Result:** The Viewport inside TranscriptPanel gets 4 fewer lines than it should, causing:
1. Content to be clipped earlier than expected
2. Terminal overflow on smaller screens
3. Inconsistent scrolling behavior

---

## EXACT DIMENSIONS TABLE

| Terminal Size | Banner | StatusBar | Input | Frame Overhead | Total Fixed | Available |
|---------------|--------|-----------|-------|----------------|-------------|-----------|
| 24 rows | 9 | 3 | 4 | 4 | 20 | 4 rows ⚠️ |
| 30 rows | 9 | 3 | 4 | 4 | 20 | 10 rows |
| 40 rows | 9 | 3 | 4 | 4 | 20 | 20 rows |
| 50 rows | 9 | 3 | 4 | 4 | 20 | 30 rows |

| Narrow (<100) | Banner | StatusBar | Input | Frame Overhead | Total Fixed | Available |
|---------------|--------|-----------|-------|----------------|-------------|-----------|
| 24 rows | 0 | 3 | 4 | 4 | 11 | 13 rows |
| 30 rows | 0 | 3 | 4 | 4 | 11 | 19 rows |

---

## VERIFICATION RECEIPT

**Build Status:**
```bash
$ cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli && npm run build
> floyd-cli@0.1.0 build
> tsc
# (no errors)
```

**Code Locations Verified:**
- `MainLayout.tsx:220-229` - ASCII banner (8 lines)
- `MainLayout.tsx:244` - marginBottom={1}
- `MainLayout.tsx:365-371` - StatusBar borderStyle="round", paddingY={0}
- `MainLayout.tsx:567-573` - InputArea borderStyle="double"
- `TranscriptPanel.tsx:93` - Frame with padding={2}
- `Frame.tsx:139-148` - Frame Box with borderStyle and padding props

---

## CONCLUSION

**CRITICAL FINDING:** The CLI's height calculations are **incorrect**:

1. **Wide screen overhead calculated as 15 lines, actual is 16-20 lines** (depending on Frame borders)
2. **Narrow screen overhead calculated as 5 lines, actual is 11 lines** (including Frame borders)
3. **Frame borders and padding are never accounted for** in height calculations
4. **Minimum viable terminal size is actually 24 rows** (not 15 as code assumes)

**Impact:**
- On 24-row terminals, only ~4 rows available for content (after 20 lines overhead)
- Users with small terminals will experience content clipping
- Viewport height calculations are systematically wrong

*End of Exact Height Analysis*
