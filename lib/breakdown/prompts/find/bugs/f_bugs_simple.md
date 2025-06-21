# Simple Bug Detection Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Quick Bug Scan

### Common Issues to Check
1. **Syntax Errors**: Missing semicolons, brackets, or quotes
2. **Null/Undefined**: Potential null pointer exceptions
3. **Type Mismatches**: Incorrect data type usage
4. **Logic Errors**: Obvious logical mistakes (off-by-one, wrong operators)
5. **Error Handling**: Missing try-catch blocks

### Quick Security Check
- Hardcoded passwords or API keys
- SQL queries without parameterization
- User input without validation

### Basic Performance Issues
- Loops without exit conditions
- Repeated expensive operations
- Large data in memory

## Output Format

List each bug found with:
- **File/Line**: Location of the issue
- **Type**: Bug category
- **Description**: What's wrong
- **Fix**: How to resolve it

Keep it simple and actionable.