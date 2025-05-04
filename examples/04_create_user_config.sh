#!/bin/bash

# This script demonstrates how to create a user configuration file for breakdown
# It creates user.yml in the .agent/breakdown/config directory

pushd "$(dirname "$0")" > /dev/null
set -e

# Define the config directory path
CONFIG_DIR="./.agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'breakdown init' first to initialize the project structure"
    exit 1
fi

# --- 1. Remember system app_prompt.base_dir and schema dir from default config ---
SYSTEM_PROMPT_DIR="./.agent/breakdown/prompts"
SYSTEM_SCHEMA_DIR="./.agent/breakdown/schema"

# --- 2. Define the path for the user configuration ---
USER_CONFIG_PATH="${CONFIG_DIR}/user.yml"
USER_PROMPT_DIR="./.agent/breakdown/prompts/user"
USER_SCHEMA_DIR="./.agent/breakdown/schema/user"

# Create the user configuration file
cat > "${USER_CONFIG_PATH}" << 'EOL'
# User configuration for breakdown
working_dir: "./.agent/breakdown/examples"
app_prompt:
  base_dir: "./.agent/breakdown/prompts/user"
app_schema:
  base_dir: "./.agent/breakdown/schema/user"
EOL

# --- 3. Copy system files to user dir ---
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