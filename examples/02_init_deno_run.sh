#!/bin/bash

# This script initializes the Breakdown project structure using deno run

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Initializing Breakdown Project Structure (deno run) ==="

# Check if .agent/breakdown already exists in examples directory
if [ -d ".agent/breakdown" ]; then
  echo "Warning: .agent/breakdown directory already exists in examples"
  echo "Skipping initialization to avoid overwriting existing configuration"
  echo "To reinitialize, please remove .agent/breakdown directory first"
else
  # Initialize project structure using deno run
  echo "Running breakdown init with deno run..."
  deno run -A ../cli/breakdown.ts init

  # Copy prompt templates from test fixtures to make examples functional
  echo "Copying prompt templates..."
  if [ -d "../tests/fixtures/prompts" ]; then
    cp -r ../tests/fixtures/prompts/* .agent/breakdown/prompts/ 2>/dev/null || echo "Warning: Some prompt templates could not be copied"
    echo "✅ Prompt templates copied from test fixtures"
  else
    echo "⚠️ Warning: Test fixtures not found, prompts directory will be empty"
  fi

  # Create missing defect prompts that are expected by examples
  echo "Creating missing defect prompts..."
  mkdir -p .agent/breakdown/prompts/defect/project
  mkdir -p .agent/breakdown/prompts/defect/issue
  
  # Create basic defect/project template
  if [ ! -f ".agent/breakdown/prompts/defect/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/defect/project/f_project.md << 'EOF'
# Defect Analysis Template

## Input

{input_text}

## Output

- output.md

---

## Analysis Perspectives

- Error patterns and root causes
- Impact assessment
- Fix recommendations
- Prevention strategies
- Quality metrics

## Instructions

1. Analyze the defect information from the above perspectives.
2. Identify patterns and underlying causes.
3. Assess impact and urgency level.
4. Provide specific fix recommendations.
5. Suggest prevention measures.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create basic defect/issue template
  if [ ! -f ".agent/breakdown/prompts/defect/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/defect/issue/f_issue.md << 'EOF'
# Issue Defect Analysis Template

## Input

{input_text}

## Output

- output.md

---

## Analysis Perspectives

- Issue description and context
- Error reproduction steps
- Impact on users/system
- Fix priority and timeline
- Testing requirements

## Instructions

1. Analyze the issue information from the above perspectives.
2. Break down the problem into actionable items.
3. Estimate fix complexity and timeline.
4. Define testing and verification steps.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create missing summary prompts that are expected by examples
  echo "Creating missing summary prompts..."
  mkdir -p .agent/breakdown/prompts/summary/project
  mkdir -p .agent/breakdown/prompts/summary/issue
  
  # Create summary/project/f_project.md template
  if [ ! -f ".agent/breakdown/prompts/summary/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/summary/project/f_project.md << 'EOF'
# Project Summary Prompt

This prompt helps create comprehensive project summaries.

## Input

{input_text}

## Output

The output should be a structured project summary with:

- Project status overview
- Progress on key objectives
- Deliverable status
- Technical achievements
- Timeline assessment
- Resource utilization
- Dependency status
- Risk assessment
- Next steps

## Instructions

1. Analyze project documentation
2. Assess progress on objectives
3. Review deliverable status
4. Evaluate technical progress
5. Compare timeline estimates
6. Review resource usage
7. Check dependency status
8. Update risk assessment
9. Identify action items
EOF
  fi

  # Create summary/issue/f_issue.md template
  if [ ! -f ".agent/breakdown/prompts/summary/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/summary/issue/f_issue.md << 'EOF'
# Issue Summary Template

## Input

- {input_text}

## Output

- output.md

---

## Summary Perspectives

- Issue overview
- Key requirements and issues
- Dependencies summary
- Priority and urgency
- Effort estimation
- Status and blockers

## Instructions

1. Summarize the input information from the above perspectives.
2. Create summaries in units of 100, 200, and 300 characters.
3. Structure the summary with chapters and paragraphs.
4. Clearly indicate any missing information as "Missing Information".
5. Always use template variables.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Verify the created structure
  if [ -d ".agent/breakdown" ]; then
    echo "✅ Successfully initialized project structure"
    echo
    echo "Created directories:"
    find .agent/breakdown -type d | head -10
    echo
    echo "Created prompt files:"
    find .agent/breakdown/prompts -type f | head -10
  else
    echo "❌ Failed to initialize project structure"
    exit 1
  fi
fi

echo "=== Initialization Completed ==="