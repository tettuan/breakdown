#!/bin/bash

# This script checks the version of the installed/compiled Breakdown CLI

set -e

echo "=== Checking Breakdown CLI Version ==="

# Check if breakdown binary exists
if [ -f ./.deno/bin/breakdown ]; then
  echo "Using compiled binary at ./.deno/bin/breakdown"
  ./.deno/bin/breakdown --version
elif command -v breakdown &> /dev/null; then
  echo "Using globally installed breakdown"
  breakdown --version
else
  echo "Breakdown not found. Trying direct execution with deno run..."
  deno run --allow-read --allow-net jsr:@tettuan/breakdown --version
fi

echo
echo "Version check completed."
echo "=== Version Check Completed ==="