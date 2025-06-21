# Issue Finding and Discovery Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Discovery Perspectives
- **Functional Issues**: Missing features, incomplete implementations, broken workflows
- **Technical Debt**: Code complexity, maintenance issues, outdated dependencies
- **Performance Issues**: Slow operations, inefficient algorithms, resource consumption
- **User Experience**: Usability problems, confusing interfaces, missing documentation
- **Integration Issues**: API compatibility, data format mismatches, system dependencies
- **Process Issues**: Missing tests, incomplete CI/CD, deployment problems
- **Documentation Gaps**: Missing README, unclear API docs, outdated examples
- **Compliance Issues**: License violations, security policies, regulatory requirements

## Instructions
1. Scan the input information from the above perspectives.
2. Identify potential issues, gaps, and areas for improvement.
3. For each issue discovered, provide:
   - **Category**: Which perspective the issue falls under
   - **Priority**: High, Medium, Low (based on impact and urgency)
   - **Description**: Clear explanation of the issue
   - **Evidence**: Specific examples or references from the input
   - **Impact**: How this affects the project or users
   - **Recommended Action**: Next steps to address the issue
4. Group related issues together for better understanding.
5. Always use template variables.

## Output Format
- Output as structured Markdown following the issue discovery schema
- Organize issues by priority and category
- Include specific recommendations for resolution