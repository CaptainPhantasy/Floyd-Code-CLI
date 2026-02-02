# TUI REBUILD - Master Instructions

**Project Root:** `/Volumes/Storage/FLOYD_CLI/TUI REBUILD`
**Created:** 2026-01-28
**Purpose:** Isolated build environment for FLOYD TUI - No impact on parent projects

---

## PROJECT ISOLATION GUARANTEE

This directory is a **self-contained Node.js project** with its own:
- `node_modules/` (isolated from parent)
- `package.json` (locked dependencies, no ~ or ^)
- `tsconfig.json` (ES2022 target, NodeNext module)
- `src/` (clean slate)

**It will NOT affect:**
- `/floyd-wrapper-main/` (existing Floyd wrapper)
- `/INK/floyd-cli/` (existing CLI)
- `/packages/floyd-agent-core/` (shared package)
- Parent `node_modules/`

---

## DEPENDENCY LOCKING POLICY

**ALL dependencies must be locked to exact versions.**

❌ FORBIDDEN:
```json
"ink": "^6.6.0"
"ink": "~6.6.0"
```

✅ REQUIRED:
```json
"ink": "6.6.0"
```

**Installation format:**
```bash
npm install package@1.2.3  # Not package@^1.2.3
```

---

## PROJECT TYPE: TypeScript → ES2022

This is a **TypeScript project** that compiles to ES2022:
- Source: `.ts` / `.tsx` files in `src/`
- Output: `.js` / `.mjs` files in `dist/`
- Target: ES2022 (modern JavaScript)
- Module: NodeNext (ESM with `.js` extension)

**Do NOT write raw `.js` files.** Write TypeScript for type safety.

---

## BUILD VERIFICATION PROTOCOL

**Before ANY code change:**
```bash
npm run build  # Verify current state compiles
npm run lint   # Verify no lint errors
```

**After ANY code change:**
```bash
npm run build  # Must pass
npm run lint   # Must pass
npm test       # If tests exist
```

**If build fails:**
1. Stop immediately
2. Document the error in `CHANGELOG.md`
3. Fix before proceeding
4. Re-verify

---

## CLEAN ROOT POLICY

**Root directory (`/TUI REBUILD/`) contains ONLY:**
```
TUI REBUILD/
├── ROOT_CLAUDE.md         # This file
├── package.json           # Dependencies (locked)
├── package-lock.json      # Auto-generated, commit it
├── tsconfig.json          # TypeScript config
├── .eslintrc.js           # Lint config
├── CHANGELOG.md           # Timestamped change log
├── PHASE_00_PREBUILD/     # Phase 0 instructions
├── PHASE_01_SCAFFOLD/     # Phase 1 instructions
├── PHASE_02_COMPONENTS/   # Phase 2 instructions
├── PHASE_03_STATE/        # Phase 3 instructions
├── PHASE_04_LLM/          # Phase 4 instructions
├── PHASE_05_KEYS/         # Phase 5 instructions
├── PHASE_06_THEME/        # Phase 6 instructions
├── PHASE_07_TEST/         # Phase 7 instructions
├── PHASE_08_BUILD/        # Phase 8 instructions
├── PHASE_09_DIFF/         # Phase 9 instructions
├── PHASE_10_SHIP/         # Phase 10 instructions
├── src/                   # Source code (generated during Phase 1)
├── dist/                  # Build output (generated during build)
├── node_modules/          # Dependencies (auto-generated)
└── tests/                 # Test files (generated during Phase 7)
```

**No loose files.** No temporary files in root. Use appropriate phase folder.

---

## DOCUMENT MANAGEMENT & ARCHIVAL

### Phase Folders

Each phase folder contains:
```
PHASE_XX_NAME/
├── Claude.md              # Instructions for THIS phase
├── RECEIPTS.md            # Verification receipts (append during phase)
├── ARCHIVE/               # Moved here on phase completion
│   └── {timestamp}_attempt/
```

### Timestamp Format

**Use ACTUAL SYSTEM TIME in ISO 8601 format:**
```
2026-01-28T20:30:45-08:00
```

### CHANGELOG.md Format

```markdown
# TUI REBUILD - Changelog

## 2026-01-28T20:30:45-08:00 - Phase 0: Pre-Build Verification
- Agent: [agent-id]
- Changes:
  - Created project structure
  - Installed locked dependencies
- Build: PASS
- Lint: PASS
- Next: Phase 1
```

---

## PHASE EXECUTION PROTOCOL

1. **Start Phase:** Read `PHASE_XX_NAME/Claude.md`
2. **Execute Tasks:** Follow checklist in order
3. **Verify Each Step:** Append receipt to `PHASE_XX_NAME/RECEIPTS.md`
4. **Document Changes:** Update `CHANGELOG.md` with timestamp
5. **Complete Phase:** Move work files to `PHASE_XX_NAME/ARCHIVE/{timestamp}/`
6. **Next Phase:** Launch new session for next phase (fresh context)

---

## NEW SESSION PER PHASE

**Why?** Minimize context drift.

**How:**
1. Complete current phase
2. Close this Claude session
3. Open new session
4. Read `PHASE_XX_NAME/Claude.md` for next phase
5. Continue

---

## EMERGENCY ROLLBACK

If something breaks:

```bash
# From /TUI REBUILD/
git status                    # Check changes
git diff                      # See what changed
git checkout -- package.json  # Rollback package.json
rm -rf node_modules           # Clean install
npm install                   # Reinstall locked deps
npm run build                 # Verify build
```

---

## REFERENCE DOCUMENTS (Read-Only)

Located in parent directories:
- `FLOYD ECOSYSTEM/TUI_MOCKUP.md` - Visual specification
- `FLOYD ECOSYSTEM/TUI_PROJECT_PLAN.md` - Detailed build plan
- `FLOYD ECOSYSTEM/FLOYD CODER AGENT WRAPPER/FLOYD_GOD_TIER.md` - Architecture

**Do NOT modify reference documents.**

---

**Last Updated:** 2026-01-28T20:30:00-08:00
**Status:** READY FOR SCAFFOLDING
