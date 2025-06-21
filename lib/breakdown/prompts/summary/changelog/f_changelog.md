# Changelog Summary Prompt

This prompt helps create comprehensive changelog summaries from git commits.

## Input
{input_text}

## Output
The output should be a structured changelog with:
- Version information
- Release date
- Change categories (Features, Bug Fixes, Breaking Changes, etc.)
- Contributor information
- Impact assessment
- Migration notes (if applicable)

## Instructions
1. Parse commit messages
2. Categorize changes by type
3. Group related changes
4. Extract issue/PR references
5. Identify breaking changes
6. Summarize impact
7. Generate migration guidance
8. Format in standard changelog style

## Categories
- **Features**: New functionality
- **Bug Fixes**: Issue resolutions
- **Breaking Changes**: Backward incompatible changes
- **Documentation**: Documentation updates
- **Performance**: Performance improvements
- **Refactor**: Code restructuring
- **Tests**: Test additions or changes
- **Chore**: Build process or auxiliary tool changes