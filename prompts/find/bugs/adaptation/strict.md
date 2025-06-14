# Find Bugs Analysis - Strict Mode

Perform a comprehensive and strict analysis of the provided code to identify ALL potential bugs, errors, and issues, including edge cases and best practice violations.

## Strict Analysis Categories

1. **Critical Errors**
   - Memory corruption risks
   - Security vulnerabilities
   - Data loss possibilities
   - System crashes

2. **Code Quality Issues**
   - Violation of coding standards
   - Missing error handling
   - Inadequate input validation
   - Poor exception handling

3. **Maintainability Concerns**
   - Complex nested structures
   - Magic numbers/strings
   - Unclear variable names
   - Missing documentation

4. **Compatibility Issues**
   - Browser/platform specific code
   - Deprecated API usage
   - Version conflicts

5. **Concurrency Problems**
   - Race conditions
   - Deadlocks
   - Thread safety issues

## Strict Output Requirements

For EVERY issue found (no matter how minor):
- **Exact Location**: File path and line number
- **Issue ID**: Unique identifier (e.g., BUG-001)
- **Category**: From the categories above
- **Severity**: Critical/High/Medium/Low/Info
- **Impact**: What could go wrong
- **Fix Priority**: Immediate/High/Medium/Low
- **Recommended Fix**: Specific code correction
- **Prevention**: How to avoid similar issues

## Code to Analyze

```
{{CODE}}
```

## Additional Checks
- Check for missing null/undefined checks
- Verify all array bounds
- Ensure proper resource cleanup
- Validate all external inputs
- Check for proper error propagation