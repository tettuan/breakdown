---
description: Examples directory specific guidelines
globs: ["examples/**"]
alwaysApply: true
---

# Examples Implementation Guidelines

Read README.md first.

This directory emulates post-release usage after successful tests.
Examples are not tests themselves and have no test coverage.

Assumes complete library functionality and verifies correct user execution behavior.

## Error Handling
- **Examples issue**
  - Not following specifications
    - Fix examples
  - Following specifications but not working  
    - Verify use case validity
    - If use case is correct after investigation, report and stop
- **Implementation issue**
  - Tests passing
    - Implementation doesn't match specifications
      - Report and stop work
    - Specifications are incorrect
      - Report and stop work  
  - Tests failing
    - Fix tests

## Output Validation

If these directories exist in project root, examples are incorrectly creating them. Investigate each execution and fix. Should be created under examples/ directory:

- prompts
- prompt
- output
- schema
- schemas
- configs
