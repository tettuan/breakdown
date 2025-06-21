#!/bin/bash

# This script installs Breakdown CLI by creating deno.json and executable script

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Installing Breakdown CLI ==="

# Create deno.json with breakdown task
echo "Creating deno.json..."
cat > ./deno.json << 'EOF'
{
  "tasks": {
    "breakdown": "deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
  }
}
EOF

# Create .deno/bin directory if it doesn't exist
mkdir -p ./.deno/bin

# Create breakdown executable script
echo "Creating breakdown executable script..."
cat > ./.deno/bin/breakdown << 'EOF'
#!/bin/bash

# Breakdown CLI executable script
# This script runs 'deno task breakdown' from the examples directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Calculate the examples directory path
# .deno/bin/breakdown -> ../../
EXAMPLES_DIR="$SCRIPT_DIR/../.."

# Change to examples directory and run deno task breakdown
cd "$EXAMPLES_DIR"
exec deno task breakdown "$@"
EOF

# Make the script executable
chmod +x ./.deno/bin/breakdown

if [ -f ./deno.json ] && [ -f ./.deno/bin/breakdown ]; then
  echo "✅ Successfully created deno.json with breakdown task"
  echo "✅ Successfully created breakdown executable at ./.deno/bin/breakdown"
  echo
  echo "You can now run breakdown using either:"
  echo "   deno task breakdown --version"
  echo "   ./.deno/bin/breakdown --version"
  echo
  echo "To add to PATH for this session:"
  echo "   export PATH=\"\$PWD/.deno/bin:\$PATH\""
  echo "   breakdown --version"
  echo
  echo "Examples:"
  echo "   deno task breakdown --help"
  echo "   ./.deno/bin/breakdown [options] [files...]"
  echo
  echo "Note: Both methods use 'deno task' internally."
else
  echo "❌ Failed to create required files"
  exit 1
fi

echo "=== Breakdown CLI Installation Completed ==="