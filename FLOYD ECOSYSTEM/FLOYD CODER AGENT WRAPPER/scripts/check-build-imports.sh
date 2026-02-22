#!/usr/bin/env bash

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ISSUES=0
CHECKED=0

echo -e "${BLUE}🔍 Checking build imports...${NC}\n"

# Check for remaining .ts imports
echo "Checking for .ts imports in .js files..."
if grep -r "\.ts'" dist/ --include="*.js" 2>/dev/null | grep -v node_modules; then
	echo -e "${RED}❌ Found .ts imports in .js files${NC}"
	((ISSUES++))
else
	echo -e "${GREEN}✓ No .ts imports found${NC}"
fi
((CHECKED++))

# Check for dist imports
echo ""
echo "Checking for dist/ imports..."
if grep -r "from ['\"]\\./dist/" dist/ --include="*.js" 2>/dev/null; then
	echo -e "${RED}❌ Found dist/ imports${NC}"
	((ISSUES++))
else
	echo -e "${GREEN}✓ No dist/ imports found${NC}"
fi
((CHECKED++))

# Check for src imports
echo ""
echo "Checking for src/ imports..."
if grep -r "from ['\"]\\./src/" dist/ --include="*.js" 2>/dev/null; then
	echo -e "${RED}❌ Found src/ imports${NC}"
	((ISSUES++))
else
	echo -e "${GREEN}✓ No src/ imports found${NC}"
fi
((CHECKED++))

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Checks performed: ${CHECKED}"
echo -e "Issues found: ${ISSUES}"

if [ $ISSUES -eq 0 ]; then
	echo -e "${GREEN}✨ All checks passed!${NC}"
	exit 0
else
	echo -e "${RED}❌ Build import check failed${NC}"
	exit 1
fi
