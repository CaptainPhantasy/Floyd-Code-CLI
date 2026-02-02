# @floyd/agent-core

Floyd Agent Core - Unified implementations for permissions, configuration, LLM abstraction, state management, and advanced operations.

## Version

0.1.0

## Overview

This package provides the foundational utilities and abstractions for the FLOYD CLI agent system. It includes permission management, configuration handling, LLM provider abstraction, state management, and advanced operations like fuzzy matching, transaction support, and browser automation.

## Installation

```bash
npm install floyd-agent-core
```

## Modules

### Phase 0: Architectural Foundation

#### Item A: Unified Permission System
**File:** `dist/permissions/unified-permission.js`

```typescript
import {
  UnifiedPermissionManager,
  createYoloManager,
  createAskManager,
  createPlanManager,
  type PermissionMode,
  type PermissionRequest,
} from '@floyd/agent-core/permissions';
```

**Features:**
- `UnifiedPermissionManager` - Centralized permission management
- `createYoloManager()` - Auto-approve all operations
- `createAskManager()` - Interactive permission prompts
- `createPlanManager()` - Planning mode with write restrictions

#### Item B: Configuration Standardization
**File:** `dist/config/floyd-config.js`

```typescript
import {
  ConfigManager,
  initializeConfig,
  getConfig,
  setConfigValue,
  type FloydConfig,
  type SafetyMode,
} from '@floyd/agent-core/config';
```

**Features:**
- Environment-based configuration
- Runtime configuration updates
- Config change event emission

#### Item C: Provider Abstraction Layer
**File:** `dist/llm/index.js`

```typescript
import {
  createLLMClient,
  GLMClient,
  AnthropicClient,
  OpenAICompatibleClient,
} from '@floyd/agent-core/llm';
```

**Features:**
- Provider-agnostic LLM client factory
- Support for Anthropic, OpenAI-compatible, and GLM providers
- Automatic provider detection from endpoint URLs

#### Item D: State Management Unification
**File:** `dist/state/floyd-state.js`

```typescript
import {
  getState,
  updateState,
  setState,
  resetState,
  subscribe,
  type FloydState,
} from '@floyd/agent-core/state';
```

**Features:**
- Centralized state management
- Subscription-based updates
- Execution status tracking

### Phase 1: Critical Fixes

#### Dynamic Prompt Generation
**File:** `dist/prompts/tool-capabilities.js`

```typescript
import {
  generateToolCapabilities,
  getToolsByCategory,
  getToolStats,
} from '@floyd/agent-core';
```

**Features:**
- Dynamic tool capabilities generation
- 50 tool definitions with permission levels
- Tool categorization (file, code, search, build, git, cache, browser, terminal, patch, special)

### Phase 3: Advanced Operations

#### Item 7: Complexity Classification
**File:** `dist/complexity/complexity-classifier.js`

```typescript
import {
  assessComplexity,
  quickAssess,
  getTimeoutForComplexity,
  getMaxTurnsForComplexity,
  ComplexityLevel,
} from '@floyd/agent-core';
```

**Features:**
- Task complexity assessment (LOW/MEDIUM/HIGH)
- Timeout and turn limit recommendations
- Multi-factor scoring (file count, destructive operations, task type)

#### Item 8: Retry Guard
**File:** `dist/guards/index.js`

```typescript
import {
  RetryGuard,
  createRetryGuard,
  getRetryDelay,
} from '@floyd/agent-core';
```

**Features:**
- Loop detection (exact, similar, oscillation)
- Exponential backoff calculation
- Execution history tracking

#### Item 9: Fuzzy Matching
**File:** `dist/utils/index.js`

```typescript
import {
  fuzzyMatch,
  fuzzyMatchBatch,
  findBestLineMatch,
  generatePatchSuggestion,
} from '@floyd/agent-core';
```

**Features:**
- Levenshtein distance calculation
- Case-insensitive fallback
- Whitespace-tolerant matching
- Batch matching with confidence scores

#### Item 10-11: Cache Tier Operations
**File:** `dist/cache/cache-tiers.js`

```typescript
import {
  getCacheTierDescription,
  migrateCacheEntry,
  validateCacheKey,
  recommendTier,
} from '@floyd/agent-core';
```

**Features:**
- Three-tier cache architecture (reasoning, project, vault)
- Key validation with regex patterns
- Tier migration between cache levels

#### Item 11: Enhanced File Reading
**File:** `dist/io/index.js`

```typescript
import {
  readFilePath,
  calculateLineRange,
  shouldChunk,
  calculateChunkCount,
} from '@floyd/agent-core';
```

**Features:**
- Full content by default (no arbitrary truncation)
- Intelligent chunking for large files
- Line range calculation for partial reads

#### Item 12: Dry-Run Support
**File:** `dist/io/index.js`

```typescript
import {
  dryRunWrite,
  dryRunEdit,
  dryRunDelete,
  dryRunBatch,
  calculateBatchRisk,
} from '@floyd/agent-core';
```

**Features:**
- Simulate file operations before applying
- Diff previews
- Risk assessment (low/medium/high)
- Aggregate risk calculation for batch operations

#### Item 14: Git Branch Protection
**File:** `dist/git/index.js`

```typescript
import {
  isProtectedBranch,
  checkBranchOperation,
  validateBranchName,
  PROTECTED_BRANCHES,
} from '@floyd/agent-core';
```

**Features:**
- Protected branch detection (main, master, develop)
- Operation validation against protection rules
- Branch name format validation

#### Item 15: Browser Graceful Degradation
**File:** `dist/browser/index.js`

```typescript
import {
  checkBrowserConnection,
  executeWithFallback,
  getDegradationMessage,
  BrowserOperations,
} from '@floyd/agent-core';
```

**Features:**
- WebSocket connection checking
- Fallback behavior on unavailability
- Built-in operation wrappers (navigate, readPage, screenshot)

#### Item 16: Extended Grep
**File:** `dist/search/index.js`

```typescript
import {
  extendedGrep,
  grepWithContextHighlight,
  grepExists,
  grepLineNumbers,
  grepBatch,
} from '@floyd/agent-core';
```

**Features:**
- Regex search with context lines
- Syntax highlighting support
- Fast existence check
- Batch grep operations

#### Item 17: Natural Language Click
**File:** `dist/browser/index.js`

```typescript
import {
  describeElement,
  findByDescription,
  generateSelector,
  parseNaturalLanguage,
} from '@floyd/agent-core';
```

**Features:**
- Generate natural language descriptions from elements
- Find elements by NL query
- CSS selector generation

#### Item 18: Transaction Support
**File:** `dist/transactions/index.js`

```typescript
import {
  createTransaction,
  addOperation,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  storeRollbackData,
  getTransactionStatus,
  listActiveTransactions,
  cleanupStaleTransactions,
} from '@floyd/agent-core';
```

**Features:**
- Multi-file operation tracking
- Rollback on failure
- Commit on success
- State snapshotting for recovery

## API Reference

### Main Exports

All modules are re-exported from the main entry point:

```typescript
import {
  // Permissions
  UnifiedPermissionManager,
  createYoloManager,
  createAskManager,
  createPlanManager,

  // Config
  ConfigManager,
  initializeConfig,
  getConfig,

  // LLM
  createLLMClient,
  GLMClient,
  AnthropicClient,

  // State
  getState,
  updateState,
  setState,

  // Complexity
  assessComplexity,
  ComplexityLevel,

  // Guards
  RetryGuard,
  createRetryGuard,

  // Fuzzy Matching
  fuzzyMatch,
  fuzzyMatchBatch,
  findBestLineMatch,

  // Cache
  getCacheTierDescription,
  migrateCacheEntry,
  validateCacheKey,

  // File Operations
  readFilePath,
  calculateLineRange,
  shouldChunk,

  // Dry Run
  dryRunWrite,
  dryRunEdit,
  dryRunDelete,
  dryRunBatch,

  // Git
  isProtectedBranch,
  checkBranchOperation,

  // Browser
  checkBrowserConnection,
  executeWithFallback,
  describeElement,
  findByDescription,

  // Search
  extendedGrep,
  grepWithContextHighlight,
  grepExists,

  // Transactions
  createTransaction,
  addOperation,
  commitTransaction,
  rollbackTransaction,
} from '@floyd/agent-core';
```

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Clean
npm run clean
```

## License

MIT

## Author

Floyd Team
