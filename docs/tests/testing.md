# Test Specification - Domain-Driven Design Migration Version

> **Important**: This test specification is in the middle of migration to **Domain-Driven Design (DDD)**. Please refer to [../../tests/domain_driven/README.md](../../tests/domain_driven/README.md) for the new test strategy.

## Current Status

### New Test Strategy (Recommended)

Adopting a new test strategy based on **Domain-Driven Design**:

- **Complete Test Strategy**: [../../tests/domain_driven/README.md](../../tests/domain_driven/README.md)
- **Test Placement**: Under `tests/domain_driven/`
- **Design Principle**: Verification centered on core domain value creation

### New Test Design Principles

1. **Domain-Centered Value Verification**
   - Accurately verify the existence value of each domain
   - Prioritize core domain (prompt generation) value creation
   - Verify supporting domain (environment setup) support for core domain

2. **Respect for Bounded Context**
   - Clearly maintain boundaries between domains
   - Verify independence of each domain
   - Verification based on responsibility separation principles

3. **Hierarchical Value Verification**
   - Domain Unit Tests: Pure functions within a single domain
   - Domain Integration Tests: Service cooperation within domains
   - Interface Integration Tests: User interface quality
   - Cross-Domain Integration Tests: System-wide value creation

## New Test Directory Structure

```
tests/domain_driven/
├── core_domain/              # Core domain tests
│   ├── prompt_path_resolution/    # Prompt path resolution domain
│   ├── prompt_variable_generation/ # Prompt variable generation domain
│   ├── parameter_parsing/         # Parameter parsing domain
│   └── configuration_management/  # Configuration management domain
├── supporting_domain/        # Supporting domain tests
│   ├── template_management/       # Template management
│   ├── workspace_management/      # Workspace management
│   └── initialization/           # Initialization service
├── generic_domain/           # Technical foundation domain tests
│   ├── factory/                  # Factory domain
│   └── system/                   # System domain
├── interface_layer/          # Interface layer tests
│   ├── cli/                      # CLI interface
│   ├── configuration/            # Configuration interface
│   └── path_resolution/          # Path resolution interface
└── cross_domain/             # Cross-domain integration tests
    ├── e2e/                      # End-to-end scenarios
    └── collaboration/            # Cross-domain collaboration
```

## Test File Naming Convention

Test files follow these naming conventions according to their purpose:

1. **Architecture Tests**
   - Naming convention: `0_architecture_<implementation_file_name>.ts`
   - Example: `0_architecture_model.ts`
   - Purpose: Verify architectural constraints and dependencies
   - Placement: Same hierarchy as implementation file
   - Verification items:
     - Dependency direction
     - Circular reference detection
     - Layer boundaries
     - Interface consistency

2. **Structure Tests**
   - Naming convention: `1_structure_<implementation_file_name>.ts`
   - Example: `1_structure_model.ts`
   - Purpose: Verify class structure and separation of concerns
   - Placement: Same hierarchy as implementation file
   - Verification items:
     - Single responsibility principle adherence
     - Responsibility duplication detection
     - Appropriate abstraction levels
     - Inter-class relationships

3. **Unit Tests**
   - Naming convention: `2_unit_<implementation_file_name>.ts`
   - Example: `2_unit_model.ts`
   - Purpose: Verify functional behavior
   - Placement: Same hierarchy as implementation file

4. **Integration Tests**
   - Naming convention: `3_integration_<feature_name>.ts`
   - Example: `3_integration_params_parser.ts`
   - Purpose: Verify coordination between multiple components
   - Placement: tests/3_integration/

5. **E2E Tests**
   - Naming convention: `4_e2e_<feature_name>.ts`
   - Example: `4_e2e_params_parser.ts`
   - Purpose: Verify end-to-end behavior
   - Placement: tests/4_e2e/

## Test Dependencies

Tests are executed in the following order:

1. Model and Type Tests
   - Basic data structure and type verification
   - Validation rule verification

2. Derived Component Tests
   - Verification of features using models or types
   - Factory and utility verification

3. ParamsParser Tests
   - Individual feature verification
   - Overall integration verification

### Dependency Example

```
tests/
  ├── 3_integration/
  │   └── input_file_path_resolver_core_test.ts
  └── 4_e2e/
      └── input_file_path_resolver_basic_test.ts
  └── 5_edgecase/
```


## Test Execution Procedures

### Recommended: Batch Test and Local CI Flow Execution

To execute tests, format checks, and lint checks for the entire project in batch, use the following script:

```bash
bash scripts/local_ci.sh
```

- Reproduces the CI flow locally
- Executes all *_test.ts files in order, then performs format and lint checks after tests pass
- On errors, detailed debug output is available with `LOG_LEVEL=debug deno task ci`
- Tests are executed in dependency order (numerical order)
- Always ensure all checks pass with this script before commit/push/merge

### Basic Test Execution

```bash
deno test --allow-env --allow-write --allow-read
```

### Test with Debug Output

```bash
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### Execute Specific Test File

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
- File I/O
- Error handling

### 3_scenarios/

- Actual use cases
- Edge cases
- Error recovery

## CLI Test Requirements

### Test Items

1. Command Line Arguments
   - Basic command recognition
   - Option parsing
   - Argument combinations
   - Invalid argument error handling

2. Command Execution
   - Normal case tests for each command
   - Tests under error conditions
   - Behavior with option specifications
   - Command execution results

3. I/O Processing
   - Reading from stdin
   - Writing to stdout
   - Error output control
   - Log level behavior verification

### Test Methods

```typescript
// Command line argument test example
Deno.test("CLI argument parsing - to command", async () => {
  const result = await runCommand(["to", "project", "--config", "custom"]);
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
- `mockStdin()`: Stdin mock

### Integration Test Verification Items

1. End-to-end workflow
2. Actual file system integration
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
logger.debug("Test execution started", { testName: "example" });
```

### Log Levels

- `debug`: Detailed debug information
- `info`: Important process start/end
- `warn`: Warnings (recoverable errors)
- `error`: Errors (process interruption)

### Log Control During Test Execution

BreakdownLogger provides detailed log control through environment variables that are particularly useful during test execution:

#### Extracting Specific Logs with LOG_KEY

Output only log messages containing specific keywords to reduce noise during testing:

```bash
# Display logs related to specific functionality only
LOG_KEY="parser" deno test --allow-env --allow-write --allow-read

# Filter with multiple keywords (comma-separated)
LOG_KEY="parser,validation" deno test --allow-env --allow-write --allow-read

# Display error-related logs only
LOG_KEY="error,fail" deno test --allow-env --allow-write --allow-read
```

#### Output Control with LOG_LENGTH

Limit log message length for readable output even when testing with large amounts of data:

```bash
# Limit log messages to 100 characters
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# Detailed display with long messages (200 characters)
LOG_LENGTH=L deno test --allow-env --allow-write --allow-read

# Complete detailed display with no limit
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read

# Default (30 characters) shortened display
deno test --allow-env --allow-write --allow-read
```

#### Advanced Log Control with Combinations

Both features can be combined according to test situations:

```bash
# Display only short parser-related logs
LOG_KEY="parser" LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# Display detailed error logs
LOG_KEY="error" LOG_LENGTH=W LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### Recommended Log Settings by Test Phase

1. **Early Development/Debugging**
   ```bash
   LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

2. **Testing Specific Functionality**
   ```bash
   LOG_KEY="target_function" LOG_LEVEL=debug deno test
   ```

3. **CI Execution/Production Verification**
   ```bash
   LOG_LEVEL=info LOG_LENGTH=S deno test
   ```

4. **Error Investigation**
   ```bash
   LOG_KEY="error,fail,exception" LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

### Log Usage in Test Code

```typescript
// Logs to clarify test target
const logger = new BreakdownLogger("test-parser");
logger.debug("Test start: Parameter validation", { 
  testCase: "invalid_input",
  input: inputData 
});

// Logs for checking state during test
const processLogger = new BreakdownLogger("preprocessing");
processLogger.info("Intermediate processing completed", { 
  step: "preprocessing",
  result: processedData 
});

// Detailed logs for error reproduction
const errorLogger = new BreakdownLogger("validation-error");
errorLogger.error("Expected error occurred", { 
  expected: true,
  errorType: "ValidationError",
  details: errorDetails 
});
```

## Error Handling and Debugging

### Error Investigation Procedure

1. Check debug logs
2. Verify test environment state
3. Execute related test cases
4. Document error reproduction steps

### Handling Test Failures

1. Check error messages
2. Re-execute in debug mode
3. Check related implementation
4. Determine preprocessing for test failure
5. Fix and retest

### Test Failure Preprocessing Determination

- If a test fails in preprocessing unrelated to the test's purpose, a separate preprocessing test is needed
- Preprocessing tests should be placed in earlier stages so they are executed first in local_ci.sh
- Preprocessing examples:
  - Configuration determination test fails due to configuration file read failure
    - Create a configuration file reading test
- Non-preprocessing examples:
  - Configuration determination test fails because configuration values don't match
- Test preprocessing should use confirmed processes executed before the relevant test. It's important that later tests don't implement their own.

# Legacy Test Specification (Reference Information)

The following is reference information for understanding existing test files and migration work:

### Legacy Hierarchical Test Structure

- **0_foundation/**: Foundation tests → **generic_domain/** & **interface_layer/**
- **1_core/**: Core functionality tests → **core_domain/** & **supporting_domain/**
- **2_integration/**: Integration tests → **cross_domain/collaboration/**
- **3_scenarios/**: Scenario tests → **cross_domain/e2e/**
- **4_e2e/**: E2E tests → **cross_domain/e2e/**

### Legacy Test File Naming Convention

- `0_architecture_<implementation_file_name>.ts`: Architecture tests
- `1_structure_<implementation_file_name>.ts`: Structure tests
- `2_unit_<implementation_file_name>.ts`: Unit tests
- `3_integration_<feature_name>.ts`: Integration tests
- `4_e2e_<feature_name>.ts`: E2E tests

### Coexistence Period Until Migration Completion

Currently, both old and new test structures are being used in parallel. Always use the new domain-driven structure when creating new tests.

---

**Migration Status**: In transition to Domain-Driven Test Strategy  
**Recommendation**: Create new tests under `tests/domain_driven/`  
**Details**: See [Domain-Driven Test Strategy](../../tests/domain_driven/README.md)