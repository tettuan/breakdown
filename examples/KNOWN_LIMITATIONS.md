# Known Limitations - Breakdown Examples

## Current Status (2025-01-14)

Due to limitations in the current version of BreakdownParams (v1.0.1), certain examples are temporarily non-functional. This document outlines the affected examples and the underlying issues.

### Affected Examples

#### 1. Custom Variables Examples
- **13_custom_variables_example.sh** - Non-functional
- **13_custom_variables_team_workflow.sh** - Non-functional

**Issue**: BreakdownParams treats all options (including --uv-* custom variables) as additional arguments, causing a "Too many arguments. Maximum 2 arguments are allowed" error when used with two-parameter commands.

#### 2. Find Bugs Examples  
- **14_find_bugs_example.sh** - Non-functional
- **15_find_bugs_team_workflow.sh** - Non-functional

**Issue**: 
1. Same argument counting issue as above when options are used
2. Additionally requires initialization with `breakdown init` before running

#### 3. Any Two-Parameter Commands with Options
Examples that use commands like `to project --from X --destination Y` will fail.

**Issue**: BreakdownParams counts options as arguments, exceeding the maximum of 2 arguments for two-parameter commands.

### Working Examples

The following examples continue to work correctly:
- **03_check_version.sh** - Works (though --version is not a valid option)
- **04_init.sh** - Works correctly
- **04a_init_deno_run.sh** - Works correctly
- **05_create_user_config.sh** - Works correctly
- **12_clean.sh** - Works correctly

### Technical Details

The root cause is in BreakdownParams v1.0.1:
- The parser counts all arguments, including options, against the maximum argument limit
- Two-parameter commands (e.g., `to project`) are limited to exactly 2 arguments
- Adding any options (--from, --destination, --uv-*, etc.) causes the argument count to exceed this limit

### Workaround

Until BreakdownParams is updated to properly handle options separately from positional arguments, the affected examples cannot function as designed. The EnhancedParamsParser wrapper has been created to document these limitations in tests.

### Next Steps

1. Wait for BreakdownParams update that properly separates option counting from argument counting
2. Once updated, all examples should work without modification
3. The custom variables feature and find bugs commands are fully implemented in the codebase but cannot be demonstrated via CLI until this limitation is resolved

## Related Files

- `/lib/cli/parser/enhanced_params_parser.ts` - Wrapper that documents the limitations
- `/tests/1_core/4_cli/enhanced_params_parser_test.ts` - Tests documenting expected vs actual behavior
- `/tests/1_core/4_cli/enhanced_params_consistency_test.ts` - Consistency tests for the limitations