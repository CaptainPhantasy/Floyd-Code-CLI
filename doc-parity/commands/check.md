---
name: check
description: Check code-documentation parity using static analysis
argument-hint: '[--files=<pattern>] [--severity=<level>] [--depth=<level>] [--docs=<path>]'
allowed-tools:
  [
    'Read',
    'Glob',
    'Grep',
    'Bash',
    'mcp__plugin_serena_serena__find_symbol',
    'mcp__plugin_serena_serena__search_for_pattern',
  ]
---

# /doc-parity:check

Check code-documentation parity using tree-sitter static analysis.

## How This Works

This command uses **real code validation** via tree-sitter parsing, not just LLM analysis. It:

1. Parses source files to extract exported symbols (functions, classes, consts)
2. Searches documentation files for references to those symbols
3. Reports discrepancies with severity levels

## Usage

```bash
/doc-parity:check
# Check all default files with default settings

/doc-parity:check --files=src/**/*.ts
# Check only TypeScript files

/doc-parity:check --severity=critical
# Only show critical issues

/doc-parity:check --docs=docs/API.md
# Check against specific doc file
```

## Arguments

| Argument     | Values                  | Default                  |
| ------------ | ----------------------- | ------------------------ |
| `--files`    | File pattern (glob)     | src/\*_/_.{ts,tsx,go,py} |
| `--severity` | info, warning, critical | warning                  |
| `--depth`    | shallow, medium, deep   | medium                   |
| `--docs`     | Path to doc file        | All docs/\*.md           |

## What Gets Checked

**Shallow depth**: Exported symbol names exist in docs
**Medium depth**: Function signatures match (params, types)
**Deep depth**: Behavioral descriptions match actual behavior

## Exit Codes

- `0` - No issues or only info-level findings
- `1` - Warnings found
- `2` - Critical issues found

## Output Format

JSON findings with severity levels:

```json
{
	"findings": [
		{
			"id": "missing_export_001",
			"file": "src/api/users.ts",
			"symbol": "deleteUserById",
			"type": "missing_in_doc",
			"severity": "warning"
		}
	],
	"summary": {"critical": 0, "warning": 1, "info": 0}
}
```

## Implementation Steps

1. Read configuration from `.claude/doc-parity.local.md`
2. Use `Glob` to find matching source files
3. Run tree-sitter or grep-based extraction on each file
4. Search documentation for symbol references using `Grep`
5. Aggregate findings and report

## Examples

```bash
# Quick check before commit
/doc-parity:check --severity=critical

# Full audit
/doc-parity:check --depth=deep

# Check specific module
/doc-parity:check --files=src/agent/**/*.ts
```
