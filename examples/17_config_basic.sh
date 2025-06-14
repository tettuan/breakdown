#!/bin/bash

# Example 17: Basic --config option usage
# This example demonstrates how to use a custom configuration file with Breakdown CLI

# Use predefined test configuration
CONFIG_FILE="./configs/test.json"
echo "Using test configuration: $CONFIG_FILE"

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
echo "Command: breakdown to project --from /tmp/input.md --output /tmp/output --config $CONFIG_FILE"
breakdown to project --from /tmp/input.md --output /tmp/output --config $CONFIG_FILE

# Show the result
echo -e "\nGenerated output structure:"
find /tmp/output -type f -name "*.md" | head -10

# Clean up
rm -f /tmp/input.md
rm -rf /tmp/output