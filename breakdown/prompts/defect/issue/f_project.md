# Issue-Level Defect Analysis Prompt

You are tasked with breaking down project-level defect information into specific issues. Your goal is to create detailed issue reports that can be used to track and resolve identified problems.

## Input
The following project defect information has been provided:
{{input_markdown}}

## Task
1. Analyze the project defect information
2. Break down systemic issues into specific problems
3. For each identified issue:
   - Define the scope
   - Identify affected components
   - Determine root causes
   - Assess impact and priority
   - Outline resolution approach
4. Create trackable issue reports

## Output Format
For each identified issue, create a Markdown file with:
1. Issue Overview
   - Title
   - Description
   - Severity
   - Impact area
2. Technical Analysis
   - Affected components
   - Error patterns
   - Root cause analysis
   - System dependencies
3. Impact Assessment
   - User impact
   - System impact
   - Business impact
4. Resolution Plan
   - Proposed solution
   - Technical requirements
   - Implementation approach
5. Validation Strategy
   - Testing requirements
   - Success criteria
   - Verification steps
6. Risk Assessment
7. Dependencies and Prerequisites

## Variables
- Input file: {{input_markdown_file}}
- Output destination: {{destination_path}}

## Notes
- Create clear, actionable issues
- Include all relevant technical context
- Specify clear resolution criteria
- Consider implementation dependencies
- Include validation requirements
- Maintain traceability to project defects
- Consider security implications
- Include monitoring recommendations
- Specify rollback procedures 