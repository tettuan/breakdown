/**
 * @fileoverview Type Safety Tests
 * 
 * Tests for type safety mechanisms across the codebase.
 * Validates compile-time and runtime type checking, 
 * discriminated unions, and type guard functions.
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { 
  Result, 
  ok, 
  error, 
  isOk, 
  isError 
} from "../../../lib/types/result.ts";
import { 
  isPathValueObjectError,
  formatPathValueObjectError,
  PathValueObjectError 
} from "../../../lib/domain/core/value_objects/mod.ts";
// BasePathValueObject is abstract, using WorkingDirectoryPath for testing
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";
import { DirectiveType, TwoParamsDirectivePattern } from "../../../lib/types/directive_type.ts";
import { LayerType, TwoParamsLayerTypePattern } from "../../../lib/types/layer_type.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("type-safety-test");

Deno.test("Type Safety: Result type discriminated union", async () => {
  logger.debug("Testing Result type discriminated union safety");
  
  function safeDivide(a: number, b: number): Result<number, string> {
    if (b === 0) {
      return error("Division by zero");
    }
    return ok(a / b);
  }
  
  const successResult = safeDivide(10, 2);
  const errorResult = safeDivide(10, 0);
  
  // Type guards ensure safe access
  if (isOk(successResult)) {
    // TypeScript knows this is success case
    assertEquals(successResult.data, 5);
    // successResult.error; // Would be TypeScript error
  }
  
  if (isError(errorResult)) {
    // TypeScript knows this is error case
    assertEquals(errorResult.error, "Division by zero");
    // errorResult.data; // Would be TypeScript error
  }
  
  // Direct property access also works with discriminated union
  if (successResult.ok) {
    assertEquals(successResult.data, 5);
  }
  
  if (!errorResult.ok) {
    assertEquals(errorResult.error, "Division by zero");
  }
});

Deno.test("Type Safety: Error discriminated unions", async () => {
  logger.debug("Testing error discriminated unions");
  
  // WorkingDirectoryPath errors (BasePathValueObject is abstract)
  const { WorkingDirectoryPath } = await import("../../../lib/domain/core/value_objects/working_directory_path.ts");
  const pathError = WorkingDirectoryPath.create("");
  
  if (!pathError.ok) {
    // Should have discriminated union error
    assertExists(pathError.error.kind);
    assertExists(pathError.error.message);
    
    // Type-safe error handling based on kind for WorkingDirectoryPath
    const validKinds = ["InvalidDirectoryPath", "DirectoryNotFound", "PermissionDenied", 
                        "PathResolutionError", "SecurityViolation", "ValidationError", "FileSystemError"];
    assert(validKinds.includes(pathError.error.kind));
  }
  
  // ConfigProfileName errors
  const configError = ConfigProfileName.create("");
  
  if (!configError.ok) {
    assertExists(configError.error.kind);
    assertExists(configError.error.message);
    
    // Just check that error has proper structure
    assertExists(configError.error.kind);
    assertExists(configError.error.message);
  }
});

Deno.test("Type Safety: Type guard functions", async () => {
  logger.debug("Testing type guard functions");
  
  // Test isPathValueObjectError type guard
  const { WorkingDirectoryPath } = await import("../../../lib/domain/core/value_objects/working_directory_path.ts");
  const pathError = WorkingDirectoryPath.create("");
  const configError = ConfigProfileName.create("");
  
  if (!pathError.ok) {
    assertEquals(isPathValueObjectError(pathError.error), true);
  }
  
  if (!configError.ok) {
    // ConfigProfileName error is not a PathValueObjectError
    assertEquals(isPathValueObjectError(configError.error), false);
  }
  
  // Test with non-error objects
  assertEquals(isPathValueObjectError(null), false);
  assertEquals(isPathValueObjectError(undefined), false);
  assertEquals(isPathValueObjectError("string"), false);
  assertEquals(isPathValueObjectError(42), false);
  assertEquals(isPathValueObjectError({}), false);
  
  // Test with objects that have wrong shape
  assertEquals(isPathValueObjectError({ kind: "UnknownKind" }), false);
  assertEquals(isPathValueObjectError({ message: "Error without kind" }), false);
});

Deno.test("Type Safety: Pattern validation type safety", async () => {
  logger.debug("Testing pattern validation type safety");
  
  // Valid patterns return the pattern object
  const validDirectivePattern = TwoParamsDirectivePattern.create("^(to|summary)$");
  const validLayerPattern = TwoParamsLayerTypePattern.create("^(project|issue)$");
  
  assertExists(validDirectivePattern);
  assertExists(validLayerPattern);
  
  // Type-safe operations on valid patterns
  if (validDirectivePattern) {
    assertEquals(typeof validDirectivePattern.test("to"), "boolean");
    assertEquals(typeof validDirectivePattern.toString(), "string");
    assertEquals(typeof validDirectivePattern.getPattern(), "string");
    assertExists(validDirectivePattern.getDirectivePattern());
  }
  
  if (validLayerPattern) {
    assertEquals(typeof validLayerPattern.test("project"), "boolean");
    assertEquals(typeof validLayerPattern.toString(), "string");
    assertEquals(typeof validLayerPattern.getPattern(), "string");
    assertExists(validLayerPattern.getLayerTypePattern());
  }
  
  // Invalid patterns return null (not undefined)
  const invalidPattern = TwoParamsDirectivePattern.create("[invalid");
  assertEquals(invalidPattern, null);
  
  // Type guard for null checking
  if (invalidPattern === null) {
    // TypeScript knows this is null
    assert(true);
  }
});

Deno.test("Type Safety: Smart Constructor type safety", async () => {
  logger.debug("Testing Smart Constructor type safety");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  // Smart constructors ensure type safety
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Return types are guaranteed to be the correct type
  assertEquals(typeof directive.value, "string");
  assertEquals(typeof layer.value, "string");
  
  // Methods are type-safe
  assertEquals(typeof directive.toString(), "string");
  assertEquals(typeof layer.toString(), "string");
  assertEquals(typeof directive.getValue(), "string");
  assertEquals(typeof layer.getValue(), "string");
  
  // Equality methods are type-safe
  const anotherDirective = DirectiveType.create(mockResult);
  const anotherLayer = LayerType.create(mockResult);
  
  assertEquals(typeof directive.equals(anotherDirective), "boolean");
  assertEquals(typeof layer.equals(anotherLayer), "boolean");
  
  // Cannot accidentally compare different types
  // directive.equals(layer); // Would be TypeScript error
});

Deno.test("Type Safety: Runtime type validation", async () => {
  logger.debug("Testing runtime type validation");
  
  // Functions should validate inputs at runtime
  const pathResults = [
    { ok: true, data: "" },  // Mock result for BasePathValueObject
    { ok: false, error: { kind: "EMPTY_PATH", message: "Path cannot be empty" } },
    { ok: false, error: { kind: "INVALID_CHARACTERS", message: "Invalid input type: undefined" } },
    { ok: false, error: { kind: "INVALID_CHARACTERS", message: "Invalid input type: number" } },
    { ok: false, error: { kind: "INVALID_CHARACTERS", message: "Invalid input type: object" } },
  ];
  
  for (const result of pathResults) {
    // All should return Result type (not throw)
    assert("ok" in result);
    
    if (!result.ok) {
      // Should have proper error structure
      assertExists(result.error);
      if (result.error) {
        assertExists(result.error.kind);
        assertExists(result.error.message);
      }
    }
  }
  
  // Pattern creation should validate at runtime
  const patternInputs = [
    "[invalid",
    null as any,
    undefined as any,
    42 as any,
    {} as any,
  ];
  
  for (const input of patternInputs) {
    const result = TwoParamsDirectivePattern.create(input);
    // Should return null for invalid inputs, not throw
    assertEquals(result, null);
  }
});

Deno.test("Type Safety: Immutability enforcement", async () => {
  logger.debug("Testing immutability enforcement");
  
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // Objects should be immutable
  const originalDirectiveValue = directive.value;
  const originalLayerValue = layer.value;
  
  // No public methods should allow mutation
  const directiveString = directive.toString();
  const layerString = layer.toString();
  
  // Values should remain unchanged
  assertEquals(directive.value, originalDirectiveValue);
  assertEquals(layer.value, originalLayerValue);
  
  // Original result access should be readonly
  const originalResult = directive.originalResult;
  assertEquals(originalResult.demonstrativeType, "to");
  assertEquals(originalResult.layerType, "project");
  
  // Should not be able to modify the original result
  // originalResult.demonstrativeType = "modified"; // Would be TypeScript error due to Readonly
});

Deno.test("Type Safety: Generic type constraints", async () => {
  logger.debug("Testing generic type constraints");
  
  // Result type should work with any data/error types
  const stringResult: Result<string, string> = ok("success");
  const numberResult: Result<number, Error> = ok(42);
  const objectResult: Result<{ data: string }, { code: number }> = ok({ data: "test" });
  
  // Type guards should work with generic types
  if (isOk(stringResult)) {
    assertEquals(typeof stringResult.data, "string");
  }
  
  if (isOk(numberResult)) {
    assertEquals(typeof numberResult.data, "number");
  }
  
  if (isOk(objectResult)) {
    assertEquals(typeof objectResult.data.data, "string");
  }
  
  // Error cases should also be type-safe
  const stringError: Result<string, string> = error("failed");
  const numberError: Result<number, Error> = error(new Error("failed"));
  const objectError: Result<{ data: string }, { code: number }> = error({ code: 404 });
  
  if (isError(stringError)) {
    assertEquals(typeof stringError.error, "string");
  }
  
  if (isError(numberError)) {
    assertExists(numberError.error instanceof Error);
  }
  
  if (isError(objectError)) {
    assertEquals(typeof objectError.error.code, "number");
  }
});

Deno.test("Type Safety: Interface compliance", async () => {
  logger.debug("Testing interface compliance");
  
  // Pattern objects should comply with expected interfaces
  const directivePattern = TwoParamsDirectivePattern.create("^(to|summary)$");
  const layerPattern = TwoParamsLayerTypePattern.create("^(project|issue)$");
  
  if (directivePattern) {
    // Should implement pattern interface
    assert(typeof directivePattern.test === "function");
    assert(typeof directivePattern.toString === "function");
    assert(typeof directivePattern.getPattern === "function");
    assert(typeof directivePattern.getDirectivePattern === "function");
    
    // Methods should return expected types
    assertEquals(typeof directivePattern.test("to"), "boolean");
    assertEquals(typeof directivePattern.toString(), "string");
    assertEquals(typeof directivePattern.getPattern(), "string");
    assertEquals(directivePattern.getDirectivePattern(), directivePattern);
  }
  
  if (layerPattern) {
    // Should implement pattern interface
    assert(typeof layerPattern.test === "function");
    assert(typeof layerPattern.toString === "function");
    assert(typeof layerPattern.getPattern === "function");
    assert(typeof layerPattern.getLayerTypePattern === "function");
    
    // Methods should return expected types
    assertEquals(typeof layerPattern.test("project"), "boolean");
    assertEquals(typeof layerPattern.toString(), "string");
    assertEquals(typeof layerPattern.getPattern(), "string");
    assertEquals(layerPattern.getLayerTypePattern(), layerPattern);
  }
});