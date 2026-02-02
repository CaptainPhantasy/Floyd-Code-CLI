# FLOYD Skills

Build skills for FLOYD CLI development. These skills extend Claude Code's capabilities for specialized FLOYD workflows.

## Available Skills

### CLI-X 2026 (`cli-x-2026.zip`)

**Ink Dashboard plus Agentic UX Best Practices**

Use when adding/altering Ink UI components, implementing streaming updates (LLM tokens, tool logs), designing user flows (command palette, file picker, permissions), establishing UI/state contracts, or improving UX polish.

**Outputs:**
- Dashboard-first layout (no scroll-of-death)
- Agentic streaming UX patterns
- Performance plus accessibility rules
- Fault-tolerant async plus cancellation
- Composable components plus stable contracts

---

### Ink Performance Auditor (`ink-performance-auditor.zip`)

**Performance Critic for Ink CLI Apps with Streaming Events**

Use when streaming output exists (tokens/logs/progress), IPC emits more than 5 events/sec, UI has frequently updating lists, layout changes dynamically, app feels jittery/high CPU, or long sessions occur.

**Outputs:**
- Top throughput failure modes (re-render storms, unbounded buffers, layout churn)
- Measurable performance gates (FPS-ish, max renders/sec, buffer sizes)
- Concrete refactors (batching, throttling, memoization, reducer design)
- Stress-test harness plan

---

### MCP BUILDER (`mcp-builder.zip`)

**MCP Tool Server and Client Builder**

Use when designing or adding a new MCP server (Patch, Runner, Browser, Git), adding tools to existing servers, standardizing tool schemas and safety controls, wiring MCP into a CLI runtime, or creating shared tool contracts.

**Outputs:**
- Tool catalog spec (names, schemas, permissions, rate limits)
- Transport plan (stdio vs HTTP/SSE vs websockets)
- Server blueprint (routing, validation, logging, errors)
- Safety gate (policy, protected paths, allow/deny persistence)
- Test harness (smoke, contract, failure simulations)

---

### Chrome Extension Bridge (`chrome-extension-bridge.zip`)

**Chrome Extension to Local CLI Bridge Builder**

Use when building an extension that triggers local CLI tools (run tests, apply patches, lint, search), showing agent/tool status in the browser, adding one-click repo actions from GitHub/GitLab pages, or establishing secure local authorization.

**Outputs:**
- Architecture choice (Native Messaging vs Local Bridge)
- Threat model plus permission model
- Chrome MV3 extension blueprint
- CLI bridge design (auth handshake, request routing)
- Message contracts and UX flows

## Installing Skills

1. Unzip the skill file:
   ```bash
   unzip skills/cli-x-2026.zip -d ~/.claude/skills/
   ```

2. The skill will be available in Claude Code.

## Using Skills

Invoke a skill by name in your Claude Code conversation:

```
SKILL: CLI-X 2026

Feature: Command Palette
User Goal: Search and execute commands quickly
Runtime Facts: Ink 4.x, Node 20+, macOS
Event Sources: Keyboard input, state changes
Constraints: Must work with keyboard-only interaction
```

## Skill Development

These skills were created using the `skill-creator` skill. To modify or extend them:

1. Extract and edit the `SKILL.md` file
2. Re-package using `skill-creator/scripts/package_skill.py`
3. Update the ZIP file in this directory
