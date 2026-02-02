# Phase 1 Build Simulation - Issues Found

**Date:** 2026-01-29T01:45:00-08:00
**Purpose:** Simulated Phase 1 build to identify blockers

---

## BUILD ERRORS FOUND

### Error 1: JSX Configuration Mismatch
```
error TS2875: This JSX tag requires the module path 'ink/jsx-runtime' to exist
```

**Root Cause:** `tsconfig.json` has `jsx: "react-jsx"` and `jsxImportSource: "ink"`

**Ink 6 Actual Requirement:** `jsx: "react"` (classic React JSX)

**Fix Required:**
```diff
// tsconfig.json
-   "jsx": "react-jsx",
-   "jsxImportSource": "ink",
+   "jsx": "react",
```

---

### Error 2: React Import Missing
```
error TS2786: 'Text' cannot be used as a JSX component
```

**Root Cause:** Components don't import React

**Ink 6 Pattern:** Classic JSX requires React import
```tsx
import React from 'react';  // REQUIRED
import { Box, Text } from 'ink';
```

**Fix Required:** Add `import React from 'react';` to ALL `.tsx` files

---

### Error 3: React Version Compatibility
```
react@19.0.0 has peer dependency issue with react-reconciler@0.33.0
react-reconciler wants: ^19.2.0
we have: 19.0.0
```

**Root Cause:** React 19.0.0 doesn't satisfy react-reconciler's peer requirement

**Fix Required:** Upgrade React to 19.2.4 (latest stable)

---

### Error 4: Module Resolution
```
error TS2834: Relative import paths must include '.js' extension
```

**Root Cause:** NodeNext requires explicit `.js` extensions for ESM

**Fix Required:** All imports must end in `.js`
```diff
- import { StatusBar } from './components/StatusBar';
+ import { StatusBar } from './components/StatusBar.js';
```

---

## ADDITIONAL ISSUES DISCOVERED

### Issue 5: zustand Peer Dependency
zustand@5.0.2 requires React >=18.0.0 (✓ compatible)
BUT: zustand 5.x has breaking changes from 4.x

**Verification Required:** Test zustand store initialization

---

### Issue 6: @inkjs/ui Exports
@inkjs/ui@2.0.0 exports may not match TUI_MOCKUP.md assumptions

**Verification Required:** Check actual exports match usage patterns

---

### Issue 7: ink-text-input API Changes
ink-text-input@6.0.0 may have different API than assumed in spec

**Verification Required:** Test actual TextInput component

---

## REQUIRED FIXES BEFORE PHASE 1

### Fix 1: Update tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react",  // CHANGED from "react-jsx"
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    // REMOVE: jsxImportSource
  }
}
```

### Fix 2: Update package.json
```json
{
  "dependencies": {
    "ink": "6.6.0",
    "@inkjs/ui": "2.0.0",
    "ink-text-input": "6.0.0",
    "react": "19.2.4",  // UPGRADED from 19.0.0
    "zustand": "5.0.2",
    ...
  },
  "devDependencies": {
    "@types/react": "19.2.0",  // UPGRADED to match React
    ...
  }
}
```

### Fix 3: Component Template
All `.tsx` files MUST start with:
```tsx
import React from 'react';  // REQUIRED for classic JSX
import { Box, Text } from 'ink';
```

### Fix 4: Import Extensions
All imports MUST include `.js`:
```tsx
import { StatusBar } from './components/StatusBar.js';
import { useTuiStore } from './store/tui-store.js';
```

---

## CONFIDENCE ASSESSMENT

### Before Fixes: ~30% confidence
- JSX config wrong
- React version incompatible
- Import pattern wrong

### After Fixes: ~90% confidence
- Correct JSX config
- Compatible React version
- Proper imports
- Based on actual Ink 6 source code

---

## PHASE 1 CHECKLIST (UPDATED)

- [ ] Apply Fix 1: Update tsconfig.json (jsx: "react")
- [ ] Apply Fix 2: Upgrade React to 19.2.4
- [ ] Apply Fix 3: Add React import to all components
- [ ] Apply Fix 4: Add .js extensions to all imports
- [ ] Run `npm install` (after React upgrade)
- [ ] Run `npm run build` (must pass)
- [ ] Run `npm run lint` (must pass)
- [ ] Create test render for each component
- [ ] Verify component renders without errors

---

## REFERENCES

- Ink 6 source: https://github.com/vadimdemedes/ink
- Ink 6 tsconfig: `jsx: "react"` (classic)
- Ink 6 examples: Import React explicitly
- React 19.2.4: Latest stable (satisfies react-reconciler)

---

**Status:** FIXES DOCUMENTED
**Next:** Apply fixes and re-simulate
