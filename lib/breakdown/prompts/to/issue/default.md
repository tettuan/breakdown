# Issue Breakdown Prompt Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Instructions
1. Analyze the input and break down the issue into its elements.
2. Ensure all elements are covered, avoiding omissions.
3. Decompose large information into high-resolution, concrete elements.
4. Break down from the following perspectives:
   - Requirements/specification classification
   - Issue purpose, problems, background, and history
   - MoSCoW analysis, DDD, design patterns
   - Taskification and relationships between tasks (blocked, related, sub, parent)
5. Insert template variables as needed.

## Output Format
- Follow the issue schema definition.
- Clearly indicate any missing information.
- Create structured sections for each perspective above.
