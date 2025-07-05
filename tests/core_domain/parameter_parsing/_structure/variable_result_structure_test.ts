/**
 * Structure tests for VariableResult
 *
 * Tests that verify the structural design and organization
 * of the Result type system and its helper functions.
 */

import { assertEquals } from "../../../lib/deps.ts";
import type { VariableResult, VariableError } from "$lib/types/variable_result.ts";
import * as VariableResultModule from "$lib/types/variable_result.ts";

Deno.test("VariableResult structure - module exports", () => {
  // Verify that the module exports all expected types and functions
  const _expectedExports = [
    "createSuccess",
    "createError",
    "createInvalidNameError",
    "createEmptyValueError",
    "createValidationFailedError",
  ];

  for (const exportName of _expectedExports) {
    assertEquals(
      typeof VariableResultModule[exportName as keyof typeof VariableResultModule],
      "function",
    );
  }
});

Deno.test("VariableResult structure - helper function consistency", () => {
  // All error creation helpers should return the same structure
  const testHelpers = [
    () => VariableResultModule.createInvalidNameError<string>("test", ["valid"]),
    () => VariableResultModule.createEmptyValueError<string>("var", "reason"),
    () => VariableResultModule.createValidationFailedError<string>("val", "constraint"),
  ];

  for (const helper of testHelpers) {
    const result = helper();
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(typeof result.error, "object");
      assertEquals(typeof result.error.kind, "string");
    }
  }
});

Deno.test("VariableResult structure - error type structure consistency", () => {
  // Each error type should have consistent structure
  const invalidNameResult = VariableResultModule.createInvalidNameError<string>("bad", ["good"]);
  const emptyValueResult = VariableResultModule.createEmptyValueError<string>("var", "empty");
  const validationResult = VariableResultModule.createValidationFailedError<string>(
    "val",
    "constraint",
  );

  // All should be error results
  assertEquals(invalidNameResult.ok, false);
  assertEquals(emptyValueResult.ok, false);
  assertEquals(validationResult.ok, false);

  // All should have kind property
  if (!invalidNameResult.ok) assertEquals(typeof invalidNameResult.error.kind, "string");
  if (!emptyValueResult.ok) assertEquals(typeof emptyValueResult.error.kind, "string");
  if (!validationResult.ok) assertEquals(typeof validationResult.error.kind, "string");

  // Each should have its specific properties
  if (!invalidNameResult.ok && invalidNameResult.error.kind === "InvalidName") {
    assertEquals(typeof invalidNameResult.error.name, "string");
    assertEquals(Array.isArray(invalidNameResult.error.validNames), true);
  }

  if (!emptyValueResult.ok && emptyValueResult.error.kind === "EmptyValue") {
    assertEquals(typeof emptyValueResult.error.variableName, "string");
    assertEquals(typeof emptyValueResult.error.reason, "string");
  }

  if (!validationResult.ok && validationResult.error.kind === "ValidationFailed") {
    assertEquals(typeof validationResult.error.value, "string");
    assertEquals(typeof validationResult.error.constraint, "string");
  }
});

Deno.test("VariableResult structure - success result consistency", () => {
  // Success results should have consistent structure
  const stringSuccess = VariableResultModule.createSuccess("test");
  const numberSuccess = VariableResultModule.createSuccess(42);
  const objectSuccess = VariableResultModule.createSuccess({ id: 1, name: "test" });

  // All should be success results
  assertEquals(stringSuccess.ok, true);
  assertEquals(numberSuccess.ok, true);
  assertEquals(objectSuccess.ok, true);

  // All should have data property with correct type
  if (stringSuccess.ok) assertEquals(typeof stringSuccess.data, "string");
  if (numberSuccess.ok) assertEquals(typeof numberSuccess.data, "number");
  if (objectSuccess.ok) assertEquals(typeof objectSuccess.data, "object");
});

Deno.test("VariableResult structure - no extra properties", () => {
  // Result objects should not have extra properties beyond the specification
  const successResult = VariableResultModule.createSuccess("test");
  const errorResult = VariableResultModule.createInvalidNameError<string>("bad", ["good"]);

  // Success result should only have 'ok' and 'data'
  const successKeys = Object.keys(successResult).sort();
  assertEquals(successKeys, ["data", "ok"]);

  // Error result should only have 'ok' and 'error'
  const errorKeys = Object.keys(errorResult).sort();
  assertEquals(errorKeys, ["error", "ok"]);
});

Deno.test("VariableResult structure - immutable error data", () => {
  // Error data should be structured to support immutability
  const result = VariableResultModule.createInvalidNameError<string>("test", ["a", "b", "c"]);

  if (!result.ok && result.error?.kind === "InvalidName") {
    // validNames should be readonly array
    const validNames = result.error.validNames;
    assertEquals(Array.isArray(validNames), true);
    assertEquals(validNames.length, 3);

    // Should be able to read but not modify (readonly in TypeScript)
    assertEquals(validNames[0], "a");
    assertEquals(validNames[1], "b");
    assertEquals(validNames[2], "c");
  }
});
