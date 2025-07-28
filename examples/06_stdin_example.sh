#!/bin/bash

# This script demonstrates using STDIN input with the Breakdown CLI

set -euo pipefail

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Initialize temp file variables
TEMP_FILE3=""

# Cleanup function
cleanup() {
    local exit_code=$?
    
    # Remove temp files if they exist
    if [[ -n "$TEMP_FILE3" && -f "$TEMP_FILE3" ]]; then
        rm -f "$TEMP_FILE3" || echo "Warning: Failed to remove temp file: $TEMP_FILE3"
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

# Check if template directories and files exist
echo "Checking required template files for STDIN examples..."
TEMPLATE_BASE_DIR=".agent/breakdown/prompts"

# Define required templates (only those used in this script)
# This script uses: summary project --config=stdin
REQUIRED_TEMPLATES=(
    "${TEMPLATE_BASE_DIR}/summary/project/f_project.md"
)

# Check for missing templates
MISSING_TEMPLATES=()
for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ ! -f "$template" ]; then
        MISSING_TEMPLATES+=("$template")
    fi
done

if [ ${#MISSING_TEMPLATES[@]} -gt 0 ]; then
    echo "Error: Missing template files detected:"
    for missing in "${MISSING_TEMPLATES[@]}"; do
        echo "  - $missing"
    done
    echo ""
    echo "Please run './02_init_deno_run.sh' first to create template files."
    exit 1
fi

echo "✓ All required template files exist"

# Create f_default.md templates if they don't exist
echo "Creating f_default.md templates..."
for directive in summary; do
    for layer in project; do
        template_dir=".agent/breakdown/prompts/$directive/$layer"
        if [ -d "$template_dir" ]; then
            if [ ! -f "$template_dir/f_default.md" ]; then
                if [ -f "$template_dir/f_$layer.md" ]; then
                    cp "$template_dir/f_$layer.md" "$template_dir/f_default.md"
                fi
            fi
        fi
    done
done

# Ensure local template directories exist following DirectiveType x LayerType structure
# (This creates local prompts directories that may be used for custom templates)
if ! mkdir -p .agent/breakdown/prompts/to/project .agent/breakdown/prompts/to/issue .agent/breakdown/prompts/to/task .agent/breakdown/prompts/summary/project .agent/breakdown/prompts/summary/issue .agent/breakdown/prompts/defect/project .agent/breakdown/prompts/defect/issue; then
    echo "Error: Failed to create local template directories"
    exit 1
fi

# Create required template files for this example's CLI commands
echo "Creating required template files for CLI commands used in this script..."

# This script executes: breakdown summary project --config=stdin
# Required template: prompts/summary/project/f_project.md
cat > ".agent/breakdown/prompts/summary/project/f_project.md" << 'EOF'
# STDIN Project Summary Template

## Input Content
{{input_text}}

## Summary Processing
Create a structured project summary from the input:

1. **Project Overview**: Extract main goals and objectives
2. **Key Components**: Identify major deliverables and components  
3. **Timeline**: Note any mentioned deadlines or milestones
4. **Requirements**: List resource and technical requirements

## Output Format
Provide a clear, organized markdown summary.
EOF

echo "✓ Created template: prompts/summary/project/f_project.md"

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

# Example 1: Using pipe to send data via STDIN
echo "Example 1: Processing project overview with pipe"
if echo "$SAMPLE_INPUT" | run_breakdown summary project --config=stdin; then
    echo "✓ Example 1 completed successfully"
else
    echo "✗ Example 1 failed"
    echo "Error: Breakdown execution failed for Example 1"
fi

echo
echo "---"
echo

# Example 2: Using here-document to send data via STDIN
echo "Example 2: Processing with here-document"
if run_breakdown summary project --config=stdin <<EOF
$SAMPLE_INPUT
EOF
then
    echo "✓ Example 2 completed successfully"
else
    echo "✗ Example 2 failed"
    echo "Error: Breakdown execution failed for Example 2"
fi

echo
echo "---"
echo

# Example 3: Using cat with pipe to send file content via STDIN
echo "Example 3: Processing with cat and pipe"
# Create temporary file for demonstration
TEMP_FILE3=$(mktemp) || {
    echo "Error: Failed to create temporary file for Example 3"
    exit 1
}

cat > "$TEMP_FILE3" << 'EOF'
# Quick Task List

- Fix login bug
- Update user profile page
- Optimize database queries
- Review pull requests
- Update documentation
EOF

if cat "$TEMP_FILE3" | run_breakdown summary project --config=stdin; then
    echo "✓ Example 3 completed successfully"
else
    echo "✗ Example 3 failed"
    echo "Error: Breakdown execution failed for Example 3"
fi

# Clean up temporary file
rm -f "$TEMP_FILE3"

echo
echo "=== STDIN Examples Completed ==="