# BreakdownParams Integration Tests

## Overview

This directory contains comprehensive integration tests for BreakdownParams functionality, focusing on configuration-based testing using ConfigurationTestHelper.

## Test Structure

### 1. configuration_integration_test.ts
Tests the integration between BreakdownParams and configuration files:
- Loading configurations using ConfigurationTestHelper
- Parsing parameters with various configuration profiles
- Validating directive and layer patterns from config files
- Testing custom configuration overrides

### 2. parameter_parsing_integration_test.ts
Tests parameter parsing with different configurations:
- Two-parameter parsing (directive + layer)
- One-parameter parsing (layer only)
- Zero-parameter parsing (interactive mode)
- Option parsing (--help, --version, --config, etc.)
- Edge cases and boundary conditions

### 3. error_handling_integration_test.ts
Tests error scenarios and validation:
- Invalid directive patterns
- Invalid layer patterns
- Missing configuration files
- Malformed configuration data
- Error propagation and messages

## Configuration Files Used

- `breakdown-params-user.yml`: Standard integration test configuration
- `multi-profile-user.yml`: Multiple profile configurations
- `error-scenarios-user.yml`: Invalid configurations for error testing

## Test Helpers

All tests use `ConfigurationTestHelper` to:
1. Load test configurations dynamically
2. Generate test matrices from configuration data
3. Validate configuration integrity
4. Run parameterized tests

## Example Test Pattern

```typescript
import { ConfigurationTestHelper } from "$lib/test_helpers/configuration_test_helper.ts";
import { breakdownParams } from "@tettuan/breakdownparams";

Deno.test("BreakdownParams integration with configuration", async () => {
  // Load test configuration
  const { userConfig, customConfig } = await ConfigurationTestHelper.loadTestConfiguration("breakdown-params");
  
  // Generate test cases from configuration
  const testCases = ConfigurationTestHelper.generateTestMatrix(userConfig.testData);
  
  // Run tests
  for (const testCase of testCases) {
    const result = await breakdownParams(testCase.args, customConfig);
    assertEquals(result.type, testCase.expectedType);
  }
});
```

## Running Tests

```bash
# Run all integration tests
deno test tests/integration/breakdown_params/

# Run specific test file
deno test tests/integration/breakdown_params/configuration_integration_test.ts

# Run with debug output
LOG_LEVEL=debug deno test tests/integration/breakdown_params/
```