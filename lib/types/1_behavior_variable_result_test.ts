/**
 * Behavior test for variable_result.ts
 * Tests runtime behavior, error handling, and business logic
 *
 * This test verifies:
 * - Correct behavior of success/error creation
 * - Proper error discrimination
 * - Type guard functionality through runtime checks
 * - Edge cases and boundary conditions
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import {
  createEmptyValueError,
  createError,
  createInvalidNameError,
  createSuccess,
  createValidationFailedError,
  type VariableError,
  type VariableResult,
} from "./variable_result.ts";

Deno.test("Behavior: createSuccess creates valid success result", () => {
  const result = createSuccess("test data");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, "test data");
  }
});

Deno.test("Behavior: createSuccess handles different data types", () => {
  // String
  const stringResult = createSuccess("string");
  assertEquals(stringResult.ok, true);
  if (stringResult.ok) {
    assertEquals(stringResult.data, "string");
  }

  // Number
  const numberResult = createSuccess(123);
  assertEquals(numberResult.ok, true);
  if (numberResult.ok) {
    assertEquals(numberResult.data, 123);
  }

  // Object
  const objectResult = createSuccess({ key: "value" });
  assertEquals(objectResult.ok, true);
  if (objectResult.ok) {
    assertEquals(objectResult.data.key, "value");
  }

  // Array
  const arrayResult = createSuccess([1, 2, 3]);
  assertEquals(arrayResult.ok, true);
  if (arrayResult.ok) {
    assertEquals(arrayResult.data.length, 3);
  }

  // Null
  const nullResult = createSuccess(null);
  assertEquals(nullResult.ok, true);
  if (nullResult.ok) {
    assertEquals(nullResult.data, null);
  }

  // Undefined
  const undefinedResult = createSuccess(undefined);
  assertEquals(undefinedResult.ok, true);
  if (undefinedResult.ok) {
    assertEquals(undefinedResult.data, undefined);
  }
});

Deno.test("Behavior: createError creates valid error result", () => {
  const error: VariableError = {
    kind: "InvalidName",
    name: "test",
    validNames: ["valid1", "valid2"],
  };
  const result = createError(error);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error, error);
  }
});

Deno.test("Behavior: createInvalidNameError creates proper error", () => {
  const result = createInvalidNameError("invalid", ["valid1", "valid2"]);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidName");
    if (result.error.kind === "InvalidName") {
      assertEquals(result.error.name, "invalid");
      assertEquals(result.error.validNames, ["valid1", "valid2"]);
    }
  }
});

Deno.test("Behavior: createEmptyValueError creates proper error", () => {
  const result = createEmptyValueError("myVar", "Variable must not be empty");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyValue");
    if (result.error.kind === "EmptyValue") {
      assertEquals(result.error.variableName, "myVar");
      assertEquals(result.error.reason, "Variable must not be empty");
    }
  }
});

Deno.test("Behavior: createValidationFailedError creates proper error", () => {
  const result = createValidationFailedError("abc123", "Must be alphanumeric");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ValidationFailed");
    if (result.error.kind === "ValidationFailed") {
      assertEquals(result.error.value, "abc123");
      assertEquals(result.error.constraint, "Must be alphanumeric");
    }
  }
});

Deno.test("Behavior: Result type supports type narrowing", () => {
  const successResult: VariableResult<string> = createSuccess("data");
  const errorResult: VariableResult<string> = createInvalidNameError("test", []);

  // Success case narrowing
  if (successResult.ok) {
    // In this branch, TypeScript knows result has 'data' property
    const data: string = successResult.data;
    assertEquals(data, "data");
  } else {
    // This branch should not execute
    throw new Error("Should not reach here");
  }

  // Error case narrowing
  if (!errorResult.ok) {
    // In this branch, TypeScript knows result has 'error' property
    const error: VariableError = errorResult.error;
    assertEquals(error.kind, "InvalidName");
  } else {
    // This branch should not execute
    throw new Error("Should not reach here");
  }
});

Deno.test("Behavior: Error discrimination works correctly", () => {
  const errors: VariableResult<unknown>[] = [
    createInvalidNameError("test", ["valid"]),
    createEmptyValueError("var", "reason"),
    createValidationFailedError("val", "constraint"),
  ];

  errors.forEach((result) => {
    if (!result.ok) {
      switch (result.error.kind) {
        case "InvalidName":
          assertNotEquals(result.error.name, undefined);
          assertNotEquals(result.error.validNames, undefined);
          break;
        case "EmptyValue":
          assertNotEquals(result.error.variableName, undefined);
          assertNotEquals(result.error.reason, undefined);
          break;
        case "ValidationFailed":
          assertNotEquals(result.error.value, undefined);
          assertNotEquals(result.error.constraint, undefined);
          break;
        default: {
          // This ensures exhaustive checking
          const _exhaustive: never = result.error;
          throw new Error(`Unhandled error kind: ${_exhaustive}`);
        }
      }
    }
  });
});

Deno.test("Behavior: Empty arrays and strings are handled correctly", () => {
  // Empty array for validNames
  const emptyValidNames = createInvalidNameError("test", []);
  assertEquals(emptyValidNames.ok, false);
  if (!emptyValidNames.ok && emptyValidNames.error.kind === "InvalidName") {
    assertEquals(emptyValidNames.error.validNames.length, 0);
  }

  // Empty strings
  const emptyName = createInvalidNameError("", ["valid"]);
  assertEquals(emptyName.ok, false);
  if (!emptyName.ok && emptyName.error.kind === "InvalidName") {
    assertEquals(emptyName.error.name, "");
  }

  const emptyVarName = createEmptyValueError("", "reason");
  assertEquals(emptyVarName.ok, false);
  if (!emptyVarName.ok && emptyVarName.error.kind === "EmptyValue") {
    assertEquals(emptyVarName.error.variableName, "");
  }

  const emptyValue = createValidationFailedError("", "constraint");
  assertEquals(emptyValue.ok, false);
  if (!emptyValue.ok && emptyValue.error.kind === "ValidationFailed") {
    assertEquals(emptyValue.error.value, "");
  }
});

Deno.test("Behavior: Result immutability", () => {
  const data = { mutable: "value" };
  const result = createSuccess(data);
  const result2 = createSuccess(data);

  // Results should be different object instances
  assertEquals(result === result2, false, "Each call should create a new result object");

  // But they should contain the same data reference
  if (result.ok && result2.ok) {
    assertEquals(result.data === result2.data, true, "Data should be the same reference");
  }
});
