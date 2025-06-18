#!/bin/bash
# Example 10: Basic configuration usage
# This example demonstrates how to use a basic configuration file with Breakdown CLI

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Basic Configuration Example ==="

# Run from examples directory
CONFIG_DIR=".agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Check if user.yml exists
if [ ! -f "${CONFIG_DIR}/user.yml" ]; then
    echo "Creating user configuration..."
    bash 06_create_user_config.sh
fi

# Create a basic configuration file
cat > "${CONFIG_DIR}/basic-app.yml" << 'EOF'
# Basic application configuration
working_dir: "."
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
logger:
  level: "info"
  format: "text"
output:
  format: "markdown"
  includeHeaders: true
EOF

echo "Created basic configuration: ${CONFIG_DIR}/basic-app.yml"

# Create sample input
cat > input.md << 'EOF'
# Sample Project

This is a sample project for testing basic configuration.

## Features
- Feature 1: User authentication
- Feature 2: Data processing
- Feature 3: Report generation

## Technical Stack
- Language: TypeScript
- Framework: Deno
- Database: PostgreSQL
EOF

echo "Created sample input file"

# Run breakdown with basic configuration
echo ""
echo "Running breakdown with basic configuration..."
echo "Command: deno run -A jsr:@tettuan/breakdown summary project --config=basic < input.md"
deno run -A jsr:@tettuan/breakdown summary project --config=basic < input.md > output.md

echo ""
echo "=== Output ==="
cat output.md

# Cleanup
rm -f input.md output.md

echo ""
echo "=== Basic Configuration Example Completed ==="