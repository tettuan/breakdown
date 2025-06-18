#!/bin/bash

# This script initializes the Breakdown project structure using deno run

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Initializing Breakdown Project Structure (deno run) ==="

# Check if .agent/breakdown already exists in current directory (examples)
if [ -d ".agent/breakdown" ]; then
  echo "Warning: .agent/breakdown directory already exists"
  echo "Skipping initialization to avoid overwriting existing configuration"
  echo "To reinitialize, please remove .agent/breakdown directory first"
else
  # Initialize project structure using deno run
  echo "Running breakdown init with deno run..."
  deno run --allow-read --allow-write --allow-env --allow-net jsr:@tettuan/breakdown init

  # Verify the created structure
  if [ -d ".agent/breakdown" ]; then
    echo "✅ Successfully initialized project structure"
    echo
    echo "Created directories:"
    find .agent/breakdown -type d | head -10
    echo
    echo "Created files:"
    find .agent/breakdown -type f | head -10
  else
    echo "❌ Failed to initialize project structure"
    exit 1
  fi
fi

echo "=== Initialization Completed ==="