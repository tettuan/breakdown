#!/bin/bash

# This script initializes the Breakdown project structure using the compiled binary

set -e

echo "=== Initializing Breakdown Project Structure (Binary) ==="

# Check if breakdown binary exists
if [ ! -f ./.deno/bin/breakdown ]; then
  echo "Error: Breakdown binary not found at ./.deno/bin/breakdown"
  echo "Please run ./02_compile.sh first to compile the binary"
  exit 1
fi

# Initialize project structure
echo "Running breakdown init..."
./.deno/bin/breakdown init

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

echo "=== Initialization Completed ==="