# Consistency Between Testing and baseDir Validation

> baseDir is received by BreakdownConfig, PromptManager, etc., and used in various scenarios of CLI and prompt processing. Tests need to explicitly verify the blank allowance specification for baseDir.

## Overview
- Currently, there's a possibility that validation of `baseDir` (handling when blank) doesn't match between the application main body and test code.
- This creates a risk that tests are written with assumptions different from the actual specifications, or tests won't follow future specification changes.

## Required Actions
- **Explicitly reflect baseDir validation specifications (blank allowed or required) in test cases.**
- Add/modify cases in tests that assume "baseDir being blank doesn't cause errors."
- When specifications change, always review tests simultaneously.

## Notes
- This matter will be referenced during future refactoring and specification discussions.
- To maintain implementation and test consistency, always cover with explicit test cases.