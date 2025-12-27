#!/bin/bash
# Example 12: Team development configuration
# This example demonstrates team-oriented configuration with collaboration features

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Team Development Configuration Example ==="

# Run from examples directory
CONFIG_DIR="./.agent/climpt/config"

# Check if initialized - run setup if needed
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Environment not set up. Running setup script..."
    if ! bash 03_setup_environment.sh; then
        echo "Error: Failed to set up environment"
        exit 1
    fi
fi

# Ensure local template directories exist
echo "Setting up local team template directories..."
mkdir -p .agent/climpt/prompts/team/to/task

# Create team configuration (only if it doesn't exist or if different)
if [ ! -f "${CONFIG_DIR}/team-app.yml" ]; then
  cat > "${CONFIG_DIR}/team-app.yml" << 'EOF'
# Team development configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: ".agent/climpt/prompts"
  template_prefix: "team_"
app_schema:
  base_dir: ".agent/climpt/schema"
  validation_enabled: true
  strict_mode: false
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
logger:
  level: "debug"
  format: "text"
  output: "stdout"
  includeTimestamp: true
  includeContext: true
collaboration:
  enableSharing: true
  defaultVisibility: "team"
  reviewRequired: true
output:
  format: "markdown"
  includeHeaders: true
  includeFooters: true
  includeMetadata: true
  authorInfo: true
features:
  cliValidation: true
  experimentalFeatures: true
  teamFeatures: true
  debugMode: true
EOF
  echo "Created team configuration: ${CONFIG_DIR}/team-app.yml"
else
  echo "Using existing team configuration: ${CONFIG_DIR}/team-app.yml"
fi

# Create team collaboration scenario
cat > team_planning.md << 'EOF'
# Sprint Planning Meeting Notes

## Team Members Present
- Alice (Frontend Lead)
- Bob (Backend Lead)
- Carol (DevOps)
- David (QA Lead)

## Sprint Goals
1. Complete user authentication module
2. Implement real-time notifications
3. Set up CI/CD pipeline
4. Create automated test suite

## Task Distribution
### Frontend (Alice)
- Design login/signup UI
- Implement form validation
- Create notification components

### Backend (Bob)
- JWT token implementation
- WebSocket server setup
- Database schema updates

### DevOps (Carol)
- GitHub Actions workflow
- Docker containerization
- Kubernetes deployment configs

### QA (David)
- Unit test framework setup
- Integration test scenarios
- Performance benchmarks

## Blockers
- Waiting for design mockups
- Need AWS credentials
- Database migration strategy unclear

## Next Steps
1. Daily standup at 9 AM
2. Design review on Tuesday
3. Code review guidelines to be shared
EOF

echo "Created team planning document"

# Create required template file for CLI command in this script
echo "Creating required template for: breakdown to task --config=team"
mkdir -p .agent/climpt/prompts/to/task

# This command needs: prompts/to/task/f_task.md (default fromLayerType)
cat > ".agent/climpt/prompts/to/task/f_task.md" << 'EOF'
# Team Task Breakdown Template

## Input Content
{{input_text}}

## Team Task Analysis
Break down the input into team-oriented tasks:

1. **Team Assignments**: Who does what and when
2. **Collaboration Points**: Where team members need to coordinate
3. **Dependencies**: Task interdependencies and blockers
4. **Communication**: Required meetings and status updates

## Output Format
Team-focused task breakdown with clear ownership and coordination points.
EOF

echo "✓ Created template: prompts/to/task/f_task.md"

# Also create f_default.md if it doesn't exist
if [ ! -f ".agent/climpt/prompts/to/task/f_default.md" ]; then
    cp ".agent/climpt/prompts/to/task/f_task.md" ".agent/climpt/prompts/to/task/f_default.md"
    echo "✓ Created template: prompts/to/task/f_default.md"
fi

# Run breakdown with team configuration
echo ""
echo "Running breakdown with team configuration..."
echo "Command: deno run --allow-all ../cli/breakdown.ts to task --config=team < team_planning.md"
deno run --allow-all ../cli/breakdown.ts to task --config=team < team_planning.md > team_tasks.md

echo ""
echo "=== Output ==="
cat team_tasks.md

# Cleanup
rm -f team_planning.md team_tasks.md

echo ""
echo "=== Team Development Configuration Example Completed ==="