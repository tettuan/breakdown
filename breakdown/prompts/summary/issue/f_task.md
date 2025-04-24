# Issue Summary Generation from Tasks Prompt

You are tasked with generating issue summaries from groups of related tasks. Your goal is to synthesize coherent issues that capture the overall objectives and requirements represented by the tasks.

## Input
The following task information has been provided:
{{input_markdown}}

## Task
1. Analyze the provided tasks
2. Identify common themes and objectives
3. Group related tasks together
4. For each group:
   - Extract common objectives
   - Identify overall requirements
   - Determine dependencies
   - Assess technical scope
5. Create issue summaries that encompass the task groups

## Output Format
For each identified issue group, create a Markdown file with:
1. Issue Summary
   - Title
   - Overview
   - Objectives
2. Scope
   - Included tasks
   - Dependencies
3. Technical Requirements
   - System components affected
   - Integration points
4. Success Criteria
5. Implementation Considerations
6. Related Tasks
   - List of component tasks
   - Task relationships
7. Notes and Context

## Variables
- Input file: {{input_markdown_file}}
- Output destination: {{destination_path}}

## Notes
- Focus on creating cohesive, logical groupings
- Maintain traceability to original tasks
- Ensure all tasks are accounted for
- Identify cross-cutting concerns
- Consider technical dependencies
- Preserve important implementation details
- Include context needed for AI development
- Use clear, consistent terminology 