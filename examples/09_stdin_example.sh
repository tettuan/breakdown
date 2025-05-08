#!/bin/bash
# Example: Using STDIN as input for Breakdown CLI (project root style)
#
# This script demonstrates how to use STDIN to provide input to Breakdown CLI,
# matching the invocation and CWD handling style of 05a_project_to_implementation.sh.

pushd "$(dirname "$0")" > /dev/null

# Create output directory in the project root
mkdir -p ../output

echo "=== Example: Passing input via STDIN to breakdown summary project (project root style) ==="
INPUT_TEXT="This is a messy project summary from STDIN."
echo "Input text: $INPUT_TEXT"
echo "$INPUT_TEXT" | \
  deno run -A ../cli/breakdown.ts summary project -o ../output/project_summary.md

popd > /dev/null
exit 0 