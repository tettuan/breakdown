#!/bin/bash
# Example: Debugging prompt file paths with different adaptation options
#
# This script helps debug which prompt files are being used with different
# adaptation options by showing the expected file paths.

pushd "$(dirname "$0")" > /dev/null

# Create output directory if it doesn't exist
mkdir -p tmp/examples/debug

echo "=== Testing prompt file paths with different adaptation options ==="
echo

echo "Prompt files in lib/breakdown/prompts:"
echo "=== Summary Task Prompts ==="
ls -l ../lib/breakdown/prompts/summary/task/ 2>/dev/null || echo "No summary task prompts found"
echo
echo "=== To Task Prompts ==="
ls -l ../lib/breakdown/prompts/to/task/ 2>/dev/null || echo "No to task prompts found"
echo
echo "=== Defect Task Prompts ==="
ls -l ../lib/breakdown/prompts/defect/task/ 2>/dev/null || echo "No defect task prompts found"
echo

echo "Workspace prompt files:"
echo "=== Custom Prompts in tmp/examples/breakdown/prompts ==="
ls -l tmp/examples/breakdown/prompts/ 2>/dev/null || echo
echo

# Test with --adaptation strict
echo "=== Testing with --adaptation strict ==="
echo "Expected prompt file: lib/breakdown/prompts/summary/task/f_task_strict.md"
./.deno/bin/breakdown summary task --from fixtures/unorganized_tasks.md --adaptation strict -o tmp/examples/debug/tasks_strict.md
echo

# Test with -a a
echo "=== Testing with -a a ==="
echo "Expected prompt file: lib/breakdown/prompts/summary/task/f_task_a.md"
./.deno/bin/breakdown summary task --from fixtures/unorganized_tasks.md -a a -o tmp/examples/debug/tasks_simple.md
echo

# Show the results
echo "Generated task files:"
ls -l tmp/examples/debug/

popd > /dev/null
exit 0 