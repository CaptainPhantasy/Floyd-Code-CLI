# CRUSH Theme Quick Reference

**Purpose:** Quick lookup for developers using the CRUSH theme

**Last Updated:** 2026-01-20

---

## Color Palette - At a Glance

### Background Colors (Rustic)
```
┌─────────────────────────────────────────────────────┐
│ Name        Hex       Usage                         │
├─────────────────────────────────────────────────────┤
│ base        #201F26   Main background               │
│ elevated    #2d2c35   Cards, panels                 │
│ overlay     #3A3943   Overlays                      │
│ modal       #4D4C57   Modals, dialogs               │
└─────────────────────────────────────────────────────┘
```

### Text Colors (Ash)
```
┌─────────────────────────────────────────────────────┐
│ Name        Hex       Usage                         │
├─────────────────────────────────────────────────────┤
│ primary     #DFDBDD   Main text                     │
│ secondary   #959AA2   Secondary text                │
│ tertiary    #BFBCC8   Tertiary text                  │
│ subtle      #706F7B   Hints, disabled               │
│ selected    #F1EFEF   Selected text                 │
│ inverse     #FFFAF1   On dark backgrounds           │
└─────────────────────────────────────────────────────┘
```

### Accent Colors (Charm)
```
┌─────────────────────────────────────────────────────┐
│ Name        Hex       Usage                         │
├─────────────────────────────────────────────────────┤
│ primary     #6B50FF   Charple - CTAs, focus         │
│ secondary   #FF60FF   Dolly - branding              │
│ tertiary    #68FFD6   Bok - tools, success alt     │
│ highlight   #E8FE96   Zest - warnings, emphasis    │
│ info        #00A4FF   Malibu - info, assistant     │
└─────────────────────────────────────────────────────┘
```

### Status Colors (Speedy)
```
┌─────────────────────────────────────────────────────┐
│ Name        Hex       Usage                         │
├─────────────────────────────────────────────────────┤
│ ready       #12C78F   Success, online               │
│ working     #6B50FF   Processing, loading          │
│ warning     #E8FE96   Caution                       │
│ error       #EB4268   Errors, critical             │
│ blocked     #FF60FF   Blocked, waiting              │
│ offline     #858392   Disconnected                  │
│ busy        #E8FF27   Active processing             │
└─────────────────────────────────────────────────────┘
```

---

## Platform Usage

### CLI (Ink)
```typescript
import { crushTheme, roleColors } from '../theme/crush-theme.js';

// Colors
<Box backgroundColor={crushTheme.bg.elevated}>
  <Text color={crushTheme.fg.base}>Text</Text>
</Box>

// Role-based
<Text color={roleColors.userLabel}>User:</Text>
<Text color={roleColors.assistantLabel}>Assistant:</Text>
```

### DesktopWeb (Tailwind)
```jsx
// Backgrounds
<div className="bg-crush-base">
<div className="bg-crush-elevated">

// Text
<span className="text-crush-text-primary">
<span className="text-crush-text-secondary">

// Accents
<button className="bg-crush-primary">
<span className="text-crush-secondary">

// Status
<span className="text-crush-ready">
<span className="text-crush-error">
```

### Chrome/IDE (CSS Variables)
```css
/* With CSS variables */
.header {
  background: var(--crush-bg-elevated);
  color: var(--crush-text-primary);
  border-color: var(--crush-bg-overlay);
}

.status-ready {
  color: var(--crush-status-ready);
}
```

---

## Role-Based Colors (When to Use What)

| UI Element | Use This Color | Token |
|------------|----------------|-------|
| Header title gradient | Pink (#FF60FF) | `role.headerTitle` |
| Header status text | Ash (#DFDBDD) | `role.headerStatus` |
| User message label | Green (#12C78F) | `role.userLabel` |
| Assistant message label | Blue (#00A4FF) | `role.assistantLabel` |
| System message label | Yellow (#E8FE96) | `role.systemLabel` |
| Tool call label | Teal (#68FFD6) | `role.toolLabel` |
| Thinking indicator | Yellow (#E8FE96) | `role.thinking` |
| Input prompt | Green (#12C78F) | `role.inputPrompt` |
| Hint/help text | Gray (#959AA2) | `role.hint` |

---

## Common Patterns

### Status Badge
```jsx
// Ready/Success
<span className="bg-crush-ready/20 text-crush-ready px-2 py-1 rounded">

// Error
<span className="bg-crush-error/20 text-crush-error px-2 py-1 rounded">

// Warning
<span className="bg-crush-warning/20 text-crush-warning px-2 py-1 rounded">
```

### Button
```jsx
// Primary
<button className="bg-crush-primary hover:bg-crush-grape text-white">

// Secondary
<button className="bg-crush-secondary hover:bg-crush-grape text-white">

// Ghost
<button className="bg-crush-overlay hover:bg-crush-modal text-crush-text-primary">
```

### Card
```jsx
<div className="bg-crush-elevated border border-crush-overlay rounded-lg p-4">
```

### Input
```jsx
<input className="bg-crush-base border border-crush-overlay text-crush-text-primary
              focus:ring-2 focus:ring-crush-primary" />
```

### Message Bubble (User)
```jsx
<div className="bg-crush-ready text-crush-base rounded-lg px-4 py-3">
```

### Message Bubble (Assistant)
```jsx
<div className="bg-crush-elevated text-crush-text-primary border border-crush-overlay rounded-lg px-4 py-3">
```

---

## Gradient Values

For ASCII art and special effects:

```
Charple to Dolly (purple to pink):
#6B50FF -> #7858FF -> #8B75FF -> #B85CFF -> #FF60FF

FLOYD Brand Gradient:
#: #FF60FF (pink)
:: #6060FF (blue)
Other: #B85CFF (lavender)
```

---

## Spacing Scale (4px base)

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

---

## Border Radius

```
sm:   2px
md:   4px
lg:   8px
xl:   12px
full: 9999px (pill)
```

---

## Quick Lookup: What Color Should I Use?

| I want to... | Use this |
|--------------|----------|
| Make something stand out | `accent.primary` (#6B50FF) |
| Show success/ready | `status.ready` (#12C78F) |
| Show an error | `status.error` (#EB4268) |
| Show a warning | `status.warning` (#E8FE96) |
| Fade something back | `text.secondary` (#959AA2) |
| Show it's disabled | `text.subtle` (#706F7B) |
| Elevate a card | `bg.elevated` (#2d2c35) |
| Create an overlay | `bg.overlay` (#3A3943) |
| Brand something | `accent.secondary` (#FF60FF) |

---

## DO's and DON'T's

### DO
- Use semantic token names (`bg-crush-base`)
- Use role-based colors for message labels
- Test contrast ratios
- Be consistent across platforms

### DON'T
- Use hardcoded hex values
- Use Tailwind's default colors (`bg-purple-500`)
- Use random color values
- Mix themes within a component

---

**Need the full theme definition?** See `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli/src/theme/crush-theme.ts`
