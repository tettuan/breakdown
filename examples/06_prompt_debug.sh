#!/bin/bash
# Example: Debugging prompt file paths with adaptation options
#
# This script demonstrates how adaptation options affect prompt file selection
# and helps debug prompt file paths.

# Set debug mode for detailed logging
export LOG_LEVEL=debug

echo "=== Testing prompt file paths with different adaptation options ==="

# Create test directories if they don't exist
mkdir -p examples/output/breakdown/{prompts,tasks}

# List current prompt files
echo "\nPrompt files in lib/breakdown/prompts:"
echo "=== Summary Task Prompts ==="
ls -R lib/breakdown/prompts/summary/task/ 2>/dev/null || echo "No summary task prompts found"

echo "\n=== To Task Prompts ==="
ls -R lib/breakdown/prompts/to/task/ 2>/dev/null || echo "No to task prompts found"

echo "\n=== Defect Task Prompts ==="
ls -R lib/breakdown/prompts/defect/task/ 2>/dev/null || echo "No defect task prompts found"

echo "\nWorkspace prompt files:"
echo "=== Custom Prompts in examples/output/breakdown/prompts ==="
ls -R examples/output/breakdown/prompts 2>/dev/null || echo "No custom prompts found"

# Test with different adaptation options
echo "\n=== Testing with --adaptation strict ==="
echo "Expected prompt file: lib/breakdown/prompts/summary/task/f_task_strict.md"
breakdown summary task \
  --from examples/fixtures/unorganized_tasks.md \
  --adaptation strict \
  -o examples/output/breakdown/tasks/strict_tasks.md

echo "\n=== Testing with -a a ==="
echo "Expected prompt file: lib/breakdown/prompts/summary/task/f_task_a.md"
breakdown summary task \
  --from examples/fixtures/unorganized_tasks.md \
  -a a \
  -o examples/output/breakdown/tasks/simple_tasks.md

# Show results
echo "\nGenerated task files:"
ls -l examples/output/breakdown/tasks/ 