# Breakdown Test Strategy

## Structure

```
lib/                              # Unit tests (co-located with implementation)
├── builder/*.test.ts
├── domain/core/value_objects/*.test.ts
├── factory/*_test.ts, *.test.ts
├── types/*_test.ts, *.test.ts
└── utils/*_test.ts

tests/                            # Integration / E2E tests
├── 0_core_domain/                # Core domain integration (prompt path resolution)
│   └── prompt_path_resolution/   # 3 test files
├── 4_cross_domain/               # Cross-domain tests
│   ├── e2e/                      # 4 E2E test files
│   └── integration/              # 3 integration test files
├── helpers/                      # TestLoggerFactory
├── fixtures/                     # Test data (configs, prompts, schemas)
└── deps.ts                       # Shared assert re-exports
```

Unit tests: 13 files in `lib/` | Integration/E2E: 12 files in `tests/` | Disabled: 4 files (breakdown_params)

## Execution

```bash
# All tests
deno task test

# By scope
deno task test:unit           # lib/ unit tests
deno task test:integration    # tests/ integration + E2E
deno task test:e2e            # tests/4_cross_domain/e2e/ only

# By domain
deno test tests/0_core_domain/
deno test tests/4_cross_domain/

# CI (format + type-check + test + lint + JSR check)
deno task ci
```

## Conventions

### Test Placement

- Unit tests: `lib/` co-located with implementation
- Integration/E2E: `tests/` under numbered domain directories

### Logger

New tests MUST use `TestLoggerFactory`:

```typescript
import { TestLoggerFactory } from "$test/helpers/test_logger_factory.ts";

const logger = TestLoggerFactory.create("core", "working-dir-resolution");
```

See [tests/CLAUDE.md](./CLAUDE.md) for LOG_KEY naming and stage lifecycle.

### Dependencies

| Package | Domain |
|---------|--------|
| @tettuan/breakdownconfig | Configuration management |
| @tettuan/breakdownparams | Parameter parsing |
| @tettuan/breakdownprompt | Prompt generation |
| @tettuan/breakdownlogger | Logging (test diagnostics) |

## References

- [DDD Strategy](./DDD_STRATEGY.md) - Domain-driven test design
- [Test CLAUDE.md](./CLAUDE.md) - Debug output, LOG_KEY, prohibited patterns
- [Testing Guide](../docs/tests/testing.ja.md) - Execution guide (Japanese)
