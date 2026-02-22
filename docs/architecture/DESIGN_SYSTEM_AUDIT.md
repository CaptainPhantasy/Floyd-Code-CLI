# CRUSH Theme Audit - Platform-by-Platform Gap Analysis

**Date:** 2026-01-20
**Purpose:** Document current state and specific gaps for each Floyd platform

---

## Executive Summary

| Platform | Theme Status | Consistency | Priority |
|----------|--------------|-------------|----------|
| Floyd CLI (INK) | Complete - Reference Implementation | 100% | N/A (source of truth) |
| FloydDesktopWeb | Partial - Tailwind config exists | ~60% | HIGH |
| FloydChrome | None - Generic dark theme | 0% | MEDIUM |
| Floyd IDE | None - VS Code-like theme | 0% | MEDIUM |

---

## Floyd CLI (`INK/floyd-cli/`) - REFERENCE IMPLEMENTATION

### Status: COMPLETE

This is the canonical implementation of the CRUSH theme.

### Files

```
INK/floyd-cli/src/theme/
- crush-theme.ts    # Complete color definitions
- gradients.ts      # Gradient definitions
- animations.ts     # Animation presets
- borders.ts        # Border styles
- index.ts          # Exports
```

### Color Usage Examples

```typescript
// From crush-theme.ts - THE SOURCE OF TRUTH
export const crushTheme = {
  bg: {
    base: '#201F26',      // Pepper - main background
    elevated: '#2d2c35',  // BBQ - elevated elements
    overlay: '#3A3943',   // Charcoal - overlays
    modal: '#4D4C57',     // Iron - modals
  },
  fg: {
    base: '#DFDBDD',      // Ash - primary text
    muted: '#959AA2',     // Squid - secondary text
    subtle: '#706F7B',     // Oyster - subtle text
  },
  accent: {
    primary: '#6B50FF',   // Charple - primary accent
    secondary: '#FF60FF', // Dolly - secondary accent
    tertiary: '#68FFD6',  // Bok - tertiary accent
    highlight: '#E8FE96', // Zest - highlight
    info: '#00A4FF',      // Malibu - info
  },
  status: {
    ready: '#12C78F',     // Guac - success/ready
    working: '#6B50FF',   // Charple - processing
    warning: '#E8FE96',   // Zest - warning
    error: '#EB4268',     // Sriracha - error
    blocked: '#FF60FF',   // Dolly - blocked
    offline: '#858392',   // Squid - offline
  },
};
```

### Role Colors (Semantic UI)

```typescript
// Role-based colors for specific UI elements
export const roleColors = {
  headerTitle: '#FF60FF',    // Dolly - headers
  headerStatus: '#DFDBDD',   // Ash - status text
  userLabel: '#12C78F',      // Guac - user messages
  assistantLabel: '#00A4FF', // Malibu - assistant
  systemLabel: '#E8FE96',    // Zest - system
  toolLabel: '#68FFD6',      // Bok - tools
  thinking: '#E8FE96',       // Zest - thinking
  inputPrompt: '#12C78F',    // Guac - input
  hint: '#959AA2',           // Squid - hints
};
```

### Component Usage Pattern

```typescript
// Components import and use theme directly
import { crushTheme, roleColors } from '../../theme/crush-theme.js';

<Box borderColor={crushTheme.bg.overlay}>
  <Text color={roleColors.userLabel}>User:</Text>
</Box>
```

### GAPS: NONE - This is the reference implementation.

---

## FloydDesktopWeb (`FloydDesktopWeb/`) - PARTIAL IMPLEMENTATION

### Status: PARTIAL - Tailwind config exists, inconsistent usage

### Current State

**`tailwind.config.js`** - Has CRUSH color definitions:
```javascript
colors: {
  crush: {
    base: '#201F26',
    elevated: '#2d2c35',
    overlay: '#3A3943',
    modal: '#4D4C57',
    primary: '#6B50FF',
    secondary: '#FF60FF',
    tertiary: '#68FFD6',
    quaternary: '#E8FE96',
    info: '#00A4FF',
    ready: '#12C78F',
    working: '#6B50FF',
    warning: '#E8FE96',
    error: '#EB4268',
    blocked: '#FF60FF',
    offline: '#858392',
    grape: '#5848cc', // hover state
    julep: '#4dc4a0', // hover state
  },
  // Text colors named differently from CLI:
  'crush-text-primary': '#DFDBDD',
  'crush-text-secondary': '#959AA2',
  'crush-text-tertiary': '#BFBCC8',
  'crush-text-subtle': '#706F7B',
  'crush-text-selected': '#F1EFEF',
}
```

**`src/index.css`** - Has inline hardcoded colors:
```css
/* Lines 8-12: Hardcoded values that should use CSS variables */
body {
  background-color: #1e1e1e; /* WRONG - should be #201F26 */
  color: #d4d4d4;           /* WRONG - should be #DFDBDD */
}
```

### Component-by-Component Audit

#### `App.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 278 | `text-crush-secondary` | Non-standard name | LOW |
| 362 | `bg-purple-500` | Hardcoded, should use `bg-crush-secondary` | HIGH |
| 396 | `text-crush-ready` | Correct | - |
| 484 | `focus:ring-crush-primary` | Correct | - |

#### `Sidebar.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 34 | `bg-crush-primary` | Correct | - |
| 61 | `text-crush-text-secondary` | Correct | - |

#### `ChatMessage.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 34 | `bg-crush-ready` | Correct | - |
| 49 | `bg-crush-base` | Correct | - |
| 60 | `!bg-crush-base` | Correct | - |

#### `ToolCallCard.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 59 | `bg-crush-elevated/50` | Correct | - |
| 66 | `bg-crush-working/20` | Correct | - |

#### `SettingsModal.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 175 | `border-crush-primary` | Correct | - |
| 199 | `bg-crush-ready/10` | Correct | - |
| 245 | `hover:bg-slate-500` | Hardcoded, should use `hover:bg-crush-overlay` | HIGH |

#### `SkillsPanel.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 113 | `bg-crush-secondary/20` | Correct | - |
| 187 | `bg-purple-500` | Hardcoded, should use `bg-crush-secondary` | HIGH |
| 269 | `hover:bg-slate-500` | Hardcoded, should use `hover:bg-crush-overlay` | HIGH |

#### `BroworkPanel.tsx`
| Line | Issue | Should Be | Priority |
|------|-------|-----------|----------|
| 149 | `bg-green-500/5` | Hardcoded, should use `bg-crush-ready/5` | HIGH |
| 190 | `from-cyan-500/10` | Hardcoded, should use `from-crush-tertiary/10` | HIGH |
| 297 | `bg-blue-500` | Hardcoded, should use `bg-crush-info` | HIGH |
| 394 | `text-slate-600` | Hardcoded, should use `text-crush-text-subtle` | HIGH |

### Summary of GAPS

1. **Inconsistent color naming**: Tailwind uses `crush-text-primary` but CLI uses `fg.base`
2. **Hardcoded colors**: Many components use `bg-purple-500`, `hover:bg-slate-500`, `text-slate-600`
3. **CSS file**: `index.css` has hardcoded values
4. **Missing**: Spacing scale, typography scale not defined in Tailwind

---

## FloydChrome (`FloydChromeBuild/floydchrome/`) - NO IMPLEMENTATION

### Status: NONE - Generic dark theme

### Current State

**`sidepanel/panel.css`** - All hardcoded colors:
```css
/* All values are generic, not CRUSH-themed */
body {
  background: #1a1a1a;        /* WRONG - should be #201F26 */
  color: #e0e0e0;             /* WRONG - should be #DFDBDD */
}

header {
  background: #2a2a2a;        /* WRONG - should be #2d2c35 */
  border-bottom: 1px solid #3a3a3a;  /* WRONG - should be #3A3943 */
}

.status-indicator.connected {
  background: #4caf50;        /* WRONG - should be #12C78F */
}

.tab-button.active {
  color: #4caf50;             /* WRONG - should be #12C78F */
  border-bottom: 2px solid #4caf50;  /* WRONG */
}

.execute-button {
  background: #4caf50;        /* WRONG - should be #6B50FF (primary) */
}

.log-entry.error {
  color: #f44336;             /* WRONG - should be #EB4268 */
}

.log-entry.success {
  color: #4caf50;             /* WRONG - should be #12C78F */
}

.log-entry.info {
  color: #2196f3;             /* WRONG - should be #00A4FF */
}
```

### Complete Gap Analysis

| Element | Current Value | CRUSH Value | Token Name |
|---------|---------------|-------------|------------|
| Main background | `#1a1a1a` | `#201F26` | `bg-base` |
| Elevated background | `#2a2a2a` | `#2d2c35` | `bg-elevated` |
| Primary text | `#e0e0e0` | `#DFDBDD` | `text-primary` |
| Border | `#3a3a3a` | `#3A3943` | `bg-overlay` |
| Success/Ready | `#4caf50` | `#12C78F` | `status-ready` |
| Error | `#f44336` | `#EB4268` | `status-error` |
| Info | `#2196f3` | `#00A4FF` | `accent-info` |
| Primary button | `#4caf50` | `#6B50FF` | `accent-primary` |

### Migration Required

1. Add `theme.css` with CSS variables
2. Replace all hardcoded colors in `panel.css`
3. Update any inline styles in HTML/JS
4. Test contrast ratios

---

## Floyd IDE (`Floyd IDE/floyd-ide/`) - NO IMPLEMENTATION

### Status: NONE - VS Code-like theme

### Current State

**`src/App.css`** - VS Code-style colors:
```css
/* VS Code-like dark theme, not CRUSH */
html, body, #root {
  background-color: #1e1e1e;   /* WRONG - should be #201F26 */
  color: #d4d4d4;              /* WRONG - should be #DFDBDD */
}

.resize-handle:hover {
  background-color: #007acc;   /* WRONG - should be #6B50FF */
}

.file-tree {
  background-color: #252526;   /* WRONG - should be #2d2c35 */
}

.file-tree-header {
  background-color: #333;      /* WRONG - should be #3A3943 */
}

.file-item:hover {
  background-color: #2a2d2e;   /* WRONG - should be #3A3943 */
}

.tab-button.active {
  background-color: #1e1e1e;   /* WRONG */
  border-top: 1px solid #007acc; /* WRONG - should be #FF60FF (brand) */
}
```

### Monaco Editor Theme

The Monaco Editor will need a custom theme definition:
```typescript
// Needed for consistent theming
monaco.editor.defineTheme('crush-theme', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '959AA2' },  // Squid
    { token: 'keyword', foreground: 'FF60FF' },  // Dolly
    { token: 'string', foreground: '12C78F' },   // Guac
    { token: 'number', foreground: '68FFD6' },  // Bok
    // ... more token rules
  ],
  colors: {
    'editor.background': '#201F26',
    'editor.foreground': '#DFDBDD',
    'editor.lineHighlightBackground': '#2d2c35',
    'editorCursor.foreground': '#6B50FF',
    'editor.selectionBackground': '#6B50FF40',
    // ... more color rules
  },
});
```

### Complete Gap Analysis

| Element | Current Value | CRUSH Value | Token Name |
|---------|---------------|-------------|------------|
| Main background | `#1e1e1e` | `#201F26` | `bg-base` |
| Sidebar background | `#252526` | `#2d2c35` | `bg-elevated` |
| Header background | `#333` | `#3A3943` | `bg-overlay` |
| Primary text | `#d4d4d4` | `#DFDBDD` | `text-primary` |
| Active tab border | `#007acc` | `#FF60FF` | `accent-secondary` |
| Resize handle hover | `#007acc` | `#6B50FF` | `accent-primary` |

### Migration Required

1. Add `theme.css` with CSS variables
2. Replace all hardcoded colors in `App.css`
3. Create Monaco Editor theme
4. Update `FileTree.tsx` and other components

---

## Priority Fix List

### HIGH Priority (User-facing inconsistencies)

1. **FloydDesktopWeb/SkillsPanel.tsx**: Replace `bg-purple-500`, `hover:bg-slate-500`
2. **FloydDesktopWeb/BroworkPanel.tsx**: Replace `bg-green-500`, `from-cyan-500`, `text-slate-600`
3. **FloydDesktopWeb/SettingsModal.tsx**: Replace `hover:bg-slate-500`
4. **FloydDesktopWeb/index.css**: Replace hardcoded body colors
5. **FloydChrome/panel.css**: Complete theme replacement needed

### MEDIUM Priority (Internal consistency)

1. Create `packages/ui-theme/` shared package
2. Update Tailwind config to use shared theme
3. Add CSS variables for Chrome/IDE
4. Standardize naming across platforms

### LOW Priority (Nice to have)

1. Add spacing scale to Tailwind
2. Add typography scale to Tailwind
3. Create animation utilities
4. Add shadow scale

---

## Migration Checklist Template

For each file being migrated:

```
[ ] File: _____________
[ ] Backup current version
[ ] Replace hardcoded hex values with tokens
[ ] Update imports if needed
[ ] Test visual appearance
[ ] Test hover/focus/active states
[ ] Test error/success/warning states
[ ] Check contrast ratios
[ ] Commit changes with descriptive message
```

---

**End of Audit**

Next: Execute Phase 1 - Create `packages/ui-theme/` shared package.
