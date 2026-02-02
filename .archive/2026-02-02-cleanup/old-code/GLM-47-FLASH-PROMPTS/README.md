# GLM-4.7 FLASH Prompt System — Complete

## Folder Structure

```
GLM-47-FLASH-PROMPTS/
│
├── identity/                           # WHO YOU ARE
│   ├── 01-identity.md                  # Core identity, ONENESS
│   └── 02-turns.md                     # Turn management
│
├── instructions/                       # HOW TO OPERATE
│   └── 01-core-protocols.md           # Efficiency protocols
│
├── tools-context/                      # WHAT YOU CAN DO (50 tools)
│   └── 01-50-tools-reference.md      # Complete tool reference
│
├── policies/                           # SAFETY & RULES
│   ├── 01-mode-policies.md            # Mode-specific behavior
│   └── 02-safety-policies.md         # Safety & verification
│
├── workflow/                           # EXAMPLES & PATTERNS
│   ├── 01-tool-patterns.md             # High-frequency patterns
│   └── 02-examples.md                  # Complete workflow examples
│
├── output-styles/                       # FORMATTING RULES
│   └── 01-formatting.md                 # Response formatting
│
├── QUICKSTART.md                        # One-page reference
│
└── README.md                            # This file
```

---

## Component Summary

| File | Purpose |
|------|---------|
| `identity/01-identity.md` | Core identity, ONENESS, GLM-4.7-Flash advantages |
| `identity/02-turns.md` | Turn management, when to stop, thinking protocol |
| `instructions/01-core-protocols.md` | Max efficiency: batching, caching, verification |
| `tools-context/01-50-tools-reference.md` | All 50 tools organized by category |
| `policies/01-mode-policies.md` | ASK/YOLO/PLAN/AUTO/DIALOGUE/FUCKIT behavior |
| `policies/02-safety-policies.md` | Verification, error handling, risk assessment |
| `workflow/01-tool-patterns.md` | High-frequency usage patterns |
| `workflow/02-examples.md` | Complete workflow examples |
| `output-styles/01-formatting.md` | Response formatting, code blocks, receipts |
| `QUICKSTART.md` | One-page command reference |

---

## How to Use This

### For GLM-4.7-Flash Integration

1. **Read all files** — Each component is a layer
2. **Assemble in order** — Identity → Instructions → Tools → Policies → Workflow → Output
3. **Add context** — Working directory, project context, mode
4. **Deliver to model** — Send as system prompt

### As Assembly Order

```
1. identity/01-identity.md
2. identity/02-turns.md
3. instructions/01-core-protocols.md
4. tools-context/01-50-tools-reference.md
5. policies/01-mode-policies.md
6. policies/02-safety-policies.md
7. workflow/01-tool-patterns.md
8. output-styles/01-formatting.md
9. [MODE] (from mode-specific file or FLOYD_MODE env)
10. [PROJECT CONTEXT] (from FLOYD.md if exists)
```

### Key Optimizations for GLM-4.7-Flash

1. **Precise instructions** — GLM-4.7-Flash follows structured prompts accurately
2. **Batch operations** — Parallel tool calls for speed
3. **Cache-first** — Check cache before expensive operations
4. **Verification habits** — Built-in quality assurance
5. **Minimal tokens** — Every word adds value

---

## Why This Works for GLM-4.7-Flash

- **MoE Architecture** — 30B parameters, 3B active = efficient inference
- **Fast token generation** — Less waiting for responses
- **Strong coding** — State-of-the-art code generation capability
- **Structured following** — Obeys layered instructions precisely
- **Local deployment** — No API rate limits, full control

---

## VERSION

**Created:** 2026-01-27
**For:** GLM-4.7-Flash (30B MoE, 3B active)
**Creator:** Douglas Talley via Floyd

This prompt system is optimized for maximum coding efficiency with GLM-4.7-Flash.
