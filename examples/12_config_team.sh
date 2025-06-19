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
CONFIG_DIR=".agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Create team configuration
cat > "${CONFIG_DIR}/team-app.yml" << 'EOF'
# Team development configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/team"
  template_prefix: "team_"
app_schema:
  base_dir: "schema/team"
  validation_enabled: true
  strict_mode: false
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

# Run breakdown with team configuration
echo ""
echo "Running breakdown with team configuration..."
echo "Command: deno run -A ../cli/breakdown.ts to task --config=team < team_planning.md"
deno run -A ../cli/breakdown.ts to task --config=team < team_planning.md > team_tasks.md

echo ""
echo "=== Output ==="
cat team_tasks.md

# Cleanup
rm -f team_planning.md team_tasks.md

echo ""
echo "=== Team Development Configuration Example Completed ==="