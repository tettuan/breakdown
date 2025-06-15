# Task Creation Prompt (Strict)

This prompt helps convert issues into strictly structured tasks with enhanced validation.

## Input
The input is an issue containing:
- Issue title (required)
- Description (required)
- Acceptance criteria (required)
- Dependencies (required)
- Priority level (required)
- Estimated effort (required)
- Technical requirements (required)

## Output
The output must be a strictly structured JSON file with:
- Task title (required, max 80 chars)
- Description (required, min 30 chars)
- Steps to complete (required, min 2 steps)
- Dependencies (required if in input)
- Priority (required, one of: P0, P1, P2)
- Time estimate (required, in hours)
- Technical requirements (required)
- Validation criteria (required)
- Testing requirements (required)
- Definition of Done items (required)

## Instructions
1. Strictly validate issue format
2. Break down into atomic tasks only
3. Enforce detailed step descriptions
4. Require explicit dependencies
5. Mandate priority levels
6. Require time estimates
7. Enforce technical specifications
8. Define validation criteria
9. Specify testing requirements
10. List Definition of Done items 