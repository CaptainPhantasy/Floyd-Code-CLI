# Claude Platforms Features & Architecture Reference
**As of Late January 2026**

Comprehensive analysis of Claude Desktop, Claude Code CLI, and Claude Cowork capabilities, implementation methods, and architectural patterns.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Claude Desktop](#claude-desktop)
3. [Claude Code CLI](#claude-code-cli)
4. [Claude Cowork](#claude-cowork)
5. [Shared Architectural Patterns](#shared-architectural-patterns)
6. [MCP (Model Context Protocol)]#mcp-model-context-protocol)
7. [Comparison Matrix](#comparison-matrix)

---

## Platform Overview

### The Three Platforms

| Platform | Target User | Primary Environment | Release Status |
|----------|-------------|---------------------|----------------|
| **Claude Desktop** | General consumers, knowledge workers | macOS/Windows desktop app | Stable, actively developed |
| **Claude Code** | Developers, engineers | Terminal/CLI, IDE extensions | v2.1.12 (Jan 2026) |
| **Claude Cowork** | Non-technical users | Claude Desktop macOS | Launched Jan 12, 2026 |

### Key Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANTHROPIC CLAUDE ECOSYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  Claude Desktop │──▶ │   Claude Cowork │    │              │ │
│  │  (macOS/Windows)│    │   (Embedded)    │    │              │ │
│  └────────┬────────┘    └─────────────────┘    │              │ │
│           │                                      │              │ │
│           │  MCP Protocol                       │              │ │
│           ▼                                      │              │ │
│  ┌─────────────────┐                             │              │ │
│  │  Claude Code    │◀───────────────────────────┘              │ │
│  │  (CLI/IDE)      │                                            │ │
│  └─────────────────┘                                            │ │
│                                                                  │ │
│  Shared: MCP Extension System (.mcpb), Auth, Session Management │ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Claude Desktop

### Platform Capabilities

#### 1. Conversational AI Interface
- **Natural Language Chat**: Core chat interface with Claude models (Opus 4.5, Sonnet 4.5, Haiku 4.5)
- **Multi-Model Selection**: Switch between models based on task complexity
- **Conversation History**: Persistent chat history across sessions
- **Attachment Support**: Images, PDFs, documents, code files

#### 2. MCP Extension System (.mcpb)
- **One-Click Installation**: Double-click `.mcpb` files to install extensions
- **Built-in Runtime**: Ships with Node.js runtime (no external dependencies)
- **Automatic Updates**: Extensions update automatically
- **Secure Secret Storage**: API keys stored in OS keychain
- **Extension Directory**: Curated marketplace of extensions

#### 3. Claude Cowork Integration (macOS)
- **Folder Access**: Grant Claude access to local folders
- **Autonomous File Operations**: Read, edit, create files independently
- **Extended Autonomy**: Multi-step task execution without constant intervention
- **Sub-Agent Architecture**: Break down complex tasks into coordinated operations

#### 4. Cross-Platform Features
- **Desktop App**: Native macOS and Windows applications
- **Sync Across Devices**: Conversations sync to claude.ai
- **Multi-Modal**: Text, images, code, documents
- **Artifact Support**: Interactive previews of generated content

### Implementation Details

#### Desktop Extension Architecture (.mcpb Format)

```typescript
// Extension Structure (ZIP Archive)
extension.mcpb
├── manifest.json         // Required: Metadata and configuration
├── server/               // MCP server implementation
│   └── index.js         // Entry point
├── node_modules/         // Bundled dependencies
├── package.json          // NPM package definition
└── icon.png             // Optional: Extension icon

// Minimal manifest.json
{
  "mcpb_version": "0.1",
  "name": "my-extension",
  "version": "1.0.0",
  "description": "A simple MCP extension",
  "author": {
    "name": "Extension Author"
  },
  "server": {
    "type": "node",           // "node" | "python" | "binary"
    "entry_point": "server/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["${__dirname}/server/index.js"],
      "env": {
        "API_KEY": "${user_config.api_key}"
      }
    }
  },
  "user_config": {
    "api_key": {
      "type": "string",
      "title": "API Key",
      "sensitive": true,
      "required": true
    }
  }
}
```

#### User Configuration Flow

1. **User downloads** `.mcpb` file
2. **Double-clicks** to open with Claude Desktop
3. **Claude Desktop**:
   - Validates manifest
   - Displays configuration UI for required fields
   - Stores sensitive data in OS keychain
   - Replaces template variables at runtime
4. **Extension runs** in isolated process with stdio MCP transport

#### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DESKTOP EXTENSION SECURITY                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Action     │ Extension Process    │ OS Keychain           │
│  ──────────────  │ ───────────────────  │ ──────────────        │
│  • Approve       │ • Isolated runtime    │ • Secure storage      │
│    install       │ • stdio transport     │ • No plaintext keys   │
│  • Configure     │ • Limited permissions │ • OS-managed          │
│    permissions   │ • Timeout enforcement │ • Per-bundle vault    │
│                  │                        │                       │
│  Enterprise Controls:                                               │
│  • Group Policy (Windows) / MDM (macOS)                           │
│  • Pre-approved extension lists                                   │
│  • Blocklist enforcement                                          │
│  • Private extension directory support                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### What Makes It Work

| Component | Technology Pattern | Purpose |
|-----------|-------------------|---------|
| **Electron/Tauri** | Desktop framework | Cross-platform UI |
| **stdio Transport** | MCP standard | Server communication |
| **Keychain Integration** | OS API | Secure credential storage |
| **Manifest Schema** | JSON validation | Extension discovery & config |
| **Node.js Runtime** | Bundled with app | Dependency-free execution |
| **OAuth 2.1 + PKCE** | Authentication | Third-party service auth |

---

## Claude Code CLI

### Platform Capabilities

#### Core Features (v2.1.12, January 2026)

**1. Agentic Coding**
- Build features from natural language descriptions
- Debug issues with automated root cause analysis
- Navigate any codebase with semantic understanding
- Automate tedious tasks (linting, merge conflicts, release notes)

**2. Multi-Environment Support**
| Environment | Features |
|-------------|----------|
| **Terminal** | Core CLI, REPL mode, pipe support |
| **VS Code** | Inline diffs, @-mentions, plan review |
| **JetBrains IDEs** | PyCharm, IntelliJ, WebStorm integration |
| **Web (claude.ai/code)** | Cloud sessions, no local setup |
| **GitHub Actions** | `@claude` mentions in CI/CD |
| **Slack** | Route tasks to Claude Code |

**3. Tool System** (50+ Built-in Tools)
```
File Operations:     Read, Write, Glob, Edit
Code Navigation:     Grep, LSP (go-to-definition, find references)
Terminal:           Bash, background commands (Ctrl+B)
Git:                Commit, push, PR creation, diff
Web:                WebSearch, WebFetch
Images:             Screenshot paste, analysis
PDFs:               Read and extract content
Notebooks:          Jupyter notebook read/edit
Database:           MCP-connected database queries
```

**4. Modes & Specialized Agents**
- **Plan Mode**: Dedicated planning subagent, builds precise plans
- **Thinking Mode**: Extended reasoning (toggle with Alt+T)
- **Explore Agent** (Haiku-powered): Fast codebase search
- **Custom Subagents**: User-defined specialized agents
- **Forked Context**: Skills can run in isolated sub-agent context

**5. Memory & Context**
- **CLAUDE.md**: Project-specific instructions and rules
- **@-mentions**: Reference files, folders, MCP resources
- **Session Persistence**: Resume conversations with `--resume`
- **Context Visualization**: `/context` shows token usage breakdown
- **Auto-Compaction**: Maintains infinite conversation length

**6. Plugin System** (v2.0.12+)
```
Plugins extend Claude Code with:
├── Commands       # Custom slash commands
├── Agents         # Custom subagents
├── Skills         # Reusable prompt templates
├── Hooks          # Lifecycle event handlers
└── MCP Servers    # External tool integration
```

**7. Hooks System**
Events: `SessionStart`, `SessionEnd`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStart`, `SubagentStop`, `PermissionRequest`, `UserPromptSubmit`

**8. Permission System**
```
Scoped Permissions:
├── Global      # Applies to all projects
├── User        # User's default settings
├── Local       # Project-specific
└── Session     # Current session only

Wildcards:      Bash(npm *), Bash(git * main)
Risk Levels:    auto-allow, ask, deny
```

**9. MCP Integration**
- **HTTP/SSE Transport**: Streamable HTTP connections
- **OAuth Support**: Built-in OAuth flow for MCP servers
- **Resource Mentions**: @-mention MCP resources
- **Dynamic Tools**: `list_changed` for runtime tool updates
- **Search Mode**: Auto-defer tool descriptions when >10% context

**10. Advanced Features**
| Feature | Description |
|---------|-------------|
| **Named Sessions** | `/rename` to save, `/resume` to restore |
| **Background Tasks** | Ctrl+B to background agents/commands |
| **Git Worktree Support** | Parallel sessions via worktrees |
| **Teleport** | Resume web sessions in CLI |
| **Compact** | Manual or auto conversation compaction |
| **Stats** | Usage metrics, streak tracking |
| **Doctor** | Diagnostics and configuration validation |

### Implementation Details

#### Plugin Architecture

```javascript
// Plugin Directory Structure
my-plugin/
├── README.md
├── commands/           # Slash commands (.md files)
│   └── my-command.md
├── agents/             # Custom subagents (.md files)
│   └── my-agent.md
├── skills/             # Skills (.md files)
│   └── my-skill/
│       └── skill.md
├── hooks/              # Hooks (.json, .py, .sh)
│   ├── hooks.json
│   └── pretooluse.py
└── mcp-servers/        # MCP server configs
    └── server.json

// Skill Frontmatter Example
---
description: Build a feature from a brief
context: fork        # Run in isolated subagent
agent: feature-dev   # Use specific agent
allowed-tools:
  - Read
  - Write
  - Bash
once: true           # Execute once per session
---

# Skill Content

Additional prompt instructions...
```

#### Hooks System

```json
// hooks.json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "description": "Validate bash commands",
      "command": "python3 hooks/pretooluse.py",
      "timeout": 60000
    },
    {
      "event": "PermissionRequest",
      "description": "Auto-approve safe git commands",
      "command": "./hooks/permission.sh",
      "allowed-tools": ["Bash"],
      "once": true
    }
  ]
}

// Python Hook Example (simplified)
import sys
import json

def pre_tool_use_handler(input_data):
    tool_name = input_data.get('toolName')

    if tool_name == 'Bash':
        command = input_data.get('input', {}).get('command', '')
        if is_dangerous(command):
            return {
                "decision": "ask",
                "additionalContext": f"⚠️ Potentially dangerous: {command}"
            }

    return {"decision": "allow"}

if __name__ == "__main__":
    input_line = sys.stdin.readline()
    input_data = json.loads(input_line)
    result = pre_tool_use_handler(input_data)
    print(json.dumps(result))
```

#### Permission Rules

```json
// settings.json - Permission Rules
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(npm install)",
      "Bash(npm test)",
      "Read(*.ts)",
      "Read(*.tsx)",
      "Write(*.md)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl *|bash)",  // Prevent pipe to bash
      "Write(~/.ssh/*)",
      "Write(~/.aws/*)"
    ]
  }
}
```

### What Makes It Work

| Component | Technology Pattern | Purpose |
|-----------|-------------------|---------|
| **Ink (React)** | Terminal UI framework | CLI rendering |
| **Node.js/Bun** | Runtime | Cross-platform execution |
| **stdio Transport** | MCP standard | Server communication |
| **Tree-sitter** | Parser library | Code understanding |
| **ripgrep** | Fast search | File content search |
| **Git Integration** | Native git commands | Version control |
| **Zod** | Schema validation | Type-safe configs |
| **OpenTelemetry** | Observability | Usage tracking |

---

## Claude Cowork

### Platform Capabilities

Released January 12, 2026, Claude Cowork is an agentic feature embedded in Claude Desktop macOS that transforms Claude from a conversational AI into an autonomous desktop agent.

#### Core Capabilities

**1. Direct Local File Access**
- **Read Files**: Any file within designated folders (documents, spreadsheets, PDFs)
- **Edit Existing Files**: Modify reports, reformat documents, correct errors
- **Create New Files**: Generate reports, documentation, emails from scratch
- **Multi-File Operations**: Consolidate sources, batch process, cross-reference

**2. Extended Autonomy**
- Sessions remain active as long as Claude Desktop is open
- Multi-step task execution without constant user intervention
- Decision-making and iteration on work independently
- Sub-agent architecture for complex task breakdown

**3. Security & Privacy**
```
Security Features:
├── Explicit Folder Permissions    # User must grant access
├── User Approval for Actions      # Configurable approval gates
├── Transparent Operation Logs     # All actions logged and visible
└── Revocable Access               # Revoke access at any time
```

**4. Use Cases**

| Category | Examples |
|----------|----------|
| **Content Creation** | Blog posts, reports, presentations, marketing copy |
| **Data Organization** | Categorize documents, extract info, analyze spreadsheets |
| **Business Operations** | Client reports, proposals, project documentation, invoices |
| **Personal Productivity** | Knowledge bases, study materials, personal correspondence |

### Implementation Details

#### Cowork vs. Claude Code

| Aspect | Claude Code | Claude Cowork |
|--------|-------------|---------------|
| **Target User** | Developers | Everyone |
| **Focus** | Software development | General productivity |
| **Terminal Access** | Full bash commands | None |
| **File Access** | Project-based | Designated folders |
| **Use Case** | Coding tasks | Content/document work |

#### Architecture (Based on Public Analysis)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE COWORK ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Claude Desktop Host                      │ │
│  │  • Session lifecycle management                             │ │
│  │  • UI rendering                                              │ │
│  │  • Core LLM interactions                                    │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                       │
│                    ┌──────▼──────┐                               │
│                    │   MCP Host  │                               │
│                    │  Protocol   │                               │
│                    └──────┬──────┘                               │
│                           │                                       │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐              │
│    │ File    │      │ VM      │      │ Sub-    │              │
│    │ System  │      │ Isolation│     │ Agents  │              │
│    │ MCP     │      │ Layer    │      │         │              │
│    └─────────┘      └─────────┘      └─────────┘              │
│                                                                   │
│  VM Isolation (macOS: Apple Virtualization Framework)            │
│  • Strict file access controls                                    │
│  • Network access controls                                        │
│  • Process isolation                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### What Makes It Work

| Component | Technology Pattern | Purpose |
|-----------|-------------------|---------|
| **MCP Protocol** | Tool/Resources/Prompts standard | Capability extension |
| **VM Isolation** | AVF (macOS) | Security sandboxing |
| **File System MCP** | Local file access | Direct file operations |
| **Sub-Agent System** | Task decomposition | Complex workflow handling |
| **Session Persistence** | Desktop app state | Extended autonomy |

---

## Shared Architectural Patterns

### 1. MCP (Model Context Protocol)

MCP is the foundational standard connecting all Claude platforms to external capabilities.

**Three Primitives:**

```typescript
// Tools: Actions the LLM can take
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler?: (input: any) => Promise<any>;
}

// Resources: Data the LLM can read
interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Prompts: Reusable prompt templates
interface Prompt {
  name: string;
  description?: string;
  arguments?: Argument[];
  template?: string;
}
```

**Transport Types:**
- **stdio**: Standard input/output (local servers)
- **SSE**: Server-Sent Events (remote, streaming)
- **HTTP**: REST-like (remote, poll-based)

**MCP Server Communication:**
```
Client                          MCP Server
  │                               │
  │────── initialize ────────▶    │
  │◀───── capabilities ──────────  │
  │                               │
  │────── tools/list ───────▶     │
  │◀───── tools (array) ─────────  │
  │                               │
  │────── resources/list ──▶      │
  │◀───── resources (array) ────   │
  │                               │
  │────── call tool ─────────▶     │
  │◀───── tool result ──────────   │
```

### 2. Agent System

**Built-in Agents:**

| Agent | Purpose | Model |
|-------|---------|-------|
| **Explore** | Fast codebase search | Haiku |
| **Plan** | Build implementation plans | Sonnet/Opus |
| **Feature-dev** | Multi-step feature implementation | Configurable |

**Custom Agent Definition:**

```yaml
# .claude/agents/my-agent.md
---
description: Specialized agent for database migrations
model: sonnet
permissionMode: auto-allow
allowedTools:
  - Read
  - Write
  - Bash
  - Grep
skills:
  - database/schema-analysis
  - migration/planner
hooks:
  - type: SessionStart
    command: ./hooks/init.sh
---

# Database Migration Agent

You are a specialized agent for database schema changes.

## Guidelines
1. Always analyze existing schema first
2. Create rollback migrations
3. Test in staging before production
4. Document all schema changes
```

**Agent Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SPAWN                    │                RESUME               │
│    │                      │                   │                 │
│    ▼                      │                   ▼                 │
│  ┌─────────┐              │              ┌─────────┐            │
│  │  Fresh  │              │              │ Previous│            │
│  │ Context │              │              │ Context │            │
│  └────┬────┘              │              └────┬────┘            │
│       │                   │                   │                 │
│       ▼                   │                   ▼                 │
│  Execute Tasks            │              Continue Work          │
│       │                   │                   │                 │
│       ▼                   │                   ▼                 │
│  Produce Result           │              Produce Result         │
│       │                   │                   │                 │
│       ▼                   │                   ▼                 │
│  DISPOSE                  │              Handoff or Dispose     │
│                           │                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User                 Client              Platform              │
│   │                     │                    │                  │
│   │──── login ─────────▶│                    │                  │
│   │                     │──── OAuth ──────▶  │                  │
│   │                     │                    │                  │
│   │                     │◀─── redirect ──────│                  │
│   │◀─── browser ────────│                    │                  │
│   │                     │                    │                  │
│   │──── auth code ─────▶│                    │                  │
│   │                     │──── exchange ────▶ │                  │
│   │                     │◀─── access_token �─ │                  │
│   │◀─── session ────────│                    │                  │
│   │                     │                    │                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Keychain Storage (Desktop)                              │   │
│  │ • access_token                                          │   │
│  │ • refresh_token                                         │   │
│  │ • Automatic refresh before expiration                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Permission System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tool Call                       Rule Matching Engine            │
│  ────────                        ────────────────────            │
│  Tool: Bash                                                      │
│  Command: "npm install"           ┌─────────────────────┐        │
│                                   │ Check:              │        │
│                                   │ 1. Session rules    │        │
│  ───────────────────────────────▶│ 2. Local rules      │        │
│                                   │ 3. User rules       │        │
│                                   │ 4. Global rules     │        │
│                                   └──────────┬──────────┘        │
│                                              │                   │
│           ┌─────────────────────────────────┼───────────────┐   │
│           │                                 │               │   │
│           ▼                                 ▼               ▼   │
│      ┌─────────┐                       ┌─────────┐    ┌────────┐│
│      │  ALLOW  │                       │   ASK   │    │  DENY  ││
│      └────┬────┘                       └────┬────┘    └───┬────┘│
│           │                                 │              │     │
│           ▼                                 ▼              ▼     │
│      Execute                        Show Prompt      Block Tool  │
│                                                                   │
│  Risk Classification:                                            │
│  • Safe (auto-allow): git status, npm test                      │
│  • Low Risk (ask): npm install, git rebase                      │
│  • High Risk (deny): rm -rf, curl|bash                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP (Model Context Protocol)

### MCP is the Core Integration Standard

**What MCP Provides:**
- Universal interface for LLM-tool integration
- Three primitives: Tools, Resources, Prompts
- Multiple transport types (stdio, SSE, HTTP)
- OAuth 2.1 + PKCE authentication

### Popular MCP Servers (January 2026)

| MCP Server | Capability | Transport |
|------------|-----------|-----------|
| **GitHub** | Repo read, issues, PRs, code scanning | HTTP/SSE |
| **Google Drive** | Read docs, sheets, slides | HTTP |
| **Slack** | Messages, channels, files | HTTP |
| **PostgreSQL** | Query databases | stdio |
| **File System** | Local file access | stdio |
| **Puppeteer** | Web automation | stdio |
| **Context7** | Up-to-date documentation | HTTP |
| **Brave Search** | Web search | HTTP |

### MCP Server Development Example

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'my-mcp-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Register a tool
server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'search_files',
    description: 'Search for files in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        path: { type: 'string' }
      },
      required: ['query']
    }
  }]
}));

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search_files') {
    const results = await searchFiles(args.query, args.path);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results)
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Comparison Matrix

### Feature Comparison Across Platforms

| Feature | Claude Desktop | Claude Code | Claude Cowork |
|---------|----------------|-------------|---------------|
| **Chat Interface** | ✅ | ✅ (terminal) | ✅ |
| **File Read** | ✅ (attachments) | ✅ (@-mention) | ✅ (folder access) |
| **File Write** | ❌ | ✅ | ✅ |
| **Terminal/Bash** | ❌ | ✅ | ❌ |
| **MCP Extensions** | ✅ (.mcpb) | ✅ (.mcp.json) | ✅ (via Desktop) |
| **Custom Agents** | ❌ | ✅ | ✅ (sub-agents) |
| **Plan Mode** | ❌ | ✅ | ✅ |
| **Git Integration** | ❌ | ✅ | ❌ |
| **IDE Integration** | ❌ | ✅ | ❌ |
| **CI/CD Integration** | ❌ | ✅ | ❌ |
| **Session Persistence** | ✅ | ✅ | ✅ |
| **Thinking Mode** | ✅ | ✅ | ✅ |
| **Web Search** | ✅ | ✅ | ✅ |
| **Image Analysis** | ✅ | ✅ | ✅ |
| **PDF Reading** | ✅ | ✅ | ✅ |

### Use Case Alignment

| Use Case | Best Platform |
|----------|---------------|
| **General Q&A** | Claude Desktop |
| **Document Analysis** | Claude Desktop / Cowork |
| **Software Development** | Claude Code |
| **Content Creation** | Claude Cowork |
| **Data Analysis** | Claude Code + MCP |
| **Git Workflows** | Claude Code |
| **CI/CD Automation** | Claude Code |
| **Learning/Explanation** | Claude Desktop / Code |
| **File Organization** | Claude Cowork |
| **Code Review** | Claude Code / GitHub MCP |

### Architecture Comparison

| Aspect | Claude Desktop | Claude Code | Claude Cowork |
|--------|----------------|-------------|---------------|
| **Framework** | Electron/Tauri | Ink (React) | Embedded in Desktop |
| **Primary Transport** | stdio (MCP) | stdio (MCP) | stdio (MCP) |
| **Runtime** | Bundled Node.js | System Node.js/Bun | Desktop runtime |
| **Config Location** | ~/Library/Application Support | ~/.claude | Inherited from Desktop |
| **Permission Scope** | Per-extension | Project/User/Session | Folder-based |
| **Extension Format** | .mcpb (ZIP) | Plugin directory | Inherited |
| **Isolation** | Process per extension | Process per server | VM isolation (alleged) |

---

## Sources

- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)
- [Claude Code Documentation](https://code.claude.com/docs/en/overview)
- [Claude Desktop Extensions Blog](https://www.anthropic.com/engineering/desktop-extensions)
- [Claude Cowork Feature Analysis](https://www.alphamatch.ai/blog/claude-cowork-desktop-ai-agent-2026)
- [GitHub MCP Server Changelog](https://github.blog/changelog/2025-09-04-remote-github-mcp-server-is-now-generally-available/)
- [MCP Protocol Guide](https://www.pythonalchemist.com/blog/mcp-protocol)

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
**Research Date:** Late January 2026
