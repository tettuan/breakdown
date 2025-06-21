#!/bin/bash

# This script demonstrates using STDIN input with the Breakdown CLI

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== STDIN Input Example ==="

# Define the config directory path
CONFIG_DIR="../.agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Check if user.yml exists
if [ ! -f "${CONFIG_DIR}/user.yml" ]; then
    echo "Creating user configuration..."
    bash 03_create_user_config.sh
fi

# Ensure local template directories exist
echo "Setting up local template directories..."
mkdir -p prompts/summary/issue prompts/summary/project prompts/defect/issue

# Copy required template files if they don't exist
if [ ! -f "prompts/summary/project/f_project.md" ]; then
    cp ../lib/breakdown/prompts/summary/project/f_project.md prompts/summary/project/ 2>/dev/null || echo "Warning: Could not copy summary project template"
fi

# Create a basic configuration file for STDIN example
cat > "${CONFIG_DIR}/stdin-app.yml" << 'EOF'
# Application configuration for STDIN example
working_dir: "examples"
app_prompt:
  base_dir: "examples/prompts"
app_schema:
  base_dir: "examples/schema"
logger:
  level: "error"
  format: "text"
output:
  format: "markdown"
  includeHeaders: true
EOF

echo "Created configuration: ${CONFIG_DIR}/stdin-app.yml"

# Ensure we have a way to run breakdown
# Force using source code directly due to compiled version issues
# Run from project root to find config files
run_breakdown() {
    cd .. && deno run -A cli/breakdown.ts "$@" 2>/dev/null
}

# Create a sample input for demonstration
SAMPLE_INPUT="# Project Overview

This is a sample project that needs to be broken down into tasks.

## Main Goals
- Implement user authentication
- Create dashboard interface
- Set up database schema
- Add API endpoints

## Technical Requirements
- Use TypeScript
- Follow REST principles
- Implement proper error handling
- Write comprehensive tests"

# Example 1: Using echo with pipe
echo "Example 1: Processing project overview with echo and pipe"
echo "$SAMPLE_INPUT" | run_breakdown summary project --config=stdin

echo
echo "---"
echo

# Example 2: Using cat with a temporary file
echo "Example 2: Processing with cat and temporary file"
TEMP_FILE=$(mktemp)
echo "$SAMPLE_INPUT" > "$TEMP_FILE"
cat "$TEMP_FILE" | run_breakdown summary project --config=stdin
rm "$TEMP_FILE"

echo
echo "---"
echo

# Example 3: Using heredoc
echo "Example 3: Processing with heredoc"
run_breakdown summary project --config=stdin << EOF
# Quick Task List

- Fix login bug
- Update user profile page
- Optimize database queries
- Review pull requests
- Update documentation
EOF

echo "=== STDIN Examples Completed ==="