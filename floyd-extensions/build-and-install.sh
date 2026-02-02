#!/bin/bash

# Quick build and install script for FLOYD Extensions
# Usage: ./build-and-install.sh

cd "$(dirname "$0")"

echo "🔧 Building FLOYD Extensions..."
echo ""

# Function to build an extension
build_ext() {
    local ext=$1
    echo "Building $ext..."

    if [ ! -d "$ext" ]; then
        echo "⚠️  $ext not found, skipping..."
        return
    fi

    cd "$ext"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install --silent --no-audit --no-fund
    fi

    # Compile TypeScript
    echo "  Compiling..."
    npm run compile --silent

    echo "  ✓ $ext built!"
    cd ..
}

# Build all extensions
build_ext "floyd-voice-input"
build_ext "floyd-custom-agents"
build_ext "floyd-multi-chat"

echo ""
echo "✅ All extensions built!"
echo ""
echo "To install in FLOYD CURSE'M:"
echo "1. Press F5 in any extension folder for development mode"
echo "2. Or run: code --install-extension ./floyd-voice-input"
echo "   (repeat for each extension)"
