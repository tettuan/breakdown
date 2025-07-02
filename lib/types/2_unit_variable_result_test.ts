/**
 * Unit tests for VariableResult type and helper functions
 *
 * Tests the Result type design for type safety and functionality
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  createEmptyValueError,
  createError,
  createInvalidNameError,
  createSuccess,
  createValidationFailedError,
  type VariableError,
  type VariableResult as _VariableResult,
} from "./variable_result.ts";

// Test data type for testing
type TestData = { id: number; name: string };

Deno.test("VariableResult - createSuccess creates valid success result", () => {
  const testData: TestData = { id: 1, name: "test" };
  const _result = createSuccess(testData);

  assertEquals(_result.ok, true);
  if (_result.ok) {
    assertEquals(_result.data, testData);
  }
});

Deno.test("VariableResult - createError creates valid error result", () => {
  const error: VariableError = {
    kind: "InvalidName",
    name: "badName",
    validNames: ["goodName1", "goodName2"],
  };
  const _result = createError<TestData>(error);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error, error);
  }
});

Deno.test("VariableResult - createInvalidNameError creates proper error", () => {
  const _result = createInvalidNameError<TestData>("badName", ["valid1", "valid2"]);

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidName");
    if (_result.error.kind === "InvalidName") {
      assertEquals(_result.error.name, "badName");
      assertEquals(_result.error.validNames, ["valid1", "valid2"]);
    }
  }
});

Deno.test("VariableResult - createEmptyValueError creates proper error", () => {
  const _result = createEmptyValueError<TestData>("testVar", "Value cannot be empty");

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "EmptyValue");
    if (_result.error.kind === "EmptyValue") {
      assertEquals(_result.error.variableName, "testVar");
      assertEquals(_result.error.reason, "Value cannot be empty");
    }
  }
});

Deno.test("VariableResult - createValidationFailedError creates proper error", () => {
  const _result = createValidationFailedError<TestData>("invalid", "must be numeric");

  assertEquals(_result.ok, false);
  if (!_result.ok) {
    assertEquals(_result.error.kind, "ValidationFailed");
    if (_result.error.kind === "ValidationFailed") {
      assertEquals(_result.error.value, "invalid");
      assertEquals(_result.error.constraint, "must be numeric");
    }
  }
});

Deno.test("VariableResult - type safety with discriminated union", () => {
  // Test that we can properly discriminate between success and error
  const successResult = createSuccess({ id: 1, name: "test" });
  const errorResult = createInvalidNameError<TestData>("bad", ["good"]);

  // Type guards should work correctly
  if (successResult.ok) {
    // This should be TestData type
    assertExists(successResult.data.id);
    assertExists(successResult.data.name);
  }

  if (!errorResult.ok) {
    // This should be VariableError type
    assertExists(errorResult.error.kind);
    assertEquals(errorResult.error.kind, "InvalidName");
  }
});

Deno.test("VariableResult - error types are properly discriminated", () => {
  const invalidNameError = createInvalidNameError<string>("bad", ["good"]);
  const emptyValueError = createEmptyValueError<string>("var", "empty");
  const validationError = createValidationFailedError<string>("val", "constraint");

  // All should be error results
  assertEquals(invalidNameError.ok, false);
  assertEquals(emptyValueError.ok, false);
  assertEquals(validationError.ok, false);

  // Each should have correct error kind
  if (!invalidNameError.ok) {
    assertEquals(invalidNameError.error.kind, "InvalidName");
  }
  if (!emptyValueError.ok) {
    assertEquals(emptyValueError.error.kind, "EmptyValue");
  }
  if (!validationError.ok) {
    assertEquals(validationError.error.kind, "ValidationFailed");
  }
});

Deno.test("VariableResult - readonly validNames array", () => {
  const _result = createInvalidNameError<string>("test", ["a", "b", "c"]);

  if (!_result.ok && _result.error.kind === "InvalidName") {
    // validNames should be readonly
    assertEquals(_result.error.validNames.length, 3);
    assertEquals(_result.error.validNames[0], "a");
    assertEquals(_result.error.validNames[1], "b");
    assertEquals(_result.error.validNames[2], "c");
  }
});

Deno.test("VariableResult - generic type works with different data types", () => {
  // Test with string
  const stringResult = createSuccess("test string");
  assertEquals(stringResult.ok, true);
  if (stringResult.ok) {
    assertEquals(typeof stringResult.data, "string");
  }

  // Test with number
  const numberResult = createSuccess(42);
  assertEquals(numberResult.ok, true);
  if (numberResult.ok) {
    assertEquals(typeof numberResult.data, "number");
  }

  // Test with array
  const arrayResult = createSuccess([1, 2, 3]);
  assertEquals(arrayResult.ok, true);
  if (arrayResult.ok) {
    assertEquals(Array.isArray(arrayResult.data), true);
  }
});
