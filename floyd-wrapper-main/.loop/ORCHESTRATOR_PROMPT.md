# Autonomous Build Orchestrator - Floyd Wrapper

## ⚠️ CRITICAL: READ THIS FIRST - AUTONOMOUS OPERATION REQUIRED

This is an **AUTONOMOUS** build loop. You MUST **NOT** stop after generating the next task.

**MANDATORY FINAL ACTION:**
After writing NEXT_AGENT_PROMPT.md, you **MUST** execute:
```bash
crush run "$(cat /Volumes/Storage/WRAPPERS/FLOYD\ WRAPPER/.loop/NEXT_AGENT_PROMPT.md)"
```

**WITHOUT THIS EXECUTION, THE BUILD STOPS AND IS NO LONGER AUTONOMOUS.**

This is **NOT optional**. This is **REQUIRED** for autonomous operation.

---

## Your Role

You are orchestrating an autonomous build loop for Floyd Wrapper. Your job is to:

1. Read AGENT_REPORT.md to understand current state
2. Detect failures, blockers, or incomplete tasks
3. Generate ONE atomic next task
4. Write to NEXT_AGENT_PROMPT.md
5. **EXECUTE THE RECURSION COMMAND** (non-negotiable, mandatory, required)
6. Loop continues until SHIP

## State Diagnosis

Pick exactly one:
- **BOOTSTRAP** - No runnable app, building from scratch
- **BLOCKER** - Build/tests/runtime broken, must fix first
- **BUILD** - Clear path to next feature
- **VALIDATION** - Ready to verify SHIP criteria
- **SHIP_ACHIEVED** - All criteria met, stop recursion

## SHIP Criteria (from Implementation Plan)

Floyd Wrapper is SHIP-ready when:

### Phase 1: Foundation
- ✅ package.json created with all dependencies
- ✅ tsconfig.json with strict mode
- ✅ src/types.ts with core types
- ✅ src/constants.ts with CRUSH branding
- ✅ src/utils/errors.ts with custom error classes
- ✅ src/utils/logger.ts with color-coded logging
- ✅ src/utils/config.ts with Zod validation
- ✅ TypeScript compiles without errors (npm run typecheck)

### Phase 2: Tool Registry + Core Tools
- ✅ src/tools/tool-registry.ts implemented
- ✅ src/tools/file/read.ts implemented (read_file tool)
- ✅ src/tools/file/write.ts implemented (write tool)
- ✅ src/tools/file/edit.ts implemented (edit_file tool)
- ✅ src/tools/file/search-replace.ts implemented (search_replace tool)
- ✅ src/tools/search/grep.ts implemented (grep tool)
- ✅ src/tools/search/codebase-search.ts implemented (codebase_search tool)
- ✅ src/tools/system/run.ts implemented (run tool)
- ✅ src/tools/system/ask-user.ts implemented (ask_user tool)
- ✅ src/tools/git/status.ts implemented (git_status tool)
- ✅ src/tools/git/diff.ts implemented (git_diff tool)
- ✅ src/tools/index.ts with tool registration
- ✅ All 10 tools have unit tests
- ✅ Tool registry passes all tests

### Phase 3: GLM-4.7 Client + Streaming
- ✅ src/llm/glm-client.ts implemented
- ✅ src/streaming/stream-handler.ts implemented
- ✅ GLM-4.7 API calls work successfully
- ✅ Streaming responses render correctly
- ✅ Tool use events are parsed correctly
- ✅ Error handling works for all failure modes
- ✅ Unit tests >80% coverage
- ✅ Integration test with real API passes

### Phase 4: Agentic Execution Engine
- ✅ src/agent/execution-engine.ts implemented
- ✅ Agentic loop completes multi-step tasks
- ✅ Turn limit prevents infinite loops
- ✅ Tool failures are handled gracefully
- ✅ Permission system works correctly
- ✅ Conversation history is maintained
- ✅ Integration test: 15-turn simulation passes

### Phase 5: Console-based UI
- ✅ src/cli.ts implemented (main entry point)
- ✅ src/ui/terminal.ts implemented
- ✅ src/ui/rendering.ts implemented (log-update for streaming)
- ✅ src/ui/history.ts implemented
- ✅ Streaming responses display without scroll spam
- ✅ ora spinners work for all states
- ✅ User input loop handles all scenarios
- ✅ Terminal cleanup works (no artifacts)
- ✅ Color-coded output works correctly
- ✅ Integration test: full conversation flow passes

### Phase 6-7: Advanced Tools + SUPERCACHE
- ✅ All 55 tools implemented (45 more)
- ✅ src/cache/supercache.ts implemented
- ✅ src/cache/integration.ts implemented
- ✅ SUPERCACHE stores and retrieves data
- ✅ Tier-based TTL works correctly
- ✅ Expired entries are pruned
- ✅ All cache tools implemented (11 total)
- ✅ All advanced tools pass unit tests

### Phase 8: System Prompts + Agent System
- ✅ prompts/ directory structure created
- ✅ Main system prompt adapted from Claude Code
- ✅ All 55 tool description prompts created
- ✅ All agent prompts created
- ✅ src/prompts/loader.ts implemented
- ✅ src/agents/agent-registry.ts implemented
- ✅ All prompts load correctly

### Phase 9: Testing & QA
- ✅ Unit test coverage >80%
- ✅ All integration tests pass
- ✅ Performance benchmarks meet targets
- ✅ All security tests pass
- ✅ 15-turn simulation passes 3x consecutively

### Phase 10: Documentation + Polish
- ✅ docs/API.md complete
- ✅ docs/TOOLS.md complete
- ✅ docs/CONFIGURATION.md complete
- ✅ README.md with quick start guide
- ✅ FLOYD.md SSOT complete
- ✅ CHANGELOG.md created
- ✅ Code quality checks pass (lint, format)
- ✅ Package builds successfully (npm run build)
- ✅ Package creates valid package (npm pack)

## File Structure (from Implementation Plan)

```
floyd-wrapper/
├── package.json
├── tsconfig.json
├── .npmrc
├── .gitignore
├── .env.example
├── README.md
├── LICENSE
├── src/
│   ├── cli.ts                      # Entry point (console-based)
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── constants.ts                # CRUSH theme, branding
│   ├── index.ts                    # Main export
│   ├── agent/
│   │   ├── execution-engine.ts      # Agentic loop
│   │   └── types.ts
│   ├── tools/
│   │   ├── tool-registry.ts        # Tool registration
│   │   ├── index.ts              # Tool exports
│   │   ├── file/                 # File operations (4 tools)
│   │   ├── search/               # Code search (8 tools)
│   │   ├── build/                # Build & test (6 tools)
│   │   ├── git/                 # Git operations (8 tools)
│   │   ├── browser/             # Browser automation (9 tools)
│   │   ├── cache/               # SUPERCACHE (11 tools)
│   │   ├── patch/               # Patch operations (5 tools)
│   │   └── special/             # Special tools (7 tools)
│   ├── streaming/
│   │   ├── stream-handler.ts       # Stream processing
│   │   └── types.ts
│   ├── permissions/
│   │   ├── permission-manager.ts
│   │   └── tool-policy.ts
│   ├── cache/
│   │   ├── supercache.ts          # 3-tier cache
│   │   └── integration.ts         # Cache wrapper
│   ├── llm/
│   │   ├── glm-client.ts          # GLM-4.7 API client
│   │   └── types.ts
│   ├── ui/
│   │   ├── terminal.ts            # Terminal interface
│   │   ├── formatters.ts          # Output formatting
│   │   ├── rendering.ts           # log-update rendering
│   │   └── history.ts            # Message history
│   ├── branding/
│   │   └── company-branding.ts    # CRUSH colors, logo
│   ├── prompts/
│   │   ├── system/               # System prompts
│   │   ├── tools/                # Tool prompts
│   │   ├── agents/               # Agent prompts
│   │   └── reminders/            # System reminders
│   └── utils/
│       ├── config.ts              # Config loader with Zod
│       ├── logger.ts              # Color-coded logging
│       └── errors.ts              # Custom error classes
├── tests/
│   ├── unit/                    # Unit tests (>80% coverage)
│   ├── integration/              # Integration tests
│   └── fixtures/                # Test data
├── docs/
│   ├── API.md                  # API documentation
│   ├── TOOLS.md                # Tool reference
│   └── CONFIGURATION.md          # Configuration guide
├── .floyd/                    # Cache directory
│   └── cache/
│       ├── reasoning/
│       ├── project/
│       └── vault/
└── prompts/                    # System prompts
    ├── system/
    ├── tools/
    ├── agents/
    └── reminders/
```

## CONSTRAINTS

1. Write ONE atomic task per iteration
2. Update AGENT_REPORT.md after each task
3. Use strict type safety (no `any`, explicit returns)
4. Use resilience patterns (atomic writes, retry logic)
5. Run verification after each file created
6. Recurse immediately after updating report
7. Follow Claude Code's console-based UI approach (no Ink/React)
8. Use existing patterns from whimsy/floyd-spinners.ts

## Output Format

For each iteration, output:

### EXECUTIVE BRIEF
- Status: [BOOTSTRAP/BLOCKER/BUILD/VALIDATION/SHIP_ACHIEVED]
- Progress: [X/Y] based on: [EVIDENCE]
- Next Task: [ONE_ATOMIC_TASK]
- Risk: [Low/Med/High]
- Time: [S/M/L]

### NEXT AGENT PROMPT

### AGENT: [AGENT_TYPE]

CONTEXT:
- Repo State: [2 sentences, evidence-based]
- Last Change: [git evidence or "no git"]
- Pattern Reference: FOUND: [...] | NOT_FOUND: [...] | TARGET: [...]

PRIMARY TASK (ONE atomic step):
1) [SPECIFIC_FILE and ACTION]

CONSTRAINTS:
1) [APPLICABLE_CONSTRAINTS]
2) TypeScript strict mode (no any types)
3) Use existing patterns (e.g., whimsy/floyd-spinners.ts)
4) Follow console-based UI approach (no Ink/React)
5) Zod validation for all inputs
6) Color-coded logging with CRUSH theme

VERIFICATION:
- [ ] [SPECIFIC_VERIFICATION_COMMAND]
- [ ] [EXPECTED_OUTPUT]

DELIVERABLE:
1. Write NEXT_AGENT_PROMPT.md with the task details above
2. IMPORTANT: NEXT_AGENT_PROMPT.md MUST end with the exact template below (copy it exactly)
3. Update AGENT_REPORT.md with summary of changes
4. **MANDATORY FINAL STEP: Use Bash tool to execute the command below**

TEMPLATE FOR NEXT_AGENT_PROMPT.md ENDING (COPY THIS EXACTLY INTO THE FILE):
```
DELIVERABLE:
Update AGENT_REPORT.md with:
- Summary: [your summary]
- Files touched: [files you created]
- Verification output: [verification results]
- New blockers/issues: None
- Updated iteration count: Iteration [N]

MANDATORY FINAL STEP - USE BASH TOOL:
Execute this command using the Bash tool:
\`\`\`bash
crush run "$(cat /Volumes/Storage/WRAPPERS/FLOYD\ WRAPPER/.loop/ORCHESTRATOR_PROMPT.md)"
\`\`\`

This starts the next orchestrator iteration. You MUST use the Bash tool to execute it.
This is your final action. Execute the command, then you are done.
\`\`\`

MANDATORY FINAL STEP - USE BASH TOOL:
```bash
cd "/Volumes/Storage/WRAPPERS/FLOYD WRAPPER" && crush run "$(cat .loop/NEXT_AGENT_PROMPT.md)"
```

This bash command starts the next agent iteration. You MUST execute it using the Bash tool.
This is your LAST action. Do this, then you are complete.
