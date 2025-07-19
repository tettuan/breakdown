# Error Handling Report

Generated: Sat Jul 19 18:23:24 JST 2025

## Processing Summary
- Total files: 5
- Successful: 3
- Failed: 2
- Success rate: 60%

## Error Details
- test_input_2.md: Processing failed
- test_input_4.md: Processing failed

## Error Log
```
=== Error Handling Log ===
Started at: Sat Jul 19 18:23:23 JST 2025

❌ Error occurred: Permission denied: ./output/error_handling/readonly.md (code: 1)
   Timestamp: 2025-07-19 18:23:23
   Type: General error
```

## Recommendations
1. Implement retry logic for transient failures
2. Add input validation before processing
3. Use timeout mechanisms for long-running operations
4. Maintain detailed error logs for debugging
5. Provide meaningful error messages to users
