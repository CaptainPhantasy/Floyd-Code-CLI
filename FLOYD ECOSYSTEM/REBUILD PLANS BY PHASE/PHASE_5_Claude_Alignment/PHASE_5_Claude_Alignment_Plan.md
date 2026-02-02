# PHASE 5: CLAUDE SYSTEM ALIGNMENT

**RISK**: MEDIUM to LOW (mostly new features, minimal breaking changes)
**TIME**: 8-10 days
**ITEMS**: 14 (22-35)
**STRATEGY**: Add missing Claude Desktop/Code/Cowork parity features while preserving FLOYD innovations

> **Overview**: FLOYD has 60 tools (exceeds Claude's ~50), but lacks key Claude features in plugin ecosystem, hooks, multi-agent orchestration, and CLI UX. This phase adds parity items while maintaining FLOYD's unique advantages (SUPERCACHE, Sandbox, Impact Simulation).

---

## AUDIT TRAIL

| Item | ID | Priority | Status | Files |
|------|-----|----------|--------|-------|
| Hooks System | 22 | P0 | TODO | floyd-wrapper-main/src/hooks/* |
| Agent Frontmatter Support | 23 | P0 | TODO | floyd-wrapper-main/src/agents/* |
| /plan Mode | 24 | P0 | TODO | floyd-wrapper-main/src/modes/plan-mode.ts |
| LSP Tool | 25 | P1 | TODO | floyd-wrapper-main/src/tools/lsp/* |
| /pr Command | 26 | P1 | TODO | floyd-wrapper-main/src/commands/pr.ts |
| Enhanced /permissions Command | 27 | P2 | TODO | floyd-wrapper-main/src/commands/permissions.ts |
| Thinking Mode Toggle | 28 | P2 | TODO | INK/floyd-cli/src/prompts/thinking-prompt.ts |
| Ctrl+G External Editor | 29 | P2 | TODO | INK/floyd-cli/src/ui/components/Input.tsx |
| /context Command | 30 | P2 | TODO | floyd-wrapper-main/src/commands/context.ts |
| NotebookEdit Tool | 31 | P3 | TODO | floyd-wrapper-main/src/tools/notebook/* |
| Vim Mode Enhancement | 32 | P3 | TODO | INK/floyd-cli/src/ui/vim/vim-mode.ts |
| Ctrl+R History Search | 33 | P3 | TODO | INK/floyd-cli/src/ui/history/history-search.tsx |
| Session Folders | 34 | P3 | TODO | floyd-wrapper-main/src/sessions/session-folder.ts |
| MCP Resource Mentions | 35 | P3 | TODO | FloydDesktopWeb/server/mcp/resource-parser.ts |

---

## ITEM 22: Hooks System (P0 - HIGH PRIORITY)

**Problem**: No lifecycle event hooks for custom behavior injection. Claude supports SessionStart, PreToolUse, PostToolUse, PermissionRequest, Stop events.

**Root Cause**: Missing hooks architecture entirely.

**Files** (NEW):
- `floyd-wrapper-main/src/hooks/types.ts`
- `floyd-wrapper-main/src/hooks/hook-manager.ts`
- `floyd-wrapper-main/src/hooks/builtin-handlers.ts`

**Implementation**:
```typescript
// floyd-wrapper-main/src/hooks/types.ts
export type HookEvent =
  | 'SessionStart'     // When session begins
  | 'SessionEnd'       // When session ends
  | 'PreToolUse'       // Before tool execution
  | 'PostToolUse'      // After tool execution
  | 'PermissionRequest'// When permission needed
  | 'Stop';            // On interrupt

export interface Hook {
  event: HookEvent;
  command?: string;    // Command to execute
  handler?: string;    // Handler name (built-in)
  timeout?: number;    // Max execution time (ms)
  enabled: boolean;
}

// .floyd/hooks.json schema
interface HooksConfig {
  hooks: Hook[];
}

// floyd-wrapper-main/src/hooks/hook-manager.ts
export class HookManager {
  private hooks: Map<HookEvent, Hook[]> = new Map();

  async execute(event: HookEvent, context: HookContext): Promise<void> {
    const eventHooks = this.hooks.get(event) || [];
    for (const hook of eventHooks) {
      if (!hook.enabled) continue;
      if (hook.command) {
        await this.executeCommand(hook.command, context);
      } else if (hook.handler) {
        await this.executeBuiltin(hook.handler, context);
      }
    }
  }

  loadFromFile(path: string): void {
    // Load .floyd/hooks.json
  }
}
```

**Built-in Handlers**: auto_approve_safe_commands, log_tool_use, etc.

**Verification**:
1. Create .floyd/hooks.json with test hook
2. Trigger SessionStart event, verify command runs
3. Test PreToolUse with permission override
4. Verify timeout enforcement

---

## ITEM 23: Agent Frontmatter Support (P0 - HIGH PRIORITY)

**Problem**: No markdown frontmatter-based agent definitions. Claude supports .md files with YAML frontmatter for custom agents.

**Root Cause**: Agent system uses programmatic definitions only.

**Files**:
- `floyd-wrapper-main/src/agents/frontmatter-loader.ts` (NEW)
- `floyd-wrapper-main/src/agents/agent-registry.ts` (MODIFY)
- `.floyd/agents/` (NEW directory)

**Implementation**:
```yaml
# .floyd/agents/code-reviewer.md
---
description: Expert code reviewer with security focus
model: glm-4.7
permissionMode: auto-allow
allowedTools:
  - Read
  - Grep
  - Bash
skills:
  - security/analysis
  - refactoring/patterns
context:
  fork: true
  once: false
---

You are a security-focused code reviewer. Analyze code for:
1. OWASP Top 10 vulnerabilities
2. Performance issues
3. Code smell and anti-patterns
```

```typescript
// frontmatter-loader.ts
export function loadAgentFromMarkdown(path: string): AgentDefinition {
  const content = fs.readFileSync(path, 'utf-8');
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) throw new Error('No frontmatter found');

  const frontmatter = parseYaml(match[1]);
  const instructions = content.slice(match[0].length).trim();

  return {
    name: path.split('/').pop()?.replace('.md', '') || 'unknown',
    ...frontmatter,
    instructions
  };
}
```

**Verification**:
1. Create .floyd/agents/test-agent.md
2. Invoke via @test-agent in CLI
3. Verify permission mode applied
4. Verify tool restrictions enforced

---

## ITEM 24: /plan Mode (P0 - HIGH PRIORITY)

**Problem**: No dedicated planning mode with separate subagent. Claude has /plan that generates detailed step-by-step plans before execution.

**Root Cause**: No planning mode architecture.

**Files**:
- `floyd-wrapper-main/src/modes/plan-mode.ts` (NEW)
- `floyd-wrapper-main/src/commands/plan.ts` (NEW)
- `INK/floyd-cli/src/prompts/plan-prompt.ts` (NEW)

**Implementation**:
```typescript
// plan-mode.ts
export class PlanMode {
  async enter(userGoal: string): Promise<PlanExecutionResult> {
    // Generate plan using planning-focused prompt
    const plan = await this.generatePlan(userGoal);

    // Present plan with formatted display
    this.displayPlan(plan);

    // Wait for user approval
    const approved = await this.waitForApproval();

    if (approved) {
      return this.executePlan(plan);
    } else {
      return { status: 'cancelled', plan };
    }
  }

  private async generatePlan(goal: string): Promise<Plan> {
    // Use planning-specific prompt with faster model
    const planPrompt = this.buildPlanPrompt(goal);
    // Request structured plan with dependencies
  }
}

interface Plan {
  goal: string;
  steps: PlanStep[];
  estimatedTime: string;
  risks: string[];
}

interface PlanStep {
  id: string;
  description: string;
  dependencies: string[];
  files: string[];
  tools: string[];
}
```

**CLI Integration**:
```bash
floyd plan "Add user authentication to the app"
# Generates plan, shows for approval, executes on yes
```

**Verification**:
1. Test plan generation for simple task
2. Verify plan displays with dependencies
3. Test approval flow (yes/cancel)
4. Test plan execution after approval

---

## ITEM 25: LSP Tool (P1 - MEDIUM PRIORITY)

**Problem**: No code intelligence via LSP (go-to-definition, find references, hover). Claude has LSP integration.

**Root Cause**: Missing LSP client integration.

**Files**:
- `floyd-wrapper-main/src/tools/lsp/lsp-client.ts` (NEW)
- `floyd-wrapper-main/src/tools/lsp/lsp-tools.ts` (NEW)

**Implementation**:
```typescript
// lsp-client.ts
import { createLspConnection } from 'lsp-client';

export class LSPTool {
  private connections: Map<string, LspConnection> = new Map();

  async gotoDefinition(filePath: string, line: number, column: number): Promise<Location[]> {
    const lang = this.getLanguage(filePath);
    const conn = this.getConnection(lang);
    return conn.sendRequest('textDocument/definition', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }

  async findReferences(filePath: string, line: number, column: number): Promise<Location[]> {
    const conn = this.getConnection(this.getLanguage(filePath));
    return conn.sendRequest('textDocument/references', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }

  async hover(filePath: string, line: number, column: number): Promise<Hover> {
    const conn = this.getConnection(this.getLanguage(filePath));
    return conn.sendRequest('textDocument/hover', {
      textDocument: { uri: filePath },
      position: { line, character: column }
    });
  }
}
```

**Tool Definitions**: lsp_goto_definition, lsp_find_references, lsp_hover, lsp_symbols, lsp_rename

**Verification**:
1. Start LSP server for TypeScript
2. Test goto definition on function call
3. Test find references
4. Verify results are accurate

---

## ITEM 26: /pr Command (P1 - MEDIUM PRIORITY)

**Problem**: No GitHub PR creation command. Claude has /pr for workflow integration.

**Root Cause**: Missing PR command implementation.

**Files**:
- `floyd-wrapper-main/src/commands/pr.ts` (NEW)
- `floyd-wrapper-main/src/git/github-client.ts` (NEW)

**Implementation**:
```typescript
// pr.ts
export async function createPR(options: {
  title: string;
  body?: string;
  branch?: string;
  base?: string;
}): Promise<PRResult> {
  const gh = new GitHubClient();
  const currentBranch = await gitCurrentBranch();

  const pr = await gh.createPullRequest({
    title: options.title,
    body: `${options.body || ''}\n\nCo-Authored-By: FLOYD <noreply@floyd.ai>`,
    head: options.branch || currentBranch,
    base: options.base || 'main'
  });

  // Open in browser for review
  await open(pr.html_url);

  return { url: pr.html_url, number: pr.number };
}
```

**CLI Usage**: `floyd pr "Fix authentication bug" --body "Resolves #123"`

**Verification**:
1. Create test branch
2. Run floyd pr command
3. Verify PR created on GitHub
4. Verify Co-Authored-By footer present

---

## ITEM 27: Enhanced /permissions Command (P2 - MEDIUM PRIORITY)

**Problem**: Basic permissions exist but no full management UI. Claude has rich /permissions command.

**Root Cause**: Incomplete permission CLI.

**Files**:
- `floyd-wrapper-main/src/commands/permissions.ts` (MODIFY)
- `INK/floyd-cli/src/permissions/permission-cli.tsx` (NEW)

**Implementation**:
```typescript
export const permissionsCommand = {
  description: 'Manage permission rules',
  subcommands: {
    '': 'Show all permission rules',
    'add <rule>': 'Add new permission rule',
    'remove <rule>': 'Remove permission rule',
    'test <tool>': 'Test what permission would apply',
    'mode <auto|ask|yolo>': 'Set permission mode',
    'list': 'List all rules with scopes'
  }
};
```

**Enhanced Wildcards**:
```typescript
const PATTERNS = {
  'Bash(npm *)': (args) => args.command?.startsWith('npm '),
  'Bash(git * main)': (args) => args.command?.includes(' main'),
  'Read(*.ts)': (args) => args.file_path?.endsWith('.ts'),
  'Grep(src/**/*.ts)': (args) => args.path?.startsWith('src/'),
};
```

**Verification**:
1. Test /permissions displays all rules
2. Test /permissions add with wildcard pattern
3. Test /permissions test with various tools
4. Verify patterns match correctly

---

## ITEM 28: Thinking Mode Toggle (P2 - MEDIUM PRIORITY)

**Problem**: No quick toggle for extended reasoning mode. Claude has Alt+T for thinking mode.

**Root Cause**: Thinking mode requires prompt modification, no UI toggle.

**Files**:
- `INK/floyd-cli/src/prompts/thinking-prompt.ts` (NEW)
- `INK/floyd-cli/src/ui/input/shortcuts.ts` (MODIFY)

**Implementation**:
```typescript
// thinking-prompt.ts
export function withThinkingMode(basePrompt: string): string {
  return `${basePrompt}

**THINKING MODE ENABLED**
Before each action, think step-by-step:
1. What do I want to accomplish?
2. What tools do I need?
3. What are the potential risks?
4. How will I verify success?

Show your reasoning for complex decisions.
`;
}

// shortcuts.ts - Add Alt+T handler
useInput((input, key) => {
  if (key.alt && key.name === 't') {
    toggleThinkingMode();
    renderStatus(`Thinking mode: ${thinkingMode ? 'ON' : 'OFF'}`);
  }
});
```

**Verification**:
1. Press Alt+T in CLI
2. Verify status updates
3. Test agent behavior with thinking on/off
4. Verify reasoning appears in output

---

## ITEM 29: Ctrl+G External Editor (P2 - MEDIUM PRIORITY)

**Problem**: No way to edit input in external editor. Claude has Ctrl+G for $EDITOR.

**Root Cause**: Missing editor integration.

**Files**:
- `INK/floyd-cli/src/ui/components/Input.tsx` (MODIFY)

**Implementation**:
```typescript
useInput((input, key) => {
  if (key.ctrlG) {
    const editor = process.env.EDITOR || 'vim';
    const tmpFile = `/tmp/floyd-input-${Date.now()}.txt`;
    fs.writeFileSync(tmpFile, input);

    try {
      spawnSync(editor, [tmpFile], { stdio: 'inherit' });
      const edited = fs.readFileSync(tmpFile, 'utf-8');
      setInput(edited);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  }
});
```

**Verification**:
1. Type some text, press Ctrl+G
2. Verify editor opens with text
3. Edit and save
4. Verify CLI input updated

---

## ITEM 30: /context Command (P2 - MEDIUM PRIORITY)

**Problem**: No visibility into token usage and context composition. Claude has /context breakdown.

**Root Cause**: Missing context tracking and reporting.

**Files**:
- `floyd-wrapper-main/src/commands/context.ts` (NEW)
- `floyd-wrapper-main/src/utils/context-tracker.ts` (NEW)

**Implementation**:
```typescript
export interface ContextBreakdown {
  total_tokens: number;
  max_tokens: number;
  used_percentage: number;
  breakdown: {
    system_prompt: number;
    conversation: number;
    tools: number;
    files: number;
    mcp_servers: number;
  };
  suggestions: string[];
}

export function getContextBreakdown(): ContextBreakdown {
  const systemPrompt = countTokens(currentSystemPrompt());
  const conversation = countTokens(messages.map(m => m.content));
  const tools = countTokens(JSON.stringify(enabledTools));
  const files = countTokens(includedFiles.map(f => f.content));
  const mcp = countTokens(mcpServerContexts);

  const total = systemPrompt + conversation + tools + files + mcp;
  const max = getMaxTokens();
  const percentage = (total / max) * 100;

  return {
    total_tokens: total,
    max_tokens: max,
    used_percentage: percentage,
    breakdown: { system_prompt, conversation, tools, files, mcp_servers: mcp },
    suggestions: generateSuggestions(percentage)
  };
}
```

**CLI Output**:
```
CONTEXT BREAKDOWN
=================
Total: 45,000 / 200,000 tokens (22.5%)

Breakdown:
  System prompt:    1,200 tokens (0.6%)
  Conversation:    28,000 tokens (14.0%)
  Tools:            5,000 tokens (2.5%)
  Files:            8,000 tokens (4.0%)
  MCP servers:      3,000 tokens (1.5%)

Suggestions:
  ✅ Context is healthy
```

**Verification**:
1. Run /context with empty session
2. Add messages, run again
3. Include files, verify breakdown updates
4. Test suggestions appear at threshold

---

## ITEM 31: NotebookEdit Tool (P3 - LOW PRIORITY)

**Problem**: No Jupyter notebook support. Claude has NotebookEdit tool.

**Root Cause**: Missing notebook format handling.

**Files**:
- `floyd-wrapper-main/src/tools/notebook/notebook-tools.ts` (NEW)

**Verification**: Create .ipynb, read cells, edit cell, insert new cell

---

## ITEM 32: Vim Mode Enhancement (P3 - LOW PRIORITY)

**Problem**: Limited Vim keybindings. Claude has full vi mode.

**Root Cause**: Incomplete Vim motion implementation.

**Files**:
- `INK/floyd-cli/src/ui/vim/vim-mode.ts` (NEW)
- `INK/floyd-cli/src/ui/components/Input.tsx` (MODIFY)

**Motions**: w, b, e, 0, $, gg, G, dd, yy, p, u, ctrl+r, v, V, /, ?, n, N

---

## ITEM 33: Ctrl+R History Search (P3 - LOW PRIORITY)

**Problem**: No command history search. Claude has Ctrl+R for interactive search.

**Root Cause**: Missing history search UI.

**Files**:
- `INK/floyd-cli/src/ui/history/history-search.tsx` (NEW)

---

## ITEM 34: Session Folders (P3 - LOW PRIORITY)

**Problem**: No organization of sessions by project/folder. Claude supports session folders.

**Root Cause**: Flat session storage.

**Files**:
- `floyd-wrapper-main/src/sessions/session-folder.ts` (NEW)
- `floyd-wrapper-main/src/sessions/session-manager.ts` (MODIFY)

---

## ITEM 35: MCP Resource Mentions (P3 - LOW PRIORITY)

**Problem**: No @resource:// syntax for MCP resources. Claude supports resource mentions.

**Root Cause**: Missing resource mention parsing.

**Files**:
- `FloydDesktopWeb/server/mcp-client.ts` (MODIFY)
- `FloydDesktopWeb/server/mcp/resource-parser.ts` (NEW)

**Usage Examples**:
```
@github://anthropic/claude-code/issues/123
@postgres://query/SELECT * FROM users
@gdrive://document/1ABC...
```

---

## DEPENDENCIES

| Depends On | Item | Reason |
|------------|------|--------|
| Item 22 | 23 | Agent frontmatter uses hooks |
| Item 22 | 24 | Planning mode uses hooks |

## PRESERVE FLOYD ADVANTAGES

- SUPERCACHE 3-tier memory (no changes)
- Sandbox + Checkpoint/Rewind (no changes)
- Impact Simulation (no changes)
- Safe Refactor (no changes)

---

**Phase 5 Status**: TODO (0/14 complete)
