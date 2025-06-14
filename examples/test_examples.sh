#!/bin/bash

# Test script to verify examples work correctly
# This script modifies the examples to use the correct Deno command

echo "=== Testing Breakdown Examples ==="
echo ""

# Function to test an example
test_example() {
    local example_file=$1
    local example_name=$(basename "$example_file" .sh)
    
    echo "Testing $example_name..."
    
    # Create a temporary modified version that uses deno run
    temp_file="/tmp/${example_name}_modified.sh"
    
    # Replace 'breakdown' command with 'deno run -A cli/breakdown.ts'
    sed 's|breakdown |deno run -A cli/breakdown.ts |g' "$example_file" > "$temp_file"
    
    # Make it executable
    chmod +x "$temp_file"
    
    # Run the modified example
    if bash "$temp_file" > "/tmp/${example_name}.log" 2>&1; then
        echo "✅ $example_name: PASSED"
    else
        echo "❌ $example_name: FAILED"
        echo "   Error output:"
        tail -n 10 "/tmp/${example_name}.log" | sed 's/^/   /'
    fi
    
    # Cleanup
    rm -f "$temp_file"
    echo ""
}

# Test each example
for example in examples/17_config_basic.sh examples/18_config_production.sh examples/19_config_team.sh examples/20_config_environments.sh; do
    test_example "$example"
done

echo "=== Testing Example 21 (already uses deno run) ==="
# Example 21 already uses deno run, so test it directly
if bash examples/21_config_production_example.sh > /tmp/example_21.log 2>&1; then
    echo "✅ example_21_config_production_example: PASSED"
else
    echo "❌ example_21_config_production_example: FAILED"
    echo "   Error output:"
    tail -n 20 "/tmp/example_21.log" | sed 's/^/   /'
fi

echo ""
echo "=== Summary ==="
echo "Check the log files in /tmp/ for detailed output"