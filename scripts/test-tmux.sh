#!/bin/bash
# Quick test script to launch dual-screen TMUX mode
# This demonstrates the dual monitor setup

cd "$(dirname "$0")"

echo "🚀 Launching FLOYD CLI Dual-Screen Mode..."
echo ""
echo "This will create a TMUX session with:"
echo "  - Window 1 (Main): Interactive CLI"
echo "  - Window 2 (Monitor): Dashboard/Status Display"
echo ""
echo "Press Ctrl+B then D to detach from TMUX"
echo "Run 'tmux attach -t floyd' to reattach"
echo ""

# Try to run with tsx if available, otherwise show instructions
if command -v tsx &> /dev/null; then
    tsx src/cli.tsx --tmux
else
    echo "⚠️  tsx not found. Installing..."
    npm install --save-dev tsx
    echo ""
    echo "Now run: npm run start -- --tmux"
    echo ""
    echo "Or manually create TMUX session:"
    echo "  tmux new-session -d -s floyd -n main 'cd $(pwd) && npm run start'"
    echo "  tmux new-window -t floyd -n monitor 'cd $(pwd) && npm run start -- --monitor'"
    echo "  tmux attach -t floyd"
fi
