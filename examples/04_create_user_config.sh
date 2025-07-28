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

# Move to the examples directory (script location)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || error_exit "Failed to change to script directory"

# Script is run from examples directory
echo "=== Creating User Configuration (deno run) ==="
echo "Working in examples directory: ${SCRIPT_DIR}"

# Define the config directory path (in examples)
CONFIG_DIR="./.agent/climpt/config"

# Create config directory structure
echo "Creating config directory structure..."
mkdir -p "${CONFIG_DIR}" || error_exit "Failed to create config directory: ${CONFIG_DIR}"

# Validate directory creation
if [ ! -d "${CONFIG_DIR}" ]; then
    error_exit "Config directory was not created successfully at ${CONFIG_DIR}"
fi

# Create user configuration
echo "Creating user configuration..."

# Create default-user.yml with simple configuration structure
cat > "${CONFIG_DIR}/default-user.yml" << EOF
# Default user configuration for breakdown CLI
working_dir: ".agent/climpt"
username: "default-user"
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

# Create findbugs-user.yml for find bugs functionality
cat > "${CONFIG_DIR}/findbugs-user.yml" << EOF
# User configuration for find bugs functionality
working_dir: ".agent/climpt"
username: "findbugs-user"
EOF

# Validate findbugs-user.yml creation
if [ ! -f "${CONFIG_DIR}/findbugs-user.yml" ]; then
    error_exit "Failed to create findbugs-user.yml"
fi

echo "✅ Created findbugs user configuration at: ${CONFIG_DIR}/findbugs-user.yml"

# Create user directories following UnifiedConfig structure
USER_PROMPTS_DIR="./.agent/climpt/prompts"
USER_SCHEMA_DIR="./.agent/climpt/schema"

# Create prompt directory structure for DirectiveType x LayerType combinations
mkdir -p "${USER_PROMPTS_DIR}/to/project" || error_exit "Failed to create to/project prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/to/issue" || error_exit "Failed to create to/issue prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/to/task" || error_exit "Failed to create to/task prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/summary/project" || error_exit "Failed to create summary/project prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/summary/issue" || error_exit "Failed to create summary/issue prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/defect/project" || error_exit "Failed to create defect/project prompts directory"
mkdir -p "${USER_PROMPTS_DIR}/defect/issue" || error_exit "Failed to create defect/issue prompts directory"

mkdir -p "${USER_SCHEMA_DIR}" || error_exit "Failed to create schema directory"

# Validate directory creation
if [ ! -d "${USER_PROMPTS_DIR}" ]; then
    error_exit "Prompts directory was not created successfully"
fi

if [ ! -d "${USER_SCHEMA_DIR}" ]; then
    error_exit "Schema directory was not created successfully"
fi
    
echo "✅ Created user directories following UnifiedConfig structure:"
echo "   - Prompts base: ${USER_PROMPTS_DIR}"
echo "   - Schemas: ${USER_SCHEMA_DIR}"
echo "   - Prompt templates organized by DirectiveType/LayerType combinations"

echo "=== User Configuration Files Validation ==="
# Validate that all required user configuration files exist
MISSING_USER_CONFIGS=()

# Check required user configuration files based on script matrix
REQUIRED_USER_CONFIGS=(
  ".agent/climpt/config/default-user.yml"
  ".agent/climpt/config/stdin-user.yml"
  ".agent/climpt/config/timeout-user.yml"
  ".agent/climpt/config/basic-user.yml"
  ".agent/climpt/config/production-user.yml"
  ".agent/climpt/config/team-user.yml"
  ".agent/climpt/config/production-bugs-user.yml"
  ".agent/climpt/config/production-custom-user.yml"
)

for config in "${REQUIRED_USER_CONFIGS[@]}"; do
  if [ ! -f "$config" ]; then
    MISSING_USER_CONFIGS+=("$config")
  fi
done

if [ ${#MISSING_USER_CONFIGS[@]} -eq 0 ]; then
  echo "✅ All required user configuration files are present"
else
  echo "⚠️ Missing user configuration files detected:"
  for missing in "${MISSING_USER_CONFIGS[@]}"; do
    echo "  - $missing"
  done
fi

echo "=== User Configuration Created Successfully ==="
echo "Configuration created in examples directory: ${SCRIPT_DIR}"