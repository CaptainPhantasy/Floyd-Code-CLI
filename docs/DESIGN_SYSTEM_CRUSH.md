# CRUSH Design System - Cross-Platform Alignment

**Purpose:** Unified design system for all Floyd platforms based on the CRUSH (CharmUI + Rustic + User-focused + Speedy + Hybrid) theme.

**Last Updated:** 2026-01-20

**Status:** Active - Phase 1: Foundation

---

## 1) CONTEXT INFERRED

### Product
The Floyd ecosystem consists of four platforms:
- **Floyd CLI** (`INK/floyd-cli/`) - Terminal-based AI assistant using Ink (React for CLI)
- **FloydDesktopWeb** (`FloydDesktopWeb/`) - React web application (Electron wrapper)
- **FloydChrome** (`FloydChromeBuild/floydchrome/`) - Chrome extension sidepanel
- **Floyd IDE** (`Floyd IDE/floyd-ide/`) - Tauri desktop application (VS Code alternative)

### Users
- Developers who interact with Floyd primarily through terminal/CLI
- Desktop users who prefer a native application experience
- Browser extension users who want AI assistance while browsing
- Users expecting a cohesive visual experience across all platforms

### Current State
- **CLI**: Has complete CRUSH theme implementation in `INK/floyd-cli/src/theme/`
  - `crush-theme.ts` - Complete color palette with semantic naming
  - `gradients.ts` - Gradient definitions for visual effects
  - `animations.ts` - Animation presets for terminal UI
  - `borders.ts` - Border style definitions
  - Components consistently use theme tokens (`crushTheme.bg.base`, `roleColors.userLabel`, etc.)

- **DesktopWeb**: Partial CRUSH theme in `tailwind.config.js`
  - Color tokens defined as Tailwind utilities (`bg-crush-base`, `text-crush-primary`, etc.)
  - Some hardcoded colors in CSS (`index.css` has `#201F26`, `#DFDBDD` inline)
  - Missing: Consistent spacing scale, typography scale, shadow scale
  - Some components use non-standard colors (`bg-purple-500`, `hover:bg-slate-500`)

- **Chrome Extension**: No CRUSH theme
  - Uses hardcoded generic dark theme colors (`#1a1a1a`, `#2a2a2a`, `#4caf50`)
  - No connection to CRUSH palette

- **Floyd IDE**: No CRUSH theme
  - Uses VS Code-like dark theme (`#1e1e1e`, `#252526`, `#007acc`)
  - No connection to CRUSH palette

### Stack Constraints
- **CLI**: Ink (React for terminal) - Cannot use CSS, must use Ink's styling system
- **DesktopWeb**: React + Tailwind CSS - Full CSS capabilities, utility-first approach
- **Chrome**: Vanilla CSS/JS - Content script isolation, extension size limits
- **IDE**: React + Tauri - Full CSS capabilities, Monaco Editor integration

### UX Goals
- **Speed**: Fast visual feedback, clear status indicators
- **Clarity**: High contrast, readable typography
- **Consistency**: Same colors mean the same thing everywhere
- **Personality**: The "raunchy whimsy" of Charmbracelet design

---

## 2) DESIGN SYSTEM PROPOSAL

### Token Architecture

The CRUSH theme uses semantic token names organized by category:

#### Background Colors ("Rustic" Foundation)
```typescript
// Token names map to semantic purposes
bg.base      // #201F26 - Main background
bg.elevated  // #2d2c35 - Cards, panels, elevated elements
bg.overlay   // #3A3943 - Overlay backgrounds
bg.modal     // #4D4C57 - Modal/Dialog backgrounds
```

#### Text Colors ("Ash" Scale)
```typescript
text.primary    // #DFDBDD - Primary text
text.secondary  // #959AA2 - Secondary text
text.tertiary   // #BFBCC8 - Tertiary text
text.subtle     // #706F7B - Hints, subtle text
text.selected   // #F1EFEF - Selected text
text.inverse    // #FFFAF1 - Inverse text
```

#### Accent Colors ("Charm" Signature)
```typescript
accent.primary   // #6B50FF - Charple (purple) - Primary CTAs, focus
accent.secondary // #FF60FF - Dolly (pink) - Branding, highlights
accent.tertiary  // #68FFD6 - Bok (teal) - Tool calls, success alt
accent.highlight // #E8FE96 - Zest (yellow) - Warnings, emphasis
accent.info      // #00A4FF - Malibu (blue) - Info, assistant labels
```

#### Status Colors ("Speedy" Feedback)
```typescript
status.ready    // #12C78F - Guac (green) - Success, online, ready
status.working  // #6B50FF - Charple (purple) - Processing, working
status.warning  // #E8FE96 - Zest (yellow) - Caution, warning
status.error    // #EB4268 - Sriracha (red) - Errors, critical
status.blocked  // #FF60FF - Dolly (pink) - Blocked, waiting
status.offline  // #858392 - Squid (gray) - Offline, disconnected
status.busy     // #E8FF27 - Citron (lime) - Busy, active processing
```

#### Role-Based Colors (Semantic UI Roles)
```typescript
role.headerTitle    // accent.secondary - Header gradient start
role.headerStatus   // text.primary - Header status text
role.userLabel      // status.ready - User message labels
role.assistantLabel // accent.info - Assistant message labels
role.systemLabel    // accent.highlight - System message labels
role.toolLabel      // accent.tertiary - Tool call labels
role.thinking       // accent.highlight - Thinking indicator
role.inputPrompt    // status.ready - Input prompt color
role.hint           // text.secondary - Help/hint text
```

### Spacing Scale

Base unit: 4px

```typescript
spacing = {
  xs:  4,   // 0.25rem - Tight spacing
  sm:  8,   // 0.5rem  - Small gaps
  md:  16,  // 1rem    - Default spacing
  lg:  24,  // 1.5rem  - Large gaps
  xl:  32,  // 2rem    - Extra large
  2xl: 48,  // 3rem    - Section spacing
  3xl: 64,  // 4rem    - Page sections
}
```

### Typography Scale

```typescript
typography = {
  // Font families
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    mono: '"Courier New", monospace', // For CLI, code, logs
  },

  // Sizes (using rem for web, points for CLI are implicit)
  size: {
    xs:  0.75rem,   // 12px - Captions
    sm:  0.875rem,  // 14px - Body, small text
    base: 1rem,     // 16px - Default body
    lg:  1.125rem,  // 18px - Large text
    xl:  1.25rem,   // 20px - Headers
    2xl: 1.5rem,    // 24px - Page headers
    3xl: 2rem,      // 32px - Hero titles
  },

  // Weights
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  leading: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}
```

### Shadows

```typescript
shadows = {
  none:  'none',
  sm:    '0 1px 2px rgba(0, 0, 0, 0.3)',
  md:    '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg:    '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl:    '0 20px 25px rgba(0, 0, 0, 0.6)',
}
```

### Border Radius

```typescript
radius = {
  none:   '0',
  sm:     '0.125rem', // 2px
  md:     '0.25rem',  // 4px
  lg:     '0.5rem',   // 8px
  xl:     '0.75rem',  // 12px
  full:   '9999px',   // Pill/circle
}
```

### Transitions

```typescript
transitions = {
  fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base:   '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:   '600ms cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Component Patterns

#### Atomic Components
- **Button** - Primary, secondary, ghost variants with status states
- **Input** - Text, textarea, select with focus/error states
- **Badge** - Status indicators with color variants
- **Icon** - Consistent sizing and coloring
- **Spinner** - Loading states

#### Molecular Components
- **Card** - Elevated content containers
- **FormField** - Input + label + error message
- **Dropdown** - Select menus
- **Tooltip** - Contextual help
- **Alert** - Success/error/warning banners

#### Organisms
- **Header** - App navigation with status
- **Sidebar** - Navigation panels
- **Modal** - Dialog overlays
- **ChatMessage** - Message bubbles with role styling

---

## 3) REPO MAPPING

### File Locations

```
/Volumes/Storage/FLOYD_CLI/
├── packages/
│   └── ui-theme/                    # NEW: Shared theme package
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── tokens/
│       │   │   ├── colors.ts       # CRUSH color definitions
│       │   │   ├── spacing.ts      # Spacing scale
│       │   │   ├── typography.ts   # Font scale
│       │   │   ├── shadows.ts      # Shadow definitions
│       │   │   ├── radius.ts       # Border radius
│       │   │   └── transitions.ts  # Animation timing
│       │   ├── platform/
│       │   │   ├── ink.ts          # Ink (CLI) adapter
│       │   │   ├── tailwind.ts     # Tailwind config generator
│       │   │   └── css.ts          # CSS variables generator
│       │   └── index.ts
│       └── README.md
│
├── INK/floyd-cli/
│   └── src/
│       └── theme/                   # EXISTING: CLI theme
│           ├── crush-theme.ts      # <- Will import from ui-theme
│           ├── gradients.ts
│           ├── animations.ts
│           ├── borders.ts
│           └── index.ts
│
├── FloydDesktopWeb/
│   ├── tailwind.config.js           # <- Will use ui-theme
│   ├── src/
│   │   ├── index.css                # <- Will use CSS variables
│   │   └── ...
│
├── FloydChromeBuild/floydchrome/
│   ├── sidepanel/
│   │   ├── panel.css                # <- Will use CSS variables
│   │   └── ...
│
└── Floyd IDE/floyd-ide/
    └── src/
        ├── App.css                  # <- Will use CSS variables
        └── ...
```

### Implementation Patterns

#### For CLI (Ink)
```typescript
// Import from shared theme
import { crushColors, roleColors } from '@floyd/ui-theme';

// Use in components
<Box borderColor={crushColors.bg.overlay}>
  <Text color={roleColors.userLabel}>User:</Text>
</Box>
```

#### For DesktopWeb (Tailwind)
```jsx
// tailwind.config.js - generated from theme
import { generateTailwindConfig } from '@floyd/ui-theme/platform/tailwind';

export default generateTailwindConfig();
```

```jsx
// Component usage
<div className="bg-crush-base text-crush-text-primary border border-crush-overlay">
  <span className="text-crush-secondary">Header</span>
</div>
```

#### For Chrome/IDE (CSS Variables)
```css
/* Generated from theme */
:root {
  --crush-bg-base: #201F26;
  --crush-bg-elevated: #2d2c35;
  --crush-text-primary: #DFDBDD;
  --crush-accent-primary: #6B50FF;
  /* ... */
}

/* Usage */
.header {
  background: var(--crush-bg-elevated);
  color: var(--crush-text-primary);
  border-color: var(--crush-bg-overlay);
}
```

---

## 4) MIGRATION PLAN

### Phase 1: Foundation (Week 1)
**Goal:** Create shared theme package

1. **Create `packages/ui-theme/`**
   - Set up TypeScript project
   - Define all token types and values
   - Create platform adapters (Ink, Tailwind, CSS)

2. **Update CLI theme imports**
   - Refactor `INK/floyd-cli/src/theme/crush-theme.ts` to use shared tokens
   - Ensure backward compatibility with existing CLI components

3. **Verification**
   - Build CLI theme
   - Run CLI app
   - No visual regressions

### Phase 2: DesktopWeb Migration (Week 2)
**Goal:** Replace hardcoded colors with theme tokens

1. **Update Tailwind config**
   - Generate from `ui-theme`
   - Remove hardcoded values

2. **Migrate components** (in priority order)
   - `App.tsx` - Main layout
   - `Sidebar.tsx`
   - `ChatMessage.tsx`
   - `ToolCallCard.tsx`
   - `SettingsModal.tsx`
   - `SkillsPanel.tsx`
   - `BroworkPanel.tsx`
   - `ProjectsPanel.tsx`

3. **Replace inline CSS**
   - Update `index.css` to use CSS variables
   - Remove hardcoded hex values

### Phase 3: Chrome Extension (Week 3)
**Goal:** Apply CRUSH theme consistently

1. **Generate CSS file**
   - Create `theme.css` from `ui-theme`
   - Include in `panel.html`

2. **Update `panel.css`**
   - Replace hardcoded colors
   - Use CSS variables
   - Ensure contrast ratios

### Phase 4: Floyd IDE (Week 4)
**Goal:** Apply CRUSH theme consistently

1. **Generate CSS file**
   - Create `theme.css` from `ui-theme`
   - Include in `index.html`

2. **Update `App.css`**
   - Replace hardcoded colors
   - Use CSS variables
   - Coordinate with Monaco Editor theme

### Phase 5: Validation (Week 5)
**Goal:** Ensure consistency and quality

1. **Visual audit** across all platforms
2. **Accessibility audit** (WCAG AA contrast)
3. **Performance review** (bundle size)
4. **Documentation completeness**

### Migration Tactics

**DO:**
- Migrate one component at a time
- Test after each change
- Leave TODO comments for skipped sections
- Measure bundle size impact
- Run accessibility checks

**DON'T:**
- Rewrite entire platforms at once
- Create components that aren't used yet
- Break existing functionality
- Ignore accessibility

---

## 5) GUARDRAILS & CHECKS

### Linting Rules

**For TypeScript (CLI, DesktopWeb, IDE):**
```json
{
  "rules": {
    "no-hardcoded-colors": "error",
    "prefer-theme-tokens": "warn"
  }
}
```

**Custom ESLint rule example:**
```typescript
// Ban hardcoded hex colors in JSX/TSX
// 'bg-#201F26' -> 'bg-crush-base'
// 'text-[#6B50FF]' -> 'text-crush-primary'
// style={{ color: '#FF60FF' }} -> style={{ color: 'var(--crush-accent-secondary)' }}
```

### Review Guidelines

Every PR must:
1. Use theme tokens, not raw color values
2. Maintain accessibility (WCAG AA contrast)
3. Not increase bundle size significantly
4. Include screenshots for visual changes

### Agent Hooks

**When agents create UI:**
1. Check existing theme tokens first
2. Reuse components before creating new ones
3. Run accessibility audit
4. Document new patterns

**When agents refactor UI:**
1. Replace hardcoded values with tokens
2. Consolidate duplicate components
3. Update affected tests
4. Add migration notes

### Continuous Improvement

- **Quarterly token audits** - Remove unused, add needed
- **Component usage metrics** - Identify dead code
- **Accessibility regression testing** - Automated checks
- **Performance budget enforcement** - Bundle size limits

---

## Appendix A: Token Reference Tables

### Complete Color Palette

| Category | Token | Hex | Usage |
|----------|-------|-----|-------|
| **Background** | `bg.base` | #201F26 | Main background |
| | `bg.elevated` | #2d2c35 | Cards, panels |
| | `bg.overlay` | #3A3943 | Overlays |
| | `bg.modal` | #4D4C57 | Modals |
| **Text** | `text.primary` | #DFDBDD | Primary text |
| | `text.secondary` | #959AA2 | Secondary text |
| | `text.tertiary` | #BFBCC8 | Tertiary text |
| | `text.subtle` | #706F7B | Hints |
| | `text.selected` | #F1EFEF | Selected |
| | `text.inverse` | #FFFAF1 | Inverse |
| **Accent** | `accent.primary` | #6B50FF | Charple (purple) |
| | `accent.secondary` | #FF60FF | Dolly (pink) |
| | `accent.tertiary` | #68FFD6 | Bok (teal) |
| | `accent.highlight` | #E8FE96 | Zest (yellow) |
| | `accent.info` | #00A4FF | Malibu (blue) |
| **Status** | `status.ready` | #12C78F | Guac (green) |
| | `status.working` | #6B50FF | Charple (purple) |
| | `status.warning` | #E8FE96 | Zest (yellow) |
| | `status.error` | #EB4268 | Sriracha (red) |
| | `status.blocked` | #FF60FF | Dolly (pink) |
| | `status.offline` | #858392 | Squid (gray) |
| | `status.busy` | #E8FF27 | Citron (lime) |

### Spacing Scale

| Token | Value | Rem | Usage |
|-------|-------|-----|-------|
| `spacing.xs` | 4px | 0.25rem | Tight spacing |
| `spacing.sm` | 8px | 0.5rem | Small gaps |
| `spacing.md` | 16px | 1rem | Default spacing |
| `spacing.lg` | 24px | 1.5rem | Large gaps |
| `spacing.xl` | 32px | 2rem | Extra large |
| `spacing.2xl` | 48px | 3rem | Section spacing |
| `spacing.3xl` | 64px | 4rem | Page sections |

### Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text.xs` | 12px | - | Captions |
| `text.sm` | 14px | - | Body, small |
| `text.base` | 16px | - | Default |
| `text.lg` | 18px | - | Large text |
| `text.xl` | 20px | - | Headers |
| `text.2xl` | 24px | - | Page headers |
| `text.3xl` | 32px | - | Hero |

---

## Appendix B: Platform-Specific Notes

### CLI (Ink) Constraints
- No CSS - must use Ink's `color`, `backgroundColor`, `borderColor` props
- Monospace fonts only
- Limited character set for borders
- Animations via frame intervals

### DesktopWeb (Electron) Capabilities
- Full CSS + Tailwind
- System font access
- Native window controls
- File system access

### Chrome Extension Constraints
- Content script isolation
- Extension size limits (~2-5MB unpacked)
- CSP restrictions
- No native modules

### Floyd IDE (Tauri) Capabilities
- Full CSS + React
- Monaco Editor theming
- Native system integration
- File system access

---

**Next Steps:**
1. Review and approve this plan
2. Create `packages/ui-theme/` with Phase 1 implementation
3. Begin migration with DesktopWeb components

**Questions?** Refer to `INK/floyd-cli/src/theme/` for the canonical CRUSH implementation.
