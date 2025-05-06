#!/bin/bash
# Example: Using STDIN as input for Breakdown CLI (project root style)
#
# This script demonstrates how to use STDIN to provide input to Breakdown CLI,
# matching the invocation and CWD handling style of 05a_project_to_implementation.sh.

pushd "$(dirname "$0")" > /dev/null

WORK_DIR="$(pwd)"

echo "=== Example: Passing input via STDIN to breakdown summary project (project root style) ==="
echo "This is a messy project summary from STDIN." | \
  deno run -A ../cli/breakdown.ts summary project

popd > /dev/null
exit 0 