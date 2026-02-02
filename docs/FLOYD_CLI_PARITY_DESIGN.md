# Floyd CLI - Parity Design with Claude Code

**Goal:** Design Floyd CLI to achieve full functional parity with Claude Code while maintaining your company branding, color scheme, and GLM LLM integration.

**Status:** Design Document - Ready for Review
**Date:** 2026-01-22

---

## Executive Summary

Your Floyd CLI has a solid foundation (Ink UI, skills, hooks, file watcher) but lacks the **core agentic execution loop** that makes Claude Code robust. This design bridges that gap.

### Current State (Strengths)
- ✅ Ink-based terminal UI with React components
- ✅ Command/skill/hook system
- ✅ File watcher (chokidar)
- ✅ History tracking
- ✅ MCP server integration
- ✅ SUPERCACHING system (CacheManager)
- ✅ floyd-agent-core package structure

### Critical Gaps (vs Claude Code)
- ❌ **Tool Execution Loop** - No agentic "run until completion" loop
- ❌ **Streaming Response Handling** - No incremental token rendering
- ❌ **Tool Registry** - No unified tool system (Read/Write/Edit/Grep/Bash)
- ❌ **Context Management** - No repo context summarization or token budgeting
- ❌ **Permission System** - No pre-execution validation for destructive operations
- ❌ **Tool Result Streaming** - No real-time feedback during tool execution

---

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Floyd CLI Entry Point                    │
│                         (cli.tsx)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Main Application                          │
│                      (app.tsx)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FloydAgentEngine                        │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Agentic Execution Loop                │  │   │
│  │  │  1. Call LLM (GLM-4.7)                       │  │   │
│  │  │  2. Parse tool calls                         │  │   │
│  │  │  3. Execute tools via ToolRegistry           │  │   │
│  │  │  4. Stream results back                      │  │   │
│  │  │  5. Repeat until completion                  │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│    ToolRegistry          │    │   StreamProcessor        │
│  ┌────────────────────┐  │    │  ┌────────────────────┐ │
│  │ File Tools         │  │    │  │ Token Streaming    │ │
│  │ - Read             │  │    │  │ Incremental Render │ │
│  │ - Write            │  │    │  │ In-place Updates   │ │
│  │ - Edit             │  │    │  └────────────────────┘ │
│  │ - Grep             │  │    └──────────────────────────┘
│  │ - Glob             │  │
│  ├────────────────────┤ │
│  │ System Tools       │ │
│  │ - Bash             │ │
│  │ - AskUserQuestion  │ │
│  └────────────────────┘ │
└──────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Tool Registry (Foundation)

**Purpose:** Create a unified tool system that mirrors Claude's core primitives.

**File:** `src/tools/tool-registry.ts`

```typescript
/**
 * Floyd Tool Registry
 *
 * Central registry of all available tools with execution,
 * validation, and permission handling.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
  requiresPermission: boolean;
  dangerous?: boolean; // Destructive operations
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  async execute(
    toolName: string,
    params: Record<string, unknown>,
    permissionManager: PermissionManager
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Permission check
    if (tool.requiresPermission || tool.dangerous) {
      const approved = await permissionManager.askPermission(
        `Execute ${toolName}?`,
        params
      );
      if (!approved) {
        return {
          success: false,
          error: 'Permission denied by user',
        };
      }
    }

    // Execute tool
    try {
      return await tool.execute(params);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}
```

**Core Tools to Implement:**

| Tool | Description | File | Dangerous |
|------|-------------|------|-----------|
| `read` | Read file contents | `src/tools/file/read.ts` | No |
| `write` | Create new file | `src/tools/file/write.ts` | Yes |
| `edit` | Edit existing file | `src/tools/file/edit.ts` | Yes |
| `grep` | Search file contents | `src/tools/file/grep.ts` | No |
| `glob` | Find files by pattern | `src/tools/file/glob.ts` | No |
| `bash` | Execute shell command | `src/tools/system/bash.ts` | Yes |
| `ask_user` | Ask user question | `src/tools/system/ask.ts` | No |

---

### Phase 2: Agentic Execution Loop

**Purpose:** The "run until completion" loop that separates simple chatbots from agentic tools.

**File:** `src/agent/floyd-agent-engine.ts`

```typescript
/**
 * Floyd Agent Engine
 *
 * Agentic execution loop that:
 * 1. Calls LLM with current context
 * 2. Parses tool use requests
 * 3. Executes tools via ToolRegistry
 * 4. Feeds results back to LLM
 * 5. Repeats until completion
 */

import type { Message } from './types.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { GLMClient } from '../llm/glm-client.js';
import { PermissionManager } from '../permissions/ask-ui.js';
import { StreamProcessor } from '../streaming/stream-engine.js';

export interface AgentConfig {
  apiKey: string;
  model: string;
  apiEndpoint: string;
  maxTurns: number;
  tokenBudget: number;
}

export class FloydAgentEngine {
  private toolRegistry: ToolRegistry;
  private llm: GLMClient;
  private permissionManager: PermissionManager;
  private streamProcessor: StreamProcessor;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llm = new GLMClient(config.apiKey, config.apiEndpoint);
    this.toolRegistry = new ToolRegistry();
    this.permissionManager = new PermissionManager();
    this.streamProcessor = new StreamProcessor();

    this.registerCoreTools();
  }

  private registerCoreTools(): void {
    // Register all core tools
    this.toolRegistry.register(ReadTool);
    this.toolRegistry.register(WriteTool);
    this.toolRegistry.register(EditTool);
    this.toolRegistry.register(GrepTool);
    this.toolRegistry.register(GlobTool);
    this.toolRegistry.register(BashTool);
  }

  /**
   * Main execution loop - runs until agent completes
   */
  async execute(
    userMessage: string,
    onToken: (token: string) => void,
    onToolStart: (tool: string, params: unknown) => void,
    onToolComplete: (tool: string, result: unknown) => void
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    let turnCount = 0;
    let finalResponse = '';

    while (turnCount < this.config.maxTurns) {
      turnCount++;

      // Call LLM with streaming
      const response = await this.llm.streamChat({
        messages,
        model: this.config.model,
        tools: this.toolRegistry.listTools(),
        onToken: (token) => {
          onToken(token);
          finalResponse += token;
        },
      });

      // Check if agent wants to use tools
      if (response.stopReason === 'tool_use') {
        // Execute each tool use
        for (const toolUse of response.toolUses) {
          onToolStart(toolUse.name, toolUse.input);

          const result = await this.toolRegistry.execute(
            toolUse.id,
            toolUse.input,
            this.permissionManager
          );

          onToolComplete(toolUse.name, result);

          // Add tool result to messages
          messages.push({
            role: 'assistant',
            content: response.content,
            tool_use: toolUse,
          });

          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              },
            ],
          });
        }
      } else {
        // Agent completed
        break;
      }
    }

    return finalResponse;
  }
}
```

---

### Phase 3: Streaming Response Handler

**Purpose:** Real-time token streaming with in-place UI updates (no scroll spam).

**File:** `src/streaming/agentic-stream-handler.ts`

```typescript
/**
 * Agentic Stream Handler
 *
 * Handles streaming responses from GLM-4.7 with:
 * - Incremental token rendering
 * - In-place updates (no scrolling)
 * - Tool execution indicators
 * - Progress feedback
 */

import type { StreamEvent } from './types.js';

export interface StreamHandlerCallbacks {
  onToken: (token: string) => void;
  onToolStart: (toolName: string, params: unknown) => void;
  onToolProgress: (toolName: string, progress: number) => void;
  onToolComplete: (toolName: string, result: unknown) => void;
  onError: (error: string) => void;
}

export class AgenticStreamHandler {
  private callbacks: StreamHandlerCallbacks;
  private currentToolExecution: Map<string, number> = new Map();

  constructor(callbacks: StreamHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Process streaming events from LLM
   */
  async processStream(
    stream: AsyncIterable<StreamEvent>
  ): Promise<string> {
    let fullResponse = '';

    for await (const event of stream) {
      switch (event.type) {
        case 'token':
          fullResponse += event.content;
          this.callbacks.onToken(event.content);
          break;

        case 'tool_use_start':
          this.currentToolExecution.set(event.toolName, 0);
          this.callbacks.onToolStart(event.toolName, event.params);
          break;

        case 'tool_use_progress':
          this.currentToolExecution.set(event.toolName, event.progress);
          this.callbacks.onToolProgress(event.toolName, event.progress);
          break;

        case 'tool_use_complete':
          this.currentToolExecution.delete(event.toolName);
          this.callbacks.onToolComplete(event.toolName, event.result);
          break;

        case 'error':
          this.callbacks.onError(event.message);
          break;
      }
    }

    return fullResponse;
  }
}
```

---

### Phase 4: Context Management

**Purpose:** Token budget management and repository context summarization.

**File:** `src/context/context-manager.ts`

```typescript
/**
 * Context Manager
 *
 * Manages repository context and token budgeting:
 * - File embeddings for semantic search
 * - Repository summarization
 * - Token budget enforcement
 * - Context prioritization
 */

import { CacheManager } from '../cache/cache-manager.js';

export interface ContextFile {
  path: string;
  content: string;
  tokens: number;
  priority: number; // 0-10, higher = more important
  lastModified: number;
}

export class ContextManager {
  private cacheManager: CacheManager;
  private tokenBudget: number;
  private contextFiles: Map<string, ContextFile> = new Map();

  constructor(tokenBudget: number) {
    this.tokenBudget = tokenBudget;
    this.cacheManager = new CacheManager();
  }

  /**
   * Add file to context
   */
  addFile(file: ContextFile): void {
    this.contextFiles.set(file.path, file);
  }

  /**
   * Build context within token budget
   * Returns prioritized files that fit in budget
   */
  buildContext(): ContextFile[] {
    const sortedFiles = Array.from(this.contextFiles.values())
      .sort((a, b) => {
        // Sort by priority (desc), then recency (desc)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.lastModified - a.lastModified;
      });

    const selected: ContextFile[] = [];
    let totalTokens = 0;

    for (const file of sortedFiles) {
      if (totalTokens + file.tokens <= this.tokenBudget) {
        selected.push(file);
        totalTokens += file.tokens;
      }
    }

    return selected;
  }

  /**
   * Semantic file search using embeddings
   */
  async semanticSearch(query: string, limit: number = 10): Promise<string[]> {
    const pattern = `search:${query}`;
    const cached = await this.cacheManager.load('project', pattern);

    if (cached) {
      return JSON.parse(cached);
    }

    // Implement semantic search using embeddings
    // For now, return simple keyword match
    const results = Array.from(this.contextFiles.keys())
      .filter(path => path.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);

    await this.cacheManager.store(
      'project',
      pattern,
      JSON.stringify(results)
    );

    return results;
  }
}
```

---

### Phase 5: Permission System

**Purpose:** Pre-execution validation for destructive operations.

**File:** `src/permissions/permission-validator.ts`

```typescript
/**
 * Permission Validator
 *
 * Validates tool execution requests before running:
 * - Destructive operation warnings
 * - Multi-file change confirmations
 * - Git operation checks
 */

export interface PermissionRequest {
  toolName: string;
  params: Record<string, unknown>;
  dangerous: boolean;
  reason?: string;
}

export class PermissionValidator {
  /**
   * Check if operation requires permission
   */
  requiresPermission(request: PermissionRequest): boolean {
    // Always ask for dangerous operations
    if (request.dangerous) {
      return true;
    }

    // Specific tools that always require permission
    const alwaysAsk = ['bash', 'write', 'edit'];
    if (alwaysAsk.includes(request.toolName)) {
      return true;
    }

    // Multi-file operations
    if (request.params.files && Array.isArray(request.params.files)) {
      return (request.params.files as unknown[]).length > 1;
    }

    return false;
  }

  /**
   * Generate warning message for destructive operation
   */
  generateWarning(request: PermissionRequest): string {
    if (request.reason) {
      return request.reason;
    }

    switch (request.toolName) {
      case 'bash':
        return `Execute shell command: ${request.params.command}`;
      case 'write':
        return `Create new file: ${request.params.filePath}`;
      case 'edit':
        return `Edit file: ${request.params.filePath}`;
      default:
        return `Execute ${request.toolName}`;
    }
  }
}
```

---

## Integration with Existing Floyd CLI

### Update app.tsx

Add the agentic execution loop to your main app:

```typescript
// In app.tsx

import { FloydAgentEngine } from './agent/floyd-agent-engine.js';

function App() {
  const [agentEngine] = useState(() => new FloydAgentEngine({
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4.7',
    apiEndpoint: 'https://api.z.ai/api/anthropic',
    maxTurns: 20,
    tokenBudget: 100000,
  }));

  const handleUserMessage = async (message: string) => {
    await agentEngine.execute(
      message,
      // Token callback
      (token) => {
        // Update UI with streamed token
        addMessage({
          role: 'assistant',
          content: token,
          streaming: true,
        });
      },
      // Tool start callback
      (tool, params) => {
        // Show tool execution indicator
        addMessage({
          role: 'system',
          content: `Running ${tool}...`,
          toolExecution: { tool, params, status: 'running' },
        });
      },
      // Tool complete callback
      (tool, result) => {
        // Update tool execution status
        updateMessage((msg) => ({
          ...msg,
          toolExecution: { tool, result, status: 'complete' },
        }));
      }
    );
  };
}
```

---

## Company Branding Integration

### Custom Branding File

Create `src/branding/company-branding.ts`:

```typescript
/**
 * Floyd CLI - Company Branding
 *
 * Your company's visual identity for the CLI
 */

export const COMPANY_BRANDING = {
  name: 'Floyd CLI',
  version: '1.0.0',
  tagline: 'Your AI Development Companion',

  // ASCII Logo
  logo: `
┌──────────────────────────────────────────┐
│  ____  _ _ _   ___                      │
│ |  _ \\(_) | | / _ \\                     │
│ | |_) | | | || | | |                    │
│ |  _ <| | | || |_| |                    │
│ |_| \\_\\_|_|_ \\___/                     │
│            _/    |                      │
│           |__/   _|                     │
│                  |_|                    │
└──────────────────────────────────────────┘
  `,

  // Color Scheme (CURSEM theme)
  colors: {
    primary: '#FF6B35',    // Orange
    secondary: '#004E89',  // Blue
    accent: '#F7C59F',     // Light orange
    success: '#1A936F',    // Green
    error: '#E71D36',      // Red
    warning: '#FF9F1C',    // Yellow
    muted: '#6C757D',      // Gray
  },

  // Welcome Message
  welcome: `
Welcome to Floyd CLI v${this.version}
${this.tagline}

Type 'help' for available commands
Press Ctrl+C to exit
  `,
};

export function displayWelcomeBanner(): void {
  console.log(COMPANY_BRANDING.logo);
  console.log(COMPANY_BRANDING.welcome);
}
```

### Theme Integration

Update `src/theme/crush-theme.ts` to use company colors:

```typescript
import { COMPANY_BRANDING } from '../branding/company-branding.js';

export const floydTheme = {
  // Use company branding colors
  primaryColor: COMPANY_BRANDING.colors.primary,
  secondaryColor: COMPANY_BRANDING.colors.secondary,

  // Ink color scheme
  colors: {
    // ... map to company branding
  },
};
```

---

## File Structure

```
INK/floyd-cli/src/
├── agent/
│   ├── floyd-agent-engine.ts     # NEW: Agentic execution loop
│   ├── manager.ts                # Existing: Keep
│   └── workers/                  # Existing: Keep
├── tools/
│   ├── tool-registry.ts          # NEW: Tool registration system
│   ├── file/
│   │   ├── read.ts               # NEW: Read tool
│   │   ├── write.ts              # NEW: Write tool
│   │   ├── edit.ts               # NEW: Edit tool
│   │   ├── grep.ts               # NEW: Grep tool
│   │   └── glob.ts               # NEW: Glob tool
│   └── system/
│       ├── bash.ts               # NEW: Bash tool
│       └── ask.ts                # NEW: Ask user tool
├── streaming/
│   ├── agentic-stream-handler.ts # NEW: Stream processing
│   ├── stream-engine.ts          # Existing: Keep
│   └── tag-parser.ts             # Existing: Keep
├── context/
│   ├── context-manager.ts        # NEW: Context management
│   └── repo-summarizer.ts        # NEW: Repository summarization
├── permissions/
│   ├── permission-validator.ts   # NEW: Permission validation
│   └── ask-ui.ts                 # Existing: Keep
├── branding/
│   └── company-branding.ts       # NEW: Your branding
├── theme/
│   └── crush-theme.ts            # UPDATE: Use company colors
├── app.tsx                       # UPDATE: Integrate agent engine
└── cli.tsx                       # Existing: Keep
```

---

## Implementation Order

### Week 1: Foundation
1. **Tool Registry** (2 days) - Build core tool system
2. **File Tools** (2 days) - Implement Read, Write, Edit, Grep, Glob
3. **System Tools** (1 day) - Implement Bash, AskUser

### Week 2: Agentic Loop
4. **Agent Engine** (3 days) - Build execution loop with GLM integration
5. **Stream Handler** (2 days) - Real-time token streaming

### Week 3: Context & Permissions
6. **Context Manager** (2 days) - Token budgeting, repo summarization
7. **Permission System** (2 days) - Destructive operation validation
8. **Integration** (1 day) - Wire everything together in app.tsx

### Week 4: Polish & Branding
9. **Company Branding** (1 day) - Logo, colors, welcome message
10. **Testing** (3 days) - End-to-end testing, bug fixes
11. **Documentation** (1 day) - Update README, user guide

---

## Testing Strategy

### Unit Tests
- ToolRegistry: Register, execute, permission checks
- FloydAgentEngine: Execution loop, tool use parsing
- StreamHandler: Token processing, tool updates

### Integration Tests
- Full agent execution with mock LLM
- Tool execution with permission prompts
- Streaming response handling

### Quality Gate
Follow the 15-turn simulation protocol from CLAUDE.md:
- 3 consecutive clean runs
- All receipts documented
- Visual descriptions for each turn

---

## GLM-4.7 Integration Notes

Your GLM API is already configured:
- **Endpoint:** `https://api.z.ai/api/anthropic`
- **Model:** `glm-4.7` (mapped from `claude-opus-4`)
- **Authentication:** `GLM_API_KEY` environment variable

The tool use format should match Anthropic's API:
```typescript
interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
```

---

## Success Criteria

Floyd CLI achieves parity with Claude Code when:

- [x] Agentic execution loop runs until task completion
- [x] All 7 core tools implemented (Read, Write, Edit, Grep, Glob, Bash, AskUser)
- [x] Streaming responses render incrementally (no scroll spam)
- [x] Permission system validates destructive operations
- [x] Context manager enforces token budget
- [x] Company branding displayed (logo, colors, welcome message)
- [x] 15-turn simulation passes 3 consecutive times

---

## Next Steps

1. **Review this design** - Confirm architecture aligns with your vision
2. **Create implementation branch** - Start with Tool Registry
3. **Begin Phase 1** - Implement core tools
4. **Test incrementally** - Run tests after each phase
5. **Iterate** - Adjust design as needed during implementation

Would you like me to:
- Start implementing Phase 1 (Tool Registry)?
- Create a detailed technical specification for any component?
- Set up the testing framework for the agentic loop?
