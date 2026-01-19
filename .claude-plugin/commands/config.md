---
name: config
description: Configure doc-parity plugin settings
argument-hint: '[set <key>=<value>] [get <key>] [list]'
allowed-tools: ['Read', 'Write', 'Edit']
---

# /doc-parity:config

Configure doc-parity plugin settings in `.claude/doc-parity.local.md`.

## Usage

```bash
/doc-parity:config
# Interactive configuration wizard

/doc-parity:config list
# Show all current settings

/doc-parity:config get severity
# Show specific setting

/doc-parity:config set severity=critical
# Set specific value

/doc-parity:config set proactive_mode=true
# Enable proactive mode
```

## Configuration Keys

| Key                 | Values                  | Default | Description                       |
| ------------------- | ----------------------- | ------- | --------------------------------- |
| `blocking_severity` | critical, warning, info | warning | Block operations at this severity |
| `default_severity`  | critical, warning, info | warning | Report issues at this level       |
| `default_depth`     | shallow, medium, deep   | medium  | Validation depth                  |
| `auto_fix_enabled`  | true, false             | true    | Allow auto-fix operations         |
| `auto_fix_dry_run`  | true, false             | true    | Preview fixes before applying     |
| `proactive_mode`    | true, false             | false   | Suggest doc updates after edits   |
| `proactive_delay`   | number (ms)             | 5000    | Delay before proactive check      |

## File Patterns

| Key               | Format    | Example            |
| ----------------- | --------- | ------------------ |
| `source_patterns` | YAML list | `- src/**/*.ts`    |
| `doc_files`       | YAML list | `- docs/*SSOT*.md` |

## Config File Location

Settings are stored in:

```
.claude/doc-parity.local.md
```

This file is **not** tracked by git (add to `.gitignore`).

## Example Config

```yaml
# Doc Parity Configuration

# Severity thresholds
blocking_severity: critical
default_severity: warning

# Validation depth (shallow|medium|deep)
default_depth: medium

# File patterns to monitor
source_patterns:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
  - 'agent/**/*.ts'

doc_files:
  - 'docs/**/*SSOT*.md'
  - 'docs/**/*ARCHITECTURE*.md'
  - 'CLAUDE.md'
  - 'README.md'

# Auto-fix settings
auto_fix_enabled: true
auto_fix_dry_run: true
auto_fix_types:
  - update_signatures
  - remove_orphans
  - add_missing_placeholders

# Proactive mode
proactive_mode: false
proactive_delay: 5000
```

## Implementation Steps

1. Check if `.claude/doc-parity.local.md` exists
2. If not, create from default template
3. For `set` command: Read file, update value, write back
4. For `get` command: Read file, extract value, display
5. For `list` command: Display all key-value pairs
6. For interactive mode: Prompt for each setting

## Interactive Mode

When run without arguments, walk through settings:

1. Show current value
2. Ask if user wants to change it
3. If yes, show options or accept custom input
4. Write updated config

## Examples

```bash
# First-time setup
/doc-parity:config

# Quick list
/doc-parity:config list

# Enable strict mode
/doc-parity:config set blocking_severity=critical

# Enable proactive checks
/doc-parity:config set proactive_mode=true
```
