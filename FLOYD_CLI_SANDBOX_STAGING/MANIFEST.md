=== STAGING DIRECTORY MANIFEST ===

**Generated:** Wed Jan 28 16:00:23 EST 2026
**Source:** INK/floyd-agent-sandbox/INK/floyd-cli/src/
**Staging:** FLOYD_CLI_SANDBOX_STAGING/

**Total Files Staged:** 214

### 01-prompt-engine: 11 files
### 02-store-system: 10 files
### 03-permissions: 11 files
### 04-ui-components: 71 files
### 05-agent-system: 9 files
### 06-integration: 25 files
### 07-utilities: 77 files
### 08-docs: 0 files

---

## Detailed File Listing

## 01-prompt-engine
```
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/ContextPrompt.tsx
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/index.ts
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/PromptBuilder.tsx
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/SystemPrompt.tsx
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/TaskPrompt.tsx
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/components/ToolsPrompt.tsx
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/engine.ts
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/few-shot-examples.ts
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/glm-system-prompt.ts
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/system-prompt.ts
FLOYD_CLI_SANDBOX_STAGING/01-prompt-engine/tool-templates.ts
```

## 02-store-system
```
FLOYD_CLI_SANDBOX_STAGING/02-store-system/agent-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/config-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/conversation-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/floyd-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/floyd-store.ts.backup
FLOYD_CLI_SANDBOX_STAGING/02-store-system/history-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/index.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/prompt-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/session-store.ts
FLOYD_CLI_SANDBOX_STAGING/02-store-system/tool-usage-store.ts
```

## 03-permissions
```
FLOYD_CLI_SANDBOX_STAGING/03-permissions/ask-overlay.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/ask-ui.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/index.ts
FLOYD_CLI_SANDBOX_STAGING/03-permissions/PermissionCompact.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/PermissionHistory.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/PermissionModal.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/policies.ts
FLOYD_CLI_SANDBOX_STAGING/03-permissions/risk-classifier.ts
FLOYD_CLI_SANDBOX_STAGING/03-permissions/RiskAssessment.tsx
FLOYD_CLI_SANDBOX_STAGING/03-permissions/store.ts
FLOYD_CLI_SANDBOX_STAGING/03-permissions/tool-policy.ts
```

## 04-ui-components
```
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/AgentVizPanel.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/BudgetMeter.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/index.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/RateLimitGauge.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/SwarmOrchestrator.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/TaskChecklist.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/ThinkingStream.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/agent/types.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/AgentBuilder.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/AnimatedBox.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ChartMini.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/CommandPalette.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/CommandPaletteTrigger.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ConfirmInput.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/DiffViewer.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ErrorBoundary.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/FilePicker.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/GradientBox.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/GradientHeader.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/MarkdownRenderer.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ProgressBar.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ProgressRing.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/SimpleTable.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/StatusBar.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/TerminalEmbed.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ToolCard.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/ToolGrid.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/VoiceInputButton.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/components/WorkerBadge.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/FocusManager.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/Frame.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/Grid.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/index.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/OverlayStack.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/SplitPane.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/Viewport.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/crush/Viewport.tsx.backup
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/index.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/__tests__/layout-memo.test.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/__tests__/props-memo.test.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/__tests__/resize.test.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/__tests__/selector-stability.test.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/DualScreenLayout.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/EnhancedMainLayout.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/index.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/MainLayout.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/MainLayout.tsx.backup
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/MainLayout.tsx.bak
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/layouts/MonitorLayout.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/markdown/markdown-renderer.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/markdown/mde-editor.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/markdown/obsidian-explorer.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/markdown/syntax-highlighter.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/AlertTicker.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/BrowserState.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/EventStream.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/GitActivity.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/SystemMetrics.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/ToolTimeline.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/monitor/WorkerStateBoard.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/CommandPaletteOverlay.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/DiffPreviewOverlay.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/FilePickerOverlay.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/HelpOverlay.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/PermissionAsk.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/overlays/PromptLibraryOverlay.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/panels/ContextPanel.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/panels/index.ts
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/panels/SessionPanel.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/panels/TranscriptPanel.tsx
FLOYD_CLI_SANDBOX_STAGING/04-ui-components/panels/TranscriptPanel.tsx.backup
```

## 05-agent-system
```
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/custom-agent.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/explore-agent.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/manager.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/profiles.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/workers/base-worker.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/workers/browser.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/workers/code-search.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/workers/patch-maker.ts
FLOYD_CLI_SANDBOX_STAGING/05-agent-system/workers/tester.ts
```

## 06-integration
```
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/bridge.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/browser-controller.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/index.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/page-interactor.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/safety-middleware.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/safety/allowlist.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/safety/auth-zones.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/safety/owned-tabs.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/browser/safety/safety-layer.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/client.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/commands.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/events.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/message-types.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/ipc/transport.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/browser-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/cache-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/explorer-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/git-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/patch-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/mcp/runner-server.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/tmux/dock.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/tmux/index.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/tmux/launcher.ts
FLOYD_CLI_SANDBOX_STAGING/06-integration/tmux/session-manager.ts
```

## 07-utilities
```
FLOYD_CLI_SANDBOX_STAGING/07-utilities/cache/__tests__/cache-manager.test.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/cache/cache-manager.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/cache/index.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/agent.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/cli-commands.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/command-handler.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/command-history.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/command-registry.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/dock.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/main.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/monitor.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/slash-commands.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/commands/tmux.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/AgentManager.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/ApiSettings.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/builtin-servers.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/ConfigApp.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/index.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/MonitorConfig.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/config/PromptLibrary.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/obsidian/.gitkeep
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/vector-db/.gitkeep
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/vector-db/index.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/vector-db/local-vector.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/vector-db/pinecone-client.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/integrations/vector-db/weaviate-client.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/layouts/floyd-monitor.json
FLOYD_CLI_SANDBOX_STAGING/07-utilities/modes/plan-mode.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/performance/event-loop-monitor.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/performance/memory-manager.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/performance/performance-monitor.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/adaptive-renderer.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/ansi-parser.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/code-highlighter.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/fallback-renderer.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/markdown-renderer.tsx
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/text-formatter.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/rendering/tty-detector.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/security/api-key-manager.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/security/audit-logger.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/security/encryption.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/security/secret-manager.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/chunk-processor.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/differential-renderer.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/stream-engine.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/streaming-engine.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/tag-parser.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/streaming/validation-pipeline.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/__tests__/layout.test.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/animations.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/borders.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/crush-theme.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/gradients.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/index.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/theme/layout.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/index.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/model-scheduler.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/rate-limiter.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/scheduler.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/swarm-scheduler.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/throughput/tool-scheduler.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/animation-engine.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/cli-parser.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/config.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/diff-parser.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/file-watcher.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/fs.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/logger.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/path-helpers.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/rate-limiter.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/utils/whimsical-phrases.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/validation/input-sanitizer.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/validation/rule-engine.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/validation/schema-validator.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/validation/semantic-validator.ts
FLOYD_CLI_SANDBOX_STAGING/07-utilities/validation/tool-validator.ts
```

