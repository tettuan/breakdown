#!/bin/bash
# Example 11: Custom Parameters Demo
# This example shows how custom directive/layer types work with custom configuration
set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Error handling
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting and CWD restoration
trap 'cd "$ORIGINAL_CWD"; handle_error "Command failed: ${BASH_COMMAND}"' ERR
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Example 11: Custom Parameters Demo ==="
echo "This example demonstrates using custom directive and layer types"
echo

# Set configuration paths
CONFIG_DIR="./.agent/breakdown/config"
CONFIG_FILE="$CONFIG_DIR/production-user.yml"
TEST_DIR="tmp/production-custom-test"
OUTPUT_DIR="tmp/production-bug-reports"

echo "Configuration directory: $CONFIG_DIR"
echo "Configuration file: $CONFIG_FILE"
echo "Test directory: $TEST_DIR"
echo "Output directory: $OUTPUT_DIR"
echo

# Create configuration directory if it doesn't exist
mkdir -p "$CONFIG_DIR" || handle_error "Failed to create config directory"

# Create custom template directories
echo "Setting up custom template directories..."
mkdir -p .agent/breakdown/prompts/find/bugs

# Create custom configuration file specifically for this example
CUSTOM_CONFIG_FILE="$CONFIG_DIR/production-custom-app.yml"
echo "=== Creating Custom Configuration ==="
cat > "$CUSTOM_CONFIG_FILE" << 'EOF'
# Breakdown Configuration for Production Custom Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
production_mode: true
custom_config: true
advanced_features: true
EOF
echo "✅ Created custom configuration with 'find' and 'bugs' enabled"

echo
echo "=== Creating Test Files ==="

# Create test directories
mkdir -p "$TEST_DIR" || handle_error "Failed to create test directory"
mkdir -p "$OUTPUT_DIR" || handle_error "Failed to create output directory"

# Create a simple test file
cat > "$TEST_DIR/test_file.md" << 'EOF'
# Test Input File

This is a test file for demonstrating custom parameters.

The 'find bugs' command will use templates from:
- prompts/find/bugs/f_bugs.md or similar

This demonstrates that:
1. Custom directive types like 'find' can be configured
2. Custom layer types like 'bugs' can be configured
3. The template path follows the pattern: prompts/{directiveType}/{layerType}/f_{layerType}.md
EOF

echo "Test file created."
echo

# Create a custom template for 'find bugs'
cat > ".agent/breakdown/prompts/find/bugs/f_bugs.md" << 'EOF'
# Find Bugs Template

Input: {{input}}

Please analyze the input and identify potential issues.
EOF

echo "=== Running Custom Command: find bugs ==="
echo
echo "Executing command:"
echo "   deno run --allow-all ../cli/breakdown.ts find bugs --config=production-custom --from=$TEST_DIR/test_file.md -o=$OUTPUT_DIR/result.md"
echo

if deno run --allow-all ../cli/breakdown.ts find bugs --config=production-custom --from="$TEST_DIR/test_file.md" -o="$OUTPUT_DIR/result.md" > "$OUTPUT_DIR/result.md" 2>&1; then
    echo "✅ Custom command executed successfully!"
    echo "   Output: $OUTPUT_DIR/result.md"
    if [ -f "$OUTPUT_DIR/result.md" ] && [ -s "$OUTPUT_DIR/result.md" ]; then
        echo "   Preview:"
        head -10 "$OUTPUT_DIR/result.md" | sed 's/^/     /'
    fi
else
    echo "⚠️  Custom command encountered issues"
    echo "   Error output:"
    cat "$OUTPUT_DIR/result.md" 2>/dev/null | head -10 | sed 's/^/     /'
fi


echo
echo "=== Example Complete ==="
echo
echo "This example demonstrated:"
echo "  • How to configure custom directive types (e.g., 'find')"
echo "  • How to configure custom layer types (e.g., 'bugs')"
echo "  • How templates are resolved: prompts/{directiveType}/{layerType}/"
echo "  • Using production-custom configuration profile"
echo

# Check results
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Custom configuration created at: $CONFIG_FILE"
fi

if [ -d "prompts/find/bugs" ]; then
    echo "✅ Custom template directory created: prompts/find/bugs/"
fi

if [ -f "$OUTPUT_DIR/result.md" ]; then
    echo "✅ Command output generated: $OUTPUT_DIR/result.md"
fi