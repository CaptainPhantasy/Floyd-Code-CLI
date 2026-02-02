# FLOYD CLI - Quick Start Guide

## Installation Status

✅ **Already Installed Globally** (as symlink to development directory)

The CLI is currently installed globally via npm link, which means:
- You can run `floyd-cli` from anywhere in your terminal
- It's linked to your development directory, so changes are immediately available
- No need to reinstall after code changes

## How to Use

### Basic Usage

```bash
# Start the interactive CLI
floyd-cli

# Show help
floyd-cli --help

# Start with your name
floyd-cli --name="Your Name"
```

### Dual-Screen Mode (TMUX)

```bash
# Launch dual-screen mode (main CLI + monitor dashboard)
floyd-cli --tmux

# Attach to existing session
floyd-cli --tmux attach

# List all Floyd sessions
floyd-cli --tmux list

# Kill Floyd session
floyd-cli --tmux kill
```

### Monitor Dashboard Only

```bash
# Start monitor dashboard
floyd-cli --monitor

# Compact layout
floyd-cli --monitor --compact

# Minimal layout
floyd-cli --monitor --minimal
```

### Configuration Interface

```bash
# Open configuration UI
floyd-cli --config
```

### Prompt Library

Once the CLI is running:
- Press **`Ctrl+Shift+P`** to open the Prompt Library overlay
- Browse prompts from your Obsidian vault
- Use arrow keys to navigate
- Press Enter to copy a prompt

## Keyboard Shortcuts (When CLI is Running)

- **`Ctrl+Shift+P`** - Open Prompt Library
- **`Ctrl+P`** - Command Palette
- **`Ctrl+/`** or **`?`** - Help overlay
- **`Esc`** - Close overlays/cancel

## Installation Options

### Option 1: Keep Current Setup (Recommended for Development)
The current symlink setup is perfect for development. Changes are immediately available.

### Option 2: Install as Standalone Package
If you want a standalone installation:

```bash
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
npm run build
npm install -g .
```

### Option 3: Create Desktop Launcher (macOS)

Create a launcher script:

```bash
# Create launcher script
cat > ~/Desktop/floyd-cli.command << 'EOF'
#!/bin/bash
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
open -a Terminal.app -e "floyd-cli"
EOF

chmod +x ~/Desktop/floyd-cli.command
```

Or use Automator to create a proper macOS app.

## Verification

Test that everything works:

```bash
# Test CLI runs
floyd-cli --help

# Test build
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
npm run build

# Test runtime
npm test

# Test specific features
npm run test:runtime
```

## Troubleshooting

### CLI Not Found
If `floyd-cli` command is not found:

```bash
# Reinstall globally
cd /Volumes/Storage/FLOYD_CLI/INK/floyd-cli
npm run build
npm link
```

### Module Errors
If you see module resolution errors:

```bash
# Rebuild
npm run build

# Run tests to verify
npm test
```

### TMUX Not Working
Make sure tmux is installed:

```bash
# macOS
brew install tmux

# Verify
tmux -V
```

## Next Steps

1. **Try the CLI**: Run `floyd-cli` to start
2. **Open Prompt Library**: Press `Ctrl+Shift+P` when running
3. **Try Dual-Screen**: Run `floyd-cli --tmux` for the full experience
4. **Configure**: Run `floyd-cli --config` to set up preferences

## Notes

- This is a **CLI tool** (Command Line Interface), not a GUI application
- It runs in your terminal/console
- No desktop icon is needed - just use the terminal
- The `floyd-cli` command is available globally after installation
