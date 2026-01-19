---
name: SSOT Validation
description: Validates Single Source of Truth (SSOT) documentation files for parity with code. Use when user asks about SSOT validation, architecture docs, or project truth sources.
version: 1.0.0
---

# SSOT Validation

Validates Single Source of Truth (SSOT) documentation files to ensure they reflect actual code implementation.

## What is SSOT?

SSOT files are the authoritative documentation for a project:

- **FLOYD-CLI_SSOT.md** - Project structure, phases, implementation roadmap
- **CLAUDE.md** - Agent rules and coding patterns
- **FLOYD_ARCHITECTURE.md** - Architecture overview
- **DESIGN.md** - Design decisions and patterns

## When to Use

Trigger this skill when:

- Validating SSOT files specifically
- Checking if architecture docs match implementation
- Verifying project structure documentation
- After major refactoring

## SSOT Detection Rules

Files are considered SSOT if they match:

1. Filename patterns: `*SSOT*.md`, `*ARCHITECTURE*.md`, `DESIGN.md`
2. Content markers: Tables of contents, "Source of Truth" headers
3. Location: Root-level `CLAUDE.md`, docs/ directory

## Validation Priorities

| Priority | File                   | What to Check                      |
| -------- | ---------------------- | ---------------------------------- |
| 1        | docs/_SSOT_.md         | Project structure, file references |
| 2        | CLAUDE.md              | Code patterns, commands, paths     |
| 3        | docs/_ARCHITECTURE_.md | Component relationships            |
| 4        | README.md              | Installation, usage instructions   |

## Common SSOT Drift Issues

| Issue                    | Example                              | Fix                         |
| ------------------------ | ------------------------------------ | --------------------------- |
| Orphaned file references | docs mentions `src/old/file.ts`      | Remove or update reference  |
| Missing new components   | New agent not in architecture doc    | Add to component list       |
| Outdated paths           | References to `packages/` not `src/` | Update to current structure |
| Changed patterns         | Doc says use X, code uses Y          | Align documentation         |

## SSOT-Specific Checks

1. **File existence**: Verify all referenced files exist
2. **Export validation**: Confirm mentioned exports are present
3. **Path accuracy**: Check internal paths are correct
4. **Structure alignment**: Directory tree matches reality

## FLOYD Project Context

For FLOYD specifically, key SSOT files are:

- `docs/Floyd-CLI_SSOT.md` - Primary structure doc
- `CLAUDE.md` - Agent behavior rules
- `docs/FLOYD_ARCHITECTURE.md` - Architecture overview
- `docs/agents.md` - Agent system docs

## References

- `commands/check.md` - Use `--docs` to target SSOT files
- `scripts/parity-check.sh` - Validation implementation
- `.claude/doc-parity.local.md` - User config file

## Examples

Check SSOT files specifically:

```bash
/doc-parity:check --docs=docs/Floyd-CLI_SSOT.md --depth=medium
```

Validate all SSOT files:

```bash
/doc-parity:check --docs=docs/*SSOT*.md --docs=CLAUDE.md
```

Fix SSOT drift:

```bash
/doc-parity:fix --docs=docs/Floyd-CLI_SSOT.md
```
