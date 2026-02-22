#!/bin/bash
# FLOYD SUITE - Lock Verification Script
# Run this to verify locked components haven't changed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 FLOYD SUITE - Lock Verification"
echo "=================================="
echo ""

# TUI REBUILD
echo "Checking TUI REBUILD..."
cd "/Volumes/Storage/FLOYD_CLI/TUI REBUILD"
if [ -f .floyd-lock-sha ]; then
    if shasum -c .floyd-lock-sha > /dev/null 2>&1; then
        echo -e "${GREEN}✓ TUI REBUILD: LOCKED${NC}"
    else
        echo -e "${RED}✗ TUI REBUILD: CHANGED${NC}"
        echo "  Run: git checkout HEAD -- dist/ && npm run build"
    fi
else
    echo -e "${YELLOW}⚠ TUI REBUILD: No lock file${NC}"
fi
echo ""

# FloydDesktopWeb
echo "Checking FloydDesktopWeb..."
cd "/Volumes/Storage/FLOYD_CLI/FloydDesktopWeb"
if [ -f .floyd-lock-sha ]; then
    if shasum -c .floyd-lock-sha > /dev/null 2>&1; then
        echo -e "${GREEN}✓ FloydDesktopWeb: LOCKED${NC}"
    else
        echo -e "${RED}✗ FloydDesktopWeb: CHANGED${NC}"
        echo "  Run: git checkout HEAD -- dist/ dist-server/ && npm run build"
    fi
else
    echo -e "${YELLOW}⚠ FloydDesktopWeb: No lock file${NC}"
fi
echo ""

echo "=================================="
echo "To update locks after verified changes:"
echo "  cd /path/to/component"
echo "  shasum dist/*.js > .floyd-lock-sha"
echo "  git add .floyd-lock-sha"
echo "  git commit -m 'lock: update verified build'"
