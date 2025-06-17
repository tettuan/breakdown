#!/bin/bash

# This script demonstrates using STDIN input with the Breakdown CLI

set -e

echo "=== STDIN Input Example ==="

# Ensure we have a way to run breakdown
if [ -f ./.deno/bin/breakdown ]; then
    BREAKDOWN="./.deno/bin/breakdown"
elif command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net jsr:@tettuan/breakdown"
fi

# Create a sample input for demonstration
SAMPLE_INPUT="# Project Overview

This is a sample project that needs to be broken down into tasks.

## Main Goals
- Implement user authentication
- Create dashboard interface
- Set up database schema
- Add API endpoints

## Technical Requirements
- Use TypeScript
- Follow REST principles
- Implement proper error handling
- Write comprehensive tests"

# Example 1: Using echo with pipe
echo "Example 1: Processing project overview with echo and pipe"
echo "$SAMPLE_INPUT" | $BREAKDOWN summary project

echo
echo "---"
echo

# Example 2: Using cat with a temporary file
echo "Example 2: Processing with cat and temporary file"
TEMP_FILE=$(mktemp)
echo "$SAMPLE_INPUT" > "$TEMP_FILE"
cat "$TEMP_FILE" | $BREAKDOWN summary project
rm "$TEMP_FILE"

echo
echo "---"
echo

# Example 3: Using heredoc
echo "Example 3: Processing with heredoc"
$BREAKDOWN summary project << EOF
# Quick Task List

- Fix login bug
- Update user profile page
- Optimize database queries
- Review pull requests
- Update documentation
EOF

echo "=== STDIN Examples Completed ==="