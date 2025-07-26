#!/bin/bash
# Example 13: Environment-specific configurations
# This example demonstrates how to use different configurations for dev/staging/prod

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Environment-Specific Configuration Example ==="

# Run from examples directory
CONFIG_DIR="./.agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Ensure local template directories exist for all environments
echo "Setting up local environment template directories..."
mkdir -p prompts/dev/defect/issue
mkdir -p prompts/staging/defect/issue  
mkdir -p prompts/prod/defect/issue

# Create defect templates for each environment
cat > prompts/dev/defect/issue/f_issue.md << 'EOF'
# Development Defect Analysis

## Environment: Development
**Debug Mode**: Enabled

## Issue Description
{{input_text}}

## Development Analysis
- Local debugging enabled
- Verbose logging active
- Stack traces available

## Next Steps
1. Reproduce locally
2. Add debug statements
3. Check development logs
4. Run local tests
EOF

cat > prompts/staging/defect/issue/f_issue.md << 'EOF'
# Staging Defect Analysis

## Environment: Staging 
**Load Testing**: Active

## Issue Description
{{input_text}}

## Staging Analysis
- Load testing conditions
- Database pool monitoring
- Performance metrics
- Integration testing

## Investigation Steps
1. Check staging logs
2. Monitor resource usage
3. Verify integration points
4. Test under load
EOF

cat > prompts/prod/defect/issue/f_issue.md << 'EOF'
# Production Defect Analysis

## Environment: Production
**CRITICAL ALERT**: Production Issue

## Issue Description
{{input_text}}

## Production Analysis
- Impact assessment required
- Rollback plan needed
- Customer notification
- SLA monitoring

## Emergency Protocol
1. Assess business impact
2. Implement hotfix/rollback
3. Customer communication
4. Post-incident review
EOF

echo "Created environment-specific templates in each prompt directory"

# Create development configuration (only if it doesn't exist)
if [ ! -f "${CONFIG_DIR}/dev-app.yml" ]; then
  cat > "${CONFIG_DIR}/dev-app.yml" << 'EOF'
# Development environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/dev"
app_schema:
  base_dir: "../lib/breakdown/schema/dev"
  validation_enabled: false
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
logger:
  level: "debug"
  format: "text"
  output: "stdout"
  colorize: true
features:
  experimentalFeatures: true
  debugMode: true
EOF
  echo "Created dev configuration: ${CONFIG_DIR}/dev-app.yml"
else
  echo "Using existing dev configuration: ${CONFIG_DIR}/dev-app.yml"
fi

# Create staging configuration (only if it doesn't exist)
if [ ! -f "${CONFIG_DIR}/staging-app.yml" ]; then
  cat > "${CONFIG_DIR}/staging-app.yml" << 'EOF'
# Staging environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/staging"
app_schema:
  base_dir: "../lib/breakdown/schema/staging"
  validation_enabled: true
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
logger:
  level: "info"
  format: "json"
  output: "stderr"
performance:
  maxFileSize: "5MB"
  timeout: 20000
features:
  experimentalFeatures: false
  debugMode: false
EOF
  echo "Created staging configuration: ${CONFIG_DIR}/staging-app.yml"
else
  echo "Using existing staging configuration: ${CONFIG_DIR}/staging-app.yml"
fi

# Create production configuration (only if it doesn't exist)
if [ ! -f "${CONFIG_DIR}/prod-app.yml" ]; then
  cat > "${CONFIG_DIR}/prod-app.yml" << 'EOF'
# Production environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/prod"
app_schema:
  base_dir: "../lib/breakdown/schema/prod"
  validation_enabled: true
  strict_mode: true
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
logger:
  level: "error"
  format: "json"
  output: "stderr"
  includeStackTrace: false
performance:
  maxFileSize: "10MB"
  timeout: 30000
  concurrency: 8
security:
  sanitizeInput: true
  auditLog: true
features:
  experimentalFeatures: false
  debugMode: false
EOF
  echo "Created prod configuration: ${CONFIG_DIR}/prod-app.yml"
else
  echo "Using existing prod configuration: ${CONFIG_DIR}/prod-app.yml"
fi

# Create user configuration files for each environment
if [ ! -f "${CONFIG_DIR}/dev-user.yml" ]; then
  cat > "${CONFIG_DIR}/dev-user.yml" << 'EOF'
working_dir: ".agent/breakdown/examples"
EOF
  echo "Created dev user configuration: ${CONFIG_DIR}/dev-user.yml"
else
  echo "Using existing dev user configuration: ${CONFIG_DIR}/dev-user.yml"
fi

if [ ! -f "${CONFIG_DIR}/staging-user.yml" ]; then
  cat > "${CONFIG_DIR}/staging-user.yml" << 'EOF'
working_dir: ".agent/breakdown/examples"
EOF
  echo "Created staging user configuration: ${CONFIG_DIR}/staging-user.yml"
else
  echo "Using existing staging user configuration: ${CONFIG_DIR}/staging-user.yml"
fi

if [ ! -f "${CONFIG_DIR}/prod-user.yml" ]; then
  cat > "${CONFIG_DIR}/prod-user.yml" << 'EOF'
working_dir: ".agent/breakdown/examples"
EOF
  echo "Created prod user configuration: ${CONFIG_DIR}/prod-user.yml"
else
  echo "Using existing prod user configuration: ${CONFIG_DIR}/prod-user.yml"
fi

echo "Created environment configurations:"
echo "- ${CONFIG_DIR}/dev-app.yml"
echo "- ${CONFIG_DIR}/staging-app.yml"
echo "- ${CONFIG_DIR}/prod-app.yml"
echo "- ${CONFIG_DIR}/dev-user.yml"
echo "- ${CONFIG_DIR}/staging-user.yml"
echo "- ${CONFIG_DIR}/prod-user.yml"

# Create test data in working directory
cat > ./environment_test.md << 'EOF'
# Environment Test Data

## Development Issue
DEBUG: Memory leak detected in user service
Stack trace shows recursive function call
Need immediate fix for local testing

## Staging Issue
API endpoint /users/profile returns 500 error
Occurs only under load testing
Database connection pool may be exhausted

## Production Issue
CRITICAL: Payment processing failing
Error rate: 15% of transactions
Started after deployment version 2.3.1
EOF

echo ""
echo "Testing different environments..."

# Test each environment
for ENV in dev staging prod; do
    echo ""
    echo "=== Testing ${ENV} environment ==="
    echo "Command: deno run --allow-all ../cli/breakdown.ts defect issue --config=${ENV} --from=./environment_test.md"
    deno run --allow-all ../cli/breakdown.ts defect issue --config=${ENV} --from=./environment_test.md > ./${ENV}_output.md
    echo "Output preview:"
    head -10 ./${ENV}_output.md
    rm -f ./${ENV}_output.md
done

# Cleanup
rm -f ./environment_test.md

echo ""
echo "=== Environment-Specific Configuration Example Completed ==="