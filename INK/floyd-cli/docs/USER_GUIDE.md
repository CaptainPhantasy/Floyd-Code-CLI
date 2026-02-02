# 📘 FLOYD CLI USER GUIDE

**Version:** Premium UI/UX v2.0
**Last Updated:** January 25, 2026

---

## 🚀 QUICK START

```bash
# Start Floyd CLI
floyd

# Start with custom username
floyd --name "YourName"

# Start with Chrome bridge enabled
floyd --chrome
```

---

## 🎮 INTERFACE MODES

Floyd CLI offers three distinct interface modes to match your workflow:

### NORMAL MODE (Default)
Full-featured interface with all premium UI elements visible.

**What you see:**
- Status bar with connection/safety indicators
- Breadcrumb showing project context
- Thinking preview pane
- Mood/confidence indicator
- Quick action chips
- Double-bordered input frame

### ZEN MODE 🧘
**Hotkey:** `Ctrl+Z`

Minimal, distraction-free interface. Perfect for senior developers and flow state coding.

**What you see:**
- Just conversation history
- Simple single-bordered input
- Nothing else

**Features still work:**
- All hotkeys remain active
- Press `Ctrl+B` to flash breadcrumb (shows 2 seconds)
- Press `Ctrl+I` to flash confidence (shows 2 seconds)
- Number keys `1-4` still trigger quick actions

### VIBE MODE 🎵
**Hotkey:** `Ctrl+V`

Fast-paced creative mode for rapid iteration.

**Indicated by:** "VIBE" badge in status bar (pink)

---

## ⌨️ COMPLETE HOTKEY REFERENCE

### Mode Switching
| Hotkey | Action | Description |
|--------|--------|-------------|
| `Ctrl+Z` | Toggle ZEN Mode | Remove all UI chrome |
| `Ctrl+V` | Toggle VIBE Mode | Fast creative mode |

### Information Display
| Hotkey | Action | Description |
|--------|--------|-------------|
| `Ctrl+B` | Show Breadcrumb | Flash project/file/task context |
| `Ctrl+I` | Show Confidence | Flash mood/confidence indicator |
| `Ctrl+T` | Toggle Thinking | Show/hide thinking preview pane |

### Quick Actions (after Floyd responds)
| Hotkey | Action | Description |
|--------|--------|-------------|
| `1` | Apply | Apply Floyd's suggestion |
| `2` | Explain | Ask for more explanation |
| `3` | Diff | Show the changes as a diff |
| `4` | Undo | Revert the last action |

### Navigation
| Hotkey | Action | Description |
|--------|--------|-------------|
| `Ctrl+P` | Command Palette | Open command search |
| `Ctrl+/` | Help | Show keyboard shortcuts |
| `?` | Help | Show help (when input empty) |
| `/` | Command Palette | Alternative trigger |

### Safety Modes
| Hotkey | Action | Description |
|--------|--------|-------------|
| `Shift+Tab` | Cycle Safety | YOLO → ASK → PLAN |
| `Ctrl+Y` | Toggle YOLO | Quick toggle dangerous mode |

### System
| Hotkey | Action | Description |
|--------|--------|-------------|
| `Enter` | Send | Submit your message |
| `Shift+Enter` | New Line | Add newline in input |
| `Ctrl+L` | Clear | Clear screen |
| `Ctrl+K` | New Chat | Start new conversation |
| `Ctrl+M` | Monitor | Open system dashboard |
| `Ctrl+E` | Export | Export transcript |
| `Esc` | Exit | Close overlay or exit |
| `Ctrl+Q` | Quit | Force quit Floyd |
| `Ctrl+C` | Interrupt | Cancel current operation |

---

## 🛡️ SAFETY MODES

Floyd has three safety modes that control how it handles dangerous operations:

### YOLO Mode 🔴
**Color:** Red

- Floyd executes commands immediately
- No confirmation prompts
- Use with caution!
- Best for: Trusted environments, rapid prototyping

### ASK Mode 🟡 (Recommended)
**Color:** Yellow

- Floyd asks permission before dangerous operations
- You approve or deny each action
- Best for: Normal development work

### PLAN Mode 🔵
**Color:** Blue

- Floyd creates a plan before executing
- You review the full plan first
- Most cautious approach
- Best for: Critical systems, learning

**To change:** Press `Shift+Tab` to cycle through modes.

---

## 📍 BREADCRUMB BAR

The breadcrumb shows your current context:

```
📁 my-project > 📄 components/Button.tsx > 🎯 Add hover state
```

**Components:**
- 📁 **Project Name** - Current working directory
- 📄 **Current File** - File being edited (if any)
- 🎯 **Current Task** - Active task description

**In ZEN mode:** Press `Ctrl+B` to flash it briefly.

---

## 🎭 MOOD/CONFIDENCE INDICATOR

Floyd shows its confidence level:

| Emoji | Confidence | Meaning |
|-------|------------|---------|
| 🧠 | 95%+ | Highly confident |
| 😊 | 80-94% | Confident |
| 🤔 | 60-79% | Exploring options |
| ⚠️ | <60% | Uncertain |

**During thinking:** Shows 🤔 thinking...

**In ZEN mode:** Press `Ctrl+I` to flash it briefly.

---

## 💭 THINKING PREVIEW

Shows what Floyd is thinking in real-time:

```
╭───────────────────────────────────────╮
│ 🌙 Thinking Preview (Ctrl+T to collapse)
│   • Analyzing the React component structure...
│   ✓ read_file
│   ◉ search_files (running)
╰───────────────────────────────────────╯
```

**Icons:**
- `○` Pending
- `◉` Running
- `✓` Complete

**Toggle:** Press `Ctrl+T` to show/hide.

---

## ⚡ QUICK ACTIONS

After Floyd responds, you'll see action chips:

```
[1 Apply] [2 Explain] [3 Diff] [4 Undo]
```

**Just press the number key!** No need to type or click.

| Key | Action | What it does |
|-----|--------|--------------|
| `1` | Apply | Implement the suggestion |
| `2` | Explain | Get more details |
| `3` | Diff | See changes visually |
| `4` | Undo | Revert changes |

**In ZEN mode:** Actions still work, just no visual chips.

---

## 🎨 STATUS BAR

```
F L O Y D CLI                    ZEN ● ASK
```

**Left side:** FLOYD branding (gradient colors)
**Right side:**
- Mode indicator (ZEN/VIBE if active)
- Connection status (● green = connected)
- Safety mode (YOLO/ASK/PLAN)

---

## 📊 MONITOR DASHBOARD

**Hotkey:** `Ctrl+M`

Opens a comprehensive system dashboard showing:
- Token usage statistics
- Tool performance metrics
- Error analysis
- Memory usage
- Response times
- Cost tracking

**Press `Esc` to return to chat.**

---

## 💬 CONVERSATION TIPS

### Effective Prompts
```
❯ refactor this function to use async/await
❯ add error handling to the API calls in server.ts
❯ explain what this code does
❯ write tests for the UserProfile component
```

### Multi-line Input
Press `Shift+Enter` to add new lines in your message.

### Scrolling History
Use `↑` and `↓` arrows to scroll through previous messages.

---

## 🔧 COMMAND PALETTE

**Hotkey:** `Ctrl+P` or `/`

Quick access to all commands:

| Command | Description |
|---------|-------------|
| Exit | Quit Floyd CLI |
| New Task | Start fresh conversation |
| Reset Session | Clear current context |
| Toggle Monitor | Open/close dashboard |
| Toggle Safety | Cycle safety modes |
| Export Transcript | Save conversation to file |
| Help | Show keyboard shortcuts |
| Dock | Execute command in TMUX |

---

## ⚓ DOCK COMMANDS

Run commands in a separate TMUX pane:

```
❯ :dock btop
❯ :dock htop
❯ :btop (shorthand)
```

Useful for monitoring while coding.

---

## 🎯 WORKFLOW EXAMPLES

### Quick Bug Fix (Senior Dev)
1. `Ctrl+Z` → Enter ZEN mode
2. Type: "fix the null reference in handlers.ts"
3. Floyd responds with fix
4. Press `1` → Apply
5. Done in seconds!

### Learning Session (Junior Dev)
1. Stay in NORMAL mode
2. Watch thinking preview for insight
3. Check confidence indicator
4. Use `2` (Explain) often
5. Use `?` for help anytime

### Creative Sprint (Vibe Coding)
1. `Ctrl+V` → Enter VIBE mode
2. Rapid back-and-forth with Floyd
3. Quick iterations with number keys
4. Build momentum!

### Code Review
1. Ask Floyd to review your changes
2. Floyd provides Good/Suggestions/Issues
3. Press `1` to fix issues
4. Press `2` for explanations

---

## ⚠️ TROUBLESHOOTING

### Floyd isn't responding
- Check connection indicator (should be green ●)
- Try `Ctrl+C` to cancel stuck operation
- Restart with `floyd` command

### Can't see UI elements
- You might be in ZEN mode
- Press `Ctrl+Z` to return to NORMAL mode
- Press `Ctrl+B` or `Ctrl+I` to flash elements

### Commands not working
- Make sure input is empty for `?` help
- Check if you're in an overlay (press `Esc`)
- Verify hotkey with `Ctrl+/` help screen

### Performance issues
- Open monitor with `Ctrl+M` to check stats
- Clear conversation with `Ctrl+K`
- Check token usage in dashboard

---

## 📞 SUPPORT

- **Help Overlay:** Press `Ctrl+/` or `?`
- **Documentation:** `/docs` folder
- **Report Bug:** Use `/reportbug` command
- **GitHub:** github.com/CaptainPhantasy/Floyd

---

## 📋 QUICK REFERENCE CARD

```
╔═══════════════════════════════════════════════════════════════╗
║                    FLOYD CLI QUICK REFERENCE                  ║
╠═══════════════════════════════════════════════════════════════╣
║  MODES                                                        ║
║    Ctrl+Z     ZEN (minimal)    Ctrl+V     VIBE (fast)        ║
║                                                               ║
║  INFO (flash in ZEN)                                          ║
║    Ctrl+B     Breadcrumb       Ctrl+I     Confidence          ║
║    Ctrl+T     Thinking pane                                   ║
║                                                               ║
║  QUICK ACTIONS (after response)                               ║
║    1 Apply    2 Explain        3 Diff     4 Undo              ║
║                                                               ║
║  NAVIGATION                                                   ║
║    Ctrl+P     Commands         Ctrl+/     Help                ║
║    Ctrl+M     Monitor          Shift+Tab  Safety mode         ║
║                                                               ║
║  SYSTEM                                                       ║
║    Esc        Exit             Ctrl+Q     Force quit          ║
╚═══════════════════════════════════════════════════════════════╝
```

---

*Happy coding with Floyd! 🚀*
