# Archive Index: 2026-01-27 Root Cleanup

**Date:** 2026-01-27
**Reason:** Organize repository root - only essential docs remain

---

## Files Reorganized (Not Archived)

### Moved to docs/
- `FLOYDENGINEERING.md` (37K) - Engineering documentation
- `Floyd_API_Assessment.md` (10K) - API assessment

### Moved to docs/test-reports/
- `apireport.md` (19K)
- `cli_end.md` (23K)
- `floyd-tool-calling-fix-receipt.md` (4.9K)
- `floydtest1.md` (15K)
- `floydtest2.md` (13K)
- `floydtest3.md` (18K)
- `ink-floyd-cli-fixes.md` (7.4K)
- `ink-floyd-cli-report.md` (38K)
- `ink-floyd-cli-validation-receipt.md` (8.7K)

---

## Archived Items (Pending Deletion)

### Build Artifacts
- `floyd-workspace-0.1.0.tgz` (40M) - Old workspace tarball

### Temp Directories
- `analysis_output/` (100K)
- `CLI TESTING/` (8K)
- `Floyd/` (4K) - Coverage file

### Scratch Files (Safe to Delete)
- `mylist.md` (3.4K)
- `poemai.md` (126B)
- `QUICK_BUILD_FIX.txt` (1.1K)

---

## Root Structure (Final)

### Essential Documents (Required in Root)
- `FLOYD.MD` - Agent instructions (visible, needed by agents)
- `Claude.md` - Project rules and SSOT hierarchy
- `README.md` - Project readme
- `LICENSE` - License file

### Configuration Files
- `package.json` - Monorepo configuration
- `package-lock.json` - Dependency lock
- `.gitignore` - Git ignore rules
- `.env.local` - Environment variables

### Component Folders
- `packages/` - Shared packages (floyd-agent-core)
- `INK/floyd-cli` - Ink CLI TUI
- `floyd-wrapper-main/` - Main wrapper CLI
- `FloydDesktopWeb/` - Web desktop app
- `FloydChromeBuild/` - Chrome extension
- `Floyd IDE/` - IDE implementation
- `mobile/` - Mobile app
- `docs/` - Documentation
- `docs/test-reports/` - Test reports
- `ASSETS/` - Images and assets
- `scripts/` - Build scripts
- `whimsy/` - Utility functions
- `floyd-extensions/` - Extension system
- `floyd-cursem-source/` - Theme source
- `floyd-cursem-extension/` - IDE extension
- `RepoGod/` - Architecture tools

---

## Cleanup Summary
- **Documents reorganized:** 11 files
- **Space reclaimed:** ~41 MB (mostly 40MB tarball)
- **Root .md files:** Only essential 4 (FLOYD.MD, Claude.md, README.md, LICENSE)

To restore any item: `cp -r .archive/2026-01-27-root-cleanup/[item] .`
