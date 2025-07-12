#!/bin/bash

# This script demonstrates how to create a user configuration file using deno run

# Enable strict error handling
set -euo pipefail

# Error handling function
error_exit() {
    echo "Error: $1" >&2
    exit 1
}

# Cleanup function
cleanup() {
    local exit_code=$?
    cd "$ORIGINAL_CWD" || true
    if [ $exit_code -ne 0 ]; then
        echo "Script failed with exit code: $exit_code" >&2
    fi
    exit $exit_code
}

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# Define test directory
TEST_DIR="/tmp/breakdown_test"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Script is run from examples directory
echo "=== Creating User Configuration (deno run) ==="
echo "Working in test directory: ${TEST_DIR}"

# Create and move to test directory
mkdir -p "${TEST_DIR}" || error_exit "Failed to create test directory: ${TEST_DIR}"
cd "${TEST_DIR}" || error_exit "Failed to change to test directory: ${TEST_DIR}"

# Validate we're in the correct directory
if [ "$(pwd)" != "${TEST_DIR}" ]; then
    error_exit "Failed to change to test directory. Current: $(pwd), Expected: ${TEST_DIR}"
fi

# Define the config directory path
CONFIG_DIR="${TEST_DIR}/.agent/breakdown/config"

# Create config directory structure
echo "Creating config directory structure..."
mkdir -p "${CONFIG_DIR}" || error_exit "Failed to create config directory: ${CONFIG_DIR}"

# Validate directory creation
if [ ! -d "${CONFIG_DIR}" ]; then
    error_exit "Config directory was not created successfully at ${CONFIG_DIR}"
fi

# Check if default-user.yml already exists
if [ -f "${CONFIG_DIR}/default-user.yml" ]; then
    echo "Warning: default-user.yml already exists at ${CONFIG_DIR}/default-user.yml"
    echo "Current content:"
    cat "${CONFIG_DIR}/default-user.yml"
    echo
    echo "Skipping creation to avoid overwriting"
else
    # Create user configuration
    echo "Creating user configuration..."
    
    # Create default-user.yml with basic settings
    cat > "${CONFIG_DIR}/default-user.yml" << EOF
# User configuration for breakdown
working_dir: "."
app_prompt:
  base_dir: "prompts/user"
app_schema:
  base_dir: "schema/user"
EOF

    # Validate file creation
    if [ ! -f "${CONFIG_DIR}/default-user.yml" ]; then
        error_exit "Failed to create default-user.yml"
    fi
    
    # Validate file content
    if [ ! -s "${CONFIG_DIR}/default-user.yml" ]; then
        error_exit "default-user.yml was created but is empty"
    fi

    echo "✅ Created user configuration at: ${CONFIG_DIR}/default-user.yml"
    
    # Create user directories
    USER_PROMPTS_DIR="${TEST_DIR}/.agent/breakdown/prompts/user"
    USER_SCHEMA_DIR="${TEST_DIR}/.agent/breakdown/schema/user"
    
    mkdir -p "${USER_PROMPTS_DIR}" || error_exit "Failed to create prompts directory"
    mkdir -p "${USER_SCHEMA_DIR}" || error_exit "Failed to create schema directory"
    
    # Validate directory creation
    if [ ! -d "${USER_PROMPTS_DIR}" ]; then
        error_exit "Prompts directory was not created successfully"
    fi
    
    if [ ! -d "${USER_SCHEMA_DIR}" ]; then
        error_exit "Schema directory was not created successfully"
    fi
    
    echo "✅ Created user directories:"
    echo "   - Prompts: ${USER_PROMPTS_DIR}"
    echo "   - Schemas: ${USER_SCHEMA_DIR}"
fi

echo "=== User Configuration Created Successfully ==="
echo "Test directory structure created at: ${TEST_DIR}"