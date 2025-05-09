# Testing Specification

> **For implementation examples of path resolution and parameter construction for testing, also refer to [app_factory.ja.md](./app_factory.ja.md).**

## Test Directory Structure

```
tests/
├── 0_foundation/           # 0: Foundation functionality tests
│   ├── 0_env/             # 0: Environment & initialization
│   ├── 1_config/          # 1: Configuration management
│   ├── 2_commands/        # 2: Command parameter parsing & execution
│   ├── 3_logger/          # 3: Logging
│   └── 4_directory_structure/ # 4: Directory structure management
├── 1_core/                # 1: Core functionality tests (normal & edge cases separated)
│   ├── 0_path/           # 0: Path processing
│   ├── 1_io/             # 1: I/O processing
│   ├── 2_config/         # 2: Configuration management
│   ├── 3_prompt/         # 3: Prompt processing
│   │   ├── prompt_processor_test.ts      # Normal prompt generation
│   │   ├── prompt_path_test.ts           # Normal path generation
│   │   ├── prompt_setup_test.ts          # Normal setup
│   │   └── edge_cases/                   # Edge cases & error cases only
│   │        ├── prompt_base_dir_edge_test.ts   # baseDir related error cases
│   │        └── prompt_path_edge_test.ts       # Path generation error cases
│   └── 4_cli/              # 4: CLI tests
├── 2_integration/         # 2: Integration tests (E2E & examples reproduction)
│   ├── 0_flow/           # 0: Flow integration
│   └── 1_examples/         # 1: E2E reproduction from examples/
│        └── examples_flow_test.ts
├── 3_scenarios/           # 3: Scenario tests (use cases & complex behaviors)
│   ├── 0_basic/          # 0: Basic scenarios
│   │   └── commands_test.ts
│   └── 1_edge_cases/       # 1: Edge cases for scenarios
│        └── edge_scenarios_test.ts
├── helpers/                # Helpers referenced by other tests
├── fixtures/               # Test data
├── tmp/                    # Temporary files
├── test_config.yml
├── params_test.ts
└── README.md
```

## Test Execution Procedure

### Recommended: Batch Testing & Local CI Flow Execution

To run tests, formatting, and lint checks for the entire project at once, use the following script:

```bash
bash scripts/local_ci.sh
```

- Reproduces the same flow as CI locally.
- Executes all *_test.ts files in sequence, then performs formatting and lint checks after tests pass.
- For detailed debug output on errors, use `DEBUG=true bash scripts/local_ci.sh`.
- Tests are executed in dependency order (numerical order).
- Always ensure all checks pass with this script before committing, pushing, or merging.

### Basic Test Execution

```bash
deno test --allow-env --allow-write --allow-read
```

### Test with Debug Output

```bash
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### Running Specific Test Files

```bash
deno test <test_file.ts> --allow-env --allow-write --allow-read
```

## Test Coverage Requirements

### 0_foundation/

- Configuration file loading
- Log level control
- Working directory management

### 1_core/

- Command-line argument parsing
- Prompt generation and validation
- Parameter validation

### 2_integration/

- Command execution flow
- File I/O
- Error handling

### 3_scenarios/

- Actual use cases
- Edge cases
- Error recovery

## CLI Test Requirements

### Test Placement

```
tests/
└── 1_core/
    └── 4_cli/           # CLI test specific directory
        ├── args_test.ts     # Argument parsing tests
        ├── commands_test.ts # Command execution tests
        └── io_test.ts      # I/O tests
```

### Test Items

1. Command-line arguments
   - Basic command recognition
   - Option parsing
   - Argument combinations
   - Invalid argument error handling

2. Command execution
   - Normal case tests for each command
   - Tests under error conditions
   - Behavior with option specifications
   - Command execution results

3. I/O processing
   - Reading from standard input
   - Writing to standard output
   - Error output control
   - Log level behavior verification

### Testing Methods

```typescript
// Command-line argument test example
Deno.test("CLI argument parsing - init command", async () => {
  const result = await runCommand(["init", "--config", "custom.json"]);
  assertCommandSuccess(result);
  // Verify expected output
});

// Error handling test example
Deno.test("CLI error handling - invalid command", async () => {
  const result = await runCommand(["invalid"]);
  assertEquals(result.error.includes("Unknown command"), true);
});
```

### Test Helper Functions

- `runCommand()`: Command execution wrapper
- `assertCommandSuccess()`: Command success verification
- `assertCommandOutput()`: Output content verification
- `mockStdin()`: Standard input mock

### Integration Test Verification Items

1. End-to-end workflow
2. Integration with actual file system
3. Configuration file loading
4. Error recovery and retry

## Test Helpers

### setup.ts

- Test environment initialization
- Temporary directory creation
- Test data preparation

### assertions.ts

- Prompt verification
- File content verification
- Error state verification

## Debug Output

### Usage in Test Code

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();
logger.debug("Test execution start", { testName: "example" });
```

### Log Levels

- `debug`: Detailed debug information
- `info`: Important process start/end
- `warn`: Warnings (recoverable errors)
- `error`: Errors (process interruption)

## Error Handling and Debugging

### Investigation Steps When Errors Occur

1. Check debug logs
2. Verify test environment state
3. Run related test cases
4. Document error reproduction steps

### Handling Test Failures

1. Check error messages
2. Re-run in debug mode
3. Review related implementations
4. Evaluate pre-processing failures
5. Fix and retest

### Pre-processing Failure Evaluation

- If a test fails due to pre-processing that isn't the test's main purpose, separate pre-processing
  tests are needed
- Pre-processing tests should be positioned earlier in execution order via local_ci.sh
- Examples of pre-processing:
  - Configuration validation test fails due to config file loading failure
    - Create a test for config file loading
- Examples that are not pre-processing:
  - Configuration validation test fails due to mismatched configuration values
- Pre-processing of tests should utilize confirmed processes that have been implemented prior to the
  relevant test. It is important that tests in subsequent processes are not implemented
  independently.

# Skeleton Code Construction Order (Test-Driven)

- Create test files following the "Test Directory Structure"
- Skeleton creation: First describe test items as test targets (without writing test content yet)
- Include failing test descriptions in the skeleton
- Add comments that:
  - Document what you would want to know when reading someone else's code
  - Describe test intentions, purposes, and reasons for testing
  - Clearly specify what the test is targeting
