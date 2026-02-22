# Prompt Library Feature

## Overview

The Prompt Library overlay provides a popup interface for browsing and copying prompts from your Obsidian vault directly within the FLOYD CLI. It features markdown rendering, fuzzy search, and seamless integration with Obsidian vault management.

## Features

- **Obsidian Integration**: Automatically detects and loads prompts from your Obsidian vault
- **Markdown Rendering**: Full markdown preview with syntax highlighting
- **Fuzzy Search**: Fast, intelligent search across prompt titles, content, and tags
- **Copy to Clipboard**: One-key copy functionality (Enter key)
- **Keyboard Navigation**: Full keyboard control for browsing and selecting prompts
- **Auto-Detection**: Automatically finds your Obsidian vault if not specified

## Usage

### Opening the Prompt Library

Press **`Ctrl+Shift+P`** while in the CLI to open the Prompt Library overlay.

### Navigation

- **↑/↓ Arrow Keys**: Navigate through the prompt list
- **Type to Search**: Start typing to filter prompts (fuzzy search)
- **Enter**: Copy the selected prompt to clipboard and insert into input field
- **Esc**: Close the overlay

### Prompt Selection

1. Use arrow keys to navigate to a prompt
2. Press Enter to copy it
3. The prompt content will be copied to your clipboard and inserted into the input field
4. The overlay will close automatically

## Obsidian Vault Detection

The Prompt Library automatically searches for your Obsidian vault in these locations:

1. **Registered Vaults**: Vaults registered with FLOYD's VaultManager
2. **Common Locations**:
   - `~/Documents/Obsidian/`
   - `~/Obsidian/`
   - `~/Library/CloudStorage/OneDrive-Personal/Obsidian/` (macOS)

### Manual Vault Path

You can specify a custom vault path when using the component programmatically:

```typescript
<PromptLibraryOverlay
  vaultPath="/path/to/your/vault"
  onClose={() => setShowPromptLibrary(false)}
  onSelect={(prompt) => {
    // Handle selected prompt
  }}
/>
```

## Prompt Format

The Prompt Library reads all `.md` and `.markdown` files from your Obsidian vault. It extracts:

- **Title**: From frontmatter `title:` field or filename
- **Content**: Markdown body (after frontmatter)
- **Tags**: Extracted from `#tag` syntax in content
- **Frontmatter**: YAML frontmatter metadata

### Example Prompt File

```markdown
---
title: Code Review Prompt
tags: [review, code]
---

# Code Review Prompt

Review the following code for:
- Security vulnerabilities
- Performance issues
- Code quality
- Best practices

## Instructions

[Your prompt content here...]
```

## Integration with MainLayout

The Prompt Library is integrated into `MainLayout` and can be controlled via props:

```typescript
<MainLayout
  showPromptLibrary={true}
  promptLibraryVaultPath="/optional/path/to/vault"
  // ... other props
/>
```

## LLM-Managed Obsidian

The Prompt Library is designed to work seamlessly with LLM-managed Obsidian vaults. The LLM can:

1. **Create Prompts**: Use Obsidian vault manager to create new prompt files
2. **Organize Prompts**: Use tags and frontmatter for categorization
3. **Update Prompts**: Modify existing prompts through vault operations
4. **Search Prompts**: Leverage fuzzy search for prompt discovery

### Example: Creating a Prompt via LLM

```typescript
import {createNote} from '../obsidian/md-editor.js';
import {VaultManager} from '../obsidian/vault-manager.js';

const vaultManager = new VaultManager();
await vaultManager.initialize();
const vaultPath = await vaultManager.getActiveVault();

await createNote(
  `${vaultPath}/Prompts/code-review.md`,
  `---
title: Code Review Prompt
tags: [review, code]
---

# Code Review Prompt

Review code for security, performance, and quality issues.
`,
  {tags: ['review', 'code']}
);
```

## Technical Details

### Component Location

- **Overlay Component**: `src/ui/overlays/PromptLibraryOverlay.tsx`
- **Integration**: `src/ui/layouts/MainLayout.tsx`
- **Dependencies**:
  - `fuzzysort` for fuzzy search
  - `ink-markdown` for markdown rendering
  - Obsidian vault manager for vault operations

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Open/Close Prompt Library |
| `↑` | Navigate up |
| `↓` | Navigate down |
| `Enter` | Copy selected prompt |
| `Esc` | Close overlay |
| `Type` | Search prompts |

## Future Enhancements

Potential future improvements:

- [ ] Multi-vault support with vault switching
- [ ] Prompt categories/folders
- [ ] Recent prompts history
- [ ] Favorite prompts
- [ ] Prompt templates with variables
- [ ] Direct editing of prompts from overlay
- [ ] Integration with Obsidian plugins

## Troubleshooting

### Vault Not Found

If the Prompt Library can't find your vault:

1. Check that your vault has a `.obsidian` directory
2. Register your vault with VaultManager:
   ```typescript
   const vaultManager = new VaultManager();
   await vaultManager.initialize();
   await vaultManager.addVault('MyVault', '/path/to/vault');
   ```
3. Or specify the vault path directly via props

### Clipboard Not Working

If copy to clipboard fails:

- The prompt content will be printed to the terminal as a fallback
- You can manually copy from the terminal output
- Ensure clipboard utilities are installed:
  - macOS: `pbcopy` (built-in)
  - Linux: `xclip` (may need installation)
  - Windows: `clip` (built-in)

### Performance Issues

For large vaults with many prompts:

- The Prompt Library loads all prompts on open
- Consider organizing prompts into subfolders
- Use tags for better organization
- Search filtering helps narrow results quickly
