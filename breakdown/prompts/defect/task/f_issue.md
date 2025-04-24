# Task-Level Defect Fix Generation Prompt

You are tasked with breaking down issue-level defects into specific, actionable fix tasks. Your goal is to create detailed implementation tasks that directly address the identified problems.

## Input
The following issue defect information has been provided:
{{input_markdown}}

## Task
1. Analyze the issue defect information
2. Break down the fix requirements into specific tasks
3. For each task:
   - Define precise implementation steps
   - Specify technical requirements
   - Identify dependencies
   - Determine validation criteria
4. Ensure tasks are sized appropriately for implementation

## Output Format
For each fix task, create a Markdown file with:
1. Task Overview
   - Title
   - Description
   - Priority
   - Related defect reference
2. Implementation Details
   - Technical approach
   - Code areas to modify
   - Required changes
   - Dependencies
3. Technical Requirements
   - Development environment
   - Tools/libraries needed
   - Configuration changes
4. Implementation Steps
   - Detailed step-by-step guide
   - Code examples/pseudocode
   - Configuration updates
5. Testing Requirements
   - Unit tests
   - Integration tests
   - Validation steps
6. Rollback Plan
7. Completion Criteria

## Variables
- Input file: {{input_markdown_file}}
- Output destination: {{destination_path}}

## Notes
- Create specific, actionable tasks
- Include detailed technical steps
- Provide clear validation criteria
- Consider side effects
- Include test requirements
- Specify rollback procedures
- Consider performance impacts
- Include security considerations
- Maintain traceability to parent issue 