# Agent File Validation System

Automatically validate and fix VS Code agent file format to prevent errors like:
```
Attribute '// are experts in...' is not supported in VS Code agent files.
Supported: argument-hint, description, handoffs, infer, model, name, target, tools.
```

## Quick Start

### 1. Check Agent Files
```bash
npx tsx .claude-plugin/bin/validate-agents.ts check
```

### 2. Preview Fixes
```bash
npx tsx .claude-plugin/bin/validate-agents.ts fix --dry-run
```

### 3. Apply Fixes
```bash
npx tsx .claude-plugin/bin/validate-agents.ts fix
```

### 4. Watch for Changes (Development)
```bash
npx tsx .claude-plugin/bin/validate-agents.ts watch
```

## How It Works

### Validation Rules

VS Code agent files MUST follow this format:

```yaml
---
name: agent-name              # Required: Agent identifier
description: >                # Optional: Multiline description using YAML >
  Long description here
  spanning multiple lines
model: opus                   # Optional: Model preference
argument-hint: '<args>'       # Optional: CLI usage hint
tools:                        # Optional: Allowed tools list
  - tool1
  - tool2
handoffs:                     # Optional: Agent handoff targets
  - agent1
target: system                # Optional: Target system
infer: true                   # Optional: Inference mode
---

# Agent Body

Markdown content goes here...
```

### What Gets Fixed

| Issue | Fix |
|-------|-----|
| Missing frontmatter | Adds YAML frontmatter block |
| Multi-line comments as attributes | Converts to proper `description` |
| Unsupported attributes | Removes or moves to description |
| Invalid YAML syntax | Reports error (requires manual fix) |
| Missing `name` attribute | Adds name from filename |
| Comment-style description | Converts to proper markdown |

## Integration Methods

### Method 1: VS Code Command (Recommended)

Use the `/fix-agents` command in your chat:

```
/fix-agents
/fix-agents --file=.claude/agents/my-agent.md
/fix-agents --dry-run
```

### Method 2: Git Pre-Commit Hook

Install the hook to validate automatically before each commit:

```bash
# Copy hook
cp .claude-plugin/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Or use Git config (applies to all repos)
git config core.hooksPath .claude-plugin/hooks
```

Now agent files are validated automatically:
```bash
$ git commit -m "Update agent"
🔍 Validating agent files...
  Checking .claude/agents/my-agent.md...
  ✗ .claude/agents/my-agent.md - validation failed
❌ 1 agent file(s) failed validation
💡 Run: npx tsx .claude-plugin/bin/validate-agents.ts fix --file=<path>
   Or bypass with: git commit --no-verify
```

### Method 3: CI/CD Pipeline

Add to your CI config (e.g., `.github/workflows/validate.yml`):

```yaml
name: Validate Agent Files
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g tsx
      - run: npx tsx .claude-plugin/bin/validate-agents.ts check
```

### Method 4: VS Code Extension (Future)

Create a VS Code extension that validates on save:

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "floyd.validateAgentsOnSave": {
          "type": "boolean",
          "default": true,
          "description": "Validate agent files on save"
        }
      }
    }
  }
}
```

## Common Scenarios

### Scenario 1: Invalid Multi-Line Comment

**Error:**
```
Attribute '// are experts in micro-SaaS research...' is not supported
```

**Fix:**
```bash
npx tsx .claude-plugin/bin/validate-agents.ts fix --file=.claude/agents/micro-saas-validator.md
```

**Before:**
```yaml
---
name: MicroSaaS Validator
// v2 — Market-Validated AI Opportunity Analyzer
// are experts in micro-SaaS research
---
```

**After:**
```yaml
---
name: MicroSaaS Validator
description: >
  v2 — Market-Validated AI Opportunity Analyzer designed to assist experts
  in micro-SaaS research, particularly focusing on AI-first products.
---
```

### Scenario 2: Unsupported Attributes

**Before:**
```yaml
---
name: my-agent
version: 2.0
author: John Doe
custom-field: value
---
```

**After:**
```yaml
---
name: my-agent
description: Version 2.0 by John Doe
---
```

### Scenario 3: Missing Name

**Before:**
```yaml
---
description: An agent that does stuff
---
```

**After:**
```yaml
---
name: my-agent
description: An agent that does stuff
---
```

## Architecture

```
.claude-plugin/
├── validators/
│   └── agent-file-validator.ts    # Core validation logic
├── bin/
│   └── validate-agents.ts         # CLI interface
├── hooks/
│   └── pre-commit                 # Git hook
└── commands/
    └── fix-agents.md              # VS Code command definition
```

### Core Functions

```typescript
// Validate single file
const result = await validateAgentFile('path/to/agent.md');

// Validate directory
const results = await validateAgentDirectory('.claude/agents');

// Auto-fix file
const fix = await fixAgentFile('path/to/agent.md', dryRun);

// Format results for display
const output = formatValidationResults(results);
```

## Supported Attributes Reference

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ Yes | Unique agent identifier |
| `description` | string | No | Agent description (use YAML `>` for multiline) |
| `model` | string | No | Preferred model: `opus`, `sonnet`, `haiku` |
| `argument-hint` | string | No | CLI usage hint: `'<query>'` |
| `tools` | array | No | List of allowed tools |
| `handoffs` | array | No | List of agents this can hand off to |
| `target` | string | No | Target system identifier |
| `infer` | boolean | No | Enable inference mode |

## Troubleshooting

### Issue: Validation not running in pre-commit

**Solution 1:** Make hook executable
```bash
chmod +x .git/hooks/pre-commit
```

**Solution 2:** Check hook path
```bash
git config core.hooksPath
# Should show: .claude-plugin/hooks
```

**Solution 3:** Verify tsx is installed
```bash
npm install -g tsx
```

### Issue: False positives

If validator incorrectly flags valid YAML:

1. Check YAML syntax with online validator
2. Ensure proper indentation (2 spaces)
3. Quote strings with special characters
4. Use `>` or `|` for multiline strings

### Issue: Can't fix automatically

Some issues require manual intervention:

- Invalid YAML syntax (mismatched quotes, bad indentation)
- Complex nested structures
- Domain-specific attribute meanings

## Configuration

Add to `package.json` for project-wide settings:

```json
{
  "floyd": {
    "agentValidation": {
      "enabled": true,
      "autoFix": false,
      "directories": [".claude/agents", ".floyd/agents"],
      "strictMode": true
    }
  }
}
```

## Development

### Run Tests
```bash
npm test -- agent-file-validator
```

### Add Custom Rules
Edit `.claude-plugin/validators/agent-file-validator.ts`:

```typescript
// Add new supported attribute
const SUPPORTED_ATTRIBUTES = [
  'argument-hint',
  'description',
  // ... existing
  'my-custom-attribute'  // Add here
] as const;
```

### Debug Validation
```bash
DEBUG=agent-validator npx tsx .claude-plugin/bin/validate-agents.ts check
```

## Best Practices

1. **Always validate before commit**
   - Use pre-commit hook or manual check

2. **Use YAML multiline syntax for long descriptions**
   ```yaml
   description: >
     Long description
     spanning lines
   ```

3. **Keep descriptions focused**
   - Use body content for detailed docs
   - Frontmatter = metadata only

4. **Test agent files after changes**
   ```bash
   npx tsx .claude-plugin/bin/validate-agents.ts check --file=path/to/agent.md
   ```

5. **Review auto-fixes**
   - Always check `--dry-run` first
   - Verify description accuracy after fix

## Related Documentation

- [VS Code Agent API](https://code.visualstudio.com/api/references/agent-api)
- [YAML Specification](https://yaml.org/spec/)
- [Floyd Agent System](.floyd/docs/agent-system.md)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review [Common Scenarios](#common-scenarios)
3. File issue with validation output
