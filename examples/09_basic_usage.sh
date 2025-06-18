#!/bin/bash

# This script demonstrates basic usage of all main Breakdown commands

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Basic Usage Examples ==="

# Ensure we have a way to run breakdown
if [ -f ./.deno/bin/breakdown ]; then
    BREAKDOWN="./.deno/bin/breakdown"
elif command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net jsr:@tettuan/breakdown"
fi

# Create output directory for examples
OUTPUT_DIR="./output/basic_examples"
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

$BREAKDOWN to issue "$OUTPUT_DIR/project_spec.md" -o "$OUTPUT_DIR/issues/"
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
cat "$OUTPUT_DIR/messy_notes.md" | $BREAKDOWN summary task -o "$OUTPUT_DIR/task_summary.md"
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

tail -20 "$OUTPUT_DIR/error_log.txt" | $BREAKDOWN defect project -o "$OUTPUT_DIR/defect_analysis.md"
echo "✅ Created defect analysis at $OUTPUT_DIR/defect_analysis.md"
echo

# Example 4: Custom command - Find bugs (if available)
echo "4. Finding bugs in code (custom command demonstration)"
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

if $BREAKDOWN find bugs --help &>/dev/null; then
    $BREAKDOWN find bugs "$OUTPUT_DIR/buggy_code.md" -o "$OUTPUT_DIR/bugs_report.md"
    echo "✅ Created bugs report at $OUTPUT_DIR/bugs_report.md"
else
    echo "⚠️  'find bugs' command not available in current version"
fi

echo
echo "=== Basic Usage Examples Completed ==="
echo "All output files are in: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"