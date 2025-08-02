# Suggested Commands for Development

## Testing Commands

- **Run all tests**: `deno test --allow-env --allow-write --allow-read --allow-run`
- **Run specific test**:
  `deno test <test_file.ts> --allow-env --allow-write --allow-read --allow-run`
- **Local CI**: `deno task ci` or `scripts/local_ci.sh`
- **Local CI with details**: `DEBUG=true deno task ci` or `DEBUG=true scripts/local_ci.sh`
- **Quick CI (single file)**: `deno task ci --single-file`

## Debugging Tests

- **Basic debug**: `LOG_LEVEL=debug deno test <file> --allow-env --allow-write --allow-read`
- **Filter by module**:
  `LOG_KEY="module-name" LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read`
- **Multiple modules**:
  `LOG_KEY="auth,validation,database" deno test --allow-env --allow-write --allow-read`
- **Full output**: `LOG_LENGTH=W LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read`

## Code Quality

- **Format code**: `deno fmt`
- **Lint code**: `deno lint`
- **Type check**: `deno check mod.ts`

## Version Management

- **Bump version**: `scripts/bump_version.sh [--major|--minor|--patch]` (default: patch)
- **Check version sync**: Compare deno.json and lib/version.ts

## Git Operations

- **Check status**: `git status`
- **Current branch**: `git rev-parse --abbrev-ref HEAD`
- **Push to remote**: `git push` (must be on main branch for version bump)

## Development Workflow

1. Make changes
2. Run tests: `deno test <changed_file_test.ts> --allow-env --allow-write --allow-read`
3. Run formatter: `deno fmt`
4. Run linter: `deno lint`
5. Run full CI: `deno task ci`
6. Commit changes

## JSR Publishing

- **Dry run**: `deno publish --dry-run --allow-dirty --no-check`
- **Actual publish**: Done via GitHub Actions after version tag

## System Commands (macOS)

- **List files**: `ls -la`
- **Change directory**: `cd <path>`
- **Make directory**: `mkdir -p <path>`
- **Remove file**: `rm <file>`
- **Find files**: Use Serena's `find_file` instead of system `find`
- **Search pattern**: Use Serena's `search_for_pattern` instead of `grep`
