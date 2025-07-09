/**
 * @fileoverview Architecture tests for Result type module
 * Testing domain boundaries, dependencies, and architectural constraints
 *
 * Architecture tests verify:
 * - Domain boundary enforcement
 * - Dependency direction
 * - Smart Constructor pattern compliance via helper functions
 * - Totality principle adherence
 */

import { assertEquals, assertExists } from "@std/assert";
import { error, ok, Result } from "./result.ts";

Deno.test("0_architecture: Result type follows domain boundary rules", () => {
  // Result type should be a pure algebraic data type with no external dependencies
  // No file system, config, or service dependencies

  const successResult: Result<number, string> = ok(42);
  const errorResult: Result<number, string> = error("error message");

  // Verify that Result is a pure discriminated union
  assertExists(successResult);
  assertExists(errorResult);
  assertEquals("ok" in successResult, true);
  assertEquals("ok" in errorResult, true);

  // No file system operations
  assertEquals("readFile" in successResult, false);
  assertEquals("writeFile" in errorResult, false);

  // No configuration dependencies
  assertEquals("loadConfig" in successResult, false);
  assertEquals("saveConfig" in errorResult, false);

  // No external service calls
  assertEquals("fetch" in successResult, false);
  assertEquals("httpRequest" in errorResult, false);
});

Deno.test("0_architecture: Result type enforces Smart Constructor pattern through helper functions", () => {
  // Result type uses discriminated union with helper functions
  // No direct object construction should be used

  // Smart Constructor helpers provide the only safe way to create Results
  const success = ok("value");
  const failure = error(new Error("failed"));

  assertExists(success);
  assertExists(failure);
  assertEquals(success.ok, true);
  assertEquals(failure.ok, false);

  // Verify type structure
  if (success.ok) {
    assertEquals("data" in success, true);
    assertEquals("error" in success, false);
  }

  if (!failure.ok) {
    assertEquals("error" in failure, true);
    assertEquals("data" in failure, false);
  }
});

Deno.test("0_architecture: Result type implements Totality principle", () => {
  // Total functions: defined for all possible inputs
  // No exceptions, no null returns

  const testCases = [
    { value: 42, type: "number" },
    { value: "string", type: "string" },
    { value: true, type: "boolean" },
    { value: { complex: "object" }, type: "object" },
    { value: [1, 2, 3], type: "array" },
    { value: null, type: "null" },
    { value: undefined, type: "undefined" },
  ];

  for (const { value, type } of testCases) {
    // ok() should handle any value type
    const result = ok(value);
    assertExists(result);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, value);
    }
  }

  // error() should handle any error type
  const errorTypes = [
    "string error",
    new Error("Error object"),
    { code: "CUSTOM", message: "Custom error object" },
    42, // Even number as error
    null,
  ];

  for (const errorValue of errorTypes) {
    const result = error(errorValue);
    assertExists(result);
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error, errorValue);
    }
  }
});

Deno.test("0_architecture: Result type maintains discriminated union invariants", () => {
  // Verify mutual exclusivity of ok/error states
  const success: Result<string, Error> = ok("success");
  const failure: Result<string, Error> = error(new Error("failure"));

  // Success state should only have data
  if (success.ok) {
    assertExists(success.data);
    assertEquals("error" in success, false);
  }

  // Error state should only have error
  if (!failure.ok) {
    assertExists(failure.error);
    assertEquals("data" in failure, false);
  }

  // Type guard ensures exhaustive checking
  function exhaustiveCheck(result: Result<string, Error>): string {
    if (result.ok) {
      return result.data;
    } else {
      return result.error.message;
    }
    // No need for default case - TypeScript ensures exhaustiveness
  }

  assertEquals(exhaustiveCheck(success), "success");
  assertEquals(exhaustiveCheck(failure), "failure");
});

Deno.test("0_architecture: Result type supports type parameter variance", () => {
  // Result should work with any type parameters

  // Simple types
  const numberResult: Result<number, string> = ok(42);
  const stringResult: Result<string, Error> = ok("hello");
  const booleanResult: Result<boolean, { code: string }> = ok(true);

  assertExists(numberResult);
  assertExists(stringResult);
  assertExists(booleanResult);

  // Complex types
  interface User {
    id: number;
    name: string;
  }

  interface ValidationError {
    field: string;
    message: string;
  }

  const userResult: Result<User, ValidationError> = ok({ id: 1, name: "Alice" });
  const validationError: Result<User, ValidationError> = error({
    field: "name",
    message: "Name is required",
  });

  assertExists(userResult);
  assertExists(validationError);

  // Generic type preservation
  if (userResult.ok) {
    assertEquals(userResult.data.id, 1);
    assertEquals(userResult.data.name, "Alice");
  }

  if (!validationError.ok) {
    assertEquals(validationError.error.field, "name");
    assertEquals(validationError.error.message, "Name is required");
  }
});

Deno.test("0_architecture: Result type enables functional composition", () => {
  // Result type should support functional programming patterns

  type ParseResult = Result<number, string>;

  function parseNumber(input: string): ParseResult {
    const num = parseInt(input, 10);
    if (isNaN(num)) {
      return error(`Cannot parse "${input}" as number`);
    }
    return ok(num);
  }

  function double(n: number): number {
    return n * 2;
  }

  function safeDivide(n: number, divisor: number): Result<number, string> {
    if (divisor === 0) {
      return error("Division by zero");
    }
    return ok(n / divisor);
  }

  // Composable operations
  const input1 = parseNumber("42");
  assertExists(input1);

  const input2 = parseNumber("invalid");
  assertExists(input2);

  // Result enables safe error propagation
  assertEquals(input1.ok, true);
  assertEquals(input2.ok, false);
});

Deno.test("0_architecture: Result type maintains referential transparency", () => {
  // Same inputs should always produce same outputs

  const value = { data: "test" };
  const error1 = new Error("test error");

  // Multiple calls with same input
  const result1 = ok(value);
  const result2 = ok(value);
  const error1Result = error(error1);
  const error2Result = error(error1);

  // Results should be structurally equal
  assertEquals(result1.ok, result2.ok);
  if (result1.ok && result2.ok) {
    assertEquals(result1.data, result2.data);
  }

  assertEquals(error1Result.ok, error2Result.ok);
  if (!error1Result.ok && !error2Result.ok) {
    assertEquals(error1Result.error, error2Result.error);
  }
});

Deno.test("0_architecture: Result type provides type-safe error handling foundation", () => {
  // Result replaces exception-based error handling

  // Traditional approach would throw exceptions
  // Result approach makes errors explicit

  function riskyOperation(shouldFail: boolean): Result<string, Error> {
    if (shouldFail) {
      return error(new Error("Operation failed"));
    }
    return ok("Operation succeeded");
  }

  // All error paths are explicit and type-checked
  const success = riskyOperation(false);
  const failure = riskyOperation(true);

  // No try-catch needed
  if (success.ok) {
    assertEquals(success.data, "Operation succeeded");
  }

  if (!failure.ok) {
    assertEquals(failure.error.message, "Operation failed");
  }

  // Compiler ensures all cases are handled
  function handleResult(result: Result<string, Error>): string {
    if (result.ok) {
      return `Success: ${result.data}`;
    } else {
      return `Error: ${result.error.message}`;
    }
  }

  assertEquals(handleResult(success), "Success: Operation succeeded");
  assertEquals(handleResult(failure), "Error: Operation failed");
});
