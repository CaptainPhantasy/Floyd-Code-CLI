# Floyd Agent API Contract v1.0

**Version:** 1.0.0  
**Status:** Stable  
**Base URL:** `ws://localhost:3000/agent` (WebSocket) or `http://localhost:3000/api` (HTTP)

---

## Overview

This contract defines how external applications interact with Floyd, an advanced AI coding assistant. Floyd provides a unified interface for code manipulation, git operations, file system access, browser automation, caching, and more.

### Design Principles
- **Request-Response Pattern:** All operations follow async request/response
- **Streaming Support:** For long-running operations, progress streams are available
- **Error Handling:** Structured error responses with codes and recovery suggestions
- **Idempotency:** Safe operations are idempotent where possible

---

## Authentication

```typescript
// WebSocket auth handshake
{
  "type": "auth",
  "token": string,           // JWT or API key
  "client_version": string,  // Client application version
  "capabilities": string[]   // Optional: declare supported features
}
```

---

## Core Request/Response Structure

### Request
```typescript
interface FloydRequest {
  id: string;              // Unique request ID (UUID v4)
  method: string;          // Tool name (e.g., "read_file", "git_status")
  params: Record<string, any>;
  stream?: boolean;        // Request progress streaming
  timeout?: number;        // Optional timeout in ms (default: 60000)
}
```

### Response
```typescript
interface FloydResponse {
  id: string;              // Echoes request ID
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestion?: string;
  };
  timing?: {
    started: number;       // Unix timestamp ms
    completed: number;
    duration: number;
  };
}
```

### Stream Event (if stream: true)
```typescript
interface FloydStreamEvent {
  id: string;
  type: "progress" | "partial" | "status";
  progress?: number;       // 0-100
  message?: string;
  data?: any;
}
```

---

## Available Methods

### File Operations

#### `read_file`
Read file contents from disk.

```typescript
// Request
{
  "method": "read_file",
  "params": {
    "file_path": string,
    "offset": number,    // Optional: start line (0-indexed)
    "limit": number      // Optional: max lines to read
  }
}

// Response
{
  "success": true,
  "data": {
    "content": string,
    "lines": number,
    "encoding": "utf8"
  }
}
```

#### `write`
Create or overwrite files.

```typescript
// Request
{
  "method": "write",
  "params": {
    "file_path": string,
    "content": string,
    "create_dirs": boolean  // Optional: default true
  }
}
```

#### `edit_file`
Surgical edit: replace exact string match.

```typescript
// Request
{
  "method": "edit_file",
  "params": {
    "file_path": string,
    "old_string": string,
    "new_string": string
  }
}
```

#### `search_replace`
Global find-and-replace in a file.

```typescript
// Request
{
  "method": "search_replace",
  "params": {
    "file_path": string,
    "search_string": string,
    "replace_string": string,
    "replace_all": boolean  // Optional: default true
  }
}
```

#### `list_directory`
List files and directories.

```typescript
// Request
{
  "method": "list_directory",
  "params": {
    "path": string,
    "recursive": boolean,      // Optional: default false
    "include_hidden": boolean, // Optional: default false
    "file_pattern": string     // Optional: glob pattern
  }
}
```

---

### Git Operations

#### `git_status`
Show working tree status.

```typescript
// Request
{
  "method": "git_status",
  "params": {
    "repoPath": string  // Optional: default cwd
  }
}

// Response
{
  "success": true,
  "data": {
    "branch": string,
    "ahead": number,
    "behind": number,
    "staged": string[],
    "unstaged": string[],
    "untracked": string[]
  }
}
```

#### `git_commit`
Record changes to repository.

```typescript
// Request
{
  "method": "git_commit",
  "params": {
    "message": string,
    "repoPath": string,    // Optional
    "stageAll": boolean,   // Optional: default false
    "stageFiles": string[], // Optional
    "amend": boolean       // Optional: default false
  }
}
```

#### `git_diff`
Show changes between commits or working tree.

```typescript
// Request
{
  "method": "git_diff",
  "params": {
    "repoPath": string,
    "cached": boolean,    // Show staged changes
    "files": string[]     // Optional: specific files
  }
}
```

#### `git_log`
Show commit history.

```typescript
// Request
{
  "method": "git_log",
  "params": {
    "repoPath": string,
    "maxCount": number,   // Optional: default 10
    "since": string,      // Optional: git date format
    "until": string,      // Optional
    "author": string,     // Optional
    "file": string        // Optional: file filter
  }
}
```

#### `git_branch`
List, create, or switch branches.

```typescript
// Request
{
  "method": "git_branch",
  "params": {
    "repoPath": string,
    "action": "list" | "current" | "create" | "switch",
    "name": string       // Required for create/switch
  }
}
```

#### `git_merge`
Merge a branch into current branch.

```typescript
// Request
{
  "method": "git_merge",
  "params": {
    "branch": string,
    "repoPath": string,
    "no_ff": boolean,     // Optional: create merge commit
    "message": string     // Optional: merge message
  }
}
```

---

### Search & Code Analysis

#### `grep`
Search file contents with regex patterns.

```typescript
// Request
{
  "method": "grep",
  "params": {
    "pattern": string,
    "path": string,           // Optional: default cwd
    "filePattern": string,    // Optional: glob pattern
    "caseInsensitive": boolean, // Optional
    "outputMode": "content" | "files_with_matches" | "count"
  }
}
```

#### `codebase_search`
Semantic search with understanding.

```typescript
// Request
{
  "method": "codebase_search",
  "params": {
    "query": string,
    "path": string,       // Optional
    "maxResults": number  // Optional: default 10
  }
}
```

---

### Browser Automation

#### `browser_navigate`
Navigate to a URL.

```typescript
// Request
{
  "method": "browser_navigate",
  "params": {
    "url": string,
    "tabId": number       // Optional: specify tab
  }
}
```

#### `browser_read_page`
Get semantic accessibility tree.

```typescript
// Request
{
  "method": "browser_read_page",
  "params": {
    "tabId": number       // Optional
  }
}
```

#### `browser_screenshot`
Capture screenshot for vision models.

```typescript
// Request
{
  "method": "browser_screenshot",
  "params": {
    "fullPage": boolean,  // Optional: default false
    "selector": string,   // Optional: CSS selector
    "tabId": number       // Optional
  }
}
```

#### `browser_click`
Click element by selector or coordinates.

```typescript
// Request
{
  "method": "browser_click",
  "params": {
    "selector": string,   // OR use x/y
    "x": number,
    "y": number,
    "tabId": number       // Optional
  }
}
```

#### `browser_type`
Type text into focused element.

```typescript
// Request
{
  "method": "browser_type",
  "params": {
    "text": string,
    "tabId": number       // Optional
  }
}
```

#### `browser_find`
Find element by natural language query.

```typescript
// Request
{
  "method": "browser_find",
  "params": {
    "query": string,
    "tabId": number       // Optional
  }
}
```

---

### Cache Operations

#### `cache_store`
Store data with optional metadata.

```typescript
// Request
{
  "method": "cache_store",
  "params": {
    "tier": "reasoning" | "project" | "vault",
    "key": string,
    "value": string,      // JSON stringified
    "metadata": string    // Optional
  }
}
```

#### `cache_retrieve`
Retrieve data by key.

```typescript
// Request
{
  "method": "cache_retrieve",
  "params": {
    "tier": "reasoning" | "project" | "vault",
    "key": string
  }
}
```

#### `cache_search`
Search entries by key or value.

```typescript
// Request
{
  "method": "cache_search",
  "params": {
    "tier": "reasoning" | "project" | "vault",
    "query": string
  }
}
```

#### `cache_list`
List all non-expired entries in a tier.

```typescript
// Request
{
  "method": "cache_list",
  "params": {
    "tier": "reasoning" | "project" | "vault"
  }
}
```

#### `cache_delete`
Delete entry by key.

```typescript
// Request
{
  "method": "cache_delete",
  "params": {
    "tier": "reasoning" | "project" | "vault",
    "key": string
  }
}
```

#### `cache_store_pattern`
Store reusable pattern to vault.

```typescript
// Request
{
  "method": "cache_store_pattern",
  "params": {
    "name": string,
    "pattern": string,
    "tags": string[]     // Optional
  }
}
```

---

### Terminal & System

#### `run`
Execute terminal commands (supports persistent "cd").

```typescript
// Request
{
  "method": "run",
  "params": {
    "command": string,
    "args": string[],    // Optional
    "cwd": string,       // Optional
    "timeout": number,   // Optional: ms
    "env": string        // Optional: KEY=value format
  }
}

// Response
{
  "success": true,
  "data": {
    "exitCode": number,
    "stdout": string,
    "stderr": string
  }
}
```

---

### Patching & Refactoring

#### `apply_unified_diff`
Apply a unified diff patch.

```typescript
// Request
{
  "method": "apply_unified_diff",
  "params": {
    "diff": string,
    "dryRun": boolean,    // Optional: preview only
    "rootPath": string,  // Optional
    "assessRisk": boolean // Optional
  }
}
```

#### `assess_patch_risk`
Assess risk level of a patch.

```typescript
// Request
{
  "method": "assess_patch_risk",
  "params": {
    "diff": string
  }
}
```

#### `safe_refactor`
Multi-step refactoring with verification.

```typescript
// Request
{
  "method": "safe_refactor",
  "params": {
    "description": string,
    "steps": Array<{
      tool: string;
      input: string;
      verification?: {
        type: "file_exists" | "file_contains" | "command_succeeds";
        target: string;
        expected?: string;
      };
    }>,
    "rollback_on_failure": boolean, // Optional: default true
    "dry_run": boolean              // Optional: default false
  }
}
```

---

### Advanced Editing

#### `edit_range`
Edit specific line range with backup.

```typescript
// Request
{
  "method": "edit_range",
  "params": {
    "filePath": string,
    "startLine": number,
    "endLine": number,
    "content": string,
    "dryRun": boolean   // Optional: default false
  }
}
```

#### `insert_at`
Insert content at specific line.

```typescript
// Request
{
  "method": "insert_at",
  "params": {
    "filePath": string,
    "lineNumber": number,
    "content": string,
    "dryRun": boolean   // Optional
  }
}
```

#### `delete_range`
Delete lines from file.

```typescript
// Request
{
  "method": "delete_range",
  "params": {
    "filePath": string,
    "startLine": number,
    "endLine": number,
    "dryRun": boolean   // Optional
  }
}
```

---

### Verification

#### `verify`
Explicit verification for outcomes.

```typescript
// Request
{
  "method": "verify",
  "params": {
    "type": "file_exists" | "file_contains" | "file_not_exists" | 
           "command_succeeds" | "command_fails",
    "target": string,
    "expected": string,   // Optional
    "regex": boolean,     // Optional: treat expected as regex
    "timeout_ms": number  // Optional
  }
}
```

---

## Error Codes

| Code | Description | Recoverable |
|------|-------------|-------------|
| `AUTH_FAILED` | Invalid or missing authentication | No |
| `PERMISSION_DENIED` | Insufficient permissions | No |
| `FILE_NOT_FOUND` | Target file does not exist | Maybe |
| `INVALID_PARAMS` | Parameter validation failed | No |
| `TIMEOUT` | Operation exceeded timeout | Yes |
| `GIT_ERROR` | Git operation failed | Maybe |
| `BROWSER_ERROR` | Browser automation failed | Yes |
| `CACHE_MISS` | Key not found in cache | No |
| `PATCH_FAILED` | Could not apply patch | Maybe |
| `COMMAND_FAILED` | Terminal command returned non-zero | Maybe |
| `UNKNOWN_ERROR` | Unexpected error | Maybe |

---

## Usage Examples

### Example 1: Read a file and edit it
```typescript
// 1. Read
const req1: FloydRequest = {
  id: uuid(),
  method: "read_file",
  params: { file_path: "/src/app.ts" }
};

// 2. Edit
const req2: FloydRequest = {
  id: uuid(),
  method: "edit_file",
  params: {
    file_path: "/src/app.ts",
    old_string: "const x = 1",
    new_string: "const x = 2"
  }
};
```

### Example 2: Git workflow
```typescript
// 1. Check status
const statusReq: FloydRequest = {
  id: uuid(),
  method: "git_status",
  params: { repoPath: "/my-project" }
};

// 2. Stage all
const stageReq: FloydRequest = {
  id: uuid(),
  method: "git_stage",
  params: { repoPath: "/my-project", files: ["*"] }
};

// 3. Commit
const commitReq: FloydRequest = {
  id: uuid(),
  method: "git_commit",
  params: { 
    repoPath: "/my-project",
    message: "feat: add new feature"
  }
};
```

### Example 3: Semantic search
```typescript
const searchReq: FloydRequest = {
  id: uuid(),
  method: "codebase_search",
  params: {
    query: "authentication middleware implementation",
    path: "/src",
    maxResults: 5
  }
};
```

---

## WebSocket Protocol

### Connection
```
ws://localhost:3000/agent
```

### Message Format
All messages are JSON text frames.

### Heartbeat
```typescript
// Client → Server (every 30s)
{ "type": "ping" }

// Server → Client
{ "type": "pong" }
```

---

## HTTP Fallback

For non-real-time needs, HTTP endpoints mirror WebSocket methods:

```
POST /api/agent
Content-Type: application/json

{
  "method": "read_file",
  "params": { "file_path": "/path/to/file" }
}
```

---

## Rate Limits

| Tier | Requests/Minute |
|------|-----------------|
| Default | 60 |
| Premium | 600 |
| Enterprise | Unlimited |

---

## Versioning

- Contract version follows semantic versioning (`MAJOR.MINOR.PATCH`)
- `MAJOR`: Breaking changes
- `MINOR`: New features, backward compatible
- `PATCH`: Bug fixes

---

## Support & Feedback

- **Issues:** Report via client `feedback` method
- **Documentation:** Auto-generated from this contract
- **Status:** `/health` endpoint

---

## Changelog

### v1.0.0 (2025-01-25)
- Initial release
- Full tool suite coverage
- WebSocket + HTTP dual protocol
- Streaming support
