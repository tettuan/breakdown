# Issue Creation Prompt (Strict)

This prompt helps convert project information into strictly structured issues with enhanced validation.

## Input
The input is a project breakdown containing:
- Project details (required)
- Main objectives (required)
- Key deliverables (required)
- Technical requirements (required)
- Timeline estimates (required)
- Dependencies (required)

## Output
The output must be a strictly structured JSON file with:
- Issue title (required, max 100 chars)
- Description (required, min 50 chars)
- Acceptance criteria (required, min 3 items)
- Dependencies (required if specified in input)
- Priority level (required, one of: P0, P1, P2)
- Estimated effort (required, in story points)
- Technical constraints (required)
- Validation rules (required)

## Instructions
1. Strictly validate project breakdown format
2. Create issues only for complete deliverables
3. Enforce strict acceptance criteria format
4. Require explicit dependency declarations
5. Mandate priority assignment
6. Require detailed effort estimation
7. Enforce technical specification
8. Validate all required fields 