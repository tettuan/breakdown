#!/bin/bash

# This script compiles the Breakdown CLI to a binary executable

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Compiling Breakdown CLI to Binary ==="

# Create .deno/bin directory if it doesn't exist
mkdir -p ./.deno/bin

# Compile breakdown to binary
echo "Compiling breakdown..."
deno compile \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-net \
  --output ./.deno/bin/breakdown \
  jsr:@tettuan/breakdown

if [ -f ./.deno/bin/breakdown ]; then
  echo "✅ Successfully compiled breakdown to ./.deno/bin/breakdown"
  echo
  echo "You can now run breakdown using:"
  echo "   ./.deno/bin/breakdown --version"
  echo
  echo "To add to PATH for this session:"
  echo "   export PATH=\"\$PWD/.deno/bin:\$PATH\""
else
  echo "❌ Failed to compile breakdown"
  exit 1
fi

echo "=== Compilation Completed ==="