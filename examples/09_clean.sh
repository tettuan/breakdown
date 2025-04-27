#!/bin/bash

# This script cleans up all example results and initialized files
#
# Usage:
# ./examples/09_clean.sh
#
# Note:
# - This script should be run from the project root directory
# - This will remove all example generated files and directories

set -e

echo "=== Cleaning up example results ==="

# Define paths to clean
AGENT_DIR="./.agent"
OUTPUT_DIR="./examples/output"
TASKS_DIR="./tasks-dir"
ERROR_LOG="./error.log"
FIXTURES_OUTPUT="./examples/fixtures/output"

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
safe_remove "$OUTPUT_DIR"
safe_remove "$TASKS_DIR"
safe_remove "$ERROR_LOG"
safe_remove "$FIXTURES_OUTPUT"

echo "✓ All example results have been cleaned"
echo "The following directories and files were removed (if they existed):"
echo "- $AGENT_DIR (breakdown initialization directory)"
echo "- $OUTPUT_DIR (example outputs)"
echo "- $TASKS_DIR (generated tasks)"
echo "- $ERROR_LOG (error logs)"
echo "- $FIXTURES_OUTPUT (fixture outputs)"
exit 0 