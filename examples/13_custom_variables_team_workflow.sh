#!/bin/bash
# Example: Team Development Workflow with Custom Variables
#
# This script demonstrates practical use of --uv-* (user variable) options
# in a real team development scenario for standardized documentation generation.
#
# Demonstrates:
# - Team context variables (team name, sprint, project)
# - Version and priority tracking
# - Multiple output formats with custom context
# - Integration with existing CLI workflows

# Add at the top after any initial setup:
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
pushd "$PROJECT_ROOT" > /dev/null

# Error handling function
handle_error() {
    echo -e "\033[1;31mError: Custom variables workflow failed\033[0m"
    echo "Use case: Team development workflow with custom variables"
    echo "Failed command: $FAILED_COMMAND"
    echo "Error details: $1"
    exit 1
}

# Error handling setup
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== Team Development Workflow with Custom Variables ==="
echo "This example shows how custom variables enhance team collaboration"
echo
echo "⚠️  WARNING: Due to BreakdownParams v1.0.1 limitations, this example is currently non-functional."
echo "See examples/KNOWN_LIMITATIONS.md for details."
echo ""
echo "Temporarily skipping demonstration..."
exit 0

# Create output directories
mkdir -p tmp/examples/team_workflow/issues
mkdir -p tmp/examples/team_workflow/tasks
mkdir -p tmp/examples/team_workflow/summaries

# Set team context variables for consistent documentation
TEAM_NAME="Platform Engineering Team"
SPRINT_ID="Q1-2025-Sprint-3"
PROJECT_NAME="payment-gateway-v2"
VERSION="2.1.0"
PRIORITY="P1-Critical"

echo "🏢 Team Context:"
echo "  Team: $TEAM_NAME"
echo "  Sprint: $SPRINT_ID"
echo "  Project: $PROJECT_NAME"
echo "  Version: $VERSION"
echo "  Priority: $PRIORITY"
echo

# Example 1: Issue Analysis with Team Context
echo "📋 Example 1: Creating team issue analysis with custom variables..."
cat > tmp/examples/team_workflow/raw_bug_report.md << 'EOF'
# Payment Gateway Bug Report

## Problem Description
Users experiencing 503 errors during payment processing. 
Error occurs intermittently during high traffic periods.
Database connection timeouts observed in logs.

## Impact
- 15% payment failure rate during peak hours
- Customer complaints increasing
- Revenue impact estimated at $50k/day

## Technical Details
- Microservice: payment-processor
- Environment: production
- Error codes: 503, DB_TIMEOUT, CONN_POOL_EXHAUSTED
EOF

echo "Generating issue analysis with team context..."
.deno/bin/breakdown summary issue \
  --from tmp/examples/team_workflow/raw_bug_report.md \
  --uv-team "$TEAM_NAME" \
  --uv-sprint "$SPRINT_ID" \
  --uv-project "$PROJECT_NAME" \
  --uv-version "$VERSION" \
  --uv-priority "$PRIORITY" \
  -o tmp/examples/team_workflow/issues/payment_gateway_issue.md

# Example 2: Task Generation with Custom Context  
echo
echo "📝 Example 2: Converting issue to actionable tasks with custom variables..."
.deno/bin/breakdown to task \
  tmp/examples/team_workflow/issues/payment_gateway_issue.md \
  --uv-team "$TEAM_NAME" \
  --uv-sprint "$SPRINT_ID" \
  --uv-project "$PROJECT_NAME" \
  --uv-assignee "Backend Team Lead" \
  --uv-deadline "2025-01-20" \
  -o tmp/examples/team_workflow/tasks/

# Example 3: STDIN workflow with team variables
echo
echo "🔄 Example 3: STDIN workflow with team context for quick documentation..."
QUICK_UPDATE="Sprint retrospective: Payment gateway stability improved 90%. Connection pool optimization successful. Ready for next deployment phase."

echo "Processing sprint update via STDIN with team context..."
echo "$QUICK_UPDATE" | .deno/bin/breakdown summary project \
  --uv-team "$TEAM_NAME" \
  --uv-sprint "$SPRINT_ID" \
  --uv-project "$PROJECT_NAME" \
  --uv-status "In Progress" \
  --uv-confidence "High" \
  -o tmp/examples/team_workflow/summaries/sprint_update.md

# Example 4: Multi-environment deployment documentation
echo
echo "🚀 Example 4: Deployment documentation with environment variables..."
cat > tmp/examples/team_workflow/deployment_notes.txt << 'EOF'
Deployment completed successfully:
- Database migration: v2.1.0 schema updates applied
- Connection pool: Increased from 50 to 100 connections
- Monitoring: New dashboards deployed
- Load testing: 99.9% success rate at 2x normal traffic

Next steps:
- Monitor for 48 hours
- Gradual traffic increase to 100%
- Performance metrics validation
EOF

echo "Generating deployment tasks with environment context..."
.deno/bin/breakdown to task \
  tmp/examples/team_workflow/deployment_notes.txt \
  --uv-team "$TEAM_NAME" \
  --uv-project "$PROJECT_NAME" \
  --uv-env "production" \
  --uv-region "us-west-2" \
  --uv-cluster "prod-k8s-cluster" \
  --uv-namespace "payment-service" \
  -o tmp/examples/team_workflow/tasks/deployment_tasks.md

# Display results
echo
echo "✅ Team workflow examples completed!"
echo
echo "📁 Generated files with custom variable context:"
echo "├── issues/"
find tmp/examples/team_workflow/issues/ -name "*.md" -exec basename {} \; | sed 's/^/│   ├── /'
echo "├── tasks/"
find tmp/examples/team_workflow/tasks/ -name "*.md" -exec basename {} \; | sed 's/^/│   ├── /'
echo "└── summaries/"
find tmp/examples/team_workflow/summaries/ -name "*.md" -exec basename {} \; | sed 's/^/    ├── /'

echo
echo "🔍 Sample output with custom variables (first 10 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -10 tmp/examples/team_workflow/issues/payment_gateway_issue.md 2>/dev/null || echo "Issue file not yet generated"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo
echo "💡 Custom Variable Benefits Demonstrated:"
echo "  ✓ Consistent team context across all documentation"
echo "  ✓ Automatic sprint and project tracking"
echo "  ✓ Environment-specific deployment documentation"  
echo "  ✓ Standardized priority and version information"
echo "  ✓ Enhanced traceability and collaboration"

echo
echo "🚀 Next Steps:"
echo "  1. Customize variables for your team's needs"
echo "  2. Integrate with your CI/CD pipeline" 
echo "  3. Create team-specific variable templates"
echo "  4. Add custom variables to existing scripts"

popd > /dev/null
exit 0