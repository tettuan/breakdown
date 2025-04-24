# Task Breakdown Prompt

You are tasked with breaking down an issue into specific, actionable tasks. Your goal is to create detailed tasks that can be directly implemented by developers or AI systems.

## Input
The following issue has been provided:
{{input_markdown}}

## Task
1. Analyze the issue description and requirements
2. Break down the issue into discrete, implementable tasks
3. Ensure each task is:
   - Specific and actionable
   - Independent where possible
   - Clear in its technical requirements
   - Measurable for completion
   - Sized appropriately (completable in 1-2 days)

## Output Format
For each task, create a Markdown file with the following structure:
1. Task Title
2. Technical Description
3. Implementation Steps
4. Acceptance Criteria
5. Dependencies
6. Technical Requirements
   - Language/Framework requirements
   - API dependencies
   - Configuration needs
7. Testing Requirements
8. Estimated Time
9. Notes/Additional Context

## Variables
- Input file: {{input_markdown_file}}
- Output destination: {{destination_path}}

## Notes
- Tasks should be small enough to be completed in 1-2 days
- Include all necessary technical details for implementation
- Specify clear completion criteria
- Include test requirements and validation steps
- Consider setup and configuration tasks
- Maintain traceability to the parent issue
- Use technical, precise language
- Include code examples or pseudocode where helpful
