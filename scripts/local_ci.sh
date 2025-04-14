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

# Handle DEBUG environment variable
if [ "${DEBUG:-false}" = "true" ]; then
    echo "Debug mode enabled via DEBUG environment variable"
    enable_debug
else
    disable_debug
fi

# Remove old lockfile
echo "Removing old deno.lock..."
rm -f deno.lock

# Regenerate deno.lock
echo "Regenerating deno.lock..."
if ! deno cache --reload mod.ts; then
    echo "Error: Failed to regenerate deno.lock"
    enable_debug
    exit 1
fi

# Function to run a single test file
run_single_test() {
    local test_file=$1
    echo "Running test: $test_file"
    if ! deno test --allow-env --allow-write --allow-read --allow-run "$test_file"; then
        echo "Error: Test failed: $test_file"
        enable_debug
        exit 1
    fi
    echo "Test passed: $test_file"
}

# Run all tests together
run_all_tests() {
    echo "Running all tests together..."
    if ! deno test --allow-env --allow-write --allow-read --allow-run; then
        echo "Error: All tests run failed"
        enable_debug
        exit 1
    fi
    echo "All tests passed successfully."
}

# Run lint and fmt checks
run_checks() {
    echo "Running format check..."
    if ! deno fmt --check; then
        echo "Error: Format check failed"
        enable_debug
        exit 1
    fi

    echo "Running lint..."
    if ! deno lint; then
        echo "Error: Lint check failed"
        enable_debug
        exit 1
    fi
}

# Run tests one by one in directory order
echo "Running tests one by one..."

# First run tests in the main tests directory
for test_file in tests/*_test.ts; do
    if [ -f "$test_file" ]; then
        run_single_test "$test_file"
    fi
done

# Then run tests in the integration directory
for test_file in tests/integration/*_test.ts; do
    if [ -f "$test_file" ]; then
        run_single_test "$test_file"
    fi
done

# If all individual tests pass, run all tests together
echo "All individual tests passed. Running all tests together..."
run_all_tests

# If all tests pass, run lint and fmt checks
echo "All tests passed. Running lint and fmt checks..."
run_checks

echo "Local checks completed successfully." 