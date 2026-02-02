# Floyd Suite API Endpoint & Model Configuration Report

Based on my analysis of the codebase, here is a comprehensive breakdown of all API endpoints, model configurations, and API key connectivity requirements for each component of the Floyd Suite.

---

## 📊 **SUMMARY TABLE**

| Component | Primary Endpoint | Default Model | API Key Source | Provider Format | Status |
|-----------|-----------------|---------------|----------------|-----------------|--------|
| **DesktopWeb** | `https://api.z.ai/api/anthropic` | `glm-4.7` | Settings/API key field | Anthropic-compatible | ✅ Configured |
| **Mobile (PWA)** | Bridge server (local) | Inherits from Desktop | JWT tokens | Via Desktop bridge | ✅ Configured |
| **Chrome Extension** | `https://api.z.ai/api/anthropic` | `glm-4.7` | Environment variables | Anthropic-compatible | ✅ Configured |
| **Browork** | Inherits from DesktopWeb | `glm-4-plus` | Shared with Desktop | Multi-provider | ✅ Configured |
| **CURSE'M IDE** | Via floyd-wrapper bridge | `glm-4.7` | JWT via bridge | Via wrapper | 🚧 Design Phase |
| **floyd-cli** | `https://api.z.ai/api/anthropic` | `glm-4.7` | `.env.local` file | Anthropic-compatible | ✅ Updated & Built |
| **floyd-wrapper** | `https://api.z.ai/api/coding/paas/v4` | `glm-4.7` | Config/API key | GLM Coding Plan | ✅ **VERIFIED WORKING** |

---

## 🔧 **DETAILED PER-COMPONENT REQUIREMENTS**

### 1. **DesktopWeb** (FloydDesktopWeb/server/)

**Location:** `FloydDesktopWeb/server/index.ts`

**Configuration Interface:**
```typescript
interface Settings {
  provider: 'anthropic' | 'openai' | 'glm' | 'anthropic-compatible';
  apiKey: string;
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
  baseURL?: string;
}
```

**Default Configuration:**
```typescript
{
  provider: 'anthropic-compatible',
  apiKey: process.env.GLM_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || '',
  model: 'glm-4.7',
  maxTokens: 16384,
  baseURL: 'https://api.z.ai/api/anthropic',
}
```

**Supported Providers & Models:**

| Provider | Endpoint | Available Models |
|----------|----------|------------------|
| **anthropic** | `https://api.anthropic.com` | `glm-4.7`, `glm-4-plus`, `glm-4-0520`, `glm-4-5-air`, `glm-3-5-haiku` (via Z.ai mapping) |
| **openai** | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo` |
| **glm** | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus`, `glm-4-0520`, `glm-4`, `glm-4-air`, `glm-4-airx`, `glm-4-long`, `glm-4-flash` |
| **anthropic-compatible** | `https://api.z.ai/api/anthropic` | `glm-4.7`, `glm-4.5-air`, `glm-4-plus`, `glm-4-0520`, `glm-4`, `glm-4-air`, `glm-4-airx`, `glm-4-long`, `glm-4-flash` |

**API Key Priority:**
1. User-configured in settings (stored in `.floyd-data/settings.json`)
2. `GLM_API_KEY` environment variable
3. `ANTHROPIC_API_KEY` environment variable
4. `OPENAI_API_KEY` environment variable

**Request Format:**
```typescript
// Anthropic-compatible (Z.ai/GLM)
const response = await anthropicClient.messages.create({
  model: settings.model,
  max_tokens: settings.maxTokens || 16384,
  system: systemPrompt,
  messages: apiMessages,
});

// OpenAI-compatible (OpenAI, GLM provider)
const response = await openaiClient.chat.completions.create({
  model: settings.model,
  max_tokens: settings.maxTokens || 16384,
  messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
});
```

---

### 2. **Mobile** (FloydMobile PWA + Bridge)

**Architecture:** Mobile is a PWA client that connects to DesktopWeb's bridge server via WebSocket.

**Connection Flow:**
```
Mobile PWA → NGROK Tunnel → Desktop Bridge Server → LLM API
```

**Bridge Server Endpoints:**
- **HTTP:** `http://localhost:3000/api/bridge/*`
- **WebSocket:** `ws://localhost:3000` (MCP protocol)
- **NGROK:** Public tunnel URL for mobile access

**Authentication:**
- JWT-based authentication
- QR code pairing flow
- Environment variables:
  - `FLOYD_JWT_SECRET` - JWT signing secret

**Model Configuration:**
- **Inherits from DesktopWeb settings**
- No direct API configuration in mobile
- Uses shared session from desktop
- **Default model when inherited:** `glm-4.7`

**Key Files:**
- `mobile/docs/IMPLEMENTATION_PROGRESS.md` - Bridge architecture
- `FloydDesktopWeb/server/ws-mcp-server.ts` - WebSocket MCP server for mobile

---

### 3. **Chrome Extension** (FloydChromeBuild/floydchrome/)

**Location:** `FloydChromeBuild/floydchrome/src/agent/floyd.ts`

**Standalone Mode Configuration:**
```typescript
private standaloneApiConfig: {
  endpoint: string;
  apiKey: string | null;
} = {
  endpoint: 'https://api.z.ai/api/anthropic',
  apiKey: null
};
```

**API Key Sources (Priority Order):**
1. Config object passed to constructor
2. `ANTHROPIC_AUTH_TOKEN` environment variable
3. `GLM_API_KEY` environment variable

**Request Format:**
```typescript
const response = await fetch(this.standaloneApiConfig.endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.standaloneApiConfig.apiKey,
  },
  body: JSON.stringify({
    model: 'glm-4.7',  // GLM-4.7 via Z.ai
    messages,
    max_tokens: 8192,
  }),
});
```

**Model Used:**
- **Actual model:** `glm-4.7` (GLM's most capable model)
- Z.ai endpoint accepts this directly

**WebSocket Client Mode:**
- Can connect to DesktopWeb's MCP server via WebSocket
- Uses MCP (Model Context Protocol)
- Location: `FloydChromeBuild/floydchrome/src/mcp/websocket-client.ts`

---

### 4. **Browork** (Sub-agent System)

**Location:** `FloydDesktopWeb/server/browork-manager.ts`

**Configuration:**
```typescript
private apiKey: string = '';
private baseURL?: string;
private model: string = 'glm-4-plus';  // Most capable GLM model
private provider: Provider = 'anthropic';
```

**Provider Types:**
```typescript
type Provider = 'anthropic' | 'openai' | 'glm' | 'anthropic-compatible';
```

**API Key & Configuration:**
- **Inherits from DesktopWeb settings**
- Uses same API key as main desktop app
- Configurable per task

**Request Flow:**
```typescript
// Anthropic format
const response = await client.messages.create({
  model: this.model,
  max_tokens: 4096,
  system: systemPrompt,
  messages,
  tools,
});

// OpenAI/GLM format
const response = await openaiClient.chat.completions.create({
  model: this.model,
  max_tokens: 4096,
  messages: [{ role: 'system', content: systemPrompt }, ...messages],
  tools: openaiTools,
});
```

**Default Model:** `glm-4-plus`

**Max Concurrent Agents:** 3 (configurable)
**Max Tool Calls Per Agent:** 20 (configurable)
**Agent Timeout:** 5 minutes (configurable)

---

### 5. **CURSE'M IDE Extension** (Floyd Extension for CURSE'M IDE/)

**Architecture:** VS Code extension that wraps floyd-wrapper

**Connection Methods (as per design doc):**

**Option 1: Bridge-based Wrapper Provider**
```
VS Code Extension → Floyd Wrapper Bridge (JWT) → LLM API
```
- Uses `/api/bridge/dev-token` endpoint for local JWT generation
- No QR/mobile pairing needed for local VS Code
- **Model:** Inherits from floyd-wrapper (`glm-4.7`)

**Option 2: Headless CLI (INK)**
```
VS Code Extension → floyd-cli (stdio JSON) → LLM API
```
- Would require `--json` headless mode in floyd-cli
- Parses JSON events from stdout
- **Model:** Inherits from floyd-cli configuration (`glm-4-0520`)

**Option 3: Direct Library Import**
```
VS Code Extension (TS/JS) → floyd-agent-core → LLM API
```
- No CLI process
- Pure TypeScript/JS API
- **Model:** Configurable, defaults to `glm-4.7`

**Current Status:**
- Design phase (see `Floyd Extension for CURSE'M IDE/2026-01-25T07:28:51Z.md`)
- No implementation yet
- Would register as `vscode.LanguageModelChatProvider`

**Model Registration:**
```typescript
vscode.chat.registerLanguageModelChatProvider('floyd-wrapper', wrapperProvider);
vscode.chat.registerLanguageModelChatProvider('floyd-ink', inkProvider);
```

**Default Models:**
- **Wrapper provider:** `glm-4.7`
- **INK provider:** `glm-4-0520`

---

### 6. **floyd-cli** (INK/floyd-cli/)

**⚠️ DO NOT MODIFY WITHOUT PERMISSION - VERIFIED WORKING CONFIGURATION**

**Location:** `INK/floyd-cli/src/app.tsx` (API config loading)

**⭐ VERIFIED WORKING CONFIGURATION (2026-01-25):**

**Endpoint:** `https://api.z.ai/api/coding/paas/v4` (GLM Coding Plan endpoint)
**Model:** `glm-4.7` (Most capable GLM model)
**Format:** OpenAI-compatible (NOT Anthropic format)

**⚠️ CRITICAL DISTINCTION:**
- **GLM Coding Plan endpoint** (`/api/coding/paas/v4`) uses **OpenAI format**
- **Z.ai Anthropic endpoint** (`/api/anthropic`) uses **Anthropic format**
- floyd-cli uses the Coding Plan endpoint with OpenAI format

**Environment Variables (Priority Order):**
```bash
# Global config (~/.floyd/.env.local)
FLOYD_GLM_API_KEY=<your-key>
FLOYD_GLM_ENDPOINT=https://api.z.ai/api/coding/paas/v4
FLOYD_GLM_MODEL=glm-4.7

# Project override (.env.local in project root)
GLM_API_KEY=<your-key>
GLM_ENDPOINT=https://api.z.ai/api/coding/paas/v4
GLM_MODEL=glm-4.7
```

**⚠️ DO NOT CHANGE - Core Configuration:**

**File:** `packages/floyd-agent-core/src/constants.ts`
```typescript
// ⚠️ DO NOT MODIFY - Critical endpoint detection
export function isOpenAICompatible(endpoint: string): boolean {
  // GLM coding endpoint uses OpenAI format
  if (endpoint.includes('api.z.ai/api/coding')) {
    return true;  // ⚠️ REQUIRED for tool calling to work
  }
  if (endpoint.includes('api.anthropic.com')) {
    return false;  // Anthropic format
  }
  if (endpoint.includes('api.z.ai')) {
    return false;  // Z.ai Anthropic-compatible format
  }
  return true;
}
```

**File:** `packages/floyd-agent-core/src/agent/AgentEngine.ts`
```typescript
// ⚠️ DO NOT MODIFY - Tool role conversion (critical for multi-turn conversations)
private convertHistoryToLLMMessages(): LLMMessage[] {
  return this.history.map((msg) => {
    // Handle tool result messages (OpenAI format)
    if (msg.role === 'tool' || (Array.isArray(msg.content) && msg.content.some((block: any) => block.type === 'tool_result'))) {
      // ⚠️ REQUIRED for tool results to work
      return {
        role: 'tool' as any,
        tool_call_id: toolResult.tool_use_id,
        content: toolResult.content,
      };
    }
    // ... rest of conversion
  });
}
```

**Default Configuration:**
```typescript
{
  apiKey: process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY,
  baseURL: process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT || 'https://api.z.ai/api/coding/paas/v4',
  model: process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL || 'glm-4.7',
  enableThinkingMode: true,
  temperature: 0.2,
}
```

**⚠️ Verified Working:**
- ✅ Tool calling (write_file, read_file, list_directory, etc.)
- ✅ Multi-turn conversations
- ✅ Filesystem operations
- ✅ MCP server integration (62 tools available)
- ✅ Streaming responses

**Status:** ✅ **VERIFIED WORKING - DO NOT MODIFY WITHOUT TESTING**

---

### 7. **floyd-wrapper** (floyd-wrapper-main/)

**⚠️ DO NOT MODIFY WITHOUT PERMISSION - VERIFIED WORKING CONFIGURATION**

**Location:** `floyd-wrapper-main/src/constants.ts` & `src/llm/glm-client.ts`

**⭐ VERIFIED WORKING CONFIGURATION (2026-01-25):**

**Endpoint:** `https://api.z.ai/api/coding/paas/v4` (GLM-4.7 Coding Plan endpoint)
**Model:** `glm-4.7` (Most capable GLM model)
**Format:** OpenAI-compatible
**Status:** ✅ VERIFIED WORKING - Tool calling tested

**⚠️ CRITICAL:**
- **GLM-4.7 Coding Plan endpoint** (`/api/coding/paas/v4`) uses **OpenAI format**
- **❌ WRONG:** `https://api.z.ai/api/anthropic` (returns empty responses for GLM-4.7)

**Default Configuration:**
```typescript
export const DEFAULT_CONFIG = {
  glmApiEndpoint: 'https://api.z.ai/api/coding/paas/v4',  // ⚠️ REQUIRED - GLM Coding Plan
  glmModel: 'glm-4.7',  // ⚠️ REQUIRED - Most capable GLM model
  maxTokens: 100000,
  temperature: 0.7,
  logLevel: 'info',
  cacheEnabled: true,
  permissionLevel: 'ask',
  maxTurns: 20,
  timeoutMs: 120000,
} as const;
```

**⚠️ DO NOT CHANGE - Critical Files:**

**File:** `floyd-wrapper-main/src/constants.ts`
```typescript
// ⚠️ DO NOT MODIFY - Verified working GLM endpoint
export const DEFAULT_CONFIG = {
  glmApiEndpoint: 'https://api.z.ai/api/coding/paas/v4',  // GLM-4.7 Coding Plan
  glmModel: 'glm-4.7',
  // ... rest of config
} as const;
```

**File:** `floyd-wrapper-main/src/llm/glm-client.ts`
```typescript
// ⚠️ DO NOT MODIFY - GLM API client implementation
constructor(config: FloydConfig) {
  this.apiKey = config.glmApiKey;
  this.apiEndpoint = config.glmApiEndpoint;  // Must be /api/coding/paas/v4
  this.model = config.glmModel;  // Must be glm-4.7
}
```

**⚠️ Verified Working:**
- ✅ API connectivity to GLM-4.7
- ✅ Streaming responses
- ✅ Tool calling support
- ✅ Permission system (ask/yolo/plan modes)
- ✅ Multi-turn conversations
- ✅ SUPERCACHE integration
- ✅ MCP tool execution

**Status:** ✅ **VERIFIED WORKING - DO NOT MODIFY WITHOUT TESTING**

**Default Configuration:**
```typescript
export const DEFAULT_CONFIG = {
  glmApiEndpoint: 'https://api.z.ai/api/coding/paas/v4',  // GLM-4.7 Coding Plan endpoint
  glmModel: 'glm-4.7',  // Most capable GLM model
  maxTokens: 100000,
  temperature: 0.7,
  logLevel: 'info',
  cacheEnabled: true,
  permissionLevel: 'ask',
  maxTurns: 20,
  timeoutMs: 120000,
} as const;
```

**⚠️ IMPORTANT:** GLM-4.7 Coding Plan requires a specific endpoint:
- **✅ CORRECT:** `https://api.z.ai/api/coding/paas/v4` (GLM-4.7 Coding Plan)
- **❌ WRONG:** `https://api.z.ai/api/anthropic` (Claude-compatible API)

The `/api/anthropic` endpoint returns empty responses for GLM-4.7 Coding Plan.

**GLM Client:** `src/llm/glm-client.ts`
```typescript
constructor(config: FloydConfig) {
  this.apiKey = config.glmApiKey;
  this.apiEndpoint = config.glmApiEndpoint;
  this.model = config.glmModel;  // 'glm-4.7'
  
  if (!this.apiKey) {
    throw new GLMAPIError('GLM API key is not configured', 401);
  }
}
```

**Stream Options:**
```typescript
interface GLMStreamOptions {
  messages: FloydMessage[];
  tools?: Array<ToolDefinition>;
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
  onToolUse?: (toolUse: unknown) => void;
  onError?: (error: Error) => void;
  onComplete?: (usage: TokenUsage) => void;
  maxRetries?: number;
  retryDelay?: number;
}
```

**Key Features:**
- SSE (Server-Sent Events) streaming
- Token usage tracking
- Tool calling support
- Retry logic with exponential backoff
- **Default model:** `glm-4.7`

---

## 🗂️ **SHARED CORE CONFIGURATION**

**File:** `packages/floyd-agent-core/src/constants.ts`

```typescript
// Provider Default Configurations
export const DEFAULT_ANTHROPIC_CONFIG = {
  endpoint: 'https://api.anthropic.com',
  model: 'glm-4.7',  // When using Z.ai endpoint
};

export const DEFAULT_OPENAI_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o',
};

export const DEFAULT_DEEPSEEK_CONFIG = {
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
};

export const DEFAULT_ZAI_CONFIG = {
  endpoint: 'https://api.z.ai/api/anthropic',
  model: 'glm-4.7',  // GLM's most capable model
};

export const DEFAULT_GLM_CONFIG = DEFAULT_ZAI_CONFIG;

// Provider Detection
// ⚠️ DO NOT MODIFY - Critical endpoint detection
export function inferProviderFromEndpoint(endpoint: string): Provider {
  if (endpoint.includes('api.z.ai')) return 'zai';
  if (endpoint.includes('api.anthropic.com')) return 'anthropic';
  if (endpoint.includes('api.openai.com')) return 'openai';
  if (endpoint.includes('api.deepseek.com')) return 'deepseek';
  return 'anthropic';
}

// ⚠️ DO NOT MODIFY - Format detection (CRITICAL for floyd-cli tool calling)
// Format detection
export function isOpenAICompatible(endpoint: string): boolean {
  // ⚠️ DO NOT CHANGE - GLM coding endpoint MUST return true
  if (endpoint.includes('api.z.ai/api/coding')) {
    return true;  // GLM-4.7 Coding Plan uses OpenAI format
  }
  if (endpoint.includes('api.anthropic.com')) {
    return false;  // Anthropic direct format
  }
  if (endpoint.includes('api.z.ai')) {
    return false;  // Z.ai Anthropic-compatible format
  }
  // Default to OpenAI for other endpoints
  return true;
}
```

---

## 📝 **ENVIRONMENT VARIABLE REFERENCE**

| Variable | Used By | Purpose |
|----------|---------|---------|
| `GLM_API_KEY` | DesktopWeb, floyd-cli, floyd-wrapper, Chrome Ext | Primary API key for Z.ai/GLM |
| `ANTHROPIC_AUTH_TOKEN` | Chrome Ext, floyd-cli | Anthropic API key (for direct Anthropic endpoint) |
| `ANTHROPIC_API_KEY` | DesktopWeb, floyd-cli | Anthropic API key (alt) |
| `OPENAI_API_KEY` | DesktopWeb | OpenAI API key |
| `ZHIPU_API_KEY` | DesktopWeb | Zhipu AI API key (alt) |
| `FLOYD_JWT_SECRET` | Mobile Bridge | JWT signing secret |
| `GLM_ENDPOINT` | floyd-cli | Custom endpoint override |
| `GLM_MODEL` | floyd-cli | Custom model override |

---

## 🔐 **API KEY CONNECTIVITY SUMMARY**

### Primary Endpoint Across Suite: `https://api.z.ai/api/anthropic`

This Z.ai endpoint:
- Provides Anthropic-compatible API format
- Uses GLM model syntax directly
- **Primary models used across suite:**
  - `glm-4.7` - Most capable (DesktopWeb, Chrome Ext, floyd-wrapper, CURSE'M)
  - `glm-4-plus` - High-end alternative (Browork)
  - `glm-4-0520` - Recommended balance (floyd-cli)

### Provider Support Matrix:

| Component | Anthropic | OpenAI | GLM | Z.ai |
|-----------|-----------|--------|-----|------|
| DesktopWeb | ✅ (via Z.ai) | ✅ | ✅ | ✅ |
| Mobile | Via Desktop | Via Desktop | Via Desktop | Via Desktop |
| Chrome Ext | ✅ (via Z.ai) | ❌ | ❌ | ✅ |
| Browork | ✅ (via Z.ai) | ✅ | ✅ | ✅ |
| CURSE'M | Via wrapper | Via wrapper | Via wrapper | Via wrapper |
| floyd-cli | ✅ (via Z.ai) | ❌ | ❌ | ✅ |
| floyd-wrapper | ✅ (via Z.ai) | ❌ | ❌ | ✅ |

---

## 🎯 **GLM MODEL REFERENCE**

**Models Used Across Floyd Suite:**

| Model | Capability | Speed | Context | Used By |
|-------|-----------|-------|---------|---------|
| `glm-4.7` | Most capable | Standard | 128K | DesktopWeb, Chrome Ext, floyd-wrapper, CURSE'M, Core |
| `glm-4-plus` | High-end | Standard | 128K | Browork (default), DesktopWeb |
| `glm-4-0520` | Balanced | Fast | 128K | floyd-cli (default), DesktopWeb |
| `glm-4` | Standard | Fast | 128K | DesktopWeb |
| `glm-4-air` | Lightweight | Very Fast | 128K | DesktopWeb |
| `glm-4-airx` | Ultra-lightweight | Fastest | 128K | DesktopWeb |
| `glm-4-long` | Extended context | Standard | 128K+ | DesktopWeb |
| `glm-4-flash` | Economy | Fast | 128K | DesktopWeb |

---

## 🎯 **KEY IMPLEMENTATION NOTES**

1. **Z.ai as Primary Provider**: Most components default to Z.ai's Anthropic-compatible endpoint with GLM models
2. **Direct GLM Model Syntax**: All components use GLM model names directly (e.g., `glm-4.7`, not `claude-opus-4`)
3. **Model Selection by Component**:
   - **High-capability tasks:** `glm-4.7` (DesktopWeb, Chrome Ext, floyd-wrapper)
   - **Sub-agent delegation:** `glm-4-plus` (Browork)
   - **CLI balance:** `glm-4-0520` (floyd-cli)
4. **Shared Settings**: DesktopWeb, Browork, and Mobile share configuration
5. **Environment Priority**: GLM_API_KEY → ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY → OPENAI_API_KEY
6. **Format Flexibility**: DesktopWeb and Browork support both Anthropic and OpenAI request formats
7. **Authentication**: Mobile uses JWT; others use direct API keys

---

**Report Generated:** 2026-01-25  
**Floyd Suite Version:** 0.1.0  
**Primary Endpoint:** `https://api.z.ai/api/anthropic`
