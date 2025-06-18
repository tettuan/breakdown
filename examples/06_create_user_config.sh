#!/bin/bash

# This script demonstrates how to create a user configuration file for breakdown
# It creates user.yml in the .agent/breakdown/config directory

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

# Script is run from examples directory
echo "=== Creating User Configuration ==="

# Define the config directory path in current directory (examples)
CONFIG_DIR=".agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'breakdown init' first to initialize the project structure"
    echo "Run from project root first: breakdown init"
    echo "Then run this script from examples directory: cd examples && ./06_create_user_config.sh"
    exit 1
fi

# --- 1. Read and save current app_prompt.base_dir and app_schema.base_dir from app.yml ---
APP_YML_PATH="${CONFIG_DIR}/app.yml"
SYSTEM_PROMPT_DIR="../.agent/breakdown/prompts"
SYSTEM_SCHEMA_DIR="../.agent/breakdown/schema"
if [ -f "$APP_YML_PATH" ]; then
    # Extract base_dir values using grep/sed (YAML, so simple extraction)
    BASE_PROMPT_DIR=$(grep 'app_prompt:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g' | xargs)
    BASE_SCHEMA_DIR=$(grep 'app_schema:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g' | xargs)
    
    # If base_dir exists, update the system directories
    if [ -n "$BASE_PROMPT_DIR" ]; then
        # Remove leading ./ if present
        BASE_PROMPT_DIR=${BASE_PROMPT_DIR#./}
        SYSTEM_PROMPT_DIR=".agent/breakdown/${BASE_PROMPT_DIR}"
    fi
    if [ -n "$BASE_SCHEMA_DIR" ]; then
        # Remove leading ./ if present
        BASE_SCHEMA_DIR=${BASE_SCHEMA_DIR#./}
        SYSTEM_SCHEMA_DIR=".agent/breakdown/${BASE_SCHEMA_DIR}"
    fi
fi

echo "System prompt directory: ${SYSTEM_PROMPT_DIR}"
echo "System schema directory: ${SYSTEM_SCHEMA_DIR}"

# --- 2. Define the path for the user configuration ---
USER_CONFIG_PATH="${CONFIG_DIR}/user.yml"
USER_PROMPT_DIR=".agent/breakdown/prompts/user"
USER_SCHEMA_DIR=".agent/breakdown/schema/user"

# Create the user configuration file
cat > "${USER_CONFIG_PATH}" << 'EOL'
# User configuration for breakdown
working_dir: "."
app_prompt:
  base_dir: "prompts/user"
app_schema:
  base_dir: "schema/user"
EOL

echo "Created user configuration at: ${USER_CONFIG_PATH}"

# --- 3. Copy system files to user dir (after user.yml creation) ---
# Check if system directories exist
if [ ! -d "${SYSTEM_PROMPT_DIR}" ]; then
    echo "Warning: System prompt directory not found at ${SYSTEM_PROMPT_DIR}"
    echo "Creating empty user prompt directory"
    mkdir -p "$USER_PROMPT_DIR"
else
    # Copy prompts recursively (excluding user directory to avoid recursion)
    mkdir -p "$USER_PROMPT_DIR"
    for item in "$SYSTEM_PROMPT_DIR"/*; do
        if [ -e "$item" ]; then
            base_item=$(basename "$item")
            if [ "$base_item" != "user" ]; then
                cp -r "$item" "$USER_PROMPT_DIR/"
            fi
        fi
    done
    echo "Copied prompts to user directory"
fi

if [ ! -d "${SYSTEM_SCHEMA_DIR}" ]; then
    echo "Warning: System schema directory not found at ${SYSTEM_SCHEMA_DIR}"
    echo "Creating empty user schema directory"
    mkdir -p "$USER_SCHEMA_DIR"
else
    # Copy schema recursively (excluding user directory to avoid recursion)
    mkdir -p "$USER_SCHEMA_DIR"
    for item in "$SYSTEM_SCHEMA_DIR"/*; do
        if [ -e "$item" ]; then
            base_item=$(basename "$item")
            if [ "$base_item" != "user" ]; then
                cp -r "$item" "$USER_SCHEMA_DIR/"
            fi
        fi
    done
    echo "Copied schemas to user directory"
fi

echo ""
echo "=== User Configuration Created Successfully ==="
echo "Contents of user configuration:"
cat "${USER_CONFIG_PATH}"
echo ""
echo "User directories created:"
echo "- Prompts: ${USER_PROMPT_DIR}"
echo "- Schemas: ${USER_SCHEMA_DIR}"

exit 0