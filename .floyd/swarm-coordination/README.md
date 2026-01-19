# FLOYD CLI v1.2 - Swarm Coordination

**Mission**: Complete all missing components from CRUSH Edition build plan

**Location**: `/Volumes/Storage/FLOYD_CLI/INK/floyd-cli`

**Current Status**: 65% complete - foundation exists, missing dependencies and advanced features

---

## WAVE DEPLOYMENT STRATEGY

### Wave 1: Dependencies (Parallel - No blockers)

All dependency installations can run in parallel.

| Agent                    | Mission                        | Target Files |
| ------------------------ | ------------------------------ | ------------ |
| **deps-ink-visual**      | Install Ink visual/graphics    | package.json |
| **deps-ink-interaction** | Install Ink interaction        | package.json |
| **deps-ink-viz**         | Install Ink data viz           | package.json |
| **deps-ink-animation**   | Install Ink animation          | package.json |
| **deps-ink-layout**      | Install Ink layout/integration | package.json |
| **deps-core**            | Install core infrastructure    | package.json |

### Wave 2: Core Infrastructure (Depends on: Wave 1)

Foundation for all other features.

| Agent          | Mission                            | Target Files                                                                         |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| **infra-tmux** | TMUX launcher + session management | `src/tmux/launcher.ts`, `src/tmux/session-manager.ts`, `src/tmux/dock.ts`            |
| **infra-ipc**  | IPC event bus (WebSocket)          | `src/ipc/server.ts`, `src/ipc/client.ts`, `src/ipc/events.ts`, `src/ipc/commands.ts` |

### Wave 3: Scheduling & Orchestration (Depends on: Wave 2)

| Agent                | Mission                                | Target Files                                               |
| -------------------- | -------------------------------------- | ---------------------------------------------------------- |
| **sched-rate-limit** | Adaptive rate limiter (2K RPM, 5K cap) | `src/throughput/scheduler.ts`, `src/utils/rate-limiter.ts` |
| **sched-fairness**   | Swarm fairness scheduler               | `src/throughput/swarm-scheduler.ts`                        |
| **sched-model**      | Model call scheduler                   | `src/throughput/model-scheduler.ts`                        |
| **sched-tool**       | Tool call scheduler                    | `src/throughput/tool-scheduler.ts`                         |

### Wave 4: Multi-Agent System (Depends on: Wave 3)

| Agent                | Mission                                     | Target Files                       |
| -------------------- | ------------------------------------------- | ---------------------------------- |
| **agent-manager**    | Manager agent (unlimited tools, 200 budget) | `src/agent/manager.ts`             |
| **agent-codesearch** | CodeSearch worker (40 budget)               | `src/agent/workers/code-search.ts` |
| **agent-patch**      | PatchMaker worker (60 budget)               | `src/agent/workers/patch-maker.ts` |
| **agent-tester**     | Tester worker (50 budget)                   | `src/agent/workers/tester.ts`      |
| **agent-browser**    | Browser worker (50 budget)                  | `src/agent/workers/browser.ts`     |

### Wave 5: Permissions & Security (Parallel - Depends on: Wave 2)

| Agent              | Mission                     | Target Files                                                        |
| ------------------ | --------------------------- | ------------------------------------------------------------------- |
| **perm-ask**       | Permission ASK UI with risk | `src/permissions/ask-ui.tsx`, `src/permissions/risk-classifier.ts`  |
| **perm-store**     | Permission persistence      | `src/permissions/store.ts`, `src/permissions/policies.ts`           |
| **sec-secrets**    | Secret management           | `src/security/secret-manager.ts`, `src/security/api-key-manager.ts` |
| **sec-validation** | Tool validation pipeline    | `src/validation/tool-validator.ts`, `src/validation/rule-engine.ts` |

### Wave 6: MCP Servers (Parallel - Depends on: Wave 2)

| Agent          | Mission             | Target Files                                                         |
| -------------- | ------------------- | -------------------------------------------------------------------- |
| **mcp-patch**  | Patch MCP server    | `tools/mcp-patch-server/src/index.ts`, `parser.ts`, `patcher.ts`     |
| **mcp-runner** | Runner MCP server   | `tools/mcp-runner-server/src/index.ts`, `detector.ts`, `executor.ts` |
| **mcp-git**    | Git integration MCP | `src/mcp/git-server.ts`                                              |

### Wave 7: Chrome & Dock (Parallel - Depends on: Wave 2)

| Agent             | Mission                               | Target Files                               |
| ----------------- | ------------------------------------- | ------------------------------------------ |
| **chrome-safety** | Safety suite (allowlist, auth zones)  | `src/browser/safety/*.ts`                  |
| **tmux-dock**     | Dock commands (:dock btop, tail, ssh) | `src/tmux/dock.ts`, `src/commands/dock.ts` |

### Wave 8: Advanced Features (Parallel - Depends on: Wave 2)

| Agent                 | Mission                      | Target Files                                                                               |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| **feat-streaming**    | Streaming LLM engine         | `src/streaming/streaming-engine.ts`, `src/streaming/differential-renderer.ts`              |
| **feat-perf**         | Performance monitoring       | `src/utils/performance-monitor.ts`, `src/performance/memory-manager.ts`                    |
| **feat-animation**    | CRUSH animation system       | `src/theme/animations.ts`, `src/utils/animation-engine.ts`                                 |
| **feat-optimization** | Virtual scrolling + batching | `src/rendering/adaptive-renderer.tsx`, `src/rendering/differential.ts`                     |
| **feat-obsidian**     | Obsidian integration         | `src/integrations/obsidian/vault-manager.ts`, `src/integrations/obsidian/search-engine.ts` |
| **feat-cmdpalette**   | Enhanced command palette     | `src/ui/overlays/CommandPaletteOverlay.tsx` (upgrade)                                      |

### Wave 9: Polish & Validation (Depends on: All previous)

| Agent             | Mission                             | Target Files  |
| ----------------- | ----------------------------------- | ------------- |
| **polish-linter** | Fix 101 Prettier + 2255 XO warnings | All files     |
| **verify-full**   | Complete verification checklist     | Documentation |

---

## SHARED SPECIFICATIONS

### Package Installations (Wave 1)

```json
{
	"ink-syntax-highlight": "^3.0.0",
	"ink-image": "^3.0.0",
	"ink-color-pipe": "^2.0.0",
	"ink-ascii": "^2.0.0",
	"ink-plot": "^3.0.0",
	"ink-select-input": "^5.0.0",
	"ink-multi-select": "^4.0.0",
	"ink-confirm-input": "^3.0.0",
	"ink-form": "^1.0.0",
	"ink-autocomplete": "^1.0.0",
	"ink-search": "^1.0.0",
	"ink-chart": "^2.0.0",
	"ink-sparkline": "^3.0.0",
	"ink-gauge": "^2.0.0",
	"ink-animated": "^2.0.0",
	"ink-stepper": "^2.0.0",
	"ink-countdown": "^2.0.0",
	"ink-layout": "^3.0.0",
	"ink-scrollbar": "^3.0.0",
	"ink-log": "^5.0.0",
	"ink-terminal": "^3.0.0",
	"ink-diff": "^2.0.0",
	"ink-tree": "^2.0.0",
	"ink-hotkeys": "^2.0.0",
	"ink-figlet": "^2.0.0",
	"node-tmux": "^2.0.0",
	"p-queue": "^7.3.0",
	"marked": "^12.0.0",
	"gray-matter": "^4.0.0",
	"chokidar": "^3.5.0",
	"keytar": "^7.9.0"
}
```

### Rate Limiter Spec (Wave 3)

```typescript
interface RateLimitConfig {
	targetRPM: 2000; // Target requests per minute
	hardCapRPM: 5000; // Absolute maximum
	concurrentModelCalls: 12; // Parallel model invocations
	concurrentTools: 24; // Parallel tool executions
	burstQueueSize: 200; // Queue depth before backpressure
}
```

### Swarm Weights (Wave 4)

```typescript
const SWARM_WEIGHTS = {
	Manager: 2, // Double priority
	CodeSearch: 1,
	PatchMaker: 1,
	Tester: 1,
	Browser: 1,
	GitOps: 1,
};
```

---

## SUCCESS CRITERIA

Each agent must:

1. **Create** all specified files with proper TypeScript types
2. **Integrate** with existing CRUSH theme and Zustand store
3. **Export** clean interfaces for other agents to consume
4. **Document** public APIs with JSDoc comments
5. **Verify** compilation with `npm run build` (zero errors)

---

## COORDINATION PROTOCOL

1. **Read this file first** before starting any work
2. **Mark your task** as `in_progress` in the todo list
3. **Report completion** with file paths created/modified
4. **Never edit** another agent's assigned files without coordination
5. **Use absolute imports** via `@floyd-cli/*` path aliases
