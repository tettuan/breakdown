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
CONFIG_DIR=".agent/breakdown/config"

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

# Copy required environment template files
echo "Copying environment template files..."
cp ../lib/breakdown/prompts/dev/defect/issue/f_issue.md prompts/dev/defect/issue/ 2>/dev/null || echo "Warning: Could not copy dev template"
cp ../lib/breakdown/prompts/staging/defect/issue/f_issue.md prompts/staging/defect/issue/ 2>/dev/null || echo "Warning: Could not copy staging template"
cp ../lib/breakdown/prompts/prod/defect/issue/f_issue.md prompts/prod/defect/issue/ 2>/dev/null || echo "Warning: Could not copy prod template"

# Create development configuration
cat > "${CONFIG_DIR}/dev-app.yml" << 'EOF'
# Development environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/dev"
app_schema:
  base_dir: "../lib/breakdown/schema/dev"
  validation_enabled: false
logger:
  level: "debug"
  format: "text"
  output: "stdout"
  colorize: true
features:
  experimentalFeatures: true
  debugMode: true
EOF

# Create staging configuration
cat > "${CONFIG_DIR}/staging-app.yml" << 'EOF'
# Staging environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/staging"
app_schema:
  base_dir: "../lib/breakdown/schema/staging"
  validation_enabled: true
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

# Create production configuration (already exists as production-app.yml)
cat > "${CONFIG_DIR}/prod-app.yml" << 'EOF'
# Production environment configuration
working_dir: "."
app_prompt:
  base_dir: "prompts/prod"
app_schema:
  base_dir: "../lib/breakdown/schema/prod"
  validation_enabled: true
  strict_mode: true
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

echo "Created environment configurations:"
echo "- ${CONFIG_DIR}/dev-app.yml"
echo "- ${CONFIG_DIR}/staging-app.yml"
echo "- ${CONFIG_DIR}/prod-app.yml"

# Create test data
cat > environment_test.md << 'EOF'
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
    echo "Command: deno run -A ../cli/breakdown.ts defect issue --config=${ENV} < environment_test.md"
    deno run -A ../cli/breakdown.ts defect issue --config=${ENV} < environment_test.md > ${ENV}_output.md
    echo "Output preview:"
    head -10 ${ENV}_output.md
    rm -f ${ENV}_output.md
done

# Cleanup
rm -f environment_test.md

echo ""
echo "=== Environment-Specific Configuration Example Completed ==="