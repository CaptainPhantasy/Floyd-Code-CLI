#!/bin/bash
# Floyd Suite Restore - Execution Script
# Date: 2026-02-02
# Run from: /Volumes/Storage/FLOYD_CLI

set -e  # Exit on error

echo "=========================================="
echo "Floyd Suite Restore - Step 1: agent-core"
echo "=========================================="

cd /Volumes/Storage/FLOYD_CLI

# Step 1: Restore unified-permission.ts from b9ec824
echo "Restoring unified-permission.ts from b9ec824..."
git checkout b9ec824 -- packages/floyd-agent-core/src/permissions/unified-permission.ts

# Verify build
echo "Building floyd-agent-core..."
npm run build --prefix packages/floyd-agent-core
if [ $? -eq 0 ]; then
    echo "✅ floyd-agent-core builds successfully"
else
    echo "❌ floyd-agent-core build failed"
    exit 1
fi

# Verify tests
echo "Running floyd-agent-core tests..."
npm test --prefix packages/floyd-agent-core
if [ $? -eq 0 ]; then
    echo "✅ floyd-agent-core tests pass"
else
    echo "❌ floyd-agent-core tests failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Floyd Suite Restore - Step 2: INK/floyd-cli tsconfig"
echo "=========================================="

# Create tsconfig.json for INK/floyd-cli
cat > /Volumes/Storage/FLOYD_CLI/INK/floyd-cli/tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
TSCONFIG

echo "Created tsconfig.json for INK/floyd-cli"

# Note: INK/floyd-cli may need npm install --legacy-peer-deps first
echo "Note: Run 'npm install --legacy-peer-deps' in INK/floyd-cli if needed"

echo ""
echo "=========================================="
echo "Step 1 Complete - agent-core Fixed"
echo "=========================================="
echo ""
echo "Next steps (manual):"
echo "1. cd INK/floyd-cli && npm install --legacy-peer-deps && npm run build"
echo "2. Fix FloydDesktopWeb errors (see TECHNICAL_REFERENCE.md)"
echo "3. Verify TUI REBUILD still works: npm run build --prefix 'TUI REBUILD'"
