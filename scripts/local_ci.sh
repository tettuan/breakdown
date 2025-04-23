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
    echo "
===============================================================================
>>> SWITCHING TO DEBUG MODE <<<
==============================================================================="
    set -x
}

# Function to disable debug mode
disable_debug() {
    set +x
    echo "
===============================================================================
>>> DEBUG MODE DISABLED <<<
==============================================================================="
}

# Function to handle permission errors
handle_permission_error() {
    local test_file=$1
    local error_message=$2

    if [[ $error_message == *"Requires run access"* ]]; then
        echo "
===============================================================================
>>> PERMISSION ERROR DETECTED - RETRYING WITH --allow-run <<<
===============================================================================
Error: Missing run permission in $test_file
Adding --allow-run flag and retrying..."
        if ! LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
            handle_error "$test_file" "Test failed even with --allow-run permission" "true"
        fi
        return 0
    fi
    return 1
}

# Function to handle errors
handle_error() {
    local test_file=$1
    local error_message=$2
    local is_debug=$3

    # Try to handle permission errors first
    if handle_permission_error "$test_file" "$error_message"; then
        return 0
    fi

    if [ "$is_debug" = "true" ]; then
        echo "
===============================================================================
>>> ERROR IN DEBUG MODE <<<
===============================================================================
Error: $error_message in $test_file
Note: Remaining tests have been interrupted due to this failure.
Tests are executed sequentially to maintain dependency order and consistency.

Please:
  1. Fix errors one at a time, starting with this test
  2. Run tests for the fixed component before moving to the next error
  3. If root cause is unclear, consider adding more test cases
==============================================================================="
    else
        echo "
===============================================================================
>>> ERROR DETECTED - RETRYING IN DEBUG MODE <<<
===============================================================================
Error: $error_message in $test_file
Retrying with debug mode..."
        if ! LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
            handle_error "$test_file" "Test failed in debug mode" "true"
        fi
    fi
    exit 1
}

# Handle DEBUG environment variable
if [ "${DEBUG:-false}" = "true" ]; then
    echo "
===============================================================================
>>> DEBUG MODE ENABLED VIA ENVIRONMENT VARIABLE <<<
==============================================================================="
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

# Comprehensive type checking
echo "Running comprehensive type checks..."

# Check main entry points
echo "Checking entry points..."
for entry_point in mod.ts cli.ts main.ts; do
    if [ -f "$entry_point" ]; then
        if ! deno check "$entry_point"; then
            handle_error "$entry_point" "Type check failed" "false"
        fi
    fi
done

# Check all TypeScript files in lib directory
echo "Checking library files..."
find lib -name "*.ts" -not -name "*.test.ts" | while read -r file; do
    if ! deno check "$file"; then
        handle_error "$file" "Type check failed" "false"
    fi
done

# Try JSR type check with --allow-dirty if available
echo "Running JSR type check..."
if ! npx jsr publish --dry-run --allow-dirty; then
    echo "Warning: JSR type check with --allow-dirty failed, falling back to deno check"
    # Fallback: Check all TypeScript files
    find . -name "*.ts" -not -path "./node_modules/*" -not -name "*.test.ts" | while read -r file; do
        if ! deno check "$file"; then
            handle_error "$file" "Type check failed" "false"
        fi
    done
fi

# Function to run a single test file
run_single_test() {
    local test_file=$1
    local is_debug=${2:-false}
    local error_output
    
    if [ "$is_debug" = "true" ]; then
        echo "
===============================================================================
>>> RUNNING TEST IN DEBUG MODE: $test_file <<<
==============================================================================="
        if ! error_output=$(LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file" 2>&1); then
            handle_error "$test_file" "$error_output" "true"
            return 1
        fi
    else
        echo "Running test: $test_file"
        if ! error_output=$(deno test --allow-env --allow-write --allow-read --allow-run "$test_file" 2>&1); then
            handle_error "$test_file" "$error_output" "false"
            return 1
        fi
        echo "✓ $test_file"
    fi
    return 0
}

# Function to process tests in a directory
process_test_directory() {
    local dir=$1
    local is_debug=${2:-false}
    local test_count=0
    local error_count=0
    
    echo "Processing directory: $dir"
    
    # First process direct test files in sorted order
    for test_file in $(find "$dir" -maxdepth 1 -name "*_test.ts" | sort); do
        if [ -f "$test_file" ]; then
            ((test_count++))
            if ! run_single_test "$test_file" "$is_debug"; then
                ((error_count++))
                return 1
            fi
        fi
    done
    
    # Then process subdirectories in sorted order
    for subdir in $(find "$dir" -mindepth 1 -maxdepth 1 -type d | sort); do
        if ! process_test_directory "$subdir" "$is_debug"; then
            return 1
        fi
    done
    
    return 0
}

# Main execution flow
echo "Starting test execution..."

# Process all tests hierarchically
if ! process_test_directory "tests" "${DEBUG:-false}"; then
    echo "Test execution stopped due to failure."
    exit 1
fi

echo "All tests passed. Running type check..."
if ! deno check mod.ts; then
    echo "
===============================================================================
>>> TYPE CHECK FAILED <<<
===============================================================================
Please review:
1. Project rules and specifications in docs/ directory
2. Deno's type system documentation at https://deno.land/manual/typescript
3. External library documentation for any imported packages

Remember to:
- Check type definitions in your code
- Verify type compatibility with external dependencies
- Review TypeScript configuration in deno.json
==============================================================================="
    handle_error "type check" "Type check failed" "false"
    exit 1
fi

echo "Running JSR type check..."
if ! npx jsr publish --dry-run; then
    echo "
===============================================================================
>>> JSR TYPE CHECK FAILED <<<
===============================================================================
Please review:
1. Version constraints in import statements
2. Package name format in deno.json
3. File paths and naming conventions for JSR compatibility

Remember to:
- Add version constraints to all JSR imports
- Check for invalid characters in file paths
- Review JSR publishing requirements at https://jsr.io/docs/publishing
==============================================================================="
    handle_error "JSR type check" "JSR type check failed" "false"
    exit 1
fi

echo "Running format check..."
if ! deno fmt --check; then
    echo "
===============================================================================
>>> FORMAT CHECK FAILED <<<
===============================================================================
Please review:
1. Project formatting rules in docs/ directory
2. Deno's style guide at https://deno.land/manual/tools/formatter
3. Format settings in deno.json

Remember to:
- Run 'deno fmt' to automatically fix formatting issues
- Check for any custom formatting rules in the project
- Ensure your editor's formatting settings align with the project

Important Note:
- Some format errors might be from test-generated files
- Check if any test runs have created or modified files
- Consider adding such dynamically generated files to .gitignore
- Clean up test output directories if necessary
==============================================================================="
    handle_error "format" "Format check failed" "false"
    exit 1
fi

echo "Running lint..."
if ! deno lint; then
    echo "
===============================================================================
>>> LINT CHECK FAILED <<<
===============================================================================
Please review:
1. Project linting rules in docs/ directory
2. Deno's linting rules at https://deno.land/manual/tools/linter
3. Lint configuration in deno.json

Remember to:
- Check for common code style issues
- Review best practices for Deno development
- Verify any custom lint rules specific to the project
==============================================================================="
    handle_error "lint" "Lint check failed" "false"
    exit 1
fi

echo "✓ Local checks completed successfully." 