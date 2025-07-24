#!/bin/bash
# Example 11: Production configuration
# This example demonstrates production-ready configuration with enhanced settings

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Production Configuration Example ==="

# Run from examples directory
CONFIG_DIR="./.agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Ensure local template directories exist
echo "Setting up local production template directories..."
mkdir -p prompts/production/defect/issue

# Create production configuration (only if it doesn't exist)
if [ ! -f "${CONFIG_DIR}/production-app.yml" ]; then
  cat > "${CONFIG_DIR}/production-app.yml" << 'EOF'
# Breakdown Configuration for Production Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  temp_dir: ".agent/breakdown/temp"
production_mode: true
logger:
  level: "warn"
  format: "json"
  output: "stderr"
  includeTimestamp: true
performance:
  maxFileSize: "10MB"
  timeout: 30000
  concurrency: 4
  cacheEnabled: true
output:
  format: "markdown"
  includeHeaders: true
  includeFooters: false
  maxLineLength: 120
security:
  sanitizeInput: true
  allowedProtocols: ["https", "file"]
  blockedPatterns: [".env", "secrets", "password"]
features:
  cliValidation: true
  experimentalFeatures: false
EOF
  echo "Created production configuration: ${CONFIG_DIR}/production-app.yml"
else
  echo "Using existing production configuration: ${CONFIG_DIR}/production-app.yml"
fi

# Create sample production data
cat > production_report.md << 'EOF'
# Production System Report

## System Overview
Our production system handles millions of requests daily with high availability requirements.

## Current Issues
- Memory usage spikes during peak hours
- Database connection pool exhaustion
- Slow API response times for complex queries

## Proposed Solutions
1. Implement caching layer
2. Optimize database queries
3. Add horizontal scaling capabilities

## Risk Assessment
- High: Data consistency during migration
- Medium: Service disruption during deployment
- Low: User experience degradation
EOF

echo "Created sample production report"

# Run breakdown with production configuration
echo ""
echo "Running breakdown with production configuration..."
echo "Command: deno run --allow-all ../cli/breakdown.ts summary issue --config=production < production_report.md"
deno run --allow-all ../cli/breakdown.ts summary issue --config=production < production_report.md > production_output.md

echo ""
echo "=== Output ==="
cat production_output.md

# Cleanup
rm -f production_report.md production_output.md

echo ""
echo "=== Production Configuration Example Completed ==="