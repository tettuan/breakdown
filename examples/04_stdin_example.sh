#!/bin/bash

# This script demonstrates using STDIN input with the Breakdown CLI

set -euo pipefail

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Initialize temp file variable
TEMP_FILE=""

# Cleanup function
cleanup() {
    local exit_code=$?
    
    # Remove temp file if exists
    if [[ -n "$TEMP_FILE" && -f "$TEMP_FILE" ]]; then
        rm -f "$TEMP_FILE" || echo "Warning: Failed to remove temp file: $TEMP_FILE"
    fi
    
    # Return to original directory
    cd "$ORIGINAL_CWD" || true
    
    return $exit_code
}

# Set trap for cleanup on exit
trap cleanup EXIT INT TERM

# Move to the examples directory (script location)
SCRIPT_DIR="$(dirname "$0")"
if ! cd "$SCRIPT_DIR"; then
    echo "Error: Failed to change to script directory: $SCRIPT_DIR"
    exit 1
fi

echo "=== STDIN Input Example ==="

# Define the config directory path
CONFIG_DIR="./.agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    echo "Expected config directory: ${CONFIG_DIR}"
    exit 1
fi

# Check if default-user.yml exists
if [ ! -f "${CONFIG_DIR}/default-user.yml" ]; then
    echo "Creating user configuration..."
    if ! bash 03_create_user_config.sh; then
        echo "Error: Failed to create user configuration"
        exit 1
    fi
fi

# Ensure local template directories exist following DirectiveType x LayerType structure
echo "Setting up local template directories..."
if ! mkdir -p prompts/to/project prompts/to/issue prompts/to/task prompts/summary/project prompts/summary/issue prompts/defect/project prompts/defect/issue; then
    echo "Error: Failed to create template directories"
    exit 1
fi

# Check if stdin configuration files exist, if not create them
if [ ! -f "${CONFIG_DIR}/stdin-app.yml" ] || [ ! -f "${CONFIG_DIR}/stdin-user.yml" ]; then
    echo "Error: STDIN configuration files not found."
    echo "Please run './02_init_deno_run.sh' first to create all required configuration files."
    exit 1
fi

echo "Using existing configuration: ${CONFIG_DIR}/stdin-app.yml"

# Source common functions to get run_breakdown
source ./common_functions.sh

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
if echo "$SAMPLE_INPUT" | run_breakdown summary project --config=stdin; then
    echo "✓ Example 1 completed successfully"
else
    echo "✗ Example 1 failed"
    echo "Error: Breakdown execution failed for Example 1"
fi

echo
echo "---"
echo

# Example 2: Using cat with a temporary file
echo "Example 2: Processing with cat and temporary file"
TEMP_FILE=$(mktemp) || {
    echo "Error: Failed to create temporary file"
    exit 1
}

if echo "$SAMPLE_INPUT" > "$TEMP_FILE"; then
    if cat "$TEMP_FILE" | run_breakdown summary project --config=stdin; then
        echo "✓ Example 2 completed successfully"
    else
        echo "✗ Example 2 failed"
        echo "Error: Breakdown execution failed for Example 2"
    fi
else
    echo "Error: Failed to write to temporary file"
fi

echo
echo "---"
echo

# Example 3: Using heredoc
echo "Example 3: Processing with heredoc"
if run_breakdown summary project --config=stdin << EOF
# Quick Task List

- Fix login bug
- Update user profile page
- Optimize database queries
- Review pull requests
- Update documentation
EOF
then
    echo "✓ Example 3 completed successfully"
else
    echo "✗ Example 3 failed"
    echo "Error: Breakdown execution failed for Example 3"
fi

echo
echo "=== STDIN Examples Completed ==="