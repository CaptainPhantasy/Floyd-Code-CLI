---
name: Documentation Parity Patterns
description: Validates code-documentation parity using tree-sitter static analysis. Use when user asks about documentation validation, doc parity, checking if docs are up to date, or whether code matches documentation.
version: 1.0.0
---

# Documentation Parity Patterns

Validate that code and documentation stay synchronized using real static analysis, not just LLM reasoning.

## When to Use

Trigger this skill when user asks:

- "validate docs", "check documentation", "doc parity"
- "are docs up to date", "documentation drift"
- "does this match the docs", "is this documented"
- "what's missing from documentation"
- "check code against docs"

## Core Principles

1. **Code-based validation**: Use tree-sitter or AST parsing, not prompts
2. **Tiered severity**: Critical (API breaks), Warning (outdated info), Info (typos)
3. **Incremental checking**: Check modified files, not entire codebase
4. **Non-blocking default**: Alert but don't block unless configured

## Validation Depth Levels

| Level   | What It Checks                                | Speed    |
| ------- | --------------------------------------------- | -------- |
| Shallow | Exported symbol names exist in docs           | Fast     |
| Medium  | Function signatures match (params, types)     | Moderate |
| Deep    | Behavioral descriptions match actual behavior | Slow     |

## Common Issues Found

| Issue                         | Severity | Auto-Fix          |
| ----------------------------- | -------- | ----------------- |
| Missing export in docs        | Warning  | Yes (placeholder) |
| Orphaned doc entry            | Warning  | Yes (remove)      |
| Signature mismatch            | Warning  | Yes (update)      |
| Path reference invalid        | Info     | No                |
| Behavior description outdated | Critical | No (human review) |

## Tree-Sitter Patterns

Extract exported symbols by language:

**TypeScript:**

```bash
tree-sitter parse file.ts | grep -E "export_statement|function_declaration"
```

**Go:**

```bash
tree-sitter parse file.go | grep -E "function_declaration.*^[A-Z]"
```

**Python:**

```bash
tree-sitter parse file.py | grep -E "function_definition|class_definition"
```

## Validation Workflow

1. Extract exported symbols from source files
2. Search documentation for symbol references
3. Compare signatures (at medium depth)
4. Report mismatches with severity levels
5. Offer auto-fixes where applicable

## References

- `hooks/scripts/parity-check.sh` - Main validation script
- `commands/check.md` - Manual check command
- `commands/fix.md` - Auto-fix command

## Examples

Validate specific file:

```bash
# Check if src/api/users.ts exports are documented
/doc-parity:check --files=src/api/users.ts
```

Full project scan:

```bash
# Check all source files against all docs
/doc-parity:check --severity=warning --depth=medium
```

Fix found issues:

```bash
# Preview and apply fixes
/doc-parity:fix --docs=docs/API.md
```
