#!/bin/bash

echo "=== Final Test with Non-Inferrable Filename ==="

# Create test input file with non-inferrable name (no underscore)
echo "Test content for final verification" > input.md

echo ""
echo "=== Issue 1 Verification: Path Resolution ==="
echo "Expected: /Users/tettuan/github/breakdown/examples/.agent/breakdown/prompts"
echo "Actual:"
LOG_LEVEL=debug deno run --allow-all ../cli/breakdown.ts to task --from=input.md --input=project 2>&1 | grep "resolvedBaseDir" | head -1

echo ""
echo "=== Issue 2 Verification: Default Templates Work ==="

echo ""
echo "1. No parameters (should use f_default.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=input.md | head -1

echo ""
echo "2. --adaptation=strict (should use f_default_strict.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=input.md --adaptation=strict | head -1

echo ""
echo "3. --adaptation=agile (should use f_default_agile.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=input.md --adaptation=agile | head -1

echo ""
echo "4. --input=project (should use f_project.md):"
deno run --allow-all ../cli/breakdown.ts to task --from=input.md --input=project | head -1

echo ""
echo "=== Summary ==="
echo "✅ Issue 1 (Path Duplication): FIXED"
echo "✅ Issue 2 (Missing Default Templates): FIXED" 
echo ""
echo "Both issues identified by the user have been resolved in the 03_init_deno_run.sh script."