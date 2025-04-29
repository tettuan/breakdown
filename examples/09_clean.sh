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

set -e

echo "=== Cleaning up example results ==="

# Define paths to clean
AGENT_DIR="./.agent"
EXAMPLES_DIR="./tmp/examples"  # Directory for all example outputs
ERROR_LOG="./error.log"

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

echo "✓ All example results have been cleaned"
echo "The following directories and files were removed (if they existed):"
echo "- $AGENT_DIR (breakdown initialization directory)"
echo "- $EXAMPLES_DIR (all example outputs)"
echo "- $ERROR_LOG (error logs)"

exit 0 