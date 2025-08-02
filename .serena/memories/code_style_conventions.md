# Code Style and Conventions

## General Guidelines

- **Type Safety**: Enable strict: true in TypeScript
- **Explicit Types**: Use explicit type definitions throughout
- **Magic Numbers**: Avoid magic numbers and hard-coding - use ENUM and const
- **Documentation**: Use JSDoc for public APIs and complex functions
- **Comments**: Write comments only after tests pass
- **No Celebrating Messages**: Avoid celebration messages to save tokens

## File Structure

- **No Files at Project Root**: Keep project root clean (except JSR, Deno, Git, Renovate files)
- **Temporary Files**: Place in `tmp/` directory
- **Test Files**: Follow DDD structure in `tests/` directory
- **Implementation + Unit Tests**: Place unit tests alongside implementation in `lib/`

## Naming Conventions

- **Value Objects**: Use Smart Constructors pattern (e.g., `createWorkspaceName()`)
- **Error Types**: Suffix with `Error` (e.g., `WorkspaceNameError`)
- **Result Types**: Use Result pattern for error handling
- **Test Names**: Use English for test names, comments, and log messages

## Design Patterns

- **Domain-Driven Design (DDD)**: Core architectural pattern
- **Totality Functions**: Ensure all possible cases are handled
- **Occam's Razor**: Minimal configuration, extract only necessary features
- **Smart Constructors**: Prevent direct instantiation of value objects
- **Result Pattern**: Use for error handling instead of exceptions

## Import/Export Style

- Use JSR imports for external packages
- Use import aliases: `$lib/`, `$test/`, `$deps/`
- Group imports by: external, internal, types

## Test Guidelines

- **Test Placement**: Unit tests with implementation, integration tests in `tests/`
- **Test Structure**: Follow DDD domain boundaries
- **Debug Output**: Use BreakdownLogger with LOG_KEY in tests only
- **No Absolute Paths**: Use relative paths or Deno.cwd() based paths
- **Forbidden**: Don't use `Deno.env.set` for mode setting in tests

## Error Handling

- Use domain-specific error types
- Implement error discrimination functions (e.g., `isEmptyNameError()`)
- Format errors for terminal output
- Provide recovery suggestions

## Formatting

- Use `deno fmt` settings from deno.json:
  - Indent width: 2
  - Double quotes
  - Line width: 100
