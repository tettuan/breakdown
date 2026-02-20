# Project to Issue Conversion Prompt

## Context
You are converting a project-level description into specific issues.

## Input
${input}

## Task
Break down the project described above into actionable issues. Each issue should be:
- Specific and focused on a single concern
- Assignable to a developer or team
- Testable and verifiable
- Estimated in terms of effort

## Output Format
Please provide the breakdown in the following structure:

### Issue 1: [Title]
**Priority**: High/Medium/Low  
**Effort**: [Hours/Days]  
**Description**: [Detailed description]  
**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

### Issue 2: [Title]
[Continue with same format...]

## Variables Available
- Input content: ${input}
- Output path: ${output}
- Directive: ${directive}
- Layer: ${layer}
- Author: ${author}
- Version: ${version}
- Timestamp: ${timestamp}

## Schema Reference
Please ensure the output follows the schema defined in: ${schema_path}