# TypeScript CI Runner Migration

This document describes the migration from the bash-based `local_ci.sh` to the TypeScript-based `local_ci.ts`.

## Overview

The CI system has been migrated to TypeScript to provide:
- **Type Safety**: Compile-time error checking and better code reliability
- **Better Structure**: Object-oriented design with clear separation of concerns
- **Enhanced Maintainability**: Easier to extend and modify
- **Improved Error Handling**: Structured error reporting and diagnostics

## Architecture

The TypeScript CI runner is organized into the following modules:

### Core Files

- **`local_ci.ts`** - Main entry point and orchestration
- **`local_ci/types.ts`** - Type definitions and interfaces
- **`local_ci/logger.ts`** - Logging utilities with multiple log levels
- **`local_ci/cli_parser.ts`** - Command-line argument parsing
- **`local_ci/process_runner.ts`** - Process execution utilities
- **`local_ci/file_system.ts`** - File system operations
- **`local_ci/ci_runner.ts`** - Main CI execution logic

### Key Classes

#### `CIRunner`
Main orchestration class that:
- Manages the complete CI pipeline
- Handles different execution modes (single-file, batch, legacy)
- Provides comprehensive error handling and reporting

#### `Logger`
Structured logging with:
- Multiple log levels (info, debug, warn, error)
- Formatted output with sections and subsections
- Debug mode support

#### `ProcessRunner`
Process execution utilities:
- Async process execution with timeout support
- Deno-specific command wrappers
- Real-time output capture
- System resource detection

#### `FileSystem`
File system operations:
- TypeScript file discovery
- Test file enumeration
- Path utilities and normalization

## Usage

### Basic Usage

```bash
# Run with TypeScript version
deno task ci:ts

# Run with debug output
DEBUG=true deno task ci:ts

# Run in single-file mode
deno task ci:ts --single-file

# Run in batch mode with custom batch size
deno task ci:ts --batch --batch-size 15

# Run in legacy mode
deno task ci:ts --legacy
```

### Available Options

- `--single-file`: Run tests one file at a time in debug mode
- `--batch`: Run tests in batches (default behavior)
- `--batch-size N`: Set batch size (default: 25)
- `--legacy`: Use legacy mode (all tests at once)
- `--no-fallback`: Disable automatic fallback to single-file mode
- `--debug`: Enable debug logging
- `--help, -h`: Show help message

### Environment Variables

- `DEBUG=true`: Enable debug logging
- `LOG_LEVEL=debug`: Enable debug logging

## Migration Benefits

### Type Safety
- All configurations are type-checked at compile time
- Error handling is structured and consistent
- API contracts are clearly defined

### Better Error Handling
- Structured error reporting with context
- Categorized error types (type errors, format errors, lint errors, etc.)
- Helpful diagnostic messages with actionable suggestions

### Enhanced Maintainability
- Clear separation of concerns
- Modular architecture
- Easy to extend with new features
- Comprehensive documentation

### Performance Characteristics
- Similar performance to bash version for test execution
- Slightly better file system operations
- More efficient batch processing
- Better memory management for large test suites

## Backwards Compatibility

The original `local_ci.sh` remains available and can be used with:

```bash
# Original bash version
deno task ci

# Or directly
bash scripts/local_ci.sh
```

Both versions support the same command-line options and environment variables.

## Future Enhancements

The TypeScript architecture enables:
- Integration with VS Code tasks and debugging
- Enhanced reporting and metrics collection
- Better integration with CI/CD pipelines
- Extensible plugin system for custom checks
- Real-time progress reporting
- Parallel test execution optimization

## Development

To contribute to the TypeScript CI runner:

1. Ensure type safety: `deno check scripts/local_ci.ts`
2. Run tests: `deno test scripts/local_ci/`
3. Format code: `deno fmt scripts/local_ci/`
4. Lint code: `deno lint scripts/local_ci/`

The TypeScript version maintains the same robust error handling and execution modes as the original bash version while providing improved maintainability and type safety.
