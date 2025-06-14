#!/bin/bash

# Run all find bugs two params examples

echo "Running all find bugs two params examples"
echo "========================================"
echo ""

# Example 1: Basic bug finding
echo "Example 1: Basic bug finding"
echo "----------------------------"
breakdown find bugs -f=buggy-javascript.js
echo ""

# Example 2: Deep analysis with markdown output
echo "Example 2: Deep analysis with markdown output"
echo "--------------------------------------------"
breakdown find bugs -f=buggy-javascript.js --depth=deep --format=markdown
echo ""

# Example 3: JSON output with severity
echo "Example 3: JSON output with severity assessment"
echo "----------------------------------------------"
breakdown find bugs -f=buggy-javascript.js --format=json --severity=true
echo ""

# Example 4: Complete analysis
echo "Example 4: Complete analysis with all options"
echo "--------------------------------------------"
breakdown find bugs -f=buggy-javascript.js \
  --depth=deep \
  --format=markdown \
  --severity=true \
  --uv-project=MyApp \
  --uv-version=1.0.0 \
  --uv-module=core \
  --uv-criticality=high
echo ""

# Example 5: Traditional format (no equals)
echo "Example 5: Traditional format without equals"
echo "-------------------------------------------"
breakdown find bugs -f buggy-javascript.js --depth medium --format markdown
echo ""

echo "========================================"
echo "All examples completed!"