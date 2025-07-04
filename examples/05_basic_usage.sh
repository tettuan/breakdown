#!/bin/bash

# This script demonstrates basic usage of all main Breakdown commands

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the project root directory (parent of examples)
cd "$(dirname "$0")/.."

echo "=== Basic Usage Examples ==="

# Set timeout for examples execution (60 seconds)
export BREAKDOWN_TIMEOUT=60000

# Ensure templates are ready before execution
echo "Checking template availability..."
if ! bash ./examples/00_template_check.sh full; then
    echo "❌ Template setup failed. Exiting."
    exit 1
fi

# Ensure we have a way to run breakdown
if [ -f ./.deno/bin/breakdown ] && ./.deno/bin/breakdown --help &> /dev/null; then
    BREAKDOWN="./.deno/bin/breakdown"
elif command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run -A ./cli/breakdown.ts"
fi

# Create output directory for examples
OUTPUT_DIR="./examples/output/basic_examples"
mkdir -p "$OUTPUT_DIR"

# Example 1: TO command - Breaking down a project
echo "1. Breaking down a project specification into issues"
cat > "$OUTPUT_DIR/project_spec.md" << EOF
# E-Commerce Platform Project

## Overview
Build a modern e-commerce platform with user management, product catalog, and payment processing.

## Key Features
- User registration and authentication
- Product browsing and search
- Shopping cart functionality
- Secure payment processing
- Order tracking
- Admin dashboard
EOF

cat "$OUTPUT_DIR/project_spec.md" | $BREAKDOWN to issue --config=timeout --destination="$OUTPUT_DIR/issues/"
echo "✅ Created issue breakdowns in $OUTPUT_DIR/issues/"
echo

# Example 2: SUMMARY command - Summarizing unorganized content
echo "2. Summarizing unorganized task notes"
cat > "$OUTPUT_DIR/messy_notes.md" << EOF
need to fix the login button it's not working on mobile
also the search feature returns too many results
customers complaining about slow checkout
database queries taking too long especially for product listings
forgot to add email validation
payment gateway integration still pending
need better error messages throughout the app
mobile responsive design issues on tablets
EOF

echo "Processing messy notes into organized summary..."
cat "$OUTPUT_DIR/messy_notes.md" | $BREAKDOWN summary task --config=default --destination="$OUTPUT_DIR/task_summary.md"
echo "✅ Created task summary at $OUTPUT_DIR/task_summary.md"
echo

# Example 3: DEFECT command - Analyzing error logs
echo "3. Analyzing error logs for defects"
cat > "$OUTPUT_DIR/error_log.txt" << EOF
2024-01-15 10:23:45 ERROR: Database connection timeout after 30s
2024-01-15 10:24:12 ERROR: NullPointerException in UserService.authenticate()
2024-01-15 10:25:33 WARNING: Slow query detected: SELECT * FROM products took 5.2s
2024-01-15 10:26:45 ERROR: PaymentGateway API returned 503 Service Unavailable
2024-01-15 10:27:01 ERROR: Failed to send email: SMTP connection refused
2024-01-15 10:28:15 ERROR: Memory usage exceeded 90% threshold
2024-01-15 10:29:30 ERROR: Concurrent modification exception in ShoppingCart
EOF

tail -20 "$OUTPUT_DIR/error_log.txt" | $BREAKDOWN defect project --config=default --destination="$OUTPUT_DIR/defect_analysis.md"
echo "✅ Created defect analysis at $OUTPUT_DIR/defect_analysis.md"
echo

# Example 4: Custom command - Find bugs (requires custom configuration)
echo "4. Finding bugs in code (custom command demonstration)"
echo "⚠️  Note: 'find bugs' is a custom feature that requires user.yml configuration."
echo "   This example uses 'defect task' as an alternative for bug-related analysis."
cat > "$OUTPUT_DIR/buggy_code.md" << EOF
\`\`\`javascript
function calculateTotal(items) {
    let total = 0;
    // TODO: Fix this calculation
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;  // XXX: Should apply tax here
}

// HACK: Temporary fix for authentication
function authenticate(user, pass) {
    // DEPRECATED: This method will be removed in v2.0
    if (user == "admin" && pass == "admin") {  // BUG: Hardcoded credentials
        return true;
    }
    // TODO: Implement proper authentication
}
\`\`\`
EOF

# Using defect task for bug-related analysis (always available)
cat "$OUTPUT_DIR/buggy_code.md" | $BREAKDOWN defect task --config=default --destination="$OUTPUT_DIR/bugs_report.md"
echo "✅ Created defect analysis at $OUTPUT_DIR/bugs_report.md"

echo
echo "=== Basic Usage Examples Completed ==="
echo "All output files are in: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"