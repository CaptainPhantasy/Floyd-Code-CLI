# Doc Parity Configuration

# This file contains default configuration for the doc-parity plugin.

# Users can override these values in their project's .claude/doc-parity.local.md

# Severity thresholds

# blocking_severity: Block operations at this severity (critical|warning|info)

# default_severity: Report issues at this level (critical|warning|info)

blocking_severity: critical
default_severity: warning

# Validation depth

# shallow: Export names only

# medium: Signatures (params, types)

# deep: Behavioral descriptions

default_depth: medium

# Source file patterns to monitor

source_patterns:

- "src/\*_/_.ts"
- "src/\*_/_.tsx"
- "src/\*_/_.go"
- "src/\*_/_.py"
- "agent/\*_/_.ts"

# Documentation files to validate

doc_files:

- "docs/\**/*SSOT\*.md"
- "docs/\**/*ARCHITECTURE\*.md"
- "docs/\**/*API\*.md"
- "CLAUDE.md"
- "README.md"
- ".claude/INTERNAL_COMMS.md" # Trigger file for handoffs and completions

# Auto-fix settings

auto_fix_enabled: true
auto_fix_dry_run: true
auto_fix_types:

- update_signatures
- remove_orphans
- add_missing_placeholders

# Proactive mode (suggest doc updates after edits)

# Note: Requires hook to be enabled

proactive_mode: false
proactive_delay: 5000 # milliseconds
