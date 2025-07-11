/**
 * Architecture test for variable_result.ts
 * Tests module boundaries, dependencies, and architectural constraints
 *
 * This test verifies:
 * - No external dependencies (self-contained module)
 * - Proper export structure
 * - Module isolation and encapsulation
 * - Totality principle adherence in type definitions
 */

import { assertEquals, assertExists } from "@std/assert";
import * as mod from "./variable_result.ts";

Deno.test("Architecture: Module exports all required types and functions", () => {
  // Check type exports (through type guards)
  assertExists(mod.createSuccess, "createSuccess should be exported");
  assertExists(mod.createError, "createError should be exported");
  assertExists(mod.createInvalidNameError, "createInvalidNameError should be exported");
  assertExists(mod.createEmptyValueError, "createEmptyValueError should be exported");
  assertExists(mod.createValidationFailedError, "createValidationFailedError should be exported");
});

Deno.test("Architecture: Module has no external dependencies", () => {
  // This module should be self-contained with no imports
  const moduleContent = Deno.readTextFileSync(
    new URL("./variable_result.ts", import.meta.url).pathname,
  );
  const hasImports = moduleContent.includes("import ");
  assertEquals(hasImports, false, "Module should have no external imports");
});

Deno.test("Architecture: Result type follows discriminated union pattern", () => {
  // Test success case structure
  const success = mod.createSuccess("test");
  assertEquals("ok" in success, true, "Success result must have 'ok' property");
  assertEquals(success.ok, true, "Success result ok must be true");
  assertEquals("data" in success, true, "Success result must have 'data' property");

  // Test error case structure
  const error = mod.createInvalidNameError("test", ["valid1", "valid2"]);
  assertEquals("ok" in error, true, "Error result must have 'ok' property");
  assertEquals(error.ok, false, "Error result ok must be false");
  assertEquals("error" in error, true, "Error result must have 'error' property");
});

Deno.test("Architecture: VariableError follows discriminated union with 'kind' field", () => {
  // Test each error type has proper kind discriminator
  const invalidName = mod.createInvalidNameError("test", ["valid"]);
  if (!invalidName.ok) {
    assertEquals(invalidName.error.kind, "InvalidName");
  }

  const emptyValue = mod.createEmptyValueError("varName", "reason");
  if (!emptyValue.ok) {
    assertEquals(emptyValue.error.kind, "EmptyValue");
  }

  const validationFailed = mod.createValidationFailedError("value", "constraint");
  if (!validationFailed.ok) {
    assertEquals(validationFailed.error.kind, "ValidationFailed");
  }
});

Deno.test("Architecture: All error constructors return consistent Result type", () => {
  // Verify type consistency across all error constructors
  const errors = [
    mod.createInvalidNameError("name", ["valid"]),
    mod.createEmptyValueError("var", "reason"),
    mod.createValidationFailedError("val", "constraint"),
  ];

  errors.forEach((error, index) => {
    assertEquals(error.ok, false, `Error ${index} should have ok: false`);
    if (!error.ok) {
      assertExists(error.error, `Error ${index} should have error property`);
      assertExists(error.error.kind, `Error ${index} should have error.kind`);
    }
  });
});

Deno.test("Architecture: Generic type parameter is properly propagated", () => {
  // Test with different types to ensure generics work correctly
  const stringResult = mod.createSuccess("string value");
  const numberResult = mod.createSuccess(42);
  const objectResult = mod.createSuccess({ key: "value" });
  const arrayResult = mod.createSuccess([1, 2, 3]);

  // All should have the same structure regardless of type
  assertEquals(stringResult.ok, true);
  assertEquals(numberResult.ok, true);
  assertEquals(objectResult.ok, true);
  assertEquals(arrayResult.ok, true);
});

Deno.test("Architecture: ExtendedTwoParams_Result follows expected structure", () => {
  // This is a type-level test, we can only verify through usage
  // Create a value that matches the expected type structure
  const extendedResult: mod.ExtendedTwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };

  assertEquals(extendedResult.type, "two");
  assertEquals(Array.isArray(extendedResult.params), true);
  assertEquals(extendedResult.params.length, 2);
  assertEquals(typeof extendedResult.options, "object");
});
