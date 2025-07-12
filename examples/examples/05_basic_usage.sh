#!/bin/bash

# This script demonstrates basic usage of all main Breakdown commands

set -euo pipefail

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Error handling function
handle_error() {
    local exit_code=$?
    echo "❌ Error occurred: $1" >&2
    echo "   Exit code: $exit_code" >&2
    cd "$ORIGINAL_CWD"
    exit $exit_code
}

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT
trap 'handle_error "Command failed at line $LINENO"' ERR

# Move to the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Basic Usage Examples ==="

# Set timeout for examples execution (60 seconds)
export BREAKDOWN_TIMEOUT=60000

# Ensure templates are ready before execution
echo "Checking template availability..."
if ! bash ./00_template_check.sh full; then
    handle_error "Template setup failed"
fi

# Ensure we have a way to run breakdown
if [ -f ../.deno/bin/breakdown ] && ../.deno/bin/breakdown --help &> /dev/null; then
    BREAKDOWN="../.deno/bin/breakdown"
elif command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run -A ../cli/breakdown.ts"
fi

# Verify breakdown command works
if ! $BREAKDOWN --help &> /dev/null; then
    handle_error "Breakdown command not functional"
fi

# Create output directory for examples
OUTPUT_DIR="./output/basic_examples"
mkdir -p "$OUTPUT_DIR" || handle_error "Failed to create output directory"

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

echo "Running: breakdown to issue..."
if cat "$OUTPUT_DIR/project_spec.md" | $BREAKDOWN to issue --config=timeout --destination="$OUTPUT_DIR/issues/" 2>/dev/null; then
    # Validate output was created
    if [ -d "$OUTPUT_DIR/issues" ] && [ "$(ls -A "$OUTPUT_DIR/issues" 2>/dev/null)" ]; then
        echo "✅ Created issue breakdowns in $OUTPUT_DIR/issues/"
        echo "   Files created: $(ls -1 "$OUTPUT_DIR/issues" | wc -l | tr -d ' ')"
    else
        echo "⚠️  Command succeeded but no output files were created"
    fi
else
    echo "⚠️  'to issue' command failed or is not supported"
fi
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
if cat "$OUTPUT_DIR/messy_notes.md" | $BREAKDOWN summary task --config=default --destination="$OUTPUT_DIR/task_summary.md" 2>/dev/null; then
    # Validate output file was created and has content
    if [ -f "$OUTPUT_DIR/task_summary.md" ] && [ -s "$OUTPUT_DIR/task_summary.md" ]; then
        echo "✅ Created task summary at $OUTPUT_DIR/task_summary.md"
        echo "   File size: $(wc -c < "$OUTPUT_DIR/task_summary.md" | tr -d ' ') bytes"
    else
        echo "⚠️  Command succeeded but output file is empty or missing"
    fi
else
    echo "⚠️  'summary task' command failed or is not supported"
fi
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

echo "Analyzing error logs..."
if tail -20 "$OUTPUT_DIR/error_log.txt" | $BREAKDOWN defect project --config=default --destination="$OUTPUT_DIR/defect_analysis.md" 2>/dev/null; then
    # Validate output file was created and has content
    if [ -f "$OUTPUT_DIR/defect_analysis.md" ] && [ -s "$OUTPUT_DIR/defect_analysis.md" ]; then
        echo "✅ Created defect analysis at $OUTPUT_DIR/defect_analysis.md"
        echo "   File size: $(wc -c < "$OUTPUT_DIR/defect_analysis.md" | tr -d ' ') bytes"
    else
        echo "⚠️  Command succeeded but output file is empty or missing"
    fi
else
    echo "⚠️  'defect project' command failed or is not supported"
fi
echo

# Example 4: Custom command - Find bugs (requires custom configuration)
echo "4. Finding bugs in code (custom command demonstration)"
echo "⚠️  Note: 'find bugs' is a custom feature that requires default-user.yml configuration."
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
echo "Running defect analysis on code..."
if cat "$OUTPUT_DIR/buggy_code.md" | $BREAKDOWN defect task --config=default --destination="$OUTPUT_DIR/bugs_report.md" 2>/dev/null; then
    # Validate output file was created and has content
    if [ -f "$OUTPUT_DIR/bugs_report.md" ] && [ -s "$OUTPUT_DIR/bugs_report.md" ]; then
        echo "✅ Created defect analysis at $OUTPUT_DIR/bugs_report.md"
        echo "   File size: $(wc -c < "$OUTPUT_DIR/bugs_report.md" | tr -d ' ') bytes"
    else
        echo "⚠️  Command succeeded but output file is empty or missing"
    fi
else
    echo "⚠️  'defect task' command failed or is not supported"
fi

echo
echo "=== Basic Usage Examples Completed ==="
echo "All output files are in: $OUTPUT_DIR/"

# Validate and list created files
if [ -d "$OUTPUT_DIR" ]; then
    echo
    echo "Created files:"
    find "$OUTPUT_DIR" -type f -name "*.md" -o -name "*.txt" | while read -r file; do
        if [ -f "$file" ]; then
            size=$(wc -c < "$file" | tr -d ' ')
            echo "  • ${file#$OUTPUT_DIR/} (${size} bytes)"
        fi
    done
    
    # Count total files created
    total_files=$(find "$OUTPUT_DIR" -type f \( -name "*.md" -o -name "*.txt" \) | wc -l | tr -d ' ')
    echo
    echo "Total files created: $total_files"
else
    echo "❌ Output directory not found!"
fi

# Final success check
if [ "${total_files:-0}" -gt 0 ]; then
    echo "✅ Examples completed successfully"
else
    echo "⚠️  Examples completed but no output files were generated"
fi