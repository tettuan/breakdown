#!/bin/bash
# Example 17: Basic --config option usage
# This example demonstrates how to use a custom configuration file with Breakdown CLI
set -euo pipefail

# Error handling
handle_error() {
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting
trap 'handle_error "Command failed: ${BASH_COMMAND}"' ERR

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || handle_error "Failed to change to project root"

# Check prerequisites
if ! command -v deno &> /dev/null; then
    handle_error "Deno is not installed. Please install Deno first."
fi

# Check if breakdown binary exists
if [ ! -f ".deno/bin/breakdown" ]; then
    handle_error "Breakdown binary not found. Please run ./examples/02_compile.sh first."
fi

# Create examples configs directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}/examples/configs"

# Use predefined test configuration
CONFIG_NAME="test"

# Copy test config to examples/configs if not exists
if [ ! -f "${PROJECT_ROOT}/examples/configs/${CONFIG_NAME}.json" ]; then
    if [ -f "${PROJECT_ROOT}/configs/${CONFIG_NAME}.json" ]; then
        cp "${PROJECT_ROOT}/configs/${CONFIG_NAME}.json" "${PROJECT_ROOT}/examples/configs/"
    else
        handle_error "Test configuration not found in configs/${CONFIG_NAME}.json"
    fi
fi

echo "Using test configuration: $CONFIG_NAME"

# Create sample input file
cat > /tmp/input.md << 'EOF'
# Sample Project Documentation

## Overview
This is a sample project to demonstrate the Breakdown CLI with custom configuration.

## Features
- Feature A: User authentication
- Feature B: Data processing
- Feature C: Reporting system

## Requirements
- Node.js 18+
- PostgreSQL database
- Redis cache
EOF

# Run breakdown with the config file
echo "Running breakdown with basic config..."
echo "Command: .deno/bin/breakdown to project --from=/tmp/input.md --destination=/tmp/output --config=$CONFIG_NAME"
.deno/bin/breakdown to project --from=/tmp/input.md --destination=/tmp/output --config=$CONFIG_NAME

# Show the result
echo -e "\nGenerated output structure:"
find /tmp/output -type f -name "*.md" | head -10

# Clean up
echo -e "\nCleaning up temporary files..."
rm -f /tmp/input.md
rm -rf /tmp/output

echo "Example completed successfully!"