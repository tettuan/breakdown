/**
 * @fileoverview Totality Principle Tests
 * 
 * Tests that verify Totality principle compliance across the codebase.
 * Ensures that all functions are total (defined for all possible inputs)
 * and handle errors explicitly without throwing exceptions.
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { DirectiveType } from "../../../lib/types/directive_type.ts";
import { LayerType } from "../../../lib/types/layer_type.ts";
import { WorkingDirectoryPath } from "../../../lib/domain/core/value_objects/working_directory_path.ts";
import { ConfigProfileName } from "../../../lib/types/config_profile_name.ts";
import { Result, ok, error, isOk, isError } from "../../../lib/types/result.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";

const logger = new BreakdownLogger("totality-principle-test");

Deno.test("Totality: DirectiveType.create never throws", async () => {
  logger.debug("Testing DirectiveType.create never throws exceptions");
  
  // Valid input - should always succeed (Total Function)
  const validResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  // DirectiveType.create should never throw because it only accepts
  // pre-validated TwoParams_Result from BreakdownParams
  const directive = DirectiveType.create(validResult);
  
  assertExists(directive);
  assertEquals(directive.value, "to");
  
  // Test with different valid inputs
  const summaryResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "summary",
    layerType: "issue",
    options: {},
    params: ["summary", "issue"]
  };
  
  const summaryDirective = DirectiveType.create(summaryResult);
  assertEquals(summaryDirective.value, "summary");
});

Deno.test("Totality: LayerType.create never throws", async () => {
  logger.debug("Testing LayerType.create never throws exceptions");
  
  // Valid input - should always succeed (Total Function)
  const validResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  // LayerType.create should never throw because it only accepts
  // pre-validated TwoParams_Result from BreakdownParams
  const layer = LayerType.create(validResult);
  
  assertExists(layer);
  assertEquals(layer.value, "project");
  
  // Test with different valid inputs
  const taskResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    options: {},
    params: ["to", "task"]
  };
  
  const taskLayer = LayerType.create(taskResult);
  assertEquals(taskLayer.value, "task");
});

// BasePathValueObject is abstract, testing via WorkingDirectoryPath instead

Deno.test("Totality: WorkingDirectoryPath handles all inputs via Result", async () => {
  logger.debug("Testing WorkingDirectoryPath total function via Result");
  
  // Test valid inputs
  const validPath = WorkingDirectoryPath.create("/tmp");
  // May succeed or fail depending on system, but should never throw
  assert(validPath.ok === true || validPath.ok === false);
  
  // Test invalid inputs - should not throw, but return error
  const emptyPath = WorkingDirectoryPath.create("");
  assertEquals(emptyPath.ok, false);
  
  const invalidPath = WorkingDirectoryPath.create("/nonexistent/very/deeply/nested/path");
  assertEquals(invalidPath.ok, false);
  
  // Test edge cases
  const nullPath = WorkingDirectoryPath.create(null as any);
  assertEquals(nullPath.ok, false);
  
  const undefinedPath = WorkingDirectoryPath.create(undefined as any);
  assertEquals(undefinedPath.ok, false);
});

Deno.test("Totality: ConfigProfileName handles all inputs via Result", async () => {
  logger.debug("Testing ConfigProfileName total function via Result");
  
  // Test valid inputs
  const validName = ConfigProfileName.create("development");
  if (validName.ok) {
    assertEquals(validName.data.value, "development");
  }
  
  const anotherValidName = ConfigProfileName.create("production");
  if (anotherValidName.ok) {
    assertEquals(anotherValidName.data.value, "production");
  }
  
  // Test invalid inputs - should not throw, but return error
  const emptyName = ConfigProfileName.create("");
  assertEquals(emptyName.ok, false);
  
  const nullName = ConfigProfileName.create(null as any);
  assertEquals(nullName.ok, false);
  
  const undefinedName = ConfigProfileName.create(undefined as any);
  assertEquals(undefinedName.ok, false);
  
  // Test edge cases
  const spaceName = ConfigProfileName.create("   ");
  assertEquals(spaceName.ok, false);
  
  const specialCharsName = ConfigProfileName.create("dev@123!");
  // Result depends on validation rules, but should never throw
  assert(specialCharsName.ok === true || specialCharsName.ok === false);
});

Deno.test("Totality: Result type operations are total", async () => {
  logger.debug("Testing Result type operations totality");
  
  // All Result operations should handle any input without throwing
  const successResult = ok(42);
  const errorResult = error("test error");
  
  // isOk and isError should handle any Result
  assertEquals(isOk(successResult), true);
  assertEquals(isOk(errorResult), false);
  assertEquals(isError(successResult), false);
  assertEquals(isError(errorResult), true);
  
  // map should handle both success and error cases
  const { map } = await import("../../../lib/types/result.ts");
  
  const mappedSuccess = map(successResult, (x) => x * 2);
  assertEquals(mappedSuccess.ok, true);
  
  const mappedError = map(errorResult, (x: number) => x * 2);
  assertEquals(mappedError.ok, false);
  
  // chain should handle both success and error cases
  const { chain } = await import("../../../lib/types/result.ts");
  
  const chainedSuccess = chain(successResult, (x) => ok(x.toString()));
  assertEquals(chainedSuccess.ok, true);
  
  const chainedError = chain(errorResult, (x: number) => ok(x.toString()));
  assertEquals(chainedError.ok, false);
});

Deno.test("Totality: Pattern validation is total", async () => {
  logger.debug("Testing pattern validation totality");
  
  const { TwoParamsDirectivePattern } = await import("../../../lib/types/directive_type.ts");
  const { TwoParamsLayerTypePattern } = await import("../../../lib/types/layer_type.ts");
  
  // Valid patterns
  const validDirective = TwoParamsDirectivePattern.create("^(to|summary)$");
  assertExists(validDirective);
  
  const validLayer = TwoParamsLayerTypePattern.create("^(project|issue)$");
  assertExists(validLayer);
  
  // Invalid patterns - should return null, not throw
  const invalidDirective = TwoParamsDirectivePattern.create("[invalid");
  assertEquals(invalidDirective, null);
  
  const invalidLayer = TwoParamsLayerTypePattern.create("(incomplete");
  assertEquals(invalidLayer, null);
  
  // Edge cases
  const emptyPattern = TwoParamsDirectivePattern.create("");
  // Should handle gracefully (may be valid or invalid, but no exception)
  assert(emptyPattern !== undefined);
  
  const nullPattern = TwoParamsDirectivePattern.create(null as any);
  assertEquals(nullPattern, null);
  
  const undefinedPattern = TwoParamsDirectivePattern.create(undefined as any);
  assertEquals(undefinedPattern, null);
});

Deno.test("Totality: Error handling is comprehensive", async () => {
  logger.debug("Testing comprehensive error handling");
  
  // Test that all error cases are covered by discriminated unions
  const pathResult = WorkingDirectoryPath.create("");
  
  if (!pathResult.ok) {
    // Error should have a 'kind' property for discriminated union
    assertExists(pathResult.error.kind);
    assertExists(pathResult.error.message);
    
    // Should be one of the defined error kinds for WorkingDirectoryPath
    const validKinds = ["InvalidDirectoryPath", "DirectoryNotFound", "PermissionDenied", 
                        "PathResolutionError", "SecurityViolation", "ValidationError", "FileSystemError"];
    assert(validKinds.includes(pathResult.error.kind));
  }
  
  const configResult = ConfigProfileName.create("");
  
  if (!configResult.ok) {
    assertExists(configResult.error.kind);
    assertExists(configResult.error.message);
    
    // Should be one of the defined error kinds for ConfigProfileName
    assertExists(configResult.error.kind);
  }
});

Deno.test("Totality: No hidden exceptions in value object operations", async () => {
  logger.debug("Testing no hidden exceptions in value object operations");
  
  // Create valid objects
  const mockResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    params: ["to", "project"]
  };
  
  const directive = DirectiveType.create(mockResult);
  const layer = LayerType.create(mockResult);
  
  // All operations should be safe
  assertEquals(typeof directive.value, "string");
  assertEquals(typeof directive.toString(), "string");
  assertEquals(typeof directive.getValue(), "string");
  assertExists(directive.originalResult);
  
  assertEquals(typeof layer.value, "string");
  assertEquals(typeof layer.toString(), "string");
  assertEquals(typeof layer.getValue(), "string");
  assertEquals(typeof layer.getHierarchyLevel(), "number");
  assertEquals(typeof layer.isStandardHierarchy(), "boolean");
  assertExists(layer.originalResult);
  
  // Comparison operations should be safe
  const anotherDirective = DirectiveType.create(mockResult);
  const anotherLayer = LayerType.create(mockResult);
  
  assertEquals(typeof directive.equals(anotherDirective), "boolean");
  assertEquals(typeof layer.equals(anotherLayer), "boolean");
});

Deno.test("Totality: Factory functions handle edge cases", async () => {
  logger.debug("Testing factory functions handle edge cases");
  
  // Test boundary conditions and edge cases
  const extremeCases = [
    "", // Empty string
    " ".repeat(100), // Very long whitespace (reduced for test performance)
    "\n\t\r", // Special characters
    "../../dangerous/path", // Potentially dangerous path
    String.fromCharCode(0), // Null character
    "🚀💫✨", // Unicode characters
  ];
  
  for (const testCase of extremeCases) {
    // ConfigProfileName should handle all inputs gracefully
    const configResult = ConfigProfileName.create(testCase);
    assert(configResult.ok === true || configResult.ok === false);
    
    // WorkingDirectoryPath should handle all inputs gracefully
    const workingDirResult = WorkingDirectoryPath.create(testCase);
    assert(workingDirResult.ok === true || workingDirResult.ok === false);
  }
});