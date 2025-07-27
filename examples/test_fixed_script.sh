#!/bin/bash

echo "=== Testing Fixed Script for Both Issues ==="

# Create test input file
echo "Test content for fixed script verification" > test_input.md

echo ""
echo "=== Issue 1 Test: Path Resolution (should not have duplication) ==="
LOG_LEVEL=debug deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --input=project 2>&1 | grep "resolvedBaseDir"

echo ""
echo "=== Issue 2 Test: Default Templates Exist ==="
echo "Check if default templates were created:"
ls -la .agent/breakdown/prompts/to/task/f_default*.md

echo ""
echo "=== Test All Parameter Combinations ==="

echo ""
echo "1. --input=project (should use f_project.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --input=project | head -1

echo ""
echo "2. --input=task (should use f_task.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --input=task | head -1

echo ""
echo "3. --adaptation=strict (no input, should use f_default_strict.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --adaptation=strict | head -1

echo ""
echo "4. --adaptation=agile (no input, should use f_default_agile.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --adaptation=agile | head -1

echo ""
echo "5. --adaptation=detailed (no input, should use f_default_detailed.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --adaptation=detailed | head -1

echo ""
echo "6. No parameters (should use f_default.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md | head -1

echo ""
echo "=== Configuration Test: Verify No Path Duplication ==="
echo "Configuration shows relative paths:"
grep -A2 "base_dir:" .agent/breakdown/config/default-app.yml