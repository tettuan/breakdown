# Test Specifications

## Test Directory Structure

```
tests/
├── 0_foundation/     # Foundation functionality tests
│   ├── config_test.ts    # Configuration related
│   └── logger_test.ts    # Logging related
├── 1_core/          # Core functionality tests
│   ├── command/         # Command processing
│   ├── prompt/          # Prompt processing
│   └── params_test.ts   # Parameter processing
├── 2_integration/   # Integration tests
│   └── flow_test.ts     # Process flow
├── 3_scenarios/     # Scenario tests
│   └── commands_test.ts # Command execution
├── fixtures/        # Test data
├── helpers/         # Test helpers
└── prompts/         # Prompt tests
```

## Test Execution Procedures

### Basic Test Execution

```bash
deno test --allow-env --allow-write --allow-read
```

### Testing with Debug Output

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

- Command line argument parsing
- Prompt generation and validation
- Parameter validation

### 2_integration/

- Command execution flow
- File input/output
- Error handling

### 3_scenarios/

- Actual use cases
- Edge cases
- Error recovery

## Test Helpers

### setup.ts

- Test environment initialization
- Temporary directory creation
- Test data preparation

### assertions.ts

- Prompt validation
- File content validation
- Error state validation

## Debug Output

### Usage in Test Code

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();
logger.debug("Test execution started", { testName: "example" });
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
