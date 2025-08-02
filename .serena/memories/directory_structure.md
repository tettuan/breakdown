# Breakdown Directory Structure

## Root Level

```
breakdown/
├── cli/                    # CLI entry points
├── docs/                   # Documentation (Japanese)
│   ├── breakdown/         # Breakdown specifications
│   └── tests/            # Test documentation
├── examples/              # Example usage (not for testing)
├── lib/                   # Main implementation + unit tests
├── scripts/               # Build and utility scripts
├── tests/                 # Integration and E2E tests
└── tmp/                   # Temporary files (gitignored)
```

## Core Implementation (lib/)

```
lib/
├── application/           # Application services
├── builder/              # Object builders
├── cli/                  # CLI utilities
├── commands/             # Command implementations
├── config/               # Configuration management
├── domain/               # Domain logic (DDD)
│   ├── core/            # Core domain
│   ├── supporting/      # Supporting domain
│   ├── generic/         # Generic domain
│   └── errors/          # Domain errors
├── factory/              # Factory implementations
├── infrastructure/       # Infrastructure layer
├── io/                   # Input/Output handling
├── processor/            # Data processors
├── prompt/               # Prompt generation
├── supporting/           # Supporting utilities
├── templates/            # Template management
├── test_helpers/         # Test utilities
├── types/                # Type definitions
├── utils/                # General utilities
└── validator/            # Validation logic
```

## Test Structure (tests/)

```
tests/
├── 0_core_domain/        # Core domain tests (highest priority)
├── 1_supporting_domain/  # Supporting domain tests
├── 2_generic_domain/     # Generic domain tests (not found currently)
├── 3_interface_layer/    # Interface layer tests (not found currently)
├── 4_cross_domain/       # Cross-domain integration tests
├── fixtures/             # Test fixtures
│   ├── static-prompts/  # Git tracked fixtures
│   └── prompts/         # Dynamic fixtures (gitignored)
└── integration/          # Legacy integration tests
```

## Important Files

- `deno.json` - Deno configuration and tasks
- `mod.ts` - Main module export
- `deps.ts` - Dependency management
- `CLAUDE.md` - Claude-specific instructions
- `lib/version.ts` - Version tracking (synced with deno.json)

## Special Directories

- `tmp/` - Temporary files only (gitignored)
- `.breakdown/` - Breakdown workspace (gitignored)
- `.serena/` - Serena MCP configuration
- `examples/` - Usage examples (NOT for testing)

## Key Patterns

- Unit tests: Alongside implementation files (*.test.ts)
- Integration tests: In tests/ directory
- Domain boundaries: Clearly separated in lib/domain/
- Factory pattern: Used for object creation
- Value objects: With smart constructors
