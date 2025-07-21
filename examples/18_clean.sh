#!/bin/bash

# This script cleans up all generated files and directories from the examples

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Cleaning Up Example Files ==="

# Remove all files and directories in examples/ except the ones we want to keep
echo "Removing generated files and directories in examples/..."

# Find all files and directories, excluding the ones we want to keep
find . -mindepth 1 -maxdepth 1 \
  ! -name "*.sh" \
  ! -name "CLAUDE.md" \
  ! -name "README.md" \
  -exec rm -rf {} +

echo
echo "✅ Cleanup completed"
echo
echo "Preserved files:"
echo "  - examples/*.sh"
echo "  - examples/CLAUDE.md"
echo "  - examples/README.md"
echo
echo "Removed all other files and directories in examples/"
echo
echo "=== Cleanup Completed ==="