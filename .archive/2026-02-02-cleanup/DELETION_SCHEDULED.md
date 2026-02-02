# Archive Scheduled for Deletion

**Created:** 2026-02-02
**Delete After:** 2026-02-23 (21 days)
**Reason:** Outdated docs, dead code, unused sandbox content

## Contents

### /docs/
- Old documentation files not relevant to current TUI REBUILD
- Session transcripts and reports

### /sandbox/
- INK/floyd-agent-sandbox/ (1GB) - old development sandbox
- FloydDesktopWeb content already superseded by TUI REBUILD

### /old-code/
- Deprecated source files
- Old refactor plans

### /sessions/
- Old session summaries and transcripts

## Restore Instructions
If you need to restore any file:
```bash
mv .archive/2026-02-02-cleanup/<path> <destination>
```

## Auto-Deletion
Run after 2026-02-23:
```bash
rm -rf /Volumes/Storage/FLOYD_CLI/.archive/2026-02-02-cleanup
```
