# 🚨 AGENT FILE FIX PROTOCOL

## When You See This Error:
```
Attribute '// something...' is not supported in VS Code agent files.
Supported: argument-hint, description, handoffs, infer, model, name, target, tools.
```

## ALWAYS Follow These Steps:

### 1. Identify the Problem
The error indicates **invalid YAML frontmatter** in a `.agent.md` file.

### 2. Extract Multi-Line Comments
Look for lines starting with `//` in the frontmatter. These are **NOT valid YAML attributes**.

### 3. Convert to Proper Format

**❌ WRONG:**
```yaml
---
name: agent-name
// Comment line 1
// Comment line 2
// Comment line 3
description: Short desc
---
```

**✅ CORRECT:**
```yaml
---
name: agent-name
description: >
  Comment line 1. Comment line 2. Comment line 3.
  
  Short desc
---
```

### 4. Use YAML Multiline Syntax

For long descriptions, use `>` (folded) or `|` (literal):

```yaml
description: >
  This will be folded into a single paragraph.
  Newlines become spaces.
  
  Empty lines create paragraph breaks.
```

```yaml
description: |
  This preserves line breaks exactly.
  Every line break is kept.
  Use for code or formatted text.
```

## Quick Fix Commands

### Option 1: Auto-Fix (Recommended)
```bash
npm run validate:agents:fix
```

### Option 2: Manual Fix
1. Read the file
2. Extract frontmatter
3. Convert comments to description
4. Remove unsupported attributes
5. Write back

### Option 3: Use Tool
```typescript
import { fixAgentFile } from '.claude-plugin/validators/agent-file-validator.js';

const result = await fixAgentFile('path/to/agent.md');
console.log(result.changes);
```

## Valid Attributes Reference

| Attribute | Type | Example |
|-----------|------|---------|
| `name` | string | `name: my-agent` |
| `description` | string | `description: > \n  Long text` |
| `model` | string | `model: opus` |
| `argument-hint` | string | `argument-hint: '<query>'` |
| `tools` | array | `tools: [tool1, tool2]` |
| `handoffs` | array | `handoffs: [agent1]` |
| `target` | string | `target: system` |
| `infer` | boolean | `infer: true` |

## Common Mistakes to Avoid

### ❌ Don't use comment syntax
```yaml
// This is a comment
# This is a YAML comment (use sparingly)
```

### ❌ Don't add custom attributes
```yaml
version: 2.0        # Not supported
author: John        # Not supported
custom: value       # Not supported
```

### ❌ Don't forget quotes for special characters
```yaml
description: This has: colons  # ❌ Will break
description: "This has: colons"  # ✅ Works
```

## Examples

### Example 1: Multi-Line Comment Conversion

**Before:**
```yaml
---
name: MicroSaaS Validator
// v2 — Market-Validated AI Opportunity Analyzer
// are experts in micro-SaaS research, particularly focusing on AI-first products.
// The custom agent described in the Markdown document is a Micro-SaaS Product Researcher
description: 'Describe what this custom agent does...'
---
```

**After:**
```yaml
---
name: MicroSaaS Validator
description: >
  v2 — Market-Validated AI Opportunity Analyzer designed to assist experts in 
  micro-SaaS research, particularly focusing on AI-first products. This custom 
  agent is a Micro-SaaS Product Researcher that delivers vetted, build-ready 
  AI tool concepts.
model: opus
---
```

### Example 2: Removing Unsupported Attributes

**Before:**
```yaml
---
name: code-reviewer
version: 1.0.0
author: DevTeam
created: 2024-01-01
category: development
description: Reviews code
---
```

**After:**
```yaml
---
name: code-reviewer
description: >
  Reviews code. Version 1.0.0 by DevTeam.
  Created: 2024-01-01. Category: development.
---
```

## Decision Tree

```
Error: Unsupported attribute
    ↓
Is it a comment (//) ?
    ↓ YES
    Extract content → Add to description
    ↓
    ↓ NO
    ↓
Is it metadata (version, author)?
    ↓ YES
    Move to description or remove
    ↓
    ↓ NO
    ↓
Custom attribute?
    ↓ YES
    Remove or document in body
    ↓
Done
```

## Testing Your Fix

After fixing, always validate:
```bash
npm run validate:agents
```

Or for specific file:
```bash
npx tsx .claude-plugin/bin/validate-agents.ts check --file=path/to/agent.md
```

## Need More Help?

See: [.claude-plugin/docs/AGENT_FILE_VALIDATION.md](.claude-plugin/docs/AGENT_FILE_VALIDATION.md)
