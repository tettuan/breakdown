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

# Templates should already be ready from previous initialization scripts
echo "Checking template availability..."
# Templates were already set up by 03_init_deno_run.sh

# Create f_default.md templates if they don't exist
echo "Ensuring f_default.md templates exist..."
for directive in to summary defect find; do
    for layer in project issue task bugs; do
        template_dir=".agent/climpt/prompts/$directive/$layer"
        if [ -d "$template_dir" ]; then
            if [ ! -f "$template_dir/f_default.md" ]; then
                # Find the most appropriate template to copy
                if [ -f "$template_dir/f_$layer.md" ]; then
                    cp "$template_dir/f_$layer.md" "$template_dir/f_default.md"
                elif [ -f "$template_dir/f_project.md" ]; then
                    cp "$template_dir/f_project.md" "$template_dir/f_default.md"
                elif [ -f "$template_dir/f_issue.md" ]; then
                    cp "$template_dir/f_issue.md" "$template_dir/f_default.md"
                elif [ -f "$template_dir/f_task.md" ]; then
                    cp "$template_dir/f_task.md" "$template_dir/f_default.md"
                fi
            fi
        fi
    done
done

# Use deno run for breakdown command
# Define as function to avoid quote issues with timeout
BREAKDOWN() {
    timeout 10 deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts "$@"
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
# Try using --from option instead of STDIN
error_log=$(mktemp)
if BREAKDOWN to issue --config=default --from="$OUTPUT_DIR/project_spec.md" -o="$OUTPUT_DIR/issues.md" 2>"$error_log"; then
    echo "✅ Successfully generated 'to issue' prompt"
    echo "   Input: $OUTPUT_DIR/project_spec.md"
    echo "   Output path (in prompt): $OUTPUT_DIR/issues.md"
    echo "   💡 Tip: To save the prompt, use: breakdown to issue ... > output.txt"
else
    echo "❌ Failed to generate 'to issue' prompt"
    if [ -s "$error_log" ]; then
        echo "   Error details: $(cat "$error_log")"
    fi
fi
rm -f "$error_log"
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
# Try using --from option instead of STDIN
error_log=$(mktemp)
if BREAKDOWN summary task --config=default --from="$OUTPUT_DIR/messy_notes.md" -o="$OUTPUT_DIR/task_summary.md" 2>"$error_log"; then
    echo "✅ Successfully generated 'summary task' prompt"
    echo "   Input: $OUTPUT_DIR/messy_notes.md"
    echo "   Output path (in prompt): $OUTPUT_DIR/task_summary.md"
else
    echo "❌ Failed to generate 'summary task' prompt"
    if [ -s "$error_log" ]; then
        echo "   Error details: $(cat "$error_log")"
    fi
fi
rm -f "$error_log"
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
# Try using --from option instead of STDIN pipe
error_log=$(mktemp)
if BREAKDOWN defect project --config=default --from="$OUTPUT_DIR/error_log.txt" -o="$OUTPUT_DIR/defect_analysis.md" 2>"$error_log"; then
    echo "✅ Successfully generated 'defect project' prompt"
    echo "   Input: $OUTPUT_DIR/error_log.txt"
    echo "   Output path (in prompt): $OUTPUT_DIR/defect_analysis.md"
else
    echo "❌ Failed to generate 'defect project' prompt"
    if [ -s "$error_log" ]; then
        echo "   Error details: $(cat "$error_log")"
    fi
fi
rm -f "$error_log"
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

# Step 1: デフォルト設定での成功確認 (03_init_deno_run.shで有効化済み)
echo "Testing with default configuration..."
error_log=$(mktemp)
if BREAKDOWN find bugs --config=default --from="$OUTPUT_DIR/buggy_code.js" > "$OUTPUT_DIR/bugs_default.md" 2>"$error_log"; then
    echo "✅ Success: find bugs is enabled in default configuration"
else
    echo "❌ Error: find bugs failed with default config"
    if [ -s "$error_log" ]; then
        echo "   Error details: $(cat "$error_log")"
    fi
fi
rm -f "$error_log"

# Step 2: findbugsプロファイルでの成功確認
echo
echo "Testing with findbugs profile configuration..."
error_log=$(mktemp)
if BREAKDOWN find bugs --config=findbugs --from="$OUTPUT_DIR/buggy_code.js" -o="$OUTPUT_DIR/bugs_analysis.md" 2>"$error_log"; then
    echo "✅ Success: find bugs works with findbugs profile"
    echo "   Input: $OUTPUT_DIR/buggy_code.js"
    echo "   Output path (in prompt): $OUTPUT_DIR/bugs_analysis.md"
else
    echo "❌ Error: find bugs failed even with findbugs profile"
    if [ -s "$error_log" ]; then
        echo "   Error details: $(cat "$error_log")"
    fi
    
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
    
    error_log2=$(mktemp)
    if BREAKDOWN defect task --config=default --from="$OUTPUT_DIR/bug_report.md" -o="$OUTPUT_DIR/bugs_report.md" 2>"$error_log2"; then
        echo "✅ Generated fallback 'defect task' prompt"
        echo "   Input: $OUTPUT_DIR/bug_report.md"
        echo "   Output path (in prompt): $OUTPUT_DIR/bugs_report.md"
    else
        echo "❌ Both 'find bugs' and fallback 'defect task' failed"
        if [ -s "$error_log2" ]; then
            echo "   Fallback error: $(cat "$error_log2")"
        fi
    fi
    rm -f "$error_log2"
fi
rm -f "$error_log"

echo
echo "=== Basic Usage Examples Completed ==="
echo "All output files are in: $OUTPUT_DIR/"

# Validate and list created input files
if [ -d "$OUTPUT_DIR" ]; then
    echo
    echo "Created input files:"
    find "$OUTPUT_DIR" -type f -name "*.md" -o -name "*.txt" -o -name "*.js" | while read -r file; do
        if [ -f "$file" ]; then
            size=$(wc -c < "$file" | tr -d ' ')
            echo "  • ${file#$OUTPUT_DIR/} (${size} bytes)"
        fi
    done
    
    echo
    echo "Note: Breakdown generates prompts to stdout. Use > to save them if needed."
    echo "Example: breakdown to issue --from=input.md > prompt.txt"
else
    echo "❌ Output directory not found!"
fi

echo
echo "✅ Basic usage examples completed successfully!"
echo "All prompts were generated and sent to stdout."