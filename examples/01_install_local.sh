#!/bin/bash

# Local execution version of installation script for development

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Breakdown CLI Local Installation Guide ==="
echo
echo "For local development, Breakdown can be used in several ways:"
echo

echo "1. Direct execution from source (Recommended for development):"
echo "   deno run -A ../cli/breakdown.ts"
echo

echo "2. Create local alias:"
echo "   alias breakdown='deno run -A $(pwd)/../cli/breakdown.ts'"
echo

echo "3. Create local wrapper script:"
echo "   mkdir -p .deno/bin"
echo '   echo "#!/bin/bash" > .deno/bin/breakdown'
echo '   echo "deno run -A $(pwd)/../cli/breakdown.ts \"\$@\"" >> .deno/bin/breakdown'
echo "   chmod +x .deno/bin/breakdown"
echo

echo "4. Compile to binary for local use:"
echo "   deno compile -A -o .deno/bin/breakdown ../cli/breakdown.ts"
echo

echo
echo "Testing local execution:"
echo "---"

# Test direct execution
echo "Testing: deno run -A ../cli/breakdown.ts --version"
deno run -A ../cli/breakdown.ts --version || echo "Version check failed"

echo
echo "Testing: deno run -A ../cli/breakdown.ts --help"
deno run -A ../cli/breakdown.ts --help || echo "Help check failed"

echo
echo "=== Local Installation Guide Completed ==="