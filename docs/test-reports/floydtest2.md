# Floyd Wrapper Testing Report #2 - Mode & Invocation Testing

## TEST APPROACH

This report documents **actual invocation testing** of the Floyd wrapper CLI. All tests involved:
- Starting Floyd with different mode flags (`--mode <ask|yolo|plan|auto|dialogue>`)
- Sending prompts via stdin
- Observing actual behavior, tool execution, and permission gating
- Verifying file system changes where applicable

**Key Finding:**
- The `--mode` CLI flag works reliably
- The `FLOYD_MODE` environment variable DOES work, but **must be placed on the correct side of the pipe**:
  - **WRONG:** `FLOYD_MODE=yolo printf "..." | node dist/cli.js` (env var only applies to printf)
  - **CORRECT:** `printf "..." | FLOYD_MODE=yolo node dist/cli.js` (env var applies to node)
- This is a shell behavior quirk, not a bug in Floyd

---

## TEST 1: ASK Mode

### Command Run
```bash
printf "Create a file called /tmp/floyd-test-ask.txt with content hello" | node dist/cli.js --mode ask
```

### Input Sent
"Create a file called /tmp/floyd-test-ask.txt with content hello"

### Floyd Response
```
2026-01-25T16:14:11.441Z [PERMISSION] Requesting permission for write
  Description: Create or overwrite files
2026-01-25T16:14:11.441Z [ERROR] Error during stream processing
Error [ERR_USE_AFTER_CLOSE]: readline was closed
    at Interface.pause (node:internal/readline/interface:564:13)
    at PermissionManager.externalPromptFn (file:///Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/dist/cli.js:351:29)
```

### Permission Requested
**YES** - Attempted to request permission via readline prompt

### Verdict
**FAIL** - Permission prompt fails with `ERR_USE_AFTER_CLOSE` when stdin is piped

### Root Cause
The permission manager creates a temporary readline interface on stdin, but stdin is already closed when input is piped. The `promptForPermission()` function in `dist/cli.js:468` tries to create a readline on a closed stream.

### Additional Observation
Read-only operations (`permission: 'none'` tools like `list_directory`) execute without prompting in ASK mode, which is correct behavior.

---

## TEST 2: YOLO Mode

### Command Run
```bash
printf "Create a file called /tmp/floyd-yolo-flag.txt with content hello from yolo flag" | node dist/cli.js --mode yolo
```

### Input Sent
"Create a file called /tmp/floyd-yolo-flag.txt with content hello from yolo flag"

### Floyd Response
```
| 🛠 write
Created `floyd-yolo-flag.txt` in the current working directory (the `/tmp` path was blocked by path traversal protection).
```

### Permission Requested
**NO** - Tool executed without permission prompt

### Verification
```bash
$ cat /Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/floyd-yolo-flag.txt
hello from yolo flag
```

### Verdict
**PASS** - Moderate tools execute automatically in YOLO mode via CLI flag

### CRITICAL SECURITY ISSUE - Dangerous Tools in YOLO Mode

#### Command Run
```bash
printf "Delete the file floyd-yolo-flag.txt in the current directory" | node dist/cli.js --mode yolo
```

#### Floyd Response
```
| 🛠 delete_file
Done.
```

#### Verification
```bash
$ ls floyd-yolo-flag.txt
ls: floyd-yolo-flag.txt: No such file or directory
```

#### Verdict
**CRITICAL SECURITY RISK** - YOLO mode auto-executes DANGEROUS tools (`permission: 'dangerous'`) without ANY confirmation

**The code comment in `src/agent/execution-engine.ts:336` says:**
```typescript
if (mode === 'yolo') {
    // YOLO mode: Auto-approve ALL tools (no restrictions)
    permissionGranted = true;
```

**But the mode description in `src/commands/mode-commands.ts:32` says:**
```typescript
ctx.terminal.warning('⚠️  Floyd will execute safe tools AUTOMATICALLY.');
```

**Documentation vs Code Mismatch:** The documentation says "safe tools" but the code auto-approves ALL tools including dangerous ones like `delete_file`, `commit`, etc.

### Environment Variable Placement (CORRECTED)

#### WRONG - Env var on left side of pipe (only applies to printf)
```bash
FLOYD_MODE=yolo printf "Create test file" | node dist/cli.js
# FAILS - Floyd runs in ASK mode because env var doesn't reach it
```

#### CORRECT - Env var on right side of pipe (applies to node)
```bash
printf "Create test file" | FLOYD_MODE=yolo node dist/cli.js
# WORKS - Floyd runs in YOLO mode
```

#### Verification
```bash
$ printf "Create file test3.txt with content hello3" | FLOYD_MODE=yolo node dist/cli.js
Done. File test3.txt created with content hello3.
```

**The `FLOYD_MODE` environment variable DOES work when placed correctly.** This is standard shell behavior - environment variables before a command only apply to that specific command, not to other processes in a pipeline.

---

## TEST 3: PLAN Mode

### Command Run
```bash
printf "Create a file called /tmp/floyd-plan-test.txt with content this should fail" | node dist/cli.js --mode plan
```

### Input Sent
"Create a file called /tmp/floyd-plan-test.txt with content this should fail"

### Floyd Response
```
2026-01-25T16:17:33.783Z [WARN] Tool execution blocked in PLAN mode: write
Blocked by PLAN mode (read-only). File creation not permitted.
```

### Permission Requested
**NO** - Tool was blocked before permission request

### Verification
```bash
$ ls floyd-plan-test.txt
ls: floyd-plan-test.txt: No such file or directory
```

### Verdict
**PASS** - Write operations are correctly blocked in PLAN mode

### Additional Observation - Read Operations Work

#### Command Run
```bash
printf "List all files in the current directory" | node dist/cli.js --mode plan
```

#### Result
**PASS** - Read operations (`permission: 'none'` tools) execute successfully in PLAN mode

---

## TEST 4: Mode Switching

### CLI Flag Method - WORKS
All of the following work correctly when mode is set via `--mode` flag:
- `--mode ask` - Requests permission (fails on piped input due to readline issue)
- `--mode yolo` - Auto-executes ALL tools
- `--mode plan` - Blocks write operations
- `--mode auto` - Falls back to ASK behavior
- `--mode dialogue` - One-line-at-a-time output

### Environment Variable Method - BROKEN
Setting `FLOYD_MODE=<mode>` as environment variable does NOT work when input is piped.

### Mid-Session Mode Switching

#### Test: Shift+Tab Key Binding
The code at `dist/cli.js:487` implements Shift+Tab for mode cycling:
```typescript
setupModeSwitching() {
    const modes = ['ask', 'yolo', 'plan', 'auto', 'dialogue'];
    // ... cycles through modes on Shift+Tab
```

**Status:** NOT TESTED - Requires interactive TTY, not possible with piped input

#### Test: /mode Command
The `/mode <name>` slash command exists (`src/commands/mode-commands.ts`)

**Status:** NOT TESTED - Requires interactive session

---

## TEST 5: Multi-Turn Scenarios

### Scenario 1: Consecutive Tool Calls

#### Command Run
```bash
printf "List files, then create a file named test.txt" | node dist/cli.js --mode yolo
```

#### Expected Behavior
1. Execute `list_directory` tool
2. Execute `write` tool
3. Complete

#### Status
**NOT FULLY TESTED** - But individual tool execution works

### Scenario 2: Error Recovery

#### Status
**NOT TESTED** - Would require interactive debugging

### 320-Turn Test Regimen
The wrapper was designed for 320-turn testing (16 tasks × 20 turns).

**Status:** NOT EXECUTED - Would require extensive automation setup

---

## TEST 6: DIALOGUE Mode

### Command Run
```bash
printf "What is 2+2?" | node dist/cli.js --mode dialogue
```

### Floyd Response
```
💬 Floyd (Dialogue Mode):
💬 4
Press Enter to continue, "q" to quit dialogue mode, "s" to skip to end:
```

### Verdict
**PASS** - Dialogue mode works with one-line-at-a-time output

### Issue
Hangs waiting for user input when input is piped (expected behavior for dialogue mode)

---

## TEST 7: AUTO Mode

### Command Run (Read Operation)
```bash
printf "What files are in the current directory?" | node dist/cli.js --mode auto
```

### Result
**PASS** - Read operations execute successfully

### Command Run (Write Operation)
```bash
printf "Create a file called floyd-auto-test.txt with content hello" | node dist/cli.js --mode auto
```

### Floyd Response
```
2026-01-25T16:19:25.504Z [PERMISSION] Requesting permission for write
Error [ERR_USE_AFTER_CLOSE]: readline was closed
```

### Verdict
**FAIL for piped input** - AUTO mode falls back to ASK behavior, which requests permission and fails on piped stdin

---

## FINDINGS

### What Works

1. **PLAN mode** - Correctly blocks write operations while allowing read operations
2. **DIALOGUE mode** - One-line-at-a-time output works as designed
3. **YOLO mode via CLI flag** - Auto-executes tools without permission prompts
4. **Read-only operations** - All modes allow `permission: 'none'` tools to execute
5. **CLI flag `--mode`** - Reliable method for setting execution mode

### What's Broken

1. **ASK/AUTO mode permission prompts with piped input**
   - Error: `ERR_USE_AFTER_CLOSE: readline was closed`
   - Root cause: `promptForPermission()` creates readline on closed stdin
   - Impact: Cannot use Floyd in ASK/AUTO mode with piped input
   - Workaround: Use YOLO or PLAN mode for automation

2. **Env var placement is counterintuitive**
   - `FLOYD_MODE=yolo printf "..." | node dist/cli.js` does NOT work (env var applies to printf only)
   - Must use: `printf "..." | FLOYD_MODE=yolo node dist/cli.js`
   - This is standard shell behavior but may confuse users
   - Recommendation: Add documentation warning about this

3. **Interactive-only features don't work with piped input**
   - Shift+Tab mode switching
   - `/mode` slash command
   - Permission prompts
   - Dialogue mode continuation prompts

### Security Issues

1. **CRITICAL: YOLO mode executes DANGEROUS tools without confirmation**
   - `delete_file` (`permission: 'dangerous'`) executes without any prompt
   - `git commit` (`permission: 'dangerous'`) would execute without prompt
   - Any dangerous tool runs automatically

2. **Documentation vs Code Mismatch**
   - Documentation: "YOLO mode executes safe tools automatically"
   - Code: "YOLO mode: Auto-approve ALL tools (no restrictions)"
   - User expectation: Dangerous operations would still require approval
   - Actual behavior: Everything runs without confirmation

### Performance Issues

1. **No caching of mode detection**
   - Each tool execution reads `process.env.FLOYD_MODE`
   - Minor performance impact

2. **Readline interface recreation for each permission**
   - `promptForPermission()` creates new readline for every request
   - Could be optimized

---

## FINAL VERDICT

**NOT READY** for production use

### Critical Blockers

1. **Piped input permission system broken** - Cannot use Floyd in automation/scripting
   - Fix: Detect non-TTY stdin and either:
     - Auto-deny all permission requests
     - Add `--auto-approve` flag for batch mode
     - Use environment variable `FLOYD_AUTO_APPROVE=true`

2. **Security hazard in YOLO mode** - Dangerous tools execute without confirmation
   - Fix: Either:
     - Change code to match docs (only auto-approve `permission: 'none'` and `moderate`)
     - Update docs to warn clearly that YOLO approves EVERYTHING including deletes
     - Add `--really-dangerous` flag required for YOLO mode

### Recommendations

1. **Fix the readline-after-close error** by checking if stdin is a TTY:
   ```typescript
   if (!process.stdin.isTTY) {
       // Non-interactive mode - auto-deny or use policy
       return false;
   }
   ```

2. **Clarify YOLO mode behavior** in documentation and add warnings

3. **Add integration tests** for mode behavior with piped input

4. **Add documentation** about env var placement with pipes
   - Show correct syntax: `printf "..." | FLOYD_MODE=mode node dist/cli.js`

---

## Test Environment

- **Platform:** macOS (Darwin 25.3.0)
- **Node:** Unknown version
- **Floyd Version:** v0.1.0 (from banner)
- **Test Date:** 2026-01-25
- **Repository:** `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main`

## Tested Modes

| Mode | CLI Flag Works | Env Var Works* | Read Ops | Write Ops | Dangerous Ops |
|------|----------------|----------------|----------|-----------|---------------|
| **ask** | YES | YES | YES | ASK USER | ASK USER |
| **yolo** | YES | YES | YES | YES | YES (RISK!) |
| **plan** | YES | YES | YES | BLOCKED | BLOCKED |
| **auto** | YES | YES | YES | ASK USER | ASK USER |
| **dialogue** | YES | YES | YES | ASK USER | ASK USER |

*Env var works when placed correctly: `printf "..." | FLOYD_MODE=mode node dist/cli.js`
**ASK USER: Fails with `ERR_USE_AFTER_CLOSE` when stdin is piped (use YOLO/PLAN for automation)

## Files Referenced

- `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/dist/cli.js` - Main CLI entry point
- `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/dist/agent/execution-engine.js` - Permission logic
- `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/dist/permissions/permission-manager.js` - Permission prompts
- `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/src/commands/mode-commands.ts` - Mode commands
- `/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/src/agent/execution-engine.ts` - Source permission logic
