# Logging Specification

## Basic Policy

Uses https://jsr.io/@tettuan/breakdownlogger. Read and understand README at
https://github.com/tettuan/breakdownlogger.

### Distinction Between DEBUG and LOG_LEVEL

- `LOG_LEVEL`: Environment variable used by BreakdownLogger
  - Used only in test code
  - Functions as permanent debug output
  - Treated as part of tests
  - Used for tracking test case execution status and results

- `DEBUG`: Environment variable for temporary debug output
  - Can be used in non-test code as well
  - Treated as temporary debug code
  - For problem investigation during development
  - Code that should ultimately be removed

### Use Only in Test Code

- Do not use `BreakdownLogger` in application code
- `BreakdownLogger` can only be used in test code
- Debug information output is for development time only

## Log Levels

### Control via Environment Variables

```bash
LOG_LEVEL=<level> deno test ...
```

### Level Definitions

1. `debug`: Detailed debug information
   - Variable values
   - Process start/end
   - Intermediate states

2. `info`: Important information
   - Test case start
   - Important state changes
   - Expected results

3. `warn`: Warnings
   - Unexpected states
   - Recoverable errors
   - Performance issues

4. `error`: Errors
   - Process interruption
   - Serious problems
   - Unrecoverable errors

## Output Format

### JSON Format

```json
{
  "timestamp": "2025-04-13T12:34:56.789Z",
  "level": "debug",
  "message": "Test message",
  "data": {
    "testName": "example",
    "status": "running"
  }
}
```

### Field Definitions

- `timestamp`: ISO 8601 format timestamp
- `level`: Log level
- `message`: Log message
- `data`: Additional information (optional)

## Debug Methods

### Debugging by Test Case

```typescript
// Within test file
const logger = new BreakdownLogger();

Deno.test("Test case", () => {
  logger.debug("Test start", { case: "example" });
  // Test processing
  logger.debug("Test end", { result: "success" });
});
```

### Error Investigation

1. Execute with `LOG_LEVEL=debug`
2. Check log output
3. Identify error location
4. Fix and re-execute

## Log Output Control

### Output Destination

- Default: Standard error output
- File output is not supported

### Filtering

- Filtering by level
- Output for specific test cases only
- Restriction of data fields