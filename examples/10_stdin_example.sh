#!/bin/bash
# Example: Using STDIN as input for Breakdown CLI (project root style)
#
# This script demonstrates how to use STDIN to provide input to Breakdown CLI,
# matching the invocation and CWD handling style of 05a_project_to_implementation.sh.
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

# Create output directory in the project root
mkdir -p output || handle_error "Failed to create output directory"

echo "=== Example: Passing input via STDIN to breakdown summary project (project root style) ==="
INPUT_TEXT="This is a messy project summary from STDIN."
echo "Input text: $INPUT_TEXT"

# Run breakdown with STDIN input
if ! echo "$INPUT_TEXT" | .deno/bin/breakdown summary project -o output/project_summary.md; then
    handle_error "Failed to run breakdown with STDIN input"
fi

echo -e "\n✓ Example completed successfully!"
echo "Output file created: output/project_summary.md" 