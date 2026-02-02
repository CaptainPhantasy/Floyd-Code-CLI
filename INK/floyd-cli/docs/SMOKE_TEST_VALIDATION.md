# Floyd CLI Smoke Test Validation Report

**Date:** 2026-01-25 07:12 AM
**Version:** floyd-cli@0.1.0

## Fixes Applied

### 1. ✅ Scrolling Support Added
- Added `scrollOffset` state to ConversationalLayout
- Connected scrollOffset prop to MessageHistory component
- Keyboard handlers implemented:
  - **PgUp / Shift+↑**: Scroll up 3 messages
  - **PgDn / Shift+↓**: Scroll down 3 messages
  - **Ctrl+[**: Jump to oldest messages
  - **Ctrl+]**: Jump to newest messages
- Scroll indicators show message counts above/below viewport

### 2. ✅ API Environment Variables Fixed
- Now supports both `FLOYD_GLM_*` and `GLM_*` prefixed env vars
- Default endpoint updated to GLM Coding Plan endpoint: `https://api.z.ai/api/coding/paas/v4`
- Default model updated to `glm-4.7`
- Checks `~/.floyd/.env.local` for global user configuration

### 3. ✅ Command Palette Actions Working
- Commands with `action()` handlers execute immediately when selected
- `createCommandsWithHandlers()` pattern ensures proper execution
- Quick actions (1-4) after assistant response now functional:
  - **1**: Apply - requests Floyd to apply suggested changes
  - **2**: Explain - requests detailed explanation
  - **3**: Diff - shows diff preview overlay or requests diff format
  - **4**: Undo - reverts to previous conversation state

### 4. ✅ 50-Tool Parity
- All 50 tools from floyd-wrapper available in floyd-cli
- Tools organized in 8 categories: file, git, search, cache, browser, patch, special, system
- System prompt includes tool capabilities documentation

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Toggle ZEN mode |
| Ctrl+V | Toggle VIBE mode |
| Ctrl+B | Flash breadcrumb (2sec in ZEN) |
| Ctrl+I | Flash mood/confidence (2sec in ZEN) |
| Ctrl+T | Toggle thinking preview |
| Ctrl+P | Command palette |
| Ctrl+/ | Help overlay |
| Shift+Tab | Cycle safety mode (YOLO/ASK/PLAN) |
| Ctrl+M | Toggle monitor dashboard |
| PgUp/Shift+↑ | Scroll up messages |
| PgDn/Shift+↓ | Scroll down messages |
| Ctrl+[ | Jump to oldest |
| Ctrl+] | Jump to newest |
| 1-4 | Quick actions (after response) |
| Esc | Exit/Close overlay |

## Test Verification Steps

1. **UI Launch**: Run `floyd-cli` - should show FLOYD banner and greeting
2. **Scrolling**: After several messages, use PgUp/Shift+↑ to scroll up
3. **Command Palette**: Press Ctrl+P or `/` and select a command
4. **Quick Actions**: After getting a response, press 1-4 to test actions
5. **API Connection**: Send a message and verify response streams back

## Environment Configuration

Create `~/.floyd/.env.local` with:
```bash
FLOYD_GLM_API_KEY=your-api-key-here
FLOYD_GLM_ENDPOINT=https://api.z.ai/api/coding/paas/v4
FLOYD_GLM_MODEL=glm-4.7
```

Or create `.env` in the project directory with the same variables.

## Known Limitations

1. **Text Highlighting**: Terminal-based highlighting depends on terminal emulator capabilities - not controllable by the CLI
2. **Copy/Paste**: Handled by terminal emulator, not the CLI application

## Build Commands

```bash
cd INK/floyd-cli
npm run build
npm link
floyd-cli  # or floyd
```
