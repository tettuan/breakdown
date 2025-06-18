#!/bin/bash

# This script demonstrates how to create a user configuration file using deno run

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

# Script is run from examples directory
echo "=== Creating User Configuration (deno run) ==="

# Define the config directory path relative to project root
CONFIG_DIR=".agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'deno run -A jsr:@tettuan/breakdown init' first"
    echo "Run from project root first, then run this script from examples directory"
    exit 1
fi

# Check if user.yml already exists
if [ -f "${CONFIG_DIR}/user.yml" ]; then
    echo "Warning: user.yml already exists at ${CONFIG_DIR}/user.yml"
    echo "Current content:"
    cat "${CONFIG_DIR}/user.yml"
    echo
    echo "Skipping creation to avoid overwriting"
else
    # Create user configuration using deno run
    echo "Creating user configuration..."
    
    # Create user.yml with basic settings
    cat > "${CONFIG_DIR}/user.yml" << EOF
# User configuration for breakdown
working_dir: "."
app_prompt:
  base_dir: "prompts/user"
app_schema:
  base_dir: "schema/user"
EOF

    echo "✅ Created user configuration at: ${CONFIG_DIR}/user.yml"
    
    # Create user directories
    mkdir -p ".agent/breakdown/prompts/user"
    mkdir -p ".agent/breakdown/schema/user"
    
    echo "✅ Created user directories:"
    echo "   - Prompts: .agent/breakdown/prompts/user"
    echo "   - Schemas: .agent/breakdown/schema/user"
fi

echo "=== User Configuration Created Successfully ==="