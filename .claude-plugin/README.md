# Doc Parity Plugin

Code-documentation parity validator using **real static analysis** (tree-sitter), not just LLM prompts.

## Overview

Doc Parity ensures your code and documentation stay synchronized by:

- Extracting exported symbols from source files using static analysis
- Validating documentation references for each symbol
- Reporting discrepancies with severity levels (critical, warning, info)
- Offering auto-fixes for common issues

## Features

- ✅ **Code-based validation** using tree-sitter parsing
- ✅ **Multi-language support**: TypeScript, JavaScript, Go, Python
- ✅ **Tiered severity**: Critical (API breaks), Warning (missing docs), Info (typos)
- ✅ **Auto-fix capable**: Add placeholders, remove orphans, update signatures
- ✅ **Continuous monitoring**: Hook triggers on file edits
- ✅ **SSOT aware**: Prioritizes Single Source of Truth files

## Installation

```bash
# Copy plugin to your project
cp -r doc-parity /path/to/your-project/

# Or install globally
cp -r doc-parity ~/.claude/plugins/
```

## Quick Start

```bash
# Check all source files against documentation
/doc-parity:check

# Fix found issues (with diff preview)
/doc-parity:fix

# Configure settings
/doc-parity:config
```

## Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `/doc-parity:check`  | Validate code-documentation parity |
| `/doc-parity:fix`    | Auto-fix documentation issues      |
| `/doc-parity:config` | Configure plugin settings          |

## Configuration

Create `.claude/doc-parity.local.md` in your project:

```yaml
# Severity thresholds
blocking_severity: critical
default_severity: warning

# Validation depth (shallow|medium|deep)
default_depth: medium

# File patterns
source_patterns:
  - 'src/**/*.ts'
  - 'src/**/*.go'

doc_files:
  - 'docs/API.md'
  - 'CLAUDE.md'
```

## Severity Levels

| Level    | When                  | Action             |
| -------- | --------------------- | ------------------ |
| Critical | Breaking API changes  | Block operation    |
| Warning  | Missing documentation | Alert but continue |
| Info     | Typos, formatting     | Log only           |

## Validation Depth

| Level   | What It Checks              | Speed    |
| ------- | --------------------------- | -------- |
| Shallow | Export names exist in docs  | Fast     |
| Medium  | Function signatures match   | Moderate |
| Deep    | Behavior descriptions match | Slow     |

## Hook Behavior

The `PreToolUse` hook runs on `Write`/`Edit` operations:

1. Checks if modified file matches source patterns
2. Runs static analysis to extract exports
3. Searches documentation for references
4. Reports findings via JSON output

**Exit codes**: 0 (no issues), 1 (warnings), 2 (critical)

## INTERNAL_COMMS.md Integration

The plugin integrates with `.claude/INTERNAL_COMMS.md` as a trigger source:

- When a **COMPLETION** entry is added to INTERNAL_COMMS.md, the hook prompts to run `/doc-parity:check`
- This ensures documentation is validated after work is completed
- Handoffs and discoveries in INTERNAL_COMMS.md also trigger reminders

This creates a workflow:

```
Complete work → Log to INTERNAL_COMMS.md → Hook reminds to check docs → Run /doc-parity:check
```

## Examples

```bash
# Check specific file type
/doc-parity:check --files=src/**/*.ts

# Only show critical issues
/doc-parity:check --severity=critical

# Check against specific doc
/doc-parity:check --docs=docs/API.md

# Preview fixes without applying
/doc-parity:fix --dry-run

# Enable proactive mode
/doc-parity:config set proactive_mode=true
```

## Requirements

- Bash (for hook scripts)
- tree-sitter (optional, falls back to grep patterns)
- Claude Code with plugin support

## File Structure

```
doc-parity/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── skills/
│   ├── doc-parity-patterns/  # Main validation skill
│   └── ssot-validation/      # SSOT-specific validation
├── commands/
│   ├── check.md              # /doc-parity:check
│   ├── fix.md                # /doc-parity:fix
│   └── config.md             # /doc-parity:config
├── agents/
│   └── doc-parity-analyzer.md # Parity analysis agent
├── hooks/
│   ├── hooks.json            # Hook configuration
│   └── scripts/
│       └── parity-check.sh   # Validation script
└── .claude/
    └── doc-parity.local.md   # Default configuration
```

## Development

### Testing the Hook

```bash
# Test the validation script directly
echo '{"tool_name":"Write","tool_input":{"file_path":"/path/to/file.ts"}}' | \
  bash hooks/scripts/parity-check.sh
```

### Debug Mode

```bash
# Enable debug output
DOCPARITY_DEBUG=true /doc-parity:check
```

## License

MIT
