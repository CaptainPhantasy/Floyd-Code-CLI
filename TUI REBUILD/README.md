# FLOYD TUI REBUILD

**Provider-Agnostic Terminal UI for FLOYD GOD TIER Agent**

**Root:** `/Volumes/Storage/FLOYD_CLI/TUI REBUILD`
**Status:** UI_COMPLETE_NO_LLM - See `ACTUAL_STATUS.md` for verified details
**Created:** 2026-01-28
**Last Verified:** 2026-02-01 (repo-critic-enforcer audit)

---

## QUICK START

### For Each Phase (New Session)

1. Read `PHASE_XX_NAME/Claude.md`
2. Follow the checklist
3. Append receipts to `PHASE_XX_NAME/RECEIPTS.md`
4. Update `CHANGELOG.md` with timestamp
5. Complete phase, then close session
6. Start new session for next phase

### Verification

```bash
cd "/Volumes/Storage/FLOYD_CLI/TUI REBUILD"
npm run verify  # typecheck + lint + build
```

---

## PROJECT STRUCTURE

```
TUI REBUILD/
├── ROOT_CLAUDE.md         # Master instructions (READ FIRST)
├── CHANGELOG.md           # Timestamped change log
├── package.json           # LOCKED dependencies (no ~ or ^)
├── tsconfig.json          # ES2022, NodeNext
├── eslint.config.js       # ESLint 9 flat config
│
├── PHASE_00_PREBUILD/     # ✅ COMPLETE
│   ├── Claude.md          # Environment verification
│   └── RECEIPTS.md        # Verification logs
│
├── PHASE_01_SCAFFOLD/     # ⏳ NEXT
│   ├── Claude.md          # Create 15 component files
│   └── RECEIPTS.md
│
├── PHASE_02_COMPONENTS/   # Build and test 8 components
├── PHASE_03_STATE/        # Zustand store
├── PHASE_04_LLM/          # GLM integration
├── PHASE_05_KEYS/         # Keyboard shortcuts
├── PHASE_06_THEME/        # CRUSH theme
├── PHASE_07_TEST/         # 15-turn smoke test
├── PHASE_08_BUILD/        # Production build
├── PHASE_09_DIFF/         # Feature parity check
├── PHASE_10_SHIP/         # Quality gate
│
├── src/                   # Source code (created in Phase 1)
│   ├── components/        # 8 TUI components
│   ├── theme/             # CRUSH colors
│   ├── store/             # Zustand state
│   ├── hooks/             # use-keyboard, use-streaming
│   └── utils/             # provider-config
│
└── dist/                  # Build output
```

---

## DEPENDENCIES (LOCKED)

```json
{
  "ink": "6.6.0",          // React for CLI
  "@inkjs/ui": "2.0.0",    // UI components
  "ink-text-input": "6.0.0", // Input
  "react": "19.0.0",       // React 19
  "zustand": "5.0.2"       // State
}
```

**No tilde (~) or caret (^)** - All versions locked.

---

## CURRENT STATUS (Verified 2026-02-01)

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Pre-Build Verification | ✅ COMPLETE | Environment verified |
| 1 | Project Scaffolding | ✅ COMPLETE | 11 components created |
| 2 | Core Components | ✅ COMPLETE | All components wired to store |
| 3 | State Management | ✅ COMPLETE | Zustand + persistence + whimsical phrases + build fixes |
| 4 | LLM Integration | ✅ COMPLETE | GLM + OpenAI clients, streaming, retry logic, tests passing |
| 5 | Keyboard Shortcuts | ✅ COMPLETE | useKeyboard.ts (102 lines) |
| 6 | Theme & Styling | ✅ COMPLETE | colors.ts (51 lines) |
| 7 | Testing | ✅ COMPLETE | Integration tests passing |
| 8 | Build & Package | ✅ COMPLETE | tsc builds successfully |
| 9 | DIFF Verification | ❌ NOT STARTED | Diff viewer not implemented |
| 10 | Final Verification | 🔴 BLOCKED | Waiting for Phase 04 |

### CURRENT STATUS (2026-02-02T00:00:00)
**The TUI compiles, runs, and has full-featured LLM integration.**
- GLM + OpenAI clients at `src/llm/factory.ts` (430 lines)
- SSE streaming with token-by-token UI updates
- Exponential backoff retry logic for rate limits
- Message history tracking
- 15 integration tests passing
- Ready for end-to-end testing

See `ACTUAL_STATUS.md` for full details.

---

## REFERENCES

- `FLOYD ECOSYSTEM/TUI_MOCKUP.md` - Visual spec and reference code
- `FLOYD ECOSYSTEM/TUI_PROJECT_PLAN.md` - Detailed 10-phase plan
- `FLOYD ECOSYSTEM/FLOYD CODER AGENT WRAPPER/FLOYD_GOD_TIER.md` - Architecture

---

## ISOLATION GUARANTEE

This project is **fully isolated** from parent FLOYD_CLI projects:
- Separate `node_modules/`
- Separate `package.json`
- Does NOT modify `/floyd-wrapper-main/`, `/INK/floyd-cli/`, or `/packages/`

---

**Last Updated:** 2026-01-29T01:40:00-08:00
