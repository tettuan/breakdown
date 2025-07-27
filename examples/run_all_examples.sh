#!/bin/bash

echo "=== Re-running All Examples 0-20 After Fixes ==="

# Create results directory
mkdir -p tmp/rerun_results

# Start logging
exec > >(tee tmp/rerun_results/all_examples_rerun.log) 2>&1

echo "Start time: $(date)"
echo "Working directory: $(pwd)"
echo ""

# Function to run a script and capture results
run_script() {
    local script_num=$1
    local script_name="${script_num}_"*.sh
    
    echo "=========================================="
    echo "Running Script ${script_num}: ${script_name}"
    echo "Time: $(date)"
    echo "=========================================="
    
    if [ -f ${script_name} ]; then
        # Run the script and capture output
        if bash ${script_name} > tmp/rerun_results/script_${script_num}_output.log 2>&1; then
            echo "✅ Script ${script_num} completed successfully"
            echo "Output saved to: tmp/rerun_results/script_${script_num}_output.log"
        else
            echo "❌ Script ${script_num} failed with exit code $?"
            echo "Error output saved to: tmp/rerun_results/script_${script_num}_output.log"
        fi
    else
        echo "⚠️ Script ${script_num} not found: ${script_name}"
    fi
    echo ""
}

# Run all scripts 0-20
for i in $(seq -w 0 20); do
    run_script $i
done

echo "=========================================="
echo "Summary Report"
echo "=========================================="

# Count successful and failed scripts
SUCCESS_COUNT=0
FAIL_COUNT=0
MISSING_COUNT=0

for i in $(seq -w 0 20); do
    script_name="${i}_"*.sh
    if [ -f ${script_name} ]; then
        if [ -f "tmp/rerun_results/script_${i}_output.log" ]; then
            # Check if script completed successfully by looking for error indicators
            if grep -q "❌\|Error\|Failed\|failed" tmp/rerun_results/script_${i}_output.log; then
                echo "❌ Script ${i}: FAILED"
                FAIL_COUNT=$((FAIL_COUNT + 1))
            else
                echo "✅ Script ${i}: SUCCESS"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            fi
        else
            echo "⚠️ Script ${i}: NO OUTPUT FILE"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        echo "⚠️ Script ${i}: NOT FOUND"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

echo ""
echo "=========================================="
echo "Final Statistics"
echo "=========================================="
echo "Total scripts expected: 21 (00-20)"
echo "Successful: ${SUCCESS_COUNT}"
echo "Failed: ${FAIL_COUNT}"
echo "Missing: ${MISSING_COUNT}"
echo ""
echo "End time: $(date)"

# Create summary file
cat > tmp/rerun_results/summary.md << EOF
# Examples Re-run Summary

**Execution Time**: $(date)

## Statistics
- Total scripts expected: 21 (00-20)
- Successful: ${SUCCESS_COUNT}
- Failed: ${FAIL_COUNT}
- Missing: ${MISSING_COUNT}

## Individual Results
EOF

for i in $(seq -w 0 20); do
    script_name="${i}_"*.sh
    if [ -f ${script_name} ]; then
        if [ -f "tmp/rerun_results/script_${i}_output.log" ]; then
            if grep -q "❌\|Error\|Failed\|failed" tmp/rerun_results/script_${i}_output.log; then
                echo "- Script ${i}: ❌ FAILED" >> tmp/rerun_results/summary.md
            else
                echo "- Script ${i}: ✅ SUCCESS" >> tmp/rerun_results/summary.md
            fi
        else
            echo "- Script ${i}: ⚠️ NO OUTPUT" >> tmp/rerun_results/summary.md
        fi
    else
        echo "- Script ${i}: ⚠️ NOT FOUND" >> tmp/rerun_results/summary.md
    fi
done

echo ""
echo "All results saved to tmp/rerun_results/"
echo "Summary available at: tmp/rerun_results/summary.md"