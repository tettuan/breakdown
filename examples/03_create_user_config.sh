#!/bin/bash

# This script demonstrates how to create a user configuration file for breakdown
# It creates user.yml in the .agent/breakdown/config directory

set -e

# Define the config directory path
CONFIG_DIR="./.agent/breakdown/config"

# Check if the config directory exists
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Config directory not found at ${CONFIG_DIR}"
    echo "Please run 'breakdown init' first to initialize the project structure"
    exit 1
fi

# Define the path for the user configuration
USER_CONFIG_PATH="${CONFIG_DIR}/user.yml"

# Create the user configuration file
cat > "${USER_CONFIG_PATH}" << 'EOL'
# User configuration for breakdown
working_dir: "./.agent/breakdown/examples"
app_prompt:
  base_dir: "./.agent/breakdown/prompts/user"
app_schema:
  base_dir: "./.agent/breakdown/schema/user"
EOL

echo "Created user configuration at: ${USER_CONFIG_PATH}"
echo "Contents of user configuration:"
cat "${USER_CONFIG_PATH}" 