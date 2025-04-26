# Task Summary Prompt (Strict Mode)

This prompt is used to generate a strictly formatted task summary from unorganized task information.

## Input Format
The input should be unorganized task information in Markdown format.

## Output Format
The output should be a well-structured task list with:
- Clear task titles
- Detailed descriptions
- Priority levels
- Estimated effort
- Dependencies
- Technical requirements

## Validation Rules
- Each task must have all required fields
- No ambiguous or unclear descriptions
- All dependencies must be explicitly stated
- Technical requirements must be specific and measurable

## Example Output
```markdown
# Task: Implement User Authentication
Priority: High
Effort: 3 days
Dependencies: None
Technical Requirements:
- Node.js v18+
- JWT library
- bcrypt for password hashing

Description:
Implement a secure user authentication system with login, registration, and password reset functionality.
``` 