#!/bin/bash
# Example: Using the --adaptation option with Breakdown CLI
#
# This script demonstrates how to use the --adaptation (or -a) option
# to select a specific prompt adaptation pattern.

# Create output directory if it doesn't exist
mkdir -p tmp/examples/adaptation

# Long form usage
echo "Testing long form (--adaptation strict)..."
breakdown summary task --from examples/fixtures/unorganized_tasks.md --adaptation strict -o tmp/examples/adaptation/tasks_strict.md

# Short form usage
echo "Testing short form (-a a)..."
breakdown summary task --from examples/fixtures/unorganized_tasks.md -a a -o tmp/examples/adaptation/tasks_simple.md

# Show the results
echo "\nGenerated files:"
ls -l tmp/examples/adaptation/ 