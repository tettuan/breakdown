#!/bin/bash

# ============================================================================
# local_ci.sh
#
# Purpose:
#   - Run all Deno tests in the project with strict permissions and debug logging.
#   - Ensure all tests pass before running formatting and lint checks.
#   - Mimics the CI flow locally to catch issues before commit, push, or merge.
#
# Intent:
#   - Enforce Deno's security model by explicitly specifying required permissions.
#   - Provide clear debug output for troubleshooting test failures.
#   - Automatically regenerate the lockfile to ensure dependency consistency.
#   - Recursively discover and run all *_test.ts files in the tests/ directory.
#   - Only proceed to lint and format checks if all tests pass.
#   - Exit immediately on any error, with helpful debug output if DEBUG=true.
#
# Error Handling Strategy:
#   - Two-phase test execution for better error diagnosis:
#     1. Normal Mode: Quick run to identify failing tests
#        - Minimal output for successful tests
#        - Fast feedback loop for developers
#     2. Debug Mode: Detailed investigation of failures
#        - Automatically triggered for failing tests
#        - Provides comprehensive error context
#        - Includes guidance for systematic error resolution
#   
#   This approach helps developers:
#   - Quickly identify the exact point of failure
#   - Get detailed context only when needed
#   - Follow a structured approach to fixing issues
#   - Maintain test sequence awareness
#   - Add more test cases if root cause is unclear
#
# Usage:
#   bash scripts/local_ci.sh
#   # or, with debug output:
#   DEBUG=true bash scripts/local_ci.sh
#
# Maintenance:
#   - If you encounter an error:
#       1. Run with DEBUG=true to get detailed output:
#            DEBUG=true bash scripts/local_ci.sh
#       2. Review the error message and the failing test file.
#       3. Fix the test or the application code as needed, following the order:
#            Initial loading → Use case entry → Conversion → Output → Integration → Edge case
#       4. Re-run this script until all checks pass.
#   - The script expects Deno test files to be named *_test.ts and located under tests/.
#   - Permissions are set as per Deno best practices: all flags precede the test file(s).
#   - For more details, see project rules and documentation.
#
# This script is working as intended and follows Deno and project conventions.
# ============================================================================

# Function to enable debug mode
enable_debug() {
    echo "Enabling debug mode..."
    set -x
}

# Function to disable debug mode
disable_debug() {
    set +x
}

# Function to handle errors
handle_error() {
    local test_file=$1
    local error_message=$2
    local is_debug=$3

    if [ "$is_debug" = "true" ]; then
        echo "Error: $error_message in $test_file"
        echo "Note: Remaining tests have been interrupted due to this failure."
        echo "Tests are executed sequentially to maintain dependency order and consistency."
        echo "Please:"
        echo "  1. Fix errors one at a time, starting with this test"
        echo "  2. Run tests for the fixed component before moving to the next error"
        echo "  3. If root cause is unclear, consider adding more test cases"
    else
        echo "Error: $error_message in $test_file"
        echo "Retrying with debug mode..."
        if ! LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
            handle_error "$test_file" "Test failed in debug mode" "true"
        fi
    fi
    exit 1
}

# Handle DEBUG environment variable
if [ "${DEBUG:-false}" = "true" ]; then
    echo "Debug mode enabled via DEBUG environment variable"
    enable_debug
else
    disable_debug
fi

# Remove old lockfile and regenerate
echo "Removing old deno.lock..."
rm -f deno.lock

echo "Regenerating deno.lock..."
if ! deno cache --reload mod.ts; then
    handle_error "mod.ts" "Failed to regenerate deno.lock" "false"
fi

# Function to run a single test file
run_single_test() {
    local test_file=$1
    local is_debug=${2:-false}
    
    if [ "$is_debug" = "true" ]; then
        echo "Running test in debug mode: $test_file"
        if ! LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
            handle_error "$test_file" "Test failed" "true"
        fi
    else
        echo "Running test: $test_file"
        if ! deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
            handle_error "$test_file" "Test failed" "false"
        fi
        echo "✓ $test_file"
    fi
}

# Function to process tests in a directory
process_test_directory() {
    local dir=$1
    local is_debug=${2:-false}
    
    # First process direct test files
    for test_file in "$dir"/*_test.ts; do
        if [ -f "$test_file" ]; then
            run_single_test "$test_file" "$is_debug"
        fi
    done
    
    # Then process subdirectories
    for subdir in "$dir"/*/ ; do
        if [ -d "$subdir" ]; then
            process_test_directory "$subdir" "$is_debug"
        fi
    done
}

# Main execution flow
echo "Starting test execution..."

# Process all tests hierarchically in normal mode first
process_test_directory "tests" "false"

# If all tests pass, run lint and fmt checks
echo "All tests passed. Running lint and fmt checks..."

echo "Running format check..."
if ! deno fmt --check; then
    handle_error "format" "Format check failed" "false"
fi

echo "Running lint..."
if ! deno lint; then
    handle_error "lint" "Lint check failed" "false"
fi

echo "✓ Local checks completed successfully." 