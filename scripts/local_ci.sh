#!/bin/bash

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
    echo "Error: $error_message in $test_file"
    if [ "${DEBUG:-false}" = "true" ]; then
        enable_debug
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
    handle_error "mod.ts" "Failed to regenerate deno.lock"
fi

# Function to run a single test file
run_single_test() {
    local test_file=$1
    echo "Running test: $test_file"
    if ! LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
        handle_error "$test_file" "Test failed"
    fi
    echo "✓ Test passed: $test_file"
}

# Function to process tests in a directory
process_test_directory() {
    local dir=$1
    echo "Processing tests in directory: $dir"
    
    # First process direct test files
    for test_file in "$dir"/*_test.ts; do
        if [ -f "$test_file" ]; then
            run_single_test "$test_file"
        fi
    done
    
    # Then process subdirectories
    for subdir in "$dir"/*/ ; do
        if [ -d "$subdir" ]; then
            process_test_directory "$subdir"
        fi
    done
}

# Main execution flow
echo "Starting test execution..."

# Process all tests hierarchically
process_test_directory "tests"

# If all tests pass, run lint and fmt checks
echo "All tests passed. Running lint and fmt checks..."

echo "Running format check..."
if ! deno fmt --check; then
    handle_error "format" "Format check failed"
fi

echo "Running lint..."
if ! deno lint; then
    handle_error "lint" "Lint check failed"
fi

echo "✓ Local checks completed successfully." 