#!/bin/bash

# This script cleans up all example results and initialized files
#
# Usage:
# ./examples/11_clean.sh
#
# Note:
# - This script should be run from the project root directory
# - This will remove all example generated files and directories
# - All example outputs are stored in ./tmp/examples directory

# Add at the top after any initial setup:
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
pushd "$PROJECT_ROOT" > /dev/null
set -e

echo "=== Cleaning up example results ==="

# Define paths to clean
AGENT_DIR="./.agent"
EXAMPLES_DIR="./tmp/examples"  # Directory for all example outputs
ERROR_LOG="./error.log"
DENOBIN=".deno/bin/breakdown"
DENOBIN_DIR=".deno/bin"
OUTPUT_DIR="./output"
TMP_DIR="./tmp"
DEBUG_LOG="./debug.log"
USER_CONFIG="./.agent/breakdown/config/user.yml"

# Function to safely remove a file or directory
safe_remove() {
    local path="$1"
    if [ -e "$path" ]; then
        echo "Removing: $path"
        rm -rf "$path"
    fi
}

# Clean up all example results
safe_remove "$AGENT_DIR"
safe_remove "$EXAMPLES_DIR"
safe_remove "$ERROR_LOG"
safe_remove "$DENOBIN"
safe_remove "$OUTPUT_DIR"
safe_remove "$TMP_DIR"
safe_remove "$DEBUG_LOG"
safe_remove "$USER_CONFIG"

# .deno/bin ディレクトリが空なら削除
test -d "$DENOBIN_DIR" && [ "$(ls -A $DENOBIN_DIR)" = "" ] && rmdir "$DENOBIN_DIR"

echo "✓ All example results have been cleaned"
echo "The following directories and files were removed (if they existed):"
echo "- $AGENT_DIR (breakdown initialization directory)"
echo "- $EXAMPLES_DIR (all example outputs)"
echo "- $ERROR_LOG (error logs)"
echo "- $DENOBIN (breakdown binary)"
echo "- $OUTPUT_DIR (output directory for example results)"
echo "- $TMP_DIR (temporary files directory)"
echo "- $DEBUG_LOG (debug log file)"
echo "- $USER_CONFIG (user configuration file)"
echo "- $DENOBIN_DIR (binary directory, removed if empty)"

popd > /dev/null
exit 0

# Note: When using the breakdown command, always specify the full path: .deno/bin/breakdown 