#!/bin/bash
# Example 19: Input Parameter Template Selection
# This example demonstrates how the -i/--input parameter affects template selection


set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Error handling
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}

# Set trap for error handling and cleanup
trap 'cd "$ORIGINAL_CWD"' EXIT
trap 'handle_error "Command failed: ${BASH_COMMAND}"' ERR

# Get script directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Example 19: Input Parameter (--input/-i) Template Selection ==="
echo "This example demonstrates how --input affects which template file is selected"
echo

# Set up
OUTPUT_DIR="./output/input_parameter_test"
TEMPLATE_DIR="./.agent/climpt/prompts/to/task"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMPLATE_DIR"

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN='deno run --allow-all ../cli/breakdown.ts'
fi

# Create required template files for CLI commands in this script
echo "=== Creating Required Template Files ==="

# Create f_default.md template
cat > "$TEMPLATE_DIR/f_default.md" << 'EOF'
# Task Breakdown (DEFAULT Template)

## Input Type: UNSPECIFIED
This is the default template used when no --input parameter is specified.

## Input Content
{{input}}

## Generated Tasks
Generic task breakdown without specific input context...
EOF

# This script runs multiple "breakdown to task" commands with different --input parameters
# Required templates: f_project.md, f_issue.md, f_task.md

mkdir -p "$TEMPLATE_DIR"

# Template for --input=project: f_project.md
cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Task Breakdown from PROJECT Level

## Input Type: PROJECT
When input is from project level, we create high-level tasks for project implementation.

## Input Content
{{input_text}}

## Task Generation
Break down the project into:
1. **Planning Tasks**: Requirements, design, architecture
2. **Development Tasks**: Core features and functionality  
3. **Integration Tasks**: System integration and testing
4. **Deployment Tasks**: Infrastructure and release preparation

## Output Format
Structured task list with priorities and dependencies.
EOF

# Template for --input=issue: f_issue.md  
cat > "$TEMPLATE_DIR/f_issue.md" << 'EOF'
# Task Breakdown from ISSUE Level

## Input Type: ISSUE
When input is from issue level, we create specific tasks to resolve the issue.

## Input Content
{{input_text}}

## Task Generation
Create tasks to address the issue:
1. **Investigation Tasks**: Analysis and root cause identification
2. **Implementation Tasks**: Code changes and fixes
3. **Testing Tasks**: Verification and validation
4. **Documentation Tasks**: Updates and communication

## Output Format
Actionable task list with clear acceptance criteria.
EOF

# Template for --input=task or default: f_task.md
cat > "$TEMPLATE_DIR/f_task.md" << 'EOF'
# Task Breakdown from TASK Level

## Input Type: TASK
When input is from task level, we create subtasks or implementation details.

## Input Content
{{input_text}}

## Task Generation
Break down tasks into smaller, actionable items:
1. **Subtasks**: Detailed implementation steps
2. **Dependencies**: Required resources and prerequisites
3. **Acceptance Criteria**: Definition of done
4. **Estimation**: Time and effort requirements

## Output Format
Detailed subtask breakdown with clear deliverables.
EOF

echo "✓ Created templates: f_default.md, f_project.md, f_issue.md, f_task.md"
echo

# Create test input files for different layer types
echo "=== Creating Test Input Files ==="

# Project level input
cat > "$OUTPUT_DIR/project_overview.md" << 'EOF'
# New E-Commerce Platform

Build a modern e-commerce platform with the following features:
- User authentication and profiles
- Product catalog with search
- Shopping cart and checkout
- Payment integration
- Order management
EOF

# Issue level input
cat > "$OUTPUT_DIR/issue_list.md" << 'EOF'
# Current Issues

1. Login timeout after 5 minutes
2. Search results not updating properly
3. Cart items disappearing on refresh
4. Payment gateway connection errors
5. Order confirmation emails not sending
EOF

# Task level input
cat > "$OUTPUT_DIR/task_list.md" << 'EOF'
# Sprint Tasks

- Fix login session timeout
- Update search index algorithm
- Implement cart persistence
- Add payment retry logic
- Configure email service
EOF

echo "✅ Created test input files"
echo

# Create different template files to show selection behavior
echo "=== Creating Template Files ==="

# Template for project input
cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Task Breakdown from PROJECT Level

## Input Type: PROJECT
When input is from project level, we create detailed implementation tasks.

## Project Content
{{input}}

## Generated Tasks
Based on the project overview, here are the implementation tasks...
EOF

# Template for issue input
cat > "$TEMPLATE_DIR/f_issue.md" << 'EOF'
# Task Breakdown from ISSUE Level

## Input Type: ISSUE
When input is from issue level, we create specific resolution tasks.

## Issue Content
{{input}}

## Resolution Tasks
For each issue, here are the required tasks...
EOF

# Template for task input (default)
cat > "$TEMPLATE_DIR/f_task.md" << 'EOF'
# Task Breakdown from TASK Level

## Input Type: TASK
When input is from task level, we create subtasks or implementation details.

## Task Content
{{input}}

## Subtasks
Breaking down the tasks into smaller steps...
EOF

echo "✅ Created template files:"
echo "  - f_project.md (selected when --input=project)"
echo "  - f_issue.md (selected when --input=issue)"
echo "  - f_task.md (selected when --input=task)"
echo "  - f_default.md (selected when no --input is specified)"
echo

# Demonstration
echo "=== Demonstration of --input Parameter ==="
echo

# Example 1: Without --input (default behavior)
echo "【Example 1: Without --input parameter】"
echo "Command: breakdown to task --from=project_overview.md"
echo "Expected: Should use f_default.md template (no --input specified)"
echo

$BREAKDOWN to task -o="$OUTPUT_DIR/result_no_input.md" < "$OUTPUT_DIR/project_overview.md" 2>&1

if [ -f "$OUTPUT_DIR/result_no_input.md" ]; then
    echo "Result preview:"
    head -5 "$OUTPUT_DIR/result_no_input.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Input Type: UNSPECIFIED" "$OUTPUT_DIR/result_no_input.md"; then
        echo "✅ Used f_default.md as expected"
    elif grep -q "Input Type: TASK" "$OUTPUT_DIR/result_no_input.md"; then
        echo "❌ Unexpectedly used f_task.md instead of f_default.md"
    elif grep -q "Input Type: PROJECT" "$OUTPUT_DIR/result_no_input.md"; then
        echo "❌ Unexpectedly used f_project.md"
    elif grep -q "Input Type: ISSUE" "$OUTPUT_DIR/result_no_input.md"; then
        echo "❌ Unexpectedly used f_issue.md"
    else
        echo "⚠️  Could not determine which template was used"
    fi
fi
echo

# Example 2: With --input=project
echo "【Example 2: With --input=project】"
echo "Command: breakdown to task --from=project_overview.md --input=project"
echo "Expected: Should use f_project.md template (not f_task.md)"
echo

$BREAKDOWN to task --input=project -o="$OUTPUT_DIR/result_input_project.md" < "$OUTPUT_DIR/project_overview.md" 2>&1

if [ -f "$OUTPUT_DIR/result_input_project.md" ]; then
    echo "Result preview:"
    head -5 "$OUTPUT_DIR/result_input_project.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Input Type: PROJECT" "$OUTPUT_DIR/result_input_project.md"; then
        echo "✅ Used f_project.md as expected"
    elif grep -q "Input Type: TASK" "$OUTPUT_DIR/result_input_project.md"; then
        echo "❌ Incorrectly used f_task.md instead of f_project.md"
    else
        echo "⚠️ Template content differs from expected"
    fi
fi
echo

# Example 3: With --input=issue
echo "【Example 3: With --input=issue】"
echo "Command: breakdown to task --from=issue_list.md --input=issue"
echo "Expected: Should use f_issue.md template (not f_task.md)"
echo

$BREAKDOWN to task --input=issue -o="$OUTPUT_DIR/result_input_issue.md" < "$OUTPUT_DIR/issue_list.md" 2>&1

if [ -f "$OUTPUT_DIR/result_input_issue.md" ]; then
    echo "Result preview:"
    head -5 "$OUTPUT_DIR/result_input_issue.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Input Type: ISSUE" "$OUTPUT_DIR/result_input_issue.md"; then
        echo "✅ Used f_issue.md as expected"
    elif grep -q "Input Type: TASK" "$OUTPUT_DIR/result_input_issue.md"; then
        echo "❌ Incorrectly used f_task.md instead of f_issue.md"
    else
        echo "⚠️ Template content differs from expected"
    fi
fi
echo

# Example 4: With short form -i
echo "【Example 4: Using short form -i=】"
echo "Command: breakdown to task --from=task_list.md -i=task"
echo "Expected: Should use f_task.md template"
echo

$BREAKDOWN to task -i=task -o="$OUTPUT_DIR/result_short_form.md" < "$OUTPUT_DIR/task_list.md" 2>&1

if [ -f "$OUTPUT_DIR/result_short_form.md" ]; then
    echo "Result preview:"
    head -5 "$OUTPUT_DIR/result_short_form.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Input Type: TASK" "$OUTPUT_DIR/result_short_form.md"; then
        echo "✅ Used f_task.md as expected"
    else
        echo "❌ Did not use expected template"
    fi
else
    echo "❌ Command failed with -i=task format"
fi
echo


# Summary
echo "=== Summary of --input Parameter Behavior ==="
echo
echo "The --input parameter controls which template file is selected:"
echo "- breakdown to task --input=project → uses f_project.md"
echo "- breakdown to task --input=issue   → uses f_issue.md"
echo "- breakdown to task --input=task    → uses f_task.md"
echo "- breakdown to task                 → uses f_default.md (default)"
echo
echo "Template path pattern:"
echo "  {base_dir}/{directiveType}/{layerType}/f_{fromLayerType}.md"
echo "  where fromLayerType is determined by --input parameter"
echo

# Check actual implementation
echo "=== Checking Actual Implementation ==="
echo
if [ -d "$TEMPLATE_DIR" ]; then
    echo "Created templates in: $TEMPLATE_DIR"
    if ls "$TEMPLATE_DIR"/f_*.md >/dev/null 2>&1; then
        ls -la "$TEMPLATE_DIR"/f_*.md 2>/dev/null | sed 's/^/  /'
    fi
fi
echo
if [ -d "$OUTPUT_DIR" ]; then
    echo "Generated outputs:"
    if ls "$OUTPUT_DIR"/result_*.md >/dev/null 2>&1; then
        ls -la "$OUTPUT_DIR"/result_*.md 2>/dev/null | sed 's/^/  /'
    fi
fi

echo
echo "=== Input Parameter Example Complete ==="
echo
echo "Key Takeaways:"
echo "- The --input parameter controls template selection"
echo "- Template path: {base_dir}/{directiveType}/{layerType}/f_{fromLayerType}.md"
echo "- --input=X sets fromLayerType to X"
echo "- Short form -i= works the same as --input (equal sign required)"
echo "- Without --input, default fromLayerType is used (typically 'task')"