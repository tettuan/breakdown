# Issue Breakdown Prompt

You are tasked with breaking down a project summary into well-defined issues. Your goal is to create clear, actionable issues that can be further broken down into tasks.

## Input
The following project summary has been provided:
{{input_markdown}}

## Task
1. Analyze the project summary
2. Identify distinct features, components, or work areas
3. Create separate issues for each identified area
4. Ensure each issue is:
   - Independent and self-contained
   - Clear in scope and objectives
   - Measurable and verifiable
   - Aligned with project goals

## Output Format
For each issue, create a Markdown file with the following structure:
1. Issue Title
2. Description
3. Objectives
4. Acceptance Criteria
5. Dependencies (if any)
6. Technical Considerations
7. Estimated Complexity/Size
8. Priority Level
9. Notes/Additional Context

## Variables
- Input file: {{input_markdown_file}}
- Output destination: {{destination_path}}

## Notes
- Each issue should be focused on a single feature or component
- Include all necessary technical context
- Maintain traceability to project requirements
- Consider dependencies between issues
- Use clear, actionable language
- Include sufficient context for AI development
- Name files with meaningful, descriptive titles

## Generated Issues

- Issue 1: First feature
- Issue 2: Second feature
