#!/bin/bash

# Enable strict mode
set -euo pipefail

# Debug mode
DEBUG=${DEBUG:-false}
LOG_LEVEL=${LOG_LEVEL:-info}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  local level=$1
  shift
  if [[ "$DEBUG" == "true" ]] || [[ "$level" != "debug" ]]; then
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [$level]${NC} $*"
  fi
}

error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $*"
}

# Function to run tests
run_tests() {
  log "info" "Running tests..."
  
  if [[ "$DEBUG" == "true" ]]; then
    LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read --allow-run
  else
    deno test --allow-env --allow-write --allow-read --allow-run
  fi
}

# Function to check formatting
check_fmt() {
  log "info" "Checking formatting..."
  deno fmt --check
}

# Function to run linter
run_lint() {
  log "info" "Running linter..."
  deno lint
}

# Function to build resources
build_resources() {
  log "info" "Building resources..."
  deno run --allow-read --allow-write scripts/build-resources.ts
}

# Main execution
main() {
  local start_time=$(date +%s)
  local exit_code=0

  log "info" "Starting local CI checks..."

  # Run in order: build, test, format, lint
  if ! build_resources; then
    error "Resource build failed"
    exit_code=1
  fi

  if ! run_tests; then
    error "Tests failed"
    exit_code=1
  fi

  if ! check_fmt; then
    error "Format check failed"
    exit_code=1
  fi

  if ! run_lint; then
    error "Lint check failed"
    exit_code=1
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [[ $exit_code -eq 0 ]]; then
    success "All checks passed successfully! (Duration: ${duration}s)"
  else
    error "Some checks failed. Please fix the issues and try again. (Duration: ${duration}s)"
  fi

  return $exit_code
}

# Execute main function
main "$@" 