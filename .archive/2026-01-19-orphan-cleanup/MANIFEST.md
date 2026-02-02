# Archive Manifest: 2026-01-19 Orphan Cleanup

**Date:** 2026-01-19
**Reason:** Removal of disconnected/orphaned files with no forward-facing purpose in the FLOYD-CLI codebase

---

## Summary

Total items archived: 35+ files/directories (~200+ files when expanded)
Archive size: ~44MB (primarily Go binaries)

---

## Archived Items by Category

### 1. Legacy Go System (Retired 2026-01-16)

| Item | Original Location | Description |
|------|-------------------|-------------|
| `go.mod` | `/` | Go module definition for "sysc-Go" |
| `go.sum` | `/` | Go dependency checksums |
| `floyd` | `/` | Compiled Go binary (21MB) |
| `pink-floyd` | `/` | Compiled Go binary (20MB) |
| `cli/` | `/cli/` | Go CLI config directory |
| `examples/` | `/examples/` | Go examples (bubbletea_fire.go, etc.) |

### 2. Arch Linux Packaging

| Item | Original Location | Description |
|------|-------------------|-------------|
| `PKGBUILD` | `/` | Arch package build for "syscgo" |
| `.SRCINFO` | `/` | Arch package source info |

### 3. Old Animation/Demo Assets

| Item | Original Location | Description |
|------|-------------------|-------------|
| `assets/` | `/assets/` | 174 .bit fonts, GIFs, ASCII art |
| `demos/` | `/demos/` | VHS tape files for recording demos |
| `convert_fonts.sh` | `/` | Font conversion script |
| `spinners.json` | `/` | Old spinner animation data |

### 4. Standalone Test/Prototype Projects

| Item | Original Location | Description |
|------|-------------------|-------------|
| `my-ink-cli/` | `/my-ink-cli/` | Standalone Ink CLI test project |
| `INK-Ink-Editor/` | `/INK/Ink Editor/` | Separate Ink CLI design tool |

### 5. Miscellaneous Orphan Files

| Item | Original Location | Description |
|------|-------------------|-------------|
| `generate_id.js` | `/` | Chrome extension ID generator |
| `setup_chrome.sh` | `/` | Old Chrome native messaging setup |
| `target_size.png` | `/` | Unused image file |
| `FLOYD_CLI.png` | `/` | Marketing/branding image |
| `WHIMSY_MAPPING.md` | `/` | Loading screen phrases (inappropriate) |
| `GUIDE.md` | `/` | Developer guide for Go "sysc-Go" |
| `ICON_PLACEMENT.md` | `/` | Icon placement guide |
| `SAVE_ICONS_GUIDE.md` | `/` | Icon saving guide |
| `FloydCodeCLI` | `/INK/` | Claude Code analysis reference |
| `Prompt.md` | `/INK/` | Old prompt template reference |
| `tools.json` | `/INK/` | Old tool definitions |

### 6. Orphan Directories

| Item | Original Location | Description |
|------|-------------------|-------------|
| `logs/` | `/logs/` | OpenAI API logs (69 JSON files) |
| `ASCII/` | `/ASCII/` | Duplicate ASCII art directory |
| `.grok/` | `/.grok/` | Grok IDE settings |
| `skills/` | `/skills/` | Unintegrated skill zip files |
| `.crush/` | `/.crush/` | Empty theme directory |
| `venv/` | `/venv/` | Python virtual environment |
| `INK-floyd-sessions/` | `/INK/.floyd/` | Old INK session files |

### 7. Stale Documentation

| Item | Original Location | Description |
|------|-------------------|-------------|
| `docs-stale/compliance-audit.md` | `/docs/` | Audit of retired Go TUI |
| `docs-stale/blocking-errors-found.md` | `/docs/` | Errors in old system |
| `docs-stale/agentic-refactor-plan.md` | `/docs/` | Old refactor plan |

---

## Active Codebase After Cleanup

The following directories remain active:

```
/Volumes/Storage/FLOYD_CLI/
├── packages/floyd-agent-core/    # Shared TypeScript agent core
├── INK/floyd-cli/                # CLI (React Ink)
├── FloydDesktop/                 # Desktop (Electron + React)
├── FloydChromeBuild/             # Chrome Extension
├── .floyd/                       # Active development workspace
├── docs/                         # Documentation (cleaned)
├── Claude.md                     # Agent operating system
├── package.json                  # Root workspace config
└── README.md                     # Project readme
```

---

## Restoration

To restore any archived items:

```bash
# Example: Restore a specific file
cp .archive/2026-01-19-orphan-cleanup/go.mod ./

# Example: Restore a directory
cp -r .archive/2026-01-19-orphan-cleanup/assets ./
```

---

**Archived by:** Claude (Opus 4.5)
**Reason:** Codebase cleanup - removing files with no forward-facing purpose after TypeScript migration
