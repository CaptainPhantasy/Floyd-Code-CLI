# FLOYD CLI - Technical Architecture

This document provides technical details about the FLOYD CLI architecture, development workflows, and implementation patterns.

# FLOYD.md - Persistent Agent Protocol v2.0

## I. CORE INITIALIZATION (The "Wake Up" Routine)
**Before answering ANY prompt, you MUST:**
1.  **Check Date/Location:** Verify current system date (e.g., `date -u`). Use this for all timestamping.
2.  **Mount SUPERCACHE:** Call `cache_retrieve(key="system:project_registry")` to identify the active project context.
3.  **Load Project State:** Retrieve the specific project's status key (e.g., `floyd:status` or `floyd:gap_analysis`) to understand the last known state.
4.  **Load System Directive:** Call `cache_retrieve(key="system:directive_llm_optimization")` to activate engine-optimized behaviors.

---

## II. FLOYD CLI - Technical Architecture

This document provides technical details about the FLOYD CLI architecture, development workflows, and implementation patterns.

## Technology Stack

### Frontend
- **Ink** - React for CLI UI components
- **React** - Component-based UI architecture
- **TypeScript** - Type-safe development

### Backend
- **Node.js** - Runtime environment
- **OpenAI SDK** - AI agent integration (configurable for GLM-4, etc.)
- **MCP** - Model Context Protocol for tool integration

### Testing
- **AVA** - Test runner
- **ink-testing-library** - Component testing
- **TypeScript** - Compile-time type checking

## Project Structure

### Core Directories

```
src/
├── cache/                    # SUPERCACHING implementation
│   ├── cache-manager.ts            # CacheManager class (405 lines)
│   └── __tests__/
│       └── cache-manager.test.ts   # Test suite (~450 lines, 24/25 passing)
├── mcp/                      # Model Context Protocol
│   └── cache-server.ts              # MCP server (572 lines)
├── obsidian/                 # Obsidian vault integration
│   ├── md-editor.ts                 # Markdown editing
│   └── vault-manager.ts             # Vault management
├── store/                    # Application state
│   └── floyd-store.ts               # Zustand store (787 lines)
├── ui/                       # UI components
│   ├── components/
│   │   ├── SimpleTable.tsx          # Table display (ESM)
│   │   ├── ConfirmInput.tsx         # Confirm dialogs (ESM)
│   │   └── ProgressBar.tsx          # Progress bars (ESM)
│   ├── layouts/
│   │   └── MainLayout.tsx           # Main application layout
│   └── overlays/
│       └── PromptLibraryOverlay.tsx # Prompt browser
├── config/                   # Configuration UI
│   ├── PromptLibrary.tsx             # Prompt management
│   ├── AgentManager.tsx              # Agent settings
│   └── MonitorConfig.tsx             # Monitor settings
├── app.tsx                   # Main application (660 lines)
└── cli.tsx                   # CLI entry point (32 lines)
```

## SUPERCACHING Architecture

### Three-Tier Design

```typescript
// Cache tier configuration
private readonly tierConfig = {
  reasoning: { ttl: 5 * 60 * 1000, subdir: 'reasoning' },    // 5 minutes
  project:   { ttl: 24 * 60 * 60 * 1000, subdir: 'project' }, // 24 hours
  vault:     { ttl: 7 * 24 * 60 * 60 * 1000, subdir: 'vault' } // 7 days
};
```

### Cache Entry Structure

```typescript
interface CacheEntry {
  key: string;
  value: string;
  expires: number;  // Unix timestamp
  metadata?: Record<string, unknown>;
}
```

### ReasoningFrame Structure

```typescript
interface ReasoningFrame {
  frame_id: string;
  timestamp: number;
  cog_steps: Array<{
    step: number;
    thought: string;
  }>;
  metadata?: Record<string, unknown>;
}
```

### Key Operations

| Method | Purpose | Tier | Validation |
|--------|---------|------|------------|
| `store()` | Store value | Any | Key/value non-empty |
| `load()` | Load value | Any | Returns null if expired |
| `list()` | List entries | Any | Filters expired |
| `delete()` | Delete entry | Any | By key |
| `clear()` | Clear tier | Any | All or specific |
| `storeReasoningFrame()` | Store frame | Reasoning | Structure validation |
| `loadReasoningFrame()` | Load frame | Reasoning | Structure validation |
| `storePattern()` | Store pattern | Vault | Name/value validation |
| `loadPattern()` | Load pattern | Vault | By name |
| `archiveFrame()` | Archive to project | Reasoning→Project | Frame ID |

### Error Handling Strategy

1. **Input Validation** - Reject invalid inputs before filesystem operations
2. **Directory Creation** - Auto-create with `recursive: true`
3. **Error Wrapping** - Contextual error messages
4. **Graceful Degradation** - Non-blocking errors for non-critical operations

Example:
```typescript
try {
  await this.store(tier, key, value, metadata);
} catch (error) {
  throw new Error(`Failed to store in ${tier}: ${error.message}`);
}
```

## MCP Integration

### MCP Server Architecture

The MCP server (`cache-server.ts`) exposes cache operations as tools:

```typescript
// MCP tool definition
{
  name: 'cache_store',
  description: 'Store a value in the cache',
  inputSchema: {
    type: 'object',
    properties: {
      tier: { type: 'string', enum: ['reasoning', 'project', 'vault'] },
      key: { type: 'string' },
      value: { type: 'string' }
    },
    required: ['tier', 'key', 'value']
  }
}
```

### Available MCP Tools

1. **cache_store** - Store values in cache
2. **cache_load** - Load values from cache
3. **cache_list** - List cache entries
4. **cache_clear** - Clear cache entries
5. **cache_store_frame** - Store reasoning frame
6. **cache_load_frame** - Load reasoning frame
7. **cache_store_pattern** - Store pattern in vault
8. **cache_load_pattern** - Load pattern from vault

## UI Component Architecture

### Custom ESM Components

Created to replace incompatible CJS packages:

#### SimpleTable
```typescript
<SimpleTable
  columns={['ID', 'Name', 'Status']}
  data={[
    ['1', 'Alice', 'active'],
    ['2', 'Bob', 'inactive']
  ]}
  truncate={20}  // Max column width
/>
```

#### ConfirmInput
```typescript
<ConfirmInput
  message="Are you sure?"
  onConfirm={(confirmed) => {
    if (confirmed) {
      // Proceed
    }
  }}
  onCancel={() => {
    // Cancel
  }}
/>
```

#### ProgressBar
```typescript
<ProgressBar
  percent={75}  // 0-100
  width={40}    // Character width
/>
```

### Main Layout Structure

```
MainLayout
├── Header
│   ├── Title
│   └── Status
├── Content
│   ├── ConversationArea
│   └── InputArea
├── Overlays (conditional)
│   ├── PromptLibraryOverlay
│   ├── CommandPalette
│   └── HelpOverlay
└── Footer
    ├── Keyboard shortcuts
    └── Status info
```

## State Management

### FloydStore (Zustand)

```typescript
interface FloydStore {
  // UI State
  showPromptLibrary: boolean;
  showCommandPalette: boolean;
  
  // Agent State
  agentConfig: AgentConfig;
  conversationHistory: Message[];
  
  // Cache State
  cacheManager: CacheManager;
  
  // Actions
  togglePromptLibrary: () => void;
  updateAgentConfig: (config: AgentConfig) => void;
  addMessage: (message: Message) => void;
}
```

## Development Workflows

### Build Process

```bash
# 1. TypeScript compilation
tsc --project tsconfig.json

# 2. Output to dist/
dist/
├── cache/
│   ├── cache-manager.js
│   └── cache-manager.d.ts
├── ui/
│   └── components/
│       └── SimpleTable.js
└── ...

# 3. Run from dist/
node dist/cli.js
```

### Testing Workflow

```bash
# 1. Build first (tests import from dist/)
npm run build

# 2. Run tests
npm test

# 3. Test output
# SUPERCACHING: 24/25 tests passing (96%)
# Components: All passing
# Integration: All passing
```

### Module Resolution

**ESM Configuration**:
```json
{
  "type": "module",
  "imports": {
    "#*": "./src/*"
  }
}
```

**Import Patterns**:
```typescript
// Source imports (use relative paths)
import { CacheManager } from './cache/cache-manager.js';

// Test imports (import from dist/)
import { CacheManager } from '../../dist/cache/cache-manager.js';
```

## Performance Considerations

### SUPERCACHING Performance

| Operation | Latency | Bottleneck |
|-----------|---------|------------|
| Store | ~5ms | File I/O |
| Load | ~3ms | JSON parse |
| List | ~10ms | Directory scan |
| Pattern store | ~8ms | File I/O |

### Optimization Strategies

1. **Use appropriate tiers** - Match TTL to use case
2. **Batch operations** - Use `list()` instead of multiple `load()`
3. **Minimize metadata** - Only store necessary data
4. **Clean up expired** - Automatic on access, manual with `clear()`

## Deployment

### Global Installation

```bash
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
npm run build
npm link
```

### Verification

```bash
# Test CLI
floyd-cli --help

# Test cache
ls -la ~/.floyd/cache/

# Test modules
npm test
```

## Best Practices

### Error Handling

```typescript
// Do: Validate inputs early
if (!key || key.trim().length === 0) {
  throw new Error('Cache key cannot be empty');
}

// Do: Wrap errors with context
try {
  await fs.writeFile(filePath, data);
} catch (error) {
  throw new Error(`Failed to write cache entry: ${error.message}`);
}

// Don't: Swallow errors silently
try {
  await operation();
} catch (error) {
  // Bad: Error lost
}
```

### Testing

```typescript
// Do: Use temporary directories for tests
const cacheDir = tmpdir() + `/floyd-test-${Date.now()}`;

// Do: Clean up after tests
await rm(cacheDir, { recursive: true, force: true });

// Do: Test error conditions
await t.exceptionAsync(
  () => cache.store('reasoning', '', 'value'),
  { message: /Cache key cannot be empty/ }
);
```

### Component Design

```typescript
// Do: Use TypeScript types
interface Props {
  message: string;
  onConfirm: (confirmed: boolean) => void;
}

// Do: Provide defaults
export function ProgressBar({ percent = 0, width = 30 }: Props) {
  // ...
}

// Don't: Use any types
function badComponent(props: any) {
  // ...
}
```

## Troubleshooting

### Common Issues

**Issue**: Module not found errors
```bash
# Solution: Build first
npm run build
```

**Issue**: Cache permission errors
```bash
# Solution: Fix permissions
chmod -R 755 ~/.floyd/cache/
```

**Issue**: Tests fail with import errors
```bash
# Solution: Import from dist/ not src/
import { X } from '../../dist/cache/cache-manager.js';
```

## Related Documentation

- [User Guide](readme.md) - Installation and usage
- [SUPERCACHING Guide](docs/SUPERCACHING.md) - Cache system details
- [Quick Start](QUICK_START.md) - Setup instructions
- [Prompt Library](docs/PROMPT_LIBRARY.md) - Prompt management

## Version History

- **v0.1.0** (2026-01-20) - Initial architecture with SUPERCACHING, MCP, and Ink UI
