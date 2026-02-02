# Implementation Decisions

**Purpose:** Track decision status for each staged file before merging to main codebase.

**Generated:** 2026-01-28

---

## Decision Legend

| Decision | Meaning | Action |
|----------|---------|--------|
| IMPLEMENT | Safe to merge | Copy from staging to INK/floyd-cli/src/ |
| DEFER | Needs review first | Do not merge until investigated |
| MERGE_MANUALLY | Requires manual resolution | Hand-merge changes |
| SKIP | Not needed | Exclude from merge |
| IN_REVIEW | Currently being evaluated | Decision pending |

---

## 01-prompt-engine (11 files)

### engine.ts
- **Change:** Prompt assembly and construction logic
- **Risk:** Medium - Core to chat functionality
- **Dependencies:** system-prompt.ts, tool-templates.ts, components/
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### system-prompt.ts
- **Change:** System prompt generation
- **Risk:** Medium - Affects all agent behavior
- **Dependencies:** glm-system-prompt.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### glm-system-prompt.ts
- **Change:** GLM-specific system prompt
- **Risk:** Medium - Model-specific behavior
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### tool-templates.ts
- **Change:** Tool description templates
- **Risk:** Low - Template strings
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### few-shot-examples.ts
- **Change:** Few-shot examples for prompts
- **Risk:** Low - Educational content
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/ContextPrompt.tsx
- **Change:** Context prompt component
- **Risk:** Low - UI component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/PromptBuilder.tsx
- **Change:** Prompt builder UI
- **Risk:** Low - UI component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/SystemPrompt.tsx
- **Change:** System prompt component
- **Risk:** Low - UI component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/TaskPrompt.tsx
- **Change:** Task prompt component
- **Risk:** Low - UI component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/ToolsPrompt.tsx
- **Change:** Tools prompt component
- **Risk:** Low - UI component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### components/index.ts
- **Change:** Component exports
- **Risk:** Low - Barrel file
- **Dependencies:** All components
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

---

## 02-store-system (10 files)

### floyd-store.ts
- **Change:** Major refactor, adds dashboard integration
- **Risk:** HIGH - Core state management
- **Dependencies:** dashboard-metrics.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:** 471+ lines changed, needs careful review

### dashboard-metrics.ts
- **Change:** Dashboard metrics tracking
- **Risk:** Medium - New feature
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:** Required by floyd-store.ts

### session-store.ts
- **Change:** Session state management
- **Risk:** Medium - User session data
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### agent-store.ts
- **Change:** Agent state management
- **Risk:** Medium - Agent configuration
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### config-store.ts
- **Change:** Configuration state
- **Risk:** Low - Settings persistence
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### conversation-store.ts
- **Change:** Chat conversation state
- **Risk:** Medium - Chat history
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### history-store.ts
- **Change:** Command history state
- **Risk:** Low - History persistence
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### prompt-store.ts
- **Change:** Prompt library state
- **Risk:** Low - Prompt management
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### tool-usage-store.ts
- **Change:** Tool usage tracking
- **Risk:** Low - Analytics
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### index.ts
- **Change:** Store exports barrel file
- **Risk:** Low - Exports
- **Dependencies:** All stores
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

---

## 03-permissions (11 files)

### policies.ts
- **Change:** Permission policy definitions
- **Risk:** HIGH - Security boundary
- **Dependencies:** risk-classifier.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:** Core to permission system

### risk-classifier.ts
- **Change:** Risk assessment logic
- **Risk:** HIGH - Security classification
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:** Used by policies.ts

### tool-policy.ts
- **Change:** Tool-specific policies
- **Risk:** HIGH - Tool access control
- **Dependencies:** risk-classifier.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### index.ts
- **Change:** Permission exports
- **Risk:** Low - Barrel file
- **Dependencies:** All permission files
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### store.ts
- **Change:** Permission state management
- **Risk:** Medium - Permission UI state
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### ask-ui.tsx
- **Change:** Permission ask UI component
- **Risk:** Medium - User-facing permission UI
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### ask-overlay.tsx
- **Change:** Permission overlay
- **Risk:** Medium - Overlay component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### PermissionCompact.tsx
- **Change:** Compact permission display
- **Risk:** Low - UI variant
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### PermissionHistory.tsx
- **Change:** Permission history view
- **Risk:** Low - Audit display
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### PermissionModal.tsx
- **Change:** Permission modal
- **Risk:** Low - Modal component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### RiskAssessment.tsx
- **Change:** Risk assessment UI
- **Risk:** Low - Display component
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

---

## 04-ui-components (71 files)

**Note:** UI components are mostly independent. Can be selectively implemented.

### Key Components
- **AnimatedBox.tsx** - Animation wrapper
- **CommandPalette.tsx** - Command palette UI
- **DiffViewer.tsx** - Git diff display
- **ErrorBoundary.tsx** - Error catching
- **MarkdownRenderer.tsx** - Markdown rendering
- **ProgressBar.tsx** - Progress indication
- **TerminalEmbed.tsx** - Terminal in UI
- **VoiceInputButton.tsx** - Voice input

### Layouts
- **MainLayout.tsx** - Primary application layout
- **DualScreenLayout.tsx** - Multi-screen support
- **MonitorLayout.tsx** - Monitoring dashboard

### CRUSH Framework
- **Frame.tsx** - Frame component
- **Grid.tsx** - Grid layout
- **SplitPane.tsx** - Split panes
- **Viewport.tsx** - Viewport management

### Monitor Panels
- **AgentVizPanel.tsx** - Agent visualization
- **BudgetMeter.tsx** - Budget display
- **EventStream.tsx** - Event timeline
- **SystemMetrics.tsx** - System stats

### Overlays
- **CommandPaletteOverlay.tsx** - Command palette
- **DiffPreviewOverlay.tsx** - Diff preview
- **FilePickerOverlay.tsx** - File picker
- **HelpOverlay.tsx** - Help screen

**Decision Template for UI Components:**
```
### [Component Name]
- **Change:** [Description]
- **Risk:** Low / Medium / High
- **Dependencies:** [List]
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**
```

---

## 05-agent-system (9 files)

### manager.ts
- **Change:** Agent orchestration logic
- **Risk:** HIGH - Core agent system
- **Dependencies:** workers/, profiles.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### custom-agent.ts
- **Change:** Custom agent support
- **Risk:** HIGH - Agent configuration
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### explore-agent.ts
- **Change:** Code exploration agent
- **Risk:** Medium - Specialized agent
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### profiles.ts
- **Change:** Agent profile definitions
- **Risk:** Low - Configuration
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### workers/base-worker.ts
- **Change:** Base worker class
- **Risk:** HIGH - Worker foundation
- **Dependencies:** None
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### workers/browser.ts
- **Change:** Browser automation worker
- **Risk:** Medium - Browser control
- **Dependencies:** base-worker.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### workers/code-search.ts
- **Change:** Code search worker
- **Risk:** Medium - Search functionality
- **Dependencies:** base-worker.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### workers/patch-maker.ts
- **Change:** Code patch generation
- **Risk:** HIGH - Code modification
- **Dependencies:** base-worker.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

### workers/tester.ts
- **Change:** Test generation worker
- **Risk:** Medium - Test creation
- **Dependencies:** base-worker.ts
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**

---

## 06-integration (25 files)

### MCP Servers
- **browser-server.ts** - Browser MCP server
- **cache-server.ts** - Cache MCP server
- **explorer-server.ts** - File explorer MCP
- **git-server.ts** - Git operations MCP
- **patch-server.ts** - Patch application MCP
- **runner-server.ts** - Command runner MCP

### IPC
- **client.ts** - IPC client
- **server.ts** - IPC server
- **transport.ts** - Transport layer
- **commands.ts** - Command definitions
- **events.ts** - Event handling

### Browser
- **bridge.ts** - Browser bridge
- **browser-controller.ts** - Browser control
- **page-interactor.ts** - Page interaction
- **safety-middleware.ts** - Safety layer
- **safety/** - Safety modules

### Tmux
- **dock.ts** - Tmux docking
- **launcher.ts** - Tmux launcher
- **session-manager.ts** - Session management

**Decision Template for Integration:**
```
### [File Name]
- **Change:** [Description]
- **Risk:** Low / Medium / High
- **Dependencies:** [List]
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**
```

---

## 07-utilities (77 files)

### Cache (3 files)
- cache-manager.ts, index.ts

### Commands (10 files)
- agent.ts, cli-commands.ts, command-handler.ts, command-history.ts, command-registry.ts, dock.ts, main.ts, monitor.tsx, slash-commands.ts, tmux.ts

### Config (7 files)
- AgentManager.tsx, ApiSettings.tsx, builtin-servers.ts, ConfigApp.tsx, index.ts, MonitorConfig.tsx, PromptLibrary.tsx

### Integrations (5 files)
- vector-db/*, obsidian/.gitkeep

### Performance (3 files)
- event-loop-monitor.ts, memory-manager.ts, performance-monitor.ts

### Rendering (7 files)
- adaptive-renderer.tsx, ansi-parser.ts, code-highlighter.ts, fallback-renderer.tsx, markdown-renderer.tsx, text-formatter.ts, tty-detector.ts

### Security (4 files)
- api-key-manager.ts, audit-logger.ts, encryption.ts, secret-manager.ts

### Streaming (6 files)
- chunk-processor.ts, differential-renderer.ts, stream-engine.ts, streaming-engine.ts, tag-parser.ts, validation-pipeline.ts

### Theme (7 files)
- animations.ts, borders.ts, crush-theme.ts, gradients.ts, index.ts, layout.ts

### Throughput (6 files)
- index.ts, model-scheduler.ts, rate-limiter.ts, scheduler.ts, swarm-scheduler.ts, tool-scheduler.ts

### Utils (10 files)
- animation-engine.ts, cli-parser.ts, config.ts, diff-parser.ts, file-watcher.ts, fs.ts, logger.ts, path-helpers.ts, rate-limiter.ts, whimsical-phrases.ts

### Validation (5 files)
- input-sanitizer.ts, rule-engine.ts, schema-validator.ts, semantic-validator.ts, tool-validator.ts

### Modes (1 file)
- plan-mode.ts

### Layouts (1 file)
- floyd-monitor.json

**Decision Template for Utilities:**
```
### [File Name]
- **Change:** [Description]
- **Risk:** Low / Medium / High
- **Dependencies:** [List]
- **Decision:** [ ] IMPLEMENT | [ ] DEFER | [ ] MERGE_MANUALLY | [ ] SKIP | [x] IN_REVIEW
- **Notes:**
```

---

## Implementation Order (Lowest Risk First)

### ROUND 1: Low-Risk Bug Fixes (Day 1)
- [ ] UI jitters fixes
- [ ] Text doubling fixes
- [ ] Chat message flow direction
- [ ] Independent UI components
- [ ] Utility functions

### ROUND 2: Medium-Risk Features (Day 2-3)
- [ ] Permission system enhancements
- [ ] Store updates (non-breaking)
- [ ] Command handlers
- [ ] Theme updates
- [ ] Validation improvements

### ROUND 3: High-Risk Core Changes (Day 4-5)
- [ ] Store system refactor (floyd-store.ts)
- [ ] Prompt engine changes
- [ ] Agent system updates
- [ ] IPC changes

### ROUND 4: Integration Features (Day 6+)
- [ ] Dashboard system
- [ ] Tmux integration
- [ ] Browser subsystem
- [ ] MCP enhancements
- [ ] Worker system

---

## Merge Checklist

Before merging ANY file, verify:

- [ ] Both versions read (sandbox vs main)
- [ ] Exact changes identified (use `diff -u`)
- [ ] Change documented in this file
- [ ] Dependencies staged or existing
- [ ] Decision marked above
- [ ] Risk level assessed
- [ ] Test plan defined

---

## Git Merge Strategy

After verification:

```bash
# Create merge branch
git checkout -b sandbox-merge-attempt

# Copy verified files from staging
cp FLOYD_CLI_SANDBOX_STAGING/[category]/[file] INK/floyd-cli/src/[path]/

# Build and test
cd INK/floyd-cli
npm run build
npm test

# Commit if successful
git add .
git commit -m "feat: merge sandbox changes ([category])"

# Create PR for review
gh pr create --title "feat: merge sandbox changes" --body "See IMPLEMENTATION_DECISIONS.md"
```
