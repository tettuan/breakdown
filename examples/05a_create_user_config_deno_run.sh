#!/bin/bash

# 04a_create_user_config_deno_run.sh: Create user config using direct deno run if breakdown CLI is needed

# Print current directory before any operation
echo "[DEBUG] Before cd: CWD is $(pwd)"

# Move to the examples directory if not already there
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
echo "[DEBUG] After cd: CWD is $(pwd)"

set -e
set -x  # Enable shell debug output

# Define the config directory path
CONFIG_DIR="./.agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'deno run -A ../cli/breakdown.ts init' first to initialize the project structure"
    exit 1
fi

# --- 1. Read and save current app_prompt.base_dir and app_schema.base_dir from app.yml ---
APP_YML_PATH="${CONFIG_DIR}/app.yml"
SYSTEM_PROMPT_DIR="./.agent/breakdown/prompts"
SYSTEM_SCHEMA_DIR="./.agent/breakdown/schema"
if [ -f "$APP_YML_PATH" ]; then
    # Extract base_dir values using grep/sed (YAML, so simple extraction)
    SYSTEM_PROMPT_DIR=$(grep 'app_prompt:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g')
    SYSTEM_SCHEMA_DIR=$(grep 'app_schema:' -A 2 "$APP_YML_PATH" | grep 'base_dir:' | head -n1 | sed 's/.*base_dir:[ ]*//;s/"//g')
    # Fallback if empty
    [ -z "$SYSTEM_PROMPT_DIR" ] && SYSTEM_PROMPT_DIR="./.agent/breakdown/prompts"
    [ -z "$SYSTEM_SCHEMA_DIR" ] && SYSTEM_SCHEMA_DIR="./.agent/breakdown/schema"
    # If not absolute or relative (./ or /), prefix with ./.agent/breakdown/
    if [[ "$SYSTEM_PROMPT_DIR" != /* && "$SYSTEM_PROMPT_DIR" != ./* ]]; then
      SYSTEM_PROMPT_DIR="./.agent/breakdown/$SYSTEM_PROMPT_DIR"
    fi
    if [[ "$SYSTEM_SCHEMA_DIR" != /* && "$SYSTEM_SCHEMA_DIR" != ./* ]]; then
      SYSTEM_SCHEMA_DIR="./.agent/breakdown/$SYSTEM_SCHEMA_DIR"
    fi
fi

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

# --- 3. Copy system files to user dir (after user.yml creation) ---
echo "[DEBUG] SYSTEM_PROMPT_DIR: $SYSTEM_PROMPT_DIR"
echo "[DEBUG] USER_PROMPT_DIR: $USER_PROMPT_DIR"
echo "[DEBUG] Listing $SYSTEM_PROMPT_DIR/* before cp:"
ls -l "$SYSTEM_PROMPT_DIR"/* || echo "[DEBUG] No files matched in $SYSTEM_PROMPT_DIR/*"
# Copy prompts recursively, but exclude the 'user' directory itself to prevent infinite recursion
mkdir -p "$USER_PROMPT_DIR"
rsync -a --exclude 'user' "$SYSTEM_PROMPT_DIR/" "$USER_PROMPT_DIR/"
# Copy schema recursively (no need to exclude for schema, but use rsync for consistency)
mkdir -p "$USER_SCHEMA_DIR"
rsync -a "$SYSTEM_SCHEMA_DIR/" "$USER_SCHEMA_DIR/"

set +x  # Disable shell debug output

echo "Created user configuration at: ${USER_CONFIG_PATH}"
echo "Contents of user configuration:"
cat "${USER_CONFIG_PATH}"

exit 0 