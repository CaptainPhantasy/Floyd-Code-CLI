# FLOYD GOD TIER AGENT - Complete Architecture

**Purpose:** Provider-agnostic AI agent system for Solo Developer at Legacy AI
**Created:** 2026-01-28
**Status:** PRODUCTION - Last night's breakthrough (Floyd writing code successfully)

---

## The Core Breakthrough

**What makes it work:**
1. **Lean Core Architecture** - 5 always-on files, no contradictory instructions
2. **RESTRICTIONS DISABLED** - Auto-approved tools in execution engine
3. **Provider-Agnostic Client** - OpenAI-compatible SSE format
4. **Unlimited Turns** - No artificial limits on agent execution

---

## Table of Contents

1. [Lean Core Prompt System](#lean-core-prompt-system)
2. [Provider-Agnostic Design](#provider-agnostic-design)
3. [All Supported Vendors](#all-supported-vendors)
4. [Execution Engine](#execution-engine)
5. [CLI Flags & Configuration](#cli-flags--configuration)
6. [Mode System](#mode-system)
7. [Tool Router](#tool-router)
8. [Quick Start](#quick-start)

---

## Lean Core Prompt System

### The 5 Always-On Files (Loaded Every Turn)

| File | Purpose | Location |
|------|---------|----------|
| **SYSTEM_CORE.md** | Identity + Non-negotiables + Turn shape | `/GLM-47-SUGGESTED/SYSTEM_CORE.md` |
| **MODES.md** | Truthful mode definitions | `/GLM-47-SUGGESTED/MODES.md` |
| **TOOL_ROUTER.md** | Deterministic routing spine | `/GLM-47-SUGGESTED/TOOL_ROUTER.md` |
| **VERIFY_INVARIANTS.md** | Hard verification invariants | `/GLM-47-SUGGESTED/VERIFY_INVARIANTS.md` |
| **CONTEXT_BUDGET.md** | Context rules + pack loading | `/GLM-47-SUGGESTED/CONTEXT_BUDGET.md` |

### The 4 On-Demand Packs (Load Only When Needed)

| Pack | Trigger | Location |
|------|---------|----------|
| **FORMAT.md** | Need formatting guidance | `/GLM-47-SUGGESTED/packs/FORMAT.md` |
| **TOOLS_50.md** | Need tool signatures | `/GLM-47-SUGGESTED/packs/TOOLS_50.md` |
| **PATTERNS.md** | Common workflows | `/GLM-47-SUGGESTED/packs/PATTERNS.md` |
| **EXAMPLES.md** | Canonical walkthroughs | `/GLM-47-SUGGESTED/packs/EXAMPLES.md` |

### Assembly Order (Exact Sequence)

```typescript
const ALWAYS_ON = [
  systemCore,      // "You are Floyd-Flash..."
  modes,           // "Current mode: YOLO"
  toolRouter,      // "Use this exact routing..."
  verifyInvariants, // "Any state change MUST be verified"
  contextBudget,   // "Never assume repo fits in context"
  toolsRef,        // Quick 50-tool reference
  workingContext,  // Working directory + timestamp
].join('\n\n---\n\n');
```

**No contradictory layers. No conflicting instructions. No YOLO ambiguity.**

---

## Provider-Agnostic Design

### The Universal API Contract

All providers must support OpenAI-compatible format:

```typescript
interface FloydProvider {
  // Connection
  readonly apiKey: string;
  readonly apiEndpoint: string;
  readonly model: string;

  // Streaming (OpenAI-compatible SSE format)
  async *streamChat(options: {
    messages: Array<{ role: string; content: string }>;
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
  }): AsyncGenerator<StreamEvent>;

  // Required StreamEvent types
  // { type: 'token', content: string }
  // { type: 'tool_use', toolUse: { id, name, input } }
  // { type: 'done', content: '' }
  // { type: 'error', error: string }
}
```

### Request Format (Universal)

```typescript
const body = {
  model: this.model,           // Configurable per provider
  messages: messages.map(m => ({
    role: m.role,
    content: m.content
  })),
  tools: tools.length > 0 ? tools : undefined,
  max_tokens: maxTokens,
  temperature,
  stream: true,
};

// Standard Bearer auth
headers: {
  'Authorization': `Bearer ${this.apiKey}`,
  'Content-Type': 'application/json',
}
```

---

## All Supported Vendors

### Configuration Table

| Provider | Endpoint | Model | Notes |
|----------|----------|-------|-------|
| **Zai/GLM** (DEFAULT) | `https://api.z.ai/api/coding/paas/v4` | `glm-4-plus` | GLM MAX Coding subscription - Daily driver |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o` | Direct |
| **Anthropic** | `https://api.anthropic.com/v1` | `claude-opus-4` | Via adapter |
| **xAI/GROK** | `https://api.x.ai/v1` | `grok-beta` | OpenAI-compatible |
| **QWEN/Alibaba** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-coding-plus` | OpenAI-compatible |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-coder` | OpenAI-compatible |
| **Moonshot/KIMI** | `https://api.moonshot.cn/v1` | `moonshot-v1-128k` | OpenAI-compatible |
| **Mistral** | `https://api.mistral.ai/v1` | `codestral-latest` | OpenAI-compatible |
| **Google/Gemini** | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash-exp` | Via adapter |
| **Local/Ollama** | `http://localhost:11434/v1` | `llama3` | Local hosting |

### Provider Configuration Examples

```bash
# Zai/GLM (Default - GLM MAX Coding subscription)
GLM_API_KEY=sk-xxxxx
GLM_API_ENDPOINT=https://api.z.ai/api/coding/paas/v4
GLM_MODEL=glm-4-plus

# OpenAI
OPENAI_API_KEY=sk-xxxxx
OPENAI_API_ENDPOINT=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Anthropic (via adapter)
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_API_ENDPOINT=https://api.anthropic.com/v1
ANTHROPIC_MODEL=claude-opus-4

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxxx
DEEPSEEK_API_ENDPOINT=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-coder

# Moonshot/KIMI
KIMI_API_KEY=sk-xxxxx
KIMI_API_ENDPOINT=https://api.moonshot.cn/v1
KIMI_MODEL=moonshot-v1-128k
```

---

## Execution Engine

### The Critical Breakthrough: RESTRICTIONS DISABLED

From `/floyd-wrapper-main/src/agent/execution-engine.ts` line 421-522:

```typescript
// ====================================================================
// RESTRICTIONS DISABLED - All tools auto-approved
// ====================================================================
// Mode-based Permission Logic - DISABLED
// let permissionGranted = false;

// Auto-approve ALL tools - restrictions disabled
logger.info(`[PERMIT] ${toolName}:${target} - AUTO-APPROVED (RESTRICTIONS DISABLED)`);
```

### What This Enables

| Feature | Status | Note |
|---------|--------|------|
| Permission dialogs | DISABLED | No asking for tool approval |
| Turn limits | DISABLED | `while (true)` - unlimited execution |
| Working directory restrictions | DISABLED | Can operate anywhere |
| Auto-checkpoints | DISABLED | No overhead |
| Tool approval | AUTO | Every tool approved in every mode |

### The Agentic Loop

```typescript
while (true) {  // NO TURN LIMIT
  // 1. Call LLM with streaming
  const stream = this.glmClient.streamChat({
    messages: this.history.messages,
    tools: this.buildToolDefinitions(),
  });

  // 2. Process stream, collect tokens and tool calls
  const result = await this.processStream(stream);

  // 3. Add assistant message to history
  this.history.messages.push({
    role: 'assistant',
    content: result.assistantMessage,
  });

  // 4. Check for completion (no tool use = done)
  if (result.toolResults.length === 0) {
    break;  // Agent finished
  }

  // 5. Execute tools and feed results back
  for (const toolResult of result.toolResults) {
    this.history.messages.push({
      role: 'tool',
      content: JSON.stringify(toolResult.result),
    });
  }

  // 6. Continue to next turn
}
```

---

## CLI Flags & Configuration

### All Available Flags

```bash
$ floyd --help

Options:
  --debug       Enable debug logging
  --tui         Launch full TUI mode (Ink-based UI)
  --bridge      Start mobile bridge server
  --resume      Resume specific session (id or name)
  --mode        Set initial execution mode (ask, yolo, plan, auto, dialogue)
  --flash       Use Flash mode (glm-4-flash - fast & cheap)
  --floyd47     Use Floyd 4.7 GLM-optimized prompt
  --claude      Use Claude-style prompt
  --hardened    Use hardened prompt system
  --no-reasoning Disable reasoning for simple tasks (GLM-4.7 optimization)
  --force       Override instance lock (use with caution)
  --version     Show version number
```

### Prompt Style Priority (Highest to Lowest)

1. **SUGGESTED** (Lean Core) - `--suggested` flag
2. **Flash** (Fast & Cheap) - `--flash` flag
3. **Floyd 4.7** (GLM Optimized) - `--floyd47` flag
4. **Claude Style** (Parity) - `--claude` flag
5. **Hardened** (Security) - `--hardened` flag
6. **System** (Fallback) - Default

### Environment Configuration

```bash
# .env or .env.local

# Provider Selection (default: glm)
FLOYD_PROVIDER=glm

# API Credentials
FLOYD_API_KEY=sk-xxxxxxxxxxxx
FLOYD_API_ENDPOINT=https://api.z.ai/api/coding/paas/v4
FLOYD_MODEL=glm-4-plus

# Execution Mode
FLOYD_MODE=yolo  # ask, yolo, plan, auto, dialogue, fuckit

# Optional Settings
FLOYD_MAX_TURNS=100
FLOYD_TEMPERATURE=1.0
FLOYD_MAX_TOKENS=8192
```

---

## Mode System

### All Available Modes

| Mode | Permissions | Best For |
|------|-------------|----------|
| **ASK** (default) | Confirm dangerous tools | Careful work, learning |
| **YOLO** | Auto-approve standard dev loop | Active coding, fast iteration |
| **PLAN** | Read-only | Analysis, architecture |
| **AUTO** | Adaptive | Unknown scope |
| **DIALOGUE** | No tools | Chat only |
| **FUCKIT** | All permissions | Trusted environments |

### Mode Permission Matrix

| Tool | ASK | YOLO | PLAN | AUTO | FUCKIT |
|------|-----|------|------|------|--------|
| read_file | ✓ | ✓ | ✓ | ✓ | ✓ |
| write/edit | ⚠️ | ✓ | ✗ | ⚠️ | ✓ |
| delete_file | ⚠️ | ⚠️ | ✗ | ⚠️ | ✓ |
| git_commit | ⚠️ | ✓ | ✗ | ⚠️ | ✓ |
| git_merge | ⚠️ | ⚠️ | ✗ | ⚠️ | ✓ |
| run (test) | ⚠️ | ✓ | ✗ | ⚠️ | ✓ |

Legend:
- ✓ = Auto-approved
- ⚠️ = Requires confirmation
- ✗ = Blocked

---

## Tool Router

### Deterministic Routing Spine

```markdown
## DISCOVERY
- Concept search => codebase_search
- Exact identifiers/literals => grep
- After any hit => read_file the owning file(s)

## EDIT LOOP (single file)
read_file => edit_file/write => verify(file_contains) => run(test) => verify

## MULTI-FILE CHANGE
impact_simulate => safe_refactor => verify => run(tests) => verify

## GIT
git_status => git_diff => git_stage => run(tests) => verify => git_commit

## BATCHING RULES
- Batch: reads + searches only
- Never batch: edits/writes, commits
```

### The 50-Tool Suite

| Category | Count | Key Tools |
|----------|-------|-----------|
| File Operations | 7 | read_file, write, edit_file, delete_file |
| Search | 2 | codebase_search, grep |
| Git | 9 | git_status, git_commit, git_merge |
| SUPERCACHE | 12 | cache_store, cache_retrieve, cache_store_pattern |
| System | 3 | run, ask_user, fetch |
| Browser | 9 | browser_navigate, browser_read_page |
| Patch | 5 | apply_unified_diff, edit_range |
| Special | 3 | verify, safe_refactor, impact_simulate |

---

## Quick Start

### 1. Install Dependencies

```bash
cd /Volumes/Storage/FLOYD_CLI/floyd-wrapper-main
npm install
npm run build
npm link
```

### 2. Configure API Key

```bash
# Edit .env or .env.local
echo "GLM_API_KEY=sk-your-key-here" >> .env
echo "FLOYD_MODE=yolo" >> .env
```

### 3. Launch Floyd

```bash
# Default mode
floyd

# Fast + autonomous
floyd --flash --mode yolo

# Full TUI
floyd --tui

# With different provider
FLOYD_PROVIDER=openai OPENAI_API_KEY=sk-xxx floyd
```

### 4. Verify Installation

```bash
floyd --version
floyd --help
```

---

## Key Implementation Files

| File | Purpose | Lines |
|------|---------|-------|
| `/floyd-wrapper-main/src/prompts/suggested/index.ts` | Lean Core assembly | 276 |
| `/floyd-wrapper-main/src/agent/execution-engine.ts` | Agentic loop | 965 |
| `/floyd-wrapper-main/src/llm/glm-client.ts` | GLM API client | 574 |
| `/floyd-wrapper-main/src/cli.ts` | CLI entry point | 400+ |
| `/GLM-47-SUGGESTED/*.md` | Lean Core markdown files | - |

---

## For Solo Developer at Legacy AI

### Recommended Configuration

```bash
# .env for daily driving
GLM_API_KEY=your-glm-max-key
FLOYD_MODE=yolo
FLOYD_PROVIDER=glm

# Daily driver command
floyd --flash --mode yolo
```

### What This Gives You

1. **Autonomous Coding** - Floyd writes code without asking
2. **Fast Iteration** - Flash mode for speed
3. **Verification** - Every state change is verified
4. **Provider Flexibility** - Switch vendors anytime
5. **No Artificial Limits** - Unlimited turns, full autonomy

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-28 | Initial GOD TIER documentation - Post-breakthrough |
| 2026-01-27 | SUGGESTED prompt system + RESTRICTIONS DISABLED |
| 2026-01-26 | Provider-agnostic client implementation |

---

## Support

**Project Root:** `/Volumes/Storage/FLOYD_CLI/`
**CLI Location:** `floyd-wrapper-main/`
**Prompts:** `GLM-47-SUGGESTED/`

**For issues:** Check `/GLM-47-SUGGESTED/README.md` for troubleshooting

---

**Built for Solo Developer at Legacy AI**
**Default Provider: Zai/GLM (GLM MAX Coding subscription)**
