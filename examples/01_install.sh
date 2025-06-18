#!/bin/bash

# This script provides installation instructions for the Breakdown CLI tool

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Breakdown CLI Installation Guide ==="
echo
echo "Breakdown can be installed and used in several ways:"
echo

echo "1. Using JSR (Recommended for development):"
echo "   deno add @tettuan/breakdown"
echo

echo "2. Using JSR for AI development repositories only:"
echo "   deno add --root ./tools @tettuan/breakdown"
echo

echo "3. Direct execution without installation:"
echo "   deno run --allow-read --allow-net jsr:@tettuan/breakdown"
echo

echo "4. Compile to binary (for production use):"
echo "   deno compile --allow-read --allow-write --allow-env --allow-net --output breakdown jsr:@tettuan/breakdown"
echo

echo "5. Global installation via deno install:"
echo "   deno install --allow-read --allow-write --allow-env --allow-net -n breakdown jsr:@tettuan/breakdown"
echo

echo
echo "After installation, you can verify the installation with:"
echo "   breakdown --version"
echo
echo "For this example suite, we'll use method 4 (compile to binary) in the next script."
echo

echo "=== Installation Guide Completed ==="