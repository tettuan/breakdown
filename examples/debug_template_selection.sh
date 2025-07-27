#!/bin/bash

echo "=== Debug Template Selection ==="

# Create test input file
echo "Test content" > test_input.md

echo ""
echo "=== Test 1: Debug --adaptation=strict with LOG_LEVEL=debug ==="
LOG_LEVEL=debug deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --adaptation=strict 2>&1 | grep -E "(fileName|promptPath|f_default_strict)"

echo ""
echo "=== Test 2: Show content of f_default_strict.md ==="
cat .agent/breakdown/prompts/to/task/f_default_strict.md | head -3

echo ""
echo "=== Test 3: Check if the template is being found ==="
LOG_LEVEL=debug deno run --allow-all ../cli/breakdown.ts to task --from=test_input.md --adaptation=strict 2>&1 | grep -E "(existsSync|file.*not.*found|template.*path|Using template)"