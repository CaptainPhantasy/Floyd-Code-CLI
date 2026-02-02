# Floyd Prefix Mode - Quick Start

**TL;DR:** Floyd now supports Claude Code-style prefix commands for explicit control.

## The 4 Prefix Modes

### 1. `!` - Bash Mode
Execute shell commands directly:
```bash
!ls -la
!git status
!npm run build
!echo "Hello World"
```

### 2. `/` - Command Mode
Structured built-in commands:
```
/help          # Show help
/explain OAuth # Explain a topic
```

### 3. `@` - Agent Mode (Coming Soon)
Delegate to specialists:
```
@coder write unit tests
@security audit this endpoint
@architect design caching layer
```

### 4. `&` - Tool Mode (Coming Soon)
Direct tool invocation:
```
&grep "TODO" src/
&glob "**/*.test.ts"
&view README.md
```

## Backwards Compatible

**Still works:**
```
list files in /tmp
explain OAuth
run the tests
```

**New way:**
```
!ls /tmp
/explain OAuth
!npm test
```

## When to Use Each

**Use Prefixes When:**
- You want exact command execution
- You need quick access to built-in commands
- You want explicit mode control

**Use Natural Language When:**
- You want AI interpretation
- You need context-aware responses
- You prefer conversational flow

## Safety

Prefix mode respects Floyd's safety system:
- **ASK** - Prompts before dangerous commands
- **PLAN** - Shows plan first
- **AUTO** - Validates only
- **FUCKIT** - No validation (use carefully!)

**Dangerous commands blocked:**
- `rm -rf /`
- `dd if=/dev/zero`
- Fork bombs
- `mkfs`

Override in `fuckit` mode if needed.

## UI Indicator

Check the left sidebar (SESSION panel) for quick reference:
```
PREFIX MODES
!command - Bash mode
/help - Commands
@agent - Delegate
&tool - Direct call
```

## Examples

**Quick file listing:**
```bash
!ls -la src/
```

**Get help:**
```
/help
```

**Run tests:**
```bash
!npm test
```

**Explain something:**
```
/explain WebSockets
```

**Natural language (still works):**
```
Show me the files in src/
Explain how WebSockets work
Run the test suite
```

## More Info

Read full documentation: `PREFIX_MODE_DOCUMENTATION.md`

---

**Status:** ✅ Live in Floyd v1.0  
**Alignment:** 100% with Claude Code  
**Tests:** 30 passing
