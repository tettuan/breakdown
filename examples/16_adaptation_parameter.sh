#!/bin/bash
# Example 20: Adaptation Parameter Template Selection
# This example demonstrates how the -a/--adaptation parameter affects template selection

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

echo "=== Example 20: Adaptation Parameter (--adaptation/-a) Template Selection ==="
echo "This example demonstrates how --adaptation affects which template variant is selected"
echo

# Set up
OUTPUT_DIR="./output/adaptation_parameter_test"
TEMPLATE_DIR="./prompts/to/task"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMPLATE_DIR"

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN='deno run --allow-all ../cli/breakdown.ts'
fi

# Create test input file
echo "=== Creating Test Input File ==="
cat > "$OUTPUT_DIR/project_requirements.md" << 'EOF'
# Project Requirements

## User Management System
- User registration and authentication
- Role-based access control
- Password reset functionality
- User profile management
- Activity logging

## Technical Requirements
- RESTful API design
- JWT authentication
- PostgreSQL database
- Comprehensive testing
- API documentation
EOF
echo "✅ Created test input file"
echo

# Create different adaptation templates
echo "=== Creating Adaptation Template Variants ==="

# Default template (no adaptation)
cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Standard Task Breakdown

## Template: DEFAULT (no adaptation)
This is the standard template used when no adaptation is specified.

## Input
{{input}}

## Task Breakdown
Here are the tasks in standard format...
EOF

# Strict adaptation template
cat > "$TEMPLATE_DIR/f_project_strict.md" << 'EOF'
# Strict Task Breakdown

## Template: STRICT Adaptation
This template enforces strict formatting and detailed specifications.

## Requirements Specification
{{input}}

## Strict Task Definition
Each task must include:
- Clear acceptance criteria
- Time estimates
- Dependencies
- Risk assessment

### Tasks with Strict Format:
1. Task ID: T001
   - Description: [Detailed description]
   - Acceptance Criteria: [Specific criteria]
   - Estimate: [Hours]
   - Dependencies: [List]
EOF

# Agile adaptation template
cat > "$TEMPLATE_DIR/f_project_agile.md" << 'EOF'
# Agile Task Breakdown

## Template: AGILE Adaptation
This template follows agile methodology patterns.

## Product Backlog Input
{{input}}

## User Stories and Tasks
Following agile methodology:

### Epic: User Management System
As a product owner, I want user management functionality...

#### User Stories:
- As a user, I want to register...
- As an admin, I want to manage roles...

#### Sprint Tasks:
- Story points estimation
- Sprint planning considerations
EOF

# Detailed adaptation template
cat > "$TEMPLATE_DIR/f_project_detailed.md" << 'EOF'
# Detailed Task Breakdown

## Template: DETAILED Adaptation
This template provides comprehensive task analysis.

## System Requirements
{{input}}

## Comprehensive Task Analysis
### Technical Architecture Tasks
- Database schema design
- API endpoint planning
- Security implementation

### Development Tasks
- Frontend components
- Backend services
- Integration layers

### Quality Assurance Tasks
- Unit test creation
- Integration testing
- Performance testing
EOF

echo "✅ Created adaptation templates:"
echo "  - f_project.md (default, no adaptation)"
echo "  - f_project_strict.md (--adaptation=strict)"
echo "  - f_project_agile.md (--adaptation=agile)"
echo "  - f_project_detailed.md (--adaptation=detailed)"
echo

# Demonstration
echo "=== Demonstration of --adaptation Parameter ==="
echo

# Example 1: Without adaptation (default)
echo "【Example 1: Without --adaptation parameter】"
echo "Command: breakdown to task --from=project_requirements.md --input=project"
echo "Expected: Should use default template (f_project.md)"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --input=project -o="$OUTPUT_DIR/result_no_adaptation.md" > "$OUTPUT_DIR/result_no_adaptation.md" 2>&1

if [ -f "$OUTPUT_DIR/result_no_adaptation.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_no_adaptation.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_no_adaptation.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: DEFAULT" "$OUTPUT_DIR/result_no_adaptation.md"; then
        echo "✅ Used default template (f_project.md)"
    else
        echo "⚠️  Template detection marker not found"
    fi
fi
echo

# Example 2: With --adaptation=strict
echo "【Example 2: With --adaptation=strict】"
echo "Command: breakdown to task --from=project_requirements.md --input=project --adaptation=strict"
echo "Expected: Should use f_project_strict.md template"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --input=project --adaptation=strict -o="$OUTPUT_DIR/result_strict.md" > "$OUTPUT_DIR/result_strict.md" 2>&1

if [ -f "$OUTPUT_DIR/result_strict.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_strict.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_strict.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: STRICT" "$OUTPUT_DIR/result_strict.md"; then
        echo "✅ Used strict adaptation template (f_project_strict.md)"
    elif grep -q "Task ID:" "$OUTPUT_DIR/result_strict.md"; then
        echo "✅ Found strict format markers"
    else
        echo "⚠️  May have fallen back to default template"
    fi
fi
echo

# Example 3: With --adaptation=agile
echo "【Example 3: With --adaptation=agile】"
echo "Command: breakdown to task --from=project_requirements.md --input=project --adaptation=agile"
echo "Expected: Should use f_project_agile.md template"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --input=project --adaptation=agile -o="$OUTPUT_DIR/result_agile.md" > "$OUTPUT_DIR/result_agile.md" 2>&1

if [ -f "$OUTPUT_DIR/result_agile.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_agile.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_agile.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: AGILE" "$OUTPUT_DIR/result_agile.md"; then
        echo "✅ Used agile adaptation template (f_project_agile.md)"
    elif grep -q "User Stories" "$OUTPUT_DIR/result_agile.md"; then
        echo "✅ Found agile format markers"
    else
        echo "⚠️  May have fallen back to default template"
    fi
fi
echo

# Example 4: With short form -a
echo "【Example 4: Using short form -a=】"
echo "Command: breakdown to task --from=project_requirements.md --input=project -a=detailed"
echo "Expected: Should use f_project_detailed.md template"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --input=project -a=detailed -o="$OUTPUT_DIR/result_detailed.md" > "$OUTPUT_DIR/result_detailed.md" 2>&1

if [ -f "$OUTPUT_DIR/result_detailed.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_detailed.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_detailed.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: DETAILED" "$OUTPUT_DIR/result_detailed.md"; then
        echo "✅ Used detailed adaptation template (f_project_detailed.md)"
    elif grep -q "Comprehensive Task Analysis" "$OUTPUT_DIR/result_detailed.md"; then
        echo "✅ Found detailed format markers"
    else
        echo "⚠️  May have fallen back to default template"
    fi
fi
echo

# Example 5: Non-existent adaptation (fallback test)
echo "【Example 5: Non-existent adaptation (fallback behavior)】"
echo "Command: breakdown to task --from=project_requirements.md --input=project --adaptation=custom"
echo "Expected: Should fall back to default template (f_project.md)"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --input=project --adaptation=custom -o="$OUTPUT_DIR/result_custom.md" > "$OUTPUT_DIR/result_custom.md" 2>&1

if [ -f "$OUTPUT_DIR/result_custom.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_custom.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_custom.md" | sed 's/^/  /'
    echo
    
    # Check fallback behavior
    if grep -q "Template: DEFAULT" "$OUTPUT_DIR/result_custom.md"; then
        echo "✅ Correctly fell back to default template"
    else
        echo "⚠️  Fallback behavior unclear"
    fi
fi
echo

# Summary
echo "=== Summary of --adaptation Parameter Behavior ==="
echo
echo "Template Selection with Adaptation:"
echo "1. Base pattern: f_{fromLayerType}.md"
echo "2. With adaptation: f_{fromLayerType}_{adaptation}.md"
echo "3. Fallback: If adaptation template doesn't exist, uses base template"
echo
echo "Examples:"
echo "  breakdown to task --input=project                    → f_project.md"
echo "  breakdown to task --input=project --adaptation=strict → f_project_strict.md"
echo "  breakdown to task --input=project -a agile           → f_project_agile.md"
echo "  breakdown to task --input=project -a nonexistent     → f_project.md (fallback)"
echo
echo "Adaptation represents the 'personality' or style of the prompt:"
echo "  - strict: Enforces rigid formatting and specifications"
echo "  - agile: Follows agile methodology patterns"
echo "  - detailed: Provides comprehensive analysis"
echo "  - custom: User-defined variations"
echo

# Check actual implementation
echo "=== Checking Created Files ==="
echo
if [ -d "$TEMPLATE_DIR" ]; then
    echo "Created adaptation templates in: $TEMPLATE_DIR"
    ls -la "$TEMPLATE_DIR"/f_project*.md 2>/dev/null | sed 's/^/  /'
fi
echo
if [ -d "$OUTPUT_DIR" ]; then
    echo "Generated outputs:"
    ls -la "$OUTPUT_DIR"/result_*.md 2>/dev/null | sed 's/^/  /'
fi

# Verify actual behavior
echo
echo "=== Verifying Actual Behavior ==="
echo "Checking if adaptation templates were actually used..."
echo

# Count how many results contain template markers
DEFAULT_COUNT=$(grep -l "Template: DEFAULT" "$OUTPUT_DIR"/result_*.md 2>/dev/null | wc -l || echo "0")
ADAPTATION_COUNT=$(grep -l "Template: \(STRICT\|AGILE\|DETAILED\)" "$OUTPUT_DIR"/result_*.md 2>/dev/null | wc -l)

echo "Results using default template: $DEFAULT_COUNT"
echo "Results using adaptation templates: $ADAPTATION_COUNT"

if [ "$ADAPTATION_COUNT" -eq 0 ]; then
    echo
    echo "⚠️  Note: Adaptation templates may not be used in current implementation"
    echo "    All results appear to use the default template regardless of --adaptation parameter"
    echo "    This suggests the feature may be planned but not yet implemented"
else
    echo
    echo "✅ Adaptation parameter is working as expected"
fi

echo "=== Adaptation Parameter Example Complete ==="
echo
echo "Key Takeaways:"
echo "- The --adaptation parameter adds a suffix to template filename"
echo "- Allows maintaining multiple prompt variations for different use cases"
echo "- Falls back gracefully when adaptation template doesn't exist"
echo "- Short form -a= works the same as --adaptation (必ずイコール記号を使用)"