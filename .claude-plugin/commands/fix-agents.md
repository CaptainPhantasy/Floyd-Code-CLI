---
name: fix-agents
description: Auto-fix VS Code agent file format issues
argument-hint: '[--dry-run] [--file=<path>]'
allowed-tools: ['Read', 'Write', 'Edit']
---

# /fix-agents

Auto-detect and fix VS Code agent file format issues.

## What This Fixes

VS Code agent files (`.agent.md`) must follow a specific YAML frontmatter format. This command automatically:

1. **Validates frontmatter syntax** - Ensures proper YAML structure
2. **Removes unsupported attributes** - Only allows: `name`, `description`, `model`, `argument-hint`, `tools`, `handoffs`, `target`, `infer`
3. **Converts comment-style text** - Moves multi-line comments into proper description
4. **Adds missing required fields** - Ensures `name` attribute exists

## Common Issues Fixed

### ❌ Invalid: Multi-line comment as attribute
```markdown
---
name: my-agent
// This is v2 of the agent
// It does many things
description: Agent description
---
```

### ✅ Fixed: Proper YAML format
```markdown
---
name: my-agent
description: >
  This is v2 of the agent. It does many things.
  
  Agent description
---
```

### ❌ Invalid: Unsupported attributes
```markdown
---
name: my-agent
version: 2.0
author: John Doe
custom-field: value
---
```

### ✅ Fixed: Only supported attributes
```markdown
---
name: my-agent
description: Version 2.0 by John Doe
---
```

## Usage

```bash
# Check all agent files
/fix-agents

# Check specific file
/fix-agents --file=.claude/agents/my-agent.md

# Preview changes without applying
/fix-agents --dry-run

# Auto-fix all issues
/fix-agents --apply
```

## Integration Rules

When you encounter an error like:
```
Attribute '// are experts in...' is not supported in VS Code agent files.
Supported: argument-hint, description, handoffs, infer, model, name, target, tools.
```

**Always**:
1. Extract the multi-line comment content
2. Incorporate it into the `description` field using YAML multiline syntax
3. Remove the invalid attribute
4. Validate the result

## Example Transformation

**Before** (Invalid):
```markdown
---
name: MicroSaaS Validator  
// v2 — Market-Validated AI Opportunity Analyzer
// are experts in micro-SaaS research, particularly focusing on AI-first products.
// The custom agent described in the Markdown document is a Micro-SaaS Product Researcher
description: 'Describe what this custom agent does...'
---
```

**After** (Valid):
```markdown
---
name: MicroSaaS Validator
description: >
  v2 — Market-Validated AI Opportunity Analyzer designed to assist experts in 
  micro-SaaS research, particularly focusing on AI-first products. This custom 
  agent is a Micro-SaaS Product Researcher that delivers vetted, build-ready 
  AI tool concepts with proof of market demand, verified price points, 
  competitive gaps, and feasibility for a 40-hour MVP.
model: opus
---
```

## Validation Schema

```typescript
interface VSCodeAgentFrontmatter {
  // Required
  name: string;
  
  // Optional
  description?: string;       // Use YAML multiline (> or |) for long text
  model?: 'opus' | 'sonnet' | 'haiku';
  'argument-hint'?: string;   // CLI usage hint
  tools?: string[];           // Allowed tool list
  handoffs?: string[];        // Agent handoff targets
  target?: string;            // Target system
  infer?: boolean;            // Inference mode
}
```

## Safety

- **Always shows diff preview** before applying changes
- **Creates backup** with `.bak` extension
- **Preserves body content** - Only fixes frontmatter
- **Dry-run by default** - Requires `--apply` flag for changes

## Implementation

This command uses the agent file validator at:
```
.claude-plugin/validators/agent-file-validator.ts
```

Which can also be run standalone:
```bash
npx tsx .claude-plugin/bin/validate-agents.ts check
npx tsx .claude-plugin/bin/validate-agents.ts fix --dry-run
```
