# Issue to Task Summary Prompt

## Context
You are creating a summary of tasks derived from an issue description.

## Input
${input}

## Task
Create a concise summary of the tasks needed to complete the issue described above. Focus on:
- High-level task categories
- Dependencies between tasks
- Critical path identification
- Resource requirements

## Output Format
## Issue Summary
**Issue**: [Brief description]  
**Complexity**: Simple/Medium/Complex  
**Total Estimated Effort**: [Time estimate]

## Task Categories
### 1. [Category Name] (Priority: High/Medium/Low)
- Task A: [Brief description] - [Effort]
- Task B: [Brief description] - [Effort]

### 2. [Category Name] (Priority: High/Medium/Low)
- Task C: [Brief description] - [Effort]
- Task D: [Brief description] - [Effort]

## Dependencies
- Task A → Task B (blocking)
- Task C ⟷ Task D (interdependent)

## Critical Path
Task A → Task B → Task E (Total: [Time])

## Variables Available
- Input content: ${input}
- Output path: ${output}
- Directive: ${directive}
- Layer: ${layer}
- Author: ${author}
- Version: ${version}
- Timestamp: ${timestamp}

## Schema Reference
Output should conform to: ${schema_path}