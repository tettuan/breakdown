# Task Completion Checklist

When completing any development task in Breakdown, follow these steps:

## 1. Pre-Commit Checks

### Code Quality

- [ ] Run specific test for changed files:
      `deno test <file_test.ts> --allow-env --allow-write --allow-read`
- [ ] Fix any test failures
- [ ] Run formatter: `deno fmt`
- [ ] Run linter: `deno lint`
- [ ] Fix any lint errors

### Full CI Check

- [ ] Run local CI: `deno task ci` or `scripts/local_ci.sh`
- [ ] If errors, run with debug: `DEBUG=true deno task ci`
- [ ] All tests must pass before proceeding

## 2. Git Operations

### Before Committing

- [ ] Check git status: `git status`
- [ ] Ensure on correct branch (main for releases)
- [ ] Review changes carefully

### Commit Guidelines

- [ ] Write clear, concise commit messages
- [ ] Follow conventional commits format when applicable
- [ ] Include relevant issue numbers

## 3. Special Cases

### When Releasing New Version

1. Must be on main branch
2. All local commits pushed
3. GitHub Actions passing
4. Run `scripts/bump_version.sh [--major|--minor|--patch]`

### When Adding New Features

1. Update tests first (TDD approach)
2. Implement feature
3. Update documentation if needed
4. Ensure backward compatibility

## 4. Final Verification

- [ ] All tests passing
- [ ] Code formatted
- [ ] No lint errors
- [ ] Version consistency (if applicable)
- [ ] Documentation updated (if needed)

## Important Notes

- **Never** commit without running tests
- **Never** push untested code
- Use Serena MCP tools for code search/navigation
- Place temporary files in `tmp/` directory only
- Follow DDD principles in implementation
