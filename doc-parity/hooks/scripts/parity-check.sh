#!/bin/bash
# Doc Parity Check Hook
# Validates code-documentation parity using tree-sitter static analysis
# MUST USE REAL CODE VALIDATION, not LLM prompts

set -euo pipefail

# Plugin root - detect from script location
if [[ -f "${BASH_SOURCE[0]}" ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
    # Fallback when script is sourced
    PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-.}"
fi

# Configuration file (user overrides)
CONFIG_FILE="$CLAUDE_PROJECT_DIR/.claude/doc-parity.local.md"
DEFAULT_CONFIG="$PLUGIN_ROOT/.claude/doc-parity.local.md"

# Temporary output for findings
OUTPUT_FILE=$(mktemp)
trap "rm -f $OUTPUT_FILE" EXIT

# Read hook input
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || echo "")

# Debug logging
DEBUG=${DOCPARITY_DEBUG:-false}
if [[ "$DEBUG" == "true" ]]; then
    echo "[doc-parity] Tool: $TOOL_NAME, File: $FILE_PATH" >&2
fi

# Get configuration values
get_config_value() {
    local key="$1"
    local file="$CONFIG_FILE"
    if [[ ! -f "$file" ]]; then
        file="$DEFAULT_CONFIG"
    fi
    # Extract value from markdown frontmatter-style config
    grep -E "^${key}:" "$file" 2>/dev/null | sed "s/^${key}:[[:space:]]*//" | xargs || echo ""
}

# Default patterns
SOURCE_PATTERNS=("src/**/*.ts" "src/**/*.tsx" "src/**/*.go" "src/**/*.py")
DOC_FILES=("docs/**/*SSOT*.md" "docs/**/*ARCHITECTURE*.md" "CLAUDE.md" "README.md")
SEVERITY="warning"
DEPTH="medium"
PROACTIVE_MODE="false"

# Load config if exists
if [[ -f "$CONFIG_FILE" ]]; then
    # Parse simple key-value pairs from config
    CURRENT_SEVERITY=$(grep "^blocking_severity:" "$CONFIG_FILE" 2>/dev/null | cut -d: -f2 | xargs || echo "")
    if [[ -n "$CURRENT_SEVERITY" ]]; then
        SEVERITY="$CURRENT_SEVERITY"
    fi
fi

# Check if file matches source patterns
should_check_file() {
    local file="$1"
    if [[ -z "$file" ]]; then
        return 1
    fi

    # Convert to relative path for pattern matching
    local rel_path="${file#$CLAUDE_PROJECT_DIR/}"

    for pattern in "${SOURCE_PATTERNS[@]}"; do
        # Simple glob matching
        if [[ "$rel_path" == $pattern ]]; then
            return 0
        fi
    done

    # Check common extensions
    if [[ "$rel_path" =~ \.(ts|tsx|js|jsx|go|py)$ ]]; then
        return 0
    fi

    return 1
}

# Extract exported symbols using tree-sitter
extract_symbols_ts() {
    local file="$1"
    local type="$2"  # 'function', 'class', 'interface', 'const'

    # Try tree-sitter CLI first
    if command -v tree-sitter &>/dev/null; then
        tree-sitter parse "$file" --q 2>/dev/null || echo ""
    else
        # Fallback: grep-based extraction (not as accurate but works)
        case "$type" in
            function)
                grep -E "export (async )?function|export const \w+\s*=\s*(async )?\(|export const \w+\s*=\s*\(" "$file" | \
                    sed -E 's/.*export (async )?function ([a-zA-Z_][a-zA-Z0-9_]*).*/\2/' | \
                    sed -E 's/.*export const ([a-zA-Z_][a-zA-Z0-9_]*)\s*=.*/\1/' || echo ""
                ;;
            class)
                grep -E "export class ([A-Z][a-zA-Z0-9_]*)" "$file" | \
                    sed -E 's/.*export class ([A-Z][a-zA-Z0-9_]*).*/\1/' || echo ""
                ;;
            const)
                grep -E "export const ([a-zA-Z_][a-zA-Z0-9_]*)" "$file" | \
                    sed -E 's/.*export const ([a-zA-Z_][a-zA-Z0-9_]*).*/\1/' || echo ""
                ;;
        esac
    fi
}

extract_symbols_go() {
    local file="$1"
    local type="$2"

    # Go: exported symbols start with capital letter
    case "$type" in
        function)
            grep -E "^func ([A-Z][a-zA-Z0-9_]*)" "$file" | \
                sed -E 's/.*func ([A-Z][a-zA-Z0-9_]*).*/\1/' || echo ""
            ;;
        type)
            grep -E "^type ([A-Z][a-zA-Z0-9_]*)" "$file" | \
                sed -E 's/.*type ([A-Z][a-zA-Z0-9_]*).*/\1/' || echo ""
            ;;
        const)
            grep -E "^const ([A-Z][a-zA-Z0-9_]*)" "$file" | \
                sed -E 's/.*const ([A-Z][a-zA-Z0-9_]*).*/\1/' || echo ""
            ;;
    esac
}

extract_symbols_py() {
    local file="$1"
    local type="$2"

    # Python: public symbols (not starting with _)
    case "$type" in
        function)
            grep -E "^def ([a-z][a-zA-Z0-9_]*)\(" "$file" | grep -v "^def _" | \
                sed -E 's/.*def ([a-z][a-zA-Z0-9_]*).*/\1/' || echo ""
            ;;
        class)
            grep -E "^class ([A-Z][a-zA-Z0-9_]*)" "$file" | \
                sed -E 's/.*class ([A-Z][a-zA-Z0-9_]*).*/\1/' || echo ""
            ;;
    esac
}

# Main validation logic
validate_parity() {
    local file="$1"
    local findings="[]"
    local critical=0 warning=0 info=0

    if [[ ! -f "$file" ]]; then
        return 0
    fi

    local ext="${file##*.}"
    local exports=()

    # Extract exports based on file type
    case "$ext" in
        ts|tsx|js|jsx)
            exports+=($(extract_symbols_ts "$file" "function"))
            exports+=($(extract_symbols_ts "$file" "class"))
            exports+=($(extract_symbols_ts "$file" "const"))
            ;;
        go)
            exports+=($(extract_symbols_go "$file" "function"))
            exports+=($(extract_symbols_go "$file" "type"))
            ;;
        py)
            exports+=($(extract_symbols_py "$file" "function"))
            exports+=($(extract_symbols_py "$file" "class"))
            ;;
    esac

    # Check if exports are documented
    for export in "${exports[@]}"; do
        if [[ -z "$export" ]]; then continue; fi

        local found_in_docs=0

        for doc_pattern in "${DOC_FILES[@]}"; do
            # Use find to locate doc files
            while IFS= read -r doc_file; do
                if [[ -f "$doc_file" ]]; then
                    if grep -q "$export" "$doc_file" 2>/dev/null; then
                        found_in_docs=1
                        break
                    fi
                fi
            done < <(find "$CLAUDE_PROJECT_DIR" -name "${doc_pattern##*/}" 2>/dev/null)
        done

        if [[ $found_in_docs -eq 0 ]]; then
            # Create finding
            local severity="info"
            if [[ "$SEVERITY" == "critical" ]]; then
                severity="critical"
            elif [[ "$SEVERITY" == "warning" ]]; then
                severity="warning"
            fi

            # Count
            case "$severity" in
                critical) ((critical++));;
                warning) ((warning++));;
                info) ((info++));;
            esac

            # Add to findings (simplified JSON construction)
            if [[ "$findings" == "[]" ]]; then
                findings="[{\"id\":\"missing_doc_${export}\",\"file\":\"${file#$CLAUDE_PROJECT_DIR/}\",\"symbol\":\"$export\",\"type\":\"missing_in_doc\",\"severity\":\"$severity\"}]"
            else
                findings="${findings%}],\"id\":\"missing_doc_${export}\",\"file\":\"${file#$CLAUDE_PROJECT_DIR/}\",\"symbol\":\"$export\",\"type\":\"missing_in_doc\",\"severity\":\"$severity\"}]"
            fi
        fi
    done

    # Output findings
    if [[ "$findings" != "[]" ]]; then
        cat > "$OUTPUT_FILE" <<EOF
{
  "version": "1.0",
  "findings": $findings,
  "summary": {"critical": $critical, "warning": $warning, "info": $info}
}
EOF
        return 1
    fi

    return 0
}

# Main execution
if [[ "$TOOL_NAME" =~ ^(Write|Edit)$ ]] && should_check_file "$FILE_PATH"; then
    validate_parity "$FILE_PATH"
    result=$?

    if [[ $result -ne 0 ]] && [[ -f "$OUTPUT_FILE" ]]; then
        cat "$OUTPUT_FILE"

        # Determine exit code based on severity
        if [[ $critical -gt 0 ]]; then
            exit 2
        elif [[ $warning -gt 0 ]]; then
            exit 1
        fi
    fi
fi

exit 0
