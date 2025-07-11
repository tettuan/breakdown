# Bug Detection Analysis Template

## Input

- {input_text_file}
- {input_text}

## Output

- {destination_path}

---

## Analysis Perspectives

- **Code Quality Issues**: Syntax errors, logic flaws, performance bottlenecks
- **Security Vulnerabilities**: Input validation, authentication, authorization issues
- **Error Handling**: Missing try-catch blocks, unhandled exceptions, error propagation
- **Resource Management**: Memory leaks, file handle leaks, connection management
- **Type Safety**: Type mismatches, null/undefined handling, casting issues
- **Concurrency Issues**: Race conditions, deadlocks, thread safety problems
- **API Integration**: Incorrect API usage, missing error handling, versioning issues
- **Configuration Problems**: Environment variables, config file issues, default values

## Instructions

1. Analyze the input code/text from the above perspectives.
2. Identify potential bugs, vulnerabilities, and code quality issues.
3. For each issue found, provide:
   - **Location**: File and line number (if available)
   - **Severity**: Critical, High, Medium, Low
   - **Type**: The category of bug (from perspectives above)
   - **Description**: Clear explanation of the issue
   - **Impact**: Potential consequences of the bug
   - **Suggested Fix**: Recommended solution or improvement
4. Prioritize issues by severity and potential impact.
5. Use structured output format according to the bug analysis schema.

## Output Format

- Output as structured Markdown following the bug analysis schema
- Include code snippets where relevant
- Provide actionable recommendations for each identified issue
