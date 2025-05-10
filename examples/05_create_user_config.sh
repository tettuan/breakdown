#!/bin/bash

# This script demonstrates how to create a user configuration file for breakdown
# It creates user.yml in the .agent/breakdown/config directory

pushd "$(dirname "$0")" > /dev/null
set -e

# Create .deno/bin directory if it doesn't exist
mkdir -p .deno/bin

# Define the config directory path
CONFIG_DIR="./.agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'breakdown init' first to initialize the project structure"
    exit 1
fi

# --- 1. Read and save current app_prompt.base_dir and app_schema.base_dir from app.yml ---
APP_YML_PATH="${CONFIG_DIR}/app.yml"
SYSTEM_PROMPT_DIR="./.agent/breakdown/prompts"
SYSTEM_SCHEMA_DIR="./.agent/breakdown/schemas"
if [ -f "$APP_YML_PATH" ]; then
    # Extract base_dir values using grep/sed (YAML, so simple extraction)
    BASE_PROMPT_DIR=$(grep 'app_prompt:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g')
    BASE_SCHEMA_DIR=$(grep 'app_schema:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g')
    # Use full paths
    [ -n "$BASE_PROMPT_DIR" ] && SYSTEM_PROMPT_DIR="./.agent/breakdown/$BASE_PROMPT_DIR"
    [ -n "$BASE_SCHEMA_DIR" ] && SYSTEM_SCHEMA_DIR="./.agent/breakdown/$BASE_SCHEMA_DIR"
fi

# --- 2. Define the path for the user configuration ---
USER_CONFIG_PATH="${CONFIG_DIR}/user.yml"
USER_PROMPT_DIR="./.agent/breakdown/prompts/user"
USER_SCHEMA_DIR="./.agent/breakdown/schemas/user"

# Create the user configuration file
cat > "${USER_CONFIG_PATH}" << 'EOL'
# User configuration for breakdown
working_dir: "./.agent/breakdown/examples"
app_prompt:
  base_dir: "./.agent/breakdown/prompts/user"
app_schema:
  base_dir: "./.agent/breakdown/schemas/user"
EOL

# --- 3. Copy system files to user dir (after user.yml creation) ---
# Copy prompts recursively
mkdir -p "$USER_PROMPT_DIR"
cp -r "$SYSTEM_PROMPT_DIR/"* "$USER_PROMPT_DIR/"
# Copy schema recursively
mkdir -p "$USER_SCHEMA_DIR"
cp -r "$SYSTEM_SCHEMA_DIR/"* "$USER_SCHEMA_DIR/"

echo "Created user configuration at: ${USER_CONFIG_PATH}"
echo "Contents of user configuration:"
cat "${USER_CONFIG_PATH}"
popd > /dev/null
exit 0

# ※ breakdownコマンドは直接使用していませんが、使用する場合は必ず ./.deno/bin/breakdown をパス指定してください 