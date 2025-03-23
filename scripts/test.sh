#!/bin/bash

# Function to run tests with proper environment variables
run_tests() {
  local test_path=$1
  local log_level=${2:-"ERROR"}
  
  echo "Running tests in $test_path"
  LOG_LEVEL=$log_level deno test --allow-env --allow-write --allow-read "$test_path"
  
  return $?
}

# Run tests in order according to the hierarchy
echo "Starting test execution..."

# Foundation Tests
if run_tests "tests/0_foundation/"; then
  echo "Foundation tests passed ✓"
  
  # Core Tests
  if run_tests "tests/1_core/"; then
    echo "Core tests passed ✓"
    
    # Integration Tests
    if run_tests "tests/2_integration/"; then
      echo "Integration tests passed ✓"
      
      # Scenario Tests
      if run_tests "tests/3_scenarios/"; then
        echo "Scenario tests passed ✓"
        echo "All tests completed successfully! ✓"
        exit 0
      else
        echo "Scenario tests failed ✗"
        exit 1
      fi
    else
      echo "Integration tests failed ✗"
      exit 1
    fi
  else
    echo "Core tests failed ✗"
    exit 1
  fi
else
  echo "Foundation tests failed ✗"
  exit 1
fi 