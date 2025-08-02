# Development Workflow

## Key Development Rules

### File Search and Navigation

- **Use Serena MCP tools**: `find_file`, `search_for_pattern`, `list_dir`, `get_symbols_overview`
- **Avoid system commands**: Don't use `find`, `grep`, `ls` directly
- **Symbol-based navigation**: Use `find_symbol` for code navigation

### Testing Workflow

1. **Before making changes**: Read existing tests to understand behavior
2. **TDD approach**: Write/update tests first, then implementation
3. **Test execution order**:
   - Run specific test: `deno test <file_test.ts> --allow-env --allow-write --allow-read`
   - If pass, run related domain tests
   - Finally, run full CI: `deno task ci`

### Code Changes

1. **Search before modify**: Use Serena to understand code structure
2. **Respect DDD boundaries**: Keep domain logic separated
3. **Use totality functions**: Handle all possible cases
4. **Follow existing patterns**: Check similar code for conventions

### Debugging Strategy

1. **Start simple**: `LOG_LEVEL=debug deno test <file>`
2. **Filter by module**: `LOG_KEY="module-name" LOG_LEVEL=debug`
3. **Full details**: `LOG_LENGTH=W LOG_LEVEL=debug`
4. **Use BreakdownLogger**: Only in test files, with appropriate LOG_KEY

### Version Management

- **Only from main branch**: Version bumps require clean main
- **All tests must pass**: No version bump with failing tests
- **Use script**: `scripts/bump_version.sh [--major|--minor|--patch]`
- **Automatic sync**: Version in deno.json and lib/version.ts

### Common Workflows

#### Adding New Feature

1. Create tests in appropriate domain
2. Implement feature following DDD
3. Run tests iteratively
4. Format and lint
5. Run full CI
6. Commit with clear message

#### Fixing Bugs

1. Write failing test that reproduces bug
2. Fix implementation
3. Verify test passes
4. Check for regression in related tests
5. Run full CI

#### Refactoring

1. Ensure full test coverage exists
2. Make incremental changes
3. Run tests after each change
4. Keep commits atomic
5. Document significant changes

### Important Reminders

- **No files at project root**: Except allowed configs
- **Use tmp/ for temporary files**: Never commit temp files
- **English in tests**: All test names and logs in English
- **No celebration messages**: Keep output concise
- **Use Result pattern**: For error handling, not exceptions
