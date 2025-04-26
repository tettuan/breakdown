#!/bin/bash
# Example: Using the --adaptation option with Breakdown CLI
#
# This script demonstrates how to use the --adaptation (or -a) option
# to select a specific prompt adaptation pattern.

# Create output directory if it doesn't exist
mkdir -p examples/output

# Long form usage
echo "Testing long form (--adaptation strict)..."
breakdown summary task --from examples/fixtures/unorganized_tasks.md --adaptation strict -o examples/output/tasks_strict.md

# Short form usage
echo "Testing short form (-a a)..."
breakdown summary task --from examples/fixtures/unorganized_tasks.md -a a -o examples/output/tasks_simple.md

# Show the results
echo "\nGenerated files:"
ls -l examples/output/ 