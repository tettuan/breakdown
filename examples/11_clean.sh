#!/bin/bash

# This script cleans up all example results and initialized files
#
# Usage:
# ./examples/09_clean.sh
#
# Note:
# - This script should be run from the project root directory
# - This will remove all example generated files and directories
# - All example outputs are stored in ./tmp/examples directory

pushd "$(dirname "$0")" > /dev/null
set -e

echo "=== Cleaning up example results ==="

# Define paths to clean
AGENT_DIR="./.agent"
EXAMPLES_DIR="./tmp/examples"  # Directory for all example outputs
ERROR_LOG="./error.log"
DENOBIN="./.deno/bin/breakdown"
DENOBIN_DIR="./.deno/bin"

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
# .deno/bin ディレクトリが空なら削除
test -d "$DENOBIN_DIR" && [ "$(ls -A $DENOBIN_DIR)" = "" ] && rmdir "$DENOBIN_DIR"

echo "✓ All example results have been cleaned"
echo "The following directories and files were removed (if they existed):"
echo "- $AGENT_DIR (breakdown initialization directory)"
echo "- $EXAMPLES_DIR (all example outputs)"
echo "- $ERROR_LOG (error logs)"
echo "- $DENOBIN (breakdown バイナリ)"
echo "- $DENOBIN_DIR (バイナリディレクトリ、空の場合のみ削除)"

popd > /dev/null
exit 0

# ※ breakdownコマンドは直接使用していませんが、使用する場合は必ず ./.deno/bin/breakdown をパス指定してください 