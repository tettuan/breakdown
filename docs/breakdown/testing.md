# Testing Guide for Breakdown

This document outlines the testing requirements, environment setup, and test patterns for the Breakdown tool.

## Test Environment Setup

### Prerequisites

```bash
deno test --allow-read --allow-write --allow-run
```

### Test Directory Structure

```
tests/
├── 1_core/           # Core functionality tests
├── 2_integration/    # Integration tests
└── 3_e2e/           # End-to-end tests
```

## Test Categories

### 1. Core Tests

Core tests validate the fundamental parsing and processing capabilities:

- Markdown parsing
- JSON conversion
- Data validation
- Error handling

### 2. Integration Tests

Integration tests verify the interaction between components:

- Command processing
- File I/O operations
- Format conversions
- Error propagation

### 3. End-to-End Tests

E2E tests validate complete workflows:

- Project creation flow
- Issue generation flow
- Task breakdown flow
- Error handling flow

## Test Requirements

### Coverage Requirements

- Core functionality: 95% coverage
- Integration points: 90% coverage
- E2E workflows: 85% coverage

### Performance Requirements

- Parser tests: < 100ms for standard input
- File operations: < 500ms for standard files
- Full workflow: < 2s for complete process

### Error Handling Requirements

- All error conditions must be tested
- Error messages must be validated
- Recovery processes must be verified

## Test Helpers

### Available Test Utilities

```typescript
// File operations
createTestFile(content: string): string
cleanupTestFile(path: string): void

// Markdown helpers
createTestMarkdown(type: 'project'|'issue'|'task'): string

// JSON helpers
createTestJson(type: 'project'|'issue'|'task'): object
```

## Common Test Patterns

### 1. Parser Testing

```typescript
Deno.test("Parser Test Pattern", async () => {
  // Setup
  const input = createTestMarkdown('project');
  
  // Execute
  const result = await parseMarkdown(input);
  
  // Validate
  assert(validateJsonStructure(result));
});
```

### 2. Error Handling Testing

```typescript
Deno.test("Error Handling Pattern", async () => {
  // Setup invalid input
  const invalidInput = "# Invalid\n* [x] incomplete";
  
  // Execute and catch error
  try {
    await parseMarkdown(invalidInput);
    assert(false, "Should have thrown error");
  } catch (e) {
    assert(e instanceof ParseError);
    assert(e.message.includes("Invalid markdown structure"));
  }
});
```

### 3. Performance Testing

```typescript
Deno.test("Performance Test Pattern", async () => {
  const start = performance.now();
  
  // Execute operation
  await parseMarkdown(largeInput);
  
  const duration = performance.now() - start;
  assert(duration < 100, "Parser should complete within 100ms");
});
```

## Test Execution

### Running Tests Locally

```bash
# Run all tests
deno test --allow-read --allow-write

# Run specific test category
deno test tests/1_core/

# Run with coverage
deno test --coverage
```

### CI/CD Integration

Tests are automatically run in the CI pipeline:
- On pull requests
- On main branch commits
- During release preparation

## Test Maintenance

### Adding New Tests

1. Identify the appropriate test category
2. Create test file following naming convention
3. Implement test using provided helpers
4. Verify coverage requirements
5. Update documentation if needed

### Updating Existing Tests

1. Maintain backward compatibility
2. Update performance benchmarks
3. Verify coverage requirements
4. Update related documentation 