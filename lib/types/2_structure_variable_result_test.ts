/**
 * Structure test for variable_result.ts
 * Tests data structures, type safety, and structural integrity
 * 
 * This test verifies:
 * - Correct structure of Result types
 * - Proper structure of Error types
 * - Type parameter consistency
 * - Structural totality (all cases covered)
 */

import {
  assertEquals,
  assertExists,
} from "@std/assert";
import {
  createSuccess,
  createInvalidNameError,
  createEmptyValueError,
  createValidationFailedError,
  type VariableResult,
  type VariableError,
  type ExtendedTwoParams_Result,
} from "./variable_result.ts";

Deno.test("Structure: VariableResult has exactly two variants", () => {
  const success = createSuccess("data");
  const error = createInvalidNameError("name", []);
  
  // Success variant structure
  assertEquals(Object.keys(success).length, 2, "Success should have exactly 2 properties");
  assertExists(success.ok);
  assertExists((success as any).data);
  
  // Error variant structure
  assertEquals(Object.keys(error).length, 2, "Error should have exactly 2 properties");
  assertExists(error.ok);
  assertExists((error as any).error);
});

Deno.test("Structure: VariableError discriminated union completeness", () => {
  const errorCreators = [
    () => createInvalidNameError("name", ["valid"]),
    () => createEmptyValueError("var", "reason"),
    () => createValidationFailedError("val", "constraint"),
  ];
  
  const errorKinds = new Set<string>();
  
  errorCreators.forEach(createError => {
    const result = createError();
    if (!result.ok) {
      errorKinds.add(result.error.kind);
    }
  });
  
  // Verify all three error kinds are present
  assertEquals(errorKinds.size, 3, "Should have exactly 3 error kinds");
  assertEquals(errorKinds.has("InvalidName"), true);
  assertEquals(errorKinds.has("EmptyValue"), true);
  assertEquals(errorKinds.has("ValidationFailed"), true);
});

Deno.test("Structure: InvalidName error has correct properties", () => {
  const result = createInvalidNameError("testName", ["valid1", "valid2"]);
  
  if (!result.ok) {
    const error = result.error;
    assertEquals(Object.keys(error).sort(), ["kind", "name", "validNames"].sort());
    assertEquals(typeof error.kind, "string");
    if (error.kind === "InvalidName") {
      assertEquals(typeof error.name, "string");
      assertEquals(Array.isArray(error.validNames), true);
    }
  }
});

Deno.test("Structure: EmptyValue error has correct properties", () => {
  const result = createEmptyValueError("varName", "Cannot be empty");
  
  if (!result.ok) {
    const error = result.error;
    assertEquals(Object.keys(error).sort(), ["kind", "reason", "variableName"].sort());
    assertEquals(typeof error.kind, "string");
    if (error.kind === "EmptyValue") {
      assertEquals(typeof error.variableName, "string");
      assertEquals(typeof error.reason, "string");
    }
  }
});

Deno.test("Structure: ValidationFailed error has correct properties", () => {
  const result = createValidationFailedError("value123", "Must match pattern");
  
  if (!result.ok) {
    const error = result.error;
    assertEquals(Object.keys(error).sort(), ["constraint", "kind", "value"].sort());
    assertEquals(typeof error.kind, "string");
    if (error.kind === "ValidationFailed") {
      assertEquals(typeof error.value, "string");
      assertEquals(typeof error.constraint, "string");
    }
  }
});

Deno.test("Structure: ExtendedTwoParams_Result type structure", () => {
  const validExtendedResult: ExtendedTwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: {},
  };
  
  // Verify required properties
  assertEquals(validExtendedResult.type, "two");
  assertEquals(typeof validExtendedResult.demonstrativeType, "string");
  assertEquals(typeof validExtendedResult.layerType, "string");
  assertEquals(Array.isArray(validExtendedResult.params), true);
  assertEquals(validExtendedResult.params.length, 2);
  assertEquals(typeof validExtendedResult.options, "object");
  
  // Verify params tuple structure
  const [first, second] = validExtendedResult.params;
  assertEquals(typeof first, "string");
  assertEquals(typeof second, "string");
});

Deno.test("Structure: Result type maintains referential transparency", () => {
  const data = { key: "value" };
  const result1 = createSuccess(data);
  const result2 = createSuccess(data);
  
  // Both results should be new objects
  assertExists(result1);
  assertExists(result2);
  assertEquals(result1 === result2, false, "Results should be different objects");
  
  // But should contain the same data reference
  if (result1.ok && result2.ok) {
    assertEquals(result1.data === result2.data, true, "Data should be the same reference");
  }
});

Deno.test("Structure: Error objects are properly structured", () => {
  const errors: VariableError[] = [
    { kind: "InvalidName", name: "test", validNames: ["valid"] },
    { kind: "EmptyValue", variableName: "var", reason: "reason" },
    { kind: "ValidationFailed", value: "val", constraint: "constraint" },
  ];
  
  errors.forEach(error => {
    // Each error should have a 'kind' property
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");
    
    // Verify no extra properties
    const expectedPropCount = error.kind === "InvalidName" ? 3 :
                             error.kind === "EmptyValue" ? 3 :
                             error.kind === "ValidationFailed" ? 3 : 0;
    assertEquals(Object.keys(error).length, expectedPropCount);
  });
});

Deno.test("Structure: Generic type parameter preserves type information", () => {
  // Test with various types to ensure structure is maintained
  interface CustomType {
    id: number;
    name: string;
  }
  
  const customResult: VariableResult<CustomType> = createSuccess({ id: 1, name: "test" });
  
  if (customResult.ok) {
    // TypeScript should know the exact type here
    const data: CustomType = customResult.data;
    assertEquals(data.id, 1);
    assertEquals(data.name, "test");
  }
  
  // Error results should work with any type parameter
  const errorResult: VariableResult<CustomType> = createInvalidNameError("test", []);
  assertEquals(errorResult.ok, false);
});

Deno.test("Structure: Totality - all Result variants are handled", () => {
  function handleResult<T>(result: VariableResult<T>): string {
    // This function demonstrates exhaustive handling
    if (result.ok) {
      return "success";
    } else {
      return "error";
    }
    // No need for default case - TypeScript knows all cases are covered
  }
  
  assertEquals(handleResult(createSuccess("data")), "success");
  assertEquals(handleResult(createInvalidNameError("name", [])), "error");
});

Deno.test("Structure: Totality - all Error variants are handled", () => {
  function handleError(error: VariableError): string {
    switch (error.kind) {
      case "InvalidName":
        return `Invalid name: ${error.name}`;
      case "EmptyValue":
        return `Empty value: ${error.variableName}`;
      case "ValidationFailed":
        return `Validation failed: ${error.value}`;
      // TypeScript ensures exhaustiveness - no default needed
    }
  }
  
  const error1: VariableError = { kind: "InvalidName", name: "test", validNames: [] };
  const error2: VariableError = { kind: "EmptyValue", variableName: "var", reason: "empty" };
  const error3: VariableError = { kind: "ValidationFailed", value: "val", constraint: "pattern" };
  
  assertEquals(handleError(error1), "Invalid name: test");
  assertEquals(handleError(error2), "Empty value: var");
  assertEquals(handleError(error3), "Validation failed: val");
});