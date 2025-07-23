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

# Use deno task for breakdown command
# Define as function to avoid quote issues
BREAKDOWN() {
    deno task breakdown "$@"
}

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
if cat "$OUTPUT_DIR/project_spec.md" | BREAKDOWN to issue --config=timeout > "$OUTPUT_DIR/issues.md" 2>/dev/null; then
    # Validate output was created
    if [ -f "$OUTPUT_DIR/issues.md" ] && [ -s "$OUTPUT_DIR/issues.md" ]; then
        echo "✅ Created issue breakdown at $OUTPUT_DIR/issues.md"
        echo "   File size: $(wc -c < "$OUTPUT_DIR/issues.md" | tr -d ' ') bytes"
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
if cat "$OUTPUT_DIR/messy_notes.md" | BREAKDOWN summary task --config=default > "$OUTPUT_DIR/task_summary.md" 2>/dev/null; then
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
if tail -20 "$OUTPUT_DIR/error_log.txt" | BREAKDOWN defect project --config=default > "$OUTPUT_DIR/defect_analysis.md" 2>/dev/null; then
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

# Example 4: Find bugs command - デフォルト無効からプロファイル有効への確認
echo "4. Finding bugs in code (find bugs command)"
cat > "$OUTPUT_DIR/buggy_code.js" << EOF
function calculateTotal(items) {
    let total = 0;
    // TODO: Fix this calculation
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;
}

function processUser(user) {
    if (user == null) {  // BUG: should use === for strict comparison
        return;
    }
    // BUG: No validation for user.email
    const emailDomain = user.email.split('@')[1];
    document.innerHTML = \`Welcome \${user.name}!\`;  // BUG: XSS vulnerability
}
EOF

# Step 1: デフォルト設定での失敗確認
echo "Testing with default configuration (expected to fail)..."
if BREAKDOWN find bugs --config=default --from="$OUTPUT_DIR/buggy_code.js" > "$OUTPUT_DIR/bugs_default.md" 2>/dev/null; then
    echo "⚠️  Unexpected: find bugs succeeded with default config"
else
    echo "✅ Expected: find bugs is disabled in default configuration"
fi

# Step 2: findbugsプロファイルでの成功確認
echo
echo "Testing with findbugs profile configuration..."
if BREAKDOWN find bugs --config=findbugs --from="$OUTPUT_DIR/buggy_code.js" > "$OUTPUT_DIR/bugs_analysis.md" 2>/dev/null; then
    if [ -f "$OUTPUT_DIR/bugs_analysis.md" ] && [ -s "$OUTPUT_DIR/bugs_analysis.md" ]; then
        echo "✅ Success: find bugs works with findbugs profile"
        echo "   File size: $(wc -c < "$OUTPUT_DIR/bugs_analysis.md" | tr -d ' ') bytes"
        echo "   Preview:"
        head -5 "$OUTPUT_DIR/bugs_analysis.md" | sed 's/^/     /'
    else
        echo "⚠️  Command succeeded but output file is empty or missing"
    fi
else
    echo "❌ Error: find bugs failed even with findbugs profile"
    
    # Fallback to defect task for bug analysis
    cat > "$OUTPUT_DIR/bug_report.md" << EOF
# Bug Report

## Issues Found
- Loop condition error: using <= instead of <
- Type comparison: using == instead of ===
- Missing null/undefined checks
- XSS vulnerability in DOM manipulation

## Code Sample
\`\`\`javascript
function calculateTotal(items) {
    let total = 0;
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;
}
\`\`\`
EOF
    
    if BREAKDOWN defect task --config=default --from="$OUTPUT_DIR/bug_report.md" > "$OUTPUT_DIR/bugs_report.md" 2>/dev/null; then
        if [ -f "$OUTPUT_DIR/bugs_report.md" ] && [ -s "$OUTPUT_DIR/bugs_report.md" ]; then
            echo "✅ Created fallback defect analysis at $OUTPUT_DIR/bugs_report.md"
            echo "   File size: $(wc -c < "$OUTPUT_DIR/bugs_report.md" | tr -d ' ') bytes"
        else
            echo "⚠️  Fallback command succeeded but output file is empty"
        fi
    else
        echo "⚠️  Both 'find bugs' and fallback 'defect task' failed"
    fi
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