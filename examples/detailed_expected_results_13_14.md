# Detailed Expected Results for Scripts 13-14

## 1) 各環境での出力の違い (Environment Output Differences)

### Development Environment (dev-app.yml)
```markdown
# Expected Output Characteristics:
- Verbose debug messages with timestamps
- Colorized text output for better readability
- Stack traces included in error messages
- All log levels visible (debug, info, warn, error)
- Processing details and intermediate steps shown

# Example Output:
[DEBUG] 2024-06-19T10:00:00Z Processing defect issue...
[DEBUG] Input validation: disabled
[INFO] Analyzing content...
[DEBUG] Token count: 150
[WARN] Experimental feature X enabled
[ERROR] Error details with full stack trace
```

### Staging Environment (staging-app.yml)
```json
{
  "timestamp": "2024-06-19T10:00:00Z",
  "level": "INFO",
  "message": "Processing defect issue",
  "context": {
    "validation": "enabled",
    "timeout": 20000,
    "maxFileSize": "5MB"
  }
}
```
- JSON formatted logs
- Info level and above only
- No debug messages
- Structured data for log aggregation
- Performance metrics included

### Production Environment (prod-app.yml)
```json
{
  "timestamp": "2024-06-19T10:00:00Z",
  "level": "ERROR",
  "message": "Critical error occurred",
  "error_code": "PROC_001",
  "sanitized": true
}
```
- Error level only
- No stack traces
- Sanitized input data
- Audit trail enabled
- Minimal information exposure
- High performance settings (8 concurrent operations)

## 2) find bugsコマンドの検出結果例 (Find Bugs Detection Examples)

### Expected Bug Report Format
```markdown
# Bug Detection Report

## Summary
- Total files scanned: 2
- Total issues found: 16
- Critical: 3
- High: 8
- Medium: 5

## Detected Issues

### payment_service.ts

1. **TODO** (Line 80): Move to environment variables
   - Severity: High
   - Category: Security
   - Context: API key hardcoded in source

2. **FIXME** (Line 83): Add proper error handling for network failures
   - Severity: High
   - Category: Error Handling
   - Context: Missing try-catch for network operations

3. **BUG** (Line 86): Currency validation is missing
   - Severity: Critical
   - Category: Data Validation
   - Context: No validation before API call

4. **HACK** (Line 89): Temporary workaround for decimal precision
   - Severity: Medium
   - Category: Technical Debt
   - Context: Math.round used instead of proper decimal handling

5. **DEPRECATED** (Line 102): Use processPayment instead
   - Severity: Medium
   - Category: Code Maintenance
   - Context: Legacy method still in codebase

### user_auth.py

1. **TODO** (Line 136): Initialize database connection
   - Severity: Critical
   - Category: Implementation
   - Context: Using in-memory storage instead of database

2. **BUG** (Line 140): No validation for username format
   - Severity: High
   - Category: Security
   - Context: SQL injection vulnerability possible

3. **XXX** (Line 144): Should we use bcrypt instead of SHA256?
   - Severity: High
   - Category: Security
   - Context: Weak password hashing algorithm

## Recommendations
1. Replace all TODO items with proper implementations
2. Fix critical bugs before deployment
3. Remove deprecated code
4. Replace HACK solutions with proper implementations
```

## 3) エラーハンドリングの動作確認方法 (Error Handling Verification)

### A. Project Not Initialized Error
```bash
# Test by removing initialization
rm -rf .agent/breakdown/config
bash 13_config_environments.sh

# Expected output:
# Error: Project not initialized. Please run 'breakdown init' first.
# Exit code: 1
```

### B. Missing Configuration Error
```bash
# Test with non-existent config
deno run -A jsr:@tettuan/breakdown defect issue --config=nonexistent < test.md

# Expected behavior:
# - Should fall back to default configuration
# - Or provide clear error message about missing config
```

### C. Directory Navigation Error
```bash
# Test trap mechanism
# Script should always return to original directory even on error
pwd_before=$(pwd)
bash 13_config_environments.sh
pwd_after=$(pwd)
[ "$pwd_before" = "$pwd_after" ] && echo "Directory restored correctly"
```

### D. Input Validation Testing
```bash
# Test with empty input
echo "" | deno run -A jsr:@tettuan/breakdown find bugs --config=production-bugs

# Expected: Graceful handling with appropriate error message
```

### E. File Permission Error
```bash
# Test with read-only config directory
chmod -w .agent/breakdown/config
bash 14_config_production_example.sh

# Expected: Clear error message about write permissions
# Cleanup: chmod +w .agent/breakdown/config
```

### F. Concurrent Execution Test
```bash
# Test running multiple instances
bash 13_config_environments.sh &
bash 14_config_production_example.sh &
wait

# Expected: Both scripts complete without conflicts
```

### G. Timeout Handling (Production Config)
```bash
# Create large test file to trigger timeout
# Production timeout: 30000ms (30 seconds)
# Staging timeout: 20000ms (20 seconds)

# Expected behavior per environment:
# - Dev: No timeout (debug mode)
# - Staging: Timeout after 20s with error message
# - Prod: Timeout after 30s with minimal error info
```

### Verification Commands
```bash
# Verify configuration files created
ls -la .agent/breakdown/config/*.yml

# Check configuration content
cat .agent/breakdown/config/dev-app.yml | grep "level:"
cat .agent/breakdown/config/staging-app.yml | grep "format:"
cat .agent/breakdown/config/prod-app.yml | grep "security:"

# Verify cleanup
ls sample_code 2>/dev/null || echo "Cleanup successful"
ls *.md | grep -E "(environment_test|code_files|bugs_report)" || echo "Temp files cleaned"
```