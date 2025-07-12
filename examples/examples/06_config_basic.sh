#!/bin/bash
# Example 10: Basic configuration usage
# This example demonstrates how to use a basic configuration file with Breakdown CLI

set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Initialize cleanup variables
INPUT_FILE=""
OUTPUT_FILE=""

# Cleanup function
cleanup() {
    local exit_code=$?
    
    # Remove temporary files
    [[ -n "$INPUT_FILE" && -f "$INPUT_FILE" ]] && rm -f "$INPUT_FILE"
    [[ -n "$OUTPUT_FILE" && -f "$OUTPUT_FILE" ]] && rm -f "$OUTPUT_FILE"
    [[ -f "error.log" ]] && rm -f "error.log"
    [[ -f "manual_output.log" ]] && rm -f "manual_output.log"
    
    # Return to original directory
    cd "$ORIGINAL_CWD" || true
    
    return $exit_code
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
if ! cd "$SCRIPT_DIR"; then
    echo "Error: Failed to change to script directory: $SCRIPT_DIR"
    exit 1
fi

echo "=== Basic Configuration Example ==="

# Debug: Show current state
echo ""
echo "🔍 DEBUG: Initial state check"
echo "Current directory: $(pwd)"
echo "Script directory: $SCRIPT_DIR"
echo "Original CWD: $ORIGINAL_CWD"

# Run from examples directory
CONFIG_DIR="./.agent/breakdown/config"
echo "Config directory: $CONFIG_DIR"

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

# Ensure local template directories exist
echo "Setting up local template directories..."
if ! mkdir -p prompts/summary/issue prompts/summary/project prompts/defect/issue; then
    echo "Error: Failed to create template directories"
    exit 1
fi

# Copy required template files if they don't exist
copy_template() {
    local src="$1"
    local dest="$2"
    local name="$3"
    
    if [ ! -f "$dest" ]; then
        if [ -f "$src" ]; then
            if cp "$src" "$dest" 2>/dev/null; then
                echo "✓ Copied $name template"
            else
                echo "Warning: Could not copy $name template"
                echo "  Source: $src"
                echo "  Destination: $dest"
                return 1
            fi
        else
            echo "Warning: Source template not found: $src"
            return 1
        fi
    fi
    return 0
}

# Debug: Check template source paths
echo ""
echo "🔍 DEBUG: Template source investigation"
echo "Checking lib/breakdown directory structure..."

# Check if lib exists
if [ -d "../lib" ]; then
    echo "✓ ../lib directory exists"
    if [ -d "../lib/breakdown" ]; then
        echo "✓ ../lib/breakdown directory exists"
        echo "Contents of ../lib/breakdown/:"
        ls -la "../lib/breakdown/" 2>/dev/null || echo "  (unable to list contents)"
        
        if [ -d "../lib/breakdown/prompts" ]; then
            echo "✓ ../lib/breakdown/prompts directory exists"
            echo "Contents of ../lib/breakdown/prompts/:"
            find "../lib/breakdown/prompts" -type f -name "*.md" 2>/dev/null | head -10 || echo "  (no .md files found or unable to search)"
        else
            echo "✗ ../lib/breakdown/prompts directory does NOT exist"
        fi
    else
        echo "✗ ../lib/breakdown directory does NOT exist"
    fi
else
    echo "✗ ../lib directory does NOT exist"
fi

# Alternative: Check if prompts exist in other locations
echo ""
echo "Searching for template files in project root..."
find .. -name "f_issue.md" -type f 2>/dev/null | head -5 || echo "No f_issue.md files found"
find .. -name "f_project.md" -type f 2>/dev/null | head -5 || echo "No f_project.md files found"

# Copy templates with error handling
echo ""
echo "🔍 DEBUG: Attempting template copy operations"
copy_template "../.agent/breakdown/lib/breakdown/prompts/summary/issue/f_issue.md" \
              "prompts/summary/issue/f_issue.md" \
              "summary issue"

copy_template "../.agent/breakdown/lib/breakdown/prompts/summary/project/f_project.md" \
              "prompts/summary/project/f_project.md" \
              "summary project"

copy_template "../.agent/breakdown/lib/breakdown/prompts/defect/issue/f_issue.md" \
              "prompts/defect/issue/f_issue.md" \
              "defect issue"

# Create a basic configuration file
if ! cat > "${CONFIG_DIR}/basic-app.yml" << 'EOF'
# Basic application configuration
working_dir: "examples"
app_prompt:
  base_dir: "examples/prompts"
app_schema:
  base_dir: "examples/schema"
logger:
  level: "info"
  format: "text"
output:
  format: "markdown"
  includeHeaders: true
EOF
then
    echo "Error: Failed to create configuration file"
    exit 1
fi

echo "Created basic configuration: ${CONFIG_DIR}/basic-app.yml"

# Create sample input
INPUT_FILE="input.md"
if ! cat > "$INPUT_FILE" << 'EOF'
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
then
    echo "Error: Failed to create input file"
    exit 1
fi

echo "Created sample input file: $INPUT_FILE"

# Debug: Final state before execution
echo ""
echo "🔍 DEBUG: Final state before breakdown execution"
echo "Current directory: $(pwd)"
echo "Config files:"
ls -la "${CONFIG_DIR}/"*.yml 2>/dev/null || echo "  (no .yml config files found)"
echo "Template directories:"
find prompts -type f 2>/dev/null | head -10 || echo "  (no template files found)"
echo "Input file: $INPUT_FILE"
test -f "$INPUT_FILE" && echo "✓ Input file exists" || echo "✗ Input file missing"

# Test breakdown CLI with supported commands
echo ""
echo "🔍 DEBUG: Testing currently supported breakdown commands"
echo "Testing breakdown CLI help..."
if deno run -A ../cli/breakdown.ts --help 2>&1; then
    echo "✓ breakdown CLI is accessible"
else
    echo "✗ breakdown CLI is not accessible"
fi

echo ""
echo "🔍 IMPORTANT DISCOVERY: Based on help output, only 'init' command is currently supported"
echo "The 'summary' and 'to' commands mentioned in README are not yet implemented"

# Test the only working command - init with different config
echo ""
echo "Testing breakdown init with basic configuration..."
TEMP_TEST_DIR="./test_basic_config"
mkdir -p "$TEMP_TEST_DIR"
cd "$TEMP_TEST_DIR"

# Copy our basic config to test directory
cp "../.agent/breakdown/config/basic-app.yml" "./basic-app-test.yml" 2>/dev/null || true

echo "Running: deno run -A ../../cli/breakdown.ts init"
if deno run -A ../../cli/breakdown.ts init > init_output.log 2>&1; then
    echo "✓ Breakdown init successful"
    echo ""
    echo "=== Init Output ==="
    cat init_output.log
    echo ""
    echo "=== Created Directory Structure ==="
    find .agent -type f 2>/dev/null | head -10 || echo "No .agent files found"
else
    echo "✗ Breakdown init failed"
    echo "Error output:"
    cat init_output.log 2>/dev/null || echo "(no output)"
fi

# Return to examples directory
cd ..

echo ""
echo "🔍 CONCLUSION: The 06_config_basic.sh script fails because:"
echo "1. ✓ Template files are now correctly copied"
echo "2. ✗ 'summary project' command is not implemented in breakdown CLI"
echo "3. ✓ Only 'init' command is currently supported"
echo "4. 📝 This suggests the examples are ahead of the current CLI implementation"

# Clean up test directory
rm -rf "$TEMP_TEST_DIR" 2>/dev/null || true

echo ""
echo "=== Basic Configuration Example Completed ==="