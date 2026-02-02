# FLOYD PROMPT SYSTEM — Modular, Layered, Claude-Compatible

## Architecture

This system is modeled after Claude Code's prompt layering: multiple components that compose into a final system prompt.

## Folder Structure

```
.floyd-prompts/
├── identity/          # Who Floyd is
│   ├── core.md        # Base identity, ONENESS principle
│   └── turns.md       # Turn management protocol
│
├── tools/            # What Floyd can do (50 tools)
│   ├── file.md        # File operations (7)
│   ├── search.md      # Search operations (2)
│   ├── git.md         # Git operations (9)
│   ├── cache.md       # SUPERCACHE (12)
│   ├── system.md      # System operations (3)
│   ├── browser.md     # Browser automation (9)
│   ├── patch.md       # Patch operations (5)
│   └── special.md     # Special ops (3)
│
├── policies/         # Safety & security
│   └── safety.md      # Permissions, bash policy, error handling
│
├── modes/            # Execution mode overrides
│   ├── ask.md         # Step-by-step confirmation
│   ├── yolo.md        # Auto-approve safe tools
│   ├── plan.md        # Read-only analysis
│   ├── auto.md        # Adaptive based on complexity
│   ├── dialogue.md    # Quick chat mode
│   └── fuckit.md      # All permissions granted
│
└── output-styles/    # Response formatting
    └── default.md     # Standard output format
```

## Prompt Assembly Order

The final prompt is assembled in this order (highest priority at bottom):

1. Identity → Who you are
2. Tools → What you can do
3. Policies → Safety & rules
4. Mode → Current behavior
5. Output Style → How to respond
6. Project Context → FLOYD.md (if exists)

## Usage

These files are for **reference and customization**. The actual prompts used by Floyd are compiled from these templates into:

- `src/prompts/system/` — Default (minimal)
- `src/prompts/floyd47/` — GLM-4.7 optimized
- `src/prompts/hardened/` — 5-layer hardened
- `src/prompts/claude-style/` — Claude-compatible

To customize:
1. Edit the `.floyd-prompts/*.md` files
2. Rebuild the prompt in `src/prompts/`
3. Or create your own variant in a new folder

## Tool Count Summary

| Category | Tools |
|----------|-------|
| File | 7 |
| Search | 2 |
| Git | 9 |
| Cache | 12 |
| System | 3 |
| Browser | 9 |
| Patch | 5 |
| Special | 3 |
| **TOTAL** | **50** |
