---
name: fix
description: Auto-fix documentation parity issues (with diff preview)
argument-hint: '[--dry-run] [--docs=<path>] [--auto=<type>]'
allowed-tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
---

# /doc-parity:fix

Auto-fix documentation parity issues found by `/doc-parity:check`.

## Safety First

**Always shows diff preview before applying changes.** No modifications happen without user confirmation.

## Usage

```bash
/doc-parity:fix
# Interactive fix with preview for all issues

/doc-parity:fix --dry-run
# Show what would be fixed without making changes

/doc-parity:fix --docs=docs/API.md
# Fix issues in specific doc file

/doc-parity:fix --auto=signatures
# Only auto-fix signature mismatches
```

## What Gets Auto-Fixed

| Issue Type              | Auto-Fixable | Action                               |
| ----------------------- | ------------ | ------------------------------------ |
| Missing exports in docs | Yes          | Add placeholder entry with signature |
| Orphaned doc entries    | Yes          | Remove entries for deleted code      |
| Signature mismatches    | Yes          | Update param names and types         |
| File path references    | No           | Might be intentional aliases         |
| Behavioral descriptions | No           | Requires human judgment              |

## Auto-Fix Types

| `--auto` value | What it fixes                           |
| -------------- | --------------------------------------- |
| `signatures`   | Update function signatures in docs      |
| `orphans`      | Remove doc entries for deleted exports  |
| `placeholders` | Add placeholder entries for new exports |
| `all`          | All of the above (default)              |

## Implementation Steps

1. Run `/doc-parity:check` to identify issues
2. For each fixable issue:
   - Generate the fix (in memory)
   - Show diff preview
   - Ask user to confirm
3. Apply confirmed fixes using `Edit` tool
4. Re-run check to verify

## Diff Preview Format

````diff
--- a/docs/API.md
+++ b/docs/API.md
@@ -45,6 +45,10 @@
 ### deleteUser
 Removes a user account.

+### deleteUserById
+Deletes a user by ID.
+```ts
+(id: string): Promise<void>
+```
+
````

`

## Examples

```bash
# Interactive fix all
/doc-parity:fix

# Preview only
/doc-parity:fix --dry-run

# Fix specific doc file
/doc-parity:fix --docs=docs/Floyd-CLI_SSOT.md
```

## Confirmation Prompt

Before applying fixes, always ask:

```
Found 3 fixable issues:
1. Add missing export: deleteUserById
2. Update signature: createUser (name → username)
3. Remove orphaned entry: deprecatedFunction

Apply these fixes? (yes/no/skip)
```
