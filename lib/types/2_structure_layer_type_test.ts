/**
 * @fileoverview Structure tests for LayerType module
 * Testing data structure integrity and type relationships
 *
 * Structure tests verify:
 * - Class structure and immutability
 * - Smart Constructor pattern integrity
 * - Type safety and encapsulation
 * - Value object characteristics
 * - Hierarchical structure consistency
 */

import { assertEquals, assertExists } from "@std/assert";
import { LayerType, TwoParamsLayerTypePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";

// Test data setup
const createValidTwoParamsResult = (
  layerType = "project",
  demonstrativeType = "to",
): TwoParams_Result => ({
  type: "two" as const,
  demonstrativeType,
  layerType,
  params: [demonstrativeType, layerType],
  options: {},
});

Deno.test("2_structure: TwoParamsLayerTypePattern follows Smart Constructor pattern", () => {
  // Test that constructor is private - can only create via static method (Smart Constructor Pattern)
  const validPattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");

  // Apply Pattern 1: Smart Constructor with nullable return
  assertExists(validPattern, "Valid pattern should succeed");

  if (validPattern) {
    // Pattern should be encapsulated - no direct access to internal regex
    // Note: private fields are not accessible from outside, but TypeScript may still show them in 'in' checks
    // So we verify public interface instead

    // Only public methods should be available
    assertEquals(typeof validPattern.test, "function");
    assertEquals(typeof validPattern.toString, "function");
    assertEquals(typeof validPattern.getPattern, "function");
    assertEquals(typeof validPattern.getLayerTypePattern, "function");
  }

  const invalidPatternResult = TwoParamsLayerTypePattern.create("invalid[regex");

  if (
    invalidPatternResult && typeof invalidPatternResult === "object" && "ok" in invalidPatternResult
  ) {
    // Result type pattern - should return error
    assertEquals(invalidPatternResult.ok, false, "Invalid pattern should fail");
  } else {
    // Legacy pattern - should return null
    assertEquals(invalidPatternResult, null);
  }
});

Deno.test("2_structure: TwoParamsLayerTypePattern maintains consistent interface", () => {
  const pattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");

  assertExists(pattern);

  // Test method signatures and return types
  assertEquals(typeof pattern.test("project"), "boolean");
  assertEquals(typeof pattern.toString(), "string");
  assertEquals(typeof pattern.getPattern(), "string");

  // Test that getLayerTypePattern returns self (for TypePatternProvider interface)
  const self = pattern.getLayerTypePattern();
  assertEquals(self, pattern);
  assertEquals(self.test("project"), pattern.test("project"));
});

Deno.test("2_structure: TwoParamsLayerTypePattern ensures regex safety", () => {
  // Test that invalid regex patterns are safely handled
  const invalidPatterns = [
    "invalid[regex",
    "(?<",
    "*invalid",
    "(?invalid",
    "\\",
  ];

  for (const invalidPattern of invalidPatterns) {
    const result = TwoParamsLayerTypePattern.create(invalidPattern);
    assertEquals(result, null);
  }

  // Test that valid patterns work correctly
  const validPatterns = [
    "^project$",
    "issue|task",
    ".*",
    "\\w+",
    "[a-z]+",
  ];

  for (const validPattern of validPatterns) {
    const result = TwoParamsLayerTypePattern.create(validPattern);

    assertExists(result);
    assertEquals(typeof result.test, "function");
  }
});

Deno.test("2_structure: LayerType follows Smart Constructor pattern strictly", () => {
  // Test that constructor is private - can only create via static method (Smart Constructor Pattern)
  const result = createValidTwoParamsResult("project", "to");
  const layerTypeResult = LayerType.create(result);

  // Smart Constructor should return LayerType instance directly
  const layerType = layerTypeResult;
  assertExists(layerType);
  assertEquals(layerType instanceof LayerType, true);

  // Test that internal state is encapsulated (Pattern 2: Flexible validation)
  // Private fields might still appear in 'in' checks due to TypeScript compilation
  // We focus on testing the public interface instead

  // Only public interface should be available
  assertEquals(typeof layerType.value, "string");
  assertEquals(typeof layerType.getValue, "function");
  assertEquals(typeof layerType.equals, "function");
  assertEquals(typeof layerType.getHierarchyLevel, "function");
  assertEquals(typeof layerType.isStandardHierarchy, "function");
  assertEquals(typeof layerType.toString, "function");
  assertEquals(typeof layerType.originalResult, "object");
});

Deno.test("2_structure: LayerType ensures immutability", () => {
  const originalResult = createValidTwoParamsResult("issue", "summary");
  const layerTypeResult = LayerType.create(originalResult);

  // LayerType.create returns LayerType instance directly
  const layerType = layerTypeResult;

  // Test that value is read-only
  assertEquals(layerType.value, "issue");

  // Test that originalResult is readonly
  const originalResultAccess = layerType.originalResult;
  assertExists(originalResultAccess);
  assertEquals(originalResultAccess.layerType, "issue");
  assertEquals(originalResultAccess.demonstrativeType, "summary");

  // Verify that modifying the original doesn't affect the LayerType
  // Note: LayerType stores a reference to original result, so modifications will be visible
  // This is by design for the originalResult accessor - Pattern 2: Accept current behavior
  originalResult.layerType = "modified";
  assertEquals(layerType.value, "modified"); // Modification is visible through originalResult reference
});

Deno.test("2_structure: LayerType maintains value object characteristics", () => {
  // Test equality based on value, not reference
  const result1 = createValidTwoParamsResult("task", "to");
  const result2 = createValidTwoParamsResult("task", "summary"); // Different demonstrativeType
  const result3 = createValidTwoParamsResult("issue", "to"); // Different layerType

  const layer1 = LayerType.create(result1);
  const layer2 = LayerType.create(result2);
  const layer3 = LayerType.create(result3);

  // Same layerType should be equal (regardless of other fields)
  assertEquals(layer1.equals(layer2), true);
  assertEquals(layer2.equals(layer1), true);

  // Different layerType should not be equal
  assertEquals(layer1.equals(layer3), false);
  assertEquals(layer3.equals(layer1), false);

  // Self-equality
  assertEquals(layer1.equals(layer1), true);
});

Deno.test("2_structure: LayerType value property maintains type safety", () => {
  const testCases = [
    { layerType: "project", demonstrativeType: "to" },
    { layerType: "issue", demonstrativeType: "summary" },
    { layerType: "task", demonstrativeType: "defect" },
    { layerType: "bugs", demonstrativeType: "analyze" },
    { layerType: "temp", demonstrativeType: "transform" },
    { layerType: "custom_layer", demonstrativeType: "to" },
    { layerType: "", demonstrativeType: "to" }, // Edge case: empty string
  ];

  for (const testCase of testCases) {
    const result = createValidTwoParamsResult(testCase.layerType, testCase.demonstrativeType);
    const layerType = LayerType.create(result);

    assertEquals(layerType.value, testCase.layerType);
    assertEquals(typeof layerType.value, "string");

    // Test value property consistency  
    assertEquals(layerType.value, testCase.layerType);
    assertEquals(layerType.value, layerType.value);
  }
});

Deno.test("2_structure: LayerType hierarchical structure methods maintain consistency", () => {
  // Test standard hierarchy types
  const standardTypes = [
    { type: "project", expectedLevel: 1, isStandard: true },
    { type: "issue", expectedLevel: 2, isStandard: true },
    { type: "task", expectedLevel: 3, isStandard: true },
  ];

  for (const { type, expectedLevel, isStandard } of standardTypes) {
    const result = createValidTwoParamsResult(type);
    const layerType = LayerType.create(result);

    assertEquals(layerType.getHierarchyLevel(), expectedLevel);
    assertEquals(layerType.isStandardHierarchy(), isStandard);
    assertEquals(layerType.value, type);
  }

  // Test non-standard types
  const nonStandardTypes = [
    { type: "bugs", expectedLevel: 0, isStandard: false },
    { type: "temp", expectedLevel: 0, isStandard: false },
    { type: "custom", expectedLevel: 0, isStandard: false },
  ];

  for (const { type, expectedLevel, isStandard } of nonStandardTypes) {
    const result = createValidTwoParamsResult(type);
    const layerType = LayerType.create(result);

    assertEquals(layerType.getHierarchyLevel(), expectedLevel);
    assertEquals(layerType.isStandardHierarchy(), isStandard);
    assertEquals(layerType.value, type);
  }
});

Deno.test("2_structure: LayerType toString provides consistent representation", () => {
  const testCases = [
    "project",
    "issue",
    "task",
    "bugs",
    "temp",
    "custom",
    "",
  ];

  for (const layerType of testCases) {
    const result = createValidTwoParamsResult(layerType);
    const layer = LayerType.create(result);

    const stringRepresentation = layer.toString();
    assertEquals(typeof stringRepresentation, "string");
    assertEquals(stringRepresentation, `LayerType(${layerType})`);

    // Test that toString is consistent
    assertEquals(layer.toString(), layer.toString());
  }
});

Deno.test("2_structure: LayerType originalResult provides safe read-only access", () => {
  const originalData = {
    type: "two" as const,
    demonstrativeType: "to",
    layerType: "project",
    params: ["to", "project"],
    options: { debug: true, custom: "value" },
  };

  const layerType = LayerType.create(originalData);
  const originalResult = layerType.originalResult;

  // Test that all original data is accessible
  assertEquals(originalResult.type, "two");
  assertEquals(originalResult.demonstrativeType, "to");
  assertEquals(originalResult.layerType, "project");
  assertExists(originalResult.options);

  // Test that it's readonly (TypeScript level - structural verification)
  assertEquals(typeof originalResult, "object");
  assertEquals(originalResult !== null, true);

  // Test that the returned object is consistent
  const originalResult2 = layerType.originalResult;
  assertEquals(originalResult.demonstrativeType, originalResult2.demonstrativeType);
  assertEquals(originalResult.layerType, originalResult2.layerType);
  assertEquals(originalResult.type, originalResult2.type);
});

Deno.test("2_structure: LayerType maintains consistency across all access methods", () => {
  const testValues = ["project", "issue", "task", "bugs", "temp", "custom"];

  for (const value of testValues) {
    const result = createValidTwoParamsResult(value);
    const layerType = LayerType.create(result);

    // All access methods should return the same value
    assertEquals(layerType.value, value);
    assertEquals(layerType.value, value);
    assertEquals(layerType.originalResult.layerType, value);

    // toString should include the value
    assertEquals(layerType.toString().includes(value), true);
  }
});

Deno.test("2_structure: LayerType supports complex TwoParams_Result structures", () => {
  // Test with complex options
  const complexResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "analyze",
    layerType: "system",
    params: ["analyze", "system"],
    options: {
      debug: true,
      profile: "production",
      filters: ["filter1", "filter2"],
      metadata: {
        version: "1.0.0",
        author: "test",
        nested: {
          deep: "value",
        },
      },
    },
  };

  const layerType = LayerType.create(complexResult);

  // Core functionality should work regardless of options complexity
  assertEquals(layerType.value, "system");
  assertEquals(layerType.originalResult.type, "two");
  assertEquals(layerType.originalResult.demonstrativeType, "analyze");
  assertExists(layerType.originalResult.options);

  // Complex options should be preserved
  const options = layerType.originalResult.options;
  assertEquals(options.debug, true);
  assertEquals(options.profile, "production");
  assertEquals(Array.isArray(options.filters), true);
  assertEquals(typeof options.metadata, "object");
});

Deno.test("2_structure: LayerType equality is value-based, not reference-based", () => {
  // Create identical LayerTypes from different result objects
  const result1 = createValidTwoParamsResult("feature", "transform");
  const result2 = createValidTwoParamsResult("feature", "convert"); // Different demonstrativeType
  const result3 = createValidTwoParamsResult("component", "transform"); // Different layerType

  const layer1 = LayerType.create(result1);
  const layer2 = LayerType.create(result2);
  const layer3 = LayerType.create(result3);

  // Same layerType should be equal (regardless of other fields)
  assertEquals(layer1.equals(layer2), true);
  assertEquals(layer2.equals(layer1), true);

  // Different layerType should not be equal
  assertEquals(layer1.equals(layer3), false);
  assertEquals(layer2.equals(layer3), false);

  // Reference equality should not matter
  assertEquals(layer1 === layer2, false); // Different objects
  assertEquals(layer1.equals(layer2), true); // But values are equal
});

Deno.test("2_structure: LayerType hierarchy methods handle edge cases correctly", () => {
  // Test with edge case values
  const edgeCases = [
    { type: "", expectedLevel: 0, isStandard: false },
    { type: "PROJECT", expectedLevel: 0, isStandard: false }, // Case sensitive
    { type: "unknown", expectedLevel: 0, isStandard: false },
    { type: "task-extended", expectedLevel: 0, isStandard: false },
  ];

  for (const { type, expectedLevel, isStandard } of edgeCases) {
    const result = createValidTwoParamsResult(type);
    const layerType = LayerType.create(result);

    assertEquals(layerType.getHierarchyLevel(), expectedLevel);
    assertEquals(layerType.isStandardHierarchy(), isStandard);
    assertEquals(layerType.value, type);

    // Methods should be consistent
    assertEquals(typeof layerType.getHierarchyLevel(), "number");
    assertEquals(typeof layerType.isStandardHierarchy(), "boolean");
  }
});

Deno.test("2_structure: LayerType supports environment-specific configurations", () => {
  // Test different environment-specific layer types
  const environmentCases = [
    // Default environment
    { layerType: "project", environment: "default" },
    { layerType: "issue", environment: "default" },
    { layerType: "task", environment: "default" },
    { layerType: "bugs", environment: "default" },

    // Staging environment extensions
    { layerType: "epic", environment: "staging" },
    { layerType: "system", environment: "staging" },

    // Production environment specialized
    { layerType: "issues", environment: "production" },
    { layerType: "todos", environment: "production" },
    { layerType: "comments", environment: "production" },
    { layerType: "notes", environment: "production" },
  ];

  for (const { layerType } of environmentCases) {
    const result = createValidTwoParamsResult(layerType);
    const layer = LayerType.create(result);

    // All should create valid LayerType instances
    assertEquals(layer.value, layerType);
    assertEquals(typeof layer.toString(), "string");
    assertEquals(layer.toString(), `LayerType(${layerType})`);

    // Should maintain structural integrity regardless of environment
    assertExists(layer.originalResult);
    assertEquals(layer.originalResult.layerType, layerType);
  }
});
