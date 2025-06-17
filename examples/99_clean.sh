#!/bin/bash

# This script cleans up all generated files and directories from the examples

set -e

echo "=== Cleaning Up Example Files ==="

# Clean up output directories
echo "Removing output directories..."
rm -rf ./output/
rm -rf ./tmp/
rm -rf ../.agent/breakdown/examples/

# Clean up generated config files (but preserve main config)
echo "Removing example-specific config files..."
rm -f ../.agent/breakdown/config/basic-app.yml
rm -f ../.agent/breakdown/config/production-app.yml
rm -f ../.agent/breakdown/config/team-app.yml
rm -f ../.agent/breakdown/config/dev-app.yml
rm -f ../.agent/breakdown/config/staging-app.yml
rm -f ../.agent/breakdown/config/prod-app.yml
rm -f ../.agent/breakdown/config/production-bugs-app.yml

# Clean up any test input files
echo "Removing test input files..."
rm -f input.md
rm -f production_report.md
rm -f team_planning.md
rm -f dev_bug_report.md
rm -f staging_error_log.md
rm -f production_incident.md

# Clean up compiled binary (optional - comment out if you want to keep it)
echo "Removing compiled binary..."
rm -rf ./.deno/

# Clean up any generated markdown files in current directory
echo "Removing generated markdown files..."
rm -f 20[0-9][0-9][0-9][0-9][0-9][0-9]_*.md

echo
echo "✅ Cleanup completed"
echo
echo "Note: The main .agent/breakdown directory structure is preserved."
echo "To completely remove breakdown, manually delete .agent/breakdown/"
echo
echo "=== Cleanup Completed ==="