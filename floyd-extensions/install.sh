#!/bin/bash

# FLOYD Extensions Installation Script
# This script installs dependencies, compiles, and installs all FLOYD extensions

set -e

EXTENSIONS_DIR="/Volumes/Storage/FLOYD_CLI/floyd-extensions"
LOG_FILE="$EXTENSIONS_DIR/install.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${GREEN}==> $1${NC}"
    log "STEP: $1"
}

log_warn() {
    echo -e "${YELLOW}WARNING: $1${NC}"
    log "WARNING: $1"
}

log_error() {
    echo -e "${RED}ERROR: $1${NC}"
    log "ERROR: $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js first."
    log_warn "Visit https://nodejs.org/ to download Node.js"
    exit 1
fi

log_step "Starting FLOYD Extensions installation..."
log "Node version: $(node --version)"
log "npm version: $(npm --version)"

# Create log file
touch "$LOG_FILE"

# Function to install dependencies
install_deps() {
    local ext_dir=$1
    local ext_name=$(basename "$ext_dir")

    log_step "Installing dependencies for $ext_name..."
    cd "$ext_dir"

    if npm install --silent --no-audit --no-fund; then
        log "Dependencies installed for $ext_name"
    else
        log_error "Failed to install dependencies for $ext_name"
        return 1
    fi
}

# Function to compile extension
compile_ext() {
    local ext_dir=$1
    local ext_name=$(basename "$ext_dir")

    log_step "Compiling $ext_name..."
    cd "$ext_dir"

    if npm run compile --silent; then
        log "Compiled $ext_name successfully"
    else
        log_error "Failed to compile $ext_name"
        return 1
    fi
}

# Function to install extension
install_ext() {
    local ext_dir=$1
    local ext_name=$(basename "$ext_dir")

    log_step "Installing $ext_name in FLOYD CURSE'M..."

    # Check if code command exists
    if command -v code &> /dev/null; then
        code --install-extension "$ext_dir" --force
        log "Installed $ext_name"
    else
        log_warn "VS Code command not found. Manual install required:"
        log_warn "1. Open FLOYD CURSE'M"
        log_warn "2. Press Cmd+Shift+P"
        log_warn "3. Type 'Extensions: Install from VSIX...'"
        log_warn "4. Navigate to $ext_dir and select the folder"
    fi
}

# Main installation process
main() {
    cd "$EXTENSIONS_DIR"

    # Get all extension directories
    extensions=(*/)
    extensions=("${extensions[@]%/"}")

    # Filter only floyd-* directories
    floyd_extensions=()
    for ext in "${extensions[@]}"; do
        if [[ "$ext" == floyd-* ]]; then
            floyd_extensions+=("$ext")
        fi
    done

    log_step "Found ${#floyd_extensions[@]} FLOYD extensions: ${floyd_extensions[*]}"

    # Ask for installation type
    echo ""
    echo "What would you like to do?"
    echo "1) Install dependencies and compile only"
    echo "2) Install dependencies, compile, and install in FLOYD CURSE'M"
    echo "3) Compile only (skip dependency installation)"
    echo "4) Exit"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1)
            install_type="deps-compile"
            ;;
        2)
            install_type="full"
            ;;
        3)
            install_type="compile-only"
            ;;
        4)
            log "Installation cancelled by user"
            exit 0
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac

    # Process each extension
    for ext in "${floyd_extensions[@]}"; do
        ext_dir="$EXTENSIONS_DIR/$ext"

        echo ""
        log_step "Processing $ext..."

        # Install dependencies
        if [[ "$install_type" != "compile-only" ]]; then
            install_deps "$ext_dir" || continue
        fi

        # Compile
        compile_ext "$ext_dir" || continue

        # Install in VS Code
        if [[ "$install_type" == "full" ]]; then
            install_ext "$ext_dir"
        fi
    done

    echo ""
    log_step "Installation complete!"
    echo ""
    echo "Summary:"
    echo "- Extensions processed: ${#floyd_extensions[@]}"
    echo "- Log file: $LOG_FILE"
    echo ""

    if [[ "$install_type" != "full" ]]; then
        echo "To install the extensions in FLOYD CURSE'M:"
        echo "1. Open FLOYD CURSE'M"
        echo "2. Press Cmd+Shift+P"
        echo "3. Type 'Extensions: Install from VSIX...'"
        echo "4. Navigate to: $EXTENSIONS_DIR"
        echo "5. Select each extension folder"
    fi

    echo ""
    echo "Press F5 in any extension folder to launch in development mode."
}

# Run main function
main
