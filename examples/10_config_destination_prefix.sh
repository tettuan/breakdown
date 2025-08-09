#!/bin/bash
# Example 9 Extended: Configuration with destination.prefix
# This demonstrates how to add options.destination.prefix to configuration files

set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Configuration with destination.prefix Example ==="
echo "Demonstrating options.destination.prefix in configuration files"
echo

# Use deno run directly
BREAKDOWN='deno run --allow-all ../cli/breakdown.ts'

# Create output directory
OUTPUT_DIR="./output/config_prefix_test"
mkdir -p "$OUTPUT_DIR"

# Create config directory
CONFIG_DIR="./.agent/climpt/config"
mkdir -p "$CONFIG_DIR"

# Create a basic-app.yml (reuse existing pattern)
cat > "$CONFIG_DIR/basic-app.yml" << 'EOF'
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
      errorMessage: "Invalid directive type. Must be one of: to, summary, defect, find"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
      errorMessage: "Invalid layer type. Must be one of: project, issue, task, bugs"
app_prompt:
  base_dir: "./.agent/climpt/prompts"
app_schema:
  base_dir: "./.agent/climpt/schema"
EOF

# Create basic-user.yml with destination.prefix
cat > "$CONFIG_DIR/basic-user.yml" << 'EOF'
# Basic user configuration with destination prefix
options:
  destination:
    prefix: "output/basic/"
    
app_prompt:
  working_dir: "./.agent/climpt/examples"
EOF

echo "✅ Created basic profile with destination.prefix: 'output/basic/'"

# Create production-app.yml
cat > "$CONFIG_DIR/production-app.yml" << 'EOF'
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find|analyze)$"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "^(project|issue|task|bugs|feature)$"
      errorMessage: "Invalid layer type"
app_prompt:
  base_dir: "./.agent/climpt/prompts"
app_schema:
  base_dir: "./.agent/climpt/schema"
EOF

# Create production-user.yml with different prefix
cat > "$CONFIG_DIR/production-user.yml" << 'EOF'
# Production user configuration with dated prefix
options:
  destination:
    prefix: "reports/production/2024/"
    
app_prompt:
  working_dir: "./.agent/climpt/examples"
EOF

echo "✅ Created production profile with destination.prefix: 'reports/production/2024/'"

# Create template that shows destination_path
TEMPLATE_DIR="./.agent/climpt/prompts/summary/project"
mkdir -p "$TEMPLATE_DIR"

cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Project Summary Template

## Configuration Information
- Profile: Current configuration profile in use
- Destination Path: {{destination_path}}

## Input Content
{{input_text}}

## Summary
Creating project summary...

The output will be saved to: {{destination_path}}
EOF

echo "✅ Created template that displays destination_path"
echo

# Create test input
cat > "$OUTPUT_DIR/project_data.md" << 'EOF'
# E-Commerce Platform Project

## Overview
Modern e-commerce platform with microservices architecture.

## Components
- User Service
- Product Catalog
- Order Management
- Payment Gateway
EOF

echo "=== Test 1: Default Profile (no prefix) ==="
echo "Command: breakdown summary project --config=default"
echo "Expected: destination_path without prefix"
echo

$BREAKDOWN summary project \
  --config=default \
  --from="$OUTPUT_DIR/project_data.md" \
  --destination="summary.md" 2>&1 | grep -E "(Destination Path:|saved to:)" || echo "No destination_path found in output"

echo
echo "=== Test 2: Basic Profile (with prefix 'output/basic/') ==="
echo "Command: breakdown summary project --config=basic"
echo "Expected: destination_path = 'output/basic/summary.md'"
echo

$BREAKDOWN summary project \
  --config=basic \
  --from="$OUTPUT_DIR/project_data.md" \
  --destination="summary.md" 2>&1 | grep -E "(Destination Path:|saved to:)" || echo "No destination_path found in output"

echo
echo "=== Test 3: Production Profile (with prefix 'reports/production/2024/') ==="
echo "Command: breakdown summary project --config=production"
echo "Expected: destination_path = 'reports/production/2024/summary.md'"
echo

$BREAKDOWN summary project \
  --config=production \
  --from="$OUTPUT_DIR/project_data.md" \
  --destination="summary.md" 2>&1 | grep -E "(Destination Path:|saved to:)" || echo "No destination_path found in output"

echo
echo "=== Test 4: Dynamic filename with prefix ==="
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "Command: breakdown summary project --config=basic --destination=${TIMESTAMP}.md"
echo "Expected: destination_path = 'output/basic/${TIMESTAMP}.md'"
echo

$BREAKDOWN summary project \
  --config=basic \
  --from="$OUTPUT_DIR/project_data.md" \
  --destination="${TIMESTAMP}.md" 2>&1 | grep -E "(Destination Path:|saved to:)" || echo "No destination_path found in output"

echo
echo "=== Configuration Files Created ==="
echo
echo "basic-user.yml:"
echo "---"
head -10 "$CONFIG_DIR/basic-user.yml"
echo
echo "production-user.yml:"
echo "---"
head -10 "$CONFIG_DIR/production-user.yml"

echo
echo "=== Summary ==="
echo
echo "options.destination.prefix in configuration files:"
echo "1. Set in *-user.yml under options.destination.prefix"
echo "2. Automatically prefixes the destination_path variable"
echo "3. Different profiles can have different prefixes"
echo "4. Works with both static and dynamic filenames"
echo
echo "Example configuration:"
echo "  options:"
echo "    destination:"
echo "      prefix: 'reports/2024/'"
echo
echo "Result: destination_path = prefix + destination"
echo "  e.g., 'reports/2024/' + 'output.md' = 'reports/2024/output.md'"